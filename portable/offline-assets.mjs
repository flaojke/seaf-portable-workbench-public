import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
const require = createRequire(new URL('../seaf-mcp/package.json', import.meta.url));
const { unzipSync } = require('fflate');
const here = path.dirname(fileURLToPath(import.meta.url));
export const sha256 = bytes => crypto.createHash('sha256').update(bytes).digest('hex');

export function safeArchivePath(name) {
  if (typeof name !== 'string' || !name || name.includes('\\') || name.includes('\0') || name.startsWith('/') || name.includes(':') || name.split('/').some(p => p === '..' || p === '.')) throw new Error('Unsafe archive entry');
  return name;
}

export async function extractArchive(bytes, destination, { stripFirst = false, exclude = () => false } = {}) {
  let total = 0, count = 0;
  const entries = unzipSync(bytes, { filter: entry => {
    safeArchivePath(entry.name);
    if (exclude(entry.name) || entry.name.endsWith('/')) return false;
    total += entry.originalSize;
    if (++count > 30000 || entry.originalSize > 256 * 1024 * 1024 || total > 1024 * 1024 * 1024) throw new Error('Archive exceeds extraction limits');
    return true;
  }});
  await fs.mkdir(destination, { recursive: true });
  for (const [name, data] of Object.entries(entries)) {
    const relative = stripFirst ? name.split('/').slice(1).join('/') : name;
    if (!relative) continue;
    const target = path.resolve(destination, safeArchivePath(relative));
    if (!target.startsWith(path.resolve(destination) + path.sep)) throw new Error('Archive escapes destination');
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, data);
  }
  return { files: count, expandedBytes: total };
}

async function getInput(input, cacheRoot, allowDownload) {
  if (!/^[a-zA-Z0-9_.+-]+$/.test(input.file) || !/^[0-9a-f]{64}$/.test(input.sha256)) throw new Error('Invalid pinned input');
  const target = path.join(cacheRoot, input.file);
  let bytes;
  try { bytes = await fs.readFile(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  if (!bytes) {
    if (!allowDownload) throw new Error(`Missing offline build input ${input.id}; download verified inputs on the build computer`);
    const url = new URL(input.url);
    if (url.protocol !== 'https:' || !['github.com', 'raw.githubusercontent.com'].includes(url.hostname)) throw new Error('Build input must use the pinned official HTTPS host');
    const response = await fetch(url, { signal: AbortSignal.timeout(180000) });
    if (!response.ok) throw new Error(`Download ${input.id}: HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    if (sha256(bytes) !== input.sha256) throw new Error(`SHA-256 mismatch: ${input.id}`);
    await fs.mkdir(cacheRoot, { recursive: true });
    await fs.writeFile(target, bytes);
  }
  if (sha256(bytes) !== input.sha256) throw new Error(`SHA-256 mismatch: ${input.id}`);
  return bytes;
}

async function inventory(root, relative = '') {
  const result = [];
  for (const item of (await fs.readdir(path.join(root, relative), { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name, 'en'))) {
    const rel = path.posix.join(relative, item.name);
    if (rel === 'manifest.json') continue;
    if (item.isDirectory()) result.push(...await inventory(root, rel));
    else if (item.isFile()) { const bytes = await fs.readFile(path.join(root, rel)); result.push({ path: rel, size: bytes.length, sha256: sha256(bytes) }); }
    else throw new Error('Unexpected symbolic link in offline assets');
  }
  return result;
}

export async function prepareOfflineAssets({ cacheRoot = path.join(here, 'cache/offline'), destination, allowDownload = true } = {}) {
  if (!destination) throw new Error('Offline asset destination is required');
  const inputs = JSON.parse(await fs.readFile(new URL('./offline-inputs.json', import.meta.url), 'utf8'));
  const selected = new Map();
  for (const input of inputs.inputs) selected.set(input.id, { input, bytes: await getInput(input, cacheRoot, allowDownload) });
  await fs.mkdir(destination, { recursive: true });
  const draw = selected.get('drawio'), java = selected.get('jre'), plant = selected.get('plantuml');
  await extractArchive(draw.bytes, path.join(destination, 'drawio'), { exclude: n => /^(WEB-INF|META-INF)\//i.test(n) || /\.jsp$/i.test(n) });
  await extractArchive(java.bytes, path.join(destination, 'jre'), { stripFirst: true });
  await fs.mkdir(path.join(destination, 'plantuml'), { recursive: true });
  await fs.writeFile(path.join(destination, 'plantuml/plantuml.jar'), plant.bytes);
  // Keep upstream notices verbatim. The JRE legal tree is also retained in full.
  const licenseRoot = path.join(destination, 'licenses');
  await fs.mkdir(licenseRoot, { recursive: true });
  await fs.writeFile(path.join(licenseRoot, 'drawio-LICENSE.txt'), selected.get('drawio-license').bytes);
  for (const {input,bytes} of selected.values()) {
    if (!input.destination) continue;
    const target=path.join(destination,safeArchivePath(input.destination));
    await fs.mkdir(path.dirname(target),{recursive:true});await fs.writeFile(target,bytes);
  }
  const noticeEntries = unzipSync(plant.bytes, { filter: e => /(^|\/)(license|copying|notice)([.\-\/]|$)/i.test(e.name) });
  for (const [name, bytes] of Object.entries(noticeEntries)) {
    if (name.endsWith('/')) continue;
    const target = path.join(licenseRoot, 'plantuml', safeArchivePath(name));
    await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, bytes);
  }
  const graphviz = unzipSync(plant.bytes, { filter: e => /graphviz|dot\.exe/i.test(e.name) });
  await fs.writeFile(path.join(licenseRoot, 'sources.json'), JSON.stringify(inputs, null, 2));
  await fs.writeFile(path.join(licenseRoot, 'README.txt'), 'Offline distribution components: see sources.json for exact release URLs and SHA-256.\nJava: complete original legal/ tree and NOTICE retained in jre.\nPlantUML: complete original JAR retained, plus original LICENSE, COPYING, COPYING.LESSER and LICENSES.md under licenses/plantuml.\nWindows Graphviz: embedded in the exact PlantUML JAR; distribution notice is licenses/graphviz-LICENSE.txt.\nDraw.io: original client copyright notices retained; original top-level license is licenses/drawio-LICENSE.txt. No cloud storage/proxy/export servlet is supplied.\n');
  const files = await inventory(destination);
  const manifest = { format: 'seaf-offline-assets-v1', platform: inputs.platform, inputs: inputs.inputs, files, embeddedGraphvizEntries: Object.keys(graphviz).sort(), capabilities: { drawio: 'static-editor-and-native-xml', plantuml: 'local-svg-sandbox', networkRequired: false, cloudStorage: false, serverPdfExport: false } };
  await fs.writeFile(path.join(destination, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return { destination: path.resolve(destination), manifest };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await prepareOfflineAssets({ destination: process.argv[2] || path.join(here, 'state/offline'), allowDownload: !process.argv.includes('--offline') });
  console.log(JSON.stringify({ destination: result.destination, files: result.manifest.files.length, versions: result.manifest.inputs.map(i => `${i.id}@${i.version}`) }));
}
