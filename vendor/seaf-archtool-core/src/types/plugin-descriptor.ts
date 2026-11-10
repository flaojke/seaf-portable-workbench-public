export type PluginSourceType = 'local' | 'package';

export interface PluginSource {
  type: PluginSourceType;
  location: string;
}

export interface PluginDescriptor {
  id: string;
  documents: string[];
  source: PluginSource;
  // Если не задано, наследует VUE_APP_DOCHUB_PLUGINS_LAZY_LOADING. В IDE всегда eager.
  lazy?: boolean;
}

export type PluginsConfiguration = PluginDescriptor[];

export interface PluginBundleDescriptor {
  schemaVersion: 1;
  id: string;
  version: string;
  apiVersion: number;
  documents: string[];
  entry: string;
  styles: string[];
}

export interface PluginCatalogEntry
  extends Omit<PluginBundleDescriptor, 'schemaVersion'> {
  scripts: string[];
}

export interface PluginCatalog {
  schemaVersion: 1;
  plugins: PluginCatalogEntry[];
}
