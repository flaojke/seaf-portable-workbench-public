import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import http from "node:http";
import { fileURLToPath } from "node:url";
import YAML from "yaml";
import { unzipSync, strFromU8 } from "fflate";
import { Engine } from "../../engine.mjs";
import { Workbench } from "../domain.mjs";
import { editorSchema } from "../editor-fields.mjs";

// Runtime behavior is deliberately a fixture here; native Windows process/portal
// acceptance is separate. These tests exercise the real providers and Workbench.
async function fixture(t, { formsArray = false, writable = true } = {}) {
  const testRoot = fileURLToPath(
    new URL("../../state/test-portable-domain/", import.meta.url),
  );
  await fs.mkdir(testRoot, { recursive: true });
  const base = await fs.mkdtemp(path.join(testRoot, "fixture-")),
    root = path.join(base, "Архитектура магазина");
  await fs.mkdir(root);
  const forms = [
    {
      section: "components",
      fields: {
        technology: { title: "Технология", options: ["Node.js", "Java"] },
      },
    },
    {
      section: "systems",
      fields: { erpOnly: { title: "ERP only", enum: ["SAP", "1C"] } },
    },
    {
      entity: ["component", "database"],
      fields: { owner: { title: "Команда-владелец" } },
    },
  ];
  const model = {
    components: {
      "acme.orders": {
        title: "Orders",
        owner: "Commerce",
        entity: "component",
        trustZone: "internal",
        dataClassification: "confidential",
        links: [
          {
            id: "acme.delivery",
            title: "Schedule shipment",
            protocol: "HTTPS",
            encrypted: true,
            dataClassification: "internal",
          },
        ],
      },
      "acme.delivery": {
        title: "Delivery",
        owner: "Logistics",
        entity: "component",
        trustZone: "internal",
      },
    },
    systems: { "acme.erp": { title: "ERP", owner: "Operations" } },
    teams: {
      commerce: { title: "Commerce team" },
      logistics: { title: "Logistics team" },
    },
    dictionaries: {
      classification: {
        values: {
          internal: { title: "Внутренние" },
          confidential: { title: "Конфиденциальные" },
        },
      },
    },
    entities: {
      components: {
        title: "Компоненты",
        schema: {
          type: "object",
          patternProperties: {
            ".*": {
              type: "object",
              required: ["title", "owner"],
              properties: {
                title: { type: "string" },
                owner: { type: "string", $ref: "#/$rels/teams" },
                kind: { type: "string", enum: ["service", "database"] },
                dataClassification: {
                  type: "string",
                  dictionary: "classification",
                },
                protocols: {
                  type: "array",
                  items: { type: "string", enum: ["HTTP", "AMQP"] },
                },
                links: { type: "array", items: { type: "object" } },
                custom: { type: "object" },
              },
            },
          },
        },
      },
      systems: {
        title: "Системы",
        schema: {
          type: "object",
          additionalProperties: {
            type: "object",
            properties: { title: { type: "string" } },
          },
        },
      },
    },
    forms: formsArray
      ? forms
      : Object.fromEntries(forms.map((form, index) => ["form" + index, form])),
    docs: {
      "acme.overview": {
        title: "Overview",
        type: "markdown",
        source: "overview.md",
      },
    },
  };
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "imports:\n  - model.yaml\n",
  );
  await fs.writeFile(path.join(root, "model.yaml"), YAML.stringify(model));
  await fs.writeFile(
    path.join(root, "overview.md"),
    "# Acme\nOrders schedules Delivery through HTTPS.\n",
  );
  await fs.writeFile(
    path.join(root, ".env"),
    "PRIVATE_TEST_CREDENTIAL=not-for-export\n",
  );
  const engine = new Engine(
    path.join(base, "data/projects.json"),
    path.join(base, "data/state"),
  );
  engine.git = async () => {
    throw Error("Git is intentionally absent from this directory fixture");
  };
  engine.docker = async () => {
    throw Error("Docker must not be used by a native project");
  };
  const p = await engine.connectProject({
    root,
    id: "acme",
    kind: "directory",
    writable,
  });
  const runtime = {
    identityValue: {
      kind: "native",
      id: "runtime-A",
      files: [{ name: "node", sha256: "a".repeat(64) }],
    },
    active: new Map(),
    starts: [],
    stops: [],
    validations: [],
    async identity() {
      return structuredClone(this.identityValue);
    },
    async validate(options) {
      this.validations.push(options);
      return { ok: true, rules: 1, problems: [] };
    },
    async start(options) {
      return this.startPreview(options);
    },
    async stop(id) {
      return this.stopPreview(id);
    },
    async startPreview(options) {
      const started = {
        id: crypto.randomUUID(),
        url: "http://127.0.0.1:45678",
        pid: 123,
      };
      this.starts.push(options);
      this.active.set(started.id, started);
      return started;
    },
    async stopPreview(id) {
      this.stops.push(id);
      this.active.delete(id);
      return { stopped: true, id };
    },
  };
  engine.runtime = async () => runtime;
  const wb = await new Workbench(engine, { specRoot: null }).init();
  t.after(async () => {
    for (const preview of wb.previews.values()) clearTimeout(preview.timer);
    const relative = path.relative(testRoot, base);
    assert.ok(
      relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    );
    await fs.rm(base, { recursive: true, force: true });
  });
  return { base, root, engine, p, wb, runtime, model };
}
const ownerOperation = (owner) => [
  { section: "components", id: "acme.orders", mode: "merge", value: { owner } },
];

