import test from "node:test";
import assert from "node:assert/strict";
import { deflateRawSync, inflateRawSync } from "node:zlib";
import {
  importDrawio,
  exportDrawio,
  updateDrawio,
  validateDrawio,
} from "../drawio.mjs";

const graph = `<mxGraphModel dx="120" dy="80" grid="1"><root>
<mxCell id="0"/><mxCell id="1" parent="0"/>
<object id="orders" label="Orders &amp; café 🚚" seafId="demo.orders" seafOwner="Commerce" custom="retain-me"><mxCell vertex="1" parent="1" style="rounded=1;html=0;unknown=42;"><mxGeometry x="10" y="20" width="180" height="80" as="geometry"/></mxCell></object>
<mxCell id="delivery" value="Delivery" vertex="1" parent="1" style="rounded=1;html=0;"><mxGeometry x="400" y="20" width="180" height="80" as="geometry"/></mxCell>
<mxCell id="calls-delivery" value="Create shipment" edge="1" source="orders" target="delivery" parent="1" style="endArrow=block;html=0;customEdge=preserve;"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="240" y="60"/></Array></mxGeometry></mxCell>
<mxCell id="decoration" value="Background annotation" parent="1" custom="opaque"><mxGeometry x="0" y="0" width="900" height="300" as="geometry"/></mxCell>
<custom:extension xmlns:custom="urn:example" data="unchanged"/>
</root></mxGraphModel>`;
const otherGraph = `<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="db" value="База данных" vertex="1" parent="1" style="shape=cylinder;"><mxGeometry x="4" y="5" width="100" height="80" as="geometry"/></mxCell></root></mxGraphModel>`;
const page2 = `<diagram id="storage" name="Хранение">${otherGraph}</diagram>`;
const xml = `<mxfile host="app.diagrams.net" modified="keep-original"><diagram id="services" name="Services">${graph}</diagram>${page2}</mxfile>`;
const compress = (value) =>
  deflateRawSync(Buffer.from(encodeURIComponent(value))).toString("base64");
const wrap = (value) =>
  `<mxfile><diagram id="services" name="Services">${value}</diagram></mxfile>`;

test("imports components, ownership, stable IDs, directed edges and exact layout", () => {
  const result = importDrawio(xml, { namespace: "shopflow" });
  assert.equal(result.pageId, "services");
  assert.equal(result.pages.length, 2);
  assert.equal(result.components["demo.orders"].title, "Orders & café 🚚");
  assert.equal(result.components["demo.orders"].owner, "Commerce");
  assert.equal(result.mapping.orders, "demo.orders");
  const delivery = result.mapping.delivery;
  assert.match(delivery, /^shopflow\.n_[a-f0-9]{12}$/);
  assert.equal(result.components[delivery].drawio.cellId, "delivery");
  assert.deepEqual(result.components["demo.orders"].drawio.geometry, {
    x: "10",
    y: "20",
    width: "180",
    height: "80",
    as: "geometry",
  });
  assert.equal(result.components["demo.orders"].links[0].id, delivery);
  assert.equal(result.components["demo.orders"].links[0].direction, "-->");
  assert.equal(
    result.components["demo.orders"].links[0].drawio.cellId,
    "calls-delivery",
  );
  assert.equal(Object.keys(result.components).length, 2);
  assert.equal(
    importDrawio(xml.replace('value="Delivery"', 'value="Renamed Delivery"'), {
      namespace: "shopflow",
    }).mapping.delivery,
    delivery,
  );
});

test("reads compressed Unicode pages and selects a page explicitly", () => {
  const source = `<mxfile><diagram id="services" name="Services">${compress(graph)}</diagram>${page2}</mxfile>`;
  const result = importDrawio(source);
  assert.equal(result.components["demo.orders"].title, "Orders & café 🚚");
  assert.equal(result.pages[0].compressed, true);
  const second = importDrawio(source, {
    pageId: "storage",
    namespace: "sf",
    owner: "Data",
  });
  const db = second.components[second.mapping.db];
  assert.equal(db.title, "База данных");
  assert.equal(db.entity, "database");
  assert.equal(db.owner, "Data");
  assert.throws(
    () => importDrawio(source, { pageId: "missing" }),
    /Unknown draw.io page/,
  );
});

