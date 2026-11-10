import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import {Engine} from '../../engine.mjs';
import {Workbench} from '../domain.mjs';
import {COMPOSER_SECTION,normalizeDiagram,composerPaths,composerMermaid,composerMarkdown,renderComposer,composerAction} from '../diagram-composer.mjs';
import {composerPanel,renderLocalDiagram} from '../public/diagram-composer.js';
const model={components:{orders:{title:'Orders',owner:'Commerce',links:[{id:'delivery',title:'Dispatch',protocol:'HTTPS'}]},delivery:{title:'Delivery',owner:'Logistics'}}};
const definition=(level='application')=>({id:'checkout',title:'Checkout',level,nodes:[{key:'orders',ref:{section:'components',id:'orders'}},{key:'delivery',ref:{section:'components',id:'delivery'},x:400,y:100}],edges:[{key:'dispatch',from:'orders',to:'delivery',title:'Create delivery',protocol:'HTTPS',data:'Order and address'}],zones:[]});
async function fixture(t,{git=false}={}){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-composer-')),root=path.join(dir,'project');await fs.mkdir(root);
 t.after(async()=>{const target=await fs.realpath(dir);assert.ok(target.toLowerCase().startsWith((await fs.realpath(os.tmpdir())).toLowerCase()+path.sep));await fs.rm(target,{recursive:true,force:true});});
 const original='# Keep this root comment\nimports:\n  - model.yaml\n';await fs.writeFile(path.join(root,'root.yaml'),original);await fs.writeFile(path.join(root,'model.yaml'),YAML.stringify(model));
 const engine=new Engine(path.join(dir,'projects.json'),path.join(dir,'state'));
 if(git){await engine.git({root},['init','-b','main']);await engine.git({root},['add','.']);await engine.git({root},['-c','user.name=SEAF QA','-c','user.email=qa@localhost','commit','-m','Create isolated composer fixture']);}
 await engine.connectProject({id:'fixture',root,kind:git?'git':'directory',writable:true});
 const wb=await new Workbench(engine,{state:path.join(dir,'workbench')}).init();return{root,engine,wb,original};
}
test('three declared levels, model references and explicit visual nodes round trip',()=>{
 for(const level of ['network','application','component']){const input=definition(level);input.nodes.push({key:'gateway',title:'Gateway',kind:'firewall',zone:'dmz',x:10,y:12});input.zones=[{id:'dmz',title:'Public zone',trust:'Untrusted'}];const diagram=normalizeDiagram(input,model);assert.equal(diagram.level,level);assert.equal(diagram.nodes[0].title,'Orders');assert.equal(diagram.nodes[2].ref,undefined);assert.deepEqual(normalizeDiagram(diagram,model),diagram);assert.match(renderComposer(diagram),/Public zone/);assert.match(composerMermaid(diagram),/subgraph z0/);assert.match(composerMarkdown(diagram),/Визуальный узел/);}
});
test('bounded identities, missing references, malformed topology and excessive coordinates reject',()=>{
 for(const mutate of [d=>d.id='../x',d=>d.id='C:drive',d=>d.nodes[0].ref.id='missing',d=>d.nodes.push({...d.nodes[0]}),d=>d.edges[0].to='missing',d=>d.nodes[0].x=-1,d=>d.nodes[0].x=Infinity,d=>d.nodes[0].zone='unknown',d=>d.nodes=Array(201).fill(d.nodes[0]),d=>d.level='guessed']){const input=definition();mutate(input);assert.throws(()=>normalizeDiagram(input,model));}
 assert.throws(()=>composerPaths('../bad'));assert.throws(()=>normalizeDiagram(JSON.parse('{"id":"ok","title":"ok","nodes":[{"key":"constructor","title":"x"}]}'),model));
});
test('SVG and Markdown escape labels, Mermaid delimiters and injected fences',()=>{
 const input=definition();input.title='<script>bad</script> {{5+7}}';input.nodes[0].title='"<script>alert(1)</script>```';input.edges[0].title='x|y["z"]';const diagram=normalizeDiagram(input,model),svg=renderComposer(diagram),md=composerMarkdown(diagram);
 assert.ok(!svg.includes('<script>'));assert.match(svg,/&lt;script&gt;/);assert.ok(!md.includes('<script>'));assert.ok(!md.includes('{{'));assert.equal((md.match(/```/g)||[]).length,2);assert.match(composerMermaid(diagram),/#124;/);
});
test('preview and stage do not modify live files, stale diagrams reject before draft publication',async t=>{
 const f=await fixture(t),input=definition();
 const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:input});assert.equal(preview.changes.length,3);assert.match(preview.changes.find(c=>c.path==='root.yaml').content,/# Keep this root comment/);assert.match(preview.svg,/Orders/);
 const draft=await composerAction(f.wb,'fixture',{action:'diagram_draft',diagram:preview.diagram,revision:preview.revision,fingerprint:preview.fingerprint,viewHash:preview.viewHash});assert.ok(draft.id);assert.equal(await fs.readFile(path.join(f.root,'root.yaml'),'utf8'),f.original);assert.equal(await fs.stat(path.join(f.root,'diagrams')).catch(()=>null),null);
 const changed=clone(preview.diagram);changed.title='Concurrent UI edit';await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_draft',diagram:changed,revision:preview.revision,fingerprint:preview.fingerprint,viewHash:preview.viewHash}),/устарел/);
 await fs.appendFile(path.join(f.root,'model.yaml'),'# Changed on disk\n');await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_draft',diagram:preview.diagram,revision:preview.revision,fingerprint:preview.fingerprint,viewHash:preview.viewHash}),/устарел/);
});
const clone=value=>JSON.parse(JSON.stringify(value));
test('saved definition loads, updates exactly its files and preserves root imports',async t=>{
 const f=await fixture(t),preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()});
 for(const change of preview.changes){await fs.mkdir(path.dirname(path.join(f.root,change.path)),{recursive:true});await fs.writeFile(path.join(f.root,change.path),change.content);}
 const list=await composerAction(f.wb,'fixture',{action:'diagram_list'});assert.equal(list.length,1);assert.equal(list[0].id,'checkout');
 const loaded=await composerAction(f.wb,'fixture',{action:'diagram_load',id:'checkout'});assert.equal(loaded.diagram.nodes[1].x,400);assert.equal(loaded.diagram.edges[0].protocol,'HTTPS');
 loaded.diagram.nodes[1].x=650;loaded.diagram.title='Checkout changed';const update=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:loaded.diagram});assert.deepEqual(update.changes.map(c=>c.path),['diagrams/composer/checkout.yaml','diagrams/composer/checkout.md']);assert.equal(YAML.parse(update.changes[0].content)[COMPOSER_SECTION].checkout.nodes[1].x,650);assert.equal((await f.engine.model('fixture')).model.components.delivery.owner,'Logistics');
 const root=YAML.parse(await fs.readFile(path.join(f.root,'root.yaml'),'utf8'));assert.deepEqual(root.imports,['model.yaml','diagrams/composer/checkout.yaml']);
});
test('foreign file, foreign doc identity, read only target and duplicated definition do not overwrite',async t=>{
 const f=await fixture(t);await fs.mkdir(path.join(f.root,'diagrams/composer'),{recursive:true});await fs.writeFile(path.join(f.root,'diagrams/composer/checkout.yaml'),'components:\n  unrelated:\n    title: Keep me\n');
 await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()}),/не принадлежит/);
 assert.match(await fs.readFile(path.join(f.root,'diagrams/composer/checkout.yaml'),'utf8'),/Keep me/);
 const fresh=definition();fresh.id='fresh';const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:fresh});
 const config=JSON.parse(await fs.readFile(f.engine.configFile,'utf8'));config.projects[0].writable=false;await fs.writeFile(f.engine.configFile,JSON.stringify(config));
 await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_draft',diagram:preview.diagram,revision:preview.revision,fingerprint:preview.fingerprint,viewHash:preview.viewHash}),/только для чтения/);
});
test('nested project manifest receives correct relative root import',async t=>{
 const f=await fixture(t);await fs.mkdir(path.join(f.root,'architecture'));await fs.writeFile(path.join(f.root,'architecture/root.yaml'),'imports:\n - ../model.yaml\n');
 const config=JSON.parse(await fs.readFile(f.engine.configFile,'utf8'));config.projects[0].manifest='architecture/root.yaml';await fs.writeFile(f.engine.configFile,JSON.stringify(config));
 const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()});const root=YAML.parse(preview.changes.find(c=>c.path==='architecture/root.yaml').content);assert.deepEqual(root.imports,['../model.yaml','../diagrams/composer/checkout.yaml']);
});
test('Windows reserved device stems and case collisions cannot target existing files',async t=>{
 for(const id of ['CON','con.file','PrN','AUX','nul.anything','COM1','com9.tail','LPT1','lpt9.foo']){const input=definition();input.id=id;assert.throws(()=>normalizeDiagram(input,model),/Windows/);assert.throws(()=>composerPaths(id),/Windows/);}
 for(const id of ['console','auxiliary','com10','report-con'])assert.doesNotThrow(()=>composerPaths(id));
 if(process.platform!=='win32')return;
 const f=await fixture(t),input=definition();input.id='Checkout';const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:input});
 for(const c of preview.changes){await fs.mkdir(path.dirname(path.join(f.root,c.path)),{recursive:true});await fs.writeFile(path.join(f.root,c.path),c.content);}
 const before=await f.engine.fingerprint(f.root);input.id='checkout';await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:input}),/не принадлежит/);assert.equal(await f.engine.fingerprint(f.root),before);
});
test('unknown diagram properties reject instead of silently deleting manual metadata',async t=>{
 for(const mutate of [d=>d.unknown='keep',d=>d.nodes[0].custom={keep:true},d=>d.nodes[0].ref.custom='keep',d=>d.edges[0].custom=true]){const input=definition();mutate(input);assert.throws(()=>normalizeDiagram(input,model),/Неподдерживаемые свойства/);}
 const f=await fixture(t),preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()});
 for(const c of preview.changes){await fs.mkdir(path.dirname(path.join(f.root,c.path)),{recursive:true});await fs.writeFile(path.join(f.root,c.path),c.content);}
 const file=path.join(f.root,'diagrams/composer/checkout.yaml'),doc=YAML.parse(await fs.readFile(file,'utf8'));doc[COMPOSER_SECTION].checkout.custom='Keep this manual metadata';await fs.writeFile(file,YAML.stringify(doc));const before=await fs.readFile(file,'utf8');
 await assert.rejects(()=>composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()}),/Неподдерживаемые свойства/);assert.equal(await fs.readFile(file,'utf8'),before);
});
test('equivalent dot-prefixed import is preserved without a duplicate import write',async t=>{
 const f=await fixture(t),preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()});
 for(const c of preview.changes){await fs.mkdir(path.dirname(path.join(f.root,c.path)),{recursive:true});await fs.writeFile(path.join(f.root,c.path),c.content);}
 const root='# Keep canonical alternate spelling\nimports:\n - model.yaml\n - ./diagrams/composer/checkout.yaml\n';await fs.writeFile(path.join(f.root,'root.yaml'),root);
 const next=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()});assert.equal(next.changes.length,2);assert.equal(await fs.readFile(path.join(f.root,'root.yaml'),'utf8'),root);
});
test('JSON entry manifest remains valid JSON after adding the diagram import',async t=>{
 const f=await fixture(t);await fs.writeFile(path.join(f.root,'root.json'),JSON.stringify({imports:['model.yaml'],extra:{preserved:true}},null,2));const config=JSON.parse(await fs.readFile(f.engine.configFile,'utf8'));config.projects[0].manifest='root.json';await fs.writeFile(f.engine.configFile,JSON.stringify(config));
 const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:definition()}),change=preview.changes.find(c=>c.path==='root.json'),json=JSON.parse(change.content);assert.deepEqual(json.imports,['model.yaml','diagrams/composer/checkout.yaml']);assert.equal(json.extra.preserved,true);
});
test('deep Unicode directory source retains safe relative output paths',async t=>{
 const f=await fixture(t),deep=path.join(f.root,'Рабочие схемы '+('a'.repeat(90)),'Дополнительный уровень '+('b'.repeat(70)));await fs.mkdir(deep,{recursive:true});await fs.writeFile(path.join(deep,'root.yaml'),'imports:\n - model.yaml\n');await fs.writeFile(path.join(deep,'model.yaml'),YAML.stringify(model));
 const config=JSON.parse(await fs.readFile(f.engine.configFile,'utf8'));config.projects[0].root=deep;config.projects[0].validation.workspace=deep;await fs.writeFile(f.engine.configFile,JSON.stringify(config));
 const input=definition();input.id='diagram-'+('x'.repeat(90));const preview=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:input});for(const c of preview.changes){assert.ok(!path.isAbsolute(c.path)&&!c.path.includes('..'));const file=path.join(deep,c.path);await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,c.content);}
 assert.equal((await composerAction(f.wb,'fixture',{action:'diagram_load',id:input.id})).diagram.nodes.length,2);
});
test('instant local canvas escapes untrusted labels without requiring a server preview',()=>{
 const diagram=normalizeDiagram(definition('network'),model);diagram.nodes[0].title='<img src=x onerror=alert(1)>';
 const svg=renderLocalDiagram(diagram);assert.match(svg,/&lt;img/);assert.ok(!svg.includes('<img'));assert.match(svg,/data-composer-node="orders"/);assert.match(svg,/#315b9c/);
 const previous=globalThis.localStorage;try{globalThis.localStorage={getItem:()=>JSON.stringify({diagram:{format:'seaf-composer-v1',nodes:'broken'}})};const state={project:'fixture',projects:[{id:'fixture',writable:true}],model};const html=composerPanel(state);assert.match(html,/эскиз[^<]*(?:повреждён|другой формат)/);assert.equal(state.composer.diagram.nodes.length,0);}finally{if(previous===undefined)delete globalThis.localStorage;else globalThis.localStorage=previous;}
});
test('root import comments survive appending a diagram and identical titles retain distinct menu paths',async t=>{
 const f=await fixture(t);await fs.writeFile(path.join(f.root,'root.yaml'),'# Root information\nimports:\n  - model.yaml # Keep source explanation\n');
 const input=definition();input.title='Orders / Delivery';const first=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:input});assert.match(first.changes.find(c=>c.path==='root.yaml').content,/# Keep source explanation/);
 const doc=YAML.parse(first.changes.find(c=>c.path.endsWith('/checkout.yaml')).content).docs['local.diagram.checkout'];assert.match(doc.location,/Orders ／ Delivery \(checkout\)$/);
 for(const c of first.changes){await fs.mkdir(path.dirname(path.join(f.root,c.path)),{recursive:true});await fs.writeFile(path.join(f.root,c.path),c.content);}
 input.id='checkout-copy';const second=await composerAction(f.wb,'fixture',{action:'diagram_preview',diagram:input}),copy=YAML.parse(second.changes.find(c=>c.path.endsWith('/checkout-copy.yaml')).content).docs['local.diagram.checkout-copy'];assert.notEqual(copy.location,doc.location);
});
test('one invalid diagram row does not hide the other saved diagrams',async t=>{
 const f=await fixture(t);await fs.writeFile(path.join(f.root,'model.yaml'),YAML.stringify({...model,[COMPOSER_SECTION]:{broken:null,good:normalizeDiagram({...definition(),id:'good'},model)}}));
 const rows=await composerAction(f.wb,'fixture',{action:'diagram_list'});assert.equal(rows.length,2);assert.equal(rows.find(row=>row.id==='broken').invalid,true);assert.equal(rows.find(row=>row.id==='good').title,'Checkout');
});
