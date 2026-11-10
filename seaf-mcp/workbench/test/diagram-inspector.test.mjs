import test from "node:test";
import assert from "node:assert/strict";
import {
  copy,
  escapeHtml,
  jsonText,
  parseObject,
  removedProperties,
  entityOperation,
  linkOperation,
  readField,
  inspectorFields,
  sameReference,
  relationForBinding,
  bindingForRelation,
  cameraFit,
  cameraZoom,
  operationCaption,
  impactsMarkup,
  modelLinkDirection,
  storedLinkDirection,
  compatibleRelationAdapters,
} from "../public/diagram-inspector.js";
import {
  composerDraftChanged,
  composerApplied,
  renderLocalDiagram,
  composerPanel,
} from "../public/diagram-composer.js";

const input = (name, value, type = "string") => ({
  dataset: { inspectorField: name, fieldType: type },
  tagName: "INPUT",
  value,
});
const select = (name, value, extra = {}) => ({
  ...input(name, value),
  tagName: "SELECT",
  ...extra,
});
const entity = {
  section: "components",
  id: "example.orders",
  beforeHash: "backend-issued-entity-hash",
  value: {
    title: "Orders",
    owner: "Commerce",
    custom: { retained: { source: "legacy", enabled: false }, obsolete: true },
    nullable: null,
    zero: 0,
  },
};

test("inspector JSON keeps arbitrary object values and rejects incomplete or scalar definitions", () => {
  assert.deepEqual(parseObject(jsonText(entity.value)), entity.value);
  for (const value of ['{"owner":', "null", "[]", '"text"', "42", "true"]) {
    assert.throws(() => parseObject(value));
  }
  const cloned = copy(entity.value);
  cloned.custom.retained.source = "changed";
  assert.equal(entity.value.custom.retained.source, "legacy");
});

test("typed dictionary choices preserve false, zero, objects and unrelated nested properties", () => {
  const object = { owner: "Commerce", custom: { keep: [0, false, null] } };
  const changed = readField(select("owner", '"Logistics"'), object);
  assert.equal(changed.owner, "Logistics");
  assert.deepEqual(changed.custom, object.custom);
  assert.notEqual(changed.custom, object.custom);
  assert.equal(object.owner, "Commerce");
  assert.equal(readField(select("enabled", "false"), object).enabled, false);
  assert.equal(readField(select("weight", "0"), object).weight, 0);
  assert.deepEqual(
    readField(select("reference", '{"id":"org.logistics"}'), object).reference,
    {
      id: "org.logistics",
    },
  );
  const multi = readField(
    select("choices", "", {
      multiple: true,
      selectedOptions: [
        { value: "" },
        { value: '"A"' },
        { value: "false" },
        { value: "0" },
      ],
    }),
    object,
  );
  assert.deepEqual(multi.choices, ["A", false, 0]);
});

test("field removal is deliberate while text and numeric types retain meaningful empty or zero values", () => {
  assert.equal(
    readField(input("description", ""), { description: "Before" }).description,
    "",
  );
  assert.equal(
    Object.hasOwn(
      readField(select("owner", ""), { owner: "Commerce" }),
      "owner",
    ),
    false,
  );
  assert.equal(
    Object.hasOwn(readField(input("rto", "   ", "number"), { rto: 2 }), "rto"),
    false,
  );
  assert.equal(readField(input("rto", "0", "integer"), {}).rto, 0);
  assert.equal(readField(input("sla", "99.9", "number"), {}).sla, 99.9);
  for (const [value, type] of [
    ["1.5", "integer"],
    ["Infinity", "number"],
    ["not a number", "number"],
  ]) {
    assert.throws(() => readField(input("rto", value, type), {}));
  }
  for (const name of ["__proto__", "prototype", "constructor", ""]) {
    assert.throws(() => readField(input(name, "invalid"), {}));
  }
});

test("explicit property removals use escaped JSON pointers and do not remove array members or null values", () => {
  const before = {
    owner: "Commerce",
    "external/id": "old",
    custom: { "legacy~key": true, retained: false },
    list: ["A", "B"],
    nullable: { old: true },
  };
  const after = { custom: { retained: false }, list: ["B"], nullable: null };
  assert.deepEqual(removedProperties(before, after), [
    "/owner",
    "/external~1id",
    "/custom/legacy~0key",
  ]);
  assert.deepEqual(
    removedProperties({ a: { b: true } }, { a: { b: true } }),
    [],
  );
});

