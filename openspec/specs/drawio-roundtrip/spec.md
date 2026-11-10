# Draw.io: импорт, экспорт и редактирование

## Purpose

Обмен архитектурными компонентами и связями с draw.io и управляемая работа с исходными диаграммами через интерфейс портала.

## Requirements

### Requirement: Embedded Drawio document rendering
The existing Drawio document handler SHALL load a configured diagram document in an embedded Drawio frame.

#### Scenario: Open a Drawio document
- **WHEN** a user opens a valid Drawio document profile
- **THEN** the handler renders its document through the configured Drawio host

### Requirement: Recognised diagram import
The workbench SHALL parse mxGraphModel and mxfile input, including compressed pages, and present recognised component candidates, links, source pages, and unmapped elements before proposing model changes.

#### Scenario: Import connected shapes
- **WHEN** a supported draw.io file contains labelled vertices and edges with valid endpoints
- **THEN** the import preview shows candidate components and their recognised relationships

#### Scenario: Unsupported or dangling elements
- **WHEN** the input contains unsupported shapes or links to missing cells
- **THEN** the preview identifies those elements and does not silently invent endpoints

#### Scenario: Malformed or excessive input
- **WHEN** the XML is malformed or exceeds configured size or element limits
- **THEN** import ends with a clear error without applying any source changes

### Requirement: Stable identity model export
Drawio export SHALL produce a valid mxfile for the selected project's component model with labels, relationships, stable entity identifiers, and safe JSON metadata preserving supported component and link properties, including trust annotations. Reimport SHALL preserve custom nested data and explicit boolean values.

#### Scenario: Export ShopFlow context
- **WHEN** the user exports the selected ShopFlow project model
- **THEN** the resulting file opens as draw.io XML and retains its components, links, SEAF identities, and supported custom properties

#### Scenario: Reimport an exported view
- **WHEN** the user reimports an unchanged SEAF export
- **THEN** existing entities are matched by stable identity instead of duplicated

### Requirement: Embedded existing diagram editing
The workbench SHALL open an existing registered draw.io artifact in an embedded editor and save changes through a reviewable validated proposal.

#### Scenario: Edit existing diagram
- **WHEN** the user edits the layout of an existing writable diagram and saves
- **THEN** the diff targets the original draw.io artifact and the saved commit and reload status are reported

#### Scenario: Read only diagram
- **WHEN** the user opens a diagram from a read-only project
- **THEN** the diagram can be inspected but source saving is unavailable

### Requirement: Explicit model synchronisation
Saving diagram layout SHALL not silently create or remove architecture entities. Applying recognised diagram changes SHALL require user review of the identity mapping and diff. Merge of a partial legacy diagram SHALL preserve unrelated links and their policy metadata, rejecting ambiguous matches rather than discarding data.

#### Scenario: Layout only edit
- **WHEN** the user moves a shape without choosing model synchronisation
- **THEN** the diagram geometry changes while architecture entity definitions remain unchanged

#### Scenario: Synchronise a new shape
- **WHEN** the user maps a new diagram vertex to a model component
- **THEN** the proposal includes the chosen object definition and any required imports for review

### Requirement: Trusted embed messages
The embedded editor SHALL accept save/load messages only from its expected frame and configured origin.

#### Scenario: Unexpected message origin
- **WHEN** another window or origin sends a draw.io save message
- **THEN** the workbench ignores the message without saving a file

#### Scenario: Editor unavailable
- **WHEN** the configured draw.io host cannot be loaded
- **THEN** the UI reports editor availability and preserves the current diagram content

### Requirement: Offline embedded editor
The portable distribution SHALL serve embedded draw.io and required client assets locally, preserving the existing reviewed and validated save lifecycle for Git and directory projects.

#### Scenario: Edit without internet
- **WHEN** a bundled draw.io artifact is opened while external network access is blocked
- **THEN** its editor loads, edits and saves through a proposal using only loopback resources

## Baseline evidence

Зафиксировано до этой доработки по исходникам: repositories/seaf-archtool-core/plugins/drawio/components/DrawIODocument.vue; plugins/seaf2drawiojs. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
