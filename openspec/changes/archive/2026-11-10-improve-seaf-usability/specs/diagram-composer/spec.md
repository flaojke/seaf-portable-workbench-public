## ADDED Requirements

### Requirement: Visual three-level diagram composition
The workbench SHALL provide a visual diagram composer for network, application and component levels, with selectable project objects, explicit visual-only nodes, editable labelled directed connections, trust zones and persisted node geometry.

#### Scenario: Compose an application diagram
- **WHEN** a user selects Orders and Delivery from the project palette and adds an interaction
- **THEN** a local SVG preview shows the selected objects, labelled interaction and positions without changing the model

#### Scenario: Compose network or component views
- **WHEN** a user chooses the network or component level
- **THEN** the chosen level is retained with project references or explicitly identified visual-only nodes rather than inferred architecture objects

### Requirement: File-backed reviewed diagram writes
Diagram creation and updates SHALL prepare a draft containing a YAML definition, a generated Markdown/Mermaid document and any missing root import. The existing diff, model validation, Git or directory revision, and portal reload lifecycle SHALL remain required before source files are applied.

#### Scenario: Save and reopen a composed diagram
- **WHEN** a validated diagram draft is applied and the user reopens the diagram
- **THEN** its title, level, nodes, references, zones, edges and geometry are read from the saved project YAML, and the generated document is available in the portal menu

#### Scenario: Preserve unrelated architecture
- **WHEN** a saved diagram is changed
- **THEN** unrelated entities, imports and files remain unchanged and layout edits do not silently create or remove architecture objects

### Requirement: Safe and conflict-aware composition
The composer SHALL reject invalid or excessive definitions, unsafe paths, duplicate identities, dangling diagram edges, missing referenced entities, read-only writes and stale preview bases before publication.

#### Scenario: Concurrent source change
- **WHEN** the project revision or workspace fingerprint changes after preview
- **THEN** staging that preview is rejected and the unsaved visual definition remains available for a fresh preview

#### Scenario: Existing non-composer file
- **WHEN** a generated destination collides with a file not owned by the selected composer definition
- **THEN** save is rejected rather than overwriting it

### Requirement: Discoverable composer instructions
The delivered documentation SHALL describe the network, application and component workflows, the exact project files written, review and validation steps, a ShopFlow example and limitations under the menu Доработки LSV

#### Scenario: Follow the ShopFlow example
- **WHEN** a user follows the composer documentation
- **THEN** the example identifies Orders and Delivery and explains that manual visual nodes are not new architecture entities
