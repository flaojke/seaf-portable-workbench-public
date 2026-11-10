/** Serial supplemental experiment. Run only after the main benchmark series.
 * Reads synthetic fixtures and raw source through the actual native SEAF API;
 * never writes fixture files or production architecture/Git repositories.
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {performance} from 'node:perf_hooks';
import {NativeRuntime} from '../../seaf-mcp/native-runtime.mjs';
import {fixturePlan,FIXTURE_VERSION} from './fixtures.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)),repo=path.resolve(here,'../..');
const args=process.argv.slice(2),arg=(key,fallback)=>{const index=args.indexOf(key);return index<0?fallback:args[index+1];};
const suitePath=path.resolve(arg('--suite',path.join(here,'state/fixtures-1000-3000-v3/fixtures.json')));
const outputArgument=arg('--out');
if(!outputArgument)throw Error('Usage: node source-read.mjs --out <empty-output> [--suite <fixtures.json>] [--samples 3..5]');
const output=path.resolve(outputArgument),samples=Number(arg('--samples',5));
if(!Number.isInteger(samples)||samples<3||samples>5)throw Error('Choose 3, 4 or 5 source-read samples per fixture');
const pins=JSON.parse(await fs.readFile(path.join(repo,'portable/inputs.json'),'utf8'));
const node=path.resolve(process.env.SEAF_BENCH_NODE || arg('--node',path.join(repo,'portable/cache/runtime','node-'+pins.node.version,pins.node.archiveDirectory,'node.exe')));
const coreRoot=path.resolve(process.env.SEAF_BENCH_CORE || arg('--core',path.join(repo,'vendor/seaf-archtool-core')));
const suite=JSON.parse(await fs.readFile(suitePath,'utf8'));
if(suite.format!==FIXTURE_VERSION||suite.synthetic!==true||suite.productionWrites!==false)throw Error('Expected the verified synthetic fixture suite v3');
const sizes=arg('--sizes','1000,3000').split(',').map(Number),layouts=arg('--layouts','baseline,v1,v2,v3,v4,v5,v6').split(',');
const fixtures=suite.fixtures.filter(f=>sizes.includes(f.counts.systems)&&layouts.includes(f.layout));
if(!fixtures.length)throw Error('No matching fixture cases');
const fixtureRoots=fixtures.map(f=>path.resolve(f.root));
for(const fixtureRoot of fixtureRoots){const relative=path.relative(fixtureRoot,output);if(relative===''||(!relative.startsWith('..'+path.sep)&&relative!=='..'&&!path.isAbsolute(relative)))throw Error('Output may not be inside a read-only fixture');}
await fs.mkdir(output,{recursive:true});
if((await fs.readdir(output)).length)throw Error('Output must be empty; existing evidence is not overwritten');
await fs.access(node);await fs.access(path.join(coreRoot,'src/backend/main.mjs'));
const require=createRequire(new URL('../../seaf-mcp/package.json',import.meta.url)),YAML=require('yaml');
const sha=value=>crypto.createHash('sha256').update(value).digest('hex');
const sortedStatistics=values=>{const sorted=values.slice().sort((a,b)=>a-b),middle=Math.floor(sorted.length/2);return {median:sorted.length%2?sorted[middle]:(sorted[middle-1]+sorted[middle])/2,min:sorted[0],max:sorted.at(-1)};};
const selectedComponent='sys00001',modelPath='/components/'+selectedComponent;
const sourceHash=crypto.createHash('md5').update(modelPath,'utf8').digest('hex');
const report={format:'seaf-raw-source-read-v1',status:'running',created:new Date().toISOString(),suite:suitePath,node,coreRoot,
 sourceEndpoint:'/core/storage/'+sourceHash+'/?inlineContent=1',modelPath,samplesPerCase:samples,results:[],
 scope:'Fresh native runtime per synthetic fixture; raw source endpoint only. Individual sample wall time begins after startup and query verification, ends after full decoded body. OS file cache is uncontrolled and source files were already read during model load. No product/fixture mutations.',
 characterDefinition:'JavaScript UTF-16 string.length, matching Engine.read/proposal 500000-character limit; bytes are decoded UTF-8 response bytes, not compressed wire bytes.',
 productionWrites:false};
const receipt=path.join(output,'source-read.json');
const save=()=>fs.writeFile(receipt,JSON.stringify(report,null,2)+'\n');
const runtime=new NativeRuntime({bundleRoot:repo,node,coreRoot,stateRoot:path.join(output,'runtime'),offline:true});
await save();
try{
 for(const fixture of fixtures){
  const row={layout:fixture.layout,N:fixture.counts.systems,integrations:fixture.counts.integrations,root:fixture.root,status:'running',samples:[]};report.results.push(row);await save();
  let running;
  try{
   const plan=fixturePlan(fixture.layout,fixture.settings);
   const definitions=[];
   for(const[file,text]of plan.files){
    if(!/^components:/m.test(text))continue;
    const document=YAML.parse(text);
    if(Object.hasOwn(document?.components||{},selectedComponent))definitions.push({file,text,definition:document.components[selectedComponent]});
   }
   if(definitions.length!==1)throw Error('Expected exactly one defining fixture file for '+selectedComponent+', received '+definitions.length);
   const expected=definitions[0],expectedBytes=Buffer.from(expected.text,'utf8');
   row.artifactsOverMcpTextLimit=[...plan.files].filter(([,text])=>text.length>500000).map(([file,text])=>({file,characters:text.length,bytes:Buffer.byteLength(text)}));
   const onDisk=await fs.readFile(path.join(fixture.root,...expected.file.split('/')));
   if(!onDisk.equals(expectedBytes))throw Error('Source fixture differs from deterministic plan: '+expected.file);
   Object.assign(row,{sourceFile:expected.file,bytes:expectedBytes.byteLength,characters:expected.text.length,readLimit500000Exceeded:expected.text.length>500000,expectedSha256:sha(expectedBytes)});
   running=await runtime.start({workspace:fixture.root,manifest:'workspace/root.yaml'});
   const expression='({"systems":$count($keys(components)),"integrations":$count($keys(integrations)),"title":components.'+selectedComponent+'.title})';
   const queryResponse=await fetch(running.url+'/core/storage/jsonata/'+encodeURIComponent(expression),{signal:AbortSignal.timeout(60000)});
   if(!queryResponse.ok)throw Error('Runtime count verification HTTP '+queryResponse.status);
   const counts=await queryResponse.json();
   if(counts.systems!==fixture.counts.systems||counts.integrations!==fixture.counts.integrations||counts.title!==expected.definition.title)throw Error('Runtime did not load the expected synthetic model: '+JSON.stringify(counts));
   row.runtimeCounts=counts;
   for(let index=0;index<samples;index++){
    const before=performance.now();
    const response=await fetch(running.url+report.sourceEndpoint,{signal:AbortSignal.timeout(60000)});
    const body=Buffer.from(await response.arrayBuffer()),milliseconds=performance.now()-before,contentType=response.headers.get('content-type')||'',text=body.toString('utf8');
    if(!response.ok)throw Error('Raw source HTTP '+response.status+': '+text.slice(0,300));
    if(!/(?:yaml|text\/plain|octet-stream)/i.test(contentType)||/^\s*<(?:!doctype|html)/i.test(text)||!body.equals(expectedBytes))throw Error('Raw source body/type differs from defining YAML: '+contentType+' '+body.byteLength+' bytes');
    row.samples.push({index:index+1,milliseconds,bytes:body.byteLength,characters:text.length,contentType,httpStatus:response.status,exactSourceMatch:true});
   }
   Object.assign(row,sortedStatistics(row.samples.map(sample=>sample.milliseconds)),{status:'passed',runtimeIdentity:running.identity});
  }catch(error){row.status='failed';row.error=error.stack||error.message;process.exitCode=1;}
  finally{if(running)try{await runtime.stop(running.id);}catch(error){row.stopError=error.message;row.status='failed';process.exitCode=1;}await save();}
  console.log(JSON.stringify({layout:row.layout,N:row.N,status:row.status,sourceFile:row.sourceFile,bytes:row.bytes,characters:row.characters,median:row.median,error:row.error}));
 }
 report.status=report.results.every(row=>row.status==='passed')?'passed':'failed';report.completed=new Date().toISOString();
 report.passed=report.results.filter(row=>row.status==='passed').length;report.total=report.results.length;
}finally{await runtime.closeAll();await save();}
console.log(JSON.stringify({status:report.status,passed:report.passed,total:report.total,receipt}));
