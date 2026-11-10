import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';
import {spawn} from 'node:child_process';
import {pathToFileURL} from 'node:url';

const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
const workerSource = `import http from 'node:http';
const token=process.env.SEAF_NATIVE_CONTROL_TOKEN;
const control=http.createServer((req,res)=>{
 if(req.method!=='POST'||req.url!=='/stop'||req.headers['x-seaf-token']!==token){res.writeHead(403);res.end();return;}
 res.end('stopping');setTimeout(()=>process.exit(0),30);
});
await new Promise((resolve,reject)=>control.once('error',reject).listen(0,'127.0.0.1',resolve));
console.log('SEAF_CONTROL='+control.address().port);
await import(process.env.SEAF_NATIVE_CORE_ENTRY);
`;

export async function freePort() {
  const server = net.createServer();
  await new Promise((resolve,reject)=>server.once('error',reject).listen(0,'127.0.0.1',resolve));
  const port = server.address().port;
  await new Promise(resolve=>server.close(resolve));
  return port;
}

export class NativeRuntime {
  constructor(options = {}) {
    this.bundleRoot = path.resolve(options.bundleRoot || process.env.SEAF_PORTABLE_ROOT || '.');
    this.node = path.resolve(options.node || path.join(this.bundleRoot,'runtime/node/node.exe'));
    this.coreRoot = path.resolve(options.coreRoot || path.join(this.bundleRoot,'app/core'));
    this.stateRoot = path.resolve(options.stateRoot || path.join(this.bundleRoot,'data/runtime'));
    this.offline = options.offline ?? true;
    this.offlineUrl = options.offlineUrl || process.env.SEAF_OFFLINE_URL;
    this.children = new Map();
    this.timers = new Map();
  }
  async identity() {
    if(await fs.stat(path.join(this.bundleRoot,'manifest.json')).catch(()=>null)){
      const {verifyBundle}=await import(pathToFileURL(path.join(this.bundleRoot,'portable/verify.mjs')).href);
      await verifyBundle(this.bundleRoot,{scope:['app/core/','runtime/node/node.exe','runtime/offline/']});
    }
    const inputs = [
      ['node',this.node],
      ['core.package',path.join(this.coreRoot,'package.json')],
      ['core.lock',path.join(this.coreRoot,'package-lock.json')],
      ['core.entry',path.join(this.coreRoot,'src/backend/main.mjs')],
      ['core.fileResolver',path.join(this.coreRoot,'src/backend/helpers/local-file-path.mjs')],
      ['core.frontend',path.join(this.coreRoot,'dist/index.html')],
    ];
    const files = [];
    for (const [name,file] of inputs) files.push({name,sha256:sha(await fs.readFile(file))});
    for (const [name,file] of [
      ['bundle.manifest',path.join(this.bundleRoot,'manifest.json')],
      ['offline.manifest',path.join(this.bundleRoot,'runtime/offline/manifest.json')],
    ]) {
      try {files.push({name,sha256:sha(await fs.readFile(file))});} catch (e) {if(e.code!=='ENOENT')throw e;}
    }
    return {kind:'native',platform:'win32-x64',coreVersion:JSON.parse(await fs.readFile(path.join(this.coreRoot,'package.json'),'utf8')).version,files,id:sha(JSON.stringify(files))};
  }
  async start({workspace,manifest,port=0,ttlMs,timeout=60000,projectId} = {}) {
    if(projectId!==undefined && (typeof projectId!=='string'||!/^[A-Za-z0-9][A-Za-z0-9._-]{0,100}$/.test(projectId)))throw Error('Invalid native project identity');
    const root = await fs.realpath(workspace);
    let relative = String(manifest || '').replace(/^file:\/\/\//,'').replace(/^\/+/, '');
    if (relative.startsWith('workspace/')) relative = relative.slice('workspace/'.length);
    if (!relative || relative.includes('\\') || relative.includes(':') || relative.split('/').some(x=>!x||x==='..')) throw Error('Invalid native root manifest');
    const manifestPath = await fs.realpath(path.join(root,relative));
    const inside = path.relative(root,manifestPath);
    if (inside.startsWith('..'+path.sep) || inside==='..' || path.isAbsolute(inside)) throw Error('Native root manifest is outside workspace');
    await fs.access(path.join(this.coreRoot,'node_modules/tsx/dist/loader.mjs'));
    const identity = await this.identity();
    port ||= await freePort();
    const id = crypto.randomUUID(), token = crypto.randomBytes(32).toString('hex');
    const dir = path.join(this.stateRoot,id);
    await fs.mkdir(dir,{recursive:true});
    const worker = path.join(dir,'worker.mjs');
    await fs.writeFile(worker,workerSource);
    const environment = {};
    let workbenchUrl=process.env.SEAF_WORKBENCH_URL || '';
    if(projectId&&workbenchUrl){const target=new URL(workbenchUrl);target.searchParams.set('project',projectId);workbenchUrl=target.href;}
    for (const name of ['SYSTEMROOT','SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA']) if(process.env[name])environment[name]=process.env[name];
    Object.assign(environment,{
      PATH:path.dirname(this.node), NODE_ENV:'production',
      npm_package_version:identity.coreVersion,
      VUE_APP_VERSION_CHECKER_ENABLE:this.offline?'false':'true',
      VUE_APP_DOCHUB_NATIVE_FILE_STORAGE:'y',
      VUE_APP_DOCHUB_NATIVE_OFFLINE:this.offline?'y':'n',
      VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS:'n',
      VUE_APP_DOCHUB_DATALAKE_CACHE:'memory',
      VUE_APP_DOCHUB_BACKEND_HOST:'127.0.0.1',
      VUE_APP_DOCHUB_BACKEND_PORT:String(port),
      VUE_APP_DOCHUB_ROOT_MANIFEST:'file:///'+relative,
      VUE_APP_DOCHUB_METAMODEL:'file:///__seaf/metamodel/root.yaml',
      VUE_APP_DOCHUB_BACKEND_FILE_STORAGE:root,
      VUE_APP_DOCHUB_LOGGER_LEVEL:'warn',
      VUE_APP_DOCHUB_SMART_ANTS_MODE:'front',
      VUE_APP_DOCHUB_PLUGIN_DRAWIO_SERVER_URI:this.offlineUrl || '',
      SEAF_WORKBENCH_URL:workbenchUrl,
      VUE_APP_DOCHUB_PREVIEW:ttlMs?'y':'n',
      SEAF_NATIVE_CONTROL_TOKEN:token,
      SEAF_NATIVE_INSTANCE:id,
      SEAF_NATIVE_CORE_ENTRY:pathToFileURL(path.join(this.coreRoot,'src/backend/main.mjs')).href,
      ...(this.offlineUrl?{
        VUE_APP_PLANTUML_SERVER:this.offlineUrl.replace(/\/$/,'')+'/plantuml/svg/',
        VUE_APP_PLANTUML_REQUEST_TYPE:'GET',
      }:{}),
    });
    const child = spawn(this.node,['--import','tsx',worker],{cwd:this.coreRoot,env:environment,windowsHide:true,stdio:['ignore','pipe','pipe']});
    this.children.set(id,child);
    let output = '', controlPort;
    const collect = chunk => {
      output = (output + chunk.toString()).slice(-24000);
      const match = /SEAF_CONTROL=(\d+)/.exec(output);
      if(match)controlPort=Number(match[1]);
    };
    child.stdout.on('data',collect);child.stderr.on('data',collect);
    let spawnError; child.on('error',error=>{spawnError=error;});
    const record = {id,runtime:'native',bundleRoot:this.bundleRoot,url:'http://127.0.0.1:'+port,port,pid:child.pid,workspace:root,manifest:relative,identity,created:new Date().toISOString(),...(ttlMs?{expires:new Date(Date.now()+ttlMs).toISOString()}:{}),token};
    try {
      const deadline = Date.now()+timeout;
      let last = 'Starting native SEAF';
      while(Date.now()<deadline) {
        if(spawnError)throw spawnError;
        if(child.exitCode!==null)throw Error('Native SEAF exited ('+child.exitCode+'): '+output);
        try {
          const response=await fetch(record.url+'/health',{signal:AbortSignal.timeout(1500)});
          const health=await response.json();
          if(response.ok && health.nativeInstance===id && controlPort)break;
          last=health.message || 'Native SEAF not ready';
        } catch(error){last=error.message;}
        await pause(150);
      }
      const ready=await fetch(record.url+'/health',{signal:AbortSignal.timeout(2000)}).then(async r=>r.ok&&(await r.json()).nativeInstance===id).catch(()=>false);
      if(!ready || !controlPort)throw Error('Native SEAF failed to become ready: '+last+'\n'+output);
      record.controlPort=controlPort;
      await fs.writeFile(path.join(dir,'runtime.json'),JSON.stringify(record,null,2));
      if(ttlMs){const timer=setTimeout(()=>this.stop(id).catch(()=>{}),ttlMs);timer.unref();this.timers.set(id,timer);}
      const {token:secret,...result}=record;
      return result;
    } catch(error) {
      child.kill();this.children.delete(id);
      await fs.writeFile(path.join(dir,'error.log'),String(error.stack||error));
      throw error;
    }
  }
  startPreview(options) {return this.start({...options,ttlMs:options.ttlMs ?? 30*60*1000});}
  async stop(id) {
    if(!/^[0-9a-f-]{36}$/.test(id))throw Error('Invalid native runtime id');
    const child=this.children.get(id);
    let record;
    try{record=JSON.parse(await fs.readFile(path.join(this.stateRoot,id,'runtime.json'),'utf8'));}catch(e){if(e.code!=='ENOENT')throw e;}
    if(!child && record && (typeof record.bundleRoot!=='string' || path.resolve(record.bundleRoot).toLowerCase()!==this.bundleRoot.toLowerCase()))throw Error('Native runtime belongs to another or unverified bundle; no process was stopped');
    if(record?.controlPort) {
      try {
        const response=await fetch('http://127.0.0.1:'+record.controlPort+'/stop',{method:'POST',headers:{'x-seaf-token':record.token},signal:AbortSignal.timeout(2000)});
        if(!response.ok && !child)throw Error('Native runtime ownership could not be verified; no process was killed');
      }catch(error){if(!child && error.message.includes('ownership'))throw error;}
    }
    if(child){await Promise.race([new Promise(resolve=>child.once('exit',resolve)),pause(1000)]);if(child.exitCode===null)child.kill();}
    this.children.delete(id);clearTimeout(this.timers.get(id));this.timers.delete(id);
    if(record)await fs.writeFile(path.join(this.stateRoot,id,'runtime.json'),JSON.stringify({...record,status:'stopped'},null,2));
    return {id,status:'stopped'};
  }
  stopPreview(id){return this.stop(id);}
  async closeAll() {
    await fs.mkdir(this.stateRoot,{recursive:true});
    const records=await fs.readdir(this.stateRoot,{withFileTypes:true});
    const results=[];
    for(const entry of records)if(entry.isDirectory()&&/^[0-9a-f-]{36}$/.test(entry.name)) {
      const record=await fs.readFile(path.join(this.stateRoot,entry.name,'runtime.json'),'utf8').then(JSON.parse).catch(()=>null);
      if(record&&record.status!=='stopped'){
        if(!this.children.has(entry.name) && (typeof record.bundleRoot!=='string'||path.resolve(record.bundleRoot).toLowerCase()!==this.bundleRoot.toLowerCase())){results.push({id:entry.name,status:'skipped',reason:'Runtime belongs to another or unverified bundle'});continue;}
        results.push(await this.stop(entry.name));
      }
    }
    return results;
  }
  async validate({workspace,manifest,timeout=60000}) {
    const running=await this.start({workspace,manifest,timeout});
    try {
      const response=await fetch(running.url+'/core/storage/problems/',{signal:AbortSignal.timeout(timeout)});
      if(!response.ok)throw Error('Native model validation request failed: '+response.status);
      const results=await response.json();
      if(!Array.isArray(results))throw Error('Native validation returned an invalid rule result');
      return {ok:!results.some(p=>p.error||p.items?.length),rules:results.length,problems:results.filter(p=>p.error||p.items?.length)};
    }finally{await this.stop(running.id);}
  }
}
