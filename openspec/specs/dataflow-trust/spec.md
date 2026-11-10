# Потоки данных и зоны доверия

## Purpose

Описание направлений передачи данных и границ доверия в архитектурной модели для явного анализа интеграций и предупреждений.

## Requirements

### Requirement: Architecture links remain model data
The SEAF model SHALL preserve component link definitions and additional model properties as source data available for analysis.

#### Scenario: Read integration definition
- **WHEN** an agent reads a project component with links and extension properties
- **THEN** the source definition retains link endpoints and declared properties

### Requirement: Explicit flow annotations
The workbench SHALL represent a data flow with source, target, protocol, data classification, and declared trust-zone assignments.

#### Scenario: Describe order delivery flow
- **WHEN** the user records an orders-to-delivery flow with order address data and a protocol
- **THEN** the flow view exposes its endpoints, data class, protocol, and trust-zone assignments

#### Scenario: Unknown classification
- **WHEN** a flow lacks a data class or an endpoint trust zone
- **THEN** the view marks the missing value as unknown rather than assuming a safe classification

### Requirement: Trust boundary findings
The workbench SHALL report flows crossing declared trust zones and evaluate configured policy checks with traceable source references.

#### Scenario: Cross boundary sensitive flow
- **WHEN** a declared sensitive flow crosses zones and violates a configured policy
- **THEN** the report identifies the flow, zones, policy, and source artifacts

#### Scenario: Allowed boundary flow
- **WHEN** a cross-zone flow satisfies a configured policy
- **THEN** the result distinguishes the allowed crossing from a violation

### Requirement: Safe annotation edits
Changes to data flows and trust zones SHALL use the common proposal, diff, validation, Git, and reload lifecycle. Explicit violations of matching trust policies and unresolved component endpoints SHALL block validation before publication.

#### Scenario: Update a trust zone
- **WHEN** the user changes an entity zone in a writable project
- **THEN** the workbench presents the resulting model changes for validation before any commit

#### Scenario: Inspect reference source
- **WHEN** the user opens trust information in a read-only project
- **THEN** analysis remains available while save operations are disabled

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/engine.mjs: loadModel merge; seaf-docker/workspace/microservices-demo/architecture/components.yaml. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.
