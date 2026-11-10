/** @jest-environment jsdom */

import initListener from '@vscode/listener';

jest.mock('vue-router', () => ({}));
jest.mock('@vscode/pipe', () => ({ listeners: {} }));
jest.mock('@front/router', () => ({ __esModule: true, default: {} }));
jest.mock('@global/manifest/parser3/index.mjs', () => ({ __esModule: true, default: {} }));
jest.mock('../../../plugins.json', () => [
  { id: 'html', documents: ['html'], source: { type: 'local', location: 'plugins/html' } },
  { id: 'svg', documents: ['svg'], source: { type: 'package', location: 'svg-package' } }
]);

test('fetchPlugins возвращает только local-пути, не npm-имена', () => {
  const originalPapi = window.$PAPI;
  const pluginList = jest.fn();
  const subscribe = jest.spyOn(window, 'addEventListener').mockImplementation(() => undefined);
  try {
    window.$PAPI = { pluginList };
    initListener({});
    const [, listener] = subscribe.mock.calls.find(([event]) => event === 'message');
    listener(new MessageEvent('message', { data: { command: 'fetchPlugins' } }));

    expect(pluginList).toHaveBeenCalledTimes(1);
    expect(pluginList).toHaveBeenCalledWith({ plugins: ['plugins/html'] });
  } finally {
    window.$PAPI = originalPapi;
    subscribe.mockRestore();
  }
});
