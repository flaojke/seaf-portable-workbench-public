import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Engine } from "../engine.mjs";
import { validateRemote, remoteProvider } from "../project-sources.mjs";

async function fixture(t) {
  const testRoot =
    process.env.SEAF_TEST_ROOT ||
    fileURLToPath(new URL("../state/test-project-sources/", import.meta.url));
  await fs.mkdir(testRoot, { recursive: true });
  const base = await fs.mkdtemp(path.join(testRoot, "fixture-"));
  const root = path.join(base, "Проект с пробелами");
  await fs.mkdir(root);
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "imports:\n  - objects.yaml\n",
  );
  await fs.writeFile(
    path.join(root, "objects.yaml"),
    "components:\n  acme.orders:\n    title: Orders\n    owner: Commerce\n    entity: component\n",
  );
  const engine = new Engine(
    path.join(base, "data", "projects.json"),
    path.join(base, "data", "state"),
  );
  engine.runtime = async () => ({
    validate: async ({ workspace, manifest }) => {
      assert.ok((await fs.stat(workspace)).isDirectory());
      assert.equal(manifest, "workspace/root.yaml");
      return { ok: true, rules: 1, problems: [] };
    },
  });
  t.after(async () => {
    const relative = path.relative(testRoot, base);
    assert.ok(
      relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    );
    await fs.rm(base, { recursive: true, force: true });
  });
  return { base, root, engine };
}
const change = (owner) => [
  {
    path: "objects.yaml",
    content: `components:\n  acme.orders:\n    title: Orders\n    owner: ${owner}\n    entity: component\n`,
  },
];

test("plain Windows-style directory works without Git, captures baseline and preserves source bytes", async (t) => {
  const { engine, root } = await fixture(t);
  engine.git = async () => {
    throw Error("Git is not installed");
  };
  const inspected = await engine.inspectProject({ root });
  assert.equal(inspected.kind, "directory");
  assert.equal(inspected.manifest, "root.yaml");
  assert.equal(inspected.provider, "local");
  const p = await engine.connectProject({ root, id: "plain" });
  assert.equal(engine.kind(p), "directory");
  assert.equal(
    (await engine.model(p.id)).model.components["acme.orders"].owner,
    "Commerce",
  );
  const before = await engine.revision(p);
  const revisions = await engine.revisions(p);
  assert.equal(revisions.length, 1);
  assert.equal(revisions[0].id, before.id);
  await assert.rejects(fs.stat(path.join(root, ".git")), { code: "ENOENT" });
  const proposal = await engine.propose(
    p.id,
    change("Logistics"),
    "Transfer ownership",
  );
  assert.equal(proposal.baseCommit, null);
  assert.deepEqual(proposal.baseRevision, before);
  assert.match(proposal.diff, /-    owner: Commerce\n\+    owner: Logistics/);
  assert.equal((await engine.validate(proposal.proposalId)).ok, true);
  const result = await engine.apply(proposal.proposalId);
  assert.equal(result.commit, null);
  assert.equal(result.revision.kind, "directory");
  assert.notEqual(result.revision.id, before.id);
  assert.equal(result.status, "applied");
  assert.equal((await engine.revisions(p)).length, 2);
  assert.deepEqual(await engine.apply(proposal.proposalId), result);
  const restored = path.join(engine.state, "restore");
  assert.equal(
    (await engine.loadRevision(p, before.id, restored)).revision.id,
    before.id,
  );
  assert.match(
    await fs.readFile(path.join(restored, "objects.yaml"), "utf8"),
    /owner: Commerce/,
  );
  const current = path.join(engine.state, "head");
  await engine.loadRevision(p, "HEAD", current);
  assert.match(
    await fs.readFile(path.join(current, "objects.yaml"), "utf8"),
    /owner: Logistics/,
  );
});

