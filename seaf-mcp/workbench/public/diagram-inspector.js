import { renderFields } from "./editor-fields.js";

export const copy = (value) => JSON.parse(JSON.stringify(value));
export const escapeHtml = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
export const jsonText = (value) => JSON.stringify(value, null, 2);
export function parseObject(text) {
  const value = JSON.parse(text);
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw Error("Определение должно быть JSON-объектом.");
  return value;
}
export function removedProperties(before, after, prefix = "") {
  if (
    !before ||
    !after ||
    typeof before !== "object" ||
    typeof after !== "object" ||
    Array.isArray(before) ||
    Array.isArray(after)
  )
    return [];
  const pointer = (key) =>
    prefix + "/" + key.replaceAll("~", "~0").replaceAll("/", "~1");
  return Object.keys(before).flatMap((key) =>
    !Object.hasOwn(after, key)
      ? [pointer(key)]
      : removedProperties(before[key], after[key], pointer(key)),
  );
}
export function entityOperation(entity, text, mode = "patch") {
  if (!entity?.section || !entity?.id)
    throw Error("Сначала выберите объект модели.");
  const operation = {
    kind: "entity",
    mode,
    section: entity.section,
    id: entity.id,
  };
  if (mode !== "create") {
    if (!entity.beforeHash)
      throw Error(
        "Нет актуального отпечатка объекта. Обновите рабочую область.",
      );
    operation.beforeHash = entity.beforeHash;
  }
  if (mode !== "delete") {
    operation.value = parseObject(text);
    const removals = removedProperties(entity.value || {}, operation.value);
    if (mode === "patch" && removals.length)
      operation.removeProperties = removals;
  }
  return operation;
}
export function linkOperation(relation, text, mode = "patch") {
  if (!relation?.selector?.from) throw Error("Не определён источник связи.");
  const operation = { kind: "link", mode, from: relation.selector.from };
  if (mode !== "create") {
    if (
      !Number.isInteger(relation.selector.index) ||
      !relation.selector.beforeHash
    )
      throw Error("Нет точного селектора связи. Повторите чтение модели.");
    operation.index = relation.selector.index;
    operation.beforeHash = relation.selector.beforeHash;
  }
  if (mode !== "delete") {
    operation.value = parseObject(text);
    const removals = removedProperties(relation.value || {}, operation.value);
    if (mode === "patch" && removals.length)
      operation.removeProperties = removals;
  }
  return operation;
}
export function readField(element, object) {
  const next = copy(object),
    name = element.dataset.inspectorField;
  if (!name || ["__proto__", "prototype", "constructor"].includes(name))
    throw Error("Недопустимое имя свойства.");
  const type = element.dataset.fieldType || "string";
  if (element.tagName === "SELECT") {
    if (element.multiple)
      next[name] = [...element.selectedOptions]
        .filter((option) => option.value !== "")
        .map((option) => JSON.parse(option.value));
    else if (element.value === "") delete next[name];
    else next[name] = JSON.parse(element.value);
  } else if (["number", "integer"].includes(type)) {
    if (element.value.trim() === "") delete next[name];
    else {
      const value = Number(element.value);
      if (
        !Number.isFinite(value) ||
        (type === "integer" && !Number.isInteger(value))
      )
        throw Error("Введите корректное числовое значение.");
      next[name] = value;
    }
  } else next[name] = element.value;
  return next;
}
export function inspectorFields(value, schema, { disabled = false } = {}) {
  // Reuse the real editor schema/dictionaries while isolating its events and IDs.
  const markup = renderFields(
    {
      editorValue: jsonText(value),
      editorSchema: schema,
      editorMode: "merge",
      selected: new Set(),
      fieldIssues: [],
    },
    escapeHtml,
  )
    .replaceAll("data-editor-field=", "data-inspector-field=")
    .replaceAll("editor-field-", "diagram-field-")
    .replace('data-act="editor-fields-refresh"', "data-inspector-refresh");
  return `<fieldset class="di-model-fields" ${disabled ? "disabled" : ""}><legend class="sr-only">Свойства объекта модели</legend>${markup}</fieldset>`;
}
export function sameReference(a, b) {
  return !!a && !!b && a.section === b.section && a.id === b.id;
}
export function compatibleRelationAdapters(adapters, fromRef, toRef) {
  if (!fromRef || !toRef) return [];
  return (adapters || []).filter(
    (adapter) =>
      adapter.guidedEndpoints === true &&
      adapter.capabilities?.create === true &&
      adapter.endpointFields?.length === 2 &&
      adapter.endpointFields[0].section === fromRef.section &&
      adapter.endpointFields[1].section === toRef.section,
  );
}
export function relationForBinding(relations, binding, { strict = true } = {}) {
  if (!binding) return null;
  if (binding.adapter === "entity")
    return (
      relations.find(
        (relation) =>
          relation.selector?.section === binding.section &&
          relation.selector?.id === binding.id,
      ) || null
    );
  if (binding.adapter !== "components.links") return null;
  return (
    relations.find(
      (relation) =>
        relation.adapter === "components.links" &&
        relation.selector?.from === binding.from &&
        relation.selector?.index === binding.index &&
        (!strict || relation.selector.beforeHash === binding.beforeHash),
    ) || null
  );
}
export function bindingForRelation(relation) {
  if (!relation) return undefined;
  return relation.adapter === "components.links"
    ? {
        adapter: "components.links",
        from: relation.selector.from,
        index: relation.selector.index,
        beforeHash: relation.selector.beforeHash,
      }
    : {
        adapter: "entity",
        section: relation.selector.section,
        id: relation.selector.id,
      };
}
export function cameraFit(nodes, width, height, padding = 44) {
  const finite = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  width = Math.max(100, finite(width, 800));
  height = Math.max(100, finite(height, 500));
  if (!nodes?.length) return { x: 0, y: 0, zoom: 1 };
  const xs = nodes.map((node) =>
      Math.max(0, Math.min(20000, finite(node.x, 0))),
    ),
    ys = nodes.map((node) => Math.max(0, Math.min(20000, finite(node.y, 0))));
  const left = Math.min(...xs),
    top = Math.min(...ys),
    w = Math.max(...xs) + 248 - left,
    h = Math.max(...ys) + 128 - top;
  const zoom = Math.max(
    0.002,
    Math.min(
      2.5,
      (width - Math.min(padding * 2, width / 2)) / Math.max(1, w),
      (height - Math.min(padding * 2, height / 2)) / Math.max(1, h),
    ),
  );
  return {
    x: left - (width / zoom - w) / 2,
    y: top - (height / zoom - h) / 2,
    zoom,
  };
}
export function cameraZoom(camera, nextZoom, screenX, screenY) {
  const finite = (value, fallback) =>
    Number.isFinite(Number(value)) ? Number(value) : fallback;
  const zoom = Math.max(0.002, Math.min(3, finite(nextZoom, 1))),
    oldZoom = Math.max(0.002, finite(camera?.zoom, 1));
  screenX = finite(screenX, 0);
  screenY = finite(screenY, 0);
  return {
    x: finite(camera?.x, 0) + screenX / oldZoom - screenX / zoom,
    y: finite(camera?.y, 0) + screenY / oldZoom - screenY / zoom,
    zoom,
  };
}
export function operationCaption(operation) {
  const verb =
    { create: "Создать", patch: "Изменить", delete: "Удалить" }[
      operation.mode
    ] || operation.mode;
  if (operation.kind === "link")
    return `${verb} связь ${operation.from}${operation.index !== undefined ? " [" + operation.index + "]" : ""}`;
  if (operation.kind === "child")
    return `${verb} компонент ${operation.id} в ${operation.parent}`;
  return `${verb} ${operation.section} / ${operation.id}`;
}
export function modelLinkDirection(value) {
  if (value === "reverse" || value === "<--") return "reverse";
  if (value === "bidirectional" || value === "<->") return "bidirectional";
  if (value === "undirected" || value === "--") return "undirected";
  if (
    value === undefined ||
    value === null ||
    value === "" ||
    value === "directed" ||
    value === "-->"
  )
    return "directed";
  return "undirected";
}
export function storedLinkDirection(value) {
  return {
    directed: "-->",
    reverse: "<--",
    bidirectional: "<->",
    undirected: "--",
  }[modelLinkDirection(value)];
}
export function impactsMarkup(impacts = []) {
  if (!impacts.length) return "";
  return `<details class="di-impacts" open><summary>Влияние изменений: ${impacts.length}</summary><ul>${impacts
    .slice(0, 100)
    .map(
      (impact) =>
        `<li>${escapeHtml(
          typeof impact === "string"
            ? impact
            : impact.message ||
                impact.description ||
                (impact.section && impact.id
                  ? `${impact.section} / ${impact.id}: связанных объектов ${impact.references?.length || 0}, неустранённых ссылок ${impact.unresolved?.length || 0}. ${(
                      impact.unresolved || []
                    )
                      .slice(0, 8)
                      .map(
                        (reference) =>
                          `${reference.section || ""} / ${reference.id || ""} (${(reference.paths || []).join(", ")})`,
                      )
                      .join("; ")}`
                  : JSON.stringify(impact)),
        )}</li>`,
    )
    .join("")}</ul></details>`;
}
