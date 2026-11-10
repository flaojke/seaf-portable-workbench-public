# repository-layout-performance Specification

## Purpose
Provide a reproducible, evidence-based comparison of SEAF repository layouts at 1000+ systems, separating source organization and ownership from startup, reload and browser performance, with safe migration guidance and explicit limits.

## Requirements

### Requirement: Equivalent layout workloads
The benchmark SHALL compare the requested layouts on deterministic synthetic models with at least 1000 systems, preserving entity definitions and ordered relations, and SHALL verify canonical model identity rather than assuming equivalent YAML files.

#### Scenario: Compare split and aggregate layouts
- **WHEN** each generated layout is loaded
- **THEN** system and integration counts and canonical section hashes match the common workload

### Requirement: Observable isolated measurements
The study SHALL measure real SEAF startup, reload and browser readiness sequentially, record source-file and parse costs, distinguish process/browser/filesystem cache scopes and report failures without fabricated success.

#### Scenario: Render a focused diagram
- **WHEN** the browser opens the focus context
- **THEN** a real diagram with the expected visible nodes must appear before readiness is recorded

### Requirement: Scoped recommendation and migration guide
The report SHALL state platform, runtime, source transport, repetitions and limits, distinguish user convenience from measured speed, and provide an explicit recommended structure with import and integration-ownership examples in the SEAF improvements menu.

#### Scenario: Read the recommendation
- **WHEN** the user opens the report
- **THEN** measured results, limits and a stable-ID migration plan are available separately from unverified hypotheses
