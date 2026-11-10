import type {
  CatalogPluginMetadata,
  LegacyPluginMetadata
} from './plugin-manager';

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
};

const isNonEmptyString = (value: unknown): value is string => {
  return typeof value === 'string' && value.trim().length > 0;
};

const isDocumentType = (value: unknown): value is string => {
  return isNonEmptyString(value)
    && /^[a-z0-9][a-z0-9-]*$/.test(value);
};

const isPluginMetadata = (value: unknown): value is LegacyPluginMetadata => {
  return isRecord(value)
    && isNonEmptyString(value.id)
    && Array.isArray(value.documents)
    && value.documents.every(isNonEmptyString)
    && isNonEmptyString(value.entry)
    && Array.isArray(value.scripts)
    && value.scripts.every(isNonEmptyString)
    && Array.isArray(value.styles)
    && value.styles.every(isNonEmptyString);
};

const isCatalogPluginMetadata = (
  value: unknown
): value is CatalogPluginMetadata => {
  return isPluginMetadata(value)
    && isRecord(value)
    && value.documents.length > 0
    && value.documents.every(isDocumentType)
    && new Set(value.documents).size === value.documents.length
    && isNonEmptyString(value.version)
    && typeof value.apiVersion === 'number'
    && Number.isInteger(value.apiVersion)
    && value.apiVersion > 0;
};

export const parsePluginMetadata = (
  value: unknown
): LegacyPluginMetadata[] => {
  if (
    !isRecord(value)
    || !Array.isArray(value.plugins)
    || !value.plugins.every(isPluginMetadata)
  ) {
    throw new Error('Некорректный формат metadata плагинов');
  }

  return value.plugins;
};

export const parsePluginCatalog = (
  value: unknown,
  runtimeApiVersion: number,
  onWarning: (message: string) => void
): CatalogPluginMetadata[] => {
  if (!isRecord(value)) {
    throw new Error('Некорректный формат каталога плагинов');
  }

  if (value.schemaVersion !== 1) {
    throw new Error(
      `Неподдерживаемая версия каталога плагинов: ${String(value.schemaVersion)}`
    );
  }

  if (!Array.isArray(value.plugins)) {
    throw new Error('Некорректный список плагинов в каталоге');
  }

  const plugins: CatalogPluginMetadata[] = [];

  for (const [index, plugin] of value.plugins.entries()) {
    if (!isCatalogPluginMetadata(plugin)) {
      onWarning(
        `Пропущена запись каталога [${index}]: некорректное описание плагина`
      );
      continue;
    }

    if (plugin.apiVersion !== runtimeApiVersion) {
      onWarning(
        `Плагин [${plugin.id}] пропущен: требуется API ${plugin.apiVersion}, `
        + `портал предоставляет API ${runtimeApiVersion}`
      );
      continue;
    }

    plugins.push(plugin);
  }

  return plugins;
};