test("entity patch carries the backend hash and complete unknown properties without mutating the source", () => {
  const source = copy(entity),
    value = copy(entity.value);
  value.owner = "Logistics";
  delete value.custom.obsolete;
  const operation = entityOperation(entity, jsonText(value));
  assert.deepEqual(operation, {
    kind: "entity",
    mode: "patch",
    section: "components",
    id: "example.orders",
    beforeHash: "backend-issued-entity-hash",
    value,
    removeProperties: ["/custom/obsolete"],
  });
  assert.deepEqual(entity, source);
  assert.equal(operation.value.custom.retained.enabled, false);
  assert.equal(operation.value.zero, 0);
  assert.equal(operation.value.nullable, null);
  assert.throws(
    () =>
      entityOperation({ ...entity, beforeHash: undefined }, jsonText(value)),
    /отпечатка/,
  );
});

test("entity create and delete are explicit intents and never invent a concurrency hash", () => {
  const created = entityOperation(
    { section: "systems", id: "custom.system" },
    '{"title":"New"}',
    "create",
  );
  assert.deepEqual(created, {
    kind: "entity",
    mode: "create",
    section: "systems",
    id: "custom.system",
    value: { title: "New" },
  });
  assert.equal(Object.hasOwn(created, "beforeHash"), false);
  const deleted = entityOperation(entity, "{unfinished", "delete");
  assert.deepEqual(deleted, {
    kind: "entity",
    mode: "delete",
    section: entity.section,
    id: entity.id,
    beforeHash: entity.beforeHash,
  });
  assert.equal(Object.hasOwn(deleted, "value"), false);
  assert.throws(
    () => entityOperation({ id: "missing.section" }, "{}"),
    /выберите/,
  );
});

test("parallel link patch and deletion preserve an exact backend selector and unknown link metadata", () => {
  const relation = {
    adapter: "components.links",
    selector: {
      from: "example.orders",
      index: 1,
      beforeHash: "backend-issued-link-hash",
    },
    value: {
      id: "example.delivery",
      title: "Dispatch",
      protocol: "HTTP",
      contract: { version: 3 },
      obsolete: true,
    },
  };
  const next = { ...relation.value, protocol: "HTTPS" };
  delete next.obsolete;
  assert.deepEqual(linkOperation(relation, jsonText(next)), {
    kind: "link",
    mode: "patch",
    from: "example.orders",
    index: 1,
    beforeHash: "backend-issued-link-hash",
    value: next,
    removeProperties: ["/obsolete"],
  });
  assert.deepEqual(linkOperation(relation, "", "delete"), {
    kind: "link",
    mode: "delete",
    from: "example.orders",
    index: 1,
    beforeHash: "backend-issued-link-hash",
  });
  assert.equal(relation.value.protocol, "HTTP");
  assert.deepEqual(relation.value.contract, { version: 3 });
  assert.throws(
    () =>
      linkOperation({ selector: { from: "example.orders", index: 1 } }, "{}"),
    /селектора/,
  );
  assert.throws(
    () =>
      linkOperation(
        { selector: { from: "example.orders", index: "1", beforeHash: "h" } },
        "{}",
      ),
    /селектора/,
  );
  const created = linkOperation(
    { selector: { from: "example.orders" } },
    '{"id":"example.delivery"}',
    "create",
  );
  assert.deepEqual(created, {
    kind: "link",
    mode: "create",
    from: "example.orders",
    value: { id: "example.delivery" },
  });
});

test("relation lookup never falls back to a duplicate title when its index or hash no longer matches", () => {
  const a = {
    adapter: "components.links",
    selector: { from: "orders", index: 0, beforeHash: "first" },
    value: { id: "delivery", title: "Dispatch" },
  };
  const b = {
    adapter: "components.links",
    selector: { from: "orders", index: 1, beforeHash: "second" },
    value: { id: "delivery", title: "Dispatch" },
  };
  assert.equal(relationForBinding([a, b], bindingForRelation(b)), b);
  assert.equal(
    relationForBinding([a, b], {
      adapter: "components.links",
      from: "orders",
      index: 0,
      beforeHash: "second",
    }),
    null,
  );
  assert.equal(
    relationForBinding([a, b], {
      adapter: "components.links",
      from: "other",
      index: 1,
      beforeHash: "second",
    }),
    null,
  );
  assert.equal(
    relationForBinding([a, b], {
      adapter: "components.links",
      from: "orders",
      index: 2,
      beforeHash: "second",
    }),
    null,
  );
  assert.equal(
    relationForBinding([a, b], {
      adapter: "unsupported",
      from: "orders",
      index: 1,
    }),
    null,
  );
  assert.equal(relationForBinding([a, b], null), null);
  // Relaxation must be explicitly requested, e.g. after a staged operation recalculates its hash.
  assert.equal(
    relationForBinding(
      [a, b],
      {
        adapter: "components.links",
        from: "orders",
        index: 1,
        beforeHash: "stale",
      },
      { strict: false },
    ),
    b,
  );
});

