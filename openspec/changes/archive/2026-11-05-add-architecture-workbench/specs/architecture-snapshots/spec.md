<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Complete snapshot manifest
The workbench SHALL produce a versioned snapshot manifest identifying the project, root manifest, Git commit, exact runtime image identity, declared non-secret build settings, and digests of captured source and import files. Source artifacts SHALL be captured verbatim; the Docker image SHALL remain a separately available prerequisite.

#### Scenario: Capture local workspace
- **WHEN** the user creates a snapshot of a project with local imports
- **THEN** the snapshot identifies the root and imported source files with stable digests and runtime identity

#### Scenario: Protect configuration secrets
- **WHEN** snapshot settings include credential references
- **THEN** exported runtime settings include only declared non-secret settings and exclude process credentials; captured source files remain verbatim

### Requirement: Deterministic snapshot identity
The snapshot SHALL use canonical ordering and a stable content identity that is unaffected by capture time or filesystem enumeration order.

#### Scenario: Repeat unchanged capture
- **WHEN** the same source content and runtime settings are captured twice
- **THEN** the content identities match even when capture timestamps differ

### Requirement: Verifiable restore
The workbench SHALL verify the manifest, captured file digests, and archive composition before opening a saved snapshot in an isolated portal with its stored runtime image identity, root manifest, and environment. Missing runtime images SHALL be reported rather than substituted silently.

#### Scenario: Restore complete snapshot
- **WHEN** the user loads a complete snapshot with matching file digests and supported runtime settings
- **THEN** an isolated reconstruction can be validated without modifying the current project

#### Scenario: Incomplete or tampered snapshot
- **WHEN** an imported dependency is missing or a captured file fails its digest check
- **THEN** verification reports the exact gap and does not label the snapshot reproducible