test("directory Workbench uses 64-character revisions and portable JSON drafts through validated local save", async (t) => {
  const { wb, engine, p } = await fixture(t);
  const before = await wb.model(p.id);
  assert.match(before.head, /^[a-f0-9]{64}$/);
  assert.equal(before.revision.kind, "directory");
  const draft = await wb.objectPropose(p.id, {
    operations: ownerOperation("Logistics"),
    title: "Move owner",
  });
  const exchange = JSON.parse(JSON.stringify({ ...draft, id: undefined }));
  const imported = await wb.saveDraft(p.id, exchange);
  assert.equal(imported.baseHead, before.head);
  const semantic = await wb.diff(p.id, { draftId: imported.id });
  assert.ok(semantic.changes.some((item) => item.id === "acme.orders"));
  assert.match(semantic.diff, /owner: Logistics/);
  const proposal = await wb.proposeDraft(p.id, imported.id);
  assert.equal((await engine.validate(proposal.proposalId)).ok, true);
  const saved = await engine.apply(proposal.proposalId);
  assert.equal(saved.commit, null);
  assert.equal(saved.revision.kind, "directory");
  assert.equal(
    (await wb.model(p.id)).model.components["acme.orders"].owner,
    "Logistics",
  );
  await assert.rejects(wb.proposeDraft(p.id, draft.id), /Stale draft/);
  const revisions = await wb.action({
    action: "revisions_list",
    project: p.id,
  });
  assert.equal(revisions.length, 2);
  const compared = await wb.diff(p.id, {
    baseRef: before.head,
    targetRef: saved.revision.id,
  });
  assert.match(compared.diff, /owner: Logistics/);
  assert.ok(compared.changes.some((item) => item.id === "acme.orders"));
});

test("single component changes preserve flow protocol, encryption, classification and unrelated services", async (t) => {
  const { wb, engine, p, model } = await fixture(t);
  const draft = await wb.objectPropose(p.id, {
    operations: ownerOperation("Architecture"),
  });
  const proposed = await wb.proposeDraft(p.id, draft.id);
  await engine.validate(proposed.proposalId);
  await engine.apply(proposed.proposalId);
  const current = (await wb.model(p.id)).model;
  assert.deepEqual(
    current.components["acme.orders"].links,
    model.components["acme.orders"].links,
  );
  assert.equal(current.components["acme.orders"].trustZone, "internal");
  assert.deepEqual(
    current.components["acme.delivery"],
    model.components["acme.delivery"],
  );
});

