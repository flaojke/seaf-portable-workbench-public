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
      Vladislav Markin <markinvy@yandex.ru>, Sber

  Contributors:
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2024
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import datasets from '../helpers/datasets.mjs';
import recalculateDatasets from '@back/helpers/recalculate-datasets.mjs';
import {isRolesMode} from '@back/utils/roles.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {getCachePrefixWithDomain} from '@back/helpers/cachePrefixByDomain.mjs';

const LOG_TAG = 'datasets-warmup';
const UPDATER_PREFIX = 'tmp-dataset-updater-prefix';
const logger = getLoggerWithTag(LOG_TAG);

export default async function warmup(storage, cache, isCluster, oldManifestMeta, processedDatasets) {
    logger.info(() => 'Datasets cache warm up started');
    let oldManifestHash = oldManifestMeta?.manifestHash;
    let cachePrefixTmp = UPDATER_PREFIX;
    if (storage.permission) {
        cachePrefixTmp = `${UPDATER_PREFIX}.${storage.permission}`;
    }

    const datasetUpdater = datasets(storage, null, cachePrefixTmp);
    const newManifestCachePrefix = getCachePrefixWithDomain(storage);
    // Посчитанное держим в памяти до конца прогрева: датасеты ссылаются друг на друга, и без этого
    // каждый читал бы свои источники из БД
    const problems = await cache.withWarmupMemory(cachePrefixTmp, async() => {
        const problems = await recalculateDatasets(
            isRolesMode() ? storage.manifests.origin : storage.manifest,
            datasetUpdater,
            processedDatasets
        );

        if (!isCluster || oldManifestHash !== storage.hash) {
            oldManifestHash && logger.debug(() => 'Зафиксировано изменение в манифесте или датасетах.');
            const cacheKeys = Object.keys(processedDatasets).map((key) => `{"path":"/datasets/${key}"}`);
            // Переноса дожидаемся: прогрев меню и валидаторы идут следом и читают датасеты уже из под нового
            // префикса. Сбой переноса загрузку не роняет - непрогретый датасет досчитается при первом обращении
            await cache.moveKeysInDataCache(cachePrefixTmp, newManifestCachePrefix, cacheKeys)
                .catch((error) => logger.error(() => `Moving ${cacheKeys.length} warmed up dataset(s) to manifest cache prefix failed`, error));
        } else {
            logger.debug(() => 'Не зафиксировано изменений в манифесте или датасетах.');
        }
        return problems;
    });

    if (problems.items.length > 0) storage.problems.push(problems);

    logger.info(() => 'Datasets cache warm up finished');
}
