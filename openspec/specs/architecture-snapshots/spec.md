# Воспроизводимые снимки

## Purpose

Фиксация исходных архитектурных данных и условий их сборки для проверяемого восстановления и сравнения состояния модели.

## Requirements

### Requirement: Proposal base identity
The MCP service SHALL record the base revision type, revision ID and project content fingerprint for a proposed change, retaining Git commit context for Git projects and local revision context for directory projects.

#### Scenario: Inspect change base
- **WHEN** an agent reads a stored proposal
- **THEN** the base revision and content fingerprint used by validation are available

### Requirement: Complete snapshot manifest
The workbench SHALL produce a versioned snapshot manifest identifying the project, root manifest, revision, exact runtime identity, non-secret build settings and source/import digests. Docker images or native runtime binaries SHALL remain explicit separately available prerequisites.

#### Scenario: Capture local workspace
- **WHEN** the user creates a snapshot of a project with local imports
- **THEN** the snapshot identifies the root and imported source files with stable digests and runtime identity

#### Scenario: Protect configuration secrets
- **WHEN** snapshot settings include credential references
- **THEN** exported runtime settings include only declared non-secret settings and exclude process credentials; captured source files remain verbatim

### Requirement: Deterministic snapshot identity
The snapshot SHALL use canonical ordering and a stable content identity that is unaffected by capture time or filesystem enumeration order.

#### Scenario: Repeat unchanged capture
- **WHEN** the same source content and runtime settings are captured twice
- **THEN** the content identities match even when capture timestamps differ

### Requirement: Verifiable restore
The workbench SHALL verify the manifest, file digests and archive composition before opening a saved snapshot in an isolated portal using its stored Docker or native runtime identity, root manifest and environment. Unavailable or changed runtimes SHALL be reported rather than silently substituted.

#### Scenario: Restore complete snapshot
- **WHEN** the user loads a complete snapshot with matching file digests and supported runtime settings
- **THEN** an isolated reconstruction can be validated without modifying the current project

#### Scenario: Incomplete or tampered snapshot
- **WHEN** an imported dependency is missing or a captured file fails its digest check
- **THEN** verification reports the exact gap and does not label the snapshot reproducible

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/engine.mjs: propose, fingerprint, unchanged; seaf-mcp/README.md. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
