import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {sourcePathDecision, classifySourceCandidates, MAX_SOURCE_BYTES} from './source-policy.mjs';
import {reportContentFindings,MAX_CAPTURED_REPORT_BYTES} from './source-report-policy.mjs';

const docs=path.dirname(fileURLToPath(import.meta.url));
const fixtures=path.resolve(docs,'../seaf-mcp/state/source-policy-tests');
test('positive boundary keeps only SEAF roots and legitimate vendored build inputs',()=>{
 for(const file of ['README.md','SOURCE-MANIFEST.json','.gitattributes','docs/source-policy.mjs','examples/shopflow/root.yaml','openspec/tooling/package-lock.json','benchmarks/repository-layout/run.mjs','portable/launcher.mjs','seaf-mcp/test/example.test.mjs','seaf-mcp/projects.example.json','vendor/seaf-archtool-core/libs/local-package.tgz','vendor/seaf-archtool-core/package-lock.json','vendor/seaf-archtool-core/resources/publish/plugin/.npmrc','seaf-docker/compose.yaml','seaf-docker/launcher.ps1'])
  assert.equal(sourcePathDecision(file).allowed,true,file);
 for(const file of ['other-project/root.yaml','personal-notes.md','.github/workflows/unreviewed.yml','vendor/unrelated-project/index.js','seaf-docker/workspace/root.yaml','seaf-docker/launcher-native.ps1'])
  assert.equal(sourcePathDecision(file).kind,'out-of-scope',file);
});
test('private, runtime, dependency and unsafe paths are denied before content inspection',()=>{
 for(const file of ['.aws/credentials','docs/.AWS/config','examples/.ssh/id_ed25519','docs/.kube/config','portable/.codex/settings.json','docs/.env','docs/.env.local','docs/secrets.env','docs/server-private.pem','docs/tls.key','docs/client.pfx','docs/credentials.json','seaf-mcp/projects.json','seaf-mcp/projects.local.json','seaf-mcp/mcp.config.json','seaf-mcp/state/receipt.json','portable/cache/node.zip','portable/state/receipt.json','vendor/seaf-archtool-core/dist/app.js','vendor/seaf-archtool-core/public/plugins/compiled.js','openspec/tooling/node_modules/package/index.js','benchmarks/repository-layout/state/model.yaml','dist/release.zip','data/projects.json','runtime/node.exe','docs/../README.md','D:/other/project.yaml','docs\\unsafe.md','/README.md'])
  assert.equal(sourcePathDecision(file).kind,'excluded',file);
 const classified=classifySourceCandidates(['README.md','other/root.yaml','docs/.env','README.md']);
 assert.deepEqual(classified,{allowed:['README.md'],excluded:['docs/.env'],outOfScope:['other/root.yaml']});
});

