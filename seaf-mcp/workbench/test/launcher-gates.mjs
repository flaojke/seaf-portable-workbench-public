/** Real PowerShell 5.1 launcher recovery, with a private unhealthy endpoint. */
import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { randomUUID } from "node:crypto";
import assert from "node:assert/strict";
const exec = promisify(execFile),
  base = path.resolve("."),
  acceptance = path.join(base, "seaf-mcp", "state", "acceptance"),
  dir = path.join(acceptance, "launcher-" + randomUUID());
assert.ok(dir.startsWith(acceptance + path.sep));
await fs.mkdir(path.join(dir, "fake-workbench", "workbench"), {
  recursive: true,
});
const source = await fs.readFile(
    path.join(base, "seaf-docker", "launcher.ps1"),
    "utf8",
  ),
  report = { started: new Date().toISOString(), steps: [] };
assert.ok(
  source.includes("$taskWorkbenchHealth = 'http://127.0.0.1:8091/health'"),
  "readiness must avoid slow localhost IPv6 resolution",
);
const fake = http.createServer((req, res) => {
  res.writeHead(503, { "Content-Type": "application/json" });
  res.end('{"service":"unhealthy-test-fixture"}');
});
await new Promise((resolve) => fake.listen(0, "127.0.0.1", resolve));
const quote = (text) => "'" + text.replaceAll("'", "''") + "'";
try {
  const started = Date.now(),
    warm = await exec(
      "powershell.exe",
      [
        "-NoProfile",
        "-ExecutionPolicy",
        "Bypass",
        "-File",
        path.join(base, "seaf-docker", "launcher.ps1"),
        "-NoBrowser",
      ],
      { windowsHide: true, timeout: 30000, maxBuffer: 1024 * 1024 },
    );
  assert.match(warm.stdout, /SEAF/);
  report.steps.push({
    name: "real launcher finds ready services via IPv4",
    status: "passed",
    milliseconds: Date.now() - started,
    output: warm.stdout,
  });
  let fixture = source;
  const replacements = [
    [
      "$taskWorkbenchHealth = 'http://127.0.0.1:8091/health'",
      "$taskWorkbenchHealth = " +
        quote("http://127.0.0.1:" + fake.address().port + "/health"),
    ],
    [
      "$taskCompose = Join-Path $PSScriptRoot 'compose.yaml'",
      "$taskCompose = " + quote(path.join(base, "seaf-docker", "compose.yaml")),
    ],
    [
      "$taskWorkbenchRoot = Join-Path (Split-Path $PSScriptRoot -Parent) 'seaf-mcp'",
      "$taskWorkbenchRoot = " + quote(path.join(dir, "fake-workbench")),
    ],
  ];
  for (const [old, value] of replacements) {
    assert.ok(fixture.includes(old));
    fixture = fixture.replace(old, value);
  }
  const file = path.join(dir, "launcher.ps1");
  await fs.writeFile(file, fixture);
  await fs.writeFile(
    path.join(dir, "fake-workbench", "workbench", "server.mjs"),
    "process.exit(42);\n",
  );
  const failedAt = Date.now();
  let failure;
  try {
    await exec(
      "powershell.exe",
      ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", file, "-NoBrowser"],
      { windowsHide: true, timeout: 35000, maxBuffer: 1024 * 1024 },
    );
  } catch (error) {
    failure = error;
  }
  assert.ok(failure);
  assert.equal(
    failure.code,
    1,
    "NoBrowser must exit on failure instead of waiting for a hidden dialog",
  );
  assert.equal(failure.killed, false);
  assert.match(failure.stdout, /SEAF Workbench did not start/);
  report.steps.push({
    name: "failed workbench exits with an actionable error without a modal dialog",
    status: "passed",
    milliseconds: Date.now() - failedAt,
    exitCode: failure.code,
    output: failure.stdout,
    fixtureOnlyHealthAndScriptOverrides: true,
  });
  report.status = "passed";
  report.productionModelWrites = false;
} catch (error) {
  report.status = "failed";
  report.error = { message: error.message, stack: error.stack };
  process.exitCode = 1;
} finally {
  await new Promise((resolve) => fake.close(resolve));
  report.completed = new Date().toISOString();
  await fs.writeFile(
    path.join(acceptance, "launcher-gates.json"),
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
