import crypto from 'node:crypto';
import {editorSchema,editorDefinitions} from './editor-fields.mjs';

const map=v=>!!v&&typeof v==='object'&&!Array.isArray(v);
const clone=v=>JSON.parse(JSON.stringify(v));
const own=(v,k)=>Object.hasOwn(v||{},k);
const reserved=new Set(['__proto__','prototype','constructor']);
function key(v,name='ключ') {if(typeof v!=='string'||!v||v.length>250||reserved.has(v)||/[\u0000-\u001f]/.test(v))throw Error('Некорректный '+name);return v;}
function data(v,depth=0) {if(depth>50)throw Error('Превышена вложенность свойств');if(v&&typeof v==='object')for(const[k,x]of Object.entries(v)){key(k);data(x,depth+1);}return v;}
function canonical(v){return Array.isArray(v)?v.map(canonical):map(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;}
export const modelValueHash=value=>crypto.createHash('sha256').update(JSON.stringify(canonical(value))).digest('hex');
/** Map supported DocHub source arrows without reversing their stored owner/target identity. */
export function modelLinkDirection(value){
  if(value===undefined||value===null||value==='')return 'directed';
  const arrows={'-->':'directed','<--':'reverse','<->':'bidirectional','--':'undirected'};
  return typeof value==='string'&&Object.hasOwn(arrows,value)?arrows[value]:null;
}
function fields(v,allowed){if(!map(v))throw Error('Операция должна быть объектом');const extra=Object.keys(v).filter(k=>!allowed.includes(k));if(extra.length)throw Error('Неизвестные поля операции: '+extra.join(', '));}
function merge(a,b){for(const[k,v]of Object.entries(b))a[k]=map(v)?merge(map(a[k])?a[k]:{},v):clone(v);return a;}
function patch(old,value,remove=[]) {
  if(!map(value))throw Error('Свойства объекта должны быть словарём');data(value);
  if(!Array.isArray(remove)||remove.length>80)throw Error('Некорректный список удаляемых свойств');
  const next=merge(clone(old),value);
  for(const property of remove){
    if(typeof property!=='string'||!property||property.length>500)throw Error('Некорректный путь свойства');
    const parts=property.startsWith('/')?property.slice(1).split('/').map(x=>x.replaceAll('~1','/').replaceAll('~0','~')):property.split('.');parts.forEach(v=>key(v,'путь свойства'));
    const parent=parts.slice(0,-1).reduce((v,k)=>map(v)||Array.isArray(v)?v[k]:undefined,next);
    if(Array.isArray(parent))throw Error('Для изменения массива передайте его целиком');
    if(map(parent))delete parent[parts.at(-1)];
  }
  return next;
}
function assertHash(value,hash){if(typeof hash!=='string'||hash!==modelValueHash(value))throw Error('Объект или связь изменились: обновите рабочую область (beforeHash)');}
function objectAt(model,section,id){if(!map(model[section])||!own(model[section],id)||!map(model[section][id]))throw Error('Объект модели не найден: '+section+' / '+id);return model[section][id];}
export function componentParent(id){const dot=id.lastIndexOf('.');return dot>0?id.slice(0,dot):null;}
const children=(model,id)=>Object.keys(model.components||{}).filter(candidate=>componentParent(candidate)===id);
/** Interpret only explicit operations. Coordinates and visual labels are not architecture edits. */
export function analyzeSemanticOperations(base,operations=[]) {
  if(!Array.isArray(operations)||operations.length>100||JSON.stringify(operations).length>400000)throw Error('Допускается не более 100 семантических операций (400 КБ)');
  const model=clone(base),touched=new Map(),summary=[];
  for(const op of operations){
    fields(op,op?.kind==='link'?['kind','mode','from','index','beforeHash','value','removeProperties']:op?.kind==='child'?['kind','mode','parent','id','value']:['kind','mode','section','id','value','removeProperties','beforeHash']);
    if(!['entity','child','link'].includes(op.kind)||!['create','patch','delete'].includes(op.mode))throw Error('Неизвестная семантическая операция');
    if(op.kind==='link'){
      const from=key(op.from,'ID источника'),source=objectAt(model,'components',from);
      if(source.links!==undefined&&!Array.isArray(source.links))throw Error('components.links должен быть массивом');
      const links=clone(source.links||[]);
      if(op.mode==='create'){
        if(op.index!==undefined||op.beforeHash!==undefined)throw Error('Новая связь не должна иметь индекс существующей связи');
        if(!map(op.value))throw Error('Нужны свойства новой связи');data(op.value);links.push(clone(op.value));
      }else{
        if(!Number.isInteger(op.index)||op.index<0||!map(links[op.index]))throw Error('Связь по указанному индексу не найдена');
        assertHash(links[op.index],op.beforeHash);
        if(op.mode==='delete')links.splice(op.index,1);else links[op.index]=patch(links[op.index],op.value,op.removeProperties);
      }
      for(const link of links)if(!map(link)||typeof link.id!=='string')throw Error('Связь должна иметь ID получателя');
      source.links=links;touched.set('components/'+from,{section:'components',id:from});summary.push({kind:'link',mode:op.mode,from,index:op.index??links.length-1});continue;
    }
    const section=op.kind==='child'?'components':key(op.section,'раздел модели'),id=key(op.id,'ID объекта');
    if(section==='seaf.workbench.diagrams'||section==='x-seaf-composer')throw Error('Определения конструктора изменяются через схему, а не через операции объектов');
    if(model[section]!==undefined&&!map(model[section]))throw Error('Раздел модели должен быть словарём объектов');
    model[section]||={};const exists=own(model[section],id);
    if(op.kind==='child'){
      if(op.mode!=='create')throw Error('Состав поддерживает создание прямого ребёнка; изменение и удаление — обычные операции объекта');
      const parent=key(op.parent,'ID родителя');objectAt(model,'components',parent);
      if(componentParent(id)!==parent||!/^[A-Za-z0-9_][A-Za-z0-9_-]*$/.test(id.slice(parent.length+1)))throw Error('ID ребёнка должен иметь вид parent.child и обозначать прямого потомка');
    }
    if(op.mode==='create'){
      if(exists)throw Error('Объект уже существует: '+id);if(!map(op.value))throw Error('Нужны свойства нового объекта');data(op.value);model[section][id]=clone(op.value);
    }else{
      const old=objectAt(model,section,id);assertHash(old,op.beforeHash);
      if(op.mode==='delete')delete model[section][id];else model[section][id]=patch(old,op.value,op.removeProperties);
    }
    touched.set(section+'/'+id,{section,id});summary.push({kind:op.kind,mode:op.mode,section,id});
  }
  const entityOperations=[],removed=[];
  for(const ref of touched.values()){
    const was=own(base[ref.section],ref.id),now=own(model[ref.section],ref.id);
    if(!was&&!now)continue;
    if(was&&!now){entityOperations.push({...ref,mode:'delete'});removed.push(ref);}
    else if(!was)entityOperations.push({...ref,mode:'create',value:model[ref.section][ref.id]});
    else if(modelValueHash(base[ref.section][ref.id])!==modelValueHash(model[ref.section][ref.id]))entityOperations.push({...ref,mode:'replace',value:model[ref.section][ref.id]});
    if(ref.section==='components'&&now){
      const parent=componentParent(ref.id);
      if(!was&&parent&&!own(model.components,parent))throw Error('Не найден родитель DocHub-компонента: '+parent);
      const links=model.components[ref.id].links;
      if(links!==undefined&&!Array.isArray(links))throw Error('components.links должен быть массивом');
      for(const link of links||[]){if(!map(link)||typeof link.id!=='string')throw Error('Связь должна иметь ID получателя');if(!own(model.components,link.id)&&!removed.some(r=>r.section==='components'&&r.id===link.id)&&!operations.some(o=>o.kind==='entity'&&o.mode==='delete'&&o.section==='components'&&o.id===link.id))throw Error('Получатель связи не найден: '+link.id);}
    }
  }
  for(const adapter of declaredRelationAdapters(model).filter(a=>a.kind==='entity'))for(const ref of touched.values())if(ref.section===adapter.section&&own(model[ref.section],ref.id))for(const endpoint of adapter.endpointFields){
    const id=model[ref.section][ref.id][endpoint.name];
    if(typeof id!=='string'||!map(model[endpoint.section]?.[id])&&!removed.some(r=>r.section===endpoint.section&&r.id===id))throw Error('Не найден '+endpoint.name+' взаимодействия '+ref.id+' в разделе '+endpoint.section);
  }
  return {model,operations:entityOperations,touched:[...touched.values()],removed,summary};
}
function entitySpec(model,section){const schema=model.entities?.[section]?.schema||{};return Object.values(schema.patternProperties||{})[0]||schema.additionalProperties||schema;}
function targetSection(ref,model){if(typeof ref!=='string'||!ref.startsWith('#/$rels/'))return null;const target=ref.slice(8);return Object.keys(model).filter(section=>target===section||target.startsWith(section+'.')).sort((a,b)=>b.length-a.length)[0]||null;}
function typedReferenceHits(value,schema,deleted,model,path,out,depth=0){
  if(!map(schema)||depth>30)return;
  if(targetSection(schema.$ref,model)===deleted.section&&value===deleted.id)out.push(path);
  if(Array.isArray(value)&&schema.items)for(const[index,item]of value.entries())typedReferenceHits(item,schema.items,deleted,model,path+'/'+index,out,depth+1);
  if(map(value))for(const[name,spec]of Object.entries(schema.properties||{}))if(own(value,name))typedReferenceHits(value[name],spec,deleted,model,path+'/'+name,out,depth+1);
  for(const spec of schema.allOf||[])typedReferenceHits(value,spec,deleted,model,path,out,depth+1);
}
function referenceHits(model,deleted){
  const result=[];
  for(const[section,entities]of Object.entries(model))if(map(entities))for(const[id,value]of Object.entries(entities)){
    if(!map(value)||section===deleted.section&&id===deleted.id)continue;
    const paths=[];typedReferenceHits(value,entitySpec(model,section),deleted,model,'',paths);
    if(section==='components'){
      if(deleted.section==='components'){
        for(const[index,link]of(Array.isArray(value.links)?value.links:[]).entries())if(link?.id===deleted.id)paths.push('/links/'+index+'/id');
        if(componentParent(id)===deleted.id)paths.push('$DocHubParent');
      }
      for(const field of ['aspects','technologies'])if(deleted.section===field)for(const[index,ref]of(Array.isArray(value[field])?value[field]:[]).entries())if(ref===deleted.id)paths.push('/'+field+'/'+index);
    }
    if(section==='contexts'&&deleted.section==='components')for(const[index,ref]of(Array.isArray(value.components)?value.components:[]).entries())if(ref===deleted.id)paths.push('/components/'+index);
    if(section==='seaf.workbench.diagrams'){
      for(const[index,node]of(Array.isArray(value.nodes)?value.nodes:[]).entries())if(node?.ref?.section===deleted.section&&node.ref.id===deleted.id)paths.push('/nodes/'+index+'/ref');
      for(const[index,edge]of(Array.isArray(value.edges)?value.edges:[]).entries())if(edge?.binding&&(edge.binding.adapter==='entity'&&edge.binding.section===deleted.section&&edge.binding.id===deleted.id||edge.binding.adapter==='components.links'&&deleted.section==='components'&&edge.binding.from===deleted.id))paths.push('/edges/'+index+'/binding');
    }
    const unique=[...new Set(paths)];if(unique.length)result.push({section,id,paths:unique.slice(0,20),pathCount:unique.length});
  }
  return result;
}
export function deletionImpacts(base,effective,removed){return removed.map(ref=>({...ref,references:referenceHits(base,ref),unresolved:referenceHits(effective,ref)}));}
export function declaredRelationAdapters(model){
  const result=[];
  if(map(model.components))result.push({id:'components.links',title:'Связи компонентов (DocHub)',kind:'link',section:'components',endpointFields:[{name:'from',section:'components'},{name:'id',section:'components'}],guidedEndpoints:true,capabilities:{create:true,patch:true,delete:true}});
  for(const[section,definition]of Object.entries(model.entities||{})){
    const schema=definition?.schema||{},spec=Object.values(schema.patternProperties||{})[0]||schema.additionalProperties||schema;
    const endpoints=Object.entries(spec?.properties||{}).flatMap(([name,field])=>{
      const ref=field?.$ref;if(typeof ref!=='string'||!ref.startsWith('#/$rels/'))return[];
      const target=ref.slice(8),targetSection=Object.keys(model).filter(s=>target===s||target.startsWith(s+'.')).sort((a,b)=>b.length-a.length)[0];
      return targetSection?[{name,section:targetSection}]:[];
    });
    // Relationship semantics require explicitly declared source and target fields.
    const from=endpoints.find(e=>['from','source'].includes(e.name)),to=endpoints.find(e=>['to','target'].includes(e.name));
    if(from&&to)result.push({id:section,title:definition.title||section,kind:'entity',section,endpointFields:[from,to],guidedEndpoints:true,capabilities:{create:true,patch:true,delete:true}});
  }
  return result;
}
export function modelRelations(model){
  const adapters=declaredRelationAdapters(model),relations=[];
  for(const adapter of adapters){
    if(adapter.kind==='link'){
      for(const[from,source]of Object.entries(model.components||{}))for(const[index,value]of(Array.isArray(source?.links)?source.links:[]).entries())if(map(value))relations.push({adapter:adapter.id,kind:'link',title:value.title||'Связь компонентов',selector:{from,index,beforeHash:modelValueHash(value)},value,direction:modelLinkDirection(value.direction),fromRef:{section:'components',id:from},toRef:{section:'components',id:value.id},capabilities:adapter.capabilities});
    }else for(const[id,value]of Object.entries(model[adapter.section]||{}))if(map(value)){
      const[from,to]=adapter.endpointFields;relations.push({adapter:adapter.id,kind:'entity',title:value.title||adapter.title,selector:{section:adapter.section,id,beforeHash:modelValueHash(value)},value,fromRef:{section:from.section,id:value[from.name]},toRef:{section:to.section,id:value[to.name]},capabilities:adapter.capabilities});
    }
  }
  return {adapters,relations};
}
export async function buildDiagramEditing(wb,project,snapshot,semanticOperations=[]) {
  const semantic=analyzeSemanticOperations(snapshot.model,semanticOperations);
  let built={changes:[],model:semantic.model,baseHead:snapshot.head,baseFingerprint:snapshot.fingerprint};
  if(semantic.operations.length){built=await wb.buildOperations(project,semantic.operations);if(built.baseHead!==snapshot.head||built.baseFingerprint!==snapshot.fingerprint)throw Error('Проект изменился при подготовке модели. Повторите предпросмотр.');}
  return {...semantic,...built,summary:semantic.summary,removed:semantic.removed};
}
export async function diagramWorkspace(wb,project,args={},snapshot) {
  snapshot ||= await wb.model(project);
  const semantic=analyzeSemanticOperations(snapshot.model,args.semanticOperations||[]),model=semantic.model,refs=new Map();
  for(const node of args.diagram?.nodes||[])if(node?.ref&&map(model[node.ref.section]?.[node.ref.id]))refs.set(node.ref.section+'/'+node.ref.id,node.ref);
  for(const ref of semantic.touched)if(map(model[ref.section]?.[ref.id]))refs.set(ref.section+'/'+ref.id,ref);
  for(const ref of[...refs.values()])if(ref.section==='components')for(const id of children(model,ref.id))refs.set('components/'+id,{section:'components',id});
  const schemas=new Map(),definitions=await editorDefinitions(wb.engine,project,model);
  for(const section of new Set([...refs.values()].map(r=>r.section))){if(schemas.size>=15)break;schemas.set(section,await editorSchema(wb.engine,project,section,{model,definitions}));}
  const entities=[...refs.values()].slice(0,500).map(ref=>({...ref,value:model[ref.section][ref.id],beforeHash:modelValueHash(model[ref.section][ref.id]),schema:schemas.get(ref.section)||null,parent:ref.section==='components'?componentParent(ref.id):null,children:ref.section==='components'?children(model,ref.id):[],composition:ref.section==='components'?'dochub-dot-id':null}));
  const impacts=deletionImpacts(snapshot.model,model,semantic.removed);
  const componentIds=[...refs.values()].filter(ref=>ref.section==='components').map(ref=>ref.id);
  const contexts=Object.entries(model.contexts||{}).filter(([,value])=>map(value)).slice(0,500).map(([id,value])=>({id,title:value.title||id,components:Array.isArray(value.components)?value.components:null,beforeHash:modelValueHash(value),containsSelected:Array.isArray(value.components)?componentIds.filter(id=>value.components.includes(id)):[]}));
  return {model,effectiveEntities:entities,contexts,...modelRelations(model),impacts,unresolvedReferences:impacts.flatMap(i=>i.unresolved.map(ref=>({...ref,deleted:{section:i.section,id:i.id}}))),semanticSummary:semantic.summary,revision:snapshot.head,fingerprint:snapshot.fingerprint,writable:!!(await wb.engine.project(project)).writable,limits:{semanticOperations:100,composition:'DocHub direct children only; explicitly include new children in applicable contexts; other hierarchies use explicit entity properties; moving or renaming is not supported.'}};
}
export function normalizeModelBinding(binding){
  if(!map(binding))throw Error('Некорректная привязка связи');
  if(binding.adapter==='components.links'){
    fields(binding,['adapter','from','index','beforeHash']);key(binding.from);
    if(!Number.isInteger(binding.index)||binding.index<0||binding.index>10000||typeof binding.beforeHash!=='string'||!/^[a-f0-9]{64}$/.test(binding.beforeHash))throw Error('Некорректный селектор связи');
    return clone(binding);
  }
  fields(binding,['adapter','section','id']);if(binding.adapter!=='entity')throw Error('Неизвестный адаптер привязки');key(binding.section);key(binding.id);return clone(binding);
}
export function validateModelBindings(diagram,model){
  const {relations}=modelRelations(model),warnings=[];
  for(const edge of diagram.edges){
    if(!edge.binding)continue;
    const binding=edge.binding,relation=relations.find(r=>binding.adapter==='components.links'?r.adapter==='components.links'&&r.selector.from===binding.from&&r.selector.index===binding.index&&r.selector.beforeHash===binding.beforeHash:r.kind==='entity'&&r.selector.section===binding.section&&r.selector.id===binding.id);
    if(!relation)throw Error('Привязка связи «'+edge.key+'» устарела или не поддерживается. Обновите связь из модели либо снимите привязку.');
    const from=diagram.nodes.find(n=>n.key===edge.from)?.ref,to=diagram.nodes.find(n=>n.key===edge.to)?.ref;
    if(!from||!to||from.section!==relation.fromRef.section||from.id!==relation.fromRef.id||to.section!==relation.toRef.section||to.id!==relation.toRef.id)throw Error('Концы связи «'+edge.key+'» не совпадают с привязанным взаимодействием модели');
    if(binding.adapter==='components.links'){
      const direction=modelLinkDirection(relation.value.direction);
      if(direction&&direction!==edge.direction)throw Error('Направление привязанной связи «'+edge.key+'» отличается от модели. Обновите связь из модели либо явно измените её direction.');
      if(!direction)warnings.push('Направление модели для связи «'+edge.key+'» не поддерживается; оно не было изменено или угадано.');
    }
    warnings.push('Связь «'+edge.key+'» привязана к модели; изменение визуальной подписи само по себе не меняет взаимодействие.');
  }
  return warnings;
}
