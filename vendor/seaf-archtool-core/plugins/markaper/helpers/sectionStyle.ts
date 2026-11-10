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

// Стили секции mkr-grid (Section.vue): style секции из метамодели делится на стили самой
// секции и ее содержимого, дополняется оформлением рамки (Т6.3) и прокруткой.

export type StyleValue = string | number | boolean | null | undefined;
export type SectionStyle = Record<string, StyleValue>;

export interface SectionStyles {
  content: SectionStyle;
  section: SectionStyle;
}

// Свойства, которые относятся к содержимому секции, а не к ней самой
export const CONTENT_STYLE_PROPERTIES: readonly string[] = ['padding'];

const camelCase = (name: string): string => name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());

// Автор задает стиль секции в kebab-case или camelCase; пустые значения не считаются заданными
const hasStyle = (style: SectionStyle, ...names: string[]): boolean =>
  names.some((name) => [name, camelCase(name)].some((key) =>
    style[key] !== undefined && style[key] !== null && style[key] !== ''
  ));

// Оформление секции с border (Т6.3): рамка, скругление, фон и обрезка содержимого по умолчанию. Значения по умолчанию
// задаются только для свойств, которые автор не указал, и не сокращенными свойствами: сокращенные
// border/background сбросили бы заданные автором border-color, background-color и т.п.
export const applySectionFrame = (style: SectionStyle): SectionStyle => {
  if (!style.border) return style;

  const result: SectionStyle = { ...style };

  if (result.border === true) {
    delete result.border;
    if (!hasStyle(style, 'border-width')) result['border-width'] = '1px';
    if (!hasStyle(style, 'border-style')) result['border-style'] = 'solid';
    if (!hasStyle(style, 'border-color')) result['border-color'] = 'var(--dh-border)';
  }

  if (!hasStyle(style, 'border-radius')) result['border-radius'] = 'var(--dh-radius-lg)';

  // Содержимое обрезается по скругленной рамке: таблица от края до края не закрывает углы рамки
  if (!hasStyle(style, 'overflow', 'overflow-x', 'overflow-y')) result.overflow = 'clip';

  if (!hasStyle(style, 'background', 'background-color', 'background-image')) {
    result['background-color'] = 'var(--dh-surface)';
  }

  return result;
};

// Прокрутка секции с ограниченными размерами
const applySectionOverflow = (style: SectionStyle): SectionStyle => {
  const result: SectionStyle = { ...style };

  if (result['max-height'] && result['max-width']) result.overflow = 'auto';
  else if (result['max-height']) result['overflow-y'] = 'auto';
  else if (result['max-width']) result['overflow-x'] = 'auto';

  return result;
};

export interface WidgetSection {
  title?: string | null;
  icon?: string | null;
  style?: SectionStyle | null;
}

// Секция с заголовком или рамкой — виджет: заголовок, отступы и панель таблицы у нее одинаковы
// с рамкой и без, border в стиле только рисует рамку
export const isWidgetSection = (section?: WidgetSection | null): boolean =>
  !!(section?.title || section?.icon || section?.style?.border);

export interface GridItem {
  type?: string | null;
  style?: SectionStyle | null;
  items?: readonly GridItem[];
}

type Side = 'top' | 'right' | 'bottom' | 'left';

// Порядок сторон в сокращенном margin из 1–4 значений
const SHORTHAND_SIDES: Record<Side, readonly number[]> = {
  top: [0, 0, 0, 0],
  right: [0, 1, 1, 1],
  bottom: [0, 0, 2, 2],
  left: [0, 1, 1, 3]
};

const styleValue = (style: SectionStyle, name: string): StyleValue =>
  [name, camelCase(name)].map((key) => style[key]).find((value) => value !== undefined && value !== null && value !== '');

// Длина в пикселях: 0 или Npx; другие единицы не пересчитываются
const pixels = (value: StyleValue): number | null => {
  if (value === 0 || value === '0') return 0;
  const match = /^(-?\d+(?:\.\d+)?)px$/.exec(String(value).trim());
  return match ? Number(match[1]) : null;
};

// margin секции с одной стороны в пикселях; null — значение не в пикселях
const ownMargin = (style: SectionStyle, side: Side): number | null => {
  const longhand = styleValue(style, `margin-${side}`);
  if (longhand !== undefined) return pixels(longhand);

  const shorthand = styleValue(style, 'margin');
  if (shorthand === undefined) return 0;

  const parts = String(shorthand).trim().split(/\s+/);
  return parts.length > 4 ? null : pixels(parts[SHORTHAND_SIDES[side][parts.length - 1]]);
};