test("local save and reload retry never repeat a saved revision", async (t) => {
  const { engine, root } = await fixture(t);
  const p = await engine.connectProject({ root, id: "plain" });
  let reloads = 0;
  engine.reload = async () => {
    if (++reloads === 1) throw Error("Portal stopped");
    return { status: "updated", problems: [] };
  };
  const proposal = await engine.propose(p.id, change("Logistics"), "Change");
  await engine.validate(proposal.proposalId);
  const first = await engine.apply(proposal.proposalId);
  assert.equal(first.status, "saved_reload_failed");
  const retried = await engine.retryReload(p.id, proposal.proposalId);
  assert.equal(retried.status, "applied");
  assert.equal(retried.revision.id, first.revision.id);
  assert.equal((await engine.revisions(p)).length, 2);
  assert.equal(reloads, 2);
});

test("local proposals reject source and imported-workspace edits without overwriting", async (t) => {
  const { engine, root, base } = await fixture(t);
  const p = await engine.connectProject({ root, id: "plain", workspace: base });
  await fs.writeFile(path.join(base, "other.yaml"), "components: {}\n");
  const proposal = await engine.propose(p.id, change("Logistics"), "Change");
  await fs.writeFile(
    path.join(base, "other.yaml"),
    "components: {external: {title: External}}\n",
  );
  await assert.rejects(engine.validate(proposal.proposalId), /Stale proposal/);
  assert.match(
    await fs.readFile(path.join(root, "objects.yaml"), "utf8"),
    /owner: Commerce/,
  );
  const proposal2 = await engine.propose(p.id, change("Logistics"), "Change");
  await fs.writeFile(
    path.join(root, "objects.yaml"),
    change("External edit")[0].content,
  );
  await assert.rejects(engine.apply(proposal2.proposalId), /Stale proposal/);
  assert.match(
    await fs.readFile(path.join(root, "objects.yaml"), "utf8"),
    /owner: External edit/,
  );
});

test("partial directory write and history failures roll back all proposed files", async (t) => {
  const { engine, root } = await fixture(t);
  const p = await engine.connectProject({ root, id: "plain" });
  const proposal = await engine.propose(
    p.id,
    [...change("Logistics"), { path: "new.md", content: "New document" }],
    "Batch",
  );
  await engine.validate(proposal.proposalId);
  const original = engine.writeChanges.bind(engine);
  engine.writeChanges = async (destination, changes) => {
    if (destination === p.root) {
      await original(destination, changes.slice(0, 1));
      throw Error("Injected disk failure");
    }
    return original(destination, changes);
  };
  await assert.rejects(
    engine.apply(proposal.proposalId),
    /Injected disk failure/,
  );
  assert.match(
    await fs.readFile(path.join(root, "objects.yaml"), "utf8"),
    /owner: Commerce/,
  );
  await assert.rejects(fs.stat(path.join(root, "new.md")), { code: "ENOENT" });
  assert.equal((await engine.proposal(proposal.proposalId)).status, "failed");
  engine.writeChanges = original;
  const next = await engine.propose(
    p.id,
    change("Logistics"),
    "History failure",
  );
  await engine.validate(next.proposalId);
  const capture = engine.sources.capture.bind(engine.sources);
  engine.sources.capture = async (project, message, parent) => {
    if (parent) throw Error("History unavailable");
    return capture(project, message, parent);
  };
  await assert.rejects(engine.apply(next.proposalId), /History unavailable/);
  assert.match(
    await fs.readFile(path.join(root, "objects.yaml"), "utf8"),
    /owner: Commerce/,
  );
});

