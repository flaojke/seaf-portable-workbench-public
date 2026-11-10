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

import {
  WidgetContext,
  WidgetTable,
  WidgetTableHost,
  claimWidgetTabs,
  createWidgetTable,
  headerTable,
  nestedTab,
  registerWidgetTable
} from '@front/helpers/widgetContext';

const table = (overrides: Partial<WidgetTable> = {}): WidgetTable => ({
  active: true,
  ready: true,
  total: 12,
  hasSearch: false,
  search: '',
  canExport: true,
  reloading: false,
  exportToExcel: () => undefined,
  ...overrides
});

const context = (overrides: Partial<WidgetContext> = {}): WidgetContext => ({
  isWidget: true,
  hasHeader: true,
  tables: [],
  tabsOwner: null,
  headerSwitcher: false,
  switcherTarget: null,
  switcherWrapped: false,
  ...overrides
});

describe('widgetContext', () => {
  describe('registerWidgetTable', () => {
    test('Таблица добавляется в виджет и удаляется функцией отмены регистрации', () => {
      const widget = context();
      const first = table();
      const second = table();

      const unregisterFirst = registerWidgetTable(widget, first);
      registerWidgetTable(widget, second);
      expect(widget.tables).toEqual([first, second]);

      unregisterFirst();
      expect(widget.tables).toEqual([second]);

      unregisterFirst();
      expect(widget.tables).toEqual([second]);
    });
  });

  describe('headerTable', () => {
    test('Единственная таблица виджета с заголовком выводится в заголовке', () => {
      const only = table();
      expect(headerTable(context({ tables: [only] }))).toBe(only);
    });

    test('Таблицы закрытых вкладок не учитываются: в заголовке таблица открытой вкладки', () => {
      const open = table();
      expect(headerTable(context({ tables: [table({ active: false }), open, table({ active: false })] }))).toBe(open);
      expect(headerTable(context({ tables: [table({ active: false })] }))).toBeNull();
    });

    test('Несколько таблиц, секция-контейнер или виджет без заголовка — заголовок без таблицы', () => {
      expect(headerTable(context({ tables: [table(), table()] }))).toBeNull();
      expect(headerTable(context({ isWidget: false, tables: [table()] }))).toBeNull();
      expect(headerTable(context({ hasHeader: false, tables: [table()] }))).toBeNull();
      expect(headerTable(context())).toBeNull();
      expect(headerTable(null)).toBeNull();
    });
  });

  describe('claimWidgetTabs', () => {
    test('Виджет занимают первые вкладки; вложенные в них вкладки его не получают', () => {
      const widget = context();
      const outer = Symbol('outer');
      const release = claimWidgetTabs(widget, outer);
      expect(release).not.toBeNull();
      expect(widget.tabsOwner).toBe(outer);
      expect(claimWidgetTabs(widget, Symbol('inner'))).toBeNull();
      expect(widget.tabsOwner).toBe(outer);
    });

    test('Вкладки, занявшие виджет, выводят переключатель в заголовке и отмечают вторую строку', () => {
      const widget = context();
      const claim = claimWidgetTabs(widget, Symbol('tabs'));
      claim?.showInHeader();
      claim?.setWrapped(true);
      expect(widget).toMatchObject({ headerSwitcher: true, switcherWrapped: true });
      claim?.setWrapped(false);
      expect(widget.switcherWrapped).toBe(false);
    });

    test('Отмена освобождает виджет и убирает переключатель из заголовка', () => {
      const widget = context();
      const claim = claimWidgetTabs(widget, Symbol('tabs'));
      claim?.showInHeader();
      claim?.setWrapped(true);
      claim?.release();
      expect(widget).toMatchObject({ tabsOwner: null, headerSwitcher: false, switcherWrapped: false });
      expect(claimWidgetTabs(widget, Symbol('next'))).not.toBeNull();
    });

    test('После отмены прежние вкладки не меняют заголовок нового владельца', () => {
      const widget = context();
      const old = claimWidgetTabs(widget, Symbol('old'));
      old?.release();
      const next = claimWidgetTabs(widget, Symbol('next'));
      next?.showInHeader();
      old?.setWrapped(true);
      old?.release();
      expect(widget).toMatchObject({ headerSwitcher: true, switcherWrapped: false });
      expect(widget.tabsOwner).not.toBeNull();
    });

    test('Вне виджета занимать нечего', () => {
      expect(claimWidgetTabs(null, Symbol('tabs'))).toBeNull();
    });
  });
});

describe('nestedTab', () => {
  test('Вкладка без внешней открыта, если открыта она сама', () => {
    let active = false;
    const tab = nestedTab(() => active, null);
    expect(tab.active).toBe(false);
    active = true;
    expect(tab.active).toBe(true);
  });

  test('Вложенная вкладка открыта, только если открыта и внешняя', () => {
    const parent = { active: false };
    const tab = nestedTab(() => true, parent);
    expect(tab.active).toBe(false);
    parent.active = true;
    expect(tab.active).toBe(true);
  });
});

describe('createWidgetTable', () => {
  const host = (overrides: Partial<WidgetTableHost> = {}): WidgetTableHost => ({
    widgetTab: null,
    isReady: true,
    isReloading: false,
    isPrintVersion: false,
    items: [1, 2, 3],
    hasSearch: true,
    search: null,
    handleExportToExcel: jest.fn(),
    ...overrides
  });

  test('Читает состояние документа таблицы', () => {
    const source = host();
    const widgetTable = createWidgetTable(source);
    expect(widgetTable).toMatchObject({ active: true, ready: true, total: 3, hasSearch: true, search: '', canExport: true });

    source.items = [];
    expect(widgetTable.total).toBe(0);
    expect(widgetTable.canExport).toBe(false);
  });

  test('Перезагрузка данных передается виджету', () => {
    const source = host();
    const widgetTable = createWidgetTable(source);
    expect(widgetTable.reloading).toBe(false);
    source.isReloading = true;
    expect(widgetTable.reloading).toBe(true);
  });

  test('Таблица на закрытой вкладке не активна', () => {
    expect(createWidgetTable(host({ widgetTab: { active: false } })).active).toBe(false);
  });

  test('В печатной версии нет поиска и выгрузки', () => {
    const widgetTable = createWidgetTable(host({ isPrintVersion: true }));
    expect(widgetTable.hasSearch).toBe(false);
    expect(widgetTable.canExport).toBe(false);
  });

  test('Поисковый запрос и выгрузка передаются документу таблицы', () => {
    const source = host();
    const widgetTable = createWidgetTable(source);
    widgetTable.search = 'HTTPS';
    expect(source.search).toBe('HTTPS');
    widgetTable.search = null as unknown as string;
    expect(source.search).toBe('');

    widgetTable.exportToExcel();
    expect(source.handleExportToExcel).toHaveBeenCalledTimes(1);
  });
});
