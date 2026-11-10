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

import { SCHEMAS } from './constants';
import { buildLogicalLinkSteps } from './logical-routing';
import { normalizeAiPrompt } from './ai-prompt';
import { EXTERNAL_NETWORK_ZONES, MAX_CONTEXT_ENTITIES, REFERENCE_FIELDS, REFERENCE_TARGET_SCHEMAS, valueList } from './ai-validation';
import type { AiContextConfig, AiDiagnostic, ContextEntity, SeafDataset, SeafEntity } from './ai-types';

function isRecord(value: unknown): value is SeafEntity {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

const COMPACT_CONTEXT_EXCLUDED_FIELDS = new Set(['OID', 'schema', 'id', 'label', 'description', 'comments']);
const SENSITIVE_FIELD_PATTERN = /(password|credential|secret|token|private[_-]?key|api[_-]?key)/i;

export const DEFAULT_CONTEXT_MODE = 'compact';
export const DEFAULT_RESPONSE_MODE = 'selection';
const SUPPORTED_CONTEXT_MODES = new Set([DEFAULT_CONTEXT_MODE]);
const SUPPORTED_RESPONSE_MODES = new Set([DEFAULT_RESPONSE_MODE]);

export function aiConfigurationDiagnostics(contextMode: unknown, responseMode: unknown): AiDiagnostic[] {
  const diagnostics: AiDiagnostic[] = [];
  if (!SUPPORTED_CONTEXT_MODES.has(contextMode as string)) {
    diagnostics.push({
      code: 'invalid_configuration',
      field: 'context_mode',
      value: contextMode,
      message: `Неизвестный context_mode: ${String(contextMode)}. Поддерживается: ${[...SUPPORTED_CONTEXT_MODES].join(', ')}`
    });
  }
  if (!SUPPORTED_RESPONSE_MODES.has(responseMode as string)) {
    diagnostics.push({
      code: 'invalid_configuration',
      field: 'response_mode',
      value: responseMode,
      message: `Неизвестный response_mode: ${String(responseMode)}. Поддерживается: ${[...SUPPORTED_RESPONSE_MODES].join(', ')}`
    });
  }
  return diagnostics;
}

export function configurationError(diagnostics: AiDiagnostic[]): Error & { code: string; diagnostics: AiDiagnostic[] } {
  const error = new Error(diagnostics.map(({ message }) => message).join('; ')) as Error & { code: string; diagnostics: AiDiagnostic[] };
  error.code = 'invalid_configuration';
  error.diagnostics = diagnostics;
  return error;
}

function compactAiContextValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(compactAiContextValue);
  if (!isRecord(value)) return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !key.startsWith('__'))
      .filter(([key]) => !COMPACT_CONTEXT_EXCLUDED_FIELDS.has(key))
      .filter(([key]) => !SENSITIVE_FIELD_PATTERN.test(key))
      .map(([key, item]) => [key, compactAiContextValue(item)])
  );
}

export function contextEntityIndex(dataset: SeafDataset): Map<string, ContextEntity> {
  const index = new Map<string, ContextEntity>();
  for (const [schema, entities] of Object.entries(dataset || {})) {
    if (!isRecord(entities)) continue;
    for (const [oid, entity] of Object.entries(entities)) {
      if (isRecord(entity)) index.set(oid, { schema, entity });
    }
  }
  return index;
}

