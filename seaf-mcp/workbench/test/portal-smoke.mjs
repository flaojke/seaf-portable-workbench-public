import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
const require = createRequire(import.meta.url),
  {
    chromium,
  } = require("C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1026-487-0_26.1026.487.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const output = path.resolve("seaf-mcp/state/acceptance"),
  browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  }),
  page = await browser.newPage({ viewport: { width: 1750, height: 1150 } }),
  errors = [];
page.on("pageerror", (e) => errors.push(e.message));
try {
  await page.goto(
    "http://localhost:8080/entities/docs/blank?dh-doc-id=local.lsv.workbench",
  );
  await page
    .getByTitle("Рабочее пространство SEAF — LSV")
    .waitFor({ timeout: 30000 });
  const workbench = page.frameLocator(
    'iframe[title="Рабочее пространство SEAF — LSV"]',
  );
  await workbench
    .getByRole("heading", { name: "Редактор объектов", exact: true })
    .waitFor();
  await page.screenshot({
    path: path.join(output, "portal-workbench.png"),
    fullPage: true,
  });
  await workbench
    .getByRole("button", { name: "Данные и доверие", exact: true })
    .click();
  await workbench.locator("#graph-focus").fill("demo.shop.delivery");
  await workbench
    .getByRole("button", { name: "Построить", exact: true })
    .click();
  await workbench.locator("#graph-canvas svg").waitFor();
  await page.screenshot({
    path: path.join(output, "portal-trust.png"),
    fullPage: true,
  });
  await workbench.getByRole("button", { name: "draw.io", exact: true }).click();
  await workbench
    .locator("#drawio-path")
    .fill("diagrams/shopflow-delivery.drawio");
  await workbench
    .getByRole("button", { name: "Открыть из проекта", exact: true })
    .click();
  await workbench.locator("#drawio-xml").waitFor({ state: "attached" });
  await page.waitForFunction(() =>
    [...document.querySelectorAll("iframe")].some(() => true),
  );
  await workbench
    .getByRole("button", { name: "Подготовить сохранение файла", exact: true })
    .waitFor({ state: "visible" });
  await workbench
    .getByRole("button", { name: "Открыть редактор", exact: true })
    .click();
  await page
    .frameLocator('iframe[title="Рабочее пространство SEAF — LSV"]')
    .frameLocator("#drawio-editor")
    .locator(".geMenubarContainer")
    .waitFor({ timeout: 30000 });
  await page.screenshot({
    path: path.join(output, "portal-drawio.png"),
    fullPage: true,
  });
  const manifest = JSON.parse(
      await fs.readFile(
        "seaf-mcp/workbench/documentation/docs-manifest.json",
        "utf8",
      ),
    ),
    pages = [];
  for (const doc of manifest) {
    await page.goto(
      "http://localhost:8080/entities/docs/blank?dh-doc-id=" + doc.id,
    );
    await page.getByText("Feature:", { exact: false }).first().waitFor();
    const body = await page.locator("body").innerText();
    if (!body.includes("ShopFlow")) throw Error("Example absent: " + doc.id);
    pages.push(doc.id);
  }
  await page.goto(
    "http://localhost:8080/entities/docs/blank?dh-doc-id=local.lsv.overview",
  );
  await page
    .getByText("Рабочее пространство и новые функции", { exact: false })
    .first()
    .waitFor();
  await page.screenshot({
    path: path.join(output, "portal-docs.png"),
    fullPage: true,
  });
  await fs.writeFile(
    path.join(output, "portal-result.json"),
    JSON.stringify({ ok: true, pages, errors }, null, 2),
  );
  console.log(JSON.stringify({ ok: true, pages: pages.length, errors }));
} catch (e) {
  await page
    .screenshot({
      path: path.join(output, "portal-failure.png"),
      fullPage: true,
    })
    .catch(() => {});
  console.error(e);
  process.exitCode = 1;
} finally {
  await browser.close();
}
