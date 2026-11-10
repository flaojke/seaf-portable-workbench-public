import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { encodePlantUml, decodePlantUml, createOfflineServer, renderPlantUml } from './offline.mjs';
import { safeArchivePath, extractArchive, prepareOfflineAssets, sha256 } from './offline-assets.mjs';
const require = createRequire(new URL('../seaf-mcp/package.json', import.meta.url));
const { zipSync } = require('fflate');
const here = path.dirname(fileURLToPath(import.meta.url));

test('PlantUML matches the portal deflate/6-bit transport and bounds decompression', () => {
  const source = '@startuml\nAlice -> Bob: Заказ ShopFlow\n@enduml';
  assert.equal(decodePlantUml(encodePlantUml(source)), source);
  for (const invalid of ['../../x','~hABC','x','!!!!','A'.repeat(65540)]) assert.throws(() => decodePlantUml(invalid));
  assert.throws(() => decodePlantUml(encodePlantUml('A'.repeat(300000))));
});

test('Offline archives cannot escape their destination', async () => {
  for (const unsafe of ['../outside','a/../outside','C:/outside','/outside','a\\outside','a/./b','a\0b']) assert.throws(() => safeArchivePath(unsafe));
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'seaf-offline-extract-'));
  try {
    await assert.rejects(extractArchive(zipSync({ '../outside':Buffer.from('bad') }), root));
    await extractArchive(zipSync({ 'bundle/legal/LICENSE':Buffer.from('upstream notice') }), root, { stripFirst:true });
    assert.equal(await fs.readFile(path.join(root,'legal/LICENSE'),'utf8'),'upstream notice');
  } finally { await fs.rm(root,{ recursive:true,force:true }); }
});

test('Offline HTTP serves static files, confines paths, limits origins and uses the renderer cache', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'seaf-offline-http-'));
  await fs.mkdir(path.join(root,'drawio/js'),{recursive:true}); await fs.mkdir(path.join(root,'jre/bin'),{recursive:true}); await fs.mkdir(path.join(root,'plantuml'),{recursive:true});
  await fs.writeFile(path.join(root,'drawio/index.html'),'<html>offline</html>'); await fs.writeFile(path.join(root,'drawio/js/PreConfig.js'),'// upstream config');
  await fs.writeFile(path.join(root,'jre/bin/java.exe'),'fixture'); await fs.writeFile(path.join(root,'plantuml/plantuml.jar'),'fixture');
  let calls = 0;
  const service = await createOfflineServer({port:0,assetsRoot:root,renderer:async source => {++calls; assert.match(source,/Alice/); return '<svg><text>Alice</text></svg>';}});
  try {
    assert.equal((await (await fetch(service.url+'/health')).json()).networkRequired,false);
    const config=await (await fetch(service.url+'/js/PreConfig.js')).text(); assert.match(config,/offline.*1/); assert.match(config,/PROXY_URL=null/);
    const response=await fetch(service.url); assert.match(response.headers.get('content-security-policy'),/connect-src 'self'/);
    for(const p of ['/WEB-INF/web.xml','/%2e%2e%5csecret','/plantuml/svg/!!!!']) assert.ok((await fetch(service.url+p)).status>=400);
    assert.equal((await fetch(service.url,{method:'POST'})).status,405);
    assert.equal((await fetch(service.url,{headers:{Origin:'https://example.com'}})).status,403);
    const endpoint=service.url+'/plantuml/svg/'+encodePlantUml('@startuml\nAlice -> Bob\n@enduml');
    const preflight=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:'http://127.0.0.1:8080','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'rquid'}});
    assert.equal(preflight.status,204);
    assert.equal(preflight.headers.get('access-control-allow-origin'),'http://127.0.0.1:8080');
    assert.match(preflight.headers.get('access-control-allow-headers'),/(^|,\s*)rquid(,|$)/i);
    assert.equal(preflight.headers.get('access-control-allow-credentials'),null);
    assert.doesNotMatch(preflight.headers.get('access-control-allow-headers'),/authorization|\*/i);
    const forbiddenPreflight=await fetch(endpoint,{method:'OPTIONS',headers:{Origin:'https://example.com','Access-Control-Request-Method':'GET','Access-Control-Request-Headers':'rquid'}});
    assert.equal(forbiddenPreflight.status,403);
    assert.equal(forbiddenPreflight.headers.get('access-control-allow-origin'),null);
    for(let i=0;i<2;++i) {const res=await fetch(endpoint,{headers:{Origin:'http://localhost:8080'}}); assert.equal(res.status,200); assert.equal(res.headers.get('access-control-allow-origin'),'http://localhost:8080');}
    assert.equal(calls,1);
    const status=await new Promise((resolve,reject)=>{ const req=http.get(service.url,{headers:{Host:'attacker.test'}},res=>{res.resume();resolve(res.statusCode);});req.on('error',reject);});
    assert.equal(status,403);
  } finally {await service.stop();await fs.rm(root,{recursive:true,force:true});}
});

