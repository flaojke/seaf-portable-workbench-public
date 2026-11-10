# Точечное и пакетное редактирование

## Purpose

Универсальное изменение архитектурных объектов с обязательным предварительным сравнением, проверкой модели и сохранением подтверждённого результата.

## Requirements

### Requirement: Validated project writes
The MCP service SHALL apply only a validated proposal for a writable project whose base state still matches the current project, saving a Git commit for Git sources or an immutable local revision for directory sources.

#### Scenario: Apply validated proposal
- **WHEN** a valid proposal has an unchanged base and the writable project is clean
- **THEN** the service saves one local Git commit or directory revision and reports the portal reload result

#### Scenario: Reject stale proposal
- **WHEN** the project or imported workspace changes after proposal creation
- **THEN** the service rejects application without overwriting the new state

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
The workbench SHALL show affected references for deletions and SHALL publish only after reviewed diff and successful model validation, reporting the saved Git commit or local revision separately from portal reload status.

#### Scenario: Delete referenced component
- **WHEN** the user proposes deleting a component referenced by a context or scenario
- **THEN** the workbench shows those references and validation blocks an inconsistent result

#### Scenario: Reload failure after commit
- **WHEN** a valid change is committed but portal reload fails
- **THEN** the workbench shows the saved commit or local revision and retryable reload failure separately without repeating the write

### Requirement: Dedicated object editor section
SEAF SHALL expose an Editor menu section with readable fields for common objects, creation of systems, structured information flow and integration editing, and advanced JSON for arbitrary model properties.

#### Scenario: Edit a system without replacing unrelated fields
- **WHEN** the user changes a system property through a form
- **THEN** the proposed diff preserves unrelated properties and the normal validation and save lifecycle applies

#### Scenario: Edit a component interaction
- **WHEN** the user creates, changes or removes a component flow
- **THEN** the editor proposes the actual component links used by existing SEAF diagrams and preserves unrelated link metadata

### Requirement: Model driven editor choices
The editor SHALL populate choices from declared schema enums, entity references and available project dictionaries. Observed values SHALL be presented as suggestions, and unsupported schema constructs SHALL remain available through JSON without inventing dictionaries.

#### Scenario: Use a declared dictionary
- **WHEN** an editable property references an available project dictionary or schema enum
- **THEN** the form presents the declared values as a dropdown and writes the selected typed value to the proposal

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: propose_entity, propose_change, validate_change, apply_change; seaf-mcp/engine.mjs. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
