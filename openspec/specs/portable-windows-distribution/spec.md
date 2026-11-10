# portable-windows-distribution Specification

## Purpose
Deliver a self-contained offline Windows architecture workspace from rebuildable, attributed source inputs, keeping application runtimes separate from user data and publishing only explicitly requested Git changes.

## Requirements

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

### Requirement: Disabled telemetry in public source
The public distribution SHALL provide an inert telemetry interface without bundling a telemetry SDK. Environment configuration SHALL NOT enable telemetry. The interface SHALL NOT load collectors, generate identifiers, enqueue events or send network requests.

#### Scenario: Attempt to enable telemetry
- **WHEN** an operator supplies an enabled flag, endpoint, API key or SDK loader
- **THEN** configuration and event sending return false and no callback is invoked

#### Scenario: Repeated configuration and disable
- **WHEN** configuration, event sending and disable are called repeatedly
- **THEN** the bridge remains disabled without retaining events

### Requirement: Public integration placeholders
Unavailable external import and development proxy functionality SHALL provide an explicit unavailable response without performing an external request. Upstream author attributions and license notices SHALL be retained.

#### Scenario: Open removed import
- **WHEN** the user opens the external import document
- **THEN** a clear unavailable message is displayed without authentication or network calls

#### Scenario: Call removed development proxy
- **WHEN** a request targets the former development OAuth or chat endpoint
- **THEN** the server returns HTTP 501 without forwarding it

### Requirement: Native runtime version identity
The native launcher SHALL provide the core package version to the backend when starting Node directly so that portal version information matches the bundled runtime identity without depending on an npm parent process.

#### Scenario: Direct Node startup
- **WHEN** the portable distribution starts its backend with bundled Node rather than npm
- **THEN** the versions endpoint and portal header report the declared core version instead of an undefined version

#### Scenario: Offline version display
- **WHEN** the offline native portal displays its core version
- **THEN** the version is shown without contacting an external version-checking service

### Requirement: Native portal project binding
The native launcher and project activation SHALL bind the embedded workbench URL to the actual registered project of that portal, preserving the loopback origin and the existing profile view.

#### Scenario: Open another project portal
- **WHEN** a user opens Hello while another project was previously active in the shared workbench
- **THEN** the Hello portal embeds the Hello workbench context rather than silently opening the previous project's editor

### Requirement: Stable automatic localhost origins
The portable launcher SHALL remember the actual portal, workbench and offline ports in a separate atomic, credential-free data/ports.json preference cache. Nonzero explicit settings SHALL take precedence. Automatic allocation SHALL reuse the remembered port when available and choose another free loopback port when unavailable without stopping or replacing unrelated services.

#### Scenario: Restart with free remembered ports
- **WHEN** a stopped bundle starts again and its previously selected automatic ports remain available
- **THEN** the portal, workbench and offline origins remain unchanged so browser-local preferences at the workbench origin remain accessible

#### Scenario: Remembered port occupied by another process
- **WHEN** a different service occupies a remembered automatic port
- **THEN** the launcher selects a different free port and leaves the occupying service running

#### Scenario: Explicit configured port
- **WHEN** the settings specify a valid nonzero port
- **THEN** that port is used instead of the remembered automatic preference, and an unavailable explicit port produces an actionable startup failure rather than silent reassignment

#### Scenario: Invalid optional cache
- **WHEN** the optional preference cache is missing or malformed
- **THEN** automatic free-port allocation remains available and a successful startup replaces the cache with the actual selected ports

#### Scenario: Preference persistence unavailable
- **WHEN** the selected port preferences cannot be saved atomically
- **THEN** startup reports the persistence failure and closes only services created by that startup instead of claiming that the bundle is ready

#### Scenario: Repeated start of a live bundle
- **WHEN** the matching bundle is already running
- **THEN** another start reuses its owned supervisor, URLs and preference cache without allocating new service ports

### Requirement: SEAF only source publication boundary
Source auditing and publication payload preparation SHALL positively allow only declared SEAF source roots and exact root files. Dependency, runtime, machine-state and private configuration paths SHALL be rejected before reading their candidate content. Unrelated candidate paths SHALL be reported for review rather than silently exported. Files larger than 5 MiB SHALL require review. Old local Git history SHALL remain outside the published snapshot.

#### Scenario: Unrelated local project beside SEAF source
- **WHEN** tracked or untracked candidates include a file outside the declared SEAF source allowlist
- **THEN** auditing reports the path as out of scope, does not read its content, and refuses a passed export audit

#### Scenario: Private configuration within an allowed source root
- **WHEN** a candidate belongs to a private credentials directory or an actual environment or private-key file
- **THEN** auditing reports its exclusion without reading its content and does not mark the source export ready

#### Scenario: Legitimate vendored build input
- **WHEN** a declared vendor source contains a lockfile, local library archive or test source within the allowlist
- **THEN** the source remains eligible for normal content auditing instead of being rejected merely because it is a build input

#### Scenario: Oversized source candidate
- **WHEN** an allowed source candidate exceeds 5 MiB
- **THEN** the audit requires review and does not produce a passed export status

#### Scenario: Publication payload source boundary
- **WHEN** canonical committed SEAF source is prepared for publication
- **THEN** the same source path policy is applied before reading Git blob contents and the resulting tree is bound to the explicitly selected source revision

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.

## Usability release sync

2026-11-10: accepted functional requirements from `improve-seaf-usability` are synchronized. Observed evidence and remaining packaging/publication checks are maintained in that change, active before closure and under `changes/archive` after closure. Synchronization alone does not assert release or remote publication readiness.
