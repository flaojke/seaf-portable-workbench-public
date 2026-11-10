import {Worker} from 'node:worker_threads';
import {performance} from 'node:perf_hooks';
import {createSmartantsCompute} from '../../src/frontend/helpers/smartantsCompute.ts';
const raw=new Worker(new URL('../../src/assets/libs/smartants.cjs', import.meta.url));
let calls=0;
const worker={onmessage:null,postMessage(m){calls++;raw.postMessage(m);}};
raw.on('message',data=>worker.onmessage?.({data}));
raw.on('error',error=>{console.error(error);process.exit(1);});
const compute=createSmartantsCompute({isPlugin:()=>false,isSmartantsInPlugin:()=>false,smartantsMode:()=> 'front',worker,readCache:()=>null,newQueryId:()=>String(calls),computeInPlugin:async()=>({}),computeInBackend:async()=>({})});
const nodes=Object.fromEntries(Array.from({length:40},(_,i)=>['n'+i,{title:'Service '+i,symbol:'component',entity:'component'}]));
const params={nodes,links:Array.from({length:39},(_,i)=>({from:'n'+i,to:'n'+(i+1),title:'REST',direction:'-->'})),grid:{},styles:{},trackWidth:10,distance:80,direction:'LR',height:0,symbols:{'$landscape':{width:100,height:50},component:{width:150,height:60},rectangle:{width:150,height:60}},limitHeight:100,wrap:0,isDebug:false};
try{
 await compute(params,1000);
 const times=[];const before=calls;
 for(let i=0;i<20;i++){const start=performance.now();const result=await compute(params,1000);if(!result)throw Error('empty');times.push(performance.now()-start);}
 times.sort((a,b)=>a-b);console.log('REAL_SMARTANTS '+JSON.stringify({nodes:40,links:39,medianMs:times[10],p95Ms:times[18],workerCalls:calls-before}));
}finally{await raw.terminate();}
