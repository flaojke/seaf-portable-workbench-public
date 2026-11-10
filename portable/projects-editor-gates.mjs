import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {Engine} from '../seaf-mcp/engine.mjs';
import {createWorkbenchServer} from '../seaf-mcp/workbench/server.mjs';
import {createOfflineServer} from './offline.mjs';

const here=path.dirname(fileURLToPath(import.meta.url)), require=createRequire(new URL('../seaf-mcp/package.json',import.meta.url));
const {chromium}=require(process.env.SEAF_PLAYWRIGHT||'playwright'), {unzipSync}=require('fflate'), YAML=require('yaml');
const bundle=path.resolve(process.env.SEAF_TEST_BUNDLE||'dist/SEAF-Portable-Windows-x64');
const sourceCore=process.env.SEAF_TEST_CORE_ROOT?path.resolve(process.env.SEAF_TEST_CORE_ROOT):null;
await fs.access(path.join(bundle,'runtime/node/node.exe'));
await fs.access(path.join(bundle,'runtime/offline/manifest.json'));
const output=path.join(here,'state/projects-editor-gates'), run=path.join(output,'run-'+crypto.randomUUID());
await fs.mkdir(run,{recursive:true});
const configFile=path.join(run,'data/projects.json'), fixtureRoot=path.join(run,'Проекты Windows с пробелами');
await fs.mkdir(path.dirname(configFile),{recursive:true});await fs.mkdir(fixtureRoot,{recursive:true});
const state=path.join(run,'data/state'),engine=new Engine(configFile,state), report={status:'running',started:new Date().toISOString(),fixture:run,steps:[],externalRequests:[],pageErrors:[],productionWrites:false};
let workbench,offline,browser,context,page,base,local,gitProject,dialogPlan=[];
const save=()=>fs.writeFile(path.join(output,'result.json'),JSON.stringify(report,null,2));
const step=async(name,fn)=>{const s={name,status:'running',started:new Date().toISOString()};report.steps.push(s);await save();console.log('Portable projects/editor: '+name);try{s.result=await fn();s.status='passed';}catch(e){s.status='failed';s.error=e.stack||e.message;if(page)await page.screenshot({path:path.join(output,'failure.png'),fullPage:true}).catch(()=>{});throw e;}finally{await save();}};
const fixtureModel=title=>({
  components:{qa:{title,entity:'component',owner:'Engineering'},'qa.orders':{title:'Order Service',entity:'component',owner:'Engineering',stage:'draft',description:'Own isolated test orders',links:[{id:'qa.delivery',title:'Dispatch',direction:'-->',protocol:'HTTP'}]},'qa.delivery':{title:'Delivery Service',entity:'component',owner:'Logistics',stage:'draft',description:'Own isolated test delivery'}},
  contexts:{'qa.all':{title:title+' — context',location:title,components:['qa','qa.*'],presentation:'plantuml'}},
  catalogs:{owners:{values:{Engineering:{title:'Engineering'},Logistics:{title:'Logistics'},Platform:{title:'Platform'}}}},
  entities:{components:{title:'QA components',schema:{type:'object',patternProperties:{'.*':{type:'object',properties:{stage:{title:'Lifecycle',type:'string',enum:['draft','active']},owner:{title:'Team',type:'string',dictionary:'owners'}},additionalProperties:true}}}}},
  rules:{validators:{'qa.required.owner':{title:'Owner is set',source:'([components.$spread().($id := $keys()[0]; $c := $lookup($,$id); {"id":$id,"owner":$c.owner})[$not(owner)].{"uid":"qa-owner-" & id,"description":"Owner missing","location":"/entities/components/blank?dh-component-id=" & id}])'}}},
});
async function fixture(name,title,asGit=false){const root=path.join(fixtureRoot,name);await fs.mkdir(root,{recursive:true});await fs.writeFile(path.join(root,'root.yaml'),YAML.stringify(fixtureModel(title)));await fs.writeFile(path.join(root,'.env'),'SEAF_QA_SECRET=DO_NOT_EXPORT\n');if(asGit){await fs.writeFile(path.join(root,'.gitignore'),'.env\n');await engine.git({root},['init','-b','main']);await engine.git({root},['add','root.yaml','.gitignore']);await engine.git({root},['-c','user.name=SEAF QA','-c','user.email=qa@localhost','commit','-m','Create isolated UI fixture']);await engine.git({root},['remote','add','origin','https://gitverse.ru/qa/seaf-offline-fixture.git']);}return root;}
async function api(action,args={}){const s=await fetch(base+'/api/session').then(r=>r.json()),r=await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json','X-SEAF-CSRF':s.csrf},body:JSON.stringify({action,...args})}),b=await r.json();if(!b.ok)throw Error(b.error);return b.result;}
async function configureNativeSource(id){if(!sourceCore)return;const p=await engine.project(id);await engine.updateProject(id,{validation:{...p.validation,native:{bundleRoot:bundle,node:path.join(bundle,'runtime/node/node.exe'),coreRoot:sourceCore,stateRoot:path.join(state,'native-runtime'),offlineUrl:offline.url}}});}
async function idle(){await page.locator('#progress').waitFor({state:'hidden',timeout:120000});}
async function closeResult(){const dialog=page.locator('#result-dialog[open]');if(await dialog.count())await dialog.getByRole('button',{name:'Закрыть',exact:true}).click();}
async function nav(name){await closeResult();await page.getByRole('button',{name,exact:true}).click();await idle();}
function responseAction(response,action){if(!response.url().endsWith('/api/action')||response.request().method()!=='POST')return false;try{return response.request().postDataJSON().action===action;}catch{return false;}}
async function uiAction(action,click){const pending=page.waitForResponse(r=>responseAction(r,action),{timeout:120000});await click();const response=await pending,b=await response.json();assert.equal(b.ok,true,b.error);await idle();return b.result;}
const card=id=>page.locator('article.project-card').filter({has:page.locator(`[data-project-id="${id}"]`)});
const projectButton=(id,action)=>page.locator(`[data-project-id="${id}"][data-project-action="${action}"]`);
async function connect(root,title){await nav('Проекты');await page.locator('#connect-root').fill(root);await page.locator('#connect-title').fill(title);const inspected=await uiAction('project_inspect',()=>page.locator('[data-act="project-inspect"]').click());assert.equal(inspected.root,await fs.realpath(root));const p=await uiAction('project_connect',()=>page.locator('[data-act="project-connect"]').click());assert.ok(p.id);await configureNativeSource(p.id);return p;}
async function select(id){await nav('Проекты');await projectButton(id,'select').click();await idle();}
async function publish(){await uiAction('object_propose',()=>page.locator('[data-act="object-propose"]').click());const validated=await uiAction('validate',()=>page.locator('[data-act="validate-active"]').click());assert.equal(validated.ok,true,JSON.stringify(validated));const applied=await uiAction('apply',()=>page.locator('[data-act="apply-active"]').click());assert.equal(applied.reload.status,'updated',JSON.stringify(applied));return {validated,applied};}
async function portalValue(id,expression){const p=await engine.project(id);const response=await fetch(p.portal+'/core/storage/jsonata/'+encodeURIComponent('('+expression+')'));const body=await response.text();assert.equal(response.status,200,body);return JSON.parse(body);}
async function mainHead(){const root=path.resolve(here,'../seaf-docker/workspace/microservices-demo');try{return await engine.git({root},['rev-parse','HEAD']);}catch{return null;}}
const baselineProductionHead=await mainHead();
try{
  await step('Create own native fixtures and protected loopback Workbench',async()=>{
    process.env.SEAF_GIT=path.join(bundle,'runtime/git/cmd/git.exe');process.env.SEAF_PORTABLE_ROOT=bundle;
    const seed=await fixture('Git reference','QA reference',true);await fs.writeFile(configFile,JSON.stringify({projects:[{id:'reference',title:'QA reference',root:seed,manifest:'root.yaml',writable:false,source:{kind:'git',provider:'gitverse'},validation:{runtime:'native',workspace:seed,manifest:'workspace/root.yaml'}}]}));
    offline=await createOfflineServer({port:0,assetsRoot:path.join(bundle,'runtime/offline')});process.env.SEAF_OFFLINE_URL=offline.url;
    await configureNativeSource('reference');
    workbench=await createWorkbenchServer({port:0,engine,state:path.join(run,'workbench'),editorUrl:offline.url+'/?embed=1&proto=json&offline=1',specRoot:path.resolve(here,'../openspec')});base='http://127.0.0.1:'+workbench.server.address().port;process.env.SEAF_WORKBENCH_URL=base;
    browser=await chromium.launch({headless:true,...(process.env.SEAF_CHROME_EXECUTABLE?{executablePath:process.env.SEAF_CHROME_EXECUTABLE}:{})});context=await browser.newContext({viewport:{width:1600,height:1100},acceptDownloads:true});
    await context.route('**/*',async route=>{const u=new URL(route.request().url());if(!['127.0.0.1','localhost'].includes(u.hostname)&&!['data:','blob:'].includes(u.protocol)){report.externalRequests.push(u.href);await route.abort();}else await route.continue();});
    page=await context.newPage();page.on('pageerror',e=>report.pageErrors.push(e.message));page.on('dialog',async dialog=>{const plan=dialogPlan.shift();if(!plan||!plan.match.test(dialog.message())){report.pageErrors.push('Unexpected dialog: '+dialog.message());await dialog.dismiss();return;}if(plan.accept===false)await dialog.dismiss();else await dialog.accept(plan.value);});await page.goto(base);await idle();
    return {base,offline:offline.url,referenceRoot:seed,coreRoot:sourceCore||path.join(bundle,'app/core')};
  });
  await step('Connect Cyrillic directory through Projects and inspect source/provider metadata',async()=>{
    const root=await fixture('Локальный проект','QA Local');local=await connect(root,'QA Local');assert.equal(local.source.kind,'directory');assert.equal(local.source.provider,'local');assert.equal(await fs.stat(path.join(root,'.git')).then(()=>true,()=>false),false);await card(local.id).getByRole('heading',{name:'QA Local',exact:true}).waitFor();assert.match(await card(local.id).innerText(),/Локальные ревизии/);assert.ok(await page.locator('[data-act="project-pick"]').isVisible());
    return {project:local.id,source:local.source,folderPicker:'Button visible; manual Windows path exercised. Portable shell launch and picker callback behavior are separate regression tests; interactive folder selection is not automated.'};
  });
  await step('Open a real active native portal for the connected directory',async()=>{
    const activated=await uiAction('project_activate',()=>projectButton(local.id,'activate').click());assert.match(activated.url,/^http:\/\/127\.0\.0\.1:\d+/);const portal=await context.newPage();portal.on('pageerror',e=>report.pageErrors.push(e.message));await portal.goto(activated.url);await portal.waitForSelector('#app');assert.equal(await portalValue(local.id,'components."qa.delivery".title'),'Delivery Service');await portal.close();return activated;
  });
  await step('Edit owner from catalog and lifecycle enum in forms; validate, local history and reload',async()=>{
    await select(local.id);await nav('Редактор');await page.locator('#filter').fill('qa.delivery');await page.locator('tr[data-object="qa.delivery"]').click();await page.locator('[data-editor-field="stage"]').waitFor();assert.equal(await page.locator('[data-editor-field="stage"]').evaluate(e=>e.tagName),'SELECT');assert.deepEqual(await page.locator('[data-editor-field="stage"] option').allTextContents(),['— Не задано —','draft','active']);await page.locator('[data-editor-field="stage"]').selectOption(JSON.stringify('active'));await page.locator('[data-editor-field="owner"]').selectOption(JSON.stringify('Platform'));
    const result=await publish();assert.equal(result.applied.commit??null,null);assert.equal(result.applied.revision.kind,'directory');const actual=YAML.parse(await fs.readFile(path.join(local.source.root,'root.yaml'),'utf8'));assert.equal(actual.components['qa.delivery'].owner,'Platform');assert.equal(actual.components['qa.delivery'].stage,'active');assert.equal(await portalValue(local.id,'components."qa.delivery".owner'),'Platform');return {revision:result.applied.revision,validation:result.validated,reload:result.applied.reload};
  });
  await step('Edit an information flow through the dedicated form and publish it',async()=>{
    await nav('Редактор');await page.locator('[data-link-edit="qa.orders"]').click();await page.locator('#flow-title').fill('Paid order dispatch');await page.locator('#flow-protocol').fill('HTTPS');await uiAction('object_propose',()=>page.locator('[data-act="flow-propose"]').click());const validated=await uiAction('validate',()=>page.locator('[data-act="validate-active"]').click());assert.equal(validated.ok,true,JSON.stringify(validated));const applied=await uiAction('apply',()=>page.locator('[data-act="apply-active"]').click());assert.equal(applied.reload.status,'updated');const links=await portalValue(local.id,'components."qa.orders".links');assert.equal(links[0].title,'Paid order dispatch');assert.equal(links[0].protocol,'HTTPS');return {links,revision:applied.revision};
  });
  await step('Save ZIP, name a local version and copy the project into a new directory',async()=>{
    await nav('Проекты');const downloaded=page.waitForEvent('download');const exported=await uiAction('project_export',()=>projectButton(local.id,'export').click());const download=await downloaded,target=path.join(run,'local-export.zip');await download.saveAs(target);const files=unzipSync(await fs.readFile(target));assert.ok(files['root.yaml']);assert.ok(files['seaf-export.json']);assert.ok(!Object.keys(files).some(f=>f.startsWith('.git')||f.startsWith('.env')));assert.equal(YAML.parse(Buffer.from(files['root.yaml']).toString()).components['qa.delivery'].owner,'Platform');
    dialogPlan=[{match:/верси|назван/i,value:'accepted-ui-local'}];const version=await uiAction('project_version',()=>projectButton(local.id,'version').click());assert.equal(dialogPlan.length,0);assert.equal(version.name,'accepted-ui-local');const revisions=await api('revisions_list',{project:local.id});assert.ok(revisions.some(r=>r.id===version.revision.id));await closeResult();
    const destination=path.join(fixtureRoot,'Копия локального проекта');dialogPlan=[{match:/папк|путь|назначен/i,value:destination}];const copy=await uiAction('project_clone_local',()=>projectButton(local.id,'clone-local').click());assert.equal(dialogPlan.length,0);assert.ok(copy.id);assert.equal(await fs.readFile(path.join(destination,'root.yaml'),'utf8'),await fs.readFile(path.join(local.source.root,'root.yaml'),'utf8'));assert.equal(await fs.stat(path.join(destination,'.env')).then(()=>true,()=>false),false);return {exportedFiles:exported.files,version,copy:{id:copy.id,root:destination}};
  });
  await step('Connect own Git repository, edit form and verify one Git commit and live reload',async()=>{
    const root=await fixture('Git изменяемый','QA Git',true);gitProject=await connect(root,'QA Git');assert.equal(gitProject.source.kind,'git');assert.equal(gitProject.source.provider,'gitverse');const before=await engine.git({root},['rev-parse','HEAD']);await uiAction('project_activate',()=>projectButton(gitProject.id,'activate').click());await select(gitProject.id);await nav('Редактор');await page.locator('#filter').fill('qa.delivery');await page.locator('tr[data-object="qa.delivery"]').click();await page.locator('[data-editor-field="owner"]').selectOption(JSON.stringify('Engineering'));const result=await publish();assert.equal(result.applied.revision.kind,'git');assert.match(result.applied.commit,/^[0-9a-f]{40}$/);assert.notEqual(result.applied.commit,before);assert.equal(Number(await engine.git({root},['rev-list','--count',before+'..HEAD'])),1);assert.equal(await portalValue(gitProject.id,'components."qa.delivery".owner'),'Engineering');assert.equal(await engine.git({root},['status','--porcelain']),'');await nav('Проекты');dialogPlan=[{match:/верси|назван/i,value:'accepted-ui-git'}];const version=await uiAction('project_version',()=>projectButton(gitProject.id,'version').click());assert.equal(await engine.git({root},['rev-parse',version.branch]),result.applied.commit);assert.equal(await engine.git({root},['branch','--show-current']),'main');return {commit:result.applied.commit,reload:result.applied.reload,version};
  });
  await step('Disconnect preserves files; explicit delete moves only the isolated project to local trash',async()=>{
    await nav('Проекты');dialogPlan=[{match:/отключ/i,accept:true}];const disconnected=await uiAction('project_disconnect',()=>projectButton(gitProject.id,'disconnect').click());dialogPlan=[];assert.equal(await fs.stat(path.join(gitProject.source.root,'root.yaml')).then(()=>true,()=>false),true);assert.ok(!(await engine.projects()).some(p=>p.id===gitProject.id));
    await nav('Проекты');dialogPlan=[{match:/удал|корзин|файл/i,value:local.id}];const deleted=await uiAction('project_delete',()=>projectButton(local.id,'delete').click());assert.equal(dialogPlan.length,0);assert.ok(deleted.trashedTo);assert.equal(await fs.stat(local.source.root).then(()=>true,()=>false),false);assert.equal(await fs.stat(path.join(deleted.trashedTo,'root.yaml')).then(()=>true,()=>false),true);return {disconnected,deleted};
  });
  assert.deepEqual(report.externalRequests,[]);assert.deepEqual(report.pageErrors,[]);assert.equal(await mainHead(),baselineProductionHead);report.status='passed';report.completed=new Date().toISOString();report.productionHeadUnchanged=true;await page.screenshot({path:path.join(output,'final.png'),fullPage:true});
} catch(error){report.status='failed';report.error=error.stack||error.message;process.exitCode=1;}finally{
  await save();if(browser)await browser.close();if(workbench){workbench.server.closeAllConnections?.();await new Promise(resolve=>workbench.server.close(resolve));}for(const runtime of engine.runtimes.values())await runtime.closeAll();if(offline)await offline.stop();await save();
}
console.log(JSON.stringify({status:report.status,steps:report.steps.map(s=>({name:s.name,status:s.status})),output}));
