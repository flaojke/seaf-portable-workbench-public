# OpenSpec для доработок SEAF

Этот каталог описывает требования и доказательства доработок форка SEAF. Команды ниже выполняются из корня **source Git**, независимо от его расположения на компьютере.

- `specs/<capability>/spec.md` — принятые master-требования. Синхронизация требований сама по себе не доказывает завершение реализации или поставки.
- `changes/<change>/` — активные изменения: proposal, design, delta specs, tasks, acceptance и evidence. Фактический список активных изменений показывает CLI `list`.
- `changes/archive/<дата>-<change>/` — завершённые и официально архивированные изменения с сохранённой историей проверок.
- `tooling/package.json` и `tooling/package-lock.json` — закреплённый инструмент разработки `@fission-ai/openspec@1.16.0`.

## Каталог требований

Каталог содержит **16 capabilities**:

| Capability | Назначение |
| --- | --- |
| `architecture-snapshots` | Воспроизводимые снимки модели и проверка runtime identity |
| `branch-preview` | Изолированный preview Git-версии или локальной ревизии |
| `connection-diagnostics` | Подключение источников и раздельная диагностика prerequisites |
| `dataflow-trust` | Потоки данных и границы доверия |
| `drawio-roundtrip` | Импорт, экспорт, редактирование и сохранение draw.io |
| `grounded-answers` | Ответы с проверяемыми источниками и свежестью evidence |
| `local-project-history` | Immutable история обычных папок без создания `.git` |
| `object-editing` | Формы, справочники, точечные и пакетные изменения |
| `offline-drafts` | Автономные черновики и безопасная публикация |
| `portable-windows-distribution` | Переносимая Windows-поставка и воспроизводимая сборка |
| `project-connections` | Проекты: папки/Git, активный источник, версии, ZIP и удаление |
| `repository-authoring-guide` | Требования к репозиториям, зависимости, справочники и схемы/L2 |
| `repository-layout-performance` | Сопоставимые объёмные тесты структур и рекомендации по миграции |
| `semantic-diff` | Семантические изменения сущностей и свойств |
| `source-contradictions` | Противоречия между источниками |
| `subgraph-focus` | Фокус на окрестности выбранного компонента |

## CLI в source Git

Для разработки требуется Node.js 22.12 или новее. Восстановите локальный CLI из lockfile; глобальная установка и изменение настроек IDE не нужны. Первичная установка dependencies может требовать сети:

```powershell
$env:OPENSPEC_TELEMETRY = '0'
$env:OPENSPEC_NO_UPDATE_CHECK = '1'
npm ci --ignore-scripts --no-audit --no-fund --prefix openspec/tooling
$seafOpenSpecCli = 'openspec/tooling/node_modules/@fission-ai/openspec/bin/openspec.js'
node $seafOpenSpecCli list --specs
node $seafOpenSpecCli list
node $seafOpenSpecCli validate --all --strict --no-interactive
```

Для конкретного **активного** изменения используйте его имя из `list`:

```powershell
$seafChange = 'имя-активного-изменения'
node $seafOpenSpecCli status --change $seafChange
node $seafOpenSpecCli show $seafChange --diff
```

`tooling/node_modules` не хранится в Git и **не является частью runtime SEAF**. Переносимый комплект содержит master-документы для справки; запуск портала, редактора и MCP не требует CLI OpenSpec. Изменять спецификации следует в source Git. Результат strict validation проверяет структуру требований, а работоспособность подтверждают отдельные runtime/browser/package receipts.

## Процесс изменения

1. Прочитать relevant master и активные изменения. Создать новый change через тот же локальный CLI: `node $seafOpenSpecCli new change имя-изменения`.
2. Подготовить proposal, дельта-спецификации, design и tasks. Проверить формат `validate --all --strict`.
3. Реализовать функцию и выполнить сценарии из `acceptance.md`. Отдельно проверить рабочую документацию в разделе LSV
4. Вписать фактический результат, команду, дату и путь к доказательству в acceptance. Отметить только проверенные tasks.
5. Синхронизировать принятые дельты штатным merger/workflow, сохранив baseline-требования и сценарии. Повторное применение должно быть no-op. Ранний sync не архивирует изменение и не закрывает непроверенные release gates.
6. Только после всех проверок выполнить официальный archive и повторить strict validation:

```powershell
node $seafOpenSpecCli archive $seafChange --yes --json
node $seafOpenSpecCli validate --all --strict --no-interactive
```

Архивирование сохраняет материалы в `changes/archive/`; имя созданного архива берётся из результата CLI. Для незавершённого change archive не запускается.

## История завершённых работ

- [Workbench — 05.11.2026](changes/archive/2026-11-05-add-architecture-workbench/acceptance.md): историческая приёмка 72 сценариев и 66/66 тестов относится к этой поставке, а не автоматически к последующим изменениям.
- [Исследование структуры репозитория — 06.11.2026](changes/archive/2026-11-06-benchmark-project-layouts/acceptance.md): синтетические модели 1000/3000 систем, измерения, ограничения и рекомендации.
- [Переносимая Windows-поставка — 07.11.2026](changes/archive/2026-11-07-add-portable-windows-workspace/acceptance.md): локальные/Git-проекты, редактор, offline runtime, clean-source build и проверенная распаковка/перенос.

Статус последующих доработок определяется их собственными tasks/acceptance/evidence и фактическим расположением в active/archive, без фиксированного «единственного рабочего change» в этом README.
