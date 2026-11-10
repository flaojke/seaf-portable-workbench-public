# Ответы с проверяемыми источниками

## Purpose

Проверяемые ответы агента об архитектуре на основе зарегистрированных проектов с явным происхождением фактов и границами доступных данных.

## Requirements

### Requirement: Source aware retrieval
The MCP service SHALL return artifact paths with search results and source definitions for retrieved entities.

#### Scenario: Locate order component
- **WHEN** an agent searches for or reads demo.shop.orders
- **THEN** the response identifies the actual source artifact rather than only a generated explanation

### Requirement: Claim level evidence records
Architecture facts SHALL carry project, artifact, entity, source range or excerpt, working-tree SHA-256 and revision context. Git HEAD SHALL be labelled repository context; directory revisions SHALL not be represented as Git commits.

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

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: search_artifacts, read_artifact, get_entity; seaf-mcp/server.mjs. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.

## Portable profile sync

2026-11-07: accepted requirements from `add-portable-windows-workspace` are synchronized. Package/rebuild/relocation acceptance is recorded in the corresponding change: active while gates are pending and archived after observed completion. Synchronization alone does not assert runtime or package readiness.
