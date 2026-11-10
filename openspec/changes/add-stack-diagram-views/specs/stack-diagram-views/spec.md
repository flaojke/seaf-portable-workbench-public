## ADDED Requirements
### Requirement: Model-derived bounded views
The workbench SHALL render contexts, service passports, dataflows and technology landscapes using source identities and explicit metadata, marking unresolved endpoints and truncation.
#### Scenario: Inspect a service
- **WHEN** a component is selected
- **THEN** direct incoming and outgoing links and declared metadata are shown without inventing facts
### Requirement: Explicit deployment mapping
The workbench SHALL display only declared deployment instances and reject unresolved component references in sketch proposals.
#### Scenario: No mappings
- **WHEN** a model has no declared SEAF TA service app_components mappings
- **THEN** the view reports missing mappings instead of guessing infrastructure
### Requirement: Reviewed sketches and visual comparison
The workbench SHALL preview bounded local Russian/English descriptions and documented declarative sketches and stage changes through the draft lifecycle, with stale checks and stable-layout visual comparison.
#### Scenario: Obsolete preview
- **WHEN** the model fingerprint changed since preview
- **THEN** staging fails without editing model files
### Requirement: Local reproducible export
The workbench SHALL export static HTML, PNG, SVG, legend and inventory with revision, fingerprint and content hashes and no external assets.
#### Scenario: Private export
- **WHEN** a user exports architecture
- **THEN** no publication or external script, font or icon requests occur

### Requirement: Interrupted UI workflows
The workbench SHALL discard obsolete Stack responses after project, panel or text changes and SHALL expose cancel and source-object Back/Forward navigation without writing model files.
#### Scenario: Cancel preview
- **WHEN** preview is cancelled before its response arrives
- **THEN** staging remains disabled and no model change occurs
#### Scenario: Project switch
- **WHEN** a Stack request returns after another project is selected
- **THEN** the response does not replace the new project view