test('Bundled Windows Java renders real sequence/component diagrams and blocks external includes', {skip:process.env.SEAF_OFFLINE_REAL!=='1',timeout:90000}, async () => {
  const assetsRoot=process.env.SEAF_OFFLINE_ASSETS||path.join(here,'state/offline');
  const manifest=JSON.parse(await fs.readFile(path.join(assetsRoot,'manifest.json'),'utf8'));
  for(const file of manifest.files)assert.equal(sha256(await fs.readFile(path.join(assetsRoot,safeArchivePath(file.path)))),file.sha256,'Asset digest: '+file.path);
  for(const license of ['licenses/drawio-LICENSE.txt','licenses/plantuml/LICENSE.txt','licenses/plantuml/LICENSES.md','licenses/graphviz-LICENSE.txt','jre/NOTICE'])assert.ok(manifest.files.some(f=>f.path===license),'Missing distribution notice '+license);
  const service=await createOfflineServer({port:0,assetsRoot});
  let requests=0;
  const trap=http.createServer((req,res)=>{++requests;res.end('SEAF_REMOTE_INCLUDE_MUST_NOT_APPEAR');});
  await new Promise(resolve=>trap.listen(0,'127.0.0.1',resolve));
  try {
    for(const source of ['@startuml\nactor Customer\nCustomer -> Order: checkout\nOrder -> Delivery: paid order\nDelivery --> Order: tracking ID\n@enduml','@startuml\ncomponent "Order Service" as Order\ncomponent "Delivery Service" as Delivery\nOrder --> Delivery : dispatch\n@enduml']) {
      const response=await fetch(service.url+'/plantuml/svg/'+encodePlantUml(source));
      const body=await response.text();assert.equal(response.status,200,body);assert.match(body,/<svg/);assert.match(body,/Delivery/);
    }
    const included='@startuml\n!includeurl http://127.0.0.1:'+trap.address().port+'/include\nAlice -> Bob\n@enduml';
    const response=await fetch(service.url+'/plantuml/svg/'+encodePlantUml(included)); const body=await response.text();
    assert.doesNotMatch(body,/SEAF_REMOTE_INCLUDE_MUST_NOT_APPEAR/);assert.equal(requests,0);
    await assert.rejects(renderPlantUml('@startuml\nAlice -> Bob\n@enduml',{java:path.join(assetsRoot,'jre/bin/java.exe'),plantumlJar:path.join(assetsRoot,'plantuml/plantuml.jar'),timeoutMs:1}),/timed out/);
  } finally {await service.stop();await new Promise(resolve=>trap.close(resolve));}
});

test('Pinned offline inputs reject tampering without attempting a download', async () => {
  const root=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-offline-digest-'));
  try {await fs.writeFile(path.join(root,'drawio-LICENSE-31.5.3.txt'),'tampered');await assert.rejects(prepareOfflineAssets({cacheRoot:root,destination:path.join(root,'out'),allowDownload:false}),/SHA-256 mismatch/);}
  finally {await fs.rm(root,{recursive:true,force:true});}
});

