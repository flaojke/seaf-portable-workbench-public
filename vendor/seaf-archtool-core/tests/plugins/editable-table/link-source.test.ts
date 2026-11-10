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

// ERA-3562, TC-18, TC-19 (test-cases.md): сбор и восстановление исходных значений ячеек link с опасными ссылками.

import {
  collectLinkSource,
  hasUnsafeLink,
  restoreLinkSource,
  restoreLinkSourceTable
} from '../../../plugins/editable-table/lib/linkSource';
import { formatLinkData } from '../../../plugins/editable-table/lib/helpers';

const XSS_LINK = [
  { href: 'javascript:alert(document.cookie)', text: 'Документ' },
  { href: ' JaVaScRiPt:alert(2)', text: 'Регистр и пробел' },
  { href: 'data:text/html,<script>alert(3)</script>', text: 'data' },
  'javascript:alert(5)',
  { href: 'https://ya.ru/', text: 'Яндекс' },
  { href: '/docs/example', text: 'Внутренняя' }
];
const XSS_UPLOAD = [
  { href: 'javascript:alert(4)', text: 'Файл-ловушка' },
  { href: 'ftp://files.example/upload.pdf', text: 'Файл-FTP' },
  { href: 'https://ya.ru/', text: 'Файл-норма' }
];
const OTHER_LINK = [
  { href: 'ftp://files.example/doc.pdf', text: 'FTP' },
  { href: 'file:///share/doc.pdf', text: 'Файл' },
  { href: 'https://ya.ru/', text: 'Яндекс' }
];

const HEADERS = {
  name: { type: 'text' },
  link: { type: 'link', save: { path: 'table.yaml' } },
  // колонка link без save: для full_table исходные значения тоже нужны
  ref: { type: 'link' },
  upload: { type: 'upload', save: { path: 'table.yaml' } }
};

describe('hasUnsafeLink', () => {
  test.each([
    [{ href: 'javascript:alert(1)', text: 'X' }, true],
    ['javascript:alert(1)', true],
    [{ href: 'javascript:alert(1)' }, true],
    [[{ href: 'https://ya.ru', text: 'Я' }, 'DATA:text/html,x'], true],
    [{ href: 'https://ya.ru', text: 'Я' }, false],
    [[{ href: 'ftp://x', text: 'F' }, 'file:///x', 'Документ'], false],
    // и до ERA-3562 был текстом: собирать не нужно
    [{ href: 'http://[', text: 'X' }, false],
    [{ href: 'docs/x', text: 'D' }, false],
    ['\u00a0javascript:alert(1)', false],
    [[null, 42, {}], false]
  ])('%j -> %s', (value, expected) => {
    expect(hasUnsafeLink(value)).toBe(expected);
  });
});

describe('TC-18: сбор исходных значений', () => {
  const RAW = {
    r1: { name: 'XSS link', link: XSS_LINK, ref: 'javascript:alert(6)', upload: XSS_UPLOAD },
    r2: { name: 'Other schemes', link: OTHER_LINK, ref: 'Документ', upload: XSS_UPLOAD.slice(1) },
    r3: null,
    r4: { name: 'Пустые', link: null, ref: '' }
  };

  test('собраны ячейки «XSS link» обеих колонок link; upload, безопасные ячейки и пустая строка — нет', () => {
    const source = collectLinkSource(RAW, HEADERS);

    expect(Object.keys(source)).toEqual(['r1']);
    expect(Object.keys(source.r1).sort()).toEqual(['link', 'ref']);
    expect(source.r1.link.raw).toEqual(XSS_LINK);
    expect(source.r1.link.shown).toBe(JSON.stringify(formatLinkData(XSS_LINK)));
    expect(source.r1.ref.raw).toBe('javascript:alert(6)');
  });

  test('пустая строка таблицы и массив строк не роняют сбор', () => {
    expect(() => collectLinkSource({ r1: null, r2: undefined }, HEADERS)).not.toThrow();
    expect(collectLinkSource([null, { link: 'javascript:x' }], HEADERS)).toEqual({
      1: { link: { raw: 'javascript:x', shown: JSON.stringify(['javascript:x']) } }
    });
    expect(collectLinkSource(null, HEADERS)).toEqual({});
  });
});

describe('TC-19: восстановление значения', () => {
  const load = (link: unknown) => {
    const raw = { r1: { link } };
    return { raw, source: collectLinkSource(raw, HEADERS).r1.link };
  };

  test('ячейка не менялась -> исходное значение', () => {
    const { source } = load(XSS_LINK);
    expect(restoreLinkSource(formatLinkData(XSS_LINK), source)).toEqual(XSS_LINK);
  });

  test('ячейка изменена после загрузки -> новое значение', () => {
    const { source } = load(XSS_LINK);
    expect(restoreLinkSource('новый текст', source)).toBe('новый текст');
  });

  test('для ячейки нет исходного значения -> текущее значение', () => {
    const value = [{ href: 'https://ya.ru/', text: 'Яндекс' }];
    expect(restoreLinkSource(value, undefined)).toBe(value);
    expect(restoreLinkSource(value, null)).toBe(value);
  });

  test('исходный объект источника изменён после загрузки -> значение на момент загрузки', () => {
    const link = { href: 'javascript:alert(1)', text: 'X' };
    const { source } = load(link);
    link.href = 'https://changed.example/';
    link.text = 'изменено';

    expect(restoreLinkSource(['X'], source)).toEqual({ href: 'javascript:alert(1)', text: 'X' });
  });
});

describe('restoreLinkSourceTable (full_table)', () => {
  test('копия: опасные ячейки — исходные значения, остальное как в таблице; tableData не меняется', () => {
    const raw = {
      r1: { name: 'XSS link', link: XSS_LINK, ref: 'javascript:alert(6)' },
      r2: { name: 'Other schemes', link: OTHER_LINK, ref: 'Документ' }
    };
    const tableData: Record<string, Record<string, unknown> | null> = {
      r1: { name: 'XSS link', link: formatLinkData(XSS_LINK), ref: formatLinkData('javascript:alert(6)') },
      r2: { name: 'Other schemes', link: formatLinkData(OTHER_LINK), ref: formatLinkData('Документ') },
      r3: null
    };
    const before = JSON.stringify(tableData);

    const full = restoreLinkSourceTable(tableData, collectLinkSource(raw, HEADERS));

    expect(full.r1).toEqual({ name: 'XSS link', link: XSS_LINK, ref: 'javascript:alert(6)' });
    expect(full.r2).toBe(tableData.r2);
    expect(full.r3).toBeNull();
    expect(JSON.stringify(tableData)).toBe(before);
  });

  test('изменённая ячейка остаётся новой; нет исходных значений — та же таблица', () => {
    const raw = { r1: { link: 'javascript:alert(1)' } };
    const tableData = { r1: { link: 'новый текст' } };

    expect(restoreLinkSourceTable(tableData, collectLinkSource(raw, HEADERS)).r1).toEqual({ link: 'новый текст' });
    expect(restoreLinkSourceTable(tableData, {})).toEqual(tableData);
    expect(restoreLinkSourceTable(null, null)).toEqual({});
  });
});
