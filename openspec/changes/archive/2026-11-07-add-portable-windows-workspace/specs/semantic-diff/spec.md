## ADDED Requirements

### Requirement: Source mode independent comparison
The workbench SHALL compare Git refs and saved local directory revisions using the same semantic classification, file diff and source provenance.

#### Scenario: Compare directory history
- **WHEN** two existing local revisions are selected
- **THEN** the comparison reports entity and file changes without requiring a Git repository
