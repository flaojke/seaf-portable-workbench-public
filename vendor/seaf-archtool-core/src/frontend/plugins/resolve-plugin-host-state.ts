import type { PluginHostState } from '@front/types/plugin-host-state';

export interface PluginHostStateContext {
  isReloading: boolean;
  hasRenderer: boolean;
  pluginsReady: boolean;
  hasProfile: boolean;
  hasAvailablePlugin: boolean;
  hasMetadataError: boolean;
  hasPluginError: boolean;
}

export const resolvePluginHostState = ({
  isReloading,
  hasRenderer,
  pluginsReady,
  hasProfile,
  hasAvailablePlugin,
  hasMetadataError,
  hasPluginError
}: PluginHostStateContext): PluginHostState => {
  // При смене документа не показываем ошибку предыдущей загрузки.
  if (isReloading) {
    return 'loading';
  }

  // Ошибка metadata не мешает уже зарегистрированному renderer.
  if (hasRenderer) {
    return 'ready';
  }

  if (!pluginsReady || !hasProfile) {
    return 'loading';
  }

  if (hasMetadataError) {
    return 'metadata-error';
  }

  if (hasPluginError) {
    return 'plugin-error';
  }

  return hasAvailablePlugin ? 'loading' : 'unknown';
};
