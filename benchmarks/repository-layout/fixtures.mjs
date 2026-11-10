/** Deterministic synthetic models for import-layout comparisons.
 * No SEAF service, production repository, Git history or remote URL is changed.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Engine} from '../../seaf-mcp/engine.mjs';

const require=createRequire(new URL('../../seaf-mcp/package.json',import.meta.url));
const YAML=require('yaml');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
export const FIXTURE_VERSION='seaf-repository-layout-v3';
export const REGISTRY_SOURCE='([components.$spread().($id:=$keys()[0];$v:=$lookup($,$id);{"id":$id,"title":$v.title,"owner":$v.owner,"link":"/entities/components/blank?dh-component-id="&$id})]^(id))';
export const LAYOUTS=Object.freeze([
  {id:'baseline',title:'Two monolithic typed files',pair:null},
  {id:'v1',title:'Flat per-system files through systems head; monolithic integrations',pair:'systems-depth'},
  {id:'v2',title:'Flat per-system files imported directly; monolithic integrations',pair:'systems-depth'},
  {id:'v3',title:'Per-system folders; both typed files imported directly',pair:'both-types-depth'},
  {id:'v4',title:'Per-system folders through global typed heads',pair:'both-types-depth'},
  {id:'v5',title:'Per-system folders with their own root manifests',pair:null},
  {id:'v6',title:'Domain groups with root manifests and packed typed files',pair:null},
]);
const systemId=index=>'sys'+String(index+1).padStart(5,'0');
const integrationId=index=>'int'+String(index+1).padStart(6,'0');
const canonical=value=>Array.isArray(value)?value.map(canonical):value&&typeof value==='object'?Object.fromEntries(Object.keys(value).sort().map(key=>[key,canonical(value[key])])):value;
export const modelHash=model=>sha(JSON.stringify(canonical(model)));
const yaml=value=>YAML.stringify(value,{indent:2,lineWidth:0});
function validateOptions({systems=1000,integrations=systems*3,seed='seaf-layout-2026',groupSize=20}={}){
  if(!Number.isInteger(systems)||systems<2||systems>100000)throw Error('systems must be an integer from 2 through 100000');
  if(!Number.isInteger(integrations)||integrations<systems||integrations>systems*100)throw Error('integrations must be an integer from systems through systems*100; no empty typed padding files');
  if(typeof seed!=='string'||!seed||seed.length>256)throw Error('seed must be a non-empty string up to 256 characters');
  if(!Number.isInteger(groupSize)||groupSize<1||groupSize>10000)throw Error('groupSize must be an integer from 1 through 10000');
  return {systems,integrations,seed,groupSize};
}

export function generateModel(options={}){
  const settings=validateOptions(options),{systems,integrations,seed}=settings;
  const seedNumber=Number.parseInt(sha(seed).slice(0,8),16),teams=['Platform','Commerce','Logistics'];
  const components={},connections={};
  for(let i=0;i<systems;i++)components[systemId(i)]={title:'Система '+String(i+1).padStart(5,'0'),entity:'system',owner:teams[(i+seedNumber)%teams.length],description:'Синтетическая система для сравнения структуры репозитория. Не данные пользователя. Набор '+sha(seed).slice(0,12)+'.',links:[]};
  for(let i=0;i<integrations;i++){
    const sourceIndex=i%systems,ordinal=Math.floor(i/systems),from=systemId(sourceIndex),to=systemId((sourceIndex+1+(ordinal%(systems-1)))%systems),id=integrationId(i),protocol=['HTTPS','AMQP','gRPC'][(ordinal+seedNumber)%3];
    const connection={title:'Поток '+String(i+1).padStart(6,'0'),from,to,protocol,dataClassification:ordinal%3===0?'internal':'public'};
    connections[id]=connection;
    components[from].links.push({id:to,title:connection.title,protocol,integration:id,direction:'-->',dataClassification:connection.dataClassification});
  }
  const model={
    components,integrations:connections,
    contexts:{
      'bench.full':{title:'Все синтетические системы',location:'Синтетический стенд/Все системы',components:Object.keys(components),presentation:'smartants','extra-links':false},
      'bench.focus':{title:'Первые 50 синтетических систем',location:'Синтетический стенд/Фокус 50',components:Object.keys(components).slice(0,50),presentation:'smartants','extra-links':false},
    },
    docs:{'bench.registry':{title:'Реестр синтетических систем',type:'table',location:'Синтетический стенд/Реестр систем',headers:[{value:'title',text:'Система',link:'link'},{value:'owner',text:'Владелец'},{value:'id',text:'ID'}],source:REGISTRY_SOURCE}},
    catalogs:{teams:{values:Object.fromEntries(teams.map(team=>[team,{title:team}]))}},
    entities:{integrations:{title:'Синтетические интеграции',objects:{integration:{route:'/',title:'Интеграция'}},schema:{type:'object',patternProperties:{'^int[0-9]+$':{type:'object',properties:{title:{type:'string'},from:{type:'string'},to:{type:'string'},protocol:{type:'string',enum:['HTTPS','AMQP','gRPC']},dataClassification:{type:'string'}},required:['title','from','to','protocol'],additionalProperties:false}},additionalProperties:false}}},
  };
  return {settings,model,sha256:modelHash(model),sectionHashes:Object.fromEntries(Object.entries(model).map(([section,value])=>[section,modelHash(value)]))};
}

/** Return an ordered in-memory file plan. Paths and file order never depend on OS enumeration. */
export function fixturePlan(layout,options={}){
  if(!LAYOUTS.some(item=>item.id===layout))throw Error('Unknown layout: '+layout);
  const generated=generateModel(options),{settings,model}=generated,files=new Map(),rootImports=['common.yaml'];
  const add=(file,data)=>{if(files.has(file))throw Error('Duplicate fixture file '+file);files.set(file,yaml(data));};
  const ids=Object.keys(model.components),bySource=new Map(ids.map(id=>[id,{}]));
  for(const[id,connection]of Object.entries(model.integrations))bySource.get(connection.from)[id]=connection;
  const common=Object.fromEntries(Object.entries(model).filter(([section])=>!['components','integrations'].includes(section)));
  add('common.yaml',common);
  const systemHead=[],integrationHead=[];
  if(layout==='baseline'){
    add('systems.yaml',{components:model.components});add('integrations.yaml',{integrations:model.integrations});rootImports.push('systems.yaml','integrations.yaml');
  }else if(['v1','v2'].includes(layout)){
    for(const id of ids){const file='systems/'+id+'.yaml';add(file,{components:{[id]:model.components[id]}});systemHead.push(file);}
    add('integrations.yaml',{integrations:model.integrations});
    if(layout==='v1'){add('systems.yaml',{imports:systemHead});rootImports.push('systems.yaml');}else rootImports.push(...systemHead);
    rootImports.push('integrations.yaml');
  }else if(['v3','v4','v5'].includes(layout)){
    for(const id of ids){
      const folder='systems/'+id,systemFile=folder+'/systems.yaml',integrationFile=folder+'/integrations.yaml';
      add(systemFile,{components:{[id]:model.components[id]}});add(integrationFile,{integrations:bySource.get(id)});
      if(layout==='v3')rootImports.push(systemFile,integrationFile);
      else if(layout==='v4'){systemHead.push(systemFile);integrationHead.push(integrationFile);}
      else{add(folder+'/root.yaml',{imports:['systems.yaml','integrations.yaml']});rootImports.push(folder+'/root.yaml');}
    }
    if(layout==='v4'){add('systems.yaml',{imports:systemHead});add('integrations.yaml',{imports:integrationHead});rootImports.push('systems.yaml','integrations.yaml');}
  }else{
    for(let start=0;start<ids.length;start+=settings.groupSize){
      const group=ids.slice(start,start+settings.groupSize),folder='domains/domain'+String(Math.floor(start/settings.groupSize)+1).padStart(4,'0'),components={},integrations={};
      for(const id of group){components[id]=model.components[id];Object.assign(integrations,bySource.get(id));}
      add(folder+'/systems.yaml',{components});add(folder+'/integrations.yaml',{integrations});add(folder+'/root.yaml',{imports:['systems.yaml','integrations.yaml']});rootImports.push(folder+'/root.yaml');
    }
  }
  add('root.yaml',{imports:rootImports});
  return {...generated,layout,files};
}

