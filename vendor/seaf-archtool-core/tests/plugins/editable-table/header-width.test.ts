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
*/

import {
  DEFAULT_MIN_HEADER_WIDTH,
  defaultHeaderWidth,
  resolveHeaderWidth
} from '../../../plugins/editable-table/lib/headerWidth';

const withMin = `minmax(${DEFAULT_MIN_HEADER_WIDTH}, auto)`;

describe('headerWidth', () => {
  test('Колонка без явной ширины получает минимальную ширину', () => {
    expect(defaultHeaderWidth('text')).toBe(withMin);
    expect(defaultHeaderWidth('select')).toBe(withMin);
    expect(defaultHeaderWidth(undefined)).toBe(withMin);
  });

  test('Флажок остается узким', () => {
    expect(defaultHeaderWidth('checkbox')).toBe('auto');
  });

  test('Markdown без заданной ширины сохраняет минимум 280px', () => {
    expect(defaultHeaderWidth('text', 'markdown')).toBe('minmax(280px, auto)');
    expect(resolveHeaderWidth(undefined, 'text', 'markdown')).toBe('minmax(280px, auto)');
    expect(resolveHeaderWidth('auto', 'text', 'markdown')).toBe('minmax(280px, auto)');
  });

  test('Явная ширина Markdown может быть меньше минимума', () => {
    expect(resolveHeaderWidth(150, 'text', 'markdown')).toBe('150px');
    expect(resolveHeaderWidth('40px', 'text', 'markdown')).toBe('40px');
  });

  test('Имена служебных ключей и свойств прототипа не считаются типами колонок', () => {
    expect(defaultHeaderWidth('_default')).toBe(withMin);
    expect(defaultHeaderWidth('constructor')).toBe(withMin);
    expect(defaultHeaderWidth('toString')).toBe(withMin);
  });

  test('Явная ширина из профиля: число или строка с px', () => {
    expect(resolveHeaderWidth(120, 'text')).toBe('120px');
    expect(resolveHeaderWidth('200px', 'checkbox')).toBe('200px');
  });

  test('Без ширины или с нечисловой шириной — ширина по умолчанию для типа', () => {
    expect(resolveHeaderWidth(undefined, 'text')).toBe(withMin);
    expect(resolveHeaderWidth('auto', 'text')).toBe(withMin);
    expect(resolveHeaderWidth(0, 'checkbox')).toBe('auto');
  });
});
