import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import http from "node:http";
import { Engine } from "../../engine.mjs";
import {
  Workbench,
  semanticDiff,
  graph,
  mergeDiagramLinks,
} from "../domain.mjs";
import { inspectFlows } from "../trust.mjs";
import { createWorkbenchServer } from "../server.mjs";
import { zipSync, unzipSync, strToU8 } from "fflate";
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "seaf-workbench-")),
    root = path.join(dir, "workspace", "project");
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "imports:\n  - objects.yaml\n",
  );
  await fs.writeFile(
    path.join(root, "objects.yaml"),
    "# preserve this comment\ncomponents:\n  acme.orders:\n    title: Orders\n    owner: Commerce\n    entity: component\n    links:\n      - id: acme.delivery\n        title: REST\n  acme.delivery:\n    title: Delivery\n    owner: Logistics\n    entity: component\nsystems:\n  acme.erp:\n    title: ERP\n    owner: Operations\n    nested:\n      retained: true\n      removed: 1\n",
  );
  await fs.writeFile(
    path.join(dir, "workspace", "root.yaml"),
    "imports:\n - project/root.yaml\n",
  );
  const file = path.join(dir, "projects.json"),
    referenceRoot = path.join(dir, "reference");
  await fs.writeFile(
    file,
    JSON.stringify({
      projects: [
        {
          id: "acme",
          root,
          manifest: "root.yaml",
          writable: true,
          validation: {
            workspace: path.join(dir, "workspace"),
            manifest: "workspace/root.yaml",
            image: "test-image",
          },
        },
        {
          id: "reference",
          root: referenceRoot,
          manifest: "root.yaml",
          writable: false,
        },
      ],
    }),
  );
  const engine = new Engine(file, path.join(dir, "proposals")),
    p = await engine.project("acme");
  await engine.git(p, ["init", "-b", "main"]);
  await engine.git(p, ["add", "."]);
  await engine.git(p, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "Baseline",
  ]);
  // A reference is an independent source, not a contradictory read-only alias
  // of the same writable working tree.
  await fs.cp(root, referenceRoot, { recursive: true });
  const wb = await new Workbench(engine, {
    state: path.join(dir, "state"),
  }).init();
  t.after(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });
  return { dir, root, p, engine, wb };
}
test("generic CRUD, merge/remove/replace, atomic batch and automatic manifest registration", async (t) => {
  const { wb, engine, p } = await fixture(t);
  const before = await engine.fingerprint(p.root);
  const d = await wb.objectPropose("acme", {
    operations: [
      {
        section: "systems",
        id: "acme.erp",
        mode: "merge",
        value: { owner: "Platform" },
        removeProperties: ["nested.removed"],
      },
      {
        section: "customEntities",
        id: "acme.new",
        mode: "create",
        value: { title: "Custom", nested: { x: 1 } },
      },
    ],
  });
  assert.equal(d.model.systems["acme.erp"].nested.retained, true);
  assert.equal(d.model.systems["acme.erp"].nested.removed, undefined);
  assert.equal(d.model.systems["acme.erp"].owner, "Platform");
  assert.ok(
    d.changes
      .find((c) => c.path === "root.yaml")
      .content.includes("architecture/workbench.yaml"),
  );
  assert.match(
    d.changes.find((c) => c.path === "objects.yaml").content,
    /preserve this comment/,
  );
  assert.equal(await engine.fingerprint(p.root), before);
  const proposal = await wb.proposeDraft("acme", d.id);
  assert.match(proposal.diff, /Platform/);
  assert.equal(proposal.baseCommit, d.baseHead);
  await assert.rejects(
    wb.objectPropose("acme", {
      operations: [
        {
          section: "systems",
          id: "acme.erp",
          mode: "merge",
          value: { owner: "changed" },
        },
        { section: "systems", id: "missing", mode: "delete" },
      ],
    }),
    /does not exist/,
  );
  assert.equal(await engine.fingerprint(p.root), before);
  const replace = await wb.buildOperations("acme", [
    {
      section: "systems",
      id: "acme.erp",
      mode: "replace",
      value: { title: "ERP v2" },
    },
  ]);
  assert.deepEqual(replace.model.systems["acme.erp"], { title: "ERP v2" });
  await assert.rejects(
    wb.objectPropose("acme", {
      operations: [
        { section: "__proto__", id: "bad", mode: "create", value: {} },
      ],
    }),
    /Invalid/,
  );
});
test("drafts preserve base identity, reject stale fingerprint and cross-project interchange", async (t) => {
  const { wb, root } = await fixture(t);
  const d = await wb.objectPropose("acme", {
    operations: [
      {
        section: "systems",
        id: "acme.erp",
        mode: "merge",
        value: { owner: "Platform" },
      },
    ],
  });
  assert.equal(
    (await wb.getDraft("acme", d.id)).baseFingerprint,
    d.baseFingerprint,
  );
  await assert.rejects(wb.getDraft("reference", d.id), /another project/);
  await assert.rejects(
    wb.saveDraft("reference", { ...d, id: undefined }),
    /another project/,
  );
  await fs.appendFile(path.join(root, "objects.yaml"), "\n# user edit\n");
  await assert.rejects(wb.proposeDraft("acme", d.id), /Stale draft/);
  assert.equal((await wb.getDraft("acme", d.id)).operations.length, 1);
  await assert.rejects(wb.proposeDraft("reference", d.id), /another project/);
});
test("semantic diff ignores key and link ordering, retains meaningful removals and Git ref comparison", async (t) => {
  const { wb, engine, p } = await fixture(t);
  const a = {
      components: {
        one: {
          title: "One",
          links: [
            { id: "two", title: "B" },
            { id: "three", title: "C" },
          ],
        },
      },
    },
    b = {
      components: {
        one: {
          links: [
            { title: "C", id: "three" },
            { title: "B", id: "two" },
          ],
          title: "One",
        },
      },
    };
  assert.equal(semanticDiff(a, b).summary.total, 0);
  b.components.one.owner = "New";
  assert.equal(semanticDiff(a, b).changes[0].properties[0].path, "owner");
  const d = await wb.diff("acme", { baseRef: "HEAD", targetRef: "main" });
  assert.equal(d.summary.total, 0);
  assert.equal(await engine.git(p, ["status", "--porcelain"]), "");
  await assert.rejects(wb.gitModel("acme", "--output=x"), /Invalid/);
});
test("graph traversal, unresolved endpoints, bounds and explicit trust policies", () => {
  const model = {
    components: {
      one: {
        trustZone: "internal",
        links: [
          {
            id: "two",
            dataClassification: "confidential",
            protocol: "HTTP",
            encrypted: false,
          },
        ],
      },
      two: { trustZone: "partner", links: [{ id: "missing" }] },
      three: {},
    },
    trustPolicies: {
      tls: {
        classification: "confidential",
        requireEncryption: true,
        allowedProtocols: ["HTTPS"],
      },
    },
  };
  assert.deepEqual(
    new Set(
      graph(model, { focus: "two", depth: 1, direction: "incoming" }).nodes.map(
        (n) => n.id,
      ),
    ),
    new Set(["one", "two"]),
  );
  assert.equal(
    graph(model, { focus: "two", depth: 1 }).nodes.find(
      (n) => n.id === "missing",
    ).unresolved,
    true,
  );
  assert.equal(graph(model, { limit: 1 }).truncated, true);
  let flow = inspectFlows(model);
  assert.equal(flow.findings.length, 1);
  assert.equal(flow.flows[0].policyStatus, "violation");
  assert.equal(flow.flows[1].policyStatus, "unknown");
  model.components.one.links[0].encrypted = true;
  model.components.one.links[0].protocol = "HTTPS";
  flow = inspectFlows(model);
  assert.equal(flow.findings.length, 0);
  assert.equal(flow.flows[0].policyStatus, "allowed");
});
test("snapshot identity and archive are stable, source and ZIP tampering are detected", async (t) => {
  const { wb, engine } = await fixture(t);
  engine.docker = async () => ({
    stdout: JSON.stringify([
      { Id: "sha256:exact-runtime", RepoDigests: ["image@sha256:exact"] },
    ]),
  });
  const a = await wb.snapshot("acme", "First"),
    bytes = await fs.readFile(
      path.join(wb.state, "snapshots", a.id, "archive.zip"),
    );
  const b = await wb.snapshot("acme", "Second");
  assert.equal(a.id, b.id);
  assert.deepEqual(
    bytes,
    await fs.readFile(path.join(wb.state, "snapshots", b.id, "archive.zip")),
  );
  assert.equal((await wb.snapshotVerify("acme", a.id)).ok, true);
  await fs.appendFile(
    path.join(
      wb.state,
      "snapshots",
      a.id,
      "workspace",
      "project",
      "objects.yaml",
    ),
    "\n# tampered",
  );
  const verify = await wb.snapshotVerify("acme", a.id);
  assert.equal(verify.ok, false);
  assert.ok(verify.failures.includes("workspace/project/objects.yaml"));
  await assert.rejects(wb.snapshotVerify("reference", a.id), /another project/);
});
test("HTTP rejects missing CSRF, hostile Origin and Host and accepts Unicode JSON", async (t) => {
  const { engine, dir } = await fixture(t),
    { server } = await createWorkbenchServer({
      port: 0,
      engine,
      state: path.join(dir, "webstate"),
      specRoot: null,
    });
  t.after(() => new Promise((resolve) => server.close(resolve)));
  const url = "http://127.0.0.1:" + server.address().port,
    session = await fetch(url + "/api/session").then((r) => r.json()),
    body = JSON.stringify({
      action: "draft_save",
      project: "acme",
      draft: { title: "Заказы — доставка", operations: [] },
    });
  assert.equal(
    (
      await fetch(url + "/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
      })
    ).status,
    403,
  );
  assert.equal(
    (
      await fetch(url + "/api/action", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-SEAF-CSRF": session.csrf,
          Origin: "https://evil.example",
        },
        body,
      })
    ).status,
    403,
  );
  assert.equal(
    await new Promise((resolve) =>
      http.get(url + "/health", { headers: { Host: "evil.example" } }, (r) => {
        r.resume();
        resolve(r.statusCode);
      }),
    ),
    403,
  );
  const r = await fetch(url + "/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SEAF-CSRF": session.csrf,
    },
    body,
  }).then((r) => r.json());
  assert.equal(r.result.title, "Заказы — доставка");
  assert.equal(r.ok, true);
});
test("edits consolidate all imported definitions without duplicating links or resurrecting deletions", async (t) => {
  const { wb, engine, p, root } = await fixture(t);
  await fs.appendFile(path.join(root, "root.yaml"), "  - overrides.yaml\n");
  await fs.writeFile(
    path.join(root, "overrides.yaml"),
    "components:\n  acme.orders:\n    owner: Override Team\n",
  );
  await engine.git(p, ["add", "."]);
  await engine.git(p, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "Imported override",
  ]);
  const changed = await wb.buildOperations("acme", [
    {
      section: "components",
      id: "acme.orders",
      mode: "merge",
      value: { owner: "New owner" },
    },
  ]);
  assert.equal(changed.model.components["acme.orders"].links.length, 1);
  assert.equal(changed.model.components["acme.orders"].owner, "New owner");
  assert.equal(changed.changes.length, 2);
  assert.equal(changed.semanticDiff.changes.length, 1);
  const removed = await wb.buildOperations("acme", [
    { section: "components", id: "acme.orders", mode: "delete" },
  ]);
  assert.equal(removed.model.components["acme.orders"], undefined);
});
test("legacy draw.io merge retains flow policies and links outside a partial diagram", () => {
  const current = [
    {
      id: "orders",
      title: "Order details",
      protocol: "HTTPS",
      encrypted: true,
      dataClassification: "confidential",
    },
    { id: "database", title: "SQL" },
  ];
  const result = mergeDiagramLinks(current, [
    {
      id: "orders",
      title: "Order details",
      direction: "-->",
      drawio: { cellId: "edge1" },
    },
  ]);
  assert.equal(result.length, 2);
  assert.equal(result[0].encrypted, true);
  assert.equal(result[0].protocol, "HTTPS");
  assert.equal(result[0].dataClassification, "confidential");
  assert.equal(result[1].id, "database");
  assert.throws(
    () =>
      mergeDiagramLinks(
        [
          { id: "x", title: "same" },
          { id: "x", title: "same" },
        ],
        [{ id: "x", title: "same" }],
      ),
    /Ambiguous/,
  );
});
test("snapshot ZIP manifest and unexpected entries are verified; unsupported draft formats are rejected", async (t) => {
  const { wb, engine } = await fixture(t);
  engine.docker = async () => ({
    stdout: JSON.stringify([{ Id: "sha256:exact", RepoDigests: [] }]),
  });
  const snapshot = await wb.snapshot("acme", "ZIP integrity"),
    file = path.join(wb.state, "snapshots", snapshot.id, "archive.zip"),
    archive = unzipSync(new Uint8Array(await fs.readFile(file)));
  const basis = JSON.parse(Buffer.from(archive["manifest.json"]).toString());
  basis.head = "forged";
  archive["manifest.json"] = strToU8(JSON.stringify(basis));
  archive["unexpected.yaml"] = strToU8("injected: true");
  await fs.writeFile(file, zipSync(archive));
  const check = await wb.snapshotVerify("acme", snapshot.id);
  assert.equal(check.ok, false);
  assert.ok(check.failures.includes("archive.zip:manifest.json"));
  assert.ok(check.failures.includes("archive.zip:unexpected:unexpected.yaml"));
  await assert.rejects(
    wb.saveDraft("acme", { format: "unknown-v99", title: "test" }),
    /Unsupported/,
  );
});
test("graph citations point at the definition and exact link rather than an earlier target reference", async (t) => {
  const { wb } = await fixture(t),
    g = await wb.graph("acme", { focus: "acme.delivery", depth: 1 });
  const delivery = g.nodes.find((n) => n.id === "acme.delivery");
  assert.ok(delivery.sources[0].excerpt.includes("title: Delivery"));
  assert.ok(
    delivery.sources[0].line >
      g.nodes.find((n) => n.id === "acme.orders").sources[0].line,
  );
  const edge = g.edges.find((e) => e.to === "acme.delivery");
  assert.ok(edge.sources[0].excerpt.includes("id: acme.delivery"));
  assert.ok(edge.sources[0].excerpt.includes("title: REST"));
});
test("preview start is serialized and configured active limit refuses excess runtimes", async (t) => {
  const { wb } = await fixture(t);
  let finish;
  wb.startPreview = () => new Promise((resolve) => (finish = resolve));
  const first = wb.preview("acme", {});
  while (!finish) await new Promise((resolve) => setTimeout(resolve, 5));
  await assert.rejects(wb.preview("acme", {}), /Another preview/);
  finish({ url: "http://127.0.0.1:12345" });
  await first;
  for (let i = 0; i < 3; i++)
    await fs.writeFile(
      path.join(wb.state, "preview-records", "record" + i + ".json"),
      "{}",
    );
  await assert.rejects(wb.preview("acme", {}), /Preview limit reached/);
});
test("legacy draw.io merge does not replace an existing service kind, owner, description or unrelated links", async (t) => {
  const { wb } = await fixture(t);
  const xml =
    '<mxfile><diagram id="p"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="n" vertex="1" parent="1" seafId="acme.orders" value="Orders renamed"><mxGeometry x="10" y="10" width="100" height="60" as="geometry"/></mxCell></root></mxGraphModel></diagram></mxfile>';
  const draft = await wb.action({
      action: "drawio_import",
      project: "acme",
      xml,
      mode: "merge",
    }),
    orders = draft.model.components["acme.orders"];
  assert.equal(orders.owner, "Commerce");
  assert.equal(orders.title, "Orders renamed");
  assert.equal(orders.links[0].id, "acme.delivery");
  assert.equal(orders.kind, undefined);
  assert.equal(orders.description, undefined);
});
