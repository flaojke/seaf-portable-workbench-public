/** Positive SEAF publication boundary. This module performs no filesystem reads. */
export const MAX_SOURCE_BYTES = 5 * 1024 * 1024;
export const SOURCE_POLICY_VERSION = 'seaf-source-path-policy-v1';
export const SOURCE_ROOT_FILES = Object.freeze([
  '.editorconfig', '.gitattributes', '.gitignore', 'AGENTS.md',
  'CONTRIBUTING.md', 'LICENSE', 'NOTICE', 'README.md', 'UPSTREAM.md',
  'SOURCE-MANIFEST.json',
]);
export const SOURCE_DIRECTORIES = Object.freeze([
  'benchmarks', 'docs', 'examples', 'openspec', 'portable', 'seaf-mcp',
]);
const rootFiles = new Set(SOURCE_ROOT_FILES);
const directories = new Set(SOURCE_DIRECTORIES);
const forbiddenDirectories = new Set(['.git', '.aws', '.ssh', '.kube', '.codex', 'node_modules']);
const runtimePaths = /^(?:data|runtime|dist)(?:\/|$)|^portable\/(?:cache|state)(?:\/|$)|^benchmarks\/repository-layout\/state(?:\/|$)|^vendor\/seaf-archtool-core\/(?:dist|public\/plugins)(?:\/|$)|^seaf-mcp\/state(?:\/|$)|^seaf-mcp\/(?:projects(?:\.local)?|mcp\.config)\.json$/i;
const privateFile = name =>
  /(?:^\.env(?:\.|$)|\.env$)/i.test(name) ||
  /^id_(?:rsa|dsa|ecdsa|ed25519)(?:\.(?:pem|key))?$/i.test(name) ||
  /\.(?:key|p12|pfx)$/i.test(name) ||
  /(?:private|privkey).*\.pem$/i.test(name) ||
  /^(?:private(?:[-_]?key)?|privkey)(?:\.(?:pem|txt|json))?$/i.test(name) ||
  /^(?:\.netrc|_netrc|credentials(?:\.json)?|kubeconfig)$/i.test(name);

export function sourcePathDecision(filename) {
  if (typeof filename !== 'string' || !filename || filename.startsWith('/') ||
      filename.includes('\\') || filename.includes(':') ||
      /[\u0000-\u001f]/.test(filename) ||
      filename.split('/').some(part => !part || part === '.' || part === '..'))
    return { allowed: false, kind: 'excluded', reason: 'unsafe-path' };
  const parts = filename.split('/');
  if (parts.some(part => forbiddenDirectories.has(part.toLowerCase())))
    return { allowed: false, kind: 'excluded', reason: 'private-or-dependency-directory' };
  if (runtimePaths.test(filename))
    return { allowed: false, kind: 'excluded', reason: 'runtime-state-or-machine-config' };
  if (privateFile(parts.at(-1)))
    return { allowed: false, kind: 'excluded', reason: 'private-file' };
  if (parts.length === 1 && rootFiles.has(filename))
    return { allowed: true, kind: 'allowed', reason: 'declared-root-file' };
  if (parts.length > 1 && directories.has(parts[0]))
    return { allowed: true, kind: 'allowed', reason: 'declared-source-directory' };
  if (parts.length > 2 && parts[0] === 'vendor' && parts[1] === 'seaf-archtool-core')
    return { allowed: true, kind: 'allowed', reason: 'declared-vendored-core' };
  if (filename === 'seaf-docker/compose.yaml' || filename === 'seaf-docker/launcher.ps1')
    return { allowed: true, kind: 'allowed', reason: 'declared-docker-source' };
  return { allowed: false, kind: 'out-of-scope', reason: 'outside-declared-seaf-source' };
}

export function classifySourceCandidates(candidates) {
  const allowed = [], excluded = [], outOfScope = [];
  for (const filename of [...new Set(candidates)].sort()) {
    const decision = sourcePathDecision(filename);
    if (decision.allowed) allowed.push(filename);
    else if (decision.kind === 'out-of-scope') outOfScope.push(filename);
    else excluded.push(filename);
  }
  return { allowed, excluded, outOfScope };
}
