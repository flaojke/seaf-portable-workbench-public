/** Remaining OpenSpec backend gates. All writes use private Git fixtures.
 * Docker fault injection is opt-in: SEAF_BACKEND_E2E=1 node --test ...
 * Containers/images created by this suite carry unique QA names; main SEAF
 * and registered production projects are never changed or stopped.
 */
import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import { zipSync, unzipSync, strToU8 } from "fflate";
import { Engine } from "../../engine.mjs";
import { Workbench, graph, semanticDiff } from "../domain.mjs";
import { createWorkbenchServer } from "../server.mjs";

const service = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const evidenceRoot = path.join(service, "state", "acceptance");
const runRoot = path.join(evidenceRoot, "backend-gates-" + randomUUID());
await fs.mkdir(runRoot, { recursive: true });
const image = process.env.SEAF_E2E_IMAGE || "seaf-local:2026.33.0-workbench";
const receipt = {
  suite: "backend-gates",
  started: new Date().toISOString(),
  runRoot,
  productionWrites: false,
  cases: [],
};
const writeReceipt = () =>
  fs.writeFile(
    path.join(evidenceRoot, "backend-gates.json"),
    JSON.stringify(receipt, null, 2),
  );
async function observed(t, acs, fn) {
  const entry = {
    name: t.name,
    acs,
    started: new Date().toISOString(),
    status: "running",
  };
  receipt.cases.push(entry);
  await writeReceipt();
  const start = Date.now();
  try {
    entry.result = await fn();
    entry.status = "passed";
  } catch (error) {
    entry.status = "failed";
    entry.error = error.message;
    throw error;
  } finally {
    entry.durationMs = Date.now() - start;
    receipt.completed = new Date().toISOString();
    receipt.passed = receipt.cases.filter((c) => c.status === "passed").length;
    receipt.failed = receipt.cases.filter((c) => c.status === "failed").length;
    await writeReceipt();
  }
}
async function fixture(
  t,
  {
    validation = true,
    portal,
    editorUrl,
    previewTimeoutMs,
    diagnosticTimeoutMs,
  } = {},
) {
  const dir = path.join(runRoot, randomUUID()),
    workspace = path.join(dir, "workspace"),
    root = path.join(workspace, "acme");
  await fs.mkdir(path.join(root, "docs"), { recursive: true });
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "imports:\n  - objects.yaml\n",
  );
  await fs.writeFile(
    path.join(root, "objects.yaml"),
    "components:\n  acme:\n    title: Acme Labs\n    entity: component\n    owner: Architecture\n  acme.api:\n    title: API Service\n    entity: component\n    kind: microservice\n    owner: Commerce\n    links:\n      - id: acme.store\n        title: SQL\n  acme.store:\n    title: Store\n    entity: database\n    owner: Commerce\ncontexts:\n  acme.system:\n    title: Acme system\n    components: [acme, acme.*]\nscenarios:\n  acme.checkout:\n    title: Checkout\n    steps: [reserve, charge, deliver]\ndocs:\n  acme.overview:\n    title: Acme overview\n    type: markdown\n    source: docs/overview.md\n",
  );
  await fs.writeFile(
    path.join(root, "docs", "overview.md"),
    "# Acme\nArchitecture sources are copied verbatim.\n",
  );
  await fs.writeFile(
    path.join(root, ".env"),
    "TOKEN=ENV_FILE_SHOULD_NOT_BE_EXPORTED\n",
  );
  await fs.writeFile(
    path.join(workspace, "root.yaml"),
    "imports:\n  - acme/root.yaml\n",
  );
  const configFile = path.join(dir, "projects.json"),
    referenceRoot = path.join(dir, "reference"),
    config = {
      projects: [
        {
          id: "acme-labs",
          title: "Acme Labs",
          root,
          manifest: "root.yaml",
          writable: true,
          portal,
          reloadSecretEnv: "SEAF_BACKEND_QA_SECRET",
          token: "CONFIG_TOKEN_SHOULD_NOT_BE_EXPORTED",
          validation: validation
            ? { workspace, manifest: "workspace/root.yaml", image }
            : undefined,
        },
        {
          id: "reference-labs",
          title: "Acme reference",
          root: referenceRoot,
          manifest: "root.yaml",
          writable: false,
        },
      ],
    };
  await fs.writeFile(configFile, JSON.stringify(config));
  const engine = new Engine(configFile, path.join(dir, "proposals")),
    p = await engine.project("acme-labs");
  await engine.git(p, ["init", "-b", "main"]);
  await engine.git(p, ["add", "."]);
  await engine.git(p, [
    "-c",
    "user.name=SEAF QA",
    "-c",
    "user.email=qa@localhost",
    "commit",
    "-m",
    "Private baseline",
  ]);
  await fs.cp(root, referenceRoot, { recursive: true });
  const wb = await new Workbench(engine, {
    state: path.join(dir, "workbench"),
    specRoot: null,
    ...(editorUrl ? { editorUrl } : {}),
    ...(previewTimeoutMs ? { previewTimeoutMs } : {}),
    ...(diagnosticTimeoutMs ? { diagnosticTimeoutMs } : {}),
  }).init();
  t.after(() => {
    for (const entry of wb.previews.values()) clearTimeout(entry.timer);
  });
  const saveConfig = () => fs.writeFile(configFile, JSON.stringify(config));
  return {
    dir,
    root,
    referenceRoot,
    workspace,
    config,
    configFile,
    saveConfig,
    engine,
    wb,
    p,
  };
}
async function localServer(t, handler) {
  const server = http.createServer(handler);
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(
    () =>
      new Promise((resolve) => {
        server.closeAllConnections();
        server.close(resolve);
      }),
  );
  return { server, url: "http://127.0.0.1:" + server.address().port };
}
function fakeDocker(engine, { missingImage = false, error } = {}) {
  engine.docker = async (args) => {
    if (error) throw Error(error);
    if (args[0] === "info") return { stdout: "linux\n" };
    if (args[0] === "image" && args[1] === "inspect") {
      if (missingImage) throw Error("No such image: qa-missing-runtime");
      return {
        stdout: args.includes("--format")
          ? "sha256:" + "a".repeat(64) + "\n"
          : JSON.stringify([
              { Id: "sha256:" + "a".repeat(64), RepoDigests: [] },
            ]),
      };
    }
    throw Error("Unexpected fake Docker operation: " + args[0]);
  };
}
async function jsonPost(url, csrf, args, headers = {}) {
  const r = await fetch(url + "/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SEAF-CSRF": csrf,
      ...headers,
    },
    body: JSON.stringify(args),
  });
  return { status: r.status, body: await r.json() };
}