export function describePlan(plan){
  const parsed=new Map([...plan.files].map(([file,content])=>[file,YAML.parse(content)]));
  let typedFiles=0,systemFiles=0,integrationFiles=0,headFiles=0,importEdges=0,bytes=0,typedBytes=0,maxFileBytes=0;
  const directories=new Set(['']);
  for(const[file,text]of plan.files){
    const object=parsed.get(file),size=Buffer.byteLength(text);bytes+=size;maxFileBytes=Math.max(maxFileBytes,size);
    if(object.components){systemFiles++;typedFiles++;typedBytes+=size;}
    if(object.integrations){integrationFiles++;if(!object.components)typedFiles++;typedBytes+=size;}
    if(object.imports){headFiles++;importEdges+=object.imports.length;}
    let dir=path.posix.dirname(file);while(dir!=='.'){directories.add(dir);dir=path.posix.dirname(dir);}
  }
  const seen=new Set(),visiting=new Set();let maxDepth=0;
  function visit(file,depth){
    if(visiting.has(file))throw Error('Cyclic fixture import '+file);
    if(seen.has(file))throw Error('Duplicate fixture import '+file);
    if(!parsed.has(file))throw Error('Missing fixture import '+file);
    seen.add(file);visiting.add(file);maxDepth=Math.max(maxDepth,depth);
    for(const imported of parsed.get(file).imports||[])visit(path.posix.normalize(path.posix.join(path.posix.dirname(file),imported)),depth+1);
    visiting.delete(file);
  }
  visit('root.yaml',0);
  if(seen.size!==plan.files.size)throw Error('Unreachable fixture files');
  return {format:FIXTURE_VERSION,layout:plan.layout,settings:plan.settings,manifest:'root.yaml',uiEntrypoint:{doc:'bench.registry',path:'/entities/docs/blank?dh-doc-id=bench.registry',kind:'SEAF table'},counts:{systems:Object.keys(plan.model.components).length,integrations:Object.keys(plan.model.integrations).length,componentLinks:Object.values(plan.model.components).reduce((n,c)=>n+c.links.length,0),contexts:Object.keys(plan.model.contexts).length},yamlFiles:plan.files.size,typedFiles,systemFiles,integrationFiles,headFiles,sharedFiles:1,directories:directories.size,importEdges,maxDepth,rootDepth:0,bytes,typedBytes,rootManifestBytes:Buffer.byteLength(plan.files.get('root.yaml')),maxFileBytes,modelSha256:plan.sha256,sectionHashes:plan.sectionHashes,depthDefinition:'root.yaml is depth 0; one import edge increases depth by one; folders do not add import depth',synthetic:true};
}

