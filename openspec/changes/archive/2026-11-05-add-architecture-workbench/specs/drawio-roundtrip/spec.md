<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Recognised diagram import
The workbench SHALL parse mxGraphModel and mxfile input, including compressed pages, and present recognised component candidates, links, source pages, and unmapped elements before proposing model changes.

#### Scenario: Import connected shapes
- **WHEN** a supported draw.io file contains labelled vertices and edges with valid endpoints
- **THEN** the import preview shows candidate components and their recognised relationships

#### Scenario: Unsupported or dangling elements
- **WHEN** the input contains unsupported shapes or links to missing cells
- **THEN** the preview identifies those elements and does not silently invent endpoints

#### Scenario: Malformed or excessive input
- **WHEN** the XML is malformed or exceeds configured size or element limits
- **THEN** import ends with a clear error without applying any source changes

### Requirement: Stable identity model export
Drawio export SHALL produce a valid mxfile for the selected project's component model with labels, relationships, stable entity identifiers, and safe JSON metadata preserving supported component and link properties, including trust annotations. Reimport SHALL preserve custom nested data and explicit boolean values.

#### Scenario: Export ShopFlow context
- **WHEN** the user exports the selected ShopFlow project model
- **THEN** the resulting file opens as draw.io XML and retains its components, links, SEAF identities, and supported custom properties

#### Scenario: Reimport an exported view
- **WHEN** the user reimports an unchanged SEAF export
- **THEN** existing entities are matched by stable identity instead of duplicated

### Requirement: Embedded existing diagram editing
The workbench SHALL open an existing registered draw.io artifact in an embedded editor and save changes through a reviewable validated proposal.

#### Scenario: Edit existing diagram
- **WHEN** the user edits the layout of an existing writable diagram and saves
- **THEN** the diff targets the original draw.io artifact and the saved commit and reload status are reported

#### Scenario: Read only diagram
- **WHEN** the user opens a diagram from a read-only project
- **THEN** the diagram can be inspected but source saving is unavailable

### Requirement: Explicit model synchronisation
Saving diagram layout SHALL not silently create or remove architecture entities. Applying recognised diagram changes SHALL require user review of the identity mapping and diff. Merge of a partial legacy diagram SHALL preserve unrelated links and their policy metadata, rejecting ambiguous matches rather than discarding data.

#### Scenario: Layout only edit
- **WHEN** the user moves a shape without choosing model synchronisation
- **THEN** the diagram geometry changes while architecture entity definitions remain unchanged

#### Scenario: Synchronise a new shape
- **WHEN** the user maps a new diagram vertex to a model component
- **THEN** the proposal includes the chosen object definition and any required imports for review

### Requirement: Trusted embed messages
The embedded editor SHALL accept save/load messages only from its expected frame and configured origin.

#### Scenario: Unexpected message origin
- **WHEN** another window or origin sends a draw.io save message
- **THEN** the workbench ignores the message without saving a file

#### Scenario: Editor unavailable
- **WHEN** the configured draw.io host cannot be loaded
- **THEN** the UI reports editor availability and preserves the current diagram content
