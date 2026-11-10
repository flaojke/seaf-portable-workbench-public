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
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      Navasardyan Suren, Sber - 2023
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2023
      Saveliy Zaznobin <zaznobins@yandex.ru> - 2025
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2024
      Nikolay Temnyakov <temnjakovn@gmail.com>, Sber - 2023
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Vladislav Markin, Sber - 2026
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import requests from './requests';
import query from '../manifest/query';
import source from '../../global/datasets/source.mjs';
import datasetDriver from '@global/datasets/driver.mjs';
import pathTool from '@global/manifest/tools/path.mjs';
import env from '@front/helpers/env';
import { PerformanceLogger } from '@global/logger/perf-logger.mjs';
import {getLogger, getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {unenvelopeDocument} from '@global/helpers/api/unenvelope.js';
import {datasetSourceKey, pullDatasetSource} from '@front/helpers/datasetSourceCache';

const LOG_TAG = 'dataset-driver';
const logger = getLoggerWithTag(LOG_TAG);

export default function() {
  return Object.assign({
      parentParseSource: datasetDriver.parseSource
    }, datasetDriver,
    {
      // Дефолтный метод получения объекта данных
      dsResolver(datasetID) {
        const state = window.Vuex.state;
        return {
          // Обогащаем профиль информацией об идентификаторе
          subject: Object.assign({_id: datasetID}, (state.manifest.datasets || {})[datasetID]),
          baseURI: state.sources[`/datasets/${datasetID}`][0]
        };
      },
      pathResolver(path) {
        if (env.isBackendMode)
          throw `pathResolver is not correct call for backend mode ... [${path}]`;
        const state = window.Vuex.state;
        return {
          context: state.manifest,
          subject: pathTool.get(state.manifest, path),
          baseURI: (state.sources[path] || ['/'])[0]
        };
      },
      // Драйвер запросов к ресурсам
      request(url, baseURI) {
        return requests.request(url, baseURI);
      },
      // Драйвер запросов JSONata
      jsonataDriver: query,
      performanceLogger: env.isPerfLoggerEnabled ? new PerformanceLogger(getLogger()) : null,
      async parseSource(context, data, subject, params, baseURI, datasetsWithError) {
        const sourceType = source.type(data);
        // С учетом subject: .yaml у dataset с type: manifest — вложенный манифест, иначе файл данных
        const loadedSourceType = source.type(data, subject);
        if (sourceType === 'id' && env.isPlugin() && env.isCacheMode) {
          const args = {context, data, subject, params, baseURI};
          return await window.$PAPI.pullFromCache(`{"path":"/datasets/${data}"}`, async() => {
            return await this.parentParseSource(context, data, subject, params, baseURI, undefined, datasetsWithError);
          }, args)
            .catch((error) => {
              if (!datasetsWithError[data]) datasetsWithError[data] = {uri: baseURI, error};
              throw error;
            });
        } else if (['data-file', 'data-manifest'].includes(loadedSourceType)) {
          // Файл данных и вложенный манифест загружаются один раз на загрузку манифеста, а не при каждом обращении к dataset
          return await pullDatasetSource(window.Vuex?.state?.moment, datasetSourceKey(loadedSourceType, baseURI, data), () => {
            return this.parentParseSource(context, data, subject, params, baseURI, undefined, datasetsWithError);
          })
            .catch((error) => {
              if (datasetsWithError && !datasetsWithError[data]) datasetsWithError[data] = {uri: baseURI, error};
              throw error;
            });
        } else {
          return await this.parentParseSource(context, data, subject, params, baseURI, undefined, datasetsWithError);
        }
      },
      // Переопределяем метод получения данных для работы с бэком
      getDataOriginal: datasetDriver.getData,
      async getData(context, subject, params, baseURI, datasetsWithError) {
        if (env.isBackendMode) {
          const url = 'backend://release-data-profile';
          const body = {
            query: subject,
            params: params || null,
            baseURI
          };
          if (env.isEnvelopedRequests) {
            body.envelope = true;
          }
          try {
            const response = await requests.request(url, null, { method: 'POST', data: body });
            let result = response.data;
            if (env.isEnvelopedRequests) {
              result = unenvelopeDocument(result);
            }
            return result;
          } catch (e) {
            if (e?.response?.data) {
              logger.error(() => `Error request to url ${url}`, e);
              let errorResponse = e.response.data.message ?? e.response.data;
              if ((!errorResponse || Object.keys(errorResponse).length === 0) && e.response.status) {
                errorResponse = `Http error: ${e.response.status}`;
              }
              return Promise.reject(errorResponse);
            } else return Promise.reject(e);
          }
        } else return await this.getDataOriginal(context, subject, params, baseURI, datasetsWithError);
      },
      getReleaseData: datasetDriver.releaseData,
      async releaseData(path, params) {
        if (env.isBackendMode) {
          const body = {
            query: path,
            params: params || null
          };
          if (env.isEnvelopedRequests) {
            body.envelope = true;
          }
          let result = (await requests.request('backend://release-data-profile', null, {
            method: 'POST',
            data: body
          })).data;
          if (env.isEnvelopedRequests) {
            result = unenvelopeDocument(result);
          }
          return result;
        } else return await this.getReleaseData(path, params);
      }
    });
}