test("generic relation bindings resolve by section and ID independently of component-link indices", () => {
  const flow = {
    adapter: "flows",
    selector: { section: "flows", id: "data.order", beforeHash: "flow-hash" },
  };
  const integration = {
    adapter: "integrations",
    selector: {
      section: "integrations",
      id: "data.order",
      beforeHash: "integration-hash",
    },
  };
  assert.deepEqual(bindingForRelation(flow), {
    adapter: "entity",
    section: "flows",
    id: "data.order",
  });
  assert.equal(
    relationForBinding([flow, integration], bindingForRelation(flow)),
    flow,
  );
  assert.equal(
    relationForBinding([flow, integration], bindingForRelation(integration)),
    integration,
  );
  assert.equal(
    sameReference(
      { section: "flows", id: "data.order" },
      { section: "integrations", id: "data.order" },
    ),
    false,
  );
  assert.equal(
    sameReference(
      { section: "flows", id: "data.order" },
      { section: "flows", id: "data.order" },
    ),
    true,
  );
  assert.equal(
    sameReference(null, { section: "flows", id: "data.order" }),
    false,
  );
});

test("inspector renders real dictionary options, escaped labels, accessible IDs and isolated editor events", () => {
  const markup = inspectorFields(
    { owner: "A&B", title: "<Orders>", custom: { retained: true } },
    {
      fields: [
        {
          name: "title",
          title: "Название <системы>",
          type: "string",
          required: true,
          description: "Без <HTML>",
        },
        {
          name: "owner",
          title: "Владелец",
          type: "string",
          options: [{ value: "A&B", label: "Команда <A>" }],
        },
      ],
    },
    { disabled: true },
  );
  assert.match(markup, /<fieldset[^>]*disabled/);
  assert.match(markup, /data-inspector-field="owner"/);
  assert.match(markup, /id="diagram-field-title"/);
  assert.match(markup, /for="diagram-field-title"/);
  assert.match(
    markup,
    /aria-describedby="diagram-field-title-help diagram-field-title-error"/,
  );
  assert.match(markup, /required aria-required="true"/);
  assert.match(markup, /Команда &lt;A&gt;/);
  assert.match(markup, /&lt;Orders&gt;/);
  assert.match(markup, /data-inspector-refresh/);
  assert.doesNotMatch(
    markup,
    /data-act="editor-fields-refresh"|data-editor-field=|<Orders>|<HTML>/,
  );
});

test("fit includes every permitted diagram coordinate in a small canvas with finite margins", () => {
  const nodes = [
      { x: 0, y: 0 },
      { x: 20000, y: 20000 },
    ],
    width = 100,
    height = 100;
  const camera = cameraFit(nodes, width, height);
  assert.ok(
    Number.isFinite(camera.x) &&
      Number.isFinite(camera.y) &&
      Number.isFinite(camera.zoom),
  );
  for (const node of nodes) {
    const left = (node.x - camera.x) * camera.zoom,
      top = (node.y - camera.y) * camera.zoom;
    assert.ok(left >= -1e-8 && top >= -1e-8);
    assert.ok(left + 248 * camera.zoom <= width + 1e-8);
    assert.ok(top + 128 * camera.zoom <= height + 1e-8);
  }
  const ordinary = cameraFit(
    [
      { x: 50, y: 80 },
      { x: 850, y: 400 },
    ],
    1200,
    700,
  );
  assert.ok(ordinary.zoom > camera.zoom);
  assert.deepEqual(cameraFit([], 800, 500), { x: 0, y: 0, zoom: 1 });
});

test("fit and zoom sanitize unusable saved geometry and viewport numbers", () => {
  for (const camera of [
    cameraFit(
      [
        { x: Infinity, y: -Infinity },
        { x: "bad", y: 20 },
      ],
      Infinity,
      NaN,
    ),
    cameraFit([{ x: -50, y: 999999 }], 0, -100),
    cameraZoom(
      { x: Infinity, y: NaN, zoom: Infinity },
      NaN,
      Infinity,
      -Infinity,
    ),
  ]) {
    assert.ok([camera.x, camera.y, camera.zoom].every(Number.isFinite));
    assert.ok(camera.zoom > 0 && camera.zoom <= 3);
  }
});

test("zoom preserves the world point beneath the cursor and clamps at supported magnification", () => {
  const original = { x: 75, y: -20, zoom: 0.5 },
    cursor = { x: 280, y: 150 };
  const world = {
    x: original.x + cursor.x / original.zoom,
    y: original.y + cursor.y / original.zoom,
  };
  const changed = cameraZoom(original, 1.75, cursor.x, cursor.y);
  assert.ok(Math.abs(changed.x + cursor.x / changed.zoom - world.x) < 1e-9);
  assert.ok(Math.abs(changed.y + cursor.y / changed.zoom - world.y) < 1e-9);
  assert.deepEqual(original, { x: 75, y: -20, zoom: 0.5 });
  assert.equal(cameraZoom(original, 100, 0, 0).zoom, 3);
  assert.ok(cameraZoom(original, -5, 0, 0).zoom > 0);
});

