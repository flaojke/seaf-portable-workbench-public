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
      R.Piontik <r.piontik@mail.ru> - 2023
      R.Piontik <r.piontik@mail.ru> - 2024
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2023
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2024
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2025
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Vladislav Markin, Sber - 2026
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import prototype from '../../global/manifest/services/cache.mjs';
import request from '../helpers/request.mjs';
import {fileURLToPath} from 'url';
import path from 'path';
import fs from 'fs';
import {randomUUID} from 'node:crypto';
import {BoundedCache} from '@global/helpers/bounded-cache.mjs';
import md5 from 'md5';
import createPostgresClient from '../drivers/postgres.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {CLUSTER_MANIFEST} from '@back/cluster/constants.mjs';
import {clearPullMemory, moveWarmedKeys, pullWithDriver, runWarmupWithMemory} from './cache-pull.mjs';
import { envelopeDocument } from '@global/helpers/api/envelope.js';

const LOG_TAG = 'manifest-cache';
const logger = getLoggerWithTag(LOG_TAG);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const cacheMode = (process.env.VUE_APP_DOCHUB_DATALAKE_CACHE || 'none').toLocaleLowerCase();

//редис удален в задаче ERA-1986 03.2026 спустя какое-то время эту проверку можно будет убрать как и остальные упоминания редиса
if (cacheMode === 'redis') {
    throw Error(`redis cache now not supported, check env VUE_APP_DOCHUB_DATALAKE_CACHE, current value ${cacheMode}`);
}

const pgClient = cacheMode === 'postgres' ? await createPostgresClient() : null;

function getDataMd5Key(prefix, key) {
    return `SEAF.cache.${prefix || 'unknown'}.${md5(key)}`;
}

// Кэш в памяти
const memoryCache = new BoundedCache(1000);
const fileRequests = new Map();

const errorType = {
    system: 'Внутрисистемная ошибка',
    syntax: 'Синтаксическая ошибка',
    net: 'Сетевая ошибка'
};

