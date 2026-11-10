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

import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { SEARCH_TOOL_RESULT_LIMIT } from '@global/gigachat/tools/SearchTool/SearchTool';
import {
  searchBaseSchema,
  searchInputSchema
} from '@global/MCPServer/schemas/searchBaseSchema';
import type { McpCallToolResult } from '@front/MCPServer/types/types';

jest.mock('@front/helpers/gigachat/tools/searchToolCallback', () => ({
  searchToolCallback: jest.fn()
}));

import { searchToolCallback } from '@front/helpers/gigachat/tools/searchToolCallback';
import { search } from '@front/MCPServer/schemas/search';
import pluginMcpServerToolManager from '@front/MCPServer/pluginMcpServerToolManager';

const searchToolCallbackMock = jest.mocked(searchToolCallback);

if (!search.handler) {
  throw new Error('search.handler is not set');
}
const handler = search.handler;

function mcpText(result: McpCallToolResult): string {
  const text = result.content[0]?.text;
  if (typeof text !== 'string') {
    throw new Error('MCP result has no text content');
  }
  return text;
}

describe('MCP search tool schema', () => {
  it('tells an agent how to discover entities, filters, and run a search', () => {
    const { description } = searchBaseSchema.schema;

    expect(description).toContain('action=entities');
    expect(description).toContain('action=filters');
    expect(description).toContain('action=run');
    expect(description).toContain('entities[].key');
    expect(description).toContain('"__all__"');
    expect(description).toContain(
      `results обрезается до ${SEARCH_TOOL_RESULT_LIMIT}`
    );
    expect(description).toContain('number/integer');
    expect(description).toContain('Для rel предпочитай contains');
    expect(description).toContain('Для exists всё равно передай value');
  });

  it('rejects an unknown action', () => {
    const parsed = searchInputSchema.safeParse({ action: 'blah' });
    expect(parsed.success).toBe(false);
  });

  it('parses entities with no extra fields', () => {
    expect(searchInputSchema.parse({ action: 'entities' })).toEqual({
      action: 'entities'
    });
  });

  it('parses filters with choice', () => {
    expect(
      searchInputSchema.parse({ action: 'filters', choice: 'systems' })
    ).toEqual({
      action: 'filters',
      choice: 'systems'
    });
  });

  it('rejects empty choice', () => {
    expect(
      searchInputSchema.safeParse({ action: 'filters', choice: '' }).success
    ).toBe(false);
    expect(
      searchInputSchema.safeParse({ action: 'run', choice: '' }).success
    ).toBe(false);
  });

  it('rejects empty filter field or operator', () => {
    expect(
      searchInputSchema.safeParse({
        action: 'run',
        choice: 'systems',
        filters: [{ field: '', operator: 'eq', value: 'ADOPT' }]
      }).success
    ).toBe(false);
    expect(
      searchInputSchema.safeParse({
        action: 'run',
        choice: 'systems',
        filters: [{ field: 'status', operator: '', value: 'ADOPT' }]
      }).success
    ).toBe(false);
  });

  it('rejects an unknown filter operator', () => {
    expect(
      searchInputSchema.safeParse({
        action: 'run',
        choice: 'systems',
        filters: [{ field: 'status', operator: 'like', value: 'ADOPT' }]
      }).success
    ).toBe(false);
  });

  it('parses run with choice and filters', () => {
    expect(
      searchInputSchema.parse({
        action: 'run',
        choice: 'systems',
        filters: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Beta'
          }
        ],
        searchQuery: 'Alpha'
      })
    ).toEqual({
      action: 'run',
      choice: 'systems',
      filters: [
        {
          field: 'title',
          operator: 'contains',
          value: 'Beta'
        }
      ],
      searchQuery: 'Alpha'
    });
  });
});

