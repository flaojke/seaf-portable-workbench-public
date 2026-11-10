# Противоречия между источниками

## Purpose

Выявление и проверка несовместимых архитектурных утверждений с сохранением обеих сторон доказательств и без автоматического изменения модели.

## Requirements

### Requirement: Runtime consistency findings
The existing validation lifecycle SHALL report architecture rule violations found by the configured SEAF runtime.

#### Scenario: Validate inconsistent model
- **WHEN** a proposal violates a configured architecture rule
- **THEN** validation reports the rule findings and the proposal cannot be applied as valid

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

## Baseline evidence

Зафиксировано до этой доработки по исходникам: seaf-mcp/README.md: validate_change; seaf-mcp/engine.mjs: validate. Исходные требования сохранены при синхронизации расширений; ссылка на код не заменяет приёмочные проверки.

## Sync status

2026-11-04: 36 ADDED требований изменения `add-architecture-workbench` включены в 11 masters с сохранением baseline. Дельты оставлены как уже синхронизированная история.

2026-11-05: функциональная приёмка подтверждена матрицей 72 сценариев, свежими API/browser/Docker/Git доказательствами и ручной проверкой внешнего MCP-агента. Материалы находятся в каталоге изменения, а после технического архивирования — под `changes/archive/`. Фактическое выполнение archive отмечается отдельно в evidence; повторный sync этих ADDED-блоков не требуется.

Официальное архивирование выполнено 05.11.2026. История и доказательства: `changes/archive/2026-11-05-add-architecture-workbench/`. Все 72 функциональных сценария подтверждены; незавершённых задач нет.