export default Object.assign(prototype, {

    isClusterCache: false,
    // Содержит ошибки, которые возникли за сессию
    errors: {},
    // Очищает регистр ошибок
    errorClear() {
        this.errors = {};
    },

    async getManifest(key) {
        try {
            return JSON.parse(await this.get(CLUSTER_MANIFEST + key));
        } catch (error) {
            logger.warn(() => `Get manifest from cache failed. Error ${error}`);
        }
        return undefined;
    },

    async get(key) {
      switch (cacheMode) {
        case 'postgres':
            return await pgClient.get(key);
        default: {
          return undefined;
        }
      }
    },

    async set(key, value) {
      switch (cacheMode) {
        case 'postgres':
            return await pgClient.set(key, value);
        default: {
          return undefined;
        }
      }
    },
    // Очистка кэша
    //  prefix - Префикс, который будет использован перед ключом
    async clearCache(prefix) {
      switch (cacheMode) {
        case 'none': return;
        case 'memory': await this.clearMemoryCache(); break;
        case 'postgres':
          await pgClient.clear(`SEAF.cache.${prefix || ''}`);
          await this.clearMemoryCache();
          break;
        default: {
          const cacheDir = path.resolve(__dirname, '../../../', cacheMode);
          fs.readdir(cacheDir, (err, files) => {
            if (err) throw err;
            for (const file of files) {
              fs.unlink(`${cacheDir}/${file}`, err => logger.error(() => 'clearCache fs error',  err));
            }
          });
        }
      }
    },
    async clearMemoryCache() {
        memoryCache.clear();
        clearPullMemory();
    },
    // Выполняет прогрев префикса, удерживая в памяти всё, что за это время под ним посчитано
    //  prefix - префикс кеша, под которым идёт прогрев, свой у этого прогрева
    //  warmup - сам прогрев
    async withWarmupMemory(prefix, warmup) {
        return cacheMode === 'postgres' ? await runWarmupWithMemory(prefix, warmup) : await warmup();
    },
    // Регистрирует ошибку
    // type         - Секция ошибки (system/syntax/net)
    // uid          - Уникальный идентификатор ошибки.
    // title        - Определяет представление ошибки в дереве.
    // location     - URL с расположением объекта, где выявлена ошибка.
    // correction   - Краткое пояснение, как исправить ошибку.
    // description  - Описание причины ошибки.
    registerError(type, uid, title, location, correction, description) {
        !this.errors[type] && (this.errors[type] = {
            id: `$error.${type}`,
            title: errorType[type] || 'Неизвестная ошибка',
            items: []
        });
        logger.error(() => `${title}: ${description} [${location}]`);
        this.errors[type].items.push({
            uid, title, location, correction, description
        });
    },
    objectToCache(obj) {
        const res = typeof obj === 'string' ? { SEAF_cache_string: obj } : obj;
        return JSON.stringify(res);
    },
    cacheToObject(cacheString) {
        const cacheObj = JSON.parse(cacheString);
        return cacheObj && Object.hasOwn(cacheObj, 'SEAF_cache_string') ? cacheObj.SEAF_cache_string : cacheObj;
    },
    // Получает данные из кэша
    //  prefix - Префикс, который будет использован перед ключом
    //  key - ключ
    //  resolve - если в кэше данные не будут найдены, будет вызвана функция для генерации данных
    //  res - response объект express. Если указано, то ответ сразу отправляется клиенту
    //  envelope - Если true, ответ упаковывается в транспортный формат
    async pullFromDataCache(prefix, key, resolve, res, envelope) {
        let fileName = null;
        const md5Key = getDataMd5Key(prefix, key);
        try {
            let result = null;

            switch (cacheMode) {
              case 'none':
                if(resolve) {
                  result = await resolve();
                } else {
                  result = undefined;
                }
                break;
              case 'memory':
                result = await memoryCache.pull(md5Key, resolve);
                break;
              case 'postgres':
                result = await pullWithDriver(this, pgClient, resolve, prefix, md5Key, key);
                break;
              default: {
                fileName = path.resolve(__dirname, '../../../', cacheMode, `${md5Key}.cache`);
                if (!fileRequests.has(fileName)) {
                    const destination = fileName;
                    const pending = (async() => {
                        try {
                            return this.cacheToObject(await fs.promises.readFile(destination, 'utf8'));
                        } catch (error) {
                            if (error.code !== 'ENOENT' || !resolve) throw error;
                        }
                        const value = await resolve();
                        const temporary = destination + '.' + randomUUID() + '.tmp';
                        try {
                            await fs.promises.writeFile(temporary, this.objectToCache(value ?? null), 'utf8');
                            await fs.promises.rename(temporary, destination);
                        } finally {
                            await fs.promises.unlink(temporary).catch(error => {
                                if (error.code !== 'ENOENT') throw error;
                            });
                        }
                        return value ?? null;
                    })().finally(() => fileRequests.delete(destination));
                    fileRequests.set(destination, pending);
                }
                result = await fileRequests.get(fileName);
              }
            }

            if (res) {
              if (envelope) {
                result = envelopeDocument(result);
              }
              res.status(200).json(result);
            }

            return res ? true : result;
        } catch (e) {
            const message = typeof e === 'string' ? e : e.message;
            this.registerError('system', md5Key, `Cache error while pulling ${key} (${md5Key})`, fileName || cacheMode, 'See error log at backed server', message);
            if (res) {
                res.status(500);
                res.json({
                    message,
                    error: e
                });
            }
            return Promise.reject(e);
        }
    },

    // Переносит данные кэша из под одного префикса под другой
    //  sourcePrefix - префикс, под которым данные лежат сейчас
    //  targetPrefix - префикс, под которым они должны оказаться
    //  keys - ключи переносимых данных, под обоими префиксами они одинаковые
    async moveKeysInDataCache(sourcePrefix, targetPrefix, keys) {
      if (keys.length === 0) return;
      const pairs = keys.map((key) => [getDataMd5Key(sourcePrefix, key), getDataMd5Key(targetPrefix, key)]);
      try {
        switch (cacheMode) {
          case 'none':
            return;
          case 'memory':
            for (const [source, target] of pairs) {
              memoryCache.move(source, target);
            }
            break;
          case 'postgres':
            await moveWarmedKeys(pgClient, sourcePrefix, pairs);
            break;
          default: {
            for (const [source, target] of pairs) {
              const sourceFileName = path.resolve(__dirname, '../../../', cacheMode, `${source}.cache`);
              const targetFileName = path.resolve(__dirname, '../../../', cacheMode, `${target}.cache`);
              await fs.promises.rename(sourceFileName, targetFileName).catch(error => {
                if (error.code !== 'ENOENT') throw error;
              });
            }
          }
        }
      } catch (e) {
        const message = typeof e === 'string' ? e : e.message;
        this.registerError('system', md5(`${sourcePrefix}:${targetPrefix}`), `Cache error while moving ${keys.length} key(s) from ${sourcePrefix} to ${targetPrefix}`, cacheMode, 'See error log at backed server', message);
        return Promise.reject(e);
      }
    },

    // Выполняет запрос к данным
    async request(url) {
        let result = null;
        try {
            result = await request(url);
        } catch(e) {
            this.registerError('net', md5(url), 'Request error', url, 'See details in error log of backed server', e.message);
            throw e;
        }
        logger.debug(() => `Source [${url}] is imported.`);
        return result;
    }
});