test("AC-INT-03: readonly, traversal, Windows paths, symlinks and malformed API writes preserve sources", async (t) =>
  observed(t, ["AC-INT-03", "2.2"], async () => {
    const f = await fixture(t),
      before = await f.engine.fingerprint(f.root),
      head = await f.wb.head(f.p);
    fakeDocker(f.engine);
    for (const file of [
      "../root.yaml",
      "C:/Windows/win.ini",
      "objects.yaml:stream",
      ".env",
      "folder/../../private.md",
      "foo\\bar.yaml",
    ])
      await assert.rejects(f.engine.read("acme-labs", file));
    const outside = path.join(f.dir, "outside");
    await fs.mkdir(outside);
    await fs.writeFile(
      path.join(outside, "private.md"),
      "Do not read through a junction",
    );
    const junction = path.join(f.root, "escape");
    await fs.symlink(outside, junction, "junction");
    try {
      await assert.rejects(
        f.engine.read("acme-labs", "escape/private.md"),
        /Symlinks/,
      );
    } finally {
      assert.ok(
        path.resolve(junction).startsWith(path.resolve(f.root) + path.sep),
      );
      await fs.unlink(junction);
    }
    await assert.rejects(
      f.engine.propose(
        "reference-labs",
        [{ path: "objects.yaml", content: "components: {}" }],
        "Must fail",
      ),
      /Read-only/,
    );
    const { server } = await createWorkbenchServer({
      port: 0,
      engine: f.engine,
      state: path.join(f.dir, "api"),
      specRoot: null,
    });
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const url = "http://127.0.0.1:" + server.address().port,
      session = await fetch(url + "/api/session").then((r) => r.json());
    const denied = await jsonPost(url, session.csrf, {
      action: "object_propose",
      project: "reference-labs",
      draft: false,
      operations: [
        {
          section: "components",
          id: "acme.api",
          mode: "merge",
          value: { owner: "Unauthorized" },
        },
      ],
    });
    assert.equal(denied.body.ok, false);
    assert.match(denied.body.error, /Read-only/);
    for (const body of [
      { action: "object_propose", project: "acme-labs", operations: [] },
      {
        action: "object_propose",
        project: "acme-labs",
        operations: [
          {
            section: "__proto__",
            id: "polluted",
            mode: "create",
            value: { x: 1 },
          },
        ],
      },
      {
        action: "draft_save",
        project: "acme-labs",
        draft: {
          title: "Bad traversal",
          changes: [{ path: "../outside/private.md", content: "wrong" }],
        },
      },
    ]) {
      const r = await jsonPost(url, session.csrf, body);
      assert.equal(r.body.ok, false);
    }
    const origin = await jsonPost(
      url,
      session.csrf,
      { action: "model", project: "acme-labs" },
      { Origin: "https://untrusted.example" },
    );
    assert.equal(origin.status, 403);
    await assert.rejects(f.engine.retryReload("reference-labs"), /Read-only/);
    const saved = await f.engine.propose(
      "acme-labs",
      [{ path: "docs/overview.md", content: "# Still private" }],
      "Permission changed",
    );
    f.config.projects[0].writable = false;
    await f.saveConfig();
    await assert.rejects(f.engine.apply(saved.proposalId), /Read-only/);
    assert.equal(await f.engine.fingerprint(f.root), before);
    assert.equal(await f.wb.head(f.p), head);
    assert.equal(await f.engine.git(f.p, ["status", "--porcelain"]), "");
    return {
      head,
      sourcesUnchanged: true,
      readonlyDenied: true,
      symlinkDenied: true,
      malformedRequestsDenied: true,
    };
  }));

