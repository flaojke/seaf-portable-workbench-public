import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { prepareRuntime, runtimeInputs } from "./prepare-runtime.mjs";
import { filesUnder, writeZip } from "./zip.mjs";
const here = path.dirname(fileURLToPath(import.meta.url)),
  repo = path.dirname(here);
const args = process.argv.slice(2),
  arg = (name) => {
    const index = args.indexOf(name);
    return index < 0 ? null : args[index + 1];
  };
const output = path.resolve(
  arg("--output") || path.join(repo, "dist/SEAF-Windows-x64"),
);
const cacheRoot = path.resolve(arg("--cache-root") || path.join(here, "cache"));
if (output === repo || repo.startsWith(output + path.sep))
  throw Error("Output must not replace the source workspace");
const allowDownload = !args.includes("--offline-build");
const runtime = await prepareRuntime({
  cacheRoot: path.join(cacheRoot, "runtime"),
  allowDownload,
});
const environment = {
  ...process.env,
  PATH: [runtime.nodeRoot, path.dirname(runtime.git), process.env.PATH].join(
    path.delimiter,
  ),
  NODE_OPTIONS: "--max-old-space-size=6144",
  ...(!allowDownload ? { npm_config_offline: "true" } : {}),
};
const run = (executable, parameters, cwd, extra = {}) =>
  new Promise((resolve, reject) => {
    const child = spawn(executable, parameters, {
      cwd,
      env: { ...environment, ...extra },
      stdio: "inherit",
      windowsHide: true,
    });
    child.on("error", reject);
    child.on("exit", (code) =>
      code === 0 ? resolve() : reject(Error(executable + " failed: " + code)),
    );
  });
const core = path.join(repo, "vendor/seaf-archtool-core"),
  mcp = path.join(repo, "seaf-mcp");
if (!args.includes("--skip-install")) {
  await run(
    runtime.node,
    [
      runtime.npm,
      "ci",
      "--no-audit",
      "--no-fund",
      ...(!allowDownload ? ["--offline"] : []),
    ],
    core,
  );
  await run(
    runtime.node,
    [
      runtime.npm,
      "ci",
      "--no-audit",
      "--no-fund",
      ...(!allowDownload ? ["--offline"] : []),
    ],
    mcp,
  );
}
if (!args.includes("--skip-build"))
  await run(runtime.node, [runtime.npm, "run", "build"], core, {
    VUE_APP_DOCHUB_MODE: "backend",
    VUE_APP_PLANTUML_SERVER: "ORIGIN",
    VUE_APP_CLICKSTREAM_ENABLE: "false",
    NODE_ENV: "production",
  });
await fs.access(path.join(core, "dist/index.html"));
await fs.mkdir(output, { recursive: true });
if (await fs.stat(path.join(output, "data")).catch(() => null))
  throw Error(
    "Output contains user data; choose a fresh release folder instead of overwriting it",
  );
if ((await fs.readdir(output)).length && !args.includes("--refresh"))
  throw Error(
    "Output is not empty. Choose a new --output or explicitly --refresh an existing build.",
  );
const copy = async (source, destination, options = {}) => {
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, {
    recursive: true,
    dereference: true,
    ...options,
  });
};
async function productionDependencies(source, name) {
  const inputHash = crypto
    .createHash("sha256")
    .update(await fs.readFile(path.join(source, "package.json")))
    .update(await fs.readFile(path.join(source, "package-lock.json")));
  const localLibraries = path.join(source, "libs");
  if (await fs.stat(localLibraries).catch(() => null))
    for (const relative of await filesUnder(localLibraries))
      inputHash
        .update(relative)
        .update(await fs.readFile(path.join(localLibraries, relative)));
  const hash = inputHash.digest("hex");
  const cache = path.join(cacheRoot, name + "-" + hash),
    marker = path.join(cache, ".installed");
  if (!(await fs.stat(marker).catch(() => null))) {
    await fs.mkdir(cache, { recursive: true });
    for (const file of ["package.json", "package-lock.json"])
      await copy(path.join(source, file), path.join(cache, file));
    if (await fs.stat(path.join(source, "libs")).catch(() => null))
      await copy(path.join(source, "libs"), path.join(cache, "libs"));
    await run(
      runtime.node,
      [
        runtime.npm,
        "ci",
        "--omit=dev",
        "--ignore-scripts",
        "--no-audit",
        "--no-fund",
        ...(!allowDownload ? ["--offline"] : []),
      ],
      cache,
    );
    await fs.writeFile(marker, hash);
  }
  return path.join(cache, "node_modules");
}
console.log("Copying portable runtime and application");
await prepareRuntime({
  cacheRoot: path.join(cacheRoot, "runtime"),
  destination: path.join(output, "runtime"),
  allowDownload: false,
});
const appCore = path.join(output, "app/core");
for (const entry of [
  "src",
  "public",
  "dist",
  "libs",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "LICENSE",
  "NOTICE",
  "UPSTREAM.json",
])
  await copy(path.join(core, entry), path.join(appCore, entry), {
    filter: (file) => ![".cache", ".git"].includes(path.basename(file)),
  });
for (const [source, name, target] of [
  [core, "core-production", path.join(appCore, "node_modules")],
  [mcp, "mcp-production", path.join(output, "app/seaf-mcp/node_modules")],
])
  await copy(await productionDependencies(source, name), target, {
    filter: (file) => path.basename(file) !== ".bin",
  });
