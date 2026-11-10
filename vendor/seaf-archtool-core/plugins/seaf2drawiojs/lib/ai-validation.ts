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
import type { AiDiagnostic, AiValidation, AiVerificationReport, SeafEntity } from './ai-types';

export const MAX_CONTEXT_ENTITIES = 200;

function isRecord(value: unknown): value is SeafEntity {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}


const MAX_DIAGNOSTIC_ITEMS = 30;
const MAX_RESPONSE_LENGTH = 500000;
const MAX_STRING_LENGTH = 50000;
const MAX_DEPTH = 30;
const MAX_ENTITIES = 5000;
const SCHEMA_PREFIX = 'seaf.company.ta.';
const LEGACY_SCHEMA_PREFIX = 'seaf.ta.';
export const SUPPORTED_SCHEMAS = new Set(Object.values(SCHEMAS).filter((schema) => schema !== SCHEMAS.HW_STORAGE));
const SOFTWARE_SCHEMA = 'seaf.company.ta.services.softwares';
export const COMPONENT_HW_STORAGE = 'seaf.company.ta.components.hw_storages';
const ALLOWED_NON_DRAWABLE_SCHEMAS = new Set([SOFTWARE_SCHEMA, COMPONENT_HW_STORAGE]);
const STRUCTURALLY_SUPPORTED_SCHEMAS = new Set([...SUPPORTED_SCHEMAS, ...ALLOWED_NON_DRAWABLE_SCHEMAS]);
const NETWORK_PLACEMENT_REQUIRED_SCHEMAS = new Set([SCHEMAS.MONITORING, SCHEMAS.KB]);
const LOGICAL_DIRECTIONS = new Set(['==>', '<==', '<==>']);
const LOGICAL_TOPOLOGIES = new Set(['star', 'chain']);
const MONITORING_ROLES = new Set(['Трейсинг', 'Журналирование', 'Инфраструктурный', 'Прикладной']);
const KB_STATUSES = new Set(['Создается', 'Используется', 'Выводится', 'В архиве']);
const NETWORK_ZONES = new Set(['DMZ', 'EXT-WAN-EDGE', 'INET-EDGE', 'INT-NET', 'INT-SECURITY-NET', 'INT-WAN-EDGE', 'INTERNET', 'TRANSPORT-WAN']);
export const EXTERNAL_NETWORK_ZONES = new Set(['EXT-WAN-EDGE', 'INET-EDGE', 'INTERNET', 'TRANSPORT-WAN']);
const SOFTWARE_TYPES = new Set(['Открытая', 'Закрытая бесплатная', 'Закрытая платная']);
const LOGICAL_ENDPOINT_SCHEMAS = new Set([
  COMPONENT_HW_STORAGE,
  SCHEMAS.COMPONENT_NETWORK,
  SCHEMAS.COMPONENT_SERVER,
  SCHEMAS.COMPONENT_USER_DEVICE,
  SCHEMAS.BACKUP,
  SCHEMAS.CLUSTER_VIRTUALIZATION,
  SCHEMAS.COMPUTE_SERVICE,
  SCHEMAS.DC,
  SCHEMAS.DC_AZ,
  SCHEMAS.DC_REGION,
  SCHEMAS.K8S,
  SCHEMAS.KB,
  SCHEMAS.MONITORING,
  SCHEMAS.NETWORK,
  SCHEMAS.NETWORK_SERVICE,
  SCHEMAS.NETWORK_LINK,
  SCHEMAS.NETWORK_SEGMENT,
  SCHEMAS.DC_OFFICE,
  SCHEMAS.STORAGE
]);
const MONITORED_SERVICE_SCHEMAS = new Set([
  SCHEMAS.K8S,
  SCHEMAS.COMPONENT_SERVER,
  SCHEMAS.COMPUTE_SERVICE,
  SCHEMAS.CLUSTER_VIRTUALIZATION,
  SCHEMAS.STORAGE,
  SCHEMAS.NETWORK,
  SCHEMAS.KB,
  SCHEMAS.BACKUP,
  SCHEMAS.MONITORING
]);
const PROTECTED_SERVICE_SCHEMAS = new Set([
  SCHEMAS.K8S,
  SCHEMAS.COMPONENT_SERVER,
  SCHEMAS.COMPONENT_USER_DEVICE,
  COMPONENT_HW_STORAGE,
  SCHEMAS.COMPUTE_SERVICE,
  SCHEMAS.CLUSTER_VIRTUALIZATION,
  SCHEMAS.STORAGE,
  SCHEMAS.NETWORK,
  SCHEMAS.MONITORING,
  SCHEMAS.BACKUP
]);
const LOCATION_SCHEMAS = new Set([SCHEMAS.DC, SCHEMAS.DC_OFFICE]);
const KB_VARIANTS = [
  [['Потоковый антивирус'], ['AV']],
  [['Мониторинг действий пользователей'], ['UAM']],
  [['Динамический анализ угроз Sandbox', 'Инструментальный контроль защищенности'], ['Sandbox', 'SCAN']],
  [['Межсетевое экранирование', 'Управление доступом пользователей', 'Контроль подключений к сети', 'Контентная фильтрация и разграничение доступа в Интернет'], ['FW', 'IDFW', 'NAC', 'Proxy']],
  [['Сигнатурный анализ режим обнаружения вторжений', 'Сигнатурный анализ режим предотвращения вторжений', 'Поведенческий анализ сетевого трафика'], ['IDS', 'IPS', 'NBA']],
  [['Защита от атак типа "Отказ от обслуживания"', 'Защита веб-приложений WAF', 'Шлюзы безопасности прикладного уровня'], ['DDoS', 'WAF', 'ALG']],
  [['Защита от утечек информации'], ['DLP']],
  [['Аудит событий КБ'], ['Log']],
  [['Безопасность конфигураций'], ['CS']],
  [['Центр управления сертификатами ИБ'], ['CMC']],
  [['Защита от мошеннических операций'], ['AntiFraud']],
  [['Провайдер идентификации (IdP)', 'Управление учетными записями (IdM)'], ['IdP', 'IdM']],
  [['AAA'], ['AAA']],
  [['Управление привилегированным доступом'], ['PAM']],
  [['Сервис хранения секретов'], ['Secrets']],
  [['Политики Kubernetes'], ['Policy']],
  [['Репозиторий ПО', 'Реестр контейнеров'], ['Repo', 'Registry']]
];
export const REFERENCE_TARGET_SCHEMAS: Record<string, Record<string, Set<string>>> = {
  [SCHEMAS.DC]: {
    availabilityzone: new Set([SCHEMAS.DC_AZ])
  },
  [SCHEMAS.DC_AZ]: {
    region: new Set([SCHEMAS.DC_REGION])
  },
  [SCHEMAS.DC_OFFICE]: {
    region: new Set([SCHEMAS.DC_REGION])
  },
  [SCHEMAS.NETWORK]: {
    location: LOCATION_SCHEMAS,
    segment: new Set([SCHEMAS.NETWORK_SEGMENT])
  },
  [SCHEMAS.NETWORK_SEGMENT]: {
    location: LOCATION_SCHEMAS
  },
  [SCHEMAS.NETWORK_SERVICE]: {
    location: LOCATION_SCHEMAS,
    segment: new Set([SCHEMAS.NETWORK_SEGMENT]),
    network_connection: new Set([SCHEMAS.NETWORK])
  },
  [SCHEMAS.COMPONENT_NETWORK]: {
    location: LOCATION_SCHEMAS,
    segment: new Set([SCHEMAS.NETWORK_SEGMENT]),
    network_connection: new Set([SCHEMAS.NETWORK]),
    network_connection_devices: new Set([SCHEMAS.COMPONENT_NETWORK, SCHEMAS.NETWORK_LINK]),
    is_part_of: new Set([SCHEMAS.NETWORK_SERVICE])
  },
  [SCHEMAS.COMPONENT_USER_DEVICE]: {
    location: LOCATION_SCHEMAS,
    segment: new Set([SCHEMAS.NETWORK_SEGMENT]),
    network_connection: new Set([SCHEMAS.NETWORK]),
    network_connection_devices: new Set([SCHEMAS.NETWORK_LINK])
  },
  [SCHEMAS.COMPUTE_SERVICE]: {
    availabilityzone: new Set([SCHEMAS.DC_AZ]),
    location: LOCATION_SCHEMAS,
    network_connection: new Set([SCHEMAS.NETWORK])
  },
  [SCHEMAS.CLUSTER_VIRTUALIZATION]: {
    availabilityzone: new Set([SCHEMAS.DC_AZ]),
    location: LOCATION_SCHEMAS,
    network_connection: new Set([SCHEMAS.NETWORK])
  },
  [SCHEMAS.MONITORING]: {
    availabilityzone: new Set([SCHEMAS.DC_AZ]),
    location: LOCATION_SCHEMAS,
    network_connection: new Set([SCHEMAS.NETWORK]),
    monitored_services: MONITORED_SERVICE_SCHEMAS
  },
  [SCHEMAS.K8S]: {
    availabilityzone: new Set([SCHEMAS.DC_AZ]),
    location: LOCATION_SCHEMAS,
    network_connection: new Set([SCHEMAS.NETWORK])
  },
  [SCHEMAS.BACKUP]: {
    availabilityzone: new Set([SCHEMAS.DC_AZ]),
    location: LOCATION_SCHEMAS,
    network_connection: new Set([SCHEMAS.NETWORK])
  },
  [SCHEMAS.KB]: {
    softwares: new Set([SOFTWARE_SCHEMA]),
    network_connection: new Set([SCHEMAS.NETWORK]),
    protected_services: PROTECTED_SERVICE_SCHEMAS
  },
  [SCHEMAS.LOGICAL_LINK]: {
    source: LOGICAL_ENDPOINT_SCHEMAS,
    target: LOGICAL_ENDPOINT_SCHEMAS
  },
  [SCHEMAS.NETWORK_LINK]: {
    network_connection: new Set([SCHEMAS.NETWORK])
  },
  [COMPONENT_HW_STORAGE]: {
    location: LOCATION_SCHEMAS,
    network_connection: new Set([SCHEMAS.NETWORK]),
    sw_storage_connected: new Set([SCHEMAS.STORAGE])
  }
};
export const REFERENCE_FIELDS = new Set([
  'region',
  'az',
  'availabilityzone',
  'location',
  'segment',
  'network_connection',
  'network_connection_devices',
  'is_part_of',
  'softwares',
  'monitored_services',
  'protected_services',
  'sw_storage_connected',
  'source',
  'target'
]);