test("read-only permissions, invalid YAML, missing manifests and tampered local history fail explicitly", async (t) => {
  const { engine, root, base } = await fixture(t);
  const p = await engine.connectProject({
    root,
    id: "reference",
    writable: false,
  });
  await assert.rejects(
    engine.propose(p.id, change("Logistics"), "Change"),
    /Read-only/,
  );
  await assert.rejects(
    engine.updateProject(p.id, { writable: true }),
    /cannot be elevated/,
  );
  await assert.rejects(
    engine.deleteProject({ id: p.id, deleteFiles: true }),
    /Read-only/,
  );
  await assert.rejects(engine.createVersion(p.id, { name: "v1" }), /Read-only/);
  const empty = path.join(base, "empty");
  await fs.mkdir(empty);
  await assert.rejects(
    engine.connectProject({ root: empty, id: "empty" }),
    /root YAML manifest/,
  );
  await engine.revisions(p);
  const revision = await engine.revision(p);
  const historyFile = path.join(
    engine.sources.historyRoot(p),
    revision.id,
    "files",
    "objects.yaml",
  );
  await fs.writeFile(historyFile, "components: {}\n");
  await fs.writeFile(
    path.join(root, "objects.yaml"),
    change("New current")[0].content,
  );
  await assert.rejects(
    engine.loadRevision(p, revision.id, path.join(base, "restore")),
    /integrity/,
  );
  await engine.disconnectProject(p.id);
  const writable = await engine.connectProject({ root, id: "plain" });
  const proposal = await engine.propose(
    writable.id,
    [{ path: "objects.yaml", content: "components: [\n" }],
    "Invalid",
  );
  await assert.rejects(engine.validate(proposal.proposalId), /Invalid YAML/);
});

test("Git provider keeps its commit lifecycle and detects parent repositories accurately", async (t) => {
  const { engine, root } = await fixture(t);
  const repo = { root };
  await engine.git(repo, ["init", "-b", "main"]);
  await engine.git(repo, ["add", "."]);
  await engine.git(repo, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "Baseline",
  ]);
  await engine.git(repo, [
    "remote",
    "add",
    "origin",
    "https://gitverse.ru/team/private.git",
  ]);
  const inspected = await engine.inspectProject({ root });
  assert.equal(inspected.kind, "git");
  assert.equal(inspected.provider, "gitverse");
  const p = await engine.connectProject({ root, id: "git-project" });
  const before = await engine.revision(p);
  const proposal = await engine.propose(p.id, change("Logistics"), "Change");
  assert.equal(proposal.baseCommit, before.id);
  await engine.validate(proposal.proposalId);
  const result = await engine.apply(proposal.proposalId);
  assert.equal(result.commit, result.revision.id);
  assert.equal(await engine.git(p, ["status", "--porcelain"]), "");
  assert.equal(await engine.git(p, ["rev-list", "--count", "HEAD"]), "2");
  const nested = path.join(root, "nested");
  await fs.mkdir(nested);
  await fs.writeFile(path.join(nested, "root.yaml"), "components: {}\n");
  assert.equal(
    (await engine.inspectProject({ root: nested })).kind,
    "directory",
  );
  await assert.rejects(
    engine.inspectProject({ root: nested, kind: "git" }),
    /its own Git/,
  );
  assert.notEqual(result.commit, before.id);
});

test("project lifecycle preserves sources, assets, active selection, names and recoverable trash", async (t) => {
  const { engine, root, base } = await fixture(t);
  const p = await engine.connectProject({ root, id: "plain" });
  await fs.writeFile(
    path.join(root, "diagram.png"),
    Buffer.from([137, 80, 78, 71]),
  );
  await fs.writeFile(path.join(root, ".env"), "SECRET=never-copy\n");
  await engine.selectActiveProject(p.id);
  assert.equal(await engine.activeProject(), p.id);
  const version = await engine.createVersion(p.id, { name: "Первая версия" });
  assert.equal(version.name, "Первая версия");
  assert.equal(
    (await engine.revisions(p))[0].versions[0].name,
    "Первая версия",
  );
  await assert.rejects(
    engine.createVersion(p.id, { name: "Первая версия" }),
    /already exists/,
  );
  const copied = await engine.cloneLocalProject({
    id: p.id,
    destination: path.join(base, "Копия проекта"),
    title: "Copy",
  });
  assert.equal(engine.kind(copied.project), "directory");
  assert.equal(copied.project.title, "Copy");
  assert.deepEqual(
    await fs.readFile(path.join(copied.project.root, "diagram.png")),
    Buffer.from([137, 80, 78, 71]),
  );
  await assert.rejects(fs.stat(path.join(copied.project.root, ".env")), {
    code: "ENOENT",
  });
  await assert.rejects(fs.stat(path.join(copied.project.root, ".git")), {
    code: "ENOENT",
  });
  assert.deepEqual(copied.skipped, [".env"]);
  await engine.disconnectProject(p.id);
  assert.equal(await engine.activeProject(), null);
  assert.ok((await fs.stat(root)).isDirectory());
  const removed = await engine.deleteProject({
    id: copied.project.id,
    deleteFiles: true,
  });
  assert.equal(removed.movedToTrash, true);
  assert.equal(removed.filesDeleted, false);
  assert.ok(
    (await fs.stat(path.join(removed.trashedTo, "root.yaml"))).isFile(),
  );
  await assert.rejects(fs.stat(copied.project.root), { code: "ENOENT" });
  assert.equal((await engine.projects()).length, 0);
});

