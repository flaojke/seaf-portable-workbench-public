/**
 * @jest-environment jsdom
 */
/* eslint-disable vue/one-component-per-file -- The template check needs local Vuetify stubs. */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { runInNewContext } from 'node:vm';
import { transformSync } from '@babel/core';
import { parse } from '@vue/compiler-sfc';
import yaml from 'yaml';
import { compile, createApp, h, nextTick } from 'vue';

import * as exportOperation from '../../plugins/seaf2drawiojs/lib/export-operation';
import * as transformations from '../../plugins/seaf2drawiojs/lib/transformations';
import * as corridorRouting from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import * as layoutSettings from '../../plugins/seaf2drawiojs/lib/layout-settings';
import * as routingDiagnostics from '../../plugins/seaf2drawiojs/lib/routing-diagnostics';

const routeCorridorPage = jest.fn();
const createLayerColorMap = jest.fn(() => new Map());

const source = readFileSync(join(__dirname, '../../plugins/seaf2drawiojs/components/main.vue'), 'utf8');
const script = parse(source).descriptor.script.content;
const compiled = transformSync(script, {
  babelrc: false,
  configFile: false,
  plugins: ['@babel/plugin-transform-modules-commonjs']
}).code;
const moduleContext = { exports: {} };
const logger = { info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() };
const imports = {
  vue: require('vue'),
  yaml,
  '@front/helpers/env': { isPlugin: () => true },
  '@front/helpers/drawioUrl': { buildDrawioUrl: jest.fn() },
  '../lib/layout-settings': layoutSettings,
  './AiDraftDialog.vue': {},
  '../lib/export-operation': exportOperation,
  '../lib/transformations': transformations,
  '@front/helpers/uri': { getBaseURIOfPath: jest.fn(() => '/docs') },
  '@global/helpers/updateRootFiles/updateRootFilesInPutContent': {
    resolvePathInsideRoot: jest.fn((path) => path)
  },
  '../lib/ai-draft': { isAiExportBlocked: () => false, resolveAiDraftConfig: () => ({ enabled: false }) },
  '../lib/renderer': { renderSeafDiagram: jest.fn() },
  '../lib/corridor-routing': { ...corridorRouting, routeCorridorPage, createLayerColorMap },
  '../lib/routing-diagnostics': routingDiagnostics,
  '!!raw-loader!../lib/lib.yaml': '{}'
};
runInNewContext(compiled, {
  module: moduleContext,
  exports: moduleContext.exports,
  AbortController,
  setTimeout,
  clearTimeout,
  structuredClone,
  window,
  require: (id) => {
    if (!(id in imports)) throw new Error(`Unexpected component import: ${id}`);
    return imports[id];
  },
  DocHub: { documents: { getLoggerWithTag: () => logger } }
});
const component = moduleContext.exports.default;

function createEditor(getContent, putContent) {
  const contentWindow = { postMessage: jest.fn() };
  const editor = {
    aiExportBlocked: false,
    editorReady: true,
    frame: { contentWindow },
    diffPath: '../../schema_r41.diff.yaml',
    diffContentPath: 'architecture/ta/Docs/schema_r41.diff.yaml',
    diagram: {
      indices: { page: { visible: {} } },
      getDiff: jest.fn(() => ({ page: [{ id: 'visible', x: 9 }] }))
    },
    getContent,
    putContent,
    savingTransform: false,
    exportError: null
  };
  for (const [name, method] of Object.entries(component.methods)) {
    editor[name] = method.bind(editor);
  }
  component.created.call(editor);
  return { editor, contentWindow };
}

function deliverExport(editor, contentWindow) {
  const request = JSON.parse(contentWindow.postMessage.mock.calls[0][0]);
  editor.messageHandler({
    source: contentWindow,
    data: JSON.stringify({ event: 'export', message: request, xml: '<mxfile />' })
  });
}

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const pageXml = '<mxfile><diagram id="one" name="One"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>';
const twoPageXml = pageXml.replace('</mxfile>', '<diagram id="two" name="Two"><mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel></diagram></mxfile>');