async function writeFiles(root,files){
  const pending=[...files],directories=new Set([...files.keys()].map(file=>path.dirname(path.join(root,file))));
  for(const directory of directories)await fs.mkdir(directory,{recursive:true});
  for(let start=0;start<pending.length;start+=32)await Promise.all(pending.slice(start,start+32).map(([file,text])=>fs.writeFile(path.join(root,file),text,{flag:'wx'})));
}

export async function createFixture({root,layout='baseline',...options}={}){
  if(typeof root!=='string'||!root.trim())throw Error('An explicit fixture output directory is required');
  root=path.resolve(root);await fs.mkdir(root,{recursive:true});
  if((await fs.readdir(root)).length)throw Error('Fixture output directory must be empty; existing files are never deleted or overwritten');
  const plan=fixturePlan(layout,options),description=describePlan(plan);
  await writeFiles(root,plan.files);
  return {...description,root};
}

/** Read through the same project-local import implementation used by MCP, not a fixture-only merger. */
export async function verifyFixture(description,{stateRoot}={}){
  const root=path.resolve(description.root),parent=stateRoot?path.resolve(stateRoot):path.join(path.dirname(root),'verification'),identity=sha(root).slice(0,16);
  await fs.mkdir(parent,{recursive:true});
  const config=path.join(parent,identity+'.projects.json');
  await fs.writeFile(config,JSON.stringify({projects:[{id:'fixture',root,manifest:'root.yaml',source:{kind:'directory'},writable:false}]}));
  const engine=new Engine(config,path.join(parent,identity+'.state'));
  const built=await engine.model('fixture'),actual=modelHash(built.model),expected=description.modelSha256;
  const counts={systems:Object.keys(built.model.components||{}).length,integrations:Object.keys(built.model.integrations||{}).length,componentLinks:Object.values(built.model.components||{}).reduce((n,c)=>n+(c.links||[]).length,0),contexts:Object.keys(built.model.contexts||{}).length};
  if(actual!==expected)throw Error('Merged model hash mismatch for '+description.layout+': '+actual+' != '+expected);
  if(JSON.stringify(counts)!==JSON.stringify(description.counts))throw Error('Merged model count mismatch');
  if(built.files.length!==description.yamlFiles)throw Error('Not every fixture YAML file was imported exactly once');
  return {ok:true,layout:description.layout,modelSha256:actual,counts,loadedYamlFiles:built.files.length,source:'Engine.model with a temporary read-only directory registration',productionWrites:false};
}

