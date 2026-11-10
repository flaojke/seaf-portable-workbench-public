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

import {
  checkIsGlobalSearchActive,
  createSearchDebouncer,
  getCellSearchText,
  getGlobalSearchFilteredData,
  getSelectionWithinItems,
  getTableFilteredItems
} from '../../../plugins/editable-table/lib/globalSearch';
import { getLinkText, getOptionTextMap, getRowOptions } from '../../../plugins/editable-table/lib/cellText';
import { CellDataError, FILTRATION_MODES } from '../../../plugins/editable-table/lib/const';

type Row = Record<string, any>;

const header = (headerID: string, type: string, extra: Record<string, any> = {}) => ({
  headerID,
  type,
  display: true,
  filterable: true,
  ...extra
});

const STATUS_OPTIONS = [
  { value: 'opt_1', text: 'Активен' },
  { value: 'opt_2', text: 'Выведен' }
];

const HEADERS = [
  header('name', 'text'),
  header('status', 'select', { options: STATUS_OPTIONS }),
  header('tags', 'multiple-select', {
    options: [
      { value: 'tag_a', text: 'Платёжный контур' },
      { value: 'tag_b', text: 'Отчётность' }
    ]
  }),
  header('links', 'link'),
  header('docs', 'upload'),
  header('score', 'fn', { fn: '"x"' }),
  header('flag', 'checkbox'),
  header('secret', 'text', { display: false })
];

const ids = (items: [string, Row][]) => items.map(([id]) => id);
const search = (items: [string, Row][], query: string, exceptions: string[] = []) =>
  ids(getGlobalSearchFilteredData(items, query, HEADERS, exceptions));