describe('MCP search tool handler', () => {
  beforeEach(() => {
    searchToolCallbackMock.mockReset();
  });

  it('wraps callback payload as MCP text content', async() => {
    const payload = {
      entities: [{ key: 'systems', title: 'Systems' }],
      hasCompanies: false
    };
    searchToolCallbackMock.mockResolvedValue(payload);

    const result = await handler({ action: 'entities' });

    expect(searchToolCallbackMock).toHaveBeenCalledWith({ action: 'entities' });
    expect(result).toEqual({
      content: [
        {
          type: 'text',
          text: JSON.stringify(payload)
        }
      ]
    });
  });

  it('requires a non-empty choice for filters and run', async() => {
    await expect(handler({ action: 'filters' })).rejects.toThrow(
      'обязателен параметр choice'
    );
    await expect(handler({ action: 'run' })).rejects.toThrow(
      'обязателен параметр choice'
    );
    await expect(handler({ action: 'filters', choice: '' })).rejects.toThrow(
      'обязателен параметр choice'
    );
    await expect(handler({ action: 'run', choice: '' })).rejects.toThrow(
      'обязателен параметр choice'
    );
    expect(searchToolCallbackMock).not.toHaveBeenCalled();
  });

  it('calls callback with action and choice for filters', async() => {
    const payload = [{ key: 'title', type: 'string' }];
    searchToolCallbackMock.mockResolvedValue(payload);

    const result = await handler({ action: 'filters', choice: 'systems' });

    expect(searchToolCallbackMock).toHaveBeenCalledWith({
      action: 'filters',
      choice: 'systems'
    });
    expect(JSON.parse(mcpText(result))).toEqual(payload);
  });

  it('wraps string and undefined callback results as MCP text', async() => {
    searchToolCallbackMock.mockResolvedValue('plain');
    expect(mcpText(await handler({ action: 'entities' }))).toBe('plain');

    searchToolCallbackMock.mockResolvedValue(undefined);
    expect(mcpText(await handler({ action: 'entities' }))).toBe('null');
  });

  it('propagates callback errors', async() => {
    searchToolCallbackMock.mockRejectedValue(new Error('callback failed'));
    await expect(handler({ action: 'entities' })).rejects.toThrow(
      'callback failed'
    );
  });

  it('passes filter values through and forces ignoreCase', async() => {
    searchToolCallbackMock.mockResolvedValue([]);

    await handler({
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
          value: ['a', 'b']
        },
        {
          field: 'count',
          operator: 'eq',
          value: 42
        },
        {
          field: 'code',
          operator: 'eq',
          value: '42'
        }
      ]
    });

    expect(searchToolCallbackMock).toHaveBeenCalledWith({
      action: 'run',
      choice: 'systems',
      filters: [
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
        },
        {
          field: 'code',
          operator: 'eq',
          value: '42',
          ignoreCase: true
        }
      ],
      searchQuery: ''
    });
  });

  it('caps run results to the limit and reports total', async() => {
    const items = Array.from(
      { length: SEARCH_TOOL_RESULT_LIMIT + 10 },
      (_, i) => ({
        _sfa_key: `k${i}`,
        title: `Item ${i}`
      })
    );
    searchToolCallbackMock.mockResolvedValue(items);

    const result = await handler({
      action: 'run',
      choice: 'systems'
    });

    expect(searchToolCallbackMock).toHaveBeenCalledWith({
      action: 'run',
      choice: 'systems',
      filters: [],
      searchQuery: ''
    });

    const payload = JSON.parse(mcpText(result));
    expect(payload.total).toBe(SEARCH_TOOL_RESULT_LIMIT + 10);
    expect(payload.results).toHaveLength(SEARCH_TOOL_RESULT_LIMIT);
    expect(payload.results[0]).toEqual(items[0]);
  });

  it('reports total 0 when run result is not an array', async() => {
    searchToolCallbackMock.mockResolvedValue({ not: 'a list' });

    const result = await handler({ action: 'run', choice: 'systems' });

    expect(JSON.parse(mcpText(result))).toEqual({
      total: 0,
      results: []
    });
  });
});

describe('MCP search tool registration', () => {
  beforeEach(() => {
    searchToolCallbackMock.mockReset();
  });

  it('exposes JSON Schema and parses args through executeHandler', async() => {
    pluginMcpServerToolManager.registerMcpToolList([search]);

    const meta = pluginMcpServerToolManager
      .getToolsForPluginBackend()
      .find((tool) => tool.name === 'search');

    expect(meta?.title).toBe('Search');
    const schemaText = JSON.stringify(meta?.inputSchema);
    expect(schemaText).toContain('"entities"');
    expect(schemaText).toContain('"between"');

    searchToolCallbackMock.mockResolvedValue([]);
    await pluginMcpServerToolManager.executeHandler('search', {
      action: 'filters',
      choice: 'systems'
    });
    expect(searchToolCallbackMock).toHaveBeenCalledWith({
      action: 'filters',
      choice: 'systems'
    });

    await expect(
      pluginMcpServerToolManager.executeHandler('search', {
        action: 'run',
        choice: 'systems',
        filters: [{ field: '', operator: 'eq', value: 'x' }]
      })
    ).rejects.toThrow();
  });
});