export function responsePayload(response: unknown): unknown {
  if (isRecord(response)) {
    if (JSON.stringify(response).length > MAX_RESPONSE_LENGTH) throw new Error(`Ответ длиннее ${MAX_RESPONSE_LENGTH} символов`);
    assertSafeObject(response);
    return response;
  }
  if (typeof response !== 'string') throw new Error('Ответ должен быть строкой или объектом');
  const source = response.trim();
  if (source.length > MAX_RESPONSE_LENGTH) throw new Error(`Ответ длиннее ${MAX_RESPONSE_LENGTH} символов`);
  const fenced = [...source.matchAll(/```(?:ya?ml|json)?\s*([\s\S]*?)```/gi)];
  if (fenced.length > 1) throw new Error('Ответ содержит несколько fenced-блоков');
  if (fenced.length === 1) {
    const outside = source.replace(fenced[0][0], '').trim();
    if (outside) throw new Error('Вне fenced-блока найден дополнительный текст');
    return fenced[0][1].trim();
  }
  return source;
}

export function assertSafeObject(value: unknown, path = '$', depth = 0): void {
  if (depth > MAX_DEPTH) throw new Error(`Превышена максимальная глубина ${MAX_DEPTH} в ${path}`);
  if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
    throw new Error(`Строка ${path} длиннее ${MAX_STRING_LENGTH} символов`);
  }
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertSafeObject(item, `${path}[${index}]`, depth + 1));
    return;
  }
  if (!isRecord(value)) return;
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      throw new Error(`Запрещённый ключ ${path}.${key}`);
    }
    assertSafeObject(value[key], `${path}.${key}`, depth + 1);
  }
}

