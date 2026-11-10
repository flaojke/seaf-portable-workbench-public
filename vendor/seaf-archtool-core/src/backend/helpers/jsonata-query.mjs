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
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2025
      Vladislav Markin, Sber - 2026
*/

import datasets from '../helpers/datasets.mjs';
import cache from '../storage/cache.mjs';
import {isRolesMode} from '../utils/roles.mjs';
import {getCachePrefixWithDomain} from '@back/helpers/cachePrefixByDomain.mjs';

// Создает ответ на JSONata запрос и при необходимости кэширует ответ
// app - express app instance
// query - jsonata запрос
// [res] - http response object (опционально)
// [envelope] - Если true, ответ упаковывается в транспортный формат (опционально)
// [params] - параметры jsonata запроса (опционально)
// [subject] - request query subject (опционально)
// [roleId] - role id текущего пользователя
export async function makeJSONataQueryResponse(
    storage,
    query,
    res,
    envelope,
    params,
    subject,
    roleId
) {
    let key;
    if (isRolesMode()) {
        key = {query, params, subject, roleId};
    } else {
        key = {query, params, subject};
    }
    const cachePrefix = getCachePrefixWithDomain(storage);
    return await cache
        .pullFromDataCache(
            cachePrefix,
            JSON.stringify(key),
            async() => {
                let manifest;
                if (roleId) {
                    manifest = storage.manifests[roleId];
                } else {
                    manifest = isRolesMode() ? storage.manifests.origin : storage.manifest;
                }
                return await datasets(storage, roleId, cachePrefix).parseSource(
                    manifest,
                    query,
                    subject,
                    params
                );
            },
            res,
            envelope
        )
        // eslint-disable-next-line @typescript-eslint/no-empty-function -- ошибка уже обработана и отправлена через res внутри pullFromDataCache
        .catch(() => {
        });
}