test("AC-02-03/05: independent outage checks recover, expose safe metadata and omit credentials", async (t) =>
  observed(t, ["AC-02-01", "AC-02-03", "AC-02-05", "2.2"], async () => {
    let unavailable = true;
    const portal = await localServer(t, (req, res) => {
      res.setHeader("Content-Type", "application/json");
      if (req.url.startsWith("/core/storage/problems/")) {
        res.statusCode = unavailable ? 503 : 200;
        res.end(unavailable ? "{}" : "[]");
      } else res.end("{}");
    });
    const f = await fixture(t, { portal: portal.url, editorUrl: portal.url });
    fakeDocker(f.engine);
    const before = await f.engine.fingerprint(f.root),
      failed = await f.wb.diagnostics("acme-labs");
    assert.equal(failed.ready, false);
    assert.equal(
      failed.checks.find((c) => c.name === "Портал и валидаторы").status,
      "error",
    );
    assert.equal(failed.checks.find((c) => c.name === "Git").status, "ok");
    assert.equal(
      failed.checks.find((c) => c.name === "Модель и импорты").status,
      "ok",
    );
    assert.equal(failed.project.validation.image, image);
    assert.equal(failed.project.writable, true);
    unavailable = false;
    const recovered = await f.wb.diagnostics("acme-labs");
    assert.equal(recovered.ready, true);
    const previous = process.env.SEAF_BACKEND_QA_SECRET;
    process.env.SEAF_BACKEND_QA_SECRET = "ENV_CREDENTIAL_SENTINEL";
    t.after(() => {
      if (previous === undefined) delete process.env.SEAF_BACKEND_QA_SECRET;
      else process.env.SEAF_BACKEND_QA_SECRET = previous;
    });
    f.config.projects[0].portal =
      portal.url.replace(
        "http://",
        "http://qa-user:PORTAL_PASSWORD_SENTINEL@",
      ) + "/?token=QUERY_TOKEN_SENTINEL";
    await f.saveConfig();
    fakeDocker(f.engine, {
      error:
        "daemon failed ENV_CREDENTIAL_SENTINEL PORTAL_PASSWORD_SENTINEL QUERY_TOKEN_SENTINEL",
    });
    const redacted = await f.wb.diagnostics("acme-labs");
    const { server } = await createWorkbenchServer({
      port: 0,
      engine: f.engine,
      state: path.join(f.dir, "safe-api"),
      specRoot: null,
    });
    t.after(() => new Promise((resolve) => server.close(resolve)));
    const session = await fetch(
      "http://127.0.0.1:" + server.address().port + "/api/session",
    ).then((r) => r.json());
    const text = JSON.stringify({ redacted, session });
    for (const secret of [
      "ENV_CREDENTIAL_SENTINEL",
      "PORTAL_PASSWORD_SENTINEL",
      "QUERY_TOKEN_SENTINEL",
      "CONFIG_TOKEN_SHOULD_NOT_BE_EXPORTED",
    ])
      assert.equal(text.includes(secret), false);
    assert.ok(text.includes("[redacted]"));
    assert.equal(await f.engine.fingerprint(f.root), before);
    return {
      outage: failed.checks,
      recovered: recovered.ready,
      project: recovered.project,
      credentialValuesExcluded: true,
    };
  }));

