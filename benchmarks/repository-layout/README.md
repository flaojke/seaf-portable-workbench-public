# Воспроизводимое сравнение структуры архитектурного репозитория

Стенд измеряет **реальный SEAF Node backend и браузерный интерфейс**, а не только собственный YAML-merger. Все модели синтетические. Файлы ShopFlow, производственные проекты и их Git-история не изменяются.

Методика и кодовые причины: [loader-analysis.md](loader-analysis.md). Организация доменов, ownership и практический компромисс: [organization.md](organization.md). Численные результаты публикует `analyze.mjs` в [docs/performance/repository-layout](../../docs/performance/repository-layout/REPORT.md).

## Условия запуска

Команды ниже выполняются из корня исходного репозитория на Windows x64 в PowerShell. Нужны установленный bootstrap Node.js >=22.12, доступ к сети для первоначальной установки закреплённых dependencies, свободные loopback-порты и место для fixtures и журналов. Измеряемые дочерние процессы используют Node из `portable/inputs.json`; исходники ядра — `vendor/seaf-archtool-core`.

Подготовка выполняется **до измерений**:

```powershell
node portable/prepare-runtime.mjs
$seafBenchPins = Get-Content portable/inputs.json -Raw | ConvertFrom-Json
$seafBenchNodeRoot = Join-Path (Get-Location).Path ("portable/cache/runtime/node-" + $seafBenchPins.node.version + "/" + $seafBenchPins.node.archiveDirectory)
$seafBenchNode = Join-Path $seafBenchNodeRoot "node.exe"
$seafBenchNpm = Join-Path $seafBenchNodeRoot "node_modules/npm/bin/npm-cli.js"
$env:PATH = $seafBenchNodeRoot + ";" + $env:PATH
& $seafBenchNode $seafBenchNpm --prefix seaf-mcp ci --no-audit --no-fund
& $seafBenchNode $seafBenchNpm --prefix vendor/seaf-archtool-core ci --no-audit --no-fund
$env:VUE_APP_DOCHUB_MODE = "backend"
$env:VUE_APP_PLANTUML_SERVER = "ORIGIN"
& $seafBenchNode $seafBenchNpm --prefix vendor/seaf-archtool-core run build
& $seafBenchNode portable/offline-assets.mjs portable/state/offline
```

Для `--browser` нужен доступный Playwright module и установленный Chromium/Chrome. Если Playwright не находится обычным `require('playwright')`, укажите **абсолютный путь к существующему модулю**, а не путь другого компьютера:

```powershell
$env:SEAF_PLAYWRIGHT_MODULE = Join-Path $env:SEAF_TOOLS "node_modules/playwright"
$env:SEAF_CHROME = Join-Path $env:ProgramFiles "Google/Chrome/Application/chrome.exe"
```

`browser.mjs` также принимает `SEAF_PLAYWRIGHT`, `CHROME`. Браузерный профиль блокирует внешнюю сеть deny-only proxy, сохраняя нормальный HTTP cache; схемы PlantUML используют локальный Java renderer. Эти зависимости нужны измерительному стенду и не означают, что на машине пользователя требуется установка Node/Git/Docker для готового portable-комплекта.

Не запускайте одновременно сборки, ZIP, тесты, профилировщик, другие серии benchmark и тяжёлые схемы. Сначала завершите текущую серию, затем следующую. Не выключайте защиту Windows ради цифр. Если ограниченная песочница запрещает дочерний Node/tsx, loopback или временные Git-операции, используйте обычный локальный PowerShell; такой отказ среды не считается результатом производительности SEAF.

## Fixtures и проверка эквивалентности

Версия fixture contract — `seaf-repository-layout-v3`. По умолчанию seed `seaf-layout-2026`, доменная группа 20 систем. Каждая система имеет 3 исходящих links; те же 3N интеграций представлены отдельными объектами с соответствующими ID и endpoint-ами. `functions` в этой измеренной модели нет: эквивалентность не доказывает производительность другого метамоделя с функциональными сущностями.

| ID | Структура |
|---|---|
| baseline | Общие `systems.yaml` и `integrations.yaml` |
| v1 | Плоские system files через `systems.yaml`, общий integration file |
| v2 | Те же плоские system files непосредственно из root, общий integration file |
| v3 | Папка на систему, два typed files из каждой папки импортируются root |
| v4 | Те же typed files через общие systems/integrations агрегаторы |
| v5 | Свой root-манифест на систему → два typed files |
| v6 | Доменный пакет по 20 систем → два упакованных typed files и root |

Во всех вариантах дополнительно есть одинаковый `common.yaml` с представлениями/контекстами/справочником. Реальные количества файлов, import edges, глубина и байты находятся в `fixtures.json`; «два монолитных файла» означает два **typed** файла, не два файла во всём проекте.

