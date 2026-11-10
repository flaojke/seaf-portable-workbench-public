import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { Engine } from "../engine.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const here = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), "seaf-bridge-")),
    root = path.resolve(here, "../examples/shopflow");
  const config = path.join(dir, "projects.json"),
    engine = new Engine(config, path.join(dir, "state"));
  await fs.writeFile(
    config,
    JSON.stringify({
      projects: [
        {
          id: "shopflow",
          root,
          manifest: "root.yaml",
          source: { kind: "directory" },
          writable: false,
        },
      ],
    }),
  );
  const sourceFingerprint = await engine.fingerprint(root);
  t.after(async () => {
    assert.equal(
      await engine.fingerprint(root),
      sourceFingerprint,
      "Shipped example must remain unchanged",
    );
    const relative = path.relative(os.tmpdir(), dir);
    assert.ok(
      relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    );
    assert.match(path.basename(dir), /^seaf-bridge-/);
    await fs.rm(dir, { recursive: true, force: true });
  });
  return { dir, root, config, engine };
}
test("artifact boundaries, provenance and real component dependencies", async (t) => {
  const { engine } = await fixture(t);
  for (const f of [
    "../root.yaml",
    ".git/config",
    "C:/temp/x.md",
    "foo/../../x.yaml",
  ])
    await assert.rejects(engine.read("shopflow", f));
  assert.equal(
    (await engine.entity("shopflow", "components", "demo.shop.orders")).file,
    "architecture/components.yaml",
  );
  assert.ok(
    (await engine.dependencies("shopflow", "demo.shop.orders")).outgoing.some(
      (x) => x.id === "demo.shop.payments",
    ),
  );
  assert.ok((await engine.search("shopflow", "OrderConfirmed")).results.length);
});
test("real MCP initialization, discovery, read, query and error contract", async (t) => {
  const { dir, config } = await fixture(t);
  const client = new Client({ name: "seaf-test", version: "1.0.0" });
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [path.join(here, "server.mjs")],
    env: {
      ...process.env,
      SEAF_PROJECTS_CONFIG: config,
      SEAF_MCP_STATE: path.join(dir, "mcp-state"),
    },
    stderr: "pipe",
  });
  try {
    await client.connect(transport);
    assert.ok((await client.listTools()).tools.length >= 12);
    const answer = await client.callTool({
      name: "get_entity",
      arguments: {
        project: "shopflow",
        section: "components",
        id: "demo.shop.orders",
      },
    });
    assert.equal(
      JSON.parse(answer.content[0].text).value.title,
      "Order Service",
    );
    const count = await client.callTool({
      name: "query_model",
      arguments: {
        project: "shopflow",
        query: '$count(components.*[kind="microservice"])',
      },
    });
    assert.equal(JSON.parse(count.content[0].text), 7);
    const denied = await client.callTool({
      name: "read_artifact",
      arguments: { project: "shopflow", path: "../root.yaml" },
    });
    assert.equal(denied.isError, true);
  } finally {
    await client.close();
  }
});
test(
  "isolated SEAF: reject architectural violation, commit valid component, reject stale patch and replay safely",
  { skip: process.env.SEAF_E2E !== "1", timeout: 240000 },
  async (t) => {
    const { dir, engine } = await fixture(t),
      root = path.join(dir, "workspace", "shop");
    await fs.mkdir(root, { recursive: true });
    await engine.copyArtifacts((await engine.project("shopflow")).root, root);
    await fs.writeFile(
      path.join(dir, "workspace", "root.yaml"),
      "imports:\n  - shop/root.yaml\n",
    );
    const settings = {
      projects: [
        {
          id: "fixture",
          root,
          manifest: "root.yaml",
          writable: true,
          validation: {
            workspace: path.join(dir, "workspace"),
            manifest: "workspace/root.yaml",
            image:
              process.env.SEAF_E2E_IMAGE || "seaf-local:2026.33.0-workbench",
          },
        },
      ],
    };
    const file = path.join(dir, "projects.json");
    await fs.writeFile(file, JSON.stringify(settings));
    const e = new Engine(file, path.join(dir, "proposals")),
      p = await e.project("fixture");
    await e.git(p, ["init", "-b", "main"]);
    await e.git(p, ["add", "."]);
    await e.git(p, [
      "-c",
      "user.name=SEAF Test",
      "-c",
      "user.email=test@localhost",
      "commit",
      "-m",
      "baseline",
    ]);
    const component = {
      title: "Delivery Service",
      entity: "component",
      kind: "microservice",
      owner: "Logistics",
      description: "Dispatches paid orders",
      links: [
        { id: "demo.shop.orders", title: "Order details", direction: "-->" },
      ],
    };
    const invalid = await e.upsert(
      "fixture",
      "architecture/components.yaml",
      "components",
      "demo.shop.delivery",
      { ...component, owner: "" },
      "Invalid owner",
    );
    assert.equal((await e.validate(invalid.proposalId)).ok, false);
    await assert.rejects(e.apply(invalid.proposalId));
    const valid = await e.upsert(
      "fixture",
      "architecture/components.yaml",
      "components",
      "demo.shop.delivery",
      component,
      "Add delivery component",
    );
    assert.match(valid.diff, /\+.*Dispatches paid orders/);
    const stale = await e.upsert(
      "fixture",
      "architecture/components.yaml",
      "components",
      "demo.shop.other",
      component,
      "Stale",
    );
    assert.equal((await e.validate(valid.proposalId)).ok, true);
    const applied = await e.apply(valid.proposalId);
    assert.ok(applied.commit);
    assert.equal(
      (await e.entity("fixture", "components", "demo.shop.delivery")).value
        .owner,
      "Logistics",
    );
    assert.equal(await e.git(p, ["status", "--porcelain"]), "");
    assert.equal((await e.apply(valid.proposalId)).commit, applied.commit);
    await assert.rejects(e.validate(stale.proposalId), /Stale/);
  },
);