async function fixture(t){
 await fs.mkdir(fixtures,{recursive:true});
 const root=await fs.mkdtemp(path.join(fixtures,'case-'));
 const git=parameters=>execFileSync('git',parameters,{cwd:root,windowsHide:true,maxBuffer:2*1024*1024,encoding:'utf8'});
 t.after(async()=>{
  const base=await fs.realpath(fixtures),actual=await fs.realpath(root),relative=path.relative(base,actual);
  assert.ok(relative && relative!=='..' && !relative.startsWith('..'+path.sep) && !path.isAbsolute(relative));
  await fs.rm(actual,{recursive:true,force:true});
 });
 await fs.mkdir(path.join(root,'docs'));
 for(const file of ['source-audit.mjs','source-policy.mjs','source-report-policy.mjs'])await fs.copyFile(path.join(docs,file),path.join(root,'docs',file));
 await fs.writeFile(path.join(root,'README.md'),'Synthetic SEAF source policy fixture\n');
 await fs.writeFile(path.join(root,'.gitignore'),'/seaf-mcp/projects.json\n/seaf-mcp/mcp.config.json\n/seaf-mcp/state/\n/portable/cache/\n/portable/state/\n/dist/\n/data/\n/runtime/\n**/node_modules/\n/vendor/seaf-archtool-core/dist/\n');
 git(['init','-b','main']);git(['add','README.md','.gitignore','docs']);
 git(['-c','user.name=SEAF policy QA','-c','user.email=qa@localhost','commit','-m','Create isolated source policy fixture']);
 const run=async()=>{
  execFileSync(process.execPath,[path.join(root,'docs/source-audit.mjs')],{cwd:root,windowsHide:true,maxBuffer:2*1024*1024});
  return JSON.parse(await fs.readFile(path.join(root,'seaf-mcp/state/source-publication-audit.json'),'utf8'));
 };
 return {root,git,run};
}
test('audit passes a clean SEAF fixture, not merely any Git checkout',async t=>{
 const f=await fixture(t),result=await f.run();
 assert.equal(result.status,'passed');
 assert.deepEqual(result.outOfScopeCandidates,[]);
 assert.equal(result.sourceInventory.some(row=>row.path==='docs/source-policy.mjs'),true);
});
test('audit reports unrelated and private candidates without scanning their sentinel contents',async t=>{
 const f=await fixture(t),marker=['ghp','_'].join('')+'A'.repeat(40);
 for(const [file,value]of [['another-company/root.yaml',marker],['docs/.aws/credentials',marker],['personal-notes.md',marker]]){
  const target=path.join(f.root,file);await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,value);
 }
 const result=await f.run();
 assert.equal(result.status,'review_required');
 assert.deepEqual(result.outOfScopeCandidates,['another-company/root.yaml','personal-notes.md']);
 assert.deepEqual(result.excludedCandidates,['docs/.aws/credentials']);
 assert.deepEqual(result.privateMarkers,[]);
 assert.ok(!result.sourceInventory.some(row=>/another-company|personal-notes|credentials/.test(row.path)));
});
test('allowed source still undergoes secret marker scanning',async t=>{
 const f=await fixture(t),marker=['ghp','_'].join('')+'C'.repeat(40);
 await fs.writeFile(path.join(f.root,'docs/synthetic-marker.md'),marker);
 const result=await f.run();
 assert.equal(result.status,'review_required');
 assert.ok(result.privateMarkers.some(row=>row.path==='docs/synthetic-marker.md'&&row.category==='github-token'));
});
test('oversized allowed candidates require review without reading their content',async t=>{
 const f=await fixture(t);await fs.writeFile(path.join(f.root,'docs/large.bin'),Buffer.alloc(MAX_SOURCE_BYTES+1,65));
 const result=await f.run();
 assert.equal(result.status,'review_required');
 assert.equal(result.largeFilesAbove5MiB[0].path,'docs/large.bin');
 assert.equal(result.largeFilesAbove5MiB[0].contentRead,false);
 assert.ok(!result.sourceInventory.some(row=>row.path==='docs/large.bin'));
});
test('forbidden historical blobs retain metadata but are never scanned or exported',async t=>{
 const f=await fixture(t),relative='docs/.ssh/id_ed25519',target=path.join(f.root,relative),marker=['ghp','_'].join('')+'B'.repeat(40);
 await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,marker);
 f.git(['add','--',relative]);f.git(['-c','user.name=SEAF policy QA','-c','user.email=qa@localhost','commit','-m','Add synthetic denied history fixture']);
 f.git(['rm','--',relative]);f.git(['-c','user.name=SEAF policy QA','-c','user.email=qa@localhost','commit','-m','Remove denied history fixture from source snapshot']);
 const result=await f.run();
 assert.equal(result.status,'passed');
 assert.deepEqual(result.history.privateMarkers,[]);
 assert.ok(result.history.skippedBlobs.some(row=>row.path===relative&&row.contentRead===false));
 assert.ok(!result.sourceInventory.some(row=>row.path===relative));
});

