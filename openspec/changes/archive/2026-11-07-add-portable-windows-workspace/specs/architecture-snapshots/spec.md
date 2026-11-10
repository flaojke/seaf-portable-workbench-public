## MODIFIED Requirements

### Requirement: Proposal base identity
The MCP service SHALL record the base revision type, revision ID and project content fingerprint for a proposed change, retaining Git commit context for Git projects and local revision context for directory projects.

#### Scenario: Inspect change base
- **WHEN** an agent reads a stored proposal
- **THEN** the base revision and content fingerprint used by validation are available

### Requirement: Complete snapshot manifest
The workbench SHALL produce a versioned snapshot manifest identifying the project, root manifest, revision, exact runtime identity, non-secret build settings and source/import digests. Docker images or native runtime binaries SHALL remain explicit separately available prerequisites.

#### Scenario: Capture local workspace
- **WHEN** the user creates a snapshot of a project with local imports
- **THEN** the snapshot identifies the root and imported source files with stable digests and runtime identity

#### Scenario: Protect configuration secrets
- **WHEN** snapshot settings include credential references
- **THEN** exported runtime settings include only declared non-secret settings and exclude process credentials; captured source files remain verbatim

### Requirement: Verifiable restore
The workbench SHALL verify the manifest, file digests and archive composition before opening a saved snapshot in an isolated portal using its stored Docker or native runtime identity, root manifest and environment. Unavailable or changed runtimes SHALL be reported rather than silently substituted.

#### Scenario: Restore complete snapshot
- **WHEN** the user loads a complete snapshot with matching file digests and supported runtime settings
- **THEN** an isolated reconstruction can be validated without modifying the current project

#### Scenario: Incomplete or tampered snapshot
- **WHEN** an imported dependency is missing or a captured file fails its digest check
- **THEN** verification reports the exact gap and does not label the snapshot reproducible
