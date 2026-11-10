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

// ERA-3562, TC-01…TC-17 (test-cases.md): одно правило ссылок — чёрный список isUnsafeHref.
// Окружение node (без window): база для isUnsafeHref передаётся параметром.

import fs from 'fs';
import path from 'path';
import { isUnsafeHref } from '@front/helpers/linkHref';
import { checkIsValidUrl, formatLinkData } from '../../../plugins/editable-table/lib/helpers';

const BASE = 'https://portal.example/docs/a';

const TC01 = ['javascript:alert(1)'];
const TC02 = ['JaVaScRiPt:alert(1)', 'JAVASCRIPT:alert(1)'];
const TC03 = ['  javascript:alert(1)', '\u0001javascript:alert(1)', '\tjavascript:alert(1)', '\njavascript:alert(1)'];
const TC04 = ['java\tscript:alert(1)', 'java\nscript:alert(1)', 'java\rscript:alert(1)'];
const TC05 = ['data:text/html,<script>alert(1)</script>', 'DATA:text/html,x', 'vbscript:msgbox(1)'];
const TC06 = ['file:///etc/passwd', 'ftp://x', 'tel:+7000', 'kafka.example:9093'];
const TC08 = ['https://ya.ru/', 'HTTP://ya.ru', '/', '/architect/components/system.auth', '/docs/example', '//cdn.example/x'];
const TC09 = [
  'plugin:/idea/source/a.yaml?entity=components&id=x',
  'mailto:a@b.ru',
  'https://file+.vscode-resource.vscode-cdn.net/c/x.md'
];

describe('checkIsValidUrl: таблица', () => {
  test.each(TC01)('TC-01: %j -> false', (url) => {
    expect(checkIsValidUrl(url)).toBe(false);
  });

  test.each(TC02)('TC-02: регистр %j -> false', (url) => {
    expect(checkIsValidUrl(url)).toBe(false);
  });

  test.each(TC03)('TC-03: ведущие пробелы и управляющие символы %j -> false', (url) => {
    expect(checkIsValidUrl(url)).toBe(false);
  });

  test.each(TC04)('TC-04: символы внутри схемы %j -> false', (url) => {
    expect(checkIsValidUrl(url)).toBe(false);
  });

  test.each(TC05)('TC-05: data: и vbscript: %j -> false', (url) => {
    expect(checkIsValidUrl(url)).toBe(false);
  });

  test.each(TC06)('TC-06: неопасные схемы остаются ссылками %j -> true', (url) => {
    expect(checkIsValidUrl(url)).toBe(true);
  });

  test.each([
    'Документ',
    'docs/x',
    '#',
    'http://[',
    '\u00a0javascript:alert(1)',
    '',
    null,
    undefined,
    42,
    {}
  ])('TC-07: не адрес, пустое, не строка %j -> false без исключений', (value) => {
    expect(() => checkIsValidUrl(value)).not.toThrow();
    expect(checkIsValidUrl(value)).toBe(false);
  });

  test.each(TC08)('TC-08: http, https, пути от корня %j -> true', (url) => {
    expect(checkIsValidUrl(url)).toBe(true);
  });

  test.each(TC09)('TC-09: plugin, mailto, VS Code %j -> true', (url) => {
    expect(checkIsValidUrl(url)).toBe(true);
  });
});

describe('formatLinkData', () => {
  const MIXED = [
    { href: 'https://ya.ru', text: 'Я' },
    { href: 'javascript:x', text: 'X' },
    { href: 'ftp://x', text: 'F' }
  ];

  test('TC-10: нестрогий режим (link) — опасная ссылка становится текстом', () => {
    expect(formatLinkData({ href: 'javascript:alert(1)', text: 'X' })).toEqual(['X']);
    expect(formatLinkData('javascript:alert(1)')).toEqual(['javascript:alert(1)']);
    expect(formatLinkData({ href: 'javascript:alert(1)' })).toBeNull();
    expect(formatLinkData(MIXED)).toEqual([{ href: 'https://ya.ru', text: 'Я' }, 'X', { href: 'ftp://x', text: 'F' }]);
  });

  test('TC-11: строгий режим (upload) — отбрасывается только опасная ссылка', () => {
    expect(formatLinkData(MIXED, true)).toEqual([{ href: 'https://ya.ru', text: 'Я' }, { href: 'ftp://x', text: 'F' }]);
    expect(formatLinkData('javascript:alert(1)', true)).toBeNull();
    expect(formatLinkData('file:///x', true)).toEqual([{ href: 'file:///x', text: 'file:///x' }]);
  });
});

describe('isUnsafeHref', () => {
  test.each([...TC01, ...TC02, ...TC03, ...TC04])('TC-12: %j -> true', (href) => {
    expect(isUnsafeHref(href, BASE)).toBe(true);
  });

  test.each(['data:text/html,x', 'Data:image/png;base64,AAAA', 'vbscript:msgbox(1)'])('TC-13: %j -> true', (href) => {
    expect(isUnsafeHref(href, BASE)).toBe(true);
  });

  test('TC-14: адрес, который не разбирается, — опасный (fail-closed)', () => {
    expect(isUnsafeHref('http://[', BASE)).toBe(true);
  });

  test.each([
    '',
    '#',
    '/architect/x',
    'docs/x',
    './x',
    'https://ya.ru',
    'plugin:/idea/source/a.yaml?entity=e&id=1',
    'mailto:a@b.ru',
    'https://file+.vscode-resource.vscode-cdn.net/x',
    'file:///x',
    'ftp://x',
    'tel:+7000',
    // U+00A0 перед схемой: и парсер, и браузер считают вход относительным путём
    '\u00a0javascript:alert(1)'
  ])('TC-15: неопасный адрес %j -> false', (href) => {
    expect(isUnsafeHref(href, BASE)).toBe(false);
  });

  test.each([42, null, undefined, {}])('TC-16: не строка %j -> false без исключений', (value) => {
    expect(() => isUnsafeHref(value, BASE)).not.toThrow();
    expect(isUnsafeHref(value, BASE)).toBe(false);
  });
});

describe('TC-17: одно правило', () => {
  test.each([...TC01, ...TC02, ...TC03, ...TC04, ...TC05, ...TC06, ...TC08, ...TC09])(
    'checkIsValidUrl(%j) === !isUnsafeHref',
    (url) => {
      expect(checkIsValidUrl(url)).toBe(!isUnsafeHref(url, BASE));
    }
  );

  test('список опасных схем объявлен в одном модуле', () => {
    const root = path.resolve(__dirname, '../../..');
    const files = [
      'src/frontend/helpers/linkHref.ts',
      'plugins/editable-table/lib/helpers.js',
      'plugins/editable-table/lib/linkSource.ts',
      'plugins/editable-table/lib/excelLink.ts',
      'plugins/editable-table/index.vue',
      'src/frontend/components/Controls/DCLink.vue'
    ];
    const declsvg = files.filter((file) => /['"]vbscript:['"]/.test(fs.readFileSync(path.join(root, file), 'utf8')));
    expect(declsvg).toEqual(['src/frontend/helpers/linkHref.ts']);
  });
});
