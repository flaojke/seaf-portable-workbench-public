import {test} from 'node:test';
import assert from 'node:assert/strict';
import {stackView,stackDiff,renderStack,stackHtml,sketch,stackAction,modelFingerprint} from '../stack-views.mjs';
import {unzipSync,strFromU8} from 'fflate';
const snapshot=(model,head='r1')=>({model,head,fingerprint:'workspace-'+head});
const model={components:{a:{title:'A',owner:'Team',technologies:['node','missing'],links:[{id:'b',title:'Calls'}]},b:{title:'B'}},contexts:{one:{components:['a']}},technologies:{node:{status:'supported'}}};
test('context, passport, unknown flows and escaped exports',()=>{
 assert.deepEqual(stackView(snapshot(model),{context:'one'}).nodes.map(n=>n.id),['a']);
 const passport=stackView(snapshot(model),{mode:'passport',focus:'b'});assert.equal(passport.nodes.length,2);
 const flow=stackView(snapshot(model),{mode:'dataflow'});assert.match(renderStack(flow),/Не указано/);
 const html=stackHtml(stackView(snapshot({components:{a:{title:'<script>alert(1)</script>'}}})));assert.ok(!html.includes('<script>'));assert.match(html,/&lt;script&gt;/);
 assert.doesNotThrow(()=>stackView(snapshot({components:{a:{links:{}},b:{}}}),{mode:'passport',focus:'a'}));
});
test('technology filters reflect catalog, not component status',()=>{
 const v=stackView(snapshot(model),{mode:'technology',technology:'node',catalogStatus:'supported'});assert.equal(v.nodes.length,1);assert.equal(v.nodes[0].catalog[1].catalogPresent,false);assert.equal(v.nodes[0].catalog[1].status,'Не указано');
 assert.equal(stackView(snapshot(model),{mode:'technology',catalogStatus:'retired'}).nodes.length,0);
});
test('native SEAF placement uses service app_components and declared stand/network',()=>{
 const m={...model,'seaf.ta.services.cluster':{host:{app_components:['a','missing'],stand:['prod'],network_connection:['net'] }},'seaf.ta.services.stand':{prod:{title:'Production'}},'seaf.ta.services.network':{net:{title:'Network'}}};
 const v=stackView(snapshot(m),{mode:'deployment'});assert.equal(v.edges.length,4);assert.ok(v.nodes.find(n=>n.id==='missing').unresolved);assert.ok(v.nodes.find(n=>n.id==='prod'));assert.ok(v.edges.every(e=>e.fromKey&&e.toKey));
 assert.equal(stackView(snapshot({stackDeployments:{fake:{component:'a'}}}),{mode:'deployment'}).nodes.length,0);
});
test('revision fingerprint tracks model and stable layout retains common nodes',()=>{
 const next=structuredClone(model);next.components.a.links[0].title='Renamed';next.components.a.owner='Other';next.components['0']={title:'First'};
 const a=stackView(snapshot(model),{project:'p'}),diff=stackDiff(snapshot(model),snapshot(next,'r2'),{project:'p'});
 for(const n of a.nodes)assert.deepEqual(diff.layout[n.key],a.layout[n.key]);assert.equal(diff.edges[0].change,'changed');assert.notEqual(diff.comparison.baseFingerprint,diff.comparison.targetFingerprint);
 assert.equal(modelFingerprint({a:1,b:2}),modelFingerprint({b:2,a:1}));
});
test('local description rejects guessing and preserves unrelated source fields',()=>{
 const p=sketch(model,'Сервис c: Новый сервис\nc передает данные в a: Запрос; протокол=HTTPS; класс=business');assert.equal(p.model.components.c.links[0].protocol,'HTTPS');assert.equal(p.model.components.a.owner,'Team');
 assert.throws(()=>sketch(model,'Build a scalable ecommerce platform'),/Unsupported description/);assert.throws(()=>sketch(model,'link a -> nonexistent | Calls'),/Unknown/);assert.throws(()=>sketch(model,'component a | Existing'),/already exists/);
});
test('staging checks both initial and build-time base without applying',async()=>{
 const current=snapshot(model),calls=[];const wb={model:async()=>current,buildOperations:async()=>({baseHead:current.head,baseFingerprint:'changed'}),saveDraft:async x=>calls.push(x)};
 await assert.rejects(()=>stackAction(wb,'p',{op:'stack_stage',text:'component c | C',revision:current.head,fingerprint:current.fingerprint}),/Stale sketch/);assert.equal(calls.length,0);
 wb.buildOperations=async()=>({baseHead:current.head,baseFingerprint:current.fingerprint});wb.saveDraft=async(p,d)=>d;const d=await stackAction(wb,'p',{op:'stack_stage',text:'component c | C',revision:current.head,fingerprint:current.fingerprint});assert.equal(d.operations[0].id,'c');
});
test('export has revision fingerprints, inventory, legend and hashes',async()=>{
 const wb={model:async()=>snapshot(model),gitModel:async()=>snapshot({...model,components:{b:{title:'Old'}}},'old')};const options={op:'stack_view',baseRef:'old'};const r=await stackAction(wb,'p',options);const png=Buffer.alloc(24);Buffer.from('89504e470d0a1a0a','hex').copy(png);png.writeUInt32BE(r.view.width,16);png.writeUInt32BE(r.view.height,20);
 const pack=await stackAction(wb,'p',{...options,op:'stack_export',viewHash:r.viewHash,png:png.toString('base64')});const files=unzipSync(Buffer.from(pack.base64,'base64'));assert.ok(files['diagram.png']);assert.ok(files['legend.json']);const manifest=JSON.parse(strFromU8(files['manifest.json']));assert.ok(manifest.comparison.baseFingerprint);assert.equal(manifest.files['inventory.json'].sha256.length,64);
 await assert.rejects(()=>stackAction(wb,'p',{...options,op:'stack_export',viewHash:'stale',png:png.toString('base64')}),/View changed/);
});

