import {parentPort,workerData} from 'node:worker_threads';
import jsonata from 'jsonata';
try{parentPort.postMessage({result:await jsonata(workerData.query).evaluate(workerData.model)});}catch(e){parentPort.postMessage({error:e.message||e.code});}
