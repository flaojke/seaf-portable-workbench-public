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

// env.mjs использует import.meta.url и под babel-jest не грузится; здесь нужен только предел длины значения
jest.mock('@back/helpers/env.mjs', () => ({__esModule: true, MAX_CACHE_LINE_LENGTH: 1000}));

/** Память и блокировки живут в модуле, поэтому каждому тесту модуль загружается заново */
function loadCachePull() {
    jest.resetModules();
    return require('@back/storage/cache-pull.mjs');
}

// тот же формат строки в БД, что у cache.mjs
const cache = {
    objectToCache: (obj) => JSON.stringify(obj),
    cacheToObject: (line) => JSON.parse(line)
};

/** БД в памяти со счётчиками обращений */
function makeDriver(rows = {}) {
    const store = new Map(Object.entries(rows));
    return {
        store,
        get: jest.fn(async(md5Key) => store.get(md5Key) ?? null),
        set: jest.fn(async(md5Key, value) => {
            store.set(md5Key, value);
        }),
        renameMany: jest.fn(async(pairs) => {
            for (const [source, target] of pairs) {
                if (store.has(source)) {
                    store.set(target, store.get(source));
                    store.delete(source);
                }
            }
        })
    };
}

const PREFIX = 'hash.permission';
const WARMUP_PREFIX = 'tmp-dataset-updater-prefix.permission';