test("unchanged imports return byte-for-byte identical XML, including both pages", () => {
  assert.equal(exportDrawio(importDrawio(xml).model, { sourceXml: xml }), xml);
  const compressed = wrap(compress(graph));
  assert.equal(
    updateDrawio(compressed, importDrawio(compressed).model),
    compressed,
  );
});

test("edits preserve unknown attributes, cells, styles, edge IDs, waypoints and other pages", () => {
  const result = importDrawio(xml);
  result.components["demo.orders"].title = 'Orders $& $1 <priority> & "quoted"';
  result.components["demo.orders"].owner = "Commerce + Logistics";
  result.components["demo.orders"].links[0].title = "Reserve delivery 🚚";
  const output = updateDrawio(xml, result.model);
  assert.equal(
    importDrawio(output).components["demo.orders"].title,
    'Orders $& $1 <priority> & "quoted"',
  );
  assert.equal(
    importDrawio(output).components["demo.orders"].owner,
    "Commerce + Logistics",
  );
  assert.ok(output.includes('custom="retain-me"'));
  assert.ok(output.includes('style="rounded=1;html=0;unknown=42;"'));
  assert.ok(output.includes('<mxPoint x="240" y="60"/>'));
  assert.ok(output.includes('id="calls-delivery"'));
  assert.ok(output.includes('value="Reserve delivery 🚚"'));
  assert.ok(
    output.includes(
      '<custom:extension xmlns:custom="urn:example" data="unchanged"/>',
    ),
  );
  assert.ok(output.includes('id="decoration" value="Background annotation"'));
  assert.ok(output.includes(page2));
  assert.equal(validateDrawio(output).valid, true);
});

test("compressed edits retain compression and the complete second page", () => {
  const source = `<mxfile><diagram id="services" name="Services">${compress(graph)}</diagram>${page2}</mxfile>`;
  const result = importDrawio(source);
  result.components["demo.orders"].title = "Заказы 🚚";
  const output = updateDrawio(source, result.model);
  const payload =
    /<diagram id="services" name="Services">([^<]+)<\/diagram>/.exec(output)[1];
  const inflated = decodeURIComponent(
    inflateRawSync(Buffer.from(payload, "base64")).toString(),
  );
  assert.ok(inflated.includes('label="Заказы 🚚"'));
  assert.ok(inflated.includes('<mxPoint x="240" y="60"/>'));
  assert.ok(output.includes(page2));
  assert.equal(importDrawio(output).pages[0].compressed, true);
});

test("fresh exports are valid XML and roundtrip literal labels, IDs and parallel edges", () => {
  const source = {
    components: {
      "sf.orders": {
        title: 'Orders <priority> & "quotes" 🚚',
        entity: "component",
        owner: "Commerce",
        links: [
          { id: "sf.delivery", title: "Create & reserve" },
          { id: "sf.delivery", title: "Cancel <shipment>" },
        ],
      },
      "sf.delivery": {
        title: "Delivery",
        entity: "component",
        owner: "Logistics",
      },
    },
  };
  const output = exportDrawio(source, { name: "ShopFlow & Logistics" });
  const result = importDrawio(output);
  assert.equal(validateDrawio(output).valid, true);
  assert.equal(result.pages[0].name, "ShopFlow & Logistics");
  assert.equal(
    result.components["sf.orders"].title,
    source.components["sf.orders"].title,
  );
  assert.equal(result.components["sf.orders"].links.length, 2);
  assert.deepEqual(
    result.components["sf.orders"].links.map((l) => l.title),
    ["Create & reserve", "Cancel <shipment>"],
  );
  const imported = importDrawio(xml);
  const fresh = exportDrawio(imported.model);
  assert.equal(importDrawio(fresh).mapping.orders, "demo.orders");
  assert.equal(
    importDrawio(fresh).components["demo.orders"].links[0].drawio.cellId,
    "calls-delivery",
  );
  assert.equal(
    importDrawio(fresh).components["demo.orders"].drawio.geometry.x,
    "10",
  );
});

