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
*/

import {
  applySectionFrame,
  columnsSpacing,
  gridSpacing,
  isWidgetSection,
  sectionStyles,
  spacingMargin
} from '../../../plugins/markaper/helpers/sectionStyle';

describe('applySectionFrame', () => {
  test('Без border стиль не меняется', () => {
    const style = { margin: '4px' };
    expect(applySectionFrame(style)).toBe(style);
    expect(applySectionFrame({ border: false })).toEqual({ border: false });
  });

  test('border: true — рамка, скругление, фон и обрезка по умолчанию, рамка и фон составляющими', () => {
    const result = applySectionFrame({ margin: '4px', border: true });

    expect(result).toEqual({
      margin: '4px',
      'border-width': '1px',
      'border-style': 'solid',
      'border-color': 'var(--dh-border)',
      'border-radius': 'var(--dh-radius-lg)',
      overflow: 'clip',
      'background-color': 'var(--dh-surface)'
    });
    expect(result).not.toHaveProperty('border');
    expect(result).not.toHaveProperty('background');
  });

  test('Заданный автором background-color сохраняется', () => {
    const result = applySectionFrame({ border: true, 'background-color': '#fff6db' });

    expect(result['background-color']).toBe('#fff6db');
    expect(result).not.toHaveProperty('background');
  });

  test('Заданные автором фон и составляющие рамки не перетираются, в том числе в camelCase', () => {
    expect(applySectionFrame({ border: true, background: '#eee' })).not.toHaveProperty('background-color');
    expect(applySectionFrame({ border: true, 'background-image': 'url(a.png)' })).not.toHaveProperty('background-color');
    expect(applySectionFrame({ border: true, backgroundColor: '#eee' })).not.toHaveProperty('background-color');

    const result = applySectionFrame({ border: true, 'border-color': 'red', borderRadius: '0' });
    expect(result['border-color']).toBe('red');
    expect(result).not.toHaveProperty('border-radius');
    expect(result.borderRadius).toBe('0');
  });

  test('border строкой — CSS-значение автора, добавляются только скругление и фон', () => {
    expect(applySectionFrame({ border: '2px dashed red' })).toEqual({
      border: '2px dashed red',
      'border-radius': 'var(--dh-radius-lg)',
      overflow: 'clip',
      'background-color': 'var(--dh-surface)'
    });
  });

  test('Заданная автором прокрутка сохраняется, обрезка не добавляется', () => {
    expect(applySectionFrame({ border: true, 'overflow-x': 'auto' })).not.toHaveProperty('overflow');
    expect(applySectionFrame({ border: true, overflowY: 'scroll' })).not.toHaveProperty('overflow');
  });
});

describe('sectionStyles', () => {
  test('padding относится к содержимому, остальное — к секции', () => {
    expect(sectionStyles({ margin: '4px', padding: '0px' })).toEqual({
      content: { padding: '0px' },
      section: { margin: '4px' }
    });
  });

  test('Без style — пустые стили', () => {
    expect(sectionStyles(undefined)).toEqual({ content: {}, section: {} });
    expect(sectionStyles(null)).toEqual({ content: {}, section: {} });
  });

  test('Ограниченные размеры включают прокрутку по соответствующей оси', () => {
    expect(sectionStyles({ 'max-height': '300px' }).section['overflow-y']).toBe('auto');
    expect(sectionStyles({ 'max-width': '300px' }).section['overflow-x']).toBe('auto');
    expect(sectionStyles({ 'max-height': '300px', 'max-width': '300px' }).section.overflow).toBe('auto');
  });

  test('Рамка применяется к стилю секции, а не содержимого', () => {
    const { content, section } = sectionStyles({ padding: '0px', border: true, 'background-color': '#fff6db' });

    expect(content).toEqual({ padding: '0px' });
    expect(section['border-style']).toBe('solid');
    expect(section.overflow).toBe('clip');
    expect(section['background-color']).toBe('#fff6db');
  });
});

describe('isWidgetSection', () => {
  test('Секция с заголовком, иконкой или рамкой — виджет', () => {
    expect(isWidgetSection({ title: 'Сводка' })).toBe(true);
    expect(isWidgetSection({ icon: 'mdi-cog' })).toBe(true);
    expect(isWidgetSection({ style: { border: true } })).toBe(true);
    expect(isWidgetSection({ title: 'Сводка', style: { margin: '4px' } })).toBe(true);
  });

  test('Секция без заголовка и рамки — контейнер', () => {
    expect(isWidgetSection({ style: { margin: '4px' } })).toBe(false);
    expect(isWidgetSection({})).toBe(false);
    expect(isWidgetSection(undefined)).toBe(false);
  });
});

