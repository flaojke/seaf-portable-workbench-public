<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Project connection wizard
The workbench SHALL provide a connection flow for selecting a registered project and showing its portal, manifest, validation configuration, and write capability.

#### Scenario: Connect ShopFlow
- **WHEN** the user selects the registered shopflow project
- **THEN** the wizard shows the project identity and writable status before the user starts editing

#### Scenario: Read only source project
- **WHEN** the user selects a downloaded read-only project
- **THEN** the wizard permits reading and explains that write operations are unavailable

### Requirement: Independent readiness checks
The wizard SHALL report separate results for API connectivity, project access, Git readiness, portal availability, and validation runtime readiness.

#### Scenario: Partial service outage
- **WHEN** the portal is unavailable but the API and project are readable
- **THEN** diagnostics identify the failing portal check and preserve the successful results

#### Scenario: Missing validation runtime
- **WHEN** the selected project cannot run its configured validator
- **THEN** diagnostics explain the missing prerequisite before publishing a draft

### Requirement: Bounded and safe recovery
Diagnostics SHALL provide retryable, bounded checks and recovery guidance without executing privileged or destructive actions automatically.

#### Scenario: Retry after recovery
- **WHEN** the user resolves a failed prerequisite and chooses retry
- **THEN** the wizard reruns the relevant check and updates its status

#### Scenario: Unreachable endpoint
- **WHEN** a configured endpoint does not respond before its timeout
- **THEN** the check ends with an explicit timeout result and the UI remains usable
