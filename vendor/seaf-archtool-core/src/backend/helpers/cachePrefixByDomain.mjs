/*
  Copyright (C) 2025 Sber

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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import md5 from 'md5';
import {DEFAULT_PERMISSION_FOR_COMMON_MANIFEST} from '@back/cluster/constants.mjs';

/**
 * Получить префикс для кеша, составляется их hash манифеста и домена при наличии
 * @param storage - storage: манифест вместе с hash/permission/md5Map
 * @param hash - опциональный параметр, если надо указать другой хеш, например для старого манифеста
 * @returns {string}
 */
export function getCachePrefixWithDomain(storage, hash = storage.hash) {
    let cachePrefixReal = hash;
    if (storage.permission) {
        cachePrefixReal = `${hash}.${storage.permission}`;
    }
    return cachePrefixReal;
}

/**
 * Комбинирует уже известные (посчитанные при загрузке каждого манифеста по отдельности) hash
 * произвольного числа permission в один детерминированный hash их join'а - без повторного
 * хеширования содержимого. Одна и та же формула нужна и на writer'е, и на reader'е - иначе
 * прогретые данные не совпадут по ключу кеша с тем, что запросит пользователь. Порядок важен:
 * оба вызывающих должны передавать hash'и в одном и том же (permission-) порядке.
 *
 * Результат хешируется до фиксированной длины, а не склеивается через '_': иначе при join'е двух
 * и более полноразмерных hash'ей ключ кеша превышает лимит колонки cache.id varchar(128).
 * @param {string[]} hashes
 * @returns {string}
 */
export function combineManifestHashes(hashes) {
    return md5(hashes.join('_'));
}

/**
 * Собирает hash'и, под которыми в кеше данных лежат значения актуальных манифестов: по ним после
 * перезагрузки отличают живые записи от устаревших. Источник - мета манифестов, а не блобы: hash
 * в блоб не входит.
 *
 * Роль отдаётся пользователю в связке с общим манифестом, и ключ кеша тогда строится по комбинации
 * их hash'ей, поэтому для каждой роли учитываются оба варианта - свой hash (общего манифеста нет)
 * и комбинация с hash'ем общего манифеста.
 * @param {Object[]} manifestMetas - мета всех манифестов (значения CLUSTER_MANIFEST_META)
 * @returns {string[]}
 */
export function collectActualCacheHashes(manifestMetas) {
    const loadedMetas = manifestMetas.filter((meta) => meta?.manifestHash);
    const commonHash = loadedMetas.find((meta) => meta.permission === DEFAULT_PERMISSION_FOR_COMMON_MANIFEST)?.manifestHash;
    const hashes = new Set();
    for (const meta of loadedMetas) {
        hashes.add(meta.manifestHash);
        if (commonHash && meta.permission !== DEFAULT_PERMISSION_FOR_COMMON_MANIFEST) {
            // порядок тот же, что у joinStorages на записи и на чтении: роль, затем общий манифест
            hashes.add(combineManifestHashes([meta.manifestHash, commonHash]));
        }
    }
    return [...hashes];
}
