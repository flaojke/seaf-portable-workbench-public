<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

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
