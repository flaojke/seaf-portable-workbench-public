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

import {afterEach, beforeEach, describe, expect, jest, test} from '@jest/globals';

// constLoggers.mjs тянет logger-factory.mjs с top-level await, невалидным под babel-jest; pool.mjs
// ставит этот логгер основным, поэтому его же и проверяем
const mockMainLogger = {error: jest.fn(), warn: jest.fn(), info: jest.fn(), debug: jest.fn(), trace: jest.fn()};
jest.mock('@back/utils/logger/constLoggers.mjs', () => ({__esModule: true, mainLogger: mockMainLogger}));

/** pool.mjs определяет тип процесса при загрузке, поэтому под каждый тип модуль загружается заново */
function loadPoolModule({isMainThread = true, isWorker = false} = {}) {
    jest.resetModules();
    jest.doMock('node:worker_threads', () => ({__esModule: true, isMainThread}));
    jest.doMock('node:cluster', () => ({__esModule: true, default: {isWorker}}));
    return require('@back/drivers/postgres/pool.mjs');
}

describe('detectProcessType: тип процесса или потока, которому принадлежит пул', () => {
    afterEach(() => {
        jest.dontMock('node:worker_threads');
        jest.dontMock('node:cluster');
    });

    test('главный процесс - MAIN', () => {
        expect(loadPoolModule().detectProcessType()).toBe('MAIN');
    });

    test('fork кластера - WORKER', () => {
        expect(loadPoolModule({isWorker: true}).detectProcessType()).toBe('WORKER');
    });

    test('поток загрузки манифестов - RELOAD', () => {
        expect(loadPoolModule({isMainThread: false}).detectProcessType()).toBe('RELOAD');
    });
});

describe('resolvePoolConfig: параметры пула из переменных окружения', () => {
    const {resolvePoolConfig} = loadPoolModule();
    const sizeOf = (env, processType) => resolvePoolConfig(env, processType).max;

    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('ничего не задано - прежние значения по умолчанию', () => {
        expect(resolvePoolConfig({}, 'WORKER')).toMatchObject({max: 50, idleTimeoutMillis: 300000, connectionTimeoutMillis: 5000});
    });

    test('общие значения действуют для любого типа процесса', () => {
        const env = {
            VUE_APP_POSTGRES_POOL_SIZE: '20',
            VUE_APP_POSTGRES_IDLE_TIMEOUT_SECONDS: '30',
            VUE_APP_POSTGRES_CONNECTION_TIMEOUT_SECONDS: '60'
        };

        for (const processType of ['MAIN', 'WORKER', 'RELOAD']) {
            expect(resolvePoolConfig(env, processType)).toMatchObject({max: 20, idleTimeoutMillis: 30000, connectionTimeoutMillis: 60000});
        }
    });

    test('значение для типа процесса важнее общего и не действует на другие типы', () => {
        const env = {
            VUE_APP_POSTGRES_POOL_SIZE: '20',
            VUE_APP_POSTGRES_POOL_SIZE_MAIN: '3',
            VUE_APP_POSTGRES_POOL_SIZE_RELOAD: '5',
            VUE_APP_POSTGRES_CONNECTION_TIMEOUT_SECONDS_RELOAD: '60',
            VUE_APP_POSTGRES_IDLE_TIMEOUT_SECONDS_WORKER: '15'
        };

        expect(resolvePoolConfig(env, 'MAIN')).toMatchObject({max: 3, idleTimeoutMillis: 300000, connectionTimeoutMillis: 5000});
        expect(resolvePoolConfig(env, 'RELOAD')).toMatchObject({max: 5, idleTimeoutMillis: 300000, connectionTimeoutMillis: 60000});
        expect(resolvePoolConfig(env, 'WORKER')).toMatchObject({max: 20, idleTimeoutMillis: 15000, connectionTimeoutMillis: 5000});
    });

    test('пустое или некорректное значение для типа процесса пропускается - действует общее', () => {
        expect(sizeOf({VUE_APP_POSTGRES_POOL_SIZE: '20', VUE_APP_POSTGRES_POOL_SIZE_RELOAD: ''}, 'RELOAD')).toBe(20);
        expect(sizeOf({VUE_APP_POSTGRES_POOL_SIZE: '20', VUE_APP_POSTGRES_POOL_SIZE_RELOAD: 'много'}, 'RELOAD')).toBe(20);
    });

    test('о пропущенном некорректном значении пишется предупреждение в лог', () => {
        resolvePoolConfig({VUE_APP_POSTGRES_POOL_SIZE_RELOAD: 'много', VUE_APP_POSTGRES_POOL_SIZE: '20'}, 'RELOAD');

        expect(mockMainLogger.warn).toHaveBeenCalledTimes(1);
        const [, message] = mockMainLogger.warn.mock.calls[0];
        expect(message()).toBe('VUE_APP_POSTGRES_POOL_SIZE_RELOAD=много is ignored: expected a number not less than 1');
    });

    test('некорректное общее значение пропускается - действует значение по умолчанию', () => {
        expect(sizeOf({VUE_APP_POSTGRES_POOL_SIZE: 'abc'}, 'WORKER')).toBe(50);
        expect(sizeOf({VUE_APP_POSTGRES_POOL_SIZE: '0'}, 'WORKER')).toBe(50);
        expect(sizeOf({VUE_APP_POSTGRES_POOL_SIZE: '-5'}, 'WORKER')).toBe(50);
    });

    test('0 для простоя и ожидания допустим: соединение не закрывается, ожидание не ограничено', () => {
        const config = resolvePoolConfig({
            VUE_APP_POSTGRES_IDLE_TIMEOUT_SECONDS: '0',
            VUE_APP_POSTGRES_CONNECTION_TIMEOUT_SECONDS_RELOAD: '0'
        }, 'RELOAD');

        expect(config).toMatchObject({idleTimeoutMillis: 0, connectionTimeoutMillis: 0});
    });
});

describe('getPgPool: создание пула', () => {
    test('действующие настройки пишутся в лог сразу при создании пула', async() => {
        jest.clearAllMocks();
        const {getPgPool} = loadPoolModule({isMainThread: false});

        const pool = getPgPool();
        getPgPool();

        const messages = mockMainLogger.info.mock.calls.map(([, message]) => message());
        expect(messages).toEqual(['postgres pool for process type RELOAD: max 50, idle timeout 300000 ms, connection timeout 5000 ms']);
        await pool.end();
    });
});
