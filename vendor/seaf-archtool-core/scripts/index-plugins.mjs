// @ts-check
/* eslint-disable no-console */
import {
  lstat,
  mkdir,
  readFile,
  readdir,
  rename,
  writeFile
} from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

/**
 * @typedef {import('../src/types/plugin-descriptor').PluginCatalogEntry} PluginCatalogEntry
 * @typedef {import('../src/types/plugin-descriptor').PluginCatalog} PluginCatalog
 */

// Формирует public/plugins/catalog.json из описаний и файлов отдельно собранных плагинов.
// Код плагинов не выполняется: регистрацию типов и совместимость проверяет портал.
// После изменения набора сборок каталог нужно сформировать и опубликовать заново.

/**
 * @param {unknown} value
 * @returns {value is Record<string, unknown>}
 */
const isRecord = (value) => {
  return typeof value === 'object'
    && value !== null
    && !Array.isArray(value);
};
/**
 * @param {unknown} value
 * @returns {value is string}
 */
const isNonEmptyString = (value) => {
  return typeof value === 'string' && value.trim().length > 0;
};

/**
 * @param {unknown} value
 * @returns {value is string}
 */
const isDocumentType = (value) => {
  return isNonEmptyString(value)
    && /^[a-z0-9][a-z0-9-]*$/.test(value);
};

// Эти папки используются сборкой локальных plugins core.
const reservedDirectoryNames = new Set(['plugins', 'packages']);

// Без аргумента используем public/plugins core; заданный путь — относительно cwd.
const pluginsDirectory = process.argv[2]
  ? path.resolve(process.argv[2])
  : fileURLToPath(new URL('../public/plugins/', import.meta.url));
const catalogPath = path.join(pluginsDirectory, 'catalog.json');
const temporaryCatalogPath = `${catalogPath}.tmp`;

/**
 * @param {string} pluginDirectory
 * @param {unknown} relativePath
 * @param {string} fieldName
 * @returns {Promise<string>}
 */
const resolvePluginFile = async(pluginDirectory, relativePath, fieldName) => {
  if (!isNonEmptyString(relativePath)) {
    throw new Error(`${fieldName} must be a non-empty string`);
  }

  if (relativePath.includes('\\')) {
    throw new Error(`${fieldName} must use forward slashes`);
  }

  // Формат описания использует «/» на всех ОС; выход за папку плагина запрещён.
  const normalizedPath = path.posix.normalize(relativePath);

  if (
    normalizedPath === '.'
    || normalizedPath.startsWith('../')
    || path.posix.isAbsolute(normalizedPath)
  ) {
    throw new Error(`${fieldName} must point inside the plugin directory`);
  }

  const absolutePath = path.resolve(
    pluginDirectory,
    ...normalizedPath.split('/')
  );

  // Повторная проверка границ после преобразования пути средствами ОС.
  const relativeToPlugin = path.relative(pluginDirectory, absolutePath);

  if (
    relativeToPlugin === '..'
    || relativeToPlugin.startsWith(`..${path.sep}`)
    || path.isAbsolute(relativeToPlugin)
  ) {
    throw new Error(`${fieldName} must point inside the plugin directory`);
  }

  // lstat отклоняет конечную символическую ссылку, но не проверяет ссылки
  // в промежуточных папках. Это проверка доверенной поставки, не изоляция.
  const fileStats = await lstat(absolutePath);

  if (!fileStats.isFile()) {
    throw new Error(`${fieldName} does not point to a regular file`);
  }

  return normalizedPath;
};

// Кодируем сегменты отдельно, чтобы специальные символы не меняли структуру URL.
/**
 * @param {string} pluginDirectoryName
 * @param {string} relativePath
 * @returns {string}
 */
const toPublicUrl = (pluginDirectoryName, relativePath) => {
  const encodedPath = relativePath
    .split('/')
    .map(encodeURIComponent)
    .join('/');

  return `/plugins/${encodeURIComponent(pluginDirectoryName)}/${encodedPath}`;
};

/**
 * @param {import('node:fs').Dirent} directoryEntry
 * @returns {Promise<PluginCatalogEntry>}
 */
