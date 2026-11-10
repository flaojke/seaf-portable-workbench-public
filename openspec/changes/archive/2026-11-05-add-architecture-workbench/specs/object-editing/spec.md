<!-- Synced 2026-11-04 to master; functional acceptance completed 2026-11-05. ADDED requirements are already present in master. Archive is a separate root action; see ../../sync-plan.md. -->

## ADDED Requirements

### Requirement: Generic single object editing
The workbench SHALL create, read, replace, update properties of, and delete objects in any registered project object section using a section name and object identifier.

#### Scenario: Edit a system owner
- **WHEN** a user changes the owner property of an existing ShopFlow system
- **THEN** the editor retains unrelated properties and offers a proposed diff

#### Scenario: Custom object type
- **WHEN** a writable project contains a custom object section
- **THEN** the editor exposes its objects and permits structured editing without a hardcoded ShopFlow component type

### Requirement: Explicit property operations
The editor SHALL distinguish setting a property value, removing a property, and replacing an entire object.

#### Scenario: Remove one property
- **WHEN** the user selects property removal on an existing object
- **THEN** the diff removes that property while retaining other properties

#### Scenario: Replace entire object
- **WHEN** the user chooses replacement with a complete object definition
- **THEN** the diff shows every resulting property addition, change, and deletion

### Requirement: Atomic bulk proposal
The workbench SHALL combine related single-object and file changes into one reviewable proposal and SHALL avoid committing a partial operation set.

#### Scenario: Create linked objects
- **WHEN** the user creates two related objects and the required imports in one batch
- **THEN** one diff and one validation result cover the entire operation set

#### Scenario: Invalid operation in batch
- **WHEN** one operation has an invalid path, duplicate identity, or invalid definition
- **THEN** the batch is rejected before a partial Git commit is made

### Requirement: Deletion impact and publication
The workbench SHALL show affected references for deletions and SHALL publish only after the user reviews the diff and model validation succeeds.

#### Scenario: Delete referenced component
- **WHEN** the user proposes deleting a component referenced by a context or scenario
- **THEN** the workbench shows those references and validation blocks an inconsistent result

#### Scenario: Reload failure after commit
- **WHEN** a valid change is committed but portal reload fails
- **THEN** the workbench shows the saved commit and retryable reload failure separately without repeating the write
