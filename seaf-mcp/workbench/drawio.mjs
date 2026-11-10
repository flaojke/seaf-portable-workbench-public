/** draw.io XML ↔ SEAF components. Parsing never executes XML, HTML or links.
 * importDrawio(xml, {pageId, namespace, owner}) returns {model, components,
 * pages, pageId, mapping, layout, warnings, unmapped, sourceXml}.
 * exportDrawio(model, {sourceXml, pageId, namespace, removeMissing})
 * creates XML or surgically updates a selected page, retaining unknown content.
 * updateDrawio is an alias for updating an existing XML document.
 */
import { inflateRawSync, deflateRawSync } from "node:zlib";
import { createHash } from "node:crypto";
import { XMLValidator } from "fast-xml-parser";

const LIMITS = {
  inputBytes: 4 * 1024 * 1024,
  inflatedBytes: 16 * 1024 * 1024,
  pages: 64,
  cells: 20000,
  depth: 128,
};
const SEAF_ID = /^[A-Za-z_][\w.-]*$/;
const PROPERTY_LIMITS = { bytes: 64 * 1024, depth: 24, nodes: 5000 };
const RESERVED_PROPERTIES = new Set(["__proto__", "prototype", "constructor"]);
function validateProperties(value) {
  let nodes = 0;
  const ancestors = new Set();
  function visit(item, depth) {
    if (++nodes > PROPERTY_LIMITS.nodes)
      throw Error("SEAF properties node limit exceeded");
    if (depth > PROPERTY_LIMITS.depth)
      throw Error("SEAF properties depth limit exceeded");
    if (item === null || ["string", "boolean"].includes(typeof item)) return;
    if (typeof item === "number" && Number.isFinite(item)) return;
    if (typeof item !== "object")
      throw Error("SEAF properties must contain only JSON data");
    if (ancestors.has(item)) throw Error("Cyclic SEAF properties");
    if (
      !Array.isArray(item) &&
      ![Object.prototype, null].includes(Object.getPrototypeOf(item))
    )
      throw Error("SEAF properties must be plain JSON objects");
    ancestors.add(item);
    if (
      Array.isArray(item) &&
      (item.length > PROPERTY_LIMITS.nodes ||
        Object.keys(item).length !== item.length ||
        Object.keys(item).some((key, index) => key !== String(index)))
    )
      throw Error("SEAF properties arrays must be dense JSON arrays");
    for (const [key, child] of Object.entries(item)) {
      if (RESERVED_PROPERTIES.has(key))
        throw Error("Reserved SEAF property: " + key);
      visit(child, depth + 1);
    }
    ancestors.delete(item);
  }
  visit(value, 0);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("SEAF properties must be an object");
  return value;
}
function parseProperties(json, kind) {
  if (json === undefined) return null;
  if (
    typeof json !== "string" ||
    Buffer.byteLength(json, "utf8") > PROPERTY_LIMITS.bytes
  )
    throw Error("SEAF properties size limit exceeded");
  let value;
  try {
    value = JSON.parse(json);
  } catch {
    throw Error("Invalid SEAF properties JSON");
  }
  validateProperties(value);
  const excluded =
    kind === "component"
      ? ["drawio", "links"]
      : kind === "link"
        ? ["drawio", "id", "title"]
        : [];
  for (const key of excluded)
    if (Object.hasOwn(value, key))
      throw Error("Unexpected SEAF " + kind + " property: " + key);
  return value;
}
function propertiesOf(value, kind) {
  const excluded = new Set(
    kind === "component" ? ["drawio", "links"] : ["drawio", "id", "title"],
  );
  const properties = Object.fromEntries(
    Object.entries(value).filter(([key]) => !excluded.has(key)),
  );
  validateProperties(properties);
  const json = JSON.stringify(properties);
  if (Buffer.byteLength(json, "utf8") > PROPERTY_LIMITS.bytes)
    throw Error("SEAF properties size limit exceeded");
  return { properties, json };
}
function canonicalProperties(value) {
  if (Array.isArray(value)) return value.map(canonicalProperties);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonicalProperties(value[key])]),
    );
  return value;
}
const hash = (value) =>
  createHash("sha256").update(String(value)).digest("hex").slice(0, 12);
