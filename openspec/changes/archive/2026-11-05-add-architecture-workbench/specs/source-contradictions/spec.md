<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Paired contradiction evidence
A contradiction report SHALL include the incompatible claims, their projects and artifacts, applicable entity identities, and source evidence for both sides.

#### Scenario: Different service owners
- **WHEN** two loaded sources assign incompatible owners to the same identified service
- **THEN** the report shows both asserted values and both sources

#### Scenario: Document conflicts with model
- **WHEN** a document explicitly describes an interaction incompatible with the identified model relation
- **THEN** the report cites the document claim and the conflicting model definition

### Requirement: Explicit uncertainty
The report SHALL distinguish confirmed structured conflicts from suspected document inconsistencies and SHALL avoid treating missing data or text similarity alone as a confirmed contradiction.

#### Scenario: Only one source has a value
- **WHEN** a property is absent from one source and present in another
- **THEN** the result identifies missing evidence rather than a confirmed incompatible value

#### Scenario: Ambiguous document statement
- **WHEN** a document phrase has more than one plausible interpretation
- **THEN** the result is marked for review and includes its uncertainty

### Requirement: Review without implicit edits
Contradiction analysis SHALL leave project sources unchanged and route any requested resolution through the ordinary proposal and validation lifecycle.

#### Scenario: Run contradiction review
- **WHEN** the user requests a comparison of loaded sources
- **THEN** the system returns findings without changing or committing files

#### Scenario: Resolve selected conflict
- **WHEN** the user explicitly asks to resolve one reported inconsistency
- **THEN** a scoped diff is proposed and validated before a local Git commit
