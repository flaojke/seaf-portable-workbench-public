import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
const exec=promisify(execFile),here=path.dirname(fileURLToPath(import.meta.url));
export const runtimeInputs=JSON.parse(await fs.readFile(path.join(here,'inputs.json'),'utf8'));
export async function prepareRuntime({cacheRoot=path.join(here,'cache/runtime'),destination,allowDownload=true}={}) {
  if(process.platform!=='win32'||process.arch!=='x64')throw Error('The release builder requires Windows x64');
  await fs.mkdir(cacheRoot,{recursive:true});
  for(const [name,pin] of Object.entries(runtimeInputs).filter(([key])=>key!=='platform')){
    const archive=path.join(cacheRoot,path.basename(new URL(pin.url).pathname));
    let bytes=await fs.readFile(archive).catch(error=>{if(error.code!=='ENOENT')throw error;});
    if(!bytes){
      if(!allowDownload)throw Error('Missing pinned runtime archive: '+archive);
      const response=await fetch(pin.url);if(!response.ok)throw Error('Runtime download failed '+response.status+': '+pin.url);
      bytes=Buffer.from(await response.arrayBuffer());
    }
    const actual=crypto.createHash('sha256').update(bytes).digest('hex');
    if(actual!==pin.sha256)throw Error('Runtime checksum mismatch: '+name+' expected '+pin.sha256+' actual '+actual);
    await fs.writeFile(archive,bytes);
    const unpacked=path.join(cacheRoot,name+'-'+pin.version);
    const marker=path.join(unpacked,'.seaf-extracted');
    if(!(await fs.stat(marker).catch(()=>null))){
      await fs.mkdir(unpacked,{recursive:true});
      await exec('powershell.exe',['-NoProfile','-ExecutionPolicy','Bypass','-File',path.join(here,'extract.ps1'),'-Archive',archive,'-Destination',unpacked],{windowsHide:true,timeout:180000,maxBuffer:1e6});
      await fs.writeFile(marker,pin.sha256);
    }
    const source=pin.archiveDirectory?path.join(unpacked,pin.archiveDirectory):unpacked;
    if(destination)await fs.cp(source,path.join(destination,name),{recursive:true,filter:file=>!file.endsWith('.seaf-extracted')});
  }
  const nodeRoot=path.join(cacheRoot,'node-'+runtimeInputs.node.version,runtimeInputs.node.archiveDirectory);
  const gitRoot=path.join(cacheRoot,'git-'+runtimeInputs.git.version);
  return {nodeRoot,gitRoot,node:path.join(nodeRoot,'node.exe'),npm:path.join(nodeRoot,'node_modules/npm/bin/npm-cli.js'),git:path.join(gitRoot,'cmd/git.exe')};
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url))console.log(JSON.stringify(await prepareRuntime()));
