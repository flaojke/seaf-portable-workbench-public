<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Ref bound isolated preview
The workbench SHALL create a portal preview for a resolved Git commit from a selected registered project ref without changing the live project HEAD or live portal configuration.

#### Scenario: Preview a feature branch
- **WHEN** the user requests a preview for an existing project branch
- **THEN** the preview identifies the resolved commit and opens a distinct URL while the live project state remains unchanged

#### Scenario: Invalid ref
- **WHEN** the requested ref cannot be resolved
- **THEN** the workbench reports the failure without changing the current project

### Requirement: Preview lifecycle visibility
The workbench SHALL expose preview preparation status, failures, URL, and an explicit stop action. Preview expiry records SHALL survive service restarts; new service instances SHALL resume expiry scheduling. Concurrent starts SHALL respect the configured preview limit.

#### Scenario: Stop a preview
- **WHEN** the user stops an active preview
- **THEN** only the selected preview runtime is stopped and its expiry record is removed without changing the live portal

#### Scenario: Runtime start failure
- **WHEN** the isolated preview runtime cannot become ready
- **THEN** the workbench reports the failed stage and does not claim the preview is available

### Requirement: No implicit preview publication
A preview SHALL remain isolated from live writes and SHALL not implicitly commit, merge, or push its source state.

#### Scenario: Inspect branch content
- **WHEN** the user navigates a preview of another branch
- **THEN** no merge, live reload, or Git push is triggered

#### Scenario: Limit concurrent previews
- **WHEN** the configured preview resource limit is reached
- **THEN** new requests receive an actionable limit result instead of creating unmanaged runtimes
