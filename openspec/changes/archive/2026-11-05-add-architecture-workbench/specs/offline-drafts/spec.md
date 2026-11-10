<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Offline local persistence
The workbench SHALL preserve an editable project draft locally without requiring an available portal or write API.

#### Scenario: Resume offline draft
- **WHEN** a user saves a ShopFlow draft, closes the workbench, and reopens the same browser profile offline
- **THEN** the draft restores its project, base state, operations, and last saved status without publishing changes

#### Scenario: Unavailable local storage
- **WHEN** local persistence fails or storage quota is exhausted
- **THEN** the user sees that saving failed and can export the draft instead of receiving a success indication

### Requirement: Portable draft exchange
The workbench SHALL export and import a versioned draft containing project identity, base state, and pending operations.

#### Scenario: Exchange a draft
- **WHEN** a user exports a draft and imports it in a fresh workbench session
- **THEN** the same operations and base identity are available for review without applying them

#### Scenario: Reject incompatible draft
- **WHEN** an imported draft has an unsupported version, invalid structure, or another project identity
- **THEN** the workbench reports the mismatch before accepting operations

### Requirement: Conflict aware publication
The workbench SHALL compare the draft base with the current registered project before producing an applicable proposal.

#### Scenario: Publish unchanged base
- **WHEN** connectivity returns and the draft base matches the current project
- **THEN** the user can inspect one proposal and validate it through the existing write lifecycle

#### Scenario: Concurrent project change
- **WHEN** the current commit or imported workspace differs from the draft base
- **THEN** publication is blocked with a conflict explanation and the draft remains available for deliberate reconciliation
