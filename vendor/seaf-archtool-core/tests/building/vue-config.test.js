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

import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals';

// Проверяем конфигурацию без запуска webpack и загрузки его plugins.
jest.mock('webpack', () => ({DefinePlugin: jest.fn()}));
jest.mock('webpack-pwa-manifest', () => jest.fn());
jest.mock('html-webpack-plugin', () => jest.fn());
jest.mock('@effortlessmotion/html-webpack-inline-source-plugin', () => jest.fn());
jest.mock('monaco-editor-webpack-plugin', () => jest.fn());

// Два тестовых plugin: с явным main и с точкой входа index.js по умолчанию.
jest.mock('../../plugins.json', () => [
    {id: 'html', documents: ['html'], source: {type: 'local', location: 'plugins/html'}},
    {id: 'svg', documents: ['svg'], source: {type: 'local', location: 'plugins/svg'}}
]);
jest.mock('../../plugins/html/package.json', () => ({main: 'custom.js'}), {virtual: true});
jest.mock('../../plugins/svg/package.json', () => ({}), {virtual: true});
jest.mock('fs', () => ({
    ...jest.requireActual('fs'),
    existsSync: jest.fn(() => true)
}));

// Конфигурация читает env при импорте, поэтому перед каждым тестом загружаем её заново.
// chainWebpack настраивает splitChunks, поэтому mock повторяет нужную часть webpack-chain.
function createChain() {
    const splitChunks = jest.fn();

    return {
        optimization: {splitChunks},
        plugin: jest.fn(),
        splitChunks
    };
}

function loadConfig() {
    const config = require('../../vue.config.cjs');
    const PluginMaker = require('../../src/building/plugin-maker.cjs');
    const pluginMaker = config.configureWebpack.plugins.find((plugin) => plugin instanceof PluginMaker);

    return {config, metadata: pluginMaker.options.metadata};
}

