import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import os from 'node:os';
import {Engine} from '../../engine.mjs';
import {createWorkbenchServer} from '../server.mjs';
import {createRequire} from 'node:module';
import {unzipSync,strFromU8} from 'fflate';
import {stackView,renderStack,stackAction} from '../stack-views.mjs';
const require=createRequire(import.meta.url),{chromium}=require(path.resolve(path.dirname(process.execPath),'../node_modules/playwright'));
const source=await fs.readFile(new URL('../public/stack-views.js',import.meta.url),'utf8');
const model={components:{a:{title:'Orders',links:[{id:'b',title:'Requests'}]},b:{title:'Delivery'}},contexts:{}};
const wb={model:async()=>({model,head:'r1',fingerprint:'base'})};const response={...await stackAction(wb,'p',{op:'stack_view'}),fingerprint:'base',revision:'r1',operations:[]};
const styles=await fs.readFile(new URL('../public/style.css',import.meta.url),'utf8');
const html=`<link rel="stylesheet" href="/style.css"><main id="main"></main><script type="module">
import {stackPanel,bindStackPanel} from '/stack.js';
window.state={model:${JSON.stringify(model)},project:'p',view:'stack'};
window.calls=[];window.pending=[];window.response=${JSON.stringify(response)};
const esc=x=>String(x??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
window.mount=()=>{document.querySelector('#main').innerHTML=stackPanel(state,esc);bindStackPanel(state,(action,args)=>{calls.push({action,args});if(action==='stack_export')return fetch('/export',{method:'POST',body:JSON.stringify(args)}).then(r=>r.json());return new Promise(resolve=>pending.push(resolve));},esc,(section,id)=>window.opened={section,id});};
window.finish=()=>pending.shift()(structuredClone(response));mount();window.ready=true;
</script>`;
const server=http.createServer(async(req,res)=>{if(req.url==='/style.css'){res.setHeader('Content-Type','text/css');res.end(styles);return;}if(req.url==='/export'){let body='';for await(const chunk of req)body+=chunk;try{res.end(JSON.stringify(await stackAction(wb,'p',{...JSON.parse(body),op:'stack_export'})));}catch(e){res.statusCode=400;res.end(JSON.stringify({error:e.message}));}return;}res.setHeader('Content-Type',req.url==='/stack.js'?'text/javascript':'text/html');res.end(req.url==='/stack.js'?source:html);});
await new Promise(r=>server.listen(0,'127.0.0.1',r));let browser;const checks=[];
try{
 browser=await chromium.launch({headless:true,channel:process.env.SEAF_TEST_BROWSER_CHANNEL||'msedge'});const page=await browser.newPage({viewport:{width:1400,height:1000}});const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:'+server.address().port);await page.waitForFunction(()=>window.ready);
 await page.click('#stack-render');await page.evaluate(()=>{state.project='other';finish();});await page.waitForTimeout(50);assert.equal(await page.locator('#stack-chart svg').count(),0);checks.push('project switch discards in-flight render');
 await page.evaluate(()=>{state.project='p';mount();});await page.fill('#stack-text','component c | Old');await page.click('#stack-preview');await page.fill('#stack-text','component c | New');await page.evaluate(()=>finish());await page.waitForTimeout(50);assert.ok(await page.isDisabled('#stack-stage'));checks.push('edited description discards stale preview');
 await page.click('#stack-preview');await page.evaluate(()=>finish());await page.waitForFunction(()=>!document.querySelector('#stack-stage').disabled);await page.evaluate(()=>{document.querySelector('#stack-stage').click();document.querySelector('#stack-stage').click();});assert.equal(await page.evaluate(()=>calls.filter(c=>c.action==='stack_stage').length),1);checks.push('repeated stage click sends only one request');assert.equal(await page.evaluate(()=>calls.at(-1).args.text),'component c | New');assert.equal(await page.evaluate(()=>calls.at(-1).args.project),'p');await page.evaluate(()=>{response={id:'draft-1'};finish();});checks.push('staging uses reviewed text and captured project');
 await page.evaluate(r=>{response=r;mount();},response);await page.click('#stack-render');await page.evaluate(()=>finish());await page.waitForSelector('#stack-chart svg');await page.locator('#stack-inventory summary').click();await page.locator('[data-stack-object="a"]').click();assert.deepEqual(await page.evaluate(()=>opened),{section:'components',id:'a'});checks.push('source object opens exact section and identity');
 const downloadPromise=page.waitForEvent('download');await page.click('#stack-export');const download=await downloadPromise;assert.equal(download.suggestedFilename(),'seaf-stack.zip');assert.equal(await download.failure(),null);const zip=unzipSync(await fs.readFile(await download.path()));const inventory=JSON.parse(strFromU8(zip['inventory.json'])),manifest=JSON.parse(strFromU8(zip['manifest.json']));assert.equal(manifest.revision,response.view.revision);assert.equal(manifest.viewHash,response.viewHash);assert.deepEqual(inventory.nodes,response.view.nodes);assert.deepEqual(JSON.parse(strFromU8(zip['legend.json'])),response.view.legend);await fs.writeFile(new URL('../../state/acceptance/stack-export.png',import.meta.url),zip['diagram.png']);checks.push('real PNG/ZIP revision, legend and inventory match rendered snapshot');
 await page.click('#stack-render');await page.evaluate(()=>{mount();finish();});await page.waitForTimeout(50);assert.equal(errors.length,0);checks.push('detached panel response is ignored without exceptions');
 await page.click('#stack-preview');await page.click('#stack-cancel');await page.evaluate(()=>finish());await page.waitForTimeout(50);assert.ok(await page.isDisabled('#stack-stage'));checks.push('cancel discards an in-flight preview');
 await fs.mkdir(new URL('../../state/acceptance/',import.meta.url),{recursive:true});await page.screenshot({path:new URL('../../state/acceptance/stack-views.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});
 const temp=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-stack-browser-'));let appServer;
 try{
  const projectRoot=path.join(temp,'project');await fs.mkdir(projectRoot);const original='components:\n  a:\n    title: Orders\n    links:\n      - id: b\n        title: Requests\n  b:\n    title: Delivery\n';await fs.writeFile(path.join(projectRoot,'root.yaml'),original);
  const engine=new Engine(path.join(temp,'projects.json'),path.join(temp,'state'));await engine.connectProject({root:projectRoot,id:'p',kind:'directory',writable:true});
  const app=await createWorkbenchServer({port:0,engine,state:path.join(temp,'workbench')});appServer=app.server;const real=await browser.newPage({viewport:{width:1440,height:1100}});real.on('pageerror',e=>errors.push(e.message));await real.goto('http://127.0.0.1:'+appServer.address().port+'/?view=stack');
  await real.waitForSelector('#stack-render');await real.click('#stack-render');await real.waitForSelector('#stack-chart svg');await real.locator('#stack-chart a').first().click();await real.waitForSelector('#object-id');assert.equal(await real.inputValue('#object-id'),'a');checks.push('full app opens exact object from SVG card');await real.goBack();await real.waitForSelector('#stack-render');await real.goForward();await real.waitForSelector('#object-id');assert.equal(await real.inputValue('#object-id'),'a');checks.push('Back and Forward restore Stack and exact object');
  await real.click('[data-view="stack"]');await real.fill('#stack-text','Service c: New service\nc sends data to a: Request; protocol=HTTPS');await real.click('#stack-preview');await real.waitForFunction(()=>!document.querySelector('#stack-stage').disabled);await fs.writeFile(path.join(projectRoot,'root.yaml'),original+'  changed:\n    title: Changed\n');await real.click('#stack-stage');await real.waitForFunction(()=>document.querySelector('#stack-status').textContent.includes('Stale sketch'));assert.equal((await app.workbench.drafts('p')).length,0);checks.push('UI rejects preview to draft after external model edit');await fs.writeFile(path.join(projectRoot,'root.yaml'),original);await real.click('#stack-preview');await real.waitForFunction(()=>!document.querySelector('#stack-stage').disabled);await real.click('#stack-stage');await real.waitForFunction(()=>document.querySelector('#stack-status').textContent.includes('сохран'));assert.equal(await fs.readFile(path.join(projectRoot,'root.yaml'),'utf8'),original);checks.push('full app stages description through real API without model writes');
  await real.evaluate(()=>window.scrollTo(0,0));await real.screenshot({path:new URL('../../state/acceptance/stack-full-app.png',import.meta.url).pathname.replace(/^\/(\w:)/,'$1'),fullPage:true});await real.close();
 }finally{if(appServer)await new Promise(r=>appServer.close(r));await fs.rm(temp,{recursive:true,force:true});}
 assert.equal(errors.length,0);
 console.log(JSON.stringify({passed:checks.length,checks,pageErrors:errors},null,2));
}finally{await browser?.close();await new Promise(r=>server.close(r));}
