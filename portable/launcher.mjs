import fs from "node:fs/promises";
import path from "node:path";
import http from "node:http";
import crypto from "node:crypto";
import { spawn } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(
  process.env.SEAF_PORTABLE_ROOT || path.join(here, ".."),
);
const data = path.join(root, "data"),
  runFile = path.join(data, "run.json");
const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const read = (file) =>
  fs
    .readFile(file, "utf8")
    .then(JSON.parse)
    .catch((e) => {
      if (e.code !== "ENOENT") throw e;
      return null;
    });
const openBrowser = (url) =>
  spawn(
    path.join(
      process.env.SystemRoot || process.env.WINDIR || "C:/Windows",
      "explorer.exe",
    ),
    [url],
    { windowsHide: true, stdio: "ignore" },
  )
    .on("error", () => {})
    .unref();
async function running() {
  const record = await read(runFile);
  if (!record) return null;
  if (
    typeof record.root !== "string" ||
    path.resolve(record.root).toLowerCase() !== root.toLowerCase()
  )
    return null;
  try {
    const response = await fetch(record.controlUrl + "/status", {
      headers: { "x-seaf-token": record.token },
      signal: AbortSignal.timeout(1000),
    });
    if (response.ok) {
      const status = await response.json();
      if (
        typeof status.root === "string" &&
        path.resolve(status.root).toLowerCase() === root.toLowerCase()
      )
        return status;
    }
  } catch {}
  return null;
}
async function ensureData(initialActiveProject) {
  await fs.mkdir(data, { recursive: true });
  const registry = path.join(data, "projects.json");
  if (await read(registry)) return registry;
  const projects = [];
  for (const [id, title] of [
    ["shopflow", "ShopFlow"],
    ["hello", "Hello — системы и справочники"],
  ]) {
    const example = path.join(root, "examples", id);
    await fs.access(path.join(example, "root.yaml"));
    await fs.cp(example, path.join(data, "projects", id), {
      recursive: true,
      filter: (file) => !file.split(path.sep).includes(".git"),
    });
    projects.push({
      id,
      title,
      source: { kind: "directory", provider: "local" },
      root: "projects/" + id,
      manifest: "root.yaml",
      writable: true,
      validation: {
        runtime: "native",
        workspace: "projects/" + id,
        manifest: "workspace/root.yaml",
      },
    });
  }
  await fs.writeFile(
    registry,
    JSON.stringify(
      {
        activeProject: projects.some(
          (project) => project.id === initialActiveProject,
        )
          ? initialActiveProject
          : "shopflow",
        projects,
      },
      null,
      2,
    ),
  );
  return registry;
}
async function serve() {
  const { verifyBundle } = await import("./verify.mjs");
  await verifyBundle(root);
  const {readPortPreferences,selectPort,savePortPreferences}=await import('./ports.mjs');
  const portCache=path.join(data,'ports.json');
  const preferredPorts=await readPortPreferences(portCache);
  const settings = (await read(path.join(data, "settings.json"))) || {};
  const registry = await ensureData(settings.activeProject);
  const node = path.join(root, "runtime/node/node.exe"),
    git = path.join(root, "runtime/git/cmd/git.exe");
  await fs.access(node);
  await fs.access(git);
  process.env.PATH = [
    path.dirname(node),
    path.dirname(git),
    path.join(root, "runtime/git/ucrt64/bin"),
    path.join(root, "runtime/git/usr/bin"),
    process.env.SystemRoot ? path.join(process.env.SystemRoot, "System32") : "",
  ]
    .filter(Boolean)
    .join(path.delimiter);
  Object.assign(process.env, {
    SEAF_PORTABLE_ROOT: root,
    SEAF_PROJECTS_CONFIG: registry,
    SEAF_MCP_STATE: path.join(data, "state"),
    SEAF_GIT: git,
  });
  const { createOfflineServer } = await import(
    pathToFileURL(path.join(here, "offline.mjs")).href
  );
  const { Engine } = await import(
    pathToFileURL(path.join(root, "app/seaf-mcp/engine.mjs")).href
  );
  const { createWorkbenchServer } = await import(
    pathToFileURL(path.join(root, "app/seaf-mcp/workbench/server.mjs")).href
  );
  const { NativeRuntime } = await import(
    pathToFileURL(path.join(root, "app/seaf-mcp/native-runtime.mjs")).href
  );
  const engine = new Engine(registry, process.env.SEAF_MCP_STATE);
  let offline,workbench,portal,control,runtime;
  const token = crypto.randomBytes(32).toString("hex");
  const close = async () => {
    if (control) control.closeAllConnections?.();
    if (workbench) {
      workbench.server.closeAllConnections?.();
      await new Promise((resolve) => workbench.server.close(resolve));
    }
    for (const engineRuntime of engine.runtimes.values())
      await engineRuntime.closeAll();
    await runtime?.closeAll();
    await offline?.stop();
    await fs.rm(runFile, { force: true });
    setTimeout(() => process.exit(0), 40);
  };
  try {
    const offlinePort=await selectPort({setting:settings.offlinePort,preferred:preferredPorts.offline,name:'offline'});
    offline=await createOfflineServer({port:offlinePort,assetsRoot:path.join(root,'runtime/offline')});
    process.env.SEAF_OFFLINE_URL=offline.url;
    process.env.SEAF_DRAWIO_URL=offline.url+'/?embed=1&proto=json&spin=1&libraries=1&offline=1';
    const workbenchPort=await selectPort({setting:settings.workbenchPort,preferred:preferredPorts.workbench,name:'workbench'});
    process.env.SEAF_WORKBENCH_URL='http://127.0.0.1:'+workbenchPort;
    // Bind the workbench before starting native child processes, so its origin is reserved.
    workbench=await createWorkbenchServer({port:workbenchPort,engine,specRoot:path.join(root,'openspec')});
    runtime=new NativeRuntime({bundleRoot:root,offlineUrl:offline.url});
    const projects = await engine.projects();
    const activeProject =
      (await engine.activeProject()) || settings.activeProject;
    const project =
      projects.find((p) => p.id === activeProject) ||
      projects.find((p) => p.writable && p.validation) ||
      projects[0];
    if (!project?.validation)
      throw Error(
        "No project with a native validation configuration is connected",
      );
    portal = await runtime.start({
      projectId:project.id,
      workspace: project.validation.workspace,
      manifest: project.validation.manifest,
      port: await selectPort({setting:settings.portalPort,preferred:preferredPorts.portal,name:'portal'}),
    });
    await savePortPreferences(portCache,{portal:portal.port,workbench:workbench.server.address().port,offline:offline.port});
    if (engine.updateProject)
      await engine.updateProject(project.id, { portal: portal.url });
    else {
      const config = await read(registry);
      config.projects.find((p) => p.id === project.id).portal = portal.url;
      await fs.writeFile(registry, JSON.stringify(config, null, 2));
    }
    const record = {
      format: "seaf-portable-run-v1",
      pid: process.pid,
      root,
      portalUrl: portal.url,
      workbenchUrl: process.env.SEAF_WORKBENCH_URL,
      offlineUrl: offline.url,
      project: project.id,
      started: new Date().toISOString(),
    };
    control = http.createServer((req, res) => {
      if (req.headers["x-seaf-token"] !== token) {
        res.writeHead(403);
        res.end();
        return;
      }
      if (req.method === "GET" && req.url === "/status") {
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify(record));
        return;
      }
      if (req.method === "POST" && req.url === "/stop") {
        res.end("stopping");
        setTimeout(() => close().catch(() => process.exit(1)), 30);
        return;
      }
      res.writeHead(404);
      res.end();
    });
    await new Promise((resolve, reject) =>
      control.once("error", reject).listen(0, "127.0.0.1", resolve),
    );
    await fs.writeFile(
      runFile,
      JSON.stringify(
        {
          ...record,
          controlUrl: "http://127.0.0.1:" + control.address().port,
          token,
        },
        null,
        2,
      ),
    );
    await fs.rm(path.join(data, "launcher-error.json"), { force: true });
    process.on("SIGINT", () => close().catch(() => process.exit(1)));
    process.on("SIGTERM", () => close().catch(() => process.exit(1)));
  } catch (error) {
    if(control){control.closeAllConnections?.();await new Promise(resolve=>control.close(resolve)).catch(()=>{});}
    if(workbench){workbench.server.closeAllConnections?.();await new Promise(resolve=>workbench.server.close(resolve)).catch(()=>{});}
    for (const engineRuntime of engine.runtimes.values())
      await engineRuntime.closeAll().catch(() => {});
    await runtime?.closeAll().catch(() => {});
    await offline?.stop().catch(() => {});
    throw error;
  }
}