test('real directory Workbench previews and stages without editing source',async t=>{
 const fs=await import('node:fs/promises'),os=await import('node:os'),path=await import('node:path');const {Engine}=await import('../../engine.mjs'),{Workbench}=await import('../domain.mjs');
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-stack-'));t.after(()=>fs.rm(dir,{recursive:true,force:true}));const root=path.join(dir,'project');await fs.mkdir(root);const original='components:\n  a:\n    title: A\n';await fs.writeFile(path.join(root,'root.yaml'),original);
 const engine=new Engine(path.join(dir,'projects.json'),path.join(dir,'state'));await engine.connectProject({id:'p',root,kind:'directory',writable:true});const wb=await new Workbench(engine,{state:path.join(dir,'wb')}).init();
 const preview=await stackAction(wb,'p',{op:'stack_sketch',text:'Service b: B\nb sends data to a: Request; protocol=HTTPS'});assert.ok(preview.view.nodes.some(n=>n.id==='b'&&n.change==='added'));
 const draft=await stackAction(wb,'p',{op:'stack_stage',text:'Service b: B\nb sends data to a: Request; protocol=HTTPS',fingerprint:preview.fingerprint,revision:preview.revision});assert.ok(draft.id);assert.equal(await fs.readFile(path.join(root,'root.yaml'),'utf8'),original);
 const diff=await stackAction(wb,'p',{op:'stack_view',draftId:draft.id});assert.equal(diff.view.comparison.targetRevision,'draft:'+draft.id);assert.notEqual(diff.view.comparison.baseFingerprint,diff.view.comparison.targetFingerprint);
 await fs.writeFile(path.join(root,'root.yaml'),original+'  c:\n    title: C\n');await assert.rejects(()=>stackAction(wb,'p',{op:'stack_stage',text:'component b | B',fingerprint:preview.fingerprint,revision:preview.revision}),/Stale sketch/);
 await assert.rejects(()=>stackAction(wb,'p',{op:'stack_view',draftId:draft.id}),/Stale draft/);
});
