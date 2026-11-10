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

// Ширина колонки редактируемой таблицы (Т7.8).
// Колонка без явного width получает минимальную ширину DEFAULT_MIN_HEADER_WIDTH, чтобы текст
// и чипы переносились по словам. Для Markdown минимум 280px; у флажка минимума нет.

import { DEFAULT_HEADER_ITEM_OPTIONS } from './const';

const AUTO_HEADER_WIDTH: string = DEFAULT_HEADER_ITEM_OPTIONS.width;

export const DEFAULT_MIN_HEADER_WIDTH = '160px';
export const HEADER_TYPES_WITHOUT_MIN_WIDTH: readonly string[] = ['checkbox'];

// Ширина по умолчанию для колонки заданного типа: трек CSS grid
export const defaultHeaderWidth = (type?: string, render?: string): string =>
  type !== undefined && HEADER_TYPES_WITHOUT_MIN_WIDTH.includes(type)
    ? AUTO_HEADER_WIDTH
    : `minmax(${render === 'markdown' ? '280px' : DEFAULT_MIN_HEADER_WIDTH}, ${AUTO_HEADER_WIDTH})`;

// Ширина колонки из профиля: число пикселей (width: 120 или '120px') или ширина по умолчанию
export const resolveHeaderWidth = (width: unknown, type?: string, render?: string): string => {
  const pixels = Number.parseInt(String(width));
  return pixels ? `${pixels}px` : defaultHeaderWidth(type, render);
};
