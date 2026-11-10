import assert from 'node:assert/strict';
import {test} from 'node:test';
import fs from 'node:fs/promises';
import {BoundedCache} from '../../src/global/helpers/bounded-cache.mjs';
import cache from '../../src/backend/storage/cache.mjs';
import driver from '../../src/global/jsonata/driver.mjs';
import {Parser} from '../../src/global/manifest/parser3/index.mjs';
import {createSmartantsCompute} from '../../src/frontend/helpers/smartantsCompute.ts';
test('LRU preserves falsy values, coalesces misses and retries rejection',async()=>{
 const c=new BoundedCache(2);let calls=0;
 for(const v of [false,0,'',null,undefined]){c.clear();const get=()=>c.pull('x',async()=>{calls++;return v;});const before=calls;await Promise.all([get(),get(),get()]);assert.equal(await get(),v);assert.equal(calls-before,1);}
 c.clear();c.set('a',1);c.set('b',2);await c.pull('a');c.set('c',3);assert.equal(c.values.has('b'),false);
 await assert.rejects(c.pull('bad',()=>{throw Error('bad');}));assert.equal(await c.pull('bad',()=>5),5);
});
test('clear during a miss does not restore stale values; move handles falsy',async()=>{
 const c=new BoundedCache();let finish;const old=c.pull('x',()=>new Promise(r=>finish=r));await Promise.resolve();c.clear();finish(1);await old;assert.equal(c.values.has('x'),false);c.set('a',false);c.move('a','b');assert.equal(c.values.has('a'),false);assert.equal(await c.pull('b'),false);
});
test('backend cache retains false and coalesces file/memory misses',async()=>{
 let calls=0;const key='regression-'+Date.now();const get=()=>cache.pullFromDataCache('tests',key,async()=>{calls++;await new Promise(r=>setTimeout(r,5));return false;});
 assert.deepEqual(await Promise.all([get(),get(),get()]),[false,false,false]);assert.equal(await get(),false);assert.equal(calls,1);
});
test('AJV cache follows schema content and same $id revisions; errors unchanged',async()=>{
 assert.equal(await driver.expression('($v := $jsonschema(true); $v($))',null,{}).evaluate({}),true);
 assert.notEqual(await driver.expression('($v := $jsonschema(false); $v($))',null,{}).evaluate({}),true);
 const schema={$id:'same',type:'object',properties:{n:{type:'integer',minimum:0}},required:['n']};
 const check=()=>driver.expression('($v := $jsonschema($params.schema); $v($))',null,{schema});
 assert.equal(await check().evaluate({n:1}),true);const errors=await check().evaluate({n:-1});assert.equal(errors[0].keyword,'minimum');
 schema.properties.n.minimum=2;assert.notEqual(await check().evaluate({n:1}),true);assert.equal(await check().evaluate({n:3}),true);
 for(let i=0;i<120;i++){schema.properties.n.minimum=i;assert.equal(await check().evaluate({n:200}),true);}
});
test('file serialization retains null and empty strings',()=>{
 for(const value of [null,'',false,0,'hello'])assert.deepEqual(cache.cacheToObject(cache.objectToCache(value)),value);
});
test('SmartAnts cache isolates width/data, shares in-flight tasks, retries errors',async()=>{
 let calls=0;let fail=false;
 const worker={onmessage:null,postMessage(m){calls++;queueMicrotask(()=>worker.onmessage({data:{queryID:m.queryID,result:fail?'ERROR':'OK',error:'bad',graph:{width:m.params.availableWidth,n:m.params.n}}}));}};
 const compute=createSmartantsCompute({isPlugin:()=>false,isSmartantsInPlugin:()=>false,smartantsMode:()=> 'front',worker,readCache:()=>null,newQueryId:()=>String(calls),computeInPlugin:async()=>({}),computeInBackend:async()=>({})});
 const [first,second]=await Promise.all([compute({n:1},800),compute({n:1},800)]);assert.equal(calls,1);first.width=123;assert.equal(second.width,800);assert.equal((await compute({n:1},800)).width,800);assert.equal(calls,1);
 assert.deepEqual(await compute({n:1},900),{width:900,n:1});await compute({n:2},800);assert.equal(calls,3);
 fail=true;await assert.rejects(compute({n:3},800));fail=false;await compute({n:3},800);assert.equal(calls,5);
 for(let i=10;i<50;i++)await compute({n:i},800);const before=calls;await compute({n:1},800);assert.equal(calls,before+1);
});
test('imports respect concurrency, terminate cycles and report duplicate URI',async()=>{
 const p=new Parser({importConcurrency:3});let active=0,peak=0;const counts={};
 p.onPullSource=async(uri)=>{counts[uri]=(counts[uri]||0)+1;active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));active--;return {data:uri.endsWith('root.yaml')?{imports:['root.yaml',...Array.from({length:20},(_,i)=>`n${i}.yaml`)]}:uri.endsWith('n0.yaml')?{imports:['n1.yaml']}:{}};};
 const tree=await p.loadSourceTree({uri:'https://test/root.yaml'});assert.equal(Object.keys(tree.sources).length,21);assert.ok(peak<=3);assert.ok(Object.values(counts).every(n=>n===1));assert.ok(Object.keys(p.errors).length>0);
 assert.ok(!tree.sources['https://test/root.yaml'].imports.includes('https://test/root.yaml'));
});
