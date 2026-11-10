# Приёмка add-architecture-workbench

Статус 2026-11-05: **72/72 функциональных сценариев подтверждены наблюдаемыми доказательствами**. Layers указаны отдельно: unit/API, браузер, реальный Docker/Git и ручной внешний MCP-агент. Мастера синхронизированы, инструкции опубликованы, официальный archive выполнен 05.11.2026.

## Как записывать результат

Для каждого AC сохранить дату/время, версию/commit runtime, project ID, команду или шаги UI, наблюдаемый результат и путь к log/JSON/screenshot/commit. Ожидание ниже — критерий, а не готовый результат. Положительные и отрицательные сценарии одинаково обязательны. Тесты, меняющие модель, выполнять на временном writable Git-проекте; итоговый показ пользователю — на ShopFlow через штатный proposal lifecycle.

## AC-01: Автономные черновики

Спецификация: `specs/offline-drafts/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Автономные черновики**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-01-01 | Offline local persistence: Resume offline draft | the draft restores its project, base state, operations, and last saved status without publishing changes | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-01-02 | Offline local persistence: Unavailable local storage | the user sees that saving failed and can export the draft instead of receiving a success indication | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-01-03 | Portable draft exchange: Exchange a draft | the same operations and base identity are available for review without applying them | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-01-04 | Portable draft exchange: Reject incompatible draft | the workbench reports the mismatch before accepting operations | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-01-05 | Conflict aware publication: Publish unchanged base | the user can inspect one proposal and validate it through the existing write lifecycle | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-01-06 | Conflict aware publication: Concurrent project change | publication is blocked with a conflict explanation and the draft remains available for deliberate reconciliation | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-01-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-02: Подключение и диагностика

Спецификация: `specs/connection-diagnostics/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Подключение и диагностика**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-02-01 | Project connection wizard: Connect ShopFlow | the wizard shows the project identity and writable status before the user starts editing | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-02-02 | Project connection wizard: Read only source project | the wizard permits reading and explains that write operations are unavailable | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-02-03 | Independent readiness checks: Partial service outage | diagnostics identify the failing portal check and preserve the successful results | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-02-04 | Independent readiness checks: Missing validation runtime | diagnostics explain the missing prerequisite before publishing a draft | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-02-05 | Bounded and safe recovery: Retry after recovery | the wizard reruns the relevant check and updates its status | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-02-06 | Bounded and safe recovery: Unreachable endpoint | the check ends with an explicit timeout result and the UI remains usable | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-02-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-03: Точечное и пакетное редактирование

Спецификация: `specs/object-editing/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Точечное и пакетное редактирование**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-03-01 | Generic single object editing: Edit a system owner | the editor retains unrelated properties and offers a proposed diff | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-03-02 | Generic single object editing: Custom object type | the editor exposes its objects and permits structured editing without a hardcoded ShopFlow component type | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-03-03 | Explicit property operations: Remove one property | the diff removes that property while retaining other properties | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-03-04 | Explicit property operations: Replace entire object | the diff shows every resulting property addition, change, and deletion | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-03-05 | Atomic bulk proposal: Create linked objects | one diff and one validation result cover the entire operation set | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-03-06 | Atomic bulk proposal: Invalid operation in batch | the batch is rejected before a partial Git commit is made | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-03-07 | Deletion impact and publication: Delete referenced component | the workbench shows those references and validation blocks an inconsistent result | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-03-08 | Deletion impact and publication: Reload failure after commit | the workbench shows the saved commit and retryable reload failure separately without repeating the write | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-03-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-04: Воспроизводимые снимки

Спецификация: `specs/architecture-snapshots/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Воспроизводимые снимки**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-04-01 | Complete snapshot manifest: Capture local workspace | the snapshot identifies the root and imported source files with stable digests and runtime identity | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BACKEND,BROWSER |
| AC-04-02 | Complete snapshot manifest: Protect configuration secrets | exported runtime settings exclude process credentials; captured source files remain verbatim | PASS: [проверяемые источники](coverage-all72.json), BACKEND |
| AC-04-03 | Deterministic snapshot identity: Repeat unchanged capture | the content identities match even when capture timestamps differ | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BACKEND |
| AC-04-04 | Verifiable restore: Restore complete snapshot | an isolated reconstruction can be validated without modifying the current project | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BACKEND,BROWSER |
| AC-04-05 | Verifiable restore: Incomplete or tampered snapshot | verification reports the exact gap and does not label the snapshot reproducible | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BACKEND |
| AC-04-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-05: Фокус на подграфе