export async function createSuite({root,sizes=[1000,3000],layouts=LAYOUTS.map(item=>item.id),verify=true,seed='seaf-layout-2026',groupSize=20}={}){
  if(typeof root!=='string'||!root.trim())throw Error('An explicit suite output directory is required');
  root=path.resolve(root);await fs.mkdir(root,{recursive:true});
  const fixtures=[];
  for(const systems of sizes)for(const layout of layouts){
    const description=await createFixture({root:path.join(root,String(systems),layout),layout,systems,integrations:systems*3,seed,groupSize});
    const verification=verify?await verifyFixture(description,{stateRoot:path.join(root,'verification')}):undefined;
    fixtures.push({...description,...(verification?{verification}:{})});
  }
  const suite={format:FIXTURE_VERSION,root,synthetic:true,productionWrites:false,fixtures};
  await fs.writeFile(path.join(root,'fixtures.json'),JSON.stringify(suite,null,2)+'\n');
  return suite;
}

if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
  const args=process.argv.slice(2),arg=name=>{const index=args.indexOf(name);return index<0?null:args[index+1];},root=arg('--root');
  if(!root)throw Error('Usage: node fixtures.mjs --root <empty-output> [--systems 1000|3000|10000 | --sizes 1000,3000] [--layout baseline|v1|v2|v3|v4|v5|v6|all]');
  const systems=Number(arg('--systems')||1000),sizes=arg('--sizes')?arg('--sizes').split(',').map(Number):[systems],layout=arg('--layout')||'baseline';
  const suite=await createSuite({root,sizes,layouts:layout==='all'?LAYOUTS.map(item=>item.id):[layout],verify:!args.includes('--no-verify'),groupSize:Number(arg('--group-size')||20),seed:arg('--seed')||'seaf-layout-2026'});
  console.log(JSON.stringify({root:suite.root,fixtures:suite.fixtures.map(({layout,counts,yamlFiles,typedFiles,importEdges,maxDepth,bytes,modelSha256,verification})=>({layout,counts,yamlFiles,typedFiles,importEdges,maxDepth,bytes,modelSha256,verified:verification?.ok??false}))},null,2));
}
