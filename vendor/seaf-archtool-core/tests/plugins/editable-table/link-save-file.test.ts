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

// ERA-3562, TC-20…TC-24 (test-cases.md): сохранение таблицы целиком —
// init() -> saveTableToFiles() -> текст файла, который уходит в putContent; фильтр, поиск и сортировка колонки link.
// Окружение (не backend, не плагин) и транспорт замоканы; код миксинов, кэш сессии (jsdom), jsonata и yaml настоящие.

import path from 'path';
import jsonata from 'jsonata';
import yaml from 'yaml';
import { loadVueSfc } from '../../helpers/loadVueSfc';
import { getFilteredTableData, getMultipleRowSorter } from '../../../plugins/editable-table/lib/helpers';
import { getGlobalSearchFilteredData } from '../../../plugins/editable-table/lib/globalSearch';
import { FILTRATION_MODES } from '../../../plugins/editable-table/lib/const';

jest.mock('@front/helpers/env', () => ({
  __esModule: true,
  default: { isBackendMode: false, isPlugin: () => false },
  Plugins: { idea: 'idea', vscode: 'vscode' }
}));
jest.mock('@front/helpers/uri', () => ({ __esModule: true, default: { getBaseURIOfPath: () => '' } }));
jest.mock('@global/helpers/updateRootFiles/updateRootFilesInPutContent', () => ({}));
jest.mock('../../../plugins/editable-table/index', () => ({ logger: { info: jest.fn(), error: jest.fn() } }));

const MIXINS = path.resolve(__dirname, '../../../plugins/editable-table/mixins');
const TableDataMixin = loadVueSfc(path.join(MIXINS, 'TableDataMixin.vue'));
const SaveTableMixin = loadVueSfc(path.join(MIXINS, 'SaveTableMixin.vue'));
const CacheMixin = loadVueSfc(path.join(MIXINS, 'CacheMixin.vue'));

const SAVE = { path: 'table.yaml' };
const HEADERS = [
  { value: 'name', text: 'Имя', type: 'text', editable: true, save: SAVE },
  { value: 'link', text: 'Ссылки', type: 'link', save: SAVE },
  { value: 'upload', text: 'Файлы', type: 'upload', save: SAVE }
];
// Для TC-21: колонка link без save
const HEADERS_WITH_REF = [...HEADERS, { value: 'ref', text: 'Ссылка без save', type: 'link' }];

// Данные из test-cases.md
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
const REF = { href: 'javascript:alert(6)', text: 'Ссылка-ловушка' };

const body = () => JSON.parse(JSON.stringify({
  r1: { name: 'XSS link', link: XSS_LINK, upload: XSS_UPLOAD, ref: REF },
  r2: { name: 'Other schemes', link: OTHER_LINK, ref: 'https://ya.ru/' }
}));

const STORAGE_KEY = 'editable_table:link-save-file';

interface TableOptions {
  headers?: unknown[];
  format?: string;
  fileContent?: string;
}

// Минимальный «компонент»: данные и методы миксинов; pullProfileData вычисляет format настоящим jsonata
function createTable({ headers = HEADERS, format, fileContent = 'r1:\n  extra: keep\n' }: TableOptions = {}) {
  const profile = { headers, format };
  const putContent = jest.fn();
  const saved = new Promise<string>((resolve) => putContent.mockImplementation((_p: string, text: string) => resolve(text)));
  const formatParams: Record<string, any>[] = [];
  const table: any = {
    ...TableDataMixin.data.call({ profile }),
    profile,
    storageKey: STORAGE_KEY,
    $attrs: {},
    tableOptions: { hasChange: true, nullStr: '' },
    pullData: async() => ({ body: body(), headers: [] }),
    getContent: async() => ({ data: fileContent }),
    putContent
  };
  Object.assign(table, TableDataMixin.methods, SaveTableMixin.methods, CacheMixin.methods);
  table.pullProfileData = async(expression: string, extraData: Record<string, any>) => {
    formatParams.push(JSON.parse(JSON.stringify(extraData)));
    return jsonata(expression).evaluate(extraData);
  };
  return { table, putContent, saved, formatParams };
}

async function load(options?: TableOptions) {
  const created = createTable(options);
  await TableDataMixin.methods.init.call(created.table);
  // как в index.vue: после init tableHeaders заменяется картой заголовков
  created.table.tableHeaders = created.table.tableHeaders.headers;
  return created;
}

async function save({ table, saved }: Awaited<ReturnType<typeof load>>) {
  table.saveTableToFiles();
  const text = await Promise.race([
    saved,
    new Promise<string>((_r, reject) => setTimeout(() => reject(new Error(`putContent не вызван: ${table.dialogMessage}`)), 2000))
  ]);
  return { text, file: yaml.parse(text) };
}

beforeEach(() => sessionStorage.clear());