test("operation and impact labels expose semantic scope as escaped text", () => {
  assert.match(
    operationCaption({
      kind: "entity",
      mode: "patch",
      section: "systems",
      id: "corp.lti",
    }),
    /Изменить systems \/ corp\.lti/,
  );
  assert.match(
    operationCaption({
      kind: "link",
      mode: "delete",
      from: "orders",
      index: 1,
    }),
    /Удалить связь orders \[1\]/,
  );
  assert.match(
    operationCaption({
      kind: "child",
      mode: "create",
      parent: "orders",
      id: "orders.worker",
    }),
    /Создать компонент orders\.worker в orders/,
  );
  assert.equal(
    escapeHtml("<img src=\"x\" onerror='bad'>&"),
    "&lt;img src=&quot;x&quot; onerror=&#39;bad&#39;&gt;&amp;",
  );
  const markup = impactsMarkup([
    "<script>bad</script>",
    { message: "<img src=x>" },
    { description: "Reference to orders" },
  ]);
  assert.match(markup, /Влияние изменений: 3/);
  assert.match(markup, /&lt;script&gt;bad&lt;\/script&gt;/);
  assert.match(markup, /&lt;img src=x&gt;/);
  assert.doesNotMatch(markup, /<script>|<img/);
  assert.equal(impactsMarkup([]), "");
});

test("canvas preserves all four actual interaction arrow directions without swapping binding owners", () => {
  const diagram = {
    id: "direction-view",
    title: "Directions",
    level: "application",
    nodes: [
      { key: "a", title: "A", x: 0, y: 0 },
      { key: "b", title: "B", x: 500, y: 0 },
    ],
    zones: [],
    edges: [],
  };
  for (const [raw, direction, start, end] of [
    ["-->", "directed", false, true],
    ["<--", "reverse", true, false],
    ["<->", "bidirectional", true, true],
    ["--", "undirected", false, false],
  ]) {
    assert.equal(modelLinkDirection(raw), direction);
    assert.equal(storedLinkDirection(direction), raw);
    diagram.edges = [
      {
        key: "flow",
        from: "a",
        to: "b",
        title: "Interaction",
        direction,
        binding: {
          adapter: "components.links",
          from: "owner",
          index: 0,
          beforeHash: "backend",
        },
      },
    ];
    const markup = renderLocalDiagram(diagram);
    assert.equal(
      markup.includes('marker-start="url(#composer-local-arrow)"'),
      start,
    );
    assert.equal(
      markup.includes('marker-end="url(#composer-local-arrow)"'),
      end,
    );
    assert.equal(diagram.edges[0].binding.from, "owner");
  }
  assert.equal(modelLinkDirection(undefined), "directed");
  assert.equal(modelLinkDirection("unsupported-custom-meaning"), "undirected");
});
test("systems-only projects expose only declared compatible integration adapters", () => {
  const adapters = [
    {
      id: "company.integrations",
      kind: "entity",
      section: "company.integrations",
      guidedEndpoints: true,
      endpointFields: [
        { name: "source", section: "company.systems" },
        { name: "target", section: "company.systems" },
      ],
      capabilities: { create: true },
    },
    {
      id: "components.links",
      kind: "link",
      guidedEndpoints: true,
      endpointFields: [
        { name: "from", section: "components" },
        { name: "id", section: "components" },
      ],
      capabilities: { create: true },
    },
  ];
  assert.deepEqual(
    compatibleRelationAdapters(
      adapters,
      { section: "company.systems", id: "orders" },
      { section: "company.systems", id: "delivery" },
    ).map((a) => a.id),
    ["company.integrations"],
  );
  assert.deepEqual(
    compatibleRelationAdapters(adapters, null, {
      section: "company.systems",
      id: "delivery",
    }),
    [],
  );
  assert.deepEqual(
    compatibleRelationAdapters(
      adapters,
      { section: "company.systems", id: "orders" },
      { section: "other", id: "delivery" },
    ),
    [],
  );
  assert.deepEqual(
    compatibleRelationAdapters(
      [{ ...adapters[0], capabilities: { create: false } }],
      { section: "company.systems", id: "a" },
      { section: "company.systems", id: "b" },
    ),
    [],
  );
  withStorage(() => {
    const model = {
        "company.systems": {
          orders: { title: "Orders" },
          delivery: { title: "Delivery" },
        },
      },
      state = {
        project: "custom",
        projects: [{ id: "custom", writable: true }],
        model,
      };
    composerPanel(state);
    Object.assign(state.composer, {
      workspace: { model, adapters },
      connection: { scope: "model", from: "a", to: "b" },
      diagram: {
        format: "seaf-composer-v1",
        id: "custom-view",
        title: "Custom view",
        level: "application",
        nodes: [
          {
            key: "a",
            title: "Orders",
            ref: { section: "company.systems", id: "orders" },
          },
          {
            key: "b",
            title: "Delivery",
            ref: { section: "company.systems", id: "delivery" },
          },
        ],
        edges: [],
        zones: [],
      },
    });
    const html = composerPanel(state);
    assert.match(html, /value="company.integrations"/);
    assert.doesNotMatch(html, /<option value="components.links"/);
  });
});

