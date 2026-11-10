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
  restrictions under the License.

  Maintainers:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import { z } from 'zod';

import { SEARCH_TOOL_RESULT_LIMIT } from '@global/gigachat/tools/SearchTool/SearchTool';

export const searchInputSchema = z.object({
  action: z
    .enum(['entities', 'filters', 'run'])
    .describe(
      'entities — список сущностей; filters — фильтры выбранной сущности; run — поиск'
    ),
  choice: z
    .string()
    .min(1)
    .optional()
    .describe(
      'entities[].key из action=entities. Для поиска по всем сущностям — "__all__". Обязателен для filters и run'
    ),
  filters: z
    .array(
      z.object({
        field: z
          .string()
          .min(1)
          .describe('key поля из ответа action=filters, не придумывай'),
        operator: z
          .enum([
            'eq',
            'contains',
            'startsWith',
            'endsWith',
            'exists',
            'in',
            'gt',
            'gte',
            'lt',
            'lte',
            'between'
          ])
          .describe(
            'eq, contains, startsWith, endsWith, exists, in, gt, gte, lt, lte, between. Для rel предпочитай contains (eq/startsWith/endsWith/exists тоже допустимы; in нельзя)'
          ),
        value: z
          .union([
            z.string(),
            z.number(),
            z.boolean(),
            z.array(z.unknown()),
            z.null()
          ])
          .describe(
            'Скаляр: "ADOPT", 42, true. Для in/between — массив: ["ADOPT","TRIAL"] или [1,10]. Для rel — title связанного объекта. Для exists — true'
          )
      })
    )
    .optional()
    .describe(
      'AND-фильтры для action=run. Пустой массив или отсутствие = без полевых фильтров. Для __all__ не используй'
    ),
  searchQuery: z
    .string()
    .optional()
    .describe(
      'Полнотекст по title и description. Слова через пробел, достаточно любого. Можно без filters'
    )
});

export type SearchMcpArgs = z.infer<typeof searchInputSchema>;

export const searchBaseSchema = {
  name: 'search',
  schema: {
    title: 'Search',
    description: `
Поиск по озеру данных архитектуры. Ключи сущностей и полей не выдумывай — бери из ответов инструмента.

Порядок вызовов:
1) action=entities — без других параметров. Ответ: {"entities":[{"key","title"}],"hasCompanies"}. Дальше choice = entities[].key.
2) action=filters — обязателен choice. Ответ: [{"key","title","type","enumValues?","relTarget?","isArray?"}]. field в run = этот key. Для choice="__all__" список пустой: полевые фильтры недоступны, только searchQuery.
3) action=run — обязателен choice; filters и/или searchQuery. Несколько filters работают как AND. searchQuery — полнотекст по title и description, слова через пробел (достаточно любого слова). Ответ: {"total","results"}; results обрезается до ${SEARCH_TOOL_RESULT_LIMIT} объектов, total — полное число совпадений.

Операторы по type поля:
- string/enum: eq, contains, startsWith, endsWith, exists, in. Для enum бери value из enumValues.
- number/integer: eq, gt, gte, lt, lte, between, in, contains, exists. between — [min,max]; in — массив значений.
- rel: contains, eq, startsWith, endsWith, exists. value — title связанного объекта, не его id. Для rel предпочитай contains: title, aliases и все ссылки склеиваются через "; ", поэтому eq совпадёт только у одиночной ссылки без aliases. Оператор in для rel не работает.
Для exists всё равно передай value (например true) — поле обязательное для любого type.
Регистр при сравнении игнорируется.

Примеры: {"action":"entities"}; {"action":"filters","choice":"seaf.company.technologies"}; {"action":"run","choice":"seaf.company.technologies","filters":[{"field":"status","operator":"eq","value":"ADOPT"}]}; {"action":"run","choice":"__all__","searchQuery":"kubernetes"}.
`.trim(),
    inputSchema: searchInputSchema.shape
  },
  handler: null
};