await fs.mkdir(data, { recursive: true });
const command = process.argv[2] || "start";
if (command === "serve") {
  try {
    await serve();
  } catch (error) {
    await fs.writeFile(
      path.join(data, "launcher-error.json"),
      JSON.stringify(
        {
          error: error.message,
          stack: error.stack,
          at: new Date().toISOString(),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  }
} else if (command === "status") {
  console.log(JSON.stringify((await running()) || { status: "stopped" }));
} else if (command === "stop") {
  const record = await read(runFile),
    status = await running();
  if (!status) console.log("SEAF is not running. No process was stopped.");
  else {
    const response = await fetch(record.controlUrl + "/stop", {
      method: "POST",
      headers: { "x-seaf-token": record.token },
      signal: AbortSignal.timeout(5000),
    });
    if (!response.ok) throw Error("SEAF stop ownership check failed");
    console.log("Stopping this SEAF bundle.");
  }
} else if (command === "start") {
  const existing = await running();
  if (existing) {
    console.log("SEAF: " + existing.portalUrl);
    if (!process.argv.includes("--no-browser")) openBrowser(existing.portalUrl);
  } else {
    const lock = path.join(data, "start.lock");
    let handle;
    try {
      handle = await fs.open(lock, "wx");
    } catch (error) {
      if (error.code === "EEXIST")
        throw Error(
          "Another SEAF start is in progress. If no start is running, remove data/start.lock.",
        );
      throw error;
    }
    try {
      const child = spawn(
        path.join(root, "runtime/node/node.exe"),
        [fileURLToPath(import.meta.url), "serve"],
        {
          cwd: root,
          detached: true,
          windowsHide: true,
          stdio: "ignore",
          env: { ...process.env, SEAF_PORTABLE_ROOT: root },
        },
      );
      child.unref();
      let spawnError;
      child.on("error", (e) => {
        spawnError = e;
      });
      const since = Date.now();
      let result;
      while (Date.now() - since < 90000) {
        if (spawnError) throw spawnError;
        result = await running();
        if (result) break;
        const failure = await read(path.join(data, "launcher-error.json"));
        if (failure && Date.parse(failure.at) >= since)
          throw Error(failure.error);
        await wait(250);
      }
      if (!result)
        throw Error("SEAF did not become ready. See data/launcher-error.json.");
      console.log(
        "SEAF: " + result.portalUrl + "\nWorkbench: " + result.workbenchUrl,
      );
      if (!process.argv.includes("--no-browser")) openBrowser(result.portalUrl);
    } finally {
      await handle.close();
      await fs.rm(lock, { force: true });
    }
  }
} else throw Error("Unknown launcher command: " + command);