test("Git version creates a branch without checkout/push; local clone can explicitly create Git", async (t) => {
  const { engine, root, base } = await fixture(t);
  const source = await engine.connectProject({ root, id: "plain" });
  const clone = await engine.cloneLocalProject({
    id: source.id,
    destination: path.join(base, "git-copy"),
    kind: "git",
  });
  const p = clone.project,
    head = await engine.git(p, ["rev-parse", "HEAD"]);
  const version = await engine.createVersion(p.id, { name: "Новая версия" });
  assert.equal(version.switched, false);
  assert.equal(version.branch, "codex/Новая-версия");
  assert.equal(await engine.git(p, ["branch", "--show-current"]), "main");
  assert.equal(await engine.git(p, ["rev-parse", "HEAD"]), head);
  assert.equal(await engine.git(p, ["rev-parse", version.branch]), head);
  await assert.rejects(engine.pushProject(source.id), /writable Git/);
  await assert.rejects(
    engine.pushProject(p.id, { remote: "--all" }),
    /Invalid/,
  );
  const removed = await engine.deleteProject({ id: p.id, deleteFiles: true });
  assert.ok(
    (await fs.stat(path.join(removed.trashedTo, ".git/config"))).isFile(),
  );
  assert.ok((await fs.stat(root)).isDirectory());
});

test("registry changes are atomic, duplicate connections fail and selected project cannot delete SEAF data", async (t) => {
  const { engine, root, base } = await fixture(t);
  await engine.connectProject({ root, id: "plain" });
  await assert.rejects(
    engine.connectProject({ root, id: "duplicate" }),
    /already registered/,
  );
  await assert.rejects(
    engine.updateProject("plain", { root: base }),
    /Unsupported/,
  );
  await engine.updateProject("plain", { portal: "http://127.0.0.1:4567" });
  assert.equal((await engine.project("plain")).portal, "http://127.0.0.1:4567");
  await assert.rejects(
    engine.updateProject("plain", { portal: "http://secret:token@localhost/" }),
    /without credentials/,
  );
  await engine.updateProject("plain", {
    validation: {
      runtime: "native",
      workspace: root,
      manifest: "workspace/root.yaml",
      native: {
        node: process.execPath,
        coreRoot: root,
        offlineUrl: "http://127.0.0.1:8092",
      },
    },
  });
  assert.equal(
    (await engine.project("plain")).validation.native.node,
    process.execPath,
  );
  await assert.rejects(
    engine.updateProject("plain", {
      validation: {
        runtime: "native",
        workspace: root,
        manifest: "workspace/root.yaml",
        native: { command: "unexpected command" },
      },
    }),
    /Unsupported native/,
  );
  await fs.writeFile(path.join(base, "root.yaml"), "components: {}\n");
  const ancestor = await engine.connectProject({ root: base, id: "ancestor" });
  await assert.rejects(
    engine.deleteProject({ id: ancestor.id, deleteFiles: true }),
    /containing SEAF settings/,
  );
  assert.ok((await fs.stat(root)).isDirectory());
  const moved = path.join(base, "Moved manually");
  assert.ok(!path.relative(base, moved).startsWith(".."));
  await fs.rename(root, moved);
  await engine.disconnectProject("plain");
  assert.ok((await fs.stat(moved)).isDirectory());
});

