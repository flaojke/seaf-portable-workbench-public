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

// ERA-3562, TC-27 (test-cases.md): значение ячейки ссылок для выгрузки в Excel.

import fs from 'fs';
import path from 'path';
import { ExcelHyperlinkSource, formatExcelLinkValue } from '../../../plugins/editable-table/lib/excelLink';

const BASE = 'https://portal.example/docs/a';

// Как createExcelHyperlinkData в index.vue (портал, не плагин): путь от корня — относительно страницы
const createHyperlink = jest.fn(({ hyperlink, text }: ExcelHyperlinkSource) => {
  const url = new URL(hyperlink, hyperlink.startsWith('/') ? BASE : undefined).toString();
  return { hyperlink: url, text: text ?? url };
});

const format = (value: unknown) => formatExcelLinkValue(value, createHyperlink, BASE);

beforeEach(() => createHyperlink.mockClear());

describe('TC-27: выгрузка ссылок в Excel', () => {
  test.each([
    ['javascript:alert(1)', 'javascript:alert(1)'],
    [' JaVaScRiPt:alert(2)', ' JaVaScRiPt:alert(2)'],
    [{ href: 'javascript:alert(1)', text: 'X' }, 'X'],
    [{ href: 'data:text/html,x' }, 'data:text/html,x']
  ])('опасный адрес %j -> текст %j без гиперссылки', (value, expected) => {
    expect(format(value)).toBe(expected);
    expect(createHyperlink).not.toHaveBeenCalled();
  });

  test.each([
    ['https://ya.ru/', { hyperlink: 'https://ya.ru/', text: 'https://ya.ru/' }],
    [{ href: 'ftp://x', text: 'F' }, { hyperlink: 'ftp://x/', text: 'F' }],
    [{ href: 'file:///share/doc.pdf', text: 'Файл' }, { hyperlink: 'file:///share/doc.pdf', text: 'Файл' }],
    [{ href: '/docs/example', text: 'Внутренняя' }, { hyperlink: 'https://portal.example/docs/example', text: 'Внутренняя' }]
  ])('%j -> гиперссылка, как до ERA-3562', (value, expected) => {
    expect(format(value)).toEqual(expected);
  });

  test('массив — поэлементно', () => {
    expect(format([
      'javascript:alert(1)',
      ' JaVaScRiPt:alert(2)',
      { href: 'javascript:alert(1)', text: 'X' },
      { href: 'data:text/html,x' },
      'https://ya.ru/',
      { href: 'ftp://x', text: 'F' }
    ])).toEqual([
      'javascript:alert(1)',
      ' JaVaScRiPt:alert(2)',
      'X',
      'data:text/html,x',
      { hyperlink: 'https://ya.ru/', text: 'https://ya.ru/' },
      { hyperlink: 'ftp://x/', text: 'F' }
    ]);
  });

  test('остальное — как до ERA-3562: текст без адреса — текст, пустое и не ссылка — null', () => {
    expect(format('Документ')).toBe('Документ');
    expect(format({ href: 'docs/x', text: 'D' })).toBe('D');
    expect(format(null)).toBeNull();
    expect(format({ text: 'без href' })).toBeNull();
    expect(format(['', null, 'Документ'])).toEqual(['Документ']);
  });
});

describe('TC-27: выгрузка из index.vue идёт через formatExcelLinkValue', () => {
  // index.vue в jest не компилируется (тянет весь UI плагина) — проверяем исходник, как TC-17
  const source = fs.readFileSync(path.resolve(__dirname, '../../../plugins/editable-table/index.vue'), 'utf8');

  test('formatToExcelUrlValue вызывает formatExcelLinkValue с createExcelHyperlinkData', () => {
    expect(source).toMatch(/import\s*\{\s*formatExcelLinkValue\s*\}\s*from\s*'\.\/lib\/excelLink'/);
    const method = source.match(/\n\s*formatToExcelUrlValue\(tableLink\)\s*\{([\s\S]*?)\n\s{6}\},/);
    expect(method).not.toBeNull();
    expect(method?.[1]).toMatch(/return\s+formatExcelLinkValue\(\s*tableLink\s*,[\s\S]*?this\.createExcelHyperlinkData/);
  });

  test('ячейки link и upload выгружаются через formatToExcelUrlValue', () => {
    expect(source).toMatch(/type === 'link' \|\| type === 'upload'\)\)\s*\{\s*cellData = this\.formatToExcelUrlValue\(cellData\)/);
  });
});
