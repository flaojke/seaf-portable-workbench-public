/** One illustrative reload CPU profile. This is not a layout timing trial. */
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import { performance } from "node:perf_hooks";
import { freePort } from "../../seaf-mcp/native-runtime.mjs";
import { modelHash } from "./fixtures.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)),
  repo = path.resolve(here, "../..");
const args = process.argv.slice(2),
  arg = (name, fallback) => {
    const index = args.indexOf(name);
    return index < 0 ? fallback : args[index + 1];
  };
const suitePath = path.resolve(
  arg("--suite", path.join(here, "state/fixtures-1000-3000-v3/fixtures.json")),
);
const output = path.resolve(
  arg("--out", path.join(here, "state/profile-" + Date.now())),
);
const systems = Number(arg("--size", 3000)),
  layout = arg("--layout", "baseline");
const samplingIntervalMicros = Number(arg("--sampling-us", 1000));
const suite = JSON.parse(await fs.readFile(suitePath, "utf8"));
const fixtures = suite.fixtures.filter(
  (fixture) => fixture.layout === layout && fixture.counts.systems === systems,
);
if (fixtures.length !== 1)
  throw Error("Choose exactly one verified fixture by size and layout");
if (
  !Number.isInteger(samplingIntervalMicros) ||
  samplingIntervalMicros < 100 ||
  samplingIntervalMicros > 10000
)
  throw Error("Invalid sampling interval");
const fixture = fixtures[0],
  pins = JSON.parse(
    await fs.readFile(path.join(repo, "portable/inputs.json"), "utf8"),
  );
const node = path.resolve(
  arg(
    "--node",
    path.join(
      repo,
      "portable/cache/runtime",
      "node-" + pins.node.version,
      pins.node.archiveDirectory,
      "node.exe",
    ),
  ),
);
const coreRoot = path.resolve(
  arg("--core", path.join(repo, "vendor/seaf-archtool-core")),
);
await fs.mkdir(output, { recursive: true });
if ((await fs.readdir(output)).length)
  throw Error("Choose a new or empty profile output directory");
const profileOutput = path.join(output, "reload.cpuprofile"),
  configFile = path.join(output, "worker.json");
const token = crypto.randomBytes(32).toString("hex"),
  instance = crypto.randomUUID(),
  port = await freePort();
const configuration = {
  workspace: fixture.root,
  coreRoot,
  port,
  token,
  instance,
  transport: "file",
  rootManifest: "file:///root.yaml",
  profileOutput,
  samplingIntervalMicros,
};
await fs.writeFile(configFile, JSON.stringify(configuration, null, 2));
const report = {
  format: "seaf-single-reload-cpu-profile-v1",
  status: "running",
  started: new Date().toISOString(),
  synthetic: true,
  productionWrites: false,
  purpose:
    "Illustrative hotspot attribution for one reload; profiler overhead makes these durations unsuitable for the layout comparison table.",
  fixture: {
    suitePath,
    layout,
    systems,
    counts: fixture.counts,
    root: fixture.root,
    sectionHashes: fixture.sectionHashes,
  },
  runtime: { node, coreRoot },
  host: {
    platform: process.platform,
    release: os.release(),
    cpu: os.cpus()[0]?.model,
    logicalCpus: os.cpus().length,
  },
  samplingIntervalMicros,
};
const save = () =>
  fs.writeFile(
    path.join(output, "summary.json"),
    JSON.stringify(report, null, 2),
  );
await save();
const pause = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const json = async (url, options = {}) => {
  const response = await fetch(url, {
      ...options,
      signal: options.signal || AbortSignal.timeout(180000),
    }),
    text = await response.text();
  if (!response.ok)
    throw Error("HTTP " + response.status + " " + text.slice(0, 1200));
  return text ? JSON.parse(text) : {};
};
const environment = {};
for (const key of [
  "SYSTEMROOT",
  "SystemRoot",
  "WINDIR",
  "TEMP",
  "TMP",
  "USERPROFILE",
  "LOCALAPPDATA",
])
  if (process.env[key]) environment[key] = process.env[key];
environment.PATH = path.dirname(node);
let worker,
  controlPort,
  profileControlPort,
  logs = "",
  spawnError,
  profiling = false;
