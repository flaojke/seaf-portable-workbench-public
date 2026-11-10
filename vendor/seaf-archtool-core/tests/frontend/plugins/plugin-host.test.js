/** @jest-environment jsdom */
/* eslint-disable vue/one-component-per-file -- Test wrapper and UI stub stay next to the component test. */

import fs from 'fs';
import path from 'path';
import { parse, compileScript } from '@vue/compiler-sfc';
import ts from 'typescript';
import { createApp, h, nextTick, reactive } from 'vue';

const pluginManager = {
  getAvailablePluginByDocumentType: jest.fn(),
  loadPluginByDocumentType: jest.fn()
};

// Jest не настроен на .vue: компилируем настоящий компонент локально,
// без нового transformer и без копирования его логики в тест.
function loadPluginHost() {
  const filename = path.resolve(__dirname, '../../../src/frontend/components/Docs/PluginHost.vue');
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename });
  const script = compileScript(descriptor, { id: 'plugin-host-test', inlineTemplate: true });
  const { outputText } = ts.transpileModule(script.content, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 }
  });
  const exports = {};
  const load = (name) => {
    if (name === '@front/plugins/plugin-manager') return { pluginManager };
    if (name === '@global/logger/v2/logger.mjs') {
      return { getLoggerWithTag: () => ({ error: jest.fn() }) };
    }
    if (name === '@front/components/Controls/Spinner.vue') {
      return { default: { render: () => h('span', 'Loading') } };
    }
    if (name === '@front/shared/ErrorBoundary') return { ErrorBoundary: {} };
    return require(name);
  };
  new Function('require', 'exports', outputText)(load, exports);
  return exports.default;
}

function pendingLoad() {
  let reject;
  const promise = new Promise((_resolve, onReject) => { reject = onReject; });
  return { promise, reject };
}

const PluginHost = loadPluginHost();
let app;
let container;

beforeEach(() => {
  jest.resetAllMocks();
  pluginManager.getAvailablePluginByDocumentType.mockReturnValue({ id: 'test-plugin' });
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  app?.unmount();
  container.remove();
});

function mountHost() {
  const props = reactive({
    docType: 'html',
    pluginsReady: true,
    profile: {},
    getContent: jest.fn(),
    putEntities: jest.fn(),
    putContent: jest.fn(),
    pullData: jest.fn(),
    eventBus: {}
  });
  app = createApp({ render: () => h(PluginHost, props) });
  app.component('VAlert', { setup: (_props, { slots }) => () => h('div', slots.default?.()) });
  app.mount(container);
  return props;
}

test('Игнорирует ошибку прошлого документа, но показывает текущую без автоматического retry', async() => {
  const previous = pendingLoad();
  const current = pendingLoad();
  pluginManager.loadPluginByDocumentType
    .mockReturnValueOnce(previous.promise)
    .mockReturnValueOnce(current.promise);
  const props = mountHost();

  props.docType = 'svg';
  await nextTick();
  expect(pluginManager.loadPluginByDocumentType.mock.calls).toEqual([['html'], ['svg']]);

  previous.reject(new Error('Previous document failed'));
  await Promise.resolve();
  await nextTick();
  expect(container.textContent).toContain('Loading');
  expect(container.textContent).not.toContain('Previous document failed');

  current.reject(new Error('Current document failed'));
  await Promise.resolve();
  await nextTick();
  expect(container.textContent).toContain('Current document failed');
  expect(container.textContent).not.toContain('Loading');
  expect(pluginManager.loadPluginByDocumentType).toHaveBeenCalledTimes(2);
});
