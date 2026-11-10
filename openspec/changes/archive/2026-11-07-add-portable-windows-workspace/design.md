## Context

Аудит 05.11.2026 выполнен по локальным исходникам без изменения модели, служб и Git-истории. Engine читает обычные файлы, но Workbench.model вызывает Git HEAD; proposals, diff, locks и apply также требуют Git. Проверки, preview и snapshots требуют Docker. Корневой .gitignore исключает локальные исходники core и пример ShopFlow.

## Accepted decisions

Все пять вопросов согласованы 05.11.2026: bundled Node.js, Git runtime для Git-функций, offline draw.io/PlantUML, Windows 10/11 x64, ShopFlow и небольшие примеры, локальная история без Git, URL HTTPS/SSH и готовые клоны, push только явно. Полная установка Node/Git/Docker на целевой машине не требуется. Сборка может загружать закреплённые dependencies; запуск готового комплекта работает offline.

## Design

- Источник: `git` или `directory`; история: Git commit либо локальная revision, если разрешена запись без Git. Не создавать `.git` в выбранной папке автоматически.
- Универсальная идентичность: тип revision, ID и fingerprint. Сохранить поле commit для совместимости существующих Git-клиентов. Источники AI проверять по revision и хэшу файла.
- Отдельный runtime adapter проверяет копию workspace и создаёт изолированный preview. `NativeRuntime` использует bundled Node, Windows file resolver, loopback и собственный control token. Docker adapter сохранён для ранее настроенных проектов; он не требуется directory/native-профилю.
- Выбор папки: локальный API под текущими Host/Origin/CSRF-проверками вызывает системный Windows folder dialog. Отмена ничего не регистрирует. После выбора показать путь, root manifest, тип источника и право записи. Также разрешить ручной ввод пути.
- При переключении проекта меняется реально открытая модель, а не только выбор в Workbench. Не считать отсутствие манифеста пустым успешным проектом.
- Defaults и примеры относительны папке поставки. Внешние абсолютные пути остаются в игнорируемой локальной конфигурации; после переноса отсутствующие каталоги требуют переподключения.
- Репозиторий хранит сборщик, исходники, lockfiles и manifest/checksums; runtime-бинарники, ZIP, node_modules, dist, логи, история и настройки пользователя исключаются из Git. Выбрано vendor-дерево `vendor/seaf-archtool-core` с `UPSTREAM.json`, исходными LICENSE/NOTICE и 1483 импортированными файлами. Установка dependencies идёт по lockfiles; downloaded reference repos и исходный Docker workspace не являются входами сборщика.
- Публикуемые настройки содержат только ссылки на credentials. Не сохранять токены в URL, Git и переносимом архиве.

## Native Windows findings

Core требует Node >=22.12; backend запускается через tsx. Есть Windows-sensitive containment в `src/backend/helpers/request.mjs`, Linux-команды в npm scripts и общий app.listen без loopback host. Обычного копирования Linux node_modules недостаточно. Полностью offline PlantUML требует локального renderer; Java для основного Node core/SmartAnts не обязательна. draw.io client assets можно обслуживать локально, но границы server-side export следует проверить отдельно.

## Дополнение пользователя: Проекты и Редактор

В меню SEAF добавляются самостоятельные страницы типов `lsv-workbench` с `view: projects` и `view: editor`. Адрес Workbench читается из локальной runtime-конфигурации. «Сохранить ZIP» экспортирует allowlist архитектурных файлов без Git metadata и внешних импортов; сохранение правок выполняется после diff/validate в редакторе. Отключение удаляет регистрацию, а отдельное подтверждённое удаление перемещает выбранную writable папку в локальную корзину. Git-версия создаёт ветку без переключения HEAD; локальная версия фиксирует content-addressed состояние с именем. Системы — компоненты с выбранным типом, потоки редактируют существующие component.links; отдельные integration entities доступны как обычные разделы схемы. Dropdown берутся из schema.enum/$ref и доступных dictionaries/catalogs; дополнительные свойства сохраняются в JSON. Проверки UI выполняются на временных собственных проектах.

## Идентичность поставки и публикации

