/** Browser-independent helpers for the architecture workbench UX. */
export const fieldLabels = Object.freeze({
  title: "Название",
  description: "Описание",
  owner: "Владелец",
  entity: "Тип компонента",
  type: "Тип",
  kind: "Вид",
  domain: "Домен",
  status: "Статус",
  stage: "Этап жизненного цикла",
  lifecycle: "Жизненный цикл",
  "live-stage": "Этап эксплуатации",
  "live-stage-target": "Целевой этап",
  criticality: "Критичность",
  location: "Расположение",
  technology: "Технология",
  protocol: "Протокол",
  trustZone: "Зона доверия",
  dataClassification: "Класс данных",
  from: "Источник",
  to: "Получатель",
  links: "Интеграции",
  functions: "Функции",
  rpo: "Допустимая потеря данных (RPO)",
  rto: "Время восстановления (RTO)",
  sla: "Доступность (SLA)",
  monitoring: "Мониторинг",
  ownership: "Форма владения",
  "target-status": "Целевой статус",
  group: "Группа",
});
export const sectionLabels = Object.freeze({
  components: "Системы и компоненты",
  contexts: "Схемы и контексты",
  docs: "Документы",
  aspects: "Аспекты",
  integrations: "Интеграции",
  systems: "Системы",
  functions: "Функции",
  flows: "Потоки данных",
  catalogs: "Справочники",
  dictionaries: "Справочники",
  entities: "Метамодель",
  rules: "Правила проверок",
});
export const viewLabels = Object.freeze({
  home: "Моя работа",
  projects: "Проекты",
  objects: "Редактор",
  passport: "Паспорт объекта",
  wizard: "Создание системы",
  scenarios: "Сценарии",
  composer: "Конструктор схем",
  stack: "Stack Diagram",
  drafts: "Черновики",
  compare: "Сравнение",
  snapshots: "Снимки",
  graph: "Граф",
  trust: "Данные и доверие",
  assistant: "Ассистент",
  drawio: "draw.io",
  diagnostics: "Диагностика",
  artifact: "Исходный документ",
});
const object = (value) =>
  value && typeof value === "object" && !Array.isArray(value);
const short = (value, max = 250) => String(value ?? "").slice(0, max);
export const textValue = (value) =>
  value === null || value === undefined
    ? ""
    : typeof value === "object"
      ? Array.isArray(value)
        ? value.map(textValue).join(", ")
        : String(
            value.title ??
              value.name ??
              value.id ??
              value.value ??
              JSON.stringify(value),
          )
      : String(value);
