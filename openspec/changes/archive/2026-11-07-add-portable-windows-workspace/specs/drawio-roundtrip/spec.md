## ADDED Requirements

### Requirement: Offline embedded editor
The portable distribution SHALL serve embedded draw.io and required client assets locally, preserving the existing reviewed and validated save lifecycle for Git and directory projects.

#### Scenario: Edit without internet
- **WHEN** a bundled draw.io artifact is opened while external network access is blocked
- **THEN** its editor loads, edits and saves through a proposal using only loopback resources
