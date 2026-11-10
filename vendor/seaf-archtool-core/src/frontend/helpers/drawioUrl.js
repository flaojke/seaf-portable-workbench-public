/*
  Copyright (C) 2023 Sber

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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
      Vladislav Markin, Sber - 2026
*/

import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import env from '@front/helpers/env';

const logger = getLoggerWithTag('f/h/drawioUrl');

const DEFAULT_DRAWIO_BASE_URI = 'https://embed.diagrams.net/';

const DRAWIO_DEFAULT_PARAMS = {
  embed: '1',
  ui: 'atlas',
  spin: '1',
  modified: 'unsavedChanges',
  saveAndExit: '0',
  noExitBtn: '1',
  proto: 'json'
};

/**
 * Resolve DrawIO host+path from env (backend env-config first, then build-time envar).
 * A relative path (e.g. /drawio/) is resolved against the page origin.
 * Search/hash from the envar are dropped.
 * Falls back to DEFAULT_DRAWIO_BASE_URI when missing or unparseable.
 */
function resolveDrawioBaseUri(raw = env.drawioServerUri) {
  if (!raw || typeof raw !== 'string' || !raw.trim()) {
    return DEFAULT_DRAWIO_BASE_URI;
  }
  try {
    const url = new URL(raw.trim(), typeof window !== 'undefined' ? window.location.origin : undefined);
    if (url.search || url.hash) {
      logger.warn(() =>
        `VUE_APP_DOCHUB_PLUGIN_DRAWIO_SERVER_URI query/hash ignored; use VUE_APP_DOCHUB_PLUGIN_DRAWIO_URL_PARAMS or drawio_url_params instead. Raw: ${raw}`
      );
    }
    const path = url.pathname.endsWith('/') ? url.pathname : `${url.pathname}/`;
    return `${url.origin}${path}`;
  } catch (error) {
    logger.warn(() =>
      `Invalid VUE_APP_DOCHUB_PLUGIN_DRAWIO_SERVER_URI "${raw}", falling back to ${DEFAULT_DRAWIO_BASE_URI}. ${error}`
    );
    return DEFAULT_DRAWIO_BASE_URI;
  }
}

function coerceParamValue(value) {
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value === 'string') {
    return value;
  }
  return null;
}

/**
 * Normalize string (query) or flat object into a plain string map.
 * Nested objects/arrays and invalid values are skipped.
 */
function parseDrawioUrlParams(input) {
  if (input == null || input === '') {
    return {};
  }

  if (typeof input === 'string') {
    const query = input.trim().replace(/^\?/, '');
    if (!query) {
      return {};
    }
    const result = {};
    new URLSearchParams(query).forEach((value, key) => {
      if (key) {
        result[key] = value;
      }
    });
    return result;
  }

  if (typeof input === 'object' && !Array.isArray(input)) {
    const result = {};
    for (const [key, value] of Object.entries(input)) {
      if (!key || typeof key !== 'string') {
        continue;
      }
      const coerced = coerceParamValue(value);
      if (coerced === null) {
        logger.warn(() => `Skipping invalid drawio url param "${key}" (type ${typeof value})`);
        continue;
      }
      result[key] = coerced;
    }
    return result;
  }

  logger.warn(() => `Ignoring drawio url params of unsupported type: ${typeof input}`);
  return {};
}

/**
 * Merge param layers: defaults → global → document → mandatory (later wins).
 */
function mergeDrawioUrlParams({
  defaults = {},
  globalParams = {},
  documentParams = {},
  mandatory = {}
} = {}) {
  return {
    ...parseDrawioUrlParams(defaults),
    ...parseDrawioUrlParams(globalParams),
    ...parseDrawioUrlParams(documentParams),
    ...parseDrawioUrlParams(mandatory)
  };
}

export function buildDrawioUrl({
  componentDefaults = {},
  documentParams = {},
  componentMandatory = {}
} = {}) {
  const defaults = {...DRAWIO_DEFAULT_PARAMS, ...componentDefaults};
  const globalParams = env.drawioUrlParams;
  const baseUri = resolveDrawioBaseUri();
  const merged = mergeDrawioUrlParams({
    defaults,
    globalParams,
    documentParams,
    mandatory: componentMandatory
  });
  const search = new URLSearchParams(merged).toString();
  return search ? `${baseUri}?${search}` : baseUri;
}