describe('pullWithDriver: память процесса перед БД', () => {
    let cachePull;
    let driver;
    const pull = (md5Key, resolve, prefix = PREFIX) => cachePull.pullWithDriver(cache, driver, resolve, prefix, md5Key, md5Key);

    beforeEach(() => {
        cachePull = loadCachePull();
        driver = makeDriver();
    });

    test('промах: значение считается, пишется в БД и повторно не читается и не считается', async() => {
        const resolve = jest.fn(async() => ({a: 1}));

        const first = await pull('k', resolve);
        const second = await pull('k', resolve);

        expect(first).toEqual({a: 1});
        expect(second).toBe(first);
        expect(resolve).toHaveBeenCalledTimes(1);
        expect(driver.get).toHaveBeenCalledTimes(1);
        expect(driver.store.get('k')).toBe('{"value":{"a":1}}');
    });

    test('значение есть в БД - берётся оттуда без расчёта', async() => {
        driver = makeDriver({k: '{"value":{"a":1}}'});
        const resolve = jest.fn();

        expect(await pull('k', resolve)).toEqual({a: 1});
        expect(resolve).not.toHaveBeenCalled();
        expect(driver.set).not.toHaveBeenCalled();
    });

    test('пустой результат запоминается: повторное обращение не читает БД и не считает заново', async() => {
        const resolve = jest.fn(async() => undefined);

        expect(await pull('k', resolve)).toBeUndefined();
        expect(await pull('k', resolve)).toBeUndefined();
        expect(await pull('k', resolve)).toBeUndefined();

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test('пустой результат, поднятый из БД, тоже запоминается', async() => {
        // так в БД выглядит датасет без результата: поле value при сериализации пропало
        driver = makeDriver({k: '{}'});

        expect(await pull('k', jest.fn())).toBeUndefined();
        expect(await pull('k', jest.fn())).toBeUndefined();

        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test.each([[null], [0], [false], [42]])('значение %p запоминается так же, как пустое', async(value) => {
        const resolve = jest.fn(async() => value);

        expect(await pull('k', resolve)).toBe(value);
        expect(await pull('k', resolve)).toBe(value);

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test('строка не запоминается: её размер не ограничен, читаем из БД', async() => {
        const resolve = jest.fn(async() => 'text');

        expect(await pull('k', resolve)).toBe('text');
        expect(await pull('k', resolve)).toBe('text');

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(driver.get).toHaveBeenCalledTimes(2);
    });

    test('значения нет и посчитать нечем - ничего не запоминается, позже его можно посчитать', async() => {
        expect(await pull('k', undefined)).toBeNull();

        expect(await pull('k', async() => ({a: 1}))).toEqual({a: 1});
        expect(driver.set).toHaveBeenCalledTimes(1);
    });

    test('параллельные обращения к одному ключу считают его один раз', async() => {
        const resolve = jest.fn(async() => ({a: 1}));

        const results = await Promise.all(Array.from({length: 10}, () => pull('k', resolve)));

        expect(resolve).toHaveBeenCalledTimes(1);
        expect(driver.get).toHaveBeenCalledTimes(1);
        results.forEach((result) => expect(result).toBe(results[0]));
    });

    test('слишком длинное значение не пишется в БД и не запоминается', async() => {
        const resolve = jest.fn(async() => ({big: 'x'.repeat(2000)}));

        await expect(pull('k', resolve)).rejects.toThrow('over limit');
        await expect(pull('k', resolve)).rejects.toThrow('over limit');

        expect(driver.set).not.toHaveBeenCalled();
        expect(resolve).toHaveBeenCalledTimes(2);
    });

    test('после сброса памяти значение снова читается из БД', async() => {
        await pull('k', async() => ({a: 1}));

        cachePull.clearPullMemory();
        await pull('k', jest.fn());

        expect(driver.get).toHaveBeenCalledTimes(2);
    });
});

describe('runWarmupWithMemory: память прогрева префикса', () => {
    let cachePull;
    let driver;
    const pull = (md5Key, resolve, prefix = WARMUP_PREFIX) => cachePull.pullWithDriver(cache, driver, resolve, prefix, md5Key, md5Key);

    beforeEach(() => {
        cachePull = loadCachePull();
        driver = makeDriver();
    });

    test('под префиксом прогрева БД не читается: значение сразу считается и пишется', async() => {
        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            expect(await pull('k', async() => ({a: 1}))).toEqual({a: 1});
        });

        expect(driver.get).not.toHaveBeenCalled();
        expect(driver.store.get('k')).toBe('{"value":{"a":1}}');
    });

    test('датасет с десятками источников: источники не читаются из БД ни до расчёта, ни повторно', async() => {
        const origins = Array.from({length: 19}, (_, i) => `origin.${i}`);
        const resolveOrigin = jest.fn(async() => ({rows: []}));

        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            // первый датасет запрашивает все источники разом, второй - те же источники ещё раз
            await pull('wide.1', async() => await Promise.all(origins.map((origin) => pull(origin, resolveOrigin))));
            await pull('wide.2', async() => await Promise.all(origins.map((origin) => pull(origin, resolveOrigin))));
        });

        expect(driver.get).not.toHaveBeenCalled();
        expect(resolveOrigin).toHaveBeenCalledTimes(19);
        expect(driver.set).toHaveBeenCalledTimes(21);
    });

    test('записи прогрева идут в БД по одной, даже когда источники посчитаны одновременно', async() => {
        let writing = 0;
        let maxWriting = 0;
        driver.set.mockImplementation(async(md5Key, value) => {
            writing++;
            maxWriting = Math.max(maxWriting, writing);
            await new Promise((resolve) => setImmediate(resolve));
            driver.store.set(md5Key, value);
            writing--;
        });
        const origins = Array.from({length: 19}, (_, i) => `origin.${i}`);

        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            await Promise.all(origins.map((origin) => pull(origin, async() => ({origin}))));
        });

        expect(maxWriting).toBe(1);
        expect(driver.store.size).toBe(19);
    });

    test('сбой одной записи прогрева достаётся только её ключу, остальные пишутся', async() => {
        driver.set.mockImplementation(async(md5Key, value) => {
            if (md5Key === 'origin.1') throw new Error('pg is down');
            driver.store.set(md5Key, value);
        });

        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            const results = await Promise.allSettled(['origin.0', 'origin.1', 'origin.2'].map((origin) => pull(origin, async() => ({origin}))));

            expect(results.map((result) => result.status)).toEqual(['fulfilled', 'rejected', 'fulfilled']);
            // незаписанное в память не попало: следующее обращение посчитает и запишет заново
            driver.set.mockImplementation(async(md5Key, value) => {
                driver.store.set(md5Key, value);
            });
            await pull('origin.1', async() => ({origin: 'origin.1'}));
        });

        expect([...driver.store.keys()].sort()).toEqual(['origin.0', 'origin.1', 'origin.2']);
    });

    test('вне прогрева записи разных ключей друг друга не ждут', async() => {
        let writing = 0;
        let maxWriting = 0;
        driver.set.mockImplementation(async() => {
            writing++;
            maxWriting = Math.max(maxWriting, writing);
            await new Promise((resolve) => setImmediate(resolve));
            writing--;
        });

        await Promise.all(['a', 'b', 'c'].map((key) => pull(key, async() => ({key}), PREFIX)));

        expect(maxWriting).toBe(3);
    });

    test('пустой результат прогрева тоже остаётся в памяти', async() => {
        const resolve = jest.fn(async() => undefined);

        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            await pull('k', resolve);
            await pull('k', resolve);
        });

        expect(resolve).toHaveBeenCalledTimes(1);
    });

    test('другие префиксы во время прогрева работают как обычно', async() => {
        driver = makeDriver({other: '{"value":{"b": 2}}'});

        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            expect(await pull('other', jest.fn(), PREFIX)).toEqual({b: 2});
        });

        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test('после прогрева память отпускается: тот же префикс снова читает БД', async() => {
        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            await pull('k', async() => undefined);
        });

        await pull('k', jest.fn());

        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test('память отпускается и при ошибке прогрева', async() => {
        await expect(cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            await pull('k', async() => undefined);
            throw new Error('warmup failed');
        })).rejects.toThrow('warmup failed');

        await pull('k', jest.fn());

        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test('сброс памяти процесса посреди прогрева его память не трогает', async() => {
        const resolve = jest.fn(async() => ({a: 1}));

        await cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
            await pull('k', resolve);
            cachePull.clearPullMemory();
            await pull('k', resolve);
        });

        expect(resolve).toHaveBeenCalledTimes(1);
    });
});

