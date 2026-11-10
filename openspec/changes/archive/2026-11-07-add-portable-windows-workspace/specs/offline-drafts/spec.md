## MODIFIED Requirements

### Requirement: Conflict aware publication
The workbench SHALL compare the draft base revision and imported workspace fingerprint with the current Git or directory project before producing an applicable proposal.

#### Scenario: Publish unchanged base
- **WHEN** connectivity returns and the draft base matches the current project
- **THEN** the user can inspect one proposal and validate it through the existing write lifecycle

#### Scenario: Concurrent project change
- **WHEN** the current revision or imported workspace differs from the draft base
- **THEN** publication is blocked with a conflict explanation and the draft remains available for deliberate reconciliation