describe('TC-20: сохранение без format, колонка link с save', () => {
  test('в файле исходные значения «XSS link» и «Other schemes»; соседние данные файла сохранены', async() => {
    const loaded = await load();
    loaded.table.tableData.r1.name = 'XSS link 2';
    const { file, text } = await save(loaded);

    expect(loaded.putContent).toHaveBeenCalledTimes(1);
    expect(loaded.putContent.mock.calls[0][0]).toBe('table.yaml');
    expect(file.r1.link).toEqual(XSS_LINK);
    expect(file.r2.link).toEqual(OTHER_LINK);
    expect(file.r1.name).toBe('XSS link 2');
    expect(file.r1.extra).toBe('keep');
    expect(text).toContain('javascript:alert(document.cookie)');
    expect(text).toContain('javascript:alert(5)');
    expect(text).toContain('data:text/html,<script>alert(3)</script>');
  });

  test('в таблице те же ссылки показываются текстом', async() => {
    const { table } = await load();

    expect(table.tableData.r1.link).toEqual([
      'Документ', 'Регистр и пробел', 'data', 'javascript:alert(5)',
      { href: 'https://ya.ru/', text: 'Яндекс' },
      { href: '/docs/example', text: 'Внутренняя' }
    ]);
    expect(table.tableData.r2.link).toEqual(OTHER_LINK);
  });

  test('ячейка link, изменённая после загрузки, записывается новым значением', async() => {
    const loaded = await load();
    loaded.table.tableData.r1.link = ['новый текст'];
    const { file } = await save(loaded);

    expect(file.r1.link).toEqual(['новый текст']);
  });
});

describe('TC-21: сохранение с format, файл строится из full_table', () => {
  test('в full_table и table — исходные значения опасных ячеек (в full_table — обеих колонок link)', async() => {
    const loaded = await load({ headers: HEADERS_WITH_REF, format: 'full_table' });
    const shownBefore = JSON.stringify(loaded.table.tableData);
    const { file } = await save(loaded);

    const [params] = loaded.formatParams;
    expect(params.full_table.r1.link).toEqual(XSS_LINK);
    expect(params.full_table.r1.ref).toEqual(REF);
    expect(params.table.r1.link).toEqual(XSS_LINK);
    // колонка без save в table не попадает, как и до ERA-3562
    expect(params.table.r1.ref).toBeUndefined();
    // остальные ячейки — как до ERA-3562: нормализованные значения таблицы
    expect(params.full_table.r2.link).toEqual(OTHER_LINK);
    expect(params.full_table.r2.ref).toEqual([{ href: 'https://ya.ru/', text: 'https://ya.ru/' }]);
    expect(params.full_table.r1.upload).toEqual(XSS_UPLOAD.slice(1));
    expect(params.file).toEqual({ r1: { extra: 'keep' } });

    expect(file.r1.link).toEqual(XSS_LINK);
    expect(file.r1.ref).toEqual(REF);
    expect(file.r2.link).toEqual(OTHER_LINK);

    // данные таблицы после сохранения не изменились
    expect(JSON.stringify(loaded.table.tableData)).toBe(shownBefore);
  });
});

describe('TC-22: загрузка из кэша сессии', () => {
  test('таблица из кэша сохраняется с теми же исходными значениями, что в TC-20', async() => {
    // первая загрузка: правка ячейки попадает в кэш сессии
    const first = await load();
    first.table.tableData.r1.name = 'Из кэша';
    first.table.writeToStorage();
    expect(sessionStorage.getItem(STORAGE_KEY)).not.toBeNull();

    // обновление страницы: таблица берётся из кэша (getFromCache), источник читается заново
    const second = await load();
    expect(second.table.tableData.r1.name).toBe('Из кэша');

    const { file } = await save(second);
    expect(file.r1.link).toEqual(XSS_LINK);
    expect(file.r2.link).toEqual(OTHER_LINK);
    expect(file.r1.name).toBe('Из кэша');
  });
});

describe('TC-23: колонка upload с save', () => {
  test('в файле нет опасной ссылки, ftp: и https: сохранены', async() => {
    const { file, text } = await save(await load());

    expect(file.r1.upload).toEqual(XSS_UPLOAD.slice(1));
    expect(text).not.toContain('javascript:alert(4)');
  });
});

describe('TC-24: фильтр, поиск и сортировка колонки link', () => {
  const linkHeader = { headerID: 'link', type: 'link', filterable: true };
  const partially = (value: string) => ({ link: { value, filtrationMode: FILTRATION_MODES.correspondsPartially } });

  test.each([
    ['alert(5)', 'string'],
    ['FTP', 'object'],
    ['x.example', 'noText']
  ])('«Частичное соответствие» %j находит строку %s', (filter, expected) => {
    const items = [
      ['string', { link: ['javascript:alert(5)'] }],
      ['object', { link: [{ href: 'ftp://x', text: 'FTP' }] }],
      ['noText', { link: [{ href: 'https://x.example/' }] }]
    ];
    let found: [string, unknown][] = [];
    expect(() => { found = getFilteredTableData(items, partially(filter), [linkHeader]); }).not.toThrow();
    expect(found.map(([id]) => id)).toEqual([expected]);
  });

  test('на таблице из TC-20: фильтр FTP и глобальный поиск «Файл» находят «Other schemes», сортировка без исключений', async() => {
    const { table } = await load();
    const entries = Object.entries(table.tableData);

    expect(getFilteredTableData(entries, partially('FTP'), [linkHeader]).map(([id]) => id)).toEqual(['r2']);
    expect(getGlobalSearchFilteredData(entries, 'Файл', [linkHeader] as any).map(([id]) => id)).toEqual(['r2']);

    const sorter = getMultipleRowSorter([{ value: 'link', direction: 'inc', type: 'link' }]);
    expect(() => [...entries].sort(sorter as any)).not.toThrow();
    expect(() => [...entries].sort(getMultipleRowSorter([{ value: 'link', direction: 'dec', type: 'link' }]) as any)).not.toThrow();
  });
});