Спецификация: `specs/subgraph-focus/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Фокус на подграфе**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-05-01 | Bounded neighbourhood focus: Focus order neighbourhood | the result includes the order component and its directly referenced neighbours without unrelated disconnected components | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-05-02 | Bounded neighbourhood focus: Follow incoming links | the result follows links targeting the selected component | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-05-03 | Traceable graph results: Open graph evidence | the workbench shows the corresponding source identity | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-05-04 | Traceable graph results: Unknown link target | the view marks the endpoint unresolved instead of inventing a component | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BACKEND |
| AC-05-05 | Non destructive bounded rendering: Large graph limit | the view reports truncation and remains usable without editing the model | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-05-06 | Non destructive bounded rendering: Clear focus | the full model remains unchanged and can be viewed again | PASS: [проверяемые источники](coverage-all72.json), BROWSER |
| AC-05-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-06: Потоки данных и зоны доверия

Спецификация: `specs/dataflow-trust/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Потоки данных и зоны доверия**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-06-01 | Explicit flow annotations: Describe order delivery flow | the flow view exposes its endpoints, data class, protocol, and trust-zone assignments | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-06-02 | Explicit flow annotations: Unknown classification | the view marks the missing value as unknown rather than assuming a safe classification | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-06-03 | Trust boundary findings: Cross boundary sensitive flow | the report identifies the flow, zones, policy, and source artifacts | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-06-04 | Trust boundary findings: Allowed boundary flow | the result distinguishes the allowed crossing from a violation | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-06-05 | Safe annotation edits: Update a trust zone | the workbench presents the resulting model changes for validation before any commit | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-06-06 | Safe annotation edits: Inspect reference source | analysis remains available while save operations are disabled | PASS: [проверяемые источники](coverage-all72.json), BACKEND,BROWSER |
| AC-06-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-07: Семантический diff

Спецификация: `specs/semantic-diff/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Семантический diff**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-07-01 | Entity and property comparison: Add Delivery Service | the comparison identifies the added component and its declared links | PASS: [проверяемые источники](coverage-all72.json), BACKEND |
| AC-07-02 | Entity and property comparison: Change an owner | the comparison identifies the component, owner path, previous value, and new value | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-07-03 | Formatting independent comparison: Reformat source | the semantic result contains no architecture property changes | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-07-04 | Formatting independent comparison: Change ordered scenario steps | the semantic result identifies that ordered value change | PASS: [проверяемые источники](coverage-all72.json), BACKEND |
| AC-07-05 | Review provenance and ambiguity: Rename without mapping | the result shows the old identity removed and the new identity added | PASS: [проверяемые источники](coverage-all72.json), BACKEND |
| AC-07-06 | Review provenance and ambiguity: Verify semantic result | the workbench provides the related source paths and the underlying file difference | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BACKEND |
| AC-07-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-08: Preview портала для ветки

Спецификация: `specs/branch-preview/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Preview портала для ветки**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-08-01 | Ref bound isolated preview: Preview a feature branch | the preview identifies the resolved commit and opens a distinct URL while the live project state remains unchanged | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-08-02 | Ref bound isolated preview: Invalid ref | the workbench reports the failure without changing the current project | PASS: [проверяемые источники](coverage-all72.json), BACKEND |
| AC-08-03 | Preview lifecycle visibility: Stop a preview | only the selected preview runtime is stopped and its expiry record is removed without changing the live portal | PASS: [проверяемые источники](coverage-all72.json), BASELINE,BROWSER |
| AC-08-04 | Preview lifecycle visibility: Runtime start failure | the workbench reports the failed stage and does not claim the preview is available | PASS: [проверяемые источники](coverage-all72.json), BACKEND |
| AC-08-05 | No implicit preview publication: Inspect branch content | no merge, live reload, or Git push is triggered | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-08-06 | No implicit preview publication: Limit concurrent previews | new requests receive an actionable limit result instead of creating unmanaged runtimes | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-08-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-09: Ответы с проверяемыми источниками

