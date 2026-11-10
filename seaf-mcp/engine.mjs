import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import YAML from "yaml";
import { inspectFlows } from "./workbench/trust.mjs";
import { validateDrawio } from "./workbench/drawio.mjs";
import { ProjectSources, sourceKind } from "./project-sources.mjs";
import { unzipSync } from "fflate";
const exec = promisify(execFile);
const digest = (x) => crypto.createHash("sha256").update(x).digest("hex");
const extensions = new Set([
  ".yaml",
  ".yml",
  ".md",
  ".json",
  ".mmd",
  ".puml",
  ".plantuml",
  ".drawio",
  ".xml",
]);
export class Engine {
  constructor(configFile, stateDir) {
    this.configFile = path.resolve(configFile);
    this.state = path.resolve(stateDir);
    this.sources = new ProjectSources(this);
    this.runtimes = new Map();
  }
  async projects() {
    const config = await this.sources.config();
    return config.projects.map((p) => ({
      ...p,
      root: path.resolve(path.dirname(this.configFile), p.root),
      validation: p.validation && {
        ...p.validation,
        ...(p.validation.native
          ? {
              native: Object.fromEntries(
                Object.entries(p.validation.native).map(([key, value]) => [
                  key,
                  ["bundleRoot", "node", "coreRoot", "stateRoot"].includes(
                    key,
                  ) && typeof value === "string"
                    ? path.resolve(path.dirname(this.configFile), value)
                    : value,
                ]),
              ),
            }
          : {}),
        workspace:
          typeof p.validation.workspace === "string"
            ? path.resolve(
                path.dirname(this.configFile),
                p.validation.workspace,
              )
            : undefined,
      },
    }));
  }
  async project(id) {
    const p = (await this.projects()).find((p) => p.id === id);
    if (!p) throw Error("Unknown project");
    return p;
  }
  kind(p) {
    const kind = sourceKind(p);
    if (!["git", "directory"].includes(kind))
      throw Error("Unknown project source kind");
    return kind;
  }
  async revision(p) {
    const kind = this.kind(p),
      fingerprint = await this.fingerprint(p.root);
    return {
      kind,
      id:
        kind === "git" ? await this.git(p, ["rev-parse", "HEAD"]) : fingerprint,
      fingerprint,
    };
  }
  inspectProject(input) {
    return this.sources.inspect(input);
  }
  connectProject(input) {
    return this.sources.connect(input);
  }
  updateProject(id, patch) {
    return this.sources.update(id, patch);
  }
  cloneProject(input) {
    return this.sources.clone(input);
  }
  pickDirectory() {
    return this.sources.pickDirectory();
  }
  disconnectProject(id) {
    return this.sources.remove({ id });
  }
  deleteProject(input) {
    return this.sources.remove(input);
  }
  cloneLocalProject(input) {
    return this.sources.cloneLocal(input);
  }
  createVersion(id, options) {
    return this.project(id).then((p) => this.sources.createVersion(p, options));
  }
  selectActiveProject(id) {
    return this.sources.select(id);
  }
  async activeProject() {
    return (await this.sources.config()).activeProject || null;
  }
  async revisions(p) {
    if (this.kind(p) === "directory")
      return this.lock(p, async () => {
        await this.sources.capture(p, "Current local state");
        return this.sources.revisions(p);
      });
    const text = await this.git(p, ["log", "-100", "--format=%H%x09%aI%x09%s"]);
    return text
      ? text.split("\n").map((row) => {
          const [id, created, ...message] = row.split("\t");
          return { kind: "git", id, created, message: message.join("\t") };
        })
      : [];
  }
  async loadRevision(p, ref, destination) {
    if (this.kind(p) === "directory") {
      const current = await this.revision(p);
      if (ref === "HEAD" || ref === current.id) {
        await this.copyArtifacts(p.root, destination);
        if ((await this.fingerprint(destination)) !== current.fingerprint)
          throw Error("Project changed while reading local revision");
        return { revision: current, root: destination };
      }
      return this.sources.load(p, ref, destination);
    }
    if (
      typeof ref !== "string" ||
      !ref ||
      ref.startsWith("-") ||
      ref.length > 200
    )
      throw Error("Invalid Git reference");
    const id = await this.git(p, [
      "rev-parse",
      "--verify",
      "--end-of-options",
      ref + "^{commit}",
    ]);
    const { stdout } = await this.gitExec(
      ["-C", p.root, "archive", "--format=zip", id],
      { encoding: "buffer", maxBuffer: 64 * 1024 * 1024 },
    );
    await fs.mkdir(destination, { recursive: true });
    for (const [file, bytes] of Object.entries(
      unzipSync(new Uint8Array(stdout)),
    )) {
      if (file.endsWith("/")) continue;
      let target;
      try {
        target = await this.safe(destination, file);
      } catch {
        continue;
      }
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, bytes);
    }
    return {
      revision: {
        kind: "git",
        id,
        fingerprint: await this.fingerprint(destination),
      },
      root: destination,
    };
  }
  async runtime(p) {
    if (![p.validation?.runtime, p.validation?.kind].includes("native"))
      return null;
    const settings = {
      bundleRoot: process.env.SEAF_PORTABLE_ROOT,
      stateRoot: path.join(this.state, "native-runtime"),
      ...(p.validation?.native || {}),
    };
    const key = JSON.stringify(settings);
    if (!this.runtimes.has(key)) {
      const { NativeRuntime } = await import("./native-runtime.mjs");
      this.runtimes.set(key, new NativeRuntime(settings));
    }
    return this.runtimes.get(key);
  }
  async pushProject(id, { remote = "origin", branch } = {}) {
    const p = await this.project(id);
    if (!p.writable || this.kind(p) !== "git")
      throw Error("Push requires a writable Git project");
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,100}$/.test(remote))
      throw Error("Invalid configured Git remote name");
    await this.git(p, ["remote", "get-url", remote]);
    branch ||= await this.git(p, ["branch", "--show-current"]);
    if (!branch || branch.startsWith("-"))
      throw Error("Choose a Git branch to push");
    await this.git(p, ["check-ref-format", "--branch", branch]);
    let output;
    try {
      output = await this.git(p, ["push", "--", remote, branch]);
    } catch (error) {
      throw Error(this.redact(p, error.message));
    }
    return {
      pushed: true,
      remote,
      branch,
      revision: await this.revision(p),
      output,
    };
  }
  async safe(root, relative) {
    if (
      typeof relative !== "string" ||
      !relative ||
      relative.includes("\\") ||
      relative.includes(":") ||
      relative.split("/").some((p) => !p || p === ".." || p.startsWith(".")) ||
      path.isAbsolute(relative) ||
      !extensions.has(path.extname(relative).toLowerCase())
    )
      throw Error("Disallowed artifact path");
    const base = await fs.realpath(root);
    const target = path.resolve(base, relative);
    if (!target.startsWith(base + path.sep)) throw Error("Outside project");
    let current = base;
    for (const part of relative.split("/")) {
      current = path.join(current, part);
      try {
        const s = await fs.lstat(current);
        if (s.isSymbolicLink()) throw Error("Symlinks are not allowed");
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
    }
    return target;
  }
  async files(root, prefix = "") {
    const out = [];
    for (const e of await fs.readdir(path.join(root, prefix), {
      withFileTypes: true,
    })) {
      if (e.name.startsWith(".") || ["node_modules", "state"].includes(e.name))
        continue;
      const rel = prefix ? prefix + "/" + e.name : e.name;
      if (e.isSymbolicLink()) throw Error("Symlinks are not supported: " + rel);
      if (e.isDirectory()) out.push(...(await this.files(root, rel)));
      else if (extensions.has(path.extname(e.name).toLowerCase()))
        out.push(rel);
    }
    return out.sort();
  }
  async fingerprint(root) {
    const rows = [];
    for (const f of (await this.files(root)).sort())
      rows.push([f, digest(await fs.readFile(await this.safe(root, f)))]);
    return digest(JSON.stringify(rows));
  }
  async git(p, args) {
    return (await this.gitExec(["-C", p.root, ...args])).stdout.trim();
  }
  gitExec(args, options = {}) {
    return exec(process.env.SEAF_GIT || "git", args, {
      maxBuffer: 8e6,
      windowsHide: true,
      timeout: 120000,
      ...options,
    });
  }
  async clean(p) {
    if (this.kind(p) === "directory") {
      await fs.access(p.root);
      return;
    }
    if (
      (await this.git(p, ["rev-parse", "--show-toplevel"])) !==
      p.root.replaceAll("\\", "/")
    ) {
      const top = await this.git(p, ["rev-parse", "--show-toplevel"]);
      if (path.resolve(top) !== p.root)
        throw Error("Project must have its own Git repository");
    }
    if (await this.git(p, ["status", "--porcelain", "--untracked-files=all"]))
      throw Error("Commit or stash existing changes first");
  }
  async read(id, file) {
    const p = await this.project(id);
    const text = await fs.readFile(await this.safe(p.root, file), "utf8");
    if (text.length > 500000) throw Error("Artifact too large");
    return { project: id, file, content: text, sha256: digest(text) };
  }
  async model(id, rootOverride, workspaceOverride) {
    const p = await this.project(id),
      root =
        workspaceOverride ||
        (!rootOverride && p.validation?.workspace) ||
        rootOverride ||
        p.root,
      seen = new Set(),
      provenance = {},
      definitions = {};
    const projectRoot = rootOverride || p.root;
    const prefix = path.relative(root, projectRoot).replaceAll("\\", "/");
    if (prefix.startsWith("..")) throw Error("Project outside workspace");
    function merge(a, b) {
      for (const [k, v] of Object.entries(b || {})) {
        if (["__proto__", "constructor", "prototype"].includes(k))
          throw Error("Reserved model key");
        if (k === "imports") continue;
        if (Array.isArray(v))
          a[k] = [...(Array.isArray(a[k]) ? a[k] : []), ...v];
        else if (v && typeof v === "object") {
          if (!a[k] || typeof a[k] !== "object" || Array.isArray(a[k]))
            a[k] = {};
          merge(a[k], v);
        } else a[k] = v;
      }
      return a;
    }
    const load = async (file) => {
      if (seen.has(file)) throw Error("Duplicate/cyclic import: " + file);
      seen.add(file);
      const doc = YAML.parseDocument(
        await fs.readFile(await this.safe(root, file), "utf8"),
        { uniqueKeys: true },
      );
      if (doc.errors.length)
        throw Error(doc.errors.map((e) => e.message).join("\n"));
      const data = doc.toJSON();
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw Error("Manifest must be a mapping");
      const result = {};
      // This is a project-local view. Runtime semantics are checked by real SEAF.
      for (const imp of data.imports || []) {
        if (typeof imp !== "string" || imp.includes(":"))
          throw Error("External imports require a local registered snapshot");
        const rel = path.posix.normalize(
          path.posix.join(path.posix.dirname(file), imp),
        );
        merge(result, await load(rel));
      }
      for (const [section, entities] of Object.entries(data))
        if (section !== "imports" && entities && typeof entities === "object")
          for (const key of Object.keys(entities)) {
            provenance[section + "/" + key] = file;
            (definitions[section + "/" + key] ||= []).push(file);
          }
      return merge(result, data);
    };
    const built = await load(path.posix.join(prefix, p.manifest));
    for (const key of Object.keys(provenance))
      provenance[key] = path.posix.relative(prefix || ".", provenance[key]);
    for (const key of Object.keys(definitions))
      definitions[key] = definitions[key].map((file) =>
        path.posix.relative(prefix || ".", file),
      );
    return {
      model: built,
      provenance,
      definitions,
      files: [...seen],
      scope:
        "project imports within registered workspace; effective runtime is validated by SEAF",
    };
  }
  async search(id, query) {
    const p = await this.project(id),
      results = [];
    for (const file of await this.files(p.root)) {
      const text = await fs.readFile(await this.safe(p.root, file), "utf8");
      text.split(/\r?\n/).forEach((line, i) => {
        if (
          line.toLowerCase().includes(query.toLowerCase()) &&
          results.length < 100
        )
          results.push({ file, line: i + 1, text: line.slice(0, 600) });
      });
    }
    return { results, limit: 100 };
  }
  async entity(id, section, key) {
    const m = await this.model(id);
    const entities = Object.hasOwn(m.model, section) ? m.model[section] : null;
    return {
      value: entities && Object.hasOwn(entities, key) ? entities[key] : null,
      file: m.provenance[section + "/" + key] ?? null,
    };
  }
  async dependencies(id, key) {
    const { model } = await this.model(id);
    const outgoing = model.components?.[key]?.links || [],
      incoming = [];
    for (const [from, c] of Object.entries(model.components || {}))
      for (const l of c.links || [])
        if (l.id === key) incoming.push({ from, ...l });
    return { component: key, outgoing, incoming };
  }
  async propose(id, changes, message) {
    const p = await this.project(id);
    if (!p.writable) throw Error("Read-only project");
    await this.clean(p);
    if (!Array.isArray(changes) || !changes.length || changes.length > 50)
      throw Error("Provide 1–50 changes");
    const paths = new Set();
    for (const c of changes) {
      await this.safe(p.root, c.path);
      if (paths.has(c.path)) throw Error("Duplicate change path");
      paths.add(c.path);
      if (
        c.content !== null &&
        (typeof c.content !== "string" || c.content.length > 500000)
      )
        throw Error("Invalid content");
    }
    await this.sources.assertWritableChanges(p, changes);
    const proposalId = crypto.randomUUID(),
      dir = path.join(this.state, proposalId);
    await fs.mkdir(dir, { recursive: true });
    const baseRevision = await this.revision(p);
    const baseCommit = baseRevision.kind === "git" ? baseRevision.id : null;
    const baseFingerprint = baseRevision.fingerprint;
    const validationBase = p.validation
      ? await this.fingerprint(p.validation.workspace)
      : baseFingerprint;
    const proposal = {
      proposalId,
      project: id,
      changes,
      message: message || "Update SEAF architecture",
      baseCommit,
      baseRevision,
      baseFingerprint,
      validationBase,
      status: "proposed",
    };
    const draft = path.join(dir, "project");
    await this.copyArtifacts(p.root, draft);
    await this.writeChanges(draft, changes);
    proposal.diff = await this.diffChanges(p.root, changes, dir);
    await this.save(proposal);
    return proposal;
  }
  async diffChanges(root, changes, dir) {
    if (!dir) {
      dir = path.join(this.state, "diffs", crypto.randomUUID());
      await fs.mkdir(dir, { recursive: true });
    }
    let diff = "";
    // Diff only the artifact allowlist; .git, .env and process credentials are excluded.
    for (const c of changes) {
      let old = "",
        existed = false;
      try {
        old = await fs.readFile(await this.safe(root, c.path), "utf8");
        existed = true;
      } catch (e) {
        if (e.code !== "ENOENT") throw e;
      }
      const content = c.content ?? "";
      if (!existed || old !== content || c.content === null)
        diff +=
          `\nArtifact: ${c.path}${c.content === null ? " (delete)" : ""}\n` +
          unifiedDiff(c.path, old, content, existed, c.content !== null);
    }
    return diff;
  }
  async copyArtifacts(from, to) {
    await fs.mkdir(to, { recursive: true });
    for (const file of await this.files(from)) {
      const dest = await this.safe(to, file);
      await fs.mkdir(path.dirname(dest), { recursive: true });
      await fs.copyFile(await this.safe(from, file), dest);
    }
  }
  async writeChanges(root, changes) {
    for (const c of changes) {
      const target = await this.safe(root, c.path);
      if (c.content === null) await fs.unlink(target);
      else {
        await fs.mkdir(path.dirname(target), { recursive: true });
        await fs.writeFile(target, c.content, "utf8");
      }
    }
  }
  async save(x) {
    await fs.writeFile(
      path.join(this.state, x.proposalId, "proposal.json"),
      JSON.stringify(x, null, 2),
    );
  }
  async proposal(id) {
    if (!/^[0-9a-f-]{36}$/.test(id)) throw Error("Invalid proposal ID");
    return JSON.parse(
      await fs.readFile(path.join(this.state, id, "proposal.json"), "utf8"),
    );
  }
  async lock(p, fn) {
    const realRoot = await fs.realpath(p.root);
    const gitDir = path.join(
      this.state,
      "locks",
      digest(process.platform === "win32" ? realRoot.toLowerCase() : realRoot),
    );
    await fs.mkdir(gitDir, { recursive: true });
    const file = path.join(gitDir, "seaf-mcp.lock");
    const handle = await fs.open(file, "wx");
    try {
      return await fn();
    } finally {
      await handle.close();
      await fs.unlink(file);
    }
  }
  async unchanged(p, x) {
    await this.clean(p);
    const revision = await this.revision(p);
    if (
      (x.baseRevision
        ? revision.kind !== x.baseRevision.kind ||
          revision.id !== x.baseRevision.id
        : revision.id !== x.baseCommit) ||
      (await this.fingerprint(p.root)) !== x.baseFingerprint ||
      (p.validation &&
        (await this.fingerprint(p.validation.workspace)) !== x.validationBase)
    )
      throw Error("Stale proposal: project or imported workspace changed");
  }
  docker(args, options = {}) {
    const bin =
      process.env.SEAF_DOCKER ||
      "C:/Program Files/Docker/Docker/resources/bin/docker.exe";
    return exec(bin, args, {
      maxBuffer: 8e6,
      timeout: options.timeout ?? 120000,
      windowsHide: true,
    });
  }
  async validate(proposalId) {
    const x = await this.proposal(proposalId),
      p = await this.project(x.project);
    await this.unchanged(p, x);
    const dir = path.join(this.state, proposalId);
    const draft = path.join(dir, "project");
    for (const c of x.changes)
      if (c.content !== null) {
        if (/\.ya?ml$/.test(c.path)) {
          const doc = YAML.parseDocument(c.content, { uniqueKeys: true });
          if (doc.errors.length) throw Error("Invalid YAML: " + c.path);
        }
        if (c.path.endsWith(".json")) JSON.parse(c.content);
        if (/\.(drawio|xml)$/.test(c.path)) validateDrawio(c.content);
      }
    const nativeRuntime = await this.runtime(p);
    if (
      !p.validation?.workspace ||
      !p.validation.manifest ||
      (!nativeRuntime && !p.validation.image)
    )
      throw Error("SEAF validation configuration required for writes");
    const workspace = path.join(dir, "workspace");
    await this.copyArtifacts(p.validation.workspace, workspace);
    const relative = path.relative(p.validation.workspace, p.root);
    if (relative.startsWith("..") || path.isAbsolute(relative))
      throw Error("Project outside validation workspace");
    await this.writeChanges(path.join(workspace, relative), x.changes);
    const draftModel = (
      await this.model(p.id, path.join(workspace, relative), workspace)
    ).model;
    const flow = inspectFlows(draftModel),
      broken = flow.flows.filter((f) => f.unresolved);
    if (flow.findings.length || broken.length) {
      x.validation = {
        ok: false,
        rules: 2,
        problems: [
          {
            id: "workbench.model-integrity",
            items: [...broken, ...flow.findings],
          },
        ],
        changesHash: digest(JSON.stringify(x.changes)),
        draftHash: await this.fingerprint(draft),
      };
      x.status = "invalid";
      await this.save(x);
      return x.validation;
    }
    if (nativeRuntime) {
      const result = await nativeRuntime.validate({
        workspace,
        manifest: p.validation.manifest,
      });
      x.validation = {
        ...result,
        ok:
          result.ok === true &&
          !result.problems?.some(
            (problem) => problem.error || problem.items?.length,
          ),
        changesHash: digest(JSON.stringify(x.changes)),
        draftHash: await this.fingerprint(draft),
      };
      x.status = x.validation.ok ? "validated" : "invalid";
      await this.save(x);
      return x.validation;
    }
    const name = "seaf-mcp-check-" + proposalId;
    try {
      await this.docker([
        "run",
        "--pull",
        "never",
        "-d",
        "--name",
        name,
        "--network",
        "none",
        "-e",
        "VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS=n",
        "-e",
        "VUE_APP_DOCHUB_BACKEND_PORT=8080",
        "-e",
        "VUE_APP_DOCHUB_ROOT_MANIFEST=" + p.validation.manifest,
        "-v",
        workspace + ":/var/www/public/workspace:ro",
        p.validation.image,
      ]);
      const script = `const u='http://127.0.0.1:8080'; for(let i=0;i<90;i++){try{let h=await fetch(u+'/health');if(h.ok){const p=await fetch(u+'/core/storage/problems/').then(r=>r.json());console.log(JSON.stringify(p));process.exit(0);}}catch{}await new Promise(r=>setTimeout(r,500));}process.exit(1);`;
      const { stdout } = await this.docker([
        "exec",
        name,
        "node",
        "--input-type=module",
        "-e",
        script,
      ]);
      const problems = JSON.parse(stdout.trim());
      x.validation = {
        ok: !problems.some((p) => p.error || p.items?.length),
        rules: problems.length,
        problems: problems.filter((p) => p.error || p.items?.length),
        changesHash: digest(JSON.stringify(x.changes)),
        draftHash: await this.fingerprint(draft),
      };
      x.status = x.validation.ok ? "validated" : "invalid";
      await this.save(x);
      return x.validation;
    } finally {
      await this.docker(["rm", "-f", name]).catch(() => {});
    }
  }
  async reload(p) {
    if (!p.portal) return { status: "not_configured" };
    const url = new URL("/core/storage/reload", p.portal);
    if (p.reloadSecretEnv) {
      const secret = process.env[p.reloadSecretEnv];
      if (!secret) throw Error("Missing reload secret");
      url.searchParams.set("secret", secret);
    }
    const r = await fetch(url, {
      method: "PUT",
      signal: AbortSignal.timeout(60000),
    });
    if (!r.ok) throw Error("SEAF reload failed: " + r.status);
    const data = await r.json();
    if (data.message !== "success") throw Error("Reload not confirmed");
    const problems = await fetch(new URL("/core/storage/problems/", p.portal), {
      signal: AbortSignal.timeout(15000),
    }).then((r) => {
      if (!r.ok) throw Error("Problems request failed");
      return r.json();
    });
    return {
      status: "updated",
      problems: problems.filter((p) => p.error || p.items?.length),
    };
  }
  redact(p, message) {
    let result = String(message).replace(
      /\b(https?:\/\/)[^\s/@]+(?::[^\s/@]*)?@/gi,
      "$1[redacted]@",
    );
    const secrets = [];
    if (p.reloadSecretEnv && process.env[p.reloadSecretEnv])
      secrets.push(process.env[p.reloadSecretEnv]);
    if (p.portal)
      try {
        const url = new URL(p.portal);
        for (const value of [url.username, url.password])
          if (value) secrets.push(value, decodeURIComponent(value));
        for (const [key, value] of url.searchParams)
          if (
            /token|secret|password|key|credential|signature/i.test(key) &&
            value
          )
            secrets.push(value);
      } catch {}
    for (const secret of [...new Set(secrets)].sort(
      (a, b) => b.length - a.length,
    ))
      result = result.replaceAll(secret, "[redacted]");
    return result;
  }
  async retryReload(project, proposalId) {
    const p = await this.project(project);
    if (!p.writable) throw Error("Read-only project");
    if (!proposalId) return this.reload(p);
    const x = await this.proposal(proposalId);
    if (x.project !== project) throw Error("Wrong project");
    if (!x.commit && !x.revision) throw Error("Proposal has no saved revision");
    const savedPrefix = x.commit ? "committed" : "saved";
    try {
      x.reload = await this.reload(p);
      x.status = x.reload.problems?.length
        ? savedPrefix + "_runtime_problems"
        : "applied";
    } catch (error) {
      x.reload = { status: "failed", message: this.redact(p, error.message) };
      x.status = savedPrefix + "_reload_failed";
    }
    await this.save(x);
    return {
      commit: x.commit || null,
      revision: x.revision || null,
      status: x.status,
      reload: x.reload,
    };
  }
  async apply(proposalId) {
    const x = await this.proposal(proposalId),
      p = await this.project(x.project);
    if (!p.writable) throw Error("Read-only project");
    if (x.commit || x.revision)
      return {
        commit: x.commit || null,
        revision: x.revision || null,
        status: x.status,
        reload: x.reload,
      };
    return this.lock(p, async () => {
      await this.unchanged(p, x);
      await this.sources.assertWritableChanges(p, x.changes);
      if (
        x.status !== "validated" ||
        !x.validation?.ok ||
        x.validation.changesHash !== digest(JSON.stringify(x.changes)) ||
        x.validation.draftHash !==
          (await this.fingerprint(path.join(this.state, proposalId, "project")))
      )
        throw Error("Validate this proposal first");
      const backups = [];
      for (const c of x.changes) {
        let content = null;
        try {
          content = await fs.readFile(await this.safe(p.root, c.path), "utf8");
        } catch (e) {
          if (e.code !== "ENOENT") throw e;
        }
        backups.push({ path: c.path, content });
      }
      x.status = "applying";
      x.backups = backups;
      await this.save(x);
      const git = this.kind(p) === "git";
      try {
        if (!git) await this.sources.capture(p, "Baseline before " + x.message);
        await this.writeChanges(p.root, x.changes);
        if (git) {
          await this.git(p, ["add", "--", ...x.changes.map((c) => c.path)]);
          await this.git(p, [
            "-c",
            "user.name=SEAF MCP",
            "-c",
            "user.email=seaf-mcp@localhost",
            "commit",
            "-m",
            x.message,
          ]);
          x.commit = await this.git(p, ["rev-parse", "HEAD"]);
          x.revision = await this.revision(p);
        } else {
          x.revision = await this.sources.capture(
            p,
            x.message,
            x.baseRevision.id,
          );
        }
      } catch (e) {
        for (const b of backups) {
          const file = await this.safe(p.root, b.path);
          if (b.content === null) await fs.unlink(file).catch(() => {});
          else await fs.writeFile(file, b.content);
        }
        if (git)
          await this.git(p, ["reset", "--", ...x.changes.map((c) => c.path)]);
        x.status = "failed";
        await this.save(x);
        throw e;
      }
      const savedPrefix = git ? "committed" : "saved";
      x.status = savedPrefix;
      await this.save(x);
      try {
        x.reload = await this.reload(p);
        x.status = x.reload.problems?.length
          ? savedPrefix + "_runtime_problems"
          : "applied";
      } catch (e) {
        x.reload = { status: "failed", message: this.redact(p, e.message) };
        x.status = savedPrefix + "_reload_failed";
      }
      await this.save(x);
      return {
        commit: x.commit || null,
        revision: x.revision,
        status: x.status,
        reload: x.reload,
      };
    });
  }
  async upsert(id, file, section, key, value, message) {
    if (
      !/^[\w.-]+$/.test(section) ||
      ["imports", "__proto__", "constructor", "prototype"].includes(section) ||
      ["__proto__", "constructor", "prototype"].includes(key)
    )
      throw Error("Invalid entity key");
    let text = "";
    try {
      text = (await this.read(id, file)).content;
    } catch (e) {
      if (e.code !== "ENOENT") throw e;
    }
    const doc = YAML.parseDocument(text || "{}");
    if (doc.errors.length) throw Error("Invalid YAML");
    if (!doc.has(section)) doc.set(section, YAML.createNode({}));
    doc.setIn([section, key], value);
    return this.propose(id, [{ path: file, content: doc.toString() }], message);
  }
}