function createRoutingEditor(path = '/docs/seaf.ta.docs.schema_r41') {
  const result = createEditor(jest.fn(), jest.fn());
  Object.assign(result.editor, {
    path,
    profile: { $base: path, layout_settings: { corridor_routing: path === '/docs/seaf.ta.docs.schema_r41' } },
    layoutSettings: null,
    routingGeneration: 1,
    routingController: null,
    routingPending: false,
    routingError: null,
    routingStatus: '',
    xml: null,
    withSaving: true
  });
  return result;
}

describe('seaf2drawiojs component transformation save', () => {
  it('exports through the iframe, merges the current file, writes it, and unlocks', async() => {
    const getContent = jest.fn().mockResolvedValue('page:\n  - id: hidden\n    x: 1\n');
    let finishWrite;
    const putContent = jest.fn(() => new Promise((resolve) => { finishWrite = resolve; }));
    const { editor, contentWindow } = createEditor(getContent, putContent);

    editor.initiateExport(editor.saveTransform);
    expect(editor.exportController.current).not.toBeNull();
    expect(JSON.parse(contentWindow.postMessage.mock.calls[0][0])).toEqual({
      action: 'export', format: 'html', requestId: expect.any(Number)
    });
    deliverExport(editor, contentWindow);
    await flush();

    expect(getContent).toHaveBeenCalledWith(editor.diffContentPath);
    expect(editor.diagram.getDiff).toHaveBeenCalledWith('<mxfile />');
    expect(putContent).toHaveBeenCalledTimes(1);
    expect(putContent.mock.calls[0][0]).toBe(editor.diffContentPath);
    expect(yaml.parse(putContent.mock.calls[0][1])).toEqual({
      page: [{ id: 'hidden', x: 1 }, { id: 'visible', x: 9 }]
    });
    expect(editor.savingTransform).toBe(true);
    expect(editor.exportController.current).not.toBeNull();
    finishWrite();
    await flush();
    expect(editor.exportError).toBeNull();
    expect(editor.savingTransform).toBe(false);
    expect(editor.exportController.current).toBeNull();
  });

  it('does not write after a read error and unlocks for another attempt', async() => {
    const getContent = jest.fn().mockRejectedValue(new Error('read failed'));
    const putContent = jest.fn();
    const { editor, contentWindow } = createEditor(getContent, putContent);

    editor.initiateExport(editor.saveTransform);
    deliverExport(editor, contentWindow);
    await flush();

    expect(putContent).not.toHaveBeenCalled();
    expect(editor.exportError).toBe('read failed');
    expect(editor.savingTransform).toBe(false);
    expect(editor.exportController.current).toBeNull();
    editor.initiateExport(editor.saveTransform);
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(2);
    editor.exportController.cancel();
  });
});