export function containsExactTerm(text: string, term: string): boolean {
  if (!term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(?<![\\p{L}\\p{N}_.-])${escaped}(?![\\p{L}\\p{N}_.-])`, 'iu').test(text);
}

export function containsEntityOid(text: string, schema: string, oid: string): boolean {
  const normalizedOid = oid.toLocaleLowerCase('ru-RU');
  const searchableText = text.replace(/[.,;:](?=$|\s)/gu, ' ');
  return containsExactTerm(searchableText, normalizedOid)
    || containsExactTerm(searchableText, `${schema}.${normalizedOid}`.toLocaleLowerCase('ru-RU'));
}

export function externalConnectionOids(index: Map<string, ContextEntity>): string[] {
  const externalSegments = new Set([...index.entries()]
    .filter(([, { schema, entity }]) => schema === SCHEMAS.NETWORK_SEGMENT
      && typeof entity.zone === 'string'
      && EXTERNAL_NETWORK_ZONES.has(entity.zone))
    .map(([oid]) => oid));
  const externalNetworks = new Set([...index.entries()]
    .filter(([, { schema, entity }]) => schema === SCHEMAS.NETWORK && (entity.type === 'WAN'
      || valueList(entity.segment).some((oid) => typeof oid === 'string' && externalSegments.has(oid))))
    .map(([oid]) => oid));
  const selected = new Set(externalNetworks);
  for (const [oid, { schema, entity }] of index) {
    if (schema === SCHEMAS.NETWORK_LINK
      && valueList(entity.network_connection).some((networkOid) => typeof networkOid === 'string' && externalNetworks.has(networkOid))) selected.add(oid);
    if (schema === SCHEMAS.COMPONENT_NETWORK
      && valueList(entity.network_connection).some((networkOid) => typeof networkOid === 'string' && externalNetworks.has(networkOid))) selected.add(oid);
  }
  let changed = true;
  while (changed) {
    changed = false;
    for (const [oid, { schema, entity }] of index) {
      if (schema !== SCHEMAS.COMPONENT_NETWORK) continue;
      const peers = valueList(entity.network_connection_devices);
      if (!selected.has(oid) && peers.some((peer) => typeof peer === 'string' && selected.has(peer))) {
        selected.add(oid);
        changed = true;
      }
      if (selected.has(oid)) {
        for (const peer of peers) {
          if (typeof peer === 'string' && index.has(peer) && !selected.has(peer)) {
            selected.add(peer);
            changed = true;
          }
        }
      }
    }
  }
  return [...selected].sort();
}

function contextReferencesByField(schema: string, entity: SeafEntity, index: Map<string, ContextEntity>): Record<string, string[]> {
  return Object.fromEntries(Object.keys(REFERENCE_TARGET_SCHEMAS[schema] || {}).map((field) => {
    const references: string[] = [];
    const visit = (value: unknown): void => {
      if (typeof value === 'string' && index.has(value)) references.push(value);
      else if (Array.isArray(value)) value.forEach(visit);
    };
    visit(entity[field]);
    return [field, references];
  }));
}

function pruneContextReferences(schema: string, entity: SeafEntity, selected: Set<string>): SeafEntity {
  const result = { ...entity };
  const allowedReferenceFields = new Set(Object.keys(REFERENCE_TARGET_SCHEMAS[schema] || {}));
  for (const field of REFERENCE_FIELDS) {
    if (!allowedReferenceFields.has(field)) delete result[field];
  }
  for (const field of Object.keys(REFERENCE_TARGET_SCHEMAS[schema] || {})) {
    if (!(field in result)) continue;
    if (Array.isArray(result[field])) result[field] = result[field].filter((oid): oid is string => typeof oid === 'string' && selected.has(oid));
    else if (typeof result[field] === 'string' && !selected.has(result[field])) delete result[field];
  }
  return result;
}

export function logicalLinkSteps(linkOid: string, entity: SeafEntity): Array<{ sourceId: string; targetId: string }> {
  return buildLogicalLinkSteps({
    linkOid,
    linkData: { ...entity },
    targetsKey: 'target'
  }) as Array<{ sourceId: string; targetId: string }>;
}

function logicalStepTouches(
  step: { sourceId: string; targetId: string },
  linkDirection: unknown,
  requestedDirection: string,
  selected: Set<string>
): boolean {
  if (requestedDirection === 'any' || linkDirection === '<==>') {
    return selected.has(step.sourceId) || selected.has(step.targetId);
  }
  const flowSource = linkDirection === '<==' ? step.targetId : step.sourceId;
  const flowTarget = linkDirection === '<==' ? step.sourceId : step.targetId;
  return requestedDirection === 'incoming' ? selected.has(flowTarget) : selected.has(flowSource);
}

function selectPromptContext(dataset: SeafDataset, prompt: string, selectedOids: string[] | null = null): SeafDataset {
  const index = contextEntityIndex(dataset);
  const intent = normalizeAiPrompt(prompt);
  const normalizedPrompt = intent.normalizedText;
  if (!normalizedPrompt || !index.size) return dataset;

  const promptExplicitOids = new Set([...index.entries()]
    .filter(([oid, { schema }]) => containsEntityOid(normalizedPrompt, schema, oid))
    .map(([oid]) => oid));
  const explicitLogicalLinkOids = new Set([...promptExplicitOids]
    .filter((oid) => (index.get(oid) as ContextEntity).schema === SCHEMAS.LOGICAL_LINK));
  for (const [oid, { entity, schema }] of index) {
    if (schema !== SCHEMAS.LOGICAL_LINK) continue;
    const title = typeof entity.title === 'string' ? entity.title.trim().toLocaleLowerCase('ru-RU') : '';
    if (title.length >= 3 && containsExactTerm(normalizedPrompt, title)) explicitLogicalLinkOids.add(oid);
  }
  const promptNamedOids = new Set([...promptExplicitOids]
    .filter((oid) => (index.get(oid) as ContextEntity).schema !== SCHEMAS.LOGICAL_LINK));
  for (const [oid, { entity, schema }] of index) {
    if (schema === SCHEMAS.LOGICAL_LINK) continue;
    const title = typeof entity.title === 'string' ? entity.title.trim().toLocaleLowerCase('ru-RU') : '';
    if (title.length >= 3 && containsExactTerm(normalizedPrompt, title)) promptNamedOids.add(oid);
  }
  const suppliedSelection = Array.isArray(selectedOids);
  const direct = new Set((suppliedSelection ? selectedOids : [...promptNamedOids])
    .filter((oid) => index.has(oid) && (index.get(oid) as ContextEntity).schema !== SCHEMAS.LOGICAL_LINK));

  const explicitlyRequestedSchemas = new Set([...direct].map((oid) => (index.get(oid) as ContextEntity).schema));
  if (!suppliedSelection && intent.externalConnectionsRequested) {
    for (const oid of externalConnectionOids(index)) {
      direct.add(oid);
    }
  }

  if (!suppliedSelection) {
    for (const [oid, { schema }] of index) {
      if (schema !== SCHEMAS.LOGICAL_LINK
        && intent.requestedSchemas.includes(schema)
        && !explicitlyRequestedSchemas.has(schema)) direct.add(oid);
    }
  }
  if (direct.size > MAX_CONTEXT_ENTITIES) {
    throw new Error(`Запрос выбирает ${direct.size} объектов при лимите ${MAX_CONTEXT_ENTITIES}. Уточните запрос.`);
  }

  const includeAllLinks = intent.logicalLinkScope === 'adjacent'
    && intent.logicalLinksRequested
    && !promptNamedOids.size
    && !explicitLogicalLinkOids.size
    && !intent.externalConnectionsRequested
    && !intent.requestedSchemas.some((schema) => schema !== SCHEMAS.LOGICAL_LINK);
  if (!direct.size && !explicitLogicalLinkOids.size && !includeAllLinks) return dataset;

  const selected = new Set(direct);
  const queue = [...direct];
  const addWithLimit = (oid: string): void => {
    if (!index.has(oid) || selected.has(oid)) return;
    if (selected.size >= MAX_CONTEXT_ENTITIES) {
      throw new Error(`Запрос с зависимостями превышает лимит ${MAX_CONTEXT_ENTITIES} объектов. Уточните запрос.`);
    }
    selected.add(oid);
    queue.push(oid);
  };

  if (intent.logicalLinkScope !== 'none') {
    for (const [oid, { schema, entity }] of index) {
      if (schema !== SCHEMAS.LOGICAL_LINK) continue;
      const steps = logicalLinkSteps(oid, entity);
      const between = steps.length > 0
        && steps.every((step) => direct.has(step.sourceId) && direct.has(step.targetId));
      const adjacent = steps.some((step) => logicalStepTouches(
        step,
        entity.direction,
        intent.logicalLinkDirection,
        direct
      ));
      const included = explicitLogicalLinkOids.size
        ? explicitLogicalLinkOids.has(oid)
        : includeAllLinks || (intent.logicalLinkScope === 'between' ? between : adjacent);
      if (!included) continue;
      addWithLimit(oid);
      for (const step of steps) {
        addWithLimit(step.sourceId);
        addWithLimit(step.targetId);
      }
    }
  }

  while (queue.length) {
    const oid = queue.shift() as string;
    const item = index.get(oid) as ContextEntity;
    if (item.schema === SCHEMAS.NETWORK_SERVICE) {
      for (const [memberOid, member] of index) {
        if (member.schema === SCHEMAS.COMPONENT_NETWORK && valueList(member.entity.is_part_of).includes(oid)) {
          addWithLimit(memberOid);
        }
      }
    }
    const selectiveFields = new Set(['location', 'network_connection', 'monitored_services', 'protected_services', 'source', 'target']);
    for (const [field, references] of Object.entries(contextReferencesByField(item.schema, item.entity, index))) {
      const directReferences = references.filter((reference) => direct.has(reference));
      const dependencies = selectiveFields.has(field) && directReferences.length ? directReferences : references;
      const filtered = ['monitored_services', 'protected_services'].includes(field) ? directReferences : dependencies;
      filtered.forEach(addWithLimit);
    }
  }

  const result: Record<string, Record<string, SeafEntity>> = {};
  for (const oid of selected) {
    const { schema, entity } = index.get(oid) as ContextEntity;
    if (!result[schema]) result[schema] = {};
    result[schema][oid] = pruneContextReferences(schema, entity, selected);
  }
  return result;
}

export function prepareAiContextDataset(
  dataset: SeafDataset,
  config: AiContextConfig = {},
  prompt = '',
  selectedOids: string[] | null = null
): SeafDataset {
  const contextMode = config.contextMode ?? config.context_mode ?? DEFAULT_CONTEXT_MODE;
  const diagnostics = aiConfigurationDiagnostics(contextMode, DEFAULT_RESPONSE_MODE)
    .filter(({ field }) => field === 'context_mode');
  if (diagnostics.length) throw configurationError(diagnostics);
  return compactAiContextValue(selectPromptContext(dataset, prompt, selectedOids)) as SeafDataset;
}
