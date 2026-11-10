/** Maintainer utility: import the exact tracked core tree; never imports local state. */
import fs from 'node:fs/promises';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const repo = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = path.resolve(process.argv[2] || path.join(repo, 'repositories/seaf-archtool-core'));
const destination = path.join(repo, 'vendor/seaf-archtool-core');
const git = (...args) => execFileSync('git', ['-C', source, ...args], {encoding:'utf8', windowsHide:true});
if (git('status', '--porcelain').trim()) throw Error('Source core must be clean before vendoring');
const files = git('ls-files', '-z').split('\0').filter(Boolean);
await fs.mkdir(destination, {recursive:true});
for (const file of files) {
  if (file.split('/').some(p => ['.git','node_modules','dist'].includes(p))) throw Error('Unexpected source file ' + file);
  const target = path.join(destination, file);
  await fs.mkdir(path.dirname(target), {recursive:true});
  await fs.copyFile(path.join(source, file), target);
}
await fs.writeFile(path.join(destination, 'UPSTREAM.json'), JSON.stringify({
  repository: git('remote','get-url','origin').trim(),
  commit: git('rev-parse','HEAD').trim(),
  version: JSON.parse(await fs.readFile(path.join(source,'package.json'),'utf8')).version,
  upstreamBase: 'c928383e599565533ecd76f90765691bc5a73704',
  localCommits: ['9669b513205bc003534da32b13d47517d9b0c150','ccc4a0119514bcc4a73d7d860abfb3739fd543ac','3f77aaacee390d36ea517a910418e0a6c7a6f500'],
  trackedFiles: files.length,
  notice: 'Vendored source retains upstream LICENSE and NOTICE. Native Windows changes are maintained in this repository.'
},null,2)+'\n');
console.log(JSON.stringify({destination,files:files.length}));
