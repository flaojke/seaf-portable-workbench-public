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
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026

  Contributors:
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
*/

import { computed, type Component } from 'vue';
import { PluginManager, type CatalogPluginMetadata, type LegacyPluginMetadata } from '@front/plugins/plugin-manager';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import { loadLegacyPlugin } from '@front/plugins/loaders/legacy-plugin-loader';

jest.mock('@front/plugins/loaders/legacy-plugin-loader', () => ({
  loadLegacyPlugin: jest.fn()
}));

jest.mock('@global/logger/v2/logger.mjs', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return { getLoggerWithTag: () => logger };
});

const loadPluginMock = jest.mocked(loadLegacyPlugin);
const createRenderer = (name: string): Component => ({ name });

describe('PluginManager', () => {
  let manager: PluginManager;
  let plugin: LegacyPluginMetadata;

  beforeEach(() => {
    jest.resetAllMocks();
    manager = new PluginManager();
    plugin = {
      id: 'documents',
      documents: ['html', 'svg'],
      entry: '/plugins/documents.js',
      scripts: [],
      styles: ['/plugins/documents.css']
    };
  });

  test('starts with an empty renderer registry', () => {
    expect(manager.hasDocumentRenderer('html')).toBe(false);
    expect(manager.getDocumentRenderer('html')).toBeNull();
    expect(manager.getDocumentTypes()).toEqual([]);
  });

  test('registers and returns a document renderer', () => {
    const renderer = createRenderer('HtmlRenderer');

    manager.registerDocumentRenderer('html', renderer);

    expect(manager.hasDocumentRenderer('html')).toBe(true);
    expect(manager.getDocumentRenderer('html')).toBe(renderer);
    expect(manager.getDocumentTypes()).toEqual(['html']);
  });

  test('keeps renderers for different document types independent', () => {
    const htmlRenderer = createRenderer('HtmlRenderer');
    const svgRenderer = createRenderer('SvgRenderer');

    manager.registerDocumentRenderer('html', htmlRenderer);
    manager.registerDocumentRenderer('svg', svgRenderer);

    expect(manager.getDocumentRenderer('html')).toBe(htmlRenderer);
    expect(manager.getDocumentRenderer('svg')).toBe(svgRenderer);
    expect(manager.getDocumentRenderer('unknown')).toBeNull();
    expect(manager.getDocumentTypes()).toEqual(['html', 'svg']);
  });

  test('replaces a renderer registered for the same document type', () => {
    const previousRenderer = createRenderer('PreviousRenderer');
    const nextRenderer = createRenderer('NextRenderer');

    manager.registerDocumentRenderer('html', previousRenderer);
    manager.registerDocumentRenderer('html', nextRenderer);

    expect(manager.getDocumentRenderer('html')).toBe(nextRenderer);
    expect(manager.getDocumentTypes()).toEqual(['html']);
  });

  test('updates Vue computed values after renderer registration', () => {
    const renderer = createRenderer('HtmlRenderer');
    const registeredRenderer = computed(() => {
      return manager.getDocumentRenderer('html');
    });
    const documentTypes = computed(() => manager.getDocumentTypes());

    expect(registeredRenderer.value).toBeNull();
    expect(documentTypes.value).toEqual([]);

    manager.registerDocumentRenderer('html', renderer);

    expect(registeredRenderer.value).toBe(renderer);
    expect(documentTypes.value).toEqual(['html']);
  });

  test('Metadata и renderer реактивно обновляют доступные типы без eager-загрузки', () => {
    const types = computed(() => manager.getAvailableDocumentTypes());
    const renderer = computed(() => manager.getDocumentRenderer('html'));
    const metadata = computed(() => manager.getAvailablePluginByDocumentType('svg'));
    expect(types.value).toEqual([]);
    expect(renderer.value).toBeNull();
    expect(metadata.value).toBeNull();

    manager.registerAvailablePlugins([plugin]);
    expect(types.value).toEqual(['html', 'svg']);
    expect(metadata.value).toBe(plugin);
    expect(manager.getDocumentTypes()).toEqual([]);

    const htmlRenderer = createRenderer('HtmlRenderer');
    manager.registerDocumentRenderer('html', htmlRenderer);
    expect(renderer.value).toBe(htmlRenderer);
    expect(types.value).toEqual(['html', 'svg']);

    const updatedPlugin = {...plugin, entry: '/plugins/documents-v2.js'};
    manager.registerAvailablePlugin(updatedPlugin);
    expect(metadata.value).toBe(updatedPlugin);
    expect(manager.getAvailablePluginByDocumentType('html')).toBe(updatedPlugin);
    expect(loadPluginMock).not.toHaveBeenCalled();
  });

  describe('Приоритет локальных plugins над catalog', () => {
    const external: CatalogPluginMetadata = {
      id: 'external', version: '0.1.0', apiVersion: 1,
      documents: ['card'], entry: '/plugins/external/plugin.js', styles: []
    };
    const logger = getLoggerWithTag('test');

    test('Резервирование не создаёт metadata, renderer и доступные типы', () => {
      manager.reserveLocalPlugins([{ id: 'local', documents: ['local-card'] }], ['markdown']);
      expect(manager.getAvailableDocumentTypes()).toEqual([]);
      expect(manager.getDocumentTypes()).toEqual([]);
      expect(manager.getAvailablePluginByDocumentType('local-card')).toBeNull();
      expect(manager.getDocumentRenderer('markdown')).toBeNull();
      expect(loadPluginMock).not.toHaveBeenCalled();
    });

    test('Зарезервированный ID eager-плагина защищён до регистрации его renderer', () => {
      manager.reserveLocalPlugins([{ id: 'local', documents: ['local-card'] }], []);
      manager.registerCatalogPlugins([{ ...external, id: 'local' }]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBeNull();
      expect(logger.warn.mock.calls[0][0]()).toBe('Плагин каталога [local] пропущен: ID уже занят');
    });

    test.each(['local-card', 'markdown'])('Отклонённый по зарезервированному типу %s plugin не занимает ID', (type) => {
      manager.reserveLocalPlugins([{ id: 'local', documents: ['local-card'] }], ['markdown']);
      manager.registerCatalogPlugins([{ ...external, documents: ['card', type] }]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBeNull();
      expect(manager.getAvailablePluginByDocumentType(type)).toBeNull();
      expect(logger.warn.mock.calls[0][0]())
        .toBe(`Плагин каталога [external] пропущен: тип документа [${type}] уже занят`);
      manager.registerCatalogPlugins([external]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBe(external);
    });

    test('Резервирование не мешает регистрации и загрузке самого локального plugin', async() => {
      manager.reserveLocalPlugins([{ id: plugin.id, documents: plugin.documents }], []);
      manager.registerAvailablePlugin(plugin);
      loadPluginMock.mockImplementation(async() => {
        for (const type of plugin.documents) manager.registerDocumentRenderer(type, createRenderer(type));
      });
      await manager.loadPluginByDocumentType('html');
      expect(loadPluginMock).toHaveBeenCalledWith(plugin);
      expect(manager.getDocumentTypes()).toEqual(['html', 'svg']);
    });

    test('Принимает свободный plugin без загрузки кода и логирует число принятых', () => {
      manager.registerCatalogPlugins([external]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBe(external);
      expect(loadPluginMock).not.toHaveBeenCalled();
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.info.mock.calls[0][0]()).toBe('Зарегистрированы плагины каталога: [1]');
    });

    test('Совпадающий ID не связывает внешний тип с загрузкой локального plugin', async() => {
      manager.registerAvailablePlugin(plugin);
      manager.registerCatalogPlugins([{ ...external, id: plugin.id }]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBeNull();
      expect(manager.getAvailablePluginByDocumentType('html')).toBe(plugin);
      expect(logger.warn.mock.calls[0][0]()).toBe('Плагин каталога [documents] пропущен: ID уже занят');

      let finishLoading!: () => void;
      loadPluginMock.mockReturnValue(new Promise<void>((resolve) => { finishLoading = resolve; }));
      const localLoad = manager.loadPluginByDocumentType('html');
      await expect(manager.loadPluginByDocumentType('card')).rejects.toThrow('не найден');
      expect(loadPluginMock).toHaveBeenCalledTimes(1);
      expect(loadPluginMock).toHaveBeenCalledWith(plugin);
      for (const type of plugin.documents) manager.registerDocumentRenderer(type, createRenderer(type));
      finishLoading();
      await localLoad;
    });

    test('При совпадении типа lazy-плагина отклоняет всю запись и не занимает её ID', () => {
      manager.registerAvailablePlugin(plugin);
      manager.registerCatalogPlugins([{ ...external, documents: ['card', 'html'] }]);
      expect(manager.getAvailablePluginByDocumentType('html')).toBe(plugin);
      expect(manager.getAvailablePluginByDocumentType('card')).toBeNull();
      expect(logger.warn.mock.calls[0][0]())
        .toBe('Плагин каталога [external] пропущен: тип документа [html] уже занят');
      manager.registerCatalogPlugins([external]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBe(external);
    });

    test('Внешний plugin не заменяет зарегистрированный eager renderer', () => {
      const renderer = createRenderer('LocalCard');
      manager.registerDocumentRenderer('card', renderer);
      manager.registerCatalogPlugins([external]);
      expect(manager.getDocumentRenderer('card')).toBe(renderer);
      expect(manager.getAvailablePluginByDocumentType('card')).toBeNull();
      expect(logger.warn.mock.calls[0][0]())
        .toBe('Плагин каталога [external] пропущен: тип документа [card] уже занят');
    });

    test('Повторный ID внутри catalog не резервирует типы отклонённой записи', () => {
      const last = { ...external, id: 'last', documents: ['free'] };
      manager.registerCatalogPlugins([
        external, { ...external, documents: ['free'] }, last
      ]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBe(external);
      expect(manager.getAvailablePluginByDocumentType('free')).toBe(last);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.info.mock.calls[0][0]()).toBe('Зарегистрированы плагины каталога: [2]');
    });

    test('При конфликте внешних типов побеждает первая запись без частичного резервирования', () => {
      const last = { ...external, id: 'last', documents: ['free'] };
      manager.registerCatalogPlugins([
        external,
        { ...external, id: 'conflict', documents: ['free', 'card'] },
        last
      ]);
      expect(manager.getAvailablePluginByDocumentType('card')).toBe(external);
      expect(manager.getAvailablePluginByDocumentType('free')).toBe(last);
      expect(logger.warn).toHaveBeenCalledTimes(1);
    });
  });

  test('Запросы типов одного plugin разделяют Promise и не загружают его повторно', async() => {
    manager.registerAvailablePlugin(plugin);
    let finishLoading!: () => void;
    loadPluginMock.mockReturnValue(new Promise<void>((resolve) => {
      finishLoading = resolve;
    }));

    const loading = manager.loadPluginByDocumentType('html');
    expect(manager.loadPluginByDocumentType('html')).toBe(loading);
    expect(manager.loadPluginByDocumentType('svg')).toBe(loading);
    expect(loadPluginMock).toHaveBeenCalledWith(plugin);

    manager.registerDocumentRenderer('html', createRenderer('HtmlRenderer'));
    manager.registerDocumentRenderer('svg', createRenderer('SvgRenderer'));
    finishLoading();
    await loading;
    await manager.loadPluginByDocumentType('svg');
    expect(loadPluginMock).toHaveBeenCalledTimes(1);
  });

  test('Разные plugins загружаются независимо', async() => {
    const otherPlugin = {...plugin, id: 'tables', documents: ['table'], entry: '/plugins/tables.js'};
    manager.registerAvailablePlugins([plugin, otherPlugin]);
    loadPluginMock.mockImplementation(async(metadata) => {
      metadata.documents.forEach((type) => manager.registerDocumentRenderer(type, createRenderer(type)));
    });

    const firstLoad = manager.loadPluginByDocumentType('html');
    const secondLoad = manager.loadPluginByDocumentType('table');
    expect(firstLoad).not.toBe(secondLoad);
    await Promise.all([firstLoad, secondLoad]);
    expect(loadPluginMock).toHaveBeenCalledTimes(2);
    expect(loadPluginMock).toHaveBeenCalledWith(otherPlugin);
  });

  test('Отклоняет загрузку, если JS зарегистрировал только часть заявленных типов', async() => {
    manager.registerAvailablePlugin(plugin);
    loadPluginMock.mockImplementation(async() => {
      manager.registerDocumentRenderer('html', createRenderer('HtmlRenderer'));
    });

    await expect(manager.loadPluginByDocumentType('html')).rejects.toThrow(
      'Плагин [documents] не зарегистрировал типы документов: svg'
    );
  });

  test('После ошибки разрешает retry и объединяет запросы новой попытки', async() => {
    manager.registerAvailablePlugin(plugin);
    const error = new Error('Script unavailable');
    let finishRetry!: () => void;

    loadPluginMock
      .mockRejectedValueOnce(error)
      .mockImplementationOnce(() => new Promise<void>((resolve) => {
        finishRetry = () => {
          manager.registerDocumentRenderer('html', createRenderer('HtmlRenderer'));
          manager.registerDocumentRenderer('svg', createRenderer('SvgRenderer'));
          resolve();
        };
      }));

    const firstLoad = manager.loadPluginByDocumentType('html');
    const concurrentFirstLoad = manager.loadPluginByDocumentType('svg');
    expect(concurrentFirstLoad).toBe(firstLoad);
    await expect(firstLoad).rejects.toBe(error);
    await expect(concurrentFirstLoad).rejects.toBe(error);
    expect(manager.getDocumentTypes()).toEqual([]);

    const retryLoad = manager.loadPluginByDocumentType('html');
    expect(retryLoad).not.toBe(firstLoad);
    expect(manager.loadPluginByDocumentType('svg')).toBe(retryLoad);
    expect(loadPluginMock).toHaveBeenCalledTimes(2);

    finishRetry();
    await expect(retryLoad).resolves.toBeUndefined();
    expect(manager.getDocumentTypes()).toEqual(['html', 'svg']);

    await manager.loadPluginByDocumentType('svg');
    expect(loadPluginMock).toHaveBeenCalledTimes(2);
  });
});
