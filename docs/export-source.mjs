/** Copy an audited source snapshot; never changes Git history, commits or pushes. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."),
  args = process.argv.slice(2);
const value = (name) => {
  const index = args.indexOf(name);
  return index < 0 ? null : args[index + 1];
};
const output = path.resolve(
  value("--output") || path.join(root, "dist/seaf-portable-workbench-source")
);
const releaseRoot = path.resolve(root, "dist");
const releaseRelative = path.relative(releaseRoot, output);
if (
  !releaseRelative ||
  releaseRelative === ".." ||
  releaseRelative.startsWith(".." + path.sep) ||
  path.isAbsolute(releaseRelative)
)
  throw Error(
    "Source export must be a new directory below this workspace dist/"
  );
for (
  let parent = path.dirname(output);
  path.relative(root, parent) !== "";
  parent = path.dirname(parent)
) {
  const parentStat = await fs.lstat(parent).catch((error) => {
    if (error.code !== "ENOENT") throw error;
  });
  if (parentStat?.isSymbolicLink())
    throw Error("Source export parent must not be a symlink or junction");
}
const existing = await fs.lstat(output).catch((error) => {
  if (error.code !== "ENOENT") throw error;
});
if (
  existing &&
  (existing.isSymbolicLink() ||
    !existing.isDirectory() ||
    (await fs.readdir(output)).length)
)
  throw Error(
    "Source export destination must be absent or empty; existing data is never overwritten"
  );
const auditPath = path.join(root, "seaf-mcp/state/source-export-audit.json");
execFileSync(
  process.execPath,
  [path.join(root, "docs/source-audit.mjs"), "--out", auditPath],
  { cwd: root, windowsHide: true, stdio: "pipe", maxBuffer: 4 * 1024 * 1024 }
);
const audit = JSON.parse(await fs.readFile(auditPath, "utf8"));
if (audit.status !== "passed")
  throw Error(
    "Source audit requires review before export; see the local audit receipt"
  );
const digest = (bytes) =>
  crypto.createHash("sha256").update(bytes).digest("hex");
const rows = audit.sourceInventory
  .filter((row) => row.path !== "SOURCE-MANIFEST.json")
  .map((row) => ({ path: row.path, bytes: row.bytes, sha256: row.sha256 }));
await fs.mkdir(output, { recursive: true });
for (const row of rows) {
  if (
    !row.path ||
    path.isAbsolute(row.path) ||
    row.path.includes("\\") ||
    row.path.split("/").some((part) => !part || part === "." || part === "..")
  )
    throw Error("Unsafe source inventory path");
  const source = path.join(root, row.path),
    stat = await fs.lstat(source);
  if (!stat.isFile() || stat.isSymbolicLink())
    throw Error("Source type changed after audit: " + row.path);
  const bytes = await fs.readFile(source);
  if (bytes.length !== row.bytes || digest(bytes) !== row.sha256)
    throw Error(
      "Source changed after audit: " +
        row.path +
        "; freeze source edits and use a fresh output"
    );
  const destination = path.join(output, row.path);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, bytes, { flag: "wx" });
}
const sourceIdentity = digest(Buffer.from(JSON.stringify(rows)));
const provenance = JSON.parse(
  await fs.readFile(
    path.join(root, "vendor/seaf-archtool-core/UPSTREAM.json"),
    "utf8"
  )
);
const manifest = {
  format: "seaf-clean-source-export-v1",
  name: "seaf-portable-workbench",
  platform: "source",
  sourceIdentity,
  sourceFiles: rows.length,
  sourceBytes: rows.reduce((sum, row) => sum + row.bytes, 0),
  scope:
    "Audited working-tree source snapshot. Original local Git history, personal registrations, runtime, dependencies and build artifacts are excluded. Build and release acceptance remain separate.",
  upstream: provenance,
  files: rows,
};
await fs.writeFile(
  path.join(output, "SOURCE-MANIFEST.json"),
  JSON.stringify(manifest, null, 2) + "\n",
  { flag: "wx" }
);
// Re-read source bytes after copying, so concurrent edits cannot silently produce a mixed snapshot.
for (const row of rows)
  if (digest(await fs.readFile(path.join(root, row.path))) !== row.sha256)
    throw Error(
      "Source changed during export: " +
        row.path +
        "; retain this incomplete copy for diagnosis and use a fresh output"
    );
console.log(
  JSON.stringify({
    status: "copied",
    output,
    sourceFiles: rows.length,
    sourceBytes: manifest.sourceBytes,
    sourceIdentity,
    gitHistoryCopied: false,
    sourceBuildVerified: false,
    manifest: "SOURCE-MANIFEST.json",
  })
);
