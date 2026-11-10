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

// env.mjs использует import.meta.url и под babel-jest не грузится; драйверу от него нужны только
// настройки ретрая
jest.mock('@back/helpers/env.mjs', () => ({
    __esModule: true,
    PG_RETRY_COUNT_CONFIG: 0,
    PG_PAUSE_BETWEEN_RETRY_MS_CONFIG: 0
}));

// pool.mjs ставит основной логгер, а constLoggers.mjs тянет logger-factory.mjs с top-level await,
// невалидным под babel-jest
jest.mock('@back/utils/logger/constLoggers.mjs', () => ({
    __esModule: true,
    mainLogger: {error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn(), trace: jest.fn()}
}));

const {PostgresCacheDriver} = require('@back/drivers/postgres.mjs');

// Пул, который считает выданные соединения и запоминает запросы каждого из них
function fakePool({failOn, rowCount = 7} = {}) {
    const clients = [];
    return {
        clients,
        query: jest.fn(async() => ({rowCount})),
        connect: jest.fn(async() => {
            const client = {
                queries: [],
                query: jest.fn(async(text, params) => {
                    client.queries.push({text: text.replace(/\s+/g, ' ').trim(), params});
                    if (failOn && text.includes(failOn)) throw new Error('boom');
                }),
                release: jest.fn()
            };
            clients.push(client);
            return client;
        })
    };
}

describe('PostgresCacheDriver.renameMany: перенос значений пачкой', () => {
    let pool;
    let driver;

    beforeEach(() => {
        pool = fakePool();
        driver = new PostgresCacheDriver(() => pool);
    });

    test('вся пачка идёт одной транзакцией на одном соединении', async() => {
        const pairs = Array.from({length: 300}, (_, i) => [`from.${i}`, `to.${i}`]);

        await driver.renameMany(pairs);

        expect(pool.connect).toHaveBeenCalledTimes(1);
        const [client] = pool.clients;
        expect(client.queries.map((query) => query.text.split(' ')[0])).toEqual(['BEGIN', 'DELETE', 'UPDATE', 'COMMIT']);
        expect(client.release).toHaveBeenCalledTimes(1);
    });

    test('старые значения целевых ключей удаляются, исходные переезжают на их место', async() => {
        await driver.renameMany([['from.a', 'to.a'], ['from.b', 'to.b']]);

        const [, deleteQuery, updateQuery] = pool.clients[0].queries;
        expect(deleteQuery.params).toEqual([['to.a', 'to.b']]);
        expect(updateQuery.params).toEqual([['from.a', 'from.b'], ['to.a', 'to.b']]);
    });

    test('пустая пачка соединение не занимает', async() => {
        await driver.renameMany([]);

        expect(pool.connect).not.toHaveBeenCalled();
    });

    test('при ошибке транзакция откатывается, соединение возвращается в пул', async() => {
        pool = fakePool({failOn: 'UPDATE'});
        driver = new PostgresCacheDriver(() => pool);

        await expect(driver.renameMany([['from.a', 'to.a']])).rejects.toThrow('boom');

        const [client] = pool.clients;
        expect(client.queries.map((query) => query.text.split(' ')[0])).toEqual(['BEGIN', 'DELETE', 'UPDATE', 'ROLLBACK']);
        expect(client.release).toHaveBeenCalledTimes(1);
    });
});

describe('PostgresCacheDriver.removeOldSeafCacheData: очистка кеша данных', () => {
    test('удаляется всё, что лежит не под актуальными hash, возвращается число удалённых ключей', async() => {
        const pool = fakePool();
        const driver = new PostgresCacheDriver(() => pool);

        const deleted = await driver.removeOldSeafCacheData(['hA', 'hC']);

        expect(deleted).toBe(7);
        expect(pool.query).toHaveBeenCalledTimes(1);
        const [text, params] = pool.query.mock.calls[0];
        expect(text.replace(/\s+/g, ' ')).toContain('WHERE c.id LIKE \'SEAF.cache.%\' AND split_part(c.id, \'.\', 3) <> ALL($1::varchar[])');
        expect(params).toEqual([['hA', 'hC']]);
    });
});

describe('PostgresCacheDriver.setIfPossible: запись под блокировкой ключа', () => {
    test('проверка блокировки и запись идут одним запросом, выделенное соединение не берётся', async() => {
        const pool = fakePool({rowCount: 1});
        const driver = new PostgresCacheDriver(() => pool);

        await driver.setIfPossible('key', 'value');

        expect(pool.connect).not.toHaveBeenCalled();
        expect(pool.query).toHaveBeenCalledTimes(1);
        const [text, params] = pool.query.mock.calls[0];
        const query = text.replace(/\s+/g, ' ');
        expect(query).toContain('INSERT INTO cache (id, value) SELECT $1::varchar, $2::text');
        // тот же ключ блокировки, что брала прежняя реализация: при выкатке старые и новые поды видят друг друга
        expect(query).toContain('WHERE pg_try_advisory_xact_lock(hashtextextended($1::text, 0))');
        expect(query).toContain('ON CONFLICT (id) DO UPDATE SET value = EXCLUDED.value');
        expect(params).toEqual(['key', 'value']);
    });

    test('блокировка свободна - значение записано', async() => {
        const driver = new PostgresCacheDriver(() => fakePool({rowCount: 1}));

        expect(await driver.setIfPossible('key', 'value')).toBe(true);
    });

    test('блокировка занята - запись пропущена без ошибки', async() => {
        const driver = new PostgresCacheDriver(() => fakePool({rowCount: 0}));

        expect(await driver.setIfPossible('key', 'value')).toBe(false);
    });

    test('set по умолчанию пишет под блокировкой', async() => {
        const pool = fakePool({rowCount: 1});
        const driver = new PostgresCacheDriver(() => pool);

        await driver.set('key', 'value');

        expect(pool.query).toHaveBeenCalledTimes(1);
        expect(pool.query.mock.calls[0][0]).toContain('pg_try_advisory_xact_lock');
    });
});
