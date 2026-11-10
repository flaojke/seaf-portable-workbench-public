/** Publish an allowlisted, reproducible receipt from completed runs; never runs SEAF. */
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { NativeRuntime } from "../../seaf-mcp/native-runtime.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "../..");
const args = process.argv.slice(2);
const arg = (name, fallback) => {
  const index = args.indexOf(name);
  return index < 0 ? fallback : args[index + 1];
};
const input = (name, fallback) =>
  path.resolve(arg(name, path.join(here, fallback)));
const cleanupPath = input("--cleanup", "state/process-cleanup.json");
const unitPath = input("--units", "state/final-unit.tap");
const inputs = {
  file: input("--file", "state/file-1000-3000-final/results.json"),
  http: input("--http", "state/http-1000-final/results.json"),
  source: input("--source", "state/source-read-final/source-read.json"),
  suite: input("--suite", "state/fixtures-1000-3000-v3/fixtures.json"),
  semantic: input("--semantic", "state/semantic-proof.json"),
  profile: input("--profile", "state/profile-baseline-3000-v1/summary.json"),
  negative: input(
    "--negative",
    "state/smoke-file-100-cors-fixed-v1/results.json",
  ),
  publication: input(
    "--publication",
    "../../seaf-mcp/state/repository-layout-browser/receipt.json",
  ),
  ...Object.fromEntries(
    ["shopflow", "example"].flatMap((project) =>
      ["proposal", "validation", "applied"].map((stage) => [
        project + "_" + stage,
        input(
          "--" + project + "-" + stage,
          "../../seaf-mcp/state/layout-" + project + "-" + stage + ".json",
        ),
      ]),
    ),
  ),
};
const output = path.resolve(
  arg("--out", path.join(here, "state/curated-evidence")),
);
const sha = (value) => crypto.createHash("sha256").update(value).digest("hex");
const relative = (filename) => {
  const result = path.relative(repo, filename);
  assert(
    !result.startsWith("..") && !path.isAbsolute(result),
    "Outside repository",
  );
  return result.replaceAll(path.sep, "/");
};
const read = async (filename) =>
  JSON.parse(await fs.readFile(filename, "utf8"));
const records = Object.fromEntries(
  await Promise.all(
    Object.entries(inputs).map(async ([key, filename]) => [
      key,
      await read(filename),
    ]),
  ),
);
const { file, http, source, suite, semantic, profile, negative, publication } =
  records;
assert.equal(publication.status, "passed");
assert.equal(publication.tables, 8);
assert.equal(publication.validators, 15);
assert.equal(publication.visibleReport, true);
assert.deepEqual(publication.verifiedSizes, [1000, 3000]);
assert.deepEqual(publication.verifiedValues, ["3.711", "15.239"]);
for (const key of ["pageErrors", "failedResources", "badScriptResponses"])
  assert.equal(publication[key].length, 0);
