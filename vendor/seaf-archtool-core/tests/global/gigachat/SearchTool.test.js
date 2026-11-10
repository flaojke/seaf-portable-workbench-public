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

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import { describe, expect, it } from '@jest/globals';
import {
  SEARCH_TOOL_RESULT_LIMIT,
  SearchTool,
  coerceFilterValue
} from '@global/gigachat/tools/SearchTool/SearchTool';
import { searchToolSchema } from '@global/gigachat/tools/SearchTool/schemas';

describe('SearchTool', () => {
  it('rejects invalid action', async() => {
    const tool = new SearchTool(async() => ({}), searchToolSchema);
    await expect(
      tool.execute({ action: 'blah' }, { type: 'search' }, {}, 'sess')
    ).rejects.toThrow('Недопустимый action');
  });

  it('requires choice for filters', async() => {
    const tool = new SearchTool(async() => ([]), searchToolSchema);
    await expect(
      tool.execute({ action: 'filters' }, { type: 'search' }, {}, 'sess')
    ).rejects.toThrow('обязателен параметр choice');
  });

  it('requires choice for run', async() => {
    const tool = new SearchTool(async() => ([]), searchToolSchema);
    await expect(
      tool.execute({ action: 'run' }, { type: 'search' }, {}, 'sess')
    ).rejects.toThrow('обязателен параметр choice');
  });

  it('passes entities action through without capping', async() => {
    const payload = { entities: [{ key: 'systems', title: 'Systems' }], hasCompanies: false };
    const tool = new SearchTool(async(args) => {
      expect(args).toEqual({ action: 'entities' });
      return payload;
    }, searchToolSchema);

    const result = await tool.execute(
      { action: 'entities' },
      { type: 'search' },
      {},
      'sess'
    );
    expect(result).toEqual(payload);
  });

  it('caps run results to limit and reports total', async() => {
    const items = Array.from({ length: SEARCH_TOOL_RESULT_LIMIT + 10 }, (_, i) => ({
      _sfa_key: `k${i}`,
      title: `Item ${i}`
    }));
    const tool = new SearchTool(async(args) => {
      expect(args.action).toBe('run');
      expect(args.choice).toBe('systems');
      expect(args.filters).toEqual([]);
      expect(args.searchQuery).toBe('');
      return items;
    }, searchToolSchema);

    const result = await tool.execute(
      { action: 'run', choice: 'systems' },
      { type: 'search' },
      {},
      'sess'
    );

    expect(result.total).toBe(SEARCH_TOOL_RESULT_LIMIT + 10);
    expect(result.results).toHaveLength(SEARCH_TOOL_RESULT_LIMIT);
    expect(result.results[0]).toEqual(items[0]);
  });

  it('defaults filters and searchQuery for run', async() => {
    const tool = new SearchTool(async(args) => {
      expect(args).toEqual({
        action: 'run',
        choice: 'systems',
        filters: [],
        searchQuery: ''
      });
      return [];
    }, searchToolSchema);

    const result = await tool.execute(
      { action: 'run', choice: 'systems' },
      { type: 'search' },
      {},
      'sess'
    );
    expect(result).toEqual({ total: 0, results: [] });
  });

  it('schema declares filter value as string for GigaChat', () => {
    expect(
      searchToolSchema.parameters.properties.filters.items.properties.value.type
    ).toBe('string');
  });

  describe('coerceFilterValue', () => {
    it('keeps plain strings', () => {
      expect(coerceFilterValue('Beta')).toBe('Beta');
    });

    it('parses JSON arrays for in/between', () => {
      expect(coerceFilterValue('["a","b"]')).toEqual(['a', 'b']);
      expect(coerceFilterValue('[1, 10]')).toEqual([1, 10]);
    });

    it('parses numbers and booleans from strings', () => {
      expect(coerceFilterValue('42')).toBe(42);
      expect(coerceFilterValue('3.14')).toBe(3.14);
      expect(coerceFilterValue('true')).toBe(true);
      expect(coerceFilterValue('false')).toBe(false);
    });

    it('passes through non-strings', () => {
      expect(coerceFilterValue(['x'])).toEqual(['x']);
      expect(coerceFilterValue(7)).toBe(7);
    });
  });

  it('coerces filter values on run and forces ignoreCase', async() => {
    const tool = new SearchTool(async(args) => {
      expect(args.filters).toEqual([
        {
          field: 'title',
          operator: 'contains',
          value: 'Beta',
          ignoreCase: true
        },
        {
          field: 'status',
          operator: 'in',
          value: ['a', 'b'],
          ignoreCase: true
        },
        {
          field: 'count',
          operator: 'eq',
          value: 42,
          ignoreCase: true
        }
      ]);
      return [];
    }, searchToolSchema);

    await tool.execute(
      {
        action: 'run',
        choice: 'systems',
        filters: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Beta'
          },
          {
            field: 'status',
            operator: 'in',
            value: '["a","b"]'
          },
          {
            field: 'count',
            operator: 'eq',
            value: '42'
          }
        ]
      },
      { type: 'search' },
      {},
      'sess'
    );
  });
});
