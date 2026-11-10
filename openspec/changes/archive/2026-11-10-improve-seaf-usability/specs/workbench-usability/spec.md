## ADDED Requirements

### Requirement: Portal-wide workspace entry points
The local SEAF portal SHALL expose direct menu entries for personal work, diagram composition and scenarios, and a keyboard-accessible global search command from portal pages outside the workbench frame.

#### Scenario: Search from an architecture document
- **WHEN** a user presses Ctrl+K or selects the search control while viewing a local architecture document
- **THEN** the portal opens the workbench command palette without writing model files

#### Scenario: Open the composer directly
- **WHEN** a user selects the portal menu entry for diagram composition
- **THEN** the embedded workbench opens its composer view rather than its default editor

#### Scenario: Embedded named actions and confirmations
- **WHEN** a user invokes a named saved view or a project action requiring confirmation in the trusted local workbench frame
- **THEN** the input or confirmation dialog is usable without silently losing the action

### Requirement: Unified architecture search and commands
The workbench SHALL provide a keyboard-accessible command palette searching object identifiers, names, descriptions, owners and documents across the active project, with actions and direct navigation to the matching object or document.

#### Scenario: Find a service and open its passport
- **WHEN** a user presses Ctrl+K and searches for Delivery in ShopFlow
- **THEN** matching objects and documents are listed and the selected result opens the actual model entity without changing files

#### Scenario: No matching search result
- **WHEN** a search matches no object or document
- **THEN** an explicit empty result appears while commands and keyboard dismissal remain usable

### Requirement: Complete configurable object catalog
The editor SHALL expose every matching object through bounded pagination, owner/domain/status filters, sort order, configurable columns and saved views scoped to the project.

#### Scenario: More than one thousand objects
- **WHEN** a project contains more than one thousand systems
- **THEN** the user can navigate to the final object, filter and sort the complete result set without a silent 250-object truncation

#### Scenario: Restore a saved catalog view
- **WHEN** a user saves filters and columns and reopens the project
- **THEN** the selected saved view restores its filters and columns without affecting source files

### Requirement: Actionable validation feedback
The workbench SHALL display model validation failures as readable issue cards with source identifiers and actionable object or property navigation where the issue supplies that identity, while retaining the original diagnostic detail.

#### Scenario: Open an invalid property
- **WHEN** a validation problem names a component and missing owner property
- **THEN** the user can open the corresponding editor and focus the owner field before validating again

#### Scenario: Unmapped validator issue
- **WHEN** a custom rule does not expose a resolvable object or property
- **THEN** the issue remains visible with its original diagnostic detail and no invented repair action

### Requirement: Read only entity passport
The workbench SHALL offer a readable entity passport showing declared properties, owner, incoming and outgoing relations, related contexts/documents and source provenance, with an explicit edit action respecting project write capability.

#### Scenario: Inspect Delivery Service
- **WHEN** the user opens the passport of demo.shop.delivery
- **THEN** Delivery Service, owner Logistics, its actual links and source artifact are visible without entering a mutation mode

### Requirement: Persistent project and publication context
The workbench SHALL keep the active project, source mode/path, revision, write capability and change lifecycle visible and SHALL distinguish local draft persistence, validation, project save and portal reload.

#### Scenario: Save succeeded but portal reload failed
- **WHEN** a proposal is committed or locally revisioned but portal reload fails
- **THEN** the header shows that the source save succeeded and separately offers reload retry without repeating the write

### Requirement: Recoverable form editing
The workbench SHALL automatically preserve incomplete form text locally, support undo and redo within the editing session, restore project-specific input across navigation/reload and report storage failure without claiming persistence or writing Git automatically.

#### Scenario: Resume incomplete input
- **WHEN** a user changes a field or leaves incomplete advanced JSON and navigates away or reloads
- **THEN** the typed input is recoverable in that project and no model proposal is applied automatically

#### Scenario: Undo a field change
- **WHEN** a user changes an owner and invokes undo followed by redo
- **THEN** the prior and changed values are restored locally while the published model remains unchanged

### Requirement: Guided system creation
The workbench SHALL provide a creation wizard for system identity, ownership, integrations and context membership, producing one atomic draft that uses the existing diff, validation and save lifecycle.

#### Scenario: Create a linked system
- **WHEN** the user completes the wizard with an owner, an outgoing integration and an existing context
- **THEN** one draft contains the new component and required context update with a reviewable diff and no immediate source write

### Requirement: Personal navigation memory and precise links
The workbench SHALL support project-specific favorites and recent entities and SHALL encode selected project/view/object/filter state in safe navigable URLs with browser history restoration.

#### Scenario: Share an object link
- **WHEN** the user copies and opens a link for a specific object and catalog filter
- **THEN** the registered project and matching object/view are restored without silently selecting another project

### Requirement: Source based scenario walkthrough
The workbench SHALL provide a previous/next scenario walkthrough using actual declared steps or user-selected existing links, displaying the active source, target, data and error notes without inventing runtime observations or modifying the model.

#### Scenario: Walk through order interactions
- **WHEN** the user selects an ordered sequence of ShopFlow interactions
- **THEN** each step highlights the actual source and target and previous/next controls preserve the source model

#### Scenario: Unsupported scenario document
- **WHEN** an arbitrary text diagram cannot be unambiguously parsed into model steps
- **THEN** the UI explains the limit and permits deliberate selection of existing model links instead of inventing a sequence

### Requirement: Understandable accessible forms
The workbench SHALL expose readable property labels, declared schema help, required status, associated labels and error descriptions, keyboard focus and an explicitly expandable advanced JSON editor preserving unsupported properties.

#### Scenario: Edit with the keyboard
- **WHEN** a user navigates through the form with Tab and Enter
- **THEN** each control has a readable accessible name and visible focus, with required-field feedback linked to the control

#### Scenario: Preserve unknown properties
- **WHEN** a user edits one common property and saves a valid proposal
- **THEN** unrelated custom properties remain in the proposed object and advanced JSON remains available for deliberate editing
