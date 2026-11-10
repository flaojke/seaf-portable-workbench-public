import test from "node:test";
import assert from "node:assert/strict";
import {
  searchModel,
  catalogRows,
  normalizeCatalog,
  normalizePreferences,
  rememberRecent,
  toggleFavorite,
  routeQuery,
  parseRoute,
  editHistory,
  recordEdit,
  moveEdit,
  schemaIssues,
  passportFromModel,
  normalizeValidationIssues,
  fallbackScenarios,
  modelLinks,
  walkthroughSvg,
} from "../public/ux-tools.js";
import { renderFields, renderLinks } from "../public/editor-fields.js";
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ],
  );
const model = {
  components: {
    "demo.orders": {
      title: "Order Service",
      owner: "Commerce",
      links: [
        { id: "demo.delivery", title: "Dispatch order", protocol: "REST" },
      ],
    },
    "demo.delivery": {
      title: "Delivery Service",
      owner: "Logistics",
      description: "Доставка заказа",
      custom: { retain: true },
    },
    empty: null,
  },
  contexts: {
    all: {
      title: "All services",
      components: ["demo.orders", "demo.delivery"],
    },
  },
  docs: {
    checkout: {
      title: "Оформление заказа",
      source: "docs/checkout.md",
      description: "Delivery walkthrough",
    },
  },
};

