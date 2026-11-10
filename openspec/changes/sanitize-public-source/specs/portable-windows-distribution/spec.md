## ADDED Requirements

### Requirement: Disabled telemetry in public source
The public distribution SHALL expose an inert telemetry interface without a bundled SDK or external transport.

#### Scenario: Enable is requested
- **WHEN** enabled configuration is provided
- **THEN** no callbacks, SDK imports or network requests occur

### Requirement: Public integration placeholders
Disabled integration entry points SHALL return an explicit unavailable response without external requests.

#### Scenario: External import is opened
- **WHEN** the external import document is rendered
- **THEN** its placeholder explains that the feature is unavailable
