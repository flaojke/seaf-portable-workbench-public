/** Canonical committed-source manifest and ZIP; never pushes or commits. */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
const require = createRequire(
    new URL("../seaf-mcp/package.json", import.meta.url)
  ),
  { unzipSync } = require("fflate");
const args = process.argv.slice(2),
  mode = args[0] || "verify",
  value = (name) => {
    const i = args.indexOf(name);
    return i < 0 ? null : args[i + 1];
  };
const repo = path.resolve(
  value("--repo") ||
    path.join(path.dirname(fileURLToPath(import.meta.url)), "..")
);
const sha = (bytes) => crypto.createHash("sha256").update(bytes).digest("hex");
const git = (parameters, binary = false) =>
  execFileSync("git", parameters, {
    cwd: repo,
    windowsHide: true,
    maxBuffer: 256 * 1024 * 1024,
    encoding: binary ? undefined : "utf8",
  });
assert.equal(
  (
    await fs.realpath(String(git(["rev-parse", "--show-toplevel"])).trim())
  ).toLowerCase(),
  (await fs.realpath(repo)).toLowerCase(),
  "Select an independent source Git root"
);
const infoAttributes = String(
  git(["rev-parse", "--git-path", "info/attributes"])
).trim();
assert.ok(
  !(
    await fs.readFile(path.resolve(repo, infoAttributes), "utf8").catch((e) => {
      if (e.code !== "ENOENT") throw e;
      return "";
    })
  ).trim(),
  "Local info/attributes overrides must be reviewed before canonical source export"
);
const policy = {
  coreAutocrlf: false,
  coreEol: "lf",
  repositoryAttributes:
    "Committed .gitattributes are respected; *.ps1 and *.cmd use CRLF.",
  globalAttributes:
    "Disabled via core.attributesFile pointing at the operating system null device.",
};
const archive = (tree, prefix = "") =>
  git(
    [
      "-c",
      "core.autocrlf=false",
      "-c",
      "core.eol=lf",
      "-c",
      "core.attributesFile=" + os.devNull,
      "archive",
      "--format=zip",
      ...(prefix ? ["--prefix=" + prefix + "/"] : []),
      tree,
    ],
    true
  );
function decode(bytes, prefix = "") {
  const seen = new Set(),
    start = prefix ? prefix + "/" : "";
  const decoded = unzipSync(bytes, {
    filter: (entry) => {
      assert.ok(!seen.has(entry.name), "Duplicate ZIP entry");
      seen.add(entry.name);
      assert.ok(
        !entry.name.includes("\\") &&
          !entry.name.includes(":") &&
          !entry.name.startsWith("/") &&
          !entry.name.split("/").includes(".."),
        "Unsafe ZIP entry"
      );
      return !entry.name.endsWith("/");
    },
  });
  const result = {};
  for (const [name, content] of Object.entries(decoded)) {
    assert.ok(name.startsWith(start), "Unexpected ZIP prefix");
    const relative = name.slice(start.length);
    assert.ok(relative && !relative.endsWith("/"));
    result[relative] = Buffer.from(content);
  }
  return result;
}
const rowsOf = (files) =>
  Object.keys(files)
    .filter((name) => name !== "SOURCE-MANIFEST.json")
    .sort()
    .map((name) => ({
      path: name,
      bytes: files[name].length,
      sha256: sha(files[name]),
    }));
