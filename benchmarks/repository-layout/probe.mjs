import fs from 'node:fs';
import path from 'node:path';
import {createRequire} from 'node:module';
import {fileURLToPath} from 'node:url';
import {performance} from 'node:perf_hooks';

const installed = Symbol.for('seaf.repository-layout.probe');
const isInside = (root, file) => {
  const relative = path.relative(root, file);
  return relative === '' || (relative !== '..' && !relative.startsWith('..' + path.sep) && !path.isAbsolute(relative));
};
const emptyTotals = () => ({readCalls:0,readBytes:0,readMs:0,readErrors:0,parseCalls:0,parseMs:0,parseErrors:0});

/** Instrument this worker only; install before importing core/main.mjs.
 * YAML parse attribution requires the exact string/buffer returned by the latest
 * synchronous YAML read, with no intervening read or parse. No source text is
 * retained after parse, reset or restore. No runtime/product files are changed.
 */
export function installProbe({workspace,coreRoot} = {}) {
  if(typeof workspace !== 'string' || typeof coreRoot !== 'string') throw Error('Probe requires workspace and coreRoot');
  if(globalThis[installed]) throw Error('A repository-layout probe is already installed in this worker');
  const root = fs.realpathSync(path.resolve(workspace));
  const yaml = createRequire(path.join(path.resolve(coreRoot),'package.json'))('yaml');
  const originalRead = fs.readFileSync, originalParse = yaml.parse;
  let active = true, latestRead = null, totals, fixture, files, started, eventLoopStart;
  const reset = () => {
    totals=emptyTotals();fixture=emptyTotals();files=new Map();latestRead=null;
    started=performance.now();eventLoopStart=performance.eventLoopUtilization();
  };
  reset();
  const fileInfo = input => {
    try {
      const source = input instanceof URL ? fileURLToPath(input) : typeof input === 'string' ? input : Buffer.isBuffer(input) ? input.toString() : null;
      if(!source || !/\.ya?ml$/i.test(source)) return null;
      const absolute=path.resolve(source), local=isInside(root,absolute);
      const relative=local?path.relative(root,absolute).replaceAll('\\','/'):null;
      return {local,relative};
    } catch { return null; }
  };
  const rowFor = relative => {
    let row=files.get(relative);
    if(!row){row={path:relative,...emptyTotals()};files.set(relative,row);}
    return row;
  };
  function readFileSync(...args) {
    latestRead=null;
    const info=fileInfo(args[0]);
    if(!info) return Reflect.apply(originalRead,this,args);
    const before=performance.now();let value,error;
    try {value=Reflect.apply(originalRead,this,args);return value;}
    catch(caught){error=caught;throw caught;}
    finally {
      const milliseconds=performance.now()-before;
      const bytes=typeof value==='string'?Buffer.byteLength(value):Buffer.isBuffer(value)?value.byteLength:0;
      const targets=[totals];if(info.local)targets.push(fixture,rowFor(info.relative));
      for(const target of targets){target.readCalls++;target.readBytes+=bytes;target.readMs+=milliseconds;if(error)target.readErrors++;}
      if(!error && (typeof value==='string'||Buffer.isBuffer(value))) latestRead={...info,value};
    }
  }
  function parse(...args) {
    const read=latestRead;latestRead=null;
    const matched=read && read.value===args[0];
    const before=performance.now();let error;
    try {return Reflect.apply(originalParse,this,args);}
    catch(caught){error=caught;throw caught;}
    finally {
      const milliseconds=performance.now()-before;
      const targets=[totals];if(matched && read.local)targets.push(fixture,rowFor(read.relative));
      for(const target of targets){target.parseCalls++;target.parseMs+=milliseconds;if(error)target.parseErrors++;}
    }
  }
  fs.readFileSync=readFileSync;yaml.parse=parse;globalThis[installed]=true;
  return {
    reset(){if(!active)throw Error('Probe has been restored');reset();},
    snapshot(){
      const utilization=performance.eventLoopUtilization(eventLoopStart);
      return {format:'seaf-loader-probe-v1',elapsedMs:performance.now()-started,
        global:{...totals},fixture:{...fixture,uniqueFiles:files.size},
        nonFixtureOrUnattributedParseCalls:totals.parseCalls-fixture.parseCalls,
        eventLoop:{activeMs:utilization.active,idleMs:utilization.idle,utilization:utilization.utilization},
        files:[...files.values()].sort((a,b)=>a.path.localeCompare(b.path)).map(row=>({...row})),
        attribution:'Latest synchronous YAML read with exactly matching parse input; unmatched YAML.parse calls count globally only. All counters cover this phase only.'};
    },
    restore(){
      if(!active)return;active=false;latestRead=null;
      if(fs.readFileSync===readFileSync)fs.readFileSync=originalRead;
      if(yaml.parse===parse)yaml.parse=originalParse;
      delete globalThis[installed];
    }
  };
}
