# Фокус на подграфе

## Purpose

Исследование локальных связей выбранного архитектурного компонента с сохранением происхождения узлов и без изменения исходной модели.

## Requirements

### Requirement: Direct dependency lookup
The MCP service SHALL expose incoming and outgoing component dependencies for a selected project component.

#### Scenario: Inspect order dependencies
- **WHEN** an agent requests dependencies of demo.shop.orders
- **THEN** the service returns the available incoming and outgoing links from the project model

### Requirement: Bounded neighbourhood focus
The workbench SHALL display a selected entity neighbourhood with user-selected traversal direction and bounded depth.

#### Scenario: Focus order neighbourhood
- **WHEN** the user selects demo.shop.orders, outgoing direction, and depth one
- **THEN** the result includes the order component and its directly referenced neighbours without unrelated disconnected components

#### Scenario: Follow incoming links
- **WHEN** the user switches the same focus to incoming direction
- **THEN** the result follows links targeting the selected component

### Requirement: Traceable graph results
The focused view SHALL identify the source project, artifact, and entity for each resolved node and expose unresolved endpoints.

#### Scenario: Open graph evidence
- **WHEN** the user selects a node or edge in the focused view
- **THEN** the workbench shows the corresponding source identity

#### Scenario: Unknown link target
- **WHEN** a traversed link refers to an entity absent from the loaded model
- **THEN** the view marks the endpoint unresolved instead of inventing a component

### Requirement: Non destructive bounded rendering
Graph focus SHALL preserve source data and report truncation when traversal exceeds configured depth or element limits.

#### Scenario: Large graph limit
- **WHEN** a graph contains more reachable nodes than the configured element limit
- **THEN** the view reports truncation and remains usable without editing the model

#### Scenario: Clear focus
- **WHEN** the user clears the focused view
- **THEN** the full model remains unchanged and can be viewed again

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: get_dependencies; seaf-mcp/server.mjs. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.
