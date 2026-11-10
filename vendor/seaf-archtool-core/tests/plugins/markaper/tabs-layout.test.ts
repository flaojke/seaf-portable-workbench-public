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
  MIN_TITLE_WIDTH,
  besideTitleWidth,
  fitsBesideTitle,
  frameWidth,
  isSwitcherKind,
  layoutTabs,
  measureTabs,
  sameWidths,
  selectedTitleWidth
} from '../../../plugins/markaper/helpers/tabsLayout';

// Шесть вкладок контекста системы по 200px, кнопка «Ещё» — 90px
const widths = [200, 200, 200, 200, 200, 200];
const MORE = 90;

describe('layoutTabs', () => {
  test('Все вкладки помещаются — меню «Ещё» нет', () => {
    expect(layoutTabs(widths, 0, 1200, MORE)).toEqual({
      visible: [0, 1, 2, 3, 4, 5],
      hidden: [],
      cramped: false
    });
  });

  test('Не помещаются — в строке первые вкладки, сколько помещается вместе с «Ещё»', () => {
    expect(layoutTabs(widths, 0, 700, MORE)).toEqual({
      visible: [0, 1, 2],
      hidden: [3, 4, 5],
      cramped: false
    });
  });

  test('Выбранная вкладка из меню встает после первых, последняя из первых уходит в меню', () => {
    expect(layoutTabs(widths, 4, 700, MORE)).toEqual({
      visible: [0, 1, 4],
      hidden: [2, 3, 5],
      cramped: false
    });
  });

  test('Выбор вкладки из первых возвращает строку к исходной', () => {
    expect(layoutTabs(widths, 1, 700, MORE)).toEqual(layoutTabs(widths, 0, 700, MORE));
  });

  test('Рядом с выбранной места нет — в строке только она', () => {
    expect(layoutTabs(widths, 3, 350, MORE)).toEqual({
      visible: [3],
      hidden: [0, 1, 2, 4, 5],
      cramped: false
    });
  });

  test('Выбранная вкладка с «Ещё» шире строки — признак сокращения названия', () => {
    expect(layoutTabs(widths, 2, 250, MORE)).toEqual({
      visible: [2],
      hidden: [0, 1, 3, 4, 5],
      cramped: true
    });
  });

  test('Единственная вкладка шире строки — сокращается без места под «Ещё»', () => {
    expect(layoutTabs([300], 0, 250, MORE)).toEqual({ visible: [0], hidden: [], cramped: true });
    expect(layoutTabs([200], 0, 250, MORE)).toEqual({ visible: [0], hidden: [], cramped: false });
  });

  test('В строке только первые по порядку: за не поместившейся вкладкой следующие не берутся', () => {
    expect(layoutTabs([120, 300, 80, 260, 100], 3, 600, MORE)).toEqual({
      visible: [0, 3],
      hidden: [1, 2, 4],
      cramped: false
    });
  });

  test('Номер выбранной вкладки вне списка — выбранной считается первая', () => {
    expect(layoutTabs(widths, -1, 700, MORE).visible).toEqual([0, 1, 2]);
  });

  test('Без вкладок строка пуста', () => {
    expect(layoutTabs([], 0, 700, MORE)).toEqual({ visible: [], hidden: [], cramped: false });
  });
});

describe('selectedTitleWidth', () => {
  const PADDING = 24;

  test('Название выводится целиком, если вкладка помещается', () => {
    expect(selectedTitleWidth(layoutTabs(widths, 0, 2000, MORE), 2000, MORE, PADDING)).toBeNull();
  });

  test('С меню «Ещё» название сокращается до места строки без кнопки и отступов', () => {
    expect(selectedTitleWidth(layoutTabs(widths, 2, 250, MORE), 250, MORE, PADDING)).toBe(250 - MORE - PADDING);
  });

  test('У единственной вкладки кнопки «Ещё» нет — название занимает всю строку без отступов', () => {
    expect(selectedTitleWidth(layoutTabs([300], 0, 250, MORE), 250, MORE, PADDING)).toBe(250 - PADDING);
  });

  test('Название не уже наименьшей ширины', () => {
    expect(selectedTitleWidth(layoutTabs(widths, 2, 100, MORE), 100, MORE, PADDING)).toBe(MIN_TITLE_WIDTH);
  });
});