test("AC-02-04/06: missing validation is explicit and unresponsive HTTP checks time out and retry", async (t) =>
  observed(t, ["AC-02-04", "AC-02-06", "AC-02-05"], async () => {
    let stalled = true;
    const portal = await localServer(t, (req, res) => {
      if (stalled && req.url.startsWith("/core/storage/problems/")) return;
      res.setHeader("Content-Type", "application/json");
      res.end(req.url.startsWith("/core/storage/problems/") ? "[]" : "{}");
    });
    const f = await fixture(t, {
      validation: false,
      portal: portal.url,
      editorUrl: portal.url,
      diagnosticTimeoutMs: 150,
    });
    fakeDocker(f.engine);
    let result = await f.wb.diagnostics("acme-labs");
    assert.equal(
      result.checks.find((c) => c.name === "Конфигурация валидации").status,
      "error",
    );
    assert.match(
      result.checks.find((c) => c.name === "Конфигурация валидации").detail,
      /missing/,
    );
    f.config.projects[0].validation = {
      workspace: f.workspace,
      manifest: "workspace/root.yaml",
      image,
    };
    await f.saveConfig();
    const start = Date.now();
    result = await f.wb.diagnostics("acme-labs");
    const elapsed = Date.now() - start;
    assert.ok(elapsed < 2000, "A 150ms network check must remain bounded");
    assert.match(
      result.checks.find((c) => c.name === "Портал и валидаторы").detail,
      /timeout|abort/i,
    );
    assert.equal(
      result.checks.find((c) => c.name === "Модель и импорты").status,
      "ok",
    );
    stalled = false;
    assert.equal((await f.wb.diagnostics("acme-labs")).ready, true);
    fakeDocker(f.engine, { missingImage: true });
    const missing = await f.wb.diagnostics("acme-labs");
    assert.equal(
      missing.checks.find((c) => c.name === "Образ SEAF").status,
      "error",
    );
    assert.match(
      missing.checks.find((c) => c.name === "Образ SEAF").fix,
      /projects.json/,
    );
    return {
      timeoutConfiguredMs: 150,
      elapsedMs: elapsed,
      missingConfigurationReported: true,
      missingImageReported: true,
      retryPassed: true,
    };
  }));

test("AC-02-02: reference sources stay readable with dirty Git and explicitly prohibit writes", async (t) =>
  observed(t, ["AC-02-02", "AC-06-06"], async () => {
    const editor = await localServer(t, (_req, res) => res.end("local editor"));
    const f = await fixture(t, { editorUrl: editor.url });
    fakeDocker(f.engine);
    await fs.appendFile(
      path.join(f.referenceRoot, "docs", "overview.md"),
      "\nUncommitted reference note.",
    );
    const read = await f.engine.read("reference-labs", "docs/overview.md");
    assert.match(read.content, /reference note/);
    const model = await f.wb.model("reference-labs");
    assert.ok(model.model.components["acme.api"]);
    const result = await f.wb.diagnostics("reference-labs");
    assert.equal(result.project.writable, false);
    assert.equal(result.checks.find((c) => c.name === "Git").status, "ok");
    assert.equal(
      result.checks.find((c) => c.name === "Запись проекта").status,
      "info",
    );
    assert.match(
      result.checks.find((c) => c.name === "Запись проекта").detail,
      /только чтение/,
    );
    await assert.rejects(
      f.engine.propose(
        "reference-labs",
        [{ path: "docs/overview.md", content: "# Not allowed" }],
        "Forbidden",
      ),
      /Read-only/,
    );
    return {
      readable: true,
      writeCapability: result.project.writable,
      readOnlyInfo: result.checks.find((c) => c.name === "Запись проекта"),
    };
  }));

test("AC-07: new linked entity, ordered scenario change and rename have provenance plus real file diff", async (t) =>
  observed(t, ["AC-07-01", "AC-07-04", "AC-07-05", "AC-07-06"], async () => {
    const f = await fixture(t),
      before = await f.wb.model("acme-labs");
    const draft = await f.wb.objectPropose("acme-labs", {
      operations: [
        {
          section: "components",
          id: "acme.audit",
          mode: "create",
          value: {
            title: "Audit Service",
            entity: "component",
            owner: "Audit Team",
            links: [{ id: "acme.api", title: "Audit events" }],
          },
        },
        {
          section: "scenarios",
          id: "acme.checkout",
          mode: "merge",
          value: { steps: ["charge", "reserve", "deliver"] },
        },
      ],
    });
    const diff = await f.wb.diff("acme-labs", { draftId: draft.id });
    const added = diff.changes.find((c) => c.id === "acme.audit");
    assert.equal(added.kind, "added");
    assert.equal(added.properties[0].after.links[0].id, "acme.api");
    assert.ok(added.sourcePaths.includes("architecture/workbench.yaml"));
    const steps = diff.changes
      .find((c) => c.section === "scenarios")
      .properties.find((p) => p.path === "steps");
    assert.deepEqual(steps.before, ["reserve", "charge", "deliver"]);
    assert.deepEqual(steps.after, ["charge", "reserve", "deliver"]);
    assert.match(diff.diff, /Audit Service/);
    assert.ok(diff.files.some((f) => f.path === "root.yaml"));
    assert.equal(diff.diff.includes("ENV_FILE_SHOULD_NOT_BE_EXPORTED"), false);
    const renamed = await f.wb.objectPropose("acme-labs", {
      operations: [
        {
          section: "components",
          id: "acme.api2",
          mode: "create",
          value: before.model.components["acme.api"],
        },
        { section: "components", id: "acme.api", mode: "delete" },
      ],
    });
    assert.equal(
      renamed.semanticDiff.changes.find((c) => c.id === "acme.api").kind,
      "removed",
    );
    assert.equal(
      renamed.semanticDiff.changes.find((c) => c.id === "acme.api2").kind,
      "added",
    );
    assert.equal((await f.wb.model("acme-labs")).head, before.head);
    assert.equal(
      (await f.wb.model("acme-labs")).fingerprint,
      before.fingerprint,
    );
    return {
      added,
      steps,
      rename: renamed.semanticDiff.changes,
      rawDiffAvailable: !!diff.diff,
      sourceFileCount: diff.files.length,
      liveUnchanged: true,
    };
  }));