describe('Lazy loading в vue.config', () => {
    let originalEnv;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();
        originalEnv = process.env;
        process.env = {...originalEnv};
        delete process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING;
        delete process.env.VUE_APP_DOCHUB_MODE;
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    test('Формирует entries и передаёт metadata в PluginMaker', () => {
        process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING = 'Y';
        const {config, metadata} = loadConfig();

        expect(config.configureWebpack.entry).toEqual({
            app: './src/frontend/main.js',
            'plugins/plugins/html': './plugins/html/custom.js',
            'plugins/plugins/svg': './plugins/svg/index.js'
        });
        expect(metadata).toEqual([
            {id: 'html', documents: ['html'], entryName: 'plugins/plugins/html'},
            {id: 'svg', documents: ['svg'], entryName: 'plugins/plugins/svg'}
        ]);
    });

    test.each([
        ['по умолчанию', undefined],
        ['при выключенном lazy', 'N']
    ])('Сохраняет eager %s', (_name, flag) => {
        if (flag !== undefined) process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING = flag;

        const {config, metadata} = loadConfig();
        const webpackConfig = createChain();
        config.chainWebpack(webpackConfig);

        expect(metadata).toEqual([]);
        expect(webpackConfig.splitChunks).toHaveBeenCalledWith(
            expect.objectContaining({chunks: 'all'})
        );
        expect(webpackConfig.plugin).not.toHaveBeenCalled();
        expect(config.configureWebpack.entry).toHaveProperty('plugins/plugins/html');
        expect(config.configureWebpack.entry).toHaveProperty('plugins/plugins/svg');
    });

    test.each(['Y', 'y'])('При флаге %s исключает только plugin chunks из автоматического подключения в HTML', (flag) => {
        process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING = flag;
        const {config} = loadConfig();
        const tap = jest.fn();
        const webpackConfig = createChain();
        webpackConfig.plugin.mockReturnValue({tap});

        config.chainWebpack(webpackConfig);

        expect(webpackConfig.plugin).toHaveBeenCalledWith('html');
        expect(tap).toHaveBeenCalledTimes(1);
        // Выполняем callback, которым конфигурация изменяет параметры HtmlWebpackPlugin.
        const updateHtmlOptions = tap.mock.calls[0][0];
        const args = [{title: 'Portal'}];
        expect(updateHtmlOptions(args)).toBe(args);
        expect(args[0]).toEqual({
            title: 'Portal',
            excludeChunks: ['plugins/plugins/html', 'plugins/plugins/svg']
        });
    });

    test.each([
        ['N', true, undefined, ['html']],
        ['Y', false, undefined, ['svg']],
        ['Y', false, false, []]
    ])('Override при default=%s, html.lazy=%s, svg.lazy=%s', (flag, htmlLazy, svgLazy, expectedIds) => {
        process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING = flag;
        const descriptors = require('../../plugins.json');
        descriptors[0].lazy = htmlLazy;
        descriptors[1].lazy = svgLazy;

        const {config, metadata} = loadConfig();
        expect(metadata.map((plugin) => plugin.id)).toEqual(expectedIds);
        expect(Object.keys(config.configureWebpack.entry)).toEqual([
            'app', 'plugins/plugins/html', 'plugins/plugins/svg'
        ]);
        expect(require('webpack').DefinePlugin).toHaveBeenCalledWith({
            __HAS_LAZY_PLUGINS__: JSON.stringify(expectedIds.length > 0),
            __BUILD_PLUGINS__: JSON.stringify([
                {id: 'html', documents: ['html']},
                {id: 'svg', documents: ['svg']}
            ])
        });

        const tap = jest.fn();
        const webpackConfig = createChain();
        webpackConfig.plugin.mockReturnValue({tap});
        config.chainWebpack(webpackConfig);
        if (expectedIds.length) {
            const args = [{}];
            tap.mock.calls[0][0](args);
            expect(args[0].excludeChunks).toEqual(expectedIds.map((id) => `plugins/plugins/${id}`));
        } else {
            expect(webpackConfig.plugin).not.toHaveBeenCalled();
        }
    });

    test.each([undefined, 'N', 'Y'])('Резервирует все ID и типы независимо от lazy=%s', (flag) => {
        if (flag !== undefined) process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING = flag;
        const descriptors = require('../../plugins.json');
        descriptors[0].id = 'local-documents';
        descriptors[0].documents = ['html', 'local-card'];
        descriptors[0].lazy = false;
        descriptors[1].lazy = true;
        loadConfig();

        expect(require('webpack').DefinePlugin).toHaveBeenCalledWith({
            __HAS_LAZY_PLUGINS__: 'true',
            __BUILD_PLUGINS__: JSON.stringify([
                {id: 'local-documents', documents: ['html', 'local-card']},
                {id: 'svg', documents: ['svg']}
            ])
        });
    });

    test('Сборка идёт в один поток: многопоточность кратно увеличивает пик памяти', () => {
        const {config} = loadConfig();

        expect(config.parallel).toBe(false);
    });

    test('В IDE сохраняет eager и inline assets даже при включённом lazy', () => {
        process.env.VUE_APP_DOCHUB_MODE = 'plugin';
        process.env.VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING = 'Y';
        require('../../plugins.json')[0].lazy = true;

        const {config, metadata} = loadConfig();
        expect(require('webpack').DefinePlugin).toHaveBeenCalledWith({
            __HAS_LAZY_PLUGINS__: 'false',
            __BUILD_PLUGINS__: JSON.stringify([
                {id: 'html', documents: ['html']},
                {id: 'svg', documents: ['svg']}
            ])
        });
        const webpackConfig = createChain();
        config.chainWebpack(webpackConfig);

        expect(metadata).toEqual([]);
        expect(webpackConfig.plugin).not.toHaveBeenCalled();
        expect(config.configureWebpack.entry).toHaveProperty('plugins/plugins/html');
        expect(config.configureWebpack.entry).toHaveProperty('plugins/plugins/svg');
        expect(require('html-webpack-plugin')).toHaveBeenCalledWith(expect.objectContaining({
            filename: 'plugin.html',
            inject: true,
            inlineSource: '.(woff(2)?|ttf|eot|svg|js|css)$'
        }));
        expect(require('@effortlessmotion/html-webpack-inline-source-plugin')).toHaveBeenCalledTimes(1);
    });
});
