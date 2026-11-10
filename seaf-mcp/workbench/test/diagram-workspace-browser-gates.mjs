// Actual UI acceptance. All mutations belong to independently copied temporary projects.
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import YAML from "yaml";
import { Engine } from "../../engine.mjs";
import { createWorkbenchServer } from "../server.mjs";
import { createOfflineServer } from "../../../portable/offline.mjs";
const require = createRequire(import.meta.url),
  { chromium } = require(process.env.SEAF_PLAYWRIGHT || "playwright");
const bundle = path.resolve(
  process.env.SEAF_COMPOSER_TEST_BUNDLE || "dist/SEAF-Windows-x64",
);
const output = path.resolve("seaf-mcp/state/diagram-workspace-browser"),
  scratch = path.join(output, "run-" + crypto.randomUUID()),
  config = path.join(scratch, "projects.json");
const report = {
  format: "seaf-interactive-workspace-browser-v1",
  status: "running",
  started: new Date().toISOString(),
  checks: [],
  pageErrors: [],
  externalRequests: [],
  productionWrites: false,
};
const orders = "demo.shop.orders",
  delivery = "demo.shop.delivery",
  child = orders + ".qa_api",
  existingChild = orders + ".existing_worker";
let browser, page, app, offline;
const engine = new Engine(config, path.join(scratch, "state")),
  fixtures = {};
