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

export const DEFAULT_AI_SYSTEM_PROMPT = `Ты создаешь полный датасет для SEAF2DrawIO.
Возвращай только один YAML или JSON объект без пояснений. Ключи верхнего уровня — схемы seaf.company.ta.*, значения — словари OID -> объект.
Сохраняй стабильные уникальные OID, обязательные title, точные типы полей, enum и корректные ссылки между объектами. Не используй устаревшее пространство seaf.ta.*.
Для KB обязательно добавляй softwares как непустой массив ссылок и объекты seaf.company.ta.services.softwares с vendor, type, support и expiration; software участвует в проверке ссылок, но не рисуется.`;

const PROMPT_SCHEMA_INTENTS = [
  {
    schema: SCHEMAS.DC_REGION,
    label: 'регионы размещения',
    patterns: [/(?:^|\s)регион(?:ы|ов|ам|ами|ах)?(?:\s|$|[.,;:])/iu, /\bdc\s+regions?\b/iu]
  },
  {
    schema: SCHEMAS.DC_AZ,
    label: 'зоны доступности',
    patterns: [/зон\p{L}*\s+доступност\p{L}*/iu, /\bavailability\s+zones?\b/iu, /(?:^|\s)az(?:\s|$|[.,;:])/iu]
  },
  {
    schema: SCHEMAS.DC_OFFICE,
    label: 'офисы',
    patterns: [/офис\p{L}*|офисн\p{L}*\s+площад\p{L}*|\boffices?\b/iu]
  },
  {
    schema: SCHEMAS.NETWORK_SEGMENT,
    label: 'сетевые сегменты',
    patterns: [
      /сет\p{L}*\s+сегмент\p{L}*/iu,
      /сегмент\p{L}*\s+сет\p{L}*/iu,
      /\bnetwork\s+segments?\b/iu
    ]
  },
  {
    schema: SCHEMAS.NETWORK_SERVICE,
    label: 'сетевые сервисы',
    patterns: [/сетев\p{L}*\s+сервис\p{L}*|\bnetwork\s+services?\b/iu]
  },
  {
    schema: SCHEMAS.COMPONENT_USER_DEVICE,
    label: 'пользовательские устройства',
    patterns: [
      /пользовательск\p{L}*\s+устройств\p{L}*/iu,
      /рабоч\p{L}*\s+(?:мест|станц)\p{L}*/iu,
      /ноутбук\p{L}*|терминал\p{L}*\s+сбора\s+данн\p{L}*/iu,
      /(?:^|\s)пк(?:\s|$|[.,;:])/iu,
      /\buser\s+devices?\b|\bendpoints?\b/iu
    ]
  },
  {
    schema: SCHEMAS.COMPUTE_SERVICE,
    label: 'вычислительные сервисы',
    patterns: [
      /вычислительн\p{L}*\s+сервис\p{L}*/iu,
      /техническ\p{L}*\s+сервис\p{L}*/iu,
      /\bcompute\s+services?\b/iu
    ]
  },
  {
    schema: SCHEMAS.CLUSTER_VIRTUALIZATION,
    label: 'кластеры виртуализации',
    patterns: [
      /кластер\p{L}*\s+виртуализац\p{L}*/iu,
      /платформ\p{L}*\s+виртуализац\p{L}*/iu,
      /\bvirtuali[sz]ation\s+(?:clusters?|platforms?)\b/iu,
      /\bvmware\b|\bproxmox\b|\besxi\b/iu
    ]
  },
  {
    schema: SCHEMAS.MONITORING,
    label: 'сервисы мониторинга',
    patterns: [/м[оа]ниторинг\p{L}*|\bmonitoring\b/iu]
  },
  {
    schema: SCHEMAS.K8S,
    label: 'Kubernetes-кластеры',
    patterns: [
      /(?:^|\s)k8s(?:\s|$|[.,;:])/iu,
      /\bkubernetes\b/iu,
      /кубернетес\p{L}*|кубер\p{L}*/iu,
      /контейнерн\p{L}*\s+(?:платформ|кластер)\p{L}*/iu
    ]
  },
  {
    schema: SCHEMAS.BACKUP,
    label: 'сервисы резервного копирования',
    patterns: [/резервн\p{L}*\s+копирован\p{L}*|б[еэ]кап\p{L}*|\bbackups?\b/iu]
  },
  {
    schema: SCHEMAS.KB,
    label: 'средства кибербезопасности (КБ)',
    patterns: [
      /кибербезопас\p{L}*/iu,
      /информационн\p{L}*\s+безопасност\p{L}*/iu,
      /(?:сервис|средств|систем)\p{L}*\s+(?:[уэ]?кб|иб)(?![\p{L}\p{N}_])/iu,
      /(?:^|\s)(?:[уэ]?кб|иб)(?![\p{L}\p{N}_])/iu,
      /\bkb\b/iu
    ]
  },
  {
    schema: SCHEMAS.LOGICAL_LINK,
    label: 'логические связи',
    patterns: [/логическ\p{L}*\s+связ\p{L}*|\blogical\s+links?\b/iu]
  },
  {
    schema: SCHEMAS.NETWORK,
    label: 'сети',
    patterns: [/сет(?:ь|и|ей|ям|ями|ях)|\bnetworks?\b/iu]
  },
  {
    schema: SCHEMAS.COMPONENT_NETWORK,
    label: 'сетевые устройства',
    patterns: [/сет\p{L}*\s+(?:устройств|оборудован)\p{L}*|\bnetwork\s+devices?\b/iu]
  },
  {
    schema: SCHEMAS.DC,
    label: 'центры обработки данных (ЦОД)',
    patterns: [/цод|дата[\s-]?центр|центр\p{L}*\s+обработк\p{L}*\s+данн\p{L}*|\bdata\s+cent(?:er|re)s?\b|\bdc\b(?!\s+regions?\b)/iu]
  }
];

