## Purpose

Explicitly connect local Windows directories and Git sources, expose their capabilities and active project, and manage versions, exports and recoverable removal without implicit Git initialization or push.

## ADDED Requirements

### Requirement: Explicit local directory connection
The application SHALL let the user select a Windows directory through a system folder dialog or enter its path, inspect its manifest and capabilities, and explicitly connect it as a project.

#### Scenario: Connect a directory without Git
- **WHEN** the user selects a readable architecture directory without a Git repository
- **THEN** the application shows its path, manifest and source type without requiring Git initialization

#### Scenario: Cancel folder selection
- **WHEN** the user cancels the system folder dialog
- **THEN** the project registry and project files remain unchanged

#### Scenario: Portable PATH omits Windows PowerShell
- **WHEN** the portable launcher uses a PATH without the Windows PowerShell directory
- **THEN** folder selection resolves the system executable by its absolute Windows path instead of depending on PATH lookup

### Requirement: Honest connection status
The application SHALL identify unreadable paths, missing manifests and unavailable imported sources before presenting a newly connected project as ready.

#### Scenario: Missing architecture manifest
- **WHEN** the selected directory has no configured or selected architecture manifest
- **THEN** the application requests a manifest selection or reports the missing prerequisite instead of showing a successful empty model

### Requirement: Explicit source capabilities
The application SHALL identify Git and directory source modes explicitly, preserve read-only access restrictions, and avoid creating Git repositories automatically for directory sources.

#### Scenario: Directory inside another Git repository
- **WHEN** a selected architecture directory is inside a different Git repository root
- **THEN** the application does not silently treat the selected directory as that repository's writable root

#### Scenario: Read-only connection
- **WHEN** a project is registered read-only
- **THEN** browsing remains available while project write operations are rejected

### Requirement: Portable registration data
The source repository SHALL contain configuration templates without personal paths or credentials, while machine-local project registrations and credentials remain outside tracked source files.

#### Scenario: Move distribution to another path
- **WHEN** the portable distribution is moved to another Windows directory
- **THEN** bundled project paths resolve relative to the distribution and unavailable external directories are reported for reconnection

### Requirement: Project management section
SEAF SHALL expose a Projects menu section listing connected projects, source type and provider, path, manifest, write capability and active selection, with actions to open, connect, disconnect, export, clone, create a version and explicitly delete.

#### Scenario: Select active project
- **WHEN** the user chooses a connected project
- **THEN** the workbench loads that project's model and opening the project launches its actual portal

#### Scenario: Disconnect safely
- **WHEN** the user disconnects a project
- **THEN** its connection is removed while source files and retained local history remain unchanged

### Requirement: Recoverable explicit project removal
Project file deletion SHALL require explicit user confirmation and move only the selected writable project to recoverable local trash. Read-only sources, runtime directories and drive roots SHALL be protected.

#### Scenario: Remove a project directory
- **WHEN** the user explicitly confirms file removal for a writable project
- **THEN** only its directory is moved to trash and the connection is removed

#### Scenario: Read-only removal attempt
- **WHEN** project file deletion targets a read-only source
- **THEN** the operation is rejected without moving its files

### Requirement: Project export and named versions
The Projects section SHALL export supported architecture artifacts as ZIP and create named local revisions or Git branches without silently switching, pushing or committing unrelated changes.

#### Scenario: Save project archive
- **WHEN** the user selects Save ZIP
- **THEN** a downloadable archive contains the supported project artifacts and clearly declares excluded Git metadata and external imports

#### Scenario: Name a Git version
- **WHEN** the user creates a named version for a Git project
- **THEN** a new branch identifies the current commit without changing the checked-out branch or pushing
