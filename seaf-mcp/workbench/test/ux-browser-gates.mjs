import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { Engine } from "../../engine.mjs";
import { createWorkbenchServer } from "../server.mjs";
import { createOfflineServer } from "../../../portable/offline.mjs";
import { NativeRuntime } from "../../native-runtime.mjs";
const require = createRequire(import.meta.url),
  YAML = require("yaml");
const { chromium } = require(process.env.SEAF_PLAYWRIGHT || "playwright");
const root = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../../..",
  ),
  output = path.join(root, "seaf-mcp/state/ux-browser-gates"),
  runRoot = path.join(output, "run-" + crypto.randomUUID());
const bundle = path.resolve(
  process.env.SEAF_TEST_BUNDLE || path.join(root, "dist/SEAF-Windows-x64"),
);
await fs.mkdir(runRoot, { recursive: true });
const report = {
  format: "seaf-usability-browser-gates-v1",
  status: "running",
  started: new Date().toISOString(),
  productionWrites: false,
  steps: [],
  pageErrors: [],
  externalRequests: [],
  sourceWrites: [],
};
let engine, workbench, offline, runtime, portal, browser, context, page, base;
const save = () =>
  fs.writeFile(
    path.join(output, "result.json"),
    JSON.stringify(report, null, 2) + "\n",
  );
