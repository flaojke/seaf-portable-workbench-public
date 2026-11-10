# Подключение и диагностика

## Purpose

Проверка готовности локального окружения и зарегистрированного проекта перед просмотром и изменением архитектуры через SEAF.

## Requirements

### Requirement: Docker readiness feedback
The existing launcher SHALL stop with an actionable error when Docker Engine is unavailable.

#### Scenario: Unavailable Docker Engine
- **WHEN** a user runs the launcher while Docker Engine cannot be reached
- **THEN** the launcher reports that Docker Desktop must be started instead of claiming that SEAF is running

### Requirement: Project connection wizard
The workbench SHALL provide connection flows for registered projects, existing Git clones, supported HTTPS/SSH Git URLs and Windows directories, showing source type, portal, manifest, runtime and write capability before use.

#### Scenario: Connect ShopFlow
- **WHEN** the user selects the registered shopflow project
- **THEN** the wizard shows the project identity and writable status before the user starts editing

#### Scenario: Read only source project
- **WHEN** the user selects a downloaded read-only project
- **THEN** the wizard permits reading and explains that write operations are unavailable

### Requirement: Independent readiness checks
The wizard SHALL report separate API, project, source-history, portal and configured validation-runtime checks. Git and Docker SHALL be required only for the source and runtime modes that use them.

#### Scenario: Partial service outage
- **WHEN** the portal is unavailable but the API and project are readable
- **THEN** diagnostics identify the failing portal check and preserve the successful results

#### Scenario: Missing validation runtime
- **WHEN** the selected project cannot run its configured validator
- **THEN** diagnostics explain the missing prerequisite before publishing a draft

### Requirement: Bounded and safe recovery
Diagnostics SHALL provide retryable, bounded checks and recovery guidance without executing privileged or destructive actions automatically.

#### Scenario: Retry after recovery
- **WHEN** the user resolves a failed prerequisite and chooses retry
- **THEN** the wizard reruns the relevant check and updates its status

#### Scenario: Unreachable endpoint
- **WHEN** a configured endpoint does not respond before its timeout
- **THEN** the check ends with an explicit timeout result and the UI remains usable

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-docker/start.ps1; seaf-mcp/projects.json; seaf-mcp/README.md. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
