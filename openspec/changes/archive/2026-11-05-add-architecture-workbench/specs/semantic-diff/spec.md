<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

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