test("Git URL handling rejects embedded secrets and command-like values, and identifies providers", () => {
  for (const value of [
    "https://github.com/team/project.git",
    "ssh://git@gitlab.example/team/project.git",
    "git@gitverse.ru:team/project.git",
  ])
    assert.equal(validateRemote(value), value);
  for (const value of [
    "-c core.sshCommand=bad",
    "file:///C:/private",
    "https://token@github.com/team/project",
    "https://github.com/team/project?token=secret",
    "ssh://git:password@host/team/repo",
    "https://host/",
    "git@host:-option",
    "https://host/team/repo\nmalicious",
  ])
    assert.throws(() => validateRemote(value));
  assert.equal(remoteProvider("git@github.com:team/repo").provider, "github");
  assert.equal(
    remoteProvider("https://gitlab.company.example/team/repo").provider,
    "gitlab",
  );
  assert.equal(
    remoteProvider("https://gitverse.ru/team/repo").provider,
    "gitverse",
  );
});

test("clone command uses argument arrays, real Git creates private checkout and never pushes", async (t) => {
  const { engine, root, base } = await fixture(t);
  const repo = { root };
  await engine.git(repo, ["init", "-b", "main"]);
  await engine.git(repo, ["add", "."]);
  await engine.git(repo, [
    "-c",
    "user.name=Test",
    "-c",
    "user.email=test@localhost",
    "commit",
    "-m",
    "Fixture",
  ]);
  const commands = [],
    run = engine.gitExec.bind(engine);
  engine.gitExec = async (args, options) => {
    commands.push(args);
    if (args[0] === "clone") {
      assert.deepEqual(args.slice(0, 4), [
        "clone",
        "--no-hardlinks",
        "--",
        "https://gitlab.example/team/repo.git",
      ]);
      return run(
        [...args.slice(0, 3), root.replaceAll("\\", "/"), args.at(-1)],
        options,
      );
    }
    return run(args, options);
  };
  const result = await engine.cloneProject({
    url: "https://gitlab.example/team/repo.git",
    destination: path.join(base, "cloned checkout"),
    id: "remote-copy",
  });
  assert.equal(result.cloned, true);
  assert.equal(result.pushed, false);
  assert.equal(engine.kind(result.project), "git");
  assert.equal(
    (await engine.model(result.project.id)).model.components["acme.orders"]
      .title,
    "Orders",
  );
  assert.equal(
    commands.some((args) => args.includes("push")),
    false,
  );
  await assert.rejects(
    engine.cloneProject({
      url: "https://gitlab.example/team/repo.git",
      destination: result.project.root,
    }),
    /new or empty/,
  );
});

test("native diffs apply byte-for-byte, including CRLF, final newlines and empty files", async (t) => {
  const { engine, root, base } = await fixture(t),
    p = { root };
  await engine.git(p, ["init", "-b", "main"]);
  const cases = [
    ["line1\nold\nline3\n", "line1\nnew\nline3\n"],
    ["line1\r\nold\r\nline3\r\n", "line1\r\nnew\r\nline3\r\n"],
    ["same", "same\n"],
    ["same\n", "same"],
    [null, ""],
    ["", null],
    [null, "created"],
    ["removed", null],
    ["a\nb\nc\nd\ne\nf\ng\nh\ni\nj\n", "a\nB\nc\nd\ne\nf\ng\nH\ni\nj\n"],
  ];
  for (const [before, after] of cases) {
    const file = path.join(root, "raw.md");
    if (before === null)
      await fs.unlink(file).catch((error) => {
        if (error.code !== "ENOENT") throw error;
      });
    else await fs.writeFile(file, before);
    const diff = await engine.diffChanges(root, [
      { path: "raw.md", content: after },
    ]);
    assert.ok(diff.trim());
    const patch = path.join(base, "change.patch");
    await fs.writeFile(patch, diff);
    await engine.git(p, [
      "-c",
      "core.autocrlf=false",
      "apply",
      "--check",
      patch,
    ]);
    await engine.git(p, ["-c", "core.autocrlf=false", "apply", patch]);
    if (after === null) await assert.rejects(fs.stat(file), { code: "ENOENT" });
    else assert.equal(await fs.readFile(file, "utf8"), after);
  }
});

