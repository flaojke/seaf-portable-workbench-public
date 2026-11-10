# Подготовка и приёмка

**Итог 07.11.2026: переносимая поставка 2.1.0 подтверждена.** Ниже сохранена последовательность подготовительных и отрицательных проверок; финальный результат указан в разделе «Финальная поставка» и evidence/final-portable-acceptance.json.

05.11.2026 выполнен read-only аудит: core/runtime, Engine/Workbench/providers, корневой Git и публикационная готовность. Код и модель не изменены. Найдены Git-зависимые model/propose/diff/lock/apply, Docker-зависимые validate/preview/snapshot, отсутствие API регистрации/picker, Windows path issues и неполный состав исходного корневого Git.

Первоначальная запись аудита не подтверждала новую поставку. Все пять ответов впоследствии согласованы в clarifications.md; фактическая приёмка новых возможностей записывается ниже и в evidence. Прежняя приёмка 66/66 не заменяет эти проверки.

Проверка подготовленных спецификаций: pinned OpenSpec 1.16.0, `validate --all --strict --no-interactive` — 12 passed, 0 failed (11 masters и новый change). Это проверка формата спецификаций, а не готовности переносимого приложения.

Источники аудита: `seaf-mcp/engine.mjs`, `seaf-mcp/workbench/domain.mjs`, `seaf-mcp/workbench/intelligence.mjs`, `seaf-mcp/workbench/server.mjs`, `seaf-mcp/projects.json`, `.gitignore`, `seaf-mcp/mcp.config.json`, `repositories/seaf-archtool-core/package.json`, `repositories/seaf-archtool-core/Dockerfile`, `repositories/seaf-archtool-core/src/backend/helpers/request.mjs`, `repositories/seaf-archtool-core/src/backend/helpers/uri.mjs`.

## Проекты, редактор и провайдеры — 07.11.2026

Полный browser gate завершён: **8/8 PASS**, без внешних запросов и ошибок страницы. Проверены реальные Windows native SEAF процессы, форма со справочником и enum, 13 валидаторов, сохранение локальной ревизии и Git-коммита, reload, изменение потока, ZIP, версии, копирование, отключение и подтверждённое перемещение временного проекта в корзину. HEAD production ShopFlow не изменился.

Focused regression: **34/34 PASS, 0 failed, 0 skipped**. Исправлен запуск выбора папки при ограниченном portable PATH: используется абсолютный путь Windows PowerShell. Настоящий запуск shell проверен с PATH только System32; выбор Unicode-пути, отмена и ограниченный STA вызов проверены отдельно через контролируемый callback. Интерактивные клики в системном диалоге и авторизация на внешних Git-серверах не автоматизировались.

Компактное доказательство: [evidence/projects-editor-2026-11-07.json](evidence/projects-editor-2026-11-07.json). Финальный ZIP, запуск после распаковки и сборка из чистого checkout остаются отдельными общими gates; этот этап не архивирует изменение и не отмечает всю поставку завершённой.

## Сводное состояние — 07.11.2026 (МСК)

Исходники нового профиля реализованы; перечисленные ниже проверки относятся только к своим tested sources и не подменяют финальную поставку.

| Проверка | Наблюдаемый результат | Границы |
|---|---|---|
| Provider/MCP до picker-fix | 31/31 PASS | Read-only overlap, directory/Git roots, immutable history, stale/fingerprint, rollback, protected bundle paths; исходные hashes сохранены |
| Существующие regression | 89 PASS / 0 FAIL / 7 Docker-only SKIP из 96 | Выполнены до последнего immutable-bundle guard; guard покрыт focused31 и последующим focused34. Docker skips не считаются PASS |
| Реальный native lifecycle | 4 стадии PASS | Копия ShopFlow и 15 validators; invalid owner отклонён до записи; один Git commit + live reload/stale; isolated preview/snapshot |
| Native runtime/малый ZIP | 4/4 PASS | Windows virtual paths/escapes, identity, validation/own stop, Unicode/deterministic ZIP; не доказательство большого ZIP64 |
| Offline | 6/6 PASS | Локальный Java SVG и настоящее изменение/сохранение draw.io XML с заблокированной внешней сетью |
| Старый launcher bundle | 6/6 PASS, 05.11.2026 | Изолированный PATH, Unicode-путь, start/reuse, модель/15 validators, bundled Git/SSH, own stop; не финальный release |
| C4 L2 Hello | PASS, SVG 5038 bytes | Локальный C4_Container с API/PostgreSQL без внешнего include/network |
| Reverse guide | 21 страницы / 22 файла проверены перед публикацией | Шесть reverse страниц, YAML/PlantUML/Mermaid fences, scope core/custom/offline/editor |
| Актуальная публикация | 23 страницы, 15 validators / 0 problems | MCP lifecycle для ShopFlow и portable example; Git и directory revision не смешиваются |
| Projects/Editor + picker regression | 8/8 UI и 34/34 focused PASS | Подробности и limitation Windows dialog приведены выше; внешняя Git-авторизация не автоматизировалась |
| Source-publication audit | PASS | Working-tree candidates и reachable Git blobs; не clean-checkout build и не окончательный ZIP |