test("AC-04: snapshots exclude process credentials, keep import hashes and reject missing files or broken ZIP", async (t) =>
  observed(t, ["AC-04-01", "AC-04-02", "AC-04-03", "AC-04-05"], async () => {
    const f = await fixture(t);
    fakeDocker(f.engine);
    const previous = process.env.SEAF_BACKEND_QA_SECRET;
    process.env.SEAF_BACKEND_QA_SECRET = "PROCESS_SECRET_NOT_A_BUILD_SETTING";
    t.after(() => {
      if (previous === undefined) delete process.env.SEAF_BACKEND_QA_SECRET;
      else process.env.SEAF_BACKEND_QA_SECRET = previous;
    });
    const first = await f.wb.snapshot("acme-labs", "First"),
      archiveFile = path.join(f.wb.state, "snapshots", first.id, "archive.zip"),
      bytes = await fs.readFile(archiveFile);
    const original = f.engine.files.bind(f.engine);
    f.engine.files = async (...args) => (await original(...args)).reverse();
    const second = await f.wb.snapshot("acme-labs", "Other title");
    assert.equal(first.id, second.id);
    assert.deepEqual(bytes, await fs.readFile(archiveFile));
    assert.equal(
      JSON.stringify(second.runtime).includes(
        process.env.SEAF_BACKEND_QA_SECRET,
      ),
      false,
    );
    assert.equal(
      second.files.some((f) => f.path.endsWith("/.env")),
      false,
    );
    assert.ok(
      second.files.some((f) => f.path === "workspace/acme/objects.yaml"),
    );
    assert.ok(second.files.every((f) => /^[a-f0-9]{64}$/.test(f.sha256)));
    const manifestFile = path.join(
        f.wb.state,
        "snapshots",
        first.id,
        "manifest.json",
      ),
      manifestBytes = await fs.readFile(manifestFile),
      changedIdentity = JSON.parse(manifestBytes);
    changedIdentity.id = "0".repeat(64);
    await fs.writeFile(manifestFile, JSON.stringify(changedIdentity));
    const identity = await f.wb.snapshotVerify("acme-labs", first.id);
    assert.equal(identity.ok, false);
    assert.ok(identity.failures.includes("manifest.json:id"));
    await fs.writeFile(manifestFile, manifestBytes);
    const imported = path.join(
        f.wb.state,
        "snapshots",
        first.id,
        "workspace",
        "acme",
        "objects.yaml",
      ),
      originalBytes = await fs.readFile(imported);
    await fs.unlink(imported);
    const missing = await f.wb.snapshotVerify("acme-labs", first.id);
    assert.equal(missing.ok, false);
    assert.ok(missing.failures.includes("workspace/acme/objects.yaml"));
    await fs.writeFile(imported, originalBytes);
    const archive = unzipSync(new Uint8Array(bytes));
    archive["manifest.json"] = strToU8("{broken JSON");
    await fs.writeFile(archiveFile, zipSync(archive));
    const broken = await f.wb.snapshotVerify("acme-labs", first.id);
    assert.equal(broken.ok, false);
    assert.ok(broken.failures.includes("archive.zip:manifest.json"));
    await fs.writeFile(archiveFile, Buffer.from("not a ZIP"));
    const invalid = await f.wb.snapshotVerify("acme-labs", first.id);
    assert.equal(invalid.ok, false);
    assert.ok(invalid.failures.some((f) => f.startsWith("archive.zip:")));
    return {
      snapshotId: first.id,
      deterministicDespiteEnumerationOrder: true,
      credentialsExcluded: true,
      missing: missing.failures,
      brokenManifest: broken.failures,
      invalidArchive: invalid.failures,
    };
  }));

test("AC-08-02: valid-shaped unknown Git ref fails without checkout, runtime or live changes", async (t) =>
  observed(t, ["AC-08-02"], async () => {
    const f = await fixture(t),
      before = await f.wb.model("acme-labs");
    let dockerCalls = 0;
    f.engine.docker = async () => {
      dockerCalls++;
      throw Error("Should not contact Docker for an invalid ref");
    };
    await assert.rejects(
      f.wb.preview("acme-labs", { ref: "feature/this-branch-does-not-exist" }),
      /rev-parse|unknown|ambiguous|Needed a single revision/i,
    );
    assert.equal(dockerCalls, 0);
    const after = await f.wb.model("acme-labs");
    assert.equal(after.head, before.head);
    assert.equal(after.fingerprint, before.fingerprint);
    assert.deepEqual(
      await fs.readdir(path.join(f.wb.state, "preview-records")),
      [],
    );
    assert.equal(await f.engine.git(f.p, ["status", "--porcelain"]), "");
    return {
      unknownRefRejected: true,
      dockerCalls,
      head: before.head,
      liveUnchanged: true,
    };
  }));