test("adds and removes components with explicit deletion opt-in", () => {
  const imported = importDrawio(xml);
  imported.components["sf.inventory"] = {
    title: "Inventory",
    owner: "Warehouse",
    links: [{ id: "demo.orders", title: "Stock reserved" }],
  };
  let output = updateDrawio(xml, imported.model);
  let parsed = importDrawio(output);
  assert.equal(parsed.components["sf.inventory"].links[0].id, "demo.orders");
  delete parsed.components["sf.inventory"];
  assert.ok(
    importDrawio(updateDrawio(output, parsed.model)).components["sf.inventory"],
  );
  output = updateDrawio(output, parsed.model, { removeMissing: true });
  assert.equal(importDrawio(output).components["sf.inventory"], undefined);
  assert.ok(output.includes('id="decoration"'));
});

test("retains unrecognised and dangling edges instead of silently destroying them", () => {
  const source = wrap(
    graph.replace(
      "</root>",
      '<mxCell id="dangling" edge="1" source="orders" target="external" parent="1"/></root>',
    ),
  );
  const parsed = importDrawio(source);
  assert.equal(parsed.warnings.length, 2);
  assert.ok(parsed.warnings.some((w) => /dangling/.test(w)));
  assert.ok(parsed.warnings.some((w) => /decoration/.test(w)));
  assert.deepEqual(
    parsed.unmapped.map((x) => [x.cellId, x.reason]),
    [
      ["decoration", "unsupported-cell"],
      ["dangling", "missing-endpoint"],
    ],
  );
  parsed.components["demo.orders"].owner = "Operations";
  const output = updateDrawio(source, parsed.model, { removeMissing: true });
  assert.ok(
    output.includes(
      '<mxCell id="dangling" edge="1" source="orders" target="external" parent="1"/>',
    ),
  );
});

test("unmapped decorations are reported while root, layers and grouping containers remain structural", () => {
  const source = wrap(
    '<mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="layer2" parent="0"/><mxCell id="grouping" parent="1" style="group"/><mxCell id="container" parent="1" style="container=1;"/><mxCell id="opaque" value="Annotation" parent="1" custom="true"/></root></mxGraphModel>',
  );
  const parsed = importDrawio(source);
  assert.equal(Object.keys(parsed.components).length, 0);
  assert.deepEqual(
    parsed.unmapped.map((x) => x.cellId),
    ["opaque"],
  );
  assert.equal(parsed.warnings.length, 1);
  assert.equal(parsed.unmapped[0].label, "Annotation");
  assert.equal(parsed.sourceXml, source);
});

test("handles HTML labels without executing markup or corrupting literal text", () => {
  const source = wrap(
    graph
      .replace(
        'value="Delivery"',
        'value="&lt;b&gt;Delivery&lt;/b&gt;&lt;br&gt;Logistics &amp;amp; Ops"',
      )
      .replace('rounded=1;html=0;"', 'rounded=1;html=1;"'),
  );
  const parsed = importDrawio(source);
  const delivery = parsed.mapping.delivery;
  assert.equal(parsed.components[delivery].title, "Delivery\nLogistics & Ops");
  parsed.components[delivery].title = "<script>alert(1)</script> & plain";
  const output = updateDrawio(source, parsed.model);
  assert.equal(
    importDrawio(output).components[delivery].title,
    "<script>alert(1)</script> & plain",
  );
  assert.ok(!output.includes("<script>"));
});

