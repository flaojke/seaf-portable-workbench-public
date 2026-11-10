import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const config=path.join(root,'data/projects.json');
await fs.access(config).catch(()=>{throw Error('Run Start.cmd once to initialize the portable project registry');});
Object.assign(process.env,{SEAF_PORTABLE_ROOT:root,SEAF_PROJECTS_CONFIG:config,SEAF_MCP_STATE:path.join(root,'data/state'),SEAF_SPEC_ROOT:path.join(root,'openspec'),SEAF_GIT:path.join(root,'runtime/git/cmd/git.exe')});
process.env.PATH=[path.join(root,'runtime/node'),path.join(root,'runtime/git/cmd'),path.join(root,'runtime/git/ucrt64/bin'),path.join(root,'runtime/git/usr/bin'),process.env.SystemRoot?path.join(process.env.SystemRoot,'System32'):''].filter(Boolean).join(path.delimiter);
const running=await fs.readFile(path.join(root,'data/run.json'),'utf8').then(JSON.parse).catch(()=>null);
if(running){process.env.SEAF_OFFLINE_URL=running.offlineUrl;process.env.SEAF_WORKBENCH_URL=running.workbenchUrl;process.env.SEAF_DRAWIO_URL=running.offlineUrl+'/?embed=1&proto=json&offline=1';}
await import(pathToFileURL(path.join(root,'app/seaf-mcp/server.mjs')).href);
