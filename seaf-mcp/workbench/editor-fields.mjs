const labels={title:'Название',entity:'Тип компонента',owner:'Владелец',description:'Описание',from:'Источник',to:'Получатель',protocol:'Протокол',dataClassification:'Класс данных',trustZone:'Зона доверия',technology:'Технология'};
const refOptions=(ref,model)=>{
  const key=String(ref||'').replace(/^#\/\$rels\//,'');
  const section=Object.keys(model).filter(s=>key===s || key.startsWith(s+'.')).sort((a,b)=>b.length-a.length)[0];
  return section ? Object.entries(model[section]||{}).map(([value,v])=>({value,label:v?.title||value})) : [];
};
export async function editorDefinitions(engine,project,model,p){
 p ||= await engine.project(project);
 let definitions=model.entities||{};
 // Only metamodel definitions are fetched, never the complete runtime data lake.
 if(p.portal)try{
  const q=encodeURIComponent('(entities)');
  const r=await fetch(new URL('/core/storage/jsonata/'+q,p.portal),{signal:AbortSignal.timeout(2500)});
  if(r.ok){const data=await r.json();if(data && typeof data==='object' && !Array.isArray(data))definitions={...data,...definitions};}
 }catch{}
 return definitions;
}
export async function editorSchema(engine,project,section,options={}){
 const p=await engine.project(project),model=options.model||(await engine.model(project)).model;
 const definitions=options.definitions||await editorDefinitions(engine,project,model,p);
 const definition=definitions[section]||{},schema=definition.schema||{};
 const objectSchema=Object.values(schema.patternProperties||{})[0]||schema.additionalProperties||schema;
 const properties={...(objectSchema?.properties||{})};
 for(const field of ['title','description','owner'])properties[field] ||= {type:'string',title:labels[field]};
 const forms=Array.isArray(model.forms)?model.forms:Object.values(model.forms||{});
 const sections=new Set([...Object.keys(model),...Object.keys(definitions)]);
 const applies=form=>{
  if(!form||typeof form!=='object')return false;
  if(form.section)return form.section===section;
  const targets=(Array.isArray(form.entity)?form.entity:[form.entity]).filter(v=>typeof v==='string');
  return targets.includes(section)||(section==='components'&&(!targets.length||targets.some(target=>!sections.has(target))));
 };
 for(const form of forms.filter(applies))for(const [field,settings]of Object.entries(form.fields||{}))properties[field]={...properties[field],...settings};
 const fields=Object.entries(properties).filter(([name])=>!['__proto__','constructor','prototype'].includes(name)).slice(0,40).map(([name,settings])=>{
  let options=[];const spec=settings.items||settings;
  if(Array.isArray(spec.enum))options=spec.enum.map(v=>({value:v,label:String(v)}));
  else if(Array.isArray(settings.options))options=settings.options.map(v=>typeof v==='object'?v:{value:v,label:String(v)});
  else if(spec.$ref)options=refOptions(spec.$ref,model);
  const dictionary=model.dictionaries?.[settings.dictionary]||model.catalogs?.[settings.dictionary];
  if(dictionary){const values=dictionary.values||dictionary.items||dictionary;options=Array.isArray(values)?values.map(v=>typeof v==='object'?{value:v.id??v.value,label:v.title??v.label??v.id}:({value:v,label:String(v)})):Object.entries(values).map(([value,v])=>({value,label:v?.title||String(v)}));}
  // Existing values supplement user-defined fields without pretending to be enums.
  const suggestions=[...new Set(Object.values(model[section]||{}).map(v=>v?.[name]).filter(v=>typeof v==='string'))].sort();
  return {name,title:settings.title||labels[name]||name,type:settings.type||'string',required:(objectSchema?.required||[]).includes(name),options,suggestions,description:settings.description||'',array:settings.type==='array'};
 });
 return {section,title:definition.title||section,fields,sections:Object.entries(definitions).filter(([,v])=>v?.schema).map(([id,v])=>({id,title:v.title||id})),scope:'Explicit schema enums, reference entities, declared dictionaries and observed value suggestions; unsupported schema constructs remain editable as JSON.'};
}
