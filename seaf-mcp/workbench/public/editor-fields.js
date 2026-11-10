import { fieldLabels } from "./ux-tools.js";

export function renderFields(state, esc) {
  if (state.editorMode === "delete" || state.selected.size > 1) return "";
  let value;
  try {
    value = JSON.parse(state.editorValue);
  } catch {
    return '<p class="hint warning" role="status">Незавершённый JSON сохранится как текст. Исправьте его, чтобы использовать поля формы.</p>';
  }
  const fields = state.editorSchema?.fields || [
    { name: "title", title: "Название", type: "string" },
    { name: "owner", title: "Владелец", type: "string" },
    { name: "description", title: "Описание", type: "string" },
  ];
  const render = (f) => {
    const v = value?.[f.name];
    if (["object", "array"].includes(f.type) && !f.options?.length) return "";
    const key = esc(f.name),
      id = "editor-field-" + encodeURIComponent(f.name).replaceAll("%", "_"),
      caption = esc(
        f.title && f.title !== f.name ? f.title : fieldLabels[f.name] || f.name,
      ),
      error = (state.fieldIssues || []).find((e) => e.field === f.name);
    const attrs = `id="${id}" data-editor-field="${key}" data-field-type="${esc(f.type || "string")}" aria-describedby="${id}-help ${id}-error" ${f.required ? 'required aria-required="true"' : ""} ${error ? 'aria-invalid="true"' : ""}`;
    let input;
    if (f.options?.length) {
      const current = f.array ? (Array.isArray(v) ? v : []) : [v];
      input = `<select ${attrs} ${f.array ? "multiple" : ""}><option value="">— Не задано —</option>${f.options.map((o) => `<option value="${esc(JSON.stringify(o.value))}" ${current.some((x) => JSON.stringify(x) === JSON.stringify(o.value)) ? "selected" : ""}>${esc(o.label || o.value)}</option>`).join("")}${v !== undefined && !f.array && !f.options.some((o) => JSON.stringify(o.value) === JSON.stringify(v)) ? `<option value="${esc(JSON.stringify(v))}" selected>${esc(v)} · текущее значение</option>` : ""}</select>`;
    } else if (f.type === "boolean")
      input = `<select ${attrs}><option value="">— Не задано —</option><option value="true" ${v === true ? "selected" : ""}>Да</option><option value="false" ${v === false ? "selected" : ""}>Нет</option></select>`;
    else if (f.name === "description")
      input = `<textarea ${attrs} rows="3" placeholder="Назначение, границы ответственности и полезные сведения">${esc(v ?? "")}</textarea>`;
    else
      input = `<input ${attrs} value="${esc(v ?? "")}" ${["number", "integer"].includes(f.type) ? 'type="number"' + (f.type === "integer" ? ' step="1"' : ' step="any"') : ""} list="${id}-suggestions" placeholder="${esc(f.example || f.examples?.[0] || (f.name === "title" ? "Например, Delivery Service" : f.name === "owner" ? "Например, Logistics" : ""))}"><datalist id="${id}-suggestions">${(f.suggestions || []).map((x) => `<option value="${esc(x)}">`).join("")}</datalist>`;
    const help =
      f.description ||
      (f.options?.length
        ? "Выберите значение из объявленного справочника или схемы."
        : f.name === "owner"
          ? "Команда или ответственный за объект."
          : f.name === "title"
            ? "Понятное пользователям название; идентификатор задаётся отдельно."
            : "");
    return `<div class="field ${f.required ? "is-required" : ""}"><label for="${id}">${caption}${f.required ? ' <span aria-label="обязательное поле">*</span>' : ""}</label>${input}<small id="${id}-help" class="subtle">${esc(help)}</small><small id="${id}-error" class="field-error" ${error ? "" : "hidden"}>${esc(error?.description || "")}</small></div>`;
  };
  return `<div class="panel-heading"><h3>Поля объекта</h3><button data-act="editor-fields-refresh" class="quiet" data-network>Обновить справочники</button></div><div class="form-grid">${fields.map(render).join("")}</div><p class="subtle small">* — обязательное поле схемы. Списки берутся из enum, ссылок и справочников модели. Неизвестные форме свойства сохраняются и доступны в расширенном JSON.</p>`;
}

export function renderLinks(state, esc) {
  const components = state.model.components || {},
    options = (selected) =>
      Object.entries(components)
        .map(
          ([id, c]) =>
            `<option value="${esc(id)}" ${selected === id ? "selected" : ""}>${esc(c?.title || id)} · ${esc(id)}</option>`,
        )
        .join("");
  const links = Object.entries(components).flatMap(([from, c]) =>
    (Array.isArray(c?.links) ? c.links : [])
      .filter((l) => l && typeof l === "object")
      .map((l, index) => ({ from, index, ...l })),
  );
  return `<section class="panel"><div class="panel-heading"><h2>Информационные потоки и интеграции</h2><span class="badge neutral">${links.length}</span></div><p class="subtle">Связи хранятся в links компонентов и отображаются на существующих схемах SEAF. Для самостоятельных сущностей интеграций выберите соответствующий раздел модели.</p><div class="table-wrap"><table><thead><tr><th>Источник</th><th>Получатель</th><th>Название / протокол</th><th></th></tr></thead><tbody>${links.map((l) => `<tr><td>${esc(components[l.from]?.title || l.from)}</td><td>${esc(components[l.id]?.title || l.id)}</td><td>${esc(l.title || "—")}<div class="subtle">${esc(l.protocol || "")}</div></td><td><button class="quiet" data-link-edit="${esc(l.from)}" data-link-index="${l.index}">Изменить</button><button class="quiet danger" data-link-remove="${esc(l.from)}" data-link-index="${l.index}">Удалить</button></td></tr>`).join("")}</tbody></table></div><div class="form-grid"><div class="field"><label for="flow-from">Источник</label><select id="flow-from">${options(state.flowFrom)}</select></div><div class="field"><label for="flow-to">Получатель</label><select id="flow-to">${options(state.flowTo)}</select></div><div class="field"><label for="flow-title">Название потока</label><input id="flow-title" value="${esc(state.flowTitle || "")}"></div><div class="field"><label for="flow-protocol">Протокол</label><input id="flow-protocol" list="flow-protocols" value="${esc(state.flowProtocol || "")}"><datalist id="flow-protocols">${[...new Set(links.map((l) => l.protocol).filter(Boolean))].map((v) => `<option value="${esc(v)}">`).join("")}</datalist></div></div><button data-act="flow-propose" data-network ${state.projects.find((p) => p.id === state.project)?.writable ? "" : "disabled"}>${state.flowIndex !== undefined ? "Изменить поток" : "Создать поток"}</button></section>`;
}