const origin = "http://127.0.0.1:" + port;
const control = (method = "GET", route = "/metrics") =>
  json("http://127.0.0.1:" + controlPort + route, {
    method,
    headers: { "X-Bench-Token": token },
  });
const profiler = (method, route) =>
  json("http://127.0.0.1:" + profileControlPort + route, {
    method,
    headers: { "X-Bench-Token": token },
  });
async function verifyModel() {
  const expression =
    '{"components":components,"integrations":integrations,"contexts":contexts,"catalogs":catalogs}';
  const data = await json(
    origin +
      "/core/storage/jsonata/" +
      encodeURIComponent("(" + expression + ")"),
  );
  for (const section of ["components", "integrations", "contexts", "catalogs"])
    if (modelHash(data[section]) !== fixture.sectionHashes[section])
      throw Error("Profile model differs from fixture: " + section);
  return {
    systems: Object.keys(data.components).length,
    integrations: Object.keys(data.integrations).length,
    modelSha256: modelHash(data),
  };
}
async function summarizeProfile() {
  const profile = JSON.parse(await fs.readFile(profileOutput, "utf8"));
  if (
    !Array.isArray(profile.samples) ||
    !profile.samples.length ||
    !Array.isArray(profile.timeDeltas) ||
    profile.samples.length !== profile.timeDeltas.length
  )
    throw Error("CPU profile has no complete sample/time attribution");
  const nodes = new Map(profile.nodes.map((node) => [node.id, node])),
    functions = new Map();
  let totalMicroseconds = 0,
    activeMicroseconds = 0;
  for (let index = 0; index < profile.samples.length; index++) {
    const node = nodes.get(profile.samples[index]),
      delta = profile.timeDeltas[index];
    if (!node || !Number.isFinite(delta) || delta < 0)
      throw Error("Invalid CPU profile sample");
    const frame = node.callFrame,
      name = frame.functionName || "(anonymous)",
      line = frame.lineNumber >= 0 ? frame.lineNumber + 1 : null,
      column = frame.columnNumber >= 0 ? frame.columnNumber + 1 : null;
    const key = JSON.stringify([name, frame.url, line, column]);
    if (!functions.has(key))
      functions.set(key, {
        name,
        url: frame.url || null,
        line,
        column,
        samples: 0,
        microseconds: 0,
      });
    const row = functions.get(key);
    row.samples++;
    row.microseconds += delta;
    totalMicroseconds += delta;
    if (name !== "(idle)") activeMicroseconds += delta;
  }
  const rows = [...functions.values()]
    .map(({ microseconds, ...row }) => ({
      ...row,
      totalSamplesMs: microseconds / 1000,
      percentage: totalMicroseconds
        ? (100 * microseconds) / totalMicroseconds
        : 0,
      percentageOfActive:
        row.name === "(idle)" || !activeMicroseconds
          ? 0
          : (100 * microseconds) / activeMicroseconds,
    }))
    .sort((a, b) => b.totalSamplesMs - a.totalSamplesMs);
  const topFunctions = rows.slice(0, 50);
  for (const row of topFunctions) {
    if (!row.url?.startsWith("file:") || !row.line) continue;
    try {
      const file = fileURLToPath(row.url),
        relative = path.relative(coreRoot, file);
      if (
        relative === ".." ||
        relative.startsWith(".." + path.sep) ||
        path.isAbsolute(relative)
      )
        continue;
      const lines = (await fs.readFile(file, "utf8")).split(/\r?\n/);
      row.sourceLineText = lines[row.line - 1]?.slice(0, 240) ?? null;
    } catch {
      row.sourceLineText = null;
    }
  }
  await fs.writeFile(
    path.join(output, "top-functions.json"),
    JSON.stringify(rows, null, 2),
  );
  const cell = (value) =>
    String(value ?? "—")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
  const table = [
    "# CPU self-time during one SEAF reload",
    "",
    "V8 call-frame positions are one-based below and are not remapped through TypeScript source maps. Sample time is illustrative and includes profiler/probe overhead.",
    "",
    "| Function | URL | Line | Self sample ms | Share of sampled time |",
    "|---|---|---:|---:|---:|",
    ...topFunctions.map(
      (row) =>
        `| ${cell(row.name)} | ${cell(row.url)} | ${cell(row.line)} | ${row.totalSamplesMs.toFixed(3)} | ${row.percentage.toFixed(2)}% |`,
    ),
  ];
  await fs.writeFile(
    path.join(output, "top-functions.md"),
    table.join("\n") + "\n",
  );
  return {
    file: profileOutput,
    bytes: (await fs.stat(profileOutput)).size,
    sha256: crypto
      .createHash("sha256")
      .update(await fs.readFile(profileOutput))
      .digest("hex"),
    nodes: profile.nodes.length,
    samples: profile.samples.length,
    profileDurationMs: (profile.endTime - profile.startTime) / 1000,
    attributedSamplesMs: totalMicroseconds / 1000,
    activeSamplesMs: activeMicroseconds / 1000,
    attribution:
      "Self sample time uses timeDeltas at each sampled leaf; functions aggregate identical V8 call frames. percentage denominator includes idle/GC. Positions are V8 call frames, not source-map remapped.",
    topFunctions,
  };
}
try {
  worker = spawn(
    node,
    [
      "--import",
      pathToFileURL(path.join(coreRoot, "node_modules/tsx/dist/loader.mjs"))
        .href,
      path.join(here, "profile-worker.mjs"),
      configFile,
    ],
    {
      cwd: coreRoot,
      env: environment,
      windowsHide: true,
      stdio: ["ignore", "pipe", "pipe"],
    },
  );
  worker.on("error", (error) => {
    spawnError = error;
  });
  const collect = (chunk) => {
    logs = (logs + chunk.toString()).slice(-50000);
    const normal = /BENCH_CONTROL=(\d+)/.exec(logs),
      profile = /BENCH_PROFILE_CONTROL=(\d+)/.exec(logs);
    if (normal) controlPort = Number(normal[1]);
    if (profile) profileControlPort = Number(profile[1]);
  };
  worker.stdout.on("data", collect);
  worker.stderr.on("data", collect);
  const deadline = Date.now() + 180000;
  let ready = false;
  while (Date.now() < deadline) {
    if (spawnError) throw spawnError;
    if (worker.exitCode !== null)
      throw Error("Profile worker exited: " + worker.exitCode + " " + logs);
    if (controlPort && profileControlPort) {
      const metrics = await control();
      if (metrics.error)
        throw Error("Core import failed: " + JSON.stringify(metrics.error));
      try {
        const health = await json(origin + "/health", {
          signal: AbortSignal.timeout(1000),
        });
        if (health.nativeInstance === instance) {
          ready = true;
          break;
        }
      } catch {}
    }
    await pause(75);
  }
  if (!ready) throw Error("Profile worker readiness timed out");
  report.modelBefore = await verifyModel();
  await control("POST", "/reset");
  report.profilerStart = await profiler("POST", "/start");
  profiling = true;
  const started = performance.now();
  report.reloadResponse = await json(origin + "/core/storage/reload", {
    method: "PUT",
  });
  report.reloadWallMs = performance.now() - started;
  report.profilerStop = await profiler("POST", "/stop");
  profiling = false;
  report.reloadProbe = await control();
  report.modelAfter = await verifyModel();
  report.profile = await summarizeProfile();
  report.status = "passed";
} catch (error) {
  report.status = "failed";
  report.error = error.stack || error.message;
  process.exitCode = 1;
} finally {
  if (profiling && profileControlPort)
    await profiler("POST", "/stop").catch((error) => {
      report.profilerCleanupError = error.message;
    });
  if (worker) {
    if (controlPort)
      await control("POST", "/stop").catch((error) => {
        report.stopControlError = error.message;
      });
    const deadline = Date.now() + 5000;
    while (
      worker.exitCode === null &&
      worker.signalCode === null &&
      Date.now() < deadline
    )
      await pause(50);
    if (worker.exitCode === null && worker.signalCode === null) worker.kill();
    report.workerExit = {
      code: worker.exitCode,
      signal: worker.signalCode,
      ownedPid: worker.pid,
    };
  }
  await fs.writeFile(path.join(output, "worker.log"), logs);
  report.completed = new Date().toISOString();
  await save();
}
console.log(
  JSON.stringify({
    status: report.status,
    output,
    reloadWallMs: report.reloadWallMs,
    profile: report.profile?.file,
    top: report.profile?.topFunctions.slice(0, 8).map((row) => ({
      name: row.name,
      url: row.url,
      line: row.line,
      totalSamplesMs: row.totalSamplesMs,
      percentage: row.percentage,
    })),
  }),
);
