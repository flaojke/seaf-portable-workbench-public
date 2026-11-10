# Автономные черновики

## Purpose

Сохранение подготовленных архитектурных изменений до применения и безопасное продолжение работы без изменения опубликованной модели.

## Requirements

### Requirement: Durable proposals
The MCP service SHALL persist a proposal and its diff before validation or application.

#### Scenario: Read an existing proposal
- **WHEN** an agent requests a saved proposal by its identifier
- **THEN** the service returns the proposed file changes and their base project state without applying them

### Requirement: Offline local persistence
The workbench SHALL preserve an editable project draft locally without requiring an available portal or write API.

#### Scenario: Resume offline draft
- **WHEN** a user saves a ShopFlow draft, closes the workbench, and reopens the same browser profile offline
- **THEN** the draft restores its project, base state, operations, and last saved status without publishing changes

#### Scenario: Unavailable local storage
- **WHEN** local persistence fails or storage quota is exhausted
- **THEN** the user sees that saving failed and can export the draft instead of receiving a success indication

### Requirement: Portable draft exchange
The workbench SHALL export and import a versioned draft containing project identity, base state, and pending operations.

#### Scenario: Exchange a draft
- **WHEN** a user exports a draft and imports it in a fresh workbench session
- **THEN** the same operations and base identity are available for review without applying them

#### Scenario: Reject incompatible draft
- **WHEN** an imported draft has an unsupported version, invalid structure, or another project identity
- **THEN** the workbench reports the mismatch before accepting operations

### Requirement: Conflict aware publication
The workbench SHALL compare the draft base revision and imported workspace fingerprint with the current Git or directory project before producing an applicable proposal.

#### Scenario: Publish unchanged base
- **WHEN** connectivity returns and the draft base matches the current project
- **THEN** the user can inspect one proposal and validate it through the existing write lifecycle

#### Scenario: Concurrent project change
- **WHEN** the current revision or imported workspace differs from the draft base
- **THEN** publication is blocked with a conflict explanation and the draft remains available for deliberate reconciliation

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: propose_change, state/<uuid>; seaf-mcp/engine.mjs: propose. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
