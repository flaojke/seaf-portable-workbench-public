/** Universal documentation publisher. Each mutation is an explicit MCP stage. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath}from'node:url';
import YAML from'yaml';
import{Client}from'@modelcontextprotocol/sdk/client/index.js';
import{StdioClientTransport}from'@modelcontextprotocol/sdk/client/stdio.js';
const here=path.dirname(fileURLToPath(import.meta.url)),base=path.dirname(here);
const [mode='propose',project,docsFile='docs.yaml']=process.argv.slice(2);
if(!project||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,100}$/.test(project))throw Error('Usage: node publish-documentation.mjs propose|inspect|validate|apply <registered-project-id> [docs.yaml]');
const directory=path.resolve(process.env.SEAF_MCP_STATE||path.join(base,'state'),'documentation-publications');
await fs.mkdir(directory,{recursive:true});
const receipt=path.join(directory,project+'.json'),client=new Client({name:'seaf-documentation-publisher',version:'2.3.0'});
const call=async(name,args={})=>{const r=await client.callTool({name,arguments:args},undefined,{timeout:180000});if(r.isError)throw Error(r.content.find(c=>c.type==='text')?.text||'MCP request failed');return JSON.parse(r.content.find(c=>c.type==='text').text);};
try{
 await client.connect(new StdioClientTransport({command:process.execPath,args:[path.join(base,'server.mjs')],stderr:'inherit'}));
 const projects=await call('list_projects'),registration=projects.find(p=>p.id===project);
 if(!registration)throw Error('Unknown registered project');
 if(mode==='propose'){
  if(!registration.writable)throw Error('Read-only project');
  const read=await call('read_artifact',{project,path:docsFile}),doc=YAML.parseDocument(read.content);
  if(doc.errors.length)throw Error('Invalid documentation YAML');
  const manifest=JSON.parse(await fs.readFile(path.join(here,'documentation/docs-manifest.json'),'utf8'));
  const selected=(process.env.SEAF_DOC_IDS||'').split(',').map(id=>id.trim()).filter(Boolean);
  if(selected.some(id=>!manifest.some(page=>page.id===id)))throw Error('Unknown selected documentation page');
  const pages=selected.length?manifest.filter(page=>selected.includes(page.id)):manifest,changes=[];
  for(const page of pages){
   try{await call('read_artifact',{project,path:page.source});}catch(e){if(!/ENOENT|no such file/i.test(e.message))throw e;}
   doc.setIn(['docs',page.id],{title:page.title,location:page.location,type:'markdown',toc:true,source:page.source});
   changes.push({path:page.source,content:await fs.readFile(path.join(here,'documentation',page.relativeMarkdown),'utf8')});
  }
  doc.setIn(['docs','local.projects.workspace'],{title:'Проекты',location:'/Проекты/Управление проектами',type:'lsv-workbench',view:'projects'});
  doc.setIn(['docs','local.editor.workspace'],{title:'Редактор',location:'/Редактор/Объекты и потоки',type:'lsv-workbench',view:'editor'});
  doc.setIn(['docs','local.home.workspace'],{title:'Моя работа',location:'/Моя работа/Обзор',type:'lsv-workbench',view:'home'});
  doc.setIn(['docs','local.composer.workspace'],{title:'Конструктор схем',location:'/Схемы/Конструктор',type:'lsv-workbench',view:'composer'});
  doc.setIn(['docs','local.scenarios.workspace'],{title:'Сценарии взаимодействия',location:'/Схемы/Сценарии взаимодействия',type:'lsv-workbench',view:'scenarios'});
  changes.unshift({path:docsFile,content:doc.toString()});
  const proposal=await call('propose_change',{project,message:process.env.SEAF_DOC_MESSAGE||'Update SEAF workbench documentation',changes});
  await fs.writeFile(receipt,JSON.stringify({project,proposal},null,2));
  console.log(JSON.stringify({proposalId:proposal.proposalId,files:changes.map(c=>c.path),diff:proposal.diff,receipt}));
 }else{
  const evidence=JSON.parse(await fs.readFile(receipt,'utf8')),proposal_id=evidence.proposal.proposalId;
  if(mode==='reload'){evidence.reload=await call('reload_project',{project,proposal_id});console.log(JSON.stringify(evidence.reload));}
  else if(mode==='inspect'){evidence.audit=await call('get_proposal',{proposal_id});console.log(JSON.stringify(evidence.audit));}
  else if(mode==='validate'){evidence.validation=await call('validate_change',{proposal_id});console.log(JSON.stringify(evidence.validation));}
  else if(mode==='apply'){if(!evidence.validation?.ok)throw Error('Inspect the diff and validate before apply');evidence.applied=await call('apply_change',{proposal_id});console.log(JSON.stringify(evidence.applied));}
  else throw Error('Unknown publication stage');
  await fs.writeFile(receipt,JSON.stringify(evidence,null,2));
 }
}finally{await client.close();}