test("untouched bound flow reuses declared section schema from a different flow on the canvas", () =>
  withStorage(() => {
    const schema = {
        fields: [
          { name: "from", title: "Source", type: "string" },
          { name: "to", title: "Target", type: "string" },
          {
            name: "protocol",
            title: "Protocol",
            type: "string",
            options: [{ value: "HTTPS", label: "HTTPS" }],
          },
        ],
      },
      model = {
        systems: { a: { title: "A" }, b: { title: "B" } },
        flows: {
          selected: { from: "a", to: "b", protocol: "HTTPS" },
          other: { title: "Other flow" },
        },
      },
      state = {
        project: "custom",
        projects: [{ id: "custom", writable: true }],
        model,
      };
    composerPanel(state);
    Object.assign(state.composer, {
      inspectorTab: "model",
      selectedEdge: "edge",
      workspace: {
        model,
        effectiveEntities: [
          { section: "flows", id: "other", value: model.flows.other, schema },
        ],
        relations: [
          {
            kind: "entity",
            adapter: "flows",
            selector: {
              section: "flows",
              id: "selected",
              beforeHash: "backend",
            },
            value: model.flows.selected,
          },
        ],
      },
      diagram: {
        format: "seaf-composer-v1",
        id: "schema-view",
        title: "Schema view",
        level: "application",
        nodes: [
          { key: "a", title: "A", ref: { section: "systems", id: "a" } },
          { key: "b", title: "B", ref: { section: "systems", id: "b" } },
        ],
        edges: [
          {
            key: "edge",
            from: "a",
            to: "b",
            binding: { adapter: "entity", section: "flows", id: "selected" },
          },
        ],
        zones: [],
      },
    });
    const html = composerPanel(state);
    for (const name of ["from", "to", "protocol"])
      assert.ok(html.includes(`data-inspector-field="${name}"`));
    assert.equal(state.composer.semanticOperations.length, 0);
  }));

const appliedSemantic = {
  kind: "entity",
  mode: "patch",
  section: "company.systems",
  id: "company.orders",
  beforeHash: "source-issued-old-hash",
  value: { title: "Orders", owner: "Commerce" },
};
function composerFixture(overrides = {}) {
  const draft = {
    id: "draft-a",
    project: "company-local",
    composer: { id: "company-landscape" },
    semanticOperations: [copy(appliedSemantic)],
    customDraftEvidence: { retained: true },
  };
  const current = {
    diagram: {
      format: "seaf-composer-v1",
      id: "company-landscape",
      title: "Company landscape",
      level: "application",
      nodes: [{ key: "orders-node", title: "Orders", x: 73, y: 125 }],
      edges: [],
      zones: [],
      customLayoutMetadata: { original: true },
    },
    semanticOperations: [copy(appliedSemantic)],
    pending: {},
    dirty: true,
    version: 7,
    stagedDraft: { id: "draft-a", version: 7, viewHash: "staged-view-hash" },
    preview: { viewHash: "staged-view-hash" },
    workspace: { revision: "old-revision" },
    undo: [{ diagram: { title: "Old diagram" } }],
    redo: [{ diagram: { title: "Future diagram" } }],
    connectionDirty: false,
    childInputDirty: false,
    newEntity: null,
    customRecoveryMetadata: { retain: "in-memory" },
    ...copy(overrides),
  };
  const other = {
    diagram: { id: "another-project" },
    semanticOperations: [{ custom: "unrelated" }],
  };
  const state = {
    project: "company-local",
    activeDraft: draft,
    composerProjects: { "company-local": current, unrelated: other },
  };
  return { state, draft, current, other };
}
function withStorage(run, initial = {}) {
  const descriptor = Object.getOwnPropertyDescriptor(
    globalThis,
    "localStorage",
  );
  const store = new Map(Object.entries(initial));
  const writes = [];
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem(key) {
        return store.has(key) ? store.get(key) : null;
      },
      setItem(key, value) {
        writes.push({ key, value });
        store.set(key, value);
      },
    },
  });
  try {
    return run({ store, writes });
  } finally {
    if (descriptor)
      Object.defineProperty(globalThis, "localStorage", descriptor);
    else delete globalThis.localStorage;
  }
}

