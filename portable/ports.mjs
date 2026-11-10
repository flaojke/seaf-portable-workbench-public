import fs from 'node:fs/promises';
import path from 'node:path';
import net from 'node:net';
import crypto from 'node:crypto';

export const PORT_CACHE_FORMAT='seaf-port-preferences-v1';
const names=['portal','workbench','offline'];
const validPort=value=>Number.isInteger(value)&&value>=1&&value<=65535;
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
/** A cache is only a hint. Its contents and parse errors are never logged. */
export async function readPortPreferences(file){
  try{
    const stat=await fs.lstat(file);
    if(!stat.isFile()||stat.isSymbolicLink()||stat.size>4096)return {};
    const parsed=JSON.parse(await fs.readFile(file,'utf8'));
    if(!parsed||parsed.format!==PORT_CACHE_FORMAT||!parsed.ports||typeof parsed.ports!=='object'||Array.isArray(parsed.ports))return {};
    return Object.fromEntries(names.filter(name=>validPort(parsed.ports[name])).map(name=>[name,parsed.ports[name]]));
  }catch{return {};}
}
export function configuredPort(value,name='service'){
  if(value===undefined||value===null||value==='')return 0;
  if(!['number','string'].includes(typeof value))throw Error('Invalid '+name+' port: use 0 for automatic or an integer from 1 to 65535');
  const port=Number(value);
  if(!Number.isInteger(port)||port<0||port>65535)throw Error('Invalid '+name+' port: use 0 for automatic or an integer from 1 to 65535');
  return port;
}
async function probe(port){
  const server=net.createServer();
  return new Promise((resolve,reject)=>{
    server.once('error',error=>{if(['EADDRINUSE','EACCES'].includes(error.code))resolve(null);else reject(error);});
    server.listen({host:'127.0.0.1',port,exclusive:true},()=>{const selected=server.address().port;server.close(error=>error?reject(error):resolve(selected));});
  });
}
/** Never adopts or stops an existing service. Explicit occupied ports fail. */
export async function selectPort({setting,preferred,name='service',avoid=[]}={}){
  const explicit=configuredPort(setting,name),excluded=new Set(avoid);
  if(explicit){
    if(excluded.has(explicit)||await probe(explicit)===null)throw Error('Configured '+name+' port '+explicit+' is unavailable. Free that port or set '+name+'Port to 0 for automatic selection.');
    return explicit;
  }
  if(validPort(preferred)&&!excluded.has(preferred)&&await probe(preferred)!==null)return preferred;
  for(let attempt=0;attempt<12;attempt++){
    const port=await probe(0);
    if(validPort(port)&&!excluded.has(port))return port;
  }
  throw Error('No free loopback port could be selected for '+name);
}
/** Atomic replace of a small allowlisted file, excluding tokens and runtime URLs. */
export async function savePortPreferences(file,ports){
  for(const name of names)if(!validPort(ports?.[name]))throw Error('Cannot remember invalid '+name+' port');
  const parent=path.dirname(file),temp=path.join(parent,'.ports-'+crypto.randomUUID()+'.tmp');
  let handle;
  try{
    await fs.mkdir(parent,{recursive:true});
    const previous=await fs.lstat(file).catch(error=>{if(error.code!=='ENOENT')throw error;return null;});
    if(previous&&(!previous.isFile()||previous.isSymbolicLink()))throw Error('Port cache must be a regular file');
    const payload={format:PORT_CACHE_FORMAT,ports:Object.fromEntries(names.map(name=>[name,ports[name]]))};
    handle=await fs.open(temp,'wx',0o600);
    await handle.writeFile(JSON.stringify(payload,null,2)+'\n');await handle.sync();await handle.close();handle=null;
    const deadline=Date.now()+1000;
    for(;;){try{await fs.rename(temp,file);break;}catch(error){if(!['EPERM','EBUSY','EACCES'].includes(error.code)||Date.now()>=deadline)throw error;await wait(30);}}
  }catch(error){
    throw Error('Cannot save automatic service ports in data/ports.json. Check write access and retry. '+(error.code||error.message),{cause:error});
  }finally{
    await handle?.close().catch(()=>{});
    await fs.rm(temp,{force:true}).catch(()=>{});
  }
}