const step = async (name, fn) => {
  const s = { name, status: "running", started: new Date().toISOString() };
  report.steps.push(s);
  await save();
  console.log("UX: " + name);
  try {
    s.result = await fn();
    s.status = "passed";
  } catch (error) {
    s.status = "failed";
    s.error = error.stack || error.message;
    if (page)
      await page
        .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
        .catch(() => {});
    throw error;
  } finally {
    s.completed = new Date().toISOString();
    await save();
  }
};
const model = (owner = "Logistics", large = false) => ({
  components: {
    qa: { title: "UX fixture", entity: "component", owner: "Engineering" },
    "qa.orders": {
      title: "Order Service",
      entity: "component",
      owner: "Commerce",
      stage: "active",
      domain: "Commerce",
      links: [{ id: "qa.delivery", title: "Dispatch order", protocol: "REST" }],
    },
    "qa.delivery": {
      title: "Delivery Service",
      entity: "component",
      owner,
      description: "Доставка заказов",
      stage: "active",
      domain: "Logistics",
      custom: { preserve: true },
    },
    "qa.payments": {
      title: "Payment Service",
      entity: "component",
      owner: "Payments",
      stage: "planned",
      domain: "Commerce",
    },
    ...(large
      ? {
          system: {
            title: "Системы нагрузочной модели",
            entity: "component",
            owner: "Engineering",
          },
          ...Object.fromEntries(
            Array.from({ length: 1501 }, (_, i) => [
              "system." + i,
              {
                title: "Система " + i,
                entity: "component",
                owner: i % 2 ? "Engineering" : "Operations",
                stage: i % 3 ? "active" : "planned",
                domain: i % 5 ? "Commerce" : "Core",
              },
            ]),
          ),
        }
      : {}),
  },
  contexts: {
    "qa.all": {
      title: "Все системы",
      location: "UX fixture/All systems",
      presentation: "plantuml",
      components: ["qa", "qa.*", ...(large ? ["system", "system.*"] : [])],
    },
  },
  docs: {
    "qa.checkout": {
      title: "Оформление заказа",
      location: "UX fixture/Checkout",
      type: "markdown",
      source: "docs/checkout.md",
    },
  },
  entities: {
    components: {
      title: "Системы и компоненты",
      schema: {
        type: "object",
        patternProperties: {
          ".*": {
            type: "object",
            required: ["title", "owner"],
            properties: {
              title: { type: "string", title: "Название" },
              owner: {
                type: "string",
                title: "Владелец",
                description: "Ответственная команда",
              },
              description: { type: "string" },
              stage: { type: "string", enum: ["active", "planned"] },
              domain: { type: "string" },
            },
            additionalProperties: true,
          },
        },
      },
    },
  },
  rules: {
    validators: {
      "qa.owner": {
        title: "Разрешённый владелец",
        source:
          '([components.$spread().($id := $keys()[0]; $c := $lookup($,$id); {"id":$id,"owner":$c.owner})[owner="InvalidTeam"].{"uid":"ux-owner-" & id,"description":"Владелец " & id & " не разрешён","location":"/entities/components/blank?dh-component-id=" & id,"property":"owner"}])',
      },
    },
  },
});
async function fixture(
  name,
  { owner = "Logistics", large = false, git = false } = {},
) {
  const directory = path.join(runRoot, name);
  await fs.mkdir(path.join(directory, "docs"), { recursive: true });
  await fs.writeFile(
    path.join(directory, "root.yaml"),
    YAML.stringify(model(owner, large)),
  );
  await fs.writeFile(
    path.join(directory, "docs/checkout.md"),
    "# Оформление заказа\n\n```mermaid\nsequenceDiagram\n participant Orders as qa.orders\n participant Delivery as qa.delivery\n Orders->>Delivery: Dispatch order\n alt delivery unavailable\n Delivery-->>Orders: Rejected\n else accepted\n Delivery-->>Orders: Tracking created\n end\n```\n",
  );
  if (git) {
    await engine.git({ root: directory }, ["init", "-b", "main"]);
    await engine.git({ root: directory }, [
      "add",
      "root.yaml",
      "docs/checkout.md",
    ]);
    await engine.git({ root: directory }, [
      "-c",
      "user.name=SEAF UX QA",
      "-c",
      "user.email=qa@localhost",
      "commit",
      "-m",
      "Create isolated usability fixture",
    ]);
  }
  return directory;
}
async function api(action, args = {}) {
  const session = await fetch(base + "/api/session").then((r) => r.json());
  const response = await fetch(base + "/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SEAF-CSRF": session.csrf,
    },
    body: JSON.stringify({ project: "ux-local", action, ...args }),
  });
  const result = await response.json();
  if (!result.ok) throw Error(result.error);
  return result.result;
}
async function idle() {
  await page.locator("#progress").waitFor({ state: "hidden", timeout: 120000 });
  await page.waitForFunction(
    () => !(Number(document.documentElement.dataset.pendingUiTasks) || 0),
    {},
    { timeout: 120000 },
  );
}
async function closeResult() {
  const dialog = page.locator("#result-dialog[open]");
  if (await dialog.count())
    await page.getByRole("button", { name: "Закрыть", exact: true }).click();
}
async function nav(name) {
  await closeResult();
  await page
    .locator("#navigation")
    .getByRole("button", { name, exact: true })
    .click();
  await idle();
}
async function owner(value) {
  const field = page.locator('[data-editor-field="owner"]');
  if ((await field.evaluate((el) => el.tagName)) === "SELECT")
    await field.selectOption(JSON.stringify(value));
  else await field.fill(value);
}
async function select(id) {
  await closeResult();
  await page.locator("#project").selectOption(id);
  await idle();
  await page.waitForFunction(
    (expected) => document.querySelector("#project").value === expected,
    id,
  );
}
async function editDelivery() {
  await nav("Редактор");
  await page.locator("#filter").fill("qa.delivery");
  await page.locator('tr[data-object="qa.delivery"]').click();
  await idle();
  await page.locator('[data-editor-field="owner"]').waitFor();
}
async function actionResponse(action, click) {
  const pending = page.waitForResponse(
    (r) => {
      try {
        return (
          r.url().endsWith("/api/action") &&
          r.request().method() === "POST" &&
          r.request().postDataJSON().action === action
        );
      } catch {
        return false;
      }
    },
    { timeout: 120000 },
  );
  await click();
  const response = await pending,
    result = await response.json();
  assert.equal(result.ok, true, result.error);
  await idle();
  return result.result;
}
try {
  engine = new Engine(
    path.join(runRoot, "projects.json"),
    path.join(runRoot, "state"),
  );
  const local = await fixture("Локальный проект 1505 систем", { large: true }),
    git = await fixture("Git project", { owner: "GitTeam", git: true }),
    readonly = await fixture("Read only", { owner: "ReadOnly" });
  offline = await createOfflineServer({
    assetsRoot: path.join(bundle, "runtime/offline"),
    port: 0,
  });
  Object.assign(process.env, {
    SEAF_PORTABLE_ROOT: bundle,
    SEAF_OFFLINE_URL: offline.url,
    SEAF_DRAWIO_URL: offline.url + "/?embed=1&proto=json&offline=1",
  });
  const config = {
    activeProject: "ux-local",
    projects: [
      ["ux-local", local, "directory", true],
      ["ux-git", git, "git", true],
      ["ux-readonly", readonly, "directory", false],
    ].map(([id, source, kind, writable]) => ({
      id,
      title: id,
      root: source,
      manifest: "root.yaml",
      source: { kind, provider: "local" },
      writable,
      validation: {
        runtime: "native",
        workspace: source,
        manifest: "workspace/root.yaml",
        native: {
          bundleRoot: bundle,
          stateRoot: path.join(runRoot, "native"),
          offlineUrl: offline.url,
        },
      },
    })),
  };
  await fs.writeFile(engine.configFile, JSON.stringify(config, null, 2));
  workbench = await createWorkbenchServer({
    port: 0,
    engine,
    specRoot: path.join(root, "openspec"),
    editorUrl: process.env.SEAF_DRAWIO_URL,
  });
  base = "http://127.0.0.1:" + workbench.server.address().port;
  runtime = new NativeRuntime({
    bundleRoot: bundle,
    stateRoot: path.join(runRoot, "portal"),
    offlineUrl: offline.url,
  });
  portal = await runtime.start({
    workspace: local,
    manifest: "workspace/root.yaml",
  });
  await engine.updateProject("ux-local", { portal: portal.url });
  const baselineValidation = await runtime.validate({
    workspace: local,
    manifest: "workspace/root.yaml",
  });
  assert.equal(
    baselineValidation.ok,
    true,
    JSON.stringify(baselineValidation.problems),
  );
  report.baselineValidation = {
    ok: baselineValidation.ok,
    rules: baselineValidation.rules,
  };
  const originalLocal = await engine.fingerprint(local),
    originalGit = await engine.git({ root: git }, ["rev-parse", "HEAD"]);
  browser = await chromium.launch({
    headless: true,
    executablePath:
      process.env.SEAF_CHROME_EXECUTABLE ||
      "C:/Program Files/Google/Chrome/Application/chrome.exe",
  });
  context = await browser.newContext({
    viewport: { width: 1680, height: 1150 },
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
  page.on("pageerror", (e) => report.pageErrors.push(e.message));
  await page.goto(base + "/?view=objects");
  await idle();
  await page
    .getByRole("heading", { name: "Редактор объектов", exact: true })
    .waitFor();
  await step(
    "1. Full 1506-object catalog: pagination, filters, columns, saved views",
    async () => {
      assert.match(await page.locator("#catalog-total").innerText(), /1506/);
      await page.locator("#catalog-sort").selectOption("id");
      await idle();
      for (let i = 0; i < 30; i++)
        await page.locator('[data-act="ux-page-next"]').click();
      await page.locator('tr[data-object="system.1500"]').waitFor();
      assert.match(
        await page.locator(".catalog-pagination").innerText(),
        /31 из 31/,
      );
      await page.locator("#catalog-owner").selectOption("Operations");
      await page.locator("#catalog-domain").selectOption("Core");
      await idle();
      assert.ok((await page.locator("tr[data-object]").count()) > 0);
      await page.locator(".column-options summary").click();
      await page.locator('[data-column="status"]').check();
      await idle();
      assert.ok(
        await page
          .getByRole("columnheader", { name: "Статус", exact: true })
          .count(),
      );
      page.once("dialog", (d) => d.accept("Operations Core"));
      await page.locator('[data-act="ux-save-view"]').click();
      await idle();
      assert.match(
        await page.locator("#catalog-view").innerText(),
        /Operations Core/,
      );
      await page.locator('[data-act="ux-clear-filters"]').click();
      await idle();
      await page
        .locator("#catalog-view")
        .selectOption({ label: "Operations Core" });
      await idle();
      assert.equal(
        await page.locator("#catalog-owner").inputValue(),
        "Operations",
      );
      await page.locator('[data-act="ux-clear-filters"]').click();
      return { total: 1506, lastPageReached: true, savedView: true };
    },
  );
  await step(
    "2. Ctrl+K search finds owners and source-document text",
    async () => {
      await page.keyboard.press("Control+k");
      await page.locator("#global-search").fill("Logistics");
      await page
        .locator(".search-result")
        .filter({ hasText: "Delivery Service" })
        .waitFor();
      await page
        .locator(".search-result")
        .filter({ hasText: "Delivery Service" })
        .first()
        .click();
      await idle();
      await page
        .getByRole("heading", { name: "Delivery Service", exact: true })
        .waitFor();
      await page.locator("#search-open").click();
      await page.locator("#global-search").fill("Tracking created");
      await page
        .locator(".search-result")
        .filter({ hasText: "docs/checkout.md" })
        .waitFor();
      await page.keyboard.press("Escape");
      return { objectFound: true, sourceTextFound: true };
    },
  );
  await step(
    "3. Read-only passport and favorites/recent/permalink restore",
    async () => {
      assert.match(
        await page.locator(".passport-properties").innerText(),
        /Logistics/,
      );
      assert.match(await page.locator("#main").innerText(), /Order Service/);
      await page.locator('[data-act="ux-favorite"]').click();
      await nav("Моя работа");
      await page
        .locator("#main")
        .getByRole("button", { name: /Delivery Service/ })
        .first()
        .click();
      await idle();
      assert.ok(page.url().includes("object=qa.delivery"));
      await page.reload();
      await idle();
      await page
        .getByRole("heading", { name: "Delivery Service", exact: true })
        .waitFor();
      assert.match(
        await page.locator('[data-act="ux-favorite"]').innerText(),
        /В избранном/,
      );
      return { favoriteRestored: true, permalink: page.url() };
    },
  );
  await step(
    "4. Visible project mode, source, revision and read capability",
    async () => {
      const text = await page.locator("#project-context").innerText();
      assert.match(text, /ux-local/);
      assert.match(text, /Локальная папка/);
      assert.match(text, /Чтение и запись/);
      assert.match(text, /Версия/);
      assert.equal(await engine.fingerprint(local), originalLocal);
      assert.equal(
        await engine.git({ root: git }, ["rev-parse", "HEAD"]),
        originalGit,
      );
      return { sourceUnchanged: true };
    },
  );
  await step(
    "5. Field autosave, undo/redo, invalid JSON and cross-object recovery",
    async () => {
      await editDelivery();
      await owner("Platform");
      await page.locator('[data-act="ux-undo"]').click();
      await idle();
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "Logistics",
      );
      await page.locator('[data-act="ux-redo"]').click();
      await idle();
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "Platform",
      );
      await page.locator("#object-json").fill('{"owner":');
      await nav("Моя работа");
      await nav("Редактор");
      assert.equal(
        await page.locator("#object-json").inputValue(),
        '{"owner":',
      );
      await page.reload();
      await idle();
      assert.equal(
        await page.locator("#object-json").inputValue(),
        '{"owner":',
      );
      await page
        .locator("#object-json")
        .fill(
          JSON.stringify({
            ...model().components["qa.delivery"],
            owner: "Platform",
          }),
        );
      await page.locator("#filter").fill("qa.orders");
      await page.locator('tr[data-object="qa.orders"]').click();
      await idle();
      await page.locator("#filter").fill("qa.delivery");
      await page.locator('tr[data-object="qa.delivery"]').click();
      await idle();
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "Platform",
      );
      assert.equal(await engine.fingerprint(local), originalLocal);
      return {
        undoRedo: true,
        incompleteInputRecovered: true,
        perEntityRecovered: true,
      };
    },
  );
  await step(
    "6. Project-specific preferences and incomplete text stay isolated",
    async () => {
      await select("ux-git");
      await editDelivery();
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "GitTeam",
      );
      assert.equal(
        await page
          .locator("#navigation .memory-link")
          .filter({ hasText: "Delivery" })
          .count(),
        1,
      );
      await select("ux-local");
      await nav("Редактор");
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "Platform",
      );
      return { isolation: true };
    },
  );
  await step(
    "7. Human validation issue opens owner; edit invalidates old validation",
    async () => {
      await owner("InvalidTeam");
      await actionResponse("object_propose", () =>
        page.locator('[data-act="object-propose"]').click(),
      );
      const bad = await actionResponse("validate", () =>
        page.locator('[data-act="validate-active"]').click(),
      );
      assert.equal(bad.ok, false);
      await page
        .locator(".validation-issue")
        .filter({ hasText: "не разрешён" })
        .waitFor();
      await page.locator('[data-act="ux-fix-issue"]').first().click();
      await idle();
      assert.equal(
        await page
          .locator('[data-editor-field="owner"]')
          .evaluate((el) => el === document.activeElement),
        true,
      );
      await owner("Logistics");
      await actionResponse("object_propose", () =>
        page.locator('[data-act="object-propose"]').click(),
      );
      const good = await actionResponse("validate", () =>
        page.locator('[data-act="validate-active"]').click(),
      );
      assert.equal(good.ok, true);
      assert.equal(
        await page.locator('[data-act="apply-active"]').isEnabled(),
        true,
      );
      await owner("Engineering");
      assert.equal(
        await page.locator('[data-act="apply-active"]').isDisabled(),
        true,
      );
      assert.match(await page.locator("#project-context").innerText(), /Форма/);
      assert.equal(await engine.fingerprint(local), originalLocal);
      return { issueLinked: true, validationInvalidated: true };
    },
  );
  await step(
    "8. Guided system creation produces one atomic model draft, no implicit save",
    async () => {
      await nav("Моя работа");
      await page.locator('[data-act="ux-wizard"]').click();
      await idle();
      await page.locator("#wizard-id").fill("qa.notifications");
      await page.locator("#wizard-title").fill("Notification Service");
      await page.locator('[data-act="ux-wizard-next"]').click();
      await page.locator("#wizard-owner").fill("Engineering");
      await page.locator("#wizard-description").fill("Отправляет оповещения");
      await page.locator('[data-act="ux-wizard-next"]').click();
      await page.locator("#wizard-target").selectOption("qa.orders");
      await page.locator("#wizard-link-title").fill("Read order");
      await page.locator('[data-act="ux-wizard-add-link"]').click();
      await page.locator('[data-act="ux-wizard-next"]').click();
      await page.locator("#wizard-context").selectOption("qa.all");
      const draft = await actionResponse("object_propose", () =>
        page.locator('[data-act="ux-wizard-stage"]').click(),
      );
      assert.equal(draft.operations.length, 2);
      assert.equal(await engine.fingerprint(local), originalLocal);
      const validation = await actionResponse("validate", () =>
        page.locator('[data-act="validate-active"]').click(),
      );
      assert.equal(validation.ok, true, JSON.stringify(validation.problems));
      const applied = await actionResponse("apply", () =>
        page.locator('[data-act="apply-active"]').click(),
      );
      assert.equal(applied.revision.kind, "directory");
      report.sourceWrites.push({
        project: "isolated ux-local",
        kind: applied.revision.kind,
        revision: applied.revision.id,
      });
      await closeResult();
      const after = await engine.model("ux-local");
      assert.equal(
        after.model.components["qa.notifications"].links[0].id,
        "qa.orders",
      );
      assert.ok(
        after.model.contexts["qa.all"].components.includes("qa.notifications"),
      );
      return { atomicOperations: 2, localRevision: applied.revision.id };
    },
  );
  await step(
    "9. Scenario walkthrough reads source Mermaid and supports manual existing links",
    async () => {
      await nav("Сценарии");
      await page
        .locator("#scenario-select option")
        .filter({ hasText: "Оформление заказа" })
        .waitFor({ state: "attached" });
      await page
        .locator("#scenario-select")
        .selectOption({ label: "Оформление заказа" });
      await page.locator(".walk-step").waitFor();
      assert.match(
        await page.locator(".walk-step").innerText(),
        /Dispatch order/,
      );
      await page.locator('[data-act="ux-scenario-next"]').click();
      assert.match(await page.locator(".walk-controls").innerText(), /Шаг 2/);
      await page.locator("#scenario-select").selectOption("__manual__");
      await page.locator('[data-act="ux-scenario-add"]').click();
      assert.match(
        await page.locator(".walk-controls").innerText(),
        /Шаг 1 из 1/,
      );
      return { sourceSteps: true, manualExistingLink: true };
    },
  );
  await step(
    "10. Accessible required fields, advanced toggle and custom property preservation",
    async () => {
      await editDelivery();
      const title = page.locator('[data-editor-field="title"]');
      assert.equal(await title.getAttribute("aria-required"), "true");
      assert.ok(await title.getAttribute("aria-describedby"));
      await page.locator('[data-editor-field="owner"]').fill("");
      await page.locator('[data-act="object-propose"]').click();
      await page
        .locator(".field-error")
        .filter({ hasText: "Владелец" })
        .waitFor();
      await owner("Logistics");
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).custom
          .preserve,
        true,
      );
      await page.locator("#advanced-editor summary").click();
      assert.equal(await page.locator("#object-json").isVisible(), false);
      await page.locator("#advanced-editor summary").click();
      assert.equal(await page.locator("#object-json").isVisible(), true);
      return {
        accessibleLabels: true,
        requiredFeedback: true,
        unknownRetained: true,
      };
    },
  );
  await step(
    "11. Read-only project stays protected and does not inherit another project form",
    async () => {
      await select("ux-readonly");
      await editDelivery();
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "ReadOnly",
      );
      assert.equal(
        await page.locator('[data-act="object-propose"]').isDisabled(),
        true,
      );
      assert.match(
        await page.locator("#project-context").innerText(),
        /Только чтение/,
      );
      return { protected: true };
    },
  );
  await step(
    "12. Portal search URL opens the palette while an untrusted self-message does not",
    async () => {
      await page.goto(base + "/?view=home&palette=1");
      await idle();
      await page.locator("#search-dialog[open]").waitFor();
      await page.locator("#search-close").click();
      await page.locator("#search-dialog").waitFor({ state: "hidden" });
      await page.evaluate(() =>
        window.postMessage({ type: "seaf-open-search" }, location.origin),
      );
      await page.waitForTimeout(80);
      assert.equal(
        await page.locator("#search-dialog").evaluate((el) => el.open),
        false,
      );
      return { paletteURL: true, spoofRejected: true };
    },
  );
  await step(
    "13. Storage failure is explicit, retains input and permits raw recovery export",
    async () => {
      const previousPage = page,
        before = await engine.fingerprint(local),
        failureContext = await browser.newContext({
          viewport: { width: 1680, height: 1150 },
          serviceWorkers: "block",
          acceptDownloads: true,
        });
      await failureContext.addInitScript(() => {
        Object.defineProperty(window, "indexedDB", {
          value: undefined,
          configurable: true,
        });
        Storage.prototype.setItem = function () {
          throw new DOMException(
            "Storage quota exceeded",
            "QuotaExceededError",
          );
        };
      });
      page = await failureContext.newPage();
      page.on("pageerror", (error) => report.pageErrors.push(error.message));
      await page.goto(base + "/?view=objects&project=ux-local");
      await idle();
      await editDelivery();
      await owner("QuotaRecovery");
      await page
        .locator("#autosave-status")
        .filter({ hasText: "Локальное сохранение не удалось" })
        .waitFor();
      await nav("Моя работа");
      await page
        .getByRole("heading", { name: "Редактор объектов", exact: true })
        .waitFor();
      assert.equal(
        JSON.parse(await page.locator("#object-json").inputValue()).owner,
        "QuotaRecovery",
      );
      const downloaded = page.waitForEvent("download");
      await page.locator('[data-act="ux-export-text"]').click();
      const download = await downloaded,
        bytes = await fs.readFile(await download.path(), "utf8"),
        exported = JSON.parse(bytes);
      assert.equal(exported.format, "seaf-editor-text-v1");
      assert.equal(JSON.parse(exported.editorValue).owner, "QuotaRecovery");
      assert.equal(await engine.fingerprint(local), before);
      await page.screenshot({
        path: path.join(output, "storage-failure.png"),
        fullPage: true,
      });
      await failureContext.close();
      page = previousPage;
      return {
        failureVisible: true,
        navigationRetainedInput: true,
        recoveryDownload: true,
        sourceUnchanged: true,
      };
    },
  );
  assert.equal(
    await engine.git({ root: git }, ["rev-parse", "HEAD"]),
    originalGit,
  );
  assert.deepEqual(report.pageErrors, []);
  assert.deepEqual(report.externalRequests, []);
  report.status = "PASS";
  await page.screenshot({
    path: path.join(output, "final.png"),
    fullPage: true,
  });
} catch (error) {
  report.status = "FAIL";
  report.error = error.stack || error.message;
  process.exitCode = 1;
} finally {
  await browser?.close();
  if (workbench) {
    workbench.server.closeAllConnections?.();
    await new Promise((resolve) => workbench.server.close(resolve));
  }
  for (const r of engine?.runtimes?.values() || [])
    await r.closeAll().catch(() => {});
  await runtime?.closeAll().catch(() => {});
  await offline?.stop().catch(() => {});
  report.completed = new Date().toISOString();
  await save();
  console.log(
    JSON.stringify({
      status: report.status,
      steps: report.steps.map((s) => ({ name: s.name, status: s.status })),
      pageErrors: report.pageErrors.length,
      error: report.error,
      receipt: path.join(output, "result.json"),
    }),
  );
}
