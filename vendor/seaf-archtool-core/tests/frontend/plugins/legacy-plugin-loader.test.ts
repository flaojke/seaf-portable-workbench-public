/** @jest-environment jsdom */

import { loadLegacyPlugin } from '@front/plugins/loaders/legacy-plugin-loader';

import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import type { LegacyPluginMetadata } from '@front/plugins/plugin-manager';

jest.mock('@global/logger/v2/logger.mjs', () => {
  const logger = { warn: jest.fn() };
  return { getLoggerWithTag: () => logger };
});

const logger = getLoggerWithTag('test');

// Загрузчик кэширует URL на весь модуль, поэтому у каждого теста свои адреса.
let pluginSequence = 0;

const createPlugin = (
  fields: Partial<LegacyPluginMetadata> = {}
): LegacyPluginMetadata => {
  const index = ++pluginSequence;

  return {
    id: `documents-${index}`,
    documents: ['html'],
    entry: `/plugins/documents-${index}.js`,
    scripts: [],
    styles: [`/plugins/first-${index}.css`, `/plugins/second-${index}.css`],
    ...fields
  };
};

const getScripts = (): HTMLScriptElement[] => {
  return Array.from(document.head.querySelectorAll('script'));
};

// Entry подключается после загрузки общих чанков, то есть не в текущем такте.
const waitScript = async(index = 0): Promise<HTMLScriptElement> => {
  for (let attempt = 0; attempt < 10; attempt++) {
    const script = getScripts()[index];
    if (script) return script;
    await Promise.resolve();
  }
  throw new Error('Plugin script was not appended');
};

const getStylesheets = (): HTMLLinkElement[] => {
  return Array.from(document.head.querySelectorAll<HTMLLinkElement>('link[rel="stylesheet"]'));
};

beforeEach(() => {
  jest.clearAllMocks();
});

afterEach(() => {
  document.head.querySelectorAll('script, link[rel="stylesheet"]').forEach((element) => element.remove());
});

describe('loadLegacyPlugin', () => {
  test('Запускает CSS и JS параллельно и ждёт завершения всех ресурсов', async() => {
    const plugin = createPlugin();
    const loading = loadLegacyPlugin(plugin);
    const script = await waitScript();
    const stylesheets = getStylesheets();
    const completed = jest.fn();
    const completion = loading.then(completed);

    expect(script.getAttribute('src')).toBe(plugin.entry);
    expect(stylesheets.map((stylesheet) => stylesheet.getAttribute('href'))).toEqual(plugin.styles);

    script.dispatchEvent(new Event('load'));
    stylesheets[0].dispatchEvent(new Event('load'));
    await Promise.resolve();
    expect(completed).not.toHaveBeenCalled();

    stylesheets[1].dispatchEvent(new Event('load'));
    await completion;
    expect(completed).toHaveBeenCalledTimes(1);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  test('Ошибки CSS не отклоняют загрузку, логируются и удаляют неудачные link', async() => {
    const plugin = createPlugin();
    const loading = loadLegacyPlugin(plugin);
    const stylesheets = getStylesheets();

    stylesheets.forEach((stylesheet) => stylesheet.dispatchEvent(new Event('error')));
    (await waitScript()).dispatchEvent(new Event('load'));

    await expect(loading).resolves.toBeUndefined();
    expect(stylesheets.every((stylesheet) => !stylesheet.isConnected)).toBe(true);
    expect(logger.warn).toHaveBeenCalledTimes(2);
    plugin.styles.forEach((url, index) => {
      const [message, error] = jest.mocked(logger.warn).mock.calls[index];
      expect(typeof message === 'function' ? message() : message).toContain(url);
      expect(error).toBeInstanceOf(Error);
    });
  });

  test('Ошибка JS отклоняет загрузку, не ожидая CSS, и удаляет script', async() => {
    const plugin = createPlugin();
    const loading = loadLegacyPlugin(plugin);
    const rejected = expect(loading).rejects.toThrow(
      `Не удалось загрузить плагин [${plugin.entry}]`
    );
    const script = await waitScript();

    script.dispatchEvent(new Event('error'));
    await rejected;
    expect(script.isConnected).toBe(false);

    // CSS завершается уже после отказа JS; его ошибки тоже должны быть обработаны.
    getStylesheets().forEach((stylesheet) => stylesheet.dispatchEvent(new Event('error')));
    await new Promise((resolve) => setTimeout(resolve));
    expect(logger.warn).toHaveBeenCalledTimes(2);
  });

  test('Грузит общие чанки до entry и не загружает их повторно для другого плагина', async() => {
    const shared = '/js/shared-together.js';
    const first = createPlugin({styles: [], scripts: [shared]});
    const second = createPlugin({styles: [], scripts: [shared]});

    const firstLoading = loadLegacyPlugin(first);
    const sharedScript = await waitScript();
    expect(sharedScript.getAttribute('src')).toBe(shared);
    // Пока общий чанк не загружен, entry не подключается.
    expect(getScripts()).toHaveLength(1);

    sharedScript.dispatchEvent(new Event('load'));
    const firstEntry = await waitScript(1);
    expect(firstEntry.getAttribute('src')).toBe(first.entry);
    firstEntry.dispatchEvent(new Event('load'));
    await expect(firstLoading).resolves.toBeUndefined();

    const secondLoading = loadLegacyPlugin(second);
    const secondEntry = await waitScript(2);
    expect(secondEntry.getAttribute('src')).toBe(second.entry);
    // Общий чанк переиспользуется: ещё одного script для него нет.
    expect(getScripts()).toHaveLength(3);

    secondEntry.dispatchEvent(new Event('load'));
    await expect(secondLoading).resolves.toBeUndefined();
  });

  test('Неудачный общий чанк отклоняет загрузку и допускает повторную попытку', async() => {
    const shared = '/js/shared-retry.js';
    const plugin = createPlugin({styles: [], scripts: [shared]});

    const failing = loadLegacyPlugin(plugin);
    const rejected = expect(failing).rejects.toThrow(`Не удалось загрузить плагин [${shared}]`);
    (await waitScript()).dispatchEvent(new Event('error'));
    await rejected;

    // Ошибка убрана из кэша, поэтому повтор снова подключает общий чанк.
    const retry = loadLegacyPlugin(plugin);
    const retryScript = await waitScript();
    expect(retryScript.getAttribute('src')).toBe(shared);

    retryScript.dispatchEvent(new Event('load'));
    (await waitScript(1)).dispatchEvent(new Event('load'));
    await expect(retry).resolves.toBeUndefined();
  });
});
