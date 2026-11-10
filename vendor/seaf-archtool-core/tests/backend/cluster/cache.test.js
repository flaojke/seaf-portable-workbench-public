/*
  Copyright (C) 2026 Sber

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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber

  Contributors:
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {beforeEach, describe, expect, jest, test} from '@jest/globals';

process.env.VUE_APP_DOCHUB_DATALAKE_CACHE = 'postgres';

jest.mock('@back/drivers/postgres.mjs', () => ({__esModule: true, default: jest.fn()}));

const {combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');
const {ClusterCache} = require('@back/cluster/cache.mjs');

describe('ClusterCache.clearCache: очистка кеша данных после загрузки манифестов', () => {
    let cacheDriver;
    let clusterCache;

    beforeEach(async() => {
        cacheDriver = {
            getValuesWhereKeyStartWith: jest.fn(async() => []),
            removeOldSeafCacheData: jest.fn(async() => 0)
        };
        require('@back/drivers/postgres.mjs').default.mockResolvedValue(cacheDriver);
        clusterCache = new ClusterCache();
        await clusterCache.init();
    });

    test('данные актуальных манифестов, включая связку роли с общим манифестом, в очистку не попадают', async() => {
        cacheDriver.getValuesWhereKeyStartWith.mockResolvedValue([
            JSON.stringify({permission: 'role_a', manifestHash: 'hA'}),
            JSON.stringify({permission: '__common', manifestHash: 'hC'})
        ]);

        await clusterCache.clearCache();

        expect(cacheDriver.getValuesWhereKeyStartWith).toHaveBeenCalledWith('SEAF.manifest.meta__');
        expect(cacheDriver.removeOldSeafCacheData).toHaveBeenCalledTimes(1);
        const [actualHashes] = cacheDriver.removeOldSeafCacheData.mock.calls[0];
        expect(actualHashes.sort()).toEqual(['hA', 'hC', combineManifestHashes(['hA', 'hC'])].sort());
    });

    test('меты манифестов нет - актуальных hash нет, из кеша ничего не удаляется', async() => {
        cacheDriver.getValuesWhereKeyStartWith.mockResolvedValue([]);

        await clusterCache.clearCache();

        expect(cacheDriver.removeOldSeafCacheData).not.toHaveBeenCalled();
    });

    test('ни в одной мете нет hash (манифесты ещё не загружались) - из кеша ничего не удаляется', async() => {
        cacheDriver.getValuesWhereKeyStartWith.mockResolvedValue([
            JSON.stringify({permission: 'role_a', error: 'load failed'}),
            JSON.stringify({})
        ]);

        await clusterCache.clearCache();

        expect(cacheDriver.removeOldSeafCacheData).not.toHaveBeenCalled();
    });

    test('мету прочитать не удалось - из кеша ничего не удаляется', async() => {
        cacheDriver.getValuesWhereKeyStartWith.mockRejectedValue(new Error('pg is down'));

        await expect(clusterCache.clearCache()).resolves.toBeUndefined();

        expect(cacheDriver.removeOldSeafCacheData).not.toHaveBeenCalled();
    });

    test('мета повреждена - из кеша ничего не удаляется', async() => {
        cacheDriver.getValuesWhereKeyStartWith.mockResolvedValue(['{не json']);

        await clusterCache.clearCache();

        expect(cacheDriver.removeOldSeafCacheData).not.toHaveBeenCalled();
    });
});
