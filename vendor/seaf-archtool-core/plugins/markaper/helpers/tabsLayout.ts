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

// Вид и раскладка вкладок mkr-tabs (Tabs.vue). Вид задает поле kind представления: switcher —
// переключатель, tabs или без поля — вкладки первого уровня. В строке — первые по порядку вкладки,
// сколько помещается вместе с кнопкой «Ещё», и выбранная вкладка; остальные — в меню «Ещё».

// Значение поля kind представления mkr-tabs для переключателя
export const TABS_KIND_SWITCHER = 'switcher';

// Вкладки выглядят переключателем
export const isSwitcherKind = (kind: unknown): boolean => kind === TABS_KIND_SWITCHER;

export interface TabsLayout {
  // Вкладки в строке, номера по порядку
  visible: number[];
  // Вкладки в меню «Ещё», номера по порядку
  hidden: number[];
  // Выбранная вкладка вместе с кнопкой «Ещё» шире строки
  cramped: boolean;
}

// widths — ширины вкладок, available — ширина строки, moreWidth — ширина кнопки «Ещё»
export const layoutTabs = (
  widths: readonly number[],
  selected: number,
  available: number,
  moreWidth: number
): TabsLayout => {
  const indexes = widths.map((_, index) => index);
  const total = widths.reduce((sum, width) => sum + width, 0);
  if (total <= available) return { visible: indexes, hidden: [], cramped: false };

  const current = selected >= 0 && selected < widths.length ? selected : 0;
  // Кнопка «Ещё» нужна, когда в меню есть вкладки: у единственной вкладки ее нет
  const more = widths.length > 1 ? moreWidth : 0;
  const shown = new Set([current]);
  let used = widths[current] + more;
  for (const index of indexes) {
    if (index === current) continue;
    if (used + widths[index] > available) break;
    used += widths[index];
    shown.add(index);
  }

  return {
    visible: indexes.filter((index) => shown.has(index)),
    hidden: indexes.filter((index) => !shown.has(index)),
    cramped: widths[current] + more > available
  };
};

// Наименьшая ширина сокращенного названия выбранной вкладки
export const MIN_TITLE_WIDTH = 48;

// Ширина названия выбранной вкладки, когда она шире строки: место строки без кнопки «Ещё», если
// она есть, и без отступов вкладки; null — название выводится целиком
export const selectedTitleWidth = (
  layout: TabsLayout,
  available: number,
  moreWidth: number,
  tabPadding: number
): number | null => {
  if (!layout.cramped) return null;
  const more = layout.hidden.length ? moreWidth : 0;
  return Math.max(MIN_TITLE_WIDTH, available - more - tabPadding);
};

// Переключатель помещается в строку заголовка рядом с названием: в ней помещаются все вкладки
// или выбранная вкладка вместе с кнопкой «Ещё»
export const fitsBesideTitle = (
  widths: readonly number[],
  selected: number,
  available: number,
  moreWidth: number
): boolean => !layoutTabs(widths, selected, available, moreWidth).cramped;

// Свойства стиля строки вкладок, которые занимают место по горизонтали вне вкладок
const FRAME_PROPERTIES = ['marginLeft', 'marginRight', 'paddingLeft', 'paddingRight', 'borderLeftWidth', 'borderRightWidth'] as const;

// Рамка строки вкладок по горизонтали: внешние и внутренние отступы и толщина рамки, px
export const frameWidth = (style: Partial<Record<typeof FRAME_PROPERTIES[number], string>>): number =>
  FRAME_PROPERTIES.reduce((sum, property) => sum + (parseFloat(style[property] ?? '') || 0), 0);

export const sameWidths = (a: readonly number[], b: readonly number[]): boolean =>
  a.length === b.length && a.every((width, index) => width === b[index]);

// Строка заголовка виджета, в которой стоит переключатель
export interface HeaderRow {
  // Ширина содержимого строки
  width: number;
  // Промежуток между элементами строки
  gap: number;
  // Ширины остальных показанных элементов строки: название, счетчик, панель таблицы
  others: readonly number[];
}

// Место для переключателя рядом с названием: строка заголовка за вычетом остальных ее элементов,
// где бы они ни стояли
export const besideTitleWidth = (header: HeaderRow): number =>
  header.others.reduce((rest, width) => rest - width - header.gap, header.width);

export interface TabsMeasureInput {
  // Строка вкладок показана
  visible: boolean;
  // Ширина содержимого родителя строки
  parentWidth: number;
  // Промежуток между вкладками
  gap: number;
  // Рамка строки по горизонтали (frameWidth)
  frame: number;
  // Ширины элементов линейки: вкладки по порядку и последней — кнопка «Ещё»
  rulerWidths: readonly number[];
  selected: number;
  // Строка заголовка, если переключатель стоит в ней
  header: HeaderRow | null;
}

export interface TabsMeasure {
  // Ширины вкладок вместе с промежутком
  widths: number[];
  // Ширина кнопки «Ещё» вместе с промежутком
  moreWidth: number;
  // Ширина строки для вкладок
  available: number;
  // Переключатель переходит на вторую строку заголовка; null — переключатель не в заголовке
  wrapped: boolean | null;
}

// Замер строки вкладок. У каждой вкладки и кнопки «Ещё» место — с промежутком после нее, поэтому
// к ширине строки прибавляется один промежуток. Строка на скрытой вкладке не измеряется (null):
// ширины в ней нулевые
export const measureTabs = (input: TabsMeasureInput): TabsMeasure | null => {
  if (!input.visible || !input.parentWidth) return null;
  const widths = input.rulerWidths.map((width) => width + input.gap);
  const moreWidth = widths.pop() || 0;
  const wrapped = input.header
    ? !fitsBesideTitle(widths, input.selected, besideTitleWidth(input.header) - input.frame + input.gap, moreWidth)
    : null;
  return { widths, moreWidth, available: input.parentWidth - input.frame + input.gap, wrapped };
};