Спецификация: `specs/grounded-answers/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Ответы с проверяемыми источниками**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-09-01 | Claim level evidence records: Answer checkout participants | each claimed participant or interaction is linked to the relevant project source and entity identity | PASS: [проверяемые источники](coverage-all72.json), AI |
| AC-09-02 | Claim level evidence records: Read document evidence | the evidence includes the document path, excerpt or location, and content identity | PASS: [проверяемые источники](coverage-all72.json), BASELINE,AI |
| AC-09-03 | Unknown and inferred answers: Unknown integration | the answer states that evidence is unavailable and does not invent an endpoint | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-09-04 | Unknown and inferred answers: Inference from naming | the answer labels the statement as an inference rather than a sourced fact | PASS: [проверяемые источники](coverage-all72.json), EXTERNAL |
| AC-09-05 | Evidence freshness and trust: Source changed after answer | verification marks the evidence stale and allows a fresh read | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-09-06 | Evidence freshness and trust: Instruction inside a source document | the answer treats the text as document content and does not execute it | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-09-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-10: Противоречия между источниками

Спецификация: `specs/source-contradictions/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Противоречия между источниками**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-10-01 | Paired contradiction evidence: Different service owners | the report shows both asserted values and both sources | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-10-02 | Paired contradiction evidence: Document conflicts with model | the report cites the document claim and the conflicting model definition | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-10-03 | Explicit uncertainty: Only one source has a value | the result identifies missing evidence rather than a confirmed incompatible value | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-10-04 | Explicit uncertainty: Ambiguous document statement | the result is marked for review and includes its uncertainty | PASS: [проверяемые источники](coverage-all72.json), BROWSER,AI |
| AC-10-05 | Review without implicit edits: Run contradiction review | the system returns findings without changing or committing files | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-10-06 | Review without implicit edits: Resolve selected conflict | a scoped diff is proposed and validated before a local Git commit | PASS: [проверяемые источники](coverage-all72.json), AI |
| AC-10-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-11: Draw.io: импорт, экспорт и редактирование

Спецификация: `specs/drawio-roundtrip/spec.md` в этом change. Обязательная страница меню: **Доработки LSV → Draw.io: импорт, экспорт и редактирование**.

| ID | Requirement / Scenario | Проверяемый результат | Evidence / статус |
| --- | --- | --- | --- |
| AC-11-01 | Recognised diagram import: Import connected shapes | the import preview shows candidate components and their recognised relationships | PASS: [проверяемые источники](coverage-all72.json), BASELINE,DRAWIO |
| AC-11-02 | Recognised diagram import: Unsupported or dangling elements | the preview identifies those elements and does not silently invent endpoints | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-03 | Recognised diagram import: Malformed or excessive input | import ends with a clear error without applying any source changes | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-11-04 | Stable identity model export: Export ShopFlow context | the resulting file opens as draw.io XML and retains project components, links, SEAF identities, and supported custom properties | PASS: [проверяемые источники](coverage-all72.json), BASELINE |
| AC-11-05 | Stable identity model export: Reimport an exported view | existing entities are matched by stable identity instead of duplicated | PASS: [проверяемые источники](coverage-all72.json), BASELINE,DRAWIO |
| AC-11-06 | Embedded existing diagram editing: Edit existing diagram | the diff targets the original draw.io artifact and the saved commit and reload status are reported | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-07 | Embedded existing diagram editing: Read only diagram | the diagram can be inspected but source saving is unavailable | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-08 | Explicit model synchronisation: Layout only edit | the diagram geometry changes while architecture entity definitions remain unchanged | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-09 | Explicit model synchronisation: Synchronise a new shape | the proposal includes the chosen object definition and any required imports for review | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-10 | Trusted embed messages: Unexpected message origin | the workbench ignores the message without saving a file | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-11 | Trusted embed messages: Editor unavailable | the UI reports editor availability and preserves the current diagram content | PASS: [проверяемые источники](coverage-all72.json), DRAWIO |
| AC-11-DOC | Инструкция и пример | Страница открывается в меню, объясняет как пользоваться и содержит воспроизводимый ShopFlow пример, ограничения и фактический результат | PASS: PUB, PORTAL; подробности — evidence.json |

## AC-INT: общие release gates