Сначала лёгкие проверки генератора и instrumentation:

```powershell
& $seafBenchNode --test benchmarks/repository-layout/fixtures.test.mjs benchmarks/repository-layout/probe.test.mjs
```

Затем создайте новый каталог fixtures (не перезаписывайте старые доказательства):

```powershell
& $seafBenchNode benchmarks/repository-layout/fixtures.mjs --root benchmarks/repository-layout/state/fixtures-1000-3000-v3 --sizes 1000,3000 --layout all --group-size 20 --seed seaf-layout-2026
```

Команда проверяет canonical hash и counts всех layouts через настоящий `Engine.model` с временной read-only регистрацией. `run.mjs` дополнительно проверяет результаты **реально загруженного backend**. Не используйте `--no-verify` для итоговой приёмки. Можно создать отдельный smoke fixture, например `--systems 100 --layout all --root .../fixtures-smoke-new`, но результаты 100 систем не заменяют основную серию. `fixtures.json` содержит абсолютные пути данного запуска: после переноса на другой компьютер создайте suite заново.

## Основная локальная серия: 42 samples

1000 и 3000 систем × 7 layouts × 3 свежих backend-процесса. Внутри каждого sample выполняются два reload, затем real Chrome cold-context/warm-reload и focused диаграмма 50 систем:

```powershell
& $seafBenchNode benchmarks/repository-layout/run.mjs --suite benchmarks/repository-layout/state/fixtures-1000-3000-v3/fixtures.json --out benchmarks/repository-layout/state/file-1000-3000-final --transport file --sizes 1000,3000 --layouts baseline,v1,v2,v3,v4,v5,v6 --rounds 3 --reloads 2 --browser --graph plantuml
```

Для каждого нового повторного эксперимента изменяйте `--out`: runner требует пустой каталог и не перетирает предыдущий. Порядок samples детерминированно ротируется/разворачивается между rounds; процессы и renderer cache изолированы по sample. Можно задать `--node <exe>` и `--core <directory>` для другой **явно записанной** версии, но такие данные относятся к другому профилю сравнения. `--fail-fast` останавливает серию на первой ошибке; без него ошибки сохраняются в results и итоговый статус остаётся failed.

## Контролируемый HTTP-профиль: 21 sample

1000 систем × 7 layouts × 3 свежих процесса. YAML обслуживаются локальным HTTP fixture host, добавляющим 10 мс на каждый запрос; два reload, без браузерной серии:

```powershell
& $seafBenchNode benchmarks/repository-layout/run.mjs --suite benchmarks/repository-layout/state/fixtures-1000-3000-v3/fixtures.json --out benchmarks/repository-layout/state/http-1000-final --transport http --latency-ms 10 --sizes 1000 --layouts baseline,v1,v2,v3,v4,v5,v6 --rounds 3 --reloads 2
```

Это модель цены запросов, **не измерение GitLab/GitVerse/GitHub или WAN**. Git clone/fetch в локальную копию оставляет runtime в file-профиле. Другие размеры/задержки — отдельный эксперимент; текущая HTTP-серия не даёт измеренных результатов для 3000 систем.

## Дополнительное чтение исходника: 14 cases × 5 запросов

Запускайте после двух основных серий. Для каждого fixture стартует и останавливается отдельный native runtime; `sys00001` читается через настоящий raw source API, и весь ответ побайтно сравнивается с ожидаемым defining YAML:

```powershell
& $seafBenchNode benchmarks/repository-layout/source-read.mjs --suite benchmarks/repository-layout/state/fixtures-1000-3000-v3/fixtures.json --out benchmarks/repository-layout/state/source-read-final --samples 5
```

`--samples` допускает 3–5; `--sizes`, `--layouts`, `--node`, `--core` позволяют отдельный профиль. Для этого скрипта также существуют `SEAF_BENCH_NODE` и `SEAF_BENCH_CORE`. Отчёт — `source-read.json`; он сохраняет bytes, UTF-16 characters, content type, exactSourceMatch и времена запросов без стоимости startup.

Лимит 500000 символов относится к **нашему MCP/Workbench**, а не к raw source API универсального ядра. Он влияет на чтение и content одного proposal; монолит может загружаться в SEAF, но оказаться слишком большим для такого редактирования. Размер bytes нельзя подменять количеством символов. В `artifactsOverMcpTextLimit` сохраняется inventory всех превышающих лимит artifacts, включая integrations.yaml, даже когда измеряемый defining system file меньше.

## Сводный отчёт

`analyze.mjs` принимает только полные passed reports и проверяет одинаковые model hashes и число повторов:

```powershell
& $seafBenchNode benchmarks/repository-layout/analyze.mjs --file benchmarks/repository-layout/state/file-1000-3000-final/results.json --http benchmarks/repository-layout/state/http-1000-final/results.json --source benchmarks/repository-layout/state/source-read-final/source-read.json --profile benchmarks/repository-layout/state/profile-baseline-3000-v1/summary.json --out docs/performance/repository-layout
```