const xmlEscape = (value) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
function decodeXml(value) {
  return String(value).replace(
    /&(#x[\da-f]+|#\d+|amp|lt|gt|quot|apos);/gi,
    (_, code) => {
      if (code[0] === "#") {
        const cp =
          code[1].toLowerCase() === "x"
            ? parseInt(code.slice(2), 16)
            : parseInt(code.slice(1), 10);
        if (
          !Number.isInteger(cp) ||
          (cp < 0x20 && ![9, 10, 13].includes(cp)) ||
          cp > 0x10ffff ||
          (cp >= 0xd800 && cp <= 0xdfff) ||
          cp === 0xfffe ||
          cp === 0xffff
        )
          throw Error("Invalid XML character");
        return String.fromCodePoint(cp);
      }
      return { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'" }[
        code.toLowerCase()
      ];
    },
  );
}
function bounded(xml, maximum) {
  if (typeof xml !== "string" || !xml.trim()) throw Error("Empty draw.io XML");
  if (Buffer.byteLength(xml, "utf8") > maximum)
    throw Error("draw.io XML exceeds size limit");
  if (/<!\s*(?:DOCTYPE|ENTITY)\b/i.test(xml))
    throw Error("DTD and entity declarations are forbidden");
  if (
    /[\u0000-\u0008\u000b\u000c\u000e-\u001f\ufffe\uffff]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/u.test(
      xml,
    )
  )
    throw Error("Invalid XML character");
  const text = xml.replace(
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>/g,
    "",
  );
  if (/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[\da-fA-F]+);)/.test(text))
    throw Error("Unknown or malformed XML entity");
  for (const ref of text.matchAll(/&#(?:x[\da-fA-F]+|\d+);/g))
    decodeXml(ref[0]);
}
function parseTree(xml, limits = LIMITS) {
  bounded(xml, limits.inflatedBytes);
  const valid = XMLValidator.validate(xml, { allowBooleanAttributes: false });
  if (valid !== true) throw Error("Invalid draw.io XML: " + valid.err.msg);
  const root = { name: "#document", children: [] },
    stack = [root];
  // The validator establishes well-formedness; offsets retain untouched XML.
  const tags =
    /<!--[\s\S]*?-->|<!\[CDATA\[[\s\S]*?\]\]>|<\?[\s\S]*?\?>|<\/?[A-Za-z_][\w:.-]*(?:[^<>"']|"[^"]*"|'[^']*')*>/g;
  for (const match of xml.matchAll(tags)) {
    const token = match[0],
      start = match.index;
    if (token.startsWith("<?") || token.startsWith("<!")) continue;
    if (token.startsWith("</")) {
      const node = stack.pop();
      node.closeStart = start;
      node.end = start + token.length;
      continue;
    }
    const name = /^<([\w:.-]+)/.exec(token)[1],
      attrs = {};
    for (const attr of token.matchAll(
      /([\w:.-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g,
    ))
      attrs[attr[1]] = decodeXml(attr[2] ?? attr[3]);
    if (attrs.seafProperties !== undefined)
      parseProperties(attrs.seafProperties);
    const parent = stack.at(-1),
      node = {
        name,
        attrs,
        start,
        openEnd: start + token.length,
        end: start + token.length,
        closeStart: start + token.length,
        children: [],
        parent,
      };
    parent.children.push(node);
    if (!token.endsWith("/>")) {
      stack.push(node);
      if (stack.length > limits.depth) throw Error("XML nesting exceeds limit");
    }
  }
  if (stack.length !== 1 || root.children.length !== 1)
    throw Error("Expected exactly one XML root");
  return root.children[0];
}
function descendants(node, name, result = []) {
  if (node.name === name) result.push(node);
  for (const c of node.children) descendants(c, name, result);
  return result;
}
function decodeDiagram(xml, node, limits) {
  const raw = xml.slice(node.openEnd, node.closeStart).trim();
  if (node.children.some((c) => c.name === "mxGraphModel"))
    return { xml: raw, compressed: false };
  let encoded = raw.startsWith("<![CDATA[") ? raw.slice(9, -3) : decodeXml(raw);
  if (encoded.trim().startsWith("<mxGraphModel"))
    return { xml: encoded.trim(), compressed: false, encoded: true };
  const base64 = encoded.replace(/\s/g, "");
  if (
    !base64 ||
    !/^[A-Za-z\d+/]*={0,2}$/.test(base64) ||
    base64.length % 4 === 1 ||
    (base64.includes("=") && base64.length % 4 !== 0)
  )
    throw Error("Invalid compressed diagram encoding");
  const compressed = Buffer.from(base64, "base64");
  if (
    compressed.toString("base64").replace(/=+$/, "") !==
    base64.replace(/=+$/, "")
  )
    throw Error("Invalid compressed diagram encoding");
  try {
    const inflated = inflateRawSync(compressed, {
      maxOutputLength: limits.inflatedBytes,
      info: true,
    });
    if (inflated.engine.bytesWritten !== compressed.length)
      throw Error("Trailing compressed data");
    encoded = decodeURIComponent(
      new TextDecoder("utf-8", { fatal: true }).decode(inflated.buffer),
    );
    bounded(encoded, limits.inflatedBytes);
    return { xml: encoded, compressed: true };
  } catch (error) {
    throw Error("Cannot decompress draw.io page: " + error.message);
  }
}
function pagesOf(sourceXml, limits = LIMITS) {
  bounded(sourceXml, limits.inputBytes);
  const tree = parseTree(sourceXml, limits);
  let pages;
  if (tree.name === "mxGraphModel")
    pages = [
      {
        id: "page-1",
        name: "Page 1",
        modelXml: sourceXml,
        compressed: false,
        node: null,
        tree,
      },
    ];
  else {
    if (tree.name !== "mxfile") throw Error("Expected mxfile or mxGraphModel");
    const diagrams = tree.children.filter((c) => c.name === "diagram");
    if (!diagrams.length || diagrams.length > limits.pages)
      throw Error("Invalid number of draw.io pages");
    const ids = new Set();
    let decodedBytes = 0;
    pages = diagrams.map((node, i) => {
      const id = node.attrs.id || "page-" + (i + 1);
      if (ids.has(id)) throw Error("Duplicate page id");
      ids.add(id);
      const decoded = decodeDiagram(sourceXml, node, limits);
      decodedBytes += Buffer.byteLength(decoded.xml, "utf8");
      if (decodedBytes > limits.inflatedBytes)
        throw Error("Expanded draw.io pages exceed size limit");
      const modelTree = parseTree(decoded.xml, limits);
      if (modelTree.name !== "mxGraphModel")
        throw Error("Diagram does not contain mxGraphModel");
      return {
        id,
        name: node.attrs.name || "Page " + (i + 1),
        modelXml: decoded.xml,
        compressed: decoded.compressed,
        encoded: decoded.encoded,
        node,
        tree: modelTree,
      };
    });
  }
  let expandedBytes = 0,
    totalCells = 0;
  for (const page of pages) {
    expandedBytes += Buffer.byteLength(page.modelXml, "utf8");
    if (expandedBytes > limits.inflatedBytes)
      throw Error("Expanded draw.io pages exceed size limit");
    if (page.tree.children.filter((c) => c.name === "root").length !== 1)
      throw Error("Expected one mxGraphModel root");
    const cells = descendants(page.tree, "mxCell");
    totalCells += cells.length;
    if (totalCells > limits.cells) throw Error("Too many cells");
    const cellIds = new Set();
    for (const cell of cells) {
      parseProperties(
        cellMetadata(cell).seafProperties,
        cell.attrs.vertex === "1"
          ? "component"
          : cell.attrs.edge === "1"
            ? "link"
            : undefined,
      );
      const ids = new Set([cellId(cell), cell.attrs.id].filter(Boolean));
      if (!ids.size) throw Error("mxCell without id");
      for (const id of ids) {
        if (cellIds.has(id)) throw Error("Duplicate mxCell id: " + id);
        cellIds.add(id);
      }
    }
  }
  return pages;
}
function selectedPage(pages, options) {
  const page = options.pageId
    ? pages.find((p) => p.id === options.pageId)
    : pages[options.pageIndex || 0];
  if (!page) throw Error("Unknown draw.io page");
  return page;
}
function titleOf(value, style = "") {
  const text = String(value ?? "");
  return /(?:^|;)html=1(?:;|$)/.test(style)
    ? decodeXml(
        text
          .replace(/<br\s*\/?\s*>/gi, "\n")
          .replace(/<\/(?:div|p)>/gi, "\n")
          .replace(/<[^>]*>/g, ""),
      ).trim()
    : text.trim();
}
function cellMetadata(cell) {
  return cell.parent && ["object", "UserObject"].includes(cell.parent.name)
    ? { ...cell.attrs, ...cell.parent.attrs, style: cell.attrs.style || "" }
    : cell.attrs;
}
function cellId(cell) {
  return cellMetadata(cell).id;
}
function namespaceOf(value) {
  const n = value || "imported";
  if (!/^[A-Za-z_][\w.-]*$/.test(n)) throw Error("Invalid SEAF namespace");
  return n;
}
function nodeType(attrs) {
  if (attrs.seafEntity) return attrs.seafEntity;
  const style = attrs.style || "";
  return /cylinder|database|datastore/i.test(style)
    ? "database"
    : /shape=cloud/i.test(style)
      ? "cloud"
      : "component";
}
function semanticCell(id, attrs, geometry, pageId) {
  const entity = nodeType(attrs);
  const properties = parseProperties(attrs.seafProperties, "component");
  const declaredProperties = new Set(Object.keys(properties || {}));
  if (attrs.label !== undefined || attrs.value !== undefined)
    declaredProperties.add("title");
  for (const [attribute, property] of [
    ["seafEntity", "entity"],
    ["seafKind", "kind"],
    ["seafOwner", "owner"],
    ["seafDescription", "description"],
  ])
    if (attrs[attribute] !== undefined) declaredProperties.add(property);
  const drawio = {
    pageId,
    cellId: id,
    style: attrs.style || "",
    geometry,
    declaredProperties: [...declaredProperties].sort(),
  };
  if (properties)
    return {
      ...properties,
      title:
        attrs.label !== undefined || attrs.value !== undefined
          ? titleOf(attrs.label ?? attrs.value, attrs.style)
          : (properties.title ?? "Component " + id),
      entity: attrs.seafEntity ?? properties.entity ?? entity,
      kind:
        attrs.seafKind ??
        properties.kind ??
        (entity === "database" ? "database" : "system"),
      owner: attrs.seafOwner ?? properties.owner ?? "Unassigned",
      description:
        attrs.seafDescription ??
        properties.description ??
        "Imported from draw.io",
      drawio,
    };
  return {
    title:
      titleOf(attrs.label ?? attrs.value, attrs.style) || "Component " + id,
    entity,
    kind: attrs.seafKind || (entity === "database" ? "database" : "system"),
    owner: attrs.seafOwner ?? "Unassigned",
    description: attrs.seafDescription ?? "Imported from draw.io",
    drawio,
  };
}

/** Validate structure and resource limits. Throws for unsafe or malformed input.
 * Limits apply to the whole file (bytes, expanded pages, cells, depth, pages).
 */
export function validateDrawio(sourceXml, options = {}) {
  const limits = { ...LIMITS, ...options.limits },
    pages = pagesOf(sourceXml, limits);
  return {
    valid: true,
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      compressed: p.compressed,
      cells: descendants(p.tree, "mxCell").length,
    })),
  };
}

/** Extract one page as SEAF components, with stable source IDs and layout metadata.
 * Unknown cells stay in sourceXml; unsupported cells and dangling edges are
 * reported in warnings and the structured unmapped list. The caller
 * must stage/review model changes before writing them to an architecture project.
 */
export function importDrawio(sourceXml, options = {}) {
  const limits = { ...LIMITS, ...options.limits },
    pages = pagesOf(sourceXml, limits),
    page = selectedPage(pages, options),
    namespace = namespaceOf(options.namespace);
  const components = Object.create(null),
    mapping = Object.create(null),
    layout = Object.create(null),
    warnings = [],
    unmapped = [],
    cells = descendants(page.tree, "mxCell");
  for (const cell of cells) {
    if (cell.attrs.vertex === "1" || cell.attrs.edge === "1") continue;
    const attrs = cellMetadata(cell),
      id = cellId(cell),
      style = attrs.style || "";
    // Root, layers and explicit grouping containers organize the canvas.
    // They are not rejected shapes and do not become architecture entities.
    if (
      id === "0" ||
      cell.attrs.parent === "0" ||
      /(?:^|;)(?:group|container=1)(?:;|$)/.test(style)
    )
      continue;
    const item = {
      cellId: id,
      pageId: page.id,
      reason: "unsupported-cell",
      label: titleOf(attrs.label ?? attrs.value, style),
    };
    unmapped.push(item);
    warnings.push(
      `Cell ${id || "?"} is not a vertex or edge; retained in source XML without a model mapping`,
    );
  }
  for (const cell of cells.filter((c) => c.attrs.vertex === "1")) {
    const attrs = cellMetadata(cell),
      id = cellId(cell);
    if (!id) throw Error("Vertex without id");
    const seafId = attrs.seafId || `${namespace}.n_${hash(page.id + ":" + id)}`;
    if (!SEAF_ID.test(seafId))
      throw Error("Invalid explicit SEAF id: " + seafId);
    if (components[seafId]) throw Error("Duplicate SEAF id: " + seafId);
    const geometryNode = cell.children.find((c) => c.name === "mxGeometry"),
      geometry = { ...(geometryNode?.attrs || {}) };
    components[seafId] = semanticCell(id, attrs, geometry, page.id);
    if (
      options.owner &&
      attrs.seafOwner === undefined &&
      !Object.hasOwn(
        parseProperties(attrs.seafProperties, "component") || {},
        "owner",
      )
    )
      components[seafId].owner = options.owner;
    mapping[id] = seafId;
    if (cell.attrs.id) mapping[cell.attrs.id] = seafId;
    layout[seafId] = {
      ...geometry,
      parent: cell.attrs.parent || "1",
      style: cell.attrs.style || "",
    };
  }
  const links = [];
  for (const cell of cells.filter((c) => c.attrs.edge === "1")) {
    const attrs = cellMetadata(cell),
      from = mapping[cell.attrs.source],
      to = mapping[cell.attrs.target];
    if (!from || !to) {
      unmapped.push({
        cellId: cellId(cell),
        pageId: page.id,
        reason: "missing-endpoint",
        source: cell.attrs.source || null,
        target: cell.attrs.target || null,
      });
      warnings.push(
        `Edge ${cellId(cell) || "?"} has a missing/unrecognised endpoint; retained in source XML`,
      );
      continue;
    }
    const properties = parseProperties(attrs.seafProperties, "link") || {};
    const link = {
      ...properties,
      id: to,
      title: titleOf(attrs.label ?? attrs.value, cell.attrs.style),
      direction: properties.direction ?? "-->",
      drawio: {
        pageId: page.id,
        cellId: cellId(cell),
        style: cell.attrs.style || "",
      },
    };
    (components[from].links ||= []).push(link);
    links.push({ from, to, ...link });
  }
  return {
    model: { components },
    components,
    links,
    mapping,
    layout,
    warnings,
    unmapped,
    pageId: page.id,
    pages: pages.map((p) => ({
      id: p.id,
      name: p.name,
      compressed: p.compressed,
    })),
    sourceXml,
  };
}

function attrsText(attrs) {
  return Object.entries(attrs)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `${k}="${xmlEscape(v)}"`)
    .join(" ");
}
function labelValue(title, style) {
  return /(?:^|;)html=1(?:;|$)/.test(style || "")
    ? String(title ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
    : String(title ?? "");
}
function setAttrs(xml, node, changes) {
  let opening = xml.slice(node.start, node.openEnd);
  for (const [key, value] of Object.entries(changes)) {
    if (!/^[A-Za-z_][\w:.-]*$/.test(key)) throw Error("Invalid XML attribute");
    const re = new RegExp(`(\\s${key}\\s*=\\s*)(?:"[^"]*"|'[^']*')`);
    if (re.test(opening))
      opening = opening.replace(
        re,
        (_, prefix) => `${prefix}"${xmlEscape(value)}"`,
      );
    else
      opening = opening.replace(
        /\s*\/?>$/,
        (end) => ` ${key}="${xmlEscape(value)}"${end}`,
      );
  }
  return { start: node.start, end: node.openEnd, text: opening };
}
function vertexXml(id, c, index, options = {}, outputId = "seaf-" + hash(id)) {
  const geometry = c.drawio?.geometry || options.layout?.[id] || {};
  const attrs = {
    id: outputId,
    label: c.title ?? id,
    seafId: id,
    seafEntity: c.entity ?? "component",
    seafKind: c.kind ?? "system",
    seafOwner: c.owner ?? "",
    seafDescription: c.description ?? "",
    seafProperties: propertiesOf(c, "component").json,
  };
  const style = c.drawio?.style || "rounded=1;whiteSpace=wrap;html=0;";
  attrs.label = labelValue(attrs.label, style);
  return `<object ${attrsText(attrs)}><mxCell vertex="1" parent="1" style="${xmlEscape(style)}"><mxGeometry ${attrsText({ x: geometry.x ?? 40 + (index % 4) * 240, y: geometry.y ?? 40 + Math.floor(index / 4) * 140, width: geometry.width ?? 180, height: geometry.height ?? 80, as: "geometry" })}/></mxCell></object>`;
}
function edgeXml(from, to, link, index, mapping, outputId) {
  return `<mxCell ${attrsText({ id: outputId || "edge-" + hash([from, to, index, link.title || ""].join(":")), value: labelValue(link.title || "", link.drawio?.style || ""), edge: 1, parent: 1, source: mapping[from], target: mapping[to], style: link.drawio?.style || "edgeStyle=orthogonalEdgeStyle;endArrow=block;html=0;", seafProperties: propertiesOf(link, "link").json })}><mxGeometry relative="1" as="geometry"/></mxCell>`;
}
function linkFingerprint(components) {
  return Object.entries(components)
    .flatMap(([from, c]) =>
      (c.links || []).map((l) =>
        JSON.stringify(
          canonicalProperties([
            from,
            l.id,
            l.title || "",
            propertiesOf(l, "link").properties,
            l.drawio?.style || "",
          ]),
        ),
      ),
    )
    .sort()
    .join("\n");
}
function semanticFingerprint(components) {
  return JSON.stringify(
    Object.fromEntries(
      Object.entries(components)
        .sort()
        .map(([id, c]) => [
          id,
          canonicalProperties([
            propertiesOf(c, "component").properties,
            c.drawio?.style,
            c.drawio?.geometry,
          ]),
        ]),
    ),
  );
}
function unusedId(preferred, fallback, used) {
  let id = typeof preferred === "string" && preferred ? preferred : fallback;
  if (used.has(id)) id = fallback;
  let suffix = 1;
  const base = id;
  while (used.has(id)) id = base + "-" + suffix++;
  used.add(id);
  return id;
}
function checkModel(components) {
  let count = 0;
  for (const [id, c] of Object.entries(components)) {
    if (!SEAF_ID.test(id)) throw Error("Invalid SEAF id: " + id);
    if (!c || typeof c !== "object" || Array.isArray(c))
      throw Error("Invalid component: " + id);
    if (c.links !== undefined && !Array.isArray(c.links))
      throw Error("Component links must be an array");
    for (const key of ["title", "entity", "kind", "owner", "description"])
      if (Object.hasOwn(c, key) && typeof c[key] !== "string")
        throw Error("Component " + key + " must be a string");
    propertiesOf(c, "component");
    for (const link of c.links || []) {
      if (!link || typeof link !== "object" || !SEAF_ID.test(link.id))
        throw Error("Invalid component link");
      if (Object.hasOwn(link, "title") && typeof link.title !== "string")
        throw Error("Link title must be a string");
      propertiesOf(link, "link");
      count++;
    }
    count++;
  }
  if (count > LIMITS.cells - 2) throw Error("Too many components or links");
}

/** Export components, or update sourceXml without reconstructing unknown XML.
 * Input is {components}, {model:{components}}, or a components dictionary.
 * Existing geometry, styles and XML survive unless explicitly changed. Omitted
 * entities/links are retained unless removeMissing is true. Links whose target
 * is outside the supplied model are omitted from a newly generated diagram.
 */
export function exportDrawio(input, options = {}) {
  const components = input.model?.components || input.components || input;
  if (
    !components ||
    Array.isArray(components) ||
    typeof components !== "object"
  )
    throw Error("Expected SEAF components");
  checkModel(components);
  const entries = Object.entries(components);
  if (!options.sourceXml) {
    const used = new Set(["0", "1"]),
      mapping = Object.fromEntries(
        entries.map(([id, c]) => [
          id,
          unusedId(c.drawio?.cellId, "seaf-" + hash(id), used),
        ]),
      );
    const vertices = entries.map(([id, c], i) =>
      vertexXml(id, c, i, options, mapping[id]),
    );
    let counter = 0;
    const edges = entries.flatMap(([from, c]) =>
      (c.links || [])
        .filter((l) => Object.hasOwn(mapping, l.id))
        .map((l) =>
          edgeXml(
            from,
            l.id,
            l,
            counter++,
            mapping,
            unusedId(
              l.drawio?.cellId,
              "edge-" + hash([from, l.id, counter, l.title || ""].join(":")),
              used,
            ),
          ),
        ),
    );
    const pageId =
        options.pageId ||
        input.pageId ||
        entries[0]?.[1].drawio?.pageId ||
        "seaf-page",
      name = options.name || "SEAF architecture";
    const output = `<mxfile host="SEAF" version="1"><diagram ${attrsText({ id: pageId, name })}><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>${vertices.join("")}${edges.join("")}</root></mxGraphModel></diagram></mxfile>`;
    validateDrawio(output);
    return output;
  }
  const sourceXml = options.sourceXml,
    pages = pagesOf(sourceXml),
    page = selectedPage(pages, options),
    old = importDrawio(sourceXml, { ...options, pageId: page.id });
  if (
    semanticFingerprint(old.components) === semanticFingerprint(components) &&
    linkFingerprint(old.components) === linkFingerprint(components)
  )
    return sourceXml;
  const xml = page.modelXml,
    edits = [],
    cells = descendants(page.tree, "mxCell");
  const mapping = Object.fromEntries(
    cells
      .filter((c) => c.attrs.vertex === "1")
      .map((c) => [old.mapping[cellId(c)], cellId(c)]),
  );
  const existingIds = new Set(
      cells.flatMap((c) => [cellId(c), c.attrs.id].filter(Boolean)),
    ),
    usedIds = new Set([...existingIds, "0", "1"]);
  for (const cell of cells.filter((c) => c.attrs.vertex === "1")) {
    const key = old.mapping[cellId(cell)],
      c = components[key];
    if (!c) {
      if (options.removeMissing) {
        const node = ["object", "UserObject"].includes(cell.parent.name)
          ? cell.parent
          : cell;
        edits.push({ start: node.start, end: node.end, text: "" });
      }
      continue;
    }
    const wrapped = ["object", "UserObject"].includes(cell.parent.name),
      target = wrapped ? cell.parent : cell;
    const style = cell.attrs.style || "";
    edits.push(
      setAttrs(xml, target, {
        [wrapped ? "label" : "value"]: labelValue(
          c.title ?? key,
          c.drawio?.style ?? style,
        ),
        seafId: key,
        seafEntity: c.entity ?? "component",
        seafKind: c.kind ?? "system",
        seafOwner: c.owner ?? "",
        seafDescription: c.description ?? "",
        seafProperties: propertiesOf(c, "component").json,
      }),
    );
    if (c.drawio?.style !== undefined && c.drawio.style !== style)
      edits.push(setAttrs(xml, cell, { style: c.drawio.style }));
    const geometry = cell.children.find((c) => c.name === "mxGeometry");
    if (
      geometry &&
      c.drawio?.geometry &&
      JSON.stringify(geometry.attrs) !== JSON.stringify(c.drawio.geometry)
    )
      edits.push(setAttrs(xml, geometry, c.drawio.geometry));
  }
  let additions = "";
  entries.forEach(([id, c], i) => {
    if (!Object.hasOwn(old.components, id)) {
      mapping[id] = unusedId(c.drawio?.cellId, "seaf-" + hash(id), usedIds);
      additions += vertexXml(id, c, i, options, mapping[id]);
    }
  });
  const desired = entries.flatMap(([from, c]) =>
      (c.links || []).map((l) => ({ from, link: l })),
    ),
    used = new Set();
  for (const cell of cells.filter((c) => c.attrs.edge === "1")) {
    const from = old.mapping[cell.attrs.source],
      to = old.mapping[cell.attrs.target];
    if (!from || !to) continue; // Unknown decorations and dangling edges retain their source.
    const match = desired.findIndex(
      (d, i) =>
        !used.has(i) &&
        d.from === from &&
        d.link.id === to &&
        (d.link.drawio?.cellId === cellId(cell) || !d.link.drawio?.cellId),
    );
    if (match < 0) {
      if (options.removeMissing)
        edits.push({ start: cell.start, end: cell.end, text: "" });
      continue;
    }
    used.add(match);
    const wrapped = ["object", "UserObject"].includes(cell.parent.name),
      target = wrapped ? cell.parent : cell;
    edits.push(
      setAttrs(xml, target, {
        [wrapped ? "label" : "value"]: labelValue(
          desired[match].link.title || "",
          desired[match].link.drawio?.style ?? cell.attrs.style ?? "",
        ),
        seafProperties: propertiesOf(desired[match].link, "link").json,
      }),
    );
    if (
      desired[match].link.drawio?.style !== undefined &&
      desired[match].link.drawio.style !== cell.attrs.style
    )
      edits.push(
        setAttrs(xml, cell, { style: desired[match].link.drawio.style }),
      );
  }
  desired.forEach((d, i) => {
    if (
      !used.has(i) &&
      Object.hasOwn(mapping, d.from) &&
      Object.hasOwn(mapping, d.link.id)
    )
      additions += edgeXml(
        d.from,
        d.link.id,
        d.link,
        i,
        mapping,
        unusedId(
          d.link.drawio?.cellId,
          "edge-" + hash([d.from, d.link.id, i].join(":")),
          usedIds,
        ),
      );
  });
  if (additions) {
    additions =
      (!existingIds.has("0") ? '<mxCell id="0"/>' : "") +
      (!existingIds.has("1") ? '<mxCell id="1" parent="0"/>' : "") +
      additions;
    const root = page.tree.children.find((c) => c.name === "root");
    if (xml.slice(root.start, root.openEnd).endsWith("/>"))
      edits.push({
        start: root.start,
        end: root.end,
        text:
          xml.slice(root.start, root.openEnd - 2) + ">" + additions + "</root>",
      });
    else
      edits.push({
        start: root.closeStart,
        end: root.closeStart,
        text: additions,
      });
  }
  const deletions = edits.filter((e) => e.text === "");
  const active = edits.filter(
    (e) =>
      !deletions.some((d) => d !== e && d.start <= e.start && d.end >= e.end),
  );
  // Merge changes to the same opening tag before applying offset edits.
  const merged = [];
  for (const edit of active) {
    const previous = merged.find(
      (e) => e.start === edit.start && e.end === edit.end,
    );
    if (previous) {
      const altered = parseTree(edit.text.replace(/\/?>$/, "/>"));
      const original = parseTree(
        xml.slice(edit.start, edit.end).replace(/\/?>$/, "/>"),
      );
      const changes = Object.fromEntries(
        Object.entries(altered.attrs).filter(
          ([k, v]) => original.attrs[k] !== v,
        ),
      );
      previous.text = setAttrs(
        previous.text,
        { start: 0, openEnd: previous.text.length },
        changes,
      ).text;
    } else merged.push({ ...edit });
  }
  let updated = xml;
  for (const edit of merged.sort((a, b) => b.start - a.start))
    updated =
      updated.slice(0, edit.start) + edit.text + updated.slice(edit.end);
  parseTree(updated);
  if (!page.node) return updated;
  const content = page.compressed
    ? deflateRawSync(Buffer.from(encodeURIComponent(updated), "utf8")).toString(
        "base64",
      )
    : page.encoded
      ? xmlEscape(updated)
      : updated;
  const output =
    sourceXml.slice(0, page.node.openEnd) +
    content +
    sourceXml.slice(page.node.closeStart);
  validateDrawio(output);
  return output;
}

export function updateDrawio(sourceXml, model, options = {}) {
  return exportDrawio(model, { ...options, sourceXml });
}
