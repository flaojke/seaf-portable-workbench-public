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

// Драйвер датасетов тянет jsonata и кеш, а сам расчёт здесь не проверяется: нас интересует только
// перенос прогретого из под временного префикса под префикс манифеста
jest.mock('@back/helpers/datasets.mjs', () => ({__esModule: true, default: jest.fn(() => ({}))}));
jest.mock('@back/helpers/recalculate-datasets.mjs', () => ({
    __esModule: true,
    // "посчитаны" все датасеты манифеста, проблем нет
    default: jest.fn(async(manifest, driver, processedDatasets) => {
        for (const key of Object.keys(manifest.datasets)) processedDatasets[key] = true;
        return {id: 'dataset--problems', title: 'Datasets', items: []};
    })
}));
jest.mock('@back/utils/roles.mjs', () => ({__esModule: true, isRolesMode: () => false}));

const warmup = require('@back/cluster/datasets-warmup.mjs').default;

const PERMISSION = 'bitbucket:era:repo_a';
const TMP_PREFIX = `tmp-dataset-updater-prefix.${PERMISSION}`;

const makeStorage = (datasetCount) => ({
    manifest: {datasets: Object.fromEntries(Array.from({length: datasetCount}, (_, i) => [`ds.${i}`, {}]))},
    hash: 'hNew', permission: PERMISSION, problems: []
});

describe('datasets-warmup: перенос прогретых датасетов под префикс манифеста', () => {
    let cache;

    beforeEach(() => {
        jest.clearAllMocks();
        cache = {
            moveKeysInDataCache: jest.fn(async() => undefined),
            withWarmupMemory: jest.fn(async(prefix, warmup) => await warmup())
        };
    });

    test('все датасеты переносятся одним вызовом, а не вызовом на датасет', async() => {
        await warmup(makeStorage(229), cache, true, {manifestHash: 'hOld'}, {});

        expect(cache.moveKeysInDataCache).toHaveBeenCalledTimes(1);
        const [sourcePrefix, targetPrefix, keys] = cache.moveKeysInDataCache.mock.calls[0];
        expect(sourcePrefix).toBe(TMP_PREFIX);
        expect(targetPrefix).toBe(`hNew.${PERMISSION}`);
        expect(keys).toHaveLength(229);
        expect(keys[0]).toBe('{"path":"/datasets/ds.0"}');
    });

    test('расчёт и перенос идут с памятью прогрева временного префикса', async() => {
        const recalculateDatasets = require('@back/helpers/recalculate-datasets.mjs').default;
        const order = [];
        cache.withWarmupMemory.mockImplementation(async(prefix, warmup) => {
            order.push('память открыта');
            const result = await warmup();
            order.push('память закрыта');
            return result;
        });
        recalculateDatasets.mockImplementationOnce(async(manifest, driver, processedDatasets) => {
            order.push('расчёт');
            processedDatasets['ds.0'] = true;
            return {items: []};
        });
        cache.moveKeysInDataCache.mockImplementation(async() => {
            order.push('перенос');
        });

        await warmup(makeStorage(1), cache, true, {manifestHash: 'hOld'}, {});

        expect(cache.withWarmupMemory).toHaveBeenCalledWith(TMP_PREFIX, expect.any(Function));
        expect(order).toEqual(['память открыта', 'расчёт', 'перенос', 'память закрыта']);
    });

    test('прогрев завершается только после переноса', async() => {
        let finishMove;
        cache.moveKeysInDataCache.mockReturnValue(new Promise((resolve) => {
            finishMove = resolve;
        }));
        let finished = false;

        const warmupPromise = warmup(makeStorage(2), cache, true, {manifestHash: 'hOld'}, {}).then(() => {
            finished = true;
        });
        await new Promise((resolve) => setImmediate(resolve));
        expect(finished).toBe(false);

        finishMove();
        await warmupPromise;
        expect(finished).toBe(true);
    });

    test('сбой переноса прогрев не роняет', async() => {
        cache.moveKeysInDataCache.mockRejectedValue(new Error('pg is down'));

        await expect(warmup(makeStorage(2), cache, true, {manifestHash: 'hOld'}, {})).resolves.toBeUndefined();
    });

    test('в кластере при неизменившемся hash переноса нет', async() => {
        await warmup(makeStorage(2), cache, true, {manifestHash: 'hNew'}, {});

        expect(cache.moveKeysInDataCache).not.toHaveBeenCalled();
    });
});