test(
  "AC-INT-06: real validation, saved Git commit, failed HTTP reload and journal-aware retry never duplicate commits",
  { skip: process.env.SEAF_BACKEND_E2E !== "1", timeout: 120000 },
  async (t) =>
    observed(t, ["AC-INT-06", "AC-03-08", "2.3"], async () => {
      let fail = true,
        reloads = 0,
        secretReceived = false;
      const portal = await localServer(t, (req, res) => {
        res.setHeader("Content-Type", "application/json");
        if (req.url.startsWith("/core/storage/reload")) {
          reloads++;
          secretReceived =
            new URL(req.url, "http://localhost").searchParams.get("secret") ===
            "RELOAD_CREDENTIAL_SENTINEL";
          res.statusCode = fail ? 503 : 200;
          res.end(
            fail
              ? '{"error":"RELOAD_CREDENTIAL_SENTINEL"}'
              : '{"message":"success"}',
          );
        } else res.end("[]");
      });
      const f = await fixture(t, { portal: portal.url }),
        before = await f.wb.head(f.p),
        previous = process.env.SEAF_BACKEND_QA_SECRET;
      process.env.SEAF_BACKEND_QA_SECRET = "RELOAD_CREDENTIAL_SENTINEL";
      t.after(() => {
        if (previous === undefined) delete process.env.SEAF_BACKEND_QA_SECRET;
        else process.env.SEAF_BACKEND_QA_SECRET = previous;
      });
      const proposal = await f.wb.objectPropose("acme-labs", {
        draft: false,
        title: "Retry reload after saved commit",
        operations: [
          {
            section: "components",
            id: "acme.api",
            mode: "merge",
            value: { owner: "Platform QA" },
          },
        ],
      });
      assert.match(proposal.diff, /Platform QA/);
      const validation = await f.engine.validate(proposal.proposalId);
      assert.equal(validation.ok, true, JSON.stringify(validation.problems));
      assert.ok(validation.rules > 0);
      const applied = await f.engine.apply(proposal.proposalId);
      assert.equal(applied.status, "committed_reload_failed");
      assert.match(applied.commit, /^[a-f0-9]{40}$/);
      assert.notEqual(applied.commit, before);
      assert.equal(applied.reload.status, "failed");
      assert.equal(
        JSON.stringify(applied).includes("RELOAD_CREDENTIAL_SENTINEL"),
        false,
      );
      assert.equal(
        (await f.engine.entity("acme-labs", "components", "acme.api")).value
          .owner,
        "Platform QA",
      );
      assert.equal(
        await f.engine.git(f.p, ["rev-list", "--count", "HEAD"]),
        "2",
      );
      const replay = await f.engine.apply(proposal.proposalId);
      assert.equal(replay.commit, applied.commit);
      assert.equal(reloads, 1);
      fail = false;
      const retried = await f.wb.action({
        action: "reload_project",
        project: "acme-labs",
        proposalId: proposal.proposalId,
      });
      assert.equal(retried.commit, applied.commit);
      assert.equal(retried.status, "applied");
      assert.equal(retried.reload.status, "updated");
      assert.deepEqual(retried.reload.problems, []);
      assert.equal(
        (await f.engine.proposal(proposal.proposalId)).status,
        "applied",
      );
      await f.wb.action({
        action: "reload_project",
        project: "acme-labs",
        proposalId: proposal.proposalId,
      });
      assert.equal(
        await f.engine.git(f.p, ["rev-list", "--count", "HEAD"]),
        "2",
      );
      assert.equal(await f.wb.head(f.p), applied.commit);
      await f.engine.clean(f.p);
      assert.equal(secretReceived, true);
      return {
        validationRules: validation.rules,
        commit: applied.commit,
        firstStatus: applied.status,
        retryStatus: retried.status,
        commitCount: 2,
        reloadRequests: reloads,
        secretReceivedWithoutEcho: true,
        reloadEndpoint: "private HTTP fault-injection fixture",
      };
    }),
);