describe('fitsBesideTitle', () => {
  test('Все вкладки помещаются', () => {
    expect(fitsBesideTitle([100, 100], 0, 200, MORE)).toBe(true);
  });

  test('Помещается выбранная вкладка с «Ещё»', () => {
    expect(fitsBesideTitle(widths, 5, 290, MORE)).toBe(true);
  });

  test('Не помещается даже выбранная вкладка с «Ещё» — переключатель уходит на вторую строку', () => {
    expect(fitsBesideTitle(widths, 5, 289, MORE)).toBe(false);
  });
});

describe('isSwitcherKind', () => {
  test('kind: switcher — переключатель', () => {
    expect(isSwitcherKind('switcher')).toBe(true);
  });

  test('kind: tabs, без kind или с другим значением — вкладки первого уровня', () => {
    expect(isSwitcherKind('tabs')).toBe(false);
    expect(isSwitcherKind(undefined)).toBe(false);
    expect(isSwitcherKind('segmented')).toBe(false);
    expect(isSwitcherKind(1)).toBe(false);
  });
});

describe('frameWidth', () => {
  test('Сумма отступов и толщины рамки по горизонтали', () => {
    expect(frameWidth({
      marginLeft: '20px', marginRight: '20px', paddingLeft: '2px', paddingRight: '2px',
      borderLeftWidth: '1px', borderRightWidth: '1px'
    })).toBe(46);
  });

  test('Пустые и нечисловые значения не учитываются', () => {
    expect(frameWidth({ marginLeft: 'auto', paddingLeft: '', borderLeftWidth: '0.5px' })).toBe(0.5);
    expect(frameWidth({})).toBe(0);
  });
});

describe('sameWidths', () => {
  test('Одинаковые ширины по порядку', () => {
    expect(sameWidths([100, 80.5], [100, 80.5])).toBe(true);
    expect(sameWidths([100, 80], [100, 81])).toBe(false);
    expect(sameWidths([100], [100, 80])).toBe(false);
    expect(sameWidths([], [])).toBe(true);
  });
});

describe('besideTitleWidth', () => {
  test('Строка заголовка за вычетом остальных элементов и промежутков после них', () => {
    expect(besideTitleWidth({ width: 800, gap: 8, others: [160, 20, 244] })).toBe(800 - 168 - 28 - 252);
    expect(besideTitleWidth({ width: 800, gap: 8, others: [] })).toBe(800);
  });
});

describe('measureTabs', () => {
  const input = {
    visible: true,
    parentWidth: 600,
    gap: 2,
    frame: 6,
    rulerWidths: [100, 120, 80, 70],
    selected: 0,
    header: null
  };

  test('Скрытая строка и строка нулевой ширины не измеряются', () => {
    expect(measureTabs({ ...input, visible: false })).toBeNull();
    expect(measureTabs({ ...input, parentWidth: 0 })).toBeNull();
  });

  test('Ширины вкладок и «Ещё» — с промежутком, строка — за вычетом рамки плюс один промежуток', () => {
    expect(measureTabs(input)).toEqual({ widths: [102, 122, 82], moreWidth: 72, available: 596, wrapped: null });
  });

  test('Переключатель в заголовке: на второй строке, если рядом с названием не помещается выбранная с «Ещё»', () => {
    const header = (width: number) => ({ width, gap: 8, others: [200] });
    // Рядом с названием 800 - 208 - 6 + 2 = 588: все вкладки (306) помещаются
    expect(measureTabs({ ...input, header: header(800) })?.wrapped).toBe(false);
    // 360 - 208 - 6 + 2 = 148: выбранная (102) с «Ещё» (72) не помещается
    expect(measureTabs({ ...input, header: header(360) })?.wrapped).toBe(true);
  });

  test('Единственная вкладка в заголовке не требует места под «Ещё»', () => {
    // Рядом с названием 330 - 208 - 6 + 2 = 118: вкладка 102 помещается без кнопки «Ещё»
    expect(measureTabs({ ...input, rulerWidths: [100, 70], header: { width: 330, gap: 8, others: [200] } })?.wrapped).toBe(false);
  });
});