test("updates layout and styles without duplicate opening-tag edits", () => {
  const parsed = importDrawio(xml),
    id = parsed.mapping.delivery;
  parsed.components[id].title = "Moved";
  parsed.components[id].drawio.style = "rounded=0;html=1;newStyle=1;";
  parsed.components[id].drawio.geometry.x = "777";
  parsed.components["demo.orders"].links[0].drawio.style =
    "endArrow=open;html=0;";
  const output = updateDrawio(xml, parsed.model),
    result = importDrawio(output);
  assert.equal(result.components[id].title, "Moved");
  assert.equal(result.components[id].drawio.geometry.x, "777");
  assert.equal(
    result.components[id].drawio.style,
    "rounded=0;html=1;newStyle=1;",
  );
  assert.equal(
    result.components["demo.orders"].links[0].drawio.style,
    "endArrow=open;html=0;",
  );
  assert.ok(output.includes('<mxPoint x="240" y="60"/>'));
});

test("supports raw mxGraphModel, escaped XML and an empty self-closing root", () => {
  assert.equal(importDrawio(graph).pageId, "page-1");
  const escaped = graph
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
  assert.equal(
    importDrawio(wrap(escaped)).components["demo.orders"].title,
    "Orders & café 🚚",
  );
  const empty = "<mxGraphModel><root/></mxGraphModel>";
  const output = updateDrawio(empty, { "sf.new": { title: "New" } });
  assert.equal(importDrawio(output).components["sf.new"].title, "New");
});

test("rejects DTD, entity expansion, malformed XML and illegal character references", () => {
  for (const source of [
    '<!DOCTYPE mxfile SYSTEM "file:///secret"><mxfile/>',
    '<!DOCTYPE mxfile [<!ENTITY x "expansion">]><mxfile>&x;</mxfile>',
    wrap(graph.replace("Delivery", "&external;")),
    wrap(graph.replace("Delivery", "&#0;")),
    wrap(graph.replace("Delivery", "&#xD800;")),
    wrap(graph.replace("Delivery", "bare & invalid")),
    "<mxfile><diagram></mxfile>",
    "<mxGraphModel><root/></mxGraphModel><mxGraphModel><root/></mxGraphModel>",
    "<mxGraphModel/>",
    wrap(graph.replace("Delivery", "\u0001")),
  ])
    assert.throws(
      () => validateDrawio(source),
      /forbidden|Invalid|entity|XML|root/i,
    );
});

test("rejects duplicate IDs, invalid explicit SEAF IDs and malformed compression", () => {
  assert.throws(
    () => importDrawio(wrap(graph.replace('id="delivery"', 'id="orders"'))),
    /Duplicate mxCell id/,
  );
  assert.throws(
    () => validateDrawio(graph.replace('id="delivery"', 'id="orders"')),
    /Duplicate mxCell id/,
  );
  assert.throws(
    () => importDrawio(xml.replace('id="storage"', 'id="services"')),
    /Duplicate page id/,
  );
  assert.throws(
    () => importDrawio(wrap(graph.replace("demo.orders", "invalid id"))),
    /Invalid explicit SEAF id/,
  );
  assert.throws(() => importDrawio(wrap("not-base64!")), /encoding/);
  assert.throws(() => importDrawio(wrap("YWJjZA==")), /decompress/);
  assert.throws(
    () => importDrawio(wrap(compress(graph) + "=ignored")),
    /encoding/,
  );
  const trailing = Buffer.concat([
    deflateRawSync(Buffer.from(encodeURIComponent(graph))),
    Buffer.from("trailing"),
  ]).toString("base64");
  assert.throws(() => importDrawio(wrap(trailing)), /Trailing compressed data/);
  assert.throws(
    () => importDrawio(xml, { namespace: "bad namespace" }),
    /namespace/,
  );
  assert.throws(
    () => exportDrawio({ "bad id": { title: "Invalid" } }),
    /Invalid SEAF id/,
  );
});