Фактические исходные receipts: `seaf-mcp/state/acceptance/provider-final.json`, `native-lifecycle.json`, `portable/state/native-test.tap`, `offline-test.tap`, `launcher-gates.json`, `seaf-mcp/state/c4-l2-evidence.json`, `documentation-review-current.json` и текущие UI receipts. Reviewed copies находятся в `evidence/`. Более поздние изменения не получают старую приёмку задним числом.

### Документация и модели

Порядок публикации: list_projects → read_artifact → propose_change → get_proposal/diff inspection → validate_change → apply_change. Мутационные тесты выполнялись на копиях, реальные ShopFlow изменения здесь — только запрошенная документация.

- 21 страница, включая reverse guide, сохранена в ShopFlow commit `6527bfb3459d9f8965389c1860aad4fb0ce43c0b`. Тогда reload не удался из-за остановленного портала; последующий apply обновил работающий native portal.
- Публикация исследования — proposal `8eda3685-7470-4935-86df-6c90a037f874`, commit `2d323644622a438be64b14714dd370d82f51af18`, applied / reload updated, 15 validators / 0 problems. В Chrome проверены меню, реальный документ, восемь таблиц и контрольные значения, без JS/resource errors.
- Portable ShopFlow example — proposal `26b2ada0-01f1-4abf-aa3c-709e5cc30164`, все 22 templates совпали, 15 validators / 0 problems. Directory revision `007b25e1d8865e0b4359b3f97a451f48f17e119498abdac80e2140f005a65f3c`; reload not_configured, поскольку исходный пример не имеет собственного live portal. `.git` в обычной папке не создавался.
- Hello — справочник owner, enum, context L2 и C4 PlantUML doc; local revision `606ef69585a09942a2b24c31fa06e3c4c496b942539d52655aae532ab2d1ae27`, 12 validators / 0 problems.

Последнее обновление перед source freeze добавило MCP 2.1, persisted active project/manifest/ZIP инструкции и краткую таблицу исследования: **23 templates**. ShopFlow proposal `3929d459-4ee0-493b-8c9c-de6fbd2c4d9e`, commit `7c2edd1dce20148d884fc6bbc7690eb626748bef`, reload updated. Portable example proposal `13cf733f-f12d-4753-a017-66a8fd806ad7`, directory revision `514e1b9487199b0c483b09ec4a4ad4f9d752f5fb71d37a209f1cddb225d24a83`, reload not_configured. Оба прошли 15 validators / 0 problems. Последняя реальная Chrome-проверка видит девять таблиц, +46.9/+18.7%, MCP 2.1 и notes активного проекта, errors0.

### Синхронизация master до упаковки

07.11.2026 pinned OpenSpec specs-apply API синхронизировал 12 delta capabilities: **24 ADDED, 11 MODIFIED**, 0 removed/renamed. Все baseline requirement names и scenarios сохранены; untouched blocks и unrelated masters остались неизменными. Повторное построение даёт нулевые counts и идентичные masters. Evidence: `master-baseline.json`, `master-sync.json`. Это idempotent sync принятых требований, **не archive** незавершённой упаковки.

### Source Git

README/NOTICE/UPSTREAM/hosting guide явно называют проект форком SEAF.ArchTool и связывают его с реальным GitVerse upstream. GitHub SEAFTeam/seaf-core указан как отдельная метамодель, не выдуманное зеркало core. Apache-2.0 и исходные notices сохранены; runtime-компоненты сохраняют свои notices/legal/inventory.

