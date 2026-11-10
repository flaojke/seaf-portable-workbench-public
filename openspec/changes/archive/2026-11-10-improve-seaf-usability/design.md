# Design

## Structure
Существующие Engine/Workbench и lifecycle draft/propose/validate/apply остаются единственным путём записи модели. UX реализуется отдельными pure helper modules и интеграцией существующего интерфейса. Backend read services обеспечивают поиск с источниками и паспорт объектов; конструктор использует отдельный bounded parser/serializer.

## Source ownership
Основной frontend интегрируется одним исполнителем; конструктор имеет собственные backend/frontend модули; маршрутизация API и выпуск контролируются основным исполнителем. Существующая доработка Stack Diagram сохраняется; незавершённая история не объявляется принятой без проверок.

## Project data and safe writes
Локальные UI-настройки, избранное, позиции, история переходов и незавершённая форма привязаны к проекту и browser origin. Они не являются сохранением в репозиторий. При восстановлении формы показывается её базовая версия; устаревший черновик не применяется автоматически. Создание системы со связями и схемой формирует одну связанную операцию. Read-only, конфликт и недоступный runtime показываются явно.

## Diagram files
Определение схемы хранит уровень, выбранные объекты и их section/ID, узлы, связи, подписи и размещение; меню и визуальное представление генерируются из того же определения. Сохраняются YAML + Markdown/Mermaid и необходимые imports. Повторное открытие читает файлы проекта, не browser-only cache. Произвольный путь, коллизия с чужим файлом, отсутствующие ссылки и недопустимые значения отклоняются. Существующая метамодель не заменяется вымышленными определениями; ручной визуальный узел явно отличается от объекта модели.

## Validation and acceptance
Pure helper tests покрывают безопасность и сохранение состояния. Backend tests используют только временные независимые Git/локальные проекты. Browser gates покрывают все десять UX-сценариев, 1000+ объектов, клавиатуру, потерю связи и конструктор всех уровней. Реальный native цикл проверяет proposal/diff, валидацию, коммит/ревизию, reload и повторное чтение файлов. Проверяются неизменность рабочих ShopFlow объектов и offline rendering.

## Release
После source freeze выполняется новый audited source export, новая чистая Git-история, locked dependency build и проверка переносимой копии. В source Git входят только проверенные source-manifest files; старые .git, repositories, data, state, mail helpers, credentials, runtime и node_modules исключены. Единственный remote назначения — `https://github.com/flaojke/seaf-portable-workbench.git`, приватность проверяется до и после push. Секреты не выводятся и не включаются в отчёты.

## Publication evidence hygiene
Historical test receipts are source documentation, not permission to publish captured architecture, prompts, answers or machine paths. Preserve exact originals only in ignored local state; publish curated observed statuses, counts and check names. Source auditing checks allowed report content as well as paths, including nested JSON payloads. Numeric synthetic benchmark measurements and normative examples remain intact. This corrects enforcement of the existing SEAF-only publication boundary without changing packaged runtime inputs.

Captured JSON/TAP reports have a 16 KiB publication limit and are curated below 12 KiB. Publish aggregate synthetic variant/size statistics rather than individual samples, host hardware, runtime inventories or duplicate per-file hash lists. SOURCE-MANIFEST is the single full source inventory; lockfiles and source code retain their normal source policy. HTTP URLs are distinguished from Windows drive paths.

The three overlapping upstream validator PNG illustrations are omitted from future published source after an upload refusal; their exact originals remain only in ignored local backup. The vendored core README uses an ordinary link to the original GitVerse project instead of embedding these images. Manifest inspection confirms that neither core/pics nor the core README is packaged in the verified 2.2 distribution. This documentation-only omission changes no application code, bundled files or readonly upstream reference repository. No refused image is retried, transformed or uploaded by another route.
