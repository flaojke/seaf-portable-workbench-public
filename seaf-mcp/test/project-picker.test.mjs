import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {ProjectSources,windowsPowerShellExecutable} from '../project-sources.mjs';
const exec=promisify(execFile);

test('picker resolves Windows PowerShell independently of PATH and accepts standard Windows environment names',()=>{
  assert.equal(windowsPowerShellExecutable({SystemRoot:'C:\\Windows',PATH:''}),'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.equal(windowsPowerShellExecutable({WINDIR:'D:\\Windows',PATH:'C:\\unrelated'}),'D:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.equal(windowsPowerShellExecutable({SYSTEMROOT:'E:\\Windows'}),'E:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe');
  assert.throws(()=>windowsPowerShellExecutable({SystemRoot:'relative'}),/absolute/);
});

test('native directory picker uses the absolute executable with bounded STA invocation and returns Unicode path without registry writes',{skip:process.platform!=='win32'},async()=>{
  const source=new ProjectSources({}),selected='D:\\Архитектура проекта\\Пример';let calls=0;
  const result=await source.pickDirectory({execute:async(executable,args,options)=>{
    calls++;assert.equal(executable,windowsPowerShellExecutable());assert.equal(path.isAbsolute(executable),true);
    assert.deepEqual(args.slice(0,3),['-NoProfile','-STA','-EncodedCommand']);
    const script=Buffer.from(args[3],'base64').toString('utf16le');assert.match(script,/FolderBrowserDialog/);assert.match(script,/OutputEncoding.*UTF8/);
    assert.equal(options.windowsHide,true);assert.equal(options.timeout,180000);return {stdout:selected+'\r\n'};
  }});
  assert.equal(calls,1);assert.deepEqual(result,{cancelled:false,path:selected,root:selected});
  assert.deepEqual(await source.pickDirectory({execute:async()=>({stdout:''})}),{cancelled:true,path:null,root:null});
  await assert.rejects(source.pickDirectory({execute:async()=>{throw Error('picker timed out');}}),/timed out/);
});

test('Windows PowerShell actually starts when portable PATH contains only System32',{skip:process.platform!=='win32'},async()=>{
  const environment={...process.env,PATH:path.win32.join(process.env.SystemRoot||process.env.SYSTEMROOT||'C:\\Windows','System32')};
  const {stdout}=await exec(windowsPowerShellExecutable(),['-NoProfile','-NonInteractive','-Command',"[Console]::Write('SEAF_PICKER_SHELL_READY')"],{env:environment,windowsHide:true,timeout:15000});
  assert.equal(stdout,'SEAF_PICKER_SHELL_READY');
});
