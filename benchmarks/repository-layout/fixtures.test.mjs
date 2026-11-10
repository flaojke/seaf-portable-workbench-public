import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire}from'node:module';
import {LAYOUTS,generateModel,fixturePlan,describePlan,createFixture,verifyFixture,createSuite,modelHash,REGISTRY_SOURCE} from './fixtures.mjs';
const require=createRequire(new URL('../../seaf-mcp/package.json',import.meta.url)),jsonata=require('jsonata');

async function temporary(t){const root=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-layout-fixture-'));t.after(async()=>{assert.equal(path.dirname(root),path.resolve(os.tmpdir()));assert.match(path.basename(root),/^seaf-layout-fixture-/);await fs.rm(root,{recursive:true,force:true});});return root;}

test('synthetic systems and integrations are deterministic, complete and real endpoint links',()=>{
  const a=generateModel({systems:10,integrations:30}),b=generateModel({systems:10,integrations:30});assert.deepEqual(a,b);assert.notEqual(a.sha256,generateModel({systems:10,integrations:30,seed:'different'}).sha256);
  assert.equal(Object.keys(a.model.components).length,10);assert.equal(Object.keys(a.model.integrations).length,30);assert.equal(Object.values(a.model.components).reduce((n,c)=>n+c.links.length,0),30);
  for(const[id,c]of Object.entries(a.model.components)){assert.match(id,/^sys[0-9]+$/);assert.equal(c.entity,'system');for(const link of c.links){const integration=a.model.integrations[link.integration];assert.equal(integration.from,id);assert.equal(integration.to,link.id);assert.ok(a.model.components[link.id]);assert.equal(integration.protocol,link.protocol);}}
  assert.deepEqual(a.model.contexts['bench.focus'].components,Object.keys(a.model.components));assert.equal(modelHash(a.model),a.sha256);
  for(const context of Object.values(a.model.contexts)){assert.equal(context['extra-links'],false);assert.equal(context.presentation,'smartants');}
});

test('all seven disk layouts load into byte-identical canonical model using Engine.model',async t=>{
  const root=await temporary(t),hashes=new Set(),counts=[];
  for(const {id}of LAYOUTS){const description=await createFixture({root:path.join(root,id),layout:id,systems:7,integrations:21,groupSize:3});const verification=await verifyFixture(description,{stateRoot:path.join(root,'verification')});assert.equal(verification.ok,true);hashes.add(verification.modelSha256);counts.push(verification.counts);}
  assert.equal(hashes.size,1);assert.ok(counts.every(c=>c.systems===7&&c.integrations===21&&c.componentLinks===21));
});

test('normal SEAF registry table query produces every system row with stable sorted IDs and valid links',async()=>{
  const {model}=generateModel({systems:100,integrations:300}),expression=jsonata(REGISTRY_SOURCE);
  const reversed={...model,components:Object.fromEntries(Object.entries(model.components).reverse())};
  const rows=await expression.evaluate(reversed);
  assert.equal(model.docs['bench.registry'].source,REGISTRY_SOURCE);assert.equal(model.docs['bench.registry'].type,'table');assert.equal(rows.length,100);
  assert.deepEqual(rows.map(r=>r.id),Object.keys(model.components).sort());
  for(const row of rows){assert.equal(row.title,model.components[row.id].title);assert.equal(row.owner,model.components[row.id].owner);assert.equal(row.link,'/entities/components/blank?dh-component-id='+row.id);}
  assert.equal(Object.values(model.components).reduce((n,c)=>n+c.links.length,0),300);
});

test('typed file counts and import depth reflect the requested layouts without artificial padding',()=>{
  const descriptions=Object.fromEntries(LAYOUTS.map(({id})=>[id,describePlan(fixturePlan(id,{systems:1000,integrations:3000,groupSize:20}))]));
  assert.equal(descriptions.baseline.typedFiles,2);assert.equal(descriptions.baseline.yamlFiles,4);assert.equal(descriptions.baseline.maxDepth,1);
  assert.equal(descriptions.v1.systemFiles,1000);assert.equal(descriptions.v1.integrationFiles,1);assert.equal(descriptions.v2.integrationFiles,1);assert.equal(descriptions.v1.typedFiles,1001);assert.equal(descriptions.v2.typedFiles,1001);assert.equal(descriptions.v1.maxDepth,2);assert.equal(descriptions.v2.maxDepth,1);
  assert.equal(descriptions.v3.typedFiles,2000);assert.equal(descriptions.v4.typedFiles,2000);assert.equal(descriptions.v3.maxDepth,1);assert.equal(descriptions.v4.maxDepth,2);assert.equal(descriptions.v5.typedFiles,2000);assert.equal(descriptions.v5.maxDepth,2);
  assert.equal(descriptions.v6.systemFiles,50);assert.equal(descriptions.v6.integrationFiles,50);assert.equal(descriptions.v6.headFiles,51);assert.equal(descriptions.v6.maxDepth,2);
  assert.equal(descriptions.v1.yamlFiles-descriptions.v2.yamlFiles,1);assert.equal(descriptions.v4.yamlFiles-descriptions.v3.yamlFiles,2);assert.equal(descriptions.v5.yamlFiles-descriptions.v3.yamlFiles,1000);
  assert.equal(new Set(Object.values(descriptions).map(d=>d.modelSha256)).size,1);
  for(const {id}of LAYOUTS)for(const[file,text]of fixturePlan(id,{systems:7,integrations:21}).files){assert.ok(text.trim());assert.doesNotMatch(text,/^(?:components|integrations):\s*\{\}\s*$/m,file);}
});

test('files are never overwritten or removed and invalid sizes cannot produce empty typed files',async t=>{
  const root=await temporary(t),project=path.join(root,'occupied');await fs.mkdir(project);await fs.writeFile(path.join(project,'keep.txt'),'do not modify');
  await assert.rejects(createFixture({root:project,systems:3}),/must be empty/);assert.equal(await fs.readFile(path.join(project,'keep.txt'),'utf8'),'do not modify');
  assert.throws(()=>generateModel({systems:0}));assert.throws(()=>generateModel({systems:3,integrations:2}));assert.throws(()=>fixturePlan('bad',{systems:3}));
});

test('paired depth comparisons retain identical typed payload bytes and actual artifact paths',()=>{
  for(const pair of [['v1','v2'],['v3','v4'],['v3','v5']]){
    const before=fixturePlan(pair[0],{systems:11,integrations:33}),after=fixturePlan(pair[1],{systems:11,integrations:33});
    for(const[file,content]of before.files){if(file==='root.yaml'||(/^imports:/.test(content)))continue;assert.equal(after.files.get(file),content,pair.join('/')+' '+file);}
    assert.equal(describePlan(before).typedBytes,describePlan(after).typedBytes);
  }
});

test('semantic verification detects tampered artifacts rather than trusting a generated receipt',async t=>{
  const root=await temporary(t),fixture=await createFixture({root:path.join(root,'model'),layout:'v5',systems:5,integrations:15});
  const file=path.join(fixture.root,'systems/sys00001/systems.yaml'),before=await fs.readFile(file,'utf8');
  await fs.writeFile(file,before.replace('Система 00001','Changed actual source'));
  await assert.rejects(verifyFixture(fixture,{stateRoot:path.join(root,'verification')}),/hash mismatch/);
});

test('suite receipt has equal model fingerprints by size, declared root-zero depths and no production writes',async t=>{
  const root=await temporary(t),suite=await createSuite({root:path.join(root,'suite'),sizes:[3,8],layouts:['baseline','v5','v6'],groupSize:2});
  assert.equal(suite.fixtures.length,6);assert.equal(suite.productionWrites,false);assert.equal(suite.synthetic,true);
  for(const size of [3,8]){const fixtures=suite.fixtures.filter(f=>f.settings.systems===size);assert.equal(new Set(fixtures.map(f=>f.modelSha256)).size,1);assert.ok(fixtures.every(f=>f.verification.ok&&f.rootDepth===0));}
  assert.deepEqual(JSON.parse(await fs.readFile(path.join(root,'suite/fixtures.json'),'utf8')),suite);
});
