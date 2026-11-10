# Preview портала для ветки

## Purpose

Изолированный просмотр альтернативного состояния архитектурного проекта без переключения рабочего Git-проекта или изменения действующего портала.

## Requirements

### Requirement: Isolated validation workspace
The MCP validator SHALL evaluate a proposal in a copied workspace using its configured SEAF runtime. Docker validation SHALL disable network and exposed ports; native validation SHALL use loopback, bounded owned processes and local imports without changing the live project.

#### Scenario: Validate a draft
- **WHEN** the agent validates a proposal
- **THEN** the current project is not replaced and validation runs against an isolated copy

### Requirement: Ref bound isolated preview
The workbench SHALL create a distinct portal preview for a resolved Git commit or saved directory revision without changing the live project or live portal configuration.

#### Scenario: Preview a feature branch
- **WHEN** the user requests a preview for an existing project branch
- **THEN** the preview identifies the resolved commit and opens a distinct URL while the live project state remains unchanged

#### Scenario: Invalid ref
- **WHEN** the requested ref cannot be resolved
- **THEN** the workbench reports the failure without changing the current project

### Requirement: Preview lifecycle visibility
The workbench SHALL expose preview preparation status, failures, URL, and an explicit stop action. Preview expiry records SHALL survive service restarts; new service instances SHALL resume expiry scheduling. Concurrent starts SHALL respect the configured preview limit.

#### Scenario: Stop a preview
- **WHEN** the user stops an active preview
- **THEN** only the selected preview runtime is stopped and its expiry record is removed without changing the live portal

#### Scenario: Runtime start failure
- **WHEN** the isolated preview runtime cannot become ready
- **THEN** the workbench reports the failed stage and does not claim the preview is available

### Requirement: No implicit preview publication
A preview SHALL remain isolated from live writes and SHALL not implicitly commit, merge, or push its source state.

#### Scenario: Inspect branch content
- **WHEN** the user navigates a preview of another branch
- **THEN** no merge, live reload, or Git push is triggered

#### Scenario: Limit concurrent previews
- **WHEN** the configured preview resource limit is reached
- **THEN** new requests receive an actionable limit result instead of creating unmanaged runtimes

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: validate_change; seaf-mcp/engine.mjs: validate. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
