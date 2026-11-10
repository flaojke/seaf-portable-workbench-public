# Приёмка исследования структуры репозитория

Проверено 06.11.2026 на синтетических моделях; корпоративный архив не использовался. Это исследование текущего Windows native SEAF core 2026.33.0, а не приёмка всей переносимой поставки из отдельного change.

## Наблюдаемые проверки

- Fixtures: 7 layouts × 1000/3000 систем, 3 интеграции на систему; 14/14 canonical Engine.model proofs. В настоящем runtime одинаковы components/integrations/contexts/catalogs hashes и counts.
- Fixtures/probe unit checks: 9/9 PASS, включая обнаружение изменённого исходника и выполнение JSONata реестра.
- Native file: 42/42 независимых process samples, 0 failures; по два unchanged-source reload, first/warm browser UI и PlantUML 50 с проверкой всех подписей. Chrome first UI — видимая строка, не полная отрисовка всех строк.
- Controlled HTTP: 21/21 samples на 1000 систем, 0 failures, задержка 10 мс/request, два reload; без browser. Это не GitLab/WAN benchmark.
- Raw source: 14/14 cases × 5 запросов, побайтное совпадение defining YAML; отдельно bytes/UTF-16 chars и лимит MCP/Workbench 500000 символов.
- Один CPU profile baseline3000 reload: PASS, модель до/после совпала, собственный worker завершился с code 0. Этот profiled timing не включён в сравнительные медианы.
- После серий Windows CIM проверка показала 0 оставшихся benchmark worker процессов, 2026-11-06T20:51:26Z.
- OpenSpec strict до архивирования: 13 passed / 0 failed.

## Публикация документации через MCP

Порядок: list_projects → read_artifact → propose_change → get_proposal/inspection → validate_change → apply_change.

ShopFlow: proposal `8eda3685-7470-4935-86df-6c90a037f874`. Реальный diff меняет только docs.yaml и добавляет docs/lsv/repository-layout.md. 15 validators, 0 problems. Git commit `2d323644622a438be64b14714dd370d82f51af18`, status applied, reload updated / problems []. Документ: `local.lsv.repository_layout`, меню «Доработки LSV / 19. Структура репозитория — измерения и рекомендации».

Копия переносимого примера: proposal `26b2ada0-01f1-4abf-aa3c-709e5cc30164`, 15 validators / 0 problems. Все 22 страницы совпали с reviewed templates; применена также ранее подготовленная документация portable/SEAF. Directory revision `007b25e1d8865e0b4359b3f97a451f48f17e119498abdac80e2140f005a65f3c`, reload not_configured (это исходный пример без отдельного работающего portal). Git-коммит в обычной папке не создавался.

Финальная проверка настоящим Chrome — PASS, 2026-11-06T20:52:33Z. Видимы заголовок, 8 таблиц, 1000/3000 и контрольные значения 3.711 / 15.239. Menu route и location совпали; 15 validators / 0 problems, pageErrors / failedResources / badScriptResponses пусты. Скриншот таблицы 3000 систем визуально просмотрен. Source native портал оставлен работать на localhost:8080; тестовые workers завершены.

evidence/checks.json: PASS, 42 file + 21 HTTP + 14 raw cases / 70 responses, 84+42 reload, 126 browser phases. Сохранены реальные counts/hashes, timings, probes, отрицательный SmartAnts, профиль, unit TAP, cleanup и browser receipt. Измерения при подготовке отчёта не повторялись.

## Результат и ограничения

Официальный pinned OpenSpec CLI `archive benchmark-project-layouts --yes --json` завершился успешно: архив `2026-11-06-benchmark-project-layouts`, specsUpdated true, добавлены 3 requirements. Master `openspec/specs/repository-layout-performance/spec.md` создан, Purpose уточнён. Финальный `validate --all --strict --no-interactive`: **13 passed / 0 failed**, вывод сохранён в evidence/openspec-final.txt. Отдельный change `add-portable-windows-workspace` остаётся активным; исследование не выдаётся за завершение переносимой поставки.

Полные таблицы и разброс: docs/performance/repository-layout/REPORT.md. Машиночитаемые медианы: summary.json / measurements.csv. Рекомендован гибрид: пакеты по ответственности, отдельный manifest для сложной LTI. V6 измеряет фиксированные группы 20 последовательных ID, а не настоящие бизнес-домены; размер 20 не объявляется оптимумом.

Один отрицательный SmartAnts smoke100/focus50 сохранён отдельно: ошибка маршрутизации не превращена в успешный PlantUML result. Общая исправленная версия renderer CORS RqUID применена до основных сравнений. Корпоративная метамодель, Docker/Linux, реальный WAN/GitLab, concurrent users/RPS, peak memory, cold physical disk и полная схема 3000 узлов не тестировались.
