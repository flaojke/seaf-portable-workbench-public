/** Read-only source-publication inventory. Never stages, commits or sends files. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { classifySourceCandidates, sourcePathDecision, SOURCE_POLICY_VERSION, MAX_SOURCE_BYTES } from "./source-policy.mjs";
import { reportContentFindings, SOURCE_REPORT_POLICY_VERSION } from "./source-report-policy.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const arguments_ = process.argv.slice(2),
  index = arguments_.indexOf("--out");
const output = path.resolve(
  index < 0
    ? path.join(root, "seaf-mcp/state/source-publication-audit.json")
    : arguments_[index + 1]
);
const git = (args) =>
  execFileSync("git", args, {
    cwd: root,
    windowsHide: true,
    maxBuffer: 16 * 1024 * 1024,
  }).toString("utf8");
if (
  (
    await fs.realpath(git(["rev-parse", "--show-toplevel"]).trim())
  ).toLowerCase() !== (await fs.realpath(root)).toLowerCase()
)
  throw Error(
    "Source audit requires its own repository root, not a containing Git repository"
  );
const candidates = [
  ...new Set(
    git(["ls-files", "-c", "--others", "--exclude-standard", "-z"])
      .split("\0")
      .filter(Boolean)
  ),
].sort();
const classified = classifySourceCandidates(candidates),
  excludedCandidates = classified.excluded,
  outOfScopeCandidates = classified.outOfScope;
const relative = (file) => path.relative(root, file).replaceAll(path.sep, "/");
const sources = [],
  large = [],
  privateMarkers = [],
  reportContent = [],
  symlinks = [],
  missing = [];
const patterns = [
  ["private-key", /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/g],
  [
    "github-token",
    /\b(?:gh[pousr]_[A-Za-z0-9]{36,}|github_pat_[A-Za-z0-9_]{60,})\b/g,
  ],
  ["gitlab-token", /\bglpat-[A-Za-z0-9_-]{20,}\b/g],
  ["aws-access-id", /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g],
];
// Denied and unrelated paths never enter filesystem content reads.
for (const filename of classified.allowed) {
  const absolute = path.join(root, filename),
    stat = await fs.lstat(absolute).catch(() => null);
  if (!stat) {
    missing.push(filename);
    continue;
  }
  if (stat.isSymbolicLink()) {
    symlinks.push(filename);
    continue;
  }
  if (!stat.isFile()) continue;
  if (stat.size > MAX_SOURCE_BYTES) {
    large.push({path: filename, bytes: stat.size, contentRead: false});
    continue;
  }
  const bytes = await fs.readFile(absolute),
    record = {
      path: filename,
      bytes: bytes.length,
      sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    };
  if (bytes.length > MAX_SOURCE_BYTES) {
    large.push({...record, sizeChangedDuringRead: true});
    continue;
  }
  sources.push(record);
  if (!bytes.subarray(0, 8192).includes(0)) {
    const body = bytes.toString("utf8");
    reportContent.push(...reportContentFindings(filename, body).map(finding=>({path:filename,...finding})));
    for (const [category, pattern] of patterns) {
      pattern.lastIndex = 0;
      const matches = [...body.matchAll(pattern)].length;
      if (matches)
        privateMarkers.push({
          path: filename,
          category,
          matches,
          contentRedacted: true,
        });
    }
  }
}
const topLevel = {};
for (const r of sources) {
  const group = r.path.includes("/") ? r.path.split("/")[0] : "root";
  topLevel[group] ??= { files: 0, bytes: 0 };
  topLevel[group].files++;
  topLevel[group].bytes += r.bytes;
}
const prefixes = new Set(
  sources.flatMap((r) => {
    const pieces = r.path.split("/");
    return pieces.slice(0, -1).map((_, i) => pieces.slice(0, i + 1).join("/"));
  })
);
const nestedGit = [];
for (const prefix of prefixes)
  if (await fs.lstat(path.join(root, prefix, ".git")).catch(() => null))
    nestedGit.push(prefix + "/.git");
const gitlinks = git(["ls-files", "-s"])
  .split("\n")
  .filter((line) => line.startsWith("160000 "))
  .map((line) => line.slice(line.indexOf("\t") + 1));
const ignoredChecks = {};
for (const filename of [
  "seaf-mcp/projects.json",
  "seaf-mcp/mcp.config.json",
  "portable/cache/check.zip",
  "portable/state/test.json",
  "dist/SEAF-Windows-x64.zip",
  "data/settings.json",
  "vendor/seaf-archtool-core/node_modules/x/index.js",
  "vendor/seaf-archtool-core/dist/index.html",
]) {
  try {
    git(["check-ignore", "--no-index", "-q", filename]);
    ignoredChecks[filename] = true;
  } catch {
    ignoredChecks[filename] = false;
  }
}
const reachable = git(["rev-list", "--objects", "--all"])
  .split("\n")
  .filter(Boolean)
  .map((line) => {
    const split = line.indexOf(" ");
    return {
      oid: split < 0 ? line : line.slice(0, split),
      path: split < 0 ? null : line.slice(split + 1),
    };
  });
const historicalNames = new Map(
  reachable.filter((r) => r.path).map((r) => [r.oid, r.path])
);
const metadata = execFileSync("git", ["cat-file", "--batch-check"], {
  cwd: root,
  input: reachable.map((r) => r.oid).join("\n") + "\n",
  windowsHide: true,
  maxBuffer: 16 * 1024 * 1024,
})
  .toString("utf8")
  .trim()
  .split("\n");
const blobRecords = metadata
  .map((line) => line.split(" "))
  .filter((row) => row[1] === "blob")
  .map((row) => ({oid:row[0], bytes:Number(row[2]), path:historicalNames.get(row[0]) || null}));
const historicalLocalConfiguration = blobRecords
  .filter(row => /^seaf-mcp\/(projects(?:\.local)?|mcp\.config)\.json$/.test(row.path || ""))
  .map(row => ({path:row.path, oid:row.oid, bytes:row.bytes}));
const historicalSkipped = blobRecords.flatMap(row => {
  const decision=sourcePathDecision(row.path);
  return !decision.allowed || row.bytes > MAX_SOURCE_BYTES
    ? [{...row, reason:decision.allowed?"oversized-source":decision.reason, contentRead:false}]
    : [];
});
const skippedIds=new Set(historicalSkipped.map(row=>row.oid));
const blobIds=blobRecords.filter(row=>!skippedIds.has(row.oid)).map(row=>row.oid);
const historyBytes = blobIds.length ? execFileSync("git", ["cat-file", "--batch"], {
  cwd: root,
  input: blobIds.join("\n") + "\n",
  windowsHide: true,
  maxBuffer: 64 * 1024 * 1024,
}) : Buffer.alloc(0);
const historyMarkers = [];
const historicalReportContent = [];
let offset = 0;
for (const oid of blobIds) {
  const end = historyBytes.indexOf(10, offset),
    header = historyBytes.subarray(offset, end).toString("utf8").split(" "),
    size = Number(header[2]);
  offset = end + 1;
  const bytes = historyBytes.subarray(offset, offset + size);
  offset += size + 1;
  const filename = historicalNames.get(oid) || "(unnamed blob)";
  if (bytes.subarray(0, 8192).includes(0)) continue;
  const body = bytes.toString("utf8");
  historicalReportContent.push(...reportContentFindings(filename, body).map(finding=>({path:filename,oid,...finding})));
  for (const [category, pattern] of patterns) {
    pattern.lastIndex = 0;
    const matches = [...body.matchAll(pattern)].length;
    if (matches)
      historyMarkers.push({
        path: filename,
        oid,
        category,
        matches,
        contentRedacted: true,
      });
  }
}
const receipt = {
  format: "seaf-source-publication-audit-v1",
  created: new Date().toISOString(),
  scope:
    "Declared SEAF source paths among tracked plus nonignored candidates, before staging. Denied/out-of-scope contents are not read. This is not a clean-checkout build or final release ZIP check.",
  sourcePathPolicy: SOURCE_POLICY_VERSION,
  reportContentPolicy: SOURCE_REPORT_POLICY_VERSION,
  candidateFiles: candidates.length,
  mutations: false,
  sourceFiles: sources.length,
  sourceBytes: sources.reduce((sum, r) => sum + r.bytes, 0),
  topLevel,
  largeFilesAbove5MiB: large,
  privateMarkers,
  reportContent,
  privateMarkerScan:
    "Selected high-confidence key/token formats only; values are never printed. This is not proof that every possible secret format is absent.",
  excludedCandidates,
  outOfScopeCandidates,
  symlinks,
  nestedGit,
  gitlinks,
  missing,
  ignoredChecks,
  sourceInventory: sources,
};
receipt.history = {
  scope:
    "Only allowed SEAF source blobs up to 5 MiB under existing local refs are scanned. Denied, unnamed, unrelated and oversized historical blob contents are not read. Old local history is not approved for publication.",
  commits: Number(git(["rev-list", "--count", "--all"]).trim()),
  blobs: blobRecords.length,
  scannedBlobs: blobIds.length,
  skippedBlobs: historicalSkipped,
  privateMarkers: historyMarkers,
  historicalLocalConfiguration,
  reportContent: historicalReportContent,
};
receipt.snapshotStatus =
  privateMarkers.length ||
  reportContent.length ||
  excludedCandidates.length ||
  outOfScopeCandidates.length ||
  large.length ||
  symlinks.length ||
  nestedGit.length ||
  gitlinks.length ||
  missing.length ||
  Object.values(ignoredChecks).some((v) => !v)
    ? "review_required"
    : "passed";
receipt.historyPublicationApproved = false;
receipt.status = receipt.snapshotStatus === "passed" && !historyMarkers.length && !historicalReportContent.length
  ? "passed" : "review_required";
await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, JSON.stringify(receipt, null, 2) + "\n");
console.log(
  JSON.stringify({
    status: receipt.status,
    snapshotStatus: receipt.snapshotStatus,
    historyPublicationApproved: false,
    sourceFiles: receipt.sourceFiles,
    sourceMiB: Math.round(receipt.sourceBytes / 104857.6) / 10,
    topLevel,
    largeFilesAbove5MiB: large.map((r) => ({ path: r.path, bytes: r.bytes })),
    privateMarkers,
    reportContent,
    excludedCandidates,
    outOfScopeCandidates,
    symlinks,
    nestedGit,
    gitlinks,
    missing,
    ignoredChecks,
    history: receipt.history,
    receipt: relative(output),
  })
);
