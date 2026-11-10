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

import {
  resolvePluginHostState,
  type PluginHostStateContext
} from '@front/plugins/resolve-plugin-host-state';

const defaultContext: PluginHostStateContext = {
  isReloading: false,
  hasRenderer: false,
  pluginsReady: true,
  hasProfile: true,
  hasAvailablePlugin: false,
  hasMetadataError: false,
  hasPluginError: false
};

describe('resolvePluginHostState', () => {
  test.each<{
    name: string;
    context: Partial<PluginHostStateContext>;
    expected: ReturnType<typeof resolvePluginHostState>;
  }>([
    {
      name: 'returns loading while the document is reloading',
      context: {
        isReloading: true,
        hasRenderer: true,
        pluginsReady: true,
        hasProfile: true
      },
      expected: 'loading'
    },
    {
      name: 'returns ready when renderer is already available',
      context: {
        isReloading: false,
        hasRenderer: true,
        pluginsReady: false,
        hasProfile: false
      },
      expected: 'ready'
    },
    {
      name: 'returns loading until plugins are ready',
      context: {
        isReloading: false,
        hasRenderer: false,
        pluginsReady: false,
        hasProfile: true
      },
      expected: 'loading'
    },
    {
      name: 'returns loading until the document profile is available',
      context: {
        isReloading: false,
        hasRenderer: false,
        pluginsReady: true,
        hasProfile: false
      },
      expected: 'loading'
    },
    {
      name: 'returns unknown when initialization is complete without a renderer',
      context: {
        isReloading: false,
        hasRenderer: false,
        pluginsReady: true,
        hasProfile: true
      },
      expected: 'unknown'
    },
    {
      name: 'Возвращает loading, если plugin известен, но renderer ещё не загружен',
      context: {
        isReloading: false,
        hasRenderer: false,
        pluginsReady: true,
        hasProfile: true,
        hasAvailablePlugin: true
      },
      expected: 'loading'
    },
    {
      name: 'Возвращает ready для готового renderer, даже если есть lazy metadata и инициализация ещё не завершена',
      context: {
        isReloading: false,
        hasRenderer: true,
        pluginsReady: false,
        hasProfile: false,
        hasAvailablePlugin: true
      },
      expected: 'ready'
    },
    {
      name: 'Сохраняет loading при reload, даже если renderer и lazy metadata уже доступны',
      context: {
        isReloading: true,
        hasRenderer: true,
        pluginsReady: true,
        hasProfile: true,
        hasAvailablePlugin: true
      },
      expected: 'loading'
    },
    {
      name: 'Возвращает unknown после инициализации, если нет ни renderer, ни доступного plugin',
      context: {
        isReloading: false,
        hasRenderer: false,
        pluginsReady: true,
        hasProfile: true,
        hasAvailablePlugin: false
      },
      expected: 'unknown'
    },
    {
      name: 'Показывает ошибку metadata раньше ошибки plugin',
      context: { hasMetadataError: true, hasPluginError: true },
      expected: 'metadata-error'
    },
    {
      name: 'Показывает ошибку plugin вместо ожидания известного типа',
      context: { hasAvailablePlugin: true, hasPluginError: true },
      expected: 'plugin-error'
    },
    {
      name: 'Готовый renderer не блокируется ошибками загрузки',
      context: { hasRenderer: true, hasMetadataError: true, hasPluginError: true },
      expected: 'ready'
    },
    {
      name: 'При reload скрывает прежние ошибки',
      context: { isReloading: true, hasMetadataError: true, hasPluginError: true },
      expected: 'loading'
    },
    {
      name: 'До завершения инициализации не показывает ошибки',
      context: { pluginsReady: false, hasMetadataError: true, hasPluginError: true },
      expected: 'loading'
    },
    {
      name: 'До получения profile не показывает ошибки',
      context: { hasProfile: false, hasMetadataError: true, hasPluginError: true },
      expected: 'loading'
    }
  ])('$name', ({ context, expected }) => {
    expect(resolvePluginHostState({ ...defaultContext, ...context })).toBe(expected);
  });
});
