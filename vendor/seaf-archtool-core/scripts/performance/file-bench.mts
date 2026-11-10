import {performance} from 'node:perf_hooks';
import fs from 'node:fs/promises';
import cache from '../../src/backend/storage/cache.mjs';
await fs.mkdir(process.env.VUE_APP_DOCHUB_DATALAKE_CACHE,{recursive:true});
const payload={nodes:Array.from({length:3000},(_,i)=>({id:i,title:'ShopFlow node '+i,x:i,y:i}))};
const rounds=[];
for(let round=0;round<7;round++){
 const start=performance.now();let lag;
 const tick=new Promise(r=>setTimeout(()=>{lag=performance.now()-start;r();},0));
 for(let i=0;i<50;i++)await cache.pullFromDataCache('file',`${round}-${i}`,async()=>payload);
 const total=performance.now()-start;await tick;rounds.push({totalMs:total,eventLoopDelayMs:lag});
}
rounds.sort((a,b)=>a.totalMs-b.totalMs);console.log('FILE_RESULT '+JSON.stringify({median:rounds[3],rounds}));
