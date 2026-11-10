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
      Yushkov Alexandr <asyushkov@gmail.com>

  Contributors:
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
*/

// Глобальный поиск редактируемой таблицы (профиль: global_search: true).
// Сравнение идёт по отображаемому тексту ячейки — тем же функциям, что использует
// отрисовка ячеек (cellText.ts: getRowOptions, getOptionTextMap, getLinkText).

import { CellDataError, GLOBAL_SEARCH_EXCLUDED_TYPES } from './const';
import { checkIsValueEmpty, formatLinkData, getFilteredTableData } from './helpers';
import { getLinkText, getOptionTextMap, getRowOptions, LinkItem, SelectOptions } from './cellText';

export type TableRow = Record<string, unknown>;
export type TableItem = [string, TableRow];

export interface SearchHeader {
  headerID: string;
  type?: string;
  display?: boolean;
  options?: SelectOptions;
  optionID?: string | null;
}

type OptionTextResolver = (row: TableRow) => Record<string, string | undefined>;

/**
 * Приведение текста к виду для сравнения: без регистра, «ё» = «е»
 * (запрос «отчет» должен находить «Отчётность»).
 */
const normalizeText = (text: string): string => text.toLowerCase().replace(/ё/g, 'е');

export function normalizeGlobalSearchQuery(query: unknown): string {
  if (typeof query !== 'string') return '';
  return normalizeText(query.trim());
}

/** Текст ссылок ячейки так, как их показывает Link.vue (upload нормализуется в строгом режиме). */
function getLinkListText(value: unknown, strictMode: boolean): string {
  const links: Array<LinkItem | string> = formatLinkData(value, strictMode) ?? [];
  return links.map(getLinkText).filter(Boolean).join(' ');
}

// Карты «значение → текст» по группам вариантов одного заголовка: строятся один раз на группу
function createOptionTextResolver(header: SearchHeader): OptionTextResolver {
  const cache = new Map<unknown, Record<string, string | undefined>>();
  return (row) => {
    const key = Array.isArray(header.options) ? null : row?.[header.optionID ?? ''];
    let textMap = cache.get(key);
    if (!textMap) {
      textMap = getOptionTextMap(getRowOptions(header.options, header.optionID, row));
      cache.set(key, textMap);
    }
    return textMap;
  };
}

/**
 * Отображаемый текст ячейки для глобального поиска.
 * Возвращает строку или null, если ячейка не участвует в поиске.
 */
export function getCellSearchText(
  row: TableRow,
  header: SearchHeader,
  resolveOptionText?: OptionTextResolver | null
): string | null {
  const type = header.type ?? 'text';
  if (GLOBAL_SEARCH_EXCLUDED_TYPES.includes(type)) return null;

  const value = row?.[header.headerID];
  // Ячейка с ошибкой данных показывает «Ошибка», а не исходное значение — в поиске не участвует
  if (value instanceof CellDataError) return null;
  if (checkIsValueEmpty(value)) return null;

  switch (type) {
    case 'select':
    case 'multiple-select': {
      // Текст — из группы вариантов этой строки, как в Select.vue: значения вне группы в ячейке не видны
      const textMap = (resolveOptionText ?? createOptionTextResolver(header))(row);
      const values = Array.isArray(value) ? value : [value];
      const text = values
        .map((item) => textMap[String(item)])
        .filter((item) => item !== undefined && item !== null && item !== '')
        .join(' ');
      return text || null;
    }
    case 'link':
      return getLinkListText(value, false) || null;
    case 'upload':
      return getLinkListText(value, true) || null;
    default:
      // text (в том числе render: markdown — исходный текст), fn (только уже вычисленное значение).
      // Объект в такой ячейке как текст не показывается (невалидный text становится CellDataError)
      return typeof value === 'object' ? null : String(value);
  }
}

/**
 * Строки, в которых отображаемый текст хотя бы одной видимой колонки содержит запрос
 * (подстрока, без учёта регистра, «ё» = «е»). Строки из exceptions (createdRows) не скрываются.
 * Пустой запрос — без фильтрации.
 */
export const getGlobalSearchFilteredData = (
  items: TableItem[],
  query: unknown,
  headers: SearchHeader[],
  exceptions: string[] = []
): TableItem[] => {
  const normalizedQuery = normalizeGlobalSearchQuery(query);
  if (!normalizedQuery) return items;

  const searchHeaders = (headers ?? [])
    .filter((header) => header
      && header.display !== false
      && !GLOBAL_SEARCH_EXCLUDED_TYPES.includes(header.type ?? 'text'))
    .map((header) => ({
      header,
      resolveOptionText: header.type === 'select' || header.type === 'multiple-select'
        ? createOptionTextResolver(header)
        : null
    }));

  return items.filter(([rowID, row]) => {
    if (exceptions.includes(rowID)) return true;
    if (!row) return false;

    return searchHeaders.some(({ header, resolveOptionText }) => {
      const text = getCellSearchText(row, header, resolveOptionText);
      return text !== null && normalizeText(text).includes(normalizedQuery);
    });
  });
};

export interface TableFilterParams {
  items: TableItem[];
  filters: Record<string, unknown>;
  headers: SearchHeader[];
  createdRows?: string[];
  globalSearch: string;
  isColumnFilterActive: boolean;
  isGlobalSearchActive: boolean;
}

/**
 * Строки таблицы после фильтров колонок и глобального поиска (в этом порядке, по "И").
 * Какие этапы активны, решает Table.vue (isColumnFilterActive, isGlobalSearchActive).
 */
export const getTableFilteredItems = ({
  items,
  filters,
  headers,
  createdRows = [],
  globalSearch,
  isColumnFilterActive,
  isGlobalSearchActive
}: TableFilterParams): TableItem[] => {
  let result = items;
  if (isColumnFilterActive) {
    result = getFilteredTableData(result, filters, headers, createdRows);
  }
  if (isGlobalSearchActive) {
    result = getGlobalSearchFilteredData(result, globalSearch, headers, createdRows);
  }
  return result;
};

/** Поиск активен: флаг профиля включён и запрос не пустой. */
export const checkIsGlobalSearchActive = (isEnabled: unknown, query: unknown): boolean =>
  Boolean(isEnabled) && normalizeGlobalSearchQuery(query) !== '';

/**
 * Выделение, сокращённое до видимых строк. Возвращает null, если сокращать нечего.
 */
export const getSelectionWithinItems = (selectedRows: string[], items: TableItem[]): string[] | null => {
  if (!selectedRows?.length) return null;
  const visibleIDs = new Set(items.map(([rowID]) => rowID));
  const keptRows = selectedRows.filter((rowID) => visibleIDs.has(rowID));
  return keptRows.length === selectedRows.length ? null : keptRows;
};

export interface SearchDebouncer {
  input(query: string): void;
  cancel(): void;
}

/**
 * Отложенное применение запроса: поле обновляется сразу, запрос — после паузы ввода.
 * apply(query) вызывается не чаще одного раза за паузу; cancel() отменяет ожидающее применение.
 */
export const createSearchDebouncer = (apply: (query: string) => void, delay: number): SearchDebouncer => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const cancel = () => {
    if (timeout !== null) clearTimeout(timeout);
    timeout = null;
  };
  return {
    input(query) {
      cancel();
      timeout = setTimeout(() => {
        timeout = null;
        apply(query);
      }, delay);
    },
    cancel
  };
};
