## Purpose

Explain inspected SEAF repository requirements, dependencies, dictionaries and diagram authoring with concise working examples and clear boundaries between core, project and portable editing restrictions.

## ADDED Requirements

### Requirement: Source grounded authoring guide
The SEAF menu under Доработки LSV SHALL contain a structured Документация SEAF section documenting connected project requirements with concise examples and references to the inspected implementation.

#### Scenario: Find project requirements
- **WHEN** the user opens the SEAF documentation section
- **THEN** navigation exposes project structure, imports and dependencies, model dictionaries, diagrams and L2, documents and validation guidance

### Requirement: Explicit requirement scope
The guide SHALL distinguish core metamodel requirements, project custom validators, portable offline constraints and editing service restrictions without presenting optional fields or Docker/Git as universal requirements.

#### Scenario: Connect a local directory
- **WHEN** the user consults requirements for a plain Windows directory
- **THEN** the guide explains local revisions without mandatory Git and local imports within the configured workspace

### Requirement: Usable model examples
The guide SHALL provide a working minimal architecture example, context definition and dictionary or enum example, identify the meaning of C4 L2, and explain how to open the rendered views.

#### Scenario: Follow the minimal example
- **WHEN** the user opens the included Hello example and follows the documented context and editor links
- **THEN** the model validates and the diagram and typed dropdown fields are available
