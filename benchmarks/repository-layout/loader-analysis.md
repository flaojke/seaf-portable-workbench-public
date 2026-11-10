# SEAF: влияние структуры архитектурного репозитория на загрузчик

Дата анализа: 06.11.2026. Объект: текущие исходники fork в `vendor/seaf-archtool-core`. Это анализ кода и методика; численные результаты здесь не заявлены. Продуктовый код не изменён, тяжёлые измерения этим анализом не запускались.

## Что действительно делает загрузчик

1. `src/backend/storage/manifest-source.ts:80` очищает singleton-парсер и последовательно подключает метамодель, необязательную документацию и корневой пользовательский манифест. `loadStorageFromSources():172` повторяет этот полный путь для reload, затем считает object-hash собранного манифеста и строит merge/md5 maps. Это не загрузка только изменившегося файла.
2. `src/global/manifest/parser3/index.mjs:306` обходит явно заданное дерево imports. `loadSourceTree():374` ограничивает активные запросы `importConcurrency` (по умолчанию 16); `SourceItem:83` нормализует дочерние URI относительно родителя. Папки автоматически не сканируются. `root.scheduled` запрещает повторные/cyclic импорты одного URI.
3. Для portable local files `src/backend/helpers/request.mjs:141` вычисляет безопасный путь, а `154–158` синхронно читает файл и парсит YAML через `parseFileData():111`. Следовательно, concurrency=16 не означает 16 параллельных дисковых чтений или YAML-парсеров на разных ядрах: локальная работа выполняется в одном Node event loop. Для HTTP импорта конкурентность могла бы влиять иначе, но это другой эксперимент.
4. Backend `src/backend/storage/cache.mjs:293` при source request непосредственно вызывает `request(url)`. `VUE_APP_DOCHUB_DATALAKE_CACHE=memory` не является persistent cache распарсенных YAML-файлов. BoundedCache(1000), применяемый в `pullData()/pullFromDataCache()`, относится к результатам dataset/JSONata/menu и другим вычисленным данным.
5. Парсер сохраняет отдельно source manifests, imports, sourceMap и mergeMap. `registerMountTree():794`, `forEachTree():461`, `mountEachObject():767`, `mountEachProp():784` проходят по исходным деревьям и фиксируют происхождение объектов/свойств. `build():805` затем применяет изменения. Значит, одинаковый конечный набор систем не гарантирует одинаковую служебную память: больше файлов означает больше source/URI/provenance записей и повторяющихся section-level источников.
6. `mergeArray():543` сравнивает элементы через JSON.stringify и линейный find. Повторное добавление небольших частей в одну большую общую array может дать нелинейную стоимость. Три links у каждого отдельного компонента — другой, существенно более лёгкий случай. Нельзя смешивать array fragmentation с эффектом папок и объявлять результат чистым сравнением глубины каталогов.
7. После импорта `src/backend/storage/manager.mjs:66` строит harness; при warmupNeeded прогревает datasets/menu; независимо от warmup вызывает validators (`:79–81`). `warmup-pipeline.ts:58` прогревает datasets и пользовательское меню. Поэтому процесс → health включает не только YAML I/O: этот результат нельзя называть временем одного parse.
8. `src/backend/controllers/core.mjs:323` получает user-menu через response cache; `src/global/manifest/services/menu-builder.mjs:67` исполняет menu JSONata по definitions entities и сортирует результат. Файловая структура не превращается автоматически в видимое меню: при одном итоговом manifest и одинаковых menu definitions пользовательское дерево обычно совпадает.
9. `src/backend/helpers/jsonata-query.mjs:62` ключует cached response по query/params/subject и role при необходимости. `src/global/helpers/bounded-cache.mjs:24` объединяет concurrent misses и хранит до лимита значений. Повтор одного запроса после прогрева в основном измеряет cache hit/serialization/network, а не повторный расчёт JSONata.
10. `src/frontend/helpers/menuTree.ts:87` строит дерево из location; `:117` формирует строки раскрытых ветвей. Это зависит от числа/глубины пунктов меню и раскрытия, а не непосредственно от `systems/<id>/...` на диске. Диаграмма со всеми 1000–3000 системами также измеряет layout/render большой схемы, а не только загрузчик YAML.

