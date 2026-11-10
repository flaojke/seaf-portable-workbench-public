import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url);
const {
  chromium,
} = require("C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1026-487-0_26.1026.487.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const output = path.resolve("seaf-mcp/state/acceptance");
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  headless: true,
});
const context = await browser.newContext({
    viewport: { width: 1600, height: 1050 },
  }),
  page = await context.newPage(),
  errors = [],
  steps = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto("http://127.0.0.1:8091/");
  await page
    .getByRole("heading", { name: "Редактор объектов", exact: true })
    .waitFor();
  await page.locator("#connection").filter({ hasText: "Подключено" }).waitFor();
  steps.push("online-model");
  await page.locator("#filter").fill("demo.shop.delivery");
  await page.locator('tr[data-object="demo.shop.delivery"]').click();
  await page
    .locator("#object-json")
    .fill(
      JSON.stringify({
        description:
          "Черновик из проверки интерфейса. Рабочие данные не меняются.",
      }),
    );
  await page
    .getByRole("button", { name: "Показать изменения", exact: true })
    .click();
  await page
    .getByRole("heading", { name: "Предварительный просмотр", exact: true })
    .waitFor();
  await page
    .getByText("Черновик из проверки интерфейса. Рабочие данные не меняются.", {
      exact: true,
    })
    .first()
    .waitFor();
  steps.push("single-object-semantic-diff");
  await page.screenshot({
    path: path.join(output, "objects.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Граф", exact: true }).click();
  await page.locator("#graph-focus").fill("demo.shop.orders");
  await page.getByRole("button", { name: "Построить", exact: true }).click();
  await page.locator("#graph-canvas svg").waitFor();
  steps.push("subgraph");
  await page.screenshot({
    path: path.join(output, "graph.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ассистент", exact: true }).click();
  await page.locator("#question").fill("Кто владелец demo.shop.delivery?");
  await page
    .getByRole("button", { name: "Получить ответ", exact: true })
    .click();
  await page.locator(".answer").waitFor();
  if (!(await page.locator(".answer").innerText()).includes("Logistics"))
    throw Error("Owner evidence missing");
  steps.push("grounded-owner-answer");
  await page.getByRole("button", { name: "draw.io", exact: true }).click();
  await page
    .getByRole("button", { name: "Экспорт модели", exact: true })
    .click();
  await page
    .locator("#drawio-xml")
    .filter({ visible: false })
    .count()
    .catch(() => {});
  await page.waitForFunction(() =>
    document.querySelector("#drawio-xml")?.value.includes("mxfile"),
  );
  await page
    .getByRole("button", { name: "Открыть редактор", exact: true })
    .click();
  await page.locator("#drawio-editor").waitFor();
  await page
    .frameLocator("#drawio-editor")
    .locator(".geMenubarContainer")
    .waitFor({ timeout: 30000 });
  steps.push("local-drawio-editor");
  await page.screenshot({
    path: path.join(output, "drawio.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Объекты", exact: true }).click();
  await page.locator("#filter").fill("demo.shop.delivery");
  await page.locator('tr[data-object="demo.shop.delivery"]').click();
  await context.setOffline(true);
  await page
    .locator("#object-json")
    .fill(JSON.stringify({ owner: "Offline Logistics" }));
  await page
    .getByRole("button", { name: "Сохранить локально", exact: true })
    .click();
  await page.getByRole("button", { name: "Черновики", exact: true }).click();
  await page
    .getByRole("heading", { name: "Черновики проекта", exact: true })
    .waitFor();
  if (
    !(await page.locator("body").innerText()).includes(
      "Изменение: demo.shop.delivery",
    )
  )
    throw Error("Offline draft absent");
  await page.reload();
  await page
    .getByRole("heading", { name: "Редактор объектов", exact: true })
    .waitFor();
  steps.push("offline-cache-and-draft-restore");
  await context.setOffline(false);
  await fs.writeFile(
    path.join(output, "ui-result.json"),
    JSON.stringify({ ok: true, steps, errors }, null, 2),
  );
  console.log(JSON.stringify({ ok: true, steps, errors }));
} catch (e) {
  await page
    .screenshot({ path: path.join(output, "failure.png"), fullPage: true })
    .catch(() => {});
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
