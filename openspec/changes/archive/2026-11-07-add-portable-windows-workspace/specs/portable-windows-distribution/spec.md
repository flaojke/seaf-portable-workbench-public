## Purpose

Deliver a self-contained offline Windows architecture workspace from rebuildable, attributed source inputs, keeping application runtimes separate from user data and publishing only explicitly requested Git changes.

## ADDED Requirements

### Requirement: Self contained Windows distribution
The distribution SHALL run on Windows 10/11 x64 from an extracted writable directory using bundled Node.js and required runtime components without installing Node.js, Git, Docker or administrator services.

#### Scenario: Relocate the bundle
- **WHEN** the archive is extracted under a different path containing spaces or Cyrillic characters
- **THEN** the launcher starts the portal and workbench using bundled executables and relative bundle paths

### Requirement: Offline local tools
The distribution SHALL provide local architecture browsing, editing, model validation, diagram rendering and embedded draw.io without internet access. Remote Git and external AI SHALL report network or authentication prerequisites separately.

#### Scenario: Work offline
- **WHEN** external network access is unavailable
- **THEN** bundled examples, local directory changes, diagrams and draw.io remain usable

### Requirement: Owned process lifecycle
The launcher SHALL bind local services to loopback, report actionable startup failures and stop only processes created by the matching bundle instance.

#### Scenario: Stop a relocated bundle
- **WHEN** the user stops one running bundle
- **THEN** its services stop while unrelated Node, Java, Git and Docker processes remain running

### Requirement: Rebuildable source repository
The source repository SHALL contain application sources, version-locked build inputs, build scripts and license notices sufficient to rebuild the portable distribution without relying on untracked local source directories.

#### Scenario: Build from tracked inputs
- **WHEN** a clean source checkout builds with the declared build prerequisites and input downloads
- **THEN** the resulting bundle includes pinned runtime identities and no personal paths or credentials

### Requirement: Separate user data
The distribution SHALL keep mutable configuration, history and logs outside application and runtime files, exclude them from source Git, and include ShopFlow plus small offline examples.

#### Scenario: Transfer bundle with local data
- **WHEN** the user transfers the stopped bundle and its data directory
- **THEN** bundled project registrations and local history remain available while missing external directories are diagnosed

### Requirement: Explicit fork publication metadata
The source repository SHALL identify SEAF-Portable as a SEAF.ArchTool fork, link the verified upstream, retain source attribution and license notices, and provide GitHub/GitVerse descriptions without implicitly creating or pushing remote repositories.

#### Scenario: Prepare hosting descriptions
- **WHEN** the source repository is prepared for the flaojke GitHub and GitVerse accounts
- **THEN** README and hosting instructions include the planned fork URLs, original GitVerse repository, source provenance and separate publication commands