test("registered read-only sources cannot be made writable through parent, child, clone or copy connections", async (t) => {
  const { engine, root, base } = await fixture(t);
  const reference = path.join(root, "reference"),
    child = path.join(reference, "child");
  await fs.mkdir(child, { recursive: true });
  for (const directory of [reference, child])
    await fs.writeFile(path.join(directory, "root.yaml"), "{}\n");
  const readonly = await engine.connectProject({
    root: reference,
    id: "reference",
    kind: "directory",
    writable: false,
  });
  const before = await engine.fingerprint(reference);
  for (const candidate of [root, reference, child])
    await assert.rejects(
      engine.connectProject({
        root: candidate,
        kind: "directory",
        writable: true,
      }),
      /read-only|already registered/,
    );
  await assert.rejects(
    engine.updateProject(readonly.id, { writable: true }),
    /Read-only/,
  );
  let cloneCalls = 0;
  engine.gitExec = async () => {
    cloneCalls++;
    throw Error("Clone must not run");
  };
  await assert.rejects(
    engine.cloneProject({
      url: "https://gitverse.ru/team/architecture.git",
      destination: path.join(reference, "clone"),
    }),
    /read-only/,
  );
  await assert.rejects(
    engine.cloneLocalProject({
      id: readonly.id,
      destination: path.join(reference, "copy"),
    }),
    /read-only/,
  );
  assert.equal(cloneCalls, 0);
  const independent = path.join(base, "reference-independent");
  const copy = await engine.cloneLocalProject({
    id: readonly.id,
    destination: independent,
  });
  assert.equal(copy.project.writable, true);
  assert.equal(
    await fs.readFile(path.join(independent, "root.yaml"), "utf8"),
    "{}\n",
  );
  assert.equal(await engine.fingerprint(reference), before);
});

test("a legacy writable parent cannot alter or delete a registered read-only subtree", async (t) => {
  const { engine, root } = await fixture(t);
  const parent = await engine.connectProject({
    root,
    id: "parent",
    kind: "directory",
  });
  const reference = path.join(root, "reference");
  await fs.mkdir(reference);
  await fs.writeFile(path.join(reference, "root.yaml"), "{}\n");
  await fs.writeFile(
    path.join(reference, "guarded.md"),
    "Original protected source\n",
  );
  const readonly = await engine.connectProject({
    root: reference,
    id: "reference",
    kind: "directory",
    writable: false,
  });
  const before = await engine.fingerprint(reference);
  await assert.rejects(
    engine.propose(parent.id, [
      { path: "reference/guarded.md", content: "Overwrite\n" },
    ]),
    /read-only/,
  );
  await assert.rejects(
    engine.deleteProject({ id: parent.id, deleteFiles: true }),
    /read-only/,
  );
  const allowed = await engine.propose(
    parent.id,
    change("Local team"),
    "Change an independent parent artifact",
  );
  assert.equal((await engine.validate(allowed.proposalId)).ok, true);
  await engine.apply(allowed.proposalId);
  assert.equal(await engine.fingerprint(reference), before);
  assert.equal((await engine.project(readonly.id)).writable, false);
});

test("read-only protection is checked again before applying an already validated proposal", async (t) => {
  const { engine, root } = await fixture(t);
  const parent = await engine.connectProject({
    root,
    id: "parent",
    kind: "directory",
  });
  const reference = path.join(root, "reference");
  await fs.mkdir(reference);
  await fs.writeFile(path.join(reference, "root.yaml"), "{}\n");
  await fs.writeFile(
    path.join(reference, "guarded.md"),
    "Original protected source\n",
  );
  const proposal = await engine.propose(parent.id, [
    { path: "reference/guarded.md", content: "Overwrite\n" },
  ]);
  assert.equal((await engine.validate(proposal.proposalId)).ok, true);
  await engine.connectProject({
    root: reference,
    id: "reference",
    kind: "directory",
    writable: false,
  });
  await assert.rejects(engine.apply(proposal.proposalId), /read-only/);
  assert.equal(
    await fs.readFile(path.join(reference, "guarded.md"), "utf8"),
    "Original protected source\n",
  );
});

