/** Actual browser fault injection and full UI → Git → real SEAF reload.
 * Production architecture is read only. All writes target a separate Git root.
 */
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { randomUUID } from "node:crypto";
import YAML from "yaml";
import { Engine } from "../../engine.mjs";
import { createWorkbenchServer } from "../server.mjs";
const require = createRequire(import.meta.url),
  { chromium } = require(
    path.resolve(path.dirname(process.execPath), "../node_modules/playwright"),
  );
const service = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../..",
  ),
  output = path.join(service, "state", "acceptance"),
  dir = path.join(output, "browser-" + randomUUID()),
  workspace = path.join(dir, "workspace"),
  root = path.join(workspace, "microservices-demo");
await fs.mkdir(dir, { recursive: true });
const report = {
    started: new Date().toISOString(),
    fixture: dir,
    productionWrites: false,
    steps: [],
  },
  reportFile = path.join(output, "browser-gates.json");
const save = () => fs.writeFile(reportFile, JSON.stringify(report, null, 2));
const bootstrap = new Engine(
    path.join(service, "projects.json"),
    path.join(dir, "bootstrap"),
  ),
  production = await bootstrap.project("shopflow"),
  productionHead = await bootstrap.git(production, ["rev-parse", "HEAD"]),
  productionFingerprint = await bootstrap.fingerprint(production.root);
let engine,
  server,
  browser,
  page,
  context,
  container,
  base,
  config,
  configFile,
  originalDelivery;