function verifyFiles(files) {
  assert.ok(files["SOURCE-MANIFEST.json"], "Missing source manifest");
  const manifest = JSON.parse(files["SOURCE-MANIFEST.json"].toString("utf8"));
  assert.equal(manifest.format, "seaf-clean-source-export-v1");
  assert.equal(manifest.identityScope, "canonical-git-archive-files-v1");
  assert.deepEqual(manifest.lineEndingPolicy, policy);
  const actual = rowsOf(files);
  assert.deepEqual(
    manifest.files,
    actual,
    "Source ZIP files or bytes differ from manifest"
  );
  assert.equal(
    manifest.sourceIdentity,
    sha(Buffer.from(JSON.stringify(actual)))
  );
  assert.equal(manifest.sourceFiles, actual.length);
  assert.equal(
    manifest.sourceBytes,
    actual.reduce((sum, r) => sum + r.bytes, 0)
  );
  return manifest;
}
if (mode === "refresh") {
  const unstaged = String(git(["diff", "--name-only"]))
      .trim()
      .split("\n")
      .filter((name) => name && name !== "SOURCE-MANIFEST.json"),
    untracked = String(git(["ls-files", "--others", "--exclude-standard"]))
      .trim()
      .split("\n")
      .filter((name) => name && name !== "SOURCE-MANIFEST.json");
  assert.deepEqual(
    unstaged,
    [],
    "Stage reviewed source changes before manifest refresh"
  );
  assert.deepEqual(
    untracked,
    [],
    "Stage reviewed source files before manifest refresh"
  );
  const tree = String(git(["write-tree"])).trim(),
    files = decode(archive(tree)),
    rows = rowsOf(files),
    filename = path.join(repo, "SOURCE-MANIFEST.json"),
    previous = JSON.parse(await fs.readFile(filename, "utf8"));
  const committedPaths = String(
    git(["ls-tree", "-r", "--name-only", "-z", tree])
  )
    .split("\0")
    .filter(Boolean)
    .sort();
  assert.deepEqual(
    Object.keys(files).sort(),
    committedPaths,
    "Repository attributes must not silently omit committed source files"
  );
  const manifest = {
    ...previous,
    identityScope: "canonical-git-archive-files-v1",
    lineEndingPolicy: policy,
    sourceIdentity: sha(Buffer.from(JSON.stringify(rows))),
    sourceFiles: rows.length,
    sourceBytes: rows.reduce((sum, r) => sum + r.bytes, 0),
    scope:
      "Canonical committed-source archive bytes, excluding this manifest itself. Git working-tree line-ending conversion may differ. Runtime release acceptance is recorded separately.",
    files: rows,
  };
  const functional =
    value("--functional-source") || manifest.functionalSourceCommit;
  if (functional) {
    assert.match(functional, /^[0-9a-f]{40}$/);
    git(["cat-file", "-e", functional + "^{commit}"]);
    manifest.functionalSourceCommit = functional;
  }
  await fs.writeFile(filename, JSON.stringify(manifest, null, 2) + "\n");
  console.log(
    JSON.stringify({
      status: "refreshed",
      sourceIdentity: manifest.sourceIdentity,
      files: rows.length,
      tree,
      selfExcluded: true,
      next: "Stage SOURCE-MANIFEST.json, review and commit; this command does not commit.",
    })
  );
} else if (mode === "verify") {
  const manifest = verifyFiles(decode(archive("HEAD")));
  console.log(
    JSON.stringify({
      status: "passed",
      commit: String(git(["rev-parse", "HEAD"])).trim(),
      sourceIdentity: manifest.sourceIdentity,
      files: manifest.sourceFiles,
    })
  );
} else if (mode === "archive") {
  assert.equal(
    String(git(["status", "--porcelain"])).trim(),
    "",
    "Source Git must be clean before archive"
  );
  const manifest = verifyFiles(decode(archive("HEAD")));
  assert.match(manifest.name, /^[a-z0-9][a-z0-9._-]*$/);
  const output = path.resolve(
    value("--output") || path.join(repo, "dist", manifest.name + "-source.zip")
  );
  assert.ok(output.endsWith(".zip"));
  await fs.mkdir(path.dirname(output), { recursive: true });
  const bytes = archive("HEAD", manifest.name);
  verifyFiles(decode(bytes, manifest.name));
  const temporary = output + ".partial-" + crypto.randomUUID();
  try {
    await fs.writeFile(temporary, bytes, { flag: "wx" });
    await fs.link(temporary, output);
  } finally {
    await fs.unlink(temporary).catch((e) => {
      if (e.code !== "ENOENT") throw e;
    });
  }
  const saved = await fs.readFile(output);
  assert.equal(sha(saved), sha(bytes));
  verifyFiles(decode(saved, manifest.name));
  const hash = sha(saved),
    sri =
      "sha256-" + crypto.createHash("sha256").update(saved).digest("base64");
  await fs.writeFile(
    output + ".sha256",
    hash + "  " + path.basename(output) + "\n",
    { flag: "wx" }
  );
  await fs.writeFile(output + ".sri", sri + "\n", { flag: "wx" });
  console.log(
    JSON.stringify({
      status: "passed",
      output,
      commit: String(git(["rev-parse", "HEAD"])).trim(),
      bytes: saved.length,
      sha256: hash,
      sri,
      sourceIdentity: manifest.sourceIdentity,
      files: manifest.sourceFiles,
      verifiedEveryArchiveFile: true,
      selfExcluded: true,
    })
  );
} else if (mode === "verify-zip") {
  assert.ok(value("--zip"), "Use --zip <source.zip>");
  const bytes = await fs.readFile(path.resolve(value("--zip"))),
    names = Object.keys(unzipSync(bytes)).filter((name) => !name.endsWith("/")),
    prefix = names[0]?.split("/")[0];
  assert.ok(prefix);
  const manifest = verifyFiles(decode(bytes, prefix));
  const hash = sha(bytes),
    sri =
      "sha256-" + crypto.createHash("sha256").update(bytes).digest("base64"),
    expectedHash = (
      await fs.readFile(path.resolve(value("--zip")) + ".sha256", "utf8")
    )
      .trim()
      .split(/\s+/)[0],
    expectedSri = (
      await fs.readFile(path.resolve(value("--zip")) + ".sri", "utf8")
    ).trim();
  assert.equal(hash, expectedHash);
  assert.equal(sri, expectedSri);
  console.log(
    JSON.stringify({
      status: "passed",
      bytes: bytes.length,
      sha256: hash,
      sri,
      files: manifest.sourceFiles,
      sourceIdentity: manifest.sourceIdentity,
      verifiedEveryArchiveFile: true,
    })
  );
} else
  throw Error(
    "Usage: source-manifest.mjs refresh|verify|archive|verify-zip [--repo <source-root>] [--functional-source <commit>] [--output <source.zip>] [--zip <source.zip>]"
  );