describe('seaf2drawiojs corridor routing lifecycle', () => {
  beforeEach(() => {
    routeCorridorPage.mockReset();
    createLayerColorMap.mockClear();
    logger.error.mockClear();
    logger.warn.mockClear();
    logger.info.mockClear();
  });

  it('publishes and allows saving routed pages when some edges fail or are skipped', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    routeCorridorPage
      .mockImplementationOnce(async(xml) => ({
        xml: xml.replace('<mxCell id="1"', '<mxCell id="routed-1"'),
        diagnostics: {
          failedEdges: 1,
          skippedEdges: 0,
          failed: [{
            id: 'edge-failed',
            layer: 'layer.one',
            source: 'node-a',
            target: 'node-b',
            reason: 'route-layer-overlap-over-port-limit:{"length":139.7,"axis":"horizontal","coordinate":345,"left":1361,"right":1500.7,"otherEdge":"edge-other","maxEndpointOverlap":8}'
          }],
          skipped: []
        }
      }))
      .mockImplementationOnce(async(xml) => ({
        xml: xml.replace('<mxCell id="1"', '<mxCell id="routed-2"'),
        diagnostics: {
          failedEdges: 0,
          skippedEdges: 2,
          failed: [],
          skipped: [
            { id: 'edge-skipped', layer: 'layer.two', source: 'node-c', target: 'node-d', reason: 'unsupported-or-missing-endpoint' },
            { id: 'edge-skipped-2', layer: 'layer.two', source: 'node-e', target: 'node-f', reason: 'unsupported-or-missing-endpoint' }
          ]
        }
      }));

    await editor.routeXml(twoPageXml, 1);

    expect(routeCorridorPage).toHaveBeenCalledTimes(2);
    expect(createLayerColorMap).toHaveBeenCalledTimes(1);
    expect(createLayerColorMap.mock.calls[0][0].nodeType).toBe(9);
    const firstOptions = routeCorridorPage.mock.calls[0][1];
    expect(routeCorridorPage.mock.calls[1][1].layerColors).toBe(firstOptions.layerColors);
    expect(routeCorridorPage.mock.calls[1][1].signal).toBe(firstOptions.signal);
    expect(editor.xml).toContain('id="routed-1"');
    expect(editor.xml).toContain('id="routed-2"');
    expect(editor.routingError).toBeNull();
    const logMessages = logger.error.mock.calls.map(([message]) => message()).join('\n');
    expect(logMessages).toContain('Страница 1/2');
    expect(logMessages).toContain('node-a → node-b');
    expect(logMessages).toContain('участок длиной 139.7 единиц схемы');
    expect(logMessages).toContain('другим логическим маршрутом (ID: edge-other)');
    expect(logMessages).toContain('Допустимое общее продолжение у портов — не более 8 единиц схемы');
    expect(logMessages).not.toContain('route-layer-overlap-over-port-limit');
    expect(logger.error.mock.calls[0][0]()).not.toContain('\n');
    expect(logger.warn.mock.calls.map(([message]) => message()).join('\n')).toContain('один из концов связи отсутствует');
    expect(editor.routingNotice).toContain('Часть связей');
    expect(editor.routingNotice).toContain('Подробности в журнале ArchTool');
    expect(editor.routingStatus).toBe('Маршрутизация частичная');
    expect(parse(source).descriptor.template.content).not.toContain('v-alert v-if="routingError"');
    expect(parse(source).descriptor.template.content).toContain('aria-label="Повторить"');
    expect(parse(source).descriptor.template.content).toContain('v-if="routingPending" class="routing-status"');
    expect(JSON.parse(contentWindow.postMessage.mock.calls[0][0])).toEqual({ action: 'load', xml: twoPageXml });
    expect(JSON.parse(contentWindow.postMessage.mock.calls[2][0])).toEqual({ action: 'load', xml: editor.xml });

    editor.initiateExport(editor.saveTransform);
    await editor.saveTransform({ xml: editor.xml });
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(4);
    expect(JSON.parse(contentWindow.postMessage.mock.calls[3][0]).action).toBe('export');
    expect(editor.putContent).toHaveBeenCalled();
  });

  it('leaves unrelated documents untouched, allows explicit opt-in, and honors R41 opt-out', async() => {
    const { editor, contentWindow } = createRoutingEditor('/docs/example.other');
    await editor.routeXml(pageXml, 1);
    expect(routeCorridorPage).not.toHaveBeenCalled();
    expect(editor.xml).toBe(pageXml);
    expect(JSON.parse(contentWindow.postMessage.mock.calls[0][0])).toEqual({ action: 'load', xml: pageXml });

    editor.layoutSettings = { corridor_routing: true };
    routeCorridorPage.mockImplementation(async(xml) => ({ xml, diagnostics: { failedEdges: 0, skippedEdges: 0 } }));
    await editor.routeXml(pageXml, 1);
    expect(routeCorridorPage).toHaveBeenCalledTimes(1);

    editor.path = '/docs/seaf.ta.docs.schema_r41';
    editor.profile.$base = editor.path;
    editor.layoutSettings = { corridor_routing: false };
    await editor.routeXml(pageXml, 1);
    expect(routeCorridorPage).toHaveBeenCalledTimes(1);
    expect(editor.xml).toBe(pageXml);
  });

  it('aborts an old route on refresh and never publishes its stale XML', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    let firstSignal;
    routeCorridorPage
      .mockImplementationOnce((xml, { signal }) => {
        firstSignal = signal;
        return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
      })
      .mockImplementationOnce(async(xml) => ({ xml, diagnostics: { failedEdges: 0, skippedEdges: 0 } }));

    const stale = editor.routeXml(pageXml, 1);
    editor.onRefresh();
    clearTimeout(editor.refresher);
    await stale;
    expect(firstSignal.aborted).toBe(true);
    expect(editor.routingError).toBeNull();
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(1);

    await editor.routeXml(pageXml, 2);
    expect(editor.routingStatus).toBe('Маршрутизация завершена');
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(3);
  });

  it('shows the source before a pending calculation and publishes each completed page', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    const first = deferred();
    const second = deferred();
    routeCorridorPage.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    const pending = editor.routeXml(twoPageXml, 1);
    expect(editor.xml).toBe(twoPageXml);
    expect(editor.routingPending).toBe(true);
    expect(JSON.parse(contentWindow.postMessage.mock.calls[0][0]).xml).toBe(twoPageXml);
    first.resolve({ xml: pageXml.replace('id="1"', 'id="first-routed"'), diagnostics: {} });
    await flush();
    expect(editor.xml).toContain('first-routed');
    expect(editor.xml).toContain('id="two"');
    expect(editor.routingPending).toBe(true);
    second.resolve({ xml: pageXml.replace('id="one"', 'id="two"'), diagnostics: {} });
    await pending;
    expect(editor.routingPending).toBe(false);
  });

  it('settles a failed editor delivery without an unhandled Promise rejection', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    contentWindow.postMessage.mockImplementation(() => { throw new Error('iframe unavailable'); });
    await expect(editor.routeXml(pageXml, 1)).resolves.toBeUndefined();
    expect(editor.xml).toBe(pageXml);
    expect(editor.routingPending).toBe(false);
    expect(editor.routingNotice).toContain('Подробности в журнале ArchTool');
    expect(logger.error).toHaveBeenCalled();
  });

  it('settles shared composition state when apply or restore fails', () => {
    const { editor } = createRoutingEditor();
    editor.composeDiagram = jest.fn(() => { throw new Error('composition failed'); });
    editor.routingPending = true;
    expect(() => editor.handleAiApply({})).not.toThrow();
    expect(editor.routingPending).toBe(false);
    editor.aiBaselineData = {};
    editor.routingPending = true;
    expect(() => editor.handleAiRestore()).not.toThrow();
    expect(editor.routingPending).toBe(false);
    expect(editor.routingNotice).toContain('Подробности в журнале ArchTool');
  });

  it('uses only profile settings, never document identity, to enable corridor routing', () => {
    const { editor } = createRoutingEditor();
    editor.profile = { $base: '/docs/seaf.ta.docs.schema_r41' };
    expect(editor.corridorRoutingEnabled()).toBe(false);
    editor.profile.layout_settings = { corridor_routing: true };
    editor.path = '/docs/custom.schema';
    expect(editor.corridorRoutingEnabled()).toBe(true);
    editor.layoutSettings = { corridor_routing: false };
    expect(editor.corridorRoutingEnabled()).toBe(false);
  });

  it('renders a compact notice and retained iframe in the actual template after a refresh failure', async() => {
    const VBtn = {
      props: ['disabled', 'icon'],
      render() { return h('button', { disabled: this.disabled, 'data-icon': this.icon }, this.$slots.default?.()); }
    };
    const VTooltip = {
      props: ['text'],
      render() { return h('span', this.$slots.activator?.({ props: { title: this.text } })); }
    };
    const host = document.createElement('div');
    document.body.append(host);
    const app = createApp({ ...component, mounted: () => undefined, render: compile(parse(source).descriptor.template.content) }, {
      profile: { layout_settings: { corridor_routing: true } }, path: '/docs/custom.schema',
      getContent: jest.fn(), putContent: jest.fn(), putEntities: jest.fn(),
      pullData: jest.fn().mockRejectedValue(new Error('release-data-profile offline'))
    });
    app.component('VBtn', VBtn);
    app.component('VTooltip', VTooltip);
    app.component('VAlert', { render() { return h('div', this.$slots.default?.()); } });
    const mounted = app.mount(host);
    try {
      mounted.xml = pageXml;
      await nextTick();
      const iframe = host.querySelector('iframe');
      await mounted.doRefresh();
      await nextTick();
      expect(host.querySelector('iframe')).toBe(iframe);
      expect(mounted.xml).toBe(pageXml);
      expect(host.querySelector('button[data-icon="mdi-alert-circle-outline"]')?.getAttribute('aria-label'))
        .toContain('Показан предыдущий результат');
      expect(host.querySelector('button[aria-label="Повторить"]')).not.toBeNull();
      expect(host.querySelector('.dh-alert')).toBeNull();
      mounted.routingPending = true;
      await nextTick();
      expect(iframe.hasAttribute('inert')).toBe(true);
      mounted.routingPending = false;
      await nextTick();
      expect(iframe.hasAttribute('inert')).toBe(false);
    } finally {
      app.unmount();
      host.remove();
    }
  });

  it('aborts active routing when the component closes', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    let signal;
    routeCorridorPage.mockImplementation((xml, options) => {
      signal = options.signal;
      return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('aborted'))));
    });
    const pending = editor.routeXml(pageXml, 1);
    component.unmounted.call(editor);
    await pending;
    expect(signal.aborted).toBe(true);
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(1);
  });

  it('offers an explicit retry after a route failure', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    routeCorridorPage.mockRejectedValue(new Error('route failed'));

    await editor.routeXml(pageXml, 1);
    expect(editor.routingError).toBe('Маршрутизация не завершена.');
    expect(editor.xml).toBe(pageXml);
    expect(JSON.parse(contentWindow.postMessage.mock.calls[0][0])).toEqual({ action: 'load', xml: pageXml });
    expect(parse(source).descriptor.template.content).toContain('aria-label="Повторить"');

    editor.onRefresh();
    clearTimeout(editor.refresher);
    expect(editor.routingError).toBeNull();
    expect(editor.routingPending).toBe(true);
    expect(editor.routingGeneration).toBe(2);

    editor.$refs = {};
    editor.aiConfig = { enabled: false };
    editor.pullData = jest.fn().mockRejectedValue(new Error('offline'));
    await editor.doRefresh(2);
    expect(editor.routingError).toBe('Не удалось обновить схему.');
    expect(editor.routingPending).toBe(false);
    expect(editor.xml).toBe(pageXml);
  });

  it('keeps completed page routing after a critical failure and blocks saving', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    const firstPage = pageXml.replace('<mxCell id="1"', '<mxCell id="routed"');
    routeCorridorPage
      .mockResolvedValueOnce({ xml: firstPage, diagnostics: { failedEdges: 0, skippedEdges: 0 } })
      .mockRejectedValueOnce(new Error('second page failed'));

    await editor.routeXml(twoPageXml, 1);

    expect(editor.xml).toContain('id="routed"');
    expect(editor.xml).toContain('<diagram id="two"');
    expect(editor.routingError).toBe('Маршрутизация не завершена.');
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(2);
    expect(JSON.parse(contentWindow.postMessage.mock.calls[1][0])).toEqual({ action: 'load', xml: editor.xml });
    editor.initiateExport(editor.saveTransform);
    await editor.saveTransform({ xml: editor.xml });
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(2);
    expect(editor.putContent).not.toHaveBeenCalled();
  });

  it('blocks stale R41 export if data retrieval fails after a successful route', async() => {
    const { editor, contentWindow } = createRoutingEditor();
    routeCorridorPage.mockImplementation(async(xml) => ({ xml, diagnostics: { failedEdges: 0, skippedEdges: 0 } }));
    await editor.routeXml(pageXml, 1);
    expect(editor.xml).not.toBeNull();
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(2);

    editor.$refs = {};
    editor.aiConfig = { enabled: false };
    editor.pullData = jest.fn().mockRejectedValue(new Error('offline'));
    editor.onRefresh();
    clearTimeout(editor.refresher);
    await editor.doRefresh(editor.routingGeneration);

    expect(editor.routingError).toBe('Не удалось обновить схему.');
    expect(editor.editorReady).toBe(true);
    expect(editor.xml).toBe(pageXml);
    expect(editor.routingNotice).toContain('Показан предыдущий результат');
    editor.initiateExport(editor.saveTransform);
    editor.saveXml(pageXml);
    expect(contentWindow.postMessage).toHaveBeenCalledTimes(2);
  });

  it('preserves the last diagram on loading and composition errors in unrelated documents', async() => {
    const { editor } = createRoutingEditor('/docs/example.other');
    editor.$refs = {};
    editor.aiConfig = { enabled: false };
    editor.xml = pageXml;
    editor.pullData = jest.fn().mockRejectedValue(new Error('offline'));

    await editor.doRefresh(1);
    expect(editor.routingStatus).toBe('Ошибка обновления схемы');
    expect(editor.routingError).toBe('Не удалось обновить схему.');
    expect(editor.editorReady).toBe(true);
    expect(editor.xml).toBe(pageXml);

    editor.pullData.mockResolvedValue({ dataset: {} });
    editor.composeDiagram = jest.fn(() => { throw new Error('composition failed'); });
    await editor.doRefresh(1);
    expect(editor.routingStatus).toBe('Ошибка обновления схемы');
    expect(editor.routingError).toBe('Не удалось обновить схему.');
    expect(editor.editorReady).toBe(true);
    expect(editor.xml).toBe(pageXml);
  });

  it('does not apply a stale transformations read after a newer refresh', async() => {
    const staleRead = deferred();
    const getContent = jest.fn()
      .mockReturnValueOnce(staleRead.promise)
      .mockResolvedValueOnce({ page: [{ id: 'current' }] });
    const { editor } = createRoutingEditor('/docs/example.other');
    editor.$refs = {};
    editor.getContent = getContent;
    editor.pullData = jest.fn().mockResolvedValue({ dataset: {}, diff_path: 'transformations.yaml' });
    editor.composeDiagram = jest.fn();

    const staleRefresh = editor.doRefresh(1);
    await flush();
    editor.routingGeneration = 2;
    await editor.doRefresh(2);
    const composeCount = editor.composeDiagram.mock.calls.length;

    staleRead.resolve({ page: [{ id: 'stale' }] });
    await staleRefresh;

    expect(editor.diff).toEqual({ page: [{ id: 'current' }] });
    expect(editor.loadedDiff).toEqual({ page: [{ id: 'current' }] });
    expect(editor.diffError).toBeNull();
    expect(editor.composeDiagram).toHaveBeenCalledTimes(composeCount);
  });

  it('ignores a stale transformations read failure without clearing current state', async() => {
    const staleRead = deferred();
    const getContent = jest.fn()
      .mockReturnValueOnce(staleRead.promise)
      .mockResolvedValueOnce({ page: [{ id: 'current' }] });
    const { editor } = createRoutingEditor('/docs/example.other');
    editor.$refs = {};
    editor.getContent = getContent;
    editor.pullData = jest.fn().mockResolvedValue({ dataset: {}, diff_path: 'transformations.yaml' });
    editor.composeDiagram = jest.fn();
    logger.error.mockClear();

    const staleRefresh = editor.doRefresh(1);
    await flush();
    editor.routingGeneration = 2;
    await editor.doRefresh(2);
    const composeCount = editor.composeDiagram.mock.calls.length;

    staleRead.reject(new Error('stale read failed'));
    await staleRefresh;

    expect(editor.diff).toEqual({ page: [{ id: 'current' }] });
    expect(editor.loadedDiff).toEqual({ page: [{ id: 'current' }] });
    expect(editor.diffError).toBeNull();
    expect(editor.composeDiagram).toHaveBeenCalledTimes(composeCount);
    expect(logger.error).not.toHaveBeenCalled();
  });
});
