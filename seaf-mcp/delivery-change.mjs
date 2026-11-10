import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {Client} from '@modelcontextprotocol/sdk/client/index.js';
import {StdioClientTransport} from '@modelcontextprotocol/sdk/client/stdio.js';
import YAML from 'yaml';
const here=path.dirname(fileURLToPath(import.meta.url)),task=path.join(here,'state','delivery-task');
await fs.mkdir(task,{recursive:true});
const client=new Client({name:'shopflow-delivery-task',version:'1.0.0'});
const call=async(name,args)=>{const result=await client.callTool({name,arguments:args},undefined, {timeout:120000});if(result.isError)throw Error(result.content[0].text);return JSON.parse(result.content[0].text);};
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(here,'server.mjs')],stderr:'inherit'}));
 const mode=process.argv[2]||'read';
 if(mode==='read'){
  console.log(JSON.stringify(await call('list_projects',{})));
  const files=['architecture/components.yaml','architecture/contexts.yaml','architecture/technologies.yaml','architecture/rules.yaml','docs/overview.md','docs/checkout.md','diagrams/checkout.mmd','docs/decisions.md'];
  const artifacts={};
  for(const file of files){artifacts[file]=(await call('read_artifact',{project:'shopflow',path:file})).content;console.log('\nFILE '+file+'\n'+artifacts[file]);}
  await fs.writeFile(path.join(task,'sources.json'),JSON.stringify(artifacts,null,2));
 }else if(mode==='propose'){
  const changes=JSON.parse(await fs.readFile(path.join(task,'changes.json'),'utf8'));
  const p=await call('propose_change',{project:'shopflow',message:'Add Delivery Service and integrate order fulfilment scenario',changes});
  await fs.writeFile(path.join(task,'proposal.json'),JSON.stringify(p,null,2));await fs.writeFile(path.join(task,'delivery.diff'),p.diff);console.log(p.diff);console.log('PROPOSAL '+p.proposalId);
 }else if(mode==='validate'||mode==='apply'){
  const p=JSON.parse(await fs.readFile(path.join(task,'proposal.json'),'utf8'));
  const result=await call(mode==='validate'?'validate_change':'apply_change',{proposal_id:p.proposalId});
  await fs.writeFile(path.join(task,mode+'.json'),JSON.stringify(result,null,2));console.log(JSON.stringify(result,null,2));
 }else if(mode==='verify'){
  console.log(JSON.stringify(await call('get_entity',{project:'shopflow',section:'components',id:'demo.shop.delivery'}),null,2));
  console.log(JSON.stringify(await call('get_dependencies',{project:'shopflow',id:'demo.shop.delivery'}),null,2));
 }
}finally{await client.close();}
