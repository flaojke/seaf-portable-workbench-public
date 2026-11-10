import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const exec = promisify(execFile);
const hash = (value) => crypto.createHash("sha256").update(value).digest("hex");
const inside = (root, target) => {
  const relative = path.relative(root, target);
  return (
    relative === "" ||
    (!relative.startsWith(".." + path.sep) &&
      relative !== ".." &&
      !path.isAbsolute(relative))
  );
};
export const sourceKind = (project) =>
  project.source?.kind || project.kind || "git";
export function windowsPowerShellExecutable(environment = process.env) {
  const windowsRoot =
    environment.SystemRoot ||
    environment.SYSTEMROOT ||
    environment.WINDIR ||
    "C:\\Windows";
  if (!path.win32.isAbsolute(windowsRoot))
    throw Error("Windows system root must be an absolute path");
  return path.win32.join(
    windowsRoot,
    "System32",
    "WindowsPowerShell",
    "v1.0",
    "powershell.exe",
  );
}
export function remoteProvider(remote) {
  let host = null;
  try {
    host = new URL(remote).hostname.toLowerCase();
  } catch {
    host =
      typeof remote === "string"
        ? remote.match(/^[\w.-]+@([\w.-]+):/)?.[1]?.toLowerCase() || null
        : null;
  }
  const provider =
    host === "github.com" || host?.endsWith(".github.com")
      ? "github"
      : host === "gitverse.ru" || host?.endsWith(".gitverse.ru")
        ? "gitverse"
        : host === "gitlab.com" || host?.includes("gitlab")
          ? "gitlab"
          : "git";
  return { provider, ...(host ? { remoteHost: host } : {}) };
}
export function validateRemote(remote) {
  if (
    typeof remote !== "string" ||
    !remote ||
    remote.length > 2048 ||
    /[\s\x00-\x1f]/.test(remote)
  )
    throw Error("Provide an HTTPS or SSH Git URL without credentials");
  if (/^[\w.-]+@[\w.-]+:[^\s]+$/.test(remote)) {
    if (remote.split(":").slice(1).join(":").startsWith("-"))
      throw Error("Invalid SSH repository path");
    return remote;
  }
  let url;
  try {
    url = new URL(remote);
  } catch {
    throw Error("Provide an HTTPS or SSH Git URL");
  }
  if (
    !["https:", "ssh:"].includes(url.protocol) ||
    !url.hostname ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol === "https:" && url.username)
  )
    throw Error(
      "Provide an HTTPS or SSH Git URL without embedded credentials, query or fragment",
    );
  if (!url.pathname || url.pathname === "/")
    throw Error("Git repository path is required");
  return remote;
}
export async function atomicJson(file, value) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = file + "." + crypto.randomUUID() + ".tmp";
  try {
    await fs.writeFile(temporary, JSON.stringify(value, null, 2) + "\n", {
      flag: "wx",
    });
    await fs.rename(temporary, file);
  } finally {
    await fs.unlink(temporary).catch(() => {});
  }
}
export class ProjectSources {
  constructor(engine) {
    this.engine = engine;
  }
  async config() {
    try {
      return JSON.parse(await fs.readFile(this.engine.configFile, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") return { projects: [] };
      throw error;
    }
  }
  async assertWritableTarget(target) {
    target = await potentialRealPath(target);
    await this.assertMutableBundlePath(target);
    for (const project of await this.engine.projects()) {
      if (project.writable) continue;
      const reference = await potentialRealPath(project.root);
      if (inside(reference, target) || inside(target, reference))
        throw Error(
          "Writable target overlaps a registered read-only source; choose an independent directory",
        );
    }
  }
  async assertWritableChanges(project, changes) {
    const references = (await this.engine.projects()).filter(
      (entry) => !entry.writable && entry.id !== project.id,
    );
    for (const change of changes)
      await this.assertMutableBundlePath(
        await this.engine.safe(project.root, change.path),
      );
    for (const reference of references) {
      const root = await potentialRealPath(reference.root);
      for (const change of changes) {
        const target = await this.engine.safe(project.root, change.path);
        if (inside(root, target))
          throw Error(
            "Change targets a registered read-only source: " + reference.id,
          );
      }
    }
  }
  async assertMutableBundlePath(target) {
    if (!process.env.SEAF_PORTABLE_ROOT) return;
    const bundle = path.resolve(process.env.SEAF_PORTABLE_ROOT);
    for (const name of [
      "app",
      "runtime",
      "portable",
      "licenses",
      "openspec",
      "examples",
    ]) {
      const immutable = await potentialRealPath(path.join(bundle, name));
      if (inside(immutable, target) || inside(target, immutable))
        throw Error(
          "Writable target overlaps immutable portable bundle files; use data/projects or an independent directory",
        );
    }
  }
  async configLock(fn) {
    const file = this.engine.configFile + ".lock";
    await fs.mkdir(path.dirname(file), { recursive: true });
    let handle;
    try {
      handle = await fs.open(file, "wx");
    } catch (error) {
      if (error.code === "EEXIST")
        throw Error("Project registry is busy; retry");
      throw error;
    }
    try {
      return await fn();
    } finally {
      await handle.close();
      await fs.unlink(file);
    }
  }
  async inspect({ root, kind = "auto", manifest } = {}) {
    if (typeof root !== "string" || !root.trim() || root.includes("\0"))
      throw Error("Choose a project directory");
    root = await fs.realpath(path.resolve(root));
    if (!(await fs.stat(root)).isDirectory())
      throw Error("Project root is not a directory");
    if (!["auto", "git", "directory"].includes(kind))
      throw Error("Invalid project source kind");
    let top = null,
      gitError = null;
    try {
      top = await this.engine.git({ root }, ["rev-parse", "--show-toplevel"]);
    } catch {
      gitError =
        "Git metadata is unavailable; directory mode remains available";
    }
    const ownGit = top !== null && path.resolve(top) === root;
    if (kind === "git" && !ownGit)
      throw Error("Select the root of its own Git repository");
    const selectedKind =
      kind === "auto" ? (ownGit ? "git" : "directory") : kind;
    let origin = null;
    if (ownGit)
      try {
        origin = await this.engine.git({ root }, [
          "remote",
          "get-url",
          "origin",
        ]);
      } catch {}
    const provider =
      selectedKind === "directory"
        ? { provider: "local" }
        : remoteProvider(origin);
    const candidates = [];
    for (const file of await fs.readdir(root, { withFileTypes: true }))
      if (
        file.isFile() &&
        /\.ya?ml$/i.test(file.name) &&
        !file.name.startsWith(".")
      )
        candidates.push(file.name);
    candidates.sort((a, b) => {
      const priority = (name) =>
        ["root.yaml", "root.yml", "dochub.yaml", "dochub.yml"].indexOf(name) < 0
          ? 100
          : ["root.yaml", "root.yml", "dochub.yaml", "dochub.yml"].indexOf(
              name,
            );
      return priority(a) - priority(b) || a.localeCompare(b);
    });
    if (manifest) {
      if (!/\.ya?ml$/i.test(manifest))
        throw Error("Choose a YAML root manifest");
      await fs.access(await this.engine.safe(root, manifest));
    } else
      manifest =
        candidates.find((name) => /^(root|dochub)\.ya?ml$/i.test(name)) ||
        (candidates.length === 1 ? candidates[0] : null);
    let writable = true;
    try {
      await fs.access(root, fs.constants.W_OK);
    } catch {
      writable = false;
    }
    return {
      root,
      title: path.basename(root),
      kind: selectedKind,
      ownGit,
      ...provider,
      parentGit: !!top && !ownGit,
      manifest,
      manifests: candidates,
      writable,
      warnings: [
        !manifest && "Choose a root YAML manifest before connecting",
        top &&
          !ownGit &&
          "Directory belongs to a parent Git repository; it will use local history",
        selectedKind === "directory" && gitError,
      ].filter(Boolean),
    };
  }
  storedPath(target) {
    const bundle =
      process.env.SEAF_PORTABLE_ROOT &&
      path.resolve(process.env.SEAF_PORTABLE_ROOT);
    return bundle && inside(bundle, target)
      ? path
          .relative(path.dirname(this.engine.configFile), target)
          .replaceAll("\\", "/") || "."
      : target;
  }
  async connect(input = {}) {
    const inspected = await this.inspect(input);
    if (!inspected.manifest)
      throw Error("Choose a root YAML manifest before connecting");
    const id =
      input.id ||
      (inspected.title
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, "-")
        .replace(/^-|-$/g, "")
        .slice(0, 50) || "project") +
        "-" +
        crypto.randomUUID().slice(0, 8);
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,99}$/.test(id))
      throw Error("Invalid project identifier");
    const workspace = await fs.realpath(
      path.resolve(
        input.validation?.workspace || input.workspace || inspected.root,
      ),
    );
    if (!inside(workspace, inspected.root))
      throw Error("Project must be inside its validation workspace");
    const relative = path
      .relative(workspace, inspected.root)
      .replaceAll("\\", "/");
    const entry = {
      id,
      title:
        typeof input.title === "string" && input.title.trim()
          ? input.title.trim().slice(0, 200)
          : inspected.title,
      root: this.storedPath(inspected.root),
      source: {
        kind: inspected.kind,
        provider: inspected.provider,
        ...(inspected.remoteHost ? { remoteHost: inspected.remoteHost } : {}),
      },
      manifest: inspected.manifest,
      writable: input.writable !== false && inspected.writable,
      validation: {
        runtime:
          input.validation?.runtime || input.validation?.kind || "native",
        workspace: this.storedPath(workspace),
        manifest:
          "workspace/" + (relative ? relative + "/" : "") + inspected.manifest,
        ...(input.validation?.image ? { image: input.validation.image } : {}),
      },
      ...(input.portal ? { portal: validatePortal(input.portal) } : {}),
    };
    await this.configLock(async () => {
      const config = await this.config();
      if (config.projects.some((project) => project.id === id))
        throw Error("Project identifier is already registered");
      if (
        config.projects.some(
          (project) =>
            path.resolve(path.dirname(this.engine.configFile), project.root) ===
            inspected.root,
        )
      )
        throw Error(
          "Directory is already registered; update its existing connection",
        );
      if (entry.writable) await this.assertWritableTarget(inspected.root);
      config.projects.push(entry);
      await atomicJson(this.engine.configFile, config);
    });
    return this.engine.project(id);
  }
  async update(id, patch) {
    if (!patch || typeof patch !== "object" || Array.isArray(patch))
      throw Error("Project patch must be an object");
    const allowed = new Set([
      "title",
      "portal",
      "manifest",
      "writable",
      "validation",
      "reloadSecretEnv",
    ]);
    for (const key of Object.keys(patch))
      if (!allowed.has(key))
        throw Error("Unsupported project connection property: " + key);
    const current = await this.engine.project(id);
    if (!current.writable && patch.writable === true)
      throw Error(
        "Read-only project permissions cannot be elevated through connection updates",
      );
    if (patch.manifest) {
      await fs.access(await this.engine.safe(current.root, patch.manifest));
    }
    if (patch.portal) validatePortal(patch.portal);
    if (patch.writable !== undefined && typeof patch.writable !== "boolean")
      throw Error("writable must be boolean");
    patch = { ...patch };
    if (patch.validation !== undefined) {
      const validation = patch.validation;
      if (
        !validation ||
        typeof validation !== "object" ||
        Array.isArray(validation)
      )
        throw Error("Validation connection must be an object");
      for (const key of Object.keys(validation))
        if (
          ![
            "runtime",
            "kind",
            "workspace",
            "manifest",
            "image",
            "native",
          ].includes(key)
        )
          throw Error("Unsupported validation setting: " + key);
      const runtime =
        validation.runtime ||
        validation.kind ||
        current.validation?.runtime ||
        "docker";
      if (!["native", "docker"].includes(runtime))
        throw Error("Choose a native or Docker validation runtime");
      if (
        typeof validation.workspace !== "string" ||
        typeof validation.manifest !== "string"
      )
        throw Error("Validation workspace and root manifest are required");
      const workspace = await fs.realpath(
        path.resolve(
          path.dirname(this.engine.configFile),
          validation.workspace,
        ),
      );
      if (!inside(workspace, current.root))
        throw Error("Project must be inside its validation workspace");
      const manifest = validation.manifest.replace(/^workspace\//, "");
      if (!/\.ya?ml$/i.test(manifest))
        throw Error("Validation manifest must be YAML");
      await fs.access(await this.engine.safe(workspace, manifest));
      const normalized = {
        runtime,
        workspace: this.storedPath(workspace),
        manifest: validation.manifest,
      };
      if (runtime === "docker") {
        if (
          typeof validation.image !== "string" ||
          !validation.image ||
          /\s/.test(validation.image)
        )
          throw Error("Docker validation image is required");
        normalized.image = validation.image;
      }
      if (validation.native) {
        const native = validation.native;
        if (!native || typeof native !== "object" || Array.isArray(native))
          throw Error("Native runtime settings must be an object");
        normalized.native = {};
        for (const [key, value] of Object.entries(native)) {
          if (["bundleRoot", "node", "coreRoot", "stateRoot"].includes(key)) {
            if (typeof value !== "string" || !value.trim())
              throw Error("Invalid native runtime path: " + key);
            normalized.native[key] = this.storedPath(
              path.resolve(path.dirname(this.engine.configFile), value),
            );
          } else if (key === "offlineUrl")
            normalized.native.offlineUrl = validatePortal(value);
          else if (key === "offline" && typeof value === "boolean")
            normalized.native.offline = value;
          else throw Error("Unsupported native runtime setting: " + key);
        }
      }
      patch.validation = normalized;
    }
    await this.configLock(async () => {
      const config = await this.config(),
        entry = config.projects.find((project) => project.id === id);
      if (!entry) throw Error("Unknown project");
      Object.assign(entry, patch);
      await atomicJson(this.engine.configFile, config);
    });
    return this.engine.project(id);
  }
  async clone(input = {}) {
    const url = validateRemote(input.url);
    if (typeof input.destination !== "string" || !input.destination.trim())
      throw Error("Choose a clone destination");
    const destination = path.resolve(input.destination);
    await this.assertWritableTarget(destination);
    try {
      if (
        !(await fs.stat(destination)).isDirectory() ||
        (await fs.readdir(destination)).length
      )
        throw Error("Clone destination must be a new or empty directory");
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await this.engine.gitExec(
      ["clone", "--no-hardlinks", "--", url, destination],
      { timeout: 180000, env: { ...process.env, GIT_TERMINAL_PROMPT: "0" } },
    );
    const project = await this.connect({
      ...input,
      root: destination,
      kind: "git",
    });
    return { project, cloned: true, pushed: false };
  }
  async select(id) {
    await this.engine.project(id);
    await this.configLock(async () => {
      const config = await this.config();
      if (!config.projects.some((project) => project.id === id))
        throw Error("Unknown project");
      config.activeProject = id;
      await atomicJson(this.engine.configFile, config);
    });
    return { activeProject: id };
  }
  async remove({ id, deleteFiles = false }) {
    if (typeof deleteFiles !== "boolean")
      throw Error("deleteFiles must be boolean");
    const project = await this.engine.project(id);
    if (deleteFiles && !project.writable)
      throw Error("Read-only project files cannot be deleted");
    const remove = () =>
      this.configLock(async () => {
        const config = await this.config();
        if (!config.projects.some((entry) => entry.id === id))
          throw Error("Unknown project");
        let trashedTo = null,
          original = null;
        if (deleteFiles) {
          original = await fs.realpath(project.root);
          await this.assertWritableTarget(original);
          const state = path.resolve(this.engine.state),
            configFile = path.resolve(this.engine.configFile);
          if (
            original === path.parse(original).root ||
            inside(original, state) ||
            inside(original, configFile)
          )
            throw Error(
              "Cannot delete a drive root or a directory containing SEAF settings/history",
            );
          const trashRoot = path.join(state, "trash");
          trashedTo = path.join(trashRoot, crypto.randomUUID());
          if (
            !inside(trashRoot, trashedTo) ||
            !inside(trashRoot, path.resolve(trashedTo))
          )
            throw Error("Unsafe trash destination");
          await fs.mkdir(trashRoot, { recursive: true });
          // A rename is atomic on the same volume; cross-volume moves are refused
          // instead of copying partially and deleting the original source.
          await fs.rename(original, trashedTo);
        }
        try {
          config.projects = config.projects.filter((entry) => entry.id !== id);
          if (config.activeProject === id) delete config.activeProject;
          await atomicJson(this.engine.configFile, config);
        } catch (error) {
          if (trashedTo) await fs.rename(trashedTo, original);
          throw error;
        }
        return {
          id,
          disconnected: true,
          filesDeleted: false,
          movedToTrash: !!trashedTo,
          ...(trashedTo ? { trashedTo, original } : {}),
        };
      });
    return deleteFiles ? this.engine.lock(project, remove) : remove();
  }
  async cloneLocal({
    id,
    destination,
    title,
    kind = "directory",
    ...options
  } = {}) {
    const source = await this.engine.project(id);
    if (!["directory", "git"].includes(kind))
      throw Error("Choose directory or Git for a project copy");
    if (typeof destination !== "string" || !destination.trim())
      throw Error("Choose a project copy destination");
    const target = path.resolve(destination),
      realSource = await fs.realpath(source.root);
    await this.assertWritableTarget(target);
    if (inside(realSource, target))
      throw Error("Project copy must be outside its source directory");
    try {
      if (
        !(await fs.stat(target)).isDirectory() ||
        (await fs.readdir(target)).length
      )
        throw Error(
          "Project copy destination must be a new or empty directory",
        );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    await fs.mkdir(target, { recursive: true });
    const copied = await copyProjectFiles(realSource, target);
    if (kind === "git") {
      const project = { root: target };
      await this.engine.git(project, ["init", "-b", "main"]);
      await this.engine.git(project, ["add", "--all"]);
      await this.engine.git(project, [
        "-c",
        "user.name=SEAF Local",
        "-c",
        "user.email=seaf-local@localhost",
        "commit",
        "-m",
        "Create local project copy",
      ]);
    }
    const project = await this.connect({
      ...options,
      root: target,
      kind,
      title: title || source.title + " copy",
      manifest: options.manifest || source.manifest,
      writable: true,
    });
    return {
      project,
      copiedFiles: copied.files,
      skipped: copied.skipped,
      historyCopied: false,
      pushed: false,
    };
  }
  async createVersion(project, { name } = {}) {
    if (!project.writable)
      throw Error("Read-only project versions cannot be created");
    if (
      typeof name !== "string" ||
      !name.trim() ||
      name.length > 120 ||
      /[\x00-\x1f]/.test(name)
    )
      throw Error("Provide a version name of 1–120 characters");
    name = name.trim();
    return this.engine.lock(project, async () => {
      if (sourceKind(project) === "git") {
        await this.engine.clean(project);
        const branch =
          "codex/" +
          name
            .normalize("NFC")
            .replace(/[^\p{L}\p{N}._/-]+/gu, "-")
            .replace(/^-+|-+$/g, "");
        if (branch === "codex/")
          throw Error("Use letters or numbers in a Git version name");
        await this.engine.git(project, [
          "check-ref-format",
          "--branch",
          branch,
        ]);
        await this.engine.git(project, ["branch", "--", branch, "HEAD"]);
        return {
          name,
          branch,
          revision: await this.engine.revision(project),
          switched: false,
          pushed: false,
        };
      }
      const revision = await this.capture(project, "Version: " + name);
      const versionsFile = path.join(
        this.historyRoot(project),
        "versions.json",
      );
      let versions = [];
      try {
        versions = JSON.parse(await fs.readFile(versionsFile, "utf8"));
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      if (versions.some((version) => version.name === name))
        throw Error("A local version with this name already exists");
      const version = {
        name,
        revision: revision.id,
        created: new Date().toISOString(),
      };
      versions.push(version);
      await atomicJson(versionsFile, versions);
      return { ...version, revision, pushed: false };
    });
  }
  async pickDirectory({ execute = exec } = {}) {
    if (process.platform !== "win32")
      throw Error(
        "Native directory selection requires Windows; enter a path manually",
      );
    const script =
      "Add-Type -AssemblyName System.Windows.Forms; $d = New-Object System.Windows.Forms.FolderBrowserDialog; $d.Description = 'Select SEAF project directory'; $d.ShowNewFolderButton = $true; if ($d.ShowDialog() -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::OutputEncoding = [System.Text.Encoding]::UTF8; [Console]::Write($d.SelectedPath) }; $d.Dispose()";
    const encoded = Buffer.from(script, "utf16le").toString("base64");
    const executable = windowsPowerShellExecutable();
    await fs.access(executable);
    const { stdout } = await execute(
      executable,
      ["-NoProfile", "-STA", "-EncodedCommand", encoded],
      { windowsHide: true, timeout: 180000, maxBuffer: 32768 },
    );
    return {
      cancelled: !stdout.trim(),
      path: stdout.trim() || null,
      root: stdout.trim() || null,
    };
  }
  historyRoot(project) {
    return path.join(this.engine.state, "history", hash(project.id));
  }
  async readCapturedRevision(project, fingerprint, directory) {
    let stat;
    try {
      stat = await fs.lstat(directory);
    } catch (error) {
      if (error.code === "ENOENT") return null;
      throw error;
    }
    if (!stat.isDirectory() || stat.isSymbolicLink())
      throw Error("Local revision integrity check failed: invalid directory");
    try {
      const files = path.join(directory, "files"),
        metadata = path.join(directory, "revision.json"),
        filesStat = await fs.lstat(files),
        metadataStat = await fs.lstat(metadata);
      if (
        !filesStat.isDirectory() ||
        filesStat.isSymbolicLink() ||
        !metadataStat.isFile() ||
        metadataStat.isSymbolicLink()
      )
        throw Error("Revision files must be stored locally without symlinks");
      const revision = JSON.parse(await fs.readFile(metadata, "utf8"));
      if (
        revision.kind !== "directory" ||
        revision.id !== fingerprint ||
        revision.fingerprint !== fingerprint ||
        revision.project !== project.id ||
        (await this.engine.fingerprint(files)) !== fingerprint
      )
        throw Error("Revision identity or artifact fingerprint differs");
      return revision;
    } catch (error) {
      throw Error("Local revision integrity check failed", { cause: error });
    }
  }
  async publishCapturedRevision(project, fingerprint, temporary, destination) {
    const deadline = Date.now() + 1000;
    let delay = 25;
    while (true) {
      const existing = await this.readCapturedRevision(
        project,
        fingerprint,
        destination,
      );
      if (existing) return existing;
      try {
        await fs.rename(temporary, destination);
      } catch (error) {
        // Windows also reports EPERM when another writer won this CAS rename.
        const winner = await this.readCapturedRevision(
          project,
          fingerprint,
          destination,
        );
        if (winner) return winner;
        if (!["EPERM", "EBUSY"].includes(error.code) || Date.now() >= deadline)
          throw error;
        const copy = await this.readCapturedRevision(
          project,
          fingerprint,
          temporary,
        );
        if (!copy) throw Error("Local revision temporary copy is unavailable");
        const remaining = deadline - Date.now();
        if (remaining <= 0) throw error;
        await new Promise((resolve) =>
          setTimeout(resolve, Math.min(delay, remaining)),
        );
        delay = Math.min(delay * 2, 200);
        continue;
      }
      const saved = await this.readCapturedRevision(
        project,
        fingerprint,
        destination,
      );
      if (!saved) throw Error("Local revision disappeared after publication");
      return saved;
    }
  }
  async capture(project, message, parent = null) {
    const fingerprint = await this.engine.fingerprint(project.root),
      root = this.historyRoot(project),
      destination = path.join(root, fingerprint);
    const existing = await this.readCapturedRevision(
      project,
      fingerprint,
      destination,
    );
    if (existing) return existing;
    const temporary = path.join(root, "." + crypto.randomUUID());
    await fs.mkdir(temporary, { recursive: true });
    try {
      await this.engine.copyArtifacts(
        project.root,
        path.join(temporary, "files"),
      );
      if (
        (await this.engine.fingerprint(path.join(temporary, "files"))) !==
        fingerprint
      )
        throw Error("Project changed while capturing local history");
      const revision = {
        kind: "directory",
        id: fingerprint,
        fingerprint,
        project: project.id,
        created: new Date().toISOString(),
        message,
        parent,
      };
      await fs.writeFile(
        path.join(temporary, "revision.json"),
        JSON.stringify(revision, null, 2),
      );
      return await this.publishCapturedRevision(
        project,
        fingerprint,
        temporary,
        destination,
      );
    } finally {
      if (!inside(root, temporary) || temporary === root)
        throw Error("Unsafe history temporary path");
      await fs.rm(temporary, { recursive: true, force: true });
    }
  }
  async revisions(project) {
    const root = this.historyRoot(project),
      result = [];
    let entries;
    try {
      entries = await fs.readdir(root);
    } catch (error) {
      if (error.code === "ENOENT") return [];
      throw error;
    }
    let versions = [];
    try {
      versions = JSON.parse(
        await fs.readFile(path.join(root, "versions.json"), "utf8"),
      );
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
    for (const entry of entries)
      if (/^[a-f0-9]{64}$/.test(entry))
        result.push({
          ...JSON.parse(
            await fs.readFile(path.join(root, entry, "revision.json"), "utf8"),
          ),
          versions: versions
            .filter((version) => version.revision === entry)
            .map((version) => ({
              name: version.name,
              created: version.created,
            })),
        });
    return result.sort((a, b) => b.created.localeCompare(a.created));
  }
  async load(project, ref, destination) {
    if (!/^[a-f0-9]{64}$/.test(ref)) throw Error("Invalid local revision");
    const root = path.join(this.historyRoot(project), ref),
      revision = JSON.parse(
        await fs.readFile(path.join(root, "revision.json"), "utf8"),
      );
    if (
      revision.id !== ref ||
      revision.project !== project.id ||
      (await this.engine.fingerprint(path.join(root, "files"))) !== ref
    )
      throw Error("Local revision integrity check failed");
    await this.engine.copyArtifacts(path.join(root, "files"), destination);
    return { revision, root: destination };
  }
}
async function potentialRealPath(target) {
  target = path.resolve(target);
  const parts = [];
  while (true) {
    try {
      return path.join(await fs.realpath(target), ...parts.reverse());
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      parts.push(path.basename(target));
      const parent = path.dirname(target);
      // A registered external source can live on a removable/offline drive.
      // Its normalized path still protects that location without blocking
      // unrelated projects whose own roots can be resolved normally.
      if (parent === target) return path.join(target, ...parts.reverse());
      target = parent;
    }
  }
}
async function copyProjectFiles(source, target) {
  const result = { files: 0, skipped: [] },
    excluded = new Set([
      ".git",
      "node_modules",
      "state",
      ".codex",
      ".aws",
      ".ssh",
    ]);
  let size = 0;
  const walk = async (relative = "") => {
    for (const entry of await fs.readdir(path.join(source, relative), {
      withFileTypes: true,
    })) {
      const file = path.join(relative, entry.name);
      if (
        excluded.has(entry.name) ||
        entry.name === ".env" ||
        entry.name.startsWith(".env.")
      ) {
        result.skipped.push(file.replaceAll("\\", "/"));
        continue;
      }
      if (entry.isSymbolicLink())
        throw Error("Project copies do not follow symbolic links: " + file);
      const from = path.join(source, file),
        to = path.join(target, file);
      if (!inside(source, from) || !inside(target, to))
        throw Error("Unsafe project copy path");
      if (entry.isDirectory()) {
        await fs.mkdir(to, { recursive: true });
        await walk(file);
      } else if (entry.isFile()) {
        const stat = await fs.stat(from);
        size += stat.size;
        if (++result.files > 20000 || size > 512 * 1024 * 1024)
          throw Error(
            "Project copy exceeds 20000 files or 512 MiB; use Git clone instead",
          );
        await fs.copyFile(from, to, fs.constants.COPYFILE_EXCL);
      }
    }
  };
  await walk();
  return result;
}
function validatePortal(portal) {
  const url = new URL(portal);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.search ||
    url.hash
  )
    throw Error("Provide a portal URL without credentials");
  return url.href;
}