Результат: `REPORT.md`, `summary.json`, `measurements.csv`. `--profile` необязателен; для приведённого итогового отчёта профиль должен быть уже завершён. В summary остаются hash входных reports, source/runtime identity и агрегаты; выводы должны соответствовать наблюдаемому разбросу. Если изменились CLI, версии или число repeats, не смешивайте старые и новые reports молча.

Флаг `--portal` дополнительно обновляет только шаблон `seaf-mcp/workbench/documentation/repository-layout.md`. Он не пишет в подключённые проекты: публикация шаблонов выполняется отдельно через `publish-documentation.mjs` со стадиями propose → inspect → validate → apply.

## Отдельный CPU profile одного reload

Это поясняющий профиль одного baseline/3000 reload, не ещё один статистический timing run. Запускайте строго после других измерений:

```powershell
& $seafBenchNode benchmarks/repository-layout/profile.mjs --suite benchmarks/repository-layout/state/fixtures-1000-3000-v3/fixtures.json --out benchmarks/repository-layout/state/profile-baseline-3000-v1 --size 3000 --layout baseline --sampling-us 1000
```

`--sampling-us` допускает 100–10000. Скрипт проверяет модель до/после reload, использует Inspector Profiler и останавливает собственный worker. Файлы: `reload.cpuprofile`, `summary.json`, `top-functions.json`, `top-functions.md`, `worker.log`. V8 call-frame lines представлены без полного TypeScript source-map remapping; self sample time и доля относятся к одному профилированному интервалу с overhead, не к универсальному рейтингу горячих строк SEAF.

## Как читать метрики и доказательства

Краткий вывод и инфографика строятся только из готового summary.json, без повторных измерений:

```powershell
python -m pip install --target benchmarks/repository-layout/state/plot-libs -r benchmarks/repository-layout/plot-requirements.txt
python benchmarks/repository-layout/infographic.py --portal
```

Появятся BRIEF.md, infographic.png/svg, slowdown.csv и relative-comparison.json. Проценты рассчитываются относительно минимальной медианы **той же операции и размера**, а не общего победителя всех тестов. `--portal` обновляет только шаблон документации; выполняйте его после `analyze.mjs --portal`, затем публикуйте через MCP lifecycle.

- `coldStartMs` — свежий **backend process** до подтверждённого health instance, не гарантированно cold disk. OS file cache не очищается.
- Reload — фактический PUT reload, полный import/harness/validators. Внутри серии нет изменения architecture files, поэтому это **unchanged-source reload**, не измерение Git pull и не one-file incremental reload.
- `probe.fixture` измеряет sync YAML reads и parse внутри workspace; `global` включает метамодель и прочие YAML parse. Monkey-patch устанавливается только в benchmark worker, не в исходниках продукта. Неподтверждённое parse attribution не приписывается fixture.
- RSS — snapshot backend в точке измерения, **не пик памяти** всей системы и не heap родительского runner. Heap/CPU/event-loop metrics не являются взаимозаменяемыми.
- Browser cold — новый BrowserContext; warm — reload с cache того же context. Процесс Chrome и OS caches остаются тёплыми, время запуска Chrome исключено. Network metrics различают decoded body и encoded wire bytes.
- Диаграмма — реальный focused PlantUML для 50 систем с локальным renderer; это не полный graph 1000/3000 узлов и не SmartAnts performance test.
- Повторные JSONata/menu responses могут быть cache hits. Скорость первого расчёта, warm-cache HTTP и browser render нельзя объединять одним словом «парсинг».
- Медиана и min/max по 3 samples характеризуют этот стенд; не интерпретируйте p95 на такой выборке как надёжный SLA.

Raw state содержит большие fixtures, machine-local пути, worker control tokens, профили и подробные browser receipts; он игнорируется Git. Не публикуйте runtime control configs и не запускайте там production проекты. Для Git/портала используйте проверенные агрегаты и curated evidence с явной датой/версией. Список статуса и прогресс есть в `progress.json`, подробности каждого sample — в `results.json` и его каталоге. Ошибки/timeout не удаляются для красивого среднего.

## Что не проверялось этим стендом

Другие реальные предприятия/метамодели и role/OIDC-профили, WAN и конкретные Git-серверы, скорость clone/fetch/push, работа нескольких concurrent users, ACL на папки, full graph 3000 узлов, browser source-editor/Monaco, Windows ARM64, peak RSS по всем дочерним процессам, cold physical disk и стоимость поддержки/конфликтов Git. Структура папок сама по себе не создаёт ленивую загрузку или incremental reload. Организационные выводы отделены от количественных результатов.
