/** Browser acceptance for draw.io. All writes target a disposable own-Git fixture. */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { randomUUID, createHash } from "node:crypto";
import { createRequire } from "node:module";
import { Engine } from "../../engine.mjs";
import { createWorkbenchServer } from "../server.mjs";
import { exportDrawio, importDrawio } from "../drawio.mjs";

const require = createRequire(import.meta.url);
const runtime =
  "C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1026-487-0_26.1026.487.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright";
const { chromium } = require(runtime);
const service = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const output = path.join(service, "state", "acceptance", "drawio-gates");
await fs.mkdir(output, { recursive: true });
const dir = path.join(output, "run-" + randomUUID()),
  workspace = path.join(dir, "workspace"),
  root = path.join(workspace, "microservices-demo"),
  state = path.join(dir, "workbench");
assert.ok(path.resolve(dir).startsWith(path.resolve(output) + path.sep));
const report = {
  started: new Date().toISOString(),
  status: "running",
  fixture: dir,
  productionWrites: false,
  steps: [],
  ac: {},
};
const save = () =>
  fs.writeFile(
    path.join(output, "result.json"),
    JSON.stringify(report, null, 2),
  );
const step = async (name, acs, fn) => {
  const entry = {
    name,
    acs,
    started: new Date().toISOString(),
    status: "running",
  };
  report.steps.push(entry);
  await save();
  console.log("DRAWIO start: " + name);
  const start = Date.now();
  try {
    entry.result = await fn();
    entry.status = "passed";
    for (const id of acs) report.ac[id] = { status: "passed", step: name };
    return entry.result;
  } catch (error) {
    entry.status = "failed";
    entry.error = { message: error.message, stack: error.stack };
    for (const id of acs) report.ac[id] = { status: "failed", step: name };
    throw error;
  } finally {
    entry.durationMs = Date.now() - start;
    await save();
    console.log(
      "DRAWIO " + entry.status + ": " + name + " (" + entry.durationMs + " ms)",
    );
  }
};
const bootstrap = new Engine(
    path.join(service, "projects.json"),
    path.join(dir, "bootstrap"),
  ),
  production = await bootstrap.project("shopflow");
const productionHead = await bootstrap.git(production, ["rev-parse", "HEAD"]),
  productionFingerprint = await bootstrap.fingerprint(production.root);
const fixture = "drawio-fixture",
  readonly = "drawio-reference",
  artifact = "diagrams/qa-existing.drawio",
  orders = "demo.shop.orders",
  delivery = "demo.shop.delivery";
let engine,
  p,
  app,
  browser,
  context,
  page,
  portalName,
  baselineXML,
  baseModel,
  modelBytes;
