/** Rebuild the acceptance map from observed reports; never runs source text. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';

const here=path.dirname(fileURLToPath(import.meta.url));
let workspace=here;
while(true){try{await fs.access(path.join(workspace,'seaf-mcp/projects.json'));await fs.access(path.join(workspace,'openspec/config.yaml'));break;}catch{const parent=path.dirname(workspace);if(parent===workspace)throw Error('SEAF workspace root not found');workspace=parent;}}
const acceptanceRoot=path.join(workspace,'seaf-mcp/state/acceptance');
const baselineFile=path.join(here,'baseline-evidence.json');let previousBytes;
try{previousBytes=await fs.readFile(baselineFile);}catch(error){if(error.code!=='ENOENT')throw error;previousBytes=await fs.readFile(path.join(here,'evidence.json'));await fs.writeFile(baselineFile,previousBytes);}
const previous=JSON.parse(previousBytes.toString('utf8'));
const matrixText=await fs.readFile(path.join(here,'acceptance.md'),'utf8');
const scenarios=[...matrixText.matchAll(/^\|\s*(AC-\d{2}-\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|/gm)].map(m=>({id:m[1],scenario:m[2].trim(),expected:m[3].trim()}));
if(scenarios.length!==72||new Set(scenarios.map(x=>x.id)).size!==72)throw Error('Expected exactly 72 distinct functional scenarios');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const reports={};
async function load(id,relative){const filename=path.join(acceptanceRoot,relative),bytes=await fs.readFile(filename),data=JSON.parse(bytes.toString('utf8'));const rows=data.cases||data.steps||[];if(!data.completed||data.status==='failed'||rows.some(row=>row.status&&row.status!=='passed'))throw Error('Report is incomplete or unsuccessful: '+relative);reports[id]={id,artifact:relative,sha256:sha(bytes),completed:data.completed,rows,data,bytes};return reports[id];}
await load('BACKEND','backend-gates.json');
await load('BROWSER','browser-gates.json');
await load('DRAWIO','drawio-gates/result.json');
await load('AI','ai-gates.json');
await load('LAUNCHER','launcher-gates.json');
await load('E2E','e2e.json');
const externalBytes=await fs.readFile(path.join(acceptanceRoot,'external-agent-review.json'));
const external=JSON.parse(externalBytes.toString('utf8'));
if(external.status!=='passed'||external.mode!=='manual-external-agent'||!external.checked?.factsCited||!external.checked?.sourceFreshAtReview||!external.checked?.inferenceExplicitlyLabelled||external.checked?.unsupportedImplementationClaimed!==false||!external.inferences?.some(x=>x.classification==='inference'))throw Error('External agent review lacks observed inference evidence');
reports.EXTERNAL={id:'EXTERNAL',artifact:'external-agent-review.json',sha256:sha(externalBytes),completed:external.reviewedAt,data:external,bytes:externalBytes};
const byId=new Map(scenarios.map(item=>[item.id,{...item,status:'not-run',evidence:[],note:''}]));
function add(id,evidence,note=''){const item=byId.get(id);if(!item)return;item.evidence.push(evidence);item.status='passed';if(note)item.note+=(item.note?' ':'')+note;}
for(const item of scenarios){const old=previous.acceptance?.[item.id];if(old?.status!=='passed')continue;add(item.id,{layer:'prior-tested-contract',artifact:'baseline-evidence.json',sourceSha256:sha(previousBytes),references:old.evidence||[],detail:old.note||'',source:'Initial verified suite retained alongside additional fault-injection and browser evidence.'});}
for(const [source,report]of Object.entries(reports)){
  if(!report.rows)continue;
  for(const [index,row]of report.rows.entries()){
    if(row.status!=='passed')continue;
    // A static test-created answer contract is not a live LLM response.
    if(source==='AI'&&/external agent inference from a title/i.test(row.name))continue;
    const ids=Array.isArray(row.ac)?row.ac:Array.isArray(row.acs)?row.acs:[row.ac||row.acs].filter(Boolean);
    for(const id of ids)add(id,{layer:source==='BROWSER'||source==='DRAWIO'?'browser-with-isolated-Git-runtime':source==='BACKEND'?'api-and-backend-fault-injection':'isolated-architecture-agent',artifact:'evidence/'+source.toLowerCase()+'.json',report:source,caseIndex:index+1,caseName:row.name,sourceSha256:report.sha256,observedStatus:row.status});
  }
}
add('AC-09-04',{layer:'manual-external-agent-review',artifact:'evidence/external.json',report:'EXTERNAL',sourceSha256:reports.EXTERNAL.sha256,actor:external.actor,reviewedAt:external.reviewedAt,classification:'inference',facts:external.facts.length,inferences:external.inferences.length},'The connected Codex MCP agent supplied a labelled inference with cited facts. The built-in evidence extractor did not call a paid LLM.');
const coverage=[...byId.values()];
const sources=Object.fromEntries(Object.entries(reports).map(([id,report])=>[id,{artifact:'evidence/'+id.toLowerCase()+'.json',originalSource:path.posix.join('seaf-mcp/state/acceptance',report.artifact),sha256:report.sha256,completed:report.completed,cases:report.rows?.length||1,observedStatus:report.data.status||'all-cases-passed',productionWrites:report.data.productionWrites??report.data.productionModelWrites??false}]));
const result={format:'seaf-acceptance-closure-v1',change:'add-architecture-workbench',recordedAt:new Date().toISOString(),clientDate:'2026-11-05',clientTimezone:'Europe/Moscow',scope:'72 functional scenarios. Evidence layers are explicit: browser, unit/API, actual Docker/Git, and a manual external-agent review. This is not a claim that all 72 were manually clicked.',archivePerformed:false,rootPublicationAndArchivePending:true,sources,counts:{total:coverage.length,passed:coverage.filter(x=>x.status==='passed').length,missing:coverage.filter(x=>x.status!=='passed').length},missing:coverage.filter(x=>x.status!=='passed').map(({id,scenario})=>({id,scenario})),coverage};
await fs.mkdir(path.join(here,'evidence'),{recursive:true});
for(const report of Object.values(reports))await fs.writeFile(path.join(here,'evidence',report.id.toLowerCase()+'.json'),report.bytes);
result.receipts=[];
for(const filename of ['backend-gates.tap','final-regression.tap','unit-final.tap'])try{const data=await fs.readFile(path.join(acceptanceRoot,filename)),text=data.toString('utf8'),failures=[...text.matchAll(/^# fail (\d+)\s*$/gm)];if(!/^# tests \d+\s*$/m.test(text)||failures.at(-1)?.[1]!=='0')continue;await fs.writeFile(path.join(here,'evidence',filename),data);result.receipts.push({artifact:'evidence/'+filename,originalSource:'seaf-mcp/state/acceptance/'+filename,sha256:sha(data)});}catch(error){if(error.code!=='ENOENT')throw error;}
await fs.writeFile(path.join(here,'coverage-all72.json'),JSON.stringify(result,null,2)+'\n');
console.log(JSON.stringify({counts:result.counts,missing:result.missing,reports:Object.keys(sources)}));
