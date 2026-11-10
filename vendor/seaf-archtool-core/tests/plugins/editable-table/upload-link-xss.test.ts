/** @jest-environment jsdom */

// ERA-3562, TC-30 (test-cases.md): ячейка upload — настоящие LinkEditor.vue и LinkItem.vue (вместе с DCLink.vue и Icon.vue).
// Редактор текста ссылки проверяет адрес той же функцией, что и вся таблица (isUnsafeHref через checkIsValidUrl).

import path from 'path';
import { createApp } from 'vue';
import { loadVueSfc } from '../../helpers/loadVueSfc';

const UPLOAD = path.resolve(__dirname, '../../../plugins/editable-table/components/TableCell/Upload');
const LinkEditor = loadVueSfc(path.join(UPLOAD, 'LinkEditor.vue'));
const LinkItem = loadVueSfc(path.join(UPLOAD, 'LinkItem.vue'));

let app: ReturnType<typeof createApp> | undefined;
let container: HTMLElement;

function mount(component: Record<string, any>, props: Record<string, unknown>, listeners: Record<string, jest.Mock> = {}) {
  const onProps = Object.fromEntries(Object.entries(listeners).map(([name, fn]) => [`on${name[0].toUpperCase()}${name.slice(1)}`, fn]));
  app = createApp(component, { ...props, ...onProps });
  app.config.globalProperties.$style = { link: 'link' };
  app.mount(container);
  return container;
}

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  app?.unmount();
  app = undefined;
  container.remove();
});

describe('TC-30: LinkEditor (редактор текста ссылки в ячейке upload)', () => {
  const saveButton = (root: HTMLElement) => root.querySelector('.format-action .button') as HTMLButtonElement;

  test.each([
    'javascript:alert(1)',
    ' JaVaScRiPt:alert(2)',
    'java\tscript:alert(3)',
    'data:text/html,<script>alert(4)</script>',
    'vbscript:msgbox(1)'
  ])('опасный адрес %j — кнопка сохранения недоступна', (href) => {
    const save = jest.fn();
    const root = mount(LinkEditor, { link: { href, text: 'Т' } }, { save });

    expect(saveButton(root).disabled).toBe(true);
    saveButton(root).click();
    expect(save).not.toHaveBeenCalled();
  });

  test.each([
    'https://ya.ru/',
    'ftp://files.example/upload.pdf',
    'file:///share/doc.pdf',
    'tel:+7000',
    'mailto:a@b.ru',
    '/docs/example'
  ])('адрес %j — сохранение доступно, наружу уходят href и text', (href) => {
    const save = jest.fn();
    const root = mount(LinkEditor, { link: { href, text: 'Текст' } }, { save });

    expect(saveButton(root).disabled).toBe(false);
    saveButton(root).click();
    expect(save).toHaveBeenCalledWith({ href, text: 'Текст' });
  });
});

describe('TC-30: LinkItem (ссылка в ячейке upload)', () => {
  test.each([
    'javascript:alert(4)',
    'data:text/html,x',
    'vbscript:msgbox(1)'
  ])('опасный адрес %j (если попал в данные) — текст без a и href', (href) => {
    const root = mount(LinkItem, { link: { href, text: 'Файл-ловушка' }, disabled: true });

    expect(root.querySelector('a')).toBeNull();
    expect(root.querySelector('[href]')).toBeNull();
    expect(root.textContent).toContain('Файл-ловушка');
  });

  test.each([
    ['ftp://files.example/upload.pdf', 'Файл-FTP'],
    ['https://ya.ru/', 'Файл-норма']
  ])('адрес %j — ссылка', (href, text) => {
    const root = mount(LinkItem, { link: { href, text }, disabled: true });
    const a = root.querySelector('a') as HTMLAnchorElement;

    expect(a.getAttribute('href')).toBe(href);
    expect(a.textContent?.trim()).toBe(text);
  });
});