describe('getGlobalSearchFilteredData', () => {
  test('Текстовая колонка ищется по подстроке без учёта регистра', () => {
    const items: [string, Row][] = [
      ['r1', { name: 'Сервис платежей' }],
      ['r2', { name: 'Каталог' }]
    ];
    expect(search(items, 'ПЛАТЕЖ')).toEqual(['r1']);
  });

  test('select ищется по тексту варианта, а не по ID: пользователь видит текст', () => {
    const items: [string, Row][] = [['r1', { name: 'X', status: 'opt_1' }]];
    expect(search(items, 'актив')).toEqual(['r1']);
    expect(search(items, 'opt_1')).toEqual([]);
  });

  test('multiple-select ищется по тексту каждого выбранного варианта', () => {
    const items: [string, Row][] = [
      ['r1', { tags: ['tag_a', 'tag_b'] }],
      ['r2', { tags: ['tag_b'] }]
    ];
    expect(search(items, 'контур')).toEqual(['r1']);
    expect(search(items, 'отчёт')).toEqual(['r1', 'r2']);
    expect(search(items, 'tag_a')).toEqual([]);
  });

  test('Значения вида toString/constructor не ломают поиск и не находят текст в прототипе', () => {
    const groupedHeaders = [
      header('kind', 'text'),
      header('status', 'select', { optionID: 'kind', options: { service: STATUS_OPTIONS } })
    ];
    const items: [string, Row][] = [
      ['r1', { kind: 'toString', status: 'opt_1' }],
      ['r2', { kind: 'service', status: 'constructor' }],
      ['r3', { kind: 'service', status: 'opt_1' }]
    ];
    expect(() => getGlobalSearchFilteredData(items, 'native', groupedHeaders)).not.toThrow();
    expect(ids(getGlobalSearchFilteredData(items, 'native', groupedHeaders))).toEqual([]);
    expect(ids(getGlobalSearchFilteredData(items, 'актив', groupedHeaders))).toEqual(['r3']);
  });

  describe('варианты по условию (option_id): текст из группы строки, как в Select.vue', () => {
    const groupedHeaders = [
      header('kind', 'text'),
      header('status', 'select', {
        optionID: 'kind',
        options: {
          service: [{ value: 's1', text: 'Активен' }, { value: 's2', text: 'Выведен' }],
          component: [{ value: 's1', text: 'В работе' }, { value: 's3', text: 'Архив' }]
        }
      })
    ];
    const grouped = (items: [string, Row][], query: string) =>
      ids(getGlobalSearchFilteredData(items, query, groupedHeaders));

    test('Одно значение с разным текстом в группах ищется по тексту группы своей строки', () => {
      const items: [string, Row][] = [
        ['svc', { kind: 'service', status: 's1' }],
        ['cmp', { kind: 'component', status: 's1' }]
      ];
      expect(grouped(items, 'актив')).toEqual(['svc']);
      expect(grouped(items, 'в работе')).toEqual(['cmp']);
    });

    test('Значение вне группы строки не находится: ячейка его не показывает', () => {
      const items: [string, Row][] = [['cmp', { kind: 'componentx', status: 's2' }], ['cmp2', { kind: 'component', status: 's2' }]];
      expect(grouped(items, 'выведен')).toEqual([]);
    });

    test('Строка без группы по select не находится', () => {
      const items: [string, Row][] = [['r1', { kind: null, status: 's1' }]];
      expect(grouped(items, 'актив')).toEqual([]);
    });
  });

  test('Ссылки и вложения ищутся по тексту, без текста — по адресу', () => {
    const items: [string, Row][] = [
      ['r1', { links: [{ text: 'Wiki', href: 'https://x' }] }],
      ['r2', { links: [{ href: 'https://confluence.example/page' }] }],
      ['r3', { docs: [{ text: 'Регламент.pdf', href: 'https://files.example/1' }] }],
      ['r4', { docs: ['https://files.example/archive.zip'] }]
    ];
    expect(search(items, 'wiki')).toEqual(['r1']);
    expect(search(items, 'confluence')).toEqual(['r2']);
    expect(search(items, 'регламент')).toEqual(['r3']);
    expect(search(items, 'archive')).toEqual(['r4']);
  });

  test('«ё» и «е» не различаются: запрос «отчет» находит «Отчётность»', () => {
    const items: [string, Row][] = [['r1', { tags: ['tag_b'] }], ['r2', { name: 'Ёлка' }]];
    expect(search(items, 'отчет')).toEqual(['r1']);
    expect(search(items, 'ЕЛКА')).toEqual(['r2']);
    expect(search(items, 'ёлка')).toEqual(['r2']);
  });

  test('Пустые значения не совпадают и не роняют поиск', () => {
    const items: [string, Row][] = [
      ['r1', { name: null, status: null, tags: [], links: [], docs: null, score: undefined }],
      ['r2', {}]
    ];
    expect(() => search(items, 'a')).not.toThrow();
    expect(search(items, 'null')).toEqual([]);
    expect(search(items, 'undefined')).toEqual([]);
  });

  test('Ячейка с ошибкой данных в поиске не участвует: она показывает «Ошибка», а не исходное значение', () => {
    const items: [string, Row][] = [
      ['r1', { name: new CellDataError(['item', 'item'], 'err'), status: new CellDataError({ data: 'value' }, 'err') }],
      ['r2', { name: 'Сервис', tags: new CellDataError('item', 'err') }]
    ];
    expect(search(items, 'item')).toEqual([]);
    expect(search(items, 'value')).toEqual([]);
    expect(search(items, 'ошибка')).toEqual([]);
    expect(search(items, 'сервис')).toEqual(['r2']);
  });

  test('Скрытые колонки и чекбоксы в поиске не участвуют: их текста не видно', () => {
    const items: [string, Row][] = [
      ['r1', { name: 'A', secret: 'иголка' }],
      ['r2', { name: 'B', flag: true }]
    ];
    expect(search(items, 'иголка')).toEqual([]);
    expect(search(items, 'true')).toEqual([]);
    expect(getCellSearchText({ flag: true }, header('flag', 'checkbox'))).toBeNull();
  });

  test('fn ищется только по уже вычисленному значению: для поиска fn не вычисляется', () => {
    const items: [string, Row][] = [
      ['r1', { name: 'A', score: 'Высокая' }],
      ['r2', { name: 'B' }]
    ];
    expect(search(items, 'высок')).toEqual(['r1']);
  });

  test('Новые несохранённые строки поиском не скрываются', () => {
    const items: [string, Row][] = [
      ['r1', { name: 'Сервис' }],
      ['new', { name: '' }]
    ];
    expect(search(items, 'нет такого', ['new'])).toEqual(['new']);
  });

  test('Пустой запрос и запрос из пробелов поиск не включают', () => {
    const items: [string, Row][] = [['r1', { name: 'A' }], ['r2', { name: 'B' }]];
    const result = getGlobalSearchFilteredData(items, '', HEADERS);
    expect(result).toBe(items);
    expect(search(items, '   ')).toEqual(['r1', 'r2']);
  });
});

describe('getTableFilteredItems', () => {
  const items: [string, Row][] = [
    ['r1', { name: 'Платёжный шлюз', status: 'opt_1' }],
    ['r2', { name: 'Платёжный отчёт', status: 'opt_2' }],
    ['r3', { name: 'Биллинг', status: 'opt_1' }]
  ];
  const statusFilter = { status: { value: 'opt_1', filtrationMode: FILTRATION_MODES.correspondsFully } };
  // Флаги активности считает Table.vue: фильтр колонки задан, поиск включён флагом профиля и запрос не пуст
  const filtered = ({ filters = {}, globalSearch = '', enabled = false, createdRows = [] }: Record<string, any>) =>
    ids(getTableFilteredItems({
      items,
      headers: HEADERS,
      filters,
      createdRows,
      globalSearch,
      isColumnFilterActive: Object.keys(filters).length > 0,
      isGlobalSearchActive: checkIsGlobalSearchActive(enabled, globalSearch)
    }));

  test('Без фильтров и запроса возвращаются все строки', () => {
    expect(filtered({})).toEqual(['r1', 'r2', 'r3']);
  });

  test('Запрос применяется только при включённом global_search: запрос из кэша не влияет на таблицу без флага', () => {
    expect(filtered({ globalSearch: 'платёж', enabled: true })).toEqual(['r1', 'r2']);
    expect(filtered({ globalSearch: 'платёж', enabled: false })).toEqual(['r1', 'r2', 'r3']);
  });

  test('Фильтры колонок и запрос сочетаются по «И»', () => {
    expect(filtered({ filters: statusFilter, globalSearch: 'платёж', enabled: true })).toEqual(['r1']);
  });

  test('При пустом запросе работают только фильтры колонок', () => {
    expect(filtered({ filters: statusFilter, globalSearch: '   ', enabled: true })).toEqual(['r1', 'r3']);
  });

  test('Новые строки видны и при фильтрах, и при запросе', () => {
    expect(filtered({ filters: statusFilter, globalSearch: 'платёж', enabled: true, createdRows: ['r2'] }))
      .toEqual(['r1', 'r2']);
  });
});

