import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import {pathToFileURL} from 'node:url';
import {performance} from 'node:perf_hooks';
import {installProbe} from './probe.mjs';

const configFile=process.argv[2];
if(!configFile)throw Error('Usage: node --import <tsx-loader> worker.mjs <config.json>');
const config=JSON.parse(await fs.readFile(path.resolve(configFile),'utf8'));
if(typeof config.workspace!=='string'||typeof config.coreRoot!=='string'||typeof config.token!=='string'||!config.token||typeof config.instance!=='string'||!config.instance)
  throw Error('Worker requires workspace, coreRoot, token and instance');
if(!Number.isInteger(config.port)||config.port<1||config.port>65535)throw Error('Worker requires a fixed loopback backend port');
const workspace=await fs.realpath(path.resolve(config.workspace));
const coreRoot=await fs.realpath(path.resolve(config.coreRoot));
const transport=config.transport||'file';
if(!['file','http'].includes(transport))throw Error('Unknown benchmark source transport');
const manifest=config.rootManifest || 'file:///root.yaml';
if(transport==='http'){
  const url=new URL(manifest);
  if(url.protocol!=='http:'||!['localhost','127.0.0.1','[::1]'].includes(url.hostname)||url.username||url.password)
    throw Error('HTTP benchmark source must be an unauthenticated loopback HTTP fixture');
}else if(!manifest.startsWith('file:///'))throw Error('File benchmark requires a virtual file:/// manifest');

Object.assign(process.env,{
  NODE_ENV:'production',
  VUE_APP_DOCHUB_NATIVE_FILE_STORAGE:'y',
  VUE_APP_DOCHUB_NATIVE_OFFLINE:transport==='file'?'y':'n',
  VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS:'n',
  VUE_APP_DOCHUB_DATALAKE_CACHE:'memory',
  VUE_APP_DOCHUB_BACKEND_HOST:'127.0.0.1',
  VUE_APP_DOCHUB_BACKEND_PORT:String(config.port),
  VUE_APP_DOCHUB_ROOT_MANIFEST:manifest,
  VUE_APP_DOCHUB_METAMODEL:'file:///__seaf/metamodel/root.yaml',
  VUE_APP_DOCHUB_BACKEND_FILE_STORAGE:workspace,
  VUE_APP_DOCHUB_LOGGER_LEVEL:'warn',
  VUE_APP_DOCHUB_SMART_ANTS_MODE:'front',
  VUE_APP_DOCHUB_PLUGIN_DRAWIO_SERVER_URI:config.offlineUrl||'',
  VUE_APP_DOCHUB_PREVIEW:'y',
  MANIFEST_MUTATION:'n',
  SEAF_NATIVE_INSTANCE:config.instance,
  ...(config.offlineUrl?{
    VUE_APP_PLANTUML_SERVER:config.offlineUrl.replace(/\/$/,'')+'/plantuml/svg/',
    VUE_APP_PLANTUML_REQUEST_TYPE:'GET',
  }:{}),
});

const probe=installProbe({workspace,coreRoot});
let cpuBase=process.cpuUsage(), imported=false, importMs=null, importError=null;
const send=(response,status,data)=>{
  response.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'});
  response.end(JSON.stringify(data));
};
const control=http.createServer((request,response)=>{
  if(request.headers['x-bench-token']!==config.token)return send(response,403,{error:'Benchmark token required'});
  if(request.method==='GET'&&request.url==='/metrics')
    return send(response,200,{...probe.snapshot(),memory:process.memoryUsage(),cpu:process.cpuUsage(cpuBase),importMs,imported,...(importError?{error:importError}:{}),pid:process.pid,node:process.version});
  if(request.method==='POST'&&request.url==='/reset'){
    probe.reset();cpuBase=process.cpuUsage();return send(response,200,{reset:true,imported});
  }
  if(request.method==='POST'&&request.url==='/stop'){
    send(response,200,{stopping:true});
    setTimeout(()=>{probe.restore();process.exit(0);},30);
    return;
  }
  return send(response,404,{error:'Unknown benchmark control route'});
});
await new Promise((resolve,reject)=>control.once('error',reject).listen(0,'127.0.0.1',resolve));
console.log('BENCH_CONTROL='+control.address().port);

const begin=performance.now();
try{
  await import(pathToFileURL(path.join(coreRoot,'src/backend/main.mjs')).href);
  importMs=performance.now()-begin;imported=true;
  console.log('BENCH_IMPORTED='+JSON.stringify({importMs,memory:process.memoryUsage()}));
}catch(error){
  importMs=performance.now()-begin;
  importError={name:error.name||'Error',message:error.message||String(error),stack:error.stack||null};
  console.error('BENCH_IMPORT_ERROR='+JSON.stringify(importError));
  // Keep only this worker's loopback control alive for metrics/error capture and
  // an authenticated stop. The parent decides how to classify this failed run.
}
