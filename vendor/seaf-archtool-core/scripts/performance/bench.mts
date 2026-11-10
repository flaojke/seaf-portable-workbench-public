import {performance} from 'node:perf_hooks';
import fs from 'node:fs/promises';
import cache from '../../src/backend/storage/cache.mjs';
import driver from '../../src/global/jsonata/driver.mjs';
import {Parser} from '../../src/global/manifest/parser3/index.mjs';
import {createSmartantsCompute} from '../../src/frontend/helpers/smartantsCompute.ts';
const results = {};
async function measure(name, fn, rounds = 7) {
  const times = []; let detail;
  for(let i=0;i<rounds;i++){ const start=performance.now(); detail=await fn(i); times.push(performance.now()-start); }
  times.sort((a,b)=>a-b); results[name]={medianMs:times[Math.floor(times.length/2)], minMs:times[0], maxMs:times.at(-1), detail};
}
const schema={type:'object',properties:{name:{type:'string'},age:{type:'integer',minimum:0}},required:['name','age'],additionalProperties:false};
const q=driver.expression('($v := $jsonschema($params.schema); $v($))',null,{schema});
await measure('schema_100',async()=>{for(let i=0;i<100;i++){ if(await q.evaluate({name:'ShopFlow',age:37})!==true)throw Error('validation'); }});
await measure('cache_false_100',async(i)=>{await cache.clearMemoryCache(); let calls=0; for(let j=0;j<100;j++) await cache.pullFromDataCache('bench',`false-${i}`,async()=>{calls++;return false;}); return {calls};});
await measure('cache_concurrent_30',async(i)=>{await cache.clearMemoryCache();let calls=0;await Promise.all(Array.from({length:30},()=>cache.pullFromDataCache('bench',`burst-${i}`,async()=>{calls++;await new Promise(r=>setTimeout(r,10));return {ok:true};})));return {calls};});
const numbers=Array.from({length:5000},(_,i)=>i);
await measure('cache_cpu_30',async(i)=>{await cache.clearMemoryCache();let calls=0;await Promise.all(Array.from({length:30},()=>cache.pullFromDataCache('bench',`cpu-${i}`,async()=>{calls++;return driver.expression('$sum($)',null,{}).evaluate(numbers);})));return {calls};});
await measure('smartants_repeat_20',async()=>{
  let calls=0;
  const worker={onmessage:null,postMessage(m){calls++;setTimeout(()=>worker.onmessage({data:{queryID:m.queryID,result:'OK',graph:{nodes:[1,2]}}}),5);}};
  const compute=createSmartantsCompute({isPlugin:()=>false,isSmartantsInPlugin:()=>false,smartantsMode:()=> 'front',worker,readCache:()=>null,newQueryId:()=>String(calls),computeInPlugin:async()=>({}),computeInBackend:async()=>({})});
  for(let i=0;i<20;i++)await compute({modelVersion:'v1',nodes:[1,2]},800);
  return {calls, note:'controlled 5ms worker, not real graph rendering'};
});
await measure('imports_100',async()=>{
  const p=new Parser();let active=0,peak=0,calls=0;
  p.onPullSource=async(uri)=>{calls++;active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,3));active--;return {data:uri.endsWith('root.yaml')?{imports:Array.from({length:100},(_,i)=>`item${i}.yaml`)}:{components:{[uri]:{title:uri}}}};};
  const tree=await p.loadSourceTree({uri:'https://bench.local/root.yaml'});
  if(Object.keys(tree.sources).length!==101)throw Error('missing imports');
  return {calls,peak,note:'controlled 3ms sources'};
});
console.log('BENCH_RESULT '+JSON.stringify({node:process.version,cache:process.env.VUE_APP_DOCHUB_DATALAKE_CACHE,results}));
