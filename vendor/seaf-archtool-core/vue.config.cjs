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
      Navasardyan Suren, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2025
      Bejoy <casperyourweb@gmail.com> - 2023
*/

const WebpackPwaManifest = require('webpack-pwa-manifest');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInlineSourcePlugin = require('@effortlessmotion/html-webpack-inline-source-plugin');
const MonacoWebpackPlugin = require('monaco-editor-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
const PluginMaker = require('./src/building/plugin-maker.cjs');
const { resolvePluginDescriptors } = require('./src/building/plugin-descriptors.cjs');
const path = require('path');
const packageJson = require('./package.json');
const webpack = require('webpack');

const pluginsConf = require('./plugins.json');

const isPluginMode = process.env.VUE_APP_DOCHUB_MODE === 'plugin';
const defaultLazyLoading = (process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING || 'N')
    .toUpperCase() === 'Y';
const legacyPluginMetadata = [];

const plugins = [
    new webpack.DefinePlugin({
        __APP_VERSION__: JSON.stringify(packageJson.version)
    })
];

const entries = {
    app: './src/frontend/main.js'
};


// Указывается где лежит движок SmartAnts
!process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE && (process.env.VUE_APP_DOCHUB_SMART_ANTS_SOURCE = '@assets/libs/smartants.cjs');


// Определяем версии API плагинов, которые поддерживаются в Enterprise режиме
const ideaAPIAvailable = process.env.VUE_APP_DOCHUB_IDE_IDEA_API || packageJson.ide?.idea?.api || [];
process.env.VUE_APP_DOCHUB_IDE_IDEA_API = Array.isArray(ideaAPIAvailable) ? ideaAPIAvailable : ideaAPIAvailable.toString().split(',');

const vscodeAPIAvailable = process.env.VUE_APP_DOCHUB_IDE_VSCODE_API || packageJson.ide?.vscode?.api || [];
process.env.VUE_APP_DOCHUB_IDE_IDEA_API = Array.isArray(vscodeAPIAvailable) ? vscodeAPIAvailable : vscodeAPIAvailable.toString().split(',');

// Собираем плагины
const buildPluginDescriptors = resolvePluginDescriptors(pluginsConf, {
    rootDir: __dirname,
    isPluginMode,
    defaultLazyLoading
});

buildPluginDescriptors.forEach((descriptor) => {
    entries[descriptor.entryName] = descriptor.entryPath;

    if (descriptor.lazy) {
        legacyPluginMetadata.push({
            id: descriptor.id,
            documents: descriptor.documents,
            entryName: descriptor.entryName
        });
    }
});

// Резервируем локальные ID и типы независимо от режима и загрузки lazy metadata.
plugins.push(new webpack.DefinePlugin({
    __HAS_LAZY_PLUGINS__: JSON.stringify(legacyPluginMetadata.length > 0),
    __BUILD_PLUGINS__: JSON.stringify(
        buildPluginDescriptors.map(({ id, documents }) => ({ id, documents }))
    )
}));

const manifest = {
    name: 'SEAF.ArchTool',
    short_name: 'SEAF.ArchTool',
    description: 'Architecture as a code',
    background_color: '#ffffff',
    crossorigin: 'use-credentials',
    filename: 'manifest.json'
};

plugins.push(new WebpackPwaManifest(manifest));

// Добавляем собственный плагин-мейкер
plugins.push(new PluginMaker({
    metadata: legacyPluginMetadata
}));

// Воркеры monaco кэшируются так же, как остальная статика. [contenthash] плагин считает только
// по входному файлу воркера, который между версиями monaco может не меняться, поэтому в имя
// добавляется версия monaco-editor.
plugins.push(new MonacoWebpackPlugin({
    filename: `[name].worker.${require('monaco-editor/package.json').version}.js`
}));

if (isPluginMode) {
    plugins.push(new HtmlWebpackPlugin({
        filename: 'plugin.html',
        template: 'src/ide/plugin.html',
        inlineSource: '.(woff(2)?|ttf|eot|svg|js|css)$',
        inject: true
        /* ,
        minify: {
            removeComments: true,
            collapseWhitespace: true,
            removeAttributeQuotes: true,
            minifyCSS: true,
            minifyJS: true
            // more options:
            // https://github.com/kangax/html-minifier#options-quick-reference
        } */
    }));
    plugins.push(new HtmlWebpackInlineSourcePlugin());
} else {
    // plugins.push(new BundleAnalyzerPlugin());
}

// Дефолтная конфигурация dev-сервера
let config = {
    publicPath: '/',
    runtimeCompiler: true,
    // Опция включает thread-loader для babel и многопоточную минификацию terser по числу ядер.
    // Куча V8 у каждого потока своя, поэтому пик памяти сборки растёт кратно их числу и упирается
    // в лимит, заданный в .docker/Dockerfile. Сборка в один поток дольше, но помещается в лимит.
    parallel: false,
    devServer: {
        port: 9090,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
            'Access-Control-Allow-Headers': 'X-Requested-With, content-type, Authorization'
        },
        /*
        allowedHosts: [
            'localhost'
        ],
        */
        client: {
			overlay: false,
			logging: 'info'
		},
        hot: process.env.VUE_APP_DOCHUB_HOTRELOAD !== 'off',
        // Modified by LSV: unavailable development endpoints return an explicit response.
        setupMiddlewares: (middlewares, devServer) => {
            devServer.app.post(['/oauth', '/chat/completions'], (_req, res) => {
                res.status(501).json({error: 'External AI integration is not included in this distribution.'});
            });
            return middlewares;
        },
        proxy: {
            ...(process.env.VUE_APP_PROXY_BACKEND_URL && {
                '^/seaf-core/api|^/api|^/core|^/entities/\\S+/presentations|^/new/chat|^/logger|^/manifest-mutation|^/health|^/smartants|^/bitbucket-mgr': {
                    target: process.env.VUE_APP_PROXY_BACKEND_URL,
                    secure: false,
                    logLevel: 'debug',
                    onProxyReq: (proxyReq) => {
                        proxyReq.setHeader('Authorization', 'Bearer ' + process.env.VUE_APP_DEBUG_IAM_TOKEN);
                    }
                }
            })
        }
    },
    transpileDependencies: ['vueitfy'],
    // Общие модули app и встроенных плагинов выносятся в общие чанки, а не копируются в каждый entry.
    // splitChunks задаётся через chainWebpack целиком: при слиянии через configureWebpack
    // остались бы cacheGroups vue-cli с фиксированными именами (chunk-vendors, chunk-common).
    chainWebpack: (chain) => {
        chain.optimization.splitChunks({
            chunks: 'all',
            cacheGroups: {
                defaultVendors: {
                    test: /[\\/]node_modules[\\/]/,
                    priority: -10,
                    reuseExistingChunk: true
                },
                default: {
                    minChunks: 2,
                    priority: -20,
                    reuseExistingChunk: true
                }
            }
        });

        if (!legacyPluginMetadata.length) return;

        const pluginEntryNames = legacyPluginMetadata.map((plugin) => plugin.entryName);

        chain.plugin('html').tap((args) => {
            args[0].excludeChunks = pluginEntryNames;
            return args;
        });
    },
    configureWebpack: {
        cache: (process.env.VUE_APP_DOCHUB_BUILDING_CACHE || 'memory').toLowerCase() === 'filesystem'
            ? {
                type: 'filesystem',
                compression: 'gzip',
                allowCollectingMemory: true
            }
            : {
                type: 'memory'
            },
        optimization: {
            runtimeChunk: 'single'
        },
        entry: {...entries},
        plugins,
        module: {
            rules: [
                {
                    test: /\.mjs$/,
                    include: /node_modules/,
                    type: 'javascript/auto'
                },
                {
                    test: /\.([cm]?ts|tsx)$/,
                    use: [
                        {
                            loader: 'ts-loader',
                            options: {
                                transpileOnly: true,
                                compilerOptions: {
                                    // Загрузчику нужно отдавать webpack'у результат компиляции,
                                    // поэтому noEmit из tsconfig.json здесь снимается.
                                    // allowImportingTsExtensions допустим только в неэмитирующей
                                    // конфигурации (TS5096), так что снимается вместе с ним:
                                    // пути с расширением .ts разрешает webpack, а не tsc.
                                    noEmit: false,
                                    allowImportingTsExtensions: false
                                }
                            }
                        }
                    ],
                    exclude: /node_modules/
                }
            ]
        },
        output: {
            // В production все initial-чанки получают contenthash (как async-чанки у vue-cli): статика
            // кэшируется надолго, и после релиза браузер не должен взять из кэша файл с прежним именем.
            // Именованные чанки (runtime и entry) остаются в своих каталогах: PluginMaker оборачивает
            // файлы по пути plugins/*.js. Общие чанки именуются по числовому id и кладутся в js/.
            filename: (pathData) => {
                if (process.env.NODE_ENV !== 'production') return '[name].js';
                return pathData.chunk?.name ? '[name].[contenthash:8].js' : 'js/[name].[contenthash:8].js';
            },
            chunkLoadingGlobal: 'webpackChunk_seaf_archtool_core',
            // В IDE-плагин упаковывается только plugin.html со встроенными скриптами: отдельные файлы
            // async-чанков там недоступны. Динамические import() (типы диаграмм mermaid, языки monaco,
            // katex и т.п.) включаются в initial-чанки, в веб-режиме остаются ленивыми.
            asyncChunks: process.env.VUE_APP_DOCHUB_MODE !== 'plugin'
        },
        resolve: {
            alias: {
                '@front': path.resolve(__dirname, './src/frontend'),
                '@assets': path.resolve(__dirname, './src/assets'),
                '@back': path.resolve(__dirname, './src/backend'),
                '@idea': path.resolve(__dirname, './src/ide/idea'),
                '@vscode': path.resolve(__dirname, './src/ide/vscode'),
                '@ide': path.resolve(__dirname, './src/ide'),
                '@global': path.resolve(__dirname, './src/global'),
                '@': path.resolve(__dirname, './'),
                vue: path.resolve(__dirname, './node_modules/vue')
            },
            extensions: ['.ts', '.js', '.tsx', '.jsx']
        }
    }
};

// Подключает сертификаты, если они обнаружены
/*
if(fs.lstatSync(__dirname + '/certs').isDirectory()) {
	config.devServer = {
		http2: true,
		https: {
			key: fs.readFileSync(__dirname + '/certs/server.key'),
			cert: fs.readFileSync(__dirname + '/certs/server.cert')
		}
	}
}
*/
module.exports = config;
