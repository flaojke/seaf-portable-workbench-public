# interactive-diagram-editing Specification

## Purpose

Provide contextual editing of architecture entities, component composition and real interactions directly from a recoverable diagram workspace, preserving reviewed atomic source publication.

## Requirements

### Requirement: Contextual interactive canvas
The workspace SHALL provide selectable nodes and edges, a contextual inspector, pointer panning, zoom and fit controls, and keyboard interaction without losing the current selection or changing architecture by geometry alone.

#### Scenario: Inspect and navigate
- **WHEN** a user selects a node or edge and changes the viewport
- **THEN** the selected object's inspector remains usable and the model stays unchanged until an explicit semantic edit is staged

### Requirement: Source-backed entity properties
The inspector SHALL read and edit actual referenced entities using declared schemas, dictionaries and explicit property operations, retaining unedited and unknown fields.

#### Scenario: Change an owner
- **WHEN** the user changes a component owner in the inspector
- **THEN** the proposed source diff changes that property and preserves unrelated attributes

### Requirement: Explicit component composition
The workspace SHALL show supported parent/direct-child composition and permit creating, editing and deleting child components using the model's declared hierarchy convention. Geometry changes SHALL NOT rename or reparent entities.

#### Scenario: Add a DocHub child
- **WHEN** the user creates a direct child of a DocHub component
- **THEN** its dotted identifier and definition enter the same pending operation queue and appear in the effective workspace

#### Scenario: Unsupported custom hierarchy
- **WHEN** a project has no supported declared composition mapping
- **THEN** the workspace explains the limit and retains universal entity editing without inventing parent properties

#### Scenario: Place a new child in a context
- **WHEN** the project requires context membership and the user selects a context for a new child
- **THEN** the same queue explicitly includes that context patch and validation blocks a missing placement without committing a partial model

### Requirement: Real integrations and data flows
Users SHALL create, update and delete real component links and supported standalone integration/flow entities from the canvas inspector, with explicit source and target references and preserved interaction metadata.

#### Scenario: Edit an existing interaction
- **WHEN** the user changes one of multiple links between the same components
- **THEN** an exact selector updates only that interaction and leaves the others unchanged

#### Scenario: Create or delete a flow
- **WHEN** the user creates or deletes a supported model flow
- **THEN** the effective diagram and proposed source changes reflect that operation without silently replacing unrelated fields

#### Scenario: Preserve interaction endpoints and direction
- **WHEN** a model interaction changes its receiver or uses a reverse or bidirectional DocHub arrow
- **THEN** its canvas and generated representation show the same endpoints and direction while retaining an exact selector for its stored source definition

### Requirement: Atomic model and diagram publication
Semantic operations, diagram YAML, generated documents and imports SHALL form one reviewable draft. Save SHALL require validation and an unchanged source base, create one Git commit or local revision, and report reload separately.

#### Scenario: Save combined edits
- **WHEN** the user saves a diagram with component and interaction edits
- **THEN** one diff and validation cover all affected files and a failed operation cannot commit a partial set

#### Scenario: Destructive or stale edit
- **WHEN** a deletion has unresolved references, a project is read-only or the source changes after preview
- **THEN** staging is rejected with actionable impact information and unsaved work is retained

### Requirement: Recoverable semantic drafts
Local recovery and undo/redo SHALL include pending semantic operations and visual changes. Any model or form edit SHALL invalidate an older preview and validation eligibility.

#### Scenario: Recover pending work
- **WHEN** the user reloads a workspace after editing properties and a flow
- **THEN** the pending queue and visual state can be restored without applying project files or reusing an old validated proposal

### Requirement: Discoverable editing instructions
The delivered menu documentation SHALL explain canvas controls, property and child editing, integration/flow CRUD, exact source writes, review/save steps and supported mapping limits using a concrete ShopFlow example.

#### Scenario: Follow the workspace guide
- **WHEN** the user opens the guide under Доработки LSV
- **THEN** the example shows a component, a child and an interaction edit, and explains the required diff and model checks

## Functional acceptance sync

2026-11-10: source backend, isolated native lifecycle and actual browser behavior were accepted before packaging. Release, deployment and private-source publication remain separately tracked by enhance-diagram-workspace until observed.