test(
  "AC-08-04: a real container created before transport failure is removed; readiness timeout is bounded",
  { skip: process.env.SEAF_BACKEND_E2E !== "1", timeout: 120000 },
  async (t) =>
    observed(t, ["AC-08-04"], async () => {
      const f = await fixture(t, { previewTimeoutMs: 250 }),
        native = f.engine.docker.bind(f.engine),
        before = await f.wb.model("acme-labs");
      let startedName,
        runArgs,
        phase = "transport";
      f.engine.docker = async (args, options) => {
        if (args[0] === "run") {
          startedName = args[args.indexOf("--name") + 1];
          runArgs = [...args];
          if (phase === "transport") {
            await native(args, options);
            throw Error("Injected post-start Docker transport failure");
          }
          const altered = args.slice(0, -1);
          altered.push(
            "--entrypoint",
            "node",
            args.at(-1),
            "-e",
            "setInterval(()=>{},1000)",
          );
          return native(altered, options);
        }
        return native(args, options);
      };
      await assert.rejects(
        f.wb.preview("acme-labs", { ref: "HEAD" }),
        /Preview runtime-start failed: Injected/,
      );
      await assert.rejects(native(["inspect", startedName]));
      assert.ok(runArgs.includes("--pull") && runArgs.includes("never"));
      assert.equal(
        await fs.access(path.join(f.wb.state, "preview-start.lock")).then(
          () => true,
          () => false,
        ),
        false,
      );
      assert.deepEqual(
        await fs.readdir(path.join(f.wb.state, "preview-records")),
        [],
      );
      phase = "readiness";
      const start = Date.now();
      await assert.rejects(
        f.wb.preview("acme-labs", { ref: "HEAD" }),
        /Preview readiness failed:.*timeout/i,
      );
      const elapsed = Date.now() - start;
      await assert.rejects(native(["inspect", startedName]));
      assert.ok(
        elapsed < 10000,
        "Runtime creation plus 250ms health budget must not wait for 90 polls",
      );
      assert.equal((await f.wb.model("acme-labs")).head, before.head);
      assert.equal(
        (await f.wb.model("acme-labs")).fingerprint,
        before.fingerprint,
      );
      return {
        postStartFailureCleaned: true,
        readinessTimeoutMs: 250,
        totalMs: elapsed,
        records: await fs.readdir(path.join(f.wb.state, "preview-records")),
        liveUnchanged: true,
      };
    }),
);

test(
  "AC-04: deleted private snapshot image is reported and never replaced by the current configured image",
  { skip: process.env.SEAF_BACKEND_E2E !== "1", timeout: 120000 },
  async (t) =>
    observed(t, ["AC-04-04", "AC-04-05"], async () => {
      const f = await fixture(t),
        tag = "seaf-backend-qa:" + randomUUID(),
        context = path.join(f.dir, "image-context");
      await fs.mkdir(context);
      await fs.writeFile(
        path.join(context, "Dockerfile"),
        'FROM scratch\nLABEL seaf.qa.fixture="' + randomUUID() + '"\n',
      );
      const native = f.engine.docker.bind(f.engine);
      let tagged = false;
      try {
        await native([
          "build",
          "--network",
          "none",
          "--pull=false",
          "-t",
          tag,
          context,
        ]);
        tagged = true;
        f.config.projects[0].validation.image = tag;
        await f.saveConfig();
        const snapshot = await f.wb.snapshot(
          "acme-labs",
          "Unavailable saved runtime",
        );
        assert.equal(
          (await f.wb.snapshotVerify("acme-labs", snapshot.id)).ok,
          true,
        );
        await native(["rmi", tag]);
        tagged = false;
        f.config.projects[0].validation.image = image;
        await f.saveConfig();
        let runCalled = false;
        f.engine.docker = async (args, options) => {
          if (args[0] === "run") runCalled = true;
          return native(args, options);
        };
        await assert.rejects(
          f.wb.preview("acme-labs", { snapshotId: snapshot.id }),
          (error) =>
            error.message.includes(
              "Preview runtime image unavailable: " + snapshot.runtime.imageId,
            ),
        );
        assert.equal(runCalled, false);
        assert.deepEqual(
          await fs.readdir(path.join(f.wb.state, "preview-records")),
          [],
        );
        return {
          snapshot: snapshot.id,
          savedImage: snapshot.runtime.imageId,
          currentConfiguredImage: image,
          missingRuntimeReported: true,
          silentFallback: false,
        };
      } finally {
        if (tagged) await native(["rmi", tag]).catch(() => {});
      }
    }),
);
test("Prototype names never become invented link targets or inherited model entities", async (t) =>
  observed(t, ["AC-05-04", "2.2"], async () => {
    const f = await fixture(t);
    assert.equal(
      (await f.engine.entity("acme-labs", "components", "toString")).value,
      null,
    );
    assert.equal(
      (await f.engine.entity("acme-labs", "constructor", "name")).value,
      null,
    );
    const draft = await f.wb.objectPropose("acme-labs", {
      draft: false,
      operations: [
        {
          section: "components",
          id: "acme.api",
          mode: "merge",
          value: {
            links: [
              { id: "toString", title: "Invalid inherited target" },
              { id: "__proto__", title: "Invalid prototype target" },
            ],
          },
        },
      ],
    });
    let dockerCalls = 0;
    f.engine.docker = async () => {
      dockerCalls++;
      throw Error("Invalid links must be rejected before runtime");
    };
    const invalid = await f.engine.validate(draft.proposalId);
    assert.equal(invalid.ok, false);
    assert.equal(dockerCalls, 0);
    for (const id of ["toString", "__proto__"])
      assert.ok(
        invalid.problems[0].items.some(
          (item) => item.to === id && item.unresolved,
        ),
      );
    const view = graph(
      {
        components: {
          "acme.api": { links: [{ id: "toString" }, { id: "__proto__" }] },
        },
      },
      { focus: "acme.api", depth: 1 },
    );
    for (const id of ["toString", "__proto__"])
      assert.equal(view.nodes.find((node) => node.id === id).unresolved, true);
    const diff = semanticDiff(
      { components: {} },
      { components: { toString: { title: "Explicit own entity" } } },
    );
    assert.equal(diff.changes[0].kind, "added");
    return {
      invalidTargets: invalid.problems[0].items.map((item) => item.to),
      dockerCalls,
      unresolvedPlaceholders: view.nodes
        .filter((node) => node.unresolved)
        .map((node) => node.id),
      ownEntityAddition: diff.changes[0].kind,
    };
  }));
