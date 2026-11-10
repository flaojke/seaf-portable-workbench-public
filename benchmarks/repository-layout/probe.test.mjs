import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {installProbe} from './probe.mjs';
const coreRoot=path.resolve('vendor/seaf-archtool-core');
const YAML=createRequire(path.join(coreRoot,'package.json'))('yaml');

test('probe counts real user YAML reads/parses, outside metamodel parses globally, and restores',()=>{
 const temporary=fs.mkdtempSync(path.join(os.tmpdir(),'seaf-loader-probe-'));
 const workspace=path.join(temporary,'Модель с пробелом');fs.mkdirSync(workspace);
 const local=path.join(workspace,'root.yaml'),outside=path.join(temporary,'metamodel.yaml');
 fs.writeFileSync(local,'components:\n  demo: {title: Система}\n');fs.writeFileSync(outside,'entities: {}\n');
 const before=fs.readFileSync,parseBefore=YAML.parse,probe=installProbe({workspace,coreRoot});
 try{
  const contents=fs.readFileSync(local,'utf8');assert.equal(YAML.parse(contents).components.demo.title,'Система');
  YAML.parse(fs.readFileSync(outside,'utf8'));
  YAML.parse('direct: true\n');
  const snapshot=probe.snapshot();
  assert.equal(snapshot.fixture.readCalls,1);assert.equal(snapshot.fixture.parseCalls,1);assert.equal(snapshot.fixture.uniqueFiles,1);
  assert.equal(snapshot.fixture.readBytes,Buffer.byteLength(contents));assert.equal(snapshot.global.readCalls,2);assert.equal(snapshot.global.parseCalls,3);
  assert.equal(snapshot.nonFixtureOrUnattributedParseCalls,2);assert.equal(snapshot.files[0].path,'root.yaml');
  assert.ok(snapshot.fixture.readMs>=0);assert.ok(snapshot.fixture.parseMs>=0);
  probe.reset();assert.equal(probe.snapshot().fixture.readCalls,0);assert.equal(probe.snapshot().global.parseCalls,0);
  // A different parse input cannot inherit a prior file's provenance.
  fs.readFileSync(local,'utf8');YAML.parse('other: 1\n');assert.equal(probe.snapshot().fixture.parseCalls,0);assert.equal(probe.snapshot().global.parseCalls,1);
  // An intervening non-YAML read clears the pending attribution.
  const saved=fs.readFileSync(local,'utf8');fs.readFileSync(new URL(import.meta.url),'utf8');YAML.parse(saved);assert.equal(probe.snapshot().fixture.parseCalls,0);
 }finally{
  probe.restore();assert.equal(fs.readFileSync,before);assert.equal(YAML.parse,parseBefore);
  const resolved=path.resolve(temporary);assert.ok(resolved.startsWith(path.resolve(os.tmpdir())+path.sep));assert.match(path.basename(resolved),/^seaf-loader-probe-/);fs.rmSync(resolved,{recursive:true,force:true});
 }
});
