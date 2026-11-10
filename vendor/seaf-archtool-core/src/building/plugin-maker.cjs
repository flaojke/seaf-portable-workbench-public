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
      R.Piontik <r.piontik@mail.ru> - 2022
*/

const pluginName = 'PluginMakerWebpackPlugin';

const { ConcatSource, RawSource } = require('webpack-sources');

module.exports = class PluginMakerWebpackPlugin {
	constructor(options) {
		this.options = Object.assign(options || {}, {
			filer: /^plugins\/.*\.js$/
		});
		this.options.test = new RegExp(this.options.test);
	}

	apply(compiler) {
		compiler.hooks.compilation.tap(pluginName, compilation => {
			// Дочерние compilation не должны повторно обрабатывать assets.
			if (compilation.compiler !== compiler) return;

			compilation.hooks.processAssets.tap(
				{
					name: pluginName,
					stage: compilation.PROCESS_ASSETS_STAGE_ADDITIONS
				},
				() => this.wrapPluginBundles(compilation)
			);

			compilation.hooks.processAssets.tap(
				{
					name: `${pluginName}:manifest`,
					stage: compilation.PROCESS_ASSETS_STAGE_SUMMARIZE
				},
				() => this.emitLazyManifest(compilation)
			);
		});
	}

	// Сохраняем доступ plugin bundles к legacy API DocHub.documents.register(...).
	wrapPluginBundles(compilation) {
		for (const chunk of compilation.chunks) {
			for (const file of chunk.files) {
				if (this.options.filer.test(file)) {
					compilation.updateAsset(file, old => {
						return new ConcatSource('(function (DocHub){', old, '})(window.DocHub);');
					});
				}
			}
		}
	}

	// Сопоставляем metadata с реальными именами JS/CSS после обработки assets.
	emitLazyManifest(compilation) {
		const metadata = this.options.metadata || [];

		// Без metadata manifest не нужен: lazy выключен или список плагинов пуст.
		if (!metadata.length) return;

		const lazyEntryNames = new Set(metadata.map((plugin) => plugin.entryName));

		// Файлы eager entrypoints подключает HTML, поэтому в manifest они не попадают.
		const preloadedFiles = new Set();
		for (const [name, entrypoint] of compilation.entrypoints) {
			if (lazyEntryNames.has(name)) continue;
			for (const file of entrypoint.getFiles()) preloadedFiles.add(file);
		}

		const plugins = metadata.map((plugin) => {
			const entrypoint = compilation.entrypoints.get(plugin.entryName);

			if (!entrypoint) {
				throw new Error(
					`Webpack entrypoint [${plugin.entryName}] was not found`
				);
			}

			// splitChunks выносит общие модули плагина в отдельные чанки. Те, что HTML не
			// подключает, загрузчик обязан получить сам: без них webpack откладывает старт
			// entry и плагин не регистрирует типы документов.
			const files = entrypoint.getFiles().filter((file) => !preloadedFiles.has(file));
			const entryFiles = entrypoint.getEntrypointChunk().files;
			const entry = files.find((file) => file.endsWith('.js') && entryFiles.has(file));

			if (!entry) {
				throw new Error(
					`JavaScript entry for plugin [${plugin.id}] was not found`
				);
			}

			return {
				id: plugin.id,
				documents: plugin.documents,
				entry: `/${entry}`,
				// Порядок entrypoint сохраняется: общие чанки идут до entry плагина.
				scripts: files
					.filter((file) => file !== entry && file.endsWith('.js'))
					.map((file) => `/${file}`),
				styles: files
					.filter((file) => file.endsWith('.css'))
					.map((file) => `/${file}`)
			};
		});

		const manifest = JSON.stringify({ plugins }, null, 2);

		compilation.emitAsset(
			'lazy-plugins.json',
			new RawSource(manifest)
		);
	}
};
