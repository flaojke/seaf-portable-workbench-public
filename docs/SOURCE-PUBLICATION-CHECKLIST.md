# Source Git: состав и чистая история публикации

Подготовка относится к **SEAF-Portable**, производному форку SEAF.ArchTool. Она не создаёт GitHub/GitVerse репозитории и не отправляет файлы на сервер.

## Что переносится в source export

Экспортёр `docs/export-source.mjs` берёт фактически проверенные tracked/nonignored candidate files из `docs/source-audit.mjs`, сохраняя относительные пути и байты. Перечень фиксируется в `SOURCE-MANIFEST.json`; копирование останавливается, если источник изменился между audit и завершением copy. Старый `.git` не копируется.

Граница публикации задана положительным списком `docs/source-policy.mjs`: только перечисленные корневые файлы и каталоги SEAF, один vendor `seaf-archtool-core`, два файла Docker-профиля. Неизвестный соседний проект или новый корневой файл попадает в `outOfScopeCandidates`; private/runtime/state/config пути — в `excludedCandidates`. Их содержимое не читается, а аудит требует review вместо молчаливого включения или пропуска. Кандидат более 5 MiB также требует review. Разрешённые local package archives, библиотеки, lockfiles и тестовые исходники остаются входами обычного аудита. Та же политика проверяет пути канонического Git tree до подготовки upload payload. Исторические запрещённые, неназванные и слишком большие blobs перечисляются только по metadata без чтения содержимого; scan истории ограничен разрешёнными source blobs и не разрешает публикацию старой рабочей истории.

| Allowlist | Состав |
|---|---|
| Корневые файлы | `.editorconfig`, `.gitattributes`, `.gitignore`, `AGENTS.md`, `README.md`, `CONTRIBUTING.md`, `LICENSE`, `NOTICE`, `UPSTREAM.md` |
| `vendor/seaf-archtool-core` | Исходники, package/lockfiles, libs, tests, LICENSE/NOTICE и UPSTREAM.json; без node_modules, dist и generated public/plugins |
| `seaf-mcp` | MCP/Engine/Workbench, tests, templates и package/lockfiles; без личных projects.json/mcp.config.json и state |
| `portable` | Исходники сборки, launcher/offline/ZIP, checksum inputs и gates; без cache/state/runtime-бинарников |
| `examples` | ShopFlow и Hello, документация и схемы; без вложенных Git, history или пользовательских конфигов |
| `openspec` | Master/delta specifications, pinned tooling package/lockfiles и reviewed evidence; без tooling/node_modules |
| `benchmarks` / `docs` | Сценарии измерений, отчёт, инфографика, инструкции и скрипты подготовки; без synthetic state/worker configs |
| `seaf-docker` | Только `compose.yaml` и `launcher.ps1` для альтернативного профиля |

Первоначальный `SOURCE-MANIFEST.json` фиксирует рабочие байты экспорта. Перед окончательной публикацией он пересчитывается по **каноническим байтам Git archive**, поэтому не зависит от личного `core.autocrlf`. Manifest не входит в собственный digest. Окончательный список — inventory, а не разрешение добавлять любые файлы в перечисленные каталоги. Audit проверяет известные запрещённые локальные пути, nested Git/gitlinks/symlinks, файлы >5 MiB и ограниченный набор high-confidence token/private-key форматов. Секретные значения не выводятся; этот набор шаблонов не доказывает отсутствие всех возможных форматов credentials.

## После фиксации исходников

Пока другие задачи меняют исходники, экспорт не выполнять. После source freeze из исходного workspace:

```powershell
node docs/source-audit.mjs
node docs/export-source.mjs --output dist/seaf-portable-workbench-source
```

Целевая папка должна отсутствовать или быть пустой. Экспортёр ничего не удаляет и не перезаписывает существующие файлы. Неполная копия после ошибки остаётся для диагностики; следующий запуск должен использовать новую пустую папку.

В экспортированном каталоге создаётся независимый Git. Используются обычные авторские `user.name`/`user.email`; не подставлять вымышленные credentials. Это локальные операции подготовки, не push:

```powershell
git -C dist/seaf-portable-workbench-source init --initial-branch=codex/portable-release
git -C dist/seaf-portable-workbench-source add -- .
git -C dist/seaf-portable-workbench-source diff --cached --stat
git -C dist/seaf-portable-workbench-source commit -m "Prepare seaf-portable-workbench source candidate"
```

Непосредственно перед commit проверяются staged paths и отсутствие runtime/data/config файлов. `docs/source-audit.mjs` требует собственного Git root и не принимает родительский Git за экспортированный репозиторий. Не переносить в новую `.git` remotes, credentials или старые config blobs.

## Доказательство сборки

