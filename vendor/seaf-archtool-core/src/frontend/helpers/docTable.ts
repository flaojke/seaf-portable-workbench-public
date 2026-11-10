// Логика документа type: table (DocTable.vue): поля строки, чип статуса, пагинация.

import { SOURCE_PENDING } from './docSource';

export type StatusTone = 'ok' | 'wip' | 'off' | 'bad' | 'neutral';

// Колонка из профиля документа (headers)
export interface DocTableColumn {
  key?: string;
  value?: string;
  text?: string;
  title?: string;
  link?: string;
  align?: string;
  // format: status — значение выводится чипом статуса (Т5.6)
  format?: string;
  // Значение статуса -> оттенок чипа: { "Используется": "ok", ... }
  statuses?: Record<string, string>;
  // Ширина столбца: Vuetify применяет эти поля заголовка как есть
  width?: number | string;
  minWidth?: number | string;
  maxWidth?: number | string;
}

export interface DocTableRowField {
  value: string;
  link?: string;
  status?: StatusTone;
  align: string;
}

export type DocTableRow = Record<string, unknown>;

export const STATUS_TONES: readonly StatusTone[] = ['ok', 'wip', 'off', 'bad'];

export const DEFAULT_ITEMS_PER_PAGE = 10;
export const ITEMS_PER_PAGE_PRESETS: readonly number[] = [10, 20, 50];

const isStatusTone = (tone: unknown): tone is StatusTone =>
  STATUS_TONES.includes(tone as StatusTone);

// Оттенок чипа статуса по карте column.statuses; значение без сопоставления — нейтральный чип
export const statusTone = (column: DocTableColumn, value: string): StatusTone => {
  const tone = column.statuses?.[value];
  return isStatusTone(tone) ? tone : 'neutral';
};

export const columnKey = (column: DocTableColumn): string | undefined => column.key ?? column.value;

export const rowFields = (columns: readonly DocTableColumn[], row: DocTableRow): DocTableRowField[] =>
  columns.map((column) => {
    // Пустые значения (в том числе 0 и false) выводятся пустой строкой, первая
    // экранированная последовательность \n — переносом строки
    const value = (row[columnKey(column)] ?? '').toString().replace('\\n', '\n');

    return {
      value,
      link: column.link ? row[column.link] as string : undefined,
      status: column.format === 'status' ? statusTone(column, value) : undefined,
      align: column.align || 'left'
    };
  });

// Столбец, все строки значений которого не длиннее этого числа символов, не переносится
export const SHORT_VALUE_LENGTH = 20;
// Минимальная ширина текстового столбца, px
export const TEXT_COLUMN_MIN_WIDTH = 160;

export interface DocTableColumnLayout {
  nowrap: boolean;
  minWidth?: number;
}

// Поля ширины столбца, которые читает Vuetify
const PROFILE_WIDTH_FIELDS = ['width', 'minWidth', 'maxWidth'] as const;

const hasProfileWidth = (column: DocTableColumn): boolean =>
  PROFILE_WIDTH_FIELDS.some((name) => {
    const width = column[name];
    return width !== undefined && width !== null && width !== '';
  });

// Длина самой длинной строки значения
const longestLineLength = (value: string): number =>
  Math.max(...value.split('\n').map((line) => line.length));

// Раскладка столбца: короткие значения (коды, идентификаторы, статусы, перечисления технологий)
// не переносятся, переводы строк в них сохраняются; текстовый столбец получает минимальную ширину.
// Ширина из профиля сохраняется.
export const columnLayout = (column: DocTableColumn, rows: readonly DocTableRow[]): DocTableColumnLayout => {
  if (hasProfileWidth(column)) return { nowrap: false };
  if (column.format === 'status') return { nowrap: true };

  const isShort = rows.every((row) => longestLineLength(rowFields([column], row)[0].value) <= SHORT_VALUE_LENGTH);
  return isShort ? { nowrap: true } : { nowrap: false, minWidth: TEXT_COLUMN_MIN_WIDTH };
};

// Строк на странице: per-page из профиля или значение по умолчанию (Т5.2)
export const resolveItemsPerPage = (perPage?: number | null): number => perPage || DEFAULT_ITEMS_PER_PAGE;

// Значение «все строки» для v-data-table: Vuetify подписывает его «Все» (dataFooter.itemsPerPageAll)
export const ALL_ITEMS = -1;

// Варианты «строк на странице» (Т5.2): 10, 20, 50, значение per-page из профиля и «Все»
export const itemsPerPageOptions = (itemsPerPage: number): number[] => [
  ...Array.from(new Set([...ITEMS_PER_PAGE_PRESETS, itemsPerPage]))
    .filter((option) => option > 0)
    .sort((a, b) => a - b),
  ALL_ITEMS
];

// Подвал с пагинацией не нужен при печати и когда все строки помещаются на страницу (Т5.3),
// в том числе при per-page: -1 («Все») в профиле
export const isFooterHidden = (isPrintVersion: boolean, itemsCount: number, itemsPerPage: number): boolean =>
  isPrintVersion || itemsPerPage === ALL_ITEMS || itemsCount <= itemsPerPage;

// Строки таблицы из данных источника. Пока источник загружает данные, таблица показывает строки
// прошлой загрузки: ее высота, шапка и панель не меняются до прихода новых строк
export const tableItems = (dataset: unknown, status: string, loaded: readonly DocTableRow[]): readonly DocTableRow[] => {
  if (status === SOURCE_PENDING) return loaded;
  const result = dataset || [];
  return (Array.isArray(result) ? result : [result]) as DocTableRow[];
};

// Таблица перезагружает данные: первая загрузка прошла, источник снова загружает данные
export const isTableReloading = (isReady: boolean, status: string): boolean => isReady && status === SOURCE_PENDING;

// Таблица больше 10 строк получает поле поиска
export const SEARCH_MIN_ROWS = 11;

export const hasTableSearch = (itemsCount: number): boolean => itemsCount >= SEARCH_MIN_ROWS;

// Пустая таблица — загруженная без строк: без шапки столбцов и строки поиска
export const isTableEmpty = (isReady: boolean, itemsCount: number): boolean => isReady && !itemsCount;

export interface DocTableToolbarState {
  isPrintVersion: boolean;
  isReady: boolean;
  itemsCount: number;
  // Панель таблицы выводится в заголовке виджета
  inWidgetHeader: boolean;
}

// Строка поиска и Excel над таблицей: у загруженной непустой таблицы вне печати, если панель
// не выводится в заголовке виджета
export const isToolbarShown = (state: DocTableToolbarState): boolean =>
  !state.isPrintVersion && state.isReady && !isTableEmpty(state.isReady, state.itemsCount) && !state.inWidgetHeader;