test("directory evidence is fresh by revision and hash, has no invented Git commit, and turns stale after edits", async (t) => {
  const { wb, engine, p, root } = await fixture(t);
  let revisionReads = 0;
  const revision = engine.revision.bind(engine);
  engine.revision = async (...args) => {
    revisionReads++;
    return revision(...args);
  };
  const context = await wb.context(
    p.id,
    "Who owns acme.orders and how does it call Delivery?",
  );
  assert.ok(context.sources.length > 1);
  assert.ok(context.sources.every((source) => source.commit === null));
  assert.ok(
    context.sources.every((source) => source.revision.kind === "directory"),
  );
  assert.ok(
    revisionReads <= 3,
    "Revision reads must be cached per project, not repeated for every artifact",
  );
  const fresh = await wb.verifyEvidence(p.id, context.sources);
  assert.ok(fresh.sources.every((source) => source.fresh));
  assert.match(
    (await wb.answer(p.id, "Who owns acme.orders?")).answer,
    /local:[a-f0-9]{12}/,
  );
  const original = await fs.readFile(path.join(root, "overview.md"), "utf8");
  await fs.writeFile(
    path.join(root, "overview.md"),
    original + "External update\n",
  );
  const stale = await wb.verifyEvidence(p.id, context.sources);
  assert.ok(stale.sources.every((source) => !source.fresh));
  assert.ok(
    stale.sources.some((source) =>
      source.reasons.includes("local-revision-changed"),
    ),
  );
});

test("unregistered workspace imports keep file hashes and never borrow a directory revision", async (t) => {
  const { wb, engine, p, base, root } = await fixture(t);
  await fs.writeFile(
    path.join(base, "shared.yaml"),
    "components:\n  acme.shared:\n    title: Shared gateway\n    owner: Shared team\n",
  );
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "imports:\n  - ../shared.yaml\n  - model.yaml\n",
  );
  await engine.updateProject(p.id, {
    validation: {
      runtime: "native",
      workspace: base,
      manifest: "workspace/" + path.basename(root) + "/root.yaml",
    },
  });
  const context = await wb.context(p.id, "Who owns acme.shared?");
  const external = context.sources.filter(
    (source) => source.scope === "workspace",
  );
  assert.ok(external.length);
  assert.ok(
    external.every(
      (source) => source.commit === null && source.revision === null,
    ),
  );
  const verified = await wb.verifyEvidence(p.id, external);
  assert.ok(
    verified.sources.every(
      (source) => source.fresh === false && source.status === "unverifiable",
    ),
  );
});

for (const formsArray of [false, true])
  test(`schema editor uses ${formsArray ? "array" : "object"} forms, enums, dictionaries, relation choices and required fields`, async (t) => {
    const { engine, p } = await fixture(t, { formsArray });
    const schema = await editorSchema(engine, p.id, "components"),
      fields = Object.fromEntries(
        schema.fields.map((field) => [field.name, field]),
      );
    assert.deepEqual(
      fields.kind.options.map((option) => option.value),
      ["service", "database"],
    );
    assert.deepEqual(
      fields.owner.options.map((option) => option.value),
      ["commerce", "logistics"],
    );
    assert.equal(fields.owner.title, "Команда-владелец");
    assert.equal(fields.owner.required, true);
    assert.deepEqual(
      fields.dataClassification.options.map((option) => option.label),
      ["Внутренние", "Конфиденциальные"],
    );
    assert.equal(fields.protocols.array, true);
    assert.deepEqual(
      fields.protocols.options.map((option) => option.value),
      ["HTTP", "AMQP"],
    );
    assert.deepEqual(
      fields.technology.options.map((option) => option.value),
      ["Node.js", "Java"],
    );
    assert.equal(fields.custom.type, "object");
    assert.ok(
      !fields.erpOnly,
      "A Systems form must not leak fields into Components",
    );
    assert.ok(schema.sections.some((section) => section.id === "systems"));
    const systems = await editorSchema(engine, p.id, "systems");
    assert.ok(systems.fields.some((field) => field.name === "erpOnly"));
    assert.ok(!systems.fields.some((field) => field.name === "technology"));
  });

