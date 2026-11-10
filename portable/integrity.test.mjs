import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import assert from "node:assert/strict";
import test from "node:test";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { verifyBundle } from "./verify.mjs";
import { filesUnder, writeZip } from "./zip.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)),
  base = path.join(here, "state/integrity-unit");
const sha = (content) =>
  crypto.createHash("sha256").update(content).digest("hex");
const { unzipSync, zipSync } = createRequire(
  new URL("../seaf-mcp/package.json", import.meta.url),
)("fflate");
const exec = promisify(execFile);
await fs.mkdir(base, { recursive: true });

async function fixture(t) {
  const parent = await fs.mkdtemp(path.join(base, "case-")),
    root = path.join(parent, "bundle");
  t.after(async () => {
    const relative = path.relative(base, path.resolve(parent));
    assert.ok(
      relative && !relative.startsWith("..") && !path.isAbsolute(relative),
    );
    await fs.rm(parent, { recursive: true, force: true });
  });
  for (const [name, content] of [
    ["app/core/entry.mjs", 'export const title="Система";\n'],
    ["runtime/node/node.exe", "fixture bytes, not an executable"],
  ]) {
    await fs.mkdir(path.dirname(path.join(root, name)), { recursive: true });
    await fs.writeFile(path.join(root, name), content);
  }
  const rows = await Promise.all(
    (await filesUnder(root)).map(async (name) => ({
      path: name,
      sha256: sha(await fs.readFile(path.join(root, name))),
    })),
  );
  const manifest = {
    format: "seaf-portable-v1",
    platform: "win32-x64",
    inputs: {},
    files: rows,
  };
  const save = async () => {
    delete manifest.id;
    manifest.id = sha(JSON.stringify(manifest));
    await fs.writeFile(
      path.join(root, "manifest.json"),
      JSON.stringify(manifest),
    );
  };
  await save();
  return { parent, root, manifest, save };
}

test("immutable hashes pass while mutable data remains outside the release manifest", async (t) => {
  const f = await fixture(t);
  await fs.mkdir(path.join(f.root, "data/history"), { recursive: true });
  await fs.writeFile(path.join(f.root, "data/history/user.txt"), "mutable");
  assert.equal((await verifyBundle(f.root)).ok, true);
  await fs.writeFile(
    path.join(f.root, "app/core/entry.mjs"),
    "changed content",
  );
  await assert.rejects(verifyBundle(f.root), /SHA-256 mismatch/);
});

test("unexpected immutable modules fail full verification and scope stays explicit", async (t) => {
  const f = await fixture(t);
  await fs.writeFile(
    path.join(f.root, "app/core/unlisted.mjs"),
    "export default 1;",
  );
  assert.equal(
    (await verifyBundle(f.root, { scope: ["runtime/node/node.exe"] })).ok,
    true,
  );
  await assert.rejects(verifyBundle(f.root), /Unexpected immutable file/);
});

test("manifest identity and unsafe paths are rejected before file access", async (t) => {
  const f = await fixture(t);
  f.manifest.id = "0".repeat(64);
  await fs.writeFile(
    path.join(f.root, "manifest.json"),
    JSON.stringify(f.manifest),
  );
  await assert.rejects(verifyBundle(f.root), /identity mismatch/);
  f.manifest.files.push({ path: "../outside.txt", sha256: "0".repeat(64) });
  await f.save();
  await assert.rejects(verifyBundle(f.root), /Invalid portable manifest entry/);
});

test("ZIP is deterministic and independent decoder preserves Unicode names and binary bytes", async (t) => {
  const f = await fixture(t),
    name = "app/core/система.bin",
    content = Buffer.from([0, 1, 2, 127, 128, 255]);
  await fs.writeFile(path.join(f.root, name), content);
  const first = path.join(f.parent, "first.zip"),
    second = path.join(f.parent, "second.zip");
  await writeZip(f.root, first, { prefix: "SEAF" });
  await writeZip(f.root, second, { prefix: "SEAF" });
  const a = await fs.readFile(first),
    b = await fs.readFile(second);
  assert.deepEqual(a, b);
  const decoded = unzipSync(a);
  assert.deepEqual(Buffer.from(decoded["SEAF/" + name]), content);
  assert.equal(a.readUInt32LE(a.length - 22), 0x06054b50);
});

test("failed ZIP does not replace an existing archive or leave a partial final artifact", async (t) => {
  const f = await fixture(t),
    destination = path.join(f.parent, "release.zip");
  await fs.writeFile(destination, "previous complete archive");
  await assert.rejects(
    writeZip(f.root, destination, { files: ["../outside.txt"] }),
    /Invalid ZIP artifact path/,
  );
  assert.equal(
    await fs.readFile(destination, "utf8"),
    "previous complete archive",
  );
  assert.equal(
    (await fs.readdir(f.parent)).some((name) => name.includes(".partial-")),
    false,
  );
  await assert.rejects(
    writeZip(f.root, path.join(f.root, "self.zip")),
    /outside the source/,
  );
  await assert.rejects(
    writeZip(f.root, destination, { prefix: "../unsafe" }),
    /Invalid ZIP root prefix/,
  );
});

test(
  "Windows .NET extraction preserves Unicode bytes and rejects nonempty destinations",
  { skip: process.platform !== "win32" },
  async (t) => {
    const f = await fixture(t),
      archive = path.join(f.parent, "release.zip"),
      destination = path.join(f.parent, "Распаковка тест");
    await writeZip(f.root, archive, { prefix: "SEAF" });
    const ps = path.join(
      process.env.SystemRoot || process.env.WINDIR,
      "System32/WindowsPowerShell/v1.0/powershell.exe",
    );
    const args = [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-File",
      path.join(here, "extract.ps1"),
      "-Archive",
      archive,
      "-Destination",
      destination,
    ];
    await exec(ps, args, { windowsHide: true, timeout: 30000 });
    assert.equal(
      await fs.readFile(
        path.join(destination, "SEAF/app/core/entry.mjs"),
        "utf8",
      ),
      'export const title="Система";\n',
    );
    await fs.writeFile(path.join(destination, "keep.txt"), "keep");
    await assert.rejects(
      exec(ps, args, { windowsHide: true, timeout: 30000 }),
      /must be empty/,
    );
    assert.equal(
      await fs.readFile(path.join(destination, "keep.txt"), "utf8"),
      "keep",
    );
  },
);

test(
  "Windows .NET extractor confines ZIP entries to its destination",
  { skip: process.platform !== "win32" },
  async (t) => {
    const f = await fixture(t),
      archive = path.join(f.parent, "unsafe.zip"),
      destination = path.join(f.parent, "confined");
    await fs.writeFile(
      archive,
      zipSync({ "../escape.txt": Buffer.from("escape") }),
    );
    const ps = path.join(
      process.env.SystemRoot || process.env.WINDIR,
      "System32/WindowsPowerShell/v1.0/powershell.exe",
    );
    await assert.rejects(
      exec(
        ps,
        [
          "-NoProfile",
          "-ExecutionPolicy",
          "Bypass",
          "-File",
          path.join(here, "extract.ps1"),
          "-Archive",
          archive,
          "-Destination",
          destination,
        ],
        { windowsHide: true, timeout: 30000 },
      ),
    );
    assert.equal(
      await fs
        .stat(path.join(f.parent, "escape.txt"))
        .then(() => true)
        .catch((e) => {
          if (e.code !== "ENOENT") throw e;
          return false;
        }),
      false,
    );
  },
);