const saveReport = () =>
  fs.writeFile(
    path.join(output, "result.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
const check = async (name, fn) => {
  const entry = { name, status: "running" };
  report.checks.push(entry);
  await saveReport();
  console.log("Interactive browser: " + name);
  try {
    entry.result = await fn();
    entry.status = "PASS";
  } catch (e) {
    entry.status = "FAIL";
    throw e;
  } finally {
    await saveReport();
  }
};
const apiResponse = (response, name) => {
  try {
    return (
      response.url().endsWith("/api/action") &&
      response.request().postDataJSON()?.action === name
    );
  } catch {
    return false;
  }
};
async function idle() {
  await page.locator("#progress").waitFor({ state: "hidden", timeout: 120000 });
  await page.waitForFunction(
    () => !(Number(document.documentElement.dataset.pendingUiTasks) || 0),
  );
}
async function action(name, fn) {
  const response = page.waitForResponse((r) => apiResponse(r, name), {
    timeout: 120000,
  });
  await fn();
  const data = await (await response).json();
  if (!data.ok) throw Error(data.error);
  await idle();
  return data.result;
}
async function selectNode(key, tab = "visual") {
  await page.locator("#composer-node-key").selectOption(key);
  await page.locator(`[data-composer-tab="${tab}"]`).click();
  if (tab === "model")
    await page.locator("#composer-model-json").waitFor({ state: "attached" });
  await idle();
}
async function openEdge(key) {
  const points = await page
    .locator(`#composer-chart [data-composer-edge="${key}"] .di-edge-line`)
    .evaluate((element) => {
      const matrix = element.getScreenCTM();
      return [0.5, 0.2, 0.8, 0.1, 0.9, 0.05, 0.95, 0.35, 0.65].map((ratio) => {
        const point = element.getPointAtLength(
          element.getTotalLength() * ratio,
        );
        return {
          x: matrix.a * point.x + matrix.c * point.y + matrix.e,
          y: matrix.b * point.x + matrix.d * point.y + matrix.f,
        };
      });
    });
  let point;
  for (const candidate of points)
    if (
      await page.evaluate(
        ({ point, key }) =>
          document
            .elementFromPoint(point.x, point.y)
            ?.closest("[data-composer-edge]")
            ?.getAttribute("data-composer-edge") === key,
        { point: candidate, key },
      )
    ) {
      point = candidate;
      break;
    }
  if (point) {
    await page.mouse.dblclick(point.x, point.y);
    report.canvasEdgeSelections = (report.canvasEdgeSelections || 0) + 1;
  } else {
    // Fully overlapping paths remain reachable through the visible keyboard-accessible edge list.
    await page.locator(`[data-composer-edge-edit="${key}"]`).click();
    await page.locator('[data-composer-tab="model"]').click();
    report.edgeListSelections = (report.edgeListSelections || 0) + 1;
  }
  await page.locator("#composer-model-json").waitFor({ state: "attached" });
}
async function palette(id) {
  await page.locator("#composer-palette-section").selectOption("components");
  await page.locator("#composer-palette-filter").fill(id);
  await page.locator("#composer-palette-object").selectOption(id);
  await action("diagram_workspace", () =>
    page.locator("#composer-palette-add").click(),
  );
}
async function setField(name, value) {
  const field = page.locator(`[data-inspector-field="${name}"]`);
  await field.waitFor();
  if (await field.evaluate((e) => e.tagName === "SELECT")) {
    const option = JSON.stringify(value);
    if (
      !(await field
        .locator("option")
        .evaluateAll((items, v) => items.some((o) => o.value === v), option))
    )
      throw Error("Fixture dictionary lacks " + name + "=" + option);
    await field.selectOption(option);
  } else await field.fill(String(value));
}
async function modelJson(value) {
  const area = page.locator("#composer-model-json");
  if (!(await area.isVisible()))
    await area.locator("..").locator("summary").click();
  await area.fill(
    typeof value === "string" ? value : JSON.stringify(value, null, 2),
  );
}
async function stageModel() {
  return action("diagram_workspace", () =>
    page.locator("#composer-model-stage").click(),
  );
}
async function openComposer() {
  if (await page.locator("#result-dialog[open]").count())
    await page.locator("#dialog-close").click();
  await page.locator('[data-view="composer"]').first().click();
  await page.locator("#composer-id").waitFor();
  await idle();
}
async function saveDraft() {
  await action("diagram_draft", () => page.locator("#composer-stage").click());
  await page.locator('[data-act="validate-active"]').waitFor();
  const validated = await action("validate", () =>
    page.locator('[data-act="validate-active"]').click(),
  );
  if (!validated.ok) {
    await fs.writeFile(
      path.join(output, "native-validation-failure.json"),
      JSON.stringify(validated, null, 2),
    );
    throw Error("Actual native validation failed");
  }
  const result = await action("apply", () =>
    page.locator('[data-act="apply-active"]').click(),
  );
  assert.equal(result.status, "applied");
  assert.equal(result.reload.status, "updated");
  return result;
}
async function preview() {
  return action("diagram_preview", () =>
    page.locator("#composer-preview").click(),
  );
}
async function screenshot(name) {
  await page.screenshot({
    path: path.join(output, name + ".png"),
    fullPage: true,
  });
}
try {
  await fs.mkdir(scratch, { recursive: true });
  const originalFingerprint = await engine.fingerprint(
    path.join(bundle, "examples/shopflow"),
  );
  for (const kind of ["git", "directory"]) {
    const root = path.join(scratch, kind);
    await engine.copyArtifacts(path.join(bundle, "examples/shopflow"), root);
    const componentsFile = path.join(root, "architecture/components.yaml"),
      components = YAML.parse(await fs.readFile(componentsFile, "utf8"));
    components.components[orders].custom = {
      retained: true,
      zero: 0,
      flag: false,
    };
    components.components[existingChild] = {
      title: "Existing Orders worker",
      entity: "component",
      owner: "QA",
    };
    const original = components.components[delivery].links[0];
    components.components[delivery].links.push({
      ...structuredClone(original),
      title: "Parallel exact interaction",
      protocol: original.protocol,
      custom: { retain: "parallel-metadata" },
    });
    await fs.writeFile(componentsFile, YAML.stringify(components));
    const contextsFile = path.join(root, "architecture/contexts.yaml"),
      contexts = YAML.parse(await fs.readFile(contextsFile, "utf8"));
    contexts.contexts["demo.shop.services"].components.push(existingChild);
    await fs.writeFile(contextsFile, YAML.stringify(contexts));
    const custom = {
      entities: {
        "fixture.flows": {
          title: "Fixture information flows",
          schema: {
            type: "object",
            additionalProperties: {
              type: "object",
              properties: {
                title: { type: "string" },
                from: { type: "string", $ref: "#/$rels/components" },
                to: { type: "string", $ref: "#/$rels/components" },
                protocol: { type: "string", enum: ["HTTPS", "AMQP"] },
                encrypted: { type: "boolean" },
              },
            },
          },
        },
      },
      "fixture.flows": {
        "fixture.schema_reference": {
          title: "Separate schema reference",
          from: orders,
          to: delivery,
          protocol: "HTTPS",
        },
        "fixture.existing": {
          title: "Existing standalone flow",
          from: orders,
          to: delivery,
          protocol: "HTTPS",
          encrypted: true,
          custom: { keep: "standalone" },
        },
      },
    };
    await fs.writeFile(
      path.join(root, "fixture-schema.yaml"),
      YAML.stringify(custom),
    );
    const rootDoc = YAML.parseDocument(
      await fs.readFile(path.join(root, "root.yaml"), "utf8"),
    );
    rootDoc.get("imports").add("fixture-schema.yaml");
    await fs.writeFile(path.join(root, "root.yaml"), rootDoc.toString());
    const p = {
      id: kind,
      title: "Interactive " + kind,
      root,
      manifest: "root.yaml",
      writable: true,
      source: { kind },
      validation: {
        runtime: "native",
        workspace: root,
        manifest: "workspace/root.yaml",
        native: {
          bundleRoot: bundle,
          stateRoot: path.join(scratch, "runtime-" + kind),
        },
      },
    };
    fixtures[kind] = { root, p };
    if (kind === "git")
      for (const args of [
        ["init", "-b", "main"],
        ["config", "user.name", "SEAF UI QA"],
        ["config", "user.email", "qa@localhost"],
        ["add", "."],
        ["commit", "-m", "Independent UI fixture"],
      ])
        await engine.git({ root }, args);
  }
  const reference = path.join(scratch, "reference");
  await fs.mkdir(reference);
  await fs.writeFile(
    path.join(reference, "root.yaml"),
    "components:\n  reference:\n    title: Reference\n",
  );
  await fs.writeFile(
    config,
    JSON.stringify({
      activeProject: "git",
      projects: [
        fixtures.git.p,
        fixtures.directory.p,
        {
          id: "reference",
          root: reference,
          manifest: "root.yaml",
          writable: false,
          source: { kind: "directory" },
        },
      ],
    }),
  );
  offline = await createOfflineServer({
    port: 0,
    assetsRoot: path.join(bundle, "runtime/offline"),
  });
  process.env.SEAF_OFFLINE_URL = offline.url;
  app = await createWorkbenchServer({
    port: 0,
    engine,
    state: path.join(scratch, "wb"),
    specRoot: null,
    editorUrl: offline.url + "/?embed=1&proto=json&offline=1",
  });
  const wbUrl = "http://127.0.0.1:" + app.server.address().port;
  process.env.SEAF_WORKBENCH_URL = wbUrl;
  for (const kind of ["git", "directory"]) {
    const p = await engine.project(kind),
      runtime = await engine.runtime(p),
      live = await runtime.start({
        projectId: kind,
        workspace: p.root,
        manifest: "workspace/root.yaml",
        timeout: 60000,
      });
    await engine.updateProject(kind, { portal: live.url });
    fixtures[kind].portal = live.url;
    fixtures[kind].before = await engine.fingerprint(p.root);
    fixtures[kind].beforeModel = (await engine.model(kind)).model;
  }
  fixtures.git.beforeHead = await engine.git(fixtures.git.p, [
    "rev-parse",
    "HEAD",
  ]);
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.SEAF_CHROME_EXECUTABLE ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  const context = await browser.newContext({
    viewport: { width: 1800, height: 1200 },
    acceptDownloads: true,
    serviceWorkers: "block",
  });
  await context.route("**/*", (route) => {
    const u = new URL(route.request().url());
    if (
      ["http:", "https:"].includes(u.protocol) &&
      !["127.0.0.1", "localhost", "[::1]"].includes(u.hostname)
    ) {
      report.externalRequests.push(u.origin);
      return route.abort();
    }
    return route.continue();
  });
  page = await context.newPage();
  page.setDefaultTimeout(60000);
  page.on("pageerror", (e) => report.pageErrors.push(e.message));
  page.on("dialog", (dialog) => dialog.accept());
  await page.goto(wbUrl + "/?view=composer&project=git");
  await page.locator("#composer-id").waitFor();
  await idle();
  await check(
    "Canvas-first layout and live palette remain usable without a form wall",
    async () => {
      await page.locator("#composer-id").fill("interactive-checkout");
      await page.locator("#composer-title").fill("Interactive checkout");
      await palette(orders);
      await palette(delivery);
      assert.equal(
        await page.locator("#composer-chart [data-composer-node]").count(),
        2,
      );
      const box = await page.locator("#composer-chart").boundingBox();
      assert.ok(box.width >= 500 && box.height >= 350);
      await screenshot("wide-initial");
      return { canvasWidth: box.width, canvasHeight: box.height };
    },
  );
  await check(
    "Existing composition adds a real child to the diagram without model mutation",
    async () => {
      await selectNode("node1", "composition");
      await page
        .locator(`[data-composer-child-open="${existingChild}"]`)
        .click();
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("#composer-chart [data-composer-node]").count(),
        3,
      );
      assert.match(
        await page.locator("#composer-semantic-count").textContent(),
        /очереди: 0/,
      );
      assert.equal(
        await engine.fingerprint(fixtures.git.root),
        fixtures.git.before,
      );
    },
  );
  await check(
    "Click selection, keyboard movement, drag, pan and cursor zoom preserve semantic scope",
    async () => {
      await selectNode("node2");
      const node = page.locator('#composer-chart [data-composer-node="node2"]'),
        before = Number(await page.locator("#composer-node-x").inputValue());
      await node.focus();
      await node.press("ArrowRight");
      const x = Number(await page.locator("#composer-node-x").inputValue());
      assert.equal(x, before + 10);
      const cameraBefore = await page
        .locator("#composer-chart svg")
        .getAttribute("viewBox");
      const canvas = await page.locator("#composer-chart").boundingBox();
      await page.mouse.move(canvas.x + 30, canvas.y + canvas.height - 35);
      await page.mouse.down();
      await page.mouse.move(canvas.x + 85, canvas.y + canvas.height - 20);
      await page.mouse.up();
      assert.notEqual(
        await page.locator("#composer-chart svg").getAttribute("viewBox"),
        cameraBefore,
      );
      await page.mouse.wheel(0, -240);
      await page.locator("#composer-fit").click();
      assert.equal(
        await page.locator("#composer-node-key").inputValue(),
        "node2",
      );
      assert.match(
        await page.locator("#composer-semantic-count").textContent(),
        /очереди: 0/,
      );
      assert.equal(
        await engine.fingerprint(fixtures.git.root),
        fixtures.git.before,
      );
    },
  );
  await check(
    "Double-click inspector stages real title/owner while preserving custom fields and visual aliases",
    async () => {
      await selectNode("node1");
      await page
        .locator('#composer-chart [data-composer-node="node1"] rect')
        .dblclick({ position: { x: 20, y: 20 } });
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      const original = JSON.parse(
        await page.locator("#composer-model-json").inputValue(),
      );
      await setField("title", "Orders QA");
      const owner = page.locator('[data-inspector-field="owner"]');
      if (await owner.evaluate((e) => e.tagName === "SELECT")) {
        const choices = await owner
          .locator("option")
          .evaluateAll((items) =>
            items.filter((o) => o.value).map((o) => JSON.parse(o.value)),
          );
        const next = choices.find((v) => v !== original.owner);
        await setField("owner", next);
        fixtures.git.expectedOwner = next;
      } else {
        await owner.fill("Fixture Platform");
        fixtures.git.expectedOwner = "Fixture Platform";
      }
      assert.equal(await page.locator("#composer-preview").isDisabled(), true);
      await stageModel();
      assert.match(
        await page
          .locator('#composer-chart [data-composer-node="node1"]')
          .textContent(),
        /Orders QA/,
      );
      await selectNode("node2");
      await page.locator("#composer-node-title").fill("Custom Delivery alias");
      await page.locator('[data-composer-tab="model"]').click();
      await setField("title", "Delivery QA");
      await stageModel();
      assert.match(
        await page
          .locator('#composer-chart [data-composer-node="node2"]')
          .textContent(),
        /Custom Delivery alias/,
      );
      assert.equal(
        await engine.fingerprint(fixtures.git.root),
        fixtures.git.before,
      );
    },
  );
  await check(
    "Raw incomplete inspector JSON survives navigation/reload, blocks preview and supports undo/redo",
    async () => {
      await selectNode("node1", "model");
      const good = await page.locator("#composer-model-json").inputValue();
      await modelJson('{"title":');
      assert.equal(await page.locator("#composer-preview").isDisabled(), true);
      await page.reload();
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("#composer-model-json").inputValue(),
        '{"title":',
      );
      assert.equal(await page.locator("#composer-preview").isDisabled(), true);
      await page.locator("#composer-undo").click();
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("#composer-model-json").inputValue(),
        good,
      );
      await page.locator("#composer-redo").click();
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      assert.equal(
        await page.locator("#composer-model-json").inputValue(),
        '{"title":',
      );
      await page.locator("#composer-model-reset").click();
      assert.equal(await page.locator("#composer-preview").isEnabled(), true);
    },
  );
  await check(
    "Existing untouched standalone flow loads its declared endpoint schema and edits actual properties",
    async () => {
      await action("diagram_workspace", () =>
        page.locator("#composer-auto-links").click(),
      );
      await page
        .locator("#composer-palette-section")
        .selectOption("fixture.flows");
      await page
        .locator("#composer-palette-filter")
        .fill("fixture.schema_reference");
      await page
        .locator("#composer-palette-object")
        .selectOption("fixture.schema_reference");
      const workspace = await action("diagram_workspace", () =>
        page.locator("#composer-palette-add").click(),
      );
      assert.ok(
        workspace.effectiveEntities.some(
          (entity) =>
            entity.section === "fixture.flows" &&
            entity.id === "fixture.schema_reference" &&
            entity.schema,
        ),
      );
      const sketch = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("seaf-composer-sketch-v1:git")),
        ),
        edge = sketch.diagram.edges.find(
          (edge) =>
            edge.binding?.adapter === "entity" &&
            edge.binding.id === "fixture.existing",
        );
      assert.ok(edge);
      await openEdge(edge.key);
      await page.locator('[data-inspector-field="from"]').waitFor();
      await page.locator('[data-inspector-field="to"]').waitFor();
      await setField("protocol", "AMQP");
      await setField("to", existingChild);
      await stageModel();
      const actual = JSON.parse(
        await page.locator("#composer-model-json").inputValue(),
      );
      assert.equal(actual.custom.keep, "standalone");
      assert.equal(actual.to, existingChild);
      const updated = await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("seaf-composer-sketch-v1:git"),
        ).diagram.edges.find((edge) => edge.binding?.id === "fixture.existing"),
      );
      assert.equal(updated.to, "node3");
    },
  );
  await check(
    "Exact parallel interaction is edited from an edge inspector with typed encryption and retained metadata",
    async () => {
      await action("diagram_workspace", () =>
        page.locator("#composer-auto-links").click(),
      );
      const bindings = await page
        .locator("#composer-chart [data-composer-edge]")
        .count();
      assert.ok(bindings >= 3);
      const sketch = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("seaf-composer-sketch-v1:git")),
        ),
        target = sketch.diagram.edges.find(
          (e) =>
            e.binding?.from === delivery &&
            e.title === "Parallel exact interaction",
        );
      assert.ok(target);
      await openEdge(target.key);
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      await setField("protocol", "HTTPS");
      await setField("encrypted", false);
      await setField("id", existingChild);
      await setField("direction", "<->");
      await stageModel();
      const next = JSON.parse(
        await page.locator("#composer-model-json").inputValue(),
      );
      assert.equal(next.encrypted, false);
      assert.equal(next.custom.retain, "parallel-metadata");
      assert.equal(next.id, existingChild);
      await page.locator("#composer-model-link-source").selectOption(orders);
      await stageModel();
      const moved = await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("seaf-composer-sketch-v1:git"),
        ).diagram.edges.find(
          (edge) => edge.title === "Parallel exact interaction",
        ),
      );
      assert.equal(moved.binding.from, orders);
      assert.equal(moved.to, "node3");
      assert.equal(moved.direction, "bidirectional");
      assert.equal(
        await page
          .locator(
            `#composer-chart [data-composer-edge="${moved.key}"] .di-edge-line`,
          )
          .getAttribute("marker-start"),
        "url(#composer-local-arrow)",
      );
      assert.equal(
        await page
          .locator(
            `#composer-chart [data-composer-edge="${moved.key}"] .di-edge-line`,
          )
          .getAttribute("marker-end"),
        "url(#composer-local-arrow)",
      );
    },
  );
  await check(
    "Child creation explicitly includes applicable context changes in one pending queue",
    async () => {
      await selectNode("node1", "composition");
      await page.locator("#composer-child-id").fill(child);
      await page.locator("#composer-child-title").fill("Orders QA API");
      await page
        .locator(
          '[data-context-mode="child"][data-composer-context="demo.shop.services"]',
        )
        .check();
      await action("diagram_workspace", () =>
        page.locator("#composer-child-create").click(),
      );
      assert.equal(
        await page.locator("#composer-chart [data-composer-node]").count(),
        5,
      );
      const sketch = await page.evaluate(() =>
        JSON.parse(localStorage.getItem("seaf-composer-sketch-v1:git")),
      );
      assert.ok(
        sketch.semanticOperations.some(
          (op) => op.kind === "child" && op.id === child,
        ),
      );
      assert.ok(
        sketch.semanticOperations.some(
          (op) =>
            op.section === "contexts" && op.value.components.includes(child),
        ),
      );
    },
  );
  await check(
    "A declared standalone flow is created from selected endpoints with actual model fields",
    async () => {
      await selectNode("node1");
      await page.locator("#composer-edge-from").selectOption("node1");
      await page.locator("#composer-edge-to").selectOption("node2");
      await page.locator("#composer-edge-scope").selectOption("model");
      await page
        .locator("#composer-edge-adapter")
        .selectOption("fixture.flows");
      await page.locator("#composer-relation-id").fill("fixture.created");
      await page.locator("#composer-edge-title").fill("Created delivery flow");
      await page.locator("#composer-edge-protocol").fill("HTTPS");
      await action("diagram_workspace", () =>
        page.locator("#composer-edge-add").click(),
      );
      assert.equal(
        JSON.parse(await page.locator("#composer-model-json").inputValue())
          .from,
        orders,
      );
    },
  );
  await check(
    "Preview includes model, diagram and context files but typing afterwards invalidates save",
    async () => {
      const p = await preview();
      assert.ok(p.semanticSummary);
      assert.ok(
        p.changes.some((f) => f.path === "architecture/components.yaml"),
      );
      assert.ok(p.changes.some((f) => f.path === "architecture/contexts.yaml"));
      assert.equal(
        await engine.fingerprint(fixtures.git.root),
        fixtures.git.before,
      );
      await setField("title", "Created delivery flow revised");
      assert.equal(await page.locator("#composer-stage").isDisabled(), true);
      assert.equal(await page.locator("#composer-preview").isDisabled(), true);
      await stageModel();
      await preview();
    },
  );
  await check(
    "One real UI native validation and Git save persists combined semantic edits with portal reload",
    async () => {
      const saved = await saveDraft(),
        model = (await engine.model("git")).model;
      assert.equal(model.components[orders].title, "Orders QA");
      assert.equal(model.components[orders].owner, fixtures.git.expectedOwner);
      assert.deepEqual(model.components[orders].custom, {
        retained: true,
        zero: 0,
        flag: false,
      });
      assert.deepEqual(
        model.components[delivery].links[0],
        fixtures.git.beforeModel.components[delivery].links[0],
      );
      const moved = model.components[orders].links.find(
        (link) => link.custom?.retain === "parallel-metadata",
      );
      assert.equal(moved.encrypted, false);
      assert.equal(moved.id, existingChild);
      assert.equal(moved.direction, "<->");
      assert.equal(model.components[child].title, "Orders QA API");
      assert.equal(
        model["fixture.flows"]["fixture.created"].title,
        "Created delivery flow revised",
      );
      assert.equal(
        model["fixture.flows"]["fixture.existing"].to,
        existingChild,
      );
      assert.equal(model["fixture.flows"]["fixture.existing"].protocol, "AMQP");
      assert.equal(
        model["fixture.flows"]["fixture.existing"].custom.keep,
        "standalone",
      );
      assert.equal(
        Number(
          await engine.git(fixtures.git.p, [
            "rev-list",
            "--count",
            fixtures.git.beforeHead + "..HEAD",
          ]),
        ),
        1,
      );
      fixtures.git.savedHead = saved.commit;
      return { commit: saved.commit, reload: saved.reload.status };
    },
  );
  await check(
    "Returning after save starts a fresh semantic cycle and existing model records can be deleted atomically",
    async () => {
      await openComposer();
      assert.match(
        await page.locator("#composer-semantic-count").textContent(),
        /очереди: 0/,
      );
      const reopened = await page.evaluate(() =>
        JSON.parse(
          localStorage.getItem("seaf-composer-sketch-v1:git"),
        ).diagram.edges.find((edge) => edge.binding?.id === "fixture.existing"),
      );
      await openEdge(reopened.key);
      await page.locator('[data-inspector-field="protocol"]').waitFor();
      assert.equal(
        await page.locator('[data-inspector-field="protocol"]').inputValue(),
        JSON.stringify("AMQP"),
      );
      assert.equal(
        await page.locator('[data-inspector-field="to"]').inputValue(),
        JSON.stringify(existingChild),
      );
      const sketch = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("seaf-composer-sketch-v1:git")),
        ),
        childNode = sketch.diagram.nodes.find((n) => n.ref?.id === child);
      await selectNode(childNode.key, "model");
      for (const box of await page
        .locator('[data-context-mode="delete"]')
        .all())
        await box.check();
      await action("diagram_workspace", () =>
        page.locator("#composer-model-delete").click(),
      );
      const updated = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("seaf-composer-sketch-v1:git")),
        ),
        edge = updated.diagram.edges.find(
          (e) =>
            e.binding?.adapter === "entity" &&
            e.binding.id === "fixture.created",
        );
      await openEdge(edge.key);
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      await action("diagram_workspace", () =>
        page.locator("#composer-model-delete").click(),
      );
      const p = await preview();
      assert.deepEqual(p.unresolvedReferences, []);
      if (await page.locator("#composer-ack-impacts").count())
        await page.locator("#composer-ack-impacts").check();
      await saveDraft();
      const model = (await engine.model("git")).model;
      assert.equal(model.components[child], undefined);
      assert.equal(model["fixture.flows"]["fixture.created"], undefined);
      assert.equal(
        model.contexts["demo.shop.services"].components.includes(child),
        false,
      );
    },
  );
  await check(
    "Actual component link create, edit and delete retains parallel source metadata",
    async () => {
      await openComposer();
      await selectNode("node1");
      await page.locator("#composer-edge-from").selectOption("node1");
      await page.locator("#composer-edge-to").selectOption("node2");
      await page.locator("#composer-edge-scope").selectOption("model");
      await page
        .locator("#composer-edge-title")
        .fill("QA one-time integration");
      await page.locator("#composer-edge-protocol").fill("HTTPS");
      await action("diagram_workspace", () =>
        page.locator("#composer-edge-add").click(),
      );
      await setField("dataClassification", "internal");
      await setField("encrypted", true);
      await stageModel();
      await preview();
      await saveDraft();
      await openComposer();
      const sketch = await page.evaluate(() =>
          JSON.parse(localStorage.getItem("seaf-composer-sketch-v1:git")),
        ),
        edge = sketch.diagram.edges.find(
          (e) => e.title === "QA one-time integration",
        );
      await openEdge(edge.key);
      await page.locator("#composer-model-json").waitFor({ state: "attached" });
      await action("diagram_workspace", () =>
        page.locator("#composer-model-delete").click(),
      );
      await preview();
      if (await page.locator("#composer-ack-impacts").count())
        await page.locator("#composer-ack-impacts").check();
      await saveDraft();
      assert.equal(
        (await engine.model("git")).model.components[orders].links.some(
          (l) => l.title === "QA one-time integration",
        ),
        false,
      );
    },
  );
  await check(
    "Directory project uses the same reviewed UI flow and saves a local revision",
    async () => {
      await openComposer();
      await page.locator("#project").selectOption("directory");
      await page.locator("#composer-id").waitFor();
      await idle();
      await page.locator("#composer-id").fill("directory-workspace");
      await page.locator("#composer-title").fill("Directory workspace");
      await palette(orders);
      await palette(delivery);
      await selectNode("node1", "model");
      await setField(
        "description",
        "Edited from isolated directory canvas inspector",
      );
      await stageModel();
      await preview();
      const saved = await saveDraft();
      assert.equal(saved.revision.kind, "directory");
      assert.equal(
        (await engine.model("directory")).model.components[orders].description,
        "Edited from isolated directory canvas inspector",
      );
      assert.ok(
        (await engine.revisions(await engine.project("directory"))).length >= 2,
      );
    },
  );
  await check(
    "Storage failure retains raw inspector text and exports a recoverable private sketch",
    async () => {
      await openComposer();
      await selectNode("node1", "model");
      const before = await engine.fingerprint(fixtures.directory.root);
      await page.evaluate(() => {
        window.__diagramOriginalSetItem = Storage.prototype.setItem;
        Storage.prototype.setItem = function (key, value) {
          if (String(key).startsWith("seaf-composer-sketch-v1:"))
            throw new DOMException("Quota fixture", "QuotaExceededError");
          return window.__diagramOriginalSetItem.call(this, key, value);
        };
      });
      await modelJson('{"description":"raw quota recovery');
      assert.match(
        await page.locator("#composer-status").textContent(),
        /Не удалось сохранить/,
      );
      assert.equal(await page.locator("#composer-preview").isDisabled(), true);
      await page.locator(".composer-footer-details>summary").click();
      const wait = page.waitForEvent("download");
      await page.locator("#composer-export-sketch").click();
      const download = await wait,
        payload = JSON.parse(await fs.readFile(await download.path(), "utf8"));
      assert.ok(
        Object.values(payload.pending).some(
          (input) => input.text === '{"description":"raw quota recovery',
        ),
      );
      assert.equal(await engine.fingerprint(fixtures.directory.root), before);
      await page.evaluate(() => {
        Storage.prototype.setItem = window.__diagramOriginalSetItem;
        delete window.__diagramOriginalSetItem;
      });
      await page.locator("#composer-model-reset").click();
    },
  );
  await check(
    "Read-only model inspector disables real mutations and preserves source files",
    async () => {
      await openComposer();
      await page.locator("#project").selectOption("reference");
      await page.locator("#composer-id").waitFor();
      await idle();
      await palette("reference");
      await selectNode("node1", "model");
      assert.equal(
        await page.locator("#composer-model-stage").isDisabled(),
        true,
      );
      assert.equal(
        await page.locator("#composer-model-delete").isDisabled(),
        true,
      );
      assert.equal(
        await page.locator('[data-inspector-field="title"]').isDisabled(),
        true,
      );
      assert.match(
        await fs.readFile(path.join(reference, "root.yaml"), "utf8"),
        /title: Reference/,
      );
    },
  );
  await check(
    "Embedded-width workspace keeps canvas and contextual controls reachable",
    async () => {
      await page.setViewportSize({ width: 1000, height: 1000 });
      await page.goto(
        fixtures.git.portal +
          "/entities/docs/blank?dh-doc-id=local.composer.workspace",
      );
      const frameElement = page.locator(
        'iframe[title="Рабочее пространство SEAF — LSV"]',
      );
      await frameElement.waitFor();
      const frame = await (await frameElement.elementHandle()).contentFrame();
      await frame.locator("#composer-chart").waitFor();
      await frame.locator("#progress").waitFor({ state: "hidden" });
      if (
        (await frame.locator("#composer-focus").textContent()) ===
        "Больше места"
      )
        await frame.locator("#composer-focus").click();
      if (
        (await frame
          .locator("#composer-toggle-palette")
          .getAttribute("aria-expanded")) === "true"
      )
        await frame.locator("#composer-toggle-palette").click();
      await frame.locator("#composer-fit").click();
      await frame
        .locator('#composer-chart [data-composer-node="node1"] rect')
        .dblclick({ position: { x: 20, y: 20 } });
      await frame.locator('[data-inspector-field="title"]').waitFor();
      const canvas = await frame.locator("#composer-chart").boundingBox();
      assert.ok(canvas.width >= 500);
      assert.equal(await frame.locator("#composer-fit").isVisible(), true);
      assert.equal(await frame.locator("#composer-stage").isVisible(), true);
      assert.ok(
        await frame
          .locator("#composer-stage")
          .evaluate(
            (element) => element.getBoundingClientRect().bottom <= innerHeight,
          ),
        "Bottom save controls must fit inside the iframe viewport",
      );
      await screenshot("embedded-narrow");
      return {
        canvasWidth: canvas.width,
        frameWidth: (await frameElement.boundingBox()).width,
      };
    },
  );
  assert.equal(
    await engine.fingerprint(path.join(bundle, "examples/shopflow")),
    originalFingerprint,
  );
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.externalRequests, []);
  assert.ok(
    report.canvasEdgeSelections > 0,
    "Real canvas edge double-click is covered independently of overlap fallback",
  );
  report.status = "PASS";
} catch (e) {
  report.status = "FAIL";
  report.error = e.stack || e.message;
  process.exitCode = 1;
  if (page) await screenshot("failure").catch(() => {});
} finally {
  await browser?.close();
  if (app) {
    app.server.closeAllConnections?.();
    await new Promise((resolve) => app.server.close(resolve));
  }
  for (const runtime of engine.runtimes.values()) await runtime.closeAll();
  await offline?.stop();
  report.completed = new Date().toISOString();
  await fs.mkdir(output, { recursive: true });
  await saveReport();
  console.log(JSON.stringify(report));
}