## Выводы по вариантам до измерений

| Вариант | Ожидаемый источник разницы | Что нельзя заранее утверждать |
|---|---|---|
| 1. Плоские system files через systems.yaml | Один дополнительный агрегатор, список imports и provenance этого файла | Что один агрегатор существенно замедлит 1000+ систем |
| 2. Те же файлы напрямую из root | Почти тот же набор leaf reads/parse; длиннее root imports | Что root с большим числом imports обязательно быстрее для пользователя |
| 3. Папка на систему, root импортирует payload files | При равном числе и содержимом leaf files различаются URI/папки/длина путей | Что глубина каталогов сама по себе создаёт рекурсивное сканирование |
| 4. Папки + общие systems/function/integrations агрегаторы | Ещё несколько небольших files/import edges; важнее число payload files | Что три агрегатора и 3000 per-system heads — одна стоимость |
| 5. root → system/root.yaml → payload | Дополнительно по одному небольшому head-файлу на систему; удобнее перенос/ownership | Что организация пакетов даёт автоматический lazy load или incremental reload |
| 0. Два монолитных файла | Минимум open/parse/source bookkeeping, но большие YAML documents и review conflicts | Что преимущество во времени старта компенсирует неудобство изменений для любой команды |

Это гипотезы из кода, а не рейтинг с измеренными процентами. Рекомендация структуры должна учитывать независимость команд, code review, конфликты Git и необходимость подключать систему как пакет. Для модели из disjoint object maps количество payload-файлов, YAML-байты и provenance ожидаются более важными факторами, чем ещё один уровень папки; реальный эффект измеряется нижеописанным экспериментом.

## Контракт сопоставимых fixtures

- Основные размеры: 1000 и 3000 систем, по 3 исходящих интеграции на систему (соответственно 3000/9000 links). Детали functions фиксируются один раз для всех вариантов; число functions обязательно указывается в отчёте.
- Один детерминированный canonical model генерируется из seed. Все layouts лишь раскладывают одинаковые записи по разным файлам. Для каждой системы одинаковы ID, поля, owners, функции, endpoints, links и ordering ordered arrays.
- Для однозначного сравнения 1 ↔ 2 использовать ровно те же payload chunks; меняется только import wiring. Для 2 ↔ 3 также сохранить chunk count, меняются только папки. Если практический вариант пользователя дополнительно делит систему на 3 файла, отдельно явно указать это как фактор file count, а не скрывать в «глубине».
- В каждой строке отчёта: payloadFiles, aggregatorFiles, totalFiles, importEdges, maxImportDepth, maxFilesystemDepth, UTF-8 payloadBytes, importBytes, всего YAML bytes. Пара одинаковых систем и integration count не гарантирует одинаковый объём source metadata.
- Не допускать двойных импортов одного URI, не полагаться на override порядка файлов, не собирать искусственно одну shared array из тысяч мелких imports. Такие stress cases можно измерять отдельно с собственной меткой.
- У всех layouts одинаковые core/metamodel версии, flags, validators, user-menu queries и contexts. В пользовательскую проекцию equivalence включить components, functions и integrations/links; исключить только явно служебные provenance/URI поля. Проверять SHA-256 canonical JSON проекции и counts после **реальной** загрузки runtime. Валидация должна показать одинаковые результаты без hidden $errors.
- Конечные пользовательские данные fixtures никогда не берутся из ShopFlow и не создают там тестовых коммитов. Всё под isolated research/state или temp.

## Что измерять последовательно