const errors = [];
let calls = [];
async function api(action, args = {}) {
  const session = await fetch(app.url + "/api/session").then((r) => r.json()),
    response = await fetch(app.url + "/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SEAF-CSRF": session.csrf,
      },
      body: JSON.stringify({ action, project: fixture, ...args }),
    });
  const body = await response.json();
  if (!body.ok) throw Error(body.error);
  return body.result;
}
async function waitAPI(action, fn) {
  const response = page.waitForResponse(
    (r) =>
      r.url().endsWith("/api/action") &&
      r.request().method() === "POST" &&
      r.request().postDataJSON()?.action === action,
    { timeout: 120000 },
  );
  response.catch(() => {});
  await fn();
  const r = await response,
    result = await r.json();
  assert.equal(result.ok, true, result.error);
  return result.result;
}
async function openDiagram(project = fixture) {
  await page.goto(app.url);
  await page.locator("#connection").filter({ hasText: "Подключено" }).waitFor();
  await page
    .getByRole("heading", { name: "Редактор объектов", exact: true })
    .waitFor();
  await page.locator("#progress").waitFor({ state: "hidden" });
  if ((await page.locator("#project").inputValue()) !== project) {
    await waitAPI("model", () =>
      page.locator("#project").selectOption(project),
    );
    await page.locator("#progress").waitFor({ state: "hidden" });
  }
  if (project === readonly) await page.locator(".read-only").first().waitFor();
  await page.getByRole("button", { name: "draw.io", exact: true }).click();
  await page.locator("#drawio-path").fill(artifact);
  await waitAPI("drawio_open", () =>
    page
      .getByRole("button", { name: "Открыть из проекта", exact: true })
      .click(),
  );
  await page.waitForFunction(() =>
    document.querySelector("#drawio-xml")?.value.includes("mxfile"),
  );
}
async function openEditor() {
  await page
    .getByRole("button", { name: "Открыть редактор", exact: true })
    .click();
  const frame = page.frameLocator("#drawio-editor");
  await frame.locator(".geMenubarContainer").waitFor({ timeout: 30000 });
  await frame.getByText("Delivery Service", { exact: true }).first().waitFor();
  assert.equal(await page.getByRole('button',{name:'Подготовить сохранение файла',exact:true}).isDisabled(),true,'Parent save must not stage stale XML while the editor owns unsaved changes');
  return frame;
}
async function validateApply() {
  const validation = await waitAPI("validate", () =>
    page.getByRole("button", { name: "Проверить в SEAF", exact: true }).click(),
  );
  assert.equal(validation.ok, true, JSON.stringify(validation));
  assert.equal(validation.rules, 15);
  const applied = await waitAPI("apply", () =>
    page
      .getByRole("button", {
        name: "Сохранить в Git и обновить SEAF",
        exact: true,
      })
      .click(),
  );
  assert.equal(applied.status, "applied");
  assert.equal(applied.reload.status, "updated");
  assert.deepEqual(applied.reload.problems, []);
  await page
    .locator("#dialog-result")
    .filter({ hasText: applied.commit })
    .waitFor();
  await page.locator("#dialog-close").click();
  return { validation, applied };
}
try {
  await step(
    "boot isolated fixture, own Git and real SEAF runtime",
    [],
    async () => {
      await bootstrap.copyArtifacts(production.validation.workspace, workspace);
      const configFile = path.join(dir, "projects.json");
      const projects = [
        {
          id: fixture,
          title: "Draw.io writable QA fixture",
          root,
          manifest: "root.yaml",
          writable: true,
          validation: {
            workspace,
            manifest: "workspace/root.yaml",
            image: "seaf-local:2026.33.0-workbench",
          },
        },
        {
          id: readonly,
          title: "Draw.io read-only reference",
          root,
          manifest: "root.yaml",
          writable: false,
        },
      ];
      await fs.writeFile(configFile, JSON.stringify({ projects }, null, 2));
      await fs.mkdir(path.join(dir, "proposals"), { recursive: true });
      engine = new Engine(configFile, path.join(dir, "proposals"));
      p = await engine.project(fixture);
      baseModel = (await engine.model(fixture)).model;
      modelBytes = await fs.readFile(
        path.join(root, "architecture", "components.yaml"),
      );
      const components = {};
      for (const [id, x] of Object.entries({
        [orders]: { x: 80, y: 80 },
        [delivery]: { x: 440, y: 80 },
      }))
        components[id] = {
          ...baseModel.components[id],
          links: (baseModel.components[id].links || []).filter((link) =>
            [orders, delivery].includes(link.id),
          ),
          drawio: { geometry: { ...x, width: 200, height: 90 } },
        };
      baselineXML = exportDrawio(
        { components },
        { pageId: "qa-page", name: "Draw.io acceptance" },
      );
      await fs.writeFile(path.join(root, artifact), baselineXML);
      await engine.git(p, ["init", "-b", "main"]);
      await engine.git(p, ["add", "."]);
      await engine.git(p, [
        "-c",
        "user.name=Draw.io QA",
        "-c",
        "user.email=drawio-qa@localhost",
        "commit",
        "-m",
        "Isolated draw.io baseline",
      ]);
      portalName = "seaf-drawio-gates-" + randomUUID();
      await engine.docker([
        "run",
        "-d",
        "--name",
        portalName,
        "--label",
        "seaf.acceptance=drawio-gates",
        "-p",
        "127.0.0.1::8080",
        "-e",
        "VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS=n",
        "-e",
        "VUE_APP_DOCHUB_BACKEND_PORT=8080",
        "-e",
        "VUE_APP_DOCHUB_ROOT_MANIFEST=workspace/root.yaml",
        "-v",
        workspace + ":/var/www/public/workspace:ro",
        "seaf-local:2026.33.0-workbench",
      ]);
      const binding = (
        await engine.docker(["port", portalName, "8080/tcp"])
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
        await new Promise((r) => setTimeout(r, 500));
      }
      assert.equal(ready, true, "Isolated portal did not become ready");
      projects[0].portal = portal;
      await fs.writeFile(configFile, JSON.stringify({ projects }, null, 2));
      p = await engine.project(fixture);
      app = await createWorkbenchServer({
        port: 0,
        engine,
        state,
        specRoot: null,
      });
      app.url = "http://127.0.0.1:" + app.server.address().port;
      browser = await chromium.launch({
        executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
        headless: true,
      });
      context = await browser.newContext({
        viewport: { width: 1600, height: 1100 },
        serviceWorkers: "block",
      });
      page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      page.on("request", (request) => {
        if (request.url().endsWith("/api/action"))
          calls.push(request.postDataJSON());
      });
      report.portal = portal;
      report.url = app.url;
      report.baselineHead = await engine.git(p, ["rev-parse", "HEAD"]);
      return {
        portal,
        url: app.url,
        head: report.baselineHead,
        image: (
          await engine.docker([
            "image",
            "inspect",
            "seaf-local:2026.33.0-workbench",
            "--format",
            "{{.Id}}",
          ])
        ).stdout.trim(),
      };
    },
  );
  await step(
    "edit shape geometry inside actual draw.io frame, save original path, validate, commit and reload",
    ["AC-11-06", "AC-11-08"],
    async () => {
      await openDiagram();
      const frame = await openEditor();
      await page.screenshot({
        path: path.join(output, "editor-before.png"),
        fullPage: true,
      });
      await fs.writeFile(
        path.join(output, "editor-text.txt"),
        await frame.locator("body").innerText(),
      );
      const shape = frame
        .getByText("Delivery Service", { exact: true })
        .first();
      await shape.scrollIntoViewIfNeeded();
      const bounds = await shape.boundingBox();
      assert.ok(bounds);
      await page.mouse.move(
        bounds.x + bounds.width / 2,
        bounds.y + bounds.height / 2,
      );
      await page.mouse.down();
      await page.mouse.move(
        bounds.x + bounds.width / 2 + 90,
        bounds.y + bounds.height / 2 + 50,
        { steps: 12 },
      );
      await page.mouse.up();
      const draft = await waitAPI("drawio_save", async () => {
        const save = frame.getByRole("button", { name: "Save", exact: true });
        if (await save.count()) await save.click();
        else {
          await frame.getByText("File", { exact: true }).first().click();
          await frame
            .locator(".mxPopupMenu:visible")
            .getByText("Save", { exact: true })
            .click();
        }
      });
      assert.equal(draft.changes.length, 1);
      assert.equal(draft.changes[0].path, artifact);
      const old =
          importDrawio(baselineXML).components[delivery].drawio.geometry,
        next = importDrawio(draft.changes[0].content).components[delivery]
          .drawio.geometry;
      assert.notEqual(next.x, old.x, "Arrow keys must move a selected shape");
      assert.deepEqual(
        await fs.readFile(path.join(root, "architecture", "components.yaml")),
        modelBytes,
      );
      assert.equal(
        await engine.git(p, ["rev-parse", "HEAD"]),
        report.baselineHead,
      );
      const result = await validateApply();
      const actual = await fs.readFile(path.join(root, artifact), "utf8");
      assert.equal(
        importDrawio(actual).components[delivery].drawio.geometry.x,
        next.x,
      );
      assert.deepEqual(
        await fs.readFile(path.join(root, "architecture", "components.yaml")),
        modelBytes,
      );
      assert.deepEqual((await engine.model(fixture)).model, baseModel);
      await engine.clean(p);
      await page.screenshot({
        path: path.join(output, "layout-committed.png"),
        fullPage: true,
      });
      return {
        path: artifact,
        before: old,
        after: next,
        commit: result.applied.commit,
        reload: result.applied.reload,
        validation: result.validation,
      };
    },
  );
  await step(
    "reject foreign origin and foreign frame save messages without staging any draft",
    ["AC-11-10"],
    async () => {
      await openDiagram();
      await openEditor();
      const before = (await api("drafts_list")).length,
        beforeHash = createHash("sha256")
          .update(await fs.readFile(path.join(root, artifact)))
          .digest("hex");
      const prior = calls.filter((x) => x.action === "drawio_save").length;
      await page.evaluate(() => {
        const frame = document.querySelector("#drawio-editor"),
          data = JSON.stringify({
            event: "save",
            xml: '<mxfile evil="true"/>',
          });
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: "https://evil.example",
            source: frame.contentWindow,
            data,
          }),
        );
        window.dispatchEvent(
          new MessageEvent("message", {
            origin: new URL(frame.src).origin,
            source: window,
            data,
          }),
        );
      });
      await page.waitForTimeout(250);
      assert.equal(
        calls.filter((x) => x.action === "drawio_save").length,
        prior,
      );
      assert.equal((await api("drafts_list")).length, before);
      assert.equal(
        createHash("sha256")
          .update(await fs.readFile(path.join(root, artifact)))
          .digest("hex"),
        beforeHash,
      );
      return {
        wrongOriginIgnored: true,
        wrongSourceIgnored: true,
        newSaveRequests: 0,
        drafts: before,
      };
    },
  );
  await step(
    "read-only project opens an existing diagram but cannot save source changes",
    ["AC-11-07"],
    async () => {
      await openDiagram(readonly);
      assert.equal(
        await page
          .getByRole("button", {
            name: "Подготовить сохранение файла",
            exact: true,
          })
          .isDisabled(),
        true,
      );
      assert.equal(
        await page
          .getByRole("button", { name: "Распознать компоненты", exact: true })
          .isDisabled(),
        true,
      );
      const frame = await openEditor(),
        before = (await api("drafts_list")).length;
      const hash = createHash("sha256")
        .update(await fs.readFile(path.join(root, artifact)))
        .digest("hex");
      await frame
        .getByText("Delivery Service", { exact: true })
        .first()
        .click();
      await frame.locator("body").press("ArrowLeft");
      const save = frame.getByRole("button", { name: "Save", exact: true });
      if (await save.count()) await save.click();
      else {
        await frame.getByText("File", { exact: true }).first().click();
        await frame
          .locator(".mxPopupMenu:visible")
          .getByText("Save", { exact: true })
          .click();
      }
      await page
        .locator("#notice")
        .filter({ hasText: "только для чтения" })
        .waitFor();
      assert.equal((await api("drafts_list")).length, before);
      assert.equal(
        createHash("sha256")
          .update(await fs.readFile(path.join(root, artifact)))
          .digest("hex"),
        hash,
      );
      await page.screenshot({
        path: path.join(output, "readonly.png"),
        fullPage: true,
      });
      return {
        inspectable: true,
        saveDisabled: true,
        importDisabled: true,
        editorSaveRejected: true,
      };
    },
  );
  await step(
    "editor outage reports actionable error and retains loaded XML",
    ["AC-11-11"],
    async () => {
      await openDiagram();
      const xml = await page.locator("#drawio-xml").inputValue();
      await page.route("http://localhost:8092/**", (route) =>
        route.abort("failed"),
      );
      await page
        .getByRole("button", { name: "Открыть редактор", exact: true })
        .click();
      await page
        .locator("#notice")
        .filter({ hasText: "не подтвердил готовность" })
        .waitFor({ timeout: 25000 });
      assert.equal(await page.locator("#drawio-xml").inputValue(), xml);
      assert.equal(
        await page
          .getByRole("button", { name: "Скачать .drawio", exact: true })
          .isDisabled(),
        false,
      );
      await page.screenshot({
        path: path.join(output, "editor-unavailable.png"),
        fullPage: true,
      });
      await page.unroute("http://localhost:8092/**");
      return {
        xmlPreserved: true,
        downloadAvailable: true,
        action: "Запустите draw.io и проверьте диагностику",
      };
    },
  );
  await step(
    "recognize a new shape and dangling endpoint in UI, review imports, validate and publish explicitly",
    ["AC-11-01", "AC-11-02", "AC-11-05", "AC-11-09"],
    async () => {
      await openDiagram();
      const current = await fs.readFile(path.join(root, artifact), "utf8");
      const addition =
        '<mxCell id="qa-new" value="Tracking QA" seafId="demo.shop.tracking_qa" seafOwner="Acceptance Team" vertex="1" parent="1" style="rounded=1;html=0;"><mxGeometry x="500" y="300" width="170" height="70" as="geometry"/></mxCell><mxCell id="qa-note" value="Unmapped decoration" parent="1" custom="preserve"/><mxCell id="qa-dangling" edge="1" parent="1" source="qa-new" target="not-a-cell" value="unresolved"><mxGeometry relative="1" as="geometry"/></mxCell>';
      const imported = importDrawio(current),
        xml = exportDrawio(imported.model, {
          pageId: "qa-page",
          name: "Draw.io acceptance",
        }).replace("</root>", addition + "</root>");
      assert.equal(imported.components["demo.shop.tracking_qa"], undefined);
      await page.getByText("XML схемы", { exact: true }).click();
      await page.locator("#drawio-xml").fill(xml);
      await page
        .getByRole("button", { name: "Загрузить XML в редактор", exact: true })
        .click();
      const before = await engine.model(fixture),
        draft = await waitAPI("drawio_import", () =>
          page
            .getByRole("button", { name: "Распознать компоненты", exact: true })
            .click(),
        );
      assert.ok(draft.model.components["demo.shop.tracking_qa"]);
      assert.equal(
        Object.keys(draft.model.components).length,
        Object.keys(before.model.components).length + 1,
      );
      assert.equal(
        draft.model.components["demo.shop.tracking_qa"].links?.length || 0,
        0,
      );
      assert.ok(
        draft.warnings.some((w) => JSON.stringify(w).includes("qa-dangling")),
      );
      assert.ok(
        draft.warnings.some((w) => JSON.stringify(w).includes("qa-note")),
      );
      assert.ok(
        draft.unmapped.some(
          (item) =>
            item.cellId === "qa-note" && item.reason === "unsupported-cell",
        ),
      );
      await page
        .locator(".hint.warning")
        .filter({
          hasText:
            "Cell qa-note is not a vertex or edge; retained in source XML without a model mapping",
        })
        .waitFor();
      assert.ok(
        draft.changes.some(
          (c) =>
            c.path === "architecture/workbench.yaml" &&
            c.content.includes("demo.shop.tracking_qa"),
        ),
      );
      assert.ok(
        draft.changes.some(
          (c) =>
            c.path === "root.yaml" &&
            c.content.includes("architecture/workbench.yaml"),
        ),
      );
      assert.equal(
        (await engine.entity(fixture, "components", "demo.shop.tracking_qa"))
          .value,
        null,
      );
      await page.screenshot({
        path: path.join(output, "new-shape-preview.png"),
        fullPage: true,
      });
      const result = await validateApply();
      assert.ok(
        (await engine.entity(fixture, "components", "demo.shop.tracking_qa"))
          .value,
      );
      assert.equal(
        await fs.readFile(path.join(root, artifact), "utf8"),
        current,
        "Model synchronization must not implicitly save the canvas XML",
      );
      return {
        recognized: "demo.shop.tracking_qa",
        warning: draft.warnings,
        changes: draft.changes.map((c) => c.path),
        commit: result.applied.commit,
        reload: result.applied.reload,
        validation: result.validation,
      };
    },
  );
  report.productionUnchanged =
    (await bootstrap.git(production, ["rev-parse", "HEAD"])) ===
      productionHead &&
    (await bootstrap.fingerprint(production.root)) === productionFingerprint;
  assert.equal(report.productionUnchanged, true);
  assert.deepEqual(errors, []);
  report.errors = errors;
  report.status = "passed";
  report.completed = new Date().toISOString();
  await save();
  console.log(JSON.stringify({ ok: true, ac: report.ac, fixture: dir }));
} catch (error) {
  report.status = "failed";
  report.error = { message: error.message, stack: error.stack };
  report.errors = errors;
  await page
    ?.screenshot({ path: path.join(output, "failure.png"), fullPage: true })
    .catch(() => {});
  await fs.writeFile(
    path.join(output, "failure-text.txt"),
    (await page
      ?.locator("body")
      .innerText()
      .catch(() => "")) || "",
  );
  await save();
  console.error(error);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (app) {
    app.server.closeAllConnections();
    await new Promise((resolve) => app.server.close(resolve));
  }
  if (portalName && engine)
    await engine.docker(["rm", "-f", portalName]).catch(() => {});
}