export const AI_PROMPT_SCHEMA_CATALOG = Object.freeze(PROMPT_SCHEMA_INTENTS
  .map(({ schema, label }) => Object.freeze({ schema, label })));

const LOGICAL_LINK_NOUN_SOURCE = String.raw`(?<![\p{L}\p{N}_])(?:связ(?:ь|и|ей|ям|ями|ях|ью)|взаимосвяз(?:ь|и|ей|ям|ями|ях|ью)|зависимост(?:ь|и|ей|ям|ями|ях|ью)|взаимодействи(?:е|я|й|ю|ем|и|ям|ями|ях)|links?)(?![\p{L}\p{N}_])`;
const PROMPT_ACTION_SOURCE = String.raw`(?:показ|покаж|нарис|отрис|отобраз|вывед|добав|визуализир|сформир|остав)\p{L}*|show|draw|display|render`;
const LOGICAL_LINK_DIRECTION_SOURCE = String.raw`(?:входящ|исходящ)\p{L}*(?:\s+и\s+(?:входящ|исходящ)\p{L}*)?`;

function promptHasAny(normalizedText: string, patterns: RegExp[]): boolean {
  return patterns.some((pattern) => pattern.test(normalizedText));
}

function isNegatedPromptMatch(normalizedText: string, matchIndex: number): boolean {
  const prefix = normalizedText.slice(0, matchIndex);
  return /(?:^|[\s,;:])(?:без|кроме|исключая|исключить|исключи|не|except|excluding)\s+(?:(?:логическ|сервис|средств|систем)\p{L}*\s+)?$/iu.test(prefix)
    || /(?:^|[\s,;:])не\s+(?:показыв|добавл|рис|отображ|вывод)\p{L}*\s+$/iu.test(prefix);
}

function promptIntentMatches(normalizedText: string, patterns: RegExp[]): { matched: boolean; positive: boolean } {
  let matched = false;
  let positive = false;
  for (const pattern of patterns) {
    const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
    for (const match of normalizedText.matchAll(new RegExp(pattern.source, flags))) {
      matched = true;
      if (!isNegatedPromptMatch(normalizedText, match.index)) positive = true;
    }
  }
  return { matched, positive };
}