test("schema editor requests the exact parenthesized metamodel JSONata query from its portal", async (t) => {
  const { engine, p } = await fixture(t);
  let requests = 0;
  const server = http.createServer((request, response) => {
    requests++;
    assert.equal(
      decodeURIComponent(request.url),
      "/core/storage/jsonata/(entities)",
    );
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(
      JSON.stringify({
        flows: {
          title: "Flows",
          schema: {
            additionalProperties: {
              properties: {
                protocol: { type: "string", enum: ["HTTPS", "AMQP"] },
              },
            },
          },
        },
      }),
    );
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  t.after(() => new Promise((resolve) => server.close(resolve)));
  await engine.updateProject(p.id, {
    portal: "http://127.0.0.1:" + server.address().port,
  });
  const schema = await editorSchema(engine, p.id, "flows");
  assert.equal(requests, 1);
  assert.deepEqual(
    schema.fields
      .find((field) => field.name === "protocol")
      .options.map((option) => option.value),
    ["HTTPS", "AMQP"],
  );
});

test("export ZIP captures allowlisted architecture bytes without credentials or Git metadata", async (t) => {
  const { wb, p, root } = await fixture(t);
  const exported = await wb.exportProject(p.id),
    entries = unzipSync(Buffer.from(exported.base64, "base64"));
  assert.ok(
    entries["root.yaml"] && entries["model.yaml"] && entries["overview.md"],
  );
  assert.ok(
    !Object.keys(entries).some(
      (file) => file.startsWith(".git") || file.startsWith(".env"),
    ),
  );
  assert.deepEqual(
    Buffer.from(entries["model.yaml"]),
    await fs.readFile(path.join(root, "model.yaml")),
  );
  const manifest = JSON.parse(strFromU8(entries["seaf-export.json"]));
  assert.equal(manifest.format, "seaf-project-export-v1");
  assert.equal(manifest.source, "directory");
  assert.equal(manifest.files.length, exported.files);
  assert.ok(!JSON.stringify(manifest).includes("PRIVATE_TEST_CREDENTIAL"));
});

test("project lifecycle Workbench wrappers return actual projects and persist active selection", async (t) => {
  const { wb, engine, p, base } = await fixture(t);
  const copied = await wb.action({
    action: "project_clone_local",
    project: p.id,
    id: p.id,
    destination: path.join(base, "Independent copy"),
  });
  assert.ok(copied.id && copied.id !== p.id);
  assert.equal(copied.source.kind, "directory");
  assert.ok(
    !copied.project,
    "A transport wrapper must be unwrapped before returning a UI project",
  );
  await wb.action({ action: "project_select", project: copied.id });
  assert.equal(await engine.activeProject(), copied.id);
  const version = await wb.action({
    action: "project_version",
    project: copied.id,
    name: "Review 1",
  });
  assert.equal(version.name, "Review 1");
  const list = await wb.action({ action: "projects_list" });
  assert.equal(list.length, 2);
  await wb.action({ action: "project_disconnect", project: copied.id });
  assert.equal(await engine.activeProject(), null);
  assert.ok(
    (await fs.stat(path.join(base, "Independent copy/root.yaml"))).isFile(),
  );
});

test("read-only directory retains reading, schema and export while source publication is rejected", async (t) => {
  const { wb, engine, p } = await fixture(t, { writable: false });
  const before = await engine.fingerprint(p.root);
  assert.equal(
    (await wb.model(p.id)).model.components["acme.orders"].title,
    "Orders",
  );
  assert.ok(
    (await wb.action({ action: "editor_schema", project: p.id })).fields.length,
  );
  assert.ok((await wb.exportProject(p.id)).files > 0);
  await assert.rejects(
    wb.objectPropose(p.id, {
      operations: ownerOperation("Logistics"),
      draft: false,
    }),
    /Read-only/,
  );
  await assert.rejects(
    wb.action({ action: "project_delete", project: p.id, deleteFiles: true }),
    /Read-only/,
  );
  assert.equal(await engine.fingerprint(p.root), before);
});

test("native snapshots use exact runtime identity; preview keeps directory revision and rejects drift/tamper", async (t) => {
  const { wb, engine, p, runtime } = await fixture(t);
  const before = await engine.fingerprint(p.root),
    first = await wb.snapshot(p.id, "A"),
    second = await wb.snapshot(p.id, "B");
  assert.equal(first.id, second.id);
  assert.equal(first.runtime.kind, "native");
  assert.equal(first.revision.kind, "directory");
  assert.equal(first.runtime.identity.id, "runtime-A");
  assert.equal((await wb.snapshotVerify(p.id, first.id)).ok, true);
  const preview = await wb.preview(p.id, { snapshotId: first.id });
  assert.equal(preview.commit, null);
  assert.equal(preview.revision.id, first.revision.id);
  assert.equal(runtime.starts.length, 1);
  assert.notEqual(runtime.starts[0].workspace, p.root);
  await wb.stopPreview(p.id, preview.id);
  assert.equal(runtime.active.size, 0);
  assert.equal(wb.previews.size, 0);
  runtime.identityValue.id = "runtime-B";
  await assert.rejects(
    wb.preview(p.id, { snapshotId: first.id }),
    /identity unavailable or changed/,
  );
  assert.equal(runtime.starts.length, 1);
  await fs.appendFile(
    path.join(wb.state, "snapshots", first.id, "workspace", "model.yaml"),
    "# tampered\n",
  );
  assert.equal((await wb.snapshotVerify(p.id, first.id)).ok, false);
  await assert.rejects(wb.preview(p.id, { snapshotId: first.id }), /integrity/);
  assert.equal(await engine.fingerprint(p.root), before);
});

test("native preview cleanup removes timers and in-memory state when record persistence fails", async (t) => {
  const { wb, p, runtime } = await fixture(t);
  const start = runtime.startPreview.bind(runtime),
    records = path.join(wb.state, "preview-records");
  runtime.startPreview = async (options) => {
    const started = await start(options);
    await fs.rmdir(records);
    await fs.writeFile(records, "Cannot store a record inside a regular file");
    return started;
  };
  await assert.rejects(
    wb.preview(p.id, { ref: "HEAD" }),
    /Native preview failed/,
  );
  assert.equal(runtime.stops.length, 1);
  assert.equal(runtime.active.size, 0);
  assert.equal(wb.previews.size, 0);
  await fs.unlink(records);
  await fs.mkdir(records);
  runtime.startPreview = start;
  const recovered = await wb.preview(p.id, { ref: "HEAD" });
  await wb.stopPreview(p.id, recovered.id);
});

test("native preview expiry resumes after Workbench restart and stops only its own runtime", async (t) => {
  const { wb, engine, p, runtime } = await fixture(t);
  const preview = await wb.preview(p.id, { ref: "HEAD" });
  clearTimeout(wb.previews.get(preview.id).timer);
  wb.previews.clear();
  const file = path.join(wb.state, "preview-records", preview.id + ".json");
  await fs.writeFile(
    file,
    JSON.stringify({
      ...preview,
      expires: new Date(Date.now() - 1000).toISOString(),
    }),
  );
  const restored = await new Workbench(engine, {
    state: wb.state,
    specRoot: null,
  }).init();
  t.after(() => {
    for (const entry of restored.previews.values()) clearTimeout(entry.timer);
  });
  for (let i = 0; i < 20 && runtime.active.size; i++)
    await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(runtime.active.size, 0);
  assert.deepEqual(runtime.stops, [preview.id]);
  assert.equal(restored.previews.size, 0);
  await assert.rejects(fs.stat(file), { code: "ENOENT" });
});
