import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import YAML from 'yaml';
import {Engine} from '../../engine.mjs';
import {Workbench} from '../domain.mjs';
import {createWorkbenchServer} from '../server.mjs';
import {modelObjects,searchObjects,buildPassport,parseSequence,uxAction} from '../ux-services.mjs';

const snapshot={head:'abc123',model:{components:{'acme.orders':{title:'Order Service',owner:'Sales',links:[{id:'acme.delivery',title:'Dispatch'}]},'acme.delivery':{title:'Delivery Service',owner:'Logistics'},'acme.web':{title:'Web',links:[{id:'acme.orders'}]}},'kadzo.v2023.systems':{'company.erp':{title:'ERP',owner:'Finance'}},docs:{guide:{title:'Guide',description:'See acme.orders'}},imports:['ignored']},provenance:{'components/acme.orders':'systems.yaml','components/acme.delivery':'delivery.yaml','docs/guide':'docs.yaml'}};
test('full search is generic, ranked and does not truncate the 1501st system',()=>{
 const large=structuredClone(snapshot);
 for(let i=0;i<1501;i++)large.model.components['system.'+i]={title:'System '+i,owner:i%2?'Sales':'Logistics'};
 assert.equal(modelObjects(large).length,1506);
 assert.equal(searchObjects(large,'system.1500')[0].id,'system.1500');
 assert.equal(searchObjects(large,'Delivery Service')[0].id,'acme.delivery');
 assert.equal(searchObjects(large,'Finance')[0].section,'kadzo.v2023.systems');
 assert.equal(searchObjects(large,'missing label').length,0);
 assert.deepEqual(searchObjects(large,''),[]);
});
test('passport separates source, incoming, outgoing and real document references',()=>{
 const result=buildPassport(snapshot,'components','acme.orders');
 assert.equal(result.source.path,'systems.yaml');
 assert.ok(result.incoming.some(r=>r.id==='acme.web'));
 assert.ok(result.outgoing.some(r=>r.id==='acme.delivery'));
 assert.equal(result.incoming[0].from,'acme.web');
 assert.equal(result.outgoing[0].to,'acme.delivery');
 assert.equal(result.incoming.some(r=>r.id==='guide'),false);
 assert.ok(result.documents.some(r=>r.id==='guide'));
 assert.throws(()=>buildPassport(snapshot,'components','missing'),/not found/);
 assert.equal(snapshot.model.components['acme.orders'].owner,'Sales');
 const malformed=structuredClone(snapshot);malformed.model.components.invalid=null;
 assert.equal(buildPassport(malformed,'components','acme.orders').outgoing[0].to,'acme.delivery');
});
test('sequence parser resolves declared objects and preserves error branches without executing them',()=>{
 const source='```mermaid\nsequenceDiagram\n participant O as Order Service\n participant D as Delivery Service\n O->>D: Create shipment\n alt delivery failed\n D-->>O: ShipmentFailed\n else success\n D-->>O: ShipmentCreated\n end\n```';
 const [scenario]=parseSequence(source,snapshot.model);
 assert.equal(scenario.steps.length,3);
 assert.equal(scenario.participants.find(p=>p.alias==='D').id,'acme.delivery');
 assert.equal(scenario.steps[1].error,true);
 assert.equal(scenario.steps[1].from,'D');
 assert.equal(scenario.steps[1].to,'O');
 assert.match(scenario.steps[2].branch,/success/);
 assert.equal(parseSequence('# Not a sequence').length,0);
 const ambiguous={components:{one:{title:'Same'},two:{title:'Same'}}};
 const [unresolved]=parseSequence('sequenceDiagram\nparticipant X as Same\nX->>external: Call',ambiguous);
 assert.equal(unresolved.participants.find(p=>p.alias==='X').id,null);
 assert.equal(parseSequence('sequenceDiagram\nПокупатель->>Заказы: Оформить заказ')[0].steps[0].from,'Покупатель');
 assert.throws(()=>parseSequence('x'.repeat(500001)),/large/);
});
async function fixture(t){
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-ux-services-')),root=path.join(dir,'project');
 await fs.mkdir(root);
 await fs.writeFile(path.join(root,'root.yaml'),YAML.stringify(snapshot.model));
 await fs.mkdir(path.join(root,'docs'));
 await fs.writeFile(path.join(root,'docs/sequence.md'),'# Logistics checkout\n```mermaid\nsequenceDiagram\nparticipant O as Order Service\nparticipant D as Delivery Service\nO->>D: Dispatch orders\n```');
 await fs.writeFile(path.join(root,'secret.env'),'DO_NOT_EXPOSE=sentinel');
 const config=path.join(dir,'projects.json');
 // The fixture has an intentionally separate local directory and no production project.
 const model=structuredClone(snapshot.model);delete model.imports;
 await fs.writeFile(path.join(root,'root.yaml'),YAML.stringify(model));
 await fs.writeFile(config,JSON.stringify({projects:[{id:'fixture',root,manifest:'root.yaml',source:{kind:'directory',provider:'local'},writable:true,validation:{runtime:'native',workspace:root,manifest:'workspace/root.yaml'}}]}));
 const engine=new Engine(config,path.join(dir,'state'));
 const wb=await new Workbench(engine,{state:path.join(dir,'workbench'),specRoot:null}).init();
 t.after(async()=>{
  const actual=path.resolve(dir),base=path.resolve(os.tmpdir());
  assert.ok(actual.startsWith(base+path.sep)&&path.basename(actual).startsWith('seaf-ux-services-'));
  await fs.rm(actual,{recursive:true,force:true});
 });
 return {dir,root,engine,wb};
}
test('UX read services paginate, search source text and preserve model bytes',async t=>{
 const {wb,root}=await fixture(t),before=await fs.readFile(path.join(root,'root.yaml'));
 const found=await uxAction(wb,'fixture',{action:'ux_search',query:'Dispatch orders',limit:1,offset:0});
 assert.equal(found.results[0].kind,'artifact');assert.equal(found.results[0].path,'docs/sequence.md');
 assert.equal((await uxAction(wb,'fixture',{action:'ux_search',query:'Service',limit:1,offset:1})).results.length,1);
 await assert.rejects(()=>uxAction(wb,'fixture',{action:'ux_search',query:'x',limit:10000}),/pagination/);
 const scenarios=await uxAction(wb,'fixture',{action:'ux_scenarios'});
 assert.equal(scenarios.scenarios.length,1);
 assert.equal(scenarios.scenarios[0].participants.find(p=>p.alias==='D').id,'acme.delivery');
 await fs.writeFile(path.join(root,'docs/oversize.md'),'a'.repeat(500001));
 const withLarge=await uxAction(wb,'fixture',{action:'ux_scenarios'});
 assert.equal(withLarge.scenarios.length,1);assert.ok(withLarge.warnings.some(w=>w.includes('oversize')));
 await fs.writeFile(path.join(root,'docs/sequence.md'),'# Changed\nsequenceDiagram\nparticipant D as Delivery Service\nD->>acme.orders: Updated source');
 const refreshed=await uxAction(wb,'fixture',{action:'ux_scenarios'});
 assert.equal(refreshed.scenarios[0].steps[0].label,'Updated source');
 const passport=await uxAction(wb,'fixture',{action:'ux_passport',section:'components',id:'acme.delivery'});
 assert.ok(passport.documents.some(d=>d.path==='docs/sequence.md'));
 const source=await uxAction(wb,'fixture',{action:'ux_artifact',path:'docs/sequence.md'});assert.match(source.content,/sequenceDiagram/);
 for(const file of ['../projects.json','.env','secret.env'])await assert.rejects(()=>uxAction(wb,'fixture',{action:'ux_artifact',path:file}),/Disallowed/);
 assert.deepEqual(await fs.readFile(path.join(root,'root.yaml')),before);
});
test('HTTP read contract includes native project context and never applies model changes',async t=>{
 const {engine,dir,root}=await fixture(t),before=await fs.readFile(path.join(root,'root.yaml'));
 const api=await createWorkbenchServer({port:0,engine,state:path.join(dir,'http-state'),specRoot:null});
 t.after(()=>new Promise(resolve=>api.server.close(resolve)));
 const base='http://127.0.0.1:'+api.server.address().port;
 const session=await fetch(base+'/api/session').then(r=>r.json());
 const action=async args=>fetch(base+'/api/action',{method:'POST',headers:{'content-type':'application/json','x-seaf-csrf':session.csrf},body:JSON.stringify({project:'fixture',...args})}).then(r=>r.json());
 const model=await action({action:'model'});assert.equal(model.ok,true);
 assert.equal(model.result.context.sourceKind,'directory');assert.equal(model.result.context.root,root);assert.equal(model.result.context.revision,model.result.head);
 const result=await action({action:'ux_search',query:'ERP'});assert.equal(result.result.results[0].id,'company.erp');
 assert.deepEqual(await fs.readFile(path.join(root,'root.yaml')),before);
});
