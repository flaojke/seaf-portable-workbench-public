import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import crypto from "node:crypto";
const here = path.dirname(fileURLToPath(import.meta.url)),
  args = process.argv.slice(2),
  arg = (name, fallback) => {
    const i = args.indexOf(name);
    return i < 0 ? fallback : args[i + 1];
  };
const filePath = arg("--file"),
  httpPath = arg("--http"),
  sourcePath = arg("--source"),
  profilePath = arg("--profile"),
  out = path.resolve(
    arg("--out", path.join(here, "../../docs/performance/repository-layout"))
  );
if (!filePath || !httpPath || !sourcePath)
  throw Error(
    "Usage: node analyze.mjs --file <results.json> --http <results.json> --source <source-read.json> [--out <directory>]"
  );
const read = async (f) => JSON.parse(await fs.readFile(f, "utf8")),
  file = await read(filePath),
  http = await read(httpPath),
  source = await read(sourcePath);
const profile = profilePath ? await read(profilePath) : null;
if (profile && profile.status !== "passed")
  throw Error("Refuse an incomplete CPU profile");
for (const r of [file, http, source])
  if (r.status !== "passed")
    throw Error("Refuse a final report from an incomplete or failed run");
const names = {
  baseline: "Общие systems + integrations",
  v1: "1. Плоские файлы через systems.yaml",
  v2: "2. Плоские файлы через root.yaml",
  v3: "3. Папки, root импортирует файлы",
  v4: "4. Папки, общие typed-агрегаторы",
  v5: "Манифест каждой системы",
  v6: "Доменные пакеты по 20 систем",
};
const stat = (v) => {
  v = v.filter(Number.isFinite).sort((a, b) => a - b);
  if (!v.length) return null;
  return {
    n: v.length,
    min: v[0],
    median:
      v.length % 2
        ? v[(v.length - 1) / 2]
        : (v[v.length / 2 - 1] + v[v.length / 2]) / 2,
    max: v.at(-1),
  };
};
function aggregate(report) {
  const groups = [];
  for (const N of [...new Set(report.samples.map((s) => s.systems))].sort(
    (a, b) => a - b
  ))
    for (const layout of Object.keys(names)) {
      const rows = report.samples.filter(
        (s) => s.systems === N && s.layout === layout
      );
      if (!rows.length) continue;
      if (rows.some((r) => r.status !== "passed"))
        throw Error("Failed sample in " + N + "/" + layout);
      if (rows.length !== report.config.rounds)
        throw Error("Missing repetitions in " + N + "/" + layout);
      if (new Set(rows.map((r) => r.model.modelSha256)).size !== 1)
        throw Error("Different model results between repetitions");
      const ui = (phase) =>
        rows.flatMap((r) =>
          (r.browser?.runs || []).map((run) => run.phases[phase])
        );
      groups.push({
        N,
        layout,
        name: names[layout],
        source: rows[0].source,
        modelSha256: rows[0].model.modelSha256,
        startupMs: stat(rows.map((r) => r.coldStartMs)),
        reloadMs: stat(rows.flatMap((r) => r.reload.map((x) => x.reloadMs))),
        yamlParseMs:
          report.config.transport === "file"
            ? stat(rows.map((r) => r.load.fixture.parseMs))
            : null,
        fileReadMs:
          report.config.transport === "file"
            ? stat(rows.map((r) => r.load.fixture.readMs))
            : null,
        globalYamlParseMs: stat(rows.map((r) => r.load.global.parseMs)),
        loadedFiles:
          report.config.transport === "file"
            ? stat(rows.map((r) => r.load.fixture.uniqueFiles))
            : null,
        rssMiB: stat(rows.map((r) => r.load.memory.rss / 1048576)),
        uiColdMs: stat(ui("cold").map((p) => p.firstUiReadyMs)),
        uiWarmMs: stat(ui("warm").map((p) => p.firstUiReadyMs)),
        diagramMs: stat(
          ui("focus").map(
            (p) => p.graphReadyMs ?? p.plantumlReadyMs ?? p.smartantsReadyMs
          )
        ),
        coldWireBytes: stat(ui("cold").map((p) => p.network.encodedWireBytes)),
        warmWireBytes: stat(ui("warm").map((p) => p.network.encodedWireBytes)),
        backendRequests: stat(
          ui("cold").map((p) => p.network.backendRequestCount)
        ),
        httpRequests: stat(rows.map((r) => r.httpSourceLoad.requests)),
        rawSource: source.results.find((r) => r.N === N && r.layout === layout),
      });
    }
  for (const N of new Set(groups.map((g) => g.N)))
    if (
      new Set(groups.filter((g) => g.N === N).map((g) => g.modelSha256))
        .size !== 1
    )
      throw Error("Layouts do not have identical runtime models at " + N);
  return groups;
}
const local = aggregate(file),
  remote = aggregate(http),
  f = (v, n = 3) => (v == null ? "—" : Number(v).toFixed(n)),
  seconds = (s) => (s ? f(s.median / 1000) : "—"),
  range = (s) => (s ? `${f(s.min / 1000)}–${f(s.max / 1000)}` : "—");
