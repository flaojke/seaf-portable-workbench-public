import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";
import { createRequire } from "node:module";
import { writeZip } from "./zip.mjs";

const args = process.argv.slice(2),
  arg = (name) => {
    const index = args.indexOf(name);
    return index < 0 ? null : args[index + 1];
  };
const root = path.resolve(
  process.env.SEAF_TEST_BUNDLE ||
    arg("--bundle") ||
    (!args[0]?.startsWith("--") && args[0]) ||
    "dist/SEAF-Windows-x64",
);
const zip = path.resolve(arg("--zip") || "portable/state/zip64-test.zip"),
  receipt = path.resolve(arg("--out") || "portable/state/zip-gates.json");
await fs.mkdir(path.dirname(receipt), { recursive: true });
await fs.writeFile(
  receipt,
  JSON.stringify({ status: "running", started: new Date().toISOString() }),
);
try {
  const manifest = JSON.parse(
    await fs.readFile(path.join(root, "manifest.json"), "utf8"),
  );
  const prefix =
    arg("--prefix") || (arg("--zip") ? path.basename(root) : "SEAF");
  if (!arg("--zip"))
    await writeZip(root, zip, {
      prefix,
      files: [...manifest.files.map((row) => row.path), "manifest.json"].sort(),
      onProgress: (value) => console.log("ZIP " + value.files + " files"),
    });
  const bytes = await fs.readFile(zip),
    require = createRequire(
      new URL("../seaf-mcp/package.json", import.meta.url),
    ),
    { unzipSync } = require("fflate");
  if (bytes.readUInt32LE(bytes.length - 22) !== 0x06054b50)
    throw Error("ZIP has no complete end-of-central-directory record");
  const expected = new Set([
      ...manifest.files.map((row) => prefix + "/" + row.path),
      prefix + "/manifest.json",
    ]),
    seen = new Set(),
    unexpected = [];
  let entries = 0;
  const sample = unzipSync(bytes, {
    filter: (entry) => {
      entries++;
      if (!expected.has(entry.name) || seen.has(entry.name))
        unexpected.push(entry.name);
      seen.add(entry.name);
      return [
        prefix + "/app/core/package.json",
        prefix + "/manifest.json",
      ].includes(entry.name);
    },
  });
  if (entries !== expected.size || unexpected.length)
    throw Error(
      "ZIP entries differ from manifest: " +
        JSON.stringify({
          entries,
          expected: expected.size,
          unexpected: unexpected.slice(0, 10),
        }),
    );
  const embedded = JSON.parse(
    Buffer.from(sample[prefix + "/manifest.json"]).toString(),
  );
  if (embedded.id !== manifest.id) throw Error("ZIP manifest mismatch");
  const sourcePackage = JSON.parse(
      await fs.readFile(path.join(root, "app/core/package.json"), "utf8"),
    ),
    embeddedPackage = JSON.parse(
      Buffer.from(sample[prefix + "/app/core/package.json"]).toString(),
    );
  if (sourcePackage.version !== embeddedPackage.version)
    throw Error("ZIP core package mismatch");
  let zip64 = false;
  if (entries >= 65535) {
    const locatorOffset = bytes.length - 42;
    if (bytes.readUInt32LE(locatorOffset) !== 0x07064b50)
      throw Error("ZIP64 locator missing");
    const recordOffset = Number(bytes.readBigUInt64LE(locatorOffset + 8));
    if (
      bytes.readUInt32LE(recordOffset) !== 0x06064b50 ||
      Number(bytes.readBigUInt64LE(recordOffset + 32)) !== entries
    )
      throw Error("ZIP64 central entry count mismatch");
    zip64 = true;
  }
  const report = {
    status: "PASS",
    entries,
    zip64,
    bytes: bytes.length,
    sha256: crypto.createHash("sha256").update(bytes).digest("hex"),
    manifest: manifest.id,
    noUserData: manifest.files.every((row) => !row.path.startsWith("data/")),
    checked:
      "Existing full release ZIP: independent fflate parser validates every central name/count and decodes manifest/core package; complete ZIP64 directory checked. Full file contents require extracted manifest verification.",
    completed: new Date().toISOString(),
  };
  await fs.writeFile(receipt, JSON.stringify(report, null, 2));
  console.log(JSON.stringify(report));
} catch (error) {
  await fs.writeFile(
    receipt,
    JSON.stringify(
      {
        status: "FAIL",
        error: error.stack || String(error),
        completed: new Date().toISOString(),
      },
      null,
      2,
    ),
  );
  throw error;
}
