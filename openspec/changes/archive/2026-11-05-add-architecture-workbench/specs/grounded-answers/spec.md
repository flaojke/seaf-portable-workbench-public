<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Claim level evidence records
An architecture answer SHALL associate factual model claims with their own evidence records containing the actual source project, artifact, entity identifier, source range or excerpt, and SHA-256 of working-tree content. Repository HEAD SHALL be labelled as repository context, not proof that the working-tree bytes are committed.

#### Scenario: Answer checkout participants
- **WHEN** the user asks which services participate in ShopFlow checkout
- **THEN** each claimed participant or interaction is linked to the relevant project source and entity identity

#### Scenario: Read document evidence
- **WHEN** a claim is supported by a document rather than a structured entity
- **THEN** the evidence includes the document path, excerpt or location, and content identity

### Requirement: Unknown and inferred answers
Answers SHALL distinguish retrieved facts, inferences, and missing evidence without inventing unsupported model entities or relationships.

#### Scenario: Unknown integration
- **WHEN** the user asks about an integration absent from the loaded sources
- **THEN** the answer states that evidence is unavailable and does not invent an endpoint

#### Scenario: Inference from naming
- **WHEN** an agent infers service purpose from a name without an explicit definition
- **THEN** the answer labels the statement as an inference rather than a sourced fact

### Requirement: Evidence freshness and trust
Evidence verification SHALL detect changed source content and SHALL treat retrieved documents as data rather than agent instructions.

#### Scenario: Source changed after answer
- **WHEN** a referenced source hash no longer matches the current artifact
- **THEN** verification marks the evidence stale and allows a fresh read

#### Scenario: Instruction inside a source document
- **WHEN** retrieved architecture text asks the agent to ignore its rules or disclose secrets
- **THEN** the answer treats the text as document content and does not execute it
