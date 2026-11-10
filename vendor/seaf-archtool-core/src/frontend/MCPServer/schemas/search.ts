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

  Maintainers:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import { searchToolCallback } from '@front/helpers/gigachat/tools/searchToolCallback';
import {
  searchBaseSchema,
  type SearchMcpArgs
} from '@global/MCPServer/schemas/searchBaseSchema';
import { SEARCH_TOOL_RESULT_LIMIT } from '@global/gigachat/tools/SearchTool/SearchTool';
import { McpCallToolResult } from '@front/MCPServer/types/types';

function toMcpTextResult(result: unknown): McpCallToolResult {
  return {
    content: [
      {
        type: 'text',
        text:
          typeof result === 'string' ? result : JSON.stringify(result ?? null)
      }
    ]
  };
}

export const search = {
  ...searchBaseSchema,
  handler: async({
    action,
    choice,
    filters,
    searchQuery
  }: SearchMcpArgs) => {
    if (action === 'entities') {
      return toMcpTextResult(await searchToolCallback({ action }));
    }

    if (!(typeof choice === 'string' && choice.length > 0)) {
      throw new Error(`Для action="${action}" обязателен параметр choice`);
    }

    if (action === 'filters') {
      return toMcpTextResult(await searchToolCallback({ action, choice }));
    }

    const result = await searchToolCallback({
      action,
      choice,
      filters: (Array.isArray(filters) ? filters : []).map((filter) => ({
        field: filter.field,
        operator: filter.operator,
        value: filter.value,
        ignoreCase: true
      })),
      searchQuery: typeof searchQuery === 'string' ? searchQuery : ''
    });

    const items = Array.isArray(result) ? result : [];
    return toMcpTextResult({
      total: items.length,
      results: items.slice(0, SEARCH_TOOL_RESULT_LIMIT)
    });
  }
};