test("an unavailable external read-only drive does not block an independent local directory", async (t) => {
  const { engine, root } = await fixture(t);
  let unavailable;
  if (process.platform === "win32") {
    for (const drive of ["Z", "Y", "X", "W", "V"]) {
      const candidate = drive + ":\\";
      try {
        await fs.realpath(candidate);
      } catch (error) {
        if (error.code === "ENOENT") {
          unavailable = path.join(candidate, "seaf-offline-source");
          break;
        }
        throw error;
      }
    }
  } else
    unavailable = path.join(
      path.parse(root).root,
      "seaf-missing-external-source",
    );
  assert.ok(unavailable, "Fixture requires one unavailable external location");
  await fs.mkdir(path.dirname(engine.configFile), { recursive: true });
  await fs.writeFile(
    engine.configFile,
    JSON.stringify({
      projects: [
        {
          id: "offline-reference",
          root: unavailable,
          source: { kind: "directory" },
          writable: false,
        },
      ],
    }),
  );
  const project = await engine.connectProject({
    root,
    id: "available",
    kind: "directory",
  });
  assert.equal(project.writable, true);
  assert.equal(
    (await engine.model(project.id)).model.components["acme.orders"].title,
    "Orders",
  );
});

test("portable runtime and seed directories stay immutable while data/projects remains writable", async (t) => {
  const { engine, root, base } = await fixture(t);
  const bundle = path.join(base, "Portable bundle"),
    previous = process.env.SEAF_PORTABLE_ROOT;
  process.env.SEAF_PORTABLE_ROOT = bundle;
  t.after(() => {
    if (previous === undefined) delete process.env.SEAF_PORTABLE_ROOT;
    else process.env.SEAF_PORTABLE_ROOT = previous;
  });
  const immutable = [
    "app/core",
    "runtime",
    "portable",
    "licenses",
    "openspec",
    "examples",
  ];
  for (const name of immutable) {
    const directory = path.join(bundle, name);
    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(path.join(directory, "root.yaml"), "{}\n");
    await assert.rejects(
      engine.connectProject({
        root: directory,
        kind: "directory",
        writable: true,
      }),
      /immutable/,
    );
  }
  const source = await engine.connectProject({
    root,
    id: "source",
    kind: "directory",
  });
  await assert.rejects(
    engine.cloneLocalProject({
      id: source.id,
      destination: path.join(bundle, "runtime/new-copy"),
    }),
    /immutable/,
  );
  await assert.rejects(
    engine.cloneProject({
      url: "https://gitverse.ru/team/project.git",
      destination: path.join(bundle, "app/new-clone"),
    }),
    /immutable/,
  );
  const projectRoot = path.join(bundle, "data/projects/user");
  await fs.mkdir(projectRoot, { recursive: true });
  await fs.writeFile(path.join(projectRoot, "root.yaml"), "{}\n");
  const project = await engine.connectProject({
    root: projectRoot,
    id: "user",
    kind: "directory",
  });
  assert.equal(project.writable, true);
  const metadata = await engine.sources.config();
  metadata.projects.push({
    id: "legacy-core",
    root: path.join(bundle, "app/core"),
    manifest: "root.yaml",
    source: { kind: "directory" },
    writable: true,
  });
  await fs.writeFile(engine.configFile, JSON.stringify(metadata));
  await assert.rejects(
    engine.deleteProject({ id: "legacy-core", deleteFiles: true }),
    /immutable/,
  );
  await assert.rejects(
    engine.propose("legacy-core", [
      { path: "root.yaml", content: "components: {}\n" },
    ]),
    /immutable/,
  );
  assert.equal(
    await fs.readFile(path.join(bundle, "app/core/root.yaml"), "utf8"),
    "{}\n",
  );
});
