import { createRequire } from "node:module";
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
const require = createRequire(import.meta.url),
  {
    chromium,
  } = require("C:/Program Files/WindowsApps/OpenAI.CodexPrimaryRuntime.v26-1026-487-0_26.1026.487.0_x64__3k8sg7r9htsxt/dependencies/node/node_modules/playwright");
const base = "http://127.0.0.1:8091",
  session = await fetch(base + "/api/session").then((r) => r.json());
async function action(action, args = {}) {
  const response = await fetch(base + "/api/action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-SEAF-CSRF": session.csrf,
    },
    body: JSON.stringify({ action, project: "shopflow", ...args }),
  });
  const body = await response.json();
  if (!body.ok) throw Error(body.error);
  return body.result;
}
const output = path.resolve("seaf-mcp/state/acceptance"),
  report = {
    time: new Date().toISOString(),
    diagnostics: await action("diagnostics"),
  };
const snapshot = await action("snapshot_create", {
  title: "ShopFlow — рабочее пространство 04.11.2026",
});
report.snapshot = {
  id: snapshot.id,
  head: snapshot.head,
  image: snapshot.runtime.imageId,
  files: snapshot.files.length,
};
report.verify = await action("snapshot_verify", { id: snapshot.id });
const bytes = Buffer.from(
  await fetch(base + snapshot.archive).then((r) => r.arrayBuffer()),
);
const again = await action("snapshot_create", {
    title: "ShopFlow — рабочее пространство 04.11.2026",
  }),
  bytesAgain = Buffer.from(
    await fetch(base + again.archive).then((r) => r.arrayBuffer()),
  );
if (snapshot.id !== again.id || !bytes.equals(bytesAgain))
  throw Error("Snapshot is not deterministic");
report.archiveSha256 = createHash("sha256").update(bytes).digest("hex");
report.deterministic = true;
let preview, browser;
try {
  preview = await action("preview_create", { snapshotId: snapshot.id });
  report.preview = preview;
  browser = await chromium.launch({
    executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
    headless: true,
  });
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  await page.goto(
    preview.url + "/entities/docs/blank?dh-doc-id=local.lsv.workbench",
  );
  await page
    .getByText("Это изолированный preview архитектуры.", { exact: false })
    .waitFor();
  if (
    await page
      .locator('iframe[title="Рабочее пространство SEAF — LSV"]')
      .count()
  )
    throw Error("Preview embeds the live editor");
  report.previewEditorIsolation = true;
  await page.screenshot({
    path: path.join(output, "preview-readonly.png"),
    fullPage: true,
  });
} finally {
  if (browser) await browser.close();
  if (preview)
    report.previewStopped = await action("preview_stop", { id: preview.id });
}
report.ok =
  report.diagnostics.ready && report.verify.ok && report.previewEditorIsolation;
await fs.writeFile(
  path.join(output, "release-result.json"),
  JSON.stringify(report, null, 2),
);
console.log(
  JSON.stringify({
    ok: report.ok,
    snapshot: report.snapshot,
    deterministic: report.deterministic,
    previewStopped: report.previewStopped,
  }),
);