test("enforces compressed expansion, input, nesting, cell and aggregate page limits", () => {
  assert.throws(
    () => validateDrawio(xml, { limits: { inputBytes: 64 } }),
    /size limit/,
  );
  const bomb = wrap(
    compress(
      "<mxGraphModel><root>" + " ".repeat(3000) + "</root></mxGraphModel>",
    ),
  );
  assert.throws(
    () => validateDrawio(bomb, { limits: { inflatedBytes: 1000 } }),
    /decompress|size limit|larger than/i,
  );
  assert.throws(
    () => validateDrawio(xml, { limits: { cells: 2 } }),
    /Too many cells/,
  );
  assert.throws(() => validateDrawio(xml, { limits: { pages: 1 } }), /pages/);
  const nested =
    "<mxGraphModel><root>" +
    "<group>".repeat(20) +
    "</group>".repeat(20) +
    "</root></mxGraphModel>";
  assert.throws(
    () => validateDrawio(nested, { limits: { depth: 10 } }),
    /nesting/,
  );
  const large = otherGraph.replace("</root>", "A".repeat(4000) + "</root>");
  const first = compress(large),
    many = `<mxfile><diagram id="a">${first}</diagram><diagram id="b">${first}</diagram></mxfile>`;
  assert.throws(
    () =>
      validateDrawio(many, {
        limits: { inflatedBytes: Buffer.byteLength(large) + 1000 },
      }),
    /Expanded.*size limit/,
  );
});

test("IDs that match Object prototype members remain ordinary data", () => {
  const source = wrap(graph.replace("demo.orders", "__proto__"));
  const result = importDrawio(source);
  assert.equal(result.components.__proto__.title, "Orders & café 🚚");
  assert.equal(Object.getPrototypeOf(result.components), null);
  assert.equal(
    importDrawio(exportDrawio(result.model)).components.__proto__.owner,
    "Commerce",
  );
});

test("full component and link properties preserve trust annotations and unknown nested JSON data", () => {
  const original = {
    components: {
      "acme.orders": {
        title: "Заказы 🚚",
        entity: "component",
        kind: "microservice",
        owner: "Commerce",
        trustZone: "internal",
        dataClassification: "confidential",
        technologies: ["NodeJS", "PostgreSQL"],
        custom: {
          retention: { days: 30, enabled: true },
          tags: ["a", "b"],
          nullable: null,
        },
        links: [
          {
            id: "acme.delivery",
            title: "Order → Delivery",
            direction: "-->",
            protocol: "HTTPS",
            encrypted: true,
            dataClassification: "confidential",
            custom: {
              authentication: { type: "mTLS", version: 2 },
              audit: true,
            },
          },
        ],
      },
      "acme.delivery": {
        title: "Delivery",
        entity: "component",
        owner: "Logistics",
        trustZone: "partner",
      },
    },
  };
  const output = exportDrawio(original),
    parsed = importDrawio(output),
    orders = parsed.components["acme.orders"],
    link = orders.links[0];
  assert.ok(output.includes('seafProperties="'));
  for (const key of [
    "trustZone",
    "dataClassification",
    "technologies",
    "custom",
  ])
    assert.deepEqual(orders[key], original.components["acme.orders"][key]);
  for (const key of [
    "protocol",
    "encrypted",
    "dataClassification",
    "custom",
    "direction",
  ])
    assert.deepEqual(
      link[key],
      original.components["acme.orders"].links[0][key],
    );
  assert.equal(link.id, "acme.delivery");
  assert.equal(link.title, "Order → Delivery");
  assert.equal(
    updateDrawio(output, parsed.model),
    output,
    "No-op must retain original metadata and XML bytes",
  );
});