describe('getSelectionWithinItems', () => {
  const visible: [string, Row][] = [['r1', {}], ['r3', {}]];

  test('Выделенные строки, скрытые поиском, снимаются с выделения', () => {
    expect(getSelectionWithinItems(['r1', 'r2', 'r3'], visible)).toEqual(['r1', 'r3']);
  });

  test('Если сокращать нечего, возвращается null — выделение не трогаем', () => {
    expect(getSelectionWithinItems(['r1'], visible)).toBeNull();
    expect(getSelectionWithinItems([], visible)).toBeNull();
  });

  test('Новая строка, скрытая запросом после смены запроса, снимается с выделения', () => {
    // После смены запроса Table.vue сбрасывает createdRows, и новая строка проверяется поиском как обычная
    const items: [string, Row][] = [['r1', { name: 'Wiki' }], ['new', { name: '' }]];
    const visible = getTableFilteredItems({
      items,
      headers: HEADERS,
      filters: {},
      createdRows: [],
      globalSearch: 'wiki',
      isColumnFilterActive: false,
      isGlobalSearchActive: true
    });
    expect(getSelectionWithinItems(['r1', 'new'], visible)).toEqual(['r1']);
  });

  test('Если ни одна выделенная строка не видна, выделение очищается', () => {
    expect(getSelectionWithinItems(['r2'], visible)).toEqual([]);
  });
});

describe('общие функции отображаемого текста (Select.vue, Link.vue, поиск)', () => {
  const grouped = {
    service: [{ value: 's1', text: 'Активен' }],
    component: [{ value: 's1', text: 'В работе' }]
  };

  test('getRowOptions: общий список или группа строки по option_id', () => {
    expect(getRowOptions(STATUS_OPTIONS, null, {})).toBe(STATUS_OPTIONS);
    expect(getRowOptions(grouped, 'kind', { kind: 'component' })).toBe(grouped.component);
    expect(getRowOptions(grouped, 'kind', { kind: 'unknown' })).toEqual([]);
    expect(getRowOptions(undefined, 'kind', {})).toEqual([]);
    expect(getRowOptions(grouped, 'kind', { kind: 'toString' })).toEqual([]);
    expect(getRowOptions(grouped, 'kind', { kind: 'constructor' })).toEqual([]);
  });

  test('getOptionTextMap: значение варианта → текст', () => {
    expect(getOptionTextMap(STATUS_OPTIONS)).toEqual({ opt_1: 'Активен', opt_2: 'Выведен' });
    expect(getOptionTextMap([])).toEqual({});
    expect(getOptionTextMap(STATUS_OPTIONS).constructor).toBeUndefined();
  });

  test('getLinkText: текст ссылки, без текста — адрес, строка как есть', () => {
    expect(getLinkText({ text: 'Wiki', href: 'https://x' })).toBe('Wiki');
    expect(getLinkText({ href: 'https://x' })).toBe('https://x');
    expect(getLinkText('Просто текст')).toBe('Просто текст');
    expect(getLinkText(null)).toBe('');
  });
});

describe('createSearchDebouncer', () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  test('После паузы применяется только последний запрос', () => {
    const apply = jest.fn();
    const debouncer = createSearchDebouncer(apply, 300);
    debouncer.input('а');
    debouncer.input('ак');
    jest.advanceTimersByTime(299);
    expect(apply).not.toHaveBeenCalled();
    debouncer.input('актив');
    jest.advanceTimersByTime(300);
    expect(apply).toHaveBeenCalledTimes(1);
    expect(apply).toHaveBeenCalledWith('актив');
  });

  test('cancel отменяет ожидающий запрос: сброс фильтров и размонтирование', () => {
    const apply = jest.fn();
    const debouncer = createSearchDebouncer(apply, 300);
    debouncer.input('wiki');
    debouncer.cancel();
    jest.advanceTimersByTime(1000);
    expect(apply).not.toHaveBeenCalled();
  });
});