for (const file of [
  "engine.mjs",
  "project-sources.mjs",
  "native-runtime.mjs",
  "query-worker.mjs",
  "server.mjs",
  "package.json",
  "package-lock.json",
  "README.md",
])
  await copy(path.join(mcp, file), path.join(output, "app/seaf-mcp", file));
await copy(
  path.join(mcp, "workbench"),
  path.join(output, "app/seaf-mcp/workbench"),
  { filter: (file) => !["test", "state"].includes(path.basename(file)) },
);
for (const name of [
  "launcher.mjs",
  "ports.mjs",
  "offline.mjs",
  "verify.mjs",
  "mcp.mjs",
  "mcp-config.mjs",
  "inputs.json",
])
  await copy(path.join(here, name), path.join(output, "portable", name));
for (const name of ["Start.cmd", "Stop.cmd", "MCP.cmd"])
  await copy(path.join(here, name), path.join(output, name));
await copy(path.join(repo, "examples"), path.join(output, "examples"), {
  filter: (file) =>
    ![".git", "node_modules", "state"].includes(path.basename(file)),
});
await copy(
  path.join(repo, "openspec/specs"),
  path.join(output, "openspec/specs"),
);
for (const name of ["README.md", "project.md"])
  await copy(
    path.join(repo, "openspec", name),
    path.join(output, "openspec", name),
  );
const { prepareOfflineAssets } = await import("./offline-assets.mjs");
await prepareOfflineAssets({
  cacheRoot: path.join(cacheRoot, "offline"),
  destination: path.join(output, "runtime/offline"),
  allowDownload,
});
await copy(
  path.join(appCore, "LICENSE"),
  path.join(output, "licenses/SEAF-CORE-LICENSE"),
);
await copy(
  path.join(appCore, "NOTICE"),
  path.join(output, "licenses/SEAF-CORE-NOTICE"),
);
await copy(
  path.join(output, "runtime/node/LICENSE"),
  path.join(output, "licenses/NODE-LICENSE"),
);
await copy(
  path.join(output, "runtime/git/LICENSE.txt"),
  path.join(output, "licenses/GIT-LICENSE.txt"),
);
for (const name of ["LICENSE", "NOTICE", "UPSTREAM.md"])
  await copy(path.join(repo, name), path.join(output, name));
await copy(path.join(here, "README.md"), path.join(output, "README.ru.md"));
await fs.writeFile(
  path.join(output, "README.txt"),
  [
    "SEAF-Portable — Windows 10/11 x64",
    "Extract the complete folder to a writable local directory. Run Start.cmd; Stop.cmd stops only this bundle.",
    "Node.js, Git, Java, PlantUML and draw.io are included. No Docker, administrator installation or internet is required to use local projects.",
    "User projects/settings/history are created in data/ on first start. Copy the complete folder after stopping it to move that state.",
    "External Windows directories remain external; reconnect missing paths on another computer. Do not copy running state.",
    "Optional data/settings.json fields: portalPort, workbenchPort, offlinePort, activeProject. By default, available loopback ports are selected.",
    "Open-source provenance and licenses: app/core/UPSTREAM.json, licenses/, runtime/offline/manifest.json, manifest.json.",
    "New functionality instructions: SEAF menu Доработки LSV See Проекты for local directories and Git connections.",
    "Russian instructions: README.ru.md. Fork attribution and original SEAF links: NOTICE and UPSTREAM.md.",
  ].join("\r\n") + "\r\n",
);
const rows = [];
for (const relative of await filesUnder(output))
  if (relative !== "manifest.json") {
    if (relative.startsWith("data/"))
      throw Error("Release must not contain user state: " + relative);
    if (relative.includes("/.git/") || /\.(log|env)$/.test(relative))
      throw Error("Unexpected local file in release: " + relative);
    rows.push({
      path: relative,
      sha256: crypto
        .createHash("sha256")
        .update(await fs.readFile(path.join(output, relative)))
        .digest("hex"),
    });
  }
const manifest = {
  format: "seaf-portable-v1",
  platform: "win32-x64",
  inputs: runtimeInputs,
  files: rows,
};
manifest.id = crypto
  .createHash("sha256")
  .update(JSON.stringify(manifest))
  .digest("hex");
await fs.writeFile(
  path.join(output, "manifest.json"),
  JSON.stringify(manifest, null, 2),
);
const result = { output, files: rows.length, manifest: manifest.id };
if (!args.includes("--no-zip")) {
  const zip = output + ".zip";
  console.log("Writing portable ZIP");
  Object.assign(result, {
    zip,
    ...(await writeZip(output, zip, {
      files: [...rows.map((row) => row.path), "manifest.json"].sort(),
      onProgress: (progress) =>
        console.log(
          "ZIP " +
            progress.files +
            " files, " +
            Math.round(progress.bytes / 1048576) +
            " MiB",
        ),
    })),
  });
  result.sha256 = crypto
    .createHash("sha256")
    .update(await fs.readFile(zip))
    .digest("hex");
  await fs.writeFile(
    zip + ".sha256",
    result.sha256 + "  " + path.basename(zip) + "\n",
  );
}
console.log(JSON.stringify(result));
