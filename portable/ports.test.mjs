import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import net from 'node:net';
import {readPortPreferences,savePortPreferences,selectPort,configuredPort,PORT_CACHE_FORMAT} from './ports.mjs';
async function fixture(t){const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-port-preferences-'));t.after(async()=>{const relative=path.relative(os.tmpdir(),path.resolve(dir));assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));await fs.rm(dir,{recursive:true,force:true});});return{dir,file:path.join(dir,'data','ports.json')};}
async function server(t){const server=http.createServer((req,res)=>res.end('unrelated'));await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});t.after(()=>new Promise(resolve=>{server.close(resolve);server.closeAllConnections?.();}));return{server,port:server.address().port,url:'http://127.0.0.1:'+server.address().port};}
test('cache stores only actual allowlisted ports and atomically replaces valid previous preferences',async t=>{
 const f=await fixture(t),first={portal:41001,workbench:41002,offline:41003,token:'NEVER_WRITE_THIS',controlUrl:'NEVER_WRITE_THIS'};await savePortPreferences(f.file,first);assert.deepEqual(await readPortPreferences(f.file),{portal:41001,workbench:41002,offline:41003});const raw=await fs.readFile(f.file,'utf8');assert.ok(!raw.includes('NEVER_WRITE_THIS'));assert.deepEqual(Object.keys(JSON.parse(raw)).sort(),['format','ports']);
 await savePortPreferences(f.file,{portal:42001,workbench:42002,offline:42003});assert.deepEqual(await readPortPreferences(f.file),{portal:42001,workbench:42002,offline:42003});assert.deepEqual(await fs.readdir(path.dirname(f.file)),['ports.json']);
});
test('missing malformed oversized and unsupported optional caches do not block automatic selection',async t=>{
 const f=await fixture(t);assert.deepEqual(await readPortPreferences(f.file),{});await fs.mkdir(path.dirname(f.file),{recursive:true});
 for(const text of ['{ malformed',JSON.stringify({format:'future',ports:{workbench:41000}}),'x'.repeat(5000)]){await fs.writeFile(f.file,text);assert.deepEqual(await readPortPreferences(f.file),{});}
 await fs.writeFile(f.file,JSON.stringify({format:PORT_CACHE_FORMAT,ports:{portal:-1,workbench:41000,offline:'42000',token:'NOT_A_PORT'}}));assert.deepEqual(await readPortPreferences(f.file),{workbench:41000});const port=await selectPort();assert.ok(port>0);
});
test('available remembered automatic port is reused exactly',async()=>{
 const remembered=await selectPort();assert.equal(await selectPort({preferred:remembered,name:'workbench'}),remembered);assert.equal(await selectPort({setting:0,preferred:remembered,name:'workbench'}),remembered);
});
test('busy remembered automatic port falls back while the unrelated service stays available',async t=>{
 const unrelated=await server(t),chosen=await selectPort({preferred:unrelated.port,name:'workbench'});assert.notEqual(chosen,unrelated.port);assert.equal(await fetch(unrelated.url).then(r=>r.text()),'unrelated');const listener=net.createServer();await new Promise((resolve,reject)=>{listener.once('error',reject);listener.listen(chosen,'127.0.0.1',resolve);});await new Promise(resolve=>listener.close(resolve));
});
test('valid explicit port overrides the cache and an occupied explicit port fails without reassignment',async t=>{
 const preferred=await selectPort(),explicit=await selectPort({avoid:[preferred]});assert.equal(await selectPort({setting:String(explicit),preferred,name:'portal'}),explicit);const unrelated=await server(t);await assert.rejects(()=>selectPort({setting:unrelated.port,preferred,name:'portal'}),/Configured portal port .* unavailable/);assert.equal(await fetch(unrelated.url).then(r=>r.text()),'unrelated');
});
test('automatic allocations avoid selected ports and invalid settings fail with actionable input guidance',async()=>{
 const remembered=await selectPort(),next=await selectPort({preferred:remembered,avoid:[remembered]});assert.notEqual(next,remembered);await assert.rejects(()=>selectPort({setting:remembered,avoid:[remembered],name:'offline'}),/Configured offline port/);
 for(const input of [-1,65536,4.2,'abc',true,{},[]])assert.throws(()=>configuredPort(input,'workbench'),/Invalid workbench port/);for(const input of [undefined,null,'',0,'0'])assert.equal(configuredPort(input),0);
});
test('a non-file cache target fails honestly without deleting its contents or leaving temporary files',async t=>{
 const f=await fixture(t);await fs.mkdir(f.file,{recursive:true});await fs.writeFile(path.join(f.file,'keep.txt'),'Keep this user file');await assert.rejects(()=>savePortPreferences(f.file,{portal:41001,workbench:41002,offline:41003}),/Cannot save automatic service ports/);assert.equal(await fs.readFile(path.join(f.file,'keep.txt'),'utf8'),'Keep this user file');assert.deepEqual(await fs.readdir(path.dirname(f.file)),['ports.json']);
});
test('invalid actual port values are rejected before preference storage is created',async t=>{
 const f=await fixture(t);await assert.rejects(()=>savePortPreferences(f.file,{portal:0,workbench:41002,offline:41003}),/invalid portal port/);assert.equal(await fs.stat(path.dirname(f.file)).catch(()=>null),null);
});
test('Windows read-only cache replacement leaves the old valid cache intact on failure',{skip:process.platform!=='win32'},async t=>{
 const f=await fixture(t),first={portal:41001,workbench:41002,offline:41003};await savePortPreferences(f.file,first);await fs.chmod(f.file,0o444);try{await assert.rejects(()=>savePortPreferences(f.file,{portal:42001,workbench:42002,offline:42003}),/Cannot save automatic service ports/);assert.deepEqual(await readPortPreferences(f.file),first);assert.deepEqual(await fs.readdir(path.dirname(f.file)),['ports.json']);}finally{await fs.chmod(f.file,0o600);}
});