const summary = {
  format: "seaf-repository-layout-summary-v1",
  created: new Date().toISOString(),
  names,
  local,
  controlledHttp: remote,
  environment: {
    host: file.host,
    coreVersion: file.implementation.coreVersion,
    node: file.samples[0].load.node,
    browser: file.samples.find((s) => s.browser)?.browser.browser,
    sourceHashes: file.implementation.sourceHashes,
    rendererCacheScope: file.rendererCacheScope,
  },
  measurements: {
    file: {
      started: file.started,
      completed: file.completed,
      config: file.config,
      samples: file.samples.length,
    },
    http: {
      started: http.started,
      completed: http.completed,
      config: http.config,
      samples: http.samples.length,
    },
  },
  evidence: await Promise.all(
    [filePath, httpPath, sourcePath, ...(profilePath ? [profilePath] : [])].map(
      async (filename) => ({
        filename,
        sha256: crypto
          .createHash("sha256")
          .update(await fs.readFile(filename))
          .digest("hex"),
      })
    )
  ),
};
await fs.mkdir(out, { recursive: true });
await fs.writeFile(
  path.join(out, "summary.json"),
  JSON.stringify(summary, null, 2) + "\n"
);
const markdown = [];
markdown.push(
  "# Структура архитектурного репозитория SEAF: исследование и нагрузочный тест",
  "",
  "Проверены четыре варианта пользователя, исходные два общих файла и две дополнительные структуры. Это синтетическое сравнение текущего Windows-форка SEAF.ArchTool; корпоративный архив не использовался. Числа относятся к указанной версии и среде, а не ко всем установкам SEAF.",
  "",
  "## Вывод",
  "",
  "Для хранения рекомендован гибрид: папки по доменам/владельцам с небольшими пакетами объектов, отдельный каталог и manifest для сложной системы. Root подключает манифесты модулей, общие справочники — один раз. Не нужно создавать файл на каждый небольшой объект только ради скорости. Самые крупные монолиты удобны как контроль производительности, но хуже для независимых изменений и могут выйти за лимит текстового редактора.",
  "",
  "Из четырёх предложений ближе всего вариант 3: артефакты системы лежат рядом. Его стоит дополнить LTI/root.yaml, чтобы корневой файл знал только точку входа системы. Это дополнительный вариант 5; массовое создание такого manifest для каждой мелкой системы дороже пакетной структуры, поэтому рекомендуется гибрид.",
  "",
  "Перенос imports из systems.yaml в root.yaml сам по себе не является значительной оптимизацией. Число и размер файлов, source transport, полный reload и сложность представления важнее. Окончательные различия и разброс приведены ниже; небольшие отличия при трёх повторениях не означают универсальное преимущество.",
  "",
  "## Что сравнивалось",
  "",
  "| Вариант | Физическая структура |",
  "|---|---|",
  "| Baseline | systems.yaml + integrations.yaml; дополнительно root и общий файл метаданных |",
  "| 1 | Отдельные файлы систем в общей папке, импорт через systems.yaml; интеграции общим файлом |",
  "| 2 | Те же leaf-файлы, импорт напрямую из root; интеграции общим файлом |",
  "| 3 | Папка системы с systems.yaml и integrations.yaml; root импортирует все leaf-файлы |",
  "| 4 | Те же папки и payload; root подключает общие systems/integrations агрегаторы |",
  "| Доп. 5 | Папка системы с собственным root.yaml и двумя typed-файлами |",
  "| Доп. 6 | Пакеты по 20 систем: manifest + systems + outgoing integrations в каждом домене |",
  "",
  "Функции и потоки как дополнительные самостоятельные типы не имитировались: системы записаны в DocHub components, интеграции — в custom integrations, а связи также отражены в components.links. Имена файлов systems.yaml не задают имя сущности метамодели. Во всех вариантах каждого размера одинаковые определения, ID, порядок links, контексты и справочники. Sections сравнивались SHA-256 через Engine.model и настоящий runtime API.",
  "",
  "## Методика и среда",
  "",
  `- ${file.samples.length} успешных независимых process-запусков: семь структур × два размера × ${file.config.rounds} повторения. В каждом — ${file.config.reloads} реальных reload, cold/warm UI и схема 50 систем.`,
  `- Системы/интеграции: 1000/3000 и 3000/9000; интеграции и links равны 3 × число систем.`,
  `- ОС: Windows ${file.host.release}; CPU: ${file.host.cpu}; ${
    file.host.logicalCpus
  } логических CPU; RAM ${f(file.host.totalMemoryMiB / 1024, 1)} GiB.`,
  `- SEAF core ${file.implementation.coreVersion}, Node ${
    file.samples[0].load.node
  }; Chrome ${summary.environment.browser?.version || "см. JSON"}.`,
  "- Cold-process — новый Node до готового /health. Это НЕ cold disk: кеш ОС не сбрасывался. Warm reload полностью перечитывает модель. Порядок структур ротировался/разворачивался.",
  "- UI — штатный type:table с реестром всех систем. First UI: новая browser context; warm UI: reload с HTTP-кешем. Готовность — видимая реальная строка, не только #app. Это не время отрисовки всех строк или большой общей схемы.",
  "- Диаграмма — PlantUML 50 систем с проверкой всех подписей. HTTP assets браузера тёплые, renderer cache новый для каждого sample: Java/SVG не прогревались между структурами.",
  "- Медленные операции выполнялись последовательно. Внешняя сеть браузера блокировалась; models, файлы и Git реальных проектов не менялись.",
  "- В таблицах медианы; интервалы ниже — min–max. Три process/UI повтора недостаточны для доказательства небольших процентных различий. RSS — точка после загрузки с probe, не пиковое потребление.",
  ""
);
for (const N of [1000, 3000]) {
  markdown.push(
    `## Локальные файлы: ${N} систем / ${N * 3} интеграций`,
    "",
    "| Структура | YAML | Старт, с | Reload, с | UI first, с | UI warm, с | Схема 50, с | RSS, MiB |",
    "|---|---:|---:|---:|---:|---:|---:|---:|"
  );
  for (const g of local.filter((g) => g.N === N))
    markdown.push(
      `| ${g.name} | ${g.source.yamlFiles} | ${seconds(
        g.startupMs
      )} | ${seconds(g.reloadMs)} | ${seconds(g.uiColdMs)} | ${seconds(
        g.uiWarmMs
      )} | ${seconds(g.diagramMs)} | ${f(g.rssMiB.median, 0)} |`
    );
  markdown.push("", "Разброс старта / reload / first UI (с):", "");
  for (const g of local.filter((g) => g.N === N))
    markdown.push(
      `- **${g.layout}**: ${range(g.startupMs)} / ${range(
        g.reloadMs
      )} / ${range(g.uiColdMs)}.`
    );
  markdown.push("");
}
markdown.push(
  "## Цена локального чтения и YAML-разбора",
  "",
  "| Систем | Вариант | Файлов реально прочитано | Синхронное чтение, мс | YAML parse, мс |",
  "|---:|---|---:|---:|---:|"
);
for (const g of local)
  markdown.push(
    `| ${g.N} | ${g.layout} | ${g.loadedFiles.median} | ${f(
      g.fileReadMs.median,
      1
    )} | ${f(g.yamlParseMs.median, 1)} |`
  );
