/** @jest-environment jsdom */

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

// Подменяем HTTP request: каждый тест задаёт ответ metadata или ошибку без обращения к сети.
jest.mock('@front/helpers/requests', () => ({
  __esModule: true,
  default: { request: jest.fn() }
}));

// Позволяет переключать web / IDE mode независимо от окружения запуска тестов.
jest.mock('@front/helpers/env', () => ({
  __esModule: true,
  default: {
    isPlugin: jest.fn(),
    pluginsCatalogUrl: '/plugins/catalog.json'
  }
}));

// Настоящий logger для проверки readiness не нужен.
jest.mock('@global/logger/v2/logger.mjs', () => {
  const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn() };
  return {
    getLogger: jest.fn(),
    getLoggerWithTag: () => logger
  };
});

const createPendingRequest = () => {
  let resolve;
  let reject;
  const promise = new Promise((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return {promise, resolve, reject};
};

describe('Готовность plugins', () => {
  let context;
  let requests;
  let env;
  let plugins;
  let pluginManager;
  let logger;
  let originalHasLazyPlugins;
  let originalBuildPlugins;

  // Подставляем результат DefinePlugin, используемый frontend.
  const loadPlugins = (hasLazyPlugins, buildPlugins = []) => {
    window.__HAS_LAZY_PLUGINS__ = hasLazyPlugins;
    window.__BUILD_PLUGINS__ = buildPlugins;
    jest.resetModules();
    requests = require('@front/helpers/requests').default;
    env = require('@front/helpers/env').default;
    plugins = require('@front/plugins/plugins').default;
    pluginManager = require('@front/plugins/plugin-manager').pluginManager;
    logger = require('@global/logger/v2/logger.mjs').getLoggerWithTag();
    env.pluginsCatalogUrl = '/plugins/catalog.json';
    env.isPlugin.mockReturnValue(false);
  };

  beforeEach(() => {
    jest.resetAllMocks();
    originalHasLazyPlugins = window.__HAS_LAZY_PLUGINS__;
    originalBuildPlugins = window.__BUILD_PLUGINS__;
    loadPlugins(false);
    context = { commit: jest.fn() };
  });

  afterEach(() => {
    if (originalHasLazyPlugins === undefined) {
      delete window.__HAS_LAZY_PLUGINS__;
    } else {
      window.__HAS_LAZY_PLUGINS__ = originalHasLazyPlugins;
    }
    if (originalBuildPlugins === undefined) {
      delete window.__BUILD_PLUGINS__;
    } else {
      window.__BUILD_PLUGINS__ = originalBuildPlugins;
    }
  });

  test.each([false, true])('В IDE готов сразу без HTTP request, lazy=%s', (hasLazyPlugins) => {
    loadPlugins(hasLazyPlugins);
    env.isPlugin.mockReturnValue(true);
    plugins.actions.init(context);

    expect(requests.request).not.toHaveBeenCalled();
    expect(context.commit.mock.calls).toEqual([
      ['setReady', false], ['setMetadataError', null], ['setReady', true]
    ]);
  });

  test.each([
    [true, ['/lazy-plugins.json', '/plugins/catalog.json']],
    [false, ['/plugins/catalog.json']]
  ])('Запрашивает metadata plugins, lazy=%s', async(hasLazyPlugins, expectedUrls) => {
    loadPlugins(hasLazyPlugins);
    requests.request.mockImplementation((url) => Promise.resolve({
      data: url === '/lazy-plugins.json'
        ? { plugins: [] }
        : { schemaVersion: 1, plugins: [] }
    }));

    await plugins.actions.init(context);

    expect(logger.error).not.toHaveBeenCalled();
    expect(requests.request.mock.calls.map(([url]) => url)).toEqual(expectedUrls);
    expect(document.head.querySelectorAll('script')).toHaveLength(0);
    expect(context.commit.mock.calls).toEqual([
      ['setReady', false], ['setMetadataError', null], ['setReady', true]
    ]);
  });

  test('Использует URL catalog из env', async() => {
    env.pluginsCatalogUrl = 'https://plugins.example.com/catalog.json';
    requests.request.mockResolvedValue({ data: { schemaVersion: 1, plugins: [] } });

    await plugins.actions.init(context);

    expect(logger.error).not.toHaveBeenCalled();
    expect(requests.request).toHaveBeenCalledWith(
      'https://plugins.example.com/catalog.json',
      new URL('/', window.location),
      { timeout: 10000 }
    );
  });

  describe('Общий Vue runtime', () => {
    test('Публикует API v1 и функции Vue из runtime core', () => {
      const Vue = require('vue');
      const runtime = window.DocHub.runtime;
      expect(runtime.apiVersion).toBe(1);
      expect(runtime.vue.ref).toBe(Vue.ref);
      expect(runtime.vue.computed).toBe(Vue.computed);
      expect(runtime.vue.defineComponent).toBe(Vue.defineComponent);
      const count = runtime.vue.ref(0);
      const doubled = Vue.computed(() => count.value * 2);
      expect(doubled.value).toBe(0);
      count.value = 3;
      expect(doubled.value).toBe(6);
    });

    test('Замораживает поля runtime, не запрещая использовать Vue', () => {
      const runtime = window.DocHub.runtime;
      const Vue = runtime.vue;
      expect(Object.isFrozen(runtime)).toBe(true);
      expect(Reflect.set(runtime, 'apiVersion', 99)).toBe(false);
      expect(Reflect.set(runtime, 'vue', {})).toBe(false);
      expect(Reflect.deleteProperty(runtime, 'vue')).toBe(false);
      expect(runtime.apiVersion).toBe(1);
      expect(runtime.vue).toBe(Vue);
      expect(runtime.vue.ref('ok').value).toBe('ok');
    });

    test.each([false, true])('Сохраняет runtime при init и регистрации renderer, IDE=%s', async(isIDE) => {
      env.isPlugin.mockReturnValue(isIDE);
      requests.request.mockResolvedValue({ data: { schemaVersion: 1, plugins: [] } });
      const app = { component: jest.fn() };
      require('@front/plugins/plugins').setPluginsStoreAppInstance(app);
      const runtime = window.DocHub.runtime;
      const temporaryRegister = window.DocHub.documents.register;
      await plugins.actions.init(context);

      expect(window.DocHub.runtime).toBe(runtime);
      expect(Object.isFrozen(runtime)).toBe(true);
      expect(window.DocHub.documents.register).not.toBe(temporaryRegister);
      const renderer = runtime.vue.defineComponent({ name: 'RuntimeCard' });
      window.DocHub.documents.register('runtime-card', renderer);
      expect(app.component).toHaveBeenCalledWith('plugin-doc-runtime-card', renderer);
      expect(pluginManager.getDocumentRenderer('runtime-card')).toBe(renderer);
      expect(window.DocHub.runtime).toBe(runtime);
    });
  });

  test.each([false, true])('HTTP timeout каталога завершает init без внешних plugins, lazy=%s', async(hasLazyPlugins) => {
    loadPlugins(hasLazyPlugins);
    jest.useFakeTimers();
    try {
      const local = { id: 'local', documents: ['local-card'], entry: '/local.js', scripts: [], styles: [] };
      const timeoutError = Object.assign(new Error('timeout of 10000ms exceeded'), { code: 'ECONNABORTED' });
      requests.request.mockImplementation((url, _base, options) => {
        if (url === '/lazy-plugins.json') return Promise.resolve({ data: { plugins: [local] } });
        return new Promise((_resolve, reject) => {
          setTimeout(() => reject(timeoutError), options.timeout);
        });
      });
      const initialization = plugins.actions.init(context);
      expect(requests.request).toHaveBeenCalledWith(
        '/plugins/catalog.json', new URL('/', window.location), { timeout: 10000 }
      );
      await jest.advanceTimersByTimeAsync(9999);
      expect(context.commit).not.toHaveBeenCalledWith('setReady', true);
      await jest.advanceTimersByTimeAsync(1);
      await initialization;

      expect(pluginManager.getAvailableDocumentTypes()).toEqual(hasLazyPlugins ? ['local-card'] : []);
      expect(logger.error).toHaveBeenCalledTimes(1);
      const [message, error] = logger.error.mock.calls[0];
      expect(message()).toBe('Не удалось загрузить каталог документных плагинов');
      expect(error).toBe(timeoutError);
      expect(context.commit).not.toHaveBeenCalledWith('setMetadataError', expect.any(String));
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    } finally {
      jest.clearAllTimers();
      jest.useRealTimers();
    }
  });

  describe('Lazy metadata', () => {
    let metadataRequest;
    const metadata = [{id: 'html', documents: ['html'], entry: '/html.js', scripts: [], styles: []}];

    beforeEach(() => {
      loadPlugins(true);
      metadataRequest = createPendingRequest();
      requests.request.mockImplementation((url) => {
        if (url === '/lazy-plugins.json') {
          return metadataRequest.promise;
        }
        return Promise.resolve({data: {schemaVersion: 1, plugins: []}});
      });
    });

    test('Legacy fetch возвращает только зарегистрированные типы, не lazy metadata', async() => {
      const initialization = plugins.actions.init(context);
      metadataRequest.resolve({ data: { plugins: metadata } });
      await initialization;

      expect(pluginManager.getAvailableDocumentTypes()).toEqual(['html']);
      expect(window.DocHub.documents.fetch()).toEqual([]);

      const { setPluginsStoreAppInstance } = require('@front/plugins/plugins');
      setPluginsStoreAppInstance({ component: jest.fn() });
      window.DocHub.documents.register('html', { name: 'HtmlRenderer' });

      expect(window.DocHub.documents.fetch()).toEqual(['html']);
      expect(document.head.querySelectorAll('script')).toHaveLength(0);
    });

    test('Ждёт metadata перед установкой ready', async() => {
      const initialization = plugins.actions.init(context);
      await Promise.resolve();
      expect(requests.request).toHaveBeenCalledTimes(2);
      expect(requests.request).toHaveBeenCalledWith('/lazy-plugins.json', new URL('/', window.location));
      expect(requests.request).toHaveBeenCalledWith(
        '/plugins/catalog.json',
        new URL('/', window.location),
        { timeout: 10000 }
      );
      expect(context.commit.mock.calls).toEqual([['setReady', false], ['setMetadataError', null]]);

      metadataRequest.resolve({data: {plugins: metadata}});
      await initialization;
      expect(pluginManager.getAvailablePluginByDocumentType('html')).toEqual(metadata[0]);
      expect(context.commit.mock.calls).toEqual([
        ['setReady', false], ['setMetadataError', null], ['setReady', true]
      ]);
    });

    test('При ошибке загрузки metadata показывает ошибку и завершает инициализацию', async() => {
      const initialization = plugins.actions.init(context);
      metadataRequest.reject(new Error('Metadata unavailable'));
      await initialization;

      expect(context.commit.mock.calls).toEqual([
        ['setReady', false],
        ['setMetadataError', null],
        ['setMetadataError', 'Не удалось загрузить описание типов документов. Обновите страницу.'],
        ['setReady', true]
      ]);
    });

    test.each([
      ['отсутствует plugins', {}],
      ['некорректная запись после корректной', {
        plugins: [
          {id: 'html', documents: ['html'], entry: '/html.js', scripts: [], styles: []},
          {id: 'broken', documents: ['broken'], entry: '/broken.js', scripts: [], styles: null}
        ]
      }]
    ])('Показывает ошибку metadata без частичной регистрации: %s', async(_name, data) => {
      const initialization = plugins.actions.init(context);
      metadataRequest.resolve({data});
      await initialization;

      expect(pluginManager.getAvailableDocumentTypes()).toEqual([]);
      expect(context.commit.mock.calls).toEqual([
        ['setReady', false],
        ['setMetadataError', null],
        ['setMetadataError', 'Не удалось загрузить описание типов документов. Обновите страницу.'],
        ['setReady', true]
      ]);
    });
  });

  describe('Порядок регистрации metadata', () => {
    const lazyPlugin = { id: 'lazy-card', documents: ['lazy-card'], entry: '/lazy.js', scripts: [], styles: [] };
    const catalogPlugin = {
      id: 'external-card', version: '0.1.0', apiVersion: 1,
      documents: ['external-card'], entry: '/plugins/external/plugin.js', scripts: [], styles: []
    };
    let lazyRequest;
    let catalogRequest;
    let registration;
    let catalogRegistration;
    const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0));

    beforeEach(() => {
      loadPlugins(true);
      lazyRequest = createPendingRequest();
      catalogRequest = createPendingRequest();
      requests.request.mockImplementation((url) => {
        if (url === '/lazy-plugins.json') return lazyRequest.promise;
        if (url === '/plugins/catalog.json') return catalogRequest.promise;
        throw new Error(`Unexpected URL: ${url}`);
      });
      registration = jest.spyOn(pluginManager, 'registerAvailablePlugins');
      catalogRegistration = jest.spyOn(pluginManager, 'registerCatalogPlugins');
    });

    test.each(['catalog', 'lazy'])('Регистрирует lazy перед catalog, первым отвечает %s', async(first) => {
      const initialization = plugins.actions.init(context);
      expect(requests.request.mock.calls.map(([url]) => url))
        .toEqual(['/lazy-plugins.json', '/plugins/catalog.json']);

      if (first === 'catalog') {
        catalogRequest.resolve({ data: { schemaVersion: 1, plugins: [catalogPlugin] } });
        await flushPromises();
        expect(registration).not.toHaveBeenCalled();
      } else {
        lazyRequest.resolve({ data: { plugins: [lazyPlugin] } });
        await flushPromises();
        expect(registration.mock.calls).toEqual([[[lazyPlugin]]]);
      }

      expect(catalogRegistration).not.toHaveBeenCalled();
      expect(context.commit).not.toHaveBeenCalledWith('setReady', true);
      expect(pluginManager.getAvailablePluginByDocumentType('external-card')).toBeNull();
      lazyRequest.resolve({ data: { plugins: [lazyPlugin] } });
      catalogRequest.resolve({ data: { schemaVersion: 1, plugins: [catalogPlugin] } });
      await initialization;

      expect(registration.mock.calls).toEqual([[[lazyPlugin]]]);
      expect(catalogRegistration.mock.calls).toEqual([[[catalogPlugin]]]);
      expect(registration.mock.invocationCallOrder[0])
        .toBeLessThan(catalogRegistration.mock.invocationCallOrder[0]);
      expect(pluginManager.getAvailablePluginByDocumentType('lazy-card')).toEqual(lazyPlugin);
      expect(pluginManager.getAvailablePluginByDocumentType('external-card')).toEqual(catalogPlugin);
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
      expect(logger.error).not.toHaveBeenCalled();
      expect(document.head.querySelectorAll('script')).toHaveLength(0);
    });

    test.each([
      ['catalog', 'type'], ['lazy', 'type'],
      ['catalog', 'id'], ['lazy', 'id']
    ])('Локальный plugin сохраняет приоритет: первым отвечает %s, конфликт %s', async(first, conflict) => {
      const conflictingPlugin = conflict === 'id'
        ? { ...catalogPlugin, id: lazyPlugin.id }
        : { ...catalogPlugin, documents: ['external-card', 'lazy-card'] };
      const initialization = plugins.actions.init(context);

      if (first === 'catalog') {
        catalogRequest.resolve({ data: { schemaVersion: 1, plugins: [conflictingPlugin] } });
      } else {
        lazyRequest.resolve({ data: { plugins: [lazyPlugin] } });
      }
      await flushPromises();
      expect(catalogRegistration).not.toHaveBeenCalled();
      lazyRequest.resolve({ data: { plugins: [lazyPlugin] } });
      catalogRequest.resolve({ data: { schemaVersion: 1, plugins: [conflictingPlugin] } });
      await initialization;

      expect(pluginManager.getAvailablePluginByDocumentType('lazy-card')).toEqual(lazyPlugin);
      expect(pluginManager.getAvailablePluginByDocumentType('external-card')).toBeNull();
      expect(pluginManager.getAvailableDocumentTypes()).toEqual(['lazy-card']);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.warn.mock.calls[0][0]()).toContain(conflict === 'id' ? 'ID уже занят' : 'тип документа [lazy-card] уже занят');
      expect(logger.error).not.toHaveBeenCalled();
      expect(document.head.querySelectorAll('script')).toHaveLength(0);
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    });

    test('Ошибка lazy metadata не мешает регистрации корректного catalog', async() => {
      const initialization = plugins.actions.init(context);
      catalogRequest.resolve({ data: { schemaVersion: 1, plugins: [catalogPlugin] } });
      await flushPromises();
      expect(registration).not.toHaveBeenCalled();
      lazyRequest.reject(new Error('Lazy metadata unavailable'));
      await initialization;

      expect(registration).not.toHaveBeenCalled();
      expect(catalogRegistration.mock.calls).toEqual([[[catalogPlugin]]]);
      expect(pluginManager.getAvailablePluginByDocumentType('external-card')).toEqual(catalogPlugin);
      expect(context.commit).toHaveBeenCalledWith(
        'setMetadataError', 'Не удалось загрузить описание типов документов. Обновите страницу.'
      );
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    });

    test('Ошибка catalog не мешает регистрации lazy metadata', async() => {
      const initialization = plugins.actions.init(context);
      catalogRequest.reject(new Error('Catalog unavailable'));
      await flushPromises();
      expect(context.commit).not.toHaveBeenCalledWith('setReady', true);
      lazyRequest.resolve({ data: { plugins: [lazyPlugin] } });
      await initialization;

      expect(registration.mock.calls).toEqual([[[lazyPlugin]]]);
      expect(catalogRegistration.mock.calls).toEqual([[[]]]);
      expect(pluginManager.getAvailablePluginByDocumentType('lazy-card')).toEqual(lazyPlugin);
      expect(context.commit).not.toHaveBeenCalledWith('setMetadataError', expect.any(String));
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    });
  });

  describe('Резервирование имён локальных plugins', () => {
    const external = {
      id: 'external', version: '0.1.0', apiVersion: 1,
      documents: ['external-card'], entry: '/plugins/external/plugin.js', scripts: [], styles: []
    };
    const local = { id: 'local', documents: ['local-card'] };

    test.each(['id', 'type'])('Eager plugin защищён без metadata и renderer: конфликт %s', async(conflict) => {
      loadPlugins(false, [local]);
      const rejected = conflict === 'id'
        ? { ...external, id: local.id }
        : { ...external, documents: ['external-card', 'local-card'] };
      requests.request.mockResolvedValue({ data: { schemaVersion: 1, plugins: [rejected] } });
      await plugins.actions.init(context);

      expect(pluginManager.getAvailableDocumentTypes()).toEqual([]);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).not.toHaveBeenCalled();
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    });

    test.each(['id', 'type'])('Ошибка lazy metadata не позволяет занять локальный %s', async(conflict) => {
      loadPlugins(true, [local]);
      const rejected = conflict === 'id'
        ? { ...external, id: local.id }
        : { ...external, documents: ['external-card', 'local-card'] };
      requests.request.mockImplementation((url) => url === '/lazy-plugins.json'
        ? Promise.reject(new Error('Lazy metadata unavailable'))
        : Promise.resolve({ data: { schemaVersion: 1, plugins: [rejected] } }));
      await plugins.actions.init(context);

      expect(pluginManager.getAvailableDocumentTypes()).toEqual([]);
      expect(logger.warn).toHaveBeenCalledTimes(1);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    });

    test.each(Object.values(require('@front/components/Docs/enums/doc-types.enum').DocTypes))(
      'Встроенный тип %s не может быть занят внешним plugin', async(type) => {
        requests.request.mockResolvedValue({ data: {
          schemaVersion: 1, plugins: [{ ...external, documents: ['external-card', type] }]
        } });
        await plugins.actions.init(context);

        expect(pluginManager.getAvailableDocumentTypes()).toEqual([]);
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn.mock.calls[0][0]()).toContain(`тип документа [${type}] уже занят`);
        expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
      }
    );
  });

  describe('Plugin catalog metadata', () => {
    const metadata = [{
      id: 'example-webgl',
      version: '0.1.0',
      apiVersion: 1,
      documents: ['example-webgl'],
      entry: '/plugins/webgl/plugin.js',
      scripts: [],
      styles: ['/plugins/webgl/plugin.css']
    }];

    beforeEach(() => {
      loadPlugins(false);
    });

    test('Регистрирует plugins из catalog', async() => {
      requests.request.mockResolvedValue({
        data: {
          schemaVersion: 1,
          plugins: metadata
        }
      });

      await plugins.actions.init(context);

      expect(
        pluginManager.getAvailablePluginByDocumentType('example-webgl')
      ).toEqual(metadata[0]);
      expect(context.commit.mock.calls).toEqual([
        ['setReady', false],
        ['setMetadataError', null],
        ['setReady', true]
      ]);
    });

    test('Пропускает несовместимые и некорректные записи, регистрируя совместимую', async() => {
      requests.request.mockResolvedValue({ data: {
        schemaVersion: 1,
        plugins: [
          { ...metadata[0], id: 'future', apiVersion: 99, documents: ['future'] },
          null,
          metadata[0]
        ]
      } });

      await plugins.actions.init(context);

      expect(pluginManager.getAvailableDocumentTypes()).toEqual(['example-webgl']);
      expect(logger.warn).toHaveBeenCalledTimes(2);
      expect(logger.warn.mock.calls.map(([message]) => message())).toEqual([
        'Плагин [future] пропущен: требуется API 99, портал предоставляет API 1',
        'Пропущена запись каталога [1]: некорректное описание плагина'
      ]);
      expect(logger.error).not.toHaveBeenCalled();
      expect(document.head.querySelectorAll('script')).toHaveLength(0);
      expect(context.commit).toHaveBeenLastCalledWith('setReady', true);
    });

    test('Использует версию опубликованного runtime при проверке catalog', async() => {
      window.DocHub.runtime = Object.freeze({ ...window.DocHub.runtime, apiVersion: 2 });
      requests.request.mockResolvedValue({ data: {
        schemaVersion: 1,
        plugins: [{ ...metadata[0], apiVersion: 2 }]
      } });

      await plugins.actions.init(context);

      expect(pluginManager.getAvailableDocumentTypes()).toEqual(['example-webgl']);
      expect(logger.warn).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    test.each([
      ['неподдерживаемая schemaVersion', { schemaVersion: 7, plugins: metadata }],
      ['HTML вместо JSON', '<!doctype html><html></html>']
    ])('Некорректный catalog не регистрирует plugins и не блокирует ready: %s', async(_name, data) => {
      requests.request.mockResolvedValue({ data });

      await plugins.actions.init(context);

      expect(pluginManager.getAvailableDocumentTypes()).toEqual([]);
      expect(logger.error).toHaveBeenCalledTimes(1);
      expect(context.commit.mock.calls).toEqual([
        ['setReady', false], ['setMetadataError', null], ['setReady', true]
      ]);
    });

    test('Ошибка catalog не блокирует инициализацию', async() => {
      requests.request.mockRejectedValue(
        new Error('Plugin catalog unavailable')
      );

      await plugins.actions.init(context);

      expect(pluginManager.getAvailableDocumentTypes()).toEqual([]);
      expect(context.commit.mock.calls).toEqual([
        ['setReady', false],
        ['setMetadataError', null],
        ['setReady', true]
      ]);
    });
  });
});
