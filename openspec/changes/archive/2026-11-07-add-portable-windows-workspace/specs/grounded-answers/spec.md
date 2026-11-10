## MODIFIED Requirements

### Requirement: Claim level evidence records
Architecture facts SHALL carry project, artifact, entity, source range or excerpt, working-tree SHA-256 and revision context. Git HEAD SHALL be labelled repository context; directory revisions SHALL not be represented as Git commits.

#### Scenario: Answer checkout participants
- **WHEN** the user asks which services participate in ShopFlow checkout
- **THEN** each claimed participant or interaction is linked to the relevant project source and entity identity

#### Scenario: Read document evidence
- **WHEN** a claim is supported by a document rather than a structured entity
- **THEN** the evidence includes the document path, excerpt or location, and content identity