test("staged composer version remains applicable until newer queued, visual or pending input changes it", () => {
  const { state, current } = composerFixture();
  assert.equal(
    composerDraftChanged(state),
    false,
    "queued operations already included in this staged version are safe",
  );
  current.version++;
  assert.equal(
    composerDraftChanged(state),
    true,
    "new layout/queued version invalidates the staged source change",
  );
  current.version--;
  for (const pendingChange of [
    {
      pending: {
        "entity:company.systems/company.orders": {
          text: '{"owner":',
          dirty: true,
        },
      },
    },
    { connectionDirty: true },
    { childInputDirty: true },
    { newEntity: { dirty: true, text: '{"title":' } },
  ]) {
    const candidate = composerFixture(pendingChange);
    assert.equal(
      composerDraftChanged(candidate.state),
      true,
      "unsubmitted input must block applying an older draft",
    );
  }
  assert.equal(
    composerDraftChanged(
      composerFixture({ pending: { clean: { text: "{}", dirty: false } } })
        .state,
    ),
    false,
  );
});

test("composer guard ignores unrelated projects and diagrams but detects untracked local intent", () => {
  const { state, current, draft } = composerFixture();
  state.activeDraft = { id: "ordinary-editor-draft" };
  assert.equal(composerDraftChanged(state), false);
  state.activeDraft = { ...draft, composer: { id: "different-diagram" } };
  assert.equal(composerDraftChanged(state), false);
  state.activeDraft = draft;
  current.stagedDraft = null;
  current.dirty = false;
  assert.equal(
    composerDraftChanged(state),
    true,
    "remaining untracked semantic intent is not silently treated as validated",
  );
  current.semanticOperations = [];
  assert.equal(composerDraftChanged(state), false);
  state.activeDraft = { ...draft, project: "another-company-project" };
  current.semanticOperations = [copy(appliedSemantic)];
  assert.equal(
    composerDraftChanged(state),
    false,
    "same diagram ID in another project must not gate the current draft",
  );
});

test("confirmed source save consumes the applied semantic prefix and persists a clean next-cycle baseline", () => {
  withStorage(
    ({ store, writes }) => {
      const { state, draft, current, other } = composerFixture();
      const draftBefore = copy(draft),
        diagramBefore = copy(current.diagram),
        otherBefore = copy(other);
      const result = {
        status: "applied",
        revision: { kind: "directory", id: "new-local-revision" },
        customResult: { keep: true },
      };
      const resultBefore = copy(result);
      composerApplied(state, draft, result);
      assert.deepEqual(current.semanticOperations, []);
      assert.deepEqual(current.pending, {});
      assert.deepEqual(current.undo, []);
      assert.deepEqual(current.redo, []);
      assert.equal(current.preview, null);
      assert.equal(current.workspace, null);
      assert.equal(current.stagedDraft, null);
      assert.equal(current.version, 8);
      assert.equal(current.dirty, false);
      assert.equal(current.connectionDirty, false);
      assert.equal(current.childInputDirty, false);
      assert.deepEqual(
        current.diagram,
        diagramBefore,
        "layout and custom diagram metadata survive source publication",
      );
      assert.deepEqual(current.customRecoveryMetadata, { retain: "in-memory" });
      assert.deepEqual(draft, draftBefore);
      assert.deepEqual(result, resultBefore);
      assert.deepEqual(other, otherBefore);
      assert.equal(writes.length, 1);
      const saved = JSON.parse(
        store.get("seaf-composer-sketch-v1:company-local"),
      );
      assert.deepEqual(saved.semanticOperations, []);
      assert.deepEqual(saved.undo, []);
      assert.deepEqual(saved.redo, []);
      assert.equal(saved.stagedDraft, null);
      assert.equal(saved.dirty, false);
      assert.deepEqual(saved.diagram, diagramBefore);
    },
    {
      "seaf-composer-sketch-v1:company-local": JSON.stringify({
        camera: { x: 5, y: -3, zoom: 0.5 },
        customSavedMetadata: { retain: true },
      }),
    },
  );
});