Форк называется `seaf-portable-workbench`; предполагаемые GitHub/GitVerse адреса находятся под аккаунтом `flaojke`. Runtime upstream — GitVerse `seafteam/seaf-archtool-core`, а GitHub `SEAFTeam/seaf-core` указывается отдельно как метамодель, не как зеркало ArchTool. Сохраняются Apache-2.0 и исходные уведомления; bundled runtime-компоненты сохраняют собственные notices и inventory. Подготовка source Git и описаний не создаёт удалённые репозитории и не выполняет push.

## Verification strategy

Все мутационные проверки используют временные Git/не-Git fixtures. Прежняя приёмка изменения workbench не подменяет новые проверки.

1. Provider/MCP: directory без `.git`, Git root без захвата родительского репозитория, read-only overlap, stale imports/fingerprint, rollback, одна новая ревизия/коммит после успешной проверки, reload retry без повторной записи, восстановление immutable local history.
2. Native: реальный SEAF core и все применимые валидаторы; заведомо некорректный владелец отклоняется до записи, валидный diff применяется и отображается в живом портале, preview и snapshot изолированы и сохраняют runtime identity.
3. UI: восемь стадий `projects-editor-gates.mjs` на собственных Unicode fixtures: подключение directory; фактически активный портал; dropdown owner/enum; поток; ZIP/версия/копия; Git-коммит; disconnect/delete; отсутствие скрытых browser/resource ошибок. Само наличие кнопки picker не считается выполненным взаимодействием с Windows dialog.
4. Offline: локальный Java/PlantUML SVG, draw.io client и реальное изменение/сохранение XML с заблокированной внешней сетью. CORS preflight `RqUID` проверяется отдельно. Cloud storage и server-side PDF/export servlet draw.io не поставляются.
5. Distribution: финальный ZIP64 завершается корректной central directory, полностью распаковывается в новый путь с пробелами/кириллицей; manifest digests и отсутствие лишних файлов проверяются. Запуск с PATH только System32 использует bundled Node/Git/SSH, открывает ShopFlow и Hello, повторный start безопасен, Stop завершает только matching bundle instance.
6. Source Git: отдельный `docs/source-audit.mjs` проверяет tracked/nonignored candidate files, исключение личных конфигов/data/runtime, nested Git, symlinks, крупные файлы и ограниченный набор high-confidence private key/token форматов без вывода значений. Это не замена clean checkout build и проверки финального ZIP.
7. Clean checkout: из финального source tree отсутствуют `repositories`, `seaf-docker/workspace`, node_modules и готовый core/dist; сборка использует только declared tracked inputs, установку по lockfiles и закреплённые загрузки. Переносимость проверяется на текущем Windows x64 host; отсутствие отдельного физического Windows 10/второго компьютера отмечается как ограничение опыта, а не подменяется запуском в другой папке.

Фактические результаты, дата, tested-source scope и оставшиеся gates записываются в acceptance.md. Tasks отмечаются только после соответствующего наблюдения. После последнего изменения выполняются применимые регрессии и pinned OpenSpec strict; подтверждённые deltas синхронизируются в master при официальном архивировании.

## Windows history publication recovery

Первый clean-source regression 07.11.2026 выявил один EPERM при rename history temp directory в SHA-256 destination. Первоначальный fixture удалён обычной очисткой теста, поэтому исходная причина не установлена. Отдельная проверка Node 22.23.4 успешно выполнила 90 rename при отсутствующем destination, включая пути длиннее 260 символов. Контролируемая гонка за один CAS destination и Windows file lock воспроизводят тот же EPERM; это классы ошибок для обработки, а не доказательство причины первоначального сбоя.

Публикация локальной ревизии проверяет destination до попытки и после ошибки rename. Существующий архив принимается только при совпадении kind, project, ID, metadata fingerprint и фактического fingerprint сохранённых files; повреждённый или частичный архив не перезаписывается. При отсутствующем destination EPERM/EBUSY повторяется с ограничением около одной секунды. Перед повтором проверяется доступность и целостность той же temp-копии. Постоянный отказ не превращается в успех: Engine восстанавливает затронутые файлы проекта, а cleanup ограничен собственной temp-папкой capture.
