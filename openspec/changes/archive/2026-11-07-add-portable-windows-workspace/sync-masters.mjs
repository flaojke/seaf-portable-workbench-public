/** Apply this accepted delta with the pinned merger, without archiving unfinished release work. */
import fs from "node:fs/promises";
import path from "node:path";
import assert from "node:assert/strict";
import crypto from "node:crypto";
import { fileURLToPath, pathToFileURL } from "node:url";
const here = path.dirname(fileURLToPath(import.meta.url)),
  repo = path.resolve(here, "../../.."),
  specs = path.join(repo, "openspec/specs"),
  evidence = path.join(here, "evidence");
const tool = path.join(
  repo,
  "openspec/tooling/node_modules/@fission-ai/openspec/dist/core"
);
const { findSpecUpdates, buildUpdatedSpec, writeUpdatedSpec } = await import(
  pathToFileURL(path.join(tool, "specs-apply.js")).href
);
const { extractRequirementsSection, parseDeltaSpec, diffScenarioNames } =
  await import(
    pathToFileURL(path.join(tool, "parsers/requirement-blocks.js")).href
  );
const { Validator } = await import(
  pathToFileURL(path.join(tool, "validation/validator.js")).href
);
const sha = (body) => crypto.createHash("sha256").update(body).digest("hex"),
  normal = (body) => body.replaceAll("\r\n", "\n").trim();
const note =
  "## Portable profile sync\n\n2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.";
const withNote = (body) => {
  const normalized = body.replaceAll("\r\n", "\n");
  return normalized.includes("## Portable profile sync")
    ? normalized
        .replace(/## Portable profile sync\n[\s\S]*?(?=\n## |$)/, note)
        .trimEnd() + "\n"
    : normalized.trimEnd() + "\n\n" + note + "\n";
};
const updates = await findSpecUpdates(here, specs),
  validator = new Validator(),
  prepared = [];
const beforeAll = {};
for (const dir of await fs.readdir(specs, { withFileTypes: true }))
  if (dir.isDirectory()) {
    const file = path.join(specs, dir.name, "spec.md");
    const bytes = await fs.readFile(file);
    beforeAll[dir.name] = sha(bytes);
  }
for (const update of updates) {
  const before = update.exists
      ? await fs.readFile(update.target, "utf8")
      : null,
    delta = await fs.readFile(update.source, "utf8"),
    plan = parseDeltaSpec(delta);
  assert.equal(
    plan.removed.length,
    0,
    "No removal is authorized by this delta"
  );
  assert.equal(plan.renamed.length, 0);
  const built = await buildUpdatedSpec(
      update,
      "add-portable-windows-workspace",
      { silent: true }
    ),
    rebuilt = withNote(built.rebuilt);
  const oldBlocks = before ? extractRequirementsSection(before).bodyBlocks : [],
    newBlocks = extractRequirementsSection(rebuilt).bodyBlocks,
    map = new Map(newBlocks.map((b) => [b.name, b]));
  const modified = new Set(plan.modified.map((b) => b.name)),
    preserved = [];
  for (const block of oldBlocks) {
    assert.ok(map.has(block.name), "Baseline requirement lost: " + block.name);
    if (!modified.has(block.name)) {
      assert.equal(
        normal(map.get(block.name).raw),
        normal(block.raw),
        "Unmodified baseline changed: " + block.name
      );
      preserved.push(block.name);
    } else
      assert.deepEqual(
        diffScenarioNames(block, map.get(block.name)).missing,
        [],
        "Baseline scenarios lost"
      );
  }
  for (const added of plan.added)
    assert.ok(map.has(added.name), "Added requirement missing");
  const report = await validator.validateSpecContent(update.id, rebuilt);
  assert.equal(report.valid, true, JSON.stringify(report.issues));
  prepared.push({
    update,
    before,
    rebuilt,
    counts: built.counts,
    warnings: built.warnings,
    beforeRequirements: oldBlocks.length,
    afterRequirements: newBlocks.length,
    preserved,
    baselineScenariosPreserved: true,
  });
}
if (!process.argv.includes("--write")) {
  console.log(
    JSON.stringify({
      mode: "preview",
      specs: prepared.map((p) => ({
        id: p.update.id,
        counts: p.counts,
        preserved: p.preserved.length,
      })),
    })
  );
  process.exit(0);
}
await fs.mkdir(evidence, { recursive: true });
const baselineFile = path.join(evidence, "master-baseline.json");
if (!(await fs.stat(baselineFile).catch(() => null)))
  await fs.writeFile(
    baselineFile,
    JSON.stringify(
      {
        format: "seaf-portable-master-baseline-v1",
        beforeAll,
        requirements: prepared.map((p) => ({
          id: p.update.id,
          sha256: p.before ? sha(p.before) : null,
          requirements: p.beforeRequirements,
          preservedUnmodified: p.preserved,
        })),
      },
      null,
      2
    ) + "\n"
  );
for (const p of prepared)
  await writeUpdatedSpec(p.update, p.rebuilt, p.counts, { silent: true });
for (const [id, beforeHash] of Object.entries(beforeAll))
  if (!updates.some((u) => u.id === id))
    assert.equal(
      sha(await fs.readFile(path.join(specs, id, "spec.md"))),
      beforeHash,
      "Unrelated master changed"
    );
const second = await findSpecUpdates(here, specs);
for (const update of second) {
  const built = await buildUpdatedSpec(
    update,
    "add-portable-windows-workspace",
    { silent: true }
  );
  assert.deepEqual(built.counts, {
    added: 0,
    modified: 0,
    removed: 0,
    renamed: 0,
  });
  assert.equal(
    normal(withNote(built.rebuilt)),
    normal(await fs.readFile(update.target, "utf8")),
    "Second sync is not idempotent"
  );
}
const record = {
  format: "seaf-portable-master-sync-v1",
  status: "passed",
  archived: false,
  clientDate: "2026-11-07",
  pinnedOpenSpec: "1.16.0",
  method:
    "Official specs-apply API; validate all rebuilt specs before writing, preserve untouched baseline/scenarios, then verify second application is a no-op",
  allBaselineRequirementsPreserved: true,
  allBaselineScenariosPreserved: true,
  unrelatedMastersUnchanged: true,
  idempotent: true,
  specs: prepared.map((p) => ({
    id: p.update.id,
    counts: p.counts,
    warnings: p.warnings,
    beforeRequirements: p.beforeRequirements,
    afterRequirements: p.afterRequirements,
    preservedUnmodified: p.preserved.length,
    sha256: sha(p.rebuilt),
  })),
};
await fs.writeFile(
  path.join(evidence, "master-sync.json"),
  JSON.stringify(record, null, 2) + "\n"
);
console.log(JSON.stringify(record));