test("source apply retains a newer semantic suffix, incomplete input and moved canvas while clearing obsolete review state", () => {
  withStorage(({ store }) => {
    const later = {
      kind: "link",
      mode: "create",
      from: "company.orders",
      value: { id: "company.delivery", protocol: "HTTPS" },
    };
    const pending = {
      "entity:company.systems/company.delivery": {
        text: '{"owner":',
        dirty: true,
        beforeHash: "later-source-hash",
      },
    };
    const { state, draft, current } = composerFixture({
      version: 10,
      semanticOperations: [copy(appliedSemantic), later],
      pending,
      connectionDirty: true,
      childInputDirty: true,
      newEntity: { text: '{"title":', dirty: true },
    });
    current.diagram.nodes[0].x = 450;
    const layoutBefore = copy(current.diagram),
      draftBefore = copy(draft);
    composerApplied(state, draft, {
      status: "applied",
      commit: "saved-git-commit",
    });
    assert.deepEqual(current.semanticOperations, [later]);
    assert.deepEqual(current.pending, pending);
    assert.deepEqual(current.diagram, layoutBefore);
    assert.deepEqual(draft, draftBefore);
    assert.equal(current.connectionDirty, true);
    assert.equal(current.childInputDirty, true);
    assert.equal(current.newEntity.text, '{"title":');
    assert.equal(current.dirty, true);
    assert.equal(current.version, 11);
    assert.deepEqual(current.undo, []);
    assert.deepEqual(current.redo, []);
    assert.equal(current.workspace, null);
    assert.equal(current.preview, null);
    assert.equal(current.stagedDraft, null);
    const saved = JSON.parse(
      store.get("seaf-composer-sketch-v1:company-local"),
    );
    assert.deepEqual(saved.semanticOperations, [later]);
    assert.deepEqual(saved.pending, pending);
    assert.deepEqual(saved.diagram, layoutBefore);
    assert.equal(saved.dirty, true);
  });
});

test("confirmed source apply never clears a dirty pending form even when its staged version still matches", () => {
  withStorage(() => {
    const pending = { selected: { text: '{"description":', dirty: true } };
    const { state, draft, current } = composerFixture({ pending });
    assert.equal(composerDraftChanged(state), true);
    composerApplied(state, draft, {
      status: "applied",
      revision: { id: "saved" },
    });
    assert.deepEqual(current.semanticOperations, []);
    assert.deepEqual(current.pending, pending);
    assert.equal(current.dirty, true);
  });
});

test("no source save confirmation or unrelated project may consume current queued work", () => {
  withStorage(({ writes }) => {
    for (const result of [
      { status: "error", error: "Validation failed" },
      { status: "validated", revision: { id: "not-saved" } },
      { status: "applied" },
      { status: "applied", revision: {} },
    ]) {
      const { state, draft } = composerFixture(),
        before = copy(state);
      composerApplied(state, draft, result);
      assert.deepEqual(state, before);
    }
    const { state, draft } = composerFixture(),
      before = copy(state);
    composerApplied(
      state,
      { ...draft, project: "another-company-project" },
      { status: "applied", commit: "other-project-commit" },
    );
    assert.deepEqual(
      state,
      before,
      "equal diagram IDs in distinct projects must never cross-clear local state",
    );
    assert.deepEqual(writes, []);
  });
});

test("nonmatching semantic intent is retained after source save and persistence failure is reported honestly", () => {
  withStorage(({ store }) => {
    const newer = {
      kind: "entity",
      mode: "patch",
      section: "company.systems",
      id: "company.orders",
      beforeHash: "changed-base",
      value: { owner: "Newer team" },
    };
    const { state, draft, current } = composerFixture({
      version: 9,
      semanticOperations: [newer],
    });
    composerApplied(state, draft, {
      status: "applied",
      commit: "saved-old-version",
    });
    assert.deepEqual(
      current.semanticOperations,
      [newer],
      "a nonmatching prefix cannot be treated as the just-applied intent",
    );
    assert.equal(current.dirty, true);
    assert.deepEqual(
      JSON.parse(store.get("seaf-composer-sketch-v1:company-local"))
        .semanticOperations,
      [newer],
    );
  });
  withStorage(() => {
    const { state, draft, current } = composerFixture();
    globalThis.localStorage.setItem = () => {
      throw Error("QuotaExceededError");
    };
    composerApplied(state, draft, {
      status: "applied",
      commit: "actually-saved",
    });
    assert.deepEqual(
      current.semanticOperations,
      [],
      "applied source intent must not remain pending in memory after a storage failure",
    );
    assert.equal(current.storageFailure, true);
    assert.deepEqual(current.undo, []);
    assert.deepEqual(current.redo, []);
  });
});

