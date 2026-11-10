/** Read-only MCP packet for a manual external-agent inference review. */
import fs from "node:fs/promises";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const service = path.resolve("seaf-mcp"),
  acceptance = path.join(service, "state", "acceptance"),
  run = JSON.parse(
    await fs.readFile(path.join(acceptance, "ai-gates.json"), "utf8"),
  );
if (!path.resolve(run.fixture).startsWith(acceptance + path.sep))
  throw Error("Invalid fixture");
const client = new Client({
  name: "codex-external-agent-review",
  version: "1.0.0",
});
try {
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [path.join(service, "server.mjs")],
      env: {
        ...process.env,
        SEAF_PROJECTS_CONFIG: path.join(run.fixture, "projects.json"),
        SEAF_MCP_STATE: path.join(run.fixture, "proposals"),
      },
      stderr: "inherit",
    }),
  );
  const call = async (name, args) => {
    const result = await client.callTool({ name, arguments: args });
    if (result.isError) throw Error(result.content[0].text);
    return JSON.parse(result.content[0].text);
  };
  await call("list_projects", {});
  const context = await call("grounded_context", {
    project: "ai-fixture",
    question: "Каково назначение demo.shop.prediction Fraud Scoring Service?",
  });
  const title = context.claims.find(
      (c) => c.entityId === "demo.shop.prediction" && c.property === "title",
    ),
    source = title.sources[0],
    verify = await call("verify_evidence", {
      project: "ai-fixture",
      sources: [source],
    });
  if (!verify.ok) throw Error("Evidence stale");
  const packet = {
    question: context.question,
    entityId: "demo.shop.prediction",
    title: title.value,
    definition: context.entities.find((e) => e.id === "demo.shop.prediction")
      .value,
    source: verify.sources[0],
    contextInstructions: context.instructions,
    fixture: run.fixture,
  };
  await fs.writeFile(
    path.join(acceptance, "manual-agent-context.json"),
    JSON.stringify(packet, null, 2),
  );
  console.log(JSON.stringify(packet));
} finally {
  await client.close();
}
