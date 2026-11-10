## ADDED Requirements

### Requirement: Dedicated object editor section
SEAF SHALL expose an Editor menu section with readable fields for common objects, creation of systems, structured information flow and integration editing, and advanced JSON for arbitrary model properties.

#### Scenario: Edit a system without replacing unrelated fields
- **WHEN** the user changes a system property through a form
- **THEN** the proposed diff preserves unrelated properties and the normal validation and save lifecycle applies

#### Scenario: Edit a component interaction
- **WHEN** the user creates, changes or removes a component flow
- **THEN** the editor proposes the actual component links used by existing SEAF diagrams and preserves unrelated link metadata

### Requirement: Model driven editor choices
The editor SHALL populate choices from declared schema enums, entity references and available project dictionaries. Observed values SHALL be presented as suggestions, and unsupported schema constructs SHALL remain available through JSON without inventing dictionaries.

#### Scenario: Use a declared dictionary
- **WHEN** an editable property references an available project dictionary or schema enum
- **THEN** the form presents the declared values as a dropdown and writes the selected typed value to the proposal

## MODIFIED Requirements

### Requirement: Validated project writes
The MCP service SHALL apply only a validated proposal for a writable project whose base state still matches the current project, saving a Git commit for Git sources or an immutable local revision for directory sources.

#### Scenario: Apply validated proposal
- **WHEN** a valid proposal has an unchanged base and the writable project is clean
- **THEN** the service saves one local Git commit or directory revision and reports the portal reload result

#### Scenario: Reject stale proposal
- **WHEN** the project or imported workspace changes after proposal creation
- **THEN** the service rejects application without overwriting the new state

### Requirement: Deletion impact and publication
The workbench SHALL show affected references for deletions and SHALL publish only after reviewed diff and successful model validation, reporting the saved Git commit or local revision separately from portal reload status.

#### Scenario: Delete referenced component
- **WHEN** the user proposes deleting a component referenced by a context or scenario
- **THEN** the workbench shows those references and validation blocks an inconsistent result

#### Scenario: Reload failure after commit
- **WHEN** a valid change is committed but portal reload fails
- **THEN** the workbench shows the saved commit or local revision and retryable reload failure separately without repeating the write