const publications = ["shopflow", "example"].map((project) => {
  const proposal = records[project + "_proposal"];
  const validation = records[project + "_validation"];
  const applied = records[project + "_applied"];
  assert.equal(validation.ok, true);
  assert.equal(validation.rules, 15);
  assert.equal(validation.problems.length, 0);
  assert.equal(applied.status, "applied");
  assert.equal(applied.revision.fingerprint, validation.draftHash);
  return { project, proposalId: proposal.proposalId, validation, applied };
});
assert.equal(publications[0].applied.reload.status, "updated");
assert.equal(publications[0].applied.reload.problems.length, 0);
assert.equal(publications[1].applied.reload.status, "not_configured");
const cleanup = await read(cleanupPath);
assert.equal(cleanup.benchmarkWorkersStillRunning, 0);
const unitText = await fs.readFile(unitPath, "utf8");
assert.match(unitText, /(?:#|ℹ)\s+tests 9\b/);
assert.match(unitText, /(?:#|ℹ)\s+pass 9\b/);
assert.match(unitText, /(?:#|ℹ)\s+fail 0\b/);
assert(!/(?:https?|file):\/\/|[A-Za-z]:[\\/]/.test(unitText));
for (const report of [file, http, source, profile])
  assert.equal(report.status, "passed");
assert.equal(file.samples.length, 42);
assert.equal(http.samples.length, 21);
assert.equal(source.results.length, 14);
assert.equal(suite.fixtures.length, 14);
assert.equal(semantic.verifiedFixtures, 14);
assert.equal(source.samplesPerCase, 5);
assert.deepEqual(
  file.implementation,
  http.implementation,
  "Runtime source hashes changed",
);
assert.equal(file.config.node, http.config.node);
assert.equal(file.config.coreRoot, http.config.coreRoot);
assert.equal(source.node, file.config.node);
assert.equal(source.coreRoot, file.config.coreRoot);
assert.equal(profile.runtime.node, file.config.node);
assert.equal(profile.runtime.coreRoot, file.config.coreRoot);

const layouts = ["baseline", "v1", "v2", "v3", "v4", "v5", "v6"];
const omit = (value, keys) =>
  Object.fromEntries(
    Object.entries(value).filter(([key]) => !keys.includes(key)),
  );
const cleanse = (value) => {
  if (typeof value === "string")
    return value
      .replace(/(?:https?|file):\/\/\S+/g, "[address omitted]")
      .replace(/[A-Za-z]:[\\/][^\s\n]+/g, "[local path omitted]");
  if (Array.isArray(value)) return value.map(cleanse);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .filter(
          ([key]) =>
            !/^(url|origin|headers|location|stack|requestId|token|controlPort|pid|instance)$/i.test(
              key,
            ),
        )
        .map(([key, item]) => [key, cleanse(item)]),
    );
  return value;
};
const probe = (value) => {
  if (!value) return null;
  return Object.fromEntries(
    [
      "fixture",
      "global",
      "eventLoop",
      "memory",
      "importMs",
      "imported",
      "cpu",
      "node",
      "elapsedMs",
      "nonFixtureOrUnattributedParseCalls",
      "attribution",
    ]
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, value[key]]),
  );
};
function phase(value) {
  const result = cleanse(omit(value, ["requests"]));
  result.requestAggregates = { resourceTypes: {}, responseStatuses: {} };
  for (const request of value.requests || []) {
    const types = result.requestAggregates.resourceTypes;
    types[request.type || "unknown"] =
      (types[request.type || "unknown"] || 0) + 1;
    const statuses = result.requestAggregates.responseStatuses;
    const status = request.networkStatus ?? request.status ?? "none";
    statuses[status] = (statuses[status] || 0) + 1;
  }
  return result;
}
function browser(value) {
  if (!value) return null;
  return {
    status: value.status,
    started: value.started,
    completed: value.completed,
    markerTitle: value.markerTitle,
    focusContextId: value.focusContextId,
    graphPresentation: value.graphPresentation,
    repetitions: value.repetitions,
    browser: omit(value.browser, ["executablePath"]),
    methodology: value.methodology,
    runs: value.runs.map((run) => ({
      repetition: run.repetition,
      phases: Object.fromEntries(
        Object.entries(run.phases).map(([name, value]) => [name, phase(value)]),
      ),
      ...Object.fromEntries(
        [
          "pageErrors",
          "consoleErrors",
          "browserLogErrors",
          "unexpectedExternalRequests",
        ].map((key) => [key, cleanse(run[key] || [])]),
      ),
    })),
    ...Object.fromEntries(
      [
        "failures",
        "pageErrors",
        "consoleErrors",
        "browserLogErrors",
        "unexpectedExternalRequests",
      ].map((key) => [key, cleanse(value[key] || [])]),
    ),
  };
}
function samples(report, expectedSizes) {
  assert.equal(report.failures.length, 0);
  for (const N of expectedSizes)
    for (const layout of layouts) {
      const rows = report.samples.filter(
        (row) => row.systems === N && row.layout === layout,
      );
      assert.deepEqual(rows.map((row) => row.round).sort(), [1, 2, 3]);
      assert.equal(new Set(rows.map((row) => row.model.modelSha256)).size, 1);
    }
  return report.samples.map((row) => {
    assert.equal(row.status, "passed");
    assert.equal(row.integrations, row.systems * 3);
    assert.equal(row.model.counts.systems, row.systems);
    assert.equal(row.model.counts.integrations, row.systems * 3);
    assert.equal(row.model.counts.componentLinks, row.systems * 3);
    assert.equal(row.model.counts.contexts, 2);
    assert.equal(row.reload.length, 2);
    for (const value of [
      row.load,
      ...row.reload.map((reload) => reload.probe),
    ]) {
      assert.equal(value.node, "v22.23.4");
      assert.equal(value.global.readErrors + value.global.parseErrors, 0);
      if (report.config.transport === "file")
        assert.equal(value.fixture.uniqueFiles, row.source.yamlFiles);
    }
    if (report.config.transport === "http") {
      for (const value of [
        row.httpSourceLoad,
        ...row.reload.map((reload) => reload.httpSource),
      ]) {
        assert.equal(value.requests, row.source.yamlFiles);
        assert.equal(value.bytes, row.source.bytes);
      }
    }
    if (report.config.browser) {
      assert.equal(row.browser.status, "passed");
      for (const run of row.browser.runs) {
        for (const name of ["cold", "warm", "focus"]) {
          const value = run.phases[name];
          assert.equal(value.status, "passed");
          assert.equal(value.network.failedRequestCount, 0);
          assert.equal(value.network.unfinishedRequestCount, 0);
          assert(Number.isFinite(value.firstUiReadyMs ?? value.graphReadyMs));
        }
        assert.equal(run.phases.focus.marker.systemLabelCount, 50);
        assert.equal(run.phases.focus.marker.expectedLabelCount, 50);
      }
      for (const key of [
        "failures",
        "pageErrors",
        "consoleErrors",
        "browserLogErrors",
        "unexpectedExternalRequests",
      ])
        assert.equal(row.browser[key].length, 0);
    }
    return {
      label: row.label,
      round: row.round,
      layout: row.layout,
      systems: row.systems,
      integrations: row.integrations,
      source: row.source,
      status: row.status,
      coldStartMs: row.coldStartMs,
      load: probe(row.load),
      httpSourceLoad: row.httpSourceLoad,
      model: row.model,
      reload: row.reload.map((reload) => ({
        reloadMs: reload.reloadMs,
        probe: probe(reload.probe),
        httpSource: reload.httpSource,
      })),
      ...(row.browser ? { browser: browser(row.browser) } : {}),
      ...(row.validation ? { validation: row.validation } : {}),
    };
  });
}
const fileSamples = samples(file, [1000, 3000]);
const httpSamples = samples(http, [1000]);
const runtimeModels = {};
for (const N of [1000, 3000]) {
  const hashes = new Set(
    [...fileSamples, ...httpSamples]
      .filter((row) => row.systems === N)
      .map((row) => row.model.modelSha256),
  );
  assert.equal(
    hashes.size,
    1,
    "Different runtime models between layouts or transports",
  );
  runtimeModels[N] = [...hashes][0];
}
const sourceCases = source.results.map((row) => {
  assert.equal(row.status, "passed");
  assert.equal(row.samples.length, 5);
  assert.equal(row.runtimeCounts.systems, row.N);
  assert.equal(row.runtimeCounts.integrations, row.N * 3);
  for (const sample of row.samples) {
    assert.equal(sample.httpStatus, 200);
    assert.equal(sample.exactSourceMatch, true);
    assert.equal(sample.bytes, row.bytes);
    assert.equal(sample.characters, row.characters);
  }
  return omit(row, ["root"]);
});
assert.equal(
  new Set(sourceCases.map((row) => row.N + "/" + row.layout)).size,
  14,
);
for (const N of [1000, 3000])
  for (const layout of layouts)
    assert(sourceCases.some((row) => row.N === N && row.layout === layout));
const identities = new Set(sourceCases.map((row) => row.runtimeIdentity.id));
assert.equal(identities.size, 1, "Source-read runtimes changed");
const currentIdentity = await new NativeRuntime({
  bundleRoot: repo,
  node: file.config.node,
  coreRoot: file.config.coreRoot,
}).identity();
assert.deepEqual(
  currentIdentity,
  sourceCases[0].runtimeIdentity,
  "Pinned runtime changed since source-read measurements",
);
assert.equal(
  currentIdentity.files.find((entry) => entry.name === "core.lock").sha256,
  file.implementation.sourceHashes["package-lock.json"],
);
for (const [filename, expected] of Object.entries(
  file.implementation.sourceHashes,
)) {
  const absolute = filename.startsWith("benchmark/")
    ? path.join(here, filename.slice(10))
    : path.join(file.config.coreRoot, filename);
  assert.equal(
    sha(await fs.readFile(absolute)),
    expected,
    "Measured source changed: " + filename,
  );
}

const require = createRequire(import.meta.url);
const YAML = require(path.join(repo, "seaf-mcp/node_modules/yaml"));
const coverage = [];
for (const N of [1000, 3000]) {
  const fixture = suite.fixtures.find(
    (row) => row.layout === "baseline" && row.counts.systems === N,
  );
  const root = YAML.parse(
    await fs.readFile(path.join(fixture.root, "root.yaml"), "utf8"),
  );
  const contexts = {};
  for (const filename of root.imports)
    Object.assign(
      contexts,
      YAML.parse(await fs.readFile(path.join(fixture.root, filename), "utf8"))
        .contexts || {},
    );
  const masks = [
    ...new Set(
      Object.values(contexts).flatMap((context) => context.components || []),
    ),
  ];
  assert.equal(masks.length, N);
  assert(masks.every((mask) => /^sys\d{5}$/.test(mask)));
  coverage.push({
    systems: N,
    contextSizes: Object.fromEntries(
      Object.entries(contexts).map(([id, context]) => [
        id,
        context.components.length,
      ]),
    ),
    uniqueContextMasks: masks.length,
    literalMasks: masks.length,
    wildcardMasks: 0,
    inferredPredicatePairs: N * masks.length,
    scope:
      "Static expression/data inference, not an observed runtime invocation counter",
  });
}
assert.deepEqual(profile.modelBefore, profile.modelAfter);
assert.equal(profile.modelBefore.modelSha256, runtimeModels[3000]);
assert.equal(profile.workerExit.code, 0);
assert.equal(profile.workerExit.signal, null);
const cpuProfile = await fs.readFile(profile.profile.file);
assert.equal(sha(cpuProfile), profile.profile.sha256);
const topFunctions = profile.profile.topFunctions.map(({ url, ...row }) => ({
  ...row,
  ...(url
    ? { source: url.startsWith("file:") ? relative(fileURLToPath(url)) : url }
    : {}),
}));
const negativeBrowser = browser(negative.samples[0].browser);
assert.equal(negativeBrowser.status, "failed");
assert.equal(negativeBrowser.runs[0].phases.cold.status, "passed");
assert.equal(negativeBrowser.runs[0].phases.warm.status, "passed");
assert.equal(negativeBrowser.runs[0].phases.focus.status, "failed");
assert.match(negativeBrowser.runs[0].phases.focus.error, /SmartAnts/);
const metadata = (report) => ({
  format: report.format,
  status: report.status,
  started: report.started,
  completed: report.completed,
  synthetic: report.synthetic,
  productionWrites: report.productionWrites,
  config: omit(report.config, ["suitePath", "node", "coreRoot"]),
  host: report.host,
  implementation: report.implementation,
  rendererCacheScope: report.rendererCacheScope,
});
const jsonArtifacts = {
  "process-cleanup.json": cleanup,
  "publication-mcp.json": { publications, pushPerformed: false },
  "publication-browser.json": cleanse(
    omit(publication, ["url", "screenshot", "tableScreenshots"]),
  ),
  "file-samples.json": { ...metadata(file), samples: fileSamples },
  "http-samples.json": { ...metadata(http), samples: httpSamples },
  "source-reads.json": {
    format: source.format,
    status: source.status,
    created: source.created,
    completed: source.completed,
    scope: source.scope,
    characterDefinition: source.characterDefinition,
    samplesPerCase: source.samplesPerCase,
    productionWrites: source.productionWrites,
    results: sourceCases,
  },
  "fixtures.json": {
    format: suite.format,
    synthetic: suite.synthetic,
    productionWrites: suite.productionWrites,
    scope:
      "Engine full-model hashes include six source sections; runtime hashes cover components/integrations/contexts/catalogs. They are different hash scopes, not a disagreement.",
    fixtures: suite.fixtures.map((row) => omit(row, ["root", "uiEntrypoint"])),
    semanticProof: semantic,
    runtimeModelHashes: runtimeModels,
  },
  "profile.json": {
    format: profile.format,
    status: profile.status,
    started: profile.started,
    completed: profile.completed,
    synthetic: profile.synthetic,
    productionWrites: profile.productionWrites,
    purpose: profile.purpose,
    fixture: omit(profile.fixture, ["suitePath", "root"]),
    host: profile.host,
    samplingIntervalMicros: profile.samplingIntervalMicros,
    modelBefore: profile.modelBefore,
    reloadWallMs: profile.reloadWallMs,
    reloadResponse: profile.reloadResponse,
    reloadProbe: probe(profile.reloadProbe),
    modelAfter: profile.modelAfter,
    profile: {
      ...omit(profile.profile, ["file", "topFunctions"]),
      topFunctions,
    },
    workerExit: omit(profile.workerExit, ["ownedPid"]),
    coverage,
  },
  "smartants-negative.json": {
    status: "failed",
    purpose:
      "Separate 100-system smoke observation; excluded from successful PlantUML timing series",
    label: negative.samples[0].label,
    systems: 100,
    focusSystems: 50,
    browser: negativeBrowser,
  },
  "input-hashes.json": {
    inputs: await Promise.all(
      Object.entries({ ...inputs, cleanup: cleanupPath, units: unitPath }).map(
        async ([kind, filename]) => ({
          kind,
          source: relative(filename),
          sha256: sha(await fs.readFile(filename)),
        }),
      ),
    ),
    rawCpuProfile: {
      source: relative(profile.profile.file),
      bytes: cpuProfile.length,
      sha256: sha(cpuProfile),
    },
    runtimeIdentity: currentIdentity,
    runtimeIdentityScope:
      "Source-read records each of 14 native identities. File/HTTP runs record the same configured Node/core paths, Node version and identical source hashes; the current pinned files match the recorded source-read identity. File/HTTP samples did not record a per-process executable hash, so this is not retroactive per-process hashing.",
    curationScript: {
      source: relative(fileURLToPath(import.meta.url)),
      sha256: sha(await fs.readFile(fileURLToPath(import.meta.url))),
    },
  },
};
function checkSafe(value, key = "") {
  if (typeof value === "number")
    assert(Number.isFinite(value), "Non-finite metric " + key);
  if (typeof value === "string") {
    assert(!/(?:https?|file):\/\//.test(value), "Address leaked at " + key);
    assert(
      !/[A-Za-z]:[\\/]/.test(value),
      "Absolute local path leaked at " + key,
    );
  }
  if (value && typeof value === "object")
    for (const [name, item] of Object.entries(value)) {
      assert(
        !/^(token|controlPort|workspace|coreRoot|suitePath|executablePath|pid|instance|url|focusUrl|origin|headers)$/i.test(
          name,
        ),
        "Private field " + name,
      );
      checkSafe(item, key + "/" + name);
    }
}
for (const value of Object.values(jsonArtifacts)) checkSafe(value);
await fs.mkdir(output, { recursive: true });
for (const [filename, value] of Object.entries(jsonArtifacts))
  await fs.writeFile(
    path.join(output, filename),
    JSON.stringify(value, null, 2) + "\n",
  );
await fs.writeFile(path.join(output, "final-unit.tap"), unitText);
const checks = {
  format: "seaf-layout-curation-checks-v1",
  status: "passed",
  measurementReruns: 0,
  fileSamples: 42,
  httpSamples: 21,
  sourceReadCases: 14,
  sourceReadResponses: 70,
  reloadsPerProcess: 2,
  fileReloads: 84,
  httpReloads: 42,
  browserRuns: 42,
  browserPhases: 126,
  sourceRuntimeIdentities: identities.size,
  sharedRecordedSourceHashes: true,
  currentPinnedRuntimeMatchesRecordedSourceIdentity: true,
  runtimeIdentity: currentIdentity.id,
  allModelCountsAndHashesEquivalentBySize: true,
  runtimeModelHashes: runtimeModels,
  allMainBrowserPhasesPassed: true,
  mainBrowserJsOrNetworkErrors: 0,
  smartantsNegativeRetained: true,
  modelUnchangedByProfile: true,
  ownProfileWorkerExited: true,
  benchmarkWorkersStillRunning: cleanup.benchmarkWorkersStillRunning,
  unitTestsPassed: 9,
  unitTestsFailed: 0,
  publicationTables: publication.tables,
  publicationValidators: publication.validators,
  publicationBrowserPassed: true,
  privateFieldsAndAddressesAbsent: true,
  artifacts: await Promise.all(
    [...Object.keys(jsonArtifacts), "final-unit.tap"].map(async (filename) => ({
      filename,
      sha256: sha(await fs.readFile(path.join(output, filename))),
    })),
  ),
};
await fs.writeFile(
  path.join(output, "checks.json"),
  JSON.stringify(checks, null, 2) + "\n",
);
const findings = `# Один профиль CPU: baseline, 3000 систем\n\nПрофиль снят отдельно после сравнительной серии. Один reload занял ${profile.reloadWallMs.toFixed(1)} мс; sampling window ${profile.profile.profileDurationMs.toFixed(1)} мс. Это иллюстрация горячих функций, а не дополнительный sample для сравнительных медиан: profiler/probe меняют нагрузку. Полная модель до/после совпала, дочерний процесс завершился с кодом 0.\n\n| Функция | Self sample time, мс | Доля всех samples |\n|---|---:|---:|\n${topFunctions
  .slice(0, 10)
  .map(
    (row) =>
      `| ${row.name} | ${row.totalSamplesMs.toFixed(1)} | ${row.percentage.toFixed(2)}% |`,
  )
  .join(
    "\n",
  )}\n\nВ src/global/jsonata/driver.mjs:49 функция wcard разбивает шаблон и создаёт новый RegExp при каждом вызове. В public/metamodel/dochub/rules/validators.yaml:29 правило archtool.metamodel.contexts.outof выполняет для каждого компонента фильтр по всем distinct(contexts.*.components). В этих fixtures full содержит N точных ID, focus — 50 из них; получается N уникальных масок, и статическая структура выражения предполагает N × N проверок: 1 млн при N=1000 и 9 млн при N=3000. Это вывод из кода и данных, не измеренный счётчик вызовов. В backend/storage/manager.mjs applyManifest ожидает validators и вне условия warmupNeeded.\n\nГорячая lookup в node_modules/jsonata/jsonata.js:5338 ищет переменную в environment bindings, поэтому её нельзя автоматически считать модельной функцией $lookup. GC занимает ${topFunctions.find((row) => row.name === "(garbage collector)").percentage.toFixed(2)}%; профиль не даёт права приписывать весь GC только RegExp.\n\nЧтение четырёх fixture YAML заняло суммарно ${profile.reloadProbe.fixture.readMs.toFixed(1)} мс; YAML.parse — ${profile.reloadProbe.fixture.parseMs.toFixed(1)} мс под profiler. Вместе с горячими функциями это указывает на стоимость вычислений/валидации, а не на чтение четырёх файлов как основной bottleneck. Эти инструментированные parse timings нельзя смешивать с неинструментированными медианами основной серии.\n\nРост полного reload примерно в семь раз при росте N втрое согласуется с таким квадратичным участком плюс фиксированной/линейной работой. Единственный профиль не доказывает точную асимптотику всей системы и не изолирует стоимость каждого правила.\n\nКандидат отдельной последующей оптимизации: индекс точных ID, отдельная обработка wildcard-масок, ограниченный кеш компиляции шаблонов и прекращение поиска после первого совпадения. Нужна проверка эквивалентности находок для точных ID, * и **, вложенных идентификаторов и отсутствующих компонентов. В исследовании это не внедрялось; frozen product/worker не менялись.\n`;
await fs.writeFile(path.join(output, "profile-findings.md"), findings);
await fs.writeFile(
  path.join(output, "README.md"),
  `# Доказательства исследования структуры репозитория\n\nСводка завершённых synthetic native Windows измерений. Измерения при curation не повторяются.\n\n- file-samples.json: все 42 process samples (7 layouts × 2 размера × 3 повтора), 84 reload, 126 browser phases с timing/navigation/marker/network/error метриками. Сетевые запросы сведены к count/status/type/bytes без адресов.\n- http-samples.json: все 21 process samples (7 × 1000 систем × 3), 42 reload; искусственная задержка источника 10 мс, browser не запускался.\n- source-reads.json: все 14 случаев и 70 отдельных чтений defining YAML, bytes/characters, HTTP status, exactSourceMatch и SHA-256.\n- fixtures.json: counts, file/import statistics, SHA-256 секций и semantic proof; различие областей Engine и runtime model hash указано явно.\n- profile.json и profile-findings.md: один отдельный CPU profile reload baseline3000; top self-time functions и осторожный вывод о горячем валидаторе. В сравнительные медианы не входит.\n- smartants-negative.json: сохранённый провал отдельного smoke100/фокус50; он не выдан за успешное измерение SmartAnts. Основная серия использует PlantUML/Graphviz.\n- input-hashes.json: SHA-256 сырых reports/profile и runtime/source identity. Сырые state-файлы остаются локальными и игнорируются Git.\n- checks.json: выполненные проверки 42/21/14, 70 ответов, counts/hash identity, browser readiness/errors, завершение profile worker и отсутствие приватных полей.\n\nПодготовить отчёт из корня репозитория: node benchmarks/repository-layout/curate.mjs. Можно передать --file, --http, --source, --suite, --semantic, --profile, --negative и --out. Скрипт читает уже готовые receipts, проверяет зафиксированные исходники/текущий pinned runtime и не запускает сервер/браузер. checks.json вычисляет hashes публикуемых JSON, а input-hashes.json — исходных receipts; замена входа/исходника с несовместимыми данными завершится ошибкой.\n\nОграничение runtime identity: каждый source-read runtime записал hash исполняемого Node и пяти core файлов. File/HTTP серии записали одинаковый Node/core путь, версию Node и общий набор source hashes; текущие pinned файлы совпадают с записанным source identity. Per-process executable hash для 63 process samples не записывался задним числом.\n\nBrowser cold означает новый BrowserContext; browser process и кеш ОС не cold. Warm — reload той же context с HTTP cache. Focus50 открывается полной навигацией с тёплыми HTTP assets, но renderer cache новый для каждого process sample. Проба измеряет readFileSync/YAML.parse, не всю стоимость merge/provenance/validation. Три повтора дают разброс, но не доказательство небольших процентных различий.\n`,
);
await fs.appendFile(
  path.join(output, "README.md"),
  "\nДополнительные проверки: final-unit.tap сохранён без изменения (9/9 PASS), process-cleanup.json фиксирует 0 benchmark workers; publication-browser.json подтверждает видимый опубликованный отчёт, восемь таблиц, два размера/значения, 15 валидаторов и отсутствие browser/resource/HTTP errors. Адрес и абсолютные пути скриншотов исключены. publication-mcp.json содержит proposal IDs, проверки и Git/directory revisions; reload локального example не настроен и не выдан за выполненный. Push не выполнялся.\n\nБез --out скрипт безопасно пишет только benchmarks/repository-layout/state/curated-evidence; он не создаёт активный OpenSpec change после архивации. Для публикации явно задайте reviewed directory: `node benchmarks/repository-layout/curate.mjs --out <reviewed-evidence-directory>`.\n",
);
for (const filename of ["README.md", "profile-findings.md"])
  checks.artifacts.push({
    filename,
    sha256: sha(await fs.readFile(path.join(output, filename))),
  });
await fs.writeFile(
  path.join(output, "checks.json"),
  JSON.stringify(checks, null, 2) + "\n",
);
console.log(
  JSON.stringify({
    status: "passed",
    output: relative(output),
    fileSamples: 42,
    httpSamples: 21,
    sourceReadCases: 14,
    sourceReadResponses: 70,
    runtimeIdentity: currentIdentity.id,
    measurementReruns: 0,
  }),
);
