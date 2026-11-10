/** Isolated Docker acceptance. Run with SEAF_E2E=1; no production writes.
 * All generated projects, Git metadata and proposals stay under
 * seaf-mcp/state/acceptance/run-UUID. Preview containers are always stopped.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {Engine} from '../../engine.mjs';
import {Workbench} from '../domain.mjs';
import {validateDrawio} from '../drawio.mjs';

const service=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const acceptance=path.join(service,'state','acceptance');
const image=process.env.SEAF_E2E_IMAGE||'seaf-local:2026.33.0-workbench';
const project='shopflow-e2e';
const orders='demo.shop.orders',delivery='demo.shop.delivery';

test('Docker acceptance: batch, Git, validation, trust, previews, snapshots and draw.io',{
  skip:process.env.SEAF_E2E!=='1',timeout:360000
},async t=>{
  await fs.mkdir(acceptance,{recursive:true});
  const dir=path.join(acceptance,'run-'+randomUUID()),workspace=path.join(dir,'workspace'),root=path.join(workspace,'microservices-demo');
  assert.ok(path.resolve(dir).startsWith(path.resolve(acceptance)+path.sep));
  const log={started:new Date().toISOString(),status:'running',fixture:dir,image,steps:[],containers:[],productionWrites:false};
  const report=path.join(acceptance,'e2e.json');
  const save=()=>fs.writeFile(report,JSON.stringify(log,null,2));
  const bootstrap=new Engine(path.join(service,'projects.json'),path.join(dir,'bootstrap'));
  const production=await bootstrap.project('shopflow'),productionFingerprint=await bootstrap.fingerprint(production.root),productionHead=await bootstrap.git(production,['rev-parse','HEAD']);
  let engine,wb;
  const step=async(name,run)=>{
    const entry={name,started:new Date().toISOString(),status:'running'};log.steps.push(entry);await save();console.log('E2E start: '+name);
    const started=Date.now();try{entry.result=await run();entry.status='passed';}catch(error){entry.status='failed';entry.error={message:error.message,stack:error.stack};throw error;}finally{entry.durationMs=Date.now()-started;await save();console.log('E2E '+entry.status+': '+name+' ('+entry.durationMs+' ms)');}
  };
  async function validate(proposal){const result=await engine.validate(proposal.proposalId);assert.equal(result.ok,true,JSON.stringify(result.problems));assert.equal(result.rules,15,'The real SEAF runtime must execute all 15 validators');return result;}
  async function query(url,expression){const r=await fetch(url+'/seaf-core/api/core/storage/jsonata',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query:'('+expression+')',params:{}}),signal:AbortSignal.timeout(15000)});const body=await r.text();assert.equal(r.ok,true,'Runtime query failed: '+r.status+' '+body);return JSON.parse(body);}
  async function preview(a){const result=await wb.preview(project,a);log.containers.push(result.name);assert.match(result.url,/^http:\/\/127\.0\.0\.1:\d+$/);assert.notEqual(new URL(result.url).port,'8080');return result;}
  async function stop(entry){const stopped=await wb.stopPreview(project,entry.id);assert.equal(stopped.stopped,true);await assert.rejects(engine.docker(['inspect',entry.name]));return stopped;}
  try{
    await step('isolated fixture and exact Docker runtime',async()=>{
      await bootstrap.copyArtifacts(production.validation.workspace,workspace);
      const config={projects:[{id:project,title:'ShopFlow isolated acceptance',root,manifest:'root.yaml',writable:true,validation:{workspace,manifest:'workspace/root.yaml',image}}]};
      const configFile=path.join(dir,'projects.json');await fs.writeFile(configFile,JSON.stringify(config,null,2));
      await fs.mkdir(path.join(dir,'proposals'),{recursive:true});engine=new Engine(configFile,path.join(dir,'proposals'));
      const p=await engine.project(project);await engine.git(p,['init','-b','main']);await engine.git(p,['add','.']);await engine.git(p,['-c','user.name=SEAF E2E','-c','user.email=e2e@localhost','commit','-m','Isolated ShopFlow baseline']);
      await engine.clean(p);wb=await new Workbench(engine,{state:path.join(dir,'workbench'),specRoot:null}).init();
      log.baselineHead=await wb.head(p);await engine.git(p,['branch','e2e-baseline',log.baselineHead]);
      log.imageId=(await engine.docker(['image','inspect',image,'--format','{{.Id}}'])).stdout.trim();
      const model=await wb.model(project);assert.ok(model.model.components[delivery]);
      log.baselineOwner=model.model.components[orders].owner;
      return {head:log.baselineHead,imageId:log.imageId,components:Object.keys(model.model.components).length,files:model.files.length};
    });

    let bulkCommit;
    await step('batch of two edits → semantic diff → 15 real validators → Git apply, stale rejection and replay',async()=>{
      const before=await wb.model(project),draft=await wb.objectPropose(project,{title:'E2E batch ownership',operations:[
        {section:'components',id:orders,mode:'merge',value:{owner:'E2E Checkout'}},
        {section:'components',id:delivery,mode:'merge',value:{owner:'E2E Logistics'}}
      ]});
      assert.equal(draft.semanticDiff.summary.modified,2);assert.equal(draft.semanticDiff.summary.total,2);
      assert.equal((await wb.diff(project,{draftId:draft.id})).summary.modified,2);
      assert.equal((await wb.model(project)).head,before.head);assert.equal((await wb.model(project)).fingerprint,before.fingerprint);
      const proposal=await wb.proposeDraft(project,draft.id);assert.match(proposal.diff,/E2E Checkout/);assert.match(proposal.diff,/E2E Logistics/);
      const staleDraft=await wb.objectPropose(project,{operations:[{section:'components',id:orders,mode:'merge',value:{owner:'Stale owner'}}]});
      const staleProposal=await wb.proposeDraft(project,staleDraft.id),validation=await validate(proposal);
      const applied=await engine.apply(proposal.proposalId);bulkCommit=applied.commit;
      assert.match(bulkCommit,/^[a-f0-9]{40}$/);assert.notEqual(bulkCommit,before.head);
      assert.equal((await engine.entity(project,'components',orders)).value.owner,'E2E Checkout');
      assert.equal((await engine.entity(project,'components',delivery)).value.owner,'E2E Logistics');
      await engine.clean(await engine.project(project));
      await assert.rejects(wb.proposeDraft(project,staleDraft.id),/Stale draft/);
      await assert.rejects(engine.validate(staleProposal.proposalId),/Stale proposal/);
      const replay=await engine.apply(proposal.proposalId);assert.equal(replay.commit,bulkCommit);assert.equal((await wb.model(project)).head,bulkCommit);
      return {draft:draft.id,proposal:proposal.proposalId,semanticDiff:draft.semanticDiff,validation,commit:bulkCommit,reload:applied.reload,staleRejected:true,replayCommit:replay.commit};
    });

    await step('referenced Delivery Service deletion is rejected',async()=>{
      const proposal=await wb.objectPropose(project,{draft:false,title:'Invalid referenced deletion',operations:[{section:'components',id:delivery,mode:'delete'}]});
      const validation=await engine.validate(proposal.proposalId);assert.equal(validation.ok,false);assert.equal(validation.problems[0].id,'workbench.model-integrity');
      assert.ok(validation.problems[0].items.some(i=>i.to===delivery&&i.unresolved));
      await assert.rejects(engine.apply(proposal.proposalId),/Validate this proposal first/);
      assert.ok((await wb.model(project)).model.components[delivery]);
      return {proposal:proposal.proposalId,validation,applied:false};
    });

    await step('trust policy rejects HTTP and accepts explicit TLS through 15 runtime validators',async()=>{
      const current=(await wb.model(project)).model,links=current.components[delivery].links.map(l=>l.id===orders?{...l,dataClassification:'confidential',protocol:'HTTP',encrypted:false}:l);
      const operations=[{section:'components',id:orders,mode:'merge',value:{trustZone:'internal'}},{section:'components',id:delivery,mode:'merge',value:{trustZone:'partner',links}},{section:'trustPolicies',id:'e2e.require-tls',mode:'create',value:{classification:'confidential',fromZone:'partner',toZone:'internal',requireEncryption:true,allowedProtocols:['HTTPS']}}];
      const bad=await wb.objectPropose(project,{draft:false,title:'Invalid plaintext crossing',operations}),invalid=await engine.validate(bad.proposalId);
      assert.equal(invalid.ok,false);assert.ok(invalid.problems[0].items.some(i=>i.violations?.some(v=>v.policy==='e2e.require-tls')));
      const good=structuredClone(operations);good[1].value.links=links.map(l=>l.id===orders?{...l,protocol:'HTTPS',encrypted:true}:l);
      const proposal=await wb.objectPropose(project,{draft:false,title:'Explicit encrypted crossing',operations:good}),validation=await validate(proposal),applied=await engine.apply(proposal.proposalId);
      const flow=(await wb.graph(project,{focus:delivery,depth:1})).edges.find(e=>e.from===delivery&&e.to===orders);
      assert.equal(flow.policyStatus,'allowed');assert.equal(flow.encrypted,true);assert.equal(flow.protocol,'HTTPS');
      return {invalid,validation,commit:applied.commit,flow};
    });

    await step('branch preview serves an independent runtime without moving the live fixture HEAD',async()=>{
      const p=await engine.project(project),before=await wb.head(p),fingerprint=await engine.fingerprint(p.root),entry=await preview({ref:'e2e-baseline'});
      try{
        assert.equal(entry.commit,log.baselineHead);
        assert.equal(await query(entry.url,'$lookup(components,"'+orders+'").owner'),log.baselineOwner);
        const problems=await fetch(entry.url+'/core/storage/problems/',{signal:AbortSignal.timeout(15000)}).then(r=>r.json());assert.equal(problems.length,15);assert.ok(problems.every(p=>!p.error&&!p.items?.length));
        assert.equal(await wb.head(p),before);assert.equal(await engine.fingerprint(p.root),fingerprint);
        return {url:entry.url,commit:entry.commit,liveHead:before,owner:log.baselineOwner,validators:problems.length,stop:await stop(entry)};
      }finally{if(wb.previews.has(entry.id))await stop(entry);}
    });

    await step('snapshot preview restores old bytes after a new live fixture commit',async()=>{
      const p=await engine.project(project),snapshot=await wb.snapshot(project,'E2E reproducible ShopFlow'),owner=(await engine.entity(project,'components',orders)).value.owner;
      assert.equal((await wb.snapshotVerify(project,snapshot.id)).ok,true);assert.equal(snapshot.runtime.imageId,log.imageId);
      const proposal=await wb.objectPropose(project,{draft:false,title:'Advance live fixture after snapshot',operations:[{section:'components',id:orders,mode:'merge',value:{owner:'E2E After Snapshot'}}]}),validation=await validate(proposal),live=await engine.apply(proposal.proposalId);
      assert.notEqual(live.commit,snapshot.head);assert.equal((await engine.entity(project,'components',orders)).value.owner,'E2E After Snapshot');
      const entry=await preview({snapshotId:snapshot.id});
      try{
        const restoredOwner=await query(entry.url,'$lookup(components,"'+orders+'").owner');assert.equal(restoredOwner,owner);assert.notEqual(restoredOwner,'E2E After Snapshot');
        assert.equal(entry.commit,snapshot.head);assert.equal(await wb.head(p),live.commit);
        return {snapshot:{id:snapshot.id,head:snapshot.head,imageId:snapshot.runtime.imageId,files:snapshot.files.length},validation,liveCommit:live.commit,restoredOwner,url:entry.url,stop:await stop(entry)};
      }finally{if(wb.previews.has(entry.id))await stop(entry);}
    });

    await step('draw.io export → import → proposal with XML artifact → 15 runtime validators',async()=>{
      const before=(await wb.model(project)).head,{xml}=await wb.action({action:'drawio_export',project});assert.equal(validateDrawio(xml).valid,true);
      const imported=await wb.action({action:'drawio_import',project,xml,namespace:'e2e',owner:'Architecture Team'});assert.ok(imported.operations.length>0);
      const draft=await wb.saveDraft(project,{...imported,title:'E2E model + original draw.io XML',changes:[...imported.changes,{path:'diagrams/e2e.drawio',content:xml}]}),proposal=await wb.proposeDraft(project,draft.id);
      assert.ok(proposal.changes.some(c=>c.path==='diagrams/e2e.drawio'));assert.match(proposal.diff,/mxGraphModel/);
      const validation=await validate(proposal);assert.equal((await wb.model(project)).head,before);
      return {draft:draft.id,proposal:proposal.proposalId,objects:imported.operations.length,xmlBytes:Buffer.byteLength(xml),validation,liveHeadUnchanged:true};
    });

    assert.equal(await bootstrap.fingerprint(production.root),productionFingerprint);assert.equal(await bootstrap.git(production,['rev-parse','HEAD']),productionHead);
    log.status='passed';log.completed=new Date().toISOString();log.fixtureHead=await wb.head(await engine.project(project));log.productionUnchanged=true;
  }catch(error){log.status='failed';log.completed=new Date().toISOString();log.error={message:error.message,stack:error.stack};throw error;}
  finally{
    if(wb)for(const entry of [...wb.previews.values()])try{await wb.stopPreview(project,entry.id);}catch(error){(log.cleanupErrors||=[]).push({container:entry.name,message:error.message});}
    await save();
  }
});