test("custom-only changes update metadata instead of returning an incorrect no-op", () => {
  const parsed = importDrawio(xml),
    id = parsed.mapping.delivery;
  parsed.components["demo.orders"].trustZone = "internal";
  parsed.components["demo.orders"].custom = {
    retentionDays: 30,
    obsolete: "remove",
  };
  parsed.components[id].trustZone = "partner";
  Object.assign(parsed.components["demo.orders"].links[0], {
    encrypted: true,
    protocol: "HTTPS",
    dataClassification: "confidential",
    custom: { audit: true },
  });
  const first = updateDrawio(xml, parsed.model),
    next = importDrawio(first);
  next.components["demo.orders"].custom.retentionDays = 90;
  delete next.components["demo.orders"].custom.obsolete;
  next.components["demo.orders"].links[0].encrypted = false;
  next.components["demo.orders"].links[0].protocol = "HTTP";
  const second = updateDrawio(first, next.model),
    result = importDrawio(second),
    link = result.components["demo.orders"].links[0];
  assert.notEqual(second, first);
  assert.deepEqual(result.components["demo.orders"].custom, {
    retentionDays: 90,
  });
  assert.equal(link.encrypted, false);
  assert.equal(link.protocol, "HTTP");
  assert.equal(link.dataClassification, "confidential");
  assert.deepEqual(link.custom, { audit: true });
  assert.ok(second.includes('id="calls-delivery"'));
  assert.ok(second.includes('<mxPoint x="240" y="60"/>'));
  assert.ok(second.includes(page2));
  assert.equal(updateDrawio(second, result.model), second);
});

test("visual IDs and titles take precedence over metadata while custom link semantics remain", () => {
  const original = {
    components: {
      "acme.orders": {
        title: "Orders",
        owner: "Commerce",
        custom: { source: "imported" },
        links: [
          {
            id: "acme.delivery",
            title: "Ship",
            encrypted: true,
            protocol: "HTTPS",
          },
        ],
      },
      "acme.delivery": { title: "Delivery" },
    },
  };
  const output = exportDrawio(original)
    .replace('label="Orders"', 'label="Edited in draw.io"')
    .replace('seafId="acme.orders"', 'seafId="acme.renamed"')
    .replace('value="Ship"', 'value="Edited relation"');
  const result = importDrawio(output);
  assert.equal(result.components["acme.orders"], undefined);
  assert.equal(result.components["acme.renamed"].title, "Edited in draw.io");
  assert.deepEqual(result.components["acme.renamed"].custom, {
    source: "imported",
  });
  const link = result.components["acme.renamed"].links[0];
  assert.equal(link.id, "acme.delivery");
  assert.equal(link.title, "Edited relation");
  assert.equal(link.encrypted, true);
  assert.equal(link.protocol, "HTTPS");
});

test("compressed metadata roundtrip retains classifications, explicit false and parallel-flow properties", () => {
  const original = {
    components: {
      "acme.orders": {
        title: "Orders",
        trustZone: "internal",
        links: [
          {
            id: "acme.delivery",
            title: "Reserve",
            encrypted: true,
            protocol: "HTTPS",
            dataClassification: "confidential",
          },
          {
            id: "acme.delivery",
            title: "Cancel",
            encrypted: false,
            protocol: "HTTP",
            dataClassification: "public",
          },
        ],
      },
      "acme.delivery": { title: "Delivery", owner: "" },
    },
  };
  const plain = exportDrawio(original),
    source = plain.replace(/<mxGraphModel>[\s\S]*<\/mxGraphModel>/, (match) =>
      compress(match),
    ),
    parsed = importDrawio(source, { owner: "Fallback" });
  assert.equal(parsed.components["acme.delivery"].owner, "");
  assert.equal(parsed.components["acme.orders"].links[0].encrypted, true);
  assert.equal(parsed.components["acme.orders"].links[1].encrypted, false);
  parsed.components["acme.orders"].links[1].encrypted = true;
  parsed.components["acme.orders"].links[1].protocol = "HTTPS";
  const result = importDrawio(updateDrawio(source, parsed.model));
  assert.equal(result.pages[0].compressed, true);
  assert.equal(
    result.components["acme.orders"].links[0].dataClassification,
    "confidential",
  );
  assert.equal(
    result.components["acme.orders"].links[1].dataClassification,
    "public",
  );
  assert.equal(result.components["acme.orders"].links[1].protocol, "HTTPS");
});

