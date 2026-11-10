import {
  copy as clone,
  escapeHtml as escape,
  jsonText,
  parseObject,
  inspectorFields,
  readField,
  entityOperation,
  linkOperation,
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
} from "./diagram-inspector.js";

const LEVELS = {
  network: "Сетевой уровень",
  application: "Прикладной уровень",
  component: "Компонентный уровень",
};
const KINDS = {
  router: "Маршрутизатор",
  switch: "Коммутатор",
  firewall: "Межсетевой экран",
  server: "Сервер",
  database: "База данных",
  service: "Сервис",
  system: "Система",
  component: "Компонент",
  client: "Клиент",
  queue: "Очередь",
};
const newDefinition = () => ({
  format: "seaf-composer-v1",
  id: "new-diagram",
  title: "Новая схема",
  level: "application",
  description: "",
  nodes: [],
  edges: [],
  zones: [],
});
const keyFor = (project) => "seaf-composer-sketch-v1:" + project;
const coordinate = (value) =>
  Math.max(
    0,
    Math.min(20000, Number.isFinite(Number(value)) ? Number(value) : 0),
  );
const validSketch = (value) =>
  value &&
  value.format === "seaf-composer-v1" &&
  typeof value.id === "string" &&
  typeof value.title === "string" &&
  Object.hasOwn(LEVELS, value.level) &&
  Array.isArray(value.nodes) &&
  value.nodes.length <= 200 &&
  value.nodes.every(
    (n) => n && typeof n.key === "string" && typeof n.title === "string",
  ) &&
  Array.isArray(value.edges) &&
  value.edges.length <= 500 &&
  value.edges.every((e) => e && typeof e.key === "string") &&
  Array.isArray(value.zones) &&
  value.zones.length <= 30;
const validOperations = (value) =>
  Array.isArray(value) &&
  value.length <= 100 &&
  value.every(
    (op) =>
      op &&
      ["entity", "link", "child"].includes(op.kind) &&
      ["create", "patch", "delete"].includes(op.mode),
  );
const options = (items, selected, esc = escape) =>
  items
    .map(
      ([value, title]) =>
        `<option value="${esc(value)}" ${String(selected) === String(value) ? "selected" : ""}>${esc(title)}</option>`,
    )
    .join("");
const objectValues = (model) =>
  Object.entries(model || {}).filter(
    ([, v]) => v && typeof v === "object" && !Array.isArray(v),
  );
const entityKey = (ref) => "entity:" + ref.section + "/" + ref.id;
const relationKey = (relation) =>
  relation.adapter === "components.links"
    ? "link:" + relation.selector.from + "/" + relation.selector.index
    : "entity:" + relation.selector.section + "/" + relation.selector.id;