`docs/source-audit.mjs` читает tracked/nonignored candidates и reachable blobs. Он проверяет известные локальные config/data/runtime paths, nested Git/gitlinks/symlinks, размеры >5MiB и ограниченный набор high-confidence token/private-key форматов без вывода значений. Совпадений выбранных credential-форматов не найдено; это не доказательство отсутствия всех возможных форматов секретов.

В старой root Git history фактически остаются два прежних local-config blobs. Текущий index исключает активные конфиги, но удаление из index не стирает старую историю. Поэтому для публикации готовится отдельный `dist/seaf-portable-workbench-source` и независимый Git, сохраняя исходную историю на месте. Экспортёр проверяет source hashes до/после copy и ничего не stage/commit/push. Точный allowlist и процедура clean-source build: `docs/SOURCE-PUBLICATION-CHECKLIST.md`.

### Оставшиеся release gates

1. Frozen audited source export, новый Git без старых local configs и сборка из него с установкой locked dependencies, без ignored application sources или готового core/dist.
2. Завершённый ZIP64, полная распаковка в другой Unicode/space путь, strict manifest/extra-file verify, реальные ShopFlow/Hello, offline tools и safe own stop окончательного bundle.
3. Проверка финальных licenses/config exclusion, обновлённые инструкции и curated release evidence. Ранее усечённый zip64-test.zip не считается PASS.
4. Пinned OpenSpec strict, sync подтверждённых deltas и официальный archive только после наблюдения gates.

Windows 10/11 x64 — целевой профиль. Тесты выполняются на текущем Windows x64 host и в разных папках; отдельный физический второй компьютер/Windows 10 не проверялся. Source audit не подменяет clean-checkout build, а старый launcher6/6 не подменяет запуск нового ZIP. Remote creation и push не выполнялись.

## Повторная фиксация исходников после correctness-stop — 07.11.2026

Первый clean-source regression дал 101 тест: 90 PASS / 3 FAIL / 8 SKIP. Две legacy bridge проверки требовали исключённый личный projects.json; они переведены на поставляемый ShopFlow с собственным временным реестром. Один history rename вернул Windows EPERM. Исходный fixture уже удалён обычной очисткой, поэтому первоначальная причина неизвестна; AV, длинные пути или CAS collision не объявляются доказанной причиной. Старый candidate остановлен и сохранён для диагностики, не выдаётся за завершённый release.

После диагностики утверждён hardening `ProjectSources.capture`: проверка immutable archive при повторном использовании и CAS-гонке, bounded retry EPERM/EBUSY при отсутствующем destination, отказ от corrupt/partial archive, rollback затронутых файлов и cleanup только собственного temp. **Focused42/42 PASS**, **clean-source109 = 101 PASS / 0 FAIL / 8 SKIP**. Из восьми skips семь относятся к opt-in Docker, один — к тяжёлому native lifecycle, который должен быть отдельно выполнен после финальной пересборки/launcher gates. Подробности отрицательного запуска, диагностики и tested-source scope: `evidence/clean-source-regression-2026-11-07.json`.

`Recoverable local history` перенесено в MODIFIED delta с сохранением прежних двух scenarios и добавлением четырёх recovery scenarios. Повторный pinned sync изменил одно нормативное требование, baseline names/scenarios сохранены, второе применение — no-op. Footer master описывает место записи acceptance устойчиво: active при pending gates, archived после наблюдаемого завершения; он не объявляет package готовым и не устареет из-за archive.

Windows extraction переключён на штатный .NET ZipFile с fresh/empty destination. `integrity-dotnet-2026-11-07.tap`: **7/7 PASS**, включая реальные Unicode bytes, запрет overwrite/nonempty destination и confinement ZIP entries. Это ещё не полная проверка нового большого ZIP64.

MCP-инструкция Windows history опубликована после 15 validators / 0 problems: ShopFlow commit `c8ec25fdb4b5a52c92e7784c7a08efe57bd814bc`, proposal `ebc4dc73-4eb3-4e17-b716-f4e4b416302b`. Первичный reload failed сохранён в журнале; последующий `reload_project` вернул **тот же commit**, applied / reload updated / problems[], без повторной записи. Portable example — proposal `686402aa-b3ed-4cf1-bb4d-3b337d00fff0`, directory revision `044bf0a17bdfc8f595fc7600ae252bbba18a7f813bd564fc54f2568893631c92`, reload not_configured.