export function sectionLabel(section, model = {}) {
  return (
    model.entities?.[section]?.title ||
    sectionLabels[section] ||
    (/\.systems$/.test(section)
      ? "Системы"
      : /\.integrations$/.test(section)
        ? "Интеграции"
        : section)
  );
}
export function entityRows(model = {}) {
  return Object.entries(model)
    .filter(([section, value]) => !section.startsWith("$") && object(value))
    .flatMap(([section, value]) =>
      Object.entries(value)
        .filter(([, v]) => object(v))
        .map(([id, value]) => ({
          section,
          id,
          value,
          title: textValue(value.title || value.name || id),
          owner: textValue(value.owner),
          domain: textValue(value.domain || value.group),
          status: textValue(
            value.status ||
              value.stage ||
              value.lifecycle ||
              value["live-stage"],
          ),
          kind: textValue(value.entity || value.kind || value.type),
        })),
    );
}
export function searchModel(model, query, { limit = 30, offset = 0 } = {}) {
  const words = String(query || "")
    .trim()
    .toLocaleLowerCase("ru")
    .split(/\s+/)
    .filter(Boolean);
  const matches = entityRows(model)
    .map((row) => {
      const basic = [row.id, row.title, row.owner, row.domain, row.status]
          .join(" ")
          .toLocaleLowerCase("ru"),
        detail = JSON.stringify(row.value).toLocaleLowerCase("ru");
      const matched = words.every(
        (w) => basic.includes(w) || detail.includes(w),
      );
      const q = words.join(" ");
      return {
        ...row,
        kind: "object",
        score: !words.length
          ? 0
          : row.id.toLocaleLowerCase("ru") === q
            ? 120
            : row.title.toLocaleLowerCase("ru") === q
              ? 110
              : basic.includes(q)
                ? 70
                : 30,
        matched,
        snippet: textValue(
          row.value.description || row.value.source || "",
        ).slice(0, 180),
      };
    })
    .filter((r) => r.matched)
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.title.localeCompare(b.title, "ru") ||
        a.id.localeCompare(b.id),
    );
  return {
    total: matches.length,
    results: matches
      .slice(
        Math.max(0, offset),
        Math.max(0, offset) + Math.min(100, Math.max(1, limit)),
      )
      .map(({ matched, ...row }) => row),
  };
}
export const defaultCatalog = () => ({
  owner: "",
  domain: "",
  status: "",
  sort: "title",
  direction: "asc",
  page: 0,
  pageSize: 50,
  columns: ["id", "title", "owner"],
  savedView: "",
});
export function normalizeCatalog(value = {}) {
  const initial = defaultCatalog();
  return {
    ...initial,
    owner: short(value.owner),
    domain: short(value.domain),
    status: short(value.status),
    sort: ["id", "title", "owner", "domain", "status", "kind"].includes(
      value.sort,
    )
      ? value.sort
      : "title",
    direction: value.direction === "desc" ? "desc" : "asc",
    page: Math.max(
      0,
      Math.min(
        100000,
        Number.isInteger(Number(value.page)) ? Number(value.page) : 0,
      ),
    ),
    pageSize: [25, 50, 100, 200].includes(Number(value.pageSize))
      ? Number(value.pageSize)
      : 50,
    columns: [
      ...new Set(
        (Array.isArray(value.columns) ? value.columns : initial.columns).filter(
          (c) =>
            ["id", "title", "owner", "domain", "status", "kind"].includes(c),
        ),
      ),
    ],
    savedView: short(value.savedView, 80),
  };
}
export function catalogRows(model, section, filter = "", options = {}) {
  const c = normalizeCatalog(options),
    query = String(filter).trim().toLocaleLowerCase("ru");
  const all = entityRows({ [section]: model[section] || {} });
  const filtered = all.filter(
    (r) =>
      (!query ||
        [r.id, r.title, r.owner, r.domain, r.status, r.kind].some((v) =>
          v.toLocaleLowerCase("ru").includes(query),
        )) &&
      (!c.owner || r.owner === c.owner) &&
      (!c.domain || r.domain === c.domain) &&
      (!c.status || r.status === c.status),
  );
  const factor = c.direction === "desc" ? -1 : 1;
  filtered.sort(
    (a, b) =>
      factor *
      (a[c.sort].localeCompare(b[c.sort], "ru", {
        numeric: true,
        sensitivity: "base",
      }) || a.id.localeCompare(b.id)),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / c.pageSize)),
    page = Math.min(c.page, pages - 1);
  return {
    all,
    total: filtered.length,
    pages,
    page,
    pageSize: c.pageSize,
    rows: filtered.slice(page * c.pageSize, (page + 1) * c.pageSize),
    filtered,
    choices: Object.fromEntries(
      ["owner", "domain", "status"].map((key) => [
        key,
        [...new Set(all.map((r) => r[key]).filter(Boolean))].sort((a, b) =>
          a.localeCompare(b, "ru"),
        ),
      ]),
    ),
  };
}
export function normalizePreferences(value = {}) {
  const entry = (e) =>
    object(e) &&
    typeof e.section === "string" &&
    typeof e.id === "string" &&
    e.section.length < 251 &&
    e.id.length < 501 &&
    !["__proto__", "constructor", "prototype"].includes(e.section) &&
    !["__proto__", "constructor", "prototype"].includes(e.id);
  return {
    favorites: (Array.isArray(value.favorites) ? value.favorites : [])
      .filter(entry)
      .slice(0, 100),
    recent: (Array.isArray(value.recent) ? value.recent : [])
      .filter(entry)
      .slice(0, 20),
    savedViews: (Array.isArray(value.savedViews) ? value.savedViews : [])
      .filter(
        (v) =>
          object(v) && typeof v.id === "string" && typeof v.title === "string",
      )
      .slice(0, 30)
      .map((v) => ({
        id: short(v.id, 80),
        title: short(v.title, 100),
        section: short(v.section),
        filter: short(v.filter, 500),
        catalog: normalizeCatalog(v.catalog),
      })),
    compactForm: value.compactForm === true,
    catalog: normalizeCatalog(value.catalog),
  };
}
export function rememberRecent(preferences, entry) {
  const p = normalizePreferences(preferences);
  p.recent = [
    {
      section: entry.section,
      id: entry.id,
      title: short(entry.title || entry.id),
      at: new Date().toISOString(),
    },
    ...p.recent.filter((r) => r.section !== entry.section || r.id !== entry.id),
  ].slice(0, 20);
  return p;
}
export function toggleFavorite(preferences, entry) {
  const p = normalizePreferences(preferences),
    exists = p.favorites.some(
      (r) => r.section === entry.section && r.id === entry.id,
    );
  p.favorites = exists
    ? p.favorites.filter(
        (r) => r.section !== entry.section || r.id !== entry.id,
      )
    : [
        ...p.favorites,
        {
          section: entry.section,
          id: entry.id,
          title: short(entry.title || entry.id),
        },
      ].slice(-100);
  return p;
}
export function parseRoute(input) {
  const url = input instanceof URL ? input : new URL(input, "http://localhost");
  const q = url.searchParams;
  const view = q.get("view") === "editor" ? "objects" : q.get("view");
  return {
    view: Object.hasOwn(viewLabels, view) ? view : undefined,
    project: q.get("project") ? short(q.get("project"), 150) : undefined,
    section: q.get("section") ? short(q.get("section")) : undefined,
    id: q.get("object") ? short(q.get("object"), 500) : undefined,
    filter: short(q.get("filter") || "", 500),
    path: q.get("path") ? short(q.get("path"), 1000) : undefined,
    catalog: normalizeCatalog({
      owner: q.get("owner"),
      domain: q.get("domain"),
      status: q.get("status"),
      sort: q.get("sort"),
      direction: q.get("direction"),
      page: q.get("page"),
      pageSize: q.get("pageSize"),
      columns: q.get("columns")?.split(","),
    }),
  };
}
export function routeQuery(
  state,
  {
    view = state.view,
    section = state.section,
    id = state.editId,
    path = state.artifactPath,
  } = {},
) {
  const q = new URLSearchParams();
  q.set("view", Object.hasOwn(viewLabels, view) ? view : "objects");
  if (state.project) q.set("project", state.project);
  if (["objects", "passport"].includes(view)) {
    if (section) q.set("section", section);
    if (id) q.set("object", id);
    if (state.filter) q.set("filter", short(state.filter, 500));
    const c = normalizeCatalog(state.catalog);
    for (const k of ["owner", "domain", "status"]) if (c[k]) q.set(k, c[k]);
    if (c.sort !== "title") q.set("sort", c.sort);
    if (c.direction !== "asc") q.set("direction", c.direction);
    if (c.page) q.set("page", String(c.page));
    if (c.pageSize !== 50) q.set("pageSize", String(c.pageSize));
    if (c.columns.join(",") !== "id,title,owner")
      q.set("columns", c.columns.join(","));
  }
  if (view === "artifact" && path) q.set("path", path);
  return "/?" + q.toString();
}
export function makeEditSnapshot(state) {
  return {
    section: state.section,
    editId: state.editId,
    editorValue: state.editorValue,
    editorMode: state.editorMode,
    selected: [...(state.selected || [])],
  };
}
export function editHistory(snapshot) {
  return { items: [structuredClone(snapshot)], index: 0 };
}
export function recordEdit(history, snapshot) {
  const next = history || editHistory(snapshot),
    bytes = JSON.stringify(snapshot);
  if (JSON.stringify(next.items[next.index]) === bytes) return next;
  next.items = next.items.slice(0, next.index + 1);
  next.items.push(structuredClone(snapshot));
  if (next.items.length > 80) next.items.shift();
  next.index = next.items.length - 1;
  return next;
}
export function moveEdit(history, direction) {
  if (!history?.items?.length) return null;
  history.index = Math.max(
    0,
    Math.min(history.items.length - 1, history.index + Math.sign(direction)),
  );
  return structuredClone(history.items[history.index]);
}
export function schemaIssues(value, fields = []) {
  if (!object(value))
    return [
      { field: "", description: "Свойства объекта должны быть JSON-объектом." },
    ];
  return fields
    .filter(
      (f) =>
        f.required &&
        (value[f.name] === undefined ||
          value[f.name] === null ||
          value[f.name] === "" ||
          (Array.isArray(value[f.name]) && !value[f.name].length)),
    )
    .map((f) => ({
      field: f.name,
      description:
        "Заполните обязательное поле «" +
        (f.title || fieldLabels[f.name] || f.name) +
        "».",
    }));
}
function refs(value, id, path = "", result = [], depth = 0) {
  if (depth > 20 || result.length >= 200) return result;
  if (typeof value === "string" && value === id) result.push(path);
  else if (Array.isArray(value))
    value.forEach((v, i) =>
      refs(v, id, path + "[" + i + "]", result, depth + 1),
    );
  else if (object(value))
    Object.entries(value).forEach(([k, v]) =>
      refs(v, id, path ? path + "." + k : k, result, depth + 1),
    );
  return result;
}
export function passportFromModel(model, section, id, provenance = {}) {
  const value = model[section]?.[id];
  if (!object(value)) return null;
  const rows = entityRows(model),
    incoming = [],
    outgoing = [],
    references = [];
  for (const row of rows) {
    if (row.section === "components")
      for (const [index, link] of (Array.isArray(row.value.links)
        ? row.value.links
        : []
      ).entries()) {
        if (!object(link)) continue;
        const l = {
          from: row.id,
          to: link.id,
          title: link.title || link.description || "",
          protocol: link.protocol || "",
          index,
          section: "components",
        };
        if (row.id === id && section === "components") outgoing.push(l);
        if (link.id === id && section === "components") incoming.push(l);
      }
    if (row.id === id && row.section === section) continue;
    const paths = refs(row.value, id);
    if (paths.length)
      references.push({
        section: row.section,
        id: row.id,
        title: row.title,
        properties: paths,
      });
  }
  const documents = references.filter((r) => r.section === "docs"),
    contexts = references.filter((r) => r.section === "contexts");
  return {
    section,
    id,
    value,
    title: value.title || value.name || id,
    source: { path: provenance[section + "/" + id] || null },
    incoming,
    outgoing,
    references,
    documents,
    contexts,
  };
}
export function normalizeValidationIssues(
  problems = [],
  model = {},
  draft = null,
) {
  const all = entityRows(model),
    operations = draft?.operations || [];
  const flatten = (value, rule = "") => {
    if (!object(value)) return [{ description: textValue(value), rule }];
    const nested = value.items || value.problems || value.errors;
    if (Array.isArray(nested) && nested.length)
      return nested.flatMap((item) =>
        flatten(item, value.id || value.title || rule),
      );
    return [{ ...value, rule: value.rule || rule }];
  };
  return problems
    .flatMap((p) => flatten(p))
    .map((raw, index) => {
      const description = textValue(
        raw.description ||
          raw.message ||
          raw.title ||
          raw.error ||
          "Проверка модели обнаружила проблему",
      );
      let section = raw.section || raw.entitySection,
        id =
          raw.entityId || raw.component || raw.componentId || raw.subject?.id,
        field =
          raw.property ||
          raw.field ||
          raw.missingProperty ||
          raw.params?.missingProperty;
      try {
        const url = new URL(raw.location || raw.url || "", "http://localhost");
        for (const [parameter, s] of [
          ["dh-component-id", "components"],
          ["dh-context-id", "contexts"],
          ["dh-doc-id", "docs"],
        ])
          if (url.searchParams.has(parameter)) {
            section = s;
            id = url.searchParams.get(parameter);
          }
      } catch {}
      if (!id && raw.id && model[section || "components"]?.[raw.id])
        id = raw.id;
      if (!id) {
        const candidates = all.filter((r) =>
          [r.id].some((key) => description.includes(key)),
        );
        if (candidates.length === 1) {
          id = candidates[0].id;
          section = candidates[0].section;
        }
      }
      if (id && !section) {
        const matches = all.filter((r) => r.id === id);
        if (matches.length === 1) section = matches[0].section;
        else if (operations.some((op) => op.id === id))
          section = operations.find((op) => op.id === id).section;
      }
      if (
        !id &&
        operations.length === 1 &&
        /owner|владел|обязательн|required|missing/i.test(description)
      ) {
        id = operations[0].id;
        section = operations[0].section;
      }
      if (!field && /owner|владел/i.test(description)) field = "owner";
      const resolvable = !!(
        section &&
        id &&
        (model[section]?.[id] ||
          operations.some((op) => op.section === section && op.id === id))
      );
      return {
        index,
        description,
        rule: textValue(raw.rule || raw.validator || ""),
        section: resolvable ? section : null,
        id: resolvable ? id : null,
        field: resolvable && typeof field === "string" ? field : null,
        location: raw.location || "",
        raw,
      };
    });
}
export function fallbackScenarios(model = {}) {
  const scenarios = [];
  for (const section of ["scenarios", "seaf.workbench.scenarios"])
    for (const [id, value] of Object.entries(model[section] || {}))
      if (object(value) && Array.isArray(value.steps)) {
        const steps = value.steps
          .filter(object)
          .map((s) => ({
            from: s.from || s.source,
            to: s.to || s.target,
            label: s.label || s.title || "",
            data: s.data || "",
            error: s.error || "",
            type: s.type || "declared",
          }));
        if (steps.length)
          scenarios.push({
            id,
            title: value.title || id,
            steps,
            participants: [],
          });
      }
  return scenarios;
}
export function modelLinks(model = {}) {
  return Object.entries(model.components || {}).flatMap(([from, value]) =>
    (Array.isArray(value?.links) ? value.links : [])
      .filter(object)
      .map((link, index) => ({
        key: from + "::" + index,
        from,
        to: link.id,
        label: link.title || link.description || "Взаимодействие",
        data: textValue(link.data || link.dataClassification),
        error: textValue(link.error),
        protocol: textValue(link.protocol),
        type: "model-link",
        index,
      })),
  );
}
export function walkthroughSvg(model, steps, index, escape) {
  const active = steps[index],
    ids = [
      ...new Set(steps.flatMap((s) => [s.from, s.to]).filter(Boolean)),
    ].slice(0, 80),
    width = 900,
    height = Math.max(160, Math.ceil(ids.length / 4) * 120 + 20),
    nodes = new Map(
      ids.map((id, i) => [
        id,
        { id, x: 25 + (i % 4) * 220, y: 25 + Math.floor(i / 4) * 120 },
      ]),
    );
  const edges = steps
    .map((s, i) => {
      const a = nodes.get(s.from),
        b = nodes.get(s.to);
      if (!a || !b) return "";
      return `<g class="walk-edge ${i === index ? "active" : ""}"><path d="M ${a.x + 85} ${a.y + 30} L ${b.x + 85} ${b.y + 30}" marker-end="url(#walk-arrow)"></path>${i === index ? `<text x="${(a.x + b.x) / 2 + 85}" y="${(a.y + b.y) / 2 + 18}" text-anchor="middle">${escape(s.label || "Шаг " + (i + 1))}</text>` : ""}</g>`;
    })
    .join("");
  const blocks = [...nodes.values()]
    .map(
      (n) =>
        `<g class="walk-node ${active && (n.id === active.from || n.id === active.to) ? "active" : ""}" transform="translate(${n.x},${n.y})"><rect width="180" height="62" rx="10"></rect><text x="90" y="24" text-anchor="middle">${escape(String(model.components?.[n.id]?.title || n.id).slice(0, 25))}</text><text class="walk-id" x="90" y="44" text-anchor="middle">${escape(n.id.slice(0, 30))}</text></g>`,
    )
    .join("");
  return `<svg class="walk-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Участники сценария; текущий вызов выделен"><defs><marker id="walk-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8Z" fill="currentColor"></path></marker></defs>${edges}${blocks}</svg>`;
}
