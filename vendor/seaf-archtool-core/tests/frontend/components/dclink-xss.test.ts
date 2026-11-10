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

// ERA-3562, TC-25 (test-cases.md): настоящий DCLink.vue, скомпилированный в тесте.

import path from 'path';
import { createApp, h } from 'vue';
import { loadVueSfc } from '../../helpers/loadVueSfc';

const DCLink = loadVueSfc(path.resolve(__dirname, '../../../src/frontend/components/Controls/DCLink.vue'));

let app: ReturnType<typeof createApp> | undefined;
let container: HTMLElement;
let router: { push: jest.Mock; resolve: jest.Mock };
let goto: jest.Mock;

function render(href: string, text = 'Текст') {
  app = createApp({ render: () => h(DCLink, { href }, () => text) });
  app.config.globalProperties.$style = { link: 'link' };
  app.config.globalProperties.$router = router;
  app.mount(container);
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  router = { push: jest.fn(), resolve: jest.fn((to) => ({ href: to })) };
  goto = jest.fn();
  (window as any).$PAPI = { goto };
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  container.remove();
  delete (window as any).$PAPI;
});

// Входы TC-12…TC-14
const UNSAFE = [
  'javascript:alert(1)',
  'JaVaScRiPt:alert(1)',
  'JAVASCRIPT:alert(1)',
  '  javascript:alert(1)',
  '\u0001javascript:alert(1)',
  '\tjavascript:alert(1)',
  '\njavascript:alert(1)',
  'java\tscript:alert(1)',
  'java\nscript:alert(1)',
  'java\rscript:alert(1)',
  'data:text/html,x',
  'Data:image/png;base64,AAAA',
  'vbscript:msgbox(1)',
  'http://[',
  // проверка isUnsafe идёт раньше ветви VS Code (href.includes('https://file+.vscode-resource…'))
  'javascript:alert(1)//https://file+.vscode-resource.vscode-cdn.net/x'
];

describe('TC-25: DCLink, опасные адреса выводятся текстом', () => {
  test.each(UNSAFE)('%j -> span с текстом слота, без a и href; клик ничего не вызывает', (href) => {
    const root = render(href, 'Документ');

    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('[href]')).toBeNull();
    expect(root.innerHTML).not.toMatch(/href=/i);
    const span = root.querySelector('span') as HTMLElement;
    expect(span).not.toBeNull();
    expect(span.textContent).toBe('Документ');
    // без класса ссылки VS Code: обработчик onClickVsCodeLink не навешан
    expect(span.className).toBe('');

    span.click();
    expect(goto).not.toHaveBeenCalled();
    expect(router.push).not.toHaveBeenCalled();
  });
});

describe('TC-25: DCLink, остальные адреса — как до ERA-3562', () => {
  test.each([
    ['https://ya.ru', '_blank'],
    ['http://ya.ru/x', '_blank'],
    ['mailto:a@b.ru', '_blank'],
    ['file:///x', '_blank'],
    ['ftp://x', '_blank'],
    ['tel:+7000', '_blank'],
    ['/architect/x', null],
    ['#', null],
    ['docs/x', null]
  ])('%j -> a[href], target %j', (href, target) => {
    const root = render(href);
    const a = root.querySelector('a') as HTMLAnchorElement;

    expect(a).not.toBeNull();
    expect(a.getAttribute('href')).toBe(href);
    expect(a.getAttribute('target')).toBe(target);
    if (target) {
      expect(a.getAttribute('rel')).toBe('noopener noreferrer');
    }
    expect(a.textContent).toBe('Текст');
  });

  test('путь от корня по клику — переход роутером', () => {
    const root = render('/architect/x');
    (root.querySelector('a') as HTMLElement).click();

    expect(router.push).toHaveBeenCalledWith('/architect/x');
  });

  test('plugin: по клику вызывает $PAPI.goto', () => {
    const root = render('plugin:/idea/source/a.yaml?entity=e&id=1');
    (root.querySelector('a') as HTMLElement).click();

    expect(goto).toHaveBeenCalledWith('plugin:/idea/source/a.yaml', 'e', '1');
  });

  test('ссылка на файл VS Code: span с классом ссылки, клик вызывает $PAPI.goto', () => {
    const href = 'https://file+.vscode-resource.vscode-cdn.net/x';
    const root = render(href);
    expect(root.querySelector('a')).toBeNull();
    const span = root.querySelector('span') as HTMLElement;
    expect(span.className).toContain('link');

    span.click();
    expect(goto).toHaveBeenCalledWith(href);
  });

  test('U+00A0 перед javascript: — относительный путь, в DOM нет href со схемой javascript:', () => {
    const root = render('\u00a0javascript:alert(1)');
    const a = root.querySelector('a') as HTMLAnchorElement;

    expect(a).not.toBeNull();
    expect(a.protocol).not.toBe('javascript:');
    expect(root.querySelector('a[href^="javascript:"]')).toBeNull();
  });
});
