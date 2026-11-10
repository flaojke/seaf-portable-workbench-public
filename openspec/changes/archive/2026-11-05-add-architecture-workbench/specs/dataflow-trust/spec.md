<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Explicit flow annotations
The workbench SHALL represent a data flow with source, target, protocol, data classification, and declared trust-zone assignments.

#### Scenario: Describe order delivery flow
- **WHEN** the user records an orders-to-delivery flow with order address data and a protocol
- **THEN** the flow view exposes its endpoints, data class, protocol, and trust-zone assignments

#### Scenario: Unknown classification
- **WHEN** a flow lacks a data class or an endpoint trust zone
- **THEN** the view marks the missing value as unknown rather than assuming a safe classification

### Requirement: Trust boundary findings
The workbench SHALL report flows crossing declared trust zones and evaluate configured policy checks with traceable source references.

#### Scenario: Cross boundary sensitive flow
- **WHEN** a declared sensitive flow crosses zones and violates a configured policy
- **THEN** the report identifies the flow, zones, policy, and source artifacts

#### Scenario: Allowed boundary flow
- **WHEN** a cross-zone flow satisfies a configured policy
- **THEN** the result distinguishes the allowed crossing from a violation

### Requirement: Safe annotation edits
Changes to data flows and trust zones SHALL use the common proposal, diff, validation, Git, and reload lifecycle. Explicit violations of matching trust policies and unresolved component endpoints SHALL block validation before publication.

#### Scenario: Update a trust zone
- **WHEN** the user changes an entity zone in a writable project
- **THEN** the workbench presents the resulting model changes for validation before any commit

#### Scenario: Inspect reference source
- **WHEN** the user opens trust information in a read-only project
- **THEN** analysis remains available while save operations are disabled
