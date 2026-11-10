# Семантический diff

## Purpose

Проверяемое объяснение смысловых изменений архитектурных сущностей, свойств и связей при сохранении доступа к исходным файловым различиям.

## Requirements

### Requirement: File diff review
The MCP service SHALL return a file-level diff for a proposed architecture change before application.

#### Scenario: Review a proposal
- **WHEN** an agent proposes related source changes
- **THEN** the response contains the diff needed to inspect the resulting file edits

### Requirement: Entity and property comparison
The workbench SHALL classify additions, removals, and changed property paths by entity section and identifier for two model states.

#### Scenario: Add Delivery Service
- **WHEN** one state contains demo.shop.delivery and the other does not
- **THEN** the comparison identifies the added component and its declared links

#### Scenario: Change an owner
- **WHEN** only the owner property of an existing component changes
- **THEN** the comparison identifies the component, owner path, previous value, and new value

### Requirement: Formatting independent comparison
Semantic comparison SHALL ignore YAML formatting and object-key ordering while retaining meaningful values and array ordering.

#### Scenario: Reformat source
- **WHEN** two sources differ only in indentation, comments, or mapping-key order
- **THEN** the semantic result contains no architecture property changes

#### Scenario: Change ordered scenario steps
- **WHEN** an ordered list of scenario steps changes sequence
- **THEN** the semantic result identifies that ordered value change

### Requirement: Review provenance and ambiguity
The semantic diff SHALL preserve source references and expose raw file diff; identity changes SHALL appear as removal and addition unless an explicit identity mapping is supplied.

#### Scenario: Rename without mapping
- **WHEN** a component identifier changes without an explicit rename mapping
- **THEN** the result shows the old identity removed and the new identity added

#### Scenario: Verify semantic result
- **WHEN** the user opens a semantic change item
- **THEN** the workbench provides the related source paths and the underlying file difference

### Requirement: Source mode independent comparison
The workbench SHALL compare Git refs and saved local directory revisions using the same semantic classification, file diff and source provenance.

#### Scenario: Compare directory history
- **WHEN** two existing local revisions are selected
- **THEN** the comparison reports entity and file changes without requiring a Git repository

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: propose_change; seaf-mcp/engine.mjs: propose. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
