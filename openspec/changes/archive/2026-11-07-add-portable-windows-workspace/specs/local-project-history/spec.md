## Purpose

Provide immutable, validated local revisions and recoverable writes for ordinary directories while preserving Git commit semantics for Git sources and separating saved state from portal reload status.

## ADDED Requirements

### Requirement: Revision based directory writes
The service SHALL apply only validated proposals to writable directory projects whose base revision and imported workspace fingerprint remain unchanged, and SHALL preserve a local revision with the reviewed diff without creating a Git repository.

#### Scenario: Save a local component change
- **WHEN** a validated directory proposal is applied against an unchanged base
- **THEN** the files are saved with a local revision ID and portal reload status reported separately

#### Scenario: External file edit
- **WHEN** a source or imported workspace changes after proposal creation
- **THEN** application is rejected without overwriting the external change

### Requirement: Local reload recovery
The service SHALL distinguish a saved local revision from a failed portal reload and allow retrying the reload without creating another revision or repeating file writes.

#### Scenario: Retry reload
- **WHEN** the user retries a failed reload after a successful local save
- **THEN** the same saved revision is reported with the new reload result

### Requirement: Git connection compatibility
The service SHALL support existing Git clones and cloning HTTPS or SSH URLs, preserve local Git commit history for Git sources, and avoid implicit fetch, pull or push when editing architecture.

#### Scenario: Clone Git source
- **WHEN** the user connects an accessible supported Git URL to a new destination
- **THEN** the clone is inspected before registration and credentials are not written to public project metadata

#### Scenario: Save Git source
- **WHEN** a validated Git proposal is saved
- **THEN** one local commit is created without pushing it to the remote

## MODIFIED Requirements

### Requirement: Recoverable local history
The service SHALL preserve immutable local revisions, validate a concurrently created archive before reuse, retry transient history-rename failures for a bounded period, and restore touched files if saving fails before completion. Corrupt existing revisions SHALL never be overwritten or accepted.

#### Scenario: Compare local revisions
- **WHEN** the user selects two saved local revisions
- **THEN** the application returns semantic and source file differences for those states

#### Scenario: Partial write failure
- **WHEN** one file in a local change batch cannot be saved
- **THEN** previously touched files are restored and no successful revision is reported

#### Scenario: Concurrent identical capture
- **WHEN** two captures publish the same content-addressed revision concurrently
- **THEN** both may return the same existing revision only after its project, ID and saved artifact fingerprint are verified

#### Scenario: Corrupt revision appears during publication
- **WHEN** a destination appears with invalid metadata or artifact bytes while a capture is being published
- **THEN** capture fails without replacing or accepting that destination

#### Scenario: Temporary Windows file lock
- **WHEN** a temporary file lock prevents history rename and is released within the bounded retry period
- **THEN** publication retries using the same verified temporary copy and returns a verified immutable revision

#### Scenario: Persistent history permission failure
- **WHEN** history rename remains denied after the retry deadline
- **THEN** the save fails, touched project files are restored, no successful revision is reported, and cleanup is restricted to the capture's own temporary directory
