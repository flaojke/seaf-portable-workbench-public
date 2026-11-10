import fs from "node:fs/promises";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { randomUUID } from "node:crypto";
const table = Uint32Array.from({ length: 256 }, (_, n) => {
  for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1;
  return n >>> 0;
});
const crc32 = (buffer) => {
  let n = 0xffffffff;
  for (const value of buffer) n = table[(n ^ value) & 255] ^ (n >>> 8);
  return (n ^ 0xffffffff) >>> 0;
};
export async function filesUnder(root, prefix = "") {
  const rows = [];
  for (const entry of await fs.readdir(path.join(root, prefix), {
    withFileTypes: true,
  })) {
    const name = prefix ? prefix + "/" + entry.name : entry.name;
    if (entry.isSymbolicLink())
      throw Error("Release may not contain symbolic links: " + name);
    if (entry.isDirectory()) rows.push(...(await filesUnder(root, name)));
    else if (entry.isFile()) rows.push(name);
  }
  return rows.sort();
}
// A deterministic streaming ZIP writer: at most one file is buffered at a time.
export async function writeZip(
  root,
  destination,
  { prefix = path.basename(root), files, onProgress } = {},
) {
  if (
    typeof prefix !== "string" ||
    !prefix ||
    prefix.includes("/") ||
    prefix.includes("\\") ||
    prefix.includes(":") ||
    prefix === "." ||
    prefix === ".."
  )
    throw Error("Invalid ZIP root prefix");
  const destinationRelative = path.relative(
    path.resolve(root),
    path.resolve(destination),
  );
  if (
    !destinationRelative ||
    (!destinationRelative.startsWith(".." + path.sep) &&
      destinationRelative !== ".." &&
      !path.isAbsolute(destinationRelative))
  )
    throw Error("ZIP destination must be outside the source directory");
  const partial = destination + ".partial-" + randomUUID();
  const output = await fs.open(partial, "wx"),
    central = [];
  let offset = 0,
    closed = false;
  const write = async (buffer) => {
    let position = 0;
    while (position < buffer.length) {
      const result = await output.write(
        buffer,
        position,
        buffer.length - position,
      );
      if (!result.bytesWritten) throw Error("ZIP write made no progress");
      position += result.bytesWritten;
    }
  };
  try {
    for (const relative of files || (await filesUnder(root))) {
      if (
        typeof relative !== "string" ||
        relative.includes("\\") ||
        relative.includes(":") ||
        relative.startsWith("/") ||
        relative.split("/").some((part) => !part || part === "..")
      )
        throw Error("Invalid ZIP artifact path");
      const bytes = await fs.readFile(path.join(root, relative)),
        compressed = deflateRawSync(bytes, { level: 3 });
      const name = Buffer.from(prefix + "/" + relative),
        crc = crc32(bytes);
      if (offset > 0xffffffff || bytes.length > 0xffffffff)
        throw Error("Release exceeds ZIP32 limits");
      const header = Buffer.alloc(30);
      header.writeUInt32LE(0x04034b50);
      header.writeUInt16LE(20, 4);
      header.writeUInt16LE(0x800, 6);
      header.writeUInt16LE(8, 8);
      header.writeUInt16LE(33, 12);
      header.writeUInt32LE(crc, 14);
      header.writeUInt32LE(compressed.length, 18);
      header.writeUInt32LE(bytes.length, 22);
      header.writeUInt16LE(name.length, 26);
      await write(header);
      await write(name);
      await write(compressed);
      const item = Buffer.alloc(46);
      item.writeUInt32LE(0x02014b50);
      item.writeUInt16LE(20, 4);
      item.writeUInt16LE(20, 6);
      item.writeUInt16LE(0x800, 8);
      item.writeUInt16LE(8, 10);
      item.writeUInt16LE(33, 14);
      item.writeUInt32LE(crc, 16);
      item.writeUInt32LE(compressed.length, 20);
      item.writeUInt32LE(bytes.length, 24);
      item.writeUInt16LE(name.length, 28);
      item.writeUInt32LE(offset, 42);
      central.push(Buffer.concat([item, name]));
      offset += header.length + name.length + compressed.length;
      if (onProgress && central.length % 5000 === 0)
        await onProgress({ files: central.length, bytes: offset });
    }
    const centralOffset = offset;
    for (const item of central) {
      await write(item);
      offset += item.length;
    }
    const centralSize = offset - centralOffset;
    if (centralOffset > 0xffffffff || centralSize > 0xffffffff)
      throw Error("Release exceeds supported ZIP32 byte offsets");
    if (central.length >= 65535) {
      const record = Buffer.alloc(56);
      record.writeUInt32LE(0x06064b50);
      record.writeBigUInt64LE(44n, 4);
      record.writeUInt16LE(45, 12);
      record.writeUInt16LE(45, 14);
      record.writeBigUInt64LE(BigInt(central.length), 24);
      record.writeBigUInt64LE(BigInt(central.length), 32);
      record.writeBigUInt64LE(BigInt(centralSize), 40);
      record.writeBigUInt64LE(BigInt(centralOffset), 48);
      const locator = Buffer.alloc(20);
      locator.writeUInt32LE(0x07064b50);
      locator.writeBigUInt64LE(BigInt(offset), 8);
      locator.writeUInt32LE(1, 16);
      await write(record);
      await write(locator);
      offset += 76;
    }
    const end = Buffer.alloc(22);
    end.writeUInt32LE(0x06054b50);
    end.writeUInt16LE(Math.min(central.length, 65535), 8);
    end.writeUInt16LE(Math.min(central.length, 65535), 10);
    end.writeUInt32LE(centralSize, 12);
    end.writeUInt32LE(centralOffset, 16);
    await write(end);
    await output.close();
    closed = true;
    await fs.rename(partial, destination);
    return { files: central.length, bytes: offset + 22 };
  } finally {
    if (!closed) await output.close();
    await fs.rm(partial, { force: true });
  }
}
