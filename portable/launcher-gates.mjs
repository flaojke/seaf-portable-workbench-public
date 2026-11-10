import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile),
  bundle = path.resolve(
    process.env.SEAF_TEST_BUNDLE ||
      process.argv[2] ||
      "portable/state/SEAF Перенос v2",
  );
const node = path.join(bundle, "runtime/node/node.exe"),
  launcher = path.join(bundle, "portable/launcher.mjs");
const env = {
  SystemRoot: process.env.SystemRoot,
  WINDIR: process.env.WINDIR,
  TEMP: process.env.TEMP,
  TMP: process.env.TMP,
  USERPROFILE: process.env.USERPROFILE,
  LOCALAPPDATA: process.env.LOCALAPPDATA,
  PATH: path.join(process.env.SystemRoot, "System32"),
};
const call = async (...args) =>
  (
    await exec(node, [launcher, ...args], {
      cwd: bundle,
      env,
      windowsHide: true,
      timeout: 120000,
      maxBuffer: 1e6,
    })
  ).stdout;
const unrelated = http.createServer((req, res) => res.end("unrelated"));
await new Promise((resolve) => unrelated.listen(0, "127.0.0.1", resolve));
const unrelatedUrl = "http://127.0.0.1:" + unrelated.address().port;
const cases = [];
let status,
  originalRegistry,
  originalSettings,
  modifiedState = false;
const registryFile = path.join(bundle, "data/projects.json"),
  settingsFile = path.join(bundle, "data/settings.json"),
  portsFile = path.join(bundle, "data/ports.json");
