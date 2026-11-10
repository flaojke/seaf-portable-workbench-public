import crypto from 'node:crypto';
import path from 'node:path';
import YAML from 'yaml';
import {buildDiagramEditing,diagramWorkspace,deletionImpacts,normalizeModelBinding,validateModelBindings,modelRelations} from './diagram-editing.mjs';

export const COMPOSER_SECTION = 'seaf.workbench.diagrams';
export const COMPOSER_FORMAT = 'seaf-composer-v1';
export const COMPOSER_LEVELS = { network: 'Сетевой уровень', application: 'Прикладной уровень', component: 'Компонентный уровень' };
const own = (value, key) => Object.hasOwn(value || {}, key);
const object = value => !!value && typeof value === 'object' && !Array.isArray(value);
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const esc = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const blocked = new Set(['__proto__', 'prototype', 'constructor']);
function knownKeys(value, allowed, name) {
  const extra=Object.keys(value).filter(key=>!allowed.includes(key));
  if(extra.length)throw Error('Неподдерживаемые свойства '+name+': '+extra.join(', '));
}
function diagramId(value) {
  identifier(value,'ID схемы');
  if(value.includes(':')||/^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i.test(value))throw Error('ID схемы не должен содержать двоеточие или зарезервированное имя Windows');
  return value;
}
function identifier(value, name = 'идентификатор') {
  if (typeof value !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/.test(value) || blocked.has(value)) throw Error('Некорректный ' + name);
  return value;
}
function label(value, name, max = 200, required = false) {
  if (value === undefined || value === null) value = '';
  if (typeof value !== 'string' || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f]/.test(value)) throw Error('Некорректное поле «' + name + '»');
  value = value.replace(/\s+/g, ' ').trim();
  if (required && !value) throw Error('Заполните поле «' + name + '»');
  return value;
}
function coordinate(value, fallback) {
  if (value === undefined) return fallback;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 20000) throw Error('Координаты должны находиться в диапазоне 0–20000');
  return Math.round(value);
}
function reference(value, model) {
  if (!object(value) || typeof value.section !== 'string' || !value.section || value.section.length > 250 || blocked.has(value.section) || typeof value.id !== 'string' || !value.id || value.id.length > 250 || blocked.has(value.id)) throw Error('Некорректная ссылка на объект модели');
  knownKeys(value,['section','id'],'ссылки');
  const section = own(model, value.section) && model[value.section];
  if (!object(section) || !own(section, value.id) || !object(section[value.id])) throw Error('Объект модели не найден: ' + value.section + ' / ' + value.id);
  return {section: value.section, id: value.id};
}
/** Validate and canonicalise a bounded, model-independent visual definition. */
export function normalizeDiagram(input, model = {}) {
  if (!object(input) || JSON.stringify(input).length > 450000) throw Error('Некорректная или слишком большая схема');
  knownKeys(input,['format','id','title','level','description','nodes','edges','zones'],'схемы');
  if (input.format && input.format !== COMPOSER_FORMAT) throw Error('Неизвестный формат схемы');
  const id = diagramId(input.id);
  const title = label(input.title, 'Название схемы', 200, true);
  const level = input.level || 'application';
  if (!own(COMPOSER_LEVELS, level)) throw Error('Выберите сетевой, прикладной или компонентный уровень');
  if (!Array.isArray(input.nodes) || !input.nodes.length || input.nodes.length > 200) throw Error('Схема должна содержать от 1 до 200 узлов');
  if (!Array.isArray(input.edges || []) || (input.edges || []).length > 500) throw Error('Допускается не более 500 связей');
  if (!Array.isArray(input.zones || []) || (input.zones || []).length > 30) throw Error('Допускается не более 30 зон');
  const zoneIds = new Set();
  const zones = (input.zones || []).map(zone => {
    if (!object(zone)) throw Error('Некорректная зона');
    knownKeys(zone,['id','title','trust'],'зоны');
    const zoneId = identifier(zone.id, 'ID зоны');
    if (zoneIds.has(zoneId)) throw Error('Повторяющийся ID зоны: ' + zoneId);
    zoneIds.add(zoneId);
    return {id: zoneId, title: label(zone.title, 'Название зоны', 150, true), trust: label(zone.trust, 'Описание доверия', 150)};
  });
  const nodeIds = new Set();
  const nodes = input.nodes.map((node, index) => {
    if (!object(node)) throw Error('Некорректный узел схемы');
    knownKeys(node,['key','title','kind','ref','zone','x','y'],'узла');
    const key = identifier(node.key, 'ID узла');
    if (nodeIds.has(key)) throw Error('Повторяющийся ID узла: ' + key);
    nodeIds.add(key);
    const ref = node.ref ? reference(node.ref, model) : undefined;
    const zone = node.zone ? identifier(node.zone, 'ID зоны узла') : '';
    if (zone && !zoneIds.has(zone)) throw Error('Не найдена зона узла ' + key);
    return {key, title: label(node.title || (ref && model[ref.section][ref.id].title) || ref?.id, 'Название узла', 200, true), kind: label(node.kind || (level === 'network' ? 'server' : level === 'component' ? 'component' : 'service'), 'Тип узла', 80, true), ...(ref ? {ref} : {}), zone, x: coordinate(node.x, 50 + (index % 3) * 300), y: coordinate(node.y, 70 + Math.floor(index / 3) * 180)};
  });
  const edgeIds = new Set();
  const edges = (input.edges || []).map(edge => {
    if (!object(edge)) throw Error('Некорректная связь');
    knownKeys(edge,['key','from','to','title','protocol','data','direction','binding'],'связи');
    const key = identifier(edge.key, 'ID связи');
    if (edgeIds.has(key)) throw Error('Повторяющийся ID связи: ' + key);
    edgeIds.add(key);
    const from = identifier(edge.from, 'Источник связи'), to = identifier(edge.to, 'Получатель связи');
    if (!nodeIds.has(from) || !nodeIds.has(to)) throw Error('Связь ' + key + ' ссылается на отсутствующий узел');
    if (edge.direction!==undefined&&edge.direction!==null&&edge.direction!==''&&!['directed', 'reverse', 'bidirectional', 'undirected'].includes(edge.direction)) throw Error('Некорректное направление связи');
    return {key, from, to, title: label(edge.title, 'Название связи', 200), protocol: label(edge.protocol, 'Протокол', 100), data: label(edge.data, 'Данные', 200), direction: edge.direction || 'directed',...(edge.binding?{binding:normalizeModelBinding(edge.binding)}:{})};
  });
  return {format: COMPOSER_FORMAT, id, title, level, description: label(input.description, 'Описание', 1500), nodes, edges, zones};
}
const width = 240, height = 108;
function line(value, limit = 30) { return String(value).slice(0, limit); }
/** Render only escaped text and numeric geometry. No arbitrary SVG or URLs enter the result. */
export function renderComposer(diagram, {selected = ''} = {}) {
  const nodes = new Map(diagram.nodes.map(node => [node.key, node]));
  const boxWidth = Math.max(760, ...diagram.nodes.map(node => node.x + width + 60));
  const boxHeight = Math.max(300, ...diagram.nodes.map(node => node.y + height + 70));
  const accent = {network:'#315b9c',application:'#007d68',component:'#7952a8'}[diagram.level];
  let body = '';
  for (const zone of diagram.zones) {
    const members = diagram.nodes.filter(node => node.zone === zone.id);
    if (!members.length) continue;
    const x = Math.max(5, Math.min(...members.map(n => n.x)) - 24), y = Math.max(5, Math.min(...members.map(n => n.y)) - 35);
    const w = Math.max(...members.map(n => n.x + width)) - x + 24, h = Math.max(...members.map(n => n.y + height)) - y + 24;
    body += `<g><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="18" fill="#eff5fa" fill-opacity="0.65" stroke="#8398aa" stroke-dasharray="7 4"/><text x="${x+10}" y="${y+20}" font-size="13" fill="#385065">${esc(zone.title)}${zone.trust?' · '+esc(zone.trust):''}</text></g>`;
  }
  for (const edge of diagram.edges) {
    const a = nodes.get(edge.from), b = nodes.get(edge.to);
    const dx = b.x - a.x, dy = b.y - a.y;
    let x1 = a.x + width/2, y1 = a.y + height/2, x2 = b.x + width/2, y2 = b.y + height/2;
    if (Math.abs(dx) >= Math.abs(dy)) {x1 += dx >= 0 ? width/2 : -width/2; x2 += dx >= 0 ? -width/2 : width/2;} else {y1 += dy >= 0 ? height/2 : -height/2; y2 += dy >= 0 ? -height/2 : height/2;}
    const self = edge.from === edge.to, route = self ? `M${x1} ${y1} c100 -90 100 90 0 0` : `M${x1} ${y1} L${x2} ${y2}`;
    const markers=[...(['reverse','bidirectional'].includes(edge.direction)?['marker-start="url(#composer-arrow)"']:[]),...(['directed','bidirectional'].includes(edge.direction)?['marker-end="url(#composer-arrow)"']:[])].join(' ');
    body += `<g><path d="${route}" fill="none" stroke="#496376" stroke-width="2" ${markers}/><title>${esc([edge.title,edge.protocol,edge.data].filter(Boolean).join(' · '))}</title><text x="${(x1+x2)/2}" y="${(y1+y2)/2-8}" text-anchor="middle" font-size="12" fill="#203c4d" style="paint-order:stroke;stroke:#fff;stroke-width:4px">${esc(line([edge.title,edge.protocol].filter(Boolean).join(' · '),48))}</text></g>`;
  }
  for (const node of diagram.nodes) {
    body += `<g data-composer-node="${esc(node.key)}" role="button" tabindex="0" aria-label="${esc(node.title)}. Переместить узел стрелками" transform="translate(${node.x},${node.y})" style="cursor:grab"><title>${esc(node.title)}${node.ref?' — '+esc(node.ref.section+'/'+node.ref.id):' — визуальный узел'}</title><rect width="${width}" height="${height}" rx="${node.kind==='database'?24:10}" fill="#fff" stroke="${node.key===selected?'#bf6516':accent}" stroke-width="${node.key===selected?4:2}"/><text x="14" y="25" fill="#173c35" font-size="16" font-weight="600">${esc(line(node.title))}</text><text x="14" y="47" fill="#31576b" font-size="12">${esc(line(node.kind,35))}</text><text x="14" y="70" fill="#4b6472" font-size="11">${esc(line(node.ref?.id || 'Визуальный узел',38))}</text><text x="14" y="91" fill="#657d88" font-size="10">${esc(line(node.ref?.section || 'Не создаёт объект модели',40))}</text></g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${boxWidth} ${boxHeight}" width="${boxWidth}" height="${boxHeight}" role="img" aria-label="${esc(diagram.title)}"><defs><marker id="composer-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse"><path d="M0 0 L10 4 L0 8 Z" fill="#496376"/></marker></defs><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`;
}
const mermaidText = value => String(value ?? '').replace(/\s+/g,' ').replace(/[&<>"`|\[\]{}()\\]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'#quot;','`':'#96;','|':'#124;','[':'#91;',']':'#93;','{':'#123;','}':'#125;','(':'#40;',')':'#41;','\\':'#92;'}[ch]));
// Keep labels as text even when the portal interprets Mustache/Vue document syntax.
const markdownText = value => esc(String(value ?? '').replace(/\s+/g,' ')).replaceAll('{{','{\u200b{').replaceAll('}}','}\u200b}').replace(/[\[\]`|]/g,ch=>({'[':'&#91;',']':'&#93;','`':'&#96;','|':'&#124;'}[ch]));
export function composerMermaid(diagram) {
  const aliases = new Map(diagram.nodes.map((node,index)=>[node.key,'n'+index]));
  const rows = ['flowchart LR'];
  const addNode = node => rows.push(`  ${aliases.get(node.key)}["${mermaidText(node.title)}<br/>${mermaidText(node.kind)}"]`);
  for (const [index,zone] of diagram.zones.entries()) {
    const members=diagram.nodes.filter(node=>node.zone===zone.id);
    if (!members.length) continue;
    rows.push(`  subgraph z${index}["${mermaidText(zone.title)}"]`); members.forEach(addNode); rows.push('  end');
  }
  diagram.nodes.filter(node=>!node.zone).forEach(addNode);
  for (const edge of diagram.edges) {
    const caption=mermaidText([edge.title,edge.protocol].filter(Boolean).join(' · '));
    // Mermaid 11 does not parse a bare left arrow. Reverse only generated aliases,
    // keeping the persisted from/to and source-model binding identity unchanged.
    const from=edge.direction==='reverse'?edge.to:edge.from,to=edge.direction==='reverse'?edge.from:edge.to;
    const arrow={directed:'-->',reverse:'-->',bidirectional:'<-->',undirected:'---'}[edge.direction];
    rows.push(`  ${aliases.get(from)} ${arrow}${caption?'|'+caption+'|':''} ${aliases.get(to)}`);
  }
  return rows.join('\n')+'\n';
}
export function composerMarkdown(diagram) {
  const mermaid=composerMermaid(diagram);
  return `# ${markdownText(diagram.title)}\n\n**${COMPOSER_LEVELS[diagram.level]}** · Конструктор SEAF\n\n${markdownText(diagram.description)}\n\n\`\`\`mermaid\n${mermaid}\`\`\`\n\n## Объекты\n\n| Узел | Тип | Объект модели |\n|---|---|---|\n${diagram.nodes.map(node=>`| ${markdownText(node.title)} | ${markdownText(node.kind)} | ${node.ref?markdownText(node.ref.section+' / '+node.ref.id):'Визуальный узел — не является новой сущностью модели'} |`).join('\n')}\n\n## Связи\n\n| Источник | Получатель | Взаимодействие | Протокол | Данные |\n|---|---|---|---|---|\n${diagram.edges.map(edge=>`| ${markdownText(diagram.nodes.find(n=>n.key===edge.from).title)} | ${markdownText(diagram.nodes.find(n=>n.key===edge.to).title)} | ${markdownText(edge.title)} | ${markdownText(edge.protocol)} | ${markdownText(edge.data)} |`).join('\n')}\n\nСхема хранится в YAML и редактируется через **Конструктор схем**. Позиции визуального редактора сохранены в определении; Mermaid выполняет собственную автоматическую раскладку. Изменение схемы не меняет свойства и интеграции объектов модели автоматически.\n`;
}
export function composerPaths(id) {
  diagramId(id);
  return {yaml:'diagrams/composer/'+id+'.yaml',markdown:'diagrams/composer/'+id+'.md',document:'local.diagram.'+id};
}
async function optionalRead(engine, project, file) {
  try {return await engine.read(project,file);} catch(error) {if(error.code==='ENOENT') return null;throw error;}
}
function parseYaml(text, file) {
  const doc=YAML.parseDocument(text,{uniqueKeys:true});
  if(doc.errors.length || !object(doc.toJSON())) throw Error('Некорректный YAML: '+file);
  return doc;
}
async function diagramChanges(wb,project,input,snapshot,priorChanges=[],sourceModel=snapshot.model) {
  const p=await wb.engine.project(project);
  if(!p.manifest) throw Error('Для конструктора требуется манифест проекта');
  const diagram=normalizeDiagram(input,snapshot.model), paths=composerPaths(diagram.id);
  const existing=await optionalRead(wb.engine,project,paths.yaml), markdown=await optionalRead(wb.engine,project,paths.markdown);
  const existingEntity=snapshot.model[COMPOSER_SECTION]?.[diagram.id];
  if(existing) {
    const doc=parseYaml(existing.content,paths.yaml).toJSON();
    if(doc['x-seaf-composer']?.format!==COMPOSER_FORMAT || doc['x-seaf-composer']?.id!==diagram.id || doc[COMPOSER_SECTION]?.[diagram.id]?.format!==COMPOSER_FORMAT) throw Error('Файл уже существует и не принадлежит конструктору: '+paths.yaml);
    if(Object.keys(doc[COMPOSER_SECTION]).length!==1 || Object.keys(doc.docs||{}).some(id=>id!==paths.document)) throw Error('Файл схемы содержит посторонние определения; сохраните копию с новым ID');
    const unknown=Object.keys(doc).filter(key=>!['x-seaf-composer',COMPOSER_SECTION,'docs'].includes(key));
    if(unknown.length) throw Error('Файл схемы содержит посторонние разделы; сохраните копию с новым ID');
    normalizeDiagram(doc[COMPOSER_SECTION][diagram.id],sourceModel);
    if(doc.docs?.[paths.document]?.source!=='./'+path.posix.basename(paths.markdown))throw Error('Документ схемы использует другой источник; сохраните копию с новым ID');
  } else if(markdown || existingEntity) throw Error('ID или файл схемы уже занят; укажите новый ID');
  if(existingEntity && snapshot.provenance?.[COMPOSER_SECTION+'/'+diagram.id]!==paths.yaml) throw Error('Определение схемы находится в другом файле; сохраните копию с новым ID');
  if((snapshot.definitions?.[COMPOSER_SECTION+'/'+diagram.id]||[]).some(file=>file!==paths.yaml))throw Error('Определение схемы продублировано в другом файле');
  const existingDoc=snapshot.model.docs?.[paths.document], docSource=snapshot.provenance?.['docs/'+paths.document];
  if(existingDoc && docSource!==paths.yaml) throw Error('ID документа схемы уже занят другим документом');
  if((snapshot.definitions?.['docs/'+paths.document]||[]).some(file=>file!==paths.yaml))throw Error('Документ схемы продублирован в другом файле');
  const manifestFile=priorChanges.find(change=>change.path===p.manifest)||await wb.engine.read(project,p.manifest), root=parseYaml(manifestFile.content,p.manifest);
  const imports=root.get('imports')?.toJSON?.()||[];
  if(!Array.isArray(imports)||imports.some(item=>typeof item!=='string')) throw Error('imports манифеста должны быть списком строк');
  const rootDirectory=path.posix.dirname(p.manifest.replaceAll('\\','/'));
  const importPath=path.posix.relative(rootDirectory,paths.yaml);
  const changes=[];
  if(!imports.some(value=>!value.includes('://')&&path.posix.normalize(value.replaceAll('\\','/'))===path.posix.normalize(importPath))) {
    const sequence=root.get('imports');
    if(sequence&&Array.isArray(sequence.items)&&typeof sequence.add==='function')sequence.add(importPath);else root.set('imports',[...imports,importPath]);
    changes.push({path:p.manifest,content:/\.json$/i.test(p.manifest)?JSON.stringify(root.toJSON(),null,2)+'\n':root.toString()});
  }
  const menuTitle=diagram.title.replace(/[\\/]/g,'／')+' ('+diagram.id+')';
  const definition={'x-seaf-composer':{format:COMPOSER_FORMAT,id:diagram.id},[COMPOSER_SECTION]:{[diagram.id]:diagram},docs:{[paths.document]:{title:diagram.title,location:'Архитектура/Схемы/'+COMPOSER_LEVELS[diagram.level]+'/'+menuTitle,type:'markdown',source:'./'+path.posix.basename(paths.markdown)}}};
  changes.push({path:paths.yaml,content:YAML.stringify(definition)},{path:paths.markdown,content:composerMarkdown(diagram)});
  return {diagram,paths,changes};
}
/** Stateless handler. Domain dispatch owns authentication and forwards the project ID. */
export async function composerAction(wb,project,args={}) {
  const action=args.action||args.op;
  const snapshot=await wb.model(project), p=await wb.engine.project(project);
  if(action==='diagram_workspace')return diagramWorkspace(wb,project,args,snapshot);
  if(action==='diagram_list') {
    const definitions=snapshot.model[COMPOSER_SECTION]||{};
    if(!object(definitions))throw Error('Раздел '+COMPOSER_SECTION+' должен быть словарём схем');
    return Object.entries(definitions).map(([id,value])=>object(value)?({id,title:typeof value.title==='string'?value.title:id,level:value.level,format:value.format,file:snapshot.provenance?.[COMPOSER_SECTION+'/'+id]||null}):({id,title:'Некорректная схема: '+id,level:'Ошибка определения',format:null,file:snapshot.provenance?.[COMPOSER_SECTION+'/'+id]||null,invalid:true})).sort((a,b)=>String(a.title).localeCompare(String(b.title)));
  }
  if(action==='diagram_load') {
    const id=identifier(args.id,'ID схемы'), input=snapshot.model[COMPOSER_SECTION]?.[id];
    if(!input) throw Error('Схема не найдена: '+id);
    const diagram=normalizeDiagram(input,snapshot.model);
    return {diagram,svg:renderComposer(diagram),revision:snapshot.head,fingerprint:snapshot.fingerprint,file:snapshot.provenance?.[COMPOSER_SECTION+'/'+id]||null,paths:composerPaths(id)};
  }
  if(!['diagram_preview','diagram_draft'].includes(action)) throw Error('Неизвестное действие конструктора');
  const semanticOperations=args.semanticOperations||[];
  const editing=await buildDiagramEditing(wb,project,snapshot,semanticOperations);
  const built=await diagramChanges(wb,project,args.diagram,{...snapshot,model:editing.model},editing.changes,snapshot.model);
  const merged=new Map(editing.changes.map(change=>[change.path,change]));
  for(const change of built.changes){if(merged.has(change.path)&&change.path!==p.manifest)throw Error('Операции модели и схема изменяют один файл: '+change.path);merged.set(change.path,change);}
  built.changes=[...merged.values()];
  const effective=JSON.parse(JSON.stringify(editing.model));effective[COMPOSER_SECTION]||={};effective[COMPOSER_SECTION][built.diagram.id]=built.diagram;
  const impacts=deletionImpacts(snapshot.model,effective,editing.removed),unresolvedReferences=impacts.flatMap(impact=>impact.unresolved.map(ref=>({...ref,deleted:{section:impact.section,id:impact.id}})));
  const bindingWarnings=validateModelBindings(built.diagram,effective);
  const viewHash=hash(JSON.stringify({diagram:built.diagram,semanticOperations,revision:snapshot.head,fingerprint:snapshot.fingerprint,changes:built.changes}));
  if(action==='diagram_preview') return {...built,model:effective,...modelRelations(effective),semanticSummary:editing.summary,impacts,unresolvedReferences,svg:renderComposer(built.diagram),mermaid:composerMermaid(built.diagram),revision:snapshot.head,fingerprint:snapshot.fingerprint,viewHash,writable:!!p.writable,warnings:[...(built.diagram.nodes.some(node=>!node.ref)?['Визуальные узлы не создают объекты архитектурной модели.']:[]),...bindingWarnings,...(unresolvedReferences.length?['Удаляемые объекты ещё используются. Исправьте ссылки перед сохранением черновика.']:[])]};
  if(!p.writable) throw Error('Проект доступен только для чтения');
  if(args.revision!==snapshot.head || args.fingerprint!==snapshot.fingerprint || args.viewHash!==viewHash) throw Error('Предпросмотр устарел: схема или проект изменились. Повторите предпросмотр.');
  if(unresolvedReferences.length)throw Error('Удаление заблокировано: остаются ссылки на удаляемые объекты. Обновите связанные объекты и состав в этом же черновике.');
  if(impacts.some(impact=>impact.references.length)&&args.acknowledgeImpacts!==true)throw Error('Ознакомьтесь с влиянием удаления и подтвердите его перед сохранением черновика');
  return wb.saveDraft(project,{title:'Схема: '+built.diagram.title,baseHead:snapshot.head,baseFingerprint:snapshot.fingerprint,changes:built.changes,semanticOperations,impacts,semanticSummary:editing.summary,composer:{format:COMPOSER_FORMAT,id:built.diagram.id,viewHash}});
}