test("Git commit with failed portal reload consumes saved intent but retains newer semantic and pending work", () => {
  withStorage(({ store, writes }) => {
    for (const unconfirmed of [
      { status: "committed_reload_failed" },
      { status: "committed_reload_failed", commit: "", revision: {} },
    ]) {
      const fixture = composerFixture(),
        before = copy(fixture.state);
      composerApplied(fixture.state, fixture.draft, unconfirmed);
      assert.deepEqual(
        fixture.state,
        before,
        "reload failure alone does not prove a Git write happened",
      );
    }
    assert.equal(writes.length, 0);
    const later = {
      kind: "entity",
      mode: "patch",
      section: "company.systems",
      id: "company.orders",
      beforeHash: "new-source-hash",
      value: { owner: "Next owner" },
    };
    const pending = {
      "entity:company.systems/company.orders": {
        dirty: true,
        text: '{"description":',
      },
    };
    const { state, draft, current } = composerFixture({
      version: 9,
      semanticOperations: [copy(appliedSemantic), later],
      pending,
    });
    current.diagram.nodes[0].x = 618;
    const diagram = copy(current.diagram),
      draftBefore = copy(draft);
    const result = {
      status: "committed_reload_failed",
      commit: "confirmed-git-commit",
      reload: { status: "failed", error: "Portal temporarily unavailable" },
    };
    const resultBefore = copy(result);
    composerApplied(state, draft, result);
    assert.deepEqual(current.semanticOperations, [later]);
    assert.deepEqual(current.pending, pending);
    assert.deepEqual(current.diagram, diagram);
    assert.equal(current.dirty, true);
    assert.deepEqual(current.undo, []);
    assert.deepEqual(current.redo, []);
    assert.equal(current.preview, null);
    assert.equal(current.workspace, null);
    assert.equal(current.stagedDraft, null);
    const saved = JSON.parse(
      store.get("seaf-composer-sketch-v1:company-local"),
    );
    assert.deepEqual(saved.semanticOperations, [later]);
    assert.deepEqual(saved.pending, pending);
    assert.deepEqual(saved.diagram, diagram);
    assert.deepEqual(draft, draftBefore);
    assert.deepEqual(
      result,
      resultBefore,
      "reload retry evidence remains available to the host",
    );
  });
});

test("local revision with failed portal reload consumes saved intent while preserving subsequent incomplete input", () => {
  withStorage(({ store, writes }) => {
    for (const unconfirmed of [
      { status: "saved_reload_failed" },
      {
        status: "saved_reload_failed",
        commit: null,
        revision: { kind: "directory" },
      },
    ]) {
      const fixture = composerFixture(),
        before = copy(fixture.state);
      composerApplied(fixture.state, fixture.draft, unconfirmed);
      assert.deepEqual(
        fixture.state,
        before,
        "a local revision identifier is required before clearing intent",
      );
    }
    assert.equal(writes.length, 0);
    const later = {
      kind: "link",
      mode: "create",
      from: "company.orders",
      value: {
        id: "company.delivery",
        title: "Next-cycle integration",
        protocol: "HTTPS",
      },
    };
    const pending = { connection: { dirty: true, text: '{"contract":' } };
    const { state, draft, current } = composerFixture({
      semanticOperations: [copy(appliedSemantic), later],
      pending,
    });
    const diagram = copy(current.diagram);
    const result = {
      status: "saved_reload_failed",
      commit: null,
      revision: { kind: "directory", id: "confirmed-immutable-local-revision" },
      reload: { status: "failed", error: "Reload must be retried separately" },
    };
    const resultBefore = copy(result);
    composerApplied(state, draft, result);
    assert.deepEqual(current.semanticOperations, [later]);
    assert.deepEqual(current.pending, pending);
    assert.deepEqual(current.diagram, diagram);
    assert.equal(current.dirty, true);
    assert.deepEqual(current.undo, []);
    assert.deepEqual(current.redo, []);
    assert.equal(current.preview, null);
    assert.equal(current.workspace, null);
    assert.equal(current.stagedDraft, null);
    const saved = JSON.parse(
      store.get("seaf-composer-sketch-v1:company-local"),
    );
    assert.deepEqual(saved.semanticOperations, [later]);
    assert.deepEqual(saved.pending, pending);
    assert.deepEqual(saved.diagram, diagram);
    assert.deepEqual(result, resultBefore);
  });
});

test("confirmed save cleans only the known old-project recovery after active project changes", () => {
  const { state, draft, current } = composerFixture();
  const active = {
    diagram: { id: draft.composer.id, title: "Another project" },
    semanticOperations: [{ unrelated: true }],
    pending: { input: { dirty: true, text: "raw" } },
  };
  state.project = "new-project";
  state.composerProjects["new-project"] = active;
  const before = copy(active);
  withStorage(({ store }) => {
    composerApplied(state, draft, {
      status: "applied",
      commit: "confirmed-old-project",
    });
    assert.deepEqual(active, before);
    assert.equal(state.project, "new-project");
    assert.deepEqual(current.semanticOperations, []);
    assert.ok(store.has("seaf-composer-sketch-v1:company-local"));
    assert.equal(store.has("seaf-composer-sketch-v1:new-project"), false);
  });
});
