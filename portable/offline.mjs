import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { inflateRawSync, deflateRawSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
const maxSourceBytes = 256 * 1024;
export function encodePlantUml(source) {
  const bytes = deflateRawSync(Buffer.from(source, 'utf8'));
  let result = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i + 1] || 0, c = bytes[i + 2] || 0;
    result += alphabet[a >> 2] + alphabet[((a & 3) << 4) | (b >> 4)] + alphabet[((b & 15) << 2) | (c >> 6)] + alphabet[c & 63];
  }
  return result;
}
export function decodePlantUml(encoded) {
  if (!encoded || encoded.length > 65536 || encoded.length % 4 || /[^0-9A-Za-z_-]/.test(encoded)) throw new Error('Invalid PlantUML encoding');
  const bytes = [];
  for (let i = 0; i < encoded.length; i += 4) {
    const a = alphabet.indexOf(encoded[i]), b = alphabet.indexOf(encoded[i+1]), c = alphabet.indexOf(encoded[i+2]), d = alphabet.indexOf(encoded[i+3]);
    bytes.push((a << 2) | (b >> 4), ((b & 15) << 4) | (c >> 2), ((c & 3) << 6) | d);
  }
  const source = inflateRawSync(Buffer.from(bytes), { maxOutputLength: maxSourceBytes }).toString('utf8');
  if (!source.trim() || source.includes('\0')) throw new Error('Empty or invalid PlantUML source');
  return source;
}

async function killTree(child) {
  if (!child.pid || child.exitCode !== null) return;
  if (process.platform === 'win32') {
    await new Promise(resolve => {
      const taskkill = spawn(path.join(process.env.SystemRoot || 'C:/Windows', 'System32/taskkill.exe'), ['/PID', String(child.pid), '/T', '/F'], { windowsHide: true, shell: false, stdio: 'ignore' });
      taskkill.once('error', resolve); taskkill.once('close', resolve);
    });
  } else child.kill('SIGKILL');
}

export async function renderPlantUml(source, { java, plantumlJar, timeoutMs = 20000, processes = new Set() } = {}) {
  if (!java || !plantumlJar) throw new Error('Bundled Java and PlantUML are required');
  if (Buffer.byteLength(source) > maxSourceBytes || source.includes('\0')) throw new Error('PlantUML source exceeds limits');
  // Never inherit API tokens, Java options, classpaths, proxy settings or PATH.
  const env = Object.fromEntries(['SystemRoot','WINDIR','TEMP','TMP','USERPROFILE','LOCALAPPDATA'].filter(k => process.env[k]).map(k => [k, process.env[k]]));
  env.PLANTUML_SECURITY_PROFILE = 'SANDBOX';
  const cwd = await fs.mkdtemp(path.join(os.tmpdir(), 'seaf-plantuml-'));
  try {
    return await new Promise((resolve, reject) => {
      const child = spawn(path.resolve(java), ['-Xmx256m', '-Djava.awt.headless=true', '-DPLANTUML_SECURITY_PROFILE=SANDBOX', `-Djava.io.tmpdir=${cwd}`, '-jar', path.resolve(plantumlJar), '-tsvg', '-pipe', '-charset', 'UTF-8', '-failfast2'], { cwd, env, windowsHide: true, shell: false, stdio: ['pipe','pipe','pipe'] });
      processes.add(child);
      let output = [], size = 0, errorSize = 0, settled = false, abortedError;
      const finish = (error, value) => { if (settled) return; settled = true; clearTimeout(timer); processes.delete(child); error ? reject(error) : resolve(value); };
      const abort = error => { abortedError = error; void killTree(child).finally(() => finish(error)); };
      const timer = setTimeout(() => abort(new Error('PlantUML renderer timed out')), timeoutMs);
      child.stdout.on('data', chunk => { size += chunk.length; if (size > 4 * 1024 * 1024) abort(new Error('PlantUML output exceeds limits')); else output.push(chunk); });
      child.stderr.on('data', chunk => { errorSize += chunk.length; if (errorSize > 256 * 1024) abort(new Error('PlantUML error output exceeds limits')); });
      child.once('error', () => finish(new Error('Cannot start bundled PlantUML renderer')));
      child.stdin.once('error', () => {});
      child.once('close', code => {
        if (abortedError) return finish(abortedError);
        const svg = Buffer.concat(output).toString('utf8');
        if (code !== 0 || !svg.includes('<svg') || /Syntax Error\?|An error has occured|security profile/i.test(svg)) finish(new Error('PlantUML rejected the diagram; check syntax and offline includes'));
        else finish(null, svg);
      });
      child.stdin.end(source);
    });
  } finally { await fs.rm(cwd, { recursive: true, force: true }); }
}

const mime = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.json':'application/json; charset=utf-8', '.xml':'application/xml; charset=utf-8', '.txt':'text/plain; charset=utf-8', '.svg':'image/svg+xml', '.png':'image/png', '.gif':'image/gif', '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.ico':'image/x-icon', '.woff':'font/woff', '.woff2':'font/woff2', '.ttf':'font/ttf', '.wasm':'application/wasm' };
const offlineConfig = `\n// SEAF portable: local resources only, no storage integrations or telemetry.\nurlParams['offline']='1';urlParams['gapi']='0';urlParams['db']='0';urlParams['od']='0';urlParams['gh']='0';urlParams['gl']='0';urlParams['tr']='0';urlParams['sync']='manual';urlParams['noExitBtn']='1';urlParams['enableSW']='0';urlParams['math']='0';\nwindow.EXPORT_URL=null;window.PROXY_URL=null;window.DRAWIO_PUBLIC_BUILD=false;window.DRAWIO_BASE_URL=location.origin;window.DRAWIO_VIEWER_URL=location.origin+'/js/viewer-static.min.js';window.DRAWIO_LIGHTBOX_URL=location.origin;window.DRAWIO_CONFIG={fontCss:[],enableCustomLibraries:true};\n`;

