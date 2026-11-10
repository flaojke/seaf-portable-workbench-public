## ADDED Requirements

### Requirement: No unrequested external telemetry
The portal SHALL load optional telemetry only after explicit opt-in and valid configuration. Portable builds SHALL force telemetry off. Disabled or unconfigured bridges SHALL NOT load automatic collectors or forward events. Disabling SHALL discard queued events, and optional SDK failures SHALL NOT block architecture work.

#### Scenario: Default offline portal interaction
- **WHEN** the user browses architecture, uses keyboard shortcuts or clicks portal controls in the default portable distribution
- **THEN** no telemetry SDK is loaded and no external device-identifier or event collection request is attempted

#### Scenario: Explicitly configured optional telemetry
- **WHEN** an operator opts in and supplies valid telemetry configuration
- **THEN** the SDK is loaded lazily without its automatic preset and application events may be sent only to the configured endpoint

#### Scenario: Disable or invalid configuration
- **WHEN** telemetry is disabled or lacks a valid endpoint or API key
- **THEN** the SDK is not newly imported and application events are not queued or forwarded

#### Scenario: Optional SDK failure
- **WHEN** a configured optional SDK cannot load or send an event
- **THEN** architecture views and editor controls remain available without an uncaught exception

#### Scenario: Host build settings request telemetry
- **WHEN** the host environment enables telemetry while building the portable distribution
- **THEN** the portable build overrides that opt-in and keeps telemetry disabled

#### Scenario: Disable a configured bridge
- **WHEN** an operator disables telemetry while an optional packet or SDK initialization is pending
- **THEN** forwarding stops and stale events are discarded instead of being replayed after re-enabling

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