| Метрика | Граница измерения | Обязательная оговорка |
|---|---|---|
| process-to-ready | spawn свежего native Node → корректный health instance | Включает загрузку Node modules и initialization, не только imports |
| reload-to-ready | PUT reload → ответ/подтверждённая новая версия | Backend выполняет полный import/harness/validators; отдельно unchanged и one-file change |
| first-query | Первый одинаковый JSONata после fresh load | Не смешивать с последующими cached responses |
| warm-query | Серия идентичных запросов после первого | Измеряет cache hit path; не выдавать за ускорение расчёта модели |
| menu-first/menu-warm | Первый и повторный user-menu endpoint | Сверить item count и одинаковое дерево |
| model payload | Один фиксированный registry/subgraph endpoint | Количество bytes и объектов одинаковое; полный manifest может различаться source metadata |
| RSS/peak/heap | Процесс runtime, baseline и max во время load/reload | RSS родительского bench-runner не равно RSS backend; aggregate samples пропускают короткие пики |
| real browser ready | page navigation → видимая непустая таблица/карта | Fresh browser отдельно от warm browser; не включать загрузку remote libraries |
| one-system subgraph | Одинаковая выбранная система + depth 1–2 | Практический пользовательский сценарий; не смешивать с layout всех 3000 узлов |

Парсерные microbench, если нужны, выделяются отдельно: новый `Parser`, реальный YAML read adapter, import+build+semantic hash, без Express/validators. Это помогает объяснить runtime цифры, но не заменяет end-to-end native portal измерение.

## Как не испортить эксперимент

1. Генерация fixtures, npm/build, ZIP, Java rendering, browser gates и другие workload завершены до измерения. Запускать только один backend/case за раз; после stop ждать закрытия его порта.
2. Зафиксировать machine/Windows/Node/core commit, CPU/RAM, physical disk, memory cache flag, antivirus configuration as observed. Не отключать антивирус ради красивой цифры.
3. Fresh-process run не означает cold filesystem. Без контролируемой очистки OS file cache маркировать `fresh-process / OS-cache-uncontrolled`, а не «cold disk». First-ever warm-up отдельно и не подменять его медианой.
4. Чередовать/перемешивать layout order фиксированным seed, чтобы 0 всегда не прогревал диск для остальных и чтобы поздние cases не были единственными при нагретом CPU. Минимум 3, предпочтительно 5 fresh-process repetitions; median и диапазон. При 5 samples не делать сильных выводов по p95.
5. First-query и warm-query записывать отдельно. Если нужен uncached expression test, определять его заранее; добавление nonce в query меняет compile-cache workload и не эквивалентно обычному запросу. Не скрывать этот факт.
6. Полный graph 1000/3000 узлов может создать самостоятельный Graphviz/SmartAnts/browser bottleneck. Сначала registry+small subgraph; whole-model graph — отдельная optional stress серия с timeout.
7. Собрать raw JSON/CSV с одним объектом на run, stderr/exit status, counts и content hashes. Timeouts/errors не удалять из выборки; отмечать явно. Не экстраполировать 1000→10000 по двум точкам как измеренный результат.

## Что требуется для итоговой рекомендации

Сначала показать наблюдаемые differences на 1000/3000 систем, затем сравнить их с разбросом повторов. Если 1–4 различаются в пределах шума, не выдавать косметическую разницу за ускорение. Если 5 проигрывает startup из-за S дополнительных head files, оценить абсолютную цену в секундах против ownership/review преимуществ. Архитектурная декомпозиция папок не даёт текущему backend автоматической ленивой загрузки: для этого нужна отдельная продуктовая доработка loader/cache, а не переименование файлов.

## Инструментация без изменения продукта

Минимальный worker может до `await import(coreEntry)` обернуть `fs.readFileSync` из `node:fs` и `require('yaml').parse`, полученный через `createRequire(<coreRoot>/package.json)`. Backend request использует default fs object и CommonJS YAML export, поэтому такой prelude перехватывает реальные вызовы, не правя core. В лёгкой проверке export `yaml.parse` оказался writable и один пробный YAML дал ровно один наблюдаемый parse call. Это не нагрузочный замер.

Нужно считать отдельно: все YAML (включая метамодель) и файлы внутри fixture workspace; для latter — calls, unique paths, UTF-8 bytes и суммарные read/parse durations. Вызов `yaml.parse` не получает filename: для привязки можно сохранить последнюю синхронно прочитанную строку и путь до немедленного parse, затем очистить ссылку. Не удерживать словарь всех текстов в instrumentation, иначе probe сам добавит layout-dependent память. `yaml.parse` вне совпавшей пары помечать unattributed, не приписывать fixtures.

