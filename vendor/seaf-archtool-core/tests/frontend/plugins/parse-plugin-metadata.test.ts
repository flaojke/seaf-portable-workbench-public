import { parsePluginCatalog, parsePluginMetadata } from '@front/plugins/parse-plugin-metadata';

const plugin = {
  id: 'dbml',
  documents: ['dbml'],
  entry: '/plugins/dbml.js',
  scripts: ['/js/shared.js'],
  styles: ['/css/dbml.css']
};

describe('parsePluginCatalog', () => {
  const catalogPlugin = { ...plugin, version: '0.1.0', apiVersion: 1 };

  test('Принимает совместимые записи и пустой каталог без предупреждений', () => {
    const onWarning = jest.fn();
    expect(parsePluginCatalog({ schemaVersion: 1, plugins: [catalogPlugin] }, 1, onWarning))
      .toEqual([catalogPlugin]);
    expect(parsePluginCatalog({ schemaVersion: 1, plugins: [] }, 1, onWarning)).toEqual([]);
    expect(onWarning).not.toHaveBeenCalled();
  });

  test.each([null, [], '<!doctype html><html></html>'])('Отклоняет не объект: %p', (value) => {
    expect(() => parsePluginCatalog(value, 1, jest.fn()))
      .toThrow('Некорректный формат каталога плагинов');
  });

  test.each([undefined, null, 0, 7, '1'])('Отклоняет schemaVersion: %p', (schemaVersion) => {
    const onWarning = jest.fn();
    expect(() => parsePluginCatalog({ schemaVersion, plugins: [catalogPlugin] }, 1, onWarning))
      .toThrow('Неподдерживаемая версия каталога плагинов');
    expect(onWarning).not.toHaveBeenCalled();
  });

  test.each([undefined, null, {}])('Отклоняет некорректный список: %p', (plugins) => {
    expect(() => parsePluginCatalog({ schemaVersion: 1, plugins }, 1, jest.fn()))
      .toThrow('Некорректный список плагинов в каталоге');
  });

  test.each([
    { id: ' ' },
    { entry: '' },
    { documents: [] },
    { documents: [' '] },
    { documents: ['WebGL'] },
    { documents: ['web gl'] },
    { documents: [' webgl'] },
    { documents: ['webgl '] },
    { documents: ['dbml', 'dbml'] },
    { documents: 'dbml' },
    { styles: null },
    { styles: [false] },
    { version: undefined },
    { version: ' ' },
    { apiVersion: undefined },
    { apiVersion: '1' },
    { apiVersion: 0 },
    { apiVersion: -1 },
    { apiVersion: 1.5 }
  ])('Пропускает некорректную запись, сохраняя соседние: %p', (fields) => {
    const onWarning = jest.fn();
    const lastPlugin = { ...catalogPlugin, id: 'last', documents: ['last'] };
    const plugins = [catalogPlugin, { ...catalogPlugin, ...fields }, lastPlugin];
    expect(parsePluginCatalog({ schemaVersion: 1, plugins }, 1, onWarning))
      .toEqual([catalogPlugin, lastPlugin]);
    expect(onWarning).toHaveBeenCalledTimes(1);
    expect(onWarning).toHaveBeenCalledWith(expect.stringContaining('запись каталога [1]'));
  });

  test.each([null, [], 'invalid'])('Пропускает запись, которая не является объектом: %p', (invalid) => {
    const onWarning = jest.fn();
    expect(parsePluginCatalog({ schemaVersion: 1, plugins: [invalid, catalogPlugin] }, 1, onWarning))
      .toEqual([catalogPlugin]);
    expect(onWarning).toHaveBeenCalledTimes(1);
  });

  test('Пропускает несовместимую версию API с объяснением', () => {
    const onWarning = jest.fn();
    const incompatible = { ...catalogPlugin, id: 'future', apiVersion: 99 };
    expect(parsePluginCatalog({ schemaVersion: 1, plugins: [incompatible, catalogPlugin] }, 1, onWarning))
      .toEqual([catalogPlugin]);
    expect(onWarning).toHaveBeenCalledWith(
      'Плагин [future] пропущен: требуется API 99, портал предоставляет API 1'
    );
  });

  test('Сравнивает API с переданной версией runtime, а не с константой', () => {
    const onWarning = jest.fn();
    const nextPlugin = { ...catalogPlugin, apiVersion: 2 };
    expect(parsePluginCatalog({ schemaVersion: 1, plugins: [nextPlugin, catalogPlugin] }, 2, onWarning))
      .toEqual([nextPlugin]);
    expect(onWarning).toHaveBeenCalledTimes(1);
  });
});

describe('parsePluginMetadata', () => {
  test('Принимает корректную metadata', () => {
    expect(parsePluginMetadata({ plugins: [plugin] })).toEqual([plugin]);
  });

  test.each([null, { plugins: {} }, { plugins: [null] }])(
    'Отклоняет некорректную структуру: %p',
    (value) => {
      expect(() => parsePluginMetadata(value)).toThrow('Некорректный формат metadata плагинов');
    }
  );

  test.each([
    { id: ' ' },
    { documents: 'dbml' },
    { scripts: 'shared.js' },
    { styles: [false] }
  ])('Отклоняет весь manifest при некорректной записи: %p', (invalidFields) => {
    const value = { plugins: [plugin, { ...plugin, ...invalidFields }] };
    expect(() => parsePluginMetadata(value)).toThrow('Некорректный формат metadata плагинов');
  });
});
