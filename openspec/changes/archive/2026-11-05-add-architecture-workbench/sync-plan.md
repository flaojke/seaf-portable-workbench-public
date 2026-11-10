# Sync, приёмка и техническое закрытие

## Выполненный sync

04.11.2026 в 11 master-спецификаций включены 36 ADDED requirements изменения `add-architecture-workbench`. Сохранены 11 исходных baseline requirements; в masters 47 требований и 84 сценария. Содержание baseline и наличие delta requirements подтверждены `sync-record.json`. Дельты помечены already synced и не должны добавляться в masters повторно.

## Подтверждённая приёмка

05.11.2026 матрица [coverage-all72.json](coverage-all72.json) подтверждает **72/72 функциональных сценария**, missing=0. Источники и слои доказательств перечислены для каждого случая. Используются unit/API, браузер, реальный Docker/Git и ручной внешний MCP-агент; все 72 случая не выдаются за один ручной UI-прогон.

- Node-регрессия: **66/66 PASS**, 0 fail, 0 skip; [TAP](evidence/final-regression.tap).
- Backend gates: **12/12 PASS**, включая readonly, path/security, таймауты, файлы и provenance diff, snapshots, реальный reload retry, сбой запуска/таймаут preview, создание связанных объектов.
- Browser gates: **15/15 PASS**, включая storage failure/перенос JSON, readonly, диагностику/retry, generic CRUD/bulk, полную публикацию, reload recovery, deletion impact, snapshots/preview и восстановление API.
- Draw.io: **6/6 браузерных этапов PASS**; перемещение реальной фигуры, сохранение исходного XML, валидация/Git/reload, readonly, чужие сообщения, недоступность редактора, явная синхронизация новой фигуры.
- AI: факты и отдельные источники, неоднозначные парные находки, устранение выбранного конфликта полным lifecycle. Manual external-agent review отдельно подтверждает помеченный inference; UI evidence extractor платную LLM не вызывает.
- Launcher: **2/2 PASS**; IPv4 warm start и ограниченный отказ NoBrowser без модального зависания на изолированной подмене endpoint.
- Исходный Docker E2E: **7/7 PASS**; снимки/ветка/правила/коммиты проверены на временной модели.

JSON и TAP скопированы в `evidence/`; их SHA-256 и исходные пути находятся в coverage map. Полные fixture-каталоги в архив не копируются. Исторические Uxx относятся к сохранённому `unit-tests-final.tap`, а не к номерам нового прогона.

## Действия root после аудита

1. Опубликовать финальные `workbench/documentation` через MCP propose → diff → validate → apply, проверить страницы и записать commit/reload в evidence; закрыть 15.5.
2. Повторить официальный `validate --all --strict --no-interactive`.
3. Выполнить официальный archive с `--skip-specs --yes`, поскольку ADDED уже синхронизированы. Записать фактический результат и путь CLI; только после этого закрыть 15.3 и выставить archivePerformed/performed=true.
4. Проверить masters и архивное изменение после перемещения, сохранить источники в Git. Git push — отдельное действие.

Рекомендуемая TZ для административного шага: `Europe/Moscow`. Ожидаемый префикс даты клиента — 2026-11-05; фактическое имя каталога берётся из результата CLI. Подготовленный текст документации и наличие этой инструкции не означают, что archive уже выполнен.

```powershell
$env:TZ = 'Europe/Moscow'
$env:OPENSPEC_TELEMETRY = '0'
$env:OPENSPEC_NO_UPDATE_CHECK = '1'
node openspec/tooling/node_modules/@fission-ai/openspec/bin/openspec.js validate --all --strict --no-interactive
node openspec/tooling/node_modules/@fission-ai/openspec/bin/openspec.js archive add-architecture-workbench --skip-specs --yes
```