test("metadata rejects prototype keys, hidden graph mutations, invalid JSON, depth and size bombs", () => {
  const escape = (value) =>
    value
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  const nodeMetadata = (value) =>
    wrap(
      graph.replace(
        '<object id="orders"',
        '<object seafProperties="' + escape(value) + '" id="orders"',
      ),
    );
  const inputs = [
    '{"__proto__":{"polluted":true}}',
    '{"nested":{"constructor":{"prototype":{"polluted":true}}}}',
    '{"nested":{"prototype":1}}',
    '{"links":[]}',
    '{"drawio":{"cellId":"forged"}}',
    "[]",
    "null",
    '{"broken":',
    '{"number":1e309}',
    '{"huge":"' + "x".repeat(65536) + '"}',
  ];
  let deep = { value: true };
  for (let i = 0; i < 26; i++) deep = { nested: deep };
  inputs.push(JSON.stringify(deep));
  for (const value of inputs) {
    assert.throws(
      () => importDrawio(nodeMetadata(value)),
      /SEAF propert|Unexpected SEAF/i,
    );
    assert.throws(
      () => validateDrawio(nodeMetadata(value)),
      /SEAF propert|Unexpected SEAF/i,
    );
  }
  const hiddenTarget = wrap(
    graph.replace(
      'id="calls-delivery"',
      'id="calls-delivery" seafProperties="' +
        escape('{"id":"acme.secret"}') +
        '"',
    ),
  );
  assert.throws(
    () => importDrawio(hiddenTarget),
    /Unexpected SEAF link property/,
  );
  assert.equal(Object.prototype.polluted, undefined);
});

test("export refuses lossy or unsafe custom values instead of silently dropping annotations", () => {
  const poison = JSON.parse(
    '{"title":"Unsafe","custom":{"__proto__":{"polluted":true}}}',
  );
  assert.throws(
    () => exportDrawio({ "acme.bad": poison }),
    /Reserved SEAF property/,
  );
  const cyclic = {};
  cyclic.self = cyclic;
  for (const custom of [
    cyclic,
    new Date(),
    { notJson: undefined },
    { notJson: 1n },
    { notJson: Infinity },
    new Array(5),
  ])
    assert.throws(
      () => exportDrawio({ "acme.bad": { title: "Unsafe", custom } }),
      /SEAF propert|Cyclic/,
    );
  assert.throws(
    () => exportDrawio({ "acme.bad": { title: "Unsafe", owner: null } }),
    /owner must be a string/,
  );
});

test("declared properties distinguish legacy XML facts from defaults and preserve explicit metadata identity", () => {
  const legacy = wrap(graph.replace(' seafOwner="Commerce"', ""));
  const component = importDrawio(legacy, { owner: "Architecture Team" })
    .components["demo.orders"];
  assert.deepEqual(component.drawio.declaredProperties, ["title"]);
  assert.equal(component.owner, "Architecture Team");
  assert.equal(component.kind, "system");
  assert.equal(component.description, "Imported from draw.io");
  const original = {
    title: "Old title",
    kind: "microservice",
    owner: "Commerce",
    description: "Actual responsibility",
    trustZone: "internal",
  };
  const explicit = Object.fromEntries(
    component.drawio.declaredProperties.map((key) => [key, component[key]]),
  );
  const merged = { ...original, ...explicit };
  assert.equal(merged.kind, "microservice");
  assert.equal(merged.owner, "Commerce");
  assert.equal(merged.description, "Actual responsibility");
  assert.equal(merged.trustZone, "internal");
  const metadata = importDrawio(exportDrawio({ "acme.orders": original }))
    .components["acme.orders"];
  for (const property of ["title", "kind", "owner", "description", "trustZone"])
    assert.ok(metadata.drawio.declaredProperties.includes(property));
  const blank = importDrawio(
    wrap(graph.replace('seafOwner="Commerce"', 'seafOwner=""')),
    { owner: "Architecture Team" },
  ).components["demo.orders"];
  assert.ok(blank.drawio.declaredProperties.includes("owner"));
  assert.equal(blank.owner, "");
});
