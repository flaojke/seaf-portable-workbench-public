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
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2023
      R.Piontik <r.piontik@mail.ru> - 2022
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
*/

/* Модуль Vuex для работы с плагинами */
import * as Vue from 'vue';
import requests from '@front/helpers/requests';
import env from '@front/helpers/env';
import { getLogger, getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import { pluginManager } from '@front/plugins/plugin-manager';
import {
  parsePluginCatalog,
  parsePluginMetadata
} from '@front/plugins/parse-plugin-metadata';
import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';


const logger = getLoggerWithTag('f/p/plugins');

let appInstance = null;

export function setPluginsStoreAppInstance(app) {
  appInstance = app;
}

const plugins = {
	documents: [],
	// Все ранее зарегистрированные плагины переносим в основной менеджер
	pull() {
		this.documents.forEach((el) => DocHub.documents.register(el.type, el.component));
	}
};

// Регистрируем временный менеджер регистрации плагинов
window.DocHub = {
  // Внешние сборки используют общий Vue runtime через DocHub.runtime.vue.
  runtime: Object.freeze({
    apiVersion: 1,
    vue: Vue
  }),
	documents: {
		register(type, component) {
			plugins.documents.push({ type, component });
		},
		fetch() {
			return JSON.parse(JSON.stringify(plugins.documents));
		},
		getLoggerWithTag(pluginName) {
      return getLoggerWithTag(`plugin/${pluginName}`);
    },
		getLogger() {
      return getLogger();
    }
	}
};

export default {
	namespaced: true,
	state: {
		ready: false, // Признак готовности плагинов к использованию
		documents: {}, // Deprecated: зеркало для обратной совместимости
		metadataError: null // Сообщение для пользователя при ошибке загрузки или проверки lazy metadata
	},
	mutations: {
		setReady(state, value) {
			state.ready = value;
		},
		setMetadataError(state, message) {
			state.metadataError = message;
		},
		registerDocument(state, document) {
			state.documents[document.type] = document.component;
		}
	},
	actions: {
		// Загружаем плагины
		init(context) {
			// Регистрируем менеджер документов для плагинов
			window.DocHub.documents.register = function(type, component) {
				component.mixins = component.mixins || [];

				if (!appInstance) {
					throw new Error('Vue app instance is not initialized for plugin registration');
				}

				// Deprecated: сохраняем глобальную регистрацию для внешнего legacy-кода.
				appInstance.component(`plugin-doc-${type}`, component);
				pluginManager.registerDocumentRenderer(type, component);

				// Deprecated: сохраняем Vuex-зеркало для внешнего legacy-кода.
				context.commit('registerDocument', { type, component });
			};

			// Legacy API: возвращает только типы с зарегистрированным renderer,
			// без типов из lazy metadata, плагины которых ещё не загружены.
			window.DocHub.documents.fetch = () => {
				return pluginManager.getDocumentTypes();
			};

			context.commit('setReady', false);
			context.commit('setMetadataError', null);

      plugins.pull();

      pluginManager.reserveLocalPlugins(
        __BUILD_PLUGINS__,
        Object.values(DocTypes)
      );

			if (env.isPlugin()) {
				context.commit('setReady', true);
				return;
			}

			const lazyMetadataLoad = __HAS_LAZY_PLUGINS__
				? requests.request('/lazy-plugins.json', new URL('/', window.location))
					.then((response) => {
						pluginManager.registerAvailablePlugins(
							parsePluginMetadata(response?.data)
						);
					})
					.catch((error) => {
						logger.error(
							() => 'Не удалось загрузить metadata lazy-плагинов',
							error
						);
						context.commit(
							'setMetadataError',
							'Не удалось загрузить описание типов документов. Обновите страницу.'
						);
					})
				: Promise.resolve();

			// Загружаем каталог параллельно с lazy metadata, но регистрируем его после неё.
			const catalogMetadataLoad = requests.request(
				env.pluginsCatalogUrl,
				new URL('/', window.location),
				{ timeout: 10000 }
			)
				.then((response) => {
					return parsePluginCatalog(
						response?.data,
						window.DocHub.runtime.apiVersion,
						(message) => logger.warn(() => message)
					);
				})
				.catch((error) => {
					logger.error(
            () => 'Не удалось загрузить каталог документных плагинов',
						error
					);

					return [];
				});

			return Promise.all([
				lazyMetadataLoad,
				catalogMetadataLoad
      ]).then(([, catalogPlugins]) => {
        pluginManager.registerCatalogPlugins(catalogPlugins);
				context.commit('setReady', true);
			});
		}
	}
};
