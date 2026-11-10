import { stackPanel, bindStackPanel } from "./stack-views.js";
import { renderProjects } from "./projects.js";
import { renderFields, renderLinks } from "./editor-fields.js";
import {
  composerPanel,
  bindComposerPanel,
  composerDraftChanged,
  composerApplied,
} from "./diagram-composer.js";
import {
  fieldLabels,
  sectionLabel,
  viewLabels,
  textValue,
  entityRows,
  searchModel,
  defaultCatalog,
  normalizeCatalog,
  catalogRows,
  normalizePreferences,
  rememberRecent,
  toggleFavorite,
  parseRoute,
  routeQuery,
  makeEditSnapshot,
  editHistory,
  recordEdit,
  moveEdit,
  schemaIssues,
  passportFromModel,
  normalizeValidationIssues,
  fallbackScenarios,
  modelLinks,
  walkthroughSvg,
} from "./ux-tools.js";
const $ = (selector, root = document) => root.querySelector(selector);
const esc = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (ch) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        ch
      ],
  );
const pretty = (value) => JSON.stringify(value, null, 2);
const label = (value) =>
  value === undefined ? "—" : typeof value === "string" ? value : pretty(value);
const views = [
  ["home", "Моя работа"],
  ["stack", "Stack Diagram"],
  ["projects", "Проекты"],
  ["objects", "Редактор"],
  ["composer", "Конструктор схем"],
  ["scenarios", "Сценарии"],
  ["drafts", "Черновики"],
  ["compare", "Сравнение"],
  ["snapshots", "Снимки"],
  ["graph", "Граф"],
  ["trust", "Данные и доверие"],
  ["assistant", "Ассистент"],
  ["drawio", "draw.io"],
  ["diagnostics", "Диагностика"],
];
const state = {
  csrf: "",
  projects: [],
  project: "shopflow",
  view:
    new URLSearchParams(location.search).get("view") === "editor"
      ? "objects"
      : new URLSearchParams(location.search).get("view") || "objects",
  online: false,
  model: {},
  provenance: {},
  head: "",
  fingerprint: "",
  section: "components",
  filter: "",
  selected: new Set(),
  editId: "",
  editorValue: "{}",
  editorMode: "create",
  drafts: [],
  activeDraft: null,
  diff: null,
  validation: null,
  proposalId: null,
  snapshots: [],
  graph: null,
  graphFocus: "",
  graphDepth: 1,
  graphDirection: "both",
  answer: null,
  findings: null,
  diagnostics: null,
  drawioXML: "",
  drawioPath: "diagrams/architecture.drawio",
  editorUrl: "",
  busy: 0,
  catalog: defaultCatalog(),
  preferences: normalizePreferences(),
  route: parseRoute(location.href),
  undo: null,
  editorPending: false,
  editorSavedAt: null,
  palette: { query: "", results: [], index: 0, total: 0 },
  scenarioSteps: [],
  scenarioIndex: 0,
  scenarioId: "",
};
let noticeTimer,
  autoSaveTimer,
  editorFrame,
  searchTimer,
  routeSequence = 0;