test('Real offline browser edits and saves draw.io XML with all non-loopback requests blocked', {skip:process.env.SEAF_OFFLINE_BROWSER!=='1',timeout:90000}, async () => {
  const {chromium}=require(process.env.SEAF_PLAYWRIGHT || 'playwright');
  const output=path.join(here,'state/offline-browser');await fs.mkdir(output,{recursive:true});
  const assetsRoot=process.env.SEAF_OFFLINE_ASSETS||path.join(here,'state/offline');
  const service=await createOfflineServer({port:0,assetsRoot});
  const xml='<mxfile><diagram name="ShopFlow"><mxGraphModel dx="900" dy="600"><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="order" value="Order Service" style="rounded=1;whiteSpace=wrap;html=1" vertex="1" parent="1"><mxGeometry x="60" y="80" width="150" height="70" as="geometry"/></mxCell><mxCell id="delivery" value="Delivery Service" style="rounded=1;whiteSpace=wrap;html=1" vertex="1" parent="1"><mxGeometry x="320" y="80" width="150" height="70" as="geometry"/></mxCell><mxCell id="flow" edge="1" parent="1" source="order" target="delivery"><mxGeometry relative="1" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
  const parent=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(`<html><body><iframe id="editor" style="width:98vw;height:90vh;border:0" src="${service.url}/?embed=1&proto=json&offline=1&lang=en&spin=1"></iframe><script>window.editorEvents=[];window.savedXML=null;addEventListener('message',e=>{if(e.origin!==${JSON.stringify(service.url)}||e.source!==document.querySelector('#editor').contentWindow)return;try{const m=JSON.parse(e.data);editorEvents.push(m.event);if(m.event==='init')e.source.postMessage(JSON.stringify({action:'load',xml:${JSON.stringify(xml)},autosave:0}),e.origin);if(m.event==='save')window.savedXML=m.xml;}catch{}});</script></body></html>`);});
  await new Promise(resolve=>parent.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,...(process.env.SEAF_CHROME_EXECUTABLE?{executablePath:process.env.SEAF_CHROME_EXECUTABLE}:{})});
  const context=await browser.newContext({viewport:{width:1440,height:1000}}),external=[],errors=[],requests=[];
  await context.route('**/*',async route=>{const u=new URL(route.request().url());requests.push(u.href);if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol)){external.push(u.href);await route.abort();}else await route.continue();});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
  let status='failed';
  try {
    await page.goto('http://127.0.0.1:'+parent.address().port,{waitUntil:'domcontentloaded'});
    const frame=page.frameLocator('#editor');await frame.locator('.geMenubarContainer').waitFor({timeout:40000});
    const shape=frame.getByText('Delivery Service',{exact:true}).first();await shape.waitFor({timeout:20000});
    const bounds=await shape.boundingBox();assert.ok(bounds);await page.mouse.move(bounds.x+bounds.width/2,bounds.y+bounds.height/2);await page.mouse.down();await page.mouse.move(bounds.x+bounds.width/2+60,bounds.y+bounds.height/2+40,{steps:10});await page.mouse.up();
    const save=frame.getByRole('button',{name:'Save',exact:true});if(await save.count())await save.click();else{await frame.getByText('File',{exact:true}).first().click();await frame.locator('.mxPopupMenu:visible').getByText('Save',{exact:true}).click();}
    await page.waitForFunction(()=>typeof window.savedXML==='string',{timeout:10000});const saved=await page.evaluate(()=>window.savedXML);
    assert.match(saved,/Delivery Service/);assert.notEqual(saved,xml);assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
    const rendered=await fetch(service.url+'/plantuml/svg/'+encodePlantUml('@startuml\nOrder -> Delivery: dispatch\nDelivery --> Order: tracking\n@enduml'));assert.equal(rendered.status,200);assert.match(await rendered.text(),/tracking/);
    await fs.writeFile(path.join(output,'saved.drawio'),saved);await page.screenshot({path:path.join(output,'editor.png'),fullPage:true});status='passed';
  } finally {
    await fs.writeFile(path.join(output,'result.json'),JSON.stringify({status,externalRequests:external,pageErrors:errors,localRequests:requests.length,loopbackOnly:true,drawioEditSave:true,plantumlSvg:true},null,2));
    await fs.writeFile(path.join(output,'body.txt'),await page.locator('body').innerText().catch(()=>''));
    await browser.close();await service.stop();await new Promise(resolve=>parent.close(resolve));
  }
});
