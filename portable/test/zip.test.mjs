import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import {createRequire} from 'node:module';
import {writeZip} from '../zip.mjs';
const require=createRequire(new URL('../../seaf-mcp/package.json',import.meta.url)),{unzipSync}=require('fflate');
test('Portable ZIP preserves Unicode names and deterministic bytes',async()=>{
 const dir=await fs.mkdtemp(path.join(os.tmpdir(),'seaf-zip-'));
 try{const source=path.join(dir,'release');await fs.mkdir(source);await fs.writeFile(path.join(source,'Схема.txt'),'Пример');await fs.writeFile(path.join(source,'Start.cmd'),'@echo off');const first=path.join(dir,'a.zip'),second=path.join(dir,'b.zip');await writeZip(source,first);await writeZip(source,second);const a=await fs.readFile(first),b=await fs.readFile(second);assert.deepEqual(a,b);const files=unzipSync(a);assert.equal(Buffer.from(files['release/Схема.txt']).toString(),'Пример');assert.equal(Object.keys(files).length,2);}finally{await fs.rm(dir,{recursive:true,force:true});}
});