Per-phase reset делается перед reload; snapshot — после подтверждения новой готовой модели. Cumulative read/parse durations — части общего времени, их нельзя складывать с process-to-ready как независимые метрики. Startup Node/tsx modules следует оставить вне source-file counters, но внутри полного process-start времени. Сильный вывод по абсолютным миллисекундам желательно проверить повтором без monkey-patch хотя бы на одном representative layout: probe добавляет per-call overhead.

## Дополнение: чтение исходника одного объекта

Открытие собранной карточки компонента и чтение исходного YAML — разные операции. Карточка строится из merged manifest. Для исходника backend хранит соответствие пути модели и исходного URI:

1. `src/global/manifest/parser3/consts.mjs:35` задаёт `components: 2`, а `helpers.mjs:35` сводит property path к `/components/<id>`.
2. `src/backend/storage/manifest-source.ts:150` перебирает mergeMap, считает **MD5 пути модели**, записывает `md5Map[hash] = sourceURI` и отдаёт `backend://<hash>/`. При нескольких fragments для одного объекта map указывает на последний исходный URI; один ответ не обещает все исходники многосоставного объекта.
3. Frontend `src/frontend/helpers/uri.js:42` в backend mode строит тот же `backend://${md5(path)}/`, а `requests.js:238` переводит его в HTTP storage URL.
4. `src/backend/controllers/storage.mjs:49` находит `baseURL = req.storage.md5Map[hash]`. При пустом хвосте URI и `inlineContent=1` (`:79`) проксирует полный исходный файл. В native file mode `request.mjs` вызывает `res.sendFile`, не вырезая одну сущность и не парся YAML заново.

Контракт extra-замера на реальном API без изменения продукта:

```js
const modelPath = '/components/' + selectedComponentId;
const hash = createHash('md5').update(modelPath, 'utf8').digest('hex');
const started = performance.now();
const response = await fetch(portal + '/core/storage/' + hash + '/?inlineContent=1');
if (!response.ok) throw Error('Source read HTTP ' + response.status);
const bytes = new Uint8Array(await response.arrayBuffer());
const sourceReadMs = performance.now() - started;
const sourceDecodedBytes = bytes.byteLength;
```

`envelope=1` для этого измерения не нужен: это дополнительный transport envelope, а не raw source. Проверять Content-Type/body и идентификатор ожидаемого компонента, чтобы HTTP 200 с JSON-ошибкой не стал ложным успехом. Если файлы fixtures известны, сверять SHA-256 полного ответа с ожидаемым defining file. При 403 не угадывать URI: это отсутствие mapping либо неподходящий model path. Здесь MD5 — адресный ключ существующего API, а не контроль целостности.

Для монолита будет передаваться весь большой YAML; для отдельного system file — существенно меньший файл. Это может влиять на transfer/parse/editor UX даже при одинаковом времени открытия merged карточки. Размер `arrayBuffer()` — декодированный размер ответа; middleware compression и HTTP wire bytes следует отличать. Поскольку файл уже читался во время startup, без очистки OS cache этот сценарий нельзя называть cold-source disk I/O. `res.sendFile` использует async streaming, поэтому этот запрос может не увеличивать sync-read counters текущего probe; измерять его следует отдельно по HTTP wall/bytes.

Есть и функциональное ограничение Workbench/MCP: `seaf-mcp/engine.mjs:295` читает исходник целиком и отклоняет `text.length > 500000` (`Artifact too large`); такой же лимит применяется к content одного proposal. `Workbench.buildOperations()` читает файл определения через этот метод. Поэтому большой монолит может продолжать корректно показываться в основном портале, но не подходить для текущего MCP/Workbench редактирования. Это лимит **символов**, не 500000 UTF-8 bytes. В отчёте полезно показать maxSourceChars и maxSourceBytes для каждого layout; не объявлять редактируемым непроверенный многомегабайтный baseline.

Наконец, кнопка заголовка «Найти в коде» (`Layouts/Header.vue:233,304`) отображается только в IDE plugin mode и вызывает `$PAPI.goto`. Поэтому raw HTTP source-read — реальный backend API сценарий, но без дополнительной UI-проверки его нельзя выдавать за измеренную кнопку source-panel в переносимом браузерном профиле.