export function valueList(value: unknown): unknown[] {
  if (value === undefined || value === null || value === '') return [];
  return Array.isArray(value) ? value : [value];
}

function pushDiagnostic(diagnostics: AiDiagnostic[], code: string, message: string, details: Record<string, unknown> = {}): void {
  diagnostics.push({ code, message, ...details });
}

function requireFields(diagnostics: AiDiagnostic[], schema: string, id: string, entity: SeafEntity, fields: string[]): void {
  for (const field of fields) {
    if (entity[field] === undefined || entity[field] === null) {
      pushDiagnostic(diagnostics, 'required_field', `У объекта ${id} отсутствует обязательное поле ${field}`, { schema, id, field });
    }
  }
}

function requireType(
  diagnostics: AiDiagnostic[],
  schema: string,
  id: string,
  entity: SeafEntity,
  field: string,
  type: 'array' | 'integer' | 'string' | 'boolean',
  options: { nonEmpty?: boolean; itemType?: string } = {}
): void {
  const value = entity[field];
  if (value === undefined || value === null) return;
  const valid = type === 'array'
    ? Array.isArray(value)
    : type === 'integer'
      ? Number.isInteger(value)
      : typeof value === type;
  if (!valid) {
    pushDiagnostic(diagnostics, 'invalid_field_type', `Поле ${id}.${field} должно иметь тип ${type}`, { schema, id, field, expectedType: type });
    return;
  }
  if (type === 'array' && Array.isArray(value) && options.nonEmpty && value.length === 0) {
    pushDiagnostic(diagnostics, 'empty_required_array', `Массив ${id}.${field} не должен быть пустым`, { schema, id, field });
  }
  if (type === 'array' && Array.isArray(value) && options.itemType && value.some((item) => typeof item !== options.itemType)) {
    pushDiagnostic(diagnostics, 'invalid_array_item_type', `Элементы ${id}.${field} должны иметь тип ${options.itemType}`, { schema, id, field, expectedType: options.itemType });
  }
}

