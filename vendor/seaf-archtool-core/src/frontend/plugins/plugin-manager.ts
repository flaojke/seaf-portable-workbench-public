/*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
*/

import { shallowReactive, type Component } from 'vue';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import { loadLegacyPlugin } from './loaders/legacy-plugin-loader';
import type { PluginCatalogEntry } from '../../types/plugin-descriptor';


const logger = getLoggerWithTag('f/p/plugin-manager');

export interface LegacyPluginMetadata {
  id: string;
  documents: string[];
  entry: string;
  // Общие чанки, которые должны быть загружены до entry.
  scripts: string[];
  styles: string[];
}

export type CatalogPluginMetadata = Omit<PluginCatalogEntry, 'scripts'>;

export class PluginManager {
  private readonly documentRenderers = shallowReactive(new Map<string, Component>());
  private readonly pluginIds = new Set<string>();
  private readonly reservedDocumentTypes = new Set<string>();
  private readonly pluginLoads = new Map<string, Promise<void>>();
  private readonly pluginsByDocumentType = shallowReactive(new Map<string, LegacyPluginMetadata>());

  registerDocumentRenderer(
    documentType: string,
    renderer: Component
  ): void {
    this.documentRenderers.set(documentType, renderer);
  }

  registerAvailablePlugin(plugin: LegacyPluginMetadata): void {
    this.pluginIds.add(plugin.id);

    for (const documentType of plugin.documents) {
      this.pluginsByDocumentType.set(documentType, plugin);
    }
  }

  registerAvailablePlugins(plugins: LegacyPluginMetadata[]): void {
    for (const plugin of plugins) {
      this.registerAvailablePlugin(plugin);
    }

    logger.info(
      () => `Зарегистрирована metadata локальных lazy-плагинов: [${plugins.length}]`
    );

  }

  reserveLocalPlugins(
    plugins: Pick<LegacyPluginMetadata, 'id' | 'documents'>[],
    builtInDocumentTypes: string[]
  ): void {
    for (const plugin of plugins) {
      this.pluginIds.add(plugin.id);

      for (const documentType of plugin.documents) {
        this.reservedDocumentTypes.add(documentType);
      }
    }

    for (const documentType of builtInDocumentTypes) {
      this.reservedDocumentTypes.add(documentType);
    }
  }

  registerCatalogPlugins(plugins: CatalogPluginMetadata[]): void {
    let registeredCount = 0;

    for (const plugin of plugins) {
      if (this.pluginIds.has(plugin.id)) {
        logger.warn(
          () => `Плагин каталога [${plugin.id}] пропущен: ID уже занят`
        );
        continue;
      }

      const conflictingType = plugin.documents.find((documentType) => {
        return this.reservedDocumentTypes.has(documentType)
          || this.documentRenderers.has(documentType)
          || this.pluginsByDocumentType.has(documentType);
      });

      if (conflictingType) {
        logger.warn(
          () => `Плагин каталога [${plugin.id}] пропущен: `
            + `тип документа [${conflictingType}] уже занят`
        );
        continue;
      }

      // Принимаем всю запись только после проверки всех заявленных типов.
      this.registerAvailablePlugin(plugin);
      registeredCount++;
    }

    logger.info(
      () => `Зарегистрированы плагины каталога: [${registeredCount}]`
    );
  }

  getDocumentRenderer(documentType: string): Component | null {
    return this.documentRenderers.get(documentType) || null;
  }

  getAvailablePluginByDocumentType(
    documentType: string
  ): LegacyPluginMetadata | null {
    return this.pluginsByDocumentType.get(documentType) || null;
  }

  loadPluginByDocumentType(documentType: string): Promise<void> {
    if (this.hasDocumentRenderer(documentType)) {
      return Promise.resolve();
    }

    const plugin = this.getAvailablePluginByDocumentType(documentType);

    if (!plugin) {
      const error = new Error(
        `Плагин для типа документа [${documentType}] не найден`
      );

      logger.warn(() => error.message);
      return Promise.reject(error);
    }

    const currentLoad = this.pluginLoads.get(plugin.id);

    if (currentLoad) return currentLoad;

    logger.info(() => `Начинаем загрузку плагина [${plugin.id}] для типа [${documentType}]`);

    const pluginLoad = loadLegacyPlugin(plugin)
      .then(() => {
        const missingDocumentTypes = plugin.documents.filter(
          (type) => !this.hasDocumentRenderer(type)
        );

        if (missingDocumentTypes.length) {
          throw new Error(
            `Плагин [${plugin.id}] не зарегистрировал типы документов: `
            + missingDocumentTypes.join(', ')
          );
        }

        logger.info(() => `Плагин [${plugin.id}] успешно загружен`);
      })
      .catch((error: unknown) => {
        this.pluginLoads.delete(plugin.id);

        logger.error(() => `Ошибка загрузки плагина [${plugin.id}]`, error);
        throw error;
      });

    this.pluginLoads.set(plugin.id, pluginLoad);

    return pluginLoad;
  }

  hasDocumentRenderer(documentType: string): boolean {
    return this.documentRenderers.has(documentType);
  }

  // Включает типы lazy-плагинов, код которых ещё не загружен.
  getAvailableDocumentTypes(): string[] {
    return [...new Set([
      ...this.documentRenderers.keys(),
      ...this.pluginsByDocumentType.keys()
    ])];
  }

  getDocumentTypes(): string[] {
    return [...this.documentRenderers.keys()];
  }
}

export const pluginManager = new PluginManager();