function wrapLabel(text, length = 28, lines = 2) {
  const words = String(text || "").split(/\s+/),
    result = [""];
  for (const word of words) {
    let rest = word;
    while (rest.length) {
      const i = result.length - 1,
        space = result[i] ? " " : "";
      if ((result[i] + space + rest).length <= length) {
        result[i] += space + rest;
        break;
      }
      if (result[i]) result.push("");
      else {
        result[i] = rest.slice(0, length);
        rest = rest.slice(length);
        if (rest) result.push("");
      }
    }
  }
  return result
    .slice(0, lines)
    .map((line, i) =>
      i === lines - 1 && result.length > lines ? line.slice(0, -1) + "…" : line,
    );
}
export function renderLocalDiagram(diagram, selected = "", settings = {}) {
  const nodes = (diagram.nodes || []).slice(0, 200),
    edges = (diagram.edges || []).slice(0, 500),
    byId = new Map(nodes.map((n) => [n.key, n])),
    w = 248,
    h = 128;
  let body = "";
  for (const zone of (diagram.zones || []).slice(0, 30)) {
    const members = nodes.filter((n) => n.zone === zone.id);
    if (!members.length) continue;
    const x = Math.max(
        2,
        Math.min(...members.map((n) => coordinate(n.x))) - 22,
      ),
      y = Math.max(2, Math.min(...members.map((n) => coordinate(n.y))) - 35);
    body += `<g class="di-zone"><rect x="${x}" y="${y}" width="${Math.max(...members.map((n) => coordinate(n.x) + w)) - x + 22}" height="${Math.max(...members.map((n) => coordinate(n.y) + h)) - y + 22}" rx="16" fill="#eaf2fa" fill-opacity=".7" stroke="#91a8bb" stroke-dasharray="7 4"/><text x="${x + 10}" y="${y + 20}" font-size="13" fill="#426079">${escape(zone.title)}</text></g>`;
  }
  for (const edge of edges) {
    const a = byId.get(edge.from),
      b = byId.get(edge.to);
    if (!a || !b) continue;
    let x = coordinate(a.x) + w / 2,
      y = coordinate(a.y) + h / 2,
      xx = coordinate(b.x) + w / 2,
      yy = coordinate(b.y) + h / 2;
    const dx = xx - x,
      dy = yy - y,
      parallel = edges.filter(
        (e) =>
          (e.from === edge.from && e.to === edge.to) ||
          (e.from === edge.to && e.to === edge.from),
      ),
      offset =
        (parallel.findIndex((e) => e.key === edge.key) -
          (parallel.length - 1) / 2) *
        110;
    let path, labelX, labelY;
    if (a === b) {
      x = coordinate(a.x) + w - 10;
      y = coordinate(a.y) + 25;
      xx = x;
      yy = y + 75;
      path = `M${x} ${y} C${x + 100 + offset} ${y - 40} ${xx + 100 + offset} ${yy + 40} ${xx} ${yy}`;
      labelX = x + 75 + offset;
      labelY = y + 34;
    } else {
      if (Math.abs(dx) >= Math.abs(dy)) {
        x += dx >= 0 ? w / 2 : -w / 2;
        xx += dx >= 0 ? -w / 2 : w / 2;
      } else {
        y += dy >= 0 ? h / 2 : -h / 2;
        yy += dy >= 0 ? -h / 2 : h / 2;
      }
      const cx = (x + xx) / 2 + (Math.abs(dx) >= Math.abs(dy) ? 0 : offset),
        cy = (y + yy) / 2 + (Math.abs(dx) >= Math.abs(dy) ? offset : 0);
      path = `M${x} ${y} Q${cx} ${cy} ${xx} ${yy}`;
      labelX = (x + 2 * cx + xx) / 4;
      labelY = (y + 2 * cy + yy) / 4 - 9;
    }
    const active = edge.key === settings.selectedEdge,
      semantic = !!edge.binding,
      color = active ? "#be6b16" : semantic ? "#007d68" : "#657a91";
    const label = [edge.title, edge.protocol].filter(Boolean).join(" · "),
      lines = wrapLabel(label, 35, 2);
    const direction = modelLinkDirection(edge.direction),
      markers = [
        ...(["reverse", "bidirectional"].includes(direction)
          ? ['marker-start="url(#composer-local-arrow)"']
          : []),
        ...(["directed", "bidirectional"].includes(direction)
          ? ['marker-end="url(#composer-local-arrow)"']
          : []),
      ].join(" ");
    body += `<g data-composer-edge="${escape(edge.key)}" role="button" tabindex="0" aria-label="${escape(label || "Связь")} · ${semantic ? "связь модели" : "только схема"}"><title>${escape(label || "Связь")} — ${semantic ? "Связь модели" : "Визуальная связь; модель не изменяет"}</title><path d="${path}" stroke="transparent" stroke-width="22" fill="none" pointer-events="stroke"/><path class="di-edge-line" d="${path}" stroke="${color}" stroke-width="${active ? 3.5 : 2}" ${semantic ? "" : 'stroke-dasharray="6 4"'} fill="none" ${markers}/>${lines.map((line, i) => `<text x="${labelX}" y="${labelY + i * 15}" font-size="12" text-anchor="middle" fill="#264d3b" style="paint-order:stroke;stroke:#f8fbf9;stroke-width:5px;stroke-linejoin:round">${escape(line)}</text>`).join("")}</g>`;
  }
  for (const node of nodes) {
    const active = node.key === selected,
      color = active
        ? "#b96d19"
        : node.ref
          ? {
              network: "#315b9c",
              application: "#007d68",
              component: "#7952a8",
            }[diagram.level] || "#007d68"
          : "#70839a",
      lines = wrapLabel(node.title, 27, 2);
    body += `<g data-composer-node="${escape(node.key)}" role="button" tabindex="0" aria-label="${escape(node.title)}. ${node.ref ? "Объект модели" : "Визуальный узел"}. Стрелки — перемещение, Enter — свойства" transform="translate(${coordinate(node.x)},${coordinate(node.y)})"><title>${escape(node.title)}${node.ref ? " · " + escape(node.ref.id) : " · Визуальный узел"}</title><rect class="di-node-box" width="${w}" height="${h}" rx="${node.kind === "database" ? 24 : 10}" fill="#fff" stroke="${color}" stroke-width="${active ? 4 : 2}" ${node.ref ? "" : 'stroke-dasharray="7 4"'}/>${lines.map((line, i) => `<text x="14" y="${27 + i * 19}" fill="#173f33" font-size="15" font-weight="600">${escape(line)}</text>`).join("")}<text x="14" y="76" fill="#536c5e" font-size="12">${escape(KINDS[node.kind] || node.kind || "Объект")}</text><text x="14" y="98" fill="#526c60" font-size="10">${escape(String(node.ref?.id || "Визуальный узел").slice(0, 39))}</text><text x="14" y="116" fill="${node.ref ? "#00715e" : "#718093"}" font-size="10">${escape(node.ref?.section || "Не создаёт объект модели")}</text></g>`;
  }
  const width = Math.max(760, ...nodes.map((n) => coordinate(n.x) + w + 60)),
    height = Math.max(400, ...nodes.map((n) => coordinate(n.y) + h + 70));
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${escape(diagram.title)}"><defs><marker id="composer-local-arrow" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto-start-reverse"><path d="M0 0 L10 4 L0 8 Z" fill="#466f5c"/></marker></defs>${body}</svg>`;
}
function composeState(state) {
  state.composerProjects ||= Object.create(null);
  if (!Object.hasOwn(state.composerProjects, state.project)) {
    let saved = null;
    try {
      saved = JSON.parse(localStorage.getItem(keyFor(state.project)) || "null");
    } catch {}
    state.composerProjects[state.project] = {
      project: state.project,
      diagram: validSketch(saved?.diagram) ? saved.diagram : newDefinition(),
      semanticOperations: validOperations(saved?.semanticOperations)
        ? saved.semanticOperations
        : [],
      pending:
        saved?.pending && typeof saved.pending === "object"
          ? saved.pending
          : {},
      dirty: !!saved?.dirty,
      selected: saved?.selected || "",
      selectedEdge: saved?.selectedEdge || "",
      inspectorTab: saved?.inspectorTab || "visual",
      inspectorMode:
        saved?.inspectorMode === "newEntity" ? "newEntity" : "selection",
      preview: null,
      workspace: null,
      saved: [],
      listLoaded: false,
      version: Number.isInteger(saved?.version) ? saved.version : 0,
      stagedDraft: saved?.stagedDraft || null,
      undo: Array.isArray(saved?.undo) ? saved.undo.slice(-20) : [],
      redo: Array.isArray(saved?.redo) ? saved.redo.slice(-20) : [],
      camera:
        saved?.camera &&
        ["x", "y", "zoom"].every((key) => Number.isFinite(saved.camera[key]))
          ? {
              x: saved.camera.x,
              y: saved.camera.y,
              zoom: Math.max(0.002, Math.min(3, saved.camera.zoom)),
            }
          : { x: 0, y: 0, zoom: 1 },
      paletteCollapsed:
        saved?.paletteCollapsed ??
        (typeof window !== "undefined" && window.innerWidth < 1100),
      inspectorCollapsed:
        saved?.inspectorCollapsed ??
        (typeof window !== "undefined" && window.innerWidth < 900),
      focus:
        saved?.focus ??
        (typeof window !== "undefined" && window.innerWidth < 900),
      paletteSection: saved?.paletteSection || "components",
      paletteFilter: saved?.paletteFilter || "",
      newEntity: saved?.newEntity || null,
      connection: saved?.connection || {},
      connectionDirty: !!saved?.connectionDirty,
      childId: saved?.childId || "",
      childTitle: saved?.childTitle || "",
      childOwner: saved?.childOwner || "",
      childInputDirty: !!saved?.childInputDirty,
      childContexts: saved?.childContexts || {},
      pendingBindings: saved?.pendingBindings || {},
      connectMode: false,
      ...(saved && !validSketch(saved.diagram)
        ? {
            status:
              "Сохранённый эскиз имеет другой формат. Он не применялся к проекту. Откройте схему из файлов.",
          }
        : {}),
    };
  }
  state.composer = state.composerProjects[state.project];
  return state.composer;
}
function snapshot(s) {
  return clone({
    diagram: s.diagram,
    semanticOperations: s.semanticOperations,
    pending: s.pending,
    selected: s.selected,
    selectedEdge: s.selectedEdge,
    inspectorTab: s.inspectorTab,
    inspectorMode: s.inspectorMode,
    newEntity: s.newEntity,
    connection: s.connection,
    connectionDirty: s.connectionDirty,
    childId: s.childId,
    childTitle: s.childTitle,
    childOwner: s.childOwner,
    childInputDirty: s.childInputDirty,
    childContexts: s.childContexts,
    pendingBindings: s.pendingBindings,
  });
}
function selectedEntity(s) {
  const node = s.diagram.nodes.find((n) => n.key === s.selected);
  if (!node?.ref) return null;
  return (
    s.workspace?.effectiveEntities?.find((e) => sameReference(e, node.ref)) || {
      ...node.ref,
      value: s.workspace?.model?.[node.ref.section]?.[node.ref.id],
      schema: null,
    }
  );
}
function selectedRelation(s) {
  const edge = s.diagram.edges.find((e) => e.key === s.selectedEdge);
  return relationForBinding(s.workspace?.relations || [], edge?.binding);
}
function buffer(s, key, value, beforeHash) {
  let entry = s.pending[key];
  if (!entry || (!entry.dirty && entry.baseHash !== beforeHash))
    entry = s.pending[key] = {
      text: jsonText(value || {}),
      baseValue: clone(value || {}),
      baseHash: beforeHash || null,
      dirty: false,
    };
  return entry;
}
const pendingCount = (s) =>
  Object.values(s.pending).filter((value) => value?.dirty).length +
  (s.connectionDirty ? 1 : 0) +
  (s.newEntity?.dirty ? 1 : 0) +
  (s.childInputDirty ? 1 : 0);
function modelFields(s, entity, readOnly, kind = "entity") {
  const key = kind === "relation" ? relationKey(entity) : entityKey(entity),
    value = entity.value || {},
    hash = entity.beforeHash || entity.selector?.beforeHash,
    b = buffer(s, key, value, hash);
  const removalChoices =
    kind === "entity" && entity.section === "components"
      ? contextChoices(s, "delete", entity.id, readOnly)
      : "";
  const sourceFields =
    kind === "relation" && entity.adapter === "components.links"
      ? `<label for="composer-model-link-source">Источник — объект модели</label><select id="composer-model-link-source" ${readOnly ? "disabled" : ""}>${options(
          objectValues(s.workspace?.model?.components).map(([id, value]) => [
            id,
            (value.title || id) + " · " + id,
          ]),
          b.moveFrom || entity.selector.from,
        )}</select><p class="composer-help">Смена источника явно удалит точную связь из старого components.links и добавит её новому источнику в том же черновике, сохранив свойства.</p>`
      : "";
  let markup;
  try {
    markup = inspectorFields(parseObject(b.text), entity.schema, {
      disabled: readOnly,
    });
  } catch (error) {
    markup = `<p class="di-inspector-notice warning">${escape(error.message)} Текст сохранён локально; исправьте JSON.</p>`;
  }
  return `<div data-inspector-buffer="${escape(key)}"><div class="di-inspector-notice">Это свойства <strong>реального объекта модели</strong>. Ввод не меняет файлы. Включите изменение в общий черновик и проверьте diff.</div>${sourceFields}${markup}<details ${
    b.dirty &&
    (() => {
      try {
        parseObject(b.text);
        return false;
      } catch {
        return true;
      }
    })()
      ? "open"
      : ""
  }><summary>Расширенный JSON и удаление свойств</summary><p class="composer-help">Неизвестные свойства сохраняются. Удалённые из JSON ключи удалятся явно; пустая строка останется строкой. «Не задано» в списке удаляет свойство.</p><textarea id="composer-model-json" class="di-inspector-json" rows="10" spellcheck="false" ${readOnly ? "disabled" : ""}>${escape(b.text)}</textarea></details><span id="composer-model-pending" class="di-pending-mark">${b.dirty ? "Есть ввод, ещё не включённый в черновик." : "Свойства прочитаны из эффективной модели."}</span><div class="di-inspector-actions"><button id="composer-model-stage" class="di-model-apply" ${readOnly || !hash ? "disabled" : ""}>Включить изменение в черновик</button><button id="composer-model-reset">Отменить ввод</button></div>${removalChoices}<button id="composer-model-delete" class="composer-danger" ${readOnly || !hash ? "disabled" : ""}>Удалить ${kind === "relation" ? "связь" : "объект"} из модели…</button></div>`;
}
function contextChoices(s, mode, id, readOnly) {
  const rows = (s.workspace?.contexts || []).filter(
    (context) =>
      mode !== "delete" ||
      (Array.isArray(context.components) && context.components.includes(id)),
  );
  if (!rows.length)
    return mode === "child"
      ? '<p class="composer-help">Нет статических контекстов. Если модель требует покрытие, добавьте компонент в подходящий контекст через свойства перед сохранением.</p>'
      : "";
  return `<fieldset class="di-contexts"><legend>${mode === "child" ? "Добавить новый компонент в контексты" : "При удалении убрать точную ссылку из контекстов (явно)"}</legend>${rows
    .map((context) => {
      const checked =
        mode === "child"
          ? Object.hasOwn(s.childContexts || {}, context.id)
            ? s.childContexts[context.id]
            : context.containsSelected?.includes(id)
          : false;
      return `<label class="di-context-option"><input type="checkbox" data-composer-context="${escape(context.id)}" data-context-mode="${mode}" ${checked ? "checked" : ""} ${readOnly || !Array.isArray(context.components) ? "disabled" : ""}>${escape(context.title || context.id)}${Array.isArray(context.components) ? "" : " · динамический состав: редактируйте явно"}</label>`;
    })
    .join(
      "",
    )}<p class="composer-help">Выбранные изменения контекстов будут отдельными операциями в общем diff. Другие свойства сохранятся.</p></fieldset>`;
}
function entityInspector(s, readOnly) {
  if (s.inspectorMode === "newEntity") {
    const item = s.newEntity || {
      section: "components",
      id: "",
      text: '{"title":"Новый объект"}',
    };
    return `<h3>Создать объект модели</h3><p class="di-inspector-notice">Создание войдёт в общий черновик. Файл проекта пока не изменяется.</p><label for="composer-entity-section">Раздел модели</label><select id="composer-entity-section">${options(
      s.sections.map((id) => [id, id]),
      item.section,
    )}</select><label for="composer-entity-id">Идентификатор объекта</label><input id="composer-entity-id" value="${escape(item.id || "")}" placeholder="company.new_system" ${readOnly ? "disabled" : ""}><div data-inspector-new-fields>${(() => {
      try {
        return inspectorFields(parseObject(item.text || "{}"), item.schema, {
          disabled: readOnly,
        });
      } catch {
        return '<p class="di-inspector-notice warning">Исправьте определение JSON.</p>';
      }
    })()}</div><details><summary>Расширенный JSON</summary><textarea id="composer-new-entity-json" class="di-inspector-json" ${readOnly ? "disabled" : ""}>${escape(item.text || "{}")}</textarea></details><button id="composer-entity-create" class="di-model-apply" ${readOnly ? "disabled" : ""}>Создать объект и добавить на схему</button><button id="composer-entity-cancel" class="secondary">Отменить создание</button>`;
  }
  const node = s.diagram.nodes.find((n) => n.key === s.selected),
    edge = s.diagram.edges.find((e) => e.key === s.selectedEdge),
    entity = selectedEntity(s),
    relation = selectedRelation(s),
    tabs = `<div class="di-inspector-tabs" role="tablist" aria-label="Свойства выбранного элемента">${[
      ["visual", "На схеме"],
      ["model", "В модели"],
      ["composition", "Состав"],
    ]
      .map(
        ([id, title]) =>
          `<button role="tab" data-composer-tab="${id}" aria-selected="${s.inspectorTab === id}">${title}</button>`,
      )
      .join("")}</div>`;
  if (!node && !edge)
    return `<div class="di-inspector-notice">Выберите узел или связь на полотне. Двойной щелчок открывает свойства объекта модели.</div><h3>Два вида изменений</h3><p class="composer-help"><span class="composer-scope visual">Только схема</span> Подписи, положение, зоны, визуальные связи.</p><p class="composer-help"><span class="composer-scope">Модель</span> Свойства, состав компонентов, реальные интеграции. Они попадут в файлы только через общий diff и проверку.</p><button id="composer-inspector-new-entity" ${readOnly ? "disabled" : ""}>Создать объект модели</button>${connectionForm(s, readOnly)}`;
  const heading = `<h3 class="di-object-heading">${escape(node?.title || edge?.title || "Связь")}</h3><div class="di-object-id">${escape(node?.ref ? node.ref.section + " / " + node.ref.id : edge?.binding ? JSON.stringify(edge.binding) : "Визуальный элемент; модель не меняется")}</div>${tabs}`;
  if (s.inspectorTab === "model") {
    if (node && !node.ref)
      return (
        heading +
        '<p class="di-inspector-notice">Этот узел существует только на схеме. Для реальной системы выберите «Создать объект модели» в палитре.</p>'
      );
    if (node && !entity?.value)
      return (
        heading +
        '<p class="di-inspector-notice warning">Объект не найден в текущей модели. Обновите рабочую область или исправьте ссылку.</p>'
      );
    if (node)
      return (
        heading +
        modelFields(s, entity, readOnly) +
        `<div class="composer-help">Источники и все свойства доступны в паспорте объекта.</div><button id="composer-node-source">Открыть паспорт</button>`
      );
    if (edge?.binding && !relation)
      return (
        heading +
        '<p class="di-inspector-notice warning">Привязка связи устарела или не найдена. Обновите рабочую область и выберите точную связь из модели.</p>'
      );
    if (relation)
      return (
        heading +
        modelFields(
          s,
          {
            ...relation,
            schema:
              relation.schema ||
              s.workspace?.effectiveEntities?.find(
                (e) => e.section === relation.selector?.section && e.schema,
              )?.schema ||
              s.relationSchemas?.[relation.selector?.section] ||
              (relation.adapter === "components.links"
                ? {
                    fields: [
                      {
                        name: "id",
                        title: "Получатель — объект модели",
                        type: "string",
                        required: true,
                        options: objectValues(
                          s.workspace?.model?.components,
                        ).map(([id, value]) => ({
                          value: id,
                          label: (value.title || id) + " · " + id,
                        })),
                      },
                      {
                        name: "direction",
                        title: "Направление взаимодействия в модели",
                        type: "string",
                        options: [
                          { value: "-->", label: "Источник → получатель" },
                          { value: "<--", label: "Источник ← получатель" },
                          { value: "<->", label: "Источник ↔ получатель" },
                          { value: "--", label: "Без направления" },
                        ],
                      },
                      {
                        name: "title",
                        title: "Название взаимодействия",
                        type: "string",
                      },
                      { name: "protocol", title: "Протокол", type: "string" },
                      {
                        name: "data",
                        title: "Передаваемые данные / описание",
                        type: "string",
                      },
                      {
                        name: "dataClassification",
                        title: "Классификация данных",
                        type: "string",
                      },
                      {
                        name: "encrypted",
                        title: "Шифрование",
                        type: "boolean",
                      },
                    ],
                  }
                : null),
          },
          readOnly,
          "relation",
        )
      );
    return (
      heading +
      `<p class="di-inspector-notice">Это визуальная связь. Её изменение не меняет интеграции модели.</p><button id="composer-edge-promote" ${readOnly ? "disabled" : ""}>Создать на её основе связь модели</button>${connectionForm(s, readOnly)}`
    );
  }
  if (s.inspectorTab === "composition") {
    if (!node?.ref || node.ref.section !== "components")
      return (
        heading +
        '<p class="di-inspector-notice">Для этого раздела нет поддержанной схемы состава. Произвольные свойства доступны во вкладке «В модели»; положение узлов не задаёт родителя.</p>'
      );
    const children = Array.isArray(entity?.children) ? entity.children : [],
      parent = entity?.parent;
    return (
      heading +
      `<p class="di-inspector-notice">Состав DocHub определяется идентификаторами <code>parent.child</code>. Перетаскивание не меняет состав и не переименовывает объекты.</p>${parent ? `<p class="composer-help">Родитель: ${escape(typeof parent === "string" ? parent : parent.id)}</p>` : ""}<h3>Прямые дочерние компоненты (${children.length})</h3><ul class="di-children">${
        children
          .map((child) => {
            const id = typeof child === "string" ? child : child.id,
              value = s.workspace?.model?.components?.[id];
            return `<li><button data-composer-child-open="${escape(id)}">${escape(value?.title || id)}<small class="di-object-id">${escape(id)}</small></button></li>`;
          })
          .join("") ||
        '<li class="composer-help">Прямых дочерних компонентов нет.</li>'
      }</ul><div class="di-child-form"><h3>Новый компонент в составе</h3><label for="composer-child-id">Полный ID дочернего компонента</label><input id="composer-child-id" value="${escape(s.childId || node.ref.id + ".new_component")}" ${readOnly ? "disabled" : ""}><label for="composer-child-title">Название</label><input id="composer-child-title" value="${escape(s.childTitle || "")}" placeholder="Обработчик заказа" ${readOnly ? "disabled" : ""}><label for="composer-child-owner">Владелец</label><input id="composer-child-owner" value="${escape(s.childOwner || entity?.value?.owner || "")}" list="composer-child-owners" ${readOnly ? "disabled" : ""}><datalist id="composer-child-owners">${(entity?.schema?.fields?.find((f) => f.name === "owner")?.options || []).map((o) => `<option value="${escape(o.value)}">`).join("")}</datalist>${contextChoices(s, "child", node.ref.id, readOnly)}<button id="composer-child-create" ${readOnly ? "disabled" : ""}>Включить компонент в черновик</button><button id="composer-child-reset" class="secondary">Отменить ввод компонента</button></div><p class="composer-help">Для изменения или удаления выберите дочерний компонент. Удаление объекта модели отдельно от удаления узла со схемы.</p>`
    );
  }
  if (node)
    return (
      heading +
      `<fieldset id="composer-node-fields"><legend class="composer-help">Визуальные свойства — только эта схема</legend><label for="composer-node-title">Подпись</label><input id="composer-node-title" value="${escape(node.title)}" maxlength="200"><div class="composer-mini-row"><label>Тип<select id="composer-node-kind">${options(Object.entries(KINDS), node.kind)}</select></label><label>Зона<select id="composer-node-zone"><option value="">Без зоны</option>${options(
        s.diagram.zones.map((z) => [z.id, z.title]),
        node.zone,
      )}</select></label></div><div class="composer-mini-row"><label>X<input id="composer-node-x" type="number" min="0" max="20000" value="${coordinate(node.x)}"></label><label>Y<input id="composer-node-y" type="number" min="0" max="20000" value="${coordinate(node.y)}"></label></div><p id="composer-node-reference" class="composer-help">${escape(node.ref ? node.ref.section + " / " + node.ref.id : "Визуальный узел — объект модели не создаётся.")}</p><div class="di-inspector-actions"><button id="composer-node-source" ${node.ref ? "" : "disabled"}>Открыть объект модели</button><button id="composer-node-remove" class="danger">Убрать со схемы</button></div><button id="composer-start-connection">Соединить с другим узлом</button></fieldset>${connectionForm(s, readOnly)}`
    );
  return (
    heading +
    `<p class="di-inspector-notice">${edge.binding ? "Подпись на этой схеме редактируется здесь. Реальная интеграция — во вкладке «В модели»." : "Изменения этой связи относятся только к схеме."}</p>${connectionForm(s, readOnly, edge)}<button id="composer-edge-remove-selected" class="composer-danger">Убрать связь со схемы</button>`
  );
}
function connectionForm(s, readOnly, edge) {
  const value = edge || s.connection || {},
    nodes = s.diagram.nodes.map((n) => [n.key, n.title + " · " + n.key]);
  const from =
      s.diagram.nodes.find((node) => node.key === (value.from || s.selected)) ||
      s.diagram.nodes[0],
    to =
      s.diagram.nodes.find((node) => node.key === value.to) ||
      s.diagram.nodes.find((node) => node.key !== from?.key) ||
      from,
    adapters = compatibleRelationAdapters(
      s.workspace?.adapters,
      from?.ref,
      to?.ref,
    ),
    adapter =
      adapters.find((item) => (item.id || item.section) === value.adapter) ||
      adapters[0];
  return `<details class="composer-connect-form" ${edge || s.connectionOpen || s.inspectorTab === "visual" ? "open" : ""}><summary>Соединить узлы</summary><div class="composer-mini-row"><label>Источник<select id="composer-edge-from" ${edge?.binding ? "disabled" : ""}>${options(nodes, value.from || s.selected)}</select></label><label>Получатель<select id="composer-edge-to" ${edge?.binding ? "disabled" : ""}>${options(nodes, value.to || s.diagram.nodes.find((n) => n.key !== s.selected)?.key)}</select></label></div><label for="composer-edge-scope">Что создать</label><select id="composer-edge-scope" ${edge ? "disabled" : ""}><option value="visual" ${value.scope !== "model" ? "selected" : ""}>Визуальную связь — только схема</option><option id="composer-model-scope-option" value="model" ${value.scope === "model" ? "selected" : ""} ${readOnly || !adapters.length ? "disabled" : ""}>Реальную интеграцию / поток модели</option></select><div id="composer-adapter-fields" ${value.scope === "model" ? "" : "hidden"}><label for="composer-edge-adapter">Хранение связи в модели</label><select id="composer-edge-adapter">${options(
    adapters.map((item) => [
      item.id || item.section,
      item.title || item.section || item.id,
    ]),
    adapter?.id || adapter?.section,
  )}</select><label for="composer-relation-id">ID самостоятельной интеграции (для раздела модели)</label><input id="composer-relation-id" value="${escape(value.id || "")}" placeholder="company.integration.order_delivery"></div><label for="composer-edge-title">Взаимодействие</label><input id="composer-edge-title" value="${escape(value.title || "")}" maxlength="200" placeholder="Подтвердить заказ"><div class="composer-mini-row"><label>Протокол<input id="composer-edge-protocol" value="${escape(value.protocol || "")}" maxlength="100" placeholder="HTTPS / Kafka"></label><label>Направление<select id="composer-edge-direction" ${edge?.binding ? "disabled" : ""}>${options(
    [
      ["directed", "Источник → получатель"],
      ["reverse", "Источник ← получатель"],
      ["bidirectional", "Двусторонняя ↔"],
      ["undirected", "Без направления"],
    ],
    value.direction || "directed",
  )}</select></label></div><label for="composer-edge-data">Передаваемые данные / описание</label><input id="composer-edge-data" value="${escape(value.data || "")}" maxlength="200" placeholder="Номер заказа и адрес"><p id="composer-adapter-warning" class="di-inspector-notice warning" ${adapters.length ? "hidden" : ""}>Для выбранных концов нет объявленного адаптера интеграции. Выберите поддержанные объекты или редактируйте сущность через JSON.</p><button id="composer-edge-add" ${value.scope === "model" && !adapters.length ? "disabled" : ""}>${edge ? "Обновить визуальную связь" : value.scope === "model" ? "Включить связь модели в черновик" : "Добавить визуальную связь"}</button><button id="composer-edge-cancel" ${edge || s.connectionDirty ? "" : "hidden"}>Отменить ввод связи</button><p class="composer-help">Связь модели требует объектов на обоих концах. Дополнительные свойства и справочники — во вкладке «В модели» после создания.</p></details>`;
}
export function composerPanel(state, esc = escape) {
  const s = composeState(state),
    d = s.diagram,
    model = s.workspace?.model || state.model || {},
    readOnly = !state.projects.find((p) => p.id === state.project)?.writable;
  s.sections = objectValues(model)
    .filter(([, value]) =>
      Object.values(value).some(
        (item) => item && typeof item === "object" && !Array.isArray(item),
      ),
    )
    .map(([id]) => id);
  if (!s.sections.length || Object.hasOwn(model, "components")) {
    if (!s.sections.includes("components")) s.sections.unshift("components");
  }
  const nodeOptions = d.nodes.map((n) => [n.key, n.title + " · " + n.key]),
    pending = pendingCount(s),
    classes = [
      "composer-layout",
      s.paletteCollapsed ? "palette-collapsed" : "",
      s.inspectorCollapsed ? "inspector-collapsed" : "",
    ].join(" "),
    zoom = s.camera.zoom;
  return `<link rel="stylesheet" href="/diagram-composer.css"><section class="composer-workspace"><header class="composer-head"><div><h1>Конструктор схем</h1><p>Выберите узел или связь. Свойства модели и оформление схемы изменяются явно и сохраняются одним проверенным черновиком.</p></div><div class="composer-filebar"><label class="sr-only" for="composer-list">Сохранённая схема</label><select id="composer-list"><option value="">Схема проекта…</option>${s.saved.map((item) => `<option value="${esc(item.id)}">${esc(item.title)} · ${esc(LEVELS[item.level] || item.level)}</option>`).join("")}</select><button id="composer-load" class="secondary">Открыть</button><button id="composer-reload" class="secondary" aria-label="Обновить список схем">↻</button><button id="composer-new" class="secondary">Новая схема</button></div></header><div class="composer-scope-line"><span class="composer-scope visual">Пунктир — только схема</span><span class="composer-scope">Сплошная связь — модель</span><span id="composer-semantic-count">Изменений модели в очереди: ${s.semanticOperations.length}${pending ? " · не включено полей: " + pending : ""}</span>${readOnly ? '<span class="di-readonly">Проект только для чтения: локальный эскиз доступен; модель и файлы менять нельзя.</span>' : ""}</div><div class="${classes}"><aside class="composer-side composer-palette ${s.paletteCollapsed ? "is-collapsed" : ""}" aria-label="Палитра и параметры схемы"><header class="composer-side-header"><h2>Объекты и схема</h2><button id="composer-toggle-palette" title="${s.paletteCollapsed ? "Открыть" : "Свернуть"} палитру" aria-expanded="${!s.paletteCollapsed}">${s.paletteCollapsed ? "›" : "‹"}</button></header><div class="composer-side-body ${s.paletteCollapsed ? "is-collapsed" : ""}"><label for="composer-palette-section">Раздел модели</label><select id="composer-palette-section">${options(
    s.sections.map((id) => [id, id]),
    s.paletteSection,
  )}</select><label for="composer-palette-filter">Найти объект</label><input id="composer-palette-filter" value="${esc(s.paletteFilter || "")}" placeholder="ID или название"><label for="composer-palette-object" class="sr-only">Объект</label><select id="composer-palette-object"></select><div class="composer-palette-actions"><button id="composer-palette-add">Добавить</button><button id="composer-new-entity" ${readOnly ? "disabled" : ""}>Создать в модели</button></div><p id="composer-palette-count" class="composer-help"></p><button id="composer-auto-links" class="secondary">Связи из модели</button><details open><summary>Параметры схемы</summary><label for="composer-id">ID схемы</label><input id="composer-id" value="${esc(d.id)}" maxlength="120" aria-describedby="composer-id-help"><small id="composer-id-help" class="composer-help">Латиница, цифры, точки, дефисы, подчёркивания.</small><label for="composer-title">Название</label><input id="composer-title" value="${esc(d.title)}" maxlength="200" required><label for="composer-level">Уровень</label><select id="composer-level">${options(Object.entries(LEVELS), d.level)}</select><label for="composer-description">Описание</label><textarea id="composer-description" rows="2" maxlength="1500">${esc(d.description)}</textarea></details><details open><summary id="composer-node-list-summary">На схеме (${d.nodes.length})</summary><label for="composer-node-key">Выбранный узел</label><select id="composer-node-key"><option value="">Выберите узел…</option>${options(nodeOptions, s.selected)}</select><ul class="composer-visual-list">${d.edges.map((e) => `<li><button data-composer-edge-edit="${esc(e.key)}">${esc(e.title || e.key)}</button> <button data-composer-edge-remove="${esc(e.key)}" aria-label="Убрать ${esc(e.title || e.key)} со схемы">×</button></li>`).join("")}</ul></details><details><summary>Добавить визуальный узел</summary><label for="composer-manual-title">Название узла</label><input id="composer-manual-title" value="${esc(s.manualTitle || "")}" maxlength="200" placeholder="Например, Gateway"><label for="composer-manual-kind">Тип</label><select id="composer-manual-kind">${options(Object.entries(KINDS), s.manualKind || "service")}</select><button id="composer-manual-add">Добавить визуальный узел</button><p class="composer-help">Только схема. Новую систему создайте кнопкой «Создать в модели».</p></details><details><summary>Зоны и границы доверия</summary><label for="composer-zone-id">ID зоны</label><input id="composer-zone-id" maxlength="120" value="${esc(s.zoneId || "")}"><label for="composer-zone-title">Название зоны</label><input id="composer-zone-title" maxlength="150" value="${esc(s.zoneTitle || "")}"><label for="composer-zone-trust">Описание доверия</label><input id="composer-zone-trust" maxlength="150" value="${esc(s.zoneTrust || "")}"><button id="composer-zone-add">Добавить или изменить зону</button><ul class="composer-visual-list">${d.zones.map((z) => `<li>${esc(z.title)} <button data-composer-zone-remove="${esc(z.id)}" aria-label="Удалить зону ${esc(z.title)}">×</button></li>`).join("")}</ul><p class="composer-help">Визуальная граница; политики безопасности модели не меняются.</p></details></div></aside><section class="composer-canvas-panel"><header class="composer-canvas-heading"><h2>Полотно</h2><span id="composer-count">${d.nodes.length} узлов · ${d.edges.length} связей · ${d.zones.length} зон</span></header><div id="composer-chart" class="composer-chart ${s.connectMode ? "is-connect" : ""}" tabindex="0" aria-label="Визуальный редактор схемы. Пробел и перетаскивание — сдвиг, колесо — масштаб, Enter — свойства">${renderLocalDiagram(d, s.selected, { selectedEdge: s.selectedEdge })}${d.nodes.length ? "" : '<div class="composer-empty"><strong>Соберите архитектуру на полотне</strong><span>Добавьте существующие объекты из палитры<br>или создайте объект модели.</span></div>'}</div><footer class="composer-canvas-help"><span>Колесо — масштаб · фон/пробел + drag — сдвиг · двойной щелчок — свойства модели</span><span id="composer-zoom-label">${Math.round(zoom * 100)}%</span></footer></section><aside class="composer-side composer-inspector ${s.inspectorCollapsed ? "is-collapsed" : ""}" aria-label="Контекстные свойства"><header class="composer-side-header"><h2>Свойства</h2><button id="composer-toggle-inspector" title="${s.inspectorCollapsed ? "Открыть" : "Свернуть"} свойства" aria-expanded="${!s.inspectorCollapsed}">${s.inspectorCollapsed ? "‹" : "›"}</button></header><div id="composer-inspector-body" class="composer-side-body ${s.inspectorCollapsed ? "is-collapsed" : ""}">${entityInspector(s, readOnly)}</div></aside></div><footer class="composer-bottom"><button id="composer-undo" class="secondary" ${s.undo.length ? "" : "disabled"} title="Ctrl+Z">↶ Отменить</button><button id="composer-redo" class="secondary" ${s.redo.length ? "" : "disabled"} title="Ctrl+Shift+Z">↷ Повторить</button><button id="composer-connect" class="secondary ${s.connectMode ? "is-active" : ""}" aria-pressed="${s.connectMode}">Соединить</button><button id="composer-focus" class="secondary" aria-pressed="${!!s.focus}">${s.focus ? "Вернуть меню" : "Больше места"}</button><button id="composer-fit" class="secondary">Вписать</button><button id="composer-layout" class="secondary">Упорядочить</button><label class="sr-only" for="composer-zoom">Масштаб</label><select id="composer-zoom">${options(
    [...new Set([0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, Number(zoom.toFixed(4))])]
      .sort((a, b) => a - b)
      .map((v) => [String(v), Math.round(v * 100) + "%"]),
    String(Number(zoom.toFixed(4))),
  )}</select><button id="composer-export-svg" class="secondary" ${s.preview ? "" : "disabled"}>SVG</button><span class="di-spacer"></span><button id="composer-preview" class="di-secondary" ${pending ? "disabled" : ""}>Предпросмотр и diff</button><button id="composer-stage" class="di-primary" ${s.preview && !readOnly && !pending ? "" : "disabled"}>Сохранить черновик</button><button id="composer-open-drafts" class="secondary">Черновики</button></footer><div id="composer-status" class="composer-status ${s.storageFailure ? "error" : ""}" role="status" aria-live="polite">${esc(s.status || "Изменения сохраняются как локальный эскиз. Файлы проекта ещё не менялись.")}</div><details class="composer-footer-details" ${s.semanticOperations.length ? "open" : ""}><summary>Что будет изменено: модель ${s.semanticOperations.length} · файлы ${s.preview?.changes?.length || 0}</summary><ol class="di-queue">${s.semanticOperations.map((op, index) => `<li>${esc(operationCaption(op))} <button data-composer-operation-remove="${index}" class="secondary">Убрать операцию</button></li>`).join("")}</ol><ul id="composer-files">${(s.preview?.changes || []).map((f) => `<li><code>${esc(f.path)}</code></li>`).join("")}</ul>${impactsMarkup(s.preview?.impacts || s.workspace?.impacts || [])}${(s.preview?.unresolvedReferences || []).length ? `<p class="di-inspector-notice error">Остались ссылки на удалённые объекты. Исправьте ссылки или отмените удаление; сохранить такой черновик нельзя.</p>` : ""}${s.preview?.impacts?.length ? '<label class="di-delete-confirm"><input type="checkbox" id="composer-ack-impacts">Я изучил влияние удаления и намеренно включаю его в черновик</label>' : ""}<p class="composer-help">Один черновик → diff → проверка SEAF → сохранение Git-коммита или локальной ревизии → обновление портала. Push не выполняется автоматически.</p><button id="composer-export-sketch" class="secondary">Скачать локальный эскиз и ввод JSON</button><button id="composer-refresh-workspace" class="secondary">Обновить данные модели</button></details></section>`;
}
export function composerDraftChanged(state) {
  const draft = state.activeDraft;
  if (!draft?.composer || (draft.project && draft.project !== state.project))
    return false;
  const current = state.composerProjects?.[state.project];
  if (!current || current.diagram.id !== draft.composer.id) return false;
  if (current.stagedDraft?.id === draft.id)
    return (
      current.version !== current.stagedDraft.version ||
      pendingCount(current) > 0
    );
  return !!(
    current.dirty ||
    pendingCount(current) ||
    current.semanticOperations?.length
  );
}
export function composerApplied(state, draft, result) {
  if (
    !draft?.composer ||
    !["applied", "committed_reload_failed", "saved_reload_failed"].includes(
      result.status,
    ) ||
    !(result.commit || result.revision?.id)
  )
    return;
  const project = draft.project || state.project,
    current = state.composerProjects?.[project];
  if (
    !current ||
    current.diagram.id !== draft.composer.id ||
    (project !== state.project && current.stagedDraft?.id !== draft.id)
  )
    return;
  const applied = draft.semanticOperations || [],
    prefix =
      JSON.stringify(current.semanticOperations.slice(0, applied.length)) ===
      JSON.stringify(applied),
    unchanged =
      current.stagedDraft?.id === draft.id &&
      current.version === current.stagedDraft.version &&
      pendingCount(current) === 0;
  if (prefix) current.semanticOperations.splice(0, applied.length);
  current.preview = null;
  current.workspace = null;
  current.undo = [];
  current.redo = [];
  current.stagedDraft = null;
  current.version++;
  if (unchanged && prefix) {
    current.pending = {};
    current.dirty = false;
    current.connectionDirty = false;
    current.childInputDirty = false;
    current.newEntity = null;
  }
  current.status =
    unchanged && prefix
      ? "Версия сохранена в проекте. Новые правки будут отдельным черновиком."
      : "Версия сохранена. Более новые локальные правки сохранены отдельно; повторите чтение и предпросмотр.";
  try {
    const saved = JSON.parse(localStorage.getItem(keyFor(project)) || "{}");
    localStorage.setItem(
      keyFor(project),
      JSON.stringify({
        ...saved,
        diagram: current.diagram,
        semanticOperations: current.semanticOperations,
        pending: current.pending,
        dirty: current.dirty,
        undo: [],
        redo: [],
        version: current.version,
        stagedDraft: null,
      }),
    );
  } catch {
    current.storageFailure = true;
  }
}

export function bindComposerPanel({
  state,
  root,
  api,
  notify = () => {},
  acceptDraft,
  render,
  openObject,
}) {
  const s = composeState(state),
    project = state.project,
    $ = (id) => root.querySelector("#" + id),
    chart = $("composer-chart");
  if (!chart) return;
  s.bindingController?.abort();
  const controller = new AbortController();
  s.bindingController = controller;
  let drag = null,
    pan = null,
    lastCheckpoint = 0,
    space = false,
    workspaceSequence = 0;
  const writable = () =>
    !!state.projects.find((p) => p.id === project)?.writable;
  const live = () =>
    !controller.signal.aborted &&
    root.isConnected &&
    state.project === project &&
    state.view === "composer" &&
    $("composer-chart") === chart;
  const request = (action, args = {}) => api(action, { ...args, project });
  const on = (id, event, fn) => {
    const element = $(id);
    if (element) element["on" + event] = fn;
  };
  const selected = () => s.diagram.nodes.find((n) => n.key === s.selected);
  const selectedEdge = () =>
    s.diagram.edges.find((e) => e.key === s.selectedEdge);
  const effectiveModel = () => s.workspace?.model || state.model || {};
  const rebuild = () => {
    if (live()) render();
  };
  function persist() {
    try {
      localStorage.setItem(
        keyFor(project),
        JSON.stringify({
          format: "seaf-composer-sketch-v2",
          diagram: s.diagram,
          semanticOperations: s.semanticOperations,
          pending: s.pending,
          dirty: s.dirty,
          version: s.version,
          stagedDraft: s.stagedDraft,
          selected: s.selected,
          selectedEdge: s.selectedEdge,
          inspectorTab: s.inspectorTab,
          inspectorMode: s.inspectorMode,
          undo: s.undo.slice(-20),
          redo: s.redo.slice(-20),
          camera: s.camera,
          paletteCollapsed: s.paletteCollapsed,
          inspectorCollapsed: s.inspectorCollapsed,
          focus: s.focus,
          paletteSection: s.paletteSection,
          paletteFilter: s.paletteFilter,
          newEntity: s.newEntity,
          connection: s.connection,
          connectionDirty: s.connectionDirty,
          childId: s.childId,
          childTitle: s.childTitle,
          childOwner: s.childOwner,
          childInputDirty: s.childInputDirty,
          childContexts: s.childContexts,
          pendingBindings: s.pendingBindings,
        }),
      );
      s.storageFailure = false;
    } catch {
      s.storageFailure = true;
      s.status =
        "Браузер не смог сохранить ввод. Не закрывайте страницу: скачайте эскиз и ввод JSON или подготовьте серверный черновик.";
    }
    syncStatus();
  }
  function checkpoint() {
    s.undo.push(snapshot(s));
    if (s.undo.length > 30) s.undo.shift();
    s.redo = [];
  }
  function editCheckpoint() {
    if (Date.now() - lastCheckpoint > 750) {
      checkpoint();
      lastCheckpoint = Date.now();
    }
  }
  function syncStatus() {
    if (!live()) return;
    const pending = pendingCount(s);
    $("composer-stage").disabled =
      !s.preview ||
      !writable() ||
      !!pending ||
      !!s.preview?.unresolvedReferences?.length ||
      (!!s.preview?.impacts?.some((impact) => impact.references?.length) &&
        !$("composer-ack-impacts")?.checked);
    $("composer-preview").disabled = !!pending;
    $("composer-export-svg").disabled = !s.preview;
    $("composer-undo").disabled = !s.undo.length;
    $("composer-redo").disabled = !s.redo.length;
    $("composer-status").textContent = s.storageFailure
      ? "Не удалось сохранить ввод в браузере. Скачайте эскиз JSON до закрытия страницы."
      : s.status || "Локальный эскиз; файлы проекта не менялись.";
    $("composer-status").classList.toggle("error", !!s.storageFailure);
    $("composer-semantic-count").textContent =
      `Изменений модели в очереди: ${s.semanticOperations.length}${pending ? " · не включено форм: " + pending : ""}`;
  }
  function mark(message) {
    s.version++;
    s.dirty = true;
    s.preview = null;
    s.acknowledgeImpacts = false;
    if (
      state.activeDraft?.composer?.id === s.diagram.id &&
      state.activeDraft.id === s.stagedDraft?.id
    ) {
      state.editorPending = true;
      state.validation = null;
      state.proposalId = null;
    }
    s.status =
      message ||
      "Локальный эскиз изменён. Повторите предпросмотр; файлы проекта ещё не менялись.";
    persist();
  }
  function error(error) {
    s.preview = null;
    s.status = error.message || String(error);
    syncStatus();
    notify(s.status, true);
  }
  const run = (fn) => async (event) => {
    if (s.busy) return;
    s.busy = true;
    const controls = [
      ...root.querySelectorAll(
        ".composer-workspace input,.composer-workspace select,.composer-workspace button,.composer-workspace textarea",
      ),
    ].map((element) => [element, element.disabled]);
    for (const [element] of controls) element.disabled = true;
    try {
      await fn(event);
    } catch (e) {
      error(e);
    } finally {
      s.busy = false;
      if (live()) {
        for (const [element, disabled] of controls)
          if (element.isConnected) element.disabled = disabled;
        syncStatus();
      }
    }
  };
  const nextKey = (prefix, list) => {
    let i = 1;
    while (list.some((item) => item.key === prefix + i)) i++;
    return prefix + i;
  };
  function drawCanvas() {
    const layout = root.querySelector(".composer-layout"),
      toolbar = root.querySelector(".composer-bottom"),
      status = $("composer-status");
    const fitHeight = Math.max(
      275,
      Math.min(
        850,
        window.innerHeight -
          (layout.getBoundingClientRect().top + window.scrollY) -
          (toolbar?.offsetHeight || 50) -
          (status?.offsetHeight || 35) -
          24,
      ),
    );
    if (Math.abs(layout.getBoundingClientRect().height - fitHeight) > 1) {
      layout.style.minHeight = "0";
      layout.style.height = fitHeight + "px";
      chart.style.minHeight = "200px";
    }
    const focus = document.activeElement?.closest?.(
        "[data-composer-node],[data-composer-edge]",
      ),
      focusedNode = focus?.dataset.composerNode,
      focusedEdge = focus?.dataset.composerEdge;
    chart.innerHTML =
      renderLocalDiagram(s.diagram, s.selected, {
        selectedEdge: s.selectedEdge,
      }) +
      (s.diagram.nodes.length
        ? ""
        : '<div class="composer-empty"><strong>Соберите архитектуру на полотне</strong><span>Добавьте объект из палитры или создайте его в модели.</span></div>');
    const svg = chart.querySelector("svg"),
      width = Math.max(100, chart.clientWidth),
      height = Math.max(100, chart.clientHeight);
    svg.setAttribute(
      "viewBox",
      `${s.camera.x} ${s.camera.y} ${width / s.camera.zoom} ${height / s.camera.zoom}`,
    );
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "100%");
    $("composer-count").textContent =
      `${s.diagram.nodes.length} узлов · ${s.diagram.edges.length} связей · ${s.diagram.zones.length} зон`;
    if ($("composer-node-list-summary"))
      $("composer-node-list-summary").textContent =
        `На схеме (${s.diagram.nodes.length})`;
    $("composer-zoom-label").textContent =
      Math.round(s.camera.zoom * 100) + "%";
    const select = $("composer-zoom"),
      value = String(Number(s.camera.zoom.toFixed(4)));
    if (![...select.options].some((o) => o.value === value))
      select.add(new Option(Math.round(s.camera.zoom * 100) + "%", value));
    select.value = value;
    const target = [
      ...chart.querySelectorAll("[data-composer-node],[data-composer-edge]"),
    ].find((el) =>
      focusedNode
        ? el.dataset.composerNode === focusedNode
        : focusedEdge && el.dataset.composerEdge === focusedEdge,
    );
    target?.focus({ preventScroll: true });
  }
  function inspector() {
    const body = $("composer-inspector-body"),
      scroll = body.scrollTop,
      focused = body.contains(document.activeElement)
        ? {
            id: document.activeElement.id,
            field: document.activeElement.dataset.inspectorField,
            start: document.activeElement.selectionStart,
            end: document.activeElement.selectionEnd,
          }
        : null;
    body.innerHTML = entityInspector(s, !writable());
    body.scrollTop = scroll;
    bindInspector();
    if (focused) {
      const replacement = focused.id
        ? $(focused.id)
        : [...body.querySelectorAll("[data-inspector-field]")].find(
            (element) => element.dataset.inspectorField === focused.field,
          );
      replacement?.focus({ preventScroll: true });
      if (replacement?.setSelectionRange && typeof focused.start === "number")
        try {
          replacement.setSelectionRange(focused.start, focused.end);
        } catch {}
    }
    const selector = $("composer-node-key");
    if (selector) {
      selector.innerHTML =
        '<option value="">Выберите узел…</option>' +
        options(
          s.diagram.nodes.map((node) => [
            node.key,
            node.title + " · " + node.key,
          ]),
          s.selected,
        );
      selector.value = s.selected || "";
    }
  }
  function chooseNode(key, tab = "visual") {
    s.selected = key;
    s.selectedEdge = "";
    s.inspectorMode = "selection";
    s.inspectorTab = tab;
    s.inspectorCollapsed = false;
    persist();
    inspector();
    paintSelection();
    if (
      !s.workspace?.effectiveEntities?.some((e) =>
        sameReference(e, selected()?.ref),
      )
    )
      void refreshWorkspace().catch(error);
  }
  function chooseEdge(key, tab) {
    s.selected = "";
    s.selectedEdge = key;
    s.inspectorMode = "selection";
    s.inspectorTab = tab || "visual";
    s.inspectorCollapsed = false;
    persist();
    inspector();
    paintSelection();
    void hydrateRelationSchema();
  }
  async function hydrateRelationSchema() {
    const relation = selectedRelation(s);
    if (s.inspectorTab !== "model" || relation?.kind !== "entity") return;
    const section = relation.selector.section;
    s.relationSchemas ||= {};
    s.loadingSchemas ||= {};
    if (
      s.relationSchemas[section] ||
      s.loadingSchemas[section] ||
      s.workspace?.effectiveEntities?.some(
        (entity) => entity.section === section && entity.schema,
      )
    )
      return;
    s.loadingSchemas[section] = true;
    try {
      const schema = await request("editor_schema", { section });
      if (!live()) return;
      s.relationSchemas[section] = schema;
      inspector();
    } catch (e) {
      if (live()) {
        s.status =
          "Не удалось прочитать схему взаимодействия: " +
          e.message +
          ". Доступен расширенный JSON.";
        syncStatus();
      }
    } finally {
      s.loadingSchemas[section] = false;
    }
  }
  function paintSelection() {
    for (const element of chart.querySelectorAll("[data-composer-node]")) {
      const node = s.diagram.nodes.find(
          (item) => item.key === element.dataset.composerNode,
        ),
        box = element.querySelector(".di-node-box");
      if (!node || !box) continue;
      box.setAttribute(
        "stroke",
        node.key === s.selected
          ? "#b96d19"
          : node.ref
            ? {
                network: "#315b9c",
                application: "#007d68",
                component: "#7952a8",
              }[s.diagram.level] || "#007d68"
            : "#70839a",
      );
      box.setAttribute("stroke-width", node.key === s.selected ? "4" : "2");
      element.setAttribute("aria-pressed", String(node.key === s.selected));
    }
    for (const element of chart.querySelectorAll("[data-composer-edge]")) {
      const edge = s.diagram.edges.find(
          (item) => item.key === element.dataset.composerEdge,
        ),
        line = element.querySelector(".di-edge-line");
      if (!edge || !line) continue;
      line.setAttribute(
        "stroke",
        edge.key === s.selectedEdge
          ? "#be6b16"
          : edge.binding
            ? "#007d68"
            : "#657a91",
      );
      line.setAttribute(
        "stroke-width",
        edge.key === s.selectedEdge ? "3.5" : "2",
      );
      element.setAttribute("aria-pressed", String(edge.key === s.selectedEdge));
    }
  }
  function addNode(node, { record = true } = {}) {
    if (s.diagram.nodes.length >= 200)
      throw Error("Допускается не более 200 узлов.");
    if (record) checkpoint();
    const i = s.diagram.nodes.length;
    s.diagram.nodes.push({
      ...node,
      key: nextKey("node", s.diagram.nodes),
      zone: node.zone || "",
      x: coordinate(node.x ?? 50 + (i % 3) * 310),
      y: coordinate(node.y ?? 70 + Math.floor(i / 3) * 190),
    });
    s.selected = s.diagram.nodes.at(-1).key;
    s.selectedEdge = "";
    s.inspectorMode = "selection";
    s.inspectorTab = "visual";
    return s.diagram.nodes.at(-1);
  }
  function ensureNode(ref) {
    let node = s.diagram.nodes.find((n) => sameReference(n.ref, ref));
    if (!node) {
      const value = effectiveModel()?.[ref.section]?.[ref.id];
      if (!value) return null;
      node = addNode(
        {
          ref: clone(ref),
          title: value.title || ref.id,
          kind:
            s.diagram.level === "network"
              ? "server"
              : s.diagram.level === "component"
                ? "component"
                : "service",
        },
        { record: false },
      );
    }
    return node;
  }
  function reconcileBindings() {
    const selection = {
      selected: s.selected,
      selectedEdge: s.selectedEdge,
      inspectorTab: s.inspectorTab,
      inspectorMode: s.inspectorMode,
    };
    for (const edge of s.diagram.edges) {
      const pending = s.pendingBindings?.[edge.key],
        relation = relationForBinding(
          s.workspace?.relations || [],
          edge.binding,
          { strict: !pending },
        );
      if (!relation) continue;
      if (pending) {
        edge.binding = bindingForRelation(relation);
        delete s.pendingBindings[edge.key];
      }
      if (pending) {
        const from = ensureNode(relation.fromRef),
          to = ensureNode(relation.toRef);
        if (from && to) {
          edge.from = from.key;
          edge.to = to.key;
        }
      }
    }
    Object.assign(s, selection);
  }
  async function refreshWorkspace({ show = true } = {}) {
    const version = s.version,
      sequence = ++workspaceSequence,
      response = await request("diagram_workspace", {
        diagram: clone(s.diagram),
        semanticOperations: clone(s.semanticOperations),
      });
    if (!live() || version !== s.version || sequence !== workspaceSequence)
      return false;
    s.workspace = response;
    reconcileBindings();
    // Adding a missing endpoint must not replace the selected interaction.
    persist();
    if (show) {
      inspector();
      updatePalette();
      drawCanvas();
    }
    return true;
  }
  async function enqueue(operations, changeDiagram) {
    if (!writable()) throw Error("Проект только для чтения.");
    if (!state.online)
      throw Error(
        "Для подготовки изменений модели нужно подключение. Ввод остаётся в браузере.",
      );
    if (s.semanticOperations.length + operations.length > 100)
      throw Error("Не более 100 операций в одном черновике.");
    const nodeCount = s.diagram.nodes.length;
    const before = snapshot(s),
      oldRedo = clone(s.redo);
    checkpoint();
    try {
      s.semanticOperations.push(...clone(operations));
      changeDiagram?.();
    } catch (e) {
      Object.assign(s, before);
      s.undo.pop();
      s.redo = oldRedo;
      throw e;
    }
    mark(
      "Изменения модели включены в локальную очередь. Подготовьте общий diff и проверку.",
    );
    if (s.diagram.nodes.length > nodeCount)
      s.camera = cameraFit(
        s.diagram.nodes,
        chart.clientWidth,
        chart.clientHeight,
      );
    drawCanvas();
    await refreshWorkspace();
    rebuild();
  }
  function updatePalette() {
    const section = $("composer-palette-section").value || "components";
    s.paletteSection = section;
    s.paletteFilter = $("composer-palette-filter").value;
    const rows = objectValues(effectiveModel()[section]).filter(
      ([id, value]) =>
        !s.paletteFilter ||
        (id + " " + (value.title || ""))
          .toLowerCase()
          .includes(s.paletteFilter.toLowerCase()),
    );
    const select = $("composer-palette-object"),
      previous = select.value;
    select.innerHTML = rows
      .slice(0, 500)
      .map(
        ([id, value]) =>
          `<option value="${escape(id)}">${escape(value.title || id)} · ${escape(id)}</option>`,
      )
      .join("");
    if (rows.some(([id]) => id === previous)) select.value = previous;
    $("composer-palette-count").textContent =
      rows.length > 500
        ? `Найдено ${rows.length}; первые 500. Уточните поиск.`
        : `Найдено объектов: ${rows.length}`;
  }
  function connectionValue() {
    return {
      from: $("composer-edge-from")?.value || "",
      to: $("composer-edge-to")?.value || "",
      scope: $("composer-edge-scope")?.value || "visual",
      adapter: $("composer-edge-adapter")?.value || "",
      id: $("composer-relation-id")?.value || "",
      title: $("composer-edge-title")?.value || "",
      protocol: $("composer-edge-protocol")?.value || "",
      data: $("composer-edge-data")?.value || "",
      direction: $("composer-edge-direction")?.value || "directed",
    };
  }
  function adjustBindings(operation) {
    s.pendingBindings ||= {};
    if (operation.kind === "entity" && operation.mode === "patch")
      for (const edge of s.diagram.edges)
        if (
          edge.binding?.adapter === "entity" &&
          edge.binding.section === operation.section &&
          edge.binding.id === operation.id
        ) {
          s.pendingBindings[edge.key] = true;
          Object.assign(edge, {
            title: operation.value.title || "",
            protocol: operation.value.protocol || "",
            data: operation.value.data || "",
            direction: modelLinkDirection(operation.value.direction),
          });
        }
    if (operation.kind === "link") {
      const related = s.diagram.edges.filter(
        (e) =>
          e.binding?.adapter === "components.links" &&
          e.binding.from === operation.from,
      );
      for (const edge of related) {
        if (
          operation.mode === "delete" &&
          edge.binding.index === operation.index &&
          edge.binding.beforeHash === operation.beforeHash
        )
          s.diagram.edges = s.diagram.edges.filter((e) => e !== edge);
        else if (
          operation.mode === "delete" &&
          edge.binding.index > operation.index
        )
          edge.binding.index--;
        else if (
          operation.mode === "patch" &&
          edge.binding.index === operation.index &&
          edge.binding.beforeHash === operation.beforeHash
        ) {
          s.pendingBindings[edge.key] = true;
          Object.assign(edge, {
            title: operation.value.title || "",
            protocol: operation.value.protocol || "",
            data: operation.value.data || "",
            direction: modelLinkDirection(operation.value.direction),
          });
        }
      }
    }
  }
  async function createConnection() {
    const value = connectionValue(),
      from = s.diagram.nodes.find((n) => n.key === value.from),
      to = s.diagram.nodes.find((n) => n.key === value.to),
      existing = selectedEdge();
    if (!from || !to) throw Error("Выберите источник и получатель.");
    if (existing || value.scope === "visual") {
      checkpoint();
      const edge = existing || { key: nextKey("edge", s.diagram.edges) };
      Object.assign(edge, {
        from: value.from,
        to: value.to,
        title: value.title,
        protocol: value.protocol,
        data: value.data,
        direction: value.direction,
      });
      if (!existing) s.diagram.edges.push(edge);
      s.connection = {};
      s.connectionDirty = false;
      s.selectedEdge = edge.key;
      s.selected = "";
      mark();
      rebuild();
      return;
    }
    if (!from.ref || !to.ref)
      throw Error("Реальная связь требует объектов модели на обоих концах.");
    const payload = {
      title: value.title,
      protocol: value.protocol,
      ...(value.data ? { data: value.data } : {}),
    };
    let operation, binding;
    if (value.adapter === "components.links") {
      if (from.ref.section !== "components" || to.ref.section !== "components")
        throw Error(
          "components.links связывает только компоненты. Для другой метамодели выберите объявленный адаптер.",
        );
      const index = (effectiveModel().components?.[from.ref.id]?.links || [])
        .length;
      operation = {
        kind: "link",
        mode: "create",
        from: from.ref.id,
        value: {
          id: to.ref.id,
          ...payload,
          direction: storedLinkDirection(value.direction),
        },
      };
      binding = {
        adapter: "components.links",
        from: from.ref.id,
        index,
        beforeHash: "",
      };
    } else {
      const adapter = s.workspace?.adapters?.find(
        (a) =>
          a.kind === "entity" &&
          (a.section === value.adapter || a.id === value.adapter),
      );
      if (!adapter?.guidedEndpoints || adapter.endpointFields?.length !== 2)
        throw Error(
          "Метамодель не объявила два однозначных конца. Создайте сущность через свойства и JSON; неизвестное соответствие не угадывается.",
        );
      if (!value.id.trim())
        throw Error("Введите ID самостоятельной интеграции.");
      const [a, b] = adapter.endpointFields;
      if (from.ref.section !== a.section || to.ref.section !== b.section)
        throw Error(
          "Типы объектов не соответствуют концам выбранной интеграции.",
        );
      operation = {
        kind: "entity",
        mode: "create",
        section: adapter.section,
        id: value.id.trim(),
        value: { ...payload, [a.name]: from.ref.id, [b.name]: to.ref.id },
      };
      binding = {
        adapter: "entity",
        section: adapter.section,
        id: value.id.trim(),
      };
    }
    await enqueue([operation], () => {
      const edge = {
        key: nextKey("edge", s.diagram.edges),
        from: from.key,
        to: to.key,
        title: value.title,
        protocol: value.protocol,
        data: value.data,
        direction: value.direction,
        binding,
      };
      s.diagram.edges.push(edge);
      s.pendingBindings ||= {};
      s.pendingBindings[edge.key] = true;
      s.selectedEdge = edge.key;
      s.selected = "";
      s.inspectorTab = "model";
      s.connection = {};
      s.connectionDirty = false;
    });
  }
  function removeModelRefs(ref) {
    const keys = s.diagram.nodes
      .filter((n) => sameReference(n.ref, ref))
      .map((n) => n.key);
    s.diagram.nodes = s.diagram.nodes.filter((n) => !keys.includes(n.key));
    s.diagram.edges = s.diagram.edges.filter(
      (e) =>
        !keys.includes(e.from) &&
        !keys.includes(e.to) &&
        !(
          e.binding?.adapter === "entity" &&
          e.binding.section === ref.section &&
          e.binding.id === ref.id
        ),
    );
    s.selected = "";
    s.selectedEdge = "";
    delete s.pending[entityKey(ref)];
  }
  function bindInspector() {
    for (const button of root.querySelectorAll("[data-composer-tab]"))
      button.onclick = () => {
        s.inspectorTab = button.dataset.composerTab;
        persist();
        inspector();
        void hydrateRelationSchema();
      };
    on("composer-node-source", "click", () => {
      const node = selected();
      if (node?.ref)
        openObject?.(node.ref.section, node.ref.id, { edit: false });
    });
    for (const [field, id] of [
      ["title", "composer-node-title"],
      ["kind", "composer-node-kind"],
      ["zone", "composer-node-zone"],
      ["x", "composer-node-x"],
      ["y", "composer-node-y"],
    ])
      on(id, "input", () => {
        const node = selected();
        if (!node) return;
        editCheckpoint();
        node[field] = ["x", "y"].includes(field)
          ? coordinate($(id).value)
          : $(id).value;
        mark();
        drawCanvas();
      });
    on("composer-node-remove", "click", () => {
      if (!selected()) return;
      checkpoint();
      const key = s.selected;
      s.diagram.nodes = s.diagram.nodes.filter((n) => n.key !== key);
      s.diagram.edges = s.diagram.edges.filter(
        (e) => e.from !== key && e.to !== key,
      );
      s.selected = "";
      mark("Узел убран только со схемы. Объект модели сохранён.");
      rebuild();
    });
    on("composer-start-connection", "click", () => {
      s.connectMode = true;
      s.connectFrom = s.selected;
      s.status =
        "Выберите узел-получатель на полотне. Тип связи выберите в свойствах.";
      chart.classList.add("is-connect");
      syncStatus();
    });
    on("composer-edge-remove-selected", "click", () => {
      checkpoint();
      s.diagram.edges = s.diagram.edges.filter((e) => e.key !== s.selectedEdge);
      s.selectedEdge = "";
      mark("Связь убрана только со схемы. Интеграция модели сохранена.");
      rebuild();
    });
    on("composer-edge-promote", "click", () => {
      const edge = selectedEdge();
      s.connection = { ...edge, scope: "model", adapter: "components.links" };
      s.connectionOpen = true;
      s.selectedEdge = "";
      s.inspectorTab = "visual";
      s.connectionDirty = true;
      mark("Выберите хранение связи модели и включите её в общий черновик.");
      inspector();
    });
    for (const id of [
      "composer-edge-from",
      "composer-edge-to",
      "composer-edge-title",
      "composer-edge-protocol",
      "composer-edge-data",
      "composer-edge-direction",
      "composer-edge-scope",
      "composer-edge-adapter",
      "composer-relation-id",
    ])
      on(id, "input", () => {
        editCheckpoint();
        s.connection = connectionValue();
        s.connectionDirty = true;
        if (
          [
            "composer-edge-from",
            "composer-edge-to",
            "composer-edge-scope",
          ].includes(id)
        ) {
          const from = s.diagram.nodes.find(
              (node) => node.key === s.connection.from,
            ),
            to = s.diagram.nodes.find((node) => node.key === s.connection.to),
            adapters = compatibleRelationAdapters(
              s.workspace?.adapters,
              from?.ref,
              to?.ref,
            ),
            select = $("composer-edge-adapter"),
            previous = select.value;
          select.innerHTML = options(
            adapters.map((adapter) => [
              adapter.id || adapter.section,
              adapter.title || adapter.id,
            ]),
            adapters.some(
              (adapter) => (adapter.id || adapter.section) === previous,
            )
              ? previous
              : adapters[0]?.id,
          );
          s.connection.adapter = select.value;
          $("composer-model-scope-option").disabled =
            !writable() || !adapters.length;
          $("composer-adapter-warning").hidden = !!adapters.length;
          $("composer-edge-add").disabled =
            s.connection.scope === "model" && !adapters.length;
        }
        mark(
          "Ввод связи ещё не включён. Добавьте связь или отмените ввод перед предпросмотром.",
        );
        if (id === "composer-edge-scope") {
          $("composer-adapter-fields").hidden = s.connection.scope !== "model";
          $("composer-edge-add").textContent =
            s.connection.scope === "model"
              ? "Включить связь модели в черновик"
              : "Добавить визуальную связь";
        }
        $("composer-edge-cancel").hidden = false;
      });
    on("composer-edge-add", "click", run(createConnection));
    on("composer-edge-cancel", "click", () => {
      s.connection = {};
      s.connectionDirty = false;
      s.selectedEdge = "";
      mark("Ввод связи отменён.");
      rebuild();
    });
    const entity = selectedEntity(s),
      relation = selectedRelation(s),
      current = s.inspectorTab === "model" ? relation || entity : null,
      container = $("composer-inspector-body").querySelector(
        "[data-inspector-buffer]",
      );
    if (current && container) {
      const key = container.dataset.inspectorBuffer,
        b = s.pending[key];
      on("composer-model-link-source", "change", () => {
        editCheckpoint();
        b.moveFrom = $("composer-model-link-source").value;
        b.dirty = true;
        mark(
          "Новый источник ещё не включён. Удаление и создание связи будут одним черновиком.",
        );
        $("composer-model-pending").textContent =
          "Есть ввод, ещё не включённый в черновик.";
      });
      for (const element of container.querySelectorAll(
        "[data-inspector-field]",
      )) {
        const capture = () => {
          try {
            editCheckpoint();
            const value = readField(element, parseObject(b.text));
            b.text = jsonText(value);
            b.dirty = true;
            const area = $("composer-model-json");
            if (area) area.value = b.text;
            mark(
              "Свойства введены локально. Включите изменение в черновик или отмените ввод.",
            );
            $("composer-model-pending").textContent =
              "Есть ввод, ещё не включённый в черновик.";
          } catch (e) {
            error(e);
          }
        };
        element.oninput = capture;
        if (element.tagName === "SELECT") element.onchange = capture;
      }
      on("composer-model-json", "input", () => {
        editCheckpoint();
        b.text = $("composer-model-json").value;
        b.dirty = true;
        mark(
          "JSON сохранён как локальный ввод. Включите его в черновик после исправления.",
        );
        $("composer-model-pending").textContent =
          "Есть ввод, ещё не включённый в черновик.";
      });
      on("composer-model-reset", "click", () => {
        checkpoint();
        delete s.pending[key];
        mark(
          "Ввод свойств отменён; очередь ранее включённых операций сохранена.",
        );
        inspector();
      });
      on(
        "composer-model-stage",
        "click",
        run(async () => {
          if (!b.dirty) throw Error("Свойства не изменены.");
          const actualHash = current.beforeHash || current.selector?.beforeHash;
          if (b.baseHash !== actualHash)
            throw Error(
              "Исходный объект изменился. Сохранённый ввод не потерян; отмените его или сопоставьте с новой моделью.",
            );
          if (
            relation?.adapter === "components.links" &&
            b.moveFrom &&
            b.moveFrom !== relation.selector.from
          ) {
            const value = parseObject(b.text),
              remove = linkOperation(relation, "", "delete"),
              create = {
                kind: "link",
                mode: "create",
                from: b.moveFrom,
                value,
              },
              index = (effectiveModel().components?.[b.moveFrom]?.links || [])
                .length;
            const moved = s.diagram.edges
                .filter(
                  (edge) =>
                    edge.binding?.adapter === "components.links" &&
                    edge.binding.from === relation.selector.from &&
                    edge.binding.index === relation.selector.index &&
                    edge.binding.beforeHash === relation.selector.beforeHash,
                )
                .map(clone),
              selectedKey = s.selectedEdge;
            await enqueue([remove, create], () => {
              adjustBindings(remove);
              const from = ensureNode({
                  section: "components",
                  id: b.moveFrom,
                }),
                to = ensureNode({ section: "components", id: value.id });
              for (const edge of moved) {
                Object.assign(edge, {
                  from: from.key,
                  to: to.key,
                  title: value.title || "",
                  protocol: value.protocol || "",
                  data: value.data || "",
                  direction: modelLinkDirection(value.direction),
                  binding: {
                    adapter: "components.links",
                    from: b.moveFrom,
                    index,
                    beforeHash: "",
                  },
                });
                s.diagram.edges.push(edge);
                s.pendingBindings ||= {};
                s.pendingBindings[edge.key] = true;
              }
              s.selected = "";
              s.selectedEdge = selectedKey;
              s.inspectorTab = "model";
              delete s.pending[key];
            });
            return;
          }
          const operation = relation
            ? relation.adapter === "components.links"
              ? linkOperation(
                  {
                    ...relation,
                    selector: { ...relation.selector, beforeHash: b.baseHash },
                  },
                  b.text,
                )
              : entityOperation(
                  {
                    ...relation.selector,
                    value: relation.value,
                    beforeHash: b.baseHash,
                  },
                  b.text,
                )
            : entityOperation({ ...entity, beforeHash: b.baseHash }, b.text);
          await enqueue([operation], () => {
            const next = parseObject(b.text);
            if (!relation && next.title !== entity.value.title)
              for (const node of s.diagram.nodes)
                if (
                  sameReference(node.ref, entity) &&
                  node.title === (entity.value.title || entity.id)
                )
                  node.title = next.title || entity.id;
            adjustBindings(operation);
            delete s.pending[key];
          });
        }),
      );
      on(
        "composer-model-delete",
        "click",
        run(async () => {
          if (
            !confirm(
              `Удалить ${relation ? "связь" : "объект"} из реальной модели? Файлы изменятся только после diff и проверки. Ссылки и влияние будут показаны до сохранения.`,
            )
          )
            return;
          const operation = relation
            ? relation.adapter === "components.links"
              ? linkOperation(relation, "", "delete")
              : entityOperation(
                  {
                    ...relation.selector,
                    value: relation.value,
                    beforeHash: relation.selector.beforeHash,
                  },
                  "",
                  "delete",
                )
            : entityOperation(entity, "", "delete");
          const contextOperations =
            !relation && entity.section === "components"
              ? [
                  ...root.querySelectorAll(
                    '[data-context-mode="delete"]:checked',
                  ),
                ].map((input) => {
                  const context = s.workspace.contexts.find(
                    (c) => c.id === input.dataset.composerContext,
                  );
                  return {
                    kind: "entity",
                    mode: "patch",
                    section: "contexts",
                    id: context.id,
                    beforeHash: context.beforeHash,
                    value: {
                      components: context.components.filter(
                        (id) => id !== entity.id,
                      ),
                    },
                  };
                })
              : [];
          await enqueue([...contextOperations, operation], () => {
            adjustBindings(operation);
            if (operation.kind === "entity") removeModelRefs(operation);
            if (relation) {
              s.selectedEdge = "";
              delete s.pending[key];
            }
          });
        }),
      );
    }
    for (const button of root.querySelectorAll("[data-inspector-refresh]"))
      button.onclick = run(async () => {
        await refreshWorkspace();
        inspector();
      });
    for (const button of root.querySelectorAll("[data-composer-child-open]"))
      button.onclick = () => {
        try {
          const existed = s.diagram.nodes.some(
            (node) =>
              node.ref?.section === "components" &&
              node.ref.id === button.dataset.composerChildOpen,
          );
          if (!existed) checkpoint();
          const node = ensureNode({
            section: "components",
            id: button.dataset.composerChildOpen,
          });
          if (node) {
            if (!existed) {
              mark("Компонент добавлен только на схему; модель не менялась.");
              s.camera = cameraFit(
                s.diagram.nodes,
                chart.clientWidth,
                chart.clientHeight,
              );
              drawCanvas();
            }
            chooseNode(node.key, "model");
            void refreshWorkspace().catch(error);
          }
        } catch (e) {
          error(e);
        }
      };
    for (const [id, key] of [
      ["composer-child-id", "childId"],
      ["composer-child-title", "childTitle"],
      ["composer-child-owner", "childOwner"],
    ])
      on(id, "input", () => {
        editCheckpoint();
        s[key] = $(id).value;
        s.childInputDirty = true;
        mark(
          "Заполненный состав ещё не включён в черновик. Добавьте компонент или отмените ввод.",
        );
      });
    for (const input of root.querySelectorAll('[data-context-mode="child"]'))
      input.onchange = () => {
        editCheckpoint();
        s.childContexts ||= {};
        s.childContexts[input.dataset.composerContext] = input.checked;
        s.childInputDirty = true;
        mark("Выбор контекстов ещё не включён в черновик.");
      };
    on("composer-child-reset", "click", () => {
      checkpoint();
      s.childInputDirty = false;
      s.childId = "";
      s.childTitle = "";
      s.childOwner = "";
      s.childContexts = {};
      mark("Ввод нового компонента отменён.");
      inspector();
    });
    on(
      "composer-child-create",
      "click",
      run(async () => {
        const parent = selectedEntity(s);
        if (parent?.section !== "components")
          throw Error(
            "Поддерживается состав DocHub components с точечными ID.",
          );
        const id = $("composer-child-id").value.trim(),
          title = $("composer-child-title").value.trim(),
          owner = $("composer-child-owner").value.trim();
        if (!title) throw Error("Введите название компонента.");
        const contexts = [
          ...root.querySelectorAll('[data-context-mode="child"]:checked'),
        ].map((input) =>
          s.workspace.contexts.find(
            (context) => context.id === input.dataset.composerContext,
          ),
        );
        await enqueue(
          [
            {
              kind: "child",
              mode: "create",
              parent: parent.id,
              id,
              value: {
                title,
                entity: "component",
                ...(owner ? { owner } : {}),
              },
            },
            ...contexts
              .filter((context) => context && !context.components.includes(id))
              .map((context) => ({
                kind: "entity",
                mode: "patch",
                section: "contexts",
                id: context.id,
                beforeHash: context.beforeHash,
                value: { components: [...context.components, id] },
              })),
          ],
          () => {
            s.childInputDirty = false;
            s.childId = "";
            s.childTitle = "";
            s.childOwner = "";
            s.childContexts = {};
            addNode(
              { title, kind: "component", ref: { section: "components", id } },
              { record: false },
            );
            s.inspectorTab = "model";
          },
        );
      }),
    );
    on("composer-new-entity", "click", () => newEntity());
    on("composer-inspector-new-entity", "click", () => newEntity());
    on("composer-entity-cancel", "click", () => {
      checkpoint();
      s.newEntity = null;
      s.inspectorMode = "selection";
      mark("Ввод нового объекта отменён.");
      inspector();
    });
    on(
      "composer-entity-section",
      "change",
      run(async () => {
        s.newEntity.section = $("composer-entity-section").value;
        s.newEntity.schema = await request("editor_schema", {
          section: s.newEntity.section,
        });
        s.newEntity.dirty = true;
        mark("Выберите свойства и включите новый объект в черновик.");
        inspector();
      }),
    );
    on("composer-entity-id", "input", () => {
      editCheckpoint();
      s.newEntity.id = $("composer-entity-id").value;
      s.newEntity.dirty = true;
      mark("Новый объект ещё не включён в черновик.");
    });
    on("composer-new-entity-json", "input", () => {
      editCheckpoint();
      s.newEntity.text = $("composer-new-entity-json").value;
      s.newEntity.dirty = true;
      mark("JSON нового объекта сохранён локально.");
    });
    if (s.inspectorMode === "newEntity")
      for (const element of $("composer-inspector-body").querySelectorAll(
        "[data-inspector-field]",
      )) {
        const capture = () => {
          try {
            editCheckpoint();
            s.newEntity.text = jsonText(
              readField(element, parseObject(s.newEntity.text)),
            );
            s.newEntity.dirty = true;
            $("composer-new-entity-json").value = s.newEntity.text;
            mark("Новый объект ещё не включён в черновик.");
          } catch (e) {
            error(e);
          }
        };
        element.oninput = capture;
        if (element.tagName === "SELECT") element.onchange = capture;
      }
    on(
      "composer-entity-create",
      "click",
      run(async () => {
        const item = s.newEntity,
          id = item?.id?.trim(),
          value = parseObject(item?.text || "{}");
        if (!id) throw Error("Введите идентификатор объекта.");
        await enqueue(
          [
            {
              kind: "entity",
              mode: "create",
              section: item.section,
              id,
              value,
            },
          ],
          () => {
            addNode(
              {
                ref: { section: item.section, id },
                title: value.title || id,
                kind: s.diagram.level === "component" ? "component" : "service",
              },
              { record: false },
            );
            s.newEntity = null;
            s.inspectorMode = "selection";
            s.inspectorTab = "model";
          },
        );
      }),
    );
  }
  async function newEntity() {
    if (!writable()) return;
    s.inspectorMode = "newEntity";
    s.inspectorCollapsed = false;
    s.newEntity ||= {
      section: s.paletteSection || "components",
      id: "",
      text: '{"title":""}',
      dirty: false,
      schema: null,
    };
    inspector();
    try {
      const section = s.newEntity.section,
        schema = await request("editor_schema", { section });
      if (live() && s.newEntity?.section === section) {
        s.newEntity.schema = schema;
        inspector();
      }
    } catch (e) {
      error(e);
    }
  }
  async function freshPreview() {
    if (pendingCount(s))
      throw Error(
        "Есть ввод, не включённый в черновик. Включите изменённые формы или отмените ввод.",
      );
    if (!s.diagram.nodes.length) throw Error("Добавьте хотя бы один узел.");
    const version = s.version,
      response = await request("diagram_preview", {
        diagram: clone(s.diagram),
        semanticOperations: clone(s.semanticOperations),
      });
    if (!live() || s.version !== version) return;
    s.preview = response;
    s.diagram = response.diagram;
    s.status = [
      `Предпросмотр готов: ${response.changes.length} файлов, ${s.semanticOperations.length} операций модели. Файлы пока не изменены.`,
      ...(response.warnings || []),
    ].join(" ");
    persist();
    rebuild();
  }
  // Palette and diagram-level controls remain independent of the contextual inspector.
  on("composer-palette-section", "change", () => {
    updatePalette();
    persist();
  });
  on("composer-palette-filter", "input", () => {
    updatePalette();
    persist();
  });
  updatePalette();
  on(
    "composer-palette-add",
    "click",
    run(async () => {
      const section = $("composer-palette-section").value,
        id = $("composer-palette-object").value,
        value = effectiveModel()[section]?.[id];
      if (!value) throw Error("Выберите объект проекта.");
      addNode({
        title: value.title || id,
        kind:
          s.diagram.level === "network"
            ? "server"
            : s.diagram.level === "component"
              ? "component"
              : "service",
        ref: { section, id },
      });
      mark();
      s.camera = cameraFit(
        s.diagram.nodes,
        chart.clientWidth,
        chart.clientHeight,
      );
      inspector();
      drawCanvas();
      await refreshWorkspace();
    }),
  );
  on("composer-new-entity", "click", () => newEntity());
  for (const [field, id] of [
    ["id", "composer-id"],
    ["title", "composer-title"],
    ["level", "composer-level"],
    ["description", "composer-description"],
  ])
    on(id, "input", () => {
      editCheckpoint();
      s.diagram[field] = $(id).value;
      mark();
    });
  for (const [id, key] of [
    ["composer-manual-title", "manualTitle"],
    ["composer-manual-kind", "manualKind"],
    ["composer-zone-id", "zoneId"],
    ["composer-zone-title", "zoneTitle"],
    ["composer-zone-trust", "zoneTrust"],
  ])
    on(id, "input", () => {
      s[key] = $(id).value;
      persist();
    });
  on("composer-manual-add", "click", () => {
    try {
      const title = $("composer-manual-title").value.trim();
      if (!title) throw Error("Введите название визуального узла.");
      addNode({ title, kind: $("composer-manual-kind").value });
      s.manualTitle = "";
      mark();
      rebuild();
    } catch (e) {
      error(e);
    }
  });
  on(
    "composer-auto-links",
    "click",
    run(async () => {
      await refreshWorkspace({ show: false });
      checkpoint();
      let added = 0;
      for (const relation of s.workspace?.relations || []) {
        const from = s.diagram.nodes.find((n) =>
            sameReference(n.ref, relation.fromRef),
          ),
          to = s.diagram.nodes.find((n) =>
            sameReference(n.ref, relation.toRef),
          );
        if (
          !from ||
          !to ||
          s.diagram.edges.some((e) => {
            const r = relationForBinding([relation], e.binding);
            return !!r;
          })
        )
          continue;
        if (s.diagram.edges.length >= 500) break;
        s.diagram.edges.push({
          key: nextKey("edge", s.diagram.edges),
          from: from.key,
          to: to.key,
          title: relation.value.title || "",
          protocol: relation.value.protocol || "",
          data: relation.value.data || "",
          direction: modelLinkDirection(relation.value.direction),
          binding: bindingForRelation(relation),
        });
        added++;
      }
      mark(
        `На схему добавлено связей модели: ${added}. Сами интеграции не изменялись.`,
      );
      rebuild();
    }),
  );
  on("composer-node-key", "change", () =>
    chooseNode($("composer-node-key").value),
  );
  on("composer-zone-add", "click", () => {
    try {
      const id = $("composer-zone-id").value.trim(),
        title = $("composer-zone-title").value.trim(),
        trust = $("composer-zone-trust").value.trim();
      if (!/^[A-Za-z0-9][A-Za-z0-9_.:-]{0,119}$/.test(id) || !title)
        throw Error("Введите ID и название зоны.");
      checkpoint();
      const old = s.diagram.zones.find((z) => z.id === id);
      if (old) Object.assign(old, { title, trust });
      else s.diagram.zones.push({ id, title, trust });
      mark();
      rebuild();
    } catch (e) {
      error(e);
    }
  });
  for (const button of root.querySelectorAll("[data-composer-zone-remove]"))
    button.onclick = () => {
      checkpoint();
      const id = button.dataset.composerZoneRemove;
      s.diagram.zones = s.diagram.zones.filter((z) => z.id !== id);
      for (const node of s.diagram.nodes) if (node.zone === id) node.zone = "";
      mark();
      rebuild();
    };
  for (const button of root.querySelectorAll("[data-composer-edge-edit]"))
    button.onclick = () => chooseEdge(button.dataset.composerEdgeEdit);
  for (const button of root.querySelectorAll("[data-composer-edge-remove]"))
    button.onclick = () => {
      checkpoint();
      s.diagram.edges = s.diagram.edges.filter(
        (e) => e.key !== button.dataset.composerEdgeRemove,
      );
      s.selectedEdge = "";
      mark("Связь убрана только со схемы.");
      rebuild();
    };
  for (const button of root.querySelectorAll(
    "[data-composer-operation-remove]",
  ))
    button.onclick = run(async () => {
      const index = Number(button.dataset.composerOperationRemove);
      if (
        index < s.semanticOperations.length - 1 &&
        !confirm(
          "Убрать эту и последующие зависимые операции? Предыдущие останутся. Для точного возврата используйте «Отменить».",
        )
      )
        return;
      checkpoint();
      s.semanticOperations.splice(index);
      s.pendingBindings = {};
      mark(
        "Операции убраны из очереди. Ввод форм сохранён. Если узел ссылается на отменённый новый объект, уберите его со схемы; перед повторной правкой проверьте основание формы.",
      );
      await refreshWorkspace();
      rebuild();
    });
  on("composer-toggle-palette", "click", () => {
    s.paletteCollapsed = !s.paletteCollapsed;
    persist();
    rebuild();
  });
  on("composer-toggle-inspector", "click", () => {
    s.inspectorCollapsed = !s.inspectorCollapsed;
    persist();
    rebuild();
  });
  on("composer-focus", "click", () => {
    s.focus = !s.focus;
    persist();
    rebuild();
  });
  on("composer-connect", "click", () => {
    s.connectMode = !s.connectMode;
    s.connectFrom = s.selected || "";
    s.status = s.connectMode
      ? "Выберите источник, затем получатель на полотне."
      : "Режим соединения выключен.";
    persist();
    rebuild();
  });
  on("composer-fit", "click", () => {
    s.camera = cameraFit(
      s.diagram.nodes,
      chart.clientWidth,
      chart.clientHeight,
    );
    drawCanvas();
    persist();
  });
  on("composer-zoom", "change", () => {
    s.camera = cameraZoom(
      s.camera,
      Number($("composer-zoom").value),
      chart.clientWidth / 2,
      chart.clientHeight / 2,
    );
    drawCanvas();
    persist();
  });
  on("composer-layout", "click", () => {
    checkpoint();
    s.diagram.nodes.forEach((node, i) =>
      Object.assign(node, {
        x: 50 + (i % 3) * 310,
        y: 70 + Math.floor(i / 3) * 190,
      }),
    );
    mark();
    s.camera = cameraFit(
      s.diagram.nodes,
      chart.clientWidth,
      chart.clientHeight,
    );
    inspector();
    drawCanvas();
  });
  function restoreHistory(direction) {
    const source = direction === "undo" ? s.undo : s.redo,
      target = direction === "undo" ? s.redo : s.undo;
    if (!source.length) return;
    target.push(snapshot(s));
    const restored = source.pop();
    if (restored.diagram) {
      Object.assign(s, clone(restored));
    } else if (validSketch(restored)) {
      s.diagram = restored;
      s.semanticOperations = [];
      s.pending = {};
    }
    s.preview = null;
    s.version++;
    s.dirty = true;
    s.status = "Локальные изменения восстановлены. Повторите предпросмотр.";
    persist();
    rebuild();
  }
  on("composer-undo", "click", () => restoreHistory("undo"));
  on("composer-redo", "click", () => restoreHistory("redo"));
  on("composer-new", "click", () => {
    if (
      (s.dirty || s.semanticOperations.length || pendingCount(s)) &&
      !confirm(
        "Начать новую схему и очистить текущий ввод? Скачать эскиз можно перед этим внизу. «Отменить» вернёт предыдущую работу.",
      )
    )
      return;
    checkpoint();
    Object.assign(s, {
      diagram: newDefinition(),
      semanticOperations: [],
      pending: {},
      selected: "",
      selectedEdge: "",
      newEntity: null,
      connection: {},
      connectionDirty: false,
      childInputDirty: false,
      pendingBindings: {},
      camera: { x: 0, y: 0, zoom: 1 },
    });
    mark();
    rebuild();
  });
  on(
    "composer-reload",
    "click",
    run(async () => {
      s.saved = await request("diagram_list");
      s.listLoaded = true;
      rebuild();
    }),
  );
  on(
    "composer-load",
    "click",
    run(async () => {
      const id = $("composer-list").value;
      if (!id) throw Error("Выберите схему проекта.");
      if (
        (s.dirty || s.semanticOperations.length || pendingCount(s)) &&
        !confirm(
          "Открыть сохранённую схему вместо локальных изменений? «Отменить» сможет вернуть текущую работу.",
        )
      )
        return;
      const loaded = await request("diagram_load", { id });
      if (!live()) return;
      checkpoint();
      Object.assign(s, {
        diagram: loaded.diagram,
        semanticOperations: [],
        pending: {},
        preview: null,
        selected: "",
        selectedEdge: "",
        newEntity: null,
        connection: {},
        connectionDirty: false,
        childInputDirty: false,
        dirty: false,
        pendingBindings: {},
      });
      s.version++;
      s.status =
        "Схема прочитана из " + loaded.file + ". Файлы проекта не изменялись.";
      await refreshWorkspace({ show: false });
      s.camera = cameraFit(
        s.diagram.nodes,
        chart.clientWidth,
        chart.clientHeight,
      );
      persist();
      rebuild();
    }),
  );
  on("composer-preview", "click", run(freshPreview));
  on("composer-ack-impacts", "change", syncStatus);
  on(
    "composer-stage",
    "click",
    run(async () => {
      if (!writable() || !s.preview || pendingCount(s))
        throw Error(
          "Подготовьте актуальный предпросмотр без не включённых форм.",
        );
      const preview = s.preview,
        version = s.version;
      if (preview.unresolvedReferences?.length)
        throw Error("Исправьте оставшиеся ссылки на удалённые объекты.");
      const draft = await request("diagram_draft", {
        diagram: clone(s.diagram),
        semanticOperations: clone(s.semanticOperations),
        revision: preview.revision,
        fingerprint: preview.fingerprint,
        viewHash: preview.viewHash,
        acknowledgeImpacts: !!$("composer-ack-impacts")?.checked,
      });
      if (!live() || s.version !== version) return;
      s.dirty = false;
      s.stagedDraft = {
        id: draft.id,
        version: s.version,
        viewHash: preview.viewHash,
      };
      s.status =
        "Общий черновик сохранён. Изучите diff, выполните проверку и сохранение.";
      persist();
      if (acceptDraft) await acceptDraft(draft);
      else {
        state.activeDraft = draft;
        state.view = "drafts";
        render();
      }
    }),
  );
  on("composer-open-drafts", "click", () => {
    state.view = "drafts";
    render();
  });
  function download(name, content, type) {
    const url = URL.createObjectURL(new Blob([content], { type })),
      a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  on("composer-export-svg", "click", () => {
    if (s.preview)
      download(s.diagram.id + ".svg", s.preview.svg, "image/svg+xml");
  });
  on("composer-export-sketch", "click", () =>
    download(
      s.diagram.id + "-work-in-progress.json",
      jsonText({
        format: "seaf-composer-sketch-v2",
        project,
        diagram: s.diagram,
        semanticOperations: s.semanticOperations,
        pending: s.pending,
        connection: s.connection,
        newEntity: s.newEntity,
      }),
      "application/json",
    ),
  );
  on(
    "composer-refresh-workspace",
    "click",
    run(async () => {
      await refreshWorkspace();
      s.status =
        "Рабочая область прочитана заново. Локальный ввод и очередь сохранены.";
      syncStatus();
    }),
  );
  // Pointer geometry changes stay visual; model mutation is never inferred from a drop.
  const point = (event) => {
    const rect = chart.getBoundingClientRect();
    return {
      x: s.camera.x + (event.clientX - rect.left) / s.camera.zoom,
      y: s.camera.y + (event.clientY - rect.top) / s.camera.zoom,
    };
  };
  chart.onpointerdown = (event) => {
    if (s.busy || event.button > 1) return;
    const target = event.target.closest(
      "[data-composer-node],[data-composer-edge]",
    );
    if (event.button === 1 || space || !target) {
      const p = point(event);
      pan = {
        x: p.x,
        y: p.y,
        camera: clone(s.camera),
        clientX: event.clientX,
        clientY: event.clientY,
      };
      chart.setPointerCapture(event.pointerId);
      chart.classList.add("is-panning");
      event.preventDefault();
      return;
    }
    if (target.dataset.composerEdge) {
      chooseEdge(target.dataset.composerEdge);
      return;
    }
    const key = target.dataset.composerNode,
      node = s.diagram.nodes.find((n) => n.key === key);
    if (!node) return;
    if (s.connectMode) {
      if (!s.connectFrom) {
        s.connectFrom = key;
        chooseNode(key);
        s.status = "Теперь выберите получатель.";
        syncStatus();
      } else {
        const from = s.connectFrom;
        s.connectMode = false;
        s.connectFrom = "";
        s.connection = {
          from,
          to: key,
          scope: "visual",
          direction: "directed",
        };
        s.connectionOpen = true;
        s.connectionDirty = false;
        chooseNode(from);
        inspector();
        rebuild();
      }
      event.preventDefault();
      return;
    }
    chooseNode(key, s.inspectorTab);
    const p = point(event);
    drag = {
      key,
      x: p.x,
      y: p.y,
      originalX: node.x,
      originalY: node.y,
      changed: false,
      pointerId: event.pointerId,
    };
    target.focus({ preventScroll: true });
  };
  chart.onpointermove = (event) => {
    if (pan) {
      s.camera.x = pan.camera.x - (event.clientX - pan.clientX) / s.camera.zoom;
      s.camera.y = pan.camera.y - (event.clientY - pan.clientY) / s.camera.zoom;
      drawCanvas();
      return;
    }
    if (!drag) return;
    const node = s.diagram.nodes.find((n) => n.key === drag.key);
    if (!node) return;
    const p = point(event),
      dx = p.x - drag.x,
      dy = p.y - drag.y;
    if (!drag.changed && Math.abs(dx) + Math.abs(dy) < 3 / s.camera.zoom)
      return;
    if (!drag.changed) {
      checkpoint();
      drag.changed = true;
      chart.setPointerCapture(event.pointerId);
    }
    node.x = coordinate(Math.round(drag.originalX + dx));
    node.y = coordinate(Math.round(drag.originalY + dy));
    if ($("composer-node-x")) $("composer-node-x").value = node.x;
    if ($("composer-node-y")) $("composer-node-y").value = node.y;
    drawCanvas();
  };
  function endPointer(event) {
    if (drag?.changed)
      mark("Положение узла изменено только на схеме; состав модели сохранён.");
    if (pan) persist();
    drag = null;
    pan = null;
    chart.classList.remove("is-panning");
    if (event && chart.hasPointerCapture(event.pointerId))
      chart.releasePointerCapture(event.pointerId);
  }
  chart.onpointerup = endPointer;
  chart.onpointercancel = endPointer;
  chart.ondblclick = (event) => {
    const node = event.target.closest("[data-composer-node]"),
      edge = event.target.closest("[data-composer-edge]");
    if (node) chooseNode(node.dataset.composerNode, "model");
    else if (edge) chooseEdge(edge.dataset.composerEdge, "model");
    setTimeout(
      () =>
        $("composer-inspector-body")
          ?.querySelector(
            "input:not(:disabled),select:not(:disabled),textarea:not(:disabled)",
          )
          ?.focus(),
      0,
    );
  };
  chart.onwheel = (event) => {
    event.preventDefault();
    const rect = chart.getBoundingClientRect();
    s.camera = cameraZoom(
      s.camera,
      s.camera.zoom * Math.exp(-event.deltaY * 0.0015),
      event.clientX - rect.left,
      event.clientY - rect.top,
    );
    drawCanvas();
    persist();
  };
  chart.onkeydown = (event) => {
    const target = event.target.closest(
      "[data-composer-node],[data-composer-edge]",
    );
    if (event.key === " ") {
      space = true;
      event.preventDefault();
      return;
    }
    if (event.key === "Escape") {
      s.connectMode = false;
      s.connectFrom = "";
      s.selected = "";
      s.selectedEdge = "";
      s.inspectorMode = "selection";
      persist();
      inspector();
      drawCanvas();
      return;
    }
    if (["+", "=", "-", "0"].includes(event.key)) {
      event.preventDefault();
      if (event.key === "0")
        s.camera = cameraFit(
          s.diagram.nodes,
          chart.clientWidth,
          chart.clientHeight,
        );
      else
        s.camera = cameraZoom(
          s.camera,
          s.camera.zoom * (event.key === "-" ? 0.8 : 1.25),
          chart.clientWidth / 2,
          chart.clientHeight / 2,
        );
      drawCanvas();
      persist();
      return;
    }
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "z") {
      event.preventDefault();
      event.stopPropagation();
      restoreHistory(event.shiftKey ? "redo" : "undo");
      return;
    }
    if (!target) return;
    if (event.key === "Enter") {
      event.preventDefault();
      if (target.dataset.composerNode)
        chooseNode(target.dataset.composerNode, "model");
      else chooseEdge(target.dataset.composerEdge, "model");
      return;
    }
    if (
      target.dataset.composerNode &&
      ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.key)
    ) {
      event.preventDefault();
      event.stopPropagation();
      s.selected = target.dataset.composerNode;
      const node = selected();
      checkpoint();
      const step = event.shiftKey ? 50 : 10;
      node.x = coordinate(
        node.x +
          (event.key === "ArrowLeft"
            ? -step
            : event.key === "ArrowRight"
              ? step
              : 0),
      );
      node.y = coordinate(
        node.y +
          (event.key === "ArrowUp"
            ? -step
            : event.key === "ArrowDown"
              ? step
              : 0),
      );
      mark();
      inspector();
      drawCanvas();
    }
  };
  window.addEventListener(
    "keyup",
    (event) => {
      if (event.key === " ") space = false;
    },
    { signal: controller.signal },
  );
  window.addEventListener(
    "blur",
    () => {
      space = false;
      drag = null;
      pan = null;
    },
    { signal: controller.signal },
  );
  window.addEventListener(
    "beforeunload",
    (event) => {
      if (s.storageFailure && s.dirty) {
        event.preventDefault();
        event.returnValue = "Есть несохранённый ввод.";
      }
    },
    { signal: controller.signal },
  );
  if (typeof ResizeObserver === "function") {
    const observer = new ResizeObserver(() => {
      if (live()) drawCanvas();
    });
    observer.observe(chart);
    controller.signal.addEventListener("abort", () => observer.disconnect(), {
      once: true,
    });
  }
  bindInspector();
  drawCanvas();
  syncStatus();
  if (!s.workspace || s.lastWorkspaceVersion !== s.version) {
    const version = s.version;
    void refreshWorkspace()
      .then((ok) => {
        if (ok) s.lastWorkspaceVersion = version;
      })
      .catch((e) => {
        if (live()) {
          s.status =
            "Данные модели для инспектора недоступны: " +
            e.message +
            ". Локальный эскиз сохранён.";
          syncStatus();
        }
      });
  }
  if (!s.listLoaded) {
    s.listLoaded = true;
    request("diagram_list")
      .then((items) => {
        if (!live()) return;
        s.saved = items;
        const list = $("composer-list"),
          previous = list.value;
        list.innerHTML =
          '<option value="">Схема проекта…</option>' +
          items
            .map(
              (item) =>
                `<option value="${escape(item.id)}">${escape(item.title)}</option>`,
            )
            .join("");
        list.value = previous;
      })
      .catch((e) => {
        if (live()) error(e);
      });
  }
}