export function normalizeAiPrompt(prompt: unknown): import('./ai-types').AiPromptIntent {
  const original = String(prompt ?? '').trim();
  const normalizedText = original
    .toLocaleLowerCase('ru-RU')
    .replaceAll('ё', 'е')
    .replace(/\s+/g, ' ')
    .trim();
  const networkDevicesRequested = promptHasAny(normalizedText, (PROMPT_SCHEMA_INTENTS
    .find(({ schema }) => schema === SCHEMAS.COMPONENT_NETWORK) as { patterns: RegExp[] }).patterns);
  const connectedNetworksRequested = /подключ\p{L}*\s+сет/iu.test(normalizedText);
  const externalConnectionsRequested = /внешн\p{L}*\s+(?:подключ|сет)\p{L}*|\bexternal\s+(?:connections?|networks?)\b/iu.test(normalizedText);
  const requestedIntents = PROMPT_SCHEMA_INTENTS.filter(({ schema, patterns }) => {
    const intent = promptIntentMatches(normalizedText, patterns);
    return intent.positive
      && !(schema === SCHEMAS.NETWORK && networkDevicesRequested && connectedNetworksRequested);
  });
  const keepOnly = /только|остав\p{L}*/iu.test(normalizedText);
  const logicalLinksExcluded = new RegExp(`(?:без|кроме|исключая|исключить|исключи)\\s+(?:логическ\\p{L}*\\s+)?${LOGICAL_LINK_NOUN_SOURCE}|не\\s+(?:показыв|добавл|рис)\\p{L}*\\s+(?:логическ\\p{L}*\\s+)?${LOGICAL_LINK_NOUN_SOURCE}`, 'iu').test(normalizedText);
  const logicalLinksRequested = !logicalLinksExcluded
    && new RegExp(LOGICAL_LINK_NOUN_SOURCE, 'iu').test(normalizedText);
  const linkRequestText = normalizedText.replace(new RegExp(`^(?:пожалуйста[,\\s]+)?(?:(?:${PROMPT_ACTION_SOURCE})|хочу\\s+увидеть|хотелось\\s+бы\\s+увидеть|мне\\s+нужн\\p{L}*|(?:нужно|необходимо|можно|можешь|давай)\\s+(?:${PROMPT_ACTION_SOURCE}))(?:\\s*,\\s*пожалуйста\\s*,?)?(?:\\s+(?:мне|на\\s+схем[еу]|схем[ауе]))*(?:\\s+только)?[:,-]?\\s+`, 'iu'), '');
  const adjacentLinksRequested = logicalLinksRequested
    && (new RegExp(`^(?:все\\s+|all\\s+)?(?:${LOGICAL_LINK_DIRECTION_SOURCE}\\s+)?(?:логическ\\p{L}*\\s+)?${LOGICAL_LINK_NOUN_SOURCE}`, 'iu').test(linkRequestText)
      || new RegExp(`(?:^|\\s)(?:и\\s+(?:его\\s+|все\\s+)(?:логическ\\p{L}*\\s+)?${LOGICAL_LINK_NOUN_SOURCE}|и\\s+(?:${LOGICAL_LINK_DIRECTION_SOURCE})\\s+(?:логическ\\p{L}*\\s+)?${LOGICAL_LINK_NOUN_SOURCE}|со\\s+(?:всеми\\s+)?(?:логическ\\p{L}*\\s+)?${LOGICAL_LINK_NOUN_SOURCE})`, 'iu').test(normalizedText));
  const incomingLinksRequested = /входящ\p{L}*/iu.test(normalizedText);
  const outgoingLinksRequested = /исходящ\p{L}*/iu.test(normalizedText);
  const logicalLinkDirection = incomingLinksRequested && outgoingLinksRequested
    ? 'any'
    : incomingLinksRequested
      ? 'incoming'
      : outgoingLinksRequested
        ? 'outgoing'
        : 'any';
  const logicalLinkScope = logicalLinksExcluded ? 'none' : adjacentLinksRequested ? 'adjacent' : 'between';
  const operation = keepOnly ? 'оставить только перечисленные категории' : 'показать запрошенные категории';
  const lines = [
    `Операция: ${operation}.`,
    requestedIntents.length || externalConnectionsRequested
      ? `Прямые категории: ${[
        ...requestedIntents.map(({ label, schema }) => `${label} [${schema}]`),
        ...(externalConnectionsRequested ? ['внешние подключения [WAN/INTERNET/INET-EDGE/EXT-WAN-EDGE/TRANSPORT-WAN]'] : [])
      ].join('; ')}.`
      : 'Прямые категории не распознаны; используй точные OID и названия из исходного запроса.'
  ];
  if (networkDevicesRequested && connectedNetworksRequested) {
    lines.push('Для каждого сетевого устройства сохрани сети из network_connection и обязательные location/segment зависимости.');
  }
  if (logicalLinkScope === 'none') {
    lines.push('Логические связи явно исключены.');
  } else if (logicalLinkScope === 'adjacent') {
    lines.push(`Запрошены ${logicalLinkDirection === 'any' ? 'все' : logicalLinkDirection === 'incoming' ? 'входящие' : 'исходящие'} связи выбранных объектов; Core добавит их из исходного датасета.`);
  } else {
    lines.push('Core автоматически добавит существующие логические связи между выбранными объектами.');
  }
  if (keepOnly && requestedIntents.length) {
    lines.push('Запрос категориальный: не пропускай существующие OID прямых категорий, если пользователь не назвал конкретные объекты.');
  }
  return {
    original,
    normalizedText,
    keepOnly,
    networkDevicesRequested,
    connectedNetworksRequested,
    externalConnectionsRequested,
    logicalLinksRequested,
    logicalLinkScope,
    logicalLinkDirection,
    requestedSchemas: requestedIntents.map(({ schema }) => schema),
    canonicalPrompt: lines.join('\n')
  };
}
