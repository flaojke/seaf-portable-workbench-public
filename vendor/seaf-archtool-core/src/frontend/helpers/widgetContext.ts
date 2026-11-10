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

// Контекст виджета сетки markaper (секция mkr-grid). Секция передает его вложенным документам
// через provide: документ узнает, что лежит в виджете, а таблица регистрируется в нем,
// чтобы секция вывела в своем заголовке число строк, поле поиска и кнопку выгрузки в Excel.
// Переключатель вкладок выводится в заголовке через место, которое секция отдает в контексте.

export const WIDGET_CONTEXT = 'dhWidget';

// Вкладка, в которой лежит документ (вкладки markaper). Открытые ранее вкладки остаются
// в разметке, поэтому таблица узнает из этого контекста, открыта ли ее вкладка сейчас.
export const WIDGET_TAB = 'dhWidgetTab';

export interface WidgetTab {
  active: boolean;
}

// Вкладка, вложенная в другую вкладку: открыта, если открыты она сама и внешняя вкладка
export const nestedTab = (isActive: () => boolean, parent: WidgetTab | null | undefined): WidgetTab => ({
  get active() {
    return isActive() && (parent ? parent.active : true);
  }
});

// Таблица, зарегистрированная в виджете
export interface WidgetTable {
  // Таблица на открытой вкладке или вне вкладок
  active: boolean;
  // Данные таблицы загружены
  ready: boolean;
  // Строк в таблице
  total: number;
  // У таблицы есть поле поиска
  hasSearch: boolean;
  // Поисковый запрос; секция выводит поле поиска в заголовке и меняет запрос таблицы
  search: string;
  // Таблицу можно выгрузить: она загружена, в ней есть строки, это не печатная версия
  canExport: boolean;
  // Данные таблицы перезагружаются: выгрузка недоступна до прихода новых строк
  reloading: boolean;
  exportToExcel: () => void;
}

export interface WidgetContext {
  // Секция — виджет: у нее есть заголовок или рамка
  isWidget: boolean;
  // У секции есть строка заголовка
  hasHeader: boolean;
  tables: WidgetTable[];
  // Вкладки, которые первыми заняли виджет; вложенные в них вкладки виджет не занимают
  tabsOwner: symbol | null;
  // Вкладки виджета — переключатель, он выводится в строке заголовка
  headerSwitcher: boolean;
  // Место для переключателя в строке заголовка
  switcherTarget: HTMLElement | null;
  // Переключатель не поместился рядом с названием и стоит второй строкой заголовка
  switcherWrapped: boolean;
}

// Состояние документа таблицы, по которому виджет узнает о таблице
export interface WidgetTableHost {
  // Вкладка, в которой лежит таблица
  widgetTab: WidgetTab | null;
  isReady: boolean;
  isReloading: boolean;
  isPrintVersion: boolean;
  items: readonly unknown[];
  // Таблице нужно поле поиска
  hasSearch: boolean;
  search: string | null;
  handleExportToExcel(): void;
}

// Таблица виджета, которая читает и меняет состояние документа таблицы
export const createWidgetTable = (host: WidgetTableHost): WidgetTable => ({
  get active() {
    return host.widgetTab ? host.widgetTab.active : true;
  },
  get ready() {
    return host.isReady;
  },
  get total() {
    return host.items.length;
  },
  get hasSearch() {
    return host.hasSearch && !host.isPrintVersion;
  },
  get search() {
    return host.search || '';
  },
  set search(value: string) {
    host.search = value || '';
  },
  get canExport() {
    return host.isReady && !host.isPrintVersion && host.items.length > 0;
  },
  get reloading() {
    return host.isReloading;
  },
  exportToExcel: () => host.handleExportToExcel()
});

// Регистрирует таблицу в виджете; возвращает функцию отмены регистрации
export const registerWidgetTable = (context: WidgetContext, table: WidgetTable): (() => void) => {
  context.tables.push(table);
  return () => {
    const index = context.tables.indexOf(table);
    if (index >= 0) context.tables.splice(index, 1);
  };
};

// Виджет, занятый вкладками: только через него вкладки меняют переключатель в заголовке
export interface WidgetTabsClaim {
  // Переключатель вкладок выводится в строке заголовка
  showInHeader(): void;
  // Переключатель стоит второй строкой заголовка
  setWrapped(wrapped: boolean): void;
  // Освобождает виджет и убирает переключатель из заголовка
  release(): void;
}

// Занимает виджет для вкладок. null — вкладки не в виджете или виджет уже занят вкладками,
// в которые вложены эти
export const claimWidgetTabs = (context: WidgetContext | null | undefined, owner: symbol): WidgetTabsClaim | null => {
  if (!context || context.tabsOwner) return null;
  context.tabsOwner = owner;
  const owns = (): boolean => context.tabsOwner === owner;
  return {
    showInHeader() {
      if (owns()) context.headerSwitcher = true;
    },
    setWrapped(wrapped) {
      if (owns()) context.switcherWrapped = wrapped;
    },
    release() {
      if (!owns()) return;
      context.tabsOwner = null;
      context.headerSwitcher = false;
      context.switcherWrapped = false;
    }
  };
};

// Таблица, число строк и действия которой выводятся в заголовке виджета: единственная видимая
// таблица виджета с заголовком. Учитываются таблицы открытых вкладок.
export const headerTable = (context: WidgetContext | null | undefined): WidgetTable | null => {
  if (!context?.isWidget || !context.hasHeader) return null;
  const visible = context.tables.filter((table) => table.active);
  return visible.length === 1 ? visible[0] : null;
};