const errors = [];
const step = async (name, ac, run) => {
  const entry = {
    name,
    ac,
    status: "running",
    started: new Date().toISOString(),
  };
  report.steps.push(entry);
  await save();
  console.log("Browser QA: " + name);
  try {
    entry.result = await run();
    entry.status = "passed";
  } catch (e) {
    entry.status = "failed";
    entry.error = e.stack || e.message;
    if (page)
      await page
        .screenshot({ path: path.join(dir, "failure.png"), fullPage: true })
        .catch(() => {});
    throw e;
  } finally {
    await save();
  }
};
async function ready(url) {
  for (let i = 0; i < 90; i++) {
    try {
      if (
        (await fetch(url + "/health", { signal: AbortSignal.timeout(1500) })).ok
      )
        return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 400));
  }
  throw Error("Portal did not become ready");
}
async function api(action, args = {}) {
  const s = await fetch(base + "/api/session").then((r) => r.json()),
    r = await fetch(base + "/api/action", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-SEAF-CSRF": s.csrf },
      body: JSON.stringify({ action, project: "acme", ...args }),
    }),
    body = await r.json();
  if (!body.ok) throw Error(body.error);
  return body.result;
}
async function open(ctx) {
  const p = await ctx.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  await p.goto(base + "/");
  await p
    .getByRole("heading", { name: "Редактор объектов", exact: true })
    .waitFor();
  await p.locator("#connection").filter({ hasText: "Подключено" }).waitFor();
  await p.locator("#progress").waitFor({ state: "hidden" });
  return p;
}
const nav = async (name, p = page) => {
  await p.getByRole("button", { name, exact: true }).click();
  await p.locator("#progress").waitFor({ state: "hidden" });
};
async function edit(id, value, p = page) {
  await nav("Объекты", p);
  await p.locator("#filter").fill(id);
  await p.locator(`tr[data-object="${id}"]`).click();
  await p.locator("#object-json").fill(JSON.stringify(value));
}
async function downloadDraft(p, button) {
  const pending = p.waitForEvent("download");
  await p.getByRole("button", { name: button, exact: true }).click();
  const downloaded = await pending,
    file = path.join(dir, "draft-" + randomUUID() + ".json");
  await downloaded.saveAs(file);
  return { file, draft: JSON.parse(await fs.readFile(file, "utf8")) };
}
async function importDraft(p, draft) {
  await nav("Черновики", p);
  await p.locator("#draft-file").setInputFiles({
    name: "exchange.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(draft)),
  });
}
async function assertNotice(p, text) {
  await p.locator("#notice").filter({ hasText: text }).waitFor();
  return p.locator("#notice").innerText();
}
try {
  await step("isolated architecture and actual SEAF portal", [], async () => {
    await bootstrap.copyArtifacts(production.validation.workspace, workspace);
    for (const file of await bootstrap.files(root)) {
      const f = await bootstrap.safe(root, file);
      await fs.writeFile(
        f,
        (await fs.readFile(f, "utf8"))
          .replaceAll("demo\\.shop", "acme\\.shop")
          .replaceAll("demo.shop", "acme.shop"),
      );
    }
    const doc = YAML.parseDocument(
      await fs.readFile(
        path.join(root, "architecture/components.yaml"),
        "utf8",
      ),
    );
    for (let i = 0; i < 100; i++)
      doc.setIn(["components", "acme.unrelated." + i], {
        title: "Unrelated " + i,
        entity: "component",
        owner: "QA",
        description: "Disconnected rendering fixture",
      });
    await fs.writeFile(
      path.join(root, "architecture/components.yaml"),
      doc.toString(),
    );
    doc.setIn(["components", "acme"], {
      title: "Acme QA",
      entity: "component",
      owner: "QA",
      description: "QA namespace",
    });
    doc.setIn(["components", "acme.unrelated"], {
      title: "Unrelated group",
      entity: "component",
      owner: "QA",
      description: "Disconnected QA namespace",
    });
    doc.setIn(["aspects", "acme"], {
      title: "Acme aspects",
      location: "Acme QA",
    });
    await fs.writeFile(
      path.join(root, "architecture/components.yaml"),
      doc.toString(),
    );
    const contexts = YAML.parseDocument(
      await fs.readFile(path.join(root, "architecture/contexts.yaml"), "utf8"),
    );
    contexts.setIn(["contexts", "acme"], {
      title: "Acme QA all",
      presentation: "smartants",
      components: Object.keys(doc.get("components").toJSON()),
    });
    await fs.writeFile(
      path.join(root, "architecture/contexts.yaml"),
      contexts.toString(),
    );
    const docs = YAML.parseDocument(
      await fs.readFile(path.join(root, "docs.yaml"), "utf8"),
    );
    docs.setIn(["docs", "acme.qa.conflict"], {
      title: "QA owner claims",
      type: "markdown",
      source: "docs/browser-qa.md",
    });
    await fs.writeFile(path.join(root, "docs.yaml"), docs.toString());
    await fs.writeFile(
      path.join(root, "docs/browser-qa.md"),
      "# Explicit owner claims\n\n| Component | Owner |\n| --- | --- |\n| acme.shop.delivery | Legacy Logistics |\n",
    );
    configFile = path.join(dir, "projects.json");
    config = {
      projects: [
        {
          id: "acme",
          title: "Acme browser QA",
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
          id: "acme-reference",
          title: "Acme read-only",
          root,
          manifest: "root.yaml",
          writable: false,
          validation: {
            workspace,
            manifest: "workspace/root.yaml",
            image: "seaf-local:2026.33.0-workbench",
          },
        },
      ],
    };
    await fs.writeFile(configFile, JSON.stringify(config));
    engine = new Engine(configFile, path.join(dir, "proposals"));
    const p = await engine.project("acme");
    await engine.git(p, ["init", "-b", "main"]);
    await engine.git(p, ["add", "."]);
    await engine.git(p, [
      "-c",
      "user.name=Browser QA",
      "-c",
      "user.email=browser@localhost",
      "commit",
      "-m",
      "Isolated browser baseline",
    ]);
    container = "seaf-browser-" + randomUUID();
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
      "VUE_APP_DOCHUB_BACKEND_PORT=8080",
      "-e",
      "VUE_APP_DOCHUB_ROOT_MANIFEST=workspace/root.yaml",
      "-v",
      workspace + ":/var/www/public/workspace:ro",
      "seaf-local:2026.33.0-workbench",
    ]);
    const binding = (
      await engine.docker(["port", container, "8080/tcp"])
    ).stdout.trim();
    config.projects.forEach((p) => (p.portal = "http://" + binding));
    await fs.writeFile(configFile, JSON.stringify(config));
    await ready(config.projects[0].portal);
    ({ server } = await createWorkbenchServer({
      port: 0,
      engine,
      state: path.join(dir, "workbench"),
      specRoot: null,
    }));
    base = "http://127.0.0.1:" + server.address().port;
    browser = await chromium.launch({
      executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
      headless: true,
    });
    context = await browser.newContext({
      viewport: { width: 1550, height: 1100 },
    });
    page = await open(context);
    return {
      base,
      portal: config.projects[0].portal,
      head: await engine.git(p, ["rev-parse", "HEAD"]),
    };
  });
  let exchanged;
  await step(
    "offline durable draft, portable JSON and fresh session restore",
    ["AC-01-01", "AC-01-03", "AC-01-05"],
    async () => {
      await edit("acme.shop.delivery", {
        owner: "Browser Offline Logistics",
      });
      await page.evaluate(() => navigator.serviceWorker.ready);
      await page.reload();
      await page
        .getByRole("heading", { name: "Редактор объектов", exact: true })
        .waitFor();
      await edit("acme.shop.delivery", {
        owner: "Browser Offline Logistics",
      });
      await context.setOffline(true);
      await page
        .getByRole("button", { name: "Сохранить локально", exact: true })
        .click();
      await assertNotice(page, "Черновик сохранён в браузере");
      exchanged = await downloadDraft(page, "Экспорт черновика");
      assert.equal(exchanged.draft.format, "seaf-draft-v1");
      assert.equal(exchanged.draft.project, "acme");
      assert.equal(
        exchanged.draft.operations[0].value.owner,
        "Browser Offline Logistics",
      );
      await page.close();
      page = await context.newPage();
      await page.goto(base + "/");
      await page
        .getByRole("heading", { name: "Редактор объектов", exact: true })
        .waitFor();
      await nav("Черновики");
      await page
        .getByRole("button", { name: "Открыть", exact: true })
        .first()
        .click();
      await page
        .getByText("Предварительный просмотр", { exact: true })
        .waitFor();
      assert.ok(
        (await page.locator("body").innerText()).includes(
          exchanged.draft.baseHead.slice(0, 12),
        ),
      );
      await context.setOffline(false);
      await page.getByRole("button", { name: "Обновить", exact: true }).click();
      await page
        .locator("#connection")
        .filter({ hasText: "Подключено" })
        .waitFor();
      await page.locator("#progress").waitFor({ state: "hidden" });
      const fresh = await browser.newContext();
      const freshPage = await open(fresh);
      await importDraft(freshPage, exchanged.draft);
      await assertNotice(freshPage, "Черновик импортирован");
      const exported = await downloadDraft(freshPage, "Экспорт черновика");
      assert.deepEqual(exported.draft.operations, exchanged.draft.operations);
      assert.equal(exported.draft.baseHead, exchanged.draft.baseHead);
      assert.equal(
        exported.draft.baseFingerprint,
        exchanged.draft.baseFingerprint,
      );
      await fresh.close();
      return {
        format: exchanged.draft.format,
        project: exchanged.draft.project,
        baseHead: exchanged.draft.baseHead,
        operations: exchanged.draft.operations,
      };
    },
  );
  await step(
    "incompatible, malformed and stale imported drafts are rejected",
    ["AC-01-04", "AC-01-06"],
    async () => {
      const rejected = [];
      for (const [patch, message] of [
        [{ format: "seaf-draft-v99" }, "Неподдерживаемая версия"],
        [{ project: "other" }, "Черновик относится к проекту"],
        [{ operations: [{}] }, "Некорректная операция"],
        [{ baseFingerprint: "" }, "исходная версия"],
      ]) {
        await importDraft(page, { ...exchanged.draft, ...patch });
        rejected.push(await assertNotice(page, message));
      }
      await importDraft(page, {
        ...exchanged.draft,
        baseFingerprint: "0".repeat(64),
      });
      await assertNotice(page, "Черновик импортирован");
      await page
        .getByRole("button", { name: "Проверить в SEAF", exact: true })
        .click();
      await assertNotice(page, "Исходная модель изменилась");
      assert.equal(
        await page
          .getByRole("button", {
            name: "Сохранить в Git и обновить SEAF",
            exact: true,
          })
          .isDisabled(),
        true,
      );
      return { rejected, stale: "publication refused" };
    },
  );
  await step(
    "unavailable storage and exhausted IndexedDB quota preserve explicit export",
    ["AC-01-02"],
    async () => {
      const receipts = [];
      for (const mode of ["unavailable", "quota"]) {
        const ctx = await browser.newContext();
        await ctx.addInitScript((mode) => {
          if (mode === "unavailable") {
            Object.defineProperty(window, "indexedDB", {
              get() {
                throw new DOMException("Storage blocked", "SecurityError");
              },
            });
            Object.defineProperty(window, "localStorage", {
              get() {
                throw new DOMException("Storage blocked", "SecurityError");
              },
            });
          } else {
            window.__quotaFail = false;
            const put = IDBObjectStore.prototype.put;
            IDBObjectStore.prototype.put = function (...args) {
              if (window.__quotaFail)
                throw new DOMException("Quota exhausted", "QuotaExceededError");
              return put.apply(this, args);
            };
          }
        }, mode);
        const p = await open(ctx);
        if (mode === "quota")
          await p.evaluate(() => (window.__quotaFail = true));
        await edit(
          "acme.shop.delivery",
          { owner: "Export despite " + mode },
          p,
        );
        await p
          .getByRole("button", { name: "Сохранить локально", exact: true })
          .click();
        const notice = await assertNotice(p, "Не удалось сохранить данные");
        assert.equal(await p.locator("#connection").innerText(), "Подключено");
        assert.ok(
          !(await p.locator("#notice").innerText()).includes(
            "Черновик сохранён",
          ),
        );
        const exported = await downloadDraft(p, "Экспорт JSON");
        assert.equal(
          exported.draft.operations[0].value.owner,
          "Export despite " + mode,
        );
        receipts.push({
          mode,
          notice,
          exported: true,
          baseHead: exported.draft.baseHead,
        });
        await ctx.close();
      }
      return receipts;
    },
  );
  await step(
    "diagnostics retains independent failures and retry returns to ready",
    ["AC-02-01", "AC-02-03", "AC-02-04", "AC-02-05", "AC-02-06"],
    async () => {
      await page.getByRole("button", { name: "Обновить", exact: true }).click();
      await page
        .locator("#connection")
        .filter({ hasText: "Подключено" })
        .waitFor();
      await nav("Диагностика");
      const original = structuredClone(config);
      config.projects[0].validation.image = "seaf-missing-browser-qa:never";
      config.projects[0].portal = "http://127.0.0.1:1";
      await fs.writeFile(configFile, JSON.stringify(config));
      await page
        .getByRole("button", { name: "Проверить всё", exact: true })
        .click();
      await page
        .getByText(
          "Устраните отмеченные проблемы перед применением изменений",
          { exact: true },
        )
        .waitFor();
      const failure = await page.locator("body").innerText();
      assert.ok(failure.includes("Образ SEAF"));
      assert.ok(failure.includes("Ошибка"));
      assert.ok(failure.includes("Готово"));
      config = original;
      await fs.writeFile(configFile, JSON.stringify(config));
      await page
        .getByRole("button", { name: "Проверить всё", exact: true })
        .click();
      await page.getByText("Среда готова к работе", { exact: true }).waitFor();
      return { failure, retry: "ready" };
    },
  );
  await step(
    "read-only project browsing and write controls across all views",
    ["AC-02-02", "AC-06-06", "AC-INT-03"],
    async () => {
      await page.locator("#project").selectOption("acme-reference");
      await page
        .getByText("Проект подключён только для чтения.", { exact: false })
        .waitFor();
      const p = await engine.project("acme"),
        before = await engine.git(p, ["rev-parse", "HEAD"]);
      originalDelivery = (
        await engine.entity("acme", "components", "acme.shop.delivery")
      ).value;
      for (const label of [
        "Объекты",
        "Черновики",
        "Сравнение",
        "Снимки",
        "Граф",
        "Данные и доверие",
        "Ассистент",
        "draw.io",
        "Диагностика",
      ]) {
        await nav(label);
        await page.locator(".read-only").waitFor();
        if (label === "Объекты") {
          for (const text of [
            "Создать",
            "Показать изменения",
            "Сохранить локально",
          ])
            assert.equal(
              await page
                .getByRole("button", { name: text, exact: true })
                .isDisabled(),
              true,
            );
        }
        if (label === "Данные и доверие")
          assert.equal(
            await page
              .getByRole("button", {
                name: "Подготовить изменение",
                exact: true,
              })
              .isDisabled(),
            true,
          );
        if (label === "Ассистент") {
          await page
            .locator("#question")
            .fill("Кто владелец acme.shop.delivery?");
          await page
            .getByRole("button", { name: "Получить ответ", exact: true })
            .click();
          await page.locator(".answer").waitFor();
        }
      }
      assert.equal(await engine.git(p, ["rev-parse", "HEAD"]), before);
      await page.locator("#project").selectOption("acme");
      await page.locator(".read-only").waitFor({ state: "detached" });
      return { views: 9, headUnchanged: true };
    },
  );
  await step(
    "graph focus, bounded rendering and clearing focus leave architecture unchanged",
    ["AC-05-01", "AC-05-05", "AC-05-06"],
    async () => {
      await nav("Граф");
      await page.locator("#graph-focus").fill("acme.shop.orders");
      await page.locator("#graph-depth").selectOption("1");
      await page.locator("#graph-direction").selectOption("outgoing");
      await page
        .getByRole("button", { name: "Построить", exact: true })
        .click();
      await page.locator("#graph-canvas svg").waitFor();
      assert.ok(
        !(await page.locator("#graph-canvas").innerText()).includes(
          "Unrelated",
        ),
      );
      await page.locator("#graph-focus").fill("");
      await page
        .getByRole("button", { name: "Построить", exact: true })
        .click();
      await page
        .getByText("На рисунке первые 80 узлов.", { exact: false })
        .waitFor();
      const nodes = await page.locator("#graph-canvas .graph-node").count();
      assert.equal(nodes, 80);
      await page.screenshot({
        path: path.join(dir, "bounded-graph.png"),
        fullPage: true,
      });
      return {
        focus: "acme.shop.orders",
        direction: "outgoing",
        boundedNodes: nodes,
        clearFocus: true,
      };
    },
  );
  await step(
    "candidate contradiction status and uncertainty remain visible",
    ["AC-10-04"],
    async () => {
      await nav("Ассистент");
      await page
        .getByRole("button", { name: "Найти противоречия", exact: true })
        .click();
      await page.locator(".finding").first().waitFor();
      const text = await page
        .locator(".finding")
        .filter({ hasText: "acme.shop.delivery" })
        .first()
        .innerText();
      assert.ok(text.includes("Требует проверки"));
      assert.ok(text.includes("неоднознач"));
      return { text };
    },
  );
  await step(
    "full browser lifecycle: offline draft, diff, actual validation, Git commit and live reload",
    ["AC-03-01", "AC-INT-01"],
    async () => {
      const p = await engine.project("acme"),
        before = await engine.git(p, ["rev-parse", "HEAD"]);
      await edit("acme.shop.delivery", {
        owner: "Browser Verified Logistics",
      });
      await context.setOffline(true);
      await page
        .getByRole("button", { name: "Сохранить локально", exact: true })
        .click();
      await assertNotice(page, "Черновик сохранён");
      await context.setOffline(false);
      await page.getByRole("button", { name: "Обновить", exact: true }).click();
      await nav("Черновики");
      await page
        .getByRole("button", { name: "Открыть", exact: true })
        .first()
        .click();
      await page
        .getByRole("button", { name: "Проверить в SEAF", exact: true })
        .click();
      await page
        .getByText("Проверка пройдена", { exact: true })
        .waitFor({ timeout: 120000 });
      assert.ok(
        (await page.locator("body").innerText()).includes(
          "Browser Verified Logistics",
        ),
      );
      await page
        .getByRole("button", {
          name: "Сохранить в Git и обновить SEAF",
          exact: true,
        })
        .click();
      await page.locator("#result-dialog[open]").waitFor({ timeout: 60000 });
      const result = JSON.parse(
        await page.locator("#dialog-result").innerText(),
      );
      assert.equal(result.reload.status, "updated");
      assert.deepEqual(result.reload.problems, []);
      assert.notEqual(result.commit, before);
      await page.locator("#dialog-close").click();
      assert.equal(
        (await engine.entity("acme", "components", "acme.shop.delivery")).value
          .owner,
        "Browser Verified Logistics",
      );
      assert.deepEqual(
        (await engine.entity("acme", "components", "acme.shop.delivery")).value
          .links,
        originalDelivery.links,
      );
      assert.equal(
        (await engine.entity("acme", "components", "acme.shop.delivery")).value
          .description,
        originalDelivery.description,
      );
      const response = await fetch(
        config.projects[0].portal + "/seaf-core/api/core/storage/jsonata",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: '($lookup(components,"acme.shop.delivery").owner)',
            params: {},
          }),
        },
      );
      assert.equal(await response.json(), "Browser Verified Logistics");
      await engine.clean(p);
      await page.screenshot({
        path: path.join(dir, "after-commit.png"),
        fullPage: true,
      });
      return result;
    },
  );
  await step(
    "bulk browser selection has one proposal, validation and local commit",
    ["AC-03-05", "AC-03-06", "AC-INT-02"],
    async () => {
      await nav("Объекты");
      await page.locator("#filter").fill("acme.shop.");
      await page.locator('[data-select="acme.shop.delivery"]').check();
      await page.locator('[data-select="acme.shop.delivery_db"]').check();
      const p = await engine.project("acme"),
        before = await engine.git(p, ["rev-parse", "HEAD"]);
      await page.locator("#object-json").fill('{"owner":""}');
      await page
        .getByRole("button", { name: "Показать изменения", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Проверить в SEAF", exact: true })
        .click();
      await page
        .getByText("Проверка не пройдена", { exact: true })
        .waitFor({ timeout: 120000 });
      assert.equal(
        await page
          .getByRole("button", {
            name: "Сохранить в Git и обновить SEAF",
            exact: true,
          })
          .isDisabled(),
        true,
      );
      assert.equal(await engine.git(p, ["rev-parse", "HEAD"]), before);
      await page
        .locator("#object-json")
        .fill('{"owner":"Browser Bulk Logistics"}');
      await page
        .getByRole("button", { name: "Показать изменения", exact: true })
        .click();
      await page
        .getByRole("heading", { name: "Предварительный просмотр", exact: true })
        .waitFor();
      await page
        .getByRole("button", { name: "Проверить в SEAF", exact: true })
        .click();
      await page
        .getByText("Проверка пройдена", { exact: true })
        .waitFor({ timeout: 120000 });
      await page
        .getByRole("button", {
          name: "Сохранить в Git и обновить SEAF",
          exact: true,
        })
        .click();
      await page.locator("#result-dialog[open]").waitFor({ timeout: 60000 });
      const result = JSON.parse(
        await page.locator("#dialog-result").innerText(),
      );
      assert.equal(result.reload.status, "updated");
      await page.locator("#dialog-close").click();
      assert.equal(
        (await engine.entity("acme", "components", "acme.shop.delivery")).value
          .owner,
        "Browser Bulk Logistics",
      );
      assert.equal(
        (await engine.entity("acme", "components", "acme.shop.delivery_db"))
          .value.owner,
        "Browser Bulk Logistics",
      );
      return result;
    },
  );
  await step(
    "custom section creation, explicit property removal and entire-object replacement through the UI",
    ["AC-03-02", "AC-03-03", "AC-03-04"],
    async () => {
      async function publish() {
        await page
          .getByRole("button", { name: "Показать изменения", exact: true })
          .click();
        await page
          .getByRole("button", { name: "Проверить в SEAF", exact: true })
          .click();
        await page
          .getByText("Проверка пройдена", { exact: true })
          .waitFor({ timeout: 120000 });
        await page
          .getByRole("button", {
            name: "Сохранить в Git и обновить SEAF",
            exact: true,
          })
          .click();
        await page.locator("#result-dialog[open]").waitFor({ timeout: 60000 });
        const result = JSON.parse(
          await page.locator("#dialog-result").innerText(),
        );
        assert.equal(result.reload.status, "updated");
        await page.locator("#dialog-close").click();
        return result;
      }
      await nav("Объекты");
      await page.locator("#custom-section").fill("systems");
      await page.locator("#custom-section").press("Tab");
      await page.locator("#object-id").fill("acme.fulfillment");
      await page.locator("#object-json").fill(
        JSON.stringify({
          title: "Acme Fulfillment System",
          owner: "Operations",
          nested: { retained: true, removed: "obsolete" },
        }),
      );
      const created = await publish();
      await page.locator("#section").selectOption("systems");
      await page.locator("#filter").fill("acme.fulfillment");
      await page.locator('tr[data-object="acme.fulfillment"]').click();
      await page.locator("#edit-mode").selectOption("replace");
      await page.locator("#object-json").fill(
        JSON.stringify({
          title: "Acme Fulfillment v2",
          owner: "Operations v2",
          nested: { retained: true },
        }),
      );
      const replaced = await publish();
      const result = (
        await engine.entity("acme", "systems", "acme.fulfillment")
      ).value;
      assert.deepEqual(result, {
        title: "Acme Fulfillment v2",
        owner: "Operations v2",
        nested: { retained: true },
      });
      return { created, replaced, result };
    },
  );
  await step(
    "saved commit is displayed after reload failure and retry refreshes without another commit",
    ["AC-03-08", "AC-INT-06"],
    async () => {
      await nav("Объекты");
      await page.locator("#section").selectOption("components");
      await edit("acme.shop.delivery", { owner: "Browser Retry Logistics" });
      await page
        .getByRole("button", { name: "Показать изменения", exact: true })
        .click();
      await page
        .getByRole("button", { name: "Проверить в SEAF", exact: true })
        .click();
      await page
        .getByText("Проверка пройдена", { exact: true })
        .waitFor({ timeout: 120000 });
      const portal = config.projects[0].portal;
      config.projects[0].portal = "http://127.0.0.1:1";
      await fs.writeFile(configFile, JSON.stringify(config));
      await page
        .getByRole("button", {
          name: "Сохранить в Git и обновить SEAF",
          exact: true,
        })
        .click();
      await page.locator("#result-dialog[open]").waitFor({ timeout: 60000 });
      const failed = JSON.parse(
        await page.locator("#dialog-result").innerText(),
      );
      assert.equal(failed.status, "committed_reload_failed");
      assert.match(failed.commit, /^[a-f0-9]{40}$/);
      await page.locator("#dialog-close").click();
      await page
        .getByRole("button", { name: "Повторить обновление SEAF", exact: true })
        .waitFor();
      assert.ok(
        (await page.locator("body").innerText()).includes(failed.commit),
      );
      const p = await engine.project("acme"),
        head = await engine.git(p, ["rev-parse", "HEAD"]),
        count = await engine.git(p, ["rev-list", "--count", "HEAD"]);
      assert.equal(head, failed.commit);
      config.projects[0].portal = portal;
      await fs.writeFile(configFile, JSON.stringify(config));
      await page
        .getByRole("button", { name: "Повторить обновление SEAF", exact: true })
        .click();
      await page.locator("#result-dialog[open]").waitFor({ timeout: 60000 });
      const retried = JSON.parse(
        await page.locator("#dialog-result").innerText(),
      );
      assert.equal(retried.commit, failed.commit);
      assert.equal(retried.reload.status, "updated");
      assert.deepEqual(retried.reload.problems, []);
      await page.locator("#dialog-close").click();
      assert.equal(await engine.git(p, ["rev-list", "--count", "HEAD"]), count);
      await page.screenshot({
        path: path.join(dir, "reload-recovered.png"),
        fullPage: true,
      });
      return {
        failed,
        retried,
        gitCommitsBeforeRetry: count,
        gitCommitsAfterRetry: await engine.git(p, [
          "rev-list",
          "--count",
          "HEAD",
        ]),
      };
    },
  );
  await step(
    "referenced deletion exposes impact and blocks commit in the browser",
    ["AC-03-07"],
    async () => {
      const p = await engine.project("acme"),
        before = await engine.git(p, ["rev-parse", "HEAD"]);
      await edit("acme.shop.delivery", {});
      await page.locator("#edit-mode").selectOption("delete");
      await page
        .getByRole("button", { name: "Показать изменения", exact: true })
        .click();
      await page
        .getByText("Ссылки на удаляемые объекты — проверьте последствия", {
          exact: true,
        })
        .waitFor();
      assert.ok(
        (await page.locator("body").innerText()).includes("acme.shop.events"),
      );
      await page
        .getByRole("button", { name: "Проверить в SEAF", exact: true })
        .click();
      await page
        .getByText("Проверка не пройдена", { exact: true })
        .waitFor({ timeout: 120000 });
      assert.equal(
        await page
          .getByRole("button", {
            name: "Сохранить в Git и обновить SEAF",
            exact: true,
          })
          .isDisabled(),
        true,
      );
      assert.equal(await engine.git(p, ["rev-parse", "HEAD"]), before);
      return {
        head: before,
        referencedObject: "acme.shop.delivery",
        commitBlocked: true,
      };
    },
  );
  await step(
    "snapshot creation, verification, isolated preview and stop through the browser",
    ["AC-04-01", "AC-04-04", "AC-08-03"],
    async () => {
      const p = await engine.project("acme"),
        head = await engine.git(p, ["rev-parse", "HEAD"]);
      await nav("Снимки");
      await page.locator("#snapshot-title").fill("Acme UI snapshot");
      await page
        .getByRole("button", { name: "Создать снимок", exact: true })
        .click();
      await page.locator("#result-dialog[open]").waitFor({ timeout: 60000 });
      const created = JSON.parse(
        await page.locator("#dialog-result").innerText(),
      );
      assert.match(created.id, /^[a-f0-9]{64}$/);
      await page.locator("#dialog-close").click();
      await page.locator(`[data-verify-snapshot="${created.id}"]`).click();
      await page.locator("#result-dialog[open]").waitFor();
      const verified = JSON.parse(
        await page.locator("#dialog-result").innerText(),
      );
      assert.equal(verified.ok, true);
      await page.locator("#dialog-close").click();
      const opened = page.waitForEvent("popup");
      await page.locator(`[data-preview-snapshot="${created.id}"]`).click();
      const popup = await opened;
      await popup.waitForLoadState("domcontentloaded");
      const url = new URL(popup.url());
      assert.notEqual(url.port, "8080");
      assert.notEqual(url.port, new URL(config.projects[0].portal).port);
      await popup.goto(
        url.origin + "/entities/docs/blank?dh-doc-id=local.lsv.workbench",
      );
      await popup
        .getByText("Это изолированный preview архитектуры.", { exact: false })
        .waitFor();
      assert.equal(
        await popup
          .locator('iframe[title="Рабочее пространство SEAF — LSV"]')
          .count(),
        0,
      );
      await popup.close();
      await page.locator("#dialog-close").click();
      await nav("Сравнение");
      const stop = page.locator("[data-stop-preview]").last();
      await stop.click();
      await page.locator("[data-stop-preview]").waitFor({ state: "detached" });
      assert.equal(await engine.git(p, ["rev-parse", "HEAD"]), head);
      assert.equal(
        (await fetch(config.projects[0].portal + "/health")).ok,
        true,
      );
      return {
        snapshot: created.id,
        verified: verified.ok,
        previewReadOnly: true,
        stopped: true,
        liveHead: head,
      };
    },
  );
  await step(
    "a broken manifest keeps API diagnostics reachable and recovery restores the model",
    ["AC-02-03", "AC-02-05"],
    async () => {
      const manifestPath = path.join(root, "root.yaml"),
        original = await fs.readFile(manifestPath, "utf8");
      try {
        await fs.writeFile(
          manifestPath,
          original + "  - missing-browser-qa.yaml\n",
        );
        await page
          .getByRole("button", { name: "Обновить", exact: true })
          .click();
        await page.locator(".model-error").waitFor();
        assert.equal(
          await page.locator("#connection").innerText(),
          "Подключено",
        );
        await nav("Объекты");
        assert.equal(await page.locator("tr[data-object]").count(), 0);
        assert.equal(
          await page
            .getByRole("button", { name: "Показать изменения", exact: true })
            .isDisabled(),
          true,
        );
        await nav("Диагностика");
        assert.equal(
          await page
            .getByRole("button", { name: "Проверить всё", exact: true })
            .isEnabled(),
          true,
        );
        await page
          .getByRole("button", { name: "Проверить всё", exact: true })
          .click();
        await page
          .getByText(
            "Устраните отмеченные проблемы перед применением изменений",
            { exact: true },
          )
          .waitFor();
      } finally {
        await fs.writeFile(manifestPath, original);
      }
      await page.getByRole("button", { name: "Обновить", exact: true }).click();
      await page.locator(".model-error").waitFor({ state: "detached" });
      await nav("Объекты");
      await page.locator("#filter").fill("acme.shop.delivery");
      assert.equal(
        await page.locator('tr[data-object="acme.shop.delivery"]').count(),
        1,
      );
      try {
        await fs.writeFile(
          manifestPath,
          original + "  - missing-browser-qa.yaml\n",
        );
        await page
          .getByRole("button", { name: "Обновить", exact: true })
          .click();
        await page.locator(".model-error").waitFor();
        await context.setOffline(true);
        await page
          .getByRole("button", { name: "Обновить", exact: true })
          .click();
        await page
          .locator("#connection")
          .filter({ hasText: "Автономный режим" })
          .waitFor();
        await page.locator(".model-error").waitFor({ state: "detached" });
        assert.equal(
          await page
            .getByRole("button", { name: "Показать изменения", exact: true })
            .isEnabled(),
          true,
        );
      } finally {
        await context.setOffline(false);
        await fs.writeFile(manifestPath, original);
      }
      return {
        apiStayedConnected: true,
        diagnosticsAvailable: true,
        staleModelCleared: true,
        recovered: true,
        cachedOfflineRecovery: true,
      };
    },
  );
  report.status = "passed";
  report.errors = errors;
  assert.deepEqual(errors, []);
  report.productionUnchanged =
    (await bootstrap.git(production, ["rev-parse", "HEAD"])) ===
      productionHead &&
    (await bootstrap.fingerprint(production.root)) === productionFingerprint;
  assert.equal(report.productionUnchanged, true);
} catch (e) {
  report.status = "failed";
  report.error = e.stack || e.message;
  console.error(e);
  process.exitCode = 1;
} finally {
  if (browser) await browser.close();
  if (server) await new Promise((resolve) => server.close(resolve));
  if (container && engine)
    await engine.docker(["rm", "-f", container]).catch(() => {});
  report.completed = new Date().toISOString();
  await save();
  console.log(
    JSON.stringify({
      status: report.status,
      steps: report.steps.map((s) => ({ name: s.name, status: s.status })),
      report: reportFile,
    }),
  );
}