| ID | Проверка | Требуемое доказательство | Evidence / статус |
| --- | --- | --- | --- |
| AC-INT-01 | Полный write lifecycle | Diff, успешная runtime validation, один Git commit, portal status; push не выполнен | PASS: E2E02, PUB; подробности — evidence.json |
| AC-INT-02 | Универсальность | Операции на втором временном проекте с другими entity sections и IDs | PASS: U04, U45; подробности — evidence.json |
| AC-INT-03 | Read-only и границы путей | Сервер отвергает запись readonly и traversal/absolute path; исходники и Git неизменны | PASS: [BACKEND](evidence/backend.json), [BROWSER](evidence/browser.json) |
| AC-INT-04 | Локальный API | Отклонены неподходящие Origin/CSRF; сервер не открыт на произвольный внешний интерфейс | PASS: U09; подробности — evidence.json |
| AC-INT-05 | Неверная модель и stale proposal | Отклонение без частичной записи, проект не повреждён | PASS: U04, U05, E2E02, E2E03, E2E04; подробности — evidence.json |
| AC-INT-06 | Ошибка reload после commit | Сохранённый commit показан; retry обновляет журнал и портал без нового коммита | PASS: [BACKEND](evidence/backend.json), [BROWSER](evidence/browser.json) |
| AC-INT-07 | Документация | В меню присутствуют 11 how-to страниц и SDD, сохранены MCP/производительность | PASS: PUB, PORTAL; подробности — evidence.json |
| AC-INT-08 | OpenSpec | validate --all --strict; нет незавершённой реализации/QA; административное archive фиксируется отдельно после выполнения | PASS: SPEC, [72-case map](coverage-all72.json) |

## Журнал фактических прогонов

| Источник | Наблюдаемый результат | Локальная копия |
| --- | --- | --- |
| Финальная Node-регрессия | 66/66 PASS, 0 fail, 0 skip | [TAP](evidence/final-regression.tap) |
| Backend fault gates | 12/12 PASS: readonly, secrets, timeouts, semantic provenance, snapshots, actual reload retry/preview cleanup/linked creations | [JSON](evidence/backend.json), [TAP](evidence/backend-gates.tap) |
| Browser gates | 15/15 PASS: storage failures/export, project restore, diagnostics, readonly, graph, CRUD/bulk, saved commit/retry, deletion impact, snapshots/preview, API recovery | [JSON](evidence/browser.json) |
| Draw.io browser gates | 6/6 PASS: actual canvas drag, original XML save, validation/Git/reload, readonly, hostile messages, unavailable editor, new mapped shape/unmapped warnings | [JSON](evidence/drawio.json) |
| AI gates | Individually verified checkout facts, paired ambiguous conflict, selected conflict resolution with actual validation/Git/reload | [JSON](evidence/ai.json) |
| External inference | Manual connected Codex MCP agent labels a naming inference, cites facts and states missing information | [Review](evidence/external.json) |
| Launcher | Real IPv4 warm start and bounded NoBrowser failure without a modal hang; fixture-only endpoint overrides | [JSON](evidence/launcher.json) |
| Core Docker E2E | 7/7 isolated steps; runtime validation, stale/replay, trust rules, branch/snapshot preview and draw.io | [JSON](evidence/e2e.json) |

Общая матрица: [coverage-all72.json](coverage-all72.json). Она содержит ожидаемый результат, слой доказательства, имя кейса, исходный путь и SHA-256. Первичные unit-индексы Uxx относятся к [историческому TAP](unit-tests-final.tap) и [baseline evidence](baseline-evidence.json), а не к номеру теста в новом 66-test прогоне. Это позволяет сохранить исходные проверенные случаи без изменения их смысла.

## Статус закрытия

Функциональные сценарии: **72 PASS, 0 PARTIAL, 0 NOT RUN**. Дополнительно сохранена исходная публикация 11 how-to страниц и SDD и проверка всех 12 страниц портала. Свежие инструкции опубликованы через MCP; commit 94ff24ebf714c96be921bf5fd4ffed2868862509, reload updated, problems=[]. Официальный archive подтверждён evidence/official-archive.json.

Все тестовые коммиты выполнялись на временных собственных Git-проектах. Browser/draw.io/AI/E2E отчёты подтверждают productionUnchanged; ошибочные пробы и снимки failure не выдаются за успешные доказательства.

Встроенный ассистент остаётся evidence-extraction. Manual external-agent review подтверждает отдельный путь подключённого агента, а не вызов платной LLM из интерфейса. Снимки сохраняют источники дословно и идентичность runtime; Docker image bytes и автоматическая очистка секретов из архитектурных файлов в них не включены.


## Фактическое завершение

Официальный archive выполнен 05.11.2026: `2026-11-05-add-architecture-workbench`. Задачи 61/61; незавершённых нет. Инструкции опубликованы через MCP (94ff24eb), фактический статус закрытия опубликован отдельным коммитом 931b803518527293b206001fb3a727859d5f065a. Оба reload updated, problems=[]. Матрица 72/72 функциональных сценариев и финальный TAP 66/66 хранятся рядом.