const readPlugin = async(directoryEntry) => {
  const pluginDirectory = path.join(
    pluginsDirectory,
    directoryEntry.name
  );

  const descriptorPath = path.join(pluginDirectory, 'plugin.json');
  const descriptorSource = await readFile(descriptorPath, 'utf8');
  /** @type {unknown} */
  const descriptor = JSON.parse(descriptorSource);

  if (!isRecord(descriptor)) {
    throw new Error('plugin.json must contain an object');
  }

  if (descriptor.schemaVersion !== 1) {
    throw new Error('unsupported schemaVersion');
  }

  if (
    !isNonEmptyString(descriptor.id)
    || !/^[a-z0-9][a-z0-9-]*$/.test(descriptor.id)
  ) {
    throw new Error('id has an invalid format');
  }

  if (!isNonEmptyString(descriptor.version)) {
    throw new Error('version is required');
  }

  // Проверка формата apiVersion не подтверждает совместимость с API портала.
  if (
    typeof descriptor.apiVersion !== 'number'
    || !Number.isInteger(descriptor.apiVersion)
    || descriptor.apiVersion < 1
  ) {
    throw new Error('apiVersion must be a positive integer');
  }

  if (
    !Array.isArray(descriptor.documents)
    || descriptor.documents.length === 0
    || descriptor.documents.some((item) => !isDocumentType(item))
  ) {
    throw new Error(
      'documents must contain lowercase document types using letters, digits and hyphens'
    );
  }

  if (new Set(descriptor.documents).size !== descriptor.documents.length) {
    throw new Error('documents contains duplicate document types');
  }

  if (
    !Array.isArray(descriptor.styles)
    || descriptor.styles.some((item) => !isNonEmptyString(item))
  ) {
    throw new Error('styles must be an array of file paths');
  }

  // Независимые проверки файлов выполняются параллельно до включения в каталог.
  const [entry, styles] = await Promise.all([
    resolvePluginFile(pluginDirectory, descriptor.entry, 'entry'),
    Promise.all(
      descriptor.styles.map((style, index) => {
        return resolvePluginFile(
          pluginDirectory,
          style,
          `styles[${index}]`
        );
      })
    )
  ]);

  return {
    id: descriptor.id,
    version: descriptor.version,
    apiVersion: descriptor.apiVersion,
    documents: descriptor.documents,
    entry: toPublicUrl(directoryEntry.name, entry),
    scripts: [],
    styles: styles.map((style) => {
      return toPublicUrl(directoryEntry.name, style);
    })
  };
};

const generateCatalog = async() => {
  await mkdir(pluginsDirectory, { recursive: true });

  const entries = await readdir(pluginsDirectory, {
    withFileTypes: true
  });

  // Пропуск из каталога не мешает сборке скопировать конфликтующие файлы.
  for (const entry of entries) {
    if (reservedDirectoryNames.has(entry.name)) {
      throw new Error(
        `Directory "${entry.name}" is reserved for built-in plugin assets`
      );
    }
  }

  const directoryEntries = entries
    .filter((entry) => {
      if (entry.isSymbolicLink()) {
        console.error(
          `[plugins] Skipping "${entry.name}": symbolic links are not supported`
        );
        return false;
      }

      return entry.isDirectory();
    })
    // Независимый от языковых настроек порядок обеспечивает одинаковый выбор при конфликтах.
    .sort((left, right) => {
      if (left.name < right.name) return -1;
      if (left.name > right.name) return 1;
      return 0;
    });

  /** @type {PluginCatalogEntry[]} */
  const plugins = [];
  /** @type {Set<string>} */
  const pluginIds = new Set();
  /** @type {Map<string, string>} */
  const documentTypeOwners = new Map();

  // При конфликте побеждает первый корректный плагин в порядке имён папок.
  // Конфликты со встроенными типами core здесь не проверяются.
  for (const directoryEntry of directoryEntries) {
    try {
      const plugin = await readPlugin(directoryEntry);

      if (pluginIds.has(plugin.id)) {
        throw new Error(`plugin id "${plugin.id}" is already registered`);
      }

      for (const documentType of plugin.documents) {
        const owner = documentTypeOwners.get(documentType);

        if (owner) {
          throw new Error(
            `document type "${documentType}" is already registered by "${owner}"`
          );
        }
      }

      // Резервируем типы только после всех проверок: отклонённый плагин не должен
      // блокировать часть типов для следующих плагинов.
      pluginIds.add(plugin.id);

      for (const documentType of plugin.documents) {
        documentTypeOwners.set(documentType, plugin.id);
      }

      plugins.push(plugin);
      console.log(`[plugins] Loaded plugin: ${plugin.id}`);
    } catch (error) {
      // Ошибка одного плагина не должна мешать подготовке остальных.
      const message = error instanceof Error
        ? error.message
        : String(error);

      console.error(
        `[plugins] Skipping "${directoryEntry.name}": ${message}`
      );
    }
  }

  /** @type {PluginCatalog} */
  const catalog = {
    schemaVersion: 1,
    plugins
  };

  // Замена через rename не позволяет читателю получить недописанный JSON.
  // Каталог заменяется целиком. Параллельные запуски не предусмотрены:
  // они используют один временный файл.
  await writeFile(
    temporaryCatalogPath,
    `${JSON.stringify(catalog, null, 2)}\n`,
    'utf8'
  );

  await rename(temporaryCatalogPath, catalogPath);

  console.log(
    `[plugins] Catalog generated: ${plugins.length} plugin(s)`
  );
};

try {
  if (process.argv.length > 3) {
    throw new Error('Usage: npm run plugins:index -- [directory]');
  }

  await generateCatalog();
} catch (error) {
  // Только ошибка общей операции даёт ненулевой код завершения;
  // пропуск отдельных плагинов не считается сбоем утилиты.
  console.error('[plugins] Failed to generate catalog', error);
  process.exitCode = 1;
}
