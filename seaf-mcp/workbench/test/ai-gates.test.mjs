import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import YAML from "yaml";
import { Engine } from "../../engine.mjs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
const service = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  ),
  acceptance = path.join(service, "state", "acceptance");
const baseImage =
  process.env.SEAF_E2E_IMAGE || "seaf-local:2026.33.0-workbench";

test(
  "AI acceptance through MCP: checkout citations, explicit inference, ambiguous conflict and scoped resolution",
  { skip: process.env.SEAF_E2E !== "1", timeout: 240000 },
  async () => {
    const dir = path.join(acceptance, "ai-" + randomUUID()),
      workspace = path.join(dir, "workspace"),
      root = path.join(workspace, "microservices-demo");
    assert.ok(
      path.resolve(dir).startsWith(path.resolve(acceptance) + path.sep),
    );
    await fs.mkdir(dir, { recursive: true });
    const report = {
        started: new Date().toISOString(),
        status: "running",
        fixture: dir,
        steps: [],
        productionWrites: false,
      },
      reportFile = path.join(acceptance, "ai-gates.json");
    const bootstrap = new Engine(
        path.join(service, "projects.json"),
        path.join(dir, "bootstrap"),
      ),
      production = await bootstrap.project("shopflow"),
      productionHead = await bootstrap.git(production, ["rev-parse", "HEAD"]),
      fingerprint = await bootstrap.fingerprint(production.root);
    let engine, project, client, container;
    const step = async (ac, name, fn) => {
      const row = {
        ac,
        name,
        status: "running",
        started: new Date().toISOString(),
      };
      report.steps.push(row);
      try {
        row.result = await fn();
        row.status = "passed";
        console.log("AI passed: " + ac.join(", ") + " " + name);
      } catch (error) {
        row.status = "failed";
        row.error = error.message;
        throw error;
      } finally {
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
      }
    };
    async function call(name, args) {
      const result = await client.callTool(
        { name, arguments: args },
        undefined,
        { timeout: 120000 },
      );
      if (result.isError) throw Error(result.content[0].text);
      return JSON.parse(result.content[0].text);
    }
    try {
      await bootstrap.copyArtifacts(production.validation.workspace, workspace);
      const manifestFile = path.join(root, "root.yaml"),
        manifest = YAML.parseDocument(await fs.readFile(manifestFile, "utf8"));
      manifest.set("imports", [
        ...manifest.get("imports").toJSON(),
        "architecture/qa-conflict.yaml",
      ]);
      await fs.writeFile(manifestFile, manifest.toString());
      await fs.writeFile(
        path.join(root, "architecture", "qa-conflict.yaml"),
        YAML.stringify({
          components: {
            "demo.shop.orders": { owner: "Legacy QA Team" },
            "demo.shop.prediction": {
              title: "Fraud Scoring Service",
              entity: "component",
              owner: "Architecture Team",
            },
          },
        }),
      );
      await fs.writeFile(
        path.join(root, "docs", "qa-conflict.md"),
        "# QA ownership\n\n| Component | Owner |\n| --- | --- |\n| demo.shop.orders | Commerce или Logistics |\n",
      );
      const docsFile = path.join(root, "docs.yaml"),
        docs = YAML.parseDocument(await fs.readFile(docsFile, "utf8"));
      docs.setIn(["docs", "qa.conflict"], {
        title: "QA ownership",
        type: "markdown",
        source: "docs/qa-conflict.md",
      });
      await fs.writeFile(docsFile, docs.toString());
      const config = path.join(dir, "projects.json"),
        configData = {
          projects: [
            {
              id: "ai-fixture",
              title: "AI fixture",
              root,
              manifest: "root.yaml",
              writable: true,
              validation: {
                workspace,
                manifest: "workspace/root.yaml",
                image: baseImage,
              },
            },
          ],
        };
      await fs.writeFile(config, JSON.stringify(configData));
      engine = new Engine(config, path.join(dir, "proposals"));
      project = await engine.project("ai-fixture");
      await engine.git(project, ["init", "-b", "main"]);
      await engine.git(project, ["add", "."]);
      await engine.git(project, [
        "-c",
        "user.name=SEAF QA",
        "-c",
        "user.email=qa@localhost",
        "commit",
        "-m",
        "AI fixture baseline",
      ]);
      const beforeHead = await engine.git(project, ["rev-parse", "HEAD"]);
      container = "seaf-ai-acceptance-" + randomUUID();
      await engine.docker([
        "run",
        "-d",
        "--name",
        container,
        "-p",
        "127.0.0.1::8080",
        "-e",
        "VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS=n",
        "-e",
        "VUE_APP_DOCHUB_ROOT_MANIFEST=workspace/root.yaml",
        "-e",
        "VUE_APP_DOCHUB_BACKEND_PORT=8080",
        "-v",
        workspace + ":/var/www/public/workspace:ro",
        baseImage,
      ]);
      const binding = (
        await engine.docker(["port", container, "8080/tcp"])
      ).stdout.trim();
      assert.match(binding, /^127\.0\.0\.1:\d+$/);
      const portal = "http://" + binding;
      let ready = false;
      for (let i = 0; i < 90; i++) {
        try {
          if (
            (
              await fetch(portal + "/health", {
                signal: AbortSignal.timeout(2000),
              })
            ).ok
          ) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
      assert.ok(ready, "Temporary portal must start");
      configData.projects[0].portal = portal;
      await fs.writeFile(config, JSON.stringify(configData));
      client = new Client({
        name: "seaf-external-agent-acceptance",
        version: "1.0.0",
      });
      await client.connect(
        new StdioClientTransport({
          command: process.execPath,
          args: [path.join(service, "server.mjs")],
          env: {
            ...process.env,
            SEAF_PROJECTS_CONFIG: config,
            SEAF_MCP_STATE: path.join(dir, "proposals"),
          },
          stderr: "inherit",
        }),
      );
      await call("list_projects", {});
      await step(
        ["AC-09-01", "AC-09-02"],
        "checkout participants have individually verified facts and interactions",
        async () => {
          const ids = [
              "demo.shop.orders",
              "demo.shop.cart",
              "demo.shop.catalog",
              "demo.shop.inventory",
              "demo.shop.payments",
              "demo.shop.notifications",
              "demo.shop.delivery",
            ],
            facts = [];
          for (const id of ids) {
            const context = await call("grounded_context", {
              project: "ai-fixture",
              question: id,
            });
            const claims = context.claims.filter(
              (claim) => claim.entityId === id && claim.verified,
            );
            assert.ok(
              claims.some((claim) => claim.property === "title"),
              id + " title evidence",
            );
            assert.ok(
              claims.some((claim) => claim.property === "description"),
              id + " responsibility evidence",
            );
            for (const claim of claims) {
              assert.ok(
                claim.sources.every(
                  (source) =>
                    source.project &&
                    source.file &&
                    source.entityId === id &&
                    source.sha256 &&
                    source.commit &&
                    source.line > 0,
                ),
              );
            }
            const sources = [
              ...new Map(
                claims
                  .flatMap((c) => c.sources)
                  .map((source) => [source.id, source]),
              ).values(),
            ];
            assert.equal(
              (
                await call("verify_evidence", {
                  project: "ai-fixture",
                  sources,
                })
              ).ok,
              true,
            );
            facts.push({
              entityId: id,
              classification: "retrieved-fact",
              title: claims.find((c) => c.property === "title")?.value,
              responsibility: claims.find((c) => c.property === "description")
                ?.value,
              sourceIds: sources.map((source) => source.id),
              sources,
            });
          }
          const context = await call("grounded_context", {
              project: "ai-fixture",
              question: "demo.shop.delivery",
            }),
            interaction = context.claims.find(
              (c) =>
                c.entityId === "demo.shop.delivery" &&
                c.targetId === "demo.shop.orders" &&
                c.property === "relation",
            );
          assert.ok(interaction?.verified);
          assert.equal(
            await engine.git(project, ["rev-parse", "HEAD"]),
            beforeHead,
          );
          return {
            question: "Which services participate in checkout and delivery?",
            facts,
            interaction,
          };
        },
      );
      await step(
        ["AC-09-04"],
        "an external agent inference from a title is explicitly labelled and not promoted to a fact",
        async () => {
          const context = await call("grounded_context", {
              project: "ai-fixture",
              question: "demo.shop.prediction",
            }),
            title = context.claims.find(
              (c) =>
                c.entityId === "demo.shop.prediction" && c.property === "title",
            );
          assert.ok(title?.verified);
          assert.equal(
            context.claims.some(
              (c) =>
                c.entityId === "demo.shop.prediction" &&
                c.property === "description",
            ),
            false,
          );
          assert.ok(
            context.claims
              .filter((c) => c.entityId === "demo.shop.prediction")
              .every((c) => c.classification === "retrieved-fact"),
          );
          assert.equal(
            context.claims.some(
              (c) =>
                c.entityId === "demo.shop.prediction" &&
                c.property === "algorithm",
            ),
            false,
          );
          assert.match(context.instructions, /inference/i);
          assert.deepEqual(context.inferences, []);
          assert.equal(
            (
              await call("verify_evidence", {
                project: "ai-fixture",
                sources: title.sources,
              })
            ).ok,
            true,
          );
          return {
            contextMode: context.mode,
            supportedTitle: title.value,
            sources: title.sources,
            inventedDescription: false,
            inventedAlgorithm: false,
            inferenceGuidance: context.instructions,
            manualAgentEvidence: "external-agent-review.json",
          };
        },
      );
      let finding;
      await step(
        ["AC-10-04"],
        "ambiguous ownership statement remains a paired candidate with visible uncertainty",
        async () => {
          const findings = await call("find_contradictions", {
            project: "ai-fixture",
          });
          finding = findings.find(
            (f) =>
              f.status === "candidate" &&
              f.entityId === "demo.shop.orders" &&
              f.sources.some((s) => s.file === "docs/qa-conflict.md"),
          );
          assert.ok(finding);
          assert.equal(finding.confirmed, false);
          assert.ok(finding.uncertainty);
          assert.equal(finding.claims.length, 2);
          assert.ok(finding.sources.every((s) => s.fresh));
          assert.equal(
            await engine.git(project, ["rev-parse", "HEAD"]),
            beforeHead,
          );
          assert.equal(
            await engine.git(project, ["status", "--porcelain"]),
            "",
          );
          return { finding };
        },
      );
      await step(
        ["AC-10-06"],
        "resolve the selected conflict through one scoped diff, actual validators, Git and reload",
        async () => {
          const owner = await call("get_entity", {
            project: "ai-fixture",
            section: "components",
            id: "demo.shop.orders",
          });
          assert.equal(owner.value.owner, "Legacy QA Team");
          await call("get_dependencies", {
            project: "ai-fixture",
            id: "demo.shop.orders",
          });
          const raw = await call("read_artifact", {
              project: "ai-fixture",
              path: "architecture/qa-conflict.yaml",
            }),
            doc = await call("read_artifact", {
              project: "ai-fixture",
              path: "docs/qa-conflict.md",
            }),
            yaml = YAML.parseDocument(raw.content);
          yaml.setIn(
            ["components", "demo.shop.orders", "owner"],
            "Checkout Team",
          );
          const proposal = await call("propose_change", {
            project: "ai-fixture",
            message: "Resolve the selected QA ownership contradiction",
            changes: [
              {
                path: "architecture/qa-conflict.yaml",
                content: yaml.toString(),
              },
              {
                path: "docs/qa-conflict.md",
                content: doc.content.replace(
                  "Commerce или Logistics",
                  "Checkout Team",
                ),
              },
            ],
          });
          assert.match(proposal.diff, /Legacy QA Team/);
          assert.match(proposal.diff, /Commerce или Logistics/);
          assert.equal(proposal.changes.length, 2);
          await call("get_proposal", { proposal_id: proposal.proposalId });
          const validation = await call("validate_change", {
            proposal_id: proposal.proposalId,
          });
          assert.equal(validation.ok, true);
          assert.equal(validation.rules, 15);
          const applied = await call("apply_change", {
            proposal_id: proposal.proposalId,
          });
          assert.equal(applied.status, "applied");
          assert.equal(applied.reload.status, "updated");
          assert.deepEqual(applied.reload.problems, []);
          assert.equal(
            await engine.git(project, ["status", "--porcelain"]),
            "",
          );
          assert.equal(
            await engine.git(project, [
              "rev-list",
              "--count",
              beforeHead + "..HEAD",
            ]),
            "1",
          );
          assert.equal(
            (await call("find_contradictions", { project: "ai-fixture" })).some(
              (f) =>
                f.entityId === "demo.shop.orders" && f.property === "owner",
            ),
            false,
          );
          const actual = await fetch(
            portal + "/seaf-core/api/core/storage/jsonata",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: '(components."demo.shop.orders".owner)',
                params: {},
              }),
            },
          ).then((r) => r.json());
          assert.equal(actual, "Checkout Team");
          return {
            selectedFinding: finding.id,
            proposal: proposal.proposalId,
            diff: proposal.diff,
            validation,
            applied,
            portalOwner: actual,
          };
        },
      );
      report.status = "passed";
      report.completed = new Date().toISOString();
      report.productionUnchanged =
        productionHead ===
          (await bootstrap.git(production, ["rev-parse", "HEAD"])) &&
        fingerprint === (await bootstrap.fingerprint(production.root));
      assert.equal(report.productionUnchanged, true);
    } catch (error) {
      report.status = "failed";
      report.error = { message: error.message, stack: error.stack };
      throw error;
    } finally {
      if (client) await client.close();
      if (container)
        await engine.docker(["rm", "-f", container]).catch(() => {});
      await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
    }
  },
);