markdown.push(
  "",
  "Это только измеренные readFileSync/YAML.parse фазы; остальное время включает import tree, merge/provenance, hashes, runtime и обслуживание запросов. Это не вся цена файла. Загрузчик не сканирует папки рекурсивно: он следует imports. Папка сама по себе не добавляет import edge.",
  "",
  "## Контролируемый HTTP-профиль",
  "",
  `Источник — тот же YAML через loopback HTTP с задержкой ${http.config.latencyMs} мс на запрос. ${http.config.rounds} повтора, ${http.config.reloads} reload. Это модель цены запросов, не реальный GitLab или WAN.`,
  "",
  "| Систем | Вариант | YAML-запросов на загрузку | Старт, с | Reload, с |",
  "|---:|---|---:|---:|---:|"
);
for (const g of remote)
  markdown.push(
    `| ${g.N} | ${g.layout} | ${g.httpRequests.median} | ${seconds(
      g.startupMs
    )} | ${seconds(g.reloadMs)} |`
  );
markdown.push(
  "",
  "Если Git используется для clone/fetch в локальную рабочую копию, SEAF читает файлы с диска: это основной file-профиль. Если YAML тянутся через HTTP/Git API, каждый дополнительный исходник может стоить сетевого запроса. Производительность clone/fetch и конкретного Git-сервера здесь не измерялась. Нулевые fs-счётчики HTTP не означают отсутствия YAML-разбора: fixture parse attribution основан на локальном readFileSync и здесь неприменим; globalYamlParseMs сохранён отдельно в summary.",
  "",
  "## Чтение исходника одного объекта и ограничения редактора",
  "",
  "Проверен реальный raw source API для sys00001, пять чтений после загрузки. Ответ байт-в-байт совпадает с defining YAML. Это передача исходника, а не скорость отрисовки карточки или Monaco.",
  "",
  "| Систем | Вариант | Defining YAML | Символов | KiB | Raw read median, мс | Больше лимита MCP |",
  "|---:|---|---|---:|---:|---:|---|"
);
for (const r of source.results)
  markdown.push(
    `| ${r.N} | ${r.layout} | ${r.sourceFile} | ${r.characters} | ${f(
      r.bytes / 1024,
      1
    )} | ${f(r.median, 2)} | ${r.readLimit500000Exceeded ? "Да" : "Нет"} |`
  );