test("unified search matches all sections, identifiers, owners and descriptions", () => {
  assert.ok(
    searchModel(model, "logistics").results.some(
      (r) => r.id === "demo.delivery",
    ),
  );
  assert.ok(
    searchModel(model, "доставка").results.some(
      (r) => r.id === "demo.delivery",
    ),
  );
  assert.ok(
    searchModel(model, "delivery").results.some(
      (r) => r.section === "docs" && r.id === "checkout",
    ),
  );
  assert.equal(searchModel(model, "никакихсовпадений").total, 0);
  assert.ok(searchModel(model, "").results.length > 0);
  assert.deepEqual(model.components["demo.delivery"].custom, { retain: true });
});
test("complete catalog reaches the last of 1501 objects and sorts before pagination", () => {
  const large = {
    systems: Object.fromEntries(
      Array.from({ length: 1501 }, (_, i) => [
        "system." + i,
        {
          title: "Система " + i,
          owner: i % 2 ? "A" : "B",
          domain: i % 3 ? "Retail" : "Core",
          status: i % 5 ? "active" : "planned",
        },
      ]),
    ),
  };
  const last = catalogRows(large, "systems", "", {
    page: 30,
    pageSize: 50,
    sort: "id",
  });
  assert.equal(last.total, 1501);
  assert.equal(last.pages, 31);
  assert.equal(last.rows.length, 1);
  assert.equal(last.rows[0].id, "system.1500");
  const filtered = catalogRows(large, "systems", "", {
    owner: "A",
    domain: "Core",
    status: "active",
    pageSize: 25,
    sort: "title",
    direction: "desc",
  });
  assert.ok(filtered.total > 25);
  assert.equal(filtered.rows.length, 25);
  assert.ok(
    filtered.filtered.every(
      (r) => r.owner === "A" && r.domain === "Core" && r.status === "active",
    ),
  );
  assert.equal(
    catalogRows(large, "systems", "system.1500").rows[0].id,
    "system.1500",
  );
  assert.equal(catalogRows(large, "systems", "", { page: 999999 }).page, 30);
});
test("saved navigation preferences and favorites are bounded and do not mutate their input", () => {
  const base = normalizePreferences();
  const p = toggleFavorite(base, {
    section: "components",
    id: "demo.delivery",
    title: "Delivery",
  });
  assert.equal(base.favorites.length, 0);
  assert.equal(p.favorites.length, 1);
  const removed = toggleFavorite(p, {
    section: "components",
    id: "demo.delivery",
  });
  assert.equal(removed.favorites.length, 0);
  const recent = rememberRecent(
    rememberRecent(base, { section: "components", id: "demo.delivery" }),
    { section: "components", id: "demo.delivery" },
  );
  assert.equal(recent.recent.length, 1);
  assert.equal(
    normalizePreferences({ favorites: [{ section: "__proto__", id: "x" }] })
      .favorites.length,
    0,
  );
  assert.equal(
    normalizeCatalog({ pageSize: 99999, sort: "unknown" }).pageSize,
    50,
  );
});
test("precise links round-trip project, entity, filters and columns without executing URL content", () => {
  const state = {
    project: "shop flow",
    view: "passport",
    section: "kadzo.v2023.systems",
    editId: "demo.a&x=1",
    filter: "почта + CRM",
    catalog: {
      owner: "A&B",
      domain: "Core",
      status: "active",
      sort: "owner",
      direction: "desc",
      page: 3,
      pageSize: 25,
      columns: ["id", "owner", "domain"],
    },
  };
  const query = routeQuery(state),
    restored = parseRoute(query);
  assert.equal(restored.project, state.project);
  assert.equal(restored.id, state.editId);
  assert.equal(restored.filter, state.filter);
  assert.equal(restored.catalog.owner, "A&B");
  assert.equal(restored.catalog.page, 3);
  assert.deepEqual(restored.catalog.columns, ["id", "owner", "domain"]);
  assert.equal(parseRoute("/?view=javascript:evil").view, undefined);
});
test("local undo/redo preserves complete input including invalid JSON and discards the redo branch", () => {
  const a = {
      section: "components",
      editId: "demo.delivery",
      editorValue: '{"owner":"Logistics"}',
      editorMode: "merge",
      selected: [],
    },
    b = { ...a, editorValue: '{"owner":' };
  const h = editHistory(a);
  recordEdit(h, b);
  assert.equal(moveEdit(h, -1).editorValue, a.editorValue);
  assert.equal(moveEdit(h, 1).editorValue, b.editorValue);
  moveEdit(h, -1);
  recordEdit(h, { ...a, editorValue: '{"owner":"Platform"}' });
  assert.equal(h.items.length, 2);
  assert.equal(h.index, 1);
  for (let i = 0; i < 100; i++) recordEdit(h, { ...a, editorValue: String(i) });
  assert.equal(h.items.length, 80);
});
test("read-only passport includes declared links, references and source evidence", () => {
  const p = passportFromModel(model, "components", "demo.delivery", {
    "components/demo.delivery": "systems/delivery.yaml",
  });
  assert.equal(p.value.owner, "Logistics");
  assert.equal(p.incoming[0].from, "demo.orders");
  assert.equal(p.incoming[0].protocol, "REST");
  assert.ok(
    p.references.some((r) => r.section === "contexts" && r.id === "all"),
  );
  assert.equal(p.source.path, "systems/delivery.yaml");
  assert.equal(p.outgoing.length, 0);
  assert.equal(passportFromModel(model, "components", "absent"), null);
});
test("validation issues resolve explicit model locations and keep unresolvable custom issues honest", () => {
  const issues = normalizeValidationIssues(
    [
      {
        id: "owner-rule",
        items: [
          {
            description: "Укажите владельца",
            location:
              "/entities/components/blank?dh-component-id=demo.delivery",
            property: "owner",
          },
        ],
      },
      { description: "Пользовательское правило без идентификатора" },
    ],
    model,
  );
  assert.equal(issues[0].id, "demo.delivery");
  assert.equal(issues[0].section, "components");
  assert.equal(issues[0].field, "owner");
  assert.equal(issues[0].rule, "owner-rule");
  assert.equal(issues[1].id, null);
  const created = normalizeValidationIssues(
    [{ description: "owner is required" }],
    model,
    { operations: [{ section: "components", id: "demo.new", mode: "create" }] },
  );
  assert.equal(created[0].id, "demo.new");
});
test("declared scenario and manually selected links retain source information", () => {
  const declared = fallbackScenarios({
    ...model,
    "seaf.workbench.scenarios": {
      order: {
        title: "Order",
        steps: [
          {
            from: "demo.orders",
            to: "demo.delivery",
            label: "Deliver",
            data: "order",
            error: "Timeout",
          },
        ],
      },
    },
  });
  assert.equal(declared[0].steps[0].error, "Timeout");
  const links = modelLinks(model);
  assert.equal(links.length, 1);
  assert.equal(links[0].to, "demo.delivery");
  assert.equal(links[0].protocol, "REST");
});
test("accessible fields preserve unknown properties and escape untrusted labels and values", () => {
  const value = {
      title: "<img src=x onerror=evil()>",
      owner: "",
      custom: { retain: true },
    },
    before = JSON.stringify(value);
  const fields = [
    { name: "title", title: "Название", type: "string", required: true },
    {
      name: "owner",
      title: "Владелец",
      type: "string",
      required: true,
      description: "Команда <script>unsafe</script>",
    },
  ];
  const issues = schemaIssues(value, fields);
  assert.deepEqual(
    issues.map((i) => i.field),
    ["owner"],
  );
  const html = renderFields(
    {
      editorMode: "merge",
      selected: new Set(),
      editorValue: JSON.stringify(value),
      editorSchema: { fields },
      fieldIssues: issues,
    },
    esc,
  );
  assert.match(html, /label for="editor-field-owner"/);
  assert.match(html, /required aria-required="true"/);
  assert.match(html, /aria-invalid="true"/);
  assert.ok(!html.includes("<script>"));
  assert.ok(html.includes("&lt;img"));
  assert.equal(JSON.stringify(value), before);
});
test("walkthrough SVG and flow controls escape data and handle malformed component entries", () => {
  const svg = walkthroughSvg(
    {
      components: {
        x: { title: "<script>x</script>" },
        y: { title: "Target" },
      },
    },
    [{ from: "x", to: "y", label: "<img>" }],
    0,
    esc,
  );
  assert.ok(!svg.includes("<script>"));
  assert.ok(svg.includes("&lt;script&gt;"));
  assert.match(svg, /role="img"/);
  const html = renderLinks(
    { model, projects: [{ id: "p", writable: true }], project: "p" },
    esc,
  );
  assert.match(html, /demo.orders/);
  assert.match(html, /Dispatch order/);
});