Краткий исследовательский отчёт/инфографика уточняют scope: корпоративный формат КАДЗО v2023 не подменяется синтетическим DocHub components/custom integrations benchmark. Числа, summary и raw hashes не менялись; новых измерений не было. `openspec/project.md` обобщён для source/portable, Git и directory history, без привязки к машинному пути; историческая закрытая поставка 05.11.2026 сохранена.

В этой промежуточной точке финальная упаковка, relocation и native lifecycle оставались pending; результаты последовавшего полного запуска зафиксированы ниже.

## Финальная поставка — 07.11.2026

Наблюдаемый итог — **PASS**. Сборка выполнена из независимого чистого source Git commit `ae43a0a36bac66e0579c021552fe2de00a595382` с реальными offline npm ci, plugin ci и production frontend build, без skip и скрытых прежних application node_modules. Shared cache содержал закреплённые downloads/dependencies; lockfiles не менялись. Первоначальный ENOTCACHED устранён на подготовительном этапе и сохранён как отрицательное наблюдение.

| Проверка финального артефакта | Результат |
|---|---|
| ZIP64 и независимый parser | PASS, 76232 записи вместе с manifest; пользовательских data нет |
| Полная распаковка в новую папку с кириллицей/пробелами | PASS, .NET ZipFile, 26.368 с |
| SHA-256 каждого неизменяемого файла | PASS, 76231 файл, до и после runtime |
| Start/reuse/own stop, два примера, bundled Git/SSH, сохранённый activeProject | 8/8 PASS; PATH внешней среды только Windows System32 |
| Java PlantUML и реальный browser draw.io edit/save | 6/6 PASS, 0 skip, 0 внешних запросов |
| Реальный bundled портал и встроенные «Проекты/Редактор» | 3/3 PASS, 9 таблиц отчёта, 0 JS/resource/external errors |
| Native lifecycle на private ShopFlow copy | 1 TAP test / 4 этапа PASS: валидаторы, отказ invalid model, Git apply/reload/stale, изолированные preview/snapshot |
| Совпадение source и shipped Engine/ProjectSources/Domain/NativeRuntime | SHA совпали; дополнительно 895 declared copied paths сверены с release manifest |
| Source Git после сборки/тестов | HEAD ae43 без изменений, working tree clean |
| Очистка | 0 собственных scratch/native процессов осталось |

Внешний PATH не предоставлял Node/Git/Docker. Реальный браузер — Chrome 157.0.8103.38. Проверка переноса выполнена на текущем Windows x64 в другой папке, не на втором физическом ПК/Windows 10. Целевой профиль остаётся Windows 10/11 x64 с официальными bundled runtimes. Семь дополнительных Docker сценариев не выполнялись; native opt-in, пропущенный в общей регрессии, отдельно прошёл все четыре этапа.

Артефакт: `dist/SEAF-Windows-x64-2.1.0.zip`, **495827651 байт**. SHA-256: `1f1babe5c3140a9b230c3d9e331d6b126249877e64c937d1e3e22664e4d405e7`. Manifest ID: `ead843d4acabb412019cd06d91d503236821a1167ca14a847c4b584100729616`. Оригинальная release-папка не запускалась с пользовательскими data; runtime проверки выполнялись только на распакованной scratch-копии.

Первоначальный browser harness ожидал восемь таблиц вместо девяти. Это сохранено как test-driver FAIL; ожидание исправлено по manifest-covered Markdown, затем browser stage пройден без изменения приложения/ZIP и без повтора уже успешных этапов. Прерванные старые распаковки и предыдущий candidate не считаются финальной runtime-приёмкой.

Результаты: [final-portable-acceptance.json](evidence/final-portable-acceptance.json), [final-source-functional-proof.json](evidence/final-source-functional-proof.json). Source metadata/SDD closure фиксируется отдельным коммитом после фактической приёмки; функциональные blobs и проверенный бинарный ZIP сохраняются неизменными.

## Официальное закрытие

Pinned OpenSpec 1.16.0 `archive add-portable-windows-workspace --skip-specs --yes --json` завершился успешно: архив `2026-11-07-add-portable-windows-workspace`. `--skip-specs` выбран потому, что принятые deltas уже применены pinned merger с доказательствами сохранения baseline/scenarios и no-op повторного применения. Это не пропуск проверок реализации или validation. До archive strict: 17 passed / 0 failed. Все tasks отмечены только после наблюдаемого результата.
