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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2026
*/

// Исходные значения ячеек колонок link с опасными ссылками (ERA-3562).
// Таблица показывает опасную ссылку текстом (formatLinkData), но при сохранении в файл и в параметрах
// table и full_table выражения format должно оказаться исходное значение ячейки, а не текст.

import { formatLinkData } from './helpers';
import { isUnsafeHref } from '@front/helpers/linkHref';

export interface LinkSource {
  // значение ячейки в источнике на момент загрузки (копия)
  raw: unknown;
  // то, что показывает таблица после formatLinkData (JSON): если ячейку изменили, исходное не подставляется
  shown: string;
}

export type LinkSourceData = Record<string, Record<string, LinkSource>>;

export interface LinkSourceHeader {
  type?: string;
}

type TableRows = Record<string, unknown> | unknown[] | null | undefined;

// Для абсолютного адреса результат isUnsafeHref от базы не зависит
const ABSOLUTE_URL_BASE = 'https://localhost/';

function isAbsoluteUrl(href: string): boolean {
  try {
    return Boolean(new URL(href));
  } catch {
    return false;
  }
}

// Адрес, который до ERA-3562 был ссылкой (абсолютный адрес), а теперь показывается текстом: опасная схема.
// Пути от корня опасными не бывают; неразбираемый адрес и до ERA-3562 был текстом
function isHiddenLinkHref(href: unknown): boolean {
  return typeof href === 'string' && isAbsoluteUrl(href) && isUnsafeHref(href, ABSOLUTE_URL_BASE);
}

// Есть ли в значении ячейки link опасная ссылка: элемент-строка или href элемента-объекта
export function hasUnsafeLink(value: unknown): boolean {
  const items: unknown[] = Array.isArray(value) ? value : [value];
  return items.some((item) => {
    if (typeof item === 'string') {
      return isHiddenLinkHref(item);
    }
    return Boolean(item) && typeof item === 'object' && isHiddenLinkHref((item as { href?: unknown }).href);
  });
}

// Исходные значения ячеек всех колонок link, в которых есть опасные ссылки. Пустые строки таблицы пропускаются
export function collectLinkSource(rawTableData: TableRows, headers: Record<string, LinkSourceHeader>): LinkSourceData {
  const source: LinkSourceData = {};

  for (const [rowID, row] of Object.entries(rawTableData ?? {})) {
    if (!row || typeof row !== 'object') continue;

    for (const headerID in headers) {
      const raw = (row as Record<string, unknown>)[headerID];

      if (headers[headerID]?.type !== 'link' || !raw || !hasUnsafeLink(raw)) continue;

      source[rowID] = source[rowID] ?? {};
      source[rowID][headerID] = {
        raw: JSON.parse(JSON.stringify(raw)),
        shown: JSON.stringify(formatLinkData(raw))
      };
    }
  }

  return source;
}

// Значение ячейки для записи: исходное, если ячейку не меняли после загрузки, иначе текущее
export function restoreLinkSource(tableValue: unknown, source: LinkSource | null | undefined): unknown {
  return source && JSON.stringify(tableValue) === source.shown ? source.raw : tableValue;
}

// Копия данных таблицы для full_table: ячейки с опасными ссылками — исходные значения; tableData не меняется
export function restoreLinkSourceTable(
  tableData: Record<string, Record<string, unknown> | null> | null | undefined,
  linkSourceData: LinkSourceData | null | undefined
): Record<string, Record<string, unknown> | null> {
  const result: Record<string, Record<string, unknown> | null> = {};

  for (const [rowID, row] of Object.entries(tableData ?? {})) {
    const rowSource = linkSourceData?.[rowID];

    if (!row || !rowSource) {
      result[rowID] = row;
      continue;
    }

    const restored = { ...row };
    for (const headerID of Object.keys(rowSource)) {
      if (Object.prototype.hasOwnProperty.call(restored, headerID)) {
        restored[headerID] = restoreLinkSource(restored[headerID], rowSource[headerID]);
      }
    }
    result[rowID] = restored;
  }

  return result;
}
