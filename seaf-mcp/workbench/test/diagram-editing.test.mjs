import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import {Engine} from '../../engine.mjs';
import {Workbench} from '../domain.mjs';
import {composerAction,normalizeDiagram,renderComposer,composerMermaid} from '../diagram-composer.mjs';
import {modelValueHash,modelLinkDirection,analyzeSemanticOperations,deletionImpacts,modelRelations,normalizeModelBinding,validateModelBindings} from '../diagram-editing.mjs';
import {editorSchema} from '../editor-fields.mjs';
const clone=v=>JSON.parse(JSON.stringify(v));
const model=()=>({components:{orders:{title:'Orders',owner:'Commerce',entity:'component',custom:{retain:true,remove:1},links:[{id:'delivery',title:'Dispatch',protocol:'HTTPS',encrypted:true,custom:{one:1}},{id:'delivery',title:'Dispatch',protocol:'AMQP',encrypted:true,custom:{two:2}}]},delivery:{title:'Delivery',owner:'Logistics',entity:'component'}},contexts:{checkout:{title:'Checkout',components:['orders','delivery']}},entities:{flows:{title:'Information flows',schema:{type:'object',additionalProperties:{type:'object',properties:{title:{type:'string'},from:{type:'string',$ref:'#/$rels/components'},to:{type:'string',$ref:'#/$rels/components'},protocol:{type:'string',enum:['HTTPS','AMQP']},classification:{type:'string',dictionary:'classes'}}}}}},dictionaries:{classes:{values:{internal:{title:'Internal'},public:{title:'Public'}}}},flows:{ship:{title:'Shipment',from:'orders',to:'delivery',protocol:'HTTPS',custom:{retain:1}}},custom:{asset:{title:'Custom asset',unmappedParent:'retain'}}});
const diagram=()=>({id:'checkout',title:'Checkout',level:'application',nodes:[{key:'orders',ref:{section:'components',id:'orders'}},{key:'delivery',ref:{section:'components',id:'delivery'},x:400}],edges:[],zones:[]});
const patch=(section,id,value,base)=>({kind:'entity',mode:'patch',section,id,value,beforeHash:modelValueHash(base[section][id])});
async function fixture(t,{git=false,nested=false,json=false}={}){
  const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-diagram-edit-')),root=path.join(dir,'project');await fs.mkdir(root);
  t.after(async()=>{const real=await fs.realpath(dir),parent=await fs.realpath(os.tmpdir());assert.ok(real.toLowerCase().startsWith(parent.toLowerCase()+path.sep));await fs.rm(real,{recursive:true,force:true});});
  const manifest=(nested?'nested/':'')+'root.'+(json?'json':'yaml');await fs.mkdir(path.dirname(path.join(root,manifest)),{recursive:true});
  await fs.writeFile(path.join(root,manifest),json?JSON.stringify({imports:[(nested?'../':'')+'model.yaml'],preserved:{yes:true}},null,2):'# Keep root comment\nimports:\n  - '+(nested?'../':'')+'model.yaml # Keep import explanation\n');await fs.writeFile(path.join(root,'model.yaml'),YAML.stringify(model()));
  const engine=new Engine(path.join(dir,'projects.json'),path.join(dir,'state'));
  if(git)for(const args of [['init','-b','main'],['add','.'],['-c','user.name=QA','-c','user.email=qa@localhost','commit','-m','Isolated semantic fixture']])await engine.git({root},args);
  if(json)await fs.writeFile(path.join(root,'root.yaml'),'imports:\n  - model.yaml\n');
  await engine.connectProject({id:'fixture',root,kind:git?'git':'directory',writable:true,manifest:json?'root.yaml':manifest});
  // Existing registrations may use JSON roots even though the picker offers YAML.
  const config=JSON.parse(await fs.readFile(engine.configFile,'utf8'));config.projects[0].manifest=manifest;await fs.writeFile(engine.configFile,JSON.stringify(config));
  const wb=await new Workbench(engine,{state:path.join(dir,'wb')}).init();return{root,manifest,engine,wb};
}
async function stage(f,preview,semanticOperations,extra={}){return composerAction(f.wb,'fixture',{action:'diagram_draft',diagram:preview.diagram,semanticOperations,revision:preview.revision,fingerprint:preview.fingerprint,viewHash:preview.viewHash,...extra});}

