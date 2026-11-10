import crypto from 'node:crypto';
import { zipSync, strToU8 } from 'fflate';
const digest = x => crypto.createHash('sha256').update(x).digest('hex');
const json = x => JSON.stringify(x, null, 2);
const own = (o,k) => Object.hasOwn(o || {},k);
const map = x => x && typeof x === 'object' && !Array.isArray(x) ? x : {};
const str = x => typeof x === 'string' ? x : x == null ? '' : JSON.stringify(x);
const escape = x => str(x).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x==='object' ? Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])) : x;
export const modelFingerprint = model => digest(JSON.stringify(canonical(model)));
const equal = (a,b) => JSON.stringify(canonical(a))===JSON.stringify(canonical(b));
const identity = (project,section,id) => [project,section,id].map(encodeURIComponent).join('/');
const safeId = x => {if(typeof x!=='string'||! /^[a-zA-Z0-9][a-zA-Z0-9_.:-]{0,249}$/.test(x)||['constructor','prototype','__proto__'].includes(x))throw Error('Invalid entity ID');return x;};
function matches(id,pattern) {return new RegExp('^'+pattern.split('*').map(s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('.*')+'$').test(id);}
export function stackView(snapshot, options={}) {
 const {project='project',mode='context',context='',focus=''}=options;
 if(!['context','passport','dataflow','technology','deployment'].includes(mode))throw Error('Unsupported stack view');
 const model=map(snapshot.model),components=map(model.components), allIds=Object.keys(components).sort(),warnings=[];
 let ids=allIds;
 if(context){const c=map(model.contexts)[context];if(!c)throw Error('Unknown context');if(!Array.isArray(c.components)||c.components.some(x=>typeof x!=='string'))throw Error('Unsupported context selector: expected component ID patterns');ids=allIds.filter(id=>c.components.some(p=>matches(id,p)));}
 if(mode==='passport'){
  if(!own(components,focus))throw Error('Select an existing component for the passport');
  const neighbours=new Set([focus,...(Array.isArray(components[focus].links)?components[focus].links:[]).map(x=>x?.id)]);
  for(const id of allIds)if((Array.isArray(components[id].links)?components[id].links:[]).some(x=>x?.id===focus))neighbours.add(id);
  ids=allIds.filter(id=>neighbours.has(id));
 }
 if(mode==='technology')ids=ids.filter(id=>(!options.technology||(components[id].technologies||[]).includes(options.technology))&&(!options.catalogStatus||(components[id].technologies||[]).some(t=>str(map(model.technologies)[t]?.status)===options.catalogStatus)));
 const limit=200,edgeLimit=600,originalCount=ids.length;
 if(ids.length>limit){ids=ids.slice(0,limit);warnings.push('Node limit: '+limit+' of '+originalCount);}
 const nodes=ids.map(id=>{const c=components[id];return {key:identity(project,'components',id),section:'components',id,title:str(c.title||id),owner:str(c.owner),technologies:Array.isArray(c.technologies)?c.technologies.map(str):[],status:str(c.status),group:str(c.group||id.split('.').slice(0,-1).join('.')),source:snapshot.provenance?.['components/'+id]||null,raw:c};});
 for(const n of nodes)n.placements=Object.entries(model).filter(([section])=>section.startsWith('seaf.ta.services.')).flatMap(([section,objects])=>Object.entries(map(objects)).filter(([,d])=>Array.isArray(d?.app_components)&&d.app_components.includes(n.id)).map(([id,d])=>({section,id,title:str(d.title||id),stand:Array.isArray(d.stand)?d.stand:[],source:snapshot.provenance?.[section+'/'+id]||null})));
 const selected=new Set(ids), edges=[];
 for(const id of ids){
  const links=components[id].links;if(links!==undefined&&!Array.isArray(links)){warnings.push('Invalid links on '+id);continue;}
  const occurrences=new Map();
  for(const link of links||[]){if(!link||typeof link.id!=='string'){warnings.push('Malformed link on '+id);continue;}
   if(mode==='passport'&&id!==focus&&link.id!==focus)continue;
   if(own(components,link.id)&&!selected.has(link.id))continue;
   const keyBase=identity(project,'links',id+'->'+link.id),n=occurrences.get(keyBase)||0;occurrences.set(keyBase,n+1);
   if(edges.length>=edgeLimit){if(!warnings.includes('Edge limit: '+edgeLimit))warnings.push('Edge limit: '+edgeLimit);continue;}
   if(!selected.has(link.id)){
    if(nodes.length>=limit){warnings.push('Unresolved endpoint omitted: '+link.id);continue;}
    nodes.push({key:identity(project,'components',link.id),section:'components',id:link.id,title:link.id,unresolved:true,technologies:[],source:null});selected.add(link.id);
   }
   edges.push({key:keyBase+':'+n,from:id,to:link.id,title:str(link.title),protocol:str(link.protocol),dataClassification:str(link.dataClassification),source:snapshot.provenance?.['components/'+id]||null,raw:link});
  }
 }
 if(mode==='technology')for(const n of nodes){n.group=n.technologies.length?n.technologies.join(' / '):'Unspecified technology';n.catalog=n.technologies.map(id=>({id,...map(map(model.technologies)[id]),catalogPresent:own(map(model.technologies),id),status:str(map(model.technologies)[id]?.status)||'Не указано'}));}
 if(mode==='deployment'){
  nodes.length=0;edges.length=0;
  const add=(section,id)=>{const key=identity(project,section,id);if(nodes.some(n=>n.key===key))return key;if(nodes.length>=limit){warnings.push('Deployment node limit: '+limit);return null;}const raw=map(model[section])[id];nodes.push({key,section,id,title:str(raw?.title||id),group:section,technologies:[],raw,unresolved:!raw,source:snapshot.provenance?.[section+'/'+id]||null});return key;};
  // SEAF TA services base schema: app_components points to components.component.
  for(const section of Object.keys(model).filter(k=>k.startsWith('seaf.ta.services.')).sort())for(const [id,d]of Object.entries(map(model[section]))){
   if(!Array.isArray(d?.app_components))continue;
   const apps=d.app_components.filter(x=>typeof x==='string'&&(!context||selected.has(x)));if(!apps.length)continue;
   const host=add(section,id);
   for(const app of apps){const from=add('components',app);if(from&&host)edges.push({key:identity(project,'placement',section+'/'+id+'/'+app),from:app,to:id,fromKey:from,toKey:host,title:'app_components',raw:{component:app,service:id},source:snapshot.provenance?.[section+'/'+id]||null});}
   for(const [field,target]of [['stand','seaf.ta.services.stand'],['network_connection','seaf.ta.services.network'],['availabilityzone','seaf.ta.services.dc_az']])for(const ref of Array.isArray(d[field])?d[field]:[]){if(typeof ref!=='string')continue;const to=add(target,ref);if(host&&to)edges.push({key:identity(project,'placement',section+'/'+id+'/'+field+'/'+ref),from:id,to:ref,fromKey:host,toKey:to,title:field,raw:{field,ref}});}
  }
  if(!nodes.length)warnings.push('No declared SEAF TA service app_components mappings. Placement is not inferred.');
  if(model.stackDeployments)warnings.push('Legacy stackDeployments extension is not a native SEAF placement mapping.');
 }
 if(edges.length>edgeLimit){edges.length=edgeLimit;warnings.push('Edge limit: '+edgeLimit);}
 if(!allIds.length)warnings.push('No components found. This adapter does not infer KADZO entities.');
 const result={format:'seaf-stack-v1',project,mode,context,focus,revision:snapshot.head||null,fingerprint:modelFingerprint(model),nodes,edges,warnings,legend:{unchanged:'Existing',added:'Added',removed:'Removed',changed:'Changed',unresolved:'Unresolved'},layout:{}};
 return layoutView(result);
}
function layoutView(view){
 const rows=[...view.nodes].sort((a,b)=>str(a.group).localeCompare(str(b.group))||a.key.localeCompare(b.key));
 rows.forEach((n,i)=>view.layout[n.key]={x:40+(i%3)*330,y:80+Math.floor(i/3)*170});
 view.width=1030;view.height=Math.max(260,130+Math.ceil(rows.length/3)*170);return view;
}
export function stackDiff(before,after,options){
 const a=stackView(before,options),b=stackView(after,options),nodes=new Map(a.nodes.map(n=>[n.key,{...n,change:'removed'}])),edges=new Map(a.edges.map(e=>[e.key,{...e,change:'removed'}]));
 for(const n of b.nodes){const old=nodes.get(n.key);nodes.set(n.key,{...n,change:!old?'added':equal(old.raw,n.raw)?'unchanged':'changed'});}
 for(const e of b.edges){const old=edges.get(e.key);edges.set(e.key,{...e,change:!old?'added':equal(old.raw,e.raw)?'unchanged':'changed'});}
 if(nodes.size>400||edges.size>1200)throw Error('Comparison exceeds render limit');
 const combined=layoutView({...b,nodes:[...nodes.values()],edges:[...edges.values()],layout:{},comparison:{baseRevision:a.revision,targetRevision:b.revision,baseFingerprint:a.fingerprint,targetFingerprint:b.fingerprint},warnings:[...new Set([...a.warnings,...b.warnings])]});
 let next=a.nodes.length;for(const n of combined.nodes){combined.layout[n.key]=a.layout[n.key]||{x:40+(next%3)*330,y:80+Math.floor(next++/3)*170};}combined.height=Math.max(260,...Object.values(combined.layout).map(p=>p.y+180));return combined;
}
export function renderStack(view){
 const color=x=>({added:'#13835c',removed:'#b54048',changed:'#bd7e12'}[x]||'#516680');
 const positions=new Map(view.nodes.flatMap(n=>[[n.id,view.layout[n.key]],[n.key,view.layout[n.key]]]));
 let body='';
 for(const e of view.edges){const a=positions.get(e.fromKey||e.from),b=positions.get(e.toKey||e.to);if(!a||!b)continue;const x=a.x+145,y=a.y+126,xx=b.x+145,yy=b.y+126,routeY=Math.max(y,yy)+24;const route=a.y===b.y?`M${x} ${y} V${routeY} H${xx} V${yy}`:`M${x} ${y} V${y+24} H20 V${yy+24} H${xx} V${yy}`;
 body+=`<path d="${route}" fill="none" stroke="${color(e.change)}" stroke-width="2" marker-end="url(#arrow)"><title>${escape(json(e))}</title></path><text x="${(x+xx)/2}" y="${routeY+12}" text-anchor="middle" font-size="11" fill="#cbd5e1">${escape([e.title,view.mode==='dataflow'?'Протокол: '+(e.protocol||'Не указано'):'',view.mode==='dataflow'?'Класс: '+(e.dataClassification||'Не указано'):''].filter(Boolean).join(' / '))}</text>`;
 }
 for(const n of view.nodes){const p=view.layout[n.key];body+=`<a href="#${escape(n.key)}"><g transform="translate(${p.x},${p.y})"><title>${escape(json(n))}</title><rect width="290" height="126" rx="12" fill="#18273b" stroke="${color(n.change)}" stroke-width="${n.change&&n.change!=='unchanged'?3:1}" ${n.unresolved?'stroke-dasharray="6 4"':''}/><text x="14" y="25" fill="#f1f5f9" font-size="16">${escape(n.title.slice(0,30))}</text><text x="14" y="47" fill="#94a3b8" font-size="11">${escape(n.id.slice(0,43))}</text><text x="14" y="69" fill="#9cceef" font-size="12">${escape((n.group||'').slice(0,40))}</text><text x="14" y="91" fill="#cbd5e1" font-size="11">${escape((n.owner||n.component||n.technologies?.join(', ')||'Metadata not specified').slice(0,42))}</text><text x="14" y="112" fill="#aabbd0" font-size="11">${escape(n.unresolved?'UNRESOLVED':n.change||(view.mode==='technology'?n.catalog?.map(t=>t.id+': '+t.status).join(', '):n.status)||'')}</text></g></a>`;}
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${view.width}" height="${view.height}" viewBox="0 0 ${view.width} ${view.height}" role="img" aria-label="SEAF stack diagram"><rect width="100%" height="100%" fill="#0d1727"/><defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10Z" fill="#90a3bc"/></marker></defs><g font-family="sans-serif"><text x="40" y="35" fill="#e2e8f0" font-size="22">${escape(view.project)} / ${escape(view.mode)}</text>${body}</g></svg>`;
}
export function stackHtml(view,svg=renderStack(view)){
 return '<!doctype html><html lang="en"><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src \'none\'; style-src \'unsafe-inline\'; img-src data:; base-uri \'none\'"><title>SEAF architecture</title><style>body{margin:24px;background:#0d1727;color:#e2e8f0;font:15px sans-serif}svg{max-width:100%;height:auto}pre{white-space:pre-wrap}article{padding:16px;border-top:1px solid #334155}</style><h1>SEAF architecture</h1><p>Revision: '+escape(view.revision)+' / Fingerprint: '+escape(view.fingerprint)+'</p><p>'+escape(view.warnings.join('; '))+'</p>'+svg+'<h2>Legend</h2><pre>'+escape(json(view.legend))+'</pre><h2>Source inventory</h2>'+view.nodes.map(n=>'<article id="'+escape(n.key)+'"><h3>'+escape(n.title)+'</h3><pre>'+escape(json(n))+'</pre></article>').join('')+'<h2>Links</h2><pre>'+escape(json(view.edges))+'</pre></html>';
}
export function descriptionToSketch(text){
 return text.split(/\r?\n/).map(line=>{
  const value=line.trim();if(!value||value.startsWith('#')||/^(component|link) /.test(value))return value;
  let m=value.match(/^(?:Сервис|Service) ([a-zA-Z0-9_.:-]+): (.+)$/iu);
  if(m)return 'component '+m[1]+' | '+m[2];
  m=value.match(/^([a-zA-Z0-9_.:-]+) (?:передает данные в|sends data to) ([a-zA-Z0-9_.:-]+): ([^;]+)(?:; (?:протокол|protocol)=([^;]+))?(?:; (?:класс|class)=([^;]+))?$/iu);
  if(m)return 'link '+m[1]+' -> '+m[2]+' | '+m[3]+' | '+(m[4]||'')+' | '+(m[5]||'');
  throw Error('Unsupported description. Use: Service ID: Title; or FROM sends data to TO: Title; protocol=HTTPS; class=business (one statement per line). No facts were inferred.');
 }).join('\n');
}
export function sketch(model,text){
 if(typeof text!=='string'||text.length>40000)throw Error('Sketch must be text under 40 KB');
 text=descriptionToSketch(text);
 const components=structuredClone(map(model.components)),operations=[], touched=new Set();
 const lines=text.split(/\r?\n/).map(x=>x.trim()).filter(x=>x&&!x.startsWith('#'));if(!lines.length||lines.length>100)throw Error('Provide 1-100 statements');
 // Declarations first allow forward references while retaining original operations.
 for(const line of lines)if(line.startsWith('component ')){const [head,title,...extra]=line.split('|').map(x=>x.trim()),id=safeId(head.slice(10).trim());if(extra.length||!title)throw Error('Syntax: component ID | title');if(own(components,id))throw Error('Component already exists: '+id);components[id]={title,entity:'component'};operations.push({section:'components',id,mode:'create',value:components[id]});}
 for(const line of lines){if(line.startsWith('component '))continue;
  if(line.startsWith('link ')){const [head,title='',protocol='',dataClassification='',...extra]=line.split('|').map(x=>x.trim()),ends=head.slice(5).split('->').map(x=>x.trim());if(ends.length!==2||extra.length)throw Error('Syntax: link FROM -> TO | title | protocol | dataClassification');const [from,to]=ends.map(safeId);if(!own(components,from)||!own(components,to))throw Error('Unknown link endpoint');const links=components[from].links||[];if(!Array.isArray(links))throw Error('Invalid source links');const link={id:to,...(title?{title}:{}),...(protocol?{protocol}:{}),...(dataClassification?{dataClassification}:{})};if(links.some(x=>equal(x,link)))throw Error('Duplicate link');components[from].links=[...links,link];touched.add(from);
  }else throw Error('Unsupported statement. Use component or link.');
 }
 for(const id of touched){const added=operations.find(o=>o.section==='components'&&o.id===id);if(added)added.value=components[id];else operations.push({section:'components',id,mode:'merge',value:{links:components[id].links}});}
 const next=structuredClone(model);for(const o of operations){next[o.section]||={};next[o.section][o.id]=o.mode==='merge'?{...next[o.section][o.id],...o.value}:o.value;}
 return {operations,model:next};
}
export async function stackAction(wb,project,a){
 a={...a,op:a.action||a.op};
 const current=await wb.model(project);let view;
 const options={project,mode:a.mode||'context',context:a.context||'',focus:a.focus||'',technology:a.technology||'',catalogStatus:a.catalogStatus||''};
 if(a.op==='stack_sketch'||a.op==='stack_stage'){
  const parsed=sketch(current.model,a.text);
  if(a.op==='stack_stage'){
   if(!a.fingerprint||a.fingerprint!==current.fingerprint||a.revision!==current.head)throw Error('Stale sketch: preview current model again');
   const built=await wb.buildOperations(project,parsed.operations);
   const latest=await wb.model(project);
   if(built.baseFingerprint!==a.fingerprint||built.baseHead!==a.revision||latest.fingerprint!==a.fingerprint||latest.head!==a.revision)throw Error('Stale sketch: model changed while staging');
   return wb.saveDraft(project,{...built,title:'Stack sketch',operations:parsed.operations});
  }
  view=stackDiff(current,{...current,model:parsed.model},options);
  return {view,svg:renderStack(view),operations:parsed.operations,fingerprint:current.fingerprint,revision:current.head};
 }
 if([a.targetRef,a.draftId,a.proposalId].filter(Boolean).length>1)throw Error('Choose only one comparison target');
 if(a.baseRef||a.targetRef||a.draftId||a.proposalId){
  const base=a.baseRef?await wb.gitModel(project,a.baseRef):current;
  let target=a.targetRef?await wb.gitModel(project,a.targetRef):current;
  if(a.draftId){const d=await wb.getDraft(project,a.draftId);if(d.baseHead!==current.head||d.baseFingerprint!==current.fingerprint)throw Error('Stale draft: refresh before comparison');target=await wb.modelWithChanges(project,d.operations?.length?(await wb.buildOperations(project,d.operations)).changes:d.changes);target.head='draft:'+d.id;}
  if(a.proposalId){const p=await wb.engine.proposal(a.proposalId);if(p.project!==project)throw Error('Wrong project');target=await wb.modelWithChanges(project,p.changes);target.head='proposal:'+a.proposalId;}
  view=stackDiff({...base,head:base.head||base.commit||base.revision?.id},{...target,head:target.head||target.commit||target.revision?.id},options);
 }else view=stackView(current,options);
 const svg=renderStack(view),viewHash=digest(json(view));
 if(a.op!=='stack_export')return {view,svg,viewHash};
 if(a.viewHash!==viewHash)throw Error('View changed: render again before exporting');
 if(typeof a.png!=='string'||a.png.length>5500000||! /^[A-Za-z0-9+/]*={0,2}$/.test(a.png))throw Error('PNG required (maximum 4 MB)');
 const png=Buffer.from(a.png,'base64');if(png.length<24||png.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||png.readUInt32BE(16)!==view.width||png.readUInt32BE(20)!==view.height)throw Error('PNG dimensions do not match view');
 const files={'diagram.svg':strToU8(svg),'diagram.html':strToU8(stackHtml(view,svg)),'diagram.png':png,'inventory.json':strToU8(json(view)),'legend.json':strToU8(json(view.legend)),'NOTICE.txt':strToU8('SEAF model-derived stack renderer. Independently implemented. No third-party icons, fonts or Stack Diagram code included. Architecture content retains its original ownership. No publication performed.')};
 const manifest={format:'seaf-stack-export-v1',created:new Date().toISOString(),revision:view.revision,fingerprint:view.fingerprint,comparison:view.comparison||null,viewHash,files:Object.fromEntries(Object.entries(files).map(([k,v])=>[k,{sha256:digest(v),bytes:v.length}]))};
 files['manifest.json']=strToU8(json(manifest));return {filename:'seaf-stack.zip',base64:Buffer.from(zipSync(files)).toString('base64'),manifest};
}
