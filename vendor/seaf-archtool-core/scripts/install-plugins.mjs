// Cross-platform replacement for the upstream shell find/cp postinstall.
// Plugin lockfiles are required; no Git hooks or shell commands are installed.
import fs from 'node:fs/promises';
import path from 'node:path';
import {spawn} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const npm=process.env.npm_execpath || process.argv[2];
if(!npm)throw Error('Invoke with npm or pass the absolute npm-cli.js path');
for(const entry of await fs.readdir(path.join(root,'plugins'),{withFileTypes:true})){
  if(!entry.isDirectory())continue;
  const cwd=path.join(root,'plugins',entry.name);
  const pkg=await fs.readFile(path.join(cwd,'package.json'),'utf8').then(JSON.parse).catch(e=>{if(e.code!=='ENOENT')throw e;});
  if(!pkg || !Object.keys(pkg.dependencies||{}).length)continue;
  await fs.access(path.join(cwd,'package-lock.json'));
  console.log('Installing locked plugin dependencies: '+entry.name);
  const child=spawn(process.execPath,[npm,'ci','--ignore-scripts','--no-audit','--no-fund'],{cwd,env:process.env,stdio:'inherit',windowsHide:true});
  await new Promise((resolve,reject)=>{child.on('error',reject);child.on('exit',code=>code===0?resolve():reject(Error('Plugin dependency install failed: '+entry.name+' ('+code+')')));});
}
