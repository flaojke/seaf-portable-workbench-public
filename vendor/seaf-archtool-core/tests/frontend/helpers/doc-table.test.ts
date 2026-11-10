import {
  ALL_ITEMS,
  DEFAULT_ITEMS_PER_PAGE,
  DocTableColumn,
  SEARCH_MIN_ROWS,
  TEXT_COLUMN_MIN_WIDTH,
  columnLayout,
  hasTableSearch,
  isFooterHidden,
  isTableEmpty,
  isTableReloading,
  isToolbarShown,
  itemsPerPageOptions,
  resolveItemsPerPage,
  rowFields,
  statusTone,
  tableItems
} from '@front/helpers/docTable';
import { SOURCE_PENDING } from '@front/helpers/docSource';

describe('docTable', () => {
  describe('statusTone', () => {
    const column = { format: 'status', statuses: { 'Используется': 'ok', 'Создается': 'wip', 'Опечатка': 'green' } };

    test('Значение из карты statuses дает соответствующий оттенок', () => {
      expect(statusTone(column, 'Используется')).toBe('ok');
      expect(statusTone(column, 'Создается')).toBe('wip');
    });

    test('Значение без сопоставления, неизвестный оттенок и колонка без карты — нейтральный чип', () => {
      expect(statusTone(column, 'Удаляется')).toBe('neutral');
      expect(statusTone(column, 'Опечатка')).toBe('neutral');
      expect(statusTone({ format: 'status' }, 'Используется')).toBe('neutral');
    });
  });

  describe('columnLayout', () => {
    const rows = [
      { code: 'П.1', title: 'Интеграция платежного шлюза с основным монолитным сервисом', tech: 'HTTPS,JSON', status: 'Используется' },
      { code: 'П.12', title: 'Данные о платеже', tech: 'File,JSON', status: 'Создается' }
    ];

    test('Столбец с короткими значениями не переносится', () => {
      expect(columnLayout({ value: 'code' }, rows)).toEqual({ nowrap: true });
      expect(columnLayout({ value: 'tech' }, rows)).toEqual({ nowrap: true });
    });

    test('Короткий столбец определяется по самой длинной строке значения', () => {
      // Значение tech длиннее 20 символов, но каждая его строка короче
      const multiline = [
        { tech: 'HTTPS, JSON, XML\nKafka, Avro, gRPC', note: 'Первая строка\nВторая строка' },
        { tech: 'File\\nJSON', note: 'Строка длиннее двадцати символов\nКороткая' }
      ];
      expect(columnLayout({ value: 'tech' }, multiline)).toEqual({ nowrap: true });
      expect(columnLayout({ value: 'note' }, multiline)).toEqual({ nowrap: false, minWidth: TEXT_COLUMN_MIN_WIDTH });
    });

    test('Текстовый столбец переносится и получает минимальную ширину', () => {
      expect(columnLayout({ value: 'title' }, rows)).toEqual({ nowrap: false, minWidth: TEXT_COLUMN_MIN_WIDTH });
    });

    test('Столбец статуса не переносится', () => {
      expect(columnLayout({ value: 'title', format: 'status' }, rows)).toEqual({ nowrap: true });
    });

    test('Ширина из профиля сохраняется', () => {
      expect(columnLayout({ value: 'title', width: '300px' }, rows)).toEqual({ nowrap: false });
      expect(columnLayout({ value: 'code', minWidth: 80 }, rows)).toEqual({ nowrap: false });
      expect(columnLayout({ value: 'title', maxWidth: 240 }, rows)).toEqual({ nowrap: false });
    });

    test('Ключи ширины, которые Vuetify не читает, не считаются шириной из профиля', () => {
      const column = { value: 'title', 'min-width': '300px' } as DocTableColumn;
      expect(columnLayout(column, rows)).toEqual({ nowrap: false, minWidth: TEXT_COLUMN_MIN_WIDTH });
    });

    test('Пустая таблица — столбцы не переносятся', () => {
      expect(columnLayout({ value: 'title' }, [])).toEqual({ nowrap: true });
    });
  });

  describe('rowFields', () => {
    test('Значения колонок по key или value, выравнивание по умолчанию — left', () => {
      const fields = rowFields(
        [{ value: 'title' }, { key: 'type', value: 'ignored', align: 'center' }],
        { title: 'CRM', type: 'Система', ignored: 'x' }
      );

      expect(fields).toEqual([
        { value: 'CRM', link: undefined, status: undefined, align: 'left' },
        { value: 'Система', link: undefined, status: undefined, align: 'center' }
      ]);
    });

    test('Ссылка берется из колонки, указанной в link', () => {
      const [field] = rowFields([{ value: 'title', link: 'url' }], { title: 'CRM', url: '/systems/crm' });

      expect(field.link).toBe('/systems/crm');
    });

    test('format: status добавляет оттенок чипа, без format статуса нет', () => {
      const columns = [
        { value: 'status', format: 'status', statuses: { 'Используется': 'ok' } },
        { value: 'status' }
      ];
      const [withFormat, withoutFormat] = rowFields(columns, { status: 'Используется' });

      expect(withFormat.status).toBe('ok');
      expect(withoutFormat.status).toBeUndefined();
    });

    test('Отсутствующее значение — пустая строка, экранированный \\n — перенос строки', () => {
      const [missing, multiline] = rowFields([{ value: 'none' }, { value: 'text' }], { text: 'a\\nb' });

      expect(missing.value).toBe('');
      expect(multiline.value).toBe('a\nb');
    });
  });

  describe('пагинация', () => {
    test('per-page из профиля имеет приоритет, иначе значение по умолчанию', () => {
      expect(resolveItemsPerPage(5)).toBe(5);
      expect(resolveItemsPerPage(undefined)).toBe(DEFAULT_ITEMS_PER_PAGE);
      expect(resolveItemsPerPage(null)).toBe(DEFAULT_ITEMS_PER_PAGE);
    });

    test('Варианты 10/20/50 и «Все» (-1) при любом числе строк', () => {
      expect(itemsPerPageOptions(10)).toEqual([10, 20, 50, ALL_ITEMS]);
      expect(ALL_ITEMS).toBe(-1);
    });

    test('Значение per-page из профиля добавляется в варианты без повторов', () => {
      expect(itemsPerPageOptions(15)).toEqual([10, 15, 20, 50, ALL_ITEMS]);
      expect(itemsPerPageOptions(100)).toEqual([10, 20, 50, 100, ALL_ITEMS]);
      expect(itemsPerPageOptions(20)).toEqual([10, 20, 50, ALL_ITEMS]);
    });

    test('per-page: -1 из профиля не дублирует «Все»', () => {
      expect(itemsPerPageOptions(ALL_ITEMS)).toEqual([10, 20, 50, ALL_ITEMS]);
    });

    test('Подвал скрыт при печати и когда все строки помещаются на страницу', () => {
      expect(isFooterHidden(true, 100, 10)).toBe(true);
      expect(isFooterHidden(false, 10, 10)).toBe(true);
      expect(isFooterHidden(false, 7, 10)).toBe(true);
      expect(isFooterHidden(false, 11, 10)).toBe(false);
      expect(isFooterHidden(false, 100, ALL_ITEMS)).toBe(true);
    });
  });

  describe('поиск и строка над таблицей', () => {
    test('Поле поиска — у таблиц больше 10 строк', () => {
      expect(SEARCH_MIN_ROWS).toBe(11);
      expect(hasTableSearch(10)).toBe(false);
      expect(hasTableSearch(11)).toBe(true);
      expect(hasTableSearch(0)).toBe(false);
    });

    test('Пустая таблица — загруженная без строк', () => {
      expect(isTableEmpty(true, 0)).toBe(true);
      expect(isTableEmpty(false, 0)).toBe(false);
      expect(isTableEmpty(true, 3)).toBe(false);
    });

    const shown = { isPrintVersion: false, isReady: true, itemsCount: 3, inWidgetHeader: false };

    test('Строка над таблицей — у загруженной непустой таблицы', () => {
      expect(isToolbarShown(shown)).toBe(true);
      expect(isToolbarShown({ ...shown, isReady: false })).toBe(false);
      expect(isToolbarShown({ ...shown, itemsCount: 0 })).toBe(false);
    });

    test('Строки над таблицей нет в печати и когда панель в заголовке виджета', () => {
      expect(isToolbarShown({ ...shown, isPrintVersion: true })).toBe(false);
      expect(isToolbarShown({ ...shown, inWidgetHeader: true })).toBe(false);
    });
  });

  describe('isTableReloading', () => {
    test('Перезагрузка — источник загружает данные после первой загрузки', () => {
      expect(isTableReloading(true, SOURCE_PENDING)).toBe(true);
      expect(isTableReloading(false, SOURCE_PENDING)).toBe(false);
      expect(isTableReloading(true, 'ready')).toBe(false);
    });
  });

  describe('tableItems', () => {
    const loaded = [{ code: 'П.1' }, { code: 'П.2' }];

    test('Строки — данные загруженного источника', () => {
      expect(tableItems([{ code: 'П.3' }], 'ready', loaded)).toEqual([{ code: 'П.3' }]);
      expect(tableItems({ code: 'П.3' }, 'ready', loaded)).toEqual([{ code: 'П.3' }]);
      expect(tableItems(null, 'ready', loaded)).toEqual([]);
      expect(tableItems(null, 'error', loaded)).toEqual([]);
    });

    test('Пока источник загружает данные, остаются строки прошлой загрузки', () => {
      expect(tableItems(null, SOURCE_PENDING, loaded)).toBe(loaded);
      expect(isTableEmpty(true, tableItems(null, SOURCE_PENDING, loaded).length)).toBe(false);
    });
  });
});
