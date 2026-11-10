import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { spawn } from "node:child_process";
import { Engine } from "../engine.mjs";
import { windowsPowerShellExecutable } from "../project-sources.mjs";

async function fixture(t) {
  const base = await fs.mkdtemp(
    path.join(os.tmpdir(), "seaf-history-publication-"),
  );
  const root = path.join(base, "Проект");
  await fs.mkdir(root);
  await fs.writeFile(
    path.join(root, "root.yaml"),
    "imports:\n  - objects.yaml\n",
  );
  await fs.writeFile(
    path.join(root, "objects.yaml"),
    "components:\n  orders:\n    title: Orders\n    entity: component\n    owner: Commerce\n",
  );
  const engine = new Engine(
    path.join(base, "data/projects.json"),
    path.join(base, "data/state"),
  );
  engine.git = async () => {
    throw Error("Git is deliberately absent");
  };
  engine.runtime = async () => ({
    validate: async () => ({ ok: true, rules: 1, problems: [] }),
  });
  const project = await engine.connectProject({
    root,
    id: "private-history",
    kind: "directory",
  });
  t.after(async () => {
    const relative = path.relative(os.tmpdir(), base);
    assert.ok(
      relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    );
    assert.match(path.basename(base), /^seaf-history-publication-/);
    await fs.rm(base, { recursive: true, force: true });
  });
  return {
    base,
    root,
    engine,
    project,
    history: engine.sources.historyRoot(project),
  };
}
const isCapture = (source, history) =>
  path.dirname(String(source)) === history &&
  path.basename(String(source)).startsWith(".");
const noTemporaryDirectories = async (history) =>
  assert.deepEqual(
    (await fs.readdir(history)).filter((name) => name.startsWith(".")),
    [],
  );

test("concurrent CAS history captures reuse one verified immutable winner after an actual rename race", async (t) => {
  const { engine, project, history } = await fixture(t),
    original = fs.rename.bind(fs),
    errors = [];
  let arrivals = 0,
    release;
  const barrier = new Promise((resolve) => {
    release = resolve;
  });
  t.mock.method(fs, "rename", async (source, destination) => {
    if (!isCapture(source, history)) return original(source, destination);
    if (++arrivals === 2) release();
    await barrier;
    try {
      return await original(source, destination);
    } catch (error) {
      errors.push(error.code);
      throw error;
    }
  });
  const [first, second] = await Promise.all([
    engine.sources.capture(project, "writer A"),
    engine.sources.capture(project, "writer B"),
  ]);
  assert.equal(arrivals, 2);
  assert.equal(errors.length, 1);
  assert.ok(["EPERM", "EEXIST", "ENOTEMPTY"].includes(errors[0]));
  assert.deepEqual(first, second);
  assert.equal(first.project, project.id);
  assert.equal(
    await engine.fingerprint(path.join(history, first.id, "files")),
    first.id,
  );
  assert.deepEqual(
    (await fs.readdir(history)).filter((name) => /^[a-f0-9]{64}$/.test(name)),
    [first.id],
  );
  await noTemporaryDirectories(history);
});

test("a raced corrupt history destination is never overwritten or accepted", async (t) => {
  for (const corruption of ["id", "project", "fingerprint", "files"])
    await t.test(corruption, async (child) => {
      const { engine, project, history } = await fixture(child),
        original = fs.rename.bind(fs);
      let destination, beforeMetadata, beforeBytes;
      child.mock.method(fs, "rename", async (source, target) => {
        if (!isCapture(source, history)) return original(source, target);
        destination = target;
        await fs.mkdir(path.join(target, "files"), { recursive: true });
        await engine.copyArtifacts(project.root, path.join(target, "files"));
        const metadata = JSON.parse(
          await fs.readFile(path.join(source, "revision.json"), "utf8"),
        );
        if (corruption === "files")
          await fs.writeFile(
            path.join(target, "files/objects.yaml"),
            "components: {}\n",
          );
        else
          metadata[corruption] =
            corruption === "project" ? "other-project" : "0".repeat(64);
        beforeMetadata = JSON.stringify(metadata);
        await fs.writeFile(path.join(target, "revision.json"), beforeMetadata);
        beforeBytes = await fs.readFile(
          path.join(target, "files/objects.yaml"),
          "utf8",
        );
        return original(source, target);
      });
      await assert.rejects(
        engine.sources.capture(project, "losing writer"),
        /integrity/,
      );
      assert.equal(
        await fs.readFile(path.join(destination, "revision.json"), "utf8"),
        beforeMetadata,
      );
      assert.equal(
        await fs.readFile(path.join(destination, "files/objects.yaml"), "utf8"),
        beforeBytes,
      );
      await noTemporaryDirectories(history);
    });
});

