import fs from 'node:fs/promises';
import path from 'node:path';
import http from 'node:http';
import os from 'node:os';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {freePort} from '../../seaf-mcp/native-runtime.mjs';
import {createOfflineServer,renderPlantUml} from '../../portable/offline.mjs';
import {modelHash} from './fixtures.mjs';
import {createBrowserBench} from './browser.mjs';
const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const args=process.argv.slice(2),arg=(key,fallback)=>{const i=args.indexOf(key);return i<0?fallback:args[i+1];};
const suitePath=path.resolve(arg('--suite',path.join(here,'state/fixtures-1000-3000-v3/fixtures.json')));
const output=path.resolve(arg('--out',path.join(here,'state/run-'+Date.now())));
const rounds=Number(arg('--rounds',3)),reloads=Number(arg('--reloads',2)),transport=arg('--transport','file'),latencyMs=Number(arg('--latency-ms',0));
if(!['file','http'].includes(transport)||![rounds,reloads,latencyMs].every(Number.isInteger)||rounds<1||reloads<0||latencyMs<0)throw Error('Invalid run configuration');
const pins=JSON.parse(await fs.readFile(path.join(repo,'portable/inputs.json'),'utf8'));
const node=path.resolve(arg('--node',path.join(repo,'portable/cache/runtime','node-'+pins.node.version,pins.node.archiveDirectory,'node.exe')));
const coreRoot=path.resolve(arg('--core',path.join(repo,'vendor/seaf-archtool-core')));
const suite=JSON.parse(await fs.readFile(suitePath,'utf8')),sizes=arg('--sizes','1000,3000').split(',').map(Number),layouts=arg('--layouts','baseline,v1,v2,v3,v4,v5,v6').split(',');
const fixtures=suite.fixtures.filter(f=>sizes.includes(f.counts.systems)&&layouts.includes(f.layout));
if(!fixtures.length)throw Error('No matching verified fixtures');
await fs.mkdir(output,{recursive:true});
if((await fs.readdir(output)).length)throw Error('Choose an empty output directory');
const report={format:'seaf-repository-layout-measurements-v1',status:'running',started:new Date().toISOString(),synthetic:true,productionWrites:false,
 config:{transport,latencyMs,rounds,reloads,browser:args.includes('--browser'),graphPresentation:arg('--graph','plantuml'),suitePath,node,coreRoot},
 host:{platform:process.platform,release:os.release(),cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,totalMemoryMiB:os.totalmem()/1048576,availableMemoryAtStartMiB:os.freemem()/1048576,parentNode:process.version},
 samples:[],failures:[]};
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const save=async()=>{await fs.writeFile(path.join(output,'results.json'),JSON.stringify(report,null,2));await fs.writeFile(path.join(output,'progress.json'),JSON.stringify({status:report.status,completed:report.samples.length,total:fixtures.length*rounds,last:report.samples.at(-1)?.label,failures:report.failures.length,updated:new Date().toISOString()},null,2));};
const summarizeProbe=({fixture,global,eventLoop,memory,importMs,imported,cpu,node})=>({fixture,global,eventLoop,memory,importMs,imported,cpu,node});
let activeRender=0,offline,browser,sourceServer,currentRoot,httpSourceMetrics;
const children=new Set();
async function waitRenderIdle(){const until=Date.now()+30000;while(activeRender&&Date.now()<until)await pause(100);if(activeRender)throw Error('Previous diagram renderer did not finish');}
async function sourceStart(){
 if(transport!=='http')return null;
 sourceServer=http.createServer(async(req,res)=>{try{
  const relative=decodeURIComponent(new URL(req.url,'http://local').pathname).replace(/^\//,'');
  if(!relative||relative.includes('\\')||relative.split('/').some(x=>x==='..'||x.startsWith('.'))||!relative.endsWith('.yaml')){res.writeHead(403);res.end();return;}
  const data=await fs.readFile(path.join(currentRoot,relative));httpSourceMetrics.requests++;httpSourceMetrics.bytes+=data.length;
  if(latencyMs)await pause(latencyMs);res.writeHead(200,{'Content-Type':'text/yaml; charset=utf-8','Cache-Control':'no-store'});res.end(data);
 }catch(e){res.writeHead(404);res.end(e.message);}});
 await new Promise((resolve,reject)=>sourceServer.once('error',reject).listen(0,'127.0.0.1',resolve));
 return 'http://127.0.0.1:'+sourceServer.address().port;
}
async function json(url,options={}){const r=await fetch(url,{signal:AbortSignal.timeout(180000),...options});const text=await r.text();if(!r.ok)throw Error('HTTP '+r.status+' '+text.slice(0,1000));return text?JSON.parse(text):{};}
async function query(origin,expression){return json(origin+'/core/storage/jsonata/'+encodeURIComponent('('+expression+')'));}
async function verifyModel(origin,f){
 const before=performance.now(),data=await query(origin,'{"components":components,"integrations":integrations,"contexts":contexts,"catalogs":catalogs}');
 const milliseconds=performance.now()-before;
 for(const key of ['components','integrations','contexts','catalogs'])if(modelHash(data[key])!==f.sectionHashes[key])throw Error('Runtime model differs: '+key+' in '+f.layout);
 if(Object.keys(data.components).length!==f.counts.systems||Object.keys(data.integrations).length!==f.counts.integrations)throw Error('Runtime count mismatch');
 return {milliseconds,counts:f.counts,modelSha256:modelHash(data)};
}
async function start(f,runId,sourceOrigin){
 const port=await freePort(),token=crypto.randomBytes(24).toString('hex'),instance=crypto.randomUUID(),dir=path.join(output,runId);await fs.mkdir(dir);
 const configuration={workspace:f.root,coreRoot,port,token,instance,offlineUrl:offline.url,transport,rootManifest:transport==='http'?sourceOrigin+'/root.yaml':'file:///root.yaml'};
 const configFile=path.join(dir,'worker.json');await fs.writeFile(configFile,JSON.stringify(configuration));
 const environment={};for(const key of ['SYSTEMROOT','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA'])if(process.env[key])environment[key]=process.env[key];
 environment.PATH=path.dirname(node);
 const began=performance.now(),child=spawn(node,['--import',pathToFileURL(path.join(coreRoot,'node_modules/tsx/dist/loader.mjs')).href,path.join(here,'worker.mjs'),configFile],{cwd:coreRoot,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});children.add(child);
 let logs='',controlPort,spawnError;child.on('error',e=>spawnError=e);
 const collect=c=>{logs=(logs+c.toString()).slice(-50000);const m=/BENCH_CONTROL=(\d+)/.exec(logs);if(m)controlPort=Number(m[1]);};child.stdout.on('data',collect);child.stderr.on('data',collect);
 const origin='http://127.0.0.1:'+port;
 const control=async(method='GET',resource='/metrics')=>json('http://127.0.0.1:'+controlPort+resource,{method,headers:{'X-Bench-Token':token}});
 const stop=async()=>{if(controlPort)await control('POST','/stop').catch(()=>{});const until=Date.now()+5000;while(child.exitCode===null&&Date.now()<until)await pause(100);if(child.exitCode===null)child.kill();children.delete(child);await fs.writeFile(path.join(dir,'worker.log'),logs);};
 try{
  let ready=false,lastError='starting',deadline=Date.now()+180000;
  while(Date.now()<deadline){if(spawnError)throw spawnError;if(child.exitCode!==null)throw Error('Worker exited '+child.exitCode+' '+logs);try{const health=await json(origin+'/health',{signal:AbortSignal.timeout(1000)});if(health.nativeInstance===instance&&controlPort){ready=true;break;}}catch(e){lastError=e.message;}await pause(75);}
  if(!ready)throw Error('Native readiness timeout: '+lastError+' '+logs);
  const coldStartMs=performance.now()-began,loadProbe=await control();
  await fs.writeFile(path.join(dir,'load-probe.json'),JSON.stringify(loadProbe,null,2));
  return {origin,control,stop,coldStartMs,loadProbe};
 }catch(e){await stop();throw e;}
}
try{
 await save();
 report.rendererCacheScope='New offline service/cache for every sample; focused PlantUML starts with an empty renderer cache. Browser assets are cold then warm within each sample.';
 report.implementation={coreVersion:JSON.parse(await fs.readFile(path.join(coreRoot,'package.json'),'utf8')).version,sourceHashes:{}};
 for(const file of ['src/backend/helpers/request.mjs','src/backend/storage/manifest-source.ts','src/backend/storage/cache.mjs','src/global/manifest/parser3/index.mjs','package-lock.json'])report.implementation.sourceHashes[file]=crypto.createHash('sha256').update(await fs.readFile(path.join(coreRoot,file))).digest('hex');
 for(const file of ['fixtures.mjs','probe.mjs','worker.mjs','browser.mjs','run.mjs'])report.implementation.sourceHashes['benchmark/'+file]=crypto.createHash('sha256').update(await fs.readFile(path.join(here,file))).digest('hex');
 const sourceOrigin=await sourceStart();
 if(args.includes('--browser'))browser=await createBrowserBench();
 for(let round=0;round<rounds;round++){
  // Stable rotation/reversal reduces dependence on a single layout order.
  const rotated=fixtures.slice(round%fixtures.length).concat(fixtures.slice(0,round%fixtures.length));if(round%2)rotated.reverse();
  for(const f of rotated){
   await waitRenderIdle();currentRoot=f.root;httpSourceMetrics={requests:0,bytes:0};
   offline=await createOfflineServer({port:0,assetsRoot:path.join(repo,'portable/state/offline'),renderer:async(source,settings)=>{++activeRender;try{return await renderPlantUml(source,settings);}finally{--activeRender;}}});
   const label=f.counts.systems+'-'+f.layout+'-r'+(round+1),sample={label,round:round+1,layout:f.layout,systems:f.counts.systems,integrations:f.counts.integrations,source:{yamlFiles:f.yamlFiles,typedFiles:f.typedFiles,maxDepth:f.maxDepth,bytes:f.bytes,directories:f.directories,rootManifestBytes:f.rootManifestBytes},status:'running'};
   let runtime;console.log('Measuring '+label);
   try{
    runtime=await start(f,label,sourceOrigin);sample.coldStartMs=runtime.coldStartMs;sample.load=summarizeProbe(runtime.loadProbe);sample.httpSourceLoad={...httpSourceMetrics};
    sample.model=await verifyModel(runtime.origin,f);
    sample.reload=[];
    for(let i=0;i<reloads;i++){
     await runtime.control('POST','/reset');httpSourceMetrics={requests:0,bytes:0};
     const before=performance.now();await json(runtime.origin+'/core/storage/reload',{method:'PUT'});const reloadMs=performance.now()-before;
     const metrics=await runtime.control();await verifyModel(runtime.origin,f);
     sample.reload.push({reloadMs,probe:summarizeProbe(metrics),httpSource:{...httpSourceMetrics}});
    }
    if(browser){sample.browser=await browser.measure({url:runtime.origin+(f.uiEntrypoint?.path||'/entities/docs/blank?dh-doc-id=bench.registry'),markerTitle:'Система 00001',focusContextId:'bench.focus',graphPresentation:arg('--graph','plantuml'),minimumGraphNodes:50,repetitions:1,timeoutMs:90000});if(sample.browser.status!=='passed')throw Error('Browser benchmark failed: '+JSON.stringify(sample.browser.failures).slice(0,2000));}
    if(round===0&&f.layout==='baseline'){
     const before=performance.now(),problems=await json(runtime.origin+'/core/storage/problems/');sample.validation={milliseconds:performance.now()-before,rules:problems.length,problems:problems.filter(p=>p.error||p.items?.length)};
     if(sample.validation.problems.length)throw Error('Fixture validation failed: '+JSON.stringify(sample.validation.problems).slice(0,1500));
    }
    sample.status='passed';
   }catch(error){sample.status='failed';sample.error=error.stack||String(error);report.failures.push({label,error:sample.error});}
   finally{if(runtime)await runtime.stop();if(offline){await offline.stop();offline=null;}await waitRenderIdle();report.samples.push(sample);await save();}
   if(sample.status==='failed'&&args.includes('--fail-fast'))throw Error(sample.error);
   await pause(250);
  }
 }
 report.status=report.failures.length?'failed':'passed';
}catch(error){report.status='failed';report.error=error.stack||String(error);process.exitCode=1;}
finally{if(browser)await browser.close();for(const child of children)child.kill();if(sourceServer)await new Promise(resolve=>sourceServer.close(resolve));if(offline)await offline.stop();report.completed=new Date().toISOString();report.host.availableMemoryAtEndMiB=os.freemem()/1048576;await save();}
console.log(JSON.stringify({status:report.status,samples:report.samples.length,failures:report.failures.length,output}));