test('captured architecture and nested AI payloads are refused without leaking their values',()=>{
 const file='openspec/changes/archive/synthetic/evidence/ai.json';
 const privateLabel='SYNTHETIC_PRIVATE_SENTINEL';
 const body=JSON.stringify({response:{body:JSON.stringify({model:{components:{[privateLabel]:{title:privateLabel}}},answer:privateLabel})}});
 const findings=reportContentFindings(file,body);
 assert.ok(findings.some(row=>row.category==='raw-captured-payload'));
 assert.ok(!JSON.stringify(findings).includes(privateLabel));
 assert.ok(reportContentFindings(file,JSON.stringify({fixture:'Q:/synthetic-private-fixture'})).some(row=>row.category==='machine-local-path'));
 assert.deepEqual(reportContentFindings(file,JSON.stringify({url:'http://localhost:1234/health',source:'https://example.org/reference'})),[]);
 assert.deepEqual(reportContentFindings('examples/synthetic/model.json',body),[]);
});

test('large clean-looking report payloads require curation before publication',()=>{
 const body=JSON.stringify({status:'passed',checks:Array.from({length:1000},()=>({check:'synthetic check',status:'passed'}))});
 assert.ok(Buffer.byteLength(body)>MAX_CAPTURED_REPORT_BYTES);
 assert.deepEqual(reportContentFindings('openspec/changes/archive/synthetic/evidence/results.json',body),[{category:'oversized-captured-report',matches:1,contentRedacted:true}]);
 assert.deepEqual(reportContentFindings('SOURCE-MANIFEST.json',body),[]);
 assert.deepEqual(reportContentFindings('seaf-mcp/package-lock.json',body),[]);
 assert.deepEqual(reportContentFindings('seaf-mcp/test/fixture.test.mjs',body),[]);
 assert.ok(reportContentFindings('openspec/changes/synthetic/evidence/results.json',JSON.stringify({host:{cpus:[{name:'synthetic hardware'}]}})).length);
});

test('curated synthetic benchmark metrics and truthful historical failure counts remain publishable',()=>{
 const model={systems:1000,integrations:3000,modelSha256:'a'.repeat(64)};
 assert.deepEqual(reportContentFindings('openspec/changes/archive/synthetic/evidence/file-samples.json',JSON.stringify({model,measurements:[{reloadMs:123.4}]})),[]);
 assert.deepEqual(reportContentFindings('openspec/changes/archive/synthetic/evidence/file-samples.json',JSON.stringify({model:{milliseconds:12,counts:{systems:1000,contexts:3,docs:4},modelSha256:'a'.repeat(64)},sectionHashes:{components:'b'.repeat(64)}})),[]);
 assert.deepEqual(reportContentFindings('openspec/changes/archive/synthetic/unit-tests.tap','# Curated historical summary\n# tests 40\n# pass 19\n# fail 20\n# skipped 1\n'),[]);
});

test('audit blocks an allowed report containing raw captures, then accepts its curated replacement',async t=>{
 const f=await fixture(t),file='openspec/changes/archive/synthetic/evidence/ai.json',target=path.join(f.root,file);
 await fs.mkdir(path.dirname(target),{recursive:true});
 await fs.writeFile(target,JSON.stringify({result:{body:JSON.stringify({question:'SYNTHETIC_PRIVATE_QUESTION',answer:'SYNTHETIC_PRIVATE_ANSWER'})}}));
 let result=await f.run();assert.equal(result.status,'review_required');
 assert.ok(result.reportContent.some(row=>row.path===file&&row.category==='raw-captured-payload'));
 assert.ok(!JSON.stringify(result).includes('SYNTHETIC_PRIVATE_QUESTION'));
 await fs.writeFile(target,JSON.stringify({format:'curated-v1',status:'passed',observedCounts:{passed:4,failed:0}}));
 result=await f.run();assert.equal(result.status,'passed');assert.deepEqual(result.reportContent,[]);
});
