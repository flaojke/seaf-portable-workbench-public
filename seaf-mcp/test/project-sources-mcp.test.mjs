import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

test("real MCP SDK exposes source providers and manages only a private directory fixture", async (t) => {
  const testRoot = fileURLToPath(
    new URL("../state/test-project-sources/", import.meta.url),
  );
  await fs.mkdir(testRoot, { recursive: true });
  const base = await fs.mkdtemp(path.join(testRoot, "mcp-")),
    root = path.join(base, "Local project");
  await fs.mkdir(root);
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "components:\n  acme:\n    title: Acme\n",
  );
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [fileURLToPath(new URL("../server.mjs", import.meta.url))],
    env: {
      ...process.env,
      SEAF_PROJECTS_CONFIG: path.join(base, "projects.json"),
      SEAF_MCP_STATE: path.join(base, "state"),
    },
    stderr: "pipe",
  });
  const client = new Client({
    name: "project-source-acceptance",
    version: "1",
  });
  t.after(async () => {
    await client.close();
    const rel = path.relative(testRoot, base);
    assert.ok(rel && !rel.startsWith("..") && !path.isAbsolute(rel));
    await fs.rm(base, { recursive: true, force: true });
  });
  await client.connect(transport);
  const tools = (await client.listTools()).tools;
  for (const name of [
    "inspect_project",
    "connect_project",
    "clone_project",
    "get_project_revision",
    "list_revisions",
    "push_project",
    "disconnect_project",
    "delete_project",
    "copy_project",
    "create_project_version",
    "select_active_project",
    "update_project_connection",
  ])
    assert.ok(
      tools.some((tool) => tool.name === name),
      name,
    );
  assert.equal(
    tools.find((tool) => tool.name === "push_project").annotations
      .openWorldHint,
    true,
  );
  assert.equal(
    tools.find((tool) => tool.name === "delete_project").annotations
      .destructiveHint,
    true,
  );
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    assert.ok(!result.isError, result.content?.[0]?.text);
    return JSON.parse(result.content[0].text);
  };
  assert.deepEqual(await call("list_projects", {}), []);
  assert.equal((await call("inspect_project", { root })).kind, "directory");
  const project = await call("connect_project", { root, id: "sdk-local" });
  assert.equal(project.source.kind, "directory");
  assert.equal(
    (
      await call("update_project_connection", {
        project: project.id,
        title: "Updated title",
      })
    ).title,
    "Updated title",
  );
  assert.equal(
    (await call("get_project_revision", { project: project.id })).kind,
    "directory",
  );
  const version = await call("create_project_version", {
    project: project.id,
    name: "SDK version",
  });
  assert.equal(version.name, "SDK version");
  assert.equal(
    (await call("list_revisions", { project: project.id })).length,
    1,
  );
  await call("select_active_project", { project: project.id });
  const listed = await call("list_projects", {});
  assert.equal(listed[0].source.provider, "local");
  await call("disconnect_project", { project: project.id });
  assert.deepEqual(await call("list_projects", {}), []);
  assert.ok((await fs.stat(path.join(root, "root.yaml"))).isFile());
});