describe('gridSpacing', () => {
  const widget = (margin?: string) => ({ style: { border: true, ...(margin ? { margin } : {}) } });
  const gap = (sum: number) => `max(0px, calc(var(--dh-widget-gap) - ${sum}px))`;
  // Добавки секций, начиная со второй
  const extras = (items: Parameters<typeof gridSpacing>[0], axis: Parameters<typeof gridSpacing>[1]) =>
    gridSpacing(items, axis).slice(1).map((spacing) => spacing?.extra ?? null);

  test('У первой секции добавки нет', () => {
    expect(gridSpacing([widget('4px'), widget('4px')], 'columns')[0]).toBeNull();
    expect(gridSpacing([], 'rows')).toEqual([]);
  });

  test('Без margin промежуток задает сетка', () => {
    expect(extras([widget(), widget()], 'columns')).toEqual(['var(--dh-widget-gap)']);
  });

  test('margin соседних секций входит в промежуток, сетка добавляет недостающее', () => {
    expect(gridSpacing([widget('4px'), widget('4px')], 'columns')[1]).toEqual({ side: 'left', margin: 4, extra: gap(8) });
    expect(gridSpacing([widget('12px'), widget('12px')], 'rows')[1]).toEqual({ side: 'top', margin: 12, extra: gap(24) });
  });

  test('Учитываются стороны, обращенные друг к другу', () => {
    expect(extras([widget('0 4px'), widget('10px 0')], 'columns')).toEqual([gap(4)]);
    expect(extras([widget('0 4px'), widget('10px 0')], 'rows')).toEqual([gap(10)]);
    expect(extras([{ style: { marginRight: '6px' } }, widget()], 'columns')).toEqual([gap(6)]);
  });

  test('Добавка считается для каждой пары соседей отдельно', () => {
    // Пары 4+4 и 4+8: промежутки 16 и 16px
    expect(extras([widget('4px'), widget('4px'), widget('8px')], 'columns')).toEqual([gap(8), gap(12)]);
    expect(extras([widget('4px'), widget('4px'), widget('8px')], 'rows')).toEqual([gap(8), gap(12)]);
  });

  test('margin вложенных секций, прилегающих к стороне, складывается с margin обертки', () => {
    const column = { type: 'rows', items: [widget('4px'), widget('4px')] };
    expect(extras([column, column], 'columns')).toEqual([gap(8)]);

    const row = { type: 'columns', style: { margin: '2px' }, items: [widget('4px'), widget()] };
    expect(extras([row, widget()], 'columns')).toEqual([gap(2)]);
    expect(extras([row, widget()], 'rows')).toEqual([gap(2)]);
  });

  test('margin секций внутри рамки не входит в промежуток', () => {
    const framed = { type: 'rows', style: { border: true }, items: [widget('8px')] };
    expect(extras([framed, widget()], 'columns')).toEqual(['var(--dh-widget-gap)']);
    expect(extras([widget(), framed], 'rows')).toEqual(['var(--dh-widget-gap)']);

    const framedWithMargin = { type: 'columns', style: { border: true, margin: '4px' }, items: [widget('8px')] };
    expect(extras([framedWithMargin, widget('4px')], 'columns')).toEqual([gap(8)]);
  });

  test('margin не в пикселях — промежуток пары задают только margin', () => {
    expect(extras([widget('1em'), widget()], 'columns')).toEqual([null]);
    expect(extras([widget('auto'), widget()], 'columns')).toEqual([null]);
    expect(extras([widget(), widget('5%'), widget('4px'), widget()], 'columns')).toEqual([null, null, gap(4)]);
  });

  test('Пустой margin не считается заданным', () => {
    expect(extras([{ style: { margin: '' } }, widget()], 'columns')).toEqual(['var(--dh-widget-gap)']);
  });
});

describe('columnsSpacing', () => {
  const widget = (margin?: string) => ({ style: { border: true, ...(margin ? { margin } : {}) } });
  const gap = (sum: number) => `max(0px, calc(var(--dh-widget-gap) - ${sum}px))`;
  const items = [widget('4px'), widget('4px'), widget('4px'), widget('4px')];

  test('Колонки в одной строке сетки — добавка слева от соседа', () => {
    const spacing = columnsSpacing(items.slice(0, 3), 3);
    expect(spacing.map((column) => column.left?.extra ?? null)).toEqual([null, gap(8), gap(8)]);
    expect(spacing.map((column) => column.top)).toEqual([null, null, null]);
  });

  test('Колонки сверх строки сетки — добавка сверху от колонки над ней, слева нет у первой в строке', () => {
    // Две колонки в строке сетки: третья и четвертая — во второй строке
    const spacing = columnsSpacing(items, 2);
    expect(spacing.map((column) => column.left?.extra ?? null)).toEqual([null, gap(8), null, gap(8)]);
    expect(spacing.map((column) => column.top?.extra ?? null)).toEqual([null, null, gap(8), gap(8)]);
    expect(spacing[2].top).toEqual({ side: 'top', margin: 4, extra: gap(8) });
  });

  test('Колонки друг под другом — добавка сверху от предыдущей', () => {
    expect(columnsSpacing(items.slice(0, 3), 2).map((column) => column.stacked?.extra ?? null)).toEqual([null, gap(8), gap(8)]);
  });
});

describe('spacingMargin', () => {
  test('margin секции со стороны предыдущей секции вместе с добавкой', () => {
    const spacing = { side: 'left' as const, margin: 4, extra: 'var(--dh-widget-gap)' };
    expect(spacingMargin(spacing)).toEqual({ 'margin-left': 'calc(4px + var(--dh-widget-gap))' });
    expect(spacingMargin(spacing, 'var(--x, 0px)')).toEqual({ 'margin-left': 'calc(4px + var(--x, 0px))' });
  });
});
