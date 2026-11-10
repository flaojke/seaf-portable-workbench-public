/** @jest-environment jsdom */

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

// ERA-3562, TC-26 (test-cases.md): настоящий Link.vue (ячейка link) вместе с DCLink.vue.

import path from 'path';
import { createApp } from 'vue';
import { loadVueSfc } from '../../helpers/loadVueSfc';

const Link = loadVueSfc(path.resolve(__dirname, '../../../plugins/editable-table/components/TableCell/Link/Link.vue'));

let app: ReturnType<typeof createApp> | undefined;
let container: HTMLElement;

function render(value: unknown) {
  app = createApp(Link, { value, styles: {} });
  app.config.globalProperties.$style = { link: 'link' };
  app.mount(container);
  return container;
}

const UNSAFE_ANCHORS = 'a[href^="javascript:"], a[href^="data:"], a[href*="script:"]';

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  container.remove();
});

describe('TC-26: Link.vue, колонка link', () => {
  test('объект с javascript: показывается текстом p.text, ссылки нет', () => {
    const root = render({ href: 'javascript:alert(document.cookie)', text: 'Документ' });

    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('[href]')).toBeNull();
    expect(root.querySelector('p.text')?.textContent?.trim()).toBe('Документ');
    expect(root.innerHTML).not.toMatch(/javascript:/i);
  });

  test('строка javascript:alert(1) показывается текстом p.text', () => {
    const root = render('javascript:alert(1)');

    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('p.text')?.textContent?.trim()).toBe('javascript:alert(1)');
  });

  test.each([
    ' JaVaScRiPt:alert(2)',
    'data:text/html,<script>alert(3)</script>',
    'vbscript:msgbox(1)'
  ])('%j -> текст, нет a[href]', (href) => {
    const root = render([{ href, text: 'Т' }]);

    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('[href]')).toBeNull();
    expect(root.textContent).toContain('Т');
  });

  test('смешанный массив: https:, ftp:, путь от корня — ссылки, опасные — текст', () => {
    const root = render([
      { href: 'javascript:alert(document.cookie)', text: 'Документ' },
      { href: ' JaVaScRiPt:alert(2)', text: 'Регистр и пробел' },
      { href: 'data:text/html,<script>alert(3)</script>', text: 'data' },
      'javascript:alert(5)',
      { href: 'https://ya.ru/', text: 'Яндекс' },
      { href: 'ftp://files.example/doc.pdf', text: 'FTP' },
      { href: '/docs/example', text: 'Внутренняя' }
    ]);
    const anchors = Array.from(root.querySelectorAll('a'));

    expect(anchors.map((a) => a.textContent?.trim())).toEqual(['Яндекс', 'FTP', 'Внутренняя']);
    expect(anchors.map((a) => a.getAttribute('href'))).toEqual([
      'https://ya.ru/',
      'ftp://files.example/doc.pdf',
      '/docs/example'
    ]);
    const texts = Array.from(root.querySelectorAll('p.text')).map((p) => p.textContent?.trim());
    expect(texts).toEqual(['Документ', 'Регистр и пробел', 'data', 'javascript:alert(5)']);
    expect(root.querySelector(UNSAFE_ANCHORS)).toBeNull();
  });
});
