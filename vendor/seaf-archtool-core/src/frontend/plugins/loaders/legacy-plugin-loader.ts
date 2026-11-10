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
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
*/

import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import type {
  LegacyPluginMetadata
} from '../plugin-manager';

const logger = getLoggerWithTag('f/p/legacy-plugin-loader');

import {
  loadStylesheet
} from './stylesheet-loader';

const loadScript = (
  url: string
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');

    script.src = url;

    script.onload = () => {
      resolve();
    };

    script.onerror = () => {
      script.remove();

      reject(
        new Error(`Не удалось загрузить плагин [${url}]`)
      );
    };

    document.head.appendChild(script);
  });
};

// Общие чанки и стили могут требоваться нескольким плагинам, поэтому каждый URL
// загружается один раз. Неудачная загрузка из кэша убирается, чтобы её можно было повторить.
const loads = new Map<string, Promise<void>>();

const loadOnce = (
  url: string,
  load: (url: string) => Promise<void>
): Promise<void> => {
  const current = loads.get(url);

  if (current) return current;

  const load$ = load(url).catch((error: unknown) => {
    loads.delete(url);
    throw error;
  });

  loads.set(url, load$);

  return load$;
};

export const loadLegacyPlugin = async(
  plugin: LegacyPluginMetadata
): Promise<void> => {
  const stylesLoad = Promise.allSettled(
    plugin.styles.map((styleUrl) => loadOnce(styleUrl, loadStylesheet))
  ).then((results) => {
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        logger.warn(
          () => `Не удалось загрузить стили плагина [${plugin.id}]: `
            + `[${plugin.styles[index]}]`,
          result.reason
        );
      }
    });
  });

  // Entry плагина стартует только после загрузки общих чанков, от которых он зависит.
  const scriptsLoad = Promise.all(
    plugin.scripts.map((scriptUrl) => loadOnce(scriptUrl, loadScript))
  ).then(() => loadOnce(plugin.entry, loadScript));

  await Promise.all([
    stylesLoad,
    scriptsLoad
  ]);
};
