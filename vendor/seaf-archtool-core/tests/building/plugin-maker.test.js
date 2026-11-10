import {describe, expect, jest, test} from '@jest/globals';

const PluginMaker = require('../../src/building/plugin-maker.cjs');

const metadata = [
    {id: 'html', documents: ['html', 'custom-html'], entryName: 'plugins/html'},
    {id: 'svg', documents: ['svg'], entryName: 'plugins/svg'}
];

const createChunk = (files) => ({files: new Set(files)});

// Последний chunk entrypoint — entry, перед ним идут общие чанки.
const createEntrypoint = (chunks) => ({
    getFiles: () => chunks.flatMap((chunk) => [...chunk.files]),
    getEntrypointChunk: () => chunks[chunks.length - 1]
});

const createCompilation = (entrypoints = {}) => ({
    entrypoints: new Map(
        Object.entries(entrypoints).map(([name, chunks]) => [name, createEntrypoint(chunks)])
    ),
    emitAsset: jest.fn()
});

const runtime = createChunk(['js/runtime.123.js']);
const sharedWithApp = createChunk(['js/3343.123.js', 'css/3343.123.css']);

describe('PluginMaker.emitLazyManifest', () => {
    test('Включает общие чанки плагина и исключает подключённые в HTML', () => {
        const sharedByPlugins = createChunk(['js/4802.123.js', 'css/4802.123.css']);
        const compilation = createCompilation({
            app: [runtime, sharedWithApp, createChunk(['js/app.123.js', 'css/app.123.css'])],
            'plugins/html': [runtime, sharedWithApp, sharedByPlugins, createChunk([
                'plugins/html.456.js.map',
                'css/html.789.css',
                'plugins/html.456.js',
                'css/html.789.css.map'
            ])],
            'plugins/svg': [runtime, sharedWithApp, createChunk(['plugins/svg.123.js'])]
        });

        new PluginMaker({metadata}).emitLazyManifest(compilation);

        expect(compilation.emitAsset).toHaveBeenCalledTimes(1);
        const [name, source] = compilation.emitAsset.mock.calls[0];
        expect(name).toBe('lazy-plugins.json');
        expect(JSON.parse(source.source().toString())).toEqual({
            plugins: [
                {
                    id: 'html',
                    documents: ['html', 'custom-html'],
                    entry: '/plugins/html.456.js',
                    scripts: ['/js/4802.123.js'],
                    styles: ['/css/4802.123.css', '/css/html.789.css']
                },
                {
                    id: 'svg',
                    documents: ['svg'],
                    entry: '/plugins/svg.123.js',
                    scripts: [],
                    styles: []
                }
            ]
        });
    });

    test('Не создаёт manifest при пустой metadata', () => {
        const compilation = createCompilation();
        new PluginMaker({metadata: []}).emitLazyManifest(compilation);
        expect(compilation.emitAsset).not.toHaveBeenCalled();
    });

    test('Прерывает генерацию, если заявленный entrypoint отсутствует', () => {
        const compilation = createCompilation({
            'plugins/html': [createChunk(['plugins/html.js'])]
        });
        expect(() => new PluginMaker({metadata}).emitLazyManifest(compilation)).toThrow(
            'Webpack entrypoint [plugins/svg] was not found'
        );
        expect(compilation.emitAsset).not.toHaveBeenCalled();
    });

    test('Прерывает генерацию, если у entry chunk нет JS', () => {
        const compilation = createCompilation({
            'plugins/html': [createChunk(['css/html.css', 'plugins/html.js.map'])]
        });
        expect(() => new PluginMaker({metadata}).emitLazyManifest(compilation)).toThrow(
            'JavaScript entry for plugin [html] was not found'
        );
        expect(compilation.emitAsset).not.toHaveBeenCalled();
    });

    test('Прерывает генерацию, если JS плагина подключён как eager', () => {
        const entry = createChunk(['plugins/html.456.js']);
        const compilation = createCompilation({
            app: [entry],
            'plugins/html': [entry]
        });
        expect(() => new PluginMaker({metadata}).emitLazyManifest(compilation)).toThrow(
            'JavaScript entry for plugin [html] was not found'
        );
    });
});