markdown.push(
  "",
  "Лимит 500000 символов относится к нашей доработке MCP/Workbench, не к универсальному ядру SEAF. Интеграционный монолит тоже может превысить его: подробности artifactsOverMcpTextLimit сохранены в raw receipt. Мелкие leaf-файлы помогают чтению/редактированию исходника, даже когда не ускоряют собранный реестр.",
  "",
  "## Рекомендуемая организация",
  "",
  "```text",
  "root.yaml",
  "shared/",
  "  root.yaml",
  "  catalogs.yaml",
  "  rules.yaml",
  "domains/",
  "  logistics/",
  "    root.yaml",
  "    systems.yaml",
  "    outgoing-integrations.yaml",
  "    lti/",
  "      root.yaml",
  "      system.yaml",
  "      functions.yaml",
  "      outgoing-integrations.yaml",
  "      flows.yaml",
  "      views.yaml",
  "  sales/",
  "    root.yaml",
  "```",
  "",
  "В domains/logistics/systems.yaml хранятся другие небольшие системы домена; LTI определяется только в lti/system.yaml. Не дублируйте объект в обоих файлах. Размер пакета 20 — проверенная точка эксперимента, а не универсальный оптимум. В стенде v6 сгруппированы последовательные ID, а владельцы чередуются: измерены fixed-size пакеты, не реальные бизнес-домены. Рекомендация группировать по владельцам — оценка удобства, а не отдельный измеренный восьмой layout.",
  "",
  "```yaml",
  "# root.yaml",
  "imports:",
  "  - shared/root.yaml",
  "  - domains/logistics/root.yaml",
  "  - domains/sales/root.yaml",
  "",
  "# domains/logistics/root.yaml",
  "imports:",
  "  - systems.yaml",
  "  - outgoing-integrations.yaml",
  "  - lti/root.yaml",
  "",
  "# domains/logistics/lti/root.yaml",
  "imports:",
  "  - system.yaml",
  "  - functions.yaml",
  "  - outgoing-integrations.yaml",
  "  - flows.yaml",
  "  - views.yaml",
  "```",
  "",
  "Imports явные, относительно содержащего YAML. Не создавайте пустые файлы ради шаблона. Общие catalogs/schema/rules подключаются один раз сверху, а не из каждого system manifest. Один объект интеграции хранится у одного владельца — например у источника; получатель ссылается на тот же ID, а не создаёт вторую копию. Папки/CODEOWNERS не заменяют ACL портала.",
  "",
  "## Миграция текущих 100 систем / 300 интеграций",
  "",
  "1. Создать ветку и сохранить исходные counts, canonical model hash и рабочие контексты.",
  "2. Разнести один домен/небольшую группу без изменения ID, секций, значений и порядка упорядоченных списков. Удалять перенесённые определения из старого файла одновременно с добавлением imports.",
  "3. Исправить относительные docs/source/templates paths, проверить все связи и справочники. Ссылки по ID сохраняются; прямые raw-file URLs могут требовать миграции.",
  "4. Сравнить модель, выполнить валидаторы и открыть реальные реестры/сценарии. Сохранить целостную партию Git-коммитом и обновить портал.",
  "5. Повторять по владельцам. Через наш MCP предложение ограничено 50 файлами: выбирайте меньшие партии, например 10 систем с двумя typed-файлами и manifest; ручной Git-перенос не имеет этого конкретного лимита.",
  "",
  "Подробный разбор удобства вариантов, ownership, CODEOWNERS и автономных представлений: [organization.md](../../../benchmarks/repository-layout/organization.md).",
  "",
  "## Ограничения и обнаруженные дефекты",
  "",
  "- Корпоративная метамодель/архив недоступны. Измерялась DocHub-совместимая модель components + custom integrations; дополнительные поля, validators, плагины, RLS и отчёты конкретной компании могут изменить абсолютные времена.",
  "- Windows native профиль, локальная файловая система и прогретый кеш ОС. Docker/Linux/сетевой диск/реальный GitLab напрямую не тестировались.",
  "- Сравнение удобства — экспертная оценка владения файлами и миграции, не исследование с группой пользователей.",
  "- Перед измерениями найден и исправлен CORS RqUID preflight локального SVG renderer; все основные samples используют одну исправленную версию.",
  "- SmartAnts на отдельном smoke100/фокус50 выдал ошибку маршрутизации пути. Она сохранена как отрицательное наблюдение; числа PlantUML не выдаются за успешный SmartAnts benchmark.",
  "- Ни один вывод не требует переноса корпоративных данных или изменения пользовательского репозитория.",
  "",
  "## Воспроизведение и доказательства",
  "",
  "Источник метода: [loader-analysis.md](../../../benchmarks/repository-layout/loader-analysis.md). Генератор, worker, probes, Chrome runner и команды: [benchmarks/repository-layout](../../../benchmarks/repository-layout/README.md). В summary.json сохранены hash входных reports и source/runtime identity. Сырые fixtures и токены остаются в игнорируемом state; для публикации используйте curated evidence OpenSpec.",
  ""
);
if (profile) {
  const functions = profile.profile.topFunctions,
    where = markdown.indexOf("## Рекомендуемая организация");
  const rows = functions
    .slice(0, 6)
    .map(
      (row) =>
        `| ${row.name} | ${f(row.totalSamplesMs, 1)} | ${f(
          row.percentage,
          2
        )}% |`
    );
  markdown.splice(
    where,
    0,
    "## Почему рост модели дороже перестановки файлов",
    "",
    "Отдельно снят один V8 CPU profile reload baseline на 3000 систем. В сравнительные медианы этот запуск не входит: profiler/probe добавляет накладные расходы.",
    "",
    "| Функция | Self sample time, мс | Доля sampled time |",
    "|---|---:|---:|",
    ...rows,
    "",
    "В public/metamodel/dochub/rules/validators.yaml правило archtool.metamodel.contexts.outof проверяет каждый компонент по всему $USED через $wcard. В нашем full-контексте $USED содержит все N явных ID; статическая структура выражения предполагает N × N проверок. wcard в src/global/jsonata/driver.mjs:49 заново создаёт RegExp при каждом вызове. Профиль подтверждает горячую функцию, но не измеряет отдельно число вызовов и не доказывает, что вся нелинейность вызвана только этим правилом.",
    "",
    "Следующий кандидат оптимизации — индекс точных ID отдельно от wildcard-масок и ограниченный кеш скомпилированных масок с сохранением семантики валидатора. В рамках исследования эти оптимизации не внедрялись; менять структуру каталогов для устранения этой стоимости недостаточно. Это объёмный тест модели, а не тест одновременных пользователей или RPS.",
    ""
  );
}
markdown.splice(
  markdown.indexOf("## Рекомендуемая организация"),
  0,
  "## Сравнение удобства сопровождения",
  "",
  "Это экспертная оценка структуры, без исследования с группой пользователей.",
  "",
  "| Вариант | Удобство | Основной недостаток |",
  "|---|---|---|",
  "| 1 | Просто найти файл одной системы; индекс отделён от root | Интеграции общие; добавление систем меняет общий индекс |",
  "| 2 | Все включения видны из корня | Длинный root; слабая локальность сопутствующих документов |",
  "| 3 | Система, функции, потоки и документация рядом; владелец папки понятен | Root зависит от внутренних файлов каждой системы |",
  "| 4 | Папки сохраняют локальность; root небольшой | Состав одной системы распределён по нескольким общим индексам |",
  "| Гибрид | Пакеты по ответственности; сложная система включается одним manifest | Нужны договорённости о границах пакетов и владельце каждой интеграции |",
  ""
);
await fs.writeFile(path.join(out, "REPORT.md"), markdown.join("\n"));
if (args.includes("--portal")) {
  let portal = markdown
    .join("\n")
    .replace(
      "[organization.md](../../../benchmarks/repository-layout/organization.md)",
      "organization.md в исходном репозитории форка"
    )
    .replace(
      "[loader-analysis.md](../../../benchmarks/repository-layout/loader-analysis.md)",
      "loader-analysis.md в исходном репозитории форка"
    )
    .replace(
      "[benchmarks/repository-layout](../../../benchmarks/repository-layout/README.md)",
      "benchmarks/repository-layout/README.md в исходном репозитории форка"
    );
  portal = portal.replace(
    "## Вывод",
    "## Как пользоваться\n\n1. Выберите строку с вашим способом подключения: локальный Git-клон или HTTP-импорты.\n2. Сравните старт и reload отдельно от открытия интерфейса.\n3. Для LTI используйте пример manifests ниже, сохраняя реальные имена секций и ID вашей метамодели.\n4. Перед массовым переносом проверьте небольшой домен в отдельной ветке; корпоративные данные передавать для этого не требуется.\n\n## Вывод"
  );
  await fs.writeFile(
    path.join(
      here,
      "../../seaf-mcp/workbench/documentation/repository-layout.md"
    ),
    portal + "\n"
  );
}
const csv = [
  "transport,systems,layout,files,startup_ms,reload_ms,ui_cold_ms,ui_warm_ms,diagram_ms,yaml_parse_ms,file_read_ms,rss_mib",
];
for (const [transport, groups] of [
  ["file", local],
  ["http", remote],
])
  for (const g of groups)
    csv.push(
      [
        transport,
        g.N,
        g.layout,
        g.source.yamlFiles,
        g.startupMs?.median,
        g.reloadMs?.median,
        g.uiColdMs?.median,
        g.uiWarmMs?.median,
        g.diagramMs?.median,
        g.yamlParseMs?.median,
        g.fileReadMs?.median,
        g.rssMiB?.median,
      ].join(",")
    );
await fs.writeFile(path.join(out, "measurements.csv"), csv.join("\n") + "\n");
console.log(
  JSON.stringify({
    report: path.join(out, "REPORT.md"),
    fileGroups: local.length,
    httpGroups: remote.length,
    rawSourceCases: source.results.length,
  })
);