// Расстояние от края секции до рамки ее содержимого с одной стороны: margin самой секции
// и вложенных секций, которые прилегают к этой стороне. У секции с рамкой край — сама рамка,
// margin вложенных секций лежит внутри нее. null — margin не в пикселях
const edgeMargin = (item: GridItem, side: Side): number | null => {
  const own = ownMargin(item.style ?? {}, side);
  const items = item.items ?? [];
  const type = (item.type || '').toLowerCase();
  const along: readonly Side[] | null = type === 'columns' ? ['left', 'right'] : type === 'rows' ? ['top', 'bottom'] : null;
  if (own === null || !items.length || !along || item.style?.border) return own;

  // Вдоль раскладки к стороне прилегает крайняя секция, поперек — все
  const adjacent = along.includes(side) ? [side === along[0] ? items[0] : items[items.length - 1]] : items;
  const inner = adjacent.map((child) => edgeMargin(child, side));
  return inner.some((value) => value === null) ? null : own + Math.min(...(inner as number[]));
};

export type GridAxis = 'columns' | 'rows';

// Добавка сетки к margin секции со стороны предыдущей секции
export interface GridSpacing {
  // Сторона секции, обращенная к предыдущей
  side: Side;
  // margin самой секции с этой стороны, px
  margin: number;
  // Недостающая до --dh-widget-gap часть промежутка, CSS-длина
  extra: string;
}

// Промежуток между соседними секциями сетки — не меньше --dh-widget-gap. margin пары
// соседних секций входит в промежуток, сетка добавляет недостающее. previous стоит слева
// от item (columns) или над ним (rows). Для пары, где margin задан не в пикселях, добавки нет (null)
export const pairSpacing = (previous: GridItem, item: GridItem, axis: GridAxis): GridSpacing | null => {
  const [before, after]: Side[] = axis === 'columns' ? ['right', 'left'] : ['bottom', 'top'];
  const previousEdge = edgeMargin(previous, before);
  const next = edgeMargin(item, after);
  const margin = ownMargin(item.style ?? {}, after);
  if (previousEdge === null || next === null || margin === null) return null;

  const sum = previousEdge + next;
  const extra = sum ? `max(0px, calc(var(--dh-widget-gap) - ${sum}px))` : 'var(--dh-widget-gap)';
  return { side: after, margin, extra };
};

// Добавки для секций, которые идут одна за другой по оси; у первой секции добавки нет
export const gridSpacing = (items: readonly GridItem[], axis: GridAxis): (GridSpacing | null)[] =>
  items.map((item, index) => (index ? pairSpacing(items[index - 1], item, axis) : null));

// Добавки колонки сетки columns
export interface ColumnSpacing {
  // Слева — от соседней колонки в той же строке сетки
  left: GridSpacing | null;
  // Сверху — от колонки над ней, когда колонки не помещаются в одну строку сетки
  top: GridSpacing | null;
  // Сверху — от предыдущей колонки, когда колонки стоят друг под другом
  stacked: GridSpacing | null;
}

// Добавки колонок сетки, в строке которой tracks колонок: колонки сверх tracks переходят
// на следующие строки сетки
export const columnsSpacing = (items: readonly GridItem[], tracks: number): ColumnSpacing[] =>
  items.map((item, index) => ({
    left: index % tracks ? pairSpacing(items[index - 1], item, 'columns') : null,
    top: index >= tracks ? pairSpacing(items[index - tracks], item, 'rows') : null,
    stacked: index ? pairSpacing(items[index - 1], item, 'rows') : null
  }));

// margin секции сетки вместе с добавкой; extra — CSS-длина добавки
export const spacingMargin = (spacing: GridSpacing, extra: string = spacing.extra): SectionStyle => ({
  [`margin-${spacing.side}`]: `calc(${spacing.margin}px + ${extra})`
});

export const sectionStyles = (style?: SectionStyle | null): SectionStyles => {
  const content: SectionStyle = {};
  const section: SectionStyle = {};

  Object.entries(style ?? {}).forEach(([name, value]) => {
    if (CONTENT_STYLE_PROPERTIES.includes(name)) content[name] = value;
    else section[name] = value;
  });

  return {
    content,
    section: applySectionOverflow(applySectionFrame(section))
  };
};