function requireEnum(diagnostics: AiDiagnostic[], schema: string, id: string, entity: SeafEntity, field: string, values: Set<string>): void {
  const value = entity[field];
  if (value === undefined || value === null || typeof value !== 'string') return;
  if (!values.has(value)) {
    pushDiagnostic(diagnostics, 'invalid_enum', `Недопустимое значение ${id}.${field}: ${value}`, { schema, id, field, value, allowed: [...values] });
  }
}

function validateSchemaEntity(diagnostics: AiDiagnostic[], schema: string, id: string, entity: SeafEntity): void {
  if (!isRecord(entity)) return;
  if (schema === SCHEMAS.DC) {
    requireFields(diagnostics, schema, id, entity, ['vendor', 'availabilityzone']);
    requireType(diagnostics, schema, id, entity, 'vendor', 'string');
    requireType(diagnostics, schema, id, entity, 'availabilityzone', 'string');
  } else if (schema === SCHEMAS.DC_AZ) {
    requireFields(diagnostics, schema, id, entity, ['vendor', 'region']);
    requireType(diagnostics, schema, id, entity, 'vendor', 'string');
    requireType(diagnostics, schema, id, entity, 'region', 'string');
  } else if (schema === SCHEMAS.NETWORK) {
    requireFields(diagnostics, schema, id, entity, ['type', 'location']);
    requireType(diagnostics, schema, id, entity, 'type', 'string');
    requireType(diagnostics, schema, id, entity, 'location', 'array', { itemType: 'string' });
    if (entity.type === 'LAN') {
      requireFields(diagnostics, schema, id, entity, ['lan_type', 'ipnetwork']);
      requireType(diagnostics, schema, id, entity, 'lan_type', 'string');
      requireEnum(diagnostics, schema, id, entity, 'lan_type', new Set(['Проводная', 'Беспроводная']));
      requireType(diagnostics, schema, id, entity, 'ipnetwork', 'string');
    } else if (entity.type === 'WAN') {
      requireFields(diagnostics, schema, id, entity, ['wan_ip', 'provider']);
      requireType(diagnostics, schema, id, entity, 'wan_ip', 'string');
      requireType(diagnostics, schema, id, entity, 'provider', 'string');
    } else if (entity.type !== undefined) {
      pushDiagnostic(diagnostics, 'invalid_enum', `Недопустимое значение ${id}.type: ${entity.type}`, { schema, id, field: 'type', value: entity.type, allowed: ['LAN', 'WAN'] });
    }
    requireType(diagnostics, schema, id, entity, 'segment', 'array', { itemType: 'string' });
  } else if (schema === SCHEMAS.NETWORK_SEGMENT) {
    requireFields(diagnostics, schema, id, entity, ['location', 'zone']);
    requireType(diagnostics, schema, id, entity, 'location', 'string');
    requireType(diagnostics, schema, id, entity, 'zone', 'string');
    requireEnum(diagnostics, schema, id, entity, 'zone', NETWORK_ZONES);
  } else if (schema === SCHEMAS.MONITORING) {
    requireFields(diagnostics, schema, id, entity, ['role', 'ha', 'network_connection', 'monitored_services']);
    requireType(diagnostics, schema, id, entity, 'role', 'array', { nonEmpty: true, itemType: 'string' });
    if (Array.isArray(entity.role)) {
      for (const role of entity.role) if (!MONITORING_ROLES.has(role)) pushDiagnostic(diagnostics, 'invalid_enum', `Недопустимая роль ${id}.role: ${role}`, { schema, id, field: 'role', value: role, allowed: [...MONITORING_ROLES] });
    }
    requireType(diagnostics, schema, id, entity, 'ha', 'boolean');
    requireType(diagnostics, schema, id, entity, 'availabilityzone', 'array', { itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'location', 'array', { itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'network_connection', 'array', { nonEmpty: true, itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'monitored_services', 'array', { itemType: 'string' });
  } else if (schema === SCHEMAS.KB) {
    requireFields(diagnostics, schema, id, entity, ['technology', 'softwares', 'tag', 'status', 'network_connection']);
    for (const field of ['technology', 'tag', 'status']) requireType(diagnostics, schema, id, entity, field, 'string');
    requireType(diagnostics, schema, id, entity, 'softwares', 'array', { nonEmpty: true, itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'network_connection', 'array', { itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'protected_services', 'array', { itemType: 'string' });
    requireEnum(diagnostics, schema, id, entity, 'status', KB_STATUSES);
    const technology = entity.technology;
    const tag = entity.tag;
    if (typeof technology === 'string' && typeof tag === 'string') {
      const variantMatch = KB_VARIANTS.some(([technologies, tags]) => technologies.includes(technology) && tags.includes(tag));
      if (!variantMatch) pushDiagnostic(diagnostics, 'invalid_kb_variant', `Пара technology/tag объекта ${id} не соответствует ни одному типу KB`, { schema, id, technology, tag });
    }
  } else if (schema === SCHEMAS.LOGICAL_LINK) {
    requireFields(diagnostics, schema, id, entity, ['source', 'target', 'direction']);
    requireType(diagnostics, schema, id, entity, 'source', 'string');
    requireType(diagnostics, schema, id, entity, 'target', 'array', { itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'direction', 'string');
    requireEnum(diagnostics, schema, id, entity, 'direction', LOGICAL_DIRECTIONS);
    requireType(diagnostics, schema, id, entity, 'topology', 'string');
    requireEnum(diagnostics, schema, id, entity, 'topology', LOGICAL_TOPOLOGIES);
  } else if (schema === SOFTWARE_SCHEMA) {
    requireFields(diagnostics, schema, id, entity, ['vendor', 'type', 'support', 'expiration']);
    for (const field of ['vendor', 'type', 'support', 'expiration']) requireType(diagnostics, schema, id, entity, field, 'string');
    requireEnum(diagnostics, schema, id, entity, 'type', SOFTWARE_TYPES);
  } else if (schema === COMPONENT_HW_STORAGE) {
    requireFields(diagnostics, schema, id, entity, ['vendor', 'volume', 'location']);
    requireType(diagnostics, schema, id, entity, 'vendor', 'string');
    requireType(diagnostics, schema, id, entity, 'volume', 'integer');
    requireType(diagnostics, schema, id, entity, 'location', 'array', { itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'network_connection', 'array', { itemType: 'string' });
    requireType(diagnostics, schema, id, entity, 'sw_storage_connected', 'array', { itemType: 'string' });
  }
}

export function validateDatasetStructure(dataset: unknown): AiValidation {
  const diagnostics: AiDiagnostic[] = [];
  if (!isRecord(dataset)) {
    pushDiagnostic(diagnostics, 'dataset_not_object', 'Датасет должен быть объектом');
    return { valid: false, diagnostics, entityCount: 0, schemaCount: 0 };
  }

  const schemaEntries = Object.entries(dataset);
  const entityIds = new Set<string>();
  const entitySchemas = new Map<string, string>();
  let entityCount = 0;

  for (const [schema, entities] of schemaEntries) {
    if (schema.startsWith(LEGACY_SCHEMA_PREFIX)) {
      pushDiagnostic(diagnostics, 'legacy_schema', `Устаревшая схема ${schema}`, { schema });
    } else if (!schema.startsWith(SCHEMA_PREFIX)) {
      pushDiagnostic(diagnostics, 'unknown_top_level_key', `Верхнеуровневый ключ ${schema} не является схемой SEAF TA`, { schema });
    } else if (!STRUCTURALLY_SUPPORTED_SCHEMAS.has(schema)) {
      pushDiagnostic(diagnostics, 'unsupported_schema', `SEAF2DrawIO не поддерживает схему ${schema}`, { schema });
    }
    if (!isRecord(entities)) {
      pushDiagnostic(diagnostics, 'schema_not_object', `Схема ${schema} должна содержать словарь OID -> объект`, { schema });
      continue;
    }
    for (const [id, entity] of Object.entries(entities)) {
      entityCount += 1;
      if (entityCount === MAX_ENTITIES + 1) {
        pushDiagnostic(diagnostics, 'too_many_entities', `Датасет содержит больше ${MAX_ENTITIES} объектов`);
      }
      if (!id.trim()) pushDiagnostic(diagnostics, 'empty_oid', `В схеме ${schema} найден пустой OID`, { schema });
      if (entityIds.has(id)) pushDiagnostic(diagnostics, 'duplicate_oid', `OID ${id} встречается в нескольких схемах`, { schema, id });
      entityIds.add(id);
      if (!entitySchemas.has(id)) entitySchemas.set(id, schema);
      if (!isRecord(entity)) {
        pushDiagnostic(diagnostics, 'entity_not_object', `Объект ${id} должен быть словарём`, { schema, id });
        continue;
      }
      if (typeof entity.title !== 'string' || !entity.title.trim()) {
        pushDiagnostic(diagnostics, 'missing_title', `У объекта ${id} отсутствует непустой title`, { schema, id });
      }
      if (NETWORK_PLACEMENT_REQUIRED_SCHEMAS.has(schema) && !valueList(entity.network_connection).length) {
        pushDiagnostic(diagnostics, 'missing_network_placement', `У объекта ${id} отсутствует network_connection для размещения на схеме`, { schema, id });
      }
      validateSchemaEntity(diagnostics, schema, id, entity);
    }
  }

  if (!schemaEntries.length) pushDiagnostic(diagnostics, 'empty_dataset', 'Датасет не содержит схем');
  if (!entityCount) pushDiagnostic(diagnostics, 'empty_dataset', 'Датасет не содержит объектов');

  for (const [schema, entities] of schemaEntries) {
    if (!isRecord(entities)) continue;
    for (const [id, entity] of Object.entries(entities)) {
      if (!isRecord(entity)) continue;
      for (const field of REFERENCE_FIELDS) {
        for (const reference of valueList(entity[field])) {
          if (typeof reference !== 'string') {
            pushDiagnostic(diagnostics, 'invalid_reference_type', `Ссылка ${id}.${field} должна быть строкой или массивом строк`, { schema, id, field });
          } else if (!entityIds.has(reference)) {
            pushDiagnostic(diagnostics, 'missing_reference', `Ссылка ${id}.${field} указывает на отсутствующий OID ${reference}`, { schema, id, field, reference });
          } else {
            const allowedTargetSchemas = REFERENCE_TARGET_SCHEMAS[schema]?.[field];
            const targetSchema = entitySchemas.get(reference);
            if (allowedTargetSchemas && !allowedTargetSchemas.has(targetSchema as string)) {
              pushDiagnostic(
                diagnostics,
                'invalid_reference_target',
                `Ссылка ${id}.${field} указывает на ${reference} из недопустимой схемы ${targetSchema}`,
                { schema, id, field, reference, targetSchema, allowedTargetSchemas: [...allowedTargetSchemas] }
              );
            }
          }
        }
      }
    }
  }

  return {
    valid: diagnostics.length === 0,
    diagnostics,
    entityCount,
    schemaCount: schemaEntries.length
  };
}

export function validateDrawnCoverage(dataset: unknown, report: AiVerificationReport | null | undefined): AiValidation {
  const diagnostics: AiDiagnostic[] = [];
  const missing: Record<string, string[]> = {};
  for (const [schema, entities] of Object.entries(dataset ?? {})) {
    if (!SUPPORTED_SCHEMAS.has(schema) || !isRecord(entities)) continue;
    const drawnIds = new Set(report?.drawn?.[schema] ?? []);
    const missingIds = Object.keys(entities).filter((id) => !drawnIds.has(id)).sort();
    if (!missingIds.length) continue;
    missing[schema] = missingIds;
    diagnostics.push({
      code: 'oid_not_drawn',
      message: `Объекты поддерживаемой схемы ${schema} отсутствуют в построенном XML: ${missingIds.join(', ')}`,
      schema,
      ids: missingIds
    });
  }
  return { valid: diagnostics.length === 0, diagnostics, missing };
}

export function compactValidationReport(report: AiValidation | null | undefined): AiDiagnostic[] {
  if (!report) return [{ code: 'unknown', message: 'Проверка не вернула результат' }];
  const result = Array.isArray(report.diagnostics) ? [...report.diagnostics] : [];
  if (isRecord(report.diagnostics)) {
    for (const [schema, diagnostics] of Object.entries(report.diagnostics)) {
      for (const diagnostic of diagnostics ?? []) {
        const diagnosticDetails = { ...diagnostic };
        result.push(Object.assign({
          code: 'render_diagnostic',
          message: `${schema}: ${diagnostic.id} — ${diagnostic.reason}`,
          schema
        }, diagnosticDetails));
      }
    }
  }
  for (const [schema, ids] of Object.entries(report.missing ?? {})) {
    result.push({ code: 'not_drawn', message: `Не построены объекты ${schema}: ${ids.join(', ')}`, schema, ids });
  }
  for (const [schema, ids] of Object.entries(report.extra ?? {})) {
    result.push({ code: 'unexpected_drawn', message: `Построены неожиданные объекты ${schema}: ${ids.join(', ')}`, schema, ids });
  }
  for (const diagnostic of report.compositionDiagnostics ?? []) result.push(diagnostic);
  return result
    .sort((left, right) => [left.code, left.schema, left.id, left.field, left.message]
      .map((value) => String(value ?? '')).join('\u0000')
      .localeCompare([right.code, right.schema, right.id, right.field, right.message]
        .map((value) => String(value ?? '')).join('\u0000')))
    .slice(0, MAX_DIAGNOSTIC_ITEMS);
}
