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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber

  Contributors:
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
*/

import jsonata from 'jsonata';
import { buildUserMenu } from '@global/manifest/services/menu-builder.mjs';
import { buildMenuTree, isOnMenuTrail, menuFilterTerms, menuIconName, menuRows, splitMenuItems } from '@front/helpers/menuTree';

describe('menuTree', () => {
  describe('menuFilterTerms', () => {
    test('Запрос делится на слова, лишние пробелы отбрасываются', () => {
      expect(menuFilterTerms('редакт  табл ')).toEqual(['редакт', 'табл']);
    });

    test('Пустой запрос — нет слов', () => {
      expect(menuFilterTerms('')).toEqual([]);
      expect(menuFilterTerms(null)).toEqual([]);
      expect(menuFilterTerms(undefined)).toEqual([]);
    });
  });

  describe('menuIconName', () => {
    test('Значки MDI и значки с явным набором не меняются', () => {
      expect(menuIconName('mdi-file-document')).toBe('mdi-file-document');
      expect(menuIconName('md:description')).toBe('md:description');
    });

    test('Значкам Material Icons добавляется набор md:', () => {
      expect(menuIconName('description')).toBe('md:description');
      expect(menuIconName('location_searching')).toBe('md:location_searching');
    });
  });

  describe('isOnMenuTrail', () => {
    test('Предки выбранного пункта лежат на пути к текущей странице', () => {
      expect(isOnMenuTrail('docs', 'docs/plugins/table')).toBe(true);
      expect(isOnMenuTrail('docs/plugins', 'docs/plugins/table')).toBe(true);
    });

    test('Сам выбранный пункт, соседи и пункты с похожим началом — не на пути', () => {
      expect(isOnMenuTrail('docs/plugins/table', 'docs/plugins/table')).toBe(false);
      expect(isOnMenuTrail('docs/other', 'docs/plugins/table')).toBe(false);
      expect(isOnMenuTrail('doc', 'docs/plugins/table')).toBe(false);
    });

    test('Без выбранного пункта пути нет', () => {
      expect(isOnMenuTrail('docs', null)).toBe(false);
      expect(isOnMenuTrail('docs', undefined)).toBe(false);
    });
  });
});

describe('Дерево меню и служебные пункты', () => {
  const SERVICE = [
    { title: 'Поиск', route: '/search', location: 'Поиск', service: true },
    { title: 'Проблемы', route: '/problems', location: 'Проблемы', service: true },
    { title: 'JSONata', route: '/devtool', location: 'devtool', service: true }
  ];
  const expandAll = () => true;
  const collapseAll = () => false;

  test('splitMenuItems отделяет служебные пункты от пунктов метамодели, порядок сохраняется', () => {
    const docs = { title: 'Пример', route: '/docs', location: 'Документы/Пример' };
    const { tree, service } = splitMenuItems([docs, ...SERVICE]);

    expect(tree).toEqual([docs]);
    expect(service.map((item) => item.route)).toEqual(['/search', '/problems', '/devtool']);
    expect(splitMenuItems(null)).toEqual({ tree: [], service: [] });
  });

  test('Пункт метамодели с location служебного пункта остается в дереве вместе с вложенными', () => {
    const metamodel = [
      { title: 'Поиск', route: '/my-search', location: 'Поиск' },
      { title: 'Сохраненные', route: '/my-search/saved', location: 'Поиск/Сохраненные' },
      { title: 'Свой devtool', route: '/my-devtool', location: 'devtool' }
    ];
    const { tree } = buildMenuTree(splitMenuItems([...metamodel, ...SERVICE]).tree);
    const rows = menuRows(tree, expandAll);

    expect(rows).toEqual([
      { title: 'Поиск', route: '/my-search', icon: undefined, level: 0, location: 'Поиск', isGroup: true },
      { title: 'Сохраненные', route: '/my-search/saved', icon: undefined, level: 1, location: 'Поиск/Сохраненные' },
      { title: 'Свой devtool', route: '/my-devtool', icon: undefined, level: 0, location: 'devtool' }
    ]);
  });

  test('Служебные пункты в дерево не попадают', () => {
    const { tree } = buildMenuTree(splitMenuItems(SERVICE).tree);

    expect(menuRows(tree, expandAll)).toEqual([]);
  });

  test('Промежуточные разделы без своего пункта получают название по сегменту location', () => {
    const { tree } = buildMenuTree([{ title: 'Таблица', route: '/t', location: 'Документы/Плагины/Таблица' }]);

    expect(menuRows(tree, expandAll).map(({ title, level, isGroup }) => ({ title, level, isGroup }))).toEqual([
      { title: 'Документы', level: 0, isGroup: true },
      { title: 'Плагины', level: 1, isGroup: true },
      { title: 'Таблица', level: 2, isGroup: undefined }
    ]);
  });

  test('Свернутый раздел показывает только себя; раскрывается по location', () => {
    const { tree } = buildMenuTree([
      { title: 'A', route: '/a', location: 'Раздел/A' },
      { title: 'B', route: '/b', location: 'Раздел/Подраздел/B' }
    ]);

    expect(menuRows(tree, collapseAll).map((row) => row.location)).toEqual(['Раздел']);
    expect(menuRows(tree, (location) => location === 'Раздел').map((row) => row.location))
      .toEqual(['Раздел', 'Раздел/A', 'Раздел/Подраздел']);
    expect(menuRows(null, expandAll)).toEqual([]);
  });

  test('Путь к пункту текущей страницы возвращается для раскрытия', () => {
    const { expand } = buildMenuTree(
      [{ title: 'Таблица', route: '/t', location: 'Документы/Плагины/Таблица' }, { title: 'X', route: '/x', location: 'X' }],
      () => true,
      (route) => route === '/t'
    );

    expect(expand).toEqual(['Документы', 'Документы/Плагины', 'Документы/Плагины/Таблица']);
  });

  test('Фильтр поиска отбрасывает пункты; пункты без location пропускаются', () => {
    const { tree } = buildMenuTree(
      [{ title: 'A', route: '/a', location: 'Документы/A' }, { title: 'B', route: '/b', location: 'Схемы/B' }, { title: 'Без места', route: '/n' }],
      (location) => location.toLocaleLowerCase().includes('схем')
    );

    expect(menuRows(tree, expandAll).map((row) => row.location)).toEqual(['Схемы', 'Схемы/B']);
  });

  test('Меню из сборщика: пункт метамодели «Поиск» и его вложенные пункты доступны в дереве', async() => {
    const manifest = {
      entities: {
        docs: { menu: '[{"link": "my-search", "location": "Поиск"}, {"link": "my-search/saved", "location": "Поиск/Сохраненные"}]' }
      }
    };
    const dataset = await buildUserMenu(manifest, { expression: (query: string) => jsonata(query) });
    const { tree, service } = splitMenuItems(dataset);
    const rows = menuRows(buildMenuTree(tree).tree, expandAll);

    expect(rows.map(({ location, route, isGroup }) => ({ location, route, isGroup }))).toEqual([
      { location: 'Поиск', route: '/my-search', isGroup: true },
      { location: 'Поиск/Сохраненные', route: '/my-search/saved', isGroup: undefined }
    ]);
    expect(service.map((item) => item.route)).toEqual(['/search', '/problems', '/devtool']);
  });
});