// One valid unified hunk, trimmed around the common prefix/suffix. This works
// without Git, and keeps all changed bytes visible even for large model files.
function unifiedDiff(file, before, after, existed = true, exists = true) {
  if (!before && !after && existed !== exists)
    return `diff --git a/${file} b/${file}\n${exists ? "new file mode 100644\nindex 0000000..e69de29" : "deleted file mode 100644\nindex e69de29..0000000"}\n`;
  const lines = (text) => (text ? text.split("\n") : []);
  const old = lines(before),
    next = lines(after);
  if (old.at(-1) === "") old.pop();
  if (next.at(-1) === "") next.pop();
  let prefix = 0,
    suffix = 0;
  while (
    prefix < old.length &&
    prefix < next.length &&
    old[prefix] === next[prefix]
  )
    prefix++;
  while (
    suffix < old.length - prefix &&
    suffix < next.length - prefix &&
    old[old.length - 1 - suffix] === next[next.length - 1 - suffix]
  )
    suffix++;
  if (
    before.endsWith("\n") !== after.endsWith("\n") &&
    old.length &&
    next.length
  ) {
    prefix = Math.min(prefix, old.length - 1, next.length - 1);
    suffix = 0;
  }
  const start = Math.max(0, prefix - 3),
    oldEnd = Math.min(old.length, old.length - suffix + 3),
    newEnd = Math.min(next.length, next.length - suffix + 3);
  const body = [];
  const append = (rows, from, to, marker, text) => {
    for (let i = from; i < to; i++) {
      body.push(marker + rows[i]);
      if (i === rows.length - 1 && !text.endsWith("\n"))
        body.push("\\ No newline at end of file");
    }
  };
  append(old, start, prefix, " ", before);
  append(old, prefix, old.length - suffix, "-", before);
  append(next, prefix, next.length - suffix, "+", after);
  append(old, old.length - suffix, oldEnd, " ", before);
  const counts = (offset, count) => `${count ? offset + 1 : offset},${count}`;
  const mode =
    !existed && exists
      ? "new file mode 100644\n"
      : existed && !exists
        ? "deleted file mode 100644\n"
        : "";
  return `diff --git a/${file} b/${file}\n${mode}--- ${existed ? "a/" + file : "/dev/null"}\n+++ ${exists ? "b/" + file : "/dev/null"}\n@@ -${counts(start, oldEnd - start)} +${counts(start, newEnd - start)} @@\n${body.join("\n")}\n`;
}
