import path from 'node:path';
import fs from 'node:fs/promises';

const map = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const text = value => typeof value === 'string' ? value : '';
const own = (value, key) => Object.hasOwn(map(value), key);
const integer = (value, fallback, min, max) => {
  const n = Number(value ?? fallback);
  if (!Number.isSafeInteger(n) || n < min || n > max) throw Error('Invalid search pagination');
  return n;
};
export function modelObjects(snapshot) {
  const rows = [];
  for (const [section, values] of Object.entries(snapshot.model || {})) {
    if (section === 'imports' || Array.isArray(values)) continue;
    for (const [id, value] of Object.entries(map(values))) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      rows.push({kind:'object', section, id, title:text(value.title || value.name) || id,
        owner:text(value.owner), description:text(value.description),
        path:snapshot.provenance?.[section+'/'+id] || null, value});
    }
  }
  return rows;
}
export function searchObjects(snapshot, query) {
  const q = text(query).trim().toLocaleLowerCase('ru');
  if (!q || q.length > 200) return [];
  const words = q.split(/\s+/).filter(Boolean);
  return modelObjects(snapshot).flatMap(row => {
    const body = [row.id,row.title,row.owner,row.description,row.section].join('\n').toLocaleLowerCase('ru');
    if (!words.every(word => body.includes(word))) return [];
    const score=(row.id.toLocaleLowerCase('ru')===q?100:0)+(row.title.toLocaleLowerCase('ru')===q?80:0)+
      (row.title.toLocaleLowerCase('ru').startsWith(q)?40:0)+(row.id.toLocaleLowerCase('ru').includes(q)?20:0);
    const {value,description,...result}=row;
    return [{...result,score,snippet:description.slice(0,260)}];
  }).sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'ru')||a.id.localeCompare(b.id));
}
function references(value, wanted, prefix='', result=[], budget={left:12000}) {
  if (--budget.left < 0 || result.length >= 100) return result;
  if (typeof value === 'string') {
    let decoded=value;
    try { decoded=decodeURIComponent(value); } catch {}
    if (value===wanted || decoded.split(/[?&=\s()[\]<>"'`]/).includes(wanted)) result.push(prefix);
  } else if (Array.isArray(value)) value.forEach((item,i)=>references(item,wanted,prefix+'['+i+']',result,budget));
  else for (const [key,item] of Object.entries(map(value))) references(item,wanted,prefix?prefix+'.'+key:key,result,budget);
  return result;
}
export function buildPassport(snapshot, section, id) {
  if (!own(snapshot.model?.[section],id)) throw Error('Object not found');
  const value=snapshot.model[section][id];
  if (!value || typeof value!=='object' || Array.isArray(value)) throw Error('Object is not a mapping');
  const rows=modelObjects(snapshot),incoming=[],outgoing=[],docs=[],allReferences=[];
  for (const row of rows) {
    if (row.section===section && row.id===id) continue;
    const fields=references(row.value,id);
    if(fields.length) {
      const item={section:row.section,id:row.id,title:row.title,path:row.path,fields};
      allReferences.push(item);
      if(row.section==='docs')docs.push(item);
      else incoming.push(item);
    }
    const fromSelected=references(value,row.id);
    if(fromSelected.length)outgoing.push({section:row.section,id:row.id,title:row.title,path:row.path,fields:fromSelected});
  }
  const result={section,id,title:text(value.title)||id,value,source:{path:snapshot.provenance?.[section+'/'+id]||null,revision:snapshot.head||null},incoming:incoming.map(r=>({...r,kind:'reference'})),outgoing:outgoing.map(r=>({...r,kind:'reference'})),documents:docs,references:allReferences};
  if(section==='components'){
    const components=map(snapshot.model.components),flows=[];
    for(const [from,component]of Object.entries(components))for(const [index,link]of (Array.isArray(component?.links)?component.links:[]).entries()){
      if(!link||typeof link.id!=='string'||(from!==id&&link.id!==id))continue;
      const peer=from===id?link.id:from;
      flows.push({...link,kind:'flow',section:'components',id:peer,from,to:link.id,title:text(link.title)||'Связь',objectTitle:text(components[peer]?.title)||peer,path:snapshot.provenance?.['components/'+from]||null,fields:['links['+index+']'],unresolved:!own(components,link.id)});
    }
    result.incoming=flows.filter(flow=>flow.to===id);
    result.outgoing=flows.filter(flow=>flow.from===id);
  }
  return result;
}
function resolveParticipant(alias, title, model) {
  const rows=modelObjects({model}).filter(r=>!['docs','contexts','entities','datasets','rules'].includes(r.section));
  const normalize=s=>text(s).trim().toLocaleLowerCase('ru');
  let matches=rows.filter(r=>r.id===alias);
  if(matches.length!==1)matches=rows.filter(r=>normalize(r.title)===normalize(title));
  if(matches.length!==1)matches=rows.filter(r=>normalize(r.id.split('.').at(-1))===normalize(alias));
  return matches.length===1?{section:matches[0].section,id:matches[0].id}: {section:null,id:null};
}
export function parseSequence(source, model={}) {
  if(typeof source!=='string' || source.length>500000)throw Error('Scenario source too large');
  const lines=source.split(/\r?\n/),blocks=[];let current=null,inFence=false,branch='';
  for(const raw of lines) {
    const line=raw.trim();
    if(/^```/.test(line)){inFence=!inFence;if(!inFence&&current){blocks.push(current);current=null;}continue;}
    if(/^sequenceDiagram\b/.test(line)){if(current)blocks.push(current);current={participants:[],steps:[]};branch='';continue;}
    if(!current || /^%%/.test(line) || !line)continue;
    const participant=/^(?:participant|actor)\s+([\p{L}\p{N}_.:-]+)(?:\s+as\s+(.+))?$/u.exec(line);
    if(participant){const alias=participant[1],title=participant[2]||alias;current.participants.push({alias,title,...resolveParticipant(alias,title,model)});continue;}
    const group=/^(alt|else|opt|loop|par|and|critical|break)\s*(.*)$/u.exec(line);
    if(group){branch=[group[1],group[2]].filter(Boolean).join(': ');continue;}
    if(line==='end'){branch='';continue;}
    const arrow=/^([\p{L}\p{N}_.:-]+?)\s*(-->>|->>|-->|->|--\)|-\)|--x|-x|==>>|=>>)\s*([+-]?)([\p{L}\p{N}_.:-]+)\s*:\s*(.*)$/u.exec(line);
    if(arrow && current.steps.length<500){
      const [,from,,modifier,to,label]=arrow;
      for(const alias of [from,to])if(!current.participants.some(p=>p.alias===alias))current.participants.push({alias,title:alias,...resolveParticipant(alias,alias,model)});
      current.steps.push({type:'message',from,to,label:label.replace(/<br\s*\/?>/gi,' '),data:label,error:/ошиб|отказ|failed|failure|reject|cancel|dlq/i.test(label+' '+branch),branch,modifier});
    }
  }
  if(current)blocks.push(current);
  return blocks.filter(block=>block.steps.length);
}
const artifactCaches=new WeakMap();
async function textArtifacts(wb,project,snapshot){
  let cache=artifactCaches.get(wb);if(!cache){cache=new Map();artifactCaches.set(wb,cache);}
  const key=project+':'+snapshot.head+':'+snapshot.fingerprint;
  if(cache.has(key))return cache.get(key);
  const p=await wb.engine.project(project),files=(await wb.engine.files(p.root)).filter(file=>/\.(md|mmd|mermaid|puml|plantuml|drawio|xml)$/i.test(file));
  const artifacts=[],warnings=[];let bytes=0;
  for(const file of files.slice(0,1000)){
    try{
      const stat=await fs.stat(await wb.engine.safe(p.root,file));
      if(stat.size>2*1024*1024){warnings.push('Файл превышает лимит чтения: '+file);continue;}
      const artifact=await wb.engine.read(project,file),length=Buffer.byteLength(artifact.content);
      if(bytes+length>8*1024*1024){warnings.push('Лимит чтения документов 8 MiB.');break;}
      bytes+=length;artifacts.push({file,...artifact});
    }catch(error){warnings.push('Пропущен файл '+file+': '+error.message);}
  }
  if(files.length>1000)warnings.push('Полнотекстовый поиск ограничен 1000 файлами; поиск объектов полный.');
  const result={artifacts,warnings};
  if(cache.size>=4)cache.delete(cache.keys().next().value);
  cache.set(key,result);return result;
}
async function scenarioSources(wb,project,snapshot) {
  const {artifacts,warnings}=await textArtifacts(wb,project,snapshot),scenarios=[];
  for(const artifact of artifacts.filter(a=>/\.(md|mmd|mermaid)$/i.test(a.file))) {
    const file=artifact.file;
    if(!artifact.content.includes('sequenceDiagram'))continue;
    const heading=/^#\s+(.+)$/m.exec(artifact.content)?.[1];
    const docs=Object.entries(snapshot.model.docs||{}).find(([id,doc])=>{
      if(!doc || typeof doc.source!=='string')return false;
      const owner=snapshot.provenance?.['docs/'+id];
      return owner && path.posix.normalize(path.posix.join(path.posix.dirname(owner),doc.source))===file;
    });
    const blocks=parseSequence(artifact.content,snapshot.model);
    blocks.forEach((block,index)=>scenarios.push({id:(docs?.[0]||file)+(blocks.length>1?'#'+(index+1):''),title:docs?.[1]?.title||heading||file,path:file,...block}));
  }
  for(const [id,scenario]of Object.entries(map(snapshot.model['seaf.workbench.scenarios']))) {
    const steps=Array.isArray(scenario.steps)?scenario.steps.slice(0,500).map(s=>({type:'message',from:text(s.from),to:text(s.to),label:text(s.label||s.title),data:text(s.data),error:!!s.error,branch:text(s.branch)})):[];
    if(!steps.length)continue;
    const aliases=[...new Set(steps.flatMap(s=>[s.from,s.to]))].filter(Boolean);
    scenarios.push({id,title:text(scenario.title)||id,path:snapshot.provenance?.['seaf.workbench.scenarios/'+id]||null,steps,participants:aliases.map(alias=>({alias,title:alias,...resolveParticipant(alias,alias,snapshot.model)}))});
  }
  return {project,scenarios,warnings,scope:'Local declared scenarios and Mermaid sequence sources. Unresolved or ambiguous participants remain explicit; branches are descriptive, not simulated execution.'};
}
export async function uxAction(wb,project,a) {
  if(a.action==='ux_artifact'){
    const artifact=await wb.engine.read(project,a.path);
    return {project,path:artifact.file,content:artifact.content,sha256:artifact.sha256};
  }
  const snapshot=await wb.model(project);
  if(a.action==='ux_search') {
    const query=text(a.query).trim();if(query.length>200)throw Error('Search query is too long');
    const limit=integer(a.limit,30,1,100),offset=integer(a.offset,0,0,1000000);
    const results=searchObjects(snapshot,query),warnings=[];
    if(query.length>=2){
      const {artifacts,warnings:readWarnings}=await textArtifacts(wb,project,snapshot);warnings.push(...readWarnings);
      const terms=query.toLocaleLowerCase('ru').split(/\s+/);
      for(const {file,content:source} of artifacts) {
        const lower=source.toLocaleLowerCase('ru');if(!terms.every(term=>lower.includes(term)||file.toLocaleLowerCase('ru').includes(term)))continue;
        const index=Math.max(0,lower.indexOf(terms[0])),start=Math.max(0,index-80),line=source.slice(0,index).split('\n').length;
        results.push({kind:'artifact',section:'artifacts',id:file,title:file,owner:'',path:file,line,snippet:source.slice(start,start+260),score:5});
      }
    }
    results.sort((a,b)=>b.score-a.score||a.title.localeCompare(b.title,'ru'));
    return {project,query,total:results.length,limit,offset,results:results.slice(offset,offset+limit),warnings,revision:snapshot.head};
  }
  if(a.action==='ux_passport') {
    if(typeof a.section!=='string'||typeof a.id!=='string')throw Error('Select object section and ID');
    const result=buildPassport(snapshot,a.section,a.id);
    // Search only declared local document text, retaining its real owning path.
    const {scenarios}=await scenarioSources(wb,project,snapshot);
    for(const s of scenarios)if(s.participants.some(p=>p.section===a.section&&p.id===a.id)&&!result.documents.some(d=>d.path===s.path))result.documents.push({id:s.id,title:s.title,path:s.path,kind:'scenario'});
    const {artifacts,warnings}=await textArtifacts(wb,project,snapshot);
    for(const [docID,doc]of Object.entries(map(snapshot.model.docs))){
      const sourceOwner=snapshot.provenance?.['docs/'+docID];
      if(!sourceOwner||typeof doc?.source!=='string'||doc.source.includes(':'))continue;
      const file=path.posix.normalize(path.posix.join(path.posix.dirname(sourceOwner),doc.source)),artifact=artifacts.find(a=>a.file===file);
      if(artifact&&references(artifact.content,a.id).length&&!result.documents.some(d=>d.id===docID))result.documents.push({id:docID,title:text(doc.title)||docID,path:file,kind:'document'});
    }
    result.warnings=warnings;
    return {project,...result};
  }
  if(a.action==='ux_scenarios')return scenarioSources(wb,project,snapshot);
  throw Error('Unknown UX action');
}