const dbPromise = new Promise((resolve) => {
  try {
    if (!window.indexedDB) return resolve(null);
    const req = indexedDB.open("seaf-workbench-v1", 1);
    req.onupgradeneeded = () => req.result.createObjectStore("entries");
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(null);
    req.onblocked = () => resolve(null);
  } catch {
    resolve(null);
  }
});
async function localGet(key) {
  const db = await dbPromise;
  if (!db) {
    try {
      return JSON.parse(localStorage.getItem("seaf-wb:" + key) || "null");
    } catch {
      return null;
    }
  }
  return new Promise((resolve) => {
    try {
      const r = db.transaction("entries").objectStore("entries").get(key);
      r.onsuccess = () => resolve(r.result ?? null);
      r.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}
async function localSet(key, value) {
  try {
    const db = await dbPromise;
    if (!db) {
      const text = JSON.stringify(value);
      if (text.length > 1500000)
        throw Error(
          "Локальное хранилище браузера переполнено. Экспортируйте черновик.",
        );
      localStorage.setItem("seaf-wb:" + key, text);
      return;
    }
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("entries", "readwrite");
      tx.objectStore("entries").put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(Error("Не удалось сохранить черновик в браузере"));
      tx.onabort = () => reject(Error("Локальная транзакция отменена"));
    });
  } catch (error) {
    state.storageError = true;
    throw Error(
      "Не удалось сохранить данные в браузере. Экспортируйте черновик JSON. " +
        (error.name === "QuotaExceededError"
          ? "Квота локального хранилища исчерпана."
          : ""),
    );
  }
}
async function cacheSet(key, value) {
  try {
    await localSet(key, value);
  } catch (error) {
    notify(error.message, true);
  }
}
function notify(text, error = false) {
  clearTimeout(noticeTimer);
  const el = $("#notice");
  el.textContent = text;
  el.classList.toggle("error", error);
  el.hidden = false;
  noticeTimer = setTimeout(() => (el.hidden = true), error ? 12000 : 6500);
}
function setOnline(value) {
  state.online = value;
  $("#connection").textContent = value ? "Подключено" : "Автономный режим";
  $("#connection").className = "badge" + (value ? "" : " warning");
  $("#offline-banner").hidden = value;
}
function busy(delta) {
  state.busy = Math.max(0, state.busy + delta);
  let bar = $("#progress");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "progress";
    bar.className = "progress";
    document.body.append(bar);
  }
  bar.hidden = state.busy === 0;
  $("#project").disabled = state.busy > 0;
  document
    .querySelectorAll("#navigation button")
    .forEach((button) => (button.disabled = state.busy > 0));
  document
    .querySelectorAll(
      "#main input,#main select,#main textarea,#main button:not([data-network])",
    )
    .forEach((control) => {
      if (!("busyLocked" in control.dataset))
        control.dataset.busyLocked = String(control.disabled);
      control.disabled =
        control.dataset.busyLocked === "true" || state.busy > 0;
    });
  document.querySelectorAll("[data-network]").forEach((b) => {
    if (!("locked" in b.dataset)) b.dataset.locked = String(b.disabled);
    b.disabled = b.dataset.locked === "true" || state.busy > 0 || !state.online;
  });
  renderContext();
}
async function api(action, args = {}) {
  if (!state.online)
    throw Error("Сервис не подключён. Черновик можно сохранить в браузере.");
  busy(1);
  try {
    const response = await fetch("/api/action", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-SEAF-CSRF": state.csrf,
      },
      body: JSON.stringify({ action, project: state.project, ...args }),
    });
    let payload;
    try {
      payload = await response.json();
    } catch {
      throw Error("Сервис вернул некорректный ответ");
    }
    if (!response.ok || payload.ok === false)
      throw Error(payload.error || `Ошибка ${response.status}`);
    return payload.result ?? payload;
  } catch (error) {
    if (error instanceof TypeError) setOnline(false);
    throw error;
  } finally {
    busy(-1);
  }
}
function projectInfo() {
  return (
    state.projects.find((p) => p.id === state.project) || {
      id: state.project,
      title: state.project,
      writable: false,
    }
  );
}
function writable() {
  return projectInfo().writable === true && !state.modelError;
}
function renderContext() {
  const el = $("#project-context");
  if (!el) return;
  const p = projectInfo(),
    c = state.projectContext || {},
    kind = c.sourceKind || p.source?.kind || "git",
    revision = c.revision?.id || state.head || "",
    saved = state.lastPublication || state.publicationStatus;
  let status = "Рабочая модель · изменений не подготовлено";
  if (state.editorPending)
    status = state.formPersistenceFailed
      ? "Форма изменена · локальное сохранение не удалось"
      : state.editorSavedAt
        ? "Форма сохранена в браузере · файлы проекта ещё не изменены"
        : "Форма изменена · сохраняем в браузере";
  else if (saved?.commit || saved?.revision?.id)
    status =
      saved.reload?.status === "updated" && !saved.reload?.problems?.length
        ? "Версия сохранена · портал обновлён"
        : "Версия сохранена · обновление портала не подтверждено";
  else if (state.validation)
    status = state.validation.ok
      ? "Модель проверена · можно сохранить в проект"
      : "В проверке найдены проблемы · сохранение заблокировано";
  else if (state.activeDraft)
    status = "Diff подготовлен · требуется проверка SEAF";
  const path = c.root || p.source?.root || p.root || "Папка не указана";
  el.innerHTML = `<div class="context-identity"><b>${esc(c.title || p.title || state.project)}</b><span class="badge ${p.writable ? "" : "neutral"}">${kind === "directory" ? "Локальная папка" : "Git" + (c.provider || p.source?.provider ? " · " + (c.provider || p.source?.provider) : "")}</span><span>${p.writable ? "Чтение и запись" : "Только чтение"}</span>${c.branch ? `<span>Ветка <code>${esc(c.branch)}</code></span>` : ""}<span>Версия <code>${esc(revision.slice(0, 12) || "не загружена")}</code></span><span class="context-path" title="${esc(path)}">${esc(path)}</span></div><div class="context-stage ${state.formPersistenceFailed || (state.validation && !state.validation.ok) || (saved && saved.reload?.status !== "updated") ? "warning" : ""}" role="status">${state.busy ? "Выполняется запрос… · " : ""}${esc(status)}${saved && (saved.commit || saved.revision?.id) && saved.reload?.status !== "updated" ? '<button class="quiet button-small" data-context-reload>Повторить обновление портала</button>' : ""}</div>`;
}
async function persistPreferences() {
  state.preferences.catalog = normalizeCatalog(state.catalog);
  await localSet(
    "ux:" + state.project,
    normalizePreferences(state.preferences),
  );
}
async function loadPreferences() {
  state.preferences = normalizePreferences(
    (await localGet("ux:" + state.project)) || {},
  );
  state.catalog = normalizeCatalog(state.preferences.catalog);
  state.wizard = (await localGet("wizard:" + state.project)) || null;
  state.scenarioSteps =
    (await localGet("scenario-route:" + state.project)) || [];
}
function startEditHistory() {
  state.undo = editHistory(makeEditSnapshot(state));
  state.editorPending = false;
  state.editorSavedAt = null;
}
function updateUndoControls() {
  const undo = $('[data-act="ux-undo"]'),
    redo = $('[data-act="ux-redo"]');
  if (undo) undo.disabled = !state.undo || state.undo.index < 1;
  if (redo)
    redo.disabled =
      !state.undo || state.undo.index >= state.undo.items.length - 1;
}
function storeRoute({ replace = false } = {}) {
  const target = routeQuery(state);
  if (location.pathname + location.search !== target)
    history[replace ? "replaceState" : "pushState"](
      { workbenchNavigation: true },
      "",
      target,
    );
  state.route = parseRoute(location.href);
}
async function rememberObject(section, id) {
  const value = state.model[section]?.[id];
  if (!value) return;
  state.preferences = rememberRecent(state.preferences, {
    section,
    id,
    title: value.title || id,
  });
  try {
    await persistPreferences();
  } catch (error) {
    notify(error.message, true);
  }
}
async function transition(fn) {
  busy(1);
  try {
    return await fn();
  } finally {
    busy(-1);
  }
}
async function openObject(section, id, options = {}) {
  const result = await transition(() =>
    performOpenObject(section, id, options),
  );
  if (options.property) {
    const field = [...document.querySelectorAll("[data-editor-field]")].find(
      (e) => e.dataset.editorField === options.property,
    );
    if (field) {
      field.focus();
      field.scrollIntoView({ block: "center" });
      field.classList.add("field-highlight");
    } else {
      $("#advanced-editor")?.setAttribute("open", "");
      $("#object-json")?.focus();
      notify("Поле «" + options.property + "» доступно в расширенном JSON.");
    }
  }
  return result;
}
async function performOpenObject(
  section,
  id,
  { edit = false, property, replace = false } = {},
) {
  if (!Object.hasOwn(state.model[section] || {}, id))
    throw Error("Объект отсутствует в текущей модели: " + id);
  await captureEditor();
  state.section = section;
  state.editId = id;
  state.selected.clear();
  state.editorValue = pretty(state.model[section][id]);
  state.editorMode = "merge";
  state.editorSchema = null;
  state.passport = null;
  state.view = edit ? "objects" : "passport";
  startEditHistory();
  if (edit) await hydrateEditor(section, id);
  await rememberObject(section, id);
  storeRoute({ replace });
  render();
  if (state.online) {
    const project = state.project;
    try {
      if (edit) {
        const schema = await api("editor_schema", { section });
        if (state.project === project && state.section === section) {
          state.editorSchema = schema;
          render();
        }
      } else {
        const passport = await api("ux_passport", { section, id });
        if (
          state.project === project &&
          state.editId === id &&
          state.view === "passport"
        ) {
          state.passport = passport;
          render();
        }
      }
    } catch (error) {
      notify(
        "Открыты данные модели. Дополнительные сведения недоступны: " +
          error.message,
        true,
      );
    }
  }
}
async function navigate(view, options = {}) {
  return transition(() => performNavigate(view, options));
}
async function performNavigate(view, { replace = false } = {}) {
  await captureEditor();
  clearTimeout(autoSaveTimer);
  state.view = view;
  storeRoute({ replace });
  render();
  if (view === "scenarios" && state.online && !state.scenarios) {
    try {
      const result = await api("ux_scenarios");
      state.scenarios = result.scenarios || [];
      state.scenarioWarnings = result.warnings || [];
      render();
    } catch (error) {
      notify(error.message, true);
    }
  }
  if (view === "drafts" && state.online) {
    await listDrafts();
    render();
  }
  if (view === "snapshots" && state.online) await action("snapshots-refresh");
}
function docUrl(id) {
  const portal = safeUrl(state.projectContext?.portal || projectInfo().portal);
  if (!portal) return null;
  const url = new URL("/entities/docs/blank", portal);
  url.searchParams.set("dh-doc-id", id);
  return url.href;
}
function memoryButton(item, { small = false } = {}) {
  const value = state.model[item.section]?.[item.id];
  return `<button class="${small ? "memory-link" : "secondary"}" data-act="ux-open" data-section="${esc(item.section)}" data-id="${esc(item.id)}" ${value ? "" : "disabled"} title="${esc(item.id)}">${esc(value?.title || item.title || item.id)}${small ? "" : `<small>${esc(item.id)}</small>`}</button>`;
}
function renderHome() {
  const p = projectInfo(),
    rows = entityRows(state.model),
    favorites = state.preferences.favorites,
    recent = state.preferences.recent;
  return (
    title(
      "Моя работа",
      "Избранное, недавние объекты и быстрые действия в текущем проекте.",
    ) +
    `<section class="panel home-summary"><div><span class="eyebrow">Активный проект</span><h2>${esc(p.title || state.project)}</h2><p>${rows.length} объектов · ${Object.keys(state.model.docs || {}).length} документов · ${(state.localDrafts || []).length} локальных черновиков</p></div><div class="row"><button data-act="ux-search">Найти в архитектуре <kbd>Ctrl K</kbd></button><button class="secondary" data-act="ux-wizard" ${writable() ? "" : "disabled"}>Создать систему</button><button class="secondary" data-act="ux-navigate" data-view="composer">Собрать схему</button></div></section><div class="split"><section class="panel"><h2>Избранное</h2><div class="memory-grid">${favorites.map((item) => memoryButton(item)).join("") || '<p class="empty">Откройте паспорт объекта и нажмите «В избранное» — важные системы появятся здесь.</p>'}</div></section><section class="panel"><h2>Недавно открытые</h2><div class="memory-grid">${recent.map((item) => memoryButton(item)).join("") || '<p class="empty">Здесь появятся системы и документы, которые вы откроете. История хранится только в этом браузере.</p>'}</div></section></div><section class="panel"><h2>Как внести изменение</h2><ol class="workflow-guide"><li>Найдите систему или создайте её через мастер.</li><li>Измените поля и нажмите «Показать изменения».</li><li>Изучите diff и выполните проверку SEAF.</li><li>Сохраните версию и дождитесь подтверждения обновления портала.</li></ol><p class="subtle">Автосохранение формы сохраняет ввод в браузере. Git-коммит или локальная ревизия создаются только после проверки и явного сохранения.</p></section>`
  );
}
function renderPassport() {
  const p =
    state.passport ||
    passportFromModel(
      state.model,
      state.section,
      state.editId,
      state.provenance,
    );
  if (!p)
    return (
      title("Паспорт объекта", "Объект отсутствует в текущей версии модели.") +
      '<button data-act="ux-navigate" data-view="objects">Открыть реестр</button>'
    );
  const value = p.value || {},
    favorite = state.preferences.favorites.some(
      (x) => x.section === state.section && x.id === state.editId,
    ),
    linkRows = (links, direction) =>
      links.length
        ? `<ul class="relation-list">${links
            .map((l) => {
              const id =
                  direction === "incoming"
                    ? l.from || l.source || l.id
                    : l.to || l.target || l.id,
                targetSection =
                  l.from || l.to || l.source || l.target
                    ? "components"
                    : l.section || "components",
                entity = state.model[targetSection]?.[id];
              return `<li><button class="quiet" data-act="ux-open" data-section="${esc(targetSection)}" data-id="${esc(id)}" ${entity ? "" : "disabled"}>${esc(entity?.title || id || "Неизвестный участник")}</button><span>${esc(l.title || l.label || l.description || "Связь")}${l.protocol ? " · " + esc(l.protocol) : ""}</span></li>`;
            })
            .join("")}</ul>`
        : '<p class="subtle">Связи не объявлены в доступной модели.</p>';
  const props = Object.entries(value).filter(
    ([key]) => !["title", "description", "links"].includes(key),
  );
  return (
    title(
      p.title || value.title || state.editId,
      "Паспорт объекта: сведения, связи и происхождение без изменения файлов.",
    ) +
    `<section class="panel"><div class="panel-heading"><div><span class="badge neutral">${esc(sectionLabel(state.section, state.model))}</span><p><code>${esc(state.editId)}</code></p></div><div class="row"><button data-act="ux-edit" ${writable() ? "" : "disabled"}>Редактировать</button><button class="secondary" data-act="ux-favorite">${favorite ? "★ В избранном" : "☆ В избранное"}</button><button class="secondary" data-act="ux-copy-link">Копировать ссылку</button>${state.section === "docs" && docUrl(state.editId) ? `<a class="button secondary" href="${esc(docUrl(state.editId))}" target="_blank" rel="noopener">Открыть документ в SEAF</a>` : ""}</div></div><p class="object-description">${esc(textValue(value.description) || "Описание не заполнено.")}</p><dl class="passport-properties">${props.map(([key, v]) => `<dt>${esc(fieldLabels[key] || key)}</dt><dd>${typeof v === "object" ? `<details><summary>Показать ${Array.isArray(v) ? v.length + " значений" : "структуру"}</summary><pre>${esc(pretty(v))}</pre></details>` : esc(textValue(v) || "—")}</dd>`).join("")}</dl><div class="source-evidence"><b>Источник</b> <code>${esc(p.source?.path || state.provenance[state.section + "/" + state.editId] || "Не определён")}</code> · версия <code>${esc((p.source?.revision || state.head || "").slice(0, 12))}</code></div></section><div class="split"><section class="panel"><h2>Входящие взаимодействия</h2>${linkRows(p.incoming || [], "incoming")}</section><section class="panel"><h2>Исходящие взаимодействия</h2>${linkRows(p.outgoing || [], "outgoing")}</section></div><section class="panel"><h2>Связанные объекты, схемы и документы</h2><div class="memory-grid">${(p.references || []).map((r) => memoryButton(r)).join("") || '<p class="subtle">Явных ссылок на этот ID не найдено.</p>'}${(
      p.documents || []
    )
      .filter(
        (d) =>
          !(p.references || []).some(
            (r) => r.section === "docs" && r.id === d.id,
          ),
      )
      .map((d) => memoryButton({ section: "docs", ...d }))
      .join("")}</div></section>`
  );
}
function newWizard() {
  return {
    step: 0,
    section: state.model.components
      ? "components"
      : objectSections().find((s) => /(?:^|\.)systems$/.test(s)) ||
        "components",
    id: "",
    title: "",
    owner: "",
    description: "",
    target: "",
    linkTitle: "",
    protocol: "HTTP",
    context: "",
    newContext: "",
    newContextTitle: "",
    links: [],
    baseHead: state.head,
    baseFingerprint: state.fingerprint,
  };
}
function renderWizard() {
  const w = (state.wizard ||= newWizard()),
    labels = ["Система", "Ответственность", "Интеграции", "Схема и проверка"],
    sections = [
      ...new Set([
        "components",
        ...objectSections().filter((s) => /(?:^|\.)systems$/.test(s)),
      ]),
    ],
    components = Object.entries(state.model.components || {}),
    owners = [
      ...new Set(
        entityRows(state.model)
          .map((r) => r.owner)
          .filter(Boolean),
      ),
    ].sort();
  const body = [
    `<div class="field"><label for="wizard-section">Тип объектов</label><select id="wizard-section" data-wizard="section">${sections.map((s) => `<option value="${esc(s)}" ${w.section === s ? "selected" : ""}>${esc(sectionLabel(s, state.model))} · ${esc(s)}</option>`).join("")}</select></div><div class="field"><label for="wizard-id">Уникальный идентификатор *</label><input id="wizard-id" data-wizard="id" value="${esc(w.id)}" placeholder="demo.shop.notifications" required><small class="subtle">ID остаётся стабильным при переименовании. Например, demo.shop.notifications.</small></div><div class="field"><label for="wizard-title">Название системы *</label><input id="wizard-title" data-wizard="title" value="${esc(w.title)}" placeholder="Notification Service" required></div>`,
    `<div class="field"><label for="wizard-owner">Команда-владелец *</label><input id="wizard-owner" data-wizard="owner" value="${esc(w.owner)}" list="wizard-owners" placeholder="Например, Logistics" required><datalist id="wizard-owners">${owners.map((v) => `<option value="${esc(v)}">`).join("")}</datalist><small class="subtle">Существующие владельцы предложены как подсказки. Проверка проекта подтвердит ограничения справочников.</small></div><div class="field"><label for="wizard-description">Назначение системы</label><textarea id="wizard-description" data-wizard="description" rows="5" placeholder="Что делает система и за что отвечает?">${esc(w.description)}</textarea></div>`,
    w.section === "components"
      ? `<p>Добавьте исходящие взаимодействия с существующими компонентами. Каждый поток сохранится в настоящем <code>links</code> новой системы.</p><div class="form-grid"><div class="field"><label for="wizard-target">Получатель</label><select id="wizard-target" data-wizard="target"><option value="">Выберите компонент</option>${components.map(([id, c]) => `<option value="${esc(id)}" ${w.target === id ? "selected" : ""}>${esc(c.title || id)} · ${esc(id)}</option>`).join("")}</select></div><div class="field"><label for="wizard-link-title">Назначение потока</label><input id="wizard-link-title" data-wizard="linkTitle" value="${esc(w.linkTitle)}" placeholder="Передать заказ"></div><div class="field"><label for="wizard-protocol">Протокол</label><input id="wizard-protocol" data-wizard="protocol" value="${esc(w.protocol)}" placeholder="HTTP, Kafka…"></div></div><button class="secondary" data-act="ux-wizard-add-link">Добавить взаимодействие</button><ol class="wizard-links">${w.links.map((l, i) => `<li>${esc(state.model.components?.[l.id]?.title || l.id)} — ${esc(l.title)} · ${esc(l.protocol)} <button class="quiet danger" data-act="ux-wizard-remove-link" data-index="${i}" aria-label="Убрать взаимодействие ${i + 1}">Убрать</button></li>`).join("") || '<li class="subtle">Интеграции пока не добавлены. Этот шаг можно пропустить.</li>'}</ol>`
      : '<p class="hint">Система будет создана в выбранном разделе метамодели. Интеграции нестандартной метамодели редактируйте в соответствующем разделе редактора; мастер не выдумывает их структуру.</p>',
    `<div class="wizard-summary"><h3>${esc(w.title || "Новая система")}</h3><p><code>${esc(w.id)}</code> · ${esc(w.owner)} · ${w.links.length} взаимодействий</p><p>${esc(w.description)}</p></div>${
      w.section === "components"
        ? `<div class="field"><label for="wizard-context">Включить систему в схему / контекст</label><select id="wizard-context" data-wizard="context"><option value="">Не добавлять сейчас</option>${Object.entries(
            state.model.contexts || {},
          )
            .map(
              ([id, c]) =>
                `<option value="${esc(id)}" ${w.context === id ? "selected" : ""}>${esc(c.title || id)} · ${esc(id)}</option>`,
            )
            .join(
              "",
            )}<option value="__new__" ${w.context === "__new__" ? "selected" : ""}>Создать новый контекст</option></select></div>${w.context === "__new__" ? `<div class="field"><label for="wizard-context-id">ID нового контекста *</label><input id="wizard-context-id" data-wizard="newContext" value="${esc(w.newContext)}" placeholder="demo.shop.notifications.context"></div><div class="field"><label for="wizard-context-title">Название схемы</label><input id="wizard-context-title" data-wizard="newContextTitle" value="${esc(w.newContextTitle)}" placeholder="Оповещения — компоненты"></div>` : ""}`
        : ""
    }<p class="hint">Мастер подготовит одно связанное изменение. Рабочие файлы сохранятся только после просмотра diff, успешной проверки и команды «Сохранить и обновить SEAF».</p>`,
  ][w.step];
  return (
    title(
      "Мастер создания системы",
      "Пошаговое создание системы, её взаимодействий и включения в схему.",
    ) +
    `<section class="panel wizard-panel"><ol class="wizard-steps">${labels.map((l, i) => `<li class="${i === w.step ? "current" : i < w.step ? "done" : ""}" ${i === w.step ? 'aria-current="step"' : ""}>${i + 1}. ${l}</li>`).join("")}</ol><div class="wizard-body">${body}</div><div class="row"><button class="secondary" data-act="ux-wizard-prev" ${w.step ? "" : "disabled"}>← Назад</button><span class="grow"></span>${w.step < 3 ? '<button data-act="ux-wizard-next">Далее →</button>' : `<button data-act="ux-wizard-stage" ${writable() ? "" : "disabled"}>Подготовить diff системы</button>`}<button class="quiet" data-act="ux-wizard-reset">Начать заново</button></div></section>${state.activeDraft ? reviewHtml() : ""}`
  );
}
function resolveScenario(scenario) {
  const participants = new Map(
    (scenario.participants || []).map((p) => [p.alias, p]),
  );
  return {
    ...scenario,
    steps: (scenario.steps || []).map((s) => {
      const from = participants.get(s.from),
        to = participants.get(s.to);
      return {
        ...s,
        from: from?.id || s.from,
        to: to?.id || s.to,
        fromTitle:
          from?.title || state.model.components?.[s.from]?.title || s.from,
        toTitle: to?.title || state.model.components?.[s.to]?.title || s.to,
        unresolved: !!((from && !from.id) || (to && !to.id)),
      };
    }),
  };
}
function activeScenario() {
  if (state.scenarioId === "__manual__")
    return {
      id: "__manual__",
      title: "Мой порядок взаимодействий",
      steps: state.scenarioSteps || [],
      manual: true,
    };
  const scenarios = state.scenarios || fallbackScenarios(state.model);
  return resolveScenario(
    scenarios.find((s) => s.id === state.scenarioId) || {
      id: "",
      title: "Выберите сценарий",
      steps: [],
    },
  );
}
function renderScenarios() {
  const scenarios = state.scenarios || fallbackScenarios(state.model),
    scenario = activeScenario(),
    steps = scenario.steps || [],
    index = Math.max(0, Math.min(state.scenarioIndex, steps.length - 1));
  state.scenarioIndex = index;
  const active = steps[index],
    links = modelLinks(state.model),
    from = active?.from,
    to = active?.to;
  return (
    title(
      "Пошаговые сценарии",
      "Исследуйте порядок взаимодействий из исходных сценариев или соберите маршрут из существующих связей.",
    ) +
    `<section class="panel"><div class="toolbar"><div class="field"><label for="scenario-select">Сценарий</label><select id="scenario-select"><option value="">Выберите сценарий</option>${scenarios.map((s) => `<option value="${esc(s.id)}" ${state.scenarioId === s.id ? "selected" : ""}>${esc(s.title || s.id)}</option>`).join("")}<option value="__manual__" ${state.scenarioId === "__manual__" ? "selected" : ""}>Собрать маршрут из связей модели</option></select></div><button class="secondary" data-act="ux-scenarios-refresh" data-network>Перечитать источники</button></div>${scenario.path ? `<p class="source-evidence">Источник: <button class="quiet" data-act="ux-artifact" data-path="${esc(scenario.path)}">${esc(scenario.path)}</button></p>` : ""}${(state.scenarioWarnings || []).length ? `<details><summary>Ограничения распознавания (${state.scenarioWarnings.length})</summary><pre>${esc(pretty(state.scenarioWarnings))}</pre></details>` : ""}${scenario.manual ? `<div class="scenario-builder"><label for="scenario-link">Существующее взаимодействие</label><div class="row"><select id="scenario-link">${links.map((l) => `<option value="${esc(l.key)}">${esc(state.model.components[l.from]?.title || l.from)} → ${esc(state.model.components[l.to]?.title || l.to)} · ${esc(l.label)}</option>`).join("")}</select><button class="secondary" data-act="ux-scenario-add" ${links.length ? "" : "disabled"}>Добавить шаг</button><button class="quiet" data-act="ux-scenario-clear">Очистить маршрут</button></div><p class="subtle">Порядок выбираете вы. Это локальное представление существующих связей; оно не утверждает фактическую последовательность исполнения и не изменяет проект.</p></div>` : ""}${steps.length ? `<div class="walk-controls"><button class="secondary" data-act="ux-scenario-prev" ${index ? "" : "disabled"}>← Предыдущий</button><strong role="status">Шаг ${index + 1} из ${steps.length}</strong><button class="secondary" data-act="ux-scenario-next" ${index + 1 < steps.length ? "" : "disabled"}>Следующий →</button></div>${walkthroughSvg(state.model, steps, index, esc)}<article class="walk-step" aria-live="polite"><span class="eyebrow">${esc(active.type || "Взаимодействие")}</span><h2>${esc(active.label || "Вызов")}</h2><div class="walk-endpoints"><button class="secondary" data-act="ux-open" data-section="components" data-id="${esc(from)}" ${state.model.components?.[from] ? "" : "disabled"}>${esc(active.fromTitle || state.model.components?.[from]?.title || from || "Не определён")}</button><span>→</span><button class="secondary" data-act="ux-open" data-section="components" data-id="${esc(to)}" ${state.model.components?.[to] ? "" : "disabled"}>${esc(active.toTitle || state.model.components?.[to]?.title || to || "Не определён")}</button></div>${active.unresolved ? '<p class="hint warning">Участник сценария не сопоставлен с единственным объектом модели. Показано имя из источника; объект не выдумывается.</p>' : ""}<dl class="passport-properties"><dt>Данные / сообщение</dt><dd>${esc(textValue(active.data) || "В источнике не указаны")}</dd><dt>Протокол</dt><dd>${esc(textValue(active.protocol) || "В шаге не указан")}</dd><dt>Условие / ошибка</dt><dd>${esc(textValue(active.error || active.condition) || "В источнике не указаны")}</dd></dl></article><details><summary>Все шаги сценария</summary><ol class="scenario-step-list">${steps.map((s, i) => `<li><button class="quiet ${i === index ? "current" : ""}" data-act="ux-scenario-go" data-index="${i}">${i + 1}. ${esc(s.fromTitle || s.from)} → ${esc(s.toTitle || s.to)}: ${esc(s.label || "Взаимодействие")}</button></li>`).join("")}</ol></details>` : '<div class="empty">Выберите распознанный сценарий или соберите маршрут из связей модели. Произвольные диаграммы без однозначных шагов автоматически не интерпретируются.</div>'}</section>`
  );
}
function renderArtifact() {
  const a = state.artifact;
  return (
    title(
      "Исходный документ",
      state.artifactPath || "Текст артефакта проекта.",
    ) +
    `<section class="panel"><div class="row"><button class="secondary" data-act="ux-search">Найти другой документ</button><button class="secondary" data-act="ux-copy-link">Копировать ссылку</button></div>${a ? `<p class="source-evidence"><code>${esc(a.path || state.artifactPath)}</code> · SHA-256 <code>${esc(a.sha256 || "не определён")}</code></p><pre class="artifact-text">${esc(a.content || "Файл пуст")}</pre>` : '<p class="empty">Исходный текст ещё не загружен. Для чтения артефакта требуется подключение к локальному API.</p>'}</section>`
  );
}
function paletteCommands(query = "") {
  const commands = [
    ...views.map(([view, title]) => ({
      kind: "command",
      title: "Открыть: " + title,
      view,
      id: "view-" + view,
    })),
    ...(writable()
      ? [
          {
            kind: "command",
            title: "Создать систему — пошаговый мастер",
            view: "wizard",
            id: "create-system",
          },
        ]
      : []),
  ];
  const words = query
    .toLocaleLowerCase("ru")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return commands
    .filter((c) =>
      words.every((w) => c.title.toLocaleLowerCase("ru").includes(w)),
    )
    .slice(0, 12);
}
function renderPalette() {
  const p = state.palette;
  const results = p.results || [];
  p.index = Math.max(0, Math.min(p.index, results.length - 1));
  $("#search-results").innerHTML =
    results
      .map(
        (r, i) =>
          `<button id="search-option-${i}" type="button" class="search-result ${i === p.index ? "is-selected" : ""}" role="option" aria-selected="${i === p.index}" data-search-index="${i}"><span class="search-kind">${esc(r.kind === "command" ? "Команда" : r.kind === "artifact" ? "Файл" : sectionLabel(r.section || "", state.model))}</span><strong>${esc(r.title || r.id || r.path)}</strong><span class="subtle small">${esc(r.id || r.path || "")}${r.owner ? " · " + esc(r.owner) : ""}</span>${r.snippet ? `<span class="search-snippet">${esc(r.snippet)}</span>` : ""}</button>`,
      )
      .join("") ||
    '<div class="empty">Ничего не найдено. Попробуйте часть названия, ID или имя владельца.</div>';
  const input = $("#global-search");
  if (results.length)
    input.setAttribute("aria-activedescendant", "search-option-" + p.index);
  else input.removeAttribute("aria-activedescendant");
  $("#search-status").textContent = p.loading
    ? "Ищем по исходным документам…"
    : p.warning ||
      `${p.total || results.length} результатов в проекте «${projectInfo().title || state.project}». ↑ ↓ — выбрать, Enter — открыть, Esc — закрыть.`;
}
async function searchPalette(query, { remote = true } = {}) {
  const token = (state.searchToken || 0) + 1;
  state.searchToken = token;
  const local = searchModel(state.model, query, { limit: 35 });
  const recent = query.trim()
    ? []
    : state.preferences.recent
        .slice(0, 5)
        .map((r) => ({ ...r, kind: "object" }));
  state.palette = {
    query,
    index: 0,
    results: [...recent, ...local.results, ...paletteCommands(query)]
      .filter(
        (r, i, a) =>
          a.findIndex(
            (x) =>
              x.kind + "/" + x.section + "/" + (x.id || x.path) ===
              r.kind + "/" + r.section + "/" + (r.id || r.path),
          ) === i,
      )
      .slice(0, 50),
    total: local.total,
    loading: remote && state.online && query.trim().length >= 2,
  };
  renderPalette();
  if (!state.palette.loading) return;
  try {
    const remote = await api("ux_search", { query, limit: 40, offset: 0 });
    if (state.searchToken !== token) return;
    const combined = [
      ...(remote.results || []),
      ...local.results,
      ...paletteCommands(query),
    ];
    state.palette.results = combined
      .filter(
        (r, i, a) =>
          a.findIndex(
            (x) =>
              x.kind + "/" + x.section + "/" + (x.id || x.path) ===
              r.kind + "/" + r.section + "/" + (r.id || r.path),
          ) === i,
      )
      .slice(0, 60);
    state.palette.total = remote.total || state.palette.results.length;
    state.palette.loading = false;
    state.palette.warning = remote.warnings?.length
      ? "Поиск по доступным источникам. Некоторые файлы пропущены: подробности в исходных данных проекта."
      : null;
    renderPalette();
  } catch (error) {
    if (state.searchToken !== token) return;
    state.palette.loading = false;
    state.palette.warning =
      "Текст документов недоступен. Показаны объекты загруженной модели. " +
      error.message;
    renderPalette();
  }
}
async function openSearch() {
  await captureEditor();
  const dialog = $("#search-dialog");
  if (!dialog.open) dialog.showModal();
  $("#global-search").value = "";
  await searchPalette("");
  $("#global-search").focus();
}
async function openArtifact(path, { replace = false } = {}) {
  await captureEditor();
  state.artifactPath = path;
  state.artifact = null;
  state.view = "artifact";
  storeRoute({ replace });
  render();
  if (state.online) {
    state.artifact = await api("ux_artifact", { path });
    render();
  } else
    notify(
      "Для чтения исходного файла нужен локальный API. Данные объектов доступны из кэша.",
      true,
    );
}
async function openSearchResult(index) {
  const r = state.palette.results[index];
  if (!r) return;
  $("#search-dialog").close();
  if (r.kind === "command") {
    if (r.view === "wizard") {
      state.wizard ||= newWizard();
    }
    await navigate(r.view);
    return;
  }
  if (r.kind === "artifact") {
    await openArtifact(r.path);
    return;
  }
  if (r.section === "docs" && docUrl(r.id)) {
    window.open(docUrl(r.id), "_blank", "noopener");
    await rememberObject(r.section, r.id);
    return;
  }
  await openObject(r.section, r.id);
}
function issueHtml() {
  const issues = normalizeValidationIssues(
    state.validation?.problems || [],
    state.model,
    state.activeDraft,
  );
  return `<div class="validation-issues" aria-label="Ошибки проверки модели">${issues.map((issue) => `<article class="validation-issue"><h3>${esc(issue.description)}</h3>${issue.rule ? `<p class="subtle small">Правило: <code>${esc(issue.rule)}</code></p>` : ""}${issue.id ? `<p><code>${esc(issue.id)}</code>${issue.field ? " · " + esc(fieldLabels[issue.field] || issue.field) : ""}</p><button class="secondary" data-act="ux-fix-issue" data-index="${issue.index}">Открыть ${issue.field ? "поле для исправления" : "объект"}</button>` : '<p class="subtle">В диагностике нет однозначной ссылки на объект. Проверьте исходные сведения правила.</p>'}<details><summary>Исходная диагностика</summary><pre>${esc(pretty(issue.raw))}</pre></details></article>`).join("")}</div>`;
}
async function openIssue(index) {
  const issue = normalizeValidationIssues(
    state.validation?.problems || [],
    state.model,
    state.activeDraft,
  ).find((i) => i.index === index);
  if (!issue?.id)
    throw Error("Проверка не указала однозначный объект для исправления");
  const original = state.activeDraft;
  state.repairDraft = original?.operations?.length
    ? structuredClone(original)
    : null;
  if (state.model[issue.section]?.[issue.id])
    await openObject(issue.section, issue.id, {
      edit: true,
      property: issue.field,
    });
  else {
    const op = original?.operations?.find(
      (o) => o.section === issue.section && o.id === issue.id,
    );
    if (!op)
      throw Error("Объект отсутствует и в модели, и в операциях черновика");
    await captureEditor();
    state.section = issue.section;
    state.editId = issue.id;
    state.editorValue = pretty(op.value || {});
    state.editorMode = op.mode;
    state.selected.clear();
    state.view = "objects";
    state.editorSchema = null;
    startEditHistory();
    if (state.online)
      state.editorSchema = await api("editor_schema", {
        section: issue.section,
      });
    storeRoute();
    render();
    if (issue.field)
      [...document.querySelectorAll("[data-editor-field]")]
        .find((e) => e.dataset.editorField === issue.field)
        ?.focus();
  }
  notify(
    state.repairDraft
      ? "Исправьте поле и покажите обновлённый diff. Остальные операции черновика будут сохранены."
      : "Исправьте объект и подготовьте новый diff. Исходный черновик остаётся в списке.",
  );
}
async function restoreRoute({ initial = false } = {}) {
  const sequence = ++routeSequence,
    route = initial ? state.route : parseRoute(location.href);
  state.route = route;
  if (!initial && route.project && route.project !== state.project) {
    await changeProject(route.project, { store: false, restoreSaved: false });
    if (sequence !== routeSequence) return;
  }
  if (route.view) state.view = route.view;
  if (route.section && Object.hasOwn(state.model, route.section))
    state.section = route.section;
  if (route.id) {
    const changed = state.editId !== route.id;
    state.editId = route.id;
    state.selected.clear();
    if (changed || !initial) {
      state.editorValue = pretty(state.model[state.section]?.[route.id] || {});
      state.editorMode = "merge";
      startEditHistory();
      if (initial) await hydrateEditor(state.section, route.id);
    }
    if (!state.model[state.section]?.[route.id])
      notify(
        "Объект из ссылки отсутствует в этой версии модели: " + route.id,
        true,
      );
  }
  const q = new URLSearchParams(location.search);
  if (
    [
      "filter",
      "owner",
      "domain",
      "status",
      "sort",
      "direction",
      "page",
      "pageSize",
      "columns",
    ].some((k) => q.has(k))
  ) {
    state.filter = route.filter;
    state.catalog = normalizeCatalog(route.catalog);
  }
  if (state.view === "scenarios" && state.online && !state.scenarios) {
    try {
      const r = await api("ux_scenarios");
      if (sequence === routeSequence) {
        state.scenarios = r.scenarios || [];
        state.scenarioWarnings = r.warnings || [];
      }
    } catch (error) {
      notify(error.message, true);
    }
  }
  if (state.view === "artifact" && route.path) {
    state.artifactPath = route.path;
    if (state.online)
      try {
        state.artifact = await api("ux_artifact", { path: route.path });
      } catch (error) {
        notify(error.message, true);
      }
  }
  if (
    state.view === "passport" &&
    state.editId &&
    state.model[state.section]?.[state.editId]
  ) {
    state.passport = null;
    if (state.online)
      try {
        const p = await api("ux_passport", {
          section: state.section,
          id: state.editId,
        });
        if (sequence === routeSequence) state.passport = p;
      } catch {}
  }
  if (!state.undo) startEditHistory();
  render();
}
async function hydrateEditor(section, id) {
  const saved = await localGet(
    "editor-entity:" + state.project + ":" + section + ":" + id,
  );
  if (
    !saved ||
    saved.section !== section ||
    saved.editId !== id ||
    !saved.pending
  )
    return false;
  state.editorValue = saved.editorValue ?? state.editorValue;
  state.editorMode = saved.editorMode || state.editorMode;
  state.editorPending = !!saved.pending;
  state.editorSavedAt = saved.savedAt || null;
  state.undo = saved.undo?.items?.length
    ? saved.undo
    : editHistory(makeEditSnapshot(state));
  if (
    saved.pending &&
    saved.baseFingerprint &&
    saved.baseFingerprint !== state.fingerprint
  )
    notify(
      "Восстановлен ввод из другой версии проекта. Сравните его с текущей моделью перед подготовкой diff.",
      true,
    );
  return true;
}
async function changeProject(id, options = {}) {
  return transition(() => performChangeProject(id, options));
}
async function performChangeProject(
  id,
  { store = true, restoreSaved = true } = {},
) {
  await captureEditor();
  clearTimeout(autoSaveTimer);
  if (!state.projects.some((p) => p.id === id))
    throw Error("Проект не подключён: " + id);
  state.project = id;
  state.editorSchema = null;
  state.passport = null;
  state.scenarios = null;
  state.scenarioId = "";
  state.scenarioSteps = [];
  state.scenarioIndex = 0;
  state.wizard = null;
  state.artifact = null;
  state.projectContext = null;
  state.activeDraft = null;
  state.graph = null;
  state.drafts = [];
  state.snapshots = [];
  state.previews = [];
  state.evidence = null;
  state.drawioXML = "";
  state.drawioFiles = [];
  state.drawioEditorOpen = false;
  state.diagnostics = null;
  state.answer = null;
  state.findings = null;
  state.editId = "";
  state.editorValue = "{}";
  state.editorMode = "create";
  state.selected.clear();
  state.undo = null;
  state.repairDraft = null;
  state.filter = "";
  state.editorPending = false;
  state.editorSavedAt = null;
  state.publicationStatus = null;
  resetReview();
  if (state.online) await api("project_select");
  await cacheSet("current-project", id);
  if (state.online) {
    try {
      await loadModel();
    } catch (error) {
      clearLoadedModel(error);
      notify("Модель проекта не загружена. Откройте диагностику.", true);
    }
  } else {
    Object.assign(
      state,
      (await localGet("model:" + id)) || {
        model: {},
        provenance: {},
        head: "",
        fingerprint: "",
      },
    );
    state.modelError = null;
  }
  await loadPreferences();
  await loadLocalDrafts();
  if (restoreSaved) await restoreEditor();
  renderProject();
  if (store) storeRoute();
  render();
}
async function uxAction(name, element) {
  const data = element?.dataset || {};
  switch (name) {
    case "ux-search":
      await openSearch();
      break;
    case "ux-export-text": {
      const current = {
        ...makeEditSnapshot(state),
        editId: $("#object-id")?.value ?? state.editId,
        editorValue: $("#object-json")?.value ?? state.editorValue,
      };
      download(
        "seaf-editor-input.json",
        pretty({
          format: "seaf-editor-text-v1",
          project: state.project,
          baseHead: state.head,
          baseFingerprint: state.fingerprint,
          ...current,
        }),
      );
      notify(
        "Ввод формы скачан. Он может содержать незавершённый JSON и не является проверенным изменением модели.",
      );
      break;
    }
    case "ux-open":
      await openObject(data.section || state.section, data.id || state.editId);
      break;
    case "ux-edit":
      await openObject(state.section, state.editId, { edit: true });
      break;
    case "ux-navigate":
      await navigate(data.view);
      break;
    case "ux-favorite":
      state.preferences = toggleFavorite(state.preferences, {
        section: state.section,
        id: state.editId,
        title: state.model[state.section]?.[state.editId]?.title,
      });
      await persistPreferences();
      render();
      notify("Избранное обновлено в этом браузере.");
      break;
    case "ux-copy-link": {
      const url = new URL(routeQuery(state), location.origin).href;
      try {
        await navigator.clipboard.writeText(url);
        notify("Точная ссылка скопирована.");
      } catch {
        showResult("Ссылка на объект / представление", url);
      }
      break;
    }
    case "ux-artifact":
      await openArtifact(data.path);
      break;
    case "ux-page-prev":
      state.catalog.page = Math.max(0, state.catalog.page - 1);
      await persistPreferences();
      storeRoute({ replace: true });
      render();
      break;
    case "ux-page-next":
      state.catalog.page++;
      await persistPreferences();
      storeRoute({ replace: true });
      render();
      break;
    case "ux-sort-direction":
      state.catalog.direction =
        state.catalog.direction === "asc" ? "desc" : "asc";
      state.catalog.page = 0;
      await persistPreferences();
      storeRoute({ replace: true });
      render();
      break;
    case "ux-clear-filters":
      state.catalog = { ...defaultCatalog(), columns: state.catalog.columns };
      state.filter = "";
      await persistPreferences();
      storeRoute({ replace: true });
      render();
      break;
    case "ux-save-view": {
      const title = prompt(
        "Название представления реестра",
        state.preferences.savedViews.find(
          (v) => v.id === state.catalog.savedView,
        )?.title || "",
      );
      if (!title?.trim()) return;
      const id = state.catalog.savedView || crypto.randomUUID();
      const view = {
        id,
        title: title.trim().slice(0, 100),
        section: state.section,
        filter: state.filter,
        catalog: normalizeCatalog(state.catalog),
      };
      state.preferences.savedViews = [
        view,
        ...state.preferences.savedViews.filter((v) => v.id !== id),
      ].slice(0, 30);
      state.catalog.savedView = id;
      await persistPreferences();
      render();
      notify("Представление сохранено в браузере для этого проекта.");
      break;
    }
    case "ux-delete-view":
      state.preferences.savedViews = state.preferences.savedViews.filter(
        (v) => v.id !== state.catalog.savedView,
      );
      state.catalog.savedView = "";
      await persistPreferences();
      render();
      break;
    case "ux-undo":
    case "ux-redo": {
      await captureEditor();
      const next = moveEdit(state.undo, name === "ux-undo" ? -1 : 1);
      if (next) {
        Object.assign(state, next, {
          selected: new Set(next.selected || []),
          editorPending: true,
        });
        await captureEditor({ fromState: true, record: false });
        render();
      }
      break;
    }
    case "ux-fix-issue":
      await openIssue(Number(data.index));
      break;
    case "ux-wizard":
      if (!writable()) throw Error("Проект доступен только для чтения");
      state.wizard ||= newWizard();
      await navigate("wizard");
      break;
    case "ux-wizard-prev":
      state.wizard.step = Math.max(0, state.wizard.step - 1);
      render();
      break;
    case "ux-wizard-next": {
      const w = state.wizard;
      if (w.step === 0) {
        if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,249}$/.test(w.id))
          throw Error(
            "Укажите ID латиницей: буквы, цифры, точки, дефисы или подчёркивания",
          );
        if (!w.title.trim()) throw Error("Укажите название системы");
        if (Object.hasOwn(state.model[w.section] || {}, w.id))
          throw Error("Объект с этим ID уже существует");
      }
      if (w.step === 1 && !w.owner.trim())
        throw Error("Укажите владельца системы");
      w.step = Math.min(3, w.step + 1);
      render();
      $("#main h1")?.focus();
      break;
    }
    case "ux-wizard-add-link": {
      const w = state.wizard;
      if (!state.model.components?.[w.target])
        throw Error("Выберите существующего получателя");
      if (!w.linkTitle.trim()) throw Error("Укажите назначение взаимодействия");
      if (w.links.length >= 100)
        throw Error("В мастер можно добавить до 100 взаимодействий");
      w.links.push({
        id: w.target,
        title: w.linkTitle.trim(),
        protocol: w.protocol.trim(),
        direction: "-->",
      });
      w.linkTitle = "";
      render();
      break;
    }
    case "ux-wizard-remove-link":
      state.wizard.links.splice(Number(data.index), 1);
      render();
      break;
    case "ux-wizard-reset":
      state.wizard = newWizard();
      await localSet("wizard:" + state.project, state.wizard);
      render();
      break;
    case "ux-wizard-stage": {
      const w = state.wizard;
      if (!w.id || !w.title.trim() || !w.owner.trim())
        throw Error("Заполните ID, название и владельца");
      if (Object.hasOwn(state.model[w.section] || {}, w.id))
        throw Error("Объект уже существует");
      const value = {
        title: w.title.trim(),
        owner: w.owner.trim(),
        description: w.description.trim(),
        ...(w.section === "components"
          ? { entity: "system", ...(w.links.length ? { links: w.links } : {}) }
          : {}),
      };
      const ops = [{ section: w.section, id: w.id, mode: "create", value }];
      if (w.section === "components" && w.context) {
        if (w.context === "__new__") {
          if (!/^[A-Za-z0-9][A-Za-z0-9_.-]{0,249}$/.test(w.newContext))
            throw Error("Укажите корректный ID нового контекста");
          if (state.model.contexts?.[w.newContext])
            throw Error("Контекст уже существует");
          ops.push({
            section: "contexts",
            id: w.newContext,
            mode: "create",
            value: {
              title: w.newContextTitle.trim() || w.title + " — компоненты",
              location: "Архитектура/" + (w.newContextTitle.trim() || w.title),
              components: [w.id, ...w.links.map((l) => l.id)],
              presentation: "plantuml",
            },
          });
        } else {
          const context = state.model.contexts?.[w.context];
          if (!context || !Array.isArray(context.components))
            throw Error("Выберите контекст с явным списком components");
          ops.push({
            section: "contexts",
            id: w.context,
            mode: "merge",
            value: { components: [...new Set([...context.components, w.id])] },
          });
        }
      }
      let draft;
      if (state.online) {
        const current = await api("model");
        if (
          current.head !== w.baseHead ||
          current.fingerprint !== w.baseFingerprint
        )
          throw Error(
            "Модель изменилась после открытия мастера. Сохранённый ввод останется; обновите модель и начните мастер заново, чтобы не затереть изменения.",
          );
        draft = await api("object_propose", {
          operations: ops,
          draft: true,
          title: "Новая система: " + w.title,
        });
      } else
        draft = await saveLocalDraft({
          title: "Новая система: " + w.title,
          operations: ops,
          baseHead: w.baseHead,
          baseFingerprint: w.baseFingerprint,
        });
      await acceptDraft(draft);
      state.editorPending = false;
      await navigate("drafts");
      notify(
        "Связанное изменение системы, интеграций и контекста подготовлено. Проверьте diff.",
      );
      break;
    }
    case "ux-scenarios-refresh": {
      const r = await api("ux_scenarios");
      state.scenarios = r.scenarios || [];
      state.scenarioWarnings = r.warnings || [];
      render();
      break;
    }
    case "ux-scenario-add": {
      const link = modelLinks(state.model).find(
        (l) => l.key === $("#scenario-link")?.value,
      );
      if (!link) throw Error("Выберите взаимодействие модели");
      state.scenarioSteps.push(structuredClone(link));
      state.scenarioIndex = state.scenarioSteps.length - 1;
      await localSet("scenario-route:" + state.project, state.scenarioSteps);
      render();
      break;
    }
    case "ux-scenario-clear":
      state.scenarioSteps = [];
      state.scenarioIndex = 0;
      await localSet("scenario-route:" + state.project, []);
      render();
      break;
    case "ux-scenario-prev":
      state.scenarioIndex = Math.max(0, state.scenarioIndex - 1);
      render();
      break;
    case "ux-scenario-next":
      state.scenarioIndex = Math.min(
        activeScenario().steps.length - 1,
        state.scenarioIndex + 1,
      );
      render();
      break;
    case "ux-scenario-go":
      state.scenarioIndex = Number(data.index) || 0;
      render();
      break;
  }
}
function title(text, description) {
  return `<h1>${esc(text)}</h1><p class="subtitle">${esc(description)}</p>${projectInfo().writable ? "" : `<div class="read-only">Проект подключён только для чтения. Изменение модели и применение черновиков недоступны.</div>`}${state.modelError ? `<div class="model-error hint warning">Модель проекта не загружена. Исправьте импорты и откройте «Диагностика». ${esc(state.modelError)}</div>` : ""}`;
}
function date(value) {
  return value ? new Date(value).toLocaleString("ru-RU") : "—";
}
function download(name, content, type = "application/json") {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
function showResult(titleText, result) {
  $("#dialog-title").textContent = titleText;
  $("#dialog-result").textContent =
    typeof result === "string" ? result : pretty(result);
  const link = $("#dialog-link"),
    url = result?.url ? safeUrl(result.url) : null;
  link.hidden = !url;
  if (url) link.href = url;
  $("#result-dialog").showModal();
}
function safeUrl(value) {
  try {
    const u = new URL(
      typeof value === "string" ? value : value?.url,
      location.href,
    );
    return ["http:", "https:"].includes(u.protocol) ? u.href : null;
  } catch {
    return null;
  }
}
async function connect() {
  busy(1);
  let sessionReady = false;
  try {
    const selected =
      state.route?.project || (await localGet("current-project"));
    if (selected) state.project = selected;
    const r = await fetch("/api/session", { cache: "no-store" });
    if (!r.ok) throw Error("Сервис недоступен");
    const data = await r.json();
    state.csrf = data.csrf || data.result?.csrf;
    state.projects = data.projects || data.result?.projects || [];
    if (!selected && data.activeProject) state.project = data.activeProject;
    state.editorUrl = data.editorUrl || data.result?.editorUrl || "";
    if (!state.csrf) throw Error("Сервис не выдал сессию");
    sessionReady = true;
    setOnline(true);
    await cacheSet("projects", state.projects);
    if (!state.projects.some((p) => p.id === state.project)) {
      if (state.route?.project)
        throw Error(
          "Проект из ссылки не подключён: " +
            state.route.project +
            ". Выберите подключённый проект в верхнем списке.",
        );
      state.project = state.projects[0]?.id || "shopflow";
    }
    await cacheSet("current-project", state.project);
    await loadModel();
    notify(
      state.storageError
        ? "Подключение установлено. Локальное сохранение недоступно: экспортируйте черновики JSON."
        : "Подключение установлено. Модель обновлена.",
      !!state.storageError,
    );
  } catch (error) {
    if (sessionReady) {
      clearLoadedModel(error);
      notify(
        "API доступен, но модель проекта не загружена. Откройте диагностику.",
        true,
      );
    } else {
      setOnline(false);
      state.projects = (await localGet("projects")) || [
        { id: "shopflow", title: "ShopFlow", writable: true },
      ];
      if (!state.projects.some((project) => project.id === state.project))
        state.project = state.projects[0]?.id || state.project;
      const cached = await localGet("model:" + state.project);
      if (cached) {
        Object.assign(state, cached);
        state.modelError = null;
      }
      notify(
        cached
          ? "Открыта сохранённая модель. Можно работать с локальными черновиками."
          : error.message,
        true,
      );
    }
  } finally {
    busy(-1);
    renderProject();
    await loadLocalDrafts();
    await loadPreferences();
    await restoreEditor();
    await restoreRoute({ initial: true });
    render();
  }
}
async function loadModel() {
  const m = await api("model");
  state.modelError = null;
  state.model = m.model || {};
  state.provenance = m.provenance || {};
  state.head = m.head || m.commit || "";
  state.revision = m.revision;
  state.projectContext = m.context || null;
  state.fingerprint = m.fingerprint || "";
  await cacheSet("model:" + state.project, {
    model: state.model,
    provenance: state.provenance,
    head: state.head,
    revision: state.revision,
    projectContext: state.projectContext,
    fingerprint: state.fingerprint,
  });
  if (!state.model[state.section])
    state.section =
      Object.keys(state.model).find(
        (k) => state.model[k] && typeof state.model[k] === "object",
      ) || "components";
  try {
    state.editorSchema = await api("editor_schema", { section: state.section });
  } catch {
    state.editorSchema = null;
  }
}
function clearLoadedModel(error) {
  state.modelError = error.message || String(error);
  state.model = {};
  state.provenance = {};
  state.head = "";
  state.fingerprint = "";
  state.projectContext = null;
}
function renderProject() {
  $("#project").innerHTML = state.projects
    .map(
      (p) =>
        `<option value="${esc(p.id)}" ${p.id === state.project ? "selected" : ""}>${esc(p.title || p.id)}${p.writable ? "" : " · чтение"}</option>`,
    )
    .join("");
  if (!state.projects.some((p) => p.id === state.project))
    $("#project").insertAdjacentHTML(
      "afterbegin",
      `<option value="${esc(state.project)}" selected disabled>Не подключён: ${esc(state.project)}</option>`,
    );
}
function renderNavigation() {
  $("#navigation").innerHTML =
    '<div class="nav-caption">Архитектура</div>' +
    views
      .map(
        ([id, text]) =>
          `<button type="button" data-view="${id}" class="${state.view === id ? "active" : ""}" aria-current="${state.view === id ? "page" : "false"}">${text}</button>`,
      )
      .join("") +
    '<div class="nav-caption">Избранное</div>' +
    state.preferences.favorites
      .slice(0, 5)
      .map((item) => memoryButton(item, { small: true }))
      .join("") +
    '<div class="nav-caption">Недавние</div>' +
    state.preferences.recent
      .slice(0, 5)
      .map((item) => memoryButton(item, { small: true }))
      .join("") +
    '<div class="nav-footer">Файлы проекта — источник истины.<br>Изменения проходят diff и проверки SEAF.</div>';
}
function render() {
  renderNavigation();
  const funcs = {
    home: renderHome,
    passport: renderPassport,
    wizard: renderWizard,
    scenarios: renderScenarios,
    artifact: renderArtifact,
    composer: () => composerPanel(state, esc),
    stack: () => stackPanel(state, esc),
    projects: () => renderProjects(state, esc),
    objects: renderObjects,
    drafts: renderDrafts,
    compare: renderCompare,
    snapshots: renderSnapshots,
    graph: () => renderGraph(false),
    trust: () => renderGraph(true),
    assistant: renderAssistant,
    drawio: renderDrawio,
    diagnostics: renderDiagnostics,
  };
  if (!funcs[state.view]) state.view = "objects";
  $("#main").innerHTML = funcs[state.view]();
  $(".shell").classList.toggle(
    "composer-focus",
    state.view === "composer" && !!state.composer?.focus,
  );
  if (state.view === "scenarios")
    $("#main .panel")?.insertAdjacentHTML(
      "afterbegin",
      '<p class="hint scenario-semantics">Сценарий — описание из источника, не трассировка работающей системы. Условия alt / else / opt показаны подписями; последовательный просмотр всех ветвей не означает их одновременное исполнение.</p>',
    );
  if (["graph", "trust"].includes(state.view) && state.graph) drawGraph();
  if (state.view === "drawio") editorFrame = $("#drawio-editor");
  if (state.view === "stack")
    bindStackPanel(state, api, esc, (section, id) =>
      run(() => openObject(section, id, { edit: true })),
    );
  if (state.view === "composer")
    bindComposerPanel({
      state,
      root: $("#main"),
      api,
      notify,
      acceptDraft: async (d) => {
        await acceptDraft(d);
        await navigate("drafts");
      },
      render,
      openObject: (section, id, options) =>
        run(() => openObject(section, id, options)),
    });
  renderContext();
  updateUndoControls();
  busy(0);
}
function objectSections() {
  return Object.keys(state.model).filter(
    (k) =>
      state.model[k] &&
      typeof state.model[k] === "object" &&
      !Array.isArray(state.model[k]) &&
      !k.startsWith("$"),
  );
}
function objectEntries() {
  return catalogRows(
    state.model,
    state.section,
    state.filter,
    state.catalog,
  ).filtered.map(({ id, value }) => [id, value]);
}
function renderObjects() {
  const catalog = catalogRows(
    state.model,
    state.section,
    state.filter,
    state.catalog,
  );
  state.catalog.page = catalog.page;
  const labels = {
      id: "Идентификатор",
      title: "Название",
      owner: "Владелец",
      domain: "Домен",
      status: "Статус",
      kind: "Тип",
    },
    columns = state.catalog.columns.length ? state.catalog.columns : ["id"];
  const options = (values, selected, empty) =>
    `<option value="">${empty}</option>${values.map((v) => `<option value="${esc(v)}" ${v === selected ? "selected" : ""}>${esc(v)}</option>`).join("")}`;
  const chosenViews = state.preferences.savedViews.filter(
    (v) => v.section === state.section,
  );
  let editorValue;
  try {
    editorValue = JSON.parse(state.editorValue);
  } catch {}
  const problems = editorValue
    ? schemaIssues(editorValue, state.editorSchema?.fields || [])
    : [];
  const table = `<section class="panel catalog"><div class="toolbar"><div class="field"><label for="section">Раздел модели</label><select id="section">${objectSections()
    .map(
      (k) =>
        `<option value="${esc(k)}" ${k === state.section ? "selected" : ""}>${esc(sectionLabel(k, state.model))}</option>`,
    )
    .join(
      "",
    )}</select><small class="subtle"><code>${esc(state.section)}</code></small></div><div class="field"><label for="filter">Поиск по реестру</label><input id="filter" value="${esc(state.filter)}" placeholder="ID, название, владелец…" type="search"></div></div><div class="catalog-filters"><div class="field"><label for="catalog-owner">Владелец</label><select id="catalog-owner" data-catalog="owner">${options(catalog.choices.owner, state.catalog.owner, "Все владельцы")}</select></div><div class="field"><label for="catalog-domain">Домен / группа</label><select id="catalog-domain" data-catalog="domain">${options(catalog.choices.domain, state.catalog.domain, "Все домены")}</select></div><div class="field"><label for="catalog-status">Статус</label><select id="catalog-status" data-catalog="status">${options(catalog.choices.status, state.catalog.status, "Все статусы")}</select></div><div class="field"><label for="catalog-sort">Сортировка</label><select id="catalog-sort" data-catalog="sort">${Object.entries(
    labels,
  )
    .map(
      ([key, label]) =>
        `<option value="${key}" ${state.catalog.sort === key ? "selected" : ""}>${label}</option>`,
    )
    .join(
      "",
    )}</select></div><button class="secondary sort-direction" data-act="ux-sort-direction" aria-label="${state.catalog.direction === "asc" ? "Сортировать по убыванию" : "Сортировать по возрастанию"}">${state.catalog.direction === "asc" ? "↑ А—Я" : "↓ Я—А"}</button></div><div class="catalog-view-tools"><div class="field"><label for="catalog-view">Сохранённое представление</label><select id="catalog-view"><option value="">Текущее представление</option>${chosenViews.map((v) => `<option value="${esc(v.id)}" ${state.catalog.savedView === v.id ? "selected" : ""}>${esc(v.title)}</option>`).join("")}</select></div><button class="quiet" data-act="ux-save-view">Сохранить вид</button><button class="quiet" data-act="ux-delete-view" ${state.catalog.savedView ? "" : "disabled"}>Удалить вид</button><details class="column-options"><summary>Колонки</summary><div>${Object.entries(
    labels,
  )
    .map(
      ([key, label]) =>
        `<label class="checkbox-label"><input type="checkbox" data-column="${key}" ${columns.includes(key) ? "checked" : ""}>${label}</label>`,
    )
    .join(
      "",
    )}</div></details><button class="quiet" data-act="ux-clear-filters">Сбросить фильтры</button></div><div class="row"><button data-act="new-object" ${writable() ? "" : "disabled"}>Создать</button><button class="secondary" data-act="new-system" ${writable() ? "" : "disabled"}>Создать систему</button><button class="secondary" data-act="ux-wizard" ${writable() ? "" : "disabled"}>Мастер создания</button><span class="grow"></span><span class="subtle" id="catalog-total">${catalog.total} объектов · выбрано ${state.selected.size}</span></div><div class="row subtle"><button class="quiet" data-act="select-visible">Выбрать показанные</button><button class="quiet" data-act="clear-selection">Снять выбор</button></div><div class="object-list"><table><thead><tr><th class="checkbox-cell"><span class="sr-only">Выбор</span></th>${columns.map((c) => `<th scope="col">${labels[c]}</th>`).join("")}<th scope="col">Просмотр</th></tr></thead><tbody>${catalog.rows.map((r) => `<tr class="object-row ${state.editId === r.id ? "selected" : ""}" data-object="${esc(r.id)}" tabindex="0" aria-label="Открыть ${esc(r.title)} в редакторе"><td><input type="checkbox" data-select="${esc(r.id)}" aria-label="Выбрать ${esc(r.id)}" ${state.selected.has(r.id) ? "checked" : ""}></td>${columns.map((c) => `<td>${c === "id" ? `<code>${esc(r.id)}</code>` : esc(r[c] || "—")}</td>`).join("")}<td><button class="quiet" data-act="ux-open" data-section="${esc(state.section)}" data-id="${esc(r.id)}" aria-label="Паспорт ${esc(r.title)}">Паспорт</button></td></tr>`).join("") || `<tr><td colspan="${columns.length + 2}" class="empty">По заданным условиям ничего не найдено. Сбросьте фильтры или создайте объект.</td></tr>`}</tbody></table></div><div class="catalog-pagination"><button class="secondary" data-act="ux-page-prev" ${catalog.page ? "" : "disabled"}>← Назад</button><span role="status">Страница ${catalog.page + 1} из ${catalog.pages} · ${catalog.total ? catalog.page * catalog.pageSize + 1 : 0}–${Math.min((catalog.page + 1) * catalog.pageSize, catalog.total)} из ${catalog.total}</span><button class="secondary" data-act="ux-page-next" ${catalog.page + 1 < catalog.pages ? "" : "disabled"}>Далее →</button><label for="catalog-page-size">На странице</label><select id="catalog-page-size" data-catalog="pageSize">${[25, 50, 100, 200].map((n) => `<option value="${n}" ${catalog.pageSize === n ? "selected" : ""}>${n}</option>`).join("")}</select></div><details class="custom-section"><summary>Добавить другой тип объектов</summary><label for="custom-section">Идентификатор раздела модели</label><input id="custom-section" placeholder="Например, integrations"><p class="subtle">Новый раздел должен поддерживаться метамоделью вашего проекта.</p></details></section>`;
  const form = `<section class="panel editor"><div class="panel-heading"><h2>${state.selected.size > 1 ? "Пакетное изменение" : state.editId ? "Изменение объекта" : "Новый объект"}</h2><div class="row"><button class="quiet" data-act="ux-undo" ${state.undo?.index > 0 ? "" : "disabled"} aria-keyshortcuts="Control+z">↶ Отменить</button><button class="quiet" data-act="ux-redo" ${state.undo && state.undo.index < state.undo.items.length - 1 ? "" : "disabled"} aria-keyshortcuts="Control+Shift+z">↷ Повторить</button></div></div>${state.editId && state.model[state.section]?.[state.editId] ? `<div class="row"><button class="quiet" data-act="ux-open" data-section="${esc(state.section)}" data-id="${esc(state.editId)}">Открыть паспорт</button><button class="quiet" data-act="ux-copy-link">Ссылка на объект</button></div>` : ""}<div class="field"><label for="object-id">Идентификатор ${state.selected.size ? "(выбрано " + state.selected.size + " объектов)" : ""}</label><input id="object-id" value="${esc(state.editId)}" placeholder="demo.shop.new_service" ${state.selected.size ? "disabled" : ""} aria-describedby="object-id-help"><small id="object-id-help" class="subtle">Стабильный уникальный ID. Название для пользователей задаётся отдельным полем.</small></div><div class="field"><label for="edit-mode">Действие с объектом</label><select id="edit-mode">${[
    ["create", "Создать"],
    ["merge", "Изменить указанные свойства"],
    ["replace", "Заменить все свойства"],
    ["delete", "Удалить объект"],
  ]
    .map(
      ([v, t]) =>
        `<option value="${v}" ${state.editorMode === v ? "selected" : ""}>${t}</option>`,
    )
    .join(
      "",
    )}</select></div>${state.editorMode === "delete" ? '<p class="hint warning">Будет подготовлено удаление выбранного объекта. Проверьте связанные объекты и diff перед сохранением.</p>' : renderFields({ ...state, fieldIssues: problems }, esc)}<details id="advanced-editor" ${state.preferences.compactForm ? "" : "open"}><summary>Расширенные свойства: JSON и произвольные поля</summary><div class="field"><label for="object-json">Свойства объекта (JSON)</label><textarea id="object-json" spellcheck="false" ${state.editorMode === "delete" ? "disabled" : ""} aria-describedby="object-json-help">${esc(state.editorValue)}</textarea><small id="object-json-help" class="subtle">Все неизвестные форме свойства сохраняются. Незавершённый текст также сохраняется в браузере; предложение требует корректного JSON.</small></div><div class="property-grid"><input id="property-name" placeholder="Свойство: owner" aria-label="Название свойства"><input id="property-value" placeholder='Значение JSON: "Logistics"' aria-label="Значение свойства"><button class="secondary button-small" data-act="add-property">Добавить</button></div><p class="hint">«Изменить свойства» сохраняет остальные поля. «Заменить» заменяет объект целиком. Удаление поля задаётся в JSON с операцией «Заменить».</p></details><div class="row"><button data-act="object-propose" ${writable() ? "" : "disabled"}>Показать изменения</button><button class="secondary" data-act="save-local" ${writable() ? "" : "disabled"}>Сохранить локально</button><button class="quiet" data-act="export-editor" ${writable() ? "" : "disabled"}>Экспорт JSON</button><button class="quiet" data-act="reset-object">Сбросить</button></div><button class="quiet small" data-act="ux-export-text">Скачать ввод формы</button><p id="autosave-status" class="form-status" role="status">${state.formPersistenceFailed ? "Локальное сохранение не удалось. Экспортируйте ввод." : state.editorSavedAt ? "Текст формы сохранён в браузере · " + esc(date(state.editorSavedAt)) : "Изменения автоматически сохраняются в браузере; файлы проекта остаются неизменными."}</p><p class="subtle path">Источник: ${esc(state.provenance[state.section + "/" + state.editId] || "определяется при подготовке изменения")}</p></section>`;
  return (
    title(
      "Редактор объектов",
      "Найдите объект, откройте паспорт или измените его. Все записи проходят diff и проверку.",
    ) +
    `<div class="split catalog-editor">${table}${form}</div>${renderLinks(state, esc)}${state.activeDraft ? reviewHtml() : ""}`
  );
}
function operations() {
  if (!writable()) throw Error("Проект подключён только для чтения");
  const mode = $("#edit-mode")?.value || state.editorMode;
  const id = $("#object-id")?.value.trim() || state.editId;
  const ids = state.selected.size ? [...state.selected] : [id];
  if (ids.some((x) => !x)) throw Error("Укажите идентификатор объекта");
  const value =
    mode === "delete"
      ? undefined
      : JSON.parse($("#object-json")?.value ?? state.editorValue);
  return ids.map((id) => ({
    section: state.section,
    id,
    mode,
    ...(mode === "delete" ? {} : { value }),
  }));
}
async function captureEditor({ fromState = false, record = true } = {}) {
  if (!fromState && !$("#object-json")) return;
  if (!fromState) {
    state.editId = $("#object-id")?.value ?? state.editId;
    state.editorValue = $("#object-json")?.value ?? state.editorValue;
    state.editorMode = $("#edit-mode")?.value || state.editorMode;
  }
  const snapshot = makeEditSnapshot(state),
    before = state.undo?.items?.[state.undo.index];
  if (record) {
    if (before && JSON.stringify(before) !== JSON.stringify(snapshot))
      state.editorPending = true;
    state.undo = recordEdit(state.undo, snapshot);
  }
  if (state.editorPending) {
    state.validation = null;
    state.proposalId = null;
    for (const button of document.querySelectorAll(
      '[data-act="apply-active"],[data-act="validate-active"]',
    ))
      button.disabled = true;
    const warning = $("#review-form-warning");
    if (warning) warning.hidden = false;
  }
  const project = state.project,
    savedAt = new Date().toISOString(),
    saved = {
      ...snapshot,
      baseHead: state.head,
      baseFingerprint: state.fingerprint,
      pending: state.editorPending,
      savedAt,
      undo: state.undo,
    };
  try {
    const recovery = JSON.stringify({ ...saved, undo: undefined });
    if (recovery.length < 1500000)
      localStorage.setItem("seaf-wb:editor-recovery:" + project, recovery);
  } catch {}
  updateUndoControls();
  try {
    await Promise.all([
      localSet("editor:" + project, saved),
      localSet(
        "editor-entity:" + project + ":" + state.section + ":" + state.editId,
        saved,
      ),
    ]);
    if (state.project === project) {
      state.editorSavedAt = savedAt;
      state.formPersistenceFailed = false;
      const el = $("#autosave-status");
      if (el)
        el.textContent =
          "Текст формы сохранён в браузере · " +
          new Date(savedAt).toLocaleTimeString("ru-RU");
      renderContext();
    }
  } catch (error) {
    if (state.project === project) {
      state.formPersistenceFailed = true;
      const el = $("#autosave-status");
      if (el)
        el.textContent = "Локальное сохранение не удалось. Экспортируйте ввод.";
      renderContext();
    }
    if (state.editorPending) throw error;
    notify(error.message, true);
  }
}
function selectionEditor() {
  if (state.selected.size === 1) {
    state.editId = [...state.selected][0];
    state.editorValue = pretty(
      state.model[state.section]?.[state.editId] ?? {},
    );
    state.editorMode = "merge";
  } else {
    state.editId = "";
    state.editorValue = "{}";
    state.editorMode = state.selected.size ? "merge" : "create";
  }
}
async function restoreEditor() {
  let saved = await localGet("editor:" + state.project);
  try {
    const recovery = JSON.parse(
      localStorage.getItem("seaf-wb:editor-recovery:" + state.project) ||
        "null",
    );
    if (
      recovery &&
      (!saved || String(recovery.savedAt || "") > String(saved.savedAt || ""))
    )
      saved = recovery;
  } catch {}
  if (!saved) return;
  state.section = saved.section || state.section;
  state.model[state.section] ||= {};
  state.editId = saved.editId || "";
  state.editorValue = saved.editorValue ?? "{}";
  state.editorMode = saved.editorMode || "create";
  state.selected = new Set(saved.selected || []);
  state.editorPending = !!saved.pending;
  state.editorSavedAt = saved.savedAt || null;
  state.undo = saved.undo?.items?.length
    ? saved.undo
    : editHistory(makeEditSnapshot(state));
  if (!saved.pending && state.model[state.section]?.[state.editId]) {
    state.editorValue = pretty(state.model[state.section][state.editId]);
    state.editorMode = "merge";
    state.undo = editHistory(makeEditSnapshot(state));
  }
  if (
    (saved.baseHead && saved.baseHead !== state.head) ||
    (saved.baseFingerprint && saved.baseFingerprint !== state.fingerprint)
  )
    notify(
      "Восстановлен текст редактора из другой версии модели. Проверьте изменения перед подготовкой черновика.",
      true,
    );
}
async function loadLocalDrafts() {
  state.localDrafts = (await localGet("drafts:" + state.project)) || [];
}
function validateDraft(draft, { importing = false } = {}) {
  if (!draft || typeof draft !== "object" || Array.isArray(draft))
    throw Error("Черновик должен быть JSON-объектом");
  if (draft.format && draft.format !== "seaf-draft-v1")
    throw Error("Неподдерживаемая версия черновика: " + draft.format);
  if (importing && !draft.project)
    throw Error("В черновике не указан проект. Проверьте файл перед импортом.");
  if (draft.project && draft.project !== state.project)
    throw Error(
      "Черновик относится к проекту " +
        draft.project +
        ". Сначала выберите этот проект.",
    );
  if (
    importing &&
    !Array.isArray(draft.changes) &&
    !Array.isArray(draft.operations)
  )
    throw Error("Файл не содержит изменений черновика");
  if (importing) {
    if (
      !/^(?:[a-f0-9]{40}|[a-f0-9]{64})$/i.test(draft.baseHead || "") ||
      !/^[a-f0-9]{64}$/i.test(draft.baseFingerprint || "")
    )
      throw Error("В черновике отсутствует корректная исходная версия модели.");
    if (draft.title !== undefined && typeof draft.title !== "string")
      throw Error("Название черновика должно быть строкой.");
    if (draft.operations !== undefined) {
      if (!Array.isArray(draft.operations) || draft.operations.length > 500)
        throw Error("Некорректный список операций черновика.");
      for (const op of draft.operations) {
        if (
          !op ||
          typeof op !== "object" ||
          Array.isArray(op) ||
          !["create", "merge", "replace", "delete"].includes(op.mode) ||
          typeof op.section !== "string" ||
          !op.section ||
          typeof op.id !== "string" ||
          !op.id ||
          ["imports", "constructor", "prototype", "__proto__"].includes(
            op.section,
          ) ||
          ["constructor", "prototype", "__proto__"].includes(op.id)
        )
          throw Error("Некорректная операция черновика.");
        if (
          op.mode !== "delete" &&
          (!op.value || typeof op.value !== "object" || Array.isArray(op.value))
        )
          throw Error("Свойства операции должны быть JSON-объектом.");
        if (
          op.removeProperties !== undefined &&
          (!Array.isArray(op.removeProperties) ||
            op.removeProperties.some((value) => typeof value !== "string"))
        )
          throw Error("Некорректный список удаляемых свойств.");
      }
    }
    if (draft.changes !== undefined) {
      if (!Array.isArray(draft.changes) || draft.changes.length > 50)
        throw Error("Некорректный список файлов черновика.");
      for (const change of draft.changes)
        if (
          !change ||
          typeof change.path !== "string" ||
          !change.path ||
          change.path.includes("\\") ||
          change.path.includes(":") ||
          change.path
            .split("/")
            .some((part) => !part || part.startsWith(".")) ||
          (change.content !== null &&
            (typeof change.content !== "string" ||
              change.content.length > 500000))
        )
          throw Error("Некорректное изменение файла черновика.");
    }
    if (!draft.operations?.length && !draft.changes?.length)
      throw Error("Черновик не содержит операций или изменений файлов.");
  }
  return draft;
}
function serializeDraft(draft) {
  validateDraft(draft);
  return pretty({ ...draft, format: "seaf-draft-v1", project: state.project });
}
async function saveLocalDraft(draft) {
  validateDraft(draft);
  await loadLocalDrafts();
  const id = draft.id || "local-" + crypto.randomUUID();
  const value = {
    ...draft,
    format: "seaf-draft-v1",
    id,
    project: state.project,
    updatedAt: new Date().toISOString(),
    local: true,
  };
  const updated = [value, ...state.localDrafts.filter((x) => x.id !== id)];
  await localSet("drafts:" + state.project, updated);
  state.localDrafts = updated;
  return value;
}
async function localEditorDraft(auto = false) {
  await captureEditor();
  const ops = operations();
  const key = ops.map((op) => op.id).join("|");
  const id = auto
    ? "local-editor-" +
      state.project +
      "-" +
      state.section +
      "-" +
      encodeURIComponent(key).slice(0, 200)
    : "local-" + crypto.randomUUID();
  const d = await saveLocalDraft({
    id,
    title: `${state.selected.size > 1 ? "Пакетное изменение" : state.editorMode === "create" ? "Создание" : "Изменение"}: ${state.selected.size > 1 ? state.selected.size + " объектов" : ops[0].id}`,
    baseHead: state.head,
    baseFingerprint: state.fingerprint,
    operations: ops,
  });
  if (!auto) {
    state.activeDraft = d;
    state.editorPending = false;
    state.publicationStatus = null;
    resetReview();
    render();
    notify("Черновик сохранён в браузере. Git и портал не изменены.");
  }
  return d;
}
async function exportEditorDraft() {
  try {
    await captureEditor();
  } catch {}
  const operationsList = operations();
  download(
    "seaf-draft.json",
    serializeDraft({
      id: "local-" + crypto.randomUUID(),
      title: "Изменение: " + operationsList.map((op) => op.id).join(", "),
      project: state.project,
      baseHead: state.head,
      baseFingerprint: state.fingerprint,
      operations: operationsList,
    }),
  );
}
function reviewHtml() {
  const d = state.activeDraft;
  return `<section class="panel review"><p id="review-form-warning" class="hint warning" ${state.editorPending ? "" : "hidden"}>В форме есть более новые правки. Нажмите «Показать изменения»: прежняя проверка не разрешает сохранить новый ввод.</p><div class="panel-heading"><div><h2>Предварительный просмотр</h2><p>${esc(d.title || "Изменение модели")} · ${esc(d.id || "черновик")}</p></div><span class="badge ${state.validation?.ok ? "" : "neutral"}">${state.validation?.ok ? "Проверено SEAF" : "Черновик"}</span></div><div class="step-line"><span class="current">1 · Diff</span><span class="${state.validation ? "current" : ""}">2 · Проверка</span><span>3 · Сохранение и обновление SEAF</span></div>${state.lastPublication?.commit || state.lastPublication?.revision?.id ? `<div class="hint warning">Сохранена версия <code>${esc(state.lastPublication.commit || state.lastPublication.revision?.id)}</code>. Статус портала: ${esc(state.lastPublication.reload?.status || "не подтверждён")}<button class="secondary" data-act="reload-committed" data-network>Повторить обновление SEAF</button></div>` : ""}${d.localPersistenceFailed ? `<p class="hint warning">Серверный черновик доступен. Локальная копия не сохранена: экспортируйте JSON.</p>` : ""}${d.warnings?.length ? `<div class="hint warning">${d.warnings.map((w) => esc(typeof w === "string" ? w : pretty(w))).join("<br>")}</div>` : ""}${d.impacts?.some((item) => item.references?.length) ? `<details open><summary>Ссылки на удаляемые объекты — проверьте последствия</summary><pre>${esc(pretty(d.impacts))}</pre></details>` : ""}${diffHtml(d.semanticDiff || state.diff)}${d.operations?.length ? `<details><summary>Операции (${d.operations.length})</summary><pre>${esc(pretty(d.operations))}</pre></details>` : ""}${d.diff ? `<details><summary>Текстовый diff файлов</summary><pre>${esc(d.diff)}</pre></details>` : ""}<details><summary>Изменяемые файлы (${d.changes?.length || 0})</summary>${(d.changes || []).map((c) => `<details class="source"><summary>${esc(c.path)} ${c.content === null ? "· удаление" : ""}</summary><pre>${esc(c.content ?? "Файл будет удалён")}</pre></details>`).join("") || '<p class="subtle">Файлы будут подготовлены при синхронизации черновика.</p>'}</details>${state.validation ? `<div class="result ${state.validation.ok ? "" : "error"}"><b>${state.validation.ok ? "Проверка пройдена" : "Проверка не пройдена"}</b><div>Правил: ${esc(state.validation.rules ?? "—")}</div>${state.validation.problems?.length ? issueHtml() : ""}</div>` : ""}<div class="row"><button data-act="validate-active" data-network ${writable() && !state.editorPending ? "" : "disabled"}>Проверить в SEAF</button><button data-act="apply-active" data-network ${state.validation?.ok && !state.editorPending && writable() ? "" : "disabled"}>Сохранить и обновить SEAF</button><button class="secondary" data-act="preview-active" data-network>Открыть preview</button><button class="quiet" data-act="export-active">Экспорт черновика</button></div><p class="subtle">До применения рабочая модель не меняется. При изменении исходной версии потребуется заново подготовить и проверить черновик.</p></section>`;
}
function diffHtml(diff) {
  const changes = Array.isArray(diff) ? diff : diff?.changes || [];
  if (!changes.length)
    return (
      (diff
        ? '<p class="subtle">Семантических изменений нет.</p>'
        : '<p class="subtle">Семантический diff появится после подготовки изменения.</p>') +
      fileDiffHtml(diff)
    );
  return `<div class="table-wrap"><table><thead><tr><th>Объект</th><th>Изменение</th><th>Свойство</th><th>Было</th><th>Станет</th></tr></thead><tbody>${changes
    .flatMap((c) => {
      const props = c.properties?.length
        ? c.properties
        : [{ path: "объект", before: c.before, after: c.after }];
      return props.map(
        (p, i) =>
          `<tr><td>${i ? "" : `<code>${esc(c.id || c.key || "")}</code><div class="subtle">${esc(c.section || "")}</div>${c.sourcePaths?.length ? `<div class="small path">${c.sourcePaths.map(esc).join("<br>")}</div>` : ""}`}</td><td class="diff-${esc(c.kind)}">${i ? "" : esc({ added: "Создан", add: "Создан", removed: "Удалён", delete: "Удалён", modified: "Изменён", change: "Изменён" }[c.kind] || c.kind || "Изменён")}</td><td><code>${esc(p.path || p.property || "—")}</code></td><td class="diff-value">${esc(label(p.before))}</td><td class="diff-value">${esc(label(p.after))}</td></tr>`,
      );
    })
    .join("")}</tbody></table></div>${fileDiffHtml(diff)}`;
}
function fileDiffHtml(diff) {
  return typeof diff?.diff === "string" && diff.diff
    ? `<details class="raw-diff"><summary>Текстовый diff исходных файлов</summary><pre>${esc(diff.diff)}</pre></details>`
    : "";
}
function renderDrafts() {
  const map = new Map(
    [...(state.localDrafts || []), ...state.drafts].map((d) => [d.id, d]),
  );
  const rows = [...map.values()];
  return (
    title(
      "Черновики проекта",
      "Локальные черновики сохраняются в этом браузере. Серверные доступны после подключения и проходят проверку перед сохранением версии.",
    ) +
    `<section class="panel"><div class="row"><button data-act="refresh-drafts" data-network class="secondary">Обновить список</button><label class="file-label">Импорт JSON<input class="file-input" id="draft-file" type="file" accept=".json,application/json"></label><span class="grow"></span><span class="subtle">${rows.length} черновиков</span></div><div class="muted-line"></div>${rows.map((d) => `<article class="draft-card"><div class="content"><h3>${esc(d.title || d.id)}</h3><p class="subtle">${date(d.updatedAt || d.updated || d.createdAt || d.created)} · ${d.local ? "В браузере" : "На сервере"} · <code>${esc((d.baseHead || d.baseCommit || "").slice(0, 12))}</code></p><p class="small subtle">${d.operations?.length || 0} операций · ${d.changes?.length || 0} файлов</p></div><div class="row"><button class="secondary button-small" data-open-draft="${esc(d.id)}">Открыть</button><button class="quiet" data-export-draft="${esc(d.id)}">Экспорт</button></div></article>`).join("") || '<div class="empty">Черновиков пока нет.<br>Создайте изменение в редакторе объектов или импортируйте сохранённый JSON.</div>'}</section>${state.activeDraft ? reviewHtml() : ""}`
  );
}
function renderCompare() {
  return (
    title(
      "Семантическое сравнение",
      "Сравнение сущностей и их свойств. Откройте изолированный портал для ветки, Git-коммита или текущего черновика.",
    ) +
    `<section class="panel"><button class="secondary" data-act="versions-refresh" data-network>Обновить историю версий</button>${
      (state.revisions || []).length
        ? `<div class="hint">${state.revisions
            .slice(0, 12)
            .map(
              (r) =>
                `<div><code>${esc(r.id)}</code> · ${esc(r.message || r.name || "")} · ${date(r.created)}</div>`,
            )
            .join("")}</div>`
        : ""
    }<div class="toolbar"><div class="field"><label for="base-ref">Базовая версия</label><input id="base-ref" value="${esc(state.baseRef || "HEAD~1")}" placeholder="HEAD~1 или commit"></div><div class="field"><label for="target-ref">Целевая версия</label><input id="target-ref" value="${esc(state.targetRef || "HEAD")}" placeholder="HEAD, ветка или commit"></div><button data-act="compare-refs" data-network>Сравнить версии</button><button class="secondary" data-act="preview-ref" data-network>Preview целевой версии</button>${state.activeDraft ? '<button class="secondary" data-act="compare-draft" data-network>Сравнить черновик</button>' : ""}</div>${diffHtml(state.diff)}</section>${previewsHtml()}`
  );
}
function previewsHtml() {
  return (state.previews || []).length
    ? `<section class="panel"><h2>Открытые preview</h2><p class="subtle">Это отдельные экземпляры портала. Остановите ненужные preview, чтобы освободить ресурсы.</p>${state.previews.map((p) => `<div class="draft-card"><div><a href="${esc(safeUrl(p) || "#")}" target="_blank" rel="noopener">${esc(p.ref || p.draftId || p.snapshotId || p.url)}</a><p class="subtle small">До ${date(p.expires)}</p></div><button class="secondary button-small" data-stop-preview="${esc(p.id)}" data-network>Остановить</button></div>`).join("")}</section>`
    : "";
}
async function openPreview(args) {
  const result = await api("preview_create", args),
    url = safeUrl(result);
  if (!url) throw Error("Не получен URL preview");
  state.previews = [...(state.previews || []), result];
  render();
  showResult("Preview портала", result);
  window.open(url, "_blank", "noopener");
}
function renderSnapshots() {
  return (
    title(
      "Снимки архитектуры",
      "Фиксируйте модель, источники и сведения о сборке. Проверка контрольных сумм обнаруживает изменение содержимого снимка.",
    ) +
    `<section class="panel"><div class="toolbar"><div class="field"><label for="snapshot-title">Название снимка</label><input id="snapshot-title" placeholder="ShopFlow перед изменением доставки"></div><button data-act="snapshot-create" data-network>Создать снимок</button><button class="secondary" data-act="snapshots-refresh" data-network>Обновить</button></div><div class="table-wrap"><table><thead><tr><th>Снимок</th><th>Дата</th><th>Git</th><th>Действия</th></tr></thead><tbody>${state.snapshots.map((s) => `<tr><td><b>${esc(s.title || s.id)}</b><div class="subtle small">${esc(s.id)}</div></td><td>${date(s.createdAt || s.created)}</td><td><code>${esc((s.commit || s.head || "").slice(0, 12))}</code></td><td><div class="row"><button class="secondary button-small" data-preview-snapshot="${esc(s.id)}" data-network>Preview</button><button class="secondary button-small" data-verify-snapshot="${esc(s.id)}" data-network>Проверить</button><a class="button secondary button-small" href="/api/snapshot/${encodeURIComponent(s.id)}/archive.zip" download>Скачать ZIP</a></div></td></tr>`).join("") || '<tr><td colspan="4" class="empty">Снимков пока нет</td></tr>'}</tbody></table></div></section>`
  );
}
function renderGraph(trust) {
  const nodes = state.graph?.nodes || [],
    edges = state.graph?.edges || [];
  return (
    title(
      trust ? "Потоки данных и зоны доверия" : "Фокус на подграфе",
      trust
        ? "Назначайте зоны и классификацию данных компонентам. Межзонные связи выделяются на графе и доступны для анализа."
        : "Оставьте на схеме выбранный компонент и его окружение. Нажмите на узел, чтобы сделать его новым центром.",
    ) +
    `<section class="panel"><div class="toolbar"><div class="field"><label for="graph-focus">Компонент</label><input id="graph-focus" list="component-ids" value="${esc(state.graphFocus)}" placeholder="demo.shop.orders"><datalist id="component-ids">${Object.keys(
      state.model.components || {},
    )
      .map((id) => `<option value="${esc(id)}">`)
      .join(
        "",
      )}</datalist></div><div class="field"><label for="graph-depth">Глубина</label><select id="graph-depth">${[0, 1, 2, 3, 4, 5, 6].map((n) => `<option ${n === state.graphDepth ? "selected" : ""}>${n}</option>`).join("")}</select></div><div class="field"><label for="graph-direction">Направление</label><select id="graph-direction">${[
      ["both", "Все связи"],
      ["outgoing", "Исходящие"],
      ["incoming", "Входящие"],
    ]
      .map(
        ([v, t]) =>
          `<option value="${v}" ${v === state.graphDirection ? "selected" : ""}>${t}</option>`,
      )
      .join(
        "",
      )}</select></div><button data-act="load-graph" data-network>Построить</button></div><div class="legend"><span><i></i>Связь</span><span><i class="cross"></i>Между зонами доверия</span><span>${nodes.length} узлов · ${edges.length} связей</span></div><div id="graph-canvas" class="graph-wrap">${!state.graph ? '<div class="empty">Укажите компонент или оставьте поле пустым для полной модели и нажмите «Построить»</div>' : ""}</div>${state.graph?.truncated ? `<p class="hint warning">Сервис ограничил выборку: ${nodes.length} из ${state.graph.total} узлов. Уточните фокус и глубину.</p>` : ""}${nodes.length > 80 ? '<p class="hint warning">На рисунке первые 80 узлов. Уменьшите глубину, чтобы исследовать остальную модель.</p>' : ""}</section>${graphDetails()}${trust ? trustForm() : ""}`
  );
}
function trustForm() {
  const nodes = state.graph?.nodes || [],
    byId = new Map(nodes.map((n) => [n.id, n]));
  const crossing = (state.graph?.edges || []).filter((e) => {
    const a = byId.get(e.from),
      b = byId.get(e.to);
    return a?.trustZone && b?.trustZone && a.trustZone !== b.trustZone;
  });
  return `<section class="panel"><h2>Свойства зоны и данных</h2><div class="toolbar"><div class="field"><label for="trust-id">Компонент</label><input id="trust-id" list="component-ids" value="${esc(state.graphFocus)}"></div><div class="field"><label for="trust-zone">Зона доверия</label><input id="trust-zone" placeholder="Например, internal / partner"></div><div class="field"><label for="data-classification">Классификация данных</label><select id="data-classification"><option value="">Не указана</option><option value="public">Публичные</option><option value="internal">Внутренние</option><option value="confidential">Конфиденциальные</option><option value="restricted">Ограниченный доступ</option></select></div><button data-act="trust-propose" data-network ${writable() ? "" : "disabled"}>Подготовить изменение</button></div><p class="subtle">Межзонная связь требует рассмотрения контекста. Сам факт пересечения границы не означает уязвимость.</p><div class="table-wrap"><table><thead><tr><th>Источник</th><th>Зона</th><th>Получатель</th><th>Зона</th><th>Связь</th></tr></thead><tbody>${crossing.map((e) => `<tr><td><code>${esc(e.from)}</code></td><td>${esc(byId.get(e.from)?.trustZone)}</td><td><code>${esc(e.to)}</code></td><td>${esc(byId.get(e.to)?.trustZone)}</td><td>${esc(e.title || "")}</td></tr>`).join("") || '<tr><td colspan="5" class="empty">Явных межзонных связей в выбранном подграфе нет. Проверьте, что зоны заданы.</td></tr>'}</tbody></table></div></section>${state.activeDraft ? reviewHtml() : ""}`;
}
function drawGraph() {
  const root = $("#graph-canvas");
  if (!root) return;
  const NS = "http://www.w3.org/2000/svg",
    svg = document.createElementNS(NS, "svg");
  svg.setAttribute("viewBox", "0 0 1000 560");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Граф зависимостей архитектуры");
  const make = (tag, attrs, text) => {
    const el = document.createElementNS(NS, tag);
    Object.entries(attrs || {}).forEach(([k, v]) =>
      el.setAttribute(k, String(v)),
    );
    if (text !== undefined) el.textContent = text;
    return el;
  };
  const defs = make("defs"),
    marker = make("marker", {
      id: "arrow",
      viewBox: "0 0 10 10",
      refX: 9,
      refY: 5,
      markerWidth: 6,
      markerHeight: 6,
      orient: "auto-start-reverse",
    });
  marker.append(make("path", { d: "M 0 0 L 10 5 L 0 10 z", fill: "#809aa7" }));
  defs.append(marker);
  svg.append(defs);
  const nodes = (state.graph.nodes || []).slice(0, 80),
    edges = state.graph.edges || [],
    positions = new Map();
  const focus = nodes.find((n) => n.id === state.graphFocus);
  const others = nodes.filter((n) => n !== focus);
  if (focus) positions.set(focus.id, { x: 500, y: 280 });
  others.forEach((n, i) => {
    const ring = i < 12 ? 0 : i < 36 ? 1 : 2,
      angle =
        (i /
          (ring === 0 ? Math.min(others.length, 12) : ring === 1 ? 24 : 44)) *
          Math.PI *
          2 -
        Math.PI / 2;
    positions.set(n.id, {
      x: 500 + Math.cos(angle) * (ring === 0 ? 230 : 390),
      y: 280 + Math.sin(angle) * (ring === 0 ? 160 : 225),
    });
  });
  if (nodes.length === 1) positions.set(nodes[0].id, { x: 500, y: 280 });
  const byId = new Map(nodes.map((n) => [n.id, n]));
  for (const edge of edges) {
    const a = positions.get(edge.from),
      b = positions.get(edge.to);
    if (!a || !b) continue;
    const cross =
      byId.get(edge.from)?.trustZone &&
      byId.get(edge.to)?.trustZone &&
      byId.get(edge.from).trustZone !== byId.get(edge.to).trustZone;
    svg.append(
      make("line", {
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        class: "graph-edge" + (cross ? " cross" : ""),
        "marker-end": "url(#arrow)",
      }),
    );
    if (nodes.length <= 25 && edge.title)
      svg.append(
        make(
          "text",
          {
            x: (a.x + b.x) / 2,
            y: (a.y + b.y) / 2 - 7,
            "text-anchor": "middle",
            class: "graph-edge-label",
          },
          edge.title.length > 35 ? edge.title.slice(0, 32) + "…" : edge.title,
        ),
      );
  }
  for (const n of nodes) {
    const p = positions.get(n.id);
    const g = make("g", {
      class: "graph-node",
      tabindex: 0,
      role: "button",
      "aria-label": `Фокус на ${n.title || n.id}`,
      transform: `translate(${p.x - 81},${p.y - 29})`,
    });
    g.append(
      make("rect", {
        width: 162,
        height: 58,
        rx: 8,
        fill: n.id === state.graphFocus ? "#e0f1e9" : "#fff",
        stroke: n.id === state.graphFocus ? "#0d8367" : "#a8bdc6",
      }),
    );
    const name = n.title || n.id;
    g.append(
      make(
        "text",
        { x: 81, y: 22, "text-anchor": "middle", fill: "#254b58" },
        name.length > 23 ? name.slice(0, 21) + "…" : name,
      ),
    );
    g.append(
      make(
        "text",
        { x: 81, y: 40, "text-anchor": "middle", fill: "#6e838d" },
        n.trustZone || n.kind || n.id.split(".").at(-1),
      ),
    );
    g.append(
      make(
        "title",
        {},
        `${n.id}\n${name}\nЗона: ${n.trustZone || "не указана"}\nДанные: ${n.dataClassification || "не указаны"}`,
      ),
    );
    const focusNode = () => {
      state.graphFocus = n.id;
      const input = document.getElementById("graph-focus");
      if (input) input.value = n.id;
      run(() => loadGraph());
    };
    g.addEventListener("click", focusNode);
    g.addEventListener("keydown", (e) => {
      if (e.key === "Enter") focusNode();
    });
    svg.append(g);
  }
  root.replaceChildren(svg);
}
function sourcesHtml(sources = [], prefix = "source") {
  return (Array.isArray(sources) ? sources : [])
    .map(
      (s, i) =>
        `<details class="source" id="${esc(prefix)}-${i}"><summary>${esc(s.project || state.project)} / ${esc(s.file || s.path || "Источник")}${s.line ? ":" + esc(s.line) : ""}${s.commit ? " · " + esc(s.commit.slice(0, 12)) : ""}${s.fresh === true ? " · актуален" : s.fresh === false ? " · не подтверждён" : ""}</summary><pre>${esc(s.excerpt || s.text || s.description || "Фрагмент не передан источником")}</pre>${s.sha256 ? `<small class="subtle">SHA-256: ${esc(s.sha256)}</small>` : ""}</details>`,
    )
    .join("");
}
function claimsHtml(claims = []) {
  if (!claims?.length) return "";
  const indexFor = (source) =>
    (state.answer?.sources || []).findIndex(
      (s) =>
        (source.id && s.id === source.id) ||
        (s.project === source.project &&
          s.file === source.file &&
          s.line === source.line &&
          s.sha256 === source.sha256),
    );
  return `<h3>Утверждения и основания</h3><div class="table-wrap"><table><thead><tr><th>Утверждение</th><th>Объект</th><th>Источники</th></tr></thead><tbody>${claims
    .map((c) => {
      const sources = c.sources || (c.source ? [c.source] : []),
        indexes =
          c.sourceIndexes || sources.map(indexFor).filter((i) => i >= 0);
      return `<tr><td>${esc(c.text || c.description || "")}${c.verified === false ? '<div class="badge warning">Свежесть не подтверждена</div>' : ""}</td><td><code>${esc(c.entityId || "—")}</code></td><td>${indexes.map((i) => `<a href="#source-${Number(i)}">[${Number(i) + 1}]</a>`).join(" ") || sourcesHtml(sources, "claim-" + esc(c.entityId || "item")) || "Не привязаны"}</td></tr>`;
    })
    .join("")}</tbody></table></div>`;
}
function evidenceHtml() {
  if (!state.evidence) return "";
  const e = state.evidence;
  return `<div class="result ${e.ok ? "" : "error"}"><b>${e.ok ? "Все переданные источники актуальны" : "Часть источников изменилась или не подтверждена"}</b><p class="subtle">Проверено ${date(e.checkedAt)}. После изменения модели получите новый ответ.</p></div><details class="source"><summary>Подробности проверки источников</summary><pre>${esc(pretty(e))}</pre></details>`;
}
function graphDetails() {
  const g = state.graph;
  if (!g) return "";
  const findings = g.policyFindings || g.policies?.findings || [];
  const src = (x, prefix) =>
    sourcesHtml(x.sources || (x.source ? [x.source] : []), prefix);
  return `<section class="panel"><details><summary>Данные компонентов и связей</summary><h3>Компоненты</h3><div class="table-wrap"><table><thead><tr><th>Компонент</th><th>Зона доверия</th><th>Классификация</th><th>Источники</th></tr></thead><tbody>${(g.nodes || []).map((n, i) => `<tr><td><code>${esc(n.id)}</code><br>${esc(n.title)}${n.unresolved ? '<div class="badge warning">Объект не найден</div>' : ""}</td><td>${esc(n.trustZone || "Не указана")}</td><td>${esc(n.dataClassification || "Не указана")}</td><td>${src(n, "node-" + i) || "Не переданы"}</td></tr>`).join("")}</tbody></table></div><h3>Потоки данных</h3><div class="table-wrap"><table><thead><tr><th>Источник → получатель</th><th>Поток</th><th>Протокол</th><th>Данные</th><th>Шифрование / политика</th><th>Основание</th></tr></thead><tbody>${(g.edges || []).map((e, i) => `<tr><td><code>${esc(e.from)}</code> → <code>${esc(e.to)}</code></td><td>${esc(e.title || "Не указано")}</td><td>${esc(e.protocol || "Не указан")}</td><td>${esc(e.dataClassification || "Не указана")}</td><td>${e.encrypted === true ? "Шифрование заявлено" : e.encrypted === false ? "Без шифрования" : "Шифрование неизвестно"}<br>${esc({ unknown: "Неизвестно", violation: "Нарушение политики", allowed: "Разрешено явной политикой", review: "Требуется рассмотрение", internal: "Внутри зоны" }[e.policyStatus] || e.policyStatus || "Политика не проверена")}</td><td>${src(e, "edge-" + i) || "Не передано"}</td></tr>`).join("") || '<tr><td colspan="6">Связей нет</td></tr>'}</tbody></table></div></details>${findings.length ? `<h3>Проверки потоков и доверия</h3>${findings.map((f, i) => `<article class="finding"><b>${esc(f.title || f.rule || f.type || "Политика")}</b><p>${esc(f.message || f.description || (f.from || "") + " → " + (f.to || ""))}</p>${f.violations?.length ? `<ul>${f.violations.map((v) => `<li><code>${esc(v.policy)}</code>: ${esc(v.reason)}</li>`).join("")}</ul>` : ""}<span class="badge neutral">${esc(f.status || f.severity || "Требует проверки")}</span>${src(f, "policy-" + i)}</article>`).join("")}` : ""}<p class="subtle">Отсутствие классификации, протокола или сведений о шифровании означает неизвестное значение. Модель не подтверждает фактические настройки сети.</p></section>`;
}
function renderAssistant() {
  return (
    title(
      "Ассистент с источниками",
      "Задавайте вопросы об архитектуре и проверяйте основания ответа. Ссылки на исходные артефакты помогают отличать данные модели от предположений.",
    ) +
    `<section class="panel"><label for="question">Вопрос по проекту</label><textarea id="question" class="question" placeholder="Какие сервисы участвуют в оформлении заказа?">${esc(state.question || "")}</textarea><div class="row"><button data-act="ask" data-network>Получить ответ</button><button class="secondary" data-act="contradictions" data-network>Найти противоречия</button></div>${state.answer ? `<div class="muted-line"></div><h2>Ответ</h2><div class="answer">${esc(state.answer.answer || state.answer.text || "Ответ не сформирован")}</div>${state.answer.limitations ? `<div class="hint">${esc(Array.isArray(state.answer.limitations) ? state.answer.limitations.join("\n") : state.answer.limitations)}</div>` : ""}${claimsHtml(state.answer.claims)}<h3>Источники</h3>${sourcesHtml(state.answer.sources)}<button class="secondary button-small" data-act="verify-evidence" data-network>Проверить актуальность источников</button>${evidenceHtml()}` : ""}</section>${state.findings !== null ? `<section class="panel"><h2>Противоречия между источниками</h2><p class="subtle">Находки требуют проверки владельцем. Отсутствие находок не доказывает полноту и согласованность всех артефактов.</p>${state.findings.map((f) => `<article class="finding"><h3>${esc(f.title || f.type || "Возможное противоречие")}</h3><span class="badge">${esc(f.status === "confirmed" ? "Подтверждено источниками" : "Требует проверки")}</span><p>${esc(f.message || f.description || "")}</p>${f.uncertainty ? `<p class="hint">${esc(f.uncertainty)}</p>` : ""}${sourcesHtml(f.sources)}</article>`).join("") || '<div class="result">Противоречий по доступным проверкам не найдено.</div>'}</section>` : ""}`
  );
}
function renderDrawio() {
  return (
    title(
      "Схемы draw.io",
      "Откройте существующий файл, распознайте компоненты или экспортируйте модель. Сохранение схемы и импорт компонентов создают проверяемый черновик.",
    ) +
    `<section class="panel"><div class="toolbar"><div class="field"><label for="drawio-path">Файл в проекте</label><input id="drawio-path" list="drawio-project-files" value="${esc(state.drawioPath)}" placeholder="diagrams/architecture.drawio"><datalist id="drawio-project-files">${(state.drawioFiles || []).map((f) => `<option value="${esc(f)}">`).join("")}</datalist></div><button class="secondary" data-act="drawio-list" data-network>Список схем</button><button class="secondary" data-act="drawio-open" data-network>Открыть из проекта</button><label class="file-label">Файл с компьютера<input class="file-input" id="drawio-file" type="file" accept=".drawio,.xml,application/xml,text/xml"></label></div><div class="toolbar"><div class="field"><label for="drawio-page">Страница</label><select id="drawio-page"><option value="">Первая страница</option>${drawioPages()
      .map(
        (p) => `<option value="${esc(p.id)}">${esc(p.name || p.id)}</option>`,
      )
      .join(
        "",
      )}</select></div><div class="field"><label for="drawio-mode">Импорт компонентов</label><select id="drawio-mode"><option value="merge">Объединить с моделью</option><option value="replace">Заменить свойства найденных объектов</option></select></div><button data-act="drawio-import" data-network ${writable() ? "" : "disabled"}>Распознать компоненты</button><button class="secondary" data-act="drawio-export" data-network>Экспорт модели</button><button class="secondary" data-act="drawio-download" ${state.drawioXML ? "" : "disabled"}>Скачать .drawio</button></div><p class="hint">Редактор работает на локальном сервере draw.io. Схема не передаётся внешнему сайту. Если редактор недоступен, проверьте его в разделе «Диагностика».</p><div class="row"><button data-act="drawio-editor" class="secondary">Открыть редактор</button><button data-act="drawio-save" data-network ${writable() && state.drawioXML && !state.drawioEditorOpen ? "" : "disabled"}>Подготовить сохранение файла</button><span class="subtle">${state.drawioXML ? Math.round(state.drawioXML.length / 1024) + " КБ XML" : "Схема не загружена"}</span></div>${state.drawioEditorOpen ? `<p class="hint">Изменения на холсте сохраняйте командой File → Save в редакторе. Кнопка подготовки файла работает с загруженным XML и недоступна, пока редактор открыт.</p>` : ""}<div id="drawio-container">${state.drawioEditorOpen ? `<iframe id="drawio-editor" class="drawio-frame" title="Редактор draw.io" referrerpolicy="no-referrer" src="${esc(state.editorUrl)}"></iframe>` : ""}</div><details><summary>XML схемы</summary><textarea id="drawio-xml" spellcheck="false" rows="10">${esc(state.drawioXML)}</textarea><button class="secondary button-small" data-act="drawio-xml-update">Загрузить XML в редактор</button></details></section>${state.activeDraft ? reviewHtml() : ""}`
  );
}
function drawioPages() {
  if (!state.drawioXML || /<!DOCTYPE|<!ENTITY/i.test(state.drawioXML))
    return [];
  try {
    const doc = new DOMParser().parseFromString(
      state.drawioXML,
      "application/xml",
    );
    if (doc.querySelector("parsererror")) return [];
    return [...doc.querySelectorAll("diagram")].map((d) => ({
      id: d.getAttribute("id") || "",
      name: d.getAttribute("name") || "",
    }));
  } catch {
    return [];
  }
}
function renderDiagnostics() {
  const d = state.diagnostics;
  const project = d?.project || projectInfo();
  const metadata = `<dl class="project-metadata"><dt>Проект</dt><dd>${esc(project.title || project.id)} · <code>${esc(project.id)}</code></dd><dt>Доступ</dt><dd>${project.writable ? "Чтение и запись через проверяемый черновик" : "Только чтение"}</dd><dt>Манифест</dt><dd><code>${esc(project.manifest || "Не настроен")}</code></dd><dt>Портал</dt><dd>${esc(project.portal || "Не настроен")}</dd><dt>Runtime validation</dt><dd>${esc((project.validation?.runtime === "native" ? "Node.js в комплекте" : project.validation?.image) || "Не настроен")} · <code>${esc(project.validation?.manifest || "—")}</code></dd></dl>`;
  return (
    title(
      "Мастер подключения и диагностики",
      "Проверка сервиса, проекта, истории, SEAF и редактора. Для каждого сбоя показаны основание и следующий шаг.",
    ) +
    `<section class="panel"><div class="panel-heading"><h2>Состояние подключения</h2><span class="badge ${state.online ? "" : "warning"}">${state.online ? "Сервис доступен" : "Автономно"}</span></div>${metadata}<div class="row"><button data-act="diagnose" data-network>Проверить всё</button><button data-act="reconnect" class="secondary">Подключиться заново</button></div><ol class="subtle"><li>Запустите SEAF ярлыком или launcher.ps1.</li><li>Откройте «Проекты» и выберите локальную папку или Git-источник.</li><li>Проверьте манифест и настроенную среду проверки модели.</li><li>Для draw.io запустите локальный редактор и повторите проверку.</li></ol>${d ? `<div class="table-wrap"><table><thead><tr><th>Проверка</th><th>Статус</th><th>Результат</th><th>Что сделать</th></tr></thead><tbody>${(d.checks || []).map((c) => `<tr><td>${esc(c.name)}</td><td><span class="diagnostic-status ${esc(c.status)}">${esc({ ok: "Готово", error: "Ошибка", warning: "Внимание", pass: "Готово", fail: "Ошибка" }[c.status] || c.status)}</span></td><td>${esc(c.detail || "")}</td><td>${esc(c.fix || "—")}</td></tr>`).join("")}</tbody></table></div><div class="result ${d.ready ? "" : "error"}">${d.ready ? "Среда готова к работе" : "Устраните отмеченные проблемы перед применением изменений"}</div>` : ""}</section>`
  );
}
function resetReview() {
  state.validation = null;
  state.proposalId = null;
  state.diff = null;
  state.lastPublication = null;
}
async function acceptDraft(d) {
  state.activeDraft = d;
  state.editorPending = false;
  state.publicationStatus = null;
  resetReview();
  if (d.semanticDiff) state.diff = d.semanticDiff;
  try {
    await saveLocalDraft({ ...d, local: !d.id || d.id.startsWith("local-") });
  } catch {
    state.activeDraft = { ...state.activeDraft, localPersistenceFailed: true };
  }
  render();
}
async function serverDraft(d) {
  if (!d) throw Error("Сначала откройте черновик");
  if (!writable()) throw Error("Проект подключён только для чтения");
  if (d.local || d.id?.startsWith("local-")) {
    const current = await api("model");
    if (
      (d.baseHead && current.head && d.baseHead !== current.head) ||
      (d.baseFingerprint &&
        current.fingerprint &&
        d.baseFingerprint !== current.fingerprint)
    )
      throw Error(
        "Исходная модель изменилась. Сравните черновик с новой моделью и подготовьте изменение заново.",
      );
    if (d.operations?.length)
      return api("object_propose", { operations: d.operations, draft: true });
    return api("draft_save", {
      draft: { ...d, id: undefined, local: undefined },
    });
  }
  return d;
}
function isDirectory() {
  return projectInfo().source?.kind === "directory";
}
async function refreshProjects(select) {
  await captureEditor();
  state.projects = await api("projects_list");
  await cacheSet("projects", state.projects);
  const next = state.projects.some((p) => p.id === (select || state.project))
    ? select || state.project
    : state.projects[0]?.id || "";
  if (!next) {
    state.project = "";
    state.model = {};
    state.provenance = {};
    state.head = "";
    state.projectContext = null;
    state.preferences = normalizePreferences();
    state.catalog = defaultCatalog();
    state.editorPending = false;
    state.undo = null;
    resetReview();
    renderProject();
    render();
    return;
  }
  if (next !== state.project) {
    await changeProject(next);
    return;
  }
  await cacheSet("current-project", next);
  await api("project_select");
  await loadModel();
  renderProject();
  render();
}
async function projectAction(name, id) {
  if (name === "disconnect") {
    if (!confirm("Отключить проект? Файлы останутся в своей папке.")) return;
    await api("project_disconnect", { project: id });
    await refreshProjects();
    return;
  }
  if (name === "delete") {
    const typed = prompt(
      "Для удаления файлов проекта в локальную корзину введите его ID: " + id,
    );
    if (typed !== id) return;
    const result = await api("project_delete", {
      project: id,
      deleteFiles: true,
    });
    await refreshProjects();
    showResult("Проект перемещён в корзину", result);
    return;
  }
  if (name === "export") {
    const data = await api("project_export", { project: id });
    const bytes = Uint8Array.from(atob(data.base64), (c) => c.charCodeAt(0));
    download(data.filename, bytes, "application/zip");
    notify("ZIP архитектурных файлов сохранён");
    return;
  }
  if (name === "version") {
    const version = prompt("Название новой версии");
    if (!version) return;
    showResult(
      "Новая версия",
      await api("project_version", { project: id, name: version }),
    );
    return;
  }
  if (name === "clone-local") {
    const destination = prompt("Полный путь новой папки для копии проекта");
    if (!destination) return;
    const data = await api("project_clone_local", {
      id,
      project: id,
      destination,
      kind: "directory",
    });
    await refreshProjects(data.id);
    notify("Копия проекта подключена с локальной историей");
    return;
  }
  await refreshProjects(id);
  if (name === "activate") {
    const result = await api("project_activate");
    await refreshProjects(id);
    showResult("Портал проекта", result);
    window.open(result.url, "_blank", "noopener");
  }
}
async function proposeFlow(remove) {
  const from = remove?.from || $("#flow-from")?.value,
    to = $("#flow-to")?.value;
  const component = state.model.components?.[from];
  if (!component) throw Error("Выберите компонент-источник");
  const links = structuredClone(component.links || []),
    operations = [];
  if (remove) links.splice(remove.index, 1);
  else {
    if (!state.model.components?.[to]) throw Error("Выберите получателя");
    const index = state.flowIndex,
      previous = state.flowOriginalFrom || from;
    const original =
      index !== undefined ? state.model.components[previous]?.links[index] : {};
    const link = {
      ...original,
      id: to,
      title: $("#flow-title").value.trim(),
      protocol: $("#flow-protocol").value.trim(),
    };
    if (!link.title) throw Error("Укажите название потока");
    if (index !== undefined && previous === from) links[index] = link;
    else {
      links.push(link);
      if (index !== undefined) {
        const previousLinks = structuredClone(
          state.model.components[previous].links,
        );
        previousLinks.splice(index, 1);
        operations.push({
          section: "components",
          id: previous,
          mode: "merge",
          value: { links: previousLinks },
        });
      }
    }
  }
  operations.push({
    section: "components",
    id: from,
    mode: "merge",
    value: { links },
  });
  const d = await api("object_propose", {
    operations,
    draft: true,
    title: remove ? "Удаление потока" : "Изменение потока",
  });
  state.flowIndex = undefined;
  state.flowOriginalFrom = undefined;
  await acceptDraft(d);
  notify("Diff потока подготовлен; проверьте и сохраните изменение");
}
async function loadGraph() {
  state.graphFocus = $("#graph-focus")?.value.trim() ?? state.graphFocus;
  state.graphDepth = Number($("#graph-depth")?.value ?? state.graphDepth);
  state.graphDirection = $("#graph-direction")?.value || state.graphDirection;
  state.graph = await api("graph", {
    focus: state.graphFocus,
    depth: state.graphDepth,
    direction: state.graphDirection,
  });
  render();
}
async function listDrafts() {
  const data = await api("drafts_list");
  state.drafts = Array.isArray(data) ? data : data.drafts || [];
  await loadLocalDrafts();
}
function getDraft(id) {
  return (
    state.drafts.find((d) => d.id === id) ||
    (state.localDrafts || []).find((d) => d.id === id)
  );
}
async function run(fn) {
  state.uiTasks = (state.uiTasks || 0) + 1;
  document.documentElement.dataset.pendingUiTasks = String(state.uiTasks);
  $("#main")?.setAttribute("aria-busy", "true");
  try {
    await fn();
  } catch (error) {
    notify(error.message || String(error), true);
  } finally {
    state.uiTasks = Math.max(0, state.uiTasks - 1);
    document.documentElement.dataset.pendingUiTasks = String(state.uiTasks);
    $("#main")?.setAttribute(
      "aria-busy",
      String(state.uiTasks > 0 || state.busy > 0),
    );
  }
}
async function action(name, element) {
  return [
    "new-object",
    "new-system",
    "reset-object",
    "add-property",
    "clear-selection",
    "select-visible",
    "editor-fields-refresh",
  ].includes(name)
    ? transition(() => performAction(name, element))
    : performAction(name, element);
}
async function performAction(name, element) {
  if (name.startsWith("ux-")) return uxAction(name, element);
  switch (name) {
    case "project-pick": {
      const chosen = await api("project_pick_directory");
      if (!chosen.cancelled) {
        state.connectionForm.root = chosen.path || chosen.root;
        state.inspectedProject = null;
        render();
      }
      break;
    }
    case "project-inspect": {
      const f = state.connectionForm;
      state.inspectedProject = await api("project_inspect", f);
      if (!f.manifest) f.manifest = state.inspectedProject.manifest || "";
      if (!f.title) f.title = state.inspectedProject.title || "";
      render();
      break;
    }
    case "project-connect": {
      const p = await api("project_connect", state.connectionForm);
      await refreshProjects(p.id);
      state.inspectedProject = null;
      notify("Проект подключён");
      break;
    }
    case "project-clone": {
      const p = await api("project_clone", state.connectionForm);
      await refreshProjects(p.id);
      notify("Git-репозиторий клонирован и подключён; push не выполнялся");
      break;
    }
    case "editor-fields-refresh":
      state.editorSchema = await api("editor_schema", {
        section: state.section,
      });
      render();
      break;
    case "flow-propose":
      await proposeFlow();
      break;
    case "versions-refresh":
      state.revisions = await api("revisions_list");
      if (isDirectory()) {
        state.baseRef =
          state.revisions[1]?.id || state.revisions[0]?.id || "HEAD";
        state.targetRef = "HEAD";
      }
      render();
      break;
    case "export-editor":
      await exportEditorDraft();
      break;
    case "new-system":
      await captureEditor();
      state.section = "components";
      state.editorSchema = null;
    case "new-object":
      if (name === "new-object") await captureEditor();
      state.selected.clear();
      state.editId = "";
      state.editorMode = "create";
      state.editorValue = pretty({
        title: "Новый компонент",
        entity: name === "new-system" ? "system" : "component",
        owner: "",
        description: "",
      });
      state.repairDraft = null;
      startEditHistory();
      state.editorPending = true;
      storeRoute();
      if (state.online)
        state.editorSchema = await api("editor_schema", {
          section: state.section,
        });
      render();
      break;
    case "reset-object":
      await captureEditor();
      state.editorValue = pretty(
        state.model[state.section]?.[state.editId] || {},
      );
      state.editorMode = state.editId ? "merge" : "create";
      state.undo = recordEdit(state.undo, makeEditSnapshot(state));
      state.editorPending = true;
      await captureEditor({ fromState: true, record: false });
      render();
      break;
    case "select-visible":
      await captureEditor();
      catalogRows(
        state.model,
        state.section,
        state.filter,
        state.catalog,
      ).rows.forEach(({ id }) => state.selected.add(id));
      selectionEditor();
      startEditHistory();
      render();
      break;
    case "clear-selection":
      await captureEditor();
      state.selected.clear();
      selectionEditor();
      startEditHistory();
      render();
      break;
    case "add-property": {
      const key = $("#property-name").value.trim();
      if (!key || ["__proto__", "constructor", "prototype"].includes(key))
        throw Error("Укажите допустимое свойство");
      const data = JSON.parse($("#object-json").value);
      if (!data || typeof data !== "object" || Array.isArray(data))
        throw Error("Свойства должны быть JSON-объектом");
      data[key] = JSON.parse($("#property-value").value);
      state.editorValue = pretty(data);
      $("#object-json").value = state.editorValue;
      await captureEditor();
      render();
      break;
    }
    case "save-local":
      await localEditorDraft();
      break;
    case "object-propose": {
      await captureEditor();
      let ops = operations();
      const invalid = ops
        .filter((op) => op.mode !== "delete")
        .flatMap((op) =>
          schemaIssues(
            op.mode === "merge"
              ? { ...state.model[op.section]?.[op.id], ...op.value }
              : op.value,
            state.editorSchema?.fields || [],
          ),
        );
      if (invalid.length) {
        render();
        const first = invalid[0];
        const field = [
          ...document.querySelectorAll("[data-editor-field]"),
        ].find((e) => e.dataset.editorField === first.field);
        field?.focus();
        throw Error(first.description);
      }
      if (state.repairDraft?.operations?.length) {
        const keys = new Set(ops.map((op) => op.section + "/" + op.id));
        ops = [
          ...state.repairDraft.operations.filter(
            (op) => !keys.has(op.section + "/" + op.id),
          ),
          ...ops,
        ];
      }
      if (!state.online) {
        await localEditorDraft();
        notify(
          "Изменение сохранено локально. Подключитесь для подготовки diff.",
        );
        break;
      }
      const d = await api("object_propose", { operations: ops, draft: true });
      state.editorPending = false;
      state.repairDraft = null;
      await acceptDraft(d);
      notify("Черновик подготовлен. Проверьте diff ниже.");
      break;
    }
    case "refresh-drafts":
      await listDrafts();
      render();
      break;
    case "validate-active": {
      if (state.editorPending || composerDraftChanged(state))
        throw Error(
          "В форме есть новые правки. Сначала нажмите «Показать изменения», чтобы проверить актуальный diff.",
        );
      resetReview();
      render();
      let d = await serverDraft(state.activeDraft);
      state.activeDraft = d;
      const proposal = await api("draft_propose", { id: d.id });
      state.proposalId =
        proposal.proposalId ||
        proposal.proposal_id ||
        proposal.proposal?.proposalId;
      state.activeDraft = { ...d, diff: proposal.diff || d.diff };
      if (!state.proposalId)
        throw Error("Сервис не вернул идентификатор предложения");
      state.validation = await api("validate", {
        proposalId: state.proposalId,
      });
      render();
      notify(
        state.validation.ok
          ? "Все проверки SEAF пройдены"
          : "Найдены ошибки модели",
        !state.validation.ok,
      );
      break;
    }
    case "apply-active": {
      if (
        !writable() ||
        state.editorPending ||
        composerDraftChanged(state) ||
        !state.proposalId ||
        !state.validation?.ok
      )
        throw Error(
          "Сначала проверьте предложение в доступном для записи проекте",
        );
      const result = await api("apply", { proposalId: state.proposalId });
      composerApplied(state, state.activeDraft, result);
      state.lastPublication = { ...result, proposalId: state.proposalId };
      state.publicationStatus = state.lastPublication;
      if (
        ["applied", "committed_reload_failed", "saved_reload_failed"].includes(
          result.status,
        ) &&
        (result.commit || result.revision?.id)
      ) {
        state.validation = null;
        state.proposalId = null;
      }
      render();
      showResult("Сохранение и обновление SEAF", result);
      const updated =
        result.reload?.status === "updated" && !result.reload?.problems?.length;
      if (!updated) {
        notify(
          result.commit || result.revision?.id
            ? "Версия сохранена. Состояние обновления портала смотрите в результате."
            : "Применение не подтверждено. Смотрите результат.",
          true,
        );
        break;
      }
      await loadModel();
      state.activeDraft = null;
      resetReview();
      await listDrafts();
      render();
      notify("Изменение сохранено. Модель SEAF обновлена.");
      break;
    }
    case "reload-committed": {
      if (
        !writable() ||
        !(state.lastPublication?.commit || state.lastPublication?.revision?.id)
      )
        throw Error("Нет сохранённой версии для повторного обновления.");
      const result = await api("reload_project", {
        proposalId: state.lastPublication.proposalId,
      });
      state.lastPublication = {
        ...result,
        proposalId: state.lastPublication.proposalId,
      };
      state.publicationStatus = state.lastPublication;
      showResult("Повторное обновление SEAF", result);
      if (
        result.reload?.status !== "updated" ||
        result.reload?.problems?.length
      ) {
        render();
        notify("Версия сохранена. Обновление SEAF пока не подтверждено.", true);
        break;
      }
      await loadModel();
      state.activeDraft = null;
      resetReview();
      await listDrafts();
      render();
      notify("SEAF обновлён. Повторное сохранение версии не выполнялось.");
      break;
    }
    case "preview-active": {
      const d = await serverDraft(state.activeDraft);
      await openPreview({ draftId: d.id });
      break;
    }
    case "preview-ref":
      state.targetRef = $("#target-ref").value.trim();
      if (!state.targetRef)
        throw Error("Укажите ветку, Git-коммит или локальную ревизию");
      await openPreview({ ref: state.targetRef });
      break;
    case "verify-evidence":
      state.evidence = await api("verify_evidence", {
        sources: state.answer?.sources || [],
      });
      render();
      break;
    case "export-active":
      download("seaf-draft.json", serializeDraft(state.activeDraft));
      break;
    case "compare-refs":
      state.baseRef = $("#base-ref").value.trim();
      state.targetRef = $("#target-ref").value.trim();
      state.diff = await api("semantic_diff", {
        baseRef: state.baseRef,
        targetRef: state.targetRef,
      });
      render();
      break;
    case "compare-draft": {
      const d = await serverDraft(state.activeDraft);
      state.diff = await api("semantic_diff", { draftId: d.id });
      render();
      break;
    }
    case "snapshots-refresh": {
      const data = await api("snapshots_list");
      state.snapshots = Array.isArray(data) ? data : data.snapshots || [];
      render();
      break;
    }
    case "snapshot-create": {
      const result = await api("snapshot_create", {
        title: $("#snapshot-title").value.trim() || "Снимок архитектуры",
      });
      showResult("Снимок создан", result);
      await action("snapshots-refresh");
      break;
    }
    case "load-graph":
      await loadGraph();
      break;
    case "trust-propose":
      await acceptDraft(
        await api("trust_propose", {
          id: $("#trust-id").value.trim(),
          trustZone: $("#trust-zone").value.trim(),
          dataClassification: $("#data-classification").value,
        }),
      );
      notify("Свойства доверия добавлены в черновик.");
      break;
    case "ask":
      state.evidence = null;
      state.question = $("#question").value.trim();
      if (!state.question) throw Error("Введите вопрос");
      state.answer = await api("answer", { question: state.question });
      render();
      break;
    case "contradictions": {
      const data = await api("contradictions");
      state.findings = Array.isArray(data) ? data : data.findings || [];
      render();
      break;
    }
    case "drawio-list": {
      const data = await api("drawio_files");
      state.drawioFiles = data.files || [];
      render();
      notify(
        state.drawioFiles.length
          ? "Выберите схему из списка в поле пути."
          : "В проекте пока нет файлов .drawio и .xml.",
      );
      break;
    }
    case "drawio-open":
      state.drawioPath = $("#drawio-path").value.trim();
      {
        const data = await api("drawio_open", { path: state.drawioPath });
        state.drawioXML = typeof data === "string" ? data : data.xml;
        state.drawioEditorOpen = false;
        render();
      }
      break;
    case "drawio-export": {
      const data = await api("drawio_export", {
        xml: state.drawioXML || undefined,
        pageId: $("#drawio-page")?.value || undefined,
      });
      state.drawioXML = data.xml;
      state.drawioEditorOpen = false;
      render();
      download("architecture.drawio", state.drawioXML, "application/xml");
      break;
    }
    case "drawio-import":
      if (!state.drawioXML) throw Error("Сначала откройте схему");
      await acceptDraft(
        await api("drawio_import", {
          xml: state.drawioXML,
          pageId: $("#drawio-page").value || undefined,
          mode: $("#drawio-mode").value,
        }),
      );
      notify("Распознанные компоненты подготовлены к проверке.");
      break;
    case "drawio-download":
      if (!state.drawioXML) throw Error("Схема не загружена");
      download(
        state.drawioPath.split("/").at(-1) || "architecture.drawio",
        state.drawioXML,
        "application/xml",
      );
      break;
    case "drawio-editor": {
      if (!state.editorUrl)
        throw Error(
          "URL локального редактора не настроен. Откройте диагностику.",
        );
      const url = new URL(state.editorUrl);
      if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
        throw Error(
          "Автоматическая передача схемы внешнему редактору отключена",
        );
      state.drawioPath = $("#drawio-path").value.trim();
      if (!["http:", "https:"].includes(url.protocol))
        throw Error("Некорректный протокол редактора");
      state.editorReady = false;
      state.drawioEditorOpen = true;
      render();
      setTimeout(() => {
        if (state.drawioEditorOpen && !state.editorReady)
          notify(
            "Локальный редактор не подтвердил готовность. Запустите draw.io и проверьте диагностику.",
            true,
          );
      }, 15000);
      notify(
        "Редактор загружается с локального сервера. Если окно пустое, проверьте диагностику.",
      );
      break;
    }
    case "drawio-xml-update": {
      const xml = $("#drawio-xml").value;
      if (/<!DOCTYPE|<!ENTITY/i.test(xml))
        throw Error("DTD и ENTITY запрещены");
      const parsed = new DOMParser().parseFromString(xml, "application/xml");
      if (parsed.querySelector("parsererror")) throw Error("Некорректный XML");
      state.drawioXML = xml;
      if (editorFrame && state.drawioEditorOpen)
        sendDrawio({ action: "load", xml, autosave: 0 });
      else render();
      notify("XML загружен");
      break;
    }
    case "drawio-save":
      state.drawioPath = $("#drawio-path").value.trim();
      if (!state.drawioXML) throw Error("Схема не загружена");
      await acceptDraft(
        await api("drawio_save", {
          path: state.drawioPath,
          xml: state.drawioXML,
        }),
      );
      notify("Файл схемы включён в черновик. Проверьте и примените его.");
      break;
    case "diagnose":
      state.diagnostics = await api("diagnostics");
      render();
      break;
    case "reconnect":
      await connect();
      break;
  }
}
function sendDrawio(message) {
  if (!editorFrame?.contentWindow || !state.editorUrl) return;
  editorFrame.contentWindow.postMessage(
    JSON.stringify(message),
    new URL(state.editorUrl).origin,
  );
}
$("#main").addEventListener("click", (event) => {
  const projectButton = event.target.closest("[data-project-action]");
  if (projectButton) {
    run(() =>
      projectAction(
        projectButton.dataset.projectAction,
        projectButton.dataset.projectId,
      ),
    );
    return;
  }
  const linkButton = event.target.closest(
    "[data-link-edit],[data-link-remove]",
  );
  if (linkButton) {
    const from = linkButton.dataset.linkEdit || linkButton.dataset.linkRemove,
      index = Number(linkButton.dataset.linkIndex);
    if (linkButton.dataset.linkRemove) {
      run(() => proposeFlow({ from, index }));
      return;
    }
    const link = state.model.components[from].links[index];
    Object.assign(state, {
      flowOriginalFrom: from,
      flowFrom: from,
      flowTo: link.id,
      flowIndex: index,
      flowTitle: link.title,
      flowProtocol: link.protocol,
    });
    render();
    return;
  }
  const preview = event.target.closest("[data-preview-snapshot]");
  if (preview)
    run(() => openPreview({ snapshotId: preview.dataset.previewSnapshot }));
  const stop = event.target.closest("[data-stop-preview]");
  if (stop)
    run(async () => {
      await api("preview_stop", { id: stop.dataset.stopPreview });
      state.previews = (state.previews || []).filter(
        (p) => p.id !== stop.dataset.stopPreview,
      );
      render();
      notify("Preview остановлен.");
    });
});
window.addEventListener("message", (event) => {
  if (
    !state.editorUrl ||
    !editorFrame ||
    event.source !== editorFrame.contentWindow ||
    event.origin !== new URL(state.editorUrl).origin
  )
    return;
  let message;
  try {
    message =
      typeof event.data === "string" ? JSON.parse(event.data) : event.data;
  } catch {
    return;
  }
  if (!message || typeof message !== "object") return;
  if (message.event === "init") {
    state.editorReady = true;
    sendDrawio({
      action: "load",
      xml:
        state.drawioXML ||
        '<mxfile><diagram id="page-1" name="Страница 1"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>',
      autosave: 0,
      saveAndExit: 0,
    });
  }
  if (message.event === "save" && typeof message.xml === "string") {
    state.drawioXML = message.xml;
    run(async () => {
      if (!writable())
        throw Error(
          "Проект только для чтения: скачайте схему вместо сохранения",
        );
      await acceptDraft(
        await api("drawio_save", { path: state.drawioPath, xml: message.xml }),
      );
      notify(
        "Изменённая схема сохранена в черновик. Для Git выполните проверку и применение.",
      );
    });
  }
  if (message.event === "exit") {
    state.drawioEditorOpen = false;
    render();
  }
});
$("#navigation").addEventListener("click", (event) => {
  const personal = event.target.closest('[data-act^="ux-"]');
  if (personal) {
    run(() => uxAction(personal.dataset.act, personal));
    return;
  }
  const button = event.target.closest("[data-view]");
  if (!button) return;
  run(() => navigate(button.dataset.view));
});
$("#main").addEventListener("click", (event) => {
  const uxButton = event.target.closest('[data-act^="ux-"]');
  if (uxButton) {
    run(() => uxAction(uxButton.dataset.act, uxButton));
    return;
  }
  const selection = event.target.closest("[data-select]");
  if (selection) {
    event.stopPropagation();
    run(() =>
      transition(async () => {
        await captureEditor();
        selection.checked
          ? state.selected.add(selection.dataset.select)
          : state.selected.delete(selection.dataset.select);
        selectionEditor();
        startEditHistory();
        render();
      }),
    );
    return;
  }
  const row = event.target.closest("[data-object]");
  if (row) {
    run(() => openObject(state.section, row.dataset.object, { edit: true }));
    return;
  }
  const button = event.target.closest("[data-act]");
  if (button) {
    run(() => action(button.dataset.act, button));
    return;
  }
  const open = event.target.closest("[data-open-draft]");
  if (open) {
    run(async () => {
      state.activeDraft = getDraft(open.dataset.openDraft);
      state.editorPending = false;
      state.publicationStatus = null;
      resetReview();
      if (state.activeDraft?.semanticDiff)
        state.diff = state.activeDraft.semanticDiff;
      render();
    });
    return;
  }
  const exportButton = event.target.closest("[data-export-draft]");
  if (exportButton) {
    download(
      "seaf-draft.json",
      serializeDraft(getDraft(exportButton.dataset.exportDraft)),
    );
    return;
  }
  const verify = event.target.closest("[data-verify-snapshot]");
  if (verify)
    run(async () =>
      showResult(
        "Проверка снимка",
        await api("snapshot_verify", { id: verify.dataset.verifySnapshot }),
      ),
    );
});
function scheduleEditorSave() {
  captureEditor().catch((error) => notify(error.message, true));
  clearTimeout(autoSaveTimer);
  const project = state.project;
  autoSaveTimer = setTimeout(
    () =>
      run(async () => {
        if (
          state.view !== "objects" ||
          state.project !== project ||
          !writable()
        )
          return;
        try {
          await localEditorDraft(true);
          const el = $("#autosave-status");
          if (el)
            el.textContent =
              "Форма и локальный черновик сохранены в браузере · " +
              new Date().toLocaleTimeString("ru-RU");
        } catch (error) {
          const el = $("#autosave-status");
          if (el)
            el.textContent =
              error instanceof SyntaxError
                ? "Текст сохранён в браузере. JSON ещё не завершён; подготовка diff станет доступна после исправления."
                : state.formPersistenceFailed
                  ? error.message
                  : "Текст формы сохранён. " + error.message;
        }
      }),
    800,
  );
}
function updateFieldErrors() {
  let value;
  try {
    value = JSON.parse(state.editorValue);
  } catch {
    return;
  }
  const issues = schemaIssues(value, state.editorSchema?.fields || []);
  for (const el of document.querySelectorAll("[data-editor-field]")) {
    const issue = issues.find((i) => i.field === el.dataset.editorField),
      message = el.closest(".field")?.querySelector(".field-error");
    if (issue) el.setAttribute("aria-invalid", "true");
    else el.removeAttribute("aria-invalid");
    if (message) {
      message.hidden = !issue;
      message.textContent = issue?.description || "";
    }
  }
}
$("#main").addEventListener("input", (event) => {
  const el = event.target;
  if (el.dataset.connect) {
    state.connectionForm[el.dataset.connect] =
      el.type === "checkbox" ? el.checked : el.value;
    if (
      !["url", "destination", "title", "writable"].includes(el.dataset.connect)
    )
      state.inspectedProject = null;
  }
  if (el.dataset.wizard) {
    state.wizard ||= newWizard();
    state.wizard[el.dataset.wizard] = el.value;
    localSet("wizard:" + state.project, state.wizard).catch((error) =>
      notify(error.message, true),
    );
  }
  if (el.dataset.editorField) {
    try {
      const value = JSON.parse(state.editorValue),
        key = el.dataset.editorField;
      let next = el.value;
      if (el.tagName === "SELECT")
        next = el.multiple
          ? [...el.selectedOptions]
              .filter((o) => o.value)
              .map((o) => JSON.parse(o.value))
          : el.value
            ? JSON.parse(el.value)
            : undefined;
      else if (["number", "integer"].includes(el.dataset.fieldType))
        next = el.value === "" ? undefined : Number(el.value);
      if (next === undefined) delete value[key];
      else value[key] = next;
      state.editorValue = pretty(value);
      $("#object-json").value = state.editorValue;
      updateFieldErrors();
      scheduleEditorSave();
    } catch (error) {
      notify(error.message, true);
    }
    return;
  }
  if (el.id === "filter") {
    const value = el.value,
      pos = el.selectionStart;
    captureEditor().catch((error) => notify(error.message, true));
    state.filter = value;
    state.catalog.page = 0;
    storeRoute({ replace: true });
    render();
    $("#filter").focus();
    $("#filter").setSelectionRange(pos, pos);
    return;
  }
  if (["object-id", "object-json"].includes(el.id)) {
    scheduleEditorSave();
    if (el.id === "object-json") updateFieldErrors();
  }
});
$("#main").addEventListener("change", (event) => {
  const el = event.target;
  if (el.dataset.catalog) {
    run(async () => {
      await captureEditor();
      state.catalog[el.dataset.catalog] =
        el.dataset.catalog === "pageSize" ? Number(el.value) : el.value;
      state.catalog.page = 0;
      await persistPreferences();
      storeRoute({ replace: true });
      render();
    });
    return;
  }
  if (el.dataset.column) {
    run(async () => {
      await captureEditor();
      const columns = new Set(state.catalog.columns);
      el.checked
        ? columns.add(el.dataset.column)
        : columns.delete(el.dataset.column);
      state.catalog.columns = columns.size ? [...columns] : ["id"];
      await persistPreferences();
      storeRoute({ replace: true });
      render();
    });
    return;
  }
  if (el.id === "catalog-view") {
    run(async () => {
      await captureEditor();
      const view = state.preferences.savedViews.find((v) => v.id === el.value);
      if (view) {
        state.catalog = normalizeCatalog({
          ...view.catalog,
          savedView: view.id,
        });
        state.filter = view.filter || "";
      } else state.catalog.savedView = "";
      await persistPreferences();
      storeRoute({ replace: true });
      render();
    });
    return;
  }
  if (el.id === "scenario-select") {
    state.scenarioId = el.value;
    state.scenarioIndex = 0;
    render();
    return;
  }
  if (el.dataset.wizard) {
    state.wizard ||= newWizard();
    state.wizard[el.dataset.wizard] = el.value;
    localSet("wizard:" + state.project, state.wizard).catch((error) =>
      notify(error.message, true),
    );
    if (["context", "section"].includes(el.dataset.wizard)) render();
    return;
  }
  if (event.target.id === "custom-section") {
    const section = event.target.value.trim();
    if (!section) return;
    if (
      !/^[a-zA-Z][a-zA-Z0-9_.-]{0,249}$/.test(section) ||
      ["imports", "constructor", "prototype", "__proto__"].includes(section)
    ) {
      notify(
        "Укажите имя раздела латиницей без пробелов, например integrations.",
        true,
      );
      return;
    }
    run(async () => {
      await captureEditor();
      state.section = section;
      state.model[section] ||= {};
      state.catalog.page = 0;
      state.filter = "";
      state.selected.clear();
      state.editId = "";
      state.editorValue = "{}";
      state.editorMode = "create";
      state.editorSchema = null;
      startEditHistory();
      if (state.online)
        state.editorSchema = await api("editor_schema", { section });
      storeRoute();
      render();
    });
    return;
  }
  if (event.target.id === "section") {
    const section = event.target.value;
    run(async () => {
      await captureEditor();
      state.section = section;
      state.editorSchema = null;
      state.catalog.page = 0;
      state.selected.clear();
      state.editId = "";
      state.editorValue = "{}";
      state.editorMode = "create";
      startEditHistory();
      if (state.online)
        state.editorSchema = await api("editor_schema", { section });
      storeRoute();
      render();
    });
    return;
  }
  if (event.target.id === "edit-mode") {
    run(async () => {
      await captureEditor();
      render();
    });
    return;
  }
  if (event.target.id === "draft-file")
    run(async () => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 4e6) throw Error("Файл черновика больше 4 МБ");
      const d = validateDraft(JSON.parse(await file.text()), {
        importing: true,
      });
      const saved = await saveLocalDraft({
        ...d,
        id: "local-" + crypto.randomUUID(),
        title: d.title || file.name,
      });
      state.activeDraft = saved;
      resetReview();
      render();
      notify("Черновик импортирован в браузер.");
    });
  if (event.target.id === "drawio-file")
    run(async () => {
      const file = event.target.files?.[0];
      if (!file) return;
      if (file.size > 450000)
        throw Error("Схема больше 450 КБ: превышен лимит проверяемого файла");
      const xml = await file.text();
      if (/<!DOCTYPE|<!ENTITY/i.test(xml))
        throw Error("DTD и ENTITY запрещены");
      const parsed = new DOMParser().parseFromString(xml, "application/xml");
      if (parsed.querySelector("parsererror"))
        throw Error("Некорректный XML схемы");
      state.drawioXML = xml;
      state.drawioPath =
        "diagrams/" + file.name.replace(/[^a-zA-Z0-9а-яА-ЯёЁ._-]/g, "_");
      state.drawioEditorOpen = false;
      render();
      notify(
        "Схема открыта локально. Можно распознать компоненты или открыть редактор.",
      );
    });
});
$("#project").addEventListener("change", () =>
  run(async () => {
    const next = $("#project").value;
    try {
      await changeProject(next);
    } catch (error) {
      renderProject();
      throw error;
    }
  }),
);
$("#search-open").addEventListener("click", () => run(openSearch));
$("#search-close").addEventListener("click", () => $("#search-dialog").close());
$("#global-search").addEventListener("input", (event) => {
  clearTimeout(searchTimer);
  const query = event.target.value;
  run(() => searchPalette(query, { remote: false }));
  searchTimer = setTimeout(() => run(() => searchPalette(query)), 180);
});
$("#global-search").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    event.stopPropagation();
    clearTimeout(searchTimer);
    state.searchToken = (state.searchToken || 0) + 1;
    $("#search-dialog").close();
    return;
  }
  if (["ArrowDown", "ArrowUp"].includes(event.key)) {
    event.preventDefault();
    state.palette.index = Math.max(
      0,
      Math.min(
        state.palette.results.length - 1,
        state.palette.index + (event.key === "ArrowDown" ? 1 : -1),
      ),
    );
    renderPalette();
    $("#search-option-" + state.palette.index)?.scrollIntoView({
      block: "nearest",
    });
  }
  if (event.key === "Enter") {
    event.preventDefault();
    run(() => openSearchResult(state.palette.index));
  }
});
$("#search-results").addEventListener("click", (event) => {
  const result = event.target.closest("[data-search-index]");
  if (result) run(() => openSearchResult(Number(result.dataset.searchIndex)));
});
$("#project-context").addEventListener("click", (event) => {
  if (event.target.closest("[data-context-reload]"))
    run(() => action("reload-committed"));
});
$("#main").addEventListener(
  "toggle",
  (event) => {
    if (event.target.id === "advanced-editor") {
      state.preferences.compactForm = !event.target.open;
      persistPreferences().catch((error) => notify(error.message, true));
    }
  },
  true,
);
$("#main").addEventListener("keydown", (event) => {
  const row = event.target.closest("[data-object]");
  if (row && event.target === row && ["Enter", " "].includes(event.key)) {
    event.preventDefault();
    run(() => openObject(state.section, row.dataset.object, { edit: true }));
  }
});
document.addEventListener("keydown", (event) => {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    run(openSearch);
  } else if (
    (event.ctrlKey || event.metaKey) &&
    event.key.toLowerCase() === "z" &&
    state.view === "objects" &&
    !/^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName) &&
    !event.target.isContentEditable
  ) {
    event.preventDefault();
    run(() => uxAction(event.shiftKey ? "ux-redo" : "ux-undo"));
  }
});
window.addEventListener("beforeunload", (event) => {
  if (state.editorPending && state.formPersistenceFailed) {
    event.preventDefault();
    event.returnValue = "";
  }
});
$("#reconnect").addEventListener("click", () => run(connect));
$("#dialog-close").addEventListener("click", () => $("#result-dialog").close());
window.addEventListener("offline", () => setOnline(false));
window.addEventListener("online", () =>
  notify("Сеть доступна. Нажмите «Обновить», чтобы подключить сервис."),
);
if ("serviceWorker" in navigator)
  navigator.serviceWorker.register("/sw.js").catch(() => {});
renderNavigation();
$("#main").innerHTML =
  '<div class="empty">Подключаем рабочее пространство…</div>';
await connect();
if (new URLSearchParams(location.search).get("palette") === "1")
  await openSearch();
window.addEventListener("message", (event) => {
  if (event.data?.type !== "seaf-open-search" || event.source !== window.parent)
    return;
  try {
    const referrer = new URL(document.referrer);
    if (
      !["localhost", "127.0.0.1", "[::1]"].includes(referrer.hostname) ||
      !["http:", "https:"].includes(referrer.protocol) ||
      event.origin !== referrer.origin
    )
      return;
    run(openSearch);
  } catch {}
});

window.addEventListener("popstate", () =>
  run(async () => {
    try {
      await captureEditor();
      await restoreRoute();
    } catch (error) {
      storeRoute({ replace: true });
      throw error;
    }
  }),
);
