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

import {
  createTabsStorageKey,
  getTabIdentity,
  readStoredTabIdentity,
  resolveCurrentTab,
  writeStoredTabIdentity
} from '../../../plugins/markaper/helpers/src';

function createStorage() {
  const values = new Map();

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value)
  };
}

function createLogger() {
  return {
    debug: jest.fn()
  };
}

describe('markaper tabs state', () => {
  const tabs = [
    { id: 'dc', title: 'ЦОД', src: '@entity/dc' },
    { id: 'monitoring', title: 'Мониторинг', src: '@entity/monitoring' }
  ];

  test('uses id as a stable identity and falls back to src', () => {
    expect(getTabIdentity(tabs[0])).toBe('id:dc');
    expect(getTabIdentity({ src: '@entity/network' })).toBe('src:@entity/network');
    expect(getTabIdentity(null)).toBeNull();
  });

  test('restores a stored tab even when its position changes', () => {
    const reorderedTabs = [tabs[1], tabs[0]];

    expect(resolveCurrentTab(reorderedTabs, 'id:monitoring')).toBe(0);
  });

  test('uses the declared selected tab when stored tab is unavailable', () => {
    const tabsWithDefault = [
      tabs[0],
      { ...tabs[1], selected: true }
    ];

    expect(resolveCurrentTab(tabsWithDefault, 'id:removed')).toBe(1);
  });

  test('falls back to the first tab and handles an empty list', () => {
    expect(resolveCurrentTab(tabs, null)).toBe(0);
    expect(resolveCurrentTab([], 'id:monitoring')).toBeNull();
  });

  test('isolates storage keys by page, presentation and params', () => {
    const firstKey = createTabsStorageKey(
      'entities.object.presentations.tabs',
      '/entities/object/card?id=first',
      { id: 'first' }
    );
    const sameKey = createTabsStorageKey(
      'entities.object.presentations.tabs',
      '/entities/object/card?id=first',
      { id: 'first' }
    );
    const secondKey = createTabsStorageKey(
      'entities.object.presentations.tabs',
      '/entities/object/card?id=second',
      { id: 'second' }
    );

    expect(firstKey).toBe(sameKey);
    expect(firstKey).not.toBe(secondKey);
  });

  test('writes and reads the selected tab identity', () => {
    const storage = createStorage();
    const storageKey = 'markaper_tabs:test';

    writeStoredTabIdentity(storage, storageKey, 'id:monitoring');

    expect(readStoredTabIdentity(storage, storageKey)).toBe('id:monitoring');
  });

  test('logs storage errors without breaking tab state handling', () => {
    const logger = createLogger();
    const unavailableStorage = {
      getItem: () => {
        throw new Error('Storage unavailable');
      },
      setItem: () => {
        throw new Error('Storage unavailable');
      }
    };

    expect(readStoredTabIdentity(unavailableStorage, 'key', logger)).toBeNull();
    expect(() => {
      writeStoredTabIdentity(unavailableStorage, 'key', 'id:monitoring', logger);
    }).not.toThrow();
    expect(logger.debug).toHaveBeenCalledTimes(2);
    expect(logger.debug.mock.calls[0][0]()).toContain('Failed to read selected tab state');
    expect(logger.debug.mock.calls[1][0]()).toContain('Failed to write selected tab state');
    expect(logger.debug.mock.calls[0][1]).toBeInstanceOf(Error);
    expect(logger.debug.mock.calls[1][1]).toBeInstanceOf(Error);
  });
});
