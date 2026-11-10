import { stackAction } from './stack-views.mjs';
import { uxAction } from './ux-services.mjs';
import { composerAction } from './diagram-composer.mjs';
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import YAML from "yaml";
import { zipSync, unzipSync, strToU8 } from "fflate";
import { importDrawio, exportDrawio, validateDrawio } from "./drawio.mjs";
import { inspectFlows } from "./trust.mjs";
import { editorSchema } from "./editor-fields.mjs";
import {
  createContext,
  answerWithEvidence,
  verifyEvidence,
  findContradictions,
} from "./intelligence.mjs";
const exec = promisify(execFile);
export const sha = (x) => crypto.createHash("sha256").update(x).digest("hex");
export function publicProject(p) {
  let portal = null;
  if (typeof p.portal === "string")
    try {
      const url = new URL(p.portal);
      url.username = "";
      url.password = "";
      url.search = "";
      url.hash = "";
      portal = url.href;
    } catch {}
  return {
    id: p.id,
    title: p.title || p.id,
    writable: !!p.writable,
    manifest: p.manifest || null,
    source: { kind: p.source?.kind || p.kind || "git", provider:p.source?.provider, root: p.root },
    portal,
    validation: p.validation
      ? {
          manifest: p.validation.manifest || null,
          image: p.validation.image || null,
          runtime: p.validation.runtime || p.validation.kind || "docker",
        }
      : null,
  };
}
const blocked = new Set(["__proto__", "prototype", "constructor", "imports"]);
const clone = (x) => JSON.parse(JSON.stringify(x));
function validKey(x) {
  if (typeof x !== "string" || !x || x.length > 250 || blocked.has(x))
    throw Error("Invalid object key");
  return x;
}
function safeData(x, depth = 0) {
  if (depth > 64) throw Error("Object nesting limit");
  if (x && typeof x === "object")
    for (const [k, v] of Object.entries(x)) {
      if (blocked.has(k)) throw Error("Reserved property: " + k);
      safeData(v, depth + 1);
    }
  return x;
}
function merge(a, b) {
  for (const [k, v] of Object.entries(b)) {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      a[k] = merge(
        a[k] && typeof a[k] === "object" && !Array.isArray(a[k]) ? a[k] : {},
        v,
      );
    } else a[k] = clone(v);
  }
  return a;
}
function canonical(x, key = "") {
  if (Array.isArray(x)) {
    const rows = x.map((value) => canonical(value));
    return key === "links" &&
      rows.every((v) => v && typeof v === "object" && typeof v.id === "string")
      ? rows.sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b)))
      : rows;
  }
  if (x && typeof x === "object")
    return Object.fromEntries(
      Object.keys(x)
        .sort()
        .map((k) => [k, canonical(x[k], k)]),
    );
  return x;
}
export function mergeDiagramLinks(current, incoming) {
  const result = clone(current || []),
    used = new Set();
  for (const link of incoming || []) {
    let matches = result
      .map((old, index) => ({ old, index }))
      .filter(({ old, index }) => !used.has(index) && old.id === link.id);
    const byCell = matches.filter(
      ({ old }) =>
        link.drawio?.cellId && old.drawio?.cellId === link.drawio.cellId,
    );
    const byTitle = matches.filter(({ old }) => old.title === link.title);
    if (byCell.length) matches = byCell;
    else if (byTitle.length) matches = byTitle;
    if (matches.length > 1)
      throw Error(
        "Ambiguous parallel links to " +
          link.id +
          ". Use explicit object editing to reconcile them.",
      );
    if (matches.length) {
      const { old, index } = matches[0];
      result[index] = { ...old, ...link };
      used.add(index);
    } else {
      result.push(clone(link));
      used.add(result.length - 1);
    }
  }
  return result;
}
function propertyDiff(a, b, prefix = "", out = []) {
  if (
    JSON.stringify(canonical(a, prefix.split(".").at(-1))) ===
    JSON.stringify(canonical(b, prefix.split(".").at(-1)))
  )
    return out;
  if (
    a &&
    b &&
    typeof a === "object" &&
    typeof b === "object" &&
    !Array.isArray(a) &&
    !Array.isArray(b)
  ) {
    for (const key of new Set([...Object.keys(a), ...Object.keys(b)]))
      propertyDiff(a[key], b[key], prefix ? prefix + "." + key : key, out);
  } else out.push({ path: prefix || "$", before: a ?? null, after: b ?? null });
  return out;
}
export function semanticDiff(before, after) {
  const changes = [];
  for (const section of new Set([
    ...Object.keys(before),
    ...Object.keys(after),
  ])) {
    if (section === "imports") continue;
    const a = Object.hasOwn(before, section) ? before[section] : {},
      b = Object.hasOwn(after, section) ? after[section] : {};
    if (
      typeof a !== "object" ||
      typeof b !== "object" ||
      Array.isArray(a) ||
      Array.isArray(b)
    ) {
      const properties = propertyDiff(a, b);
      if (properties.length)
        changes.push({ section, id: "$", kind: "modified", properties });
      continue;
    }
    for (const id of new Set([...Object.keys(a), ...Object.keys(b)])) {
      const properties = propertyDiff(
        Object.hasOwn(a, id) ? a[id] : undefined,
        Object.hasOwn(b, id) ? b[id] : undefined,
      );
      if (properties.length)
        changes.push({
          section,
          id,
          kind: !Object.hasOwn(a, id)
            ? "added"
            : !Object.hasOwn(b, id)
              ? "removed"
              : "modified",
          properties,
        });
    }
  }
  return {
    changes,
    summary: {
      added: changes.filter((c) => c.kind === "added").length,
      removed: changes.filter((c) => c.kind === "removed").length,
      modified: changes.filter((c) => c.kind === "modified").length,
      total: changes.length,
    },
  };
}
export function graph(
  model,
  { focus = "", depth = 1, direction = "both", limit = 500 } = {},
) {
  const components = Object.assign(Object.create(null), model.components || {}),
    flow = inspectFlows(model),
    edges = flow.flows;
  for (const e of edges)
    if (!Object.hasOwn(components, e.to))
      components[e.to] = { title: e.to, kind: "unresolved", unresolved: true };
  let keep = new Set(Object.keys(components));
  if (focus) {
    if (!components[focus]) throw Error("Unknown focus component");
    keep = new Set([focus]);
    let wave = [focus];
    for (let i = 0; i < Math.min(8, Math.max(0, Number(depth) || 0)); i++) {
      const next = [];
      for (const edge of edges) {
        if (
          direction !== "incoming" &&
          wave.includes(edge.from) &&
          !keep.has(edge.to)
        ) {
          keep.add(edge.to);
          next.push(edge.to);
        }
        if (
          direction !== "outgoing" &&
          wave.includes(edge.to) &&
          !keep.has(edge.from)
        ) {
          keep.add(edge.from);
          next.push(edge.from);
        }
      }
      wave = next;
    }
  }
  const total = keep.size;
  keep = new Set([...keep].slice(0, Math.min(1000, Math.max(1, limit))));
  return {
    nodes: [...keep].map((id) => ({
      id,
      title: components[id].title || id,
      kind: components[id].kind || components[id].entity || "component",
      trustZone: components[id].trustZone || "",
      dataClassification: components[id].dataClassification || "",
      unresolved: !!components[id].unresolved,
    })),
    edges: edges.filter((e) => keep.has(e.from) && keep.has(e.to)),
    policies: {
      findings: flow.findings.filter((e) => keep.has(e.from) && keep.has(e.to)),
    },
    focus,
    depth,
    truncated: total > keep.size,
    total,
  };
}
export class Workbench {
  constructor(
    engine,
    {
      state,
      editorUrl = "http://localhost:8092/?embed=1&proto=json&spin=1&libraries=1&offline=1",
      specRoot,
      previewTimeoutMs = 45000,
      diagnosticTimeoutMs = 5000,
    } = {},
  ) {
    this.engine = engine;
    this.state = path.resolve(state || path.join(engine.state, "workbench"));
    this.editorUrl = editorUrl;
    this.specRoot = specRoot;
    if (
      !Number.isInteger(previewTimeoutMs) ||
      previewTimeoutMs < 1 ||
      previewTimeoutMs > 300000
    )
      throw Error("Invalid preview timeout");
    if (
      !Number.isInteger(diagnosticTimeoutMs) ||
      diagnosticTimeoutMs < 1 ||
      diagnosticTimeoutMs > 60000
    )
      throw Error("Invalid diagnostic timeout");
    this.previewTimeoutMs = previewTimeoutMs;
    this.diagnosticTimeoutMs = diagnosticTimeoutMs;
    this.previews = new Map();
    this.activePortals = new Map();
  }
  async init() {
    for (const name of ["drafts", "snapshots", "previews", "preview-records"])
      await fs.mkdir(path.join(this.state, name), { recursive: true });
    await this.restorePreviewTimers();
    return this;
  }
  async restorePreviewTimers() {
    for (const file of await fs.readdir(
      path.join(this.state, "preview-records"),
    )) {
      try {
        const entry = JSON.parse(
          await fs.readFile(
            path.join(this.state, "preview-records", file),
            "utf8",
          ),
        );
        this.id(entry.id);
        if (this.previews.has(entry.id)) continue;
        if (
          (entry.runtime !== "native" && entry.name !== "seaf-preview-" + entry.id) ||
          !Number.isFinite(Date.parse(entry.expires))
        )
          continue;
        entry.timer = setTimeout(
          () => this.stopPreview(entry.project, entry.id).catch(() => {}),
          Math.max(1, Date.parse(entry.expires) - Date.now()),
        );
        entry.timer.unref();
        this.previews.set(entry.id, entry);
      } catch {}
    }
  }
  id(value) {
    if (typeof value !== "string" || !/^[a-z0-9-]{16,80}$/i.test(value))
      throw Error("Invalid identifier");
    return value;
  }
  async head(p) {
    if (this.engine.revision) return (await this.engine.revision(p)).id;
    return this.engine.git(p, ["rev-parse", "HEAD"]);
  }
  async model(project) {
    const p = await this.engine.project(project);
    const sourceKind=this.engine.kind?this.engine.kind(p):(p.source?.kind||'git');
    let branch=null;
    if(sourceKind==='git')try{branch=await this.engine.git(p,['branch','--show-current'])||'detached HEAD';}catch{}
    const revision=this.engine.revision?await this.engine.revision(p):undefined;
    const head=revision?.id||await this.head(p);
    return {
      ...(p.manifest
        ? await this.engine.model(project)
        : {
            model: {},
            provenance: {},
            files: await this.engine.files(p.root),
            scope:
              "Reference artifacts only; configure a manifest to load architecture",
          }),
      head,
      revision,
      fingerprint: await this.engine.fingerprint(
        p.validation?.workspace || p.root,
      ),
      context:{project,title:p.title||project,sourceKind,provider:p.source?.provider||sourceKind,root:p.root,writable:!!p.writable,branch,revision:head,portal:p.portal||null,manifest:p.manifest||null},
    };
  }
  async graph(project, a) {
    const m = await this.model(project),
      result = graph(m.model, a),
      cache = new Map(),
      sourceFor = async (id) => {
        if (!cache.has(id)) {
          const files = m.definitions?.["components/" + id] || [
            m.provenance["components/" + id],
          ];
          const sources = [];
          for (const file of files)
            if (file && !file.startsWith(".."))
              sources.push(await this.source(project, file, id, m.head));
          cache.set(id, sources);
        }
        return cache.get(id);
      };
    for (const n of result.nodes) n.sources = await sourceFor(n.id);
    for (const e of result.edges) {
      e.sources = [];
      for (const file of m.definitions?.["components/" + e.from] || [
        m.provenance["components/" + e.from],
      ])
        if (file && !file.startsWith("..")) {
          try {
            e.sources.push(
              await this.source(
                project,
                file,
                {
                  section: "components",
                  id: e.from,
                  linkTarget: e.to,
                  linkTitle: e.title,
                },
                m.head,
              ),
            );
          } catch (error) {
            if (error.message !== "Evidence node missing") throw error;
          }
        }
    }
    for (const f of result.policies.findings) {
      f.sources = [...(await sourceFor(f.from)), ...(await sourceFor(f.to))];
      for (const v of f.violations) {
        const file = m.provenance["trustPolicies/" + v.policy];
        if (file)
          f.sources.push(await this.source(project, file, v.policy, m.head));
      }
    }
    return result;
  }
  async getDraft(project, id) {
    const d = JSON.parse(
      await fs.readFile(
        path.join(this.state, "drafts", this.id(id) + ".json"),
        "utf8",
      ),
    );
    if (d.project !== project) throw Error("Draft belongs to another project");
    return d;
  }
  async drafts(project) {
    const out = [];
    for (const file of await fs.readdir(path.join(this.state, "drafts"))) {
      if (!file.endsWith(".json")) continue;
      const d = JSON.parse(
        await fs.readFile(path.join(this.state, "drafts", file), "utf8"),
      );
      if (d.project === project) out.push(d);
    }
    return out.sort((a, b) => b.updated.localeCompare(a.updated));
  }
  async saveDraft(project, input) {
    const p = await this.engine.project(project);
    const d = clone(input || {});
    if (d.format && d.format !== "seaf-draft-v1")
      throw Error("Unsupported draft format");
    d.format = "seaf-draft-v1";
    if (d.project && d.project !== project)
      throw Error("Draft belongs to another project");
    if (d.id) {
      const old = await this.getDraft(project, d.id);
      if (
        old.baseHead !== d.baseHead ||
        old.baseFingerprint !== d.baseFingerprint
      )
        throw Error("Cannot change draft base");
    } else d.id = crypto.randomUUID();
    if (typeof d.title !== "string" || d.title.length > 250)
      d.title = "Изменение архитектуры";
    d.project = project;
    d.baseHead ||= await this.head(p);
    d.baseFingerprint ||= await this.engine.fingerprint(
      p.validation?.workspace || p.root,
    );
    d.updated = new Date().toISOString();
    if (d.changes) {
      if (!Array.isArray(d.changes) || d.changes.length > 50)
        throw Error("Too many changes");
      for (const c of d.changes) {
        await this.engine.safe(p.root, c.path);
        if (
          c.content !== null &&
          (typeof c.content !== "string" || c.content.length > 500000)
        )
          throw Error("Invalid content");
      }
    }
    if (JSON.stringify(d).length > 4000000) throw Error("Draft too large");
    const target = path.join(this.state, "drafts", d.id + ".json"),
      temp = target + "." + crypto.randomUUID() + ".tmp";
    await fs.writeFile(temp, JSON.stringify(d, null, 2));
    await fs.rename(temp, target);
    return d;
  }
  async buildOperations(project, operations) {
    if (
      !Array.isArray(operations) ||
      !operations.length ||
      operations.length > 500
    )
      throw Error("Provide 1–500 operations");
    const p = await this.engine.project(project),
      base = await this.model(project),
      model = clone(base.model),
      docs = new Map(),
      getDoc = async (file) => {
        if (!docs.has(file)) {
          let text = "{}";
          try {
            text = (await this.engine.read(project, file)).content;
          } catch (e) {
            if (e.code !== "ENOENT") throw e;
          }
          const d = YAML.parseDocument(text, { uniqueKeys: true });
          if (d.errors.length) throw Error("Invalid YAML: " + file);
          docs.set(file, d);
        }
        return docs.get(file);
      };
    for (const op of operations) {
      const section = validKey(op.section),
        id = validKey(op.id),
        mode = op.mode;
      if (!["create", "merge", "replace", "delete"].includes(mode))
        throw Error("Invalid operation mode");
      if (
        model[section] &&
        (!model[section] ||
          typeof model[section] !== "object" ||
          Array.isArray(model[section]))
      )
        throw Error("Section is not an object map");
      model[section] ||= {};
      const exists = Object.hasOwn(model[section], id);
      if (mode === "create" && exists)
        throw Error("Object already exists: " + id);
      if (mode !== "create" && !exists)
        throw Error("Object does not exist: " + id);
      let file =
        base.provenance[section + "/" + id] || "architecture/workbench.yaml";
      await this.engine.safe(p.root, file);
      const doc = await getDoc(file);
      for (const source of base.definitions?.[section + "/" + id] || []) {
        await this.engine.safe(p.root, source);
        (await getDoc(source)).deleteIn([section, id]);
      }
      if (mode === "delete") {
        delete model[section][id];
        doc.deleteIn([section, id]);
        continue;
      }
      if (!op.value || typeof op.value !== "object" || Array.isArray(op.value))
        throw Error("Object value must be a mapping");
      safeData(op.value);
      const value =
        mode === "merge"
          ? merge(clone(model[section][id]), op.value)
          : clone(op.value);
      for (const property of op.removeProperties || []) {
        const parts = property.startsWith("/")
          ? property
              .slice(1)
              .split("/")
              .map((x) => x.replaceAll("~1", "/").replaceAll("~0", "~"))
          : property.split(".");
        parts.forEach(validKey);
        const parent = parts.slice(0, -1).reduce((o, k) => o?.[k], value);
        if (parent && typeof parent === "object") delete parent[parts.at(-1)];
      }
      model[section][id] = value;
      if (!doc.has(section)) doc.set(section, YAML.createNode({}));
      doc.setIn([section, id], value);
    }
    if (docs.has("architecture/workbench.yaml")) {
      const rootDoc = await getDoc(p.manifest),
        imports = rootDoc.get("imports")?.toJSON?.() || [];
      const importPath=path.posix.relative(path.posix.dirname(p.manifest.replaceAll('\\','/')),'architecture/workbench.yaml');
      if(!Array.isArray(imports)||imports.some(item=>typeof item!=='string'))throw Error('imports must be a list of strings');
      if (!imports.some(value=>!value.includes('://')&&path.posix.normalize(value.replaceAll('\\','/'))===path.posix.normalize(importPath))){
        const sequence=rootDoc.get('imports');
        if(sequence&&Array.isArray(sequence.items)&&typeof sequence.add==='function')sequence.add(importPath);else rootDoc.set('imports',[...imports,importPath]);
      }
    }
    const changes = [...docs].map(([file, doc]) => ({
      path: file,
      content: /\.json$/i.test(file)?JSON.stringify(doc.toJSON(),null,2)+'\n':doc.toString(),
    }));
    const effectiveView = await this.modelWithChanges(project, changes),
      effective = effectiveView.model;
    const impacts = operations
      .filter((op) => op.mode === "delete")
      .map((op) => ({
        section: op.section,
        id: op.id,
        references: Object.entries(base.model).flatMap(([section, entities]) =>
          entities && typeof entities === "object" && !Array.isArray(entities)
            ? Object.entries(entities)
                .filter(
                  ([id, value]) =>
                    !(section === op.section && id === op.id) &&
                    JSON.stringify(value).includes(JSON.stringify(op.id)),
                )
                .map(([id]) => ({
                  section,
                  id,
                  file: base.provenance[section + "/" + id],
                }))
            : [],
        ),
      }));
    return {
      changes,
      model: effective,
      impacts,
      semanticDiff: await this.compareViews(
        base,
        effectiveView,
        p.root,
        effectiveView.root,
      ),
      baseHead: base.head,
      baseFingerprint: base.fingerprint,
    };
  }
  async objectPropose(project, a) {
    const built = await this.buildOperations(project, a.operations);
    if (a.draft !== false)
      return this.saveDraft(project, {
        title: a.title || "Изменение объектов",
        ...built,
        operations: a.operations,
      });
    return this.engine.propose(
      project,
      built.changes,
      a.title || "Edit architecture objects",
    );
  }
  async proposeDraft(project, id) {
    let d = await this.getDraft(project, id);
    const p = await this.engine.project(project);
    if (
      (await this.head(p)) !== d.baseHead ||
      (await this.engine.fingerprint(p.validation?.workspace || p.root)) !==
        d.baseFingerprint
    )
      throw Error(
        "Stale draft: project changed. Compare with current model and create a new draft.",
      );
    if (!d.changes?.length && d.operations?.length) {
      const built = await this.buildOperations(project, d.operations);
      d = await this.saveDraft(project, { ...d, ...built });
    }
    if (!d.changes?.length) throw Error("Draft has no changes");
    return this.engine.propose(project, d.changes, d.title);
  }
  async modelWithChanges(project, changes) {
    const p = await this.engine.project(project),
      dir = path.join(this.state, "previews", crypto.randomUUID()),
      workspace = path.join(dir, "workspace");
    await this.engine.copyArtifacts(
      p.validation?.workspace || p.root,
      workspace,
    );
    const relative = p.validation
      ? path.relative(p.validation.workspace, p.root)
      : "";
    const root = path.join(workspace, relative);
    await this.engine.writeChanges(root, changes);
    const built = await this.engine.model(project, root, workspace);
    return {
      ...built,
      dir,
      workspace,
      root,
    };
  }
  async gitModel(project, ref) {
    const p = await this.engine.project(project);
    if (this.engine.kind?.(p) === "directory") {
      const dir = path.join(this.state, "previews", crypto.randomUUID()),
        workspace = path.join(dir, "workspace"),
        relative = p.validation ? path.relative(p.validation.workspace, p.root) : "",
        root = path.join(workspace, relative);
      await this.engine.copyArtifacts(p.validation?.workspace || p.root, workspace);
      for (const f of await this.engine.files(root)) await fs.unlink(await this.engine.safe(root, f));
      const { revision } = await this.engine.loadRevision(p, ref, root);
      return { ...(await this.engine.model(project, root, workspace)), dir, workspace, root, revision, commit: null };
    }
    if (
      typeof ref !== "string" ||
      !ref ||
      ref.length > 200 ||
      ref.startsWith("-")
    )
      throw Error("Invalid Git reference");
    const commit = await this.engine.git(p, [
      "rev-parse",
      "--verify",
      "--end-of-options",
      ref + "^{commit}",
    ]);
    const { stdout } = await exec(
      process.env.SEAF_GIT || "git",
      ["-C", p.root, "archive", "--format=zip", commit],
      { encoding: "buffer", maxBuffer: 64 * 1024 * 1024, windowsHide: true },
    );
    const entries = unzipSync(new Uint8Array(stdout));
    const dir = path.join(this.state, "previews", crypto.randomUUID()),
      workspace = path.join(dir, "workspace");
    await this.engine.copyArtifacts(
      p.validation?.workspace || p.root,
      workspace,
    );
    const rel = p.validation
        ? path.relative(p.validation.workspace, p.root)
        : "",
      root = path.join(workspace, rel);
    for (const f of await this.engine.files(root))
      await fs.unlink(await this.engine.safe(root, f));
    for (const [f, content] of Object.entries(entries)) {
      if (f.endsWith("/")) continue;
      let target;
      try {
        target = await this.engine.safe(root, f);
      } catch {
        continue;
      }
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, content);
    }
    const built = await this.engine.model(project, root, workspace);
    return {
      ...built,
      dir,
      workspace,
      root,
      commit,
    };
  }
  async diff(project, a) {
    const p = await this.engine.project(project);
    const current = await this.model(project);
    if (a.draftId) {
      const d = await this.getDraft(project, a.draftId);
      let changes = d.changes;
      if (d.operations?.length)
        changes = (await this.buildOperations(project, d.operations)).changes;
      if (!changes?.length) throw Error("Draft has no file changes");
      const view = await this.modelWithChanges(project, changes);
      return this.compareViews(current, view, p.root, view.root);
    }
    const base = a.baseRef ? await this.gitModel(project, a.baseRef) : current;
    const target = a.targetRef
      ? await this.gitModel(project, a.targetRef)
      : current;
    return this.compareViews(
      base,
      target,
      base.root || p.root,
      target.root || p.root,
    );
  }
  async compareViews(before, after, beforeRoot, afterRoot) {
    const result = semanticDiff(before.model, after.model),
      paths = new Set([
        ...(await this.engine.files(beforeRoot)),
        ...(await this.engine.files(afterRoot)),
      ]),
      changes = [];
    for (const file of [...paths].sort()) {
      let old = null,
        content = null;
      try {
        old = await fs.readFile(
          await this.engine.safe(beforeRoot, file),
          "utf8",
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      try {
        content = await fs.readFile(
          await this.engine.safe(afterRoot, file),
          "utf8",
        );
      } catch (error) {
        if (error.code !== "ENOENT") throw error;
      }
      if (old !== content)
        changes.push({
          path: file,
          content,
          kind:
            old === null ? "added" : content === null ? "removed" : "modified",
        });
    }
    for (const change of result.changes) {
      const key = change.section + "/" + change.id;
      change.sourcePaths = [
        ...new Set(
          [
            ...(before.definitions?.[key] || [before.provenance?.[key]]),
            ...(after.definitions?.[key] || [after.provenance?.[key]]),
          ].filter(Boolean),
        ),
      ];
    }
    return {
      ...result,
      files: changes.map(({ path, kind }) => ({ path, kind })),
      diff: changes.length
        ? await this.engine.diffChanges(beforeRoot, changes)
        : "",
    };
  }
  async snapshotList(project) {
    const result = [];
    for (const id of await fs.readdir(path.join(this.state, "snapshots"))) {
      let m;
      try {
        m = JSON.parse(
          await fs.readFile(
            path.join(this.state, "snapshots", id, "manifest.json"),
            "utf8",
          ),
        );
      } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
      }
      if (m.project === project) result.push(m);
    }
    return result;
  }
  async snapshot(project, title = "Снимок архитектуры") {
    const p = await this.engine.project(project);
    if (!p.validation)
      throw Error("Runtime configuration required for reproducible snapshot");
    await this.engine.clean(p);
    const head = await this.head(p),
      files = {},
      rows = [];
    for (const file of await this.engine.files(
      p.validation?.workspace || p.root,
    )) {
      const bytes = await fs.readFile(
        await this.engine.safe(p.validation?.workspace || p.root, file),
      );
      files["workspace/" + file] = bytes;
      rows.push({ path: "workspace/" + file, sha256: sha(bytes) });
    }
    if (this.specRoot) {
      const walk = async (dir, prefix = "") => {
        for (const e of await fs.readdir(dir, { withFileTypes: true })) {
          if (e.name === "tooling" || e.name.startsWith(".")) continue;
          const rel = prefix + e.name;
          if (e.isDirectory()) await walk(path.join(dir, e.name), rel + "/");
          else if (/\.(md|yaml|yml|json)$/.test(e.name)) {
            const bytes = await fs.readFile(path.join(dir, e.name));
            files["openspec/" + rel] = bytes;
            rows.push({ path: "openspec/" + rel, sha256: sha(bytes) });
          }
        }
      };
      await walk(this.specRoot);
    }
    const native = p.validation.runtime === "native" || p.validation.kind === "native";
    const image = native ? null : JSON.parse(
      (await this.engine.docker(["image", "inspect", p.validation.image])).stdout,
    )[0];
    const runtimeIdentity = native ? await (await this.engine.runtime(p)).identity() : null;
    const basis = {
      format: "seaf-snapshot-v1",
      project,
      head,
      revision: this.engine.revision ? await this.engine.revision(p) : undefined,
      files: rows.sort((a, b) =>
        a.path < b.path ? -1 : a.path > b.path ? 1 : 0,
      ),
      runtime: native ? {
        kind: "native",
        identity: runtimeIdentity,
        manifest: p.validation.manifest,
        workbenchNode: process.version,
      } : {
        imageId: image.Id,
        repoDigests: image.RepoDigests || [],
        manifest: p.validation.manifest,
        environment: {
          VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS: "n",
          VUE_APP_DOCHUB_BACKEND_PORT: "8080",
          VUE_APP_DOCHUB_ROOT_MANIFEST: p.validation.manifest,
        },
        workbenchNode: process.version,
      },
      scope:
        native ? "Workspace imports + OpenSpec + exact native runtime identity. Matching runtime binaries must be available separately." : "Workspace imports + OpenSpec + exact runtime image identity. Docker image must be available separately.",
    };
    const id = sha(JSON.stringify(basis));
    const manifest = { ...basis, id, title, created: new Date().toISOString() };
    const dir = path.join(this.state, "snapshots", id);
    await fs.mkdir(dir, { recursive: true });
    for (const [f, b] of Object.entries(files)) {
      const target = path.join(dir, ...f.split("/"));
      await fs.mkdir(path.dirname(target), { recursive: true });
      await fs.writeFile(target, b);
    }
    const zip = {};
    for (const [f, b] of Object.entries(files).sort(([a], [b]) =>
      a < b ? -1 : a > b ? 1 : 0,
    ))
      zip[f] = [b, { mtime: new Date(1980, 0, 1, 0, 0, 0) }];
    zip["manifest.json"] = [
      strToU8(JSON.stringify(basis, null, 2)),
      { mtime: new Date(1980, 0, 1, 0, 0, 0) },
    ];
    await fs.writeFile(
      path.join(dir, "archive.zip"),
      zipSync(zip, { level: 6 }),
    );
    await fs.writeFile(
      path.join(dir, "manifest.json"),
      JSON.stringify(manifest, null, 2),
    );
    return { ...manifest, archive: "/api/snapshot/" + id + "/archive.zip" };
  }
  async snapshotVerify(project, id) {
    this.id(id);
    const dir = path.join(this.state, "snapshots", id),
      m = JSON.parse(
        await fs.readFile(path.join(dir, "manifest.json"), "utf8"),
      );
    if (m.project !== project)
      throw Error("Snapshot belongs to another project");
    const failures = [];
    if (m.id !== id) failures.push("manifest.json:id");
    for (const f of m.files) {
      if (
        !/^(workspace|openspec)\//.test(f.path) ||
        f.path.split("/").some((x) => x === ".." || x.startsWith("."))
      )
        throw Error("Invalid snapshot path");
      try {
        if (
          sha(await fs.readFile(await this.engine.safe(dir, f.path))) !==
          f.sha256
        )
          failures.push(f.path);
      } catch {
        failures.push(f.path);
      }
    }
    const { id: ignored, title, created, ...basis } = m;
    if (sha(JSON.stringify(basis)) !== id) failures.push("manifest.json");
    let archive;
    try {
      archive = unzipSync(
        new Uint8Array(await fs.readFile(path.join(dir, "archive.zip"))),
      );
    } catch (error) {
      failures.push("archive.zip: " + error.message);
      return { ok: false, id, files: m.files.length, failures };
    }
    for (const f of m.files)
      if (!archive[f.path] || sha(archive[f.path]) !== f.sha256)
        failures.push("archive.zip:" + f.path);
    try {
      if (
        !archive["manifest.json"] ||
        sha(
          JSON.stringify(
            JSON.parse(Buffer.from(archive["manifest.json"]).toString("utf8")),
          ),
        ) !== id
      )
        failures.push("archive.zip:manifest.json");
    } catch {
      failures.push("archive.zip:manifest.json");
    }
    const expected = new Set(["manifest.json", ...m.files.map((f) => f.path)]);
    for (const file of Object.keys(archive))
      if (!expected.has(file)) failures.push("archive.zip:unexpected:" + file);
    return { ok: !failures.length, id, files: m.files.length, failures };
  }
  async preview(project, a) {
    const limit = Number(process.env.SEAF_PREVIEW_LIMIT || 3);
    if (!Number.isInteger(limit) || limit < 1 || limit > 20)
      throw Error("SEAF_PREVIEW_LIMIT must be 1–20");
    const lockPath = path.join(this.state, "preview-start.lock");
    let handle;
    try {
      handle = await fs.open(lockPath, "wx");
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
      let stale = false;
      try {
        const owner = JSON.parse(await fs.readFile(lockPath, "utf8"));
        try {
          process.kill(owner.pid, 0);
        } catch (e) {
          stale = e.code === "ESRCH";
        }
      } catch {}
      if (stale) {
        await fs.unlink(lockPath);
        handle = await fs.open(lockPath, "wx");
      } else
        throw Error("Another preview is starting; retry when it is ready.");
    }
    try {
      await handle.writeFile(JSON.stringify({ pid: process.pid }));
      const records = await fs.readdir(
        path.join(this.state, "preview-records"),
      );
      if (records.filter((f) => f.endsWith(".json")).length >= limit)
        throw Error(
          "Preview limit reached (" +
            limit +
            "). Stop an existing preview first.",
        );
      return await this.startPreview(project, a);
    } finally {
      await handle.close();
      await fs.unlink(lockPath).catch(() => {});
    }
  }
  async startPreview(project, a) {
    const p = await this.engine.project(project);
    if (!p.validation) throw Error("Runtime configuration required");
    let copied,
      native = p.validation.runtime === "native" || p.validation.kind === "native",
      expectedNativeIdentity,
      imageId = p.validation.image,
      runtimeManifest = p.validation.manifest,
      runtimeEnvironment = {
        VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS: "n",
        VUE_APP_DOCHUB_BACKEND_PORT: "8080",
        VUE_APP_DOCHUB_ROOT_MANIFEST: p.validation.manifest,
      };
    if (a.snapshotId) {
      const verified = await this.snapshotVerify(project, a.snapshotId);
      if (!verified.ok) throw Error("Snapshot integrity check failed");
      const snapshot = (await this.snapshotList(project)).find(
        (s) => s.id === a.snapshotId,
      );
      if ((snapshot.runtime.kind === "native") !== native)
        throw Error("Snapshot runtime type differs from the configured runtime");
      expectedNativeIdentity = snapshot.runtime.identity;
      imageId = snapshot.runtime.imageId;
      runtimeManifest = snapshot.runtime.manifest;
      runtimeEnvironment = snapshot.runtime.environment;
      const dir = path.join(this.state, "previews", crypto.randomUUID()),
        workspace = path.join(dir, "workspace");
      await this.engine.copyArtifacts(
        path.join(this.state, "snapshots", a.snapshotId, "workspace"),
        workspace,
      );
      copied = { dir, workspace, revision: snapshot.revision || null,
        commit: snapshot.revision?.kind === "directory" ? null : snapshot.head };
    } else if (a.draftId) {
      const draft = await this.getDraft(project, a.draftId);
      if (
        (await this.head(p)) !== draft.baseHead ||
        (await this.engine.fingerprint(p.validation?.workspace || p.root)) !==
          draft.baseFingerprint
      )
        throw Error("Stale draft: refresh before preview");
      copied = await this.modelWithChanges(project, draft.changes);
    } else copied = await this.gitModel(project, a.ref || "HEAD");
    if (native) {
      const runtime = await this.engine.runtime(p);
      if (expectedNativeIdentity && sha(JSON.stringify(canonical(await runtime.identity()))) !== sha(JSON.stringify(canonical(expectedNativeIdentity))))
        throw Error("Snapshot native runtime identity unavailable or changed");
      let started;
      try {
        started = await runtime.startPreview({workspace: copied.workspace, manifest: runtimeManifest, ttlMs: 1800000,projectId:project});
        const entry = { id: started.id, runtimeId: started.id, runtime: "native", project, name: "native-" + started.id,
          url: started.url, revision: copied.revision || null, commit: copied.commit || null,
          ref: a.ref || null, draftId: a.draftId || null, snapshotId: a.snapshotId || null,
          expires: new Date(Date.now() + 1800000).toISOString(), workspace: copied.workspace };
        this.id(entry.id);
        entry.timer = setTimeout(() => this.stopPreview(project, entry.id).catch(() => {}),1800000);
        entry.timer.unref();
        this.previews.set(entry.id,entry);
        const {timer,...result}=entry;
        await fs.writeFile(path.join(this.state,"preview-records",entry.id+".json"),JSON.stringify(result));
        return result;
      } catch(error) {
        if(started) await runtime.stopPreview(started.id).catch(()=>{});
        if(started) {
          clearTimeout(this.previews.get(started.id)?.timer);
          this.previews.delete(started.id);
          if(/^[a-z0-9-]{16,80}$/i.test(started.id))
            await fs.unlink(path.join(this.state,"preview-records",started.id+".json")).catch(()=>{});
        }
        throw Error("Native preview failed: " + this.engine.redact(p,error.message));
      }
    }
    if (!imageId) throw Error("Snapshot unavailable");
    try {
      await this.engine.docker(["image", "inspect", imageId]);
    } catch {
      throw Error("Preview runtime image unavailable: " + imageId);
    }
    const id = crypto.randomUUID(),
      name = "seaf-preview-" + id;
    let stage = "runtime-start";
    try {
      await this.engine.docker([
        "run",
        "--pull",
        "never",
        "-d",
        "--name",
        name,
        "--label",
        "seaf.workbench.preview=true",
        "-p",
        "127.0.0.1::8080",
        ...Object.entries(runtimeEnvironment).flatMap(([key, value]) => [
          "-e",
          key + "=" + value,
        ]),
        "-v",
        copied.workspace + ":/var/www/public/workspace:ro",
        imageId,
      ]);
      stage = "port-binding";
      const binding = (
        await this.engine.docker(["port", name, "8080/tcp"])
      ).stdout.trim();
      if (!/^127\.0\.0\.1:\d+$/.test(binding))
        throw Error("Unexpected preview binding");
      const url = "http://" + binding;
      let ready = false;
      stage = "readiness";
      const deadline = Date.now() + this.previewTimeoutMs;
      while (Date.now() < deadline) {
        try {
          if (
            (
              await fetch(url + "/health", {
                signal: AbortSignal.timeout(
                  Math.max(1, Math.min(2000, deadline - Date.now())),
                ),
              })
            ).ok
          ) {
            ready = true;
            break;
          }
        } catch {}
        await new Promise((r) =>
          setTimeout(r, Math.max(0, Math.min(500, deadline - Date.now()))),
        );
      }
      if (!ready)
        throw Error(
          "Runtime did not become ready before timeout (" +
            this.previewTimeoutMs +
            " ms)",
        );
      stage = "expiry-record";
      const entry = {
        id,
        project,
        name,
        url,
        commit: copied.commit || null,
        ref: a.ref || null,
        draftId: a.draftId || null,
        snapshotId: a.snapshotId || null,
        expires: new Date(Date.now() + 1800000).toISOString(),
        workspace: copied.workspace,
      };
      entry.timer = setTimeout(
        () => this.stopPreview(project, id).catch(() => {}),
        1800000,
      );
      entry.timer.unref();
      this.previews.set(id, entry);
      const { timer, ...result } = entry;
      await fs.writeFile(
        path.join(this.state, "preview-records", id + ".json"),
        JSON.stringify(result),
      );
      return result;
    } catch (e) {
      await this.engine.docker(["rm", "-f", name]).catch(() => {});
      clearTimeout(this.previews.get(id)?.timer);
      this.previews.delete(id);
      throw Error(
        "Preview " + stage + " failed: " + this.engine.redact(p, e.message),
      );
    }
  }
  async stopPreview(project, id) {
    const x = this.previews.get(this.id(id));
    if (!x || x.project !== project) throw Error("Unknown preview");
    clearTimeout(x.timer);
    try {
      if(x.runtime === "native")
        await (await this.engine.runtime(await this.engine.project(project))).stopPreview(x.runtimeId || x.id);
      else await this.engine.docker(["rm", "-f", x.name]);
    } catch (error) {
      if (!/No such container|not found/i.test(error.stderr || error.message))
        throw error;
    }
    this.previews.delete(id);
    await fs
      .unlink(path.join(this.state, "preview-records", id + ".json"))
      .catch(() => {});
    return { stopped: true, id };
  }
  async source(project, file, needle, commit) {
    const read = await this.engine.read(project, file),
      lines = read.content.split(/\r?\n/);
    let index;
    const entityId =
      typeof needle === "object"
        ? needle.id
        : typeof needle === "string"
          ? needle
          : undefined;
    if (typeof needle === "number") index = needle - 1;
    else if (/\.ya?ml$/.test(file)) {
      const doc = YAML.parseDocument(read.content),
        section =
          typeof needle === "object"
            ? needle.section
            : doc.hasIn(["components", needle])
              ? "components"
              : "trustPolicies";
      let node = doc.getIn([section, entityId], true);
      if (typeof needle === "object" && needle.linkTarget) {
        const links = doc.getIn([section, entityId, "links"], true);
        node = links?.items?.find(
          (item) =>
            item.get?.("id") === needle.linkTarget &&
            (!needle.linkTitle || item.get("title") === needle.linkTitle),
        );
      }
      if (!node?.range) throw Error("Evidence node missing");
      index = read.content.slice(0, node.range[0]).split(/\r?\n/).length - 1;
    } else index = lines.findIndex((line) => line.includes(needle));
    if (index < 0) index = 0;
    return {
      project,
      entityId,
      file,
      line: index + 1,
      excerpt: lines.slice(Math.max(0, index - 1), index + 3).join("\n"),
      commit: this.engine.kind?.(await this.engine.project(project)) === "directory" ? null : commit || (await this.head(await this.engine.project(project))),
      revision: this.engine.revision ? await this.engine.revision(await this.engine.project(project)) : undefined,
      sha256: read.sha256,
    };
  }
  async context(project, question) {
    return createContext(this.engine, project, question);
  }
  async answer(project, question) {
    return answerWithEvidence(this.engine, project, question);
  }
  async contradictions(project) {
    return findContradictions(this.engine, project);
  }
  async verifyEvidence(project, sources) {
    return verifyEvidence(this.engine, project, sources);
  }
  async activateProject(project) {
    const p = await this.engine.project(project);
    if(p.validation?.runtime !== "native" && p.validation?.kind !== "native") {
      if(!p.portal) throw Error("Портал проекта не настроен");
      return {url:p.portal,project};
    }
    const old=this.activePortals.get(project);
    if(old) {
      try { if((await fetch(new URL('/health',old.url),{signal:AbortSignal.timeout(2000)})).ok) return {url:old.url,project}; } catch {}
      this.activePortals.delete(project);
    }
    const runtime=await this.engine.runtime(p);
    const started=await runtime.start({workspace:p.validation.workspace,manifest:p.validation.manifest,projectId:project});
    try {
      await this.engine.updateProject(project,{portal:started.url});
      this.activePortals.set(project,started);
      return {url:started.url,project};
    } catch(error) {
      await runtime.stop(started.id).catch(()=>{});
      throw error;
    }
  }
  async exportProject(project) {
    const p=await this.engine.project(project), entries={}, files=[];
    let bytes=0;
    for(const file of await this.engine.files(p.root)) {
      const data=await fs.readFile(await this.engine.safe(p.root,file));
      bytes+=data.length;
      if(bytes>64*1024*1024) throw Error("Project export exceeds 64 MiB; export a smaller architecture project");
      entries[file]=data;files.push({path:file,sha256:sha(data)});
    }
    entries['seaf-export.json']=strToU8(JSON.stringify({format:'seaf-project-export-v1',title:p.title,manifest:p.manifest,source:p.source?.kind||'git',files},null,2));
    return {filename:p.id+'.zip',base64:Buffer.from(zipSync(entries,{level:6})).toString('base64'),files:files.length,scope:'Architecture artifact allowlist; Git metadata and external imports are not included.'};
  }
  async diagnostics(project) {
    const p = await this.engine.project(project),
      native = p.validation?.runtime === "native" || p.validation?.kind === "native",
      directory = this.engine.kind?.(p) === "directory",
      checks = [];
    const check = async (name, fn, fix) => {
      try {
        checks.push({ name, status: "ok", detail: await fn(), fix: "" });
      } catch (e) {
        checks.push({
          name,
          status: "error",
          detail: this.engine.redact(p, e.message),
          fix,
        });
      }
    };
    checks.push({
      name: "API",
      status: "ok",
      detail: "Локальный сервис отвечает",
      fix: "",
    });
    await check(
      "Доступ к проекту",
      async () => {
        if (!(await fs.stat(p.root)).isDirectory())
          throw Error("Project root is not a directory");
        await fs.access(p.root);
        return p.title || p.id;
      },
      "Проверьте root зарегистрированного проекта и права чтения.",
    );
    await check(
      directory ? "Локальная история" : "Git",
      async () => {
        if (p.writable) await this.engine.clean(p);
        return await this.head(p);
      },
      directory ? "Проверьте доступ к папке проекта и локальной истории." : "Сохраните свои изменения в Git; проект должен иметь собственный чистый репозиторий.",
    );
    await check(
      "Модель и импорты",
      async () => {
        if (!p.manifest)
          return "Справочные артефакты; архитектурный манифест не настроен";
        const m = await this.engine.model(project);
        return m.files.length + " YAML-файлов";
      },
      "Проверьте корневой манифест и относительные импорты.",
    );
    if (!native) await check(
      "Docker",
      async () => {
        return (
          await this.engine.docker(["info", "--format", "{{.OSType}}"], {
            timeout: 10000,
          })
        ).stdout.trim();
      },
      "Запустите Docker Desktop в режиме Linux containers.",
    );
    await check(
      "Конфигурация валидации",
      async () => {
        if (!p.validation) {
          if (p.writable)
            throw Error("Validation runtime configuration is missing");
          return "Справочный проект: публикация не разрешена";
        }
        if (
          !p.validation.workspace ||
          !p.validation.manifest ||
          (!native && !p.validation.image)
        )
          throw Error("Validation requires workspace, manifest and the configured runtime");
        return p.validation.manifest + " / " + (native ? "bundled Node.js" : p.validation.image);
      },
      "Укажите validation.workspace, validation.manifest и validation.image в projects.json.",
    );
    if (native) await check(
      "Native runtime",
      async () => (await (await this.engine.runtime(p)).identity()),
      "Проверьте комплект runtime и его manifest; при повреждении распакуйте исходный ZIP заново.",
    );
    if (p.validation && !native)
      await check(
        "Образ SEAF",
        async () =>
          (
            await this.engine.docker(
              ["image", "inspect", p.validation.image, "--format", "{{.Id}}"],
              { timeout: 10000 },
            )
          ).stdout.trim(),
        "Соберите образ, указанный в projects.json.",
      );
    if (p.portal)
      await check(
        "Портал и валидаторы",
        async () => {
          const r = await fetch(new URL("/core/storage/problems/", p.portal), {
            signal: AbortSignal.timeout(this.diagnosticTimeoutMs),
          });
          if (!r.ok) throw Error("HTTP " + r.status);
          const problems = await r.json(),
            bad = problems.filter((x) => x.error || x.items?.length);
          if (bad.length) throw Error(JSON.stringify(bad));
          return problems.length + " проверок без замечаний";
        },
        "Запустите ярлык SEAF и устраните ошибки на странице «Проблемы».",
      );
    await check(
      "Редактор draw.io",
      async () => {
        const r = await fetch(new URL("/", this.editorUrl), {
          signal: AbortSignal.timeout(this.diagnosticTimeoutMs),
        });
        if (!r.ok) throw Error("HTTP " + r.status);
        return new URL(this.editorUrl).origin;
      },
      native ? "Запустите переносимый комплект Start.cmd и проверьте журнал локального редактора." : "Выполните docker compose up -d drawio.",
    );
    checks.push({
      name: "Запись проекта",
      status: p.writable ? "ok" : "info",
      detail: p.writable
        ? "Разрешена через diff → validate → " + (directory ? "локальная ревизия" : "Git")
        : "Справочный репозиторий: только чтение",
      fix: p.writable
        ? ""
        : "Подключите свою папку с разрешением записи и настроенной проверкой модели.",
    });
    return {
      checks,
      ready: !checks.some((c) => c.status === "error"),
      project: publicProject(p),
      workbenchNode: process.version,
      editorUrl: this.editorUrl,
    };
  }
  async action(a) {
    switch(a.action) {
      case "project_inspect": return this.engine.inspectProject(a);
      case "project_connect": return publicProject(await this.engine.connectProject(a));
      case "project_clone": { const result=await this.engine.cloneProject(a); return publicProject(result.project || result); }
      case "project_pick_directory": return this.engine.pickDirectory();
      case "projects_list": return (await this.engine.projects()).map(publicProject);
      case "project_clone_local": {const result=await this.engine.cloneLocalProject(a);return publicProject(result.project||result);}
    }
    const project = a.project;
    if (!project) throw Error("Select a project");
    await this.engine.project(project);
    switch (a.action) {
      case "diagram_list":
      case "diagram_workspace":
      case "diagram_load":
      case "diagram_preview":
      case "diagram_draft":
        return composerAction(this,project,a);
      case "ux_search":
      case "ux_passport":
      case "ux_scenarios":
      case "ux_artifact":
        return uxAction(this,project,a);
      case "revisions_list": return this.engine.revisions(await this.engine.project(project));
      case "project_activate": return this.activateProject(project);
      case "project_select": return this.engine.selectActiveProject(project);
      case "project_disconnect": return this.engine.disconnectProject(project);
      case "project_delete": return this.engine.deleteProject({id:project,deleteFiles:a.deleteFiles===true});
      case "project_version": return this.engine.createVersion(project,{name:a.name});
      case "project_export": return this.exportProject(project);
      case "editor_schema": return editorSchema(this.engine,project,a.section||'components');
      case "stack_view":
      case "stack_sketch":
      case "stack_stage":
      case "stack_export":
        return stackAction(this, project, a);
      case "model":
        return this.model(project);
      case "drafts_list":
        return this.drafts(project);
      case "draft_save":
        return this.saveDraft(project, a.draft);
      case "draft_propose":
        return this.proposeDraft(project, a.id);
      case "object_propose":
        return this.objectPropose(project, a);
      case "validate": {
        const p = await this.engine.proposal(a.proposalId);
        if (p.project !== project) throw Error("Wrong project");
        return this.engine.validate(a.proposalId);
      }
      case "apply": {
        const p = await this.engine.proposal(a.proposalId);
        if (p.project !== project) throw Error("Wrong project");
        return this.engine.apply(a.proposalId);
      }
      case "semantic_diff":
        return this.diff(project, a);
      case "reload_project":
        return this.engine.retryReload(project, a.proposalId);
      case "snapshots_list":
        return this.snapshotList(project);
      case "snapshot_create":
        return this.snapshot(project, a.title);
      case "snapshot_verify":
        return this.snapshotVerify(project, a.id);
      case "preview_create":
        return this.preview(project, a);
      case "preview_stop":
        return this.stopPreview(project, a.id);
      case "graph":
        return this.graph(project, a);
      case "trust_propose":
        return this.objectPropose(project, {
          operations: [
            {
              section: "components",
              id: a.id,
              mode: "merge",
              value: {
                trustZone: a.trustZone,
                dataClassification: a.dataClassification,
              },
            },
          ],
        });
      case "answer":
        return this.answer(project, a.question);
      case "grounded_context":
        return this.context(project, a.question);
      case "verify_evidence":
        return this.verifyEvidence(project, a.sources);
      case "contradictions":
        return this.contradictions(project);
      case "diagnostics":
        return this.diagnostics(project);
      case "drawio_files":
        return {
          files: (
            await this.engine.files((await this.engine.project(project)).root)
          ).filter((f) => /\.(drawio|xml)$/.test(f)),
        };
      case "drawio_open":
        return {
          xml: (await this.engine.read(project, a.path)).content,
          path: a.path,
        };
      case "drawio_export":
        return {
          xml: exportDrawio((await this.model(project)).model, {
            sourceXml: a.xml,
            pageId: a.pageId,
          }),
        };
      case "drawio_import": {
        const imported = importDrawio(a.xml, {
            pageId: a.pageId,
            namespace: a.namespace || "imported",
            owner: a.owner || "Architecture Team",
          }),
          current = (await this.model(project)).model.components || {},
          operations = Object.entries(imported.components).map(
            ([id, value]) => ({
              section: "components",
              id,
              mode: current[id]
                ? a.mode === "replace"
                  ? "replace"
                  : "merge"
                : "create",
              value:
                current[id] && a.mode !== "replace"
                  ? {
                      ...Object.fromEntries(
                        Object.entries(value).filter(
                          ([key]) =>
                            ["drawio", "links"].includes(key) ||
                            (value.drawio?.declaredProperties || []).includes(
                              key,
                            ),
                        ),
                      ),
                      links: mergeDiagramLinks(current[id].links, value.links),
                    }
                  : value,
            }),
          );
        if (!operations.length)
          throw Error("No components recognized on selected page");
        const draft = await this.objectPropose(project, {
          operations,
          title: "Импорт draw.io",
        });
        return {
          ...draft,
          pages: imported.pages,
          warnings: imported.warnings,
          unmapped: imported.unmapped || [],
        };
      }
      case "drawio_save": {
        validateDrawio(a.xml);
        const file = a.path || "diagrams/architecture.drawio";
        const p = await this.engine.project(project);
        await this.engine.safe(p.root, file);
        if (!/\.(drawio|xml)$/.test(file)) throw Error("Use .drawio or .xml");
        return this.saveDraft(project, {
          title: "Сохранение схемы draw.io",
          changes: [{ path: file, content: a.xml }],
        });
      }
      default:
        throw Error("Unknown action");
    }
  }
}
