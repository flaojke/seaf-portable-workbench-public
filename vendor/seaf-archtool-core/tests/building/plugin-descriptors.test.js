const fs = require('fs');
const path = require('path');
const { resolvePluginDescriptors } = require('../../src/building/plugin-descriptors.cjs');

const options = {
    rootDir: path.resolve(__dirname, '../..'),
    isPluginMode: false,
    defaultLazyLoading: false
};
const html = {
    id: 'html',
    documents: ['html'],
    source: { type: 'local', location: 'plugins/html' }
};

// Используем настоящий HTML-плагин: для проверки путей не нужны моки webpack или fs.
test('Нормализует local location и не сохраняет состояние между вызовами', () => {
    const descriptor = { ...html, source: { type: 'local', location: './plugins/../plugins/html/' } };
    const expected = resolvePluginDescriptors([html], options);

    expect(resolvePluginDescriptors([descriptor], options)).toEqual(expected);
    expect(expected[0].entryName).toBe('plugins/plugins/html');
    expect(expected[0].entryPath).toBe('./plugins/html/index.js');
    expect(descriptor.source.location).toBe('./plugins/../plugins/html/');
});

test.each(['/plugins/html', 'C:\\plugins\\html', '../html', '../../html', 'plugins/../../html', '..\\html'])(
    'Отклоняет небезопасный local location: %s', (location) => {
        const descriptor = { ...html, source: { type: 'local', location } };
        expect(() => resolvePluginDescriptors([descriptor], options))
            .toThrow('local location must be relative and stay within core');
    }
);

test('Сохраняет причину ошибки resolution package', () => {
    const cause = new Error('Package subpath ./package.json is not defined by exports');
    const descriptor = { ...html, source: { type: 'package', location: 'html-package' } };
    const resolvePackage = () => { throw cause; };

    expect(() => resolvePluginDescriptors([descriptor], { ...options, resolvePackage }))
        .toThrow(expect.objectContaining({
            message: 'Cannot resolve package for plugin [html]: [html-package]',
            cause
        }));
});

test('Берёт id и несколько document types из descriptor', () => {
    const descriptor = { ...html, id: 'custom-html', documents: ['page', 'report'] };
    const [resolved] = resolvePluginDescriptors([descriptor], options);

    expect(resolved).toMatchObject({
        id: 'custom-html', documents: ['page', 'report'], entryName: 'plugins/plugins/html'
    });
});

describe('Валидация descriptors', () => {
    test('Отклоняет прежний формат plugins.json', () => {
        expect(() => resolvePluginDescriptors({ inbuilt: ['plugins/html'] }, options))
            .toThrow('plugins.json must contain an array of plugin descriptors');
    });

    test.each([
        ['null вместо descriptor', null, 'Each plugin descriptor must be an object'],
        ['отсутствующий id', { id: undefined }, 'Plugin id is required'],
        ['путь в id', { id: '../html' }, 'must start with a lowercase'],
        ['отсутствующий source', { source: undefined }, 'source must be an object'],
        ['неподдерживаемый source', { source: { type: 'remote' } }, 'unsupported source type [remote]'],
        ['пустые documents', { documents: [] }, 'must declare document types'],
        ['пустой document type', { documents: ['html', '  '] }, 'must declare document types'],
        ['отсутствующий location', { source: { type: 'local' } }, 'source location is required'],
        ['строковый lazy', { lazy: 'Y' }, 'lazy must be a boolean'],
        ['null вместо lazy', { lazy: null }, 'lazy must be a boolean']
    ])('Отклоняет %s', (_name, changes, message) => {
        const descriptor = changes === null ? null : { ...html, ...changes };
        expect(() => resolvePluginDescriptors([descriptor], options)).toThrow(message);
    });

    test.each([
        ['повторный id', { id: 'html' }, 'Plugin id [html] is declared more than once'],
        ['общий document type', { documents: ['html'] }, 'Document type [html] is declared by plugins [html] and [svg]']
    ])('Отклоняет %s', (_name, changes, message) => {
        const svg = { id: 'svg', documents: ['svg'], source: { type: 'local', location: 'plugins/svg' } };
        expect(() => resolvePluginDescriptors([html, { ...svg, ...changes }], options)).toThrow(message);
    });

    test('Отклоняет повторный document type внутри descriptor', () => {
        expect(() => resolvePluginDescriptors([{ ...html, documents: ['html', 'html'] }], options))
            .toThrow('Document type [html] is declared by plugins [html] and [html]');
    });

    test.each([
        ['package.json', 'plugins/html/package.json', 'Package'],
        ['entry', 'plugins/html/index.js', 'Entry']
    ])('Отклоняет отсутствующий local %s', (_name, location, label) => {
        const missingPath = path.resolve(options.rootDir, location);
        const existsSync = fs.existsSync;
        const spy = jest.spyOn(fs, 'existsSync').mockImplementation((file) => file !== missingPath && existsSync(file));
        try {
            expect(() => resolvePluginDescriptors([html], options))
                .toThrow(`${label} for plugin [html] was not found at [${missingPath}]`);
        } finally {
            spy.mockRestore();
        }
    });
});

describe('Источник package', () => {
    test.each([
        ['явный main', 'custom.js'],
        ['entry по умолчанию', undefined]
    ])('Разрешает установленный package: %s', (_name, main) => {
        // Подменяем только package metadata и resolution, не реальную dependency проекта.
        const packagePath = path.resolve(options.rootDir, 'plugins/html/package.json');
        const manifest = require(packagePath);
        const originalMain = manifest.main;
        const spy = jest.spyOn(fs, 'existsSync').mockReturnValue(true);
        const resolvePackage = jest.fn().mockReturnValue(packagePath);
        try {
            manifest.main = main;
            const descriptor = { ...html, lazy: true, source: { type: 'package', location: 'html-package' } };
            const [resolved] = resolvePluginDescriptors([descriptor], { ...options, resolvePackage });
            const entryPath = path.resolve(path.dirname(packagePath), main || 'index.js');

            expect(resolved).toEqual({
                id: 'html', documents: ['html'], lazy: true,
                entryName: 'plugins/packages/html', entryPath
            });
            expect(resolvePackage).toHaveBeenCalledWith('html-package/package.json', { paths: [options.rootDir] });
            expect(spy).toHaveBeenCalledWith(packagePath);
            expect(spy).toHaveBeenCalledWith(entryPath);
        } finally {
            manifest.main = originalMain;
            spy.mockRestore();
        }
    });

    test('Сообщает об ошибке resolve неустановленного package', () => {
        const descriptor = { ...html, source: { type: 'package', location: '@vue-config-test/missing-plugin' } };
        const resolvePackage = () => { throw new Error('Module not found'); };
        expect(() => resolvePluginDescriptors([descriptor], { ...options, resolvePackage }))
            .toThrow('Cannot resolve package for plugin [html]: [@vue-config-test/missing-plugin]');
    });
});
