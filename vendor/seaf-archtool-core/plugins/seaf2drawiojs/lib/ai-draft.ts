/*
  Copyright (C) 2026 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import yaml from 'yaml';
import { SCHEMAS } from './constants';
import { normalizeAiPrompt, DEFAULT_AI_SYSTEM_PROMPT } from './ai-prompt';
import {
  aiConfigurationDiagnostics,
  configurationError,
  containsEntityOid,
  containsExactTerm,
  contextEntityIndex,
  DEFAULT_CONTEXT_MODE,
  DEFAULT_RESPONSE_MODE,
  externalConnectionOids,
  logicalLinkSteps,
  prepareAiContextDataset
} from './ai-context';
import {
  assertSafeObject,
  compactValidationReport,
  responsePayload,
  MAX_CONTEXT_ENTITIES,
  SUPPORTED_SCHEMAS,
  validateDatasetStructure
} from './ai-validation';
import type { AiConfigSource, AiDiagnostic, AiDraftConfig, AiExportState, AiValidation, ContextEntity, GenerateValidatedDraftOptions, GenerateValidatedDraftResult, RawAiScenario, SeafDataset } from './ai-types';

const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_CURRENT_DATASET_LENGTH = 250000;
const MAX_PROMPT_LENGTH = 20000;

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function boundedAttempts(value: unknown): number {
  const parsed = Number.parseInt(value as string, 10);
  if (!Number.isFinite(parsed)) return DEFAULT_MAX_ATTEMPTS;
  return Math.min(DEFAULT_MAX_ATTEMPTS, Math.max(1, parsed));
}

function stringValue(value: unknown, fallback: string): string {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function numberValue(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function booleanValue(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function resolveAiDraftConfig(
  profile: AiConfigSource | null | undefined,
  documentData: AiConfigSource | null | undefined
): AiDraftConfig {
  const profileConfig = isRecord(profile?.ai_assistant) ? profile.ai_assistant : {};
  const dataConfig = isRecord(documentData?.ai_assistant) ? documentData.ai_assistant : {};
  const config = { ...profileConfig, ...dataConfig };
  const scenario: RawAiScenario = isRecord(config.scenario) ? config.scenario : {};
  const contextMode = config.context_mode ?? config.contextMode ?? DEFAULT_CONTEXT_MODE;
  const responseMode = config.response_mode ?? config.responseMode ?? DEFAULT_RESPONSE_MODE;
  const resolvedSystemPrompt = stringValue(
    scenario.system_prompt,
    stringValue(config.system_prompt, DEFAULT_AI_SYSTEM_PROMPT)
  );
  return {
    ...config,
    enabled: profileConfig.enabled === true,
    maxAttempts: boundedAttempts(config.max_attempts ?? config.maxAttempts),
    contextMode: contextMode as string,
    responseMode: responseMode as string,
    diagnostics: aiConfigurationDiagnostics(contextMode, responseMode),
    scenario: {
      ...scenario,
      type: stringValue(scenario.type, 'gigachat'),
      temperature: numberValue(scenario.temperature, 0.1),
      history: booleanValue(scenario.history, true),
      system_prompt: resolvedSystemPrompt
    }
  };
}


export function assertGenerationCurrent(expectedGenerationId: unknown, activeGenerationId: unknown): void {
  if (expectedGenerationId !== activeGenerationId) throw new Error('Генерация отменена');

}

export function isAiExportBlocked({ aiApplied = false, aiBusy = false, aiPreviewXml = null }: AiExportState = {}): boolean {
  return Boolean(aiApplied || aiBusy || aiPreviewXml);

}

function initialRequest(prompt: string, currentDataset: SeafDataset): string {
  const cleanPrompt = String(prompt ?? '').trim();
  if (cleanPrompt.length > MAX_PROMPT_LENGTH) throw new Error(`Запрос длиннее ${MAX_PROMPT_LENGTH} символов`);
  const intent = normalizeAiPrompt(cleanPrompt);
  const serializedDataset = yaml.stringify(currentDataset);
  if (serializedDataset.length > MAX_CURRENT_DATASET_LENGTH) {
    throw new Error(`Текущий датасет длиннее ${MAX_CURRENT_DATASET_LENGTH} символов. Сузьте source документа для AI-генерации.`);
  }
  const contract = 'Верни только JSON или YAML объект вида {"selected_oids":["точный существующий OID"]}. Следуй канонической интерпретации; для категориального запроса выбери все существующие OID прямых категорий. Не возвращай сами объекты.';
  const requiredOids = requiredCategoryOids(cleanPrompt, currentDataset, intent);
  const requiredContract = requiredOids.length
    ? `\n\nОбязательные OID прямых категорий — selected_oids должен содержать каждый из них:\n${yaml.stringify(requiredOids)}`
    : '';
  return `Исходный запрос пользователя:\n${cleanPrompt}\n\nКаноническая интерпретация (обязательна):\n${intent.canonicalPrompt}\n\n${contract}${requiredContract}\n\nТекущий датасет, который нужно использовать как основу:\n\n${serializedDataset}`;
}

function repairRequest(previousResponse: unknown, diagnostics: AiDiagnostic[]): string {
  const contract = 'Верни исправленный объект только с selected_oids — массивом точных существующих OID из исходного набора. Сохрани все корректные OID предыдущего ответа и добавь пропущенные; не заменяй одну запрошенную категорию другой.';
  return `Предыдущий ответ не прошёл детерминированную проверку. ${contract}\n\nДиагностика:\n${yaml.stringify(diagnostics)}\n\nПредыдущий ответ:\n${String(previousResponse).slice(0, 50000)}`;
}

function explicitlyMentionedOids(normalizedPrompt: string, index: Map<string, ContextEntity>): Set<string> {
  const mentioned = new Set<string>();
  for (const [oid, { schema, entity }] of index) {
    if (containsEntityOid(normalizedPrompt, schema, oid)) mentioned.add(oid);
    const title = typeof entity.title === 'string' ? entity.title.trim().toLocaleLowerCase('ru-RU') : '';
    if (title.length >= 3 && containsExactTerm(normalizedPrompt, title)) mentioned.add(oid);
  }
  return mentioned;
}

function requiredCategoryOids(
  prompt: string,
  currentDataset: SeafDataset,
  intent = normalizeAiPrompt(prompt)
): string[] {
  const available = contextEntityIndex(currentDataset);
  const explicitlyMentioned = explicitlyMentionedOids(intent.normalizedText, available);
  const explicitlyMentionedSchemas = new Set([...explicitlyMentioned].map((oid) => (available.get(oid) as ContextEntity).schema));
  const required = new Set([...explicitlyMentioned]
    .filter((oid) => (available.get(oid) as ContextEntity).schema !== SCHEMAS.LOGICAL_LINK));
  for (const oid of explicitlyMentioned) {
    const item = available.get(oid) as ContextEntity;
    if (item.schema !== SCHEMAS.LOGICAL_LINK) continue;
    for (const step of logicalLinkSteps(oid, item.entity)) {
      required.add(step.sourceId);
      required.add(step.targetId);
    }
  }
  if (intent.externalConnectionsRequested) externalConnectionOids(available).forEach((oid) => required.add(oid));
  for (const [oid, { schema }] of available) {
    if (schema !== SCHEMAS.LOGICAL_LINK
      && intent.requestedSchemas.includes(schema)
      && !explicitlyMentionedSchemas.has(schema)) required.add(oid);
  }
  return [...required].sort();
}

function selectionOidsFromResponse(response: unknown, currentDataset: SeafDataset, prompt: string): string[] {
  const payload = responsePayload(response);
  const parsed = typeof payload === 'string' ? yaml.parse(payload) : payload;
  assertSafeObject(parsed);
  const selectedOids = isRecord(parsed) ? parsed.selected_oids ?? parsed.selectedOids : undefined;
  if (!Array.isArray(selectedOids) || !selectedOids.length || selectedOids.some((oid) => typeof oid !== 'string')) {
    throw new Error('Ответ selection должен содержать непустой массив selected_oids');
  }
  const available = contextEntityIndex(currentDataset);
  const resolved = selectedOids.map((selectedOid) => {
    if (available.has(selectedOid)) return selectedOid;
    const schemaQualifiedMatches = [...available.entries()]
      .filter(([oid, { schema }]) => selectedOid === `${schema}.${oid}`)
      .map(([oid]) => oid);
    return schemaQualifiedMatches.length === 1 ? schemaQualifiedMatches[0] : selectedOid;
  });
  const unique = [...new Set(resolved)];
  const unknown = unique.filter((oid) => !available.has(oid));
  if (unknown.length) throw new Error(`Выбраны отсутствующие OID: ${unknown.slice(0, 10).join(', ')}`);
  const required = requiredCategoryOids(prompt, currentDataset, normalizeAiPrompt(prompt))
    .filter((oid) => available.has(oid)
      && SUPPORTED_SCHEMAS.has((available.get(oid) as ContextEntity).schema)
      && (available.get(oid) as ContextEntity).schema !== SCHEMAS.LOGICAL_LINK);
  const drawableSelection = [...new Set([
    ...unique.filter((oid) => SUPPORTED_SCHEMAS.has((available.get(oid) as ContextEntity).schema)
      && (available.get(oid) as ContextEntity).schema !== SCHEMAS.LOGICAL_LINK),
    ...required
  ])];
  if (!drawableSelection.length) throw new Error('Ответ selection не содержит отображаемых объектов');
  if (drawableSelection.length > MAX_CONTEXT_ENTITIES) {
    throw new Error(`Выбрано ${drawableSelection.length} объектов при лимите ${MAX_CONTEXT_ENTITIES}. Уточните запрос.`);
  }
  return drawableSelection;
}

export async function generateValidatedDraft({
  prompt,
  currentDataset,
  maxAttempts = DEFAULT_MAX_ATTEMPTS,
  contextMode = DEFAULT_CONTEXT_MODE,
  responseMode = DEFAULT_RESPONSE_MODE,
  send,
  validate
}: GenerateValidatedDraftOptions): Promise<GenerateValidatedDraftResult> {
  const configurationDiagnostics = aiConfigurationDiagnostics(contextMode, responseMode);
  if (configurationDiagnostics.length) throw configurationError(configurationDiagnostics);
  const attempts = [];
  let request = initialRequest(prompt, currentDataset);
  const attemptLimit = boundedAttempts(maxAttempts);
  let lastDataset = null;
  let lastValidation = null;
  let lastResponse = null;

  for (let attempt = 1; attempt <= attemptLimit; attempt += 1) {
    const response = await send(request, attempt);
    lastResponse = response;
    let dataset: SeafDataset = currentDataset;
    let validation: AiValidation;
    try {
      const selectedOids = selectionOidsFromResponse(response, currentDataset, prompt);
      dataset = prepareAiContextDataset(currentDataset, { contextMode: 'compact' }, prompt, selectedOids);
      lastDataset = dataset;
      const structure = validateDatasetStructure(dataset);
      validation = structure.valid ? await validate(dataset) : structure;
    } catch (error) {
      validation = {
        valid: false,
        diagnostics: [{ code: 'parse_error', message: error instanceof Error ? error.message : String(error) }]
      };
    }

    const valid = validation?.valid === true;
    lastValidation = validation;
    const diagnostics = compactValidationReport(validation);
    attempts.push({ attempt, valid, diagnostics });
    if (valid) return { valid: true, dataset, validation, attempts, response };
    request = repairRequest(response, diagnostics);
  }

  return {
    valid: false,
    dataset: lastDataset,
    validation: lastValidation,
    attempts,
    response: lastResponse
  };
}

export { AI_PROMPT_SCHEMA_CATALOG, DEFAULT_AI_SYSTEM_PROMPT, normalizeAiPrompt } from './ai-prompt';
export { prepareAiContextDataset } from './ai-context';

export {
  compactValidationReport,
  validateDatasetStructure,
  validateDrawnCoverage
} from './ai-validation';