1. В source export отсутствуют `repositories`, `seaf-docker/workspace`, `node_modules`, готовый `vendor/seaf-archtool-core/dist` и пользовательские `data`.
2. Сборку запускают **из этого source tree**, устанавливая dependencies через `npm ci` по его lockfiles. Глобальный npm cache допустим: целостность пакетов проверяет npm. Копировать прежние application node_modules вместо установки нельзя.
3. Для ускорения допустимы только уже проверенные архивы download cache из portable inputs. Они повторно проверяются закреплёнными SHA-256 и распаковываются. Это бинарные build inputs, а не скрытый источник приложения.
4. Команда `node portable/build.mjs --output dist/SEAF-Windows-x64` должна собрать frontend/backend и финальный manifest/ZIP. В clean-source опыте нельзя использовать `--skip-build` или переносить готовый core/dist.
5. Финальный ZIP полностью распаковывают в другой Unicode/space путь, проверяют manifest и extra files, затем запускают с изолированным PATH. Фиксируются реальные модель, валидаторы, offline-схемы/draw.io и own-process stop.
6. Проверенная приёмка и OpenSpec archive фиксируются отдельным документационным коммитом source repo. Обновлённые source files снова проверяются audit. Исходный workspace остаётся независимой историей разработки.

До наблюдения этих шагов source audit не называется clean-checkout build, а прежняя launcher-проверка не объявляется проверкой нового ZIP. Формат ZIP64 нужен из-за количества файлов; наличие `.zip` само по себе не означает корректную завершённую central directory.

## Публикация

Исторические evidence публикуются только как проверенные сводки статусов, названий проверок, счётчиков и измерений. Сырые модели, вопросы и ответы агента, вложенные JSON-ответы, управляющие токены и реальные локальные пути остаются вне исходников. Аудитор проверяет содержимое отчётов наряду с allowlist путей; точные локальные оригиналы хранятся только в ignored state. Ошибки прежних запусков сохраняются в сводке и не объявляются успешной новой приёмкой.

Captured JSON/TAP ограничены 16 KiB и подготавливаются как сводки меньше 12 KiB. В benchmark evidence остаются агрегаты вариантов и размеров, без индивидуальных samples, оборудования машины, runtime inventories и повторных списков SHA каждого файла. Полный inventory публикуется только в SOURCE-MANIFEST. Lockfiles, исходный код и допустимые библиотеки проверяются по общей политике исходников; этот лимит отчётов к ним не применяется. Публичные HTTP-ссылки не считаются Windows-путями.

### Канонический source manifest и ZIP

После проверки metadata и archive change используются `docs/source-manifest.mjs` и зависимости из `seaf-mcp` (установленные по lockfile). Команды выполняются внутри отдельного source Git:

```powershell
git add -- .
node docs/source-manifest.mjs refresh --functional-source ae43a0a36bac66e0579c021552fe2de00a595382
git add -- SOURCE-MANIFEST.json
git diff --cached --stat
git commit -m "Close verified portable release metadata"
node docs/source-manifest.mjs verify
node docs/source-manifest.mjs archive --output ../seaf-portable-workbench-source-2.1.0.zip
node docs/source-manifest.mjs verify-zip --zip ../seaf-portable-workbench-source-2.1.0.zip
```

Указанный functional-source — проверенный код релиза 2.1.0; для будущих версий выбирается соответствующий проверенный коммит. Helper не commit/push автоматически. `refresh` требует предварительно staged source tree и исключает сам manifest из file identity. Финальные source commit и ZIP могут содержать более позднюю документацию/evidence без изменения функциональных Git blobs проверенной сборки.

Политика задана явно: `core.autocrlf=false`, `core.eol=lf`, соблюдение committed `.gitattributes`; `*.cmd` и `*.ps1` имеют CRLF. Глобальные attributes отключаются через null device; локальный `.git/info/attributes` с переопределениями не принимается. `identityScope` и `lineEndingPolicy` записываются в manifest. Поэтому SHA из него проверяются по canonical archive bytes, а не по произвольной Windows working-tree конверсии.

Source ZIP создаётся непосредственно из `HEAD`, содержит все committed source files и manifest, затем повторно проверяется каждый файл. Рядом создаются `.sha256` и `.sri`; `verify-zip` сверяет содержимое, полную file identity и оба контрольных значения. Существующий итоговый ZIP не перезаписывается. `.git`, ignored dependencies/runtime/cache/data и прежняя рабочая история в архив не входят.

Публиковать следует **проверенный отдельный source Git**. Бинарный ZIP и source ZIP при необходимости прикладываются релизными артефактами; пользовательские data/история/ключи в них не входят. Будущие адреса и описания обеих площадок: [REPOSITORY.md](REPOSITORY.md). Создание remote и push остаются отдельным явно запрошенным действием.