describe('moveWarmedKeys: прогретое переезжает под префикс манифеста', () => {
    const PAIRS = [['tmp.k', 'new.k'], ['tmp.empty', 'new.empty'], ['tmp.unknown', 'new.unknown']];
    let cachePull;
    let driver;
    const pull = (md5Key, resolve, prefix) => cachePull.pullWithDriver(cache, driver, resolve, prefix, md5Key, md5Key);
    const value = {a: 1};

    /** Прогрев двух ключей и их перенос; результат переноса отдаётся вызывающему */
    const warmupAndMove = () => cachePull.runWarmupWithMemory(WARMUP_PREFIX, async() => {
        await pull('tmp.k', async() => value, WARMUP_PREFIX);
        await pull('tmp.empty', async() => undefined, WARMUP_PREFIX);
        await cachePull.moveWarmedKeys(driver, WARMUP_PREFIX, PAIRS);
    });

    beforeEach(() => {
        cachePull = loadCachePull();
        driver = makeDriver();
    });

    test('ключи переезжают в БД, а читающие из под нового префикса берут их из памяти', async() => {
        await warmupAndMove();

        expect(driver.renameMany).toHaveBeenCalledWith(PAIRS);
        expect([...driver.store.keys()].sort()).toEqual(['new.empty', 'new.k']);
        expect(await pull('new.k', jest.fn(), PREFIX)).toBe(value);
        expect(await pull('new.empty', jest.fn(), PREFIX)).toBeUndefined();
        expect(driver.get).not.toHaveBeenCalled();

        // о ключе, которого в прогреве не было, память ничего не знает
        await pull('new.unknown', undefined, PREFIX);
        expect(driver.get).toHaveBeenCalledTimes(1);
    });

    test('перенос в БД упал - посчитанное всё равно берётся из памяти и заново не считается', async() => {
        driver.renameMany.mockRejectedValue(new Error('pg is down'));
        const resolve = jest.fn();

        await expect(warmupAndMove()).rejects.toThrow('pg is down');

        expect(await pull('new.k', resolve, PREFIX)).toBe(value);
        expect(await pull('new.empty', resolve, PREFIX)).toBeUndefined();
        expect(resolve).not.toHaveBeenCalled();
        expect(driver.get).not.toHaveBeenCalled();
    });

    test('вне прогрева переносится только БД', async() => {
        driver = makeDriver({'tmp.k': '{"value":{"a":1}}'});

        await cachePull.moveWarmedKeys(driver, WARMUP_PREFIX, [['tmp.k', 'new.k']]);

        expect(driver.store.has('new.k')).toBe(true);
        expect(await pull('new.k', jest.fn(), PREFIX)).toEqual({a: 1});
        expect(driver.get).toHaveBeenCalledTimes(1);
    });
});
