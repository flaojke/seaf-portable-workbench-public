## MODIFIED Requirements

### Requirement: Project connection wizard
The workbench SHALL provide connection flows for registered projects, existing Git clones, supported HTTPS/SSH Git URLs and Windows directories, showing source type, portal, manifest, runtime and write capability before use.

#### Scenario: Connect ShopFlow
- **WHEN** the user selects the registered shopflow project
- **THEN** the wizard shows the project identity and writable status before the user starts editing

#### Scenario: Read only source project
- **WHEN** the user selects a downloaded read-only project
- **THEN** the wizard permits reading and explains that write operations are unavailable

### Requirement: Independent readiness checks
The wizard SHALL report separate API, project, source-history, portal and configured validation-runtime checks. Git and Docker SHALL be required only for the source and runtime modes that use them.

#### Scenario: Partial service outage
- **WHEN** the portal is unavailable but the API and project are readable
- **THEN** diagnostics identify the failing portal check and preserve the successful results

#### Scenario: Missing validation runtime
- **WHEN** the selected project cannot run its configured validator
- **THEN** diagnostics explain the missing prerequisite before publishing a draft