export async function createOfflineServer({ port = 8092, assetsRoot, java, plantumlJar, timeoutMs = 20000, renderer = renderPlantUml } = {}) {
  if (!assetsRoot) throw new Error('Offline assetsRoot is required');
  const root = await fs.realpath(path.join(assetsRoot, 'drawio'));
  java ||= path.join(assetsRoot, 'jre/bin/java.exe');
  plantumlJar ||= path.join(assetsRoot, 'plantuml/plantuml.jar');
  const processes = new Set(), cache = new Map();
  let active = 0;
  const server = http.createServer(async (req, res) => {
    const send = (status, data, type = 'application/json; charset=utf-8') => { if (res.destroyed) return; res.writeHead(status, { 'Content-Type':type, 'X-Content-Type-Options':'nosniff', 'Cache-Control':'no-store' }); res.end(typeof data === 'string' || Buffer.isBuffer(data) ? data : JSON.stringify(data)); };
    try {
      const hosts = new Set([`127.0.0.1:${server.address().port}`, `localhost:${server.address().port}`]);
      if (!hosts.has(req.headers.host)) return send(403, { ok:false, error:'Localhost Host required' });
      if (req.headers.origin) {
        const origin = new URL(req.headers.origin);
        if (!['http:','https:'].includes(origin.protocol) || !['127.0.0.1','localhost'].includes(origin.hostname)) return send(403, { ok:false, error:'Localhost Origin required' });
        res.setHeader('Access-Control-Allow-Origin', origin.origin); res.setHeader('Vary', 'Origin');
      }
      if (req.method === 'OPTIONS') {
        res.setHeader('Access-Control-Allow-Methods','GET, HEAD, OPTIONS');
        // The SEAF frontend's Axios interceptor adds RqUID to local SVG reads.
        // Permit its preflight only after the localhost Origin check above.
        res.setHeader('Access-Control-Allow-Headers','RqUID, Content-Type');
        return send(204,'');
      }
      if (!['GET','HEAD'].includes(req.method)) return send(405, { ok:false,error:'Read-only service' });
      const url = new URL(req.url, 'http://127.0.0.1');
      if (url.pathname === '/health') {
        const [javaPresent, jarPresent] = await Promise.all([fs.access(java).then(() => true, () => false), fs.access(plantumlJar).then(() => true, () => false)]);
        return send(javaPresent && jarPresent ? 200 : 503, { ok:javaPresent && jarPresent, service:'seaf-offline', drawio:true, plantuml:javaPresent && jarPresent, networkRequired:false });
      }
      if (url.pathname.startsWith('/plantuml/svg/')) {
        const encoded = url.pathname.slice('/plantuml/svg/'.length), source = decodePlantUml(encoded);
        if (cache.has(encoded)) return send(200, req.method === 'HEAD' ? '' : cache.get(encoded), 'image/svg+xml; charset=utf-8');
        if (active >= 2) return send(429, { ok:false,error:'Two diagrams are rendering; retry shortly' });
        ++active;
        let svg;
        try { svg = await renderer(source, { java, plantumlJar, timeoutMs, processes }); } finally { --active; }
        if (cache.size >= 32) cache.delete(cache.keys().next().value);
        cache.set(encoded, svg);
        return send(200, req.method === 'HEAD' ? '' : svg, 'image/svg+xml; charset=utf-8');
      }
      const decoded = decodeURIComponent(url.pathname);
      if (decoded.includes('\\') || decoded.includes('\0') || decoded.split('/').some(s => s === '..' || s.startsWith('.')) || /\/(WEB-INF|META-INF)(\/|$)/i.test(decoded)) return send(403,{ ok:false,error:'Path unavailable' });
      const file = await fs.realpath(path.resolve(root, '.' + (decoded === '/' ? '/index.html' : decoded)));
      const relative = path.relative(root, file);
      if (relative.startsWith('..') || path.isAbsolute(relative) || !(await fs.stat(file)).isFile()) return send(403, { ok:false,error:'Path unavailable' });
      let data = await fs.readFile(file);
      if (relative.replaceAll('\\','/') === 'js/PreConfig.js') data = Buffer.from(data.toString('utf8') + offlineConfig);
      // Browsers enforce local-only resource loading even if a diagram contains an external URL.
      res.setHeader('Content-Security-Policy', "default-src 'self' data: blob:; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-src 'self' data: blob:; frame-ancestors http://localhost:* http://127.0.0.1:*; object-src 'none'");
      return send(200, req.method === 'HEAD' ? '' : data, mime[path.extname(file).toLowerCase()] || 'application/octet-stream');
    } catch (error) {
      if (error.code === 'ENOENT' || error.code === 'EISDIR') return send(404, { ok:false,error:'Offline asset not found' });
      const timedOut = /timed out/.test(error.message);
      return send(timedOut ? 504 : 422, { ok:false,error:error.message });
    }
  });
  server.requestTimeout = 25000; server.headersTimeout = 10000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  return { server, port:server.address().port, url:`http://127.0.0.1:${server.address().port}`, stop:async () => { await Promise.all([...processes].map(killTree)); await new Promise(resolve => { server.close(resolve); server.closeIdleConnections(); }); } };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const instance = await createOfflineServer({ assetsRoot:process.env.SEAF_OFFLINE_ASSETS || process.argv[2], port:Number(process.env.SEAF_OFFLINE_PORT || 8092) });
  console.log(JSON.stringify({ service:'seaf-offline', url:instance.url }));
  for (const signal of ['SIGINT','SIGTERM']) process.on(signal, () => void instance.stop().then(() => process.exit(0)));
}