async function holdWindowsFile(file) {
  const script =
    "$f=[System.IO.File]::Open($env:SEAF_HISTORY_LOCK_FILE,[System.IO.FileMode]::Open,[System.IO.FileAccess]::Read,[System.IO.FileShare]::Read); [Console]::WriteLine('SEAF_HISTORY_LOCK_READY'); [Console]::Out.Flush(); [Console]::ReadLine() | Out-Null; $f.Dispose()";
  const child = spawn(
    windowsPowerShellExecutable(),
    [
      "-NoProfile",
      "-EncodedCommand",
      Buffer.from(script, "utf16le").toString("base64"),
    ],
    {
      env: { ...process.env, SEAF_HISTORY_LOCK_FILE: file },
      windowsHide: true,
      stdio: ["pipe", "pipe", "pipe"],
    },
  );
  let output = "";
  const exited = new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", resolve);
  });
  try {
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(Error("Windows lock helper timed out: " + output)),
        10000,
      );
      child.stdout.on("data", (chunk) => {
        output += chunk;
        if (output.includes("SEAF_HISTORY_LOCK_READY")) {
          clearTimeout(timer);
          resolve();
        }
      });
      child.stderr.on("data", (chunk) => {
        output += chunk;
      });
      child.once("error", (error) => {
        clearTimeout(timer);
        reject(error);
      });
    });
  } catch (error) {
    child.kill();
    await exited.catch(() => {});
    throw error;
  }
  return {
    async release() {
      if (child.exitCode === null) child.stdin.end("\n");
      assert.equal(await exited, 0);
    },
  };
}

test(
  "a real Windows file lock is retried and its released immutable copy is published",
  { skip: process.platform !== "win32" },
  async (t) => {
    const { engine, project, history } = await fixture(t),
      copy = engine.copyArtifacts.bind(engine),
      rename = fs.rename.bind(fs),
      errors = [];
    let holder, timer;
    engine.copyArtifacts = async (source, destination) => {
      await copy(source, destination);
      if (path.dirname(path.dirname(destination)) === history) {
        holder = await holdWindowsFile(path.join(destination, "objects.yaml"));
        timer = setTimeout(() => holder.release().catch(() => {}), 200);
      }
    };
    t.mock.method(fs, "rename", async (source, destination) => {
      try {
        return await rename(source, destination);
      } catch (error) {
        if (isCapture(source, history)) errors.push(error.code);
        throw error;
      }
    });
    try {
      const started = Date.now(),
        revision = await engine.sources.capture(
          project,
          "temporary scanner lock",
        );
      assert.ok(errors.includes("EPERM"));
      assert.equal(
        await engine.fingerprint(path.join(history, revision.id, "files")),
        revision.id,
      );
      assert.ok(Date.now() - started < 5000);
      await noTemporaryDirectories(history);
    } finally {
      clearTimeout(timer);
      if (holder) await holder.release();
    }
  },
);

test("permanent history rename denial is bounded and rolls back all project writes and private temp files", async (t) => {
  const { engine, project, root, history } = await fixture(t),
    baseline = await engine.sources.capture(project, "baseline"),
    before = await fs.readFile(path.join(root, "objects.yaml"), "utf8");
  const proposal = await engine.propose(
    project.id,
    [
      {
        path: "objects.yaml",
        content: before.replace("Commerce", "Logistics"),
      },
    ],
    "denied history",
  );
  assert.equal((await engine.validate(proposal.proposalId)).ok, true);
  const original = fs.rename.bind(fs);
  let attempts = 0;
  t.mock.method(fs, "rename", async (source, destination) => {
    if (!isCapture(source, history)) return original(source, destination);
    attempts++;
    const error = Error("Injected persistent Windows permission denial");
    error.code = "EPERM";
    throw error;
  });
  const started = Date.now();
  await assert.rejects(engine.apply(proposal.proposalId), { code: "EPERM" });
  const elapsed = Date.now() - started;
  assert.ok(attempts > 1);
  assert.ok(
    elapsed >= 900 && elapsed < 5000,
    "retry must be bounded around one second",
  );
  assert.equal(
    await fs.readFile(path.join(root, "objects.yaml"), "utf8"),
    before,
  );
  assert.equal((await engine.proposal(proposal.proposalId)).status, "failed");
  assert.deepEqual(
    (await fs.readdir(history)).filter((name) => /^[a-f0-9]{64}$/.test(name)),
    [baseline.id],
  );
  await noTemporaryDirectories(history);
});