test('entity patches preserve unknown fields and distinguish removal from typed false/zero',()=>{
  const base=model(),op=patch('components','orders',{owner:'New team',custom:{added:false},count:0},base);op.removeProperties=['/custom/remove'];
  const result=analyzeSemanticOperations(base,[op]);assert.equal(result.model.components.orders.owner,'New team');assert.deepEqual(result.model.components.orders.custom,{retain:true,added:false});assert.equal(result.model.components.orders.count,0);assert.equal(result.model.components.orders.links[1].custom.two,2);assert.equal(base.components.orders.owner,'Commerce');assert.equal(result.operations.length,1);
});
test('parallel links use exact current index and hash with unrelated metadata preserved',()=>{
  const base=model(),op={kind:'link',mode:'patch',from:'orders',index:1,beforeHash:modelValueHash(base.components.orders.links[1]),value:{protocol:'Kafka'}};
  const result=analyzeSemanticOperations(base,[op]);assert.deepEqual(result.model.components.orders.links[0],base.components.orders.links[0]);assert.equal(result.model.components.orders.links[1].protocol,'Kafka');assert.equal(result.model.components.orders.links[1].encrypted,true);assert.deepEqual(result.model.components.orders.links[1].custom,{two:2});
  assert.throws(()=>analyzeSemanticOperations(base,[{...op,index:0}]),/beforeHash/);
});
test('sequential effective hashes support link create then patch and safe deletion index drift',()=>{
  const base=model(),create={kind:'link',mode:'create',from:'delivery',value:{id:'orders',title:'Status',encrypted:false}},first=analyzeSemanticOperations(base,[create]);
  const next={kind:'link',mode:'patch',from:'delivery',index:0,beforeHash:modelValueHash(first.model.components.delivery.links[0]),value:{protocol:'HTTPS'}};
  const result=analyzeSemanticOperations(base,[create,next]);assert.equal(result.model.components.delivery.links[0].encrypted,false);assert.equal(result.model.components.delivery.links[0].protocol,'HTTPS');assert.equal(result.operations.length,1);
  const remove={kind:'link',mode:'delete',from:'orders',index:0,beforeHash:modelValueHash(base.components.orders.links[0])};assert.throws(()=>analyzeSemanticOperations(base,[remove,{kind:'link',mode:'delete',from:'orders',index:1,beforeHash:modelValueHash(base.components.orders.links[1])}]),/индексу/);
});
test('DocHub direct children are explicit composition and deletion reports remaining children',()=>{
  const base=model(),create={kind:'child',mode:'create',parent:'orders',id:'orders.api',value:{title:'API',entity:'component',custom:1}},result=analyzeSemanticOperations(base,[create]);assert.equal(result.model.components['orders.api'].custom,1);
  assert.throws(()=>analyzeSemanticOperations(base,[{...create,id:'other.api'}]),/прямого/);assert.throws(()=>analyzeSemanticOperations(base,[{...create,id:'orders.deep.child'}]),/прямого/);
  const deleted=analyzeSemanticOperations(result.model,[{kind:'entity',mode:'delete',section:'components',id:'orders',beforeHash:modelValueHash(result.model.components.orders)}]);assert.ok(deletionImpacts(result.model,deleted.model,deleted.removed)[0].unresolved.some(ref=>ref.id==='orders.api'&&ref.paths.includes('$DocHubParent')));
});
test('declared custom relation schemas produce typed adapters while unmapped entities remain universal',()=>{
  const base=model(),result=modelRelations(base);assert.equal(result.adapters.length,2);const flow=result.relations.find(r=>r.kind==='entity');assert.deepEqual(flow.fromRef,{section:'components',id:'orders'});assert.equal(flow.selector.id,'ship');assert.equal(result.adapters.some(a=>a.id==='custom'),false);
  assert.throws(()=>analyzeSemanticOperations(base,[patch('flows','ship',{to:'absent'},base)]),/Не найден to/);
  assert.equal(analyzeSemanticOperations(base,[patch('custom','asset',{owner:'Ops'},base)]).model.custom.asset.unmappedParent,'retain');
});
test('invalid or unsafe operation batches cannot mutate the source model',()=>{
  const base=model(),before=JSON.stringify(base);
  for(const operations of [[{kind:'entity',mode:'patch',section:'components',id:'orders',value:{owner:'bad'}}],[JSON.parse('{"kind":"entity","mode":"create","section":"components","id":"evil","value":{"__proto__":{}}}')],Array(101).fill({}),[{kind:'entity',mode:'create',section:'components',id:'orphan.child',value:{title:'Missing parent'}}],[{kind:'link',mode:'create',from:'orders',value:{id:'absent'}}],[{kind:'entity',mode:'create',section:'seaf.workbench.diagrams',id:'unsafe',value:{}}]])assert.throws(()=>analyzeSemanticOperations(base,operations));
  assert.equal(JSON.stringify(base),before);assert.equal({}.polluted,undefined);
});
test('persistent bindings validate endpoints and reject stale or unsupported relation selectors',()=>{
  const base=model(),d=diagram();d.edges=[{key:'interaction',from:'orders',to:'delivery',binding:{adapter:'components.links',from:'orders',index:1,beforeHash:modelValueHash(base.components.orders.links[1])}}];const normalized=normalizeDiagram(d,base);assert.equal(validateModelBindings(normalized,base).length,1);
  const shifted=clone(base);shifted.components.orders.links.splice(0,1);assert.throws(()=>validateModelBindings(normalized,shifted),/устарела/);
  assert.throws(()=>normalizeModelBinding({adapter:'entity',section:'flows',id:'ship',extra:true}),/поля/);d.edges[0].binding={adapter:'entity',section:'flows',id:'ship'};assert.equal(validateModelBindings(normalizeDiagram(d,base),base).length,1);d.edges[0].from='delivery';assert.throws(()=>validateModelBindings(normalizeDiagram(d,base),base),/Концы/);
});
test('workspace returns effective selected entities, children, typed choices and fresh relation hashes',async t=>{
  const f=await fixture(t),ops=[{kind:'child',mode:'create',parent:'orders',id:'orders.api',value:{title:'API',entity:'component'}}],d=diagram();d.nodes.push({key:'flow',ref:{section:'flows',id:'ship'}});
  const w=await f.wb.action({project:'fixture',action:'diagram_workspace',diagram:d,semanticOperations:ops});assert.equal(w.effectiveEntities.find(e=>e.id==='orders').children[0],'orders.api');assert.equal(w.effectiveEntities.find(e=>e.id==='orders.api').parent,'orders');assert.equal(w.effectiveEntities.find(e=>e.id==='ship').schema.fields.find(field=>field.name==='classification').options[0].value,'internal');assert.equal(w.relations[0].selector.beforeHash,modelValueHash(w.relations[0].value));assert.equal(w.model.components['orders.api'].title,'API');
});
test('combined model and diagram preview merges shared root imports once and preserves comments',async t=>{
  const f=await fixture(t),base=model(),ops=[patch('components','orders',{owner:'Platform'},base),{kind:'child',mode:'create',parent:'orders',id:'orders.api',value:{title:'API',entity:'component'}},{kind:'entity',mode:'create',section:'flows',id:'status',value:{title:'Status',from:'delivery',to:'orders',protocol:'AMQP'}}],d=diagram();d.nodes.push({key:'api',ref:{section:'components',id:'orders.api'}});
  const before=await f.engine.fingerprint(f.root),preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:d,semanticOperations:ops});const root=preview.changes.filter(c=>c.path===f.manifest);assert.equal(root.length,1);assert.deepEqual(YAML.parse(root[0].content).imports,['model.yaml','architecture/workbench.yaml','diagrams/composer/checkout.yaml']);assert.match(root[0].content,/# Keep import explanation/);assert.equal(preview.model.components.orders.owner,'Platform');assert.equal(preview.model.flows.status.from,'delivery');assert.equal(new Set(preview.changes.map(c=>c.path)).size,preview.changes.length);const draft=await stage(f,preview,ops);assert.equal(draft.semanticOperations.length,3);assert.equal(draft.operations,undefined);assert.equal(await f.engine.fingerprint(f.root),before);
  const proposal=await f.wb.proposeDraft('fixture',draft.id);const actual=await f.engine.proposal(proposal.proposalId);assert.equal(actual.changes.length,preview.changes.length);assert.ok(actual.changes.some(c=>c.path.endsWith('/checkout.md')));assert.ok(actual.changes.some(c=>c.path==='architecture/workbench.yaml'));
});
test('multiple edits to one source entity collapse into a single complete preserved definition',async t=>{
  const f=await fixture(t),base=model(),first=patch('components','orders',{owner:'Ops'},base),effective=analyzeSemanticOperations(base,[first]).model,ops=[first,patch('components','orders',{description:'Reviewed'},effective),{kind:'link',mode:'patch',from:'orders',index:1,beforeHash:modelValueHash(effective.components.orders.links[1]),value:{protocol:'Kafka'}}];
  const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram(),semanticOperations:ops}),file=preview.changes.find(c=>c.path==='model.yaml'),saved=YAML.parse(file.content);assert.equal(saved.components.orders.owner,'Ops');assert.equal(saved.components.orders.description,'Reviewed');assert.equal(saved.components.orders.links[1].custom.two,2);assert.deepEqual(saved.custom,base.custom);assert.equal(preview.changes.filter(c=>c.path==='model.yaml').length,1);
});
test('stale semantic intent and external source changes invalidate an older combined preview',async t=>{
  const f=await fixture(t),ops=[patch('components','orders',{owner:'Ops'},model())],preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram(),semanticOperations:ops});await assert.rejects(()=>stage(f,preview,[patch('components','orders',{owner:'Changed'},model())]),/устарел/);await fs.appendFile(path.join(f.root,'model.yaml'),'# concurrent disk edit\n');await assert.rejects(()=>stage(f,preview,ops),/устарел/);
});
test('read only and invalid partial operation batches never stage or change live files',async t=>{
  const f=await fixture(t),before=await f.engine.fingerprint(f.root),ops=[patch('components','orders',{owner:'Ops'},model())],preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram(),semanticOperations:ops});await f.engine.updateProject('fixture',{writable:false});await assert.rejects(()=>stage(f,preview,ops),/чтения/);await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram(),semanticOperations:[...ops,{kind:'link',mode:'delete',from:'orders',index:99,beforeHash:'bad'}]}),/индексу/);assert.equal(await f.engine.fingerprint(f.root),before);assert.equal((await f.wb.drafts('fixture')).length,0);
});
test('deletion previews all remaining source references, blocks save and requires reviewed impacts after repair',async t=>{
  const f=await fixture(t),base=model(),d=diagram();d.nodes=d.nodes.slice(0,1);const ops=[{kind:'entity',mode:'delete',section:'components',id:'delivery',beforeHash:modelValueHash(base.components.delivery)},patch('components','orders',{links:[]},base)];
  const blocked=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:d,semanticOperations:ops});assert.ok(blocked.unresolvedReferences.some(r=>r.section==='contexts'));assert.ok(blocked.unresolvedReferences.some(r=>r.section==='flows'));await assert.rejects(()=>stage(f,blocked,ops,{acknowledgeImpacts:true}),/остаются ссылки/);
  ops.push(patch('contexts','checkout',{components:['orders']},base),{kind:'entity',mode:'delete',section:'flows',id:'ship',beforeHash:modelValueHash(base.flows.ship)});const fixed=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:d,semanticOperations:ops});assert.equal(fixed.unresolvedReferences.length,0);await assert.rejects(()=>stage(f,fixed,ops),/подтвердите/);assert.ok((await stage(f,fixed,ops,{acknowledgeImpacts:true})).id);
});
test('nested JSON manifests retain valid JSON and both relative imports in a combined change',async t=>{
  const f=await fixture(t,{nested:true,json:true}),ops=[{kind:'entity',mode:'create',section:'custom',id:'new',value:{title:'New'}}];const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram(),semanticOperations:ops}),root=JSON.parse(preview.changes.find(c=>c.path===f.manifest).content);assert.deepEqual(root.imports,['../model.yaml','../architecture/workbench.yaml','../diagrams/composer/checkout.yaml']);assert.equal(root.preserved.yes,true);
});
test('Git proposal has one base and no commit before normal validation and apply lifecycle',async t=>{
  const f=await fixture(t,{git:true}),p=await f.engine.project('fixture'),head=await f.engine.git(p,['rev-parse','HEAD']),ops=[patch('components','orders',{owner:'Ops'},model())],preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram(),semanticOperations:ops}),draft=await stage(f,preview,ops);await f.wb.proposeDraft('fixture',draft.id);assert.equal(await f.engine.git(p,['rev-parse','HEAD']),head);assert.equal(await f.engine.git(p,['status','--porcelain']),'');
});
test('deletion references are section-aware and ignore prose or same IDs in unrelated collections',()=>{
  const base=model();base.custom.delivery={title:'delivery',description:'delivery'};base.components.orders.description='delivery';base.entities.custom={schema:{type:'object',additionalProperties:{type:'object',properties:{related:{type:'string',$ref:'#/$rels/flows'},typedComponents:{type:'array',items:{type:'string',$ref:'#/$rels/components'}}}}}};
  base.custom.delivery.related='delivery';base.custom.delivery.typedComponents=['delivery'];
  const effective=clone(base);delete effective.components.delivery;effective.components.orders.links=[];effective.contexts.checkout.components=['orders'];delete effective.flows.ship;
  const impacts=deletionImpacts(base,effective,[{section:'components',id:'delivery'}]);assert.deepEqual(impacts[0].unresolved.map(x=>[x.section,x.id,x.paths]),[['custom','delivery',['/typedComponents/0']]]);effective.custom.delivery.typedComponents=[];assert.equal(deletionImpacts(base,effective,[{section:'components',id:'delivery'}])[0].unresolved.length,0);
});
test('atomic deletion removes references from an existing saved diagram against its original ownership base',async t=>{
  const f=await fixture(t),initial=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:diagram()});
  for(const change of initial.changes){const file=path.join(f.root,change.path);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,change.content);}
  const base=(await f.engine.model('fixture')).model,updated=clone(initial.diagram);updated.nodes=updated.nodes.slice(0,1);const ops=[{kind:'entity',mode:'delete',section:'components',id:'delivery',beforeHash:modelValueHash(base.components.delivery)},patch('components','orders',{links:[]},base),patch('contexts','checkout',{components:['orders']},base),{kind:'entity',mode:'delete',section:'flows',id:'ship',beforeHash:modelValueHash(base.flows.ship)}];
  const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:updated,semanticOperations:ops});assert.equal(preview.unresolvedReferences.length,0);assert.ok((await stage(f,preview,ops,{acknowledgeImpacts:true})).id);
});
test('link endpoints validate the final atomic model while exact selectors protect each intermediate array',()=>{
  const base={components:{a:{title:'A',links:[{id:'b',title:'remove'},{id:'c',title:'keep'}]},b:{title:'B'},c:{title:'C'}}};
  const ops=[{kind:'entity',mode:'delete',section:'components',id:'b',beforeHash:modelValueHash(base.components.b)},{kind:'link',mode:'patch',from:'a',index:1,beforeHash:modelValueHash(base.components.a.links[1]),value:{protocol:'HTTPS'}},{kind:'link',mode:'delete',from:'a',index:0,beforeHash:modelValueHash(base.components.a.links[0])}];
  const effective=analyzeSemanticOperations(base,ops);assert.deepEqual(effective.model.components.a.links,[{id:'c',title:'keep',protocol:'HTTPS'}]);assert.equal(deletionImpacts(base,effective.model,effective.removed)[0].unresolved.length,0);
  const create=[{kind:'link',mode:'create',from:'c',value:{id:'d',title:'new'}},{kind:'entity',mode:'create',section:'components',id:'d',value:{title:'D'}}];assert.equal(analyzeSemanticOperations(base,create).model.components.c.links[0].id,'d');
});
test('workspace choices follow pending creation and deletion while legacy editor schema remains source-based',async t=>{
  const f=await fixture(t),base=model(),d=diagram();d.nodes.push({key:'flow',ref:{section:'flows',id:'ship'}});
  const create={kind:'child',mode:'create',parent:'orders',id:'orders.api',value:{title:'API',entity:'component'}};
  const created=await composerAction(f.wb,'fixture',{action:'diagram_workspace',diagram:d,semanticOperations:[create]});assert.ok(created.effectiveEntities.find(e=>e.id==='ship').schema.fields.find(f=>f.name==='to').options.some(o=>o.value==='orders.api'));
  assert.ok(!(await editorSchema(f.engine,'fixture','flows')).fields.find(f=>f.name==='to').options.some(o=>o.value==='orders.api'));
  const remove={kind:'entity',mode:'delete',section:'components',id:'delivery',beforeHash:modelValueHash(base.components.delivery)};
  const deleted=await composerAction(f.wb,'fixture',{action:'diagram_workspace',diagram:d,semanticOperations:[remove]});assert.ok(!deleted.effectiveEntities.find(e=>e.id==='ship').schema.fields.find(f=>f.name==='to').options.some(o=>o.value==='delivery'));assert.equal(deleted.model.custom.asset.unmappedParent,'retain');
});
test('all four visual arrow directions round trip to SVG markers and Mermaid without changing endpoints',()=>{
  for(const[direction,arrow,start,end]of[['directed','-->',false,true],['reverse','-->',true,false],['bidirectional','<-->',true,true],['undirected','---',false,false]]){
    const d=diagram();d.edges=[{key:'interaction',from:'orders',to:'delivery',title:'Dispatch',direction}];const normalized=normalizeDiagram(d,model()),svg=renderComposer(normalized),mermaid=composerMermaid(normalized);
    assert.equal(normalized.edges[0].direction,direction);assert.equal(normalized.edges[0].from,'orders');assert.equal(normalized.edges[0].to,'delivery');assert.equal(svg.includes('marker-start="url(#composer-arrow)"'),start);assert.equal(svg.includes('marker-end="url(#composer-arrow)"'),end);assert.match(svg,/orient="auto-start-reverse"/);assert.ok(mermaid.includes(direction==='reverse'?'n1 -->|Dispatch| n0':'n0 '+arrow+'|Dispatch| n1'));
  }
  for(const direction of [0,false,{},'sideways']){const d=diagram();d.edges=[{key:'invalid',from:'orders',to:'delivery',direction}];assert.throws(()=>normalizeDiagram(d,model()),/направление/);}
});
test('bound DocHub reverse and bidirectional links retain owner identity and require faithful arrow display',()=>{
  for(const[raw,direction]of[['-->','directed'],['<--','reverse'],['<->','bidirectional'],['--','undirected']]){
    const base=model();base.components.orders.links[0].direction=raw;const before=JSON.stringify(base),d=diagram();d.edges=[{key:'interaction',from:'orders',to:'delivery',direction,binding:{adapter:'components.links',from:'orders',index:0,beforeHash:modelValueHash(base.components.orders.links[0])}}];
    const normalized=normalizeDiagram(d,base);assert.equal(modelLinkDirection(raw),direction);assert.equal(modelRelations(base).relations[0].direction,direction);assert.equal(validateModelBindings(normalized,base).length,1);assert.equal(normalized.edges[0].binding.from,'orders');assert.equal(JSON.stringify(base),before);
    normalized.edges[0].direction=direction==='directed'?'reverse':'directed';assert.throws(()=>validateModelBindings(normalized,base),/Направление.*отличается/);
  }
  assert.equal(modelLinkDirection(undefined),'directed');for(const value of ['unknown','__proto__','constructor',17,{}])assert.equal(modelLinkDirection(value),null);
  const base=model();base.components.orders.links[0].direction='custom-arrow';const d=diagram();d.edges=[{key:'custom',from:'orders',to:'delivery',binding:{adapter:'components.links',from:'orders',index:0,beforeHash:modelValueHash(base.components.orders.links[0])}}];assert.ok(validateModelBindings(normalizeDiagram(d,base),base).some(w=>w.includes('не поддерживается')));assert.equal(base.components.orders.links[0].direction,'custom-arrow');
});
