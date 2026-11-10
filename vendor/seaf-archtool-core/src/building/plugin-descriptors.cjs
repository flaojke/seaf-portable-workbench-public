// @ts-check
const fs = require('fs');
const path = require('path');

/** @param {unknown} value */
const isNonEmptyString = (value) => typeof value === 'string' && Boolean(value.trim());

/**
 * Разрешает descriptors в webpack entries. Проверки уникальности действуют в пределах одного вызова.
 * @param {import('../types/plugin-descriptor').PluginsConfiguration} descriptors
 * @param {{ rootDir: string, isPluginMode: boolean, defaultLazyLoading: boolean,
 *   resolvePackage?: typeof require.resolve }} options
 */
function resolvePluginDescriptors(descriptors, {
    rootDir,
    isPluginMode,
    defaultLazyLoading,
    resolvePackage = require.resolve
}) {
    if (!Array.isArray(descriptors)) {
        throw new Error('plugins.json must contain an array of plugin descriptors');
    }

    const registeredPluginIds = new Set();
    const documentTypeOwners = new Map();

    return descriptors.map((descriptor) => {
        if (descriptor === null || typeof descriptor !== 'object' || Array.isArray(descriptor)) {
            throw new Error('Each plugin descriptor must be an object');
        }
        if (!isNonEmptyString(descriptor.id)) {
            throw new Error('Plugin id is required');
        }
        // ID используется в именах артефактов package.
        if (!/^[a-z0-9][a-z0-9-]*$/.test(descriptor.id)) {
            throw new Error(
                `Plugin id [${descriptor.id}] must start with a lowercase `
                + 'Latin letter or digit and contain only lowercase Latin '
                + 'letters, digits and hyphens'
            );
        }
        if (descriptor.lazy !== undefined && typeof descriptor.lazy !== 'boolean') {
            throw new Error(`Plugin [${descriptor.id}] lazy must be a boolean`);
        }

        const source = descriptor.source;
        if (source === null || typeof source !== 'object' || Array.isArray(source)) {
            throw new Error(`Plugin [${descriptor.id}] source must be an object`);
        }
        if (source.type !== 'local' && source.type !== 'package') {
            throw new Error(`Plugin [${descriptor.id}] has unsupported source type [${source.type}]`);
        }
        if (!Array.isArray(descriptor.documents) || !descriptor.documents.length
            || descriptor.documents.some((type) => !isNonEmptyString(type))) {
            throw new Error(`Plugin [${descriptor.id}] must declare document types`);
        }
        if (!isNonEmptyString(source.location)) {
            throw new Error(`Plugin [${descriptor.id}] source location is required`);
        }
        if (registeredPluginIds.has(descriptor.id)) {
            throw new Error(`Plugin id [${descriptor.id}] is declared more than once`);
        }
        for (const documentType of descriptor.documents) {
            const currentOwner = documentTypeOwners.get(documentType);
            if (currentOwner) {
                throw new Error(
                    `Document type [${documentType}] is declared by plugins `
                    + `[${currentOwner}] and [${descriptor.id}]`
                );
            }
            documentTypeOwners.set(documentType, descriptor.id);
        }
        registeredPluginIds.add(descriptor.id);

        const isLocal = source.type === 'local';
        let location = source.location;
        let packagePath;
        if (isLocal) {
            // Одинаковые пути дают одинаковые имена chunks; путь не должен выходить за корень core.
            location = path.posix.normalize(location.replace(/\\/g, '/')).replace(/\/$/, '');
            const relative = path.relative(rootDir, path.resolve(rootDir, location));
            if (path.posix.isAbsolute(source.location) || path.win32.isAbsolute(source.location)
                || relative === '..' || relative.startsWith(`..${path.sep}`) || path.isAbsolute(relative)) {
                throw new Error(`Plugin [${descriptor.id}] local location must be relative and stay within core`);
            }
            packagePath = path.resolve(rootDir, location, 'package.json');
        } else {
            try {
                packagePath = resolvePackage(`${location}/package.json`, { paths: [rootDir] });
            } catch (error) {
                throw new Error(
                    `Cannot resolve package for plugin [${descriptor.id}]: [${location}]`,
                    { cause: error }
                );
            }
        }

        if (!fs.existsSync(packagePath)) {
            throw new Error(`Package for plugin [${descriptor.id}] was not found at [${packagePath}]`);
        }
        const config = require(packagePath);
        const entry = config.main || 'index.js';
        const absoluteEntryPath = path.resolve(path.dirname(packagePath), entry);
        if (!fs.existsSync(absoluteEntryPath)) {
            throw new Error(`Entry for plugin [${descriptor.id}] was not found at [${absoluteEntryPath}]`);
        }

        // Для local имя entry строится из нормализованного location, для package — из id.
        return {
            id: descriptor.id,
            documents: descriptor.documents,
            lazy: !isPluginMode && (descriptor.lazy ?? defaultLazyLoading),
            entryName: isLocal ? `plugins/${location}` : `plugins/packages/${descriptor.id}`,
            entryPath: isLocal ? `./${path.posix.join(location, entry)}` : absoluteEntryPath
        };
    });
}

module.exports = { resolvePluginDescriptors };
