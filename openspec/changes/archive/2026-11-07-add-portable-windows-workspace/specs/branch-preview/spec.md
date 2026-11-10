## MODIFIED Requirements

### Requirement: Isolated validation workspace
The MCP validator SHALL evaluate a proposal in a copied workspace using its configured SEAF runtime. Docker validation SHALL disable network and exposed ports; native validation SHALL use loopback, bounded owned processes and local imports without changing the live project.

#### Scenario: Validate a draft
- **WHEN** the agent validates a proposal
- **THEN** the current project is not replaced and validation runs against an isolated copy

### Requirement: Ref bound isolated preview
The workbench SHALL create a distinct portal preview for a resolved Git commit or saved directory revision without changing the live project or live portal configuration.

#### Scenario: Preview a feature branch
- **WHEN** the user requests a preview for an existing project branch
- **THEN** the preview identifies the resolved commit and opens a distinct URL while the live project state remains unchanged

#### Scenario: Invalid ref
- **WHEN** the requested ref cannot be resolved
- **THEN** the workbench reports the failure without changing the current project