test(
  "AC-03-05/07: two linked creations share one real validation and deletion impact blocks inconsistent publication",
  { skip: process.env.SEAF_BACKEND_E2E !== "1", timeout: 120000 },
  async (t) =>
    observed(t, ["AC-03-05", "AC-03-07"], async () => {
      const f = await fixture(t),
        base = await f.wb.model("acme-labs");
      const draft = await f.wb.objectPropose("acme-labs", {
        title: "Two linked Acme objects",
        operations: [
          {
            section: "components",
            id: "acme.shipping",
            mode: "create",
            value: {
              title: "Shipping Service",
              entity: "component",
              owner: "Logistics",
              links: [{ id: "acme.shipments", title: "Shipments / SQL" }],
            },
          },
          {
            section: "components",
            id: "acme.shipments",
            mode: "create",
            value: {
              title: "Shipments DB",
              entity: "database",
              owner: "Logistics",
            },
          },
        ],
      });
      assert.equal(draft.semanticDiff.summary.added, 2);
      assert.equal((await f.wb.model("acme-labs")).head, base.head);
      assert.equal(
        (await f.wb.model("acme-labs")).fingerprint,
        base.fingerprint,
      );
      const proposal = await f.wb.proposeDraft("acme-labs", draft.id);
      assert.match(proposal.diff, /Shipping Service/);
      assert.match(proposal.diff, /Shipments DB/);
      assert.ok(proposal.changes.some((change) => change.path === "root.yaml"));
      const validation = await f.engine.validate(proposal.proposalId);
      assert.equal(validation.ok, true, JSON.stringify(validation.problems));
      assert.equal(validation.rules, 12);
      const applied = await f.engine.apply(proposal.proposalId);
      assert.match(applied.commit, /^[a-f0-9]{40}$/);
      assert.equal(
        await f.engine.git(f.p, ["rev-list", "--count", "HEAD"]),
        "2",
      );
      const stored = (await f.wb.model("acme-labs")).model;
      assert.equal(
        stored.components["acme.shipping"].links[0].id,
        "acme.shipments",
      );
      assert.ok(stored.components["acme.shipments"]);
      const removal = await f.wb.objectPropose("acme-labs", {
        title: "Invalid deletion of referenced database",
        operations: [
          { section: "components", id: "acme.shipments", mode: "delete" },
        ],
      });
      const impact = removal.impacts.find(
        (item) => item.id === "acme.shipments",
      );
      assert.ok(
        impact.references.some(
          (ref) =>
            ref.id === "acme.shipping" &&
            ref.file === "architecture/workbench.yaml",
        ),
      );
      const deletion = await f.wb.proposeDraft("acme-labs", removal.id),
        blocked = await f.engine.validate(deletion.proposalId);
      assert.equal(blocked.ok, false);
      assert.ok(
        blocked.problems[0].items.some(
          (item) =>
            item.from === "acme.shipping" && item.to === "acme.shipments",
        ),
      );
      await assert.rejects(
        f.engine.apply(deletion.proposalId),
        /Validate this proposal first/,
      );
      assert.equal(await f.wb.head(f.p), applied.commit);
      assert.ok(
        (await f.wb.model("acme-labs")).model.components["acme.shipments"],
      );
      await f.engine.clean(f.p);
      return {
        createProposal: proposal.proposalId,
        createdIds: ["acme.shipping", "acme.shipments"],
        oneValidationRules: validation.rules,
        oneCommit: applied.commit,
        impact,
        deleteValidation: blocked,
        partialPublication: false,
      };
    }),
);
