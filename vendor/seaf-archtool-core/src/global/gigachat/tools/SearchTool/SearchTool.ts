import { Function as GigaChatToolSchema } from 'gigachat/interfaces';
import { ToolInterface } from '../types/ToolInterface';
import { ToolTypes } from '../types/ToolTypes';
import { ToolConfigType } from '../types/ToolConfigType';
import { DocumentConfigType } from '../types/DocumentConfigType';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import type { RequestWithBenefits } from '@back/controllers/gigachat';

const logger = getLoggerWithTag('SearchTool');

// Tool will return results up to this limit to avoid killing the context window.
export const SEARCH_TOOL_RESULT_LIMIT = 50;

const NUMBER_RE = /^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/;

export type SearchAction = 'entities' | 'filters' | 'run';

export type SearchFilter = {
  field: string;
  operator: string;
  value: unknown;
  ignoreCase?: boolean;
};

export type SearchToolArgs = {
  action: SearchAction;
  choice?: string;
  filters?: SearchFilter[];
  searchQuery?: string;
};

export type SearchToolCallback = (
  args: SearchToolArgs,
  request?: RequestWithBenefits
) => Promise<unknown>;

const VALID_ACTIONS: SearchAction[] = ['entities', 'filters', 'run'];

/**
 * GigaChat function schemas require a single type; filter values are declared as string.
 * Restore scalars / arrays so filter-utils gets the shape it expects.
 */
export function coerceFilterValue(value: unknown): unknown {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return value;
  }

  if (
    trimmed.startsWith('[') ||
    trimmed.startsWith('{') ||
    trimmed.startsWith('"')
  ) {
    try {
      return JSON.parse(trimmed);
    } catch {
      return value;
    }
  }

  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;

  if (NUMBER_RE.test(trimmed)) {
    return Number(trimmed);
  }

  return value;
}

export class SearchTool implements ToolInterface {
  type: ToolTypes.search;
  schema: GigaChatToolSchema;

  private callback: SearchToolCallback;

  constructor(callback: SearchToolCallback, schema: GigaChatToolSchema) {
    this.type = ToolTypes.search;
    this.schema = schema;
    this.callback = callback;

    logger.debug(
      () => `Search tool registered with type: "${ToolTypes.search}"`
    );
  }

  async execute(
    args: any,
    toolConfig: ToolConfigType,
    documentConfig: DocumentConfigType,
    sessionId: string,
    request?: RequestWithBenefits
  ) {
    logger.debug(
      () =>
        `Session ${sessionId}. Search tool args:\n${JSON.stringify(args)}`
    );

    const validated = this.validateArgs(args);
    logger.debug(
      () =>
        `Session ${sessionId}. Search tool validated:\n${JSON.stringify(validated)}`
    );

    const result = await this.callback(validated, request);
    logger.debug(
      () =>
        `Session ${sessionId}. Search tool result:\n${JSON.stringify(result)}`
    );

    if (validated.action === 'run') {
      return this.capRunResult(result);
    }

    return result;
  }

  private validateArgs(args: any): SearchToolArgs {
    if (!(args && typeof args === 'object' && !Array.isArray(args))) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". Сформирован невалидный объект аргументов ("${args}")!`
      );
    }

    const params: Record<string, unknown> = {};
    for (const key in args) {
      params[key.trim()] = args[key];
    }

    const action = params.action as SearchAction;
    if (!VALID_ACTIONS.includes(action)) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". Недопустимый action ("${action}"). Допустимые: ${JSON.stringify(VALID_ACTIONS)}`
      );
    }

    if (action === 'entities') {
      return { action };
    }

    const choice = params.choice;
    if (!(typeof choice === 'string' && choice.length > 0)) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". Для action="${action}" обязателен параметр choice`
      );
    }

    if (action === 'filters') {
      return { action, choice };
    }

    let filters: SearchFilter[] = [];
    if (params.filters) {
      if (!Array.isArray(params.filters)) {
        throw new Error(
          `Ошибка в инструменте с типом "${this.type}". Параметр filters должен быть массивом`
        );
      }
      filters = params.filters.map((raw, index) =>
        this.normalizeFilter(raw, index)
      );
    }

    const searchQuery =
      typeof params.searchQuery === 'string' ? params.searchQuery : '';

    return {
      action,
      choice,
      filters,
      searchQuery
    };
  }

  private normalizeFilter(raw: unknown, index: number): SearchFilter {
    if (!(raw && typeof raw === 'object' && !Array.isArray(raw))) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". filters[${index}] должен быть объектом`
      );
    }

    const entry: Record<string, unknown> = {};
    for (const key in raw as Record<string, unknown>) {
      entry[key.trim()] = (raw as Record<string, unknown>)[key];
    }

    const field = entry.field;
    const operator = entry.operator;
    if (!(typeof field === 'string' && field.length > 0)) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". filters[${index}].field обязателен`
      );
    }
    if (!(typeof operator === 'string' && operator.length > 0)) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". filters[${index}].operator обязателен`
      );
    }
    if (!('value' in entry)) {
      throw new Error(
        `Ошибка в инструменте с типом "${this.type}". filters[${index}].value обязателен`
      );
    }

    const filter: SearchFilter = {
      field,
      operator,
      value: coerceFilterValue(entry.value),
      // The model proved to be untrustworthy with case sensitivity.
      ignoreCase: true
    };

    return filter;
  }

  private capRunResult(result: unknown): { total: number; results: unknown[] } {
    let items: unknown[] = [];
    if (Array.isArray(result)) {
      items = result;
    }

    return {
      total: items.length,
      results: items.slice(0, SEARCH_TOOL_RESULT_LIMIT)
    };
  }
}
