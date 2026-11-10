import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
const cache = (globalThis[Symbol.for("seaf.portable.hashes")] ||= new Map());
export async function verifyBundle(root, { scope } = {}) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, "manifest.json"), "utf8"),
  );
  if (manifest.format !== "seaf-portable-v1" || !Array.isArray(manifest.files))
    throw Error("Unsupported portable manifest");
  const { id, ...content } = manifest,
    actual = crypto
      .createHash("sha256")
      .update(JSON.stringify(content))
      .digest("hex");
  if (actual !== id) throw Error("Portable manifest identity mismatch");
  const seen = new Set(),
    failures = [],
    pending = [];
  for (const row of manifest.files) {
    if (
      typeof row.path !== "string" ||
      row.path.includes("\\") ||
      row.path.includes(":") ||
      row.path.startsWith("/") ||
      row.path.split("/").some((x) => !x || x === "..") ||
      seen.has(row.path) ||
      !/^[0-9a-f]{64}$/.test(row.sha256)
    )
      throw Error("Invalid portable manifest entry");
    seen.add(row.path);
    if (scope && !scope.some((prefix) => row.path.startsWith(prefix))) continue;
    const file = path.join(root, row.path);
    pending.push(async () => {
      try {
        const stat = await fs.lstat(file);
        if (!stat.isFile() || stat.isSymbolicLink())
          throw Error("Not a regular file");
        const previous = cache.get(file);
        let hash;
        if (
          previous &&
          previous.size === stat.size &&
          previous.mtime === stat.mtimeMs &&
          previous.ctime === stat.ctimeMs
        )
          hash = previous.hash;
        else {
          hash = crypto
            .createHash("sha256")
            .update(await fs.readFile(file))
            .digest("hex");
          cache.set(file, {
            size: stat.size,
            mtime: stat.mtimeMs,
            ctime: stat.ctimeMs,
            hash,
          });
        }
        if (hash !== row.sha256)
          failures.push({ path: row.path, error: "SHA-256 mismatch" });
      } catch (e) {
        failures.push({ path: row.path, error: e.message });
      }
    });
  }
  for (let index = 0; index < pending.length; index += 32)
    await Promise.all(pending.slice(index, index + 32).map((task) => task()));
  const inScope = (relative) =>
    !scope ||
    scope.some(
      (prefix) =>
        relative.startsWith(prefix) || prefix.startsWith(relative + "/"),
    );
  const checkUnexpected = async (relative = "") => {
    for (const entry of await fs.readdir(path.join(root, relative), {
      withFileTypes: true,
    })) {
      const candidate = relative ? relative + "/" + entry.name : entry.name;
      if (
        candidate === "data" ||
        candidate === "manifest.json" ||
        !inScope(candidate)
      )
        continue;
      if (entry.isSymbolicLink()) {
        failures.push({
          path: candidate,
          error: "Symbolic links are not allowed in immutable files",
        });
        continue;
      }
      if (entry.isDirectory()) await checkUnexpected(candidate);
      else if (!seen.has(candidate))
        failures.push({ path: candidate, error: "Unexpected immutable file" });
    }
  };
  await checkUnexpected();
  if (failures.length)
    throw Error(
      "Portable bundle verification failed: " +
        JSON.stringify(failures.slice(0, 20)),
    );
  return { ok: true, id, files: manifest.files.length };
}
if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
)
  console.log(
    JSON.stringify(
      await verifyBundle(
        path.resolve(
          process.argv[2] ||
            path.join(path.dirname(fileURLToPath(import.meta.url)), ".."),
        ),
      ),
    ),
  );
