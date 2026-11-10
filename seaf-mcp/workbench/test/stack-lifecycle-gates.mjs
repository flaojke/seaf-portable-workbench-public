// Optional, focused real-runtime Stack lifecycle. Every write targets a unique temp fixture.
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import {Engine} from '../../engine.mjs';
import {Workbench} from '../domain.mjs';
import {stackAction} from '../stack-views.mjs';
const bundle=path.resolve(process.env.SEAF_STACK_TEST_BUNDLE||'../dist/SEAF-Windows-x64-2.1.0');
const temp=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-stack-native-')),root=path.join(temp,'project'),config=path.join(temp,'projects.json');
const engine=new Engine(config,path.join(temp,'state')),report={productionWrites:false,bundle,checks:[],status:'running'},receipt=new URL('../../state/acceptance/stack-lifecycle.json',import.meta.url);
try{
 const original=await engine.fingerprint(path.join(bundle,'examples/shopflow'));await engine.copyArtifacts(path.join(bundle,'examples/shopflow'),root);
 await fs.writeFile(config,JSON.stringify({projects:[{id:'fixture',root,manifest:'root.yaml',writable:true,source:{kind:'directory'},validation:{runtime:'native',workspace:root,manifest:'workspace/root.yaml',native:{bundleRoot:bundle,stateRoot:path.join(temp,'runtime')}}}]}));
 const wb=await new Workbench(engine,{state:path.join(temp,'wb'),specRoot:null}).init(),p=await engine.project('fixture'),runtime=await engine.runtime(p);
 const live=await runtime.start({workspace:root,manifest:'workspace/root.yaml',timeout:30000});await engine.updateProject('fixture',{portal:live.url});
 const model=await wb.model('fixture'),id=Object.keys(model.model.components)[0];assert.ok(id);
 const stage=async title=>{const text=`link ${id} -> ${id} | ${title} | HTTPS | internal`;const preview=await stackAction(wb,'fixture',{op:'stack_sketch',text});const draft=await stackAction(wb,'fixture',{op:'stack_stage',text,fingerprint:preview.fingerprint,revision:preview.revision});return wb.proposeDraft('fixture',draft.id);};
 const proposal=await stage('Isolated Stack self-flow');const validation=await engine.validate(proposal.proposalId);assert.equal(validation.ok,true,JSON.stringify(validation));report.checks.push({name:'real native validation of Stack draft',rules:validation.rules});
 const saved=await engine.apply(proposal.proposalId);assert.equal(saved.status,'applied',JSON.stringify(saved));assert.equal(saved.reload.status,'updated');assert.equal(saved.reload.problems.length,0);report.checks.push({name:'apply and real portal reload',revision:saved.revision.id});
 const q=encodeURIComponent(`(components.\"${id}\".links)`),links=await fetch(live.url+'/core/storage/jsonata/'+q).then(r=>r.json());assert.ok(links.some(l=>l.title==='Isolated Stack self-flow'));report.checks.push({name:'portal serves applied Stack flow'});
 const beforeReplay=await engine.fingerprint(root),revisions=await wb.action({action:'revisions_list',project:'fixture'});const replay=await engine.apply(proposal.proposalId);assert.equal(replay.revision.id,saved.revision.id);assert.equal(await engine.fingerprint(root),beforeReplay);assert.equal((await wb.action({action:'revisions_list',project:'fixture'})).length,revisions.length);report.checks.push({name:'repeated apply preserves bytes and revision count'});
 const stale=await stage('Stale Stack self-flow');assert.equal((await engine.validate(stale.proposalId)).ok,true);await fs.appendFile(path.join(root,'root.yaml'),'\n# external fixture edit\n');const edited=await engine.fingerprint(root);await assert.rejects(engine.apply(stale.proposalId),/changed|stale/i);assert.equal(await engine.fingerprint(root),edited);report.checks.push({name:'stale apply rejects without overwriting external fixture edit'});
 assert.equal(await engine.fingerprint(path.join(bundle,'examples/shopflow')),original);report.checks.push({name:'original bundled example unchanged'});report.status='passed';
}catch(e){report.status='failed';report.error=e.message;process.exitCode=1;}finally{
 for(const runtime of engine.runtimes.values())await runtime.closeAll();
 await fs.mkdir(path.dirname(receipt.pathname.replace(/^\/(\w:)/,'$1')),{recursive:true});await fs.writeFile(receipt,JSON.stringify(report,null,2));
 const relative=path.relative(os.tmpdir(),temp);assert.ok(relative&&!relative.startsWith('..')&&!path.isAbsolute(relative));await fs.rm(temp,{recursive:true,force:true});console.log(JSON.stringify(report,null,2));
}