const waitStopped = async () => {
  for (let i = 0; i < 100; i++) {
    if (JSON.parse(await call("status")).status === "stopped") return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw Error("Bundle did not stop");
};
try {
  if (JSON.parse(await call("status")).portalUrl) {
    await call("stop");
    for (let i = 0; i < 100; i++) {
      if (JSON.parse(await call("status")).status === "stopped") break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  const before = Date.now();
  await call("start", "--no-browser");
  status = JSON.parse(await call("status"));
  assert.ok(status.portalUrl?.startsWith("http://127.0.0.1:"));
  assert.ok(status.workbenchUrl?.startsWith("http://127.0.0.1:"));
  cases.push({
    id: "portable-start-no-external-prereqs",
    status: "PASS",
    milliseconds: Date.now() - before,
  });
  const portPreferencesBeforeRepeat=await fs.readFile(portsFile,'utf8');
  const portPreferencesStat=await fs.stat(portsFile);
  await call("start", "--no-browser");
  assert.equal(JSON.parse(await call("status")).pid, status.pid);
  assert.equal(await fs.readFile(portsFile,'utf8'),portPreferencesBeforeRepeat);
  assert.equal((await fs.stat(portsFile)).mtimeMs,portPreferencesStat.mtimeMs);
  cases.push({ id: "duplicate-start-reuses-owned-supervisor", status: "PASS" });
  const health = await fetch(status.portalUrl + "/health").then((r) =>
    r.json(),
  );
  assert.ok(health.nativeInstance);
  const response = await fetch(
    status.portalUrl +
      "/core/storage/jsonata/" +
      encodeURIComponent("($keys(components))"),
  );
  assert.equal(response.status, 200);
  const keys = await response.json();
  assert.ok(JSON.stringify(keys).includes("demo.shop.delivery"));
  const rules = await fetch(status.portalUrl + "/core/storage/problems/").then(
    (r) => r.json(),
  );
  assert.equal(rules.length, 15);
  assert.equal(rules.filter((p) => p.error || p.items?.length).length, 0);
  cases.push({
    id: "real-shopflow-components-and-15-validators",
    status: "PASS",
  });
  const registry = JSON.parse(await fs.readFile(registryFile, "utf8"));
  assert.ok(registry.projects.some((project) => project.id === "hello"));
  assert.ok(await fs.stat(path.join(bundle, "data/projects/hello/root.yaml")));
  assert.equal(
    await fs
      .stat(path.join(bundle, "data/projects/hello/.git"))
      .then(() => true)
      .catch((e) => {
        if (e.code !== "ENOENT") throw e;
        return false;
      }),
    false,
  );
  cases.push({
    id: "both-examples-seeded-without-automatic-git",
    status: "PASS",
  });
  const config = await fetch(status.portalUrl + "/api/env-config").then((r) =>
    r.json(),
  );
  assert.equal(new URL(config.workbenchUrl).origin, new URL(status.workbenchUrl).origin);
  assert.equal(new URL(config.workbenchUrl).searchParams.get('project'),status.project);
  assert.ok(config.plantUmlServer.startsWith(status.offlineUrl));
  assert.equal(config.isolatedPreview, false);
  cases.push({ id: "dynamic-loopback-service-links", status: "PASS" });
  const git = await exec(
    path.join(bundle, "runtime/git/cmd/git.exe"),
    ["--version"],
    { env, windowsHide: true },
  );
  assert.match(git.stdout, /2\.56/);
  const ssh = await exec(
    path.join(bundle, "runtime/git/usr/bin/ssh.exe"),
    ["-V"],
    { env, windowsHide: true },
  );
  assert.match(ssh.stderr, /OpenSSH/);
  cases.push({ id: "bundled-git-and-ssh-no-path-install", status: "PASS" });
  await call("stop");
  for (let i = 0; i < 100; i++) {
    if (JSON.parse(await call("status")).status === "stopped") break;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  assert.equal(JSON.parse(await call("status")).status, "stopped");
  assert.equal(await fetch(unrelatedUrl).then((r) => r.text()), "unrelated");
  await assert.rejects(fetch(status.portalUrl + "/health"));
  await call("stop");
  cases.push({
    id: "stop-only-owned-processes-and-safe-repeat",
    status: "PASS",
  });
  originalRegistry = await fs.readFile(registryFile, "utf8");
  originalSettings = await fs.readFile(settingsFile, "utf8").catch((e) => {
    if (e.code !== "ENOENT") throw e;
    return null;
  });
  const nextRegistry = JSON.parse(originalRegistry),
    settings = originalSettings ? JSON.parse(originalSettings) : {};
  nextRegistry.activeProject = "hello";
  modifiedState = true;
  await fs.writeFile(registryFile, JSON.stringify(nextRegistry));
  await fs.writeFile(
    settingsFile,
    JSON.stringify({ ...settings, activeProject: "shopflow" }),
  );
  await call("start", "--no-browser");
  const next = JSON.parse(await call("status"));
  assert.equal(next.project, "hello");
  assert.equal(next.workbenchUrl,status.workbenchUrl,'Workbench origin must remain stable across stop/restart');
  assert.equal(next.portalUrl,status.portalUrl,'Portal automatic origin must remain stable across stop/restart');
  assert.equal(next.offlineUrl,status.offlineUrl,'Offline automatic origin must remain stable across stop/restart');
  const preferences=JSON.parse(await fs.readFile(portsFile,'utf8'));
  assert.equal(preferences.format,'seaf-port-preferences-v1');
  assert.equal(preferences.ports.workbench,Number(new URL(next.workbenchUrl).port));
  const helloKeys = await fetch(
    next.portalUrl +
      "/core/storage/jsonata/" +
      encodeURIComponent("($keys(components))"),
  ).then((r) => r.json());
  assert.ok(JSON.stringify(helloKeys).includes("demo.hello"));
  await call("stop");
  await waitStopped();
  cases.push({
    id: "selected-project-survives-restart-over-bootstrap-setting",
    status: "PASS",
  });
} finally {
  await call("stop").catch(() => {});
  await new Promise((resolve) => unrelated.close(resolve));
  if (modifiedState) {
    await waitStopped();
    await fs.writeFile(registryFile, originalRegistry);
    if (originalSettings === null) await fs.rm(settingsFile, { force: true });
    else await fs.writeFile(settingsFile, originalSettings);
  }
  const report = {
    format: "seaf-portable-launcher-gates-v1",
    status:
      cases.length === 8 && cases.every((c) => c.status === "PASS")
        ? "PASS"
        : "FAIL",
    bundle,
    isolatedPath: env.PATH,
    cases,
    passed: cases.filter((x) => x.status === "PASS").length,
    total: 8,
    completed: new Date().toISOString(),
    urls: status
      ? {
          portal: status.portalUrl,
          workbench: status.workbenchUrl,
          offline: status.offlineUrl,
        }
      : null,
  };
  await fs.mkdir("portable/state", { recursive: true });
  await fs.writeFile(
    "portable/state/launcher-gates.json",
    JSON.stringify(report, null, 2),
  );
  console.log(JSON.stringify(report));
}
