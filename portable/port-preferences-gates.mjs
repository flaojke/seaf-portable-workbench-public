// Isolated release-copy acceptance; never run against a working user's bundle.
import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import assert from 'node:assert/strict';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {createRequire} from 'node:module';
import {selectPort} from './ports.mjs';
const exec=promisify(execFile),require=createRequire(import.meta.url);
const {chromium}=require(process.env.SEAF_PLAYWRIGHT||'playwright');
if(!process.env.SEAF_TEST_BUNDLE)throw Error('SEAF_TEST_BUNDLE must identify an isolated test copy');
const bundle=path.resolve(process.env.SEAF_TEST_BUNDLE),data=path.join(bundle,'data'),node=path.join(bundle,'runtime/node/node.exe'),launcher=path.join(bundle,'portable/launcher.mjs');
const settingsFile=path.join(data,'settings.json'),portsFile=path.join(data,'ports.json'),cacheBackup=path.join(data,'ports.fixture-preserved.json');
const env={SystemRoot:process.env.SystemRoot,WINDIR:process.env.WINDIR,TEMP:process.env.TEMP,TMP:process.env.TMP,USERPROFILE:process.env.USERPROFILE,LOCALAPPDATA:process.env.LOCALAPPDATA,PATH:path.join(process.env.SystemRoot,'System32')};
const call=async(...args)=>(await exec(node,[launcher,...args],{cwd:bundle,env,windowsHide:true,timeout:120000,maxBuffer:1e6})).stdout;
const status=async()=>JSON.parse(await call('status'));
const waitStopped=async()=>{for(let i=0;i<100;i++){if((await status()).status==='stopped')return;await new Promise(resolve=>setTimeout(resolve,100));}throw Error('Test bundle did not stop');};
const stop=async()=>{await call('stop');await waitStopped();};
const readOptional=file=>fs.readFile(file,'utf8').catch(error=>{if(error.code==='ENOENT')return null;throw error;});
const report={format:'seaf-port-preferences-acceptance-v1',status:'running',productionWrites:false,cases:[],browserErrors:[]};
const check=(name,extra={})=>report.cases.push({name,status:'PASS',...extra});
let originalSettings,originalPorts,collision,browser,cacheDirectoryCreated=false;
try{
 assert.equal((await status()).status,'stopped','Refuse to stop an already running bundle; use an isolated stopped copy');
 await fs.mkdir(data,{recursive:true});originalSettings=await readOptional(settingsFile);originalPorts=await readOptional(portsFile);
 if(await fs.stat(cacheBackup).catch(()=>null))throw Error('Fixture cache backup already exists');
 const settings=originalSettings?JSON.parse(originalSettings):{};
 await fs.writeFile(settingsFile,JSON.stringify({...settings,portalPort:0,workbenchPort:0,offlinePort:0}));await fs.writeFile(portsFile,'{ malformed optional fixture cache');
 await call('start','--no-browser');const first=await status(),cached=JSON.parse(await fs.readFile(portsFile,'utf8'));assert.equal(cached.format,'seaf-port-preferences-v1');assert.equal(cached.ports.workbench,Number(new URL(first.workbenchUrl).port));check('malformed optional cache is replaced after successful native startup');
 browser=await chromium.launch({headless:true,executablePath:process.env.SEAF_CHROME_EXECUTABLE||'C:/Program Files/Google/Chrome/Application/chrome.exe'});const context=await browser.newContext(),page=await context.newPage();page.on('pageerror',error=>report.browserErrors.push(error.message));await page.goto(first.workbenchUrl);await page.locator('#project').waitFor();await page.evaluate(()=>localStorage.setItem('seaf-origin-preference-test','favorite:demo.shop.delivery'));
 await stop();await call('start','--no-browser');const second=await status();for(const key of['portalUrl','workbenchUrl','offlineUrl'])assert.equal(second[key],first[key]);await page.goto(second.workbenchUrl);assert.equal(await page.evaluate(()=>localStorage.getItem('seaf-origin-preference-test')),'favorite:demo.shop.delivery');check('all automatic service origins and browser-local preference survive stop and restart');
 const cacheBeforeRepeat=await fs.readFile(portsFile,'utf8'),mtime=(await fs.stat(portsFile)).mtimeMs;await call('start','--no-browser');assert.equal((await status()).pid,second.pid);assert.equal(await fs.readFile(portsFile,'utf8'),cacheBeforeRepeat);assert.equal((await fs.stat(portsFile)).mtimeMs,mtime);check('repeated start of the live supervisor does not change ports or preference file');await stop();
 collision=http.createServer((req,res)=>res.end('unrelated remembered-port fixture'));await new Promise((resolve,reject)=>{collision.once('error',reject);collision.listen(cached.ports.workbench,'127.0.0.1',resolve);});
 await call('start','--no-browser');const fallback=await status();assert.notEqual(fallback.workbenchUrl,first.workbenchUrl);assert.equal(fallback.portalUrl,first.portalUrl);assert.equal(fallback.offlineUrl,first.offlineUrl);assert.equal(await fetch(first.workbenchUrl).then(r=>r.text()),'unrelated remembered-port fixture');await page.goto(fallback.workbenchUrl);assert.equal(await page.evaluate(()=>localStorage.getItem('seaf-origin-preference-test')),null);check('busy cached workbench port selects a new origin without stopping the unrelated service');await stop();
 const explicit=await selectPort({avoid:[cached.ports.portal,cached.ports.offline,cached.ports.workbench,Number(new URL(fallback.workbenchUrl).port)]});await fs.writeFile(settingsFile,JSON.stringify({...settings,portalPort:0,workbenchPort:explicit,offlinePort:0}));await call('start','--no-browser');assert.equal((await status()).workbenchUrl,'http://127.0.0.1:'+explicit);check('explicit configured workbench port overrides the previous automatic preference');await stop();
 await fs.writeFile(settingsFile,JSON.stringify({...settings,portalPort:0,workbenchPort:cached.ports.workbench,offlinePort:0}));await assert.rejects(()=>call('start','--no-browser'),/Configured workbench port.*unavailable/);assert.equal((await status()).status,'stopped');assert.equal(await fetch(first.workbenchUrl).then(r=>r.text()),'unrelated remembered-port fixture');assert.equal(await selectPort({setting:cached.ports.offline}),cached.ports.offline);check('occupied explicit port reports failure and releases only newly created services');
 await fs.rename(portsFile,cacheBackup);await fs.mkdir(portsFile);cacheDirectoryCreated=true;await fs.writeFile(path.join(portsFile,'keep.txt'),'Keep this fixture data');await fs.writeFile(settingsFile,JSON.stringify({...settings,portalPort:0,workbenchPort:0,offlinePort:0}));await assert.rejects(()=>call('start','--no-browser'),/Cannot save automatic service ports/);assert.equal((await status()).status,'stopped');assert.equal(await fs.readFile(path.join(portsFile,'keep.txt'),'utf8'),'Keep this fixture data');assert.equal(await fetch(first.workbenchUrl).then(r=>r.text()),'unrelated remembered-port fixture');check('preference persistence failure is reported without a ready supervisor or deletion of existing data');
 assert.deepEqual(report.browserErrors,[]);report.status='PASS';
}catch(error){report.status='FAIL';report.error=error.stack||error.message;process.exitCode=1;}finally{
 await browser?.close();await call('stop').catch(()=>{});await waitStopped().catch(()=>{});if(collision)await new Promise(resolve=>{collision.close(resolve);collision.closeAllConnections?.();});
 if(cacheDirectoryCreated){await fs.unlink(path.join(portsFile,'keep.txt'));await fs.rmdir(portsFile);await fs.rename(cacheBackup,portsFile);}
 for(const[file,original]of[[settingsFile,originalSettings],[portsFile,originalPorts]]){if(original===undefined)continue;if(original===null)await fs.rm(file,{force:true});else await fs.writeFile(file,original);}
 await fs.mkdir('portable/state',{recursive:true});await fs.writeFile('portable/state/port-preferences-gates.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));
}
