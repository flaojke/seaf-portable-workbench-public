import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {NativeRuntime} from '../../seaf-mcp/native-runtime.mjs';
import {resolveLocalFilePath} from '../../vendor/seaf-archtool-core/src/backend/helpers/local-file-path.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
test('Windows virtual storage allows Unicode files, public aliases and blocks escapes',async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-path-'));
  try{
    const storage=path.join(base,'Локальная папка'),pub=path.join(base,'public');
    await fs.mkdir(storage);await fs.mkdir(path.join(pub,'metamodel'),{recursive:true});
    await fs.writeFile(path.join(storage,'схема.yaml'),'components: {}');await fs.writeFile(path.join(pub,'metamodel/root.yaml'),'entities: {}');
    const roots={file_storage:storage,public:pub};
    assert.equal(resolveLocalFilePath('/'+encodeURIComponent('схема.yaml'),roots,true),await fs.realpath(path.join(storage,'схема.yaml')));
    assert.equal(resolveLocalFilePath('/__seaf/metamodel/root.yaml',roots,true),await fs.realpath(path.join(pub,'metamodel/root.yaml')));
    for(const uri of ['/../outside.yaml','/%2e%2e/outside.yaml','/D:/outside.yaml','/a%5c..%5coutside.yaml'])assert.throws(()=>resolveLocalFilePath(uri,roots,true));
    await fs.writeFile(path.join(base,'outside.yaml'),'secret');
    await fs.symlink(base,path.join(storage,'escape'),'junction');
    assert.throws(()=>resolveLocalFilePath('/escape/outside.yaml',roots,true),/outside/);
  }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('Native identity is stable and changes when the shipped binary changes',async()=>{
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-id-'));
  try{
    const core=path.join(base,'app/core');
    for(const file of ['package.json','package-lock.json','src/backend/main.mjs','src/backend/helpers/local-file-path.mjs','dist/index.html']){
      const target=path.join(core,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,file==='package.json'?'{"version":"test"}':file);
    }
    const node=path.join(base,'node.exe');await fs.writeFile(node,'binary-v1');
    const runtime=new NativeRuntime({bundleRoot:base,coreRoot:core,node});
    const a=await runtime.identity(),b=await runtime.identity();assert.deepEqual(a,b);
    await fs.writeFile(node,'binary-v2');assert.notEqual((await runtime.identity()).id,a.id);
  }finally{await fs.rm(base,{recursive:true,force:true});}
});
test('Real native SEAF validates a copied Unicode workspace and stops only its own runtime',{skip:!process.env.SEAF_NATIVE_E2E,timeout:120000},async()=>{
  const previousWorkbenchURL=process.env.SEAF_WORKBENCH_URL;
  const base=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-native-'));
  const runtime=new NativeRuntime({bundleRoot:root,coreRoot:path.join(root,'vendor/seaf-archtool-core'),node:process.env.SEAF_NATIVE_NODE||path.join(root,'portable/cache/runtime/node-22.23.4/node-v22.23.4-win-x64/node.exe'),stateRoot:path.join(base,'state')});
  try{
    const workspace=path.join(base,'Модель с пробелами');await fs.mkdir(workspace);
    await fs.writeFile(path.join(workspace,'root.yaml'),'components:\n  acme:\n    title: Acme\n    entity: system\n  acme.orders:\n    title: Orders\n    entity: component\ncontexts:\n  acme.overview:\n    title: Acme overview\n    components: [acme, acme.orders]\n');
    const before=await fs.readFile(path.join(workspace,'root.yaml'),'utf8');
    const result=await runtime.validate({workspace,manifest:'workspace/root.yaml'});assert.equal(result.ok,true,JSON.stringify(result));assert.ok(result.rules>0);
    process.env.SEAF_WORKBENCH_URL='http://127.0.0.1:8091/';
    const preview=await runtime.startPreview({workspace,manifest:'root.yaml',ttlMs:60000,projectId:'native-fixture'});
    assert.equal((await fetch(preview.url+'/health').then(r=>r.json())).nativeInstance,preview.id);
    assert.equal((await fetch(preview.url+'/core/storage/versions').then(r=>r.json())).coreVersion,preview.identity.coreVersion);
    assert.equal((await fetch(preview.url+'/core/storage/versions').then(r=>r.json())).enableChecker,false);
    assert.equal(new URL((await fetch(preview.url+'/api/env-config').then(r=>r.json())).workbenchUrl).searchParams.get('project'),'native-fixture');
    const query=await fetch(preview.url+'/core/storage/jsonata/'+encodeURIComponent('(components."acme.orders".title)'));assert.equal(query.status,200);assert.equal(await query.json(),'Orders');
    const nav=await fetch(preview.url+'/core/storage/jsonata/'+encodeURIComponent('(docs."local.projects.workspace".view)')).then(r=>r.json());assert.equal(nav,'projects');
    await new NativeRuntime({bundleRoot:root,coreRoot:runtime.coreRoot,node:runtime.node,stateRoot:runtime.stateRoot}).stop(preview.id);
    await new Promise(resolve=>setTimeout(resolve,100));
    await assert.rejects(fetch(preview.url+'/health'));
    assert.equal(await fs.readFile(path.join(workspace,'root.yaml'),'utf8'),before);
    await assert.rejects(runtime.start({workspace,manifest:'../root.yaml'}),/Invalid/);
    const unrelated=http.createServer((req,res)=>{res.setHeader('Content-Type','application/json');res.end('{"message":"unrelated","nativeInstance":"some-other-instance"}');});await new Promise(resolve=>unrelated.listen(0,'127.0.0.1',resolve));
    try{await assert.rejects(runtime.start({workspace,manifest:'root.yaml',port:unrelated.address().port,timeout:5000}),/exited|ready/);assert.equal((await fetch('http://127.0.0.1:'+unrelated.address().port+'/health').then(r=>r.json())).message,'unrelated');}finally{await new Promise(resolve=>unrelated.close(resolve));}
    await fs.writeFile(path.join(workspace,'root.yaml'),before.replace('title: Orders','title: Orders\n    links: [{id: acme.missing, title: Missing}]'));
    const invalid=await runtime.validate({workspace,manifest:'root.yaml'});assert.equal(invalid.ok,false);assert.ok(invalid.problems.some(p=>p.id==='archtool.metamodel.components.links.nofound'));
  }finally{if(previousWorkbenchURL===undefined)delete process.env.SEAF_WORKBENCH_URL;else process.env.SEAF_WORKBENCH_URL=previousWorkbenchURL;await runtime.closeAll();await fs.rm(base,{recursive:true,force:true});}
});
