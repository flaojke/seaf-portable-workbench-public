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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {Pool} from 'pg';
import cluster from 'node:cluster';
import {isMainThread} from 'node:worker_threads';
import {changeLoggerImpl, getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {mainLogger} from '@back/utils/logger/constLoggers.mjs';

// Пул создаётся ещё при импорте модулей - раньше, чем точка входа ставит основной логгер, - поэтому
// ставим его и здесь: повторная установка ни на что не влияет, а настройки пула попадают в лог
changeLoggerImpl(mainLogger);

const logger = getLoggerWithTag('b/d/p/pool');
let pool = null;

const enableConnectionStat = process.env.VUE_APP_DOCHUB_LOG_POSTGRES_CONNECTION?.toLowerCase() === 'y';

/**
 * Тип процесса или потока, в котором создаётся пул. Пул у каждого из них свой, а нагрузка разная,
 * поэтому параметры пула можно задать на тип процесса. Имена типов те же, что в
 * VUE_APP_DOCHUB_CLUSTER_NODE_PARAMS_*:
 *  MAIN - главный процесс (в кластере управляет подом и запросы не обслуживает, в режиме backend он единственный);
 *  WORKER - fork кластера, обслуживает запросы;
 *  RELOAD - поток загрузки манифестов.
 */
export function detectProcessType() {
    if (!isMainThread) return 'RELOAD';
    return cluster.isWorker ? 'WORKER' : 'MAIN';
}

/**
 * Читает числовой параметр пула: сначала значение для типа процесса (<name>_<processType>), затем
 * общее (<name>). Пустое и некорректное значение пропускается, как если бы его не задавали.
 */
function readPoolParam(env, name, processType, minValue, defaultValue) {
    for (const envName of [`${name}_${processType}`, name]) {
        const raw = env[envName];
        if (raw === undefined || raw.trim() === '') continue;
        const value = Number(raw);
        if (!isNaN(value) && value >= minValue) return value;
        logger.warn(() => `${envName}=${raw} is ignored: expected a number not less than ${minValue}`);
    }
    return defaultValue;
}

/**
 * Собирает настройки пула для типа процесса из переменных окружения
 * @param env - переменные окружения
 * @param processType - тип процесса или потока, см. detectProcessType
 */
export function resolvePoolConfig(env, processType) {
    return {
        'connectionString': env.VUE_APP_DOCHUB_POSTGRES_URL,
        max: readPoolParam(env, 'VUE_APP_POSTGRES_POOL_SIZE', processType, 1, 50),
        idleTimeoutMillis: readPoolParam(env, 'VUE_APP_POSTGRES_IDLE_TIMEOUT_SECONDS', processType, 0, 300) * 1000,
        connectionTimeoutMillis: readPoolParam(env, 'VUE_APP_POSTGRES_CONNECTION_TIMEOUT_SECONDS', processType, 0, 5) * 1000,
        allowExitOnIdle: false // предотвращает закрытие при простое
    };
}

const processType = detectProcessType();
const poolConfig = resolvePoolConfig(process.env, processType);

export function getPgPool() {
    if (!pool || pool.ending) {
        if (pool?.ending === true) {
            logger.info(() => 'postgres pool was closed by somebody, open new');
        }
        pool = new Pool(poolConfig);
        logger.info(() => `postgres pool for process type ${processType}: max ${poolConfig.max}, idle timeout ${poolConfig.idleTimeoutMillis} ms, connection timeout ${poolConfig.connectionTimeoutMillis} ms`);
        if (enableConnectionStat) {
            logger.debug(() => 'postgres pool metrics enabled');
            setupEventListeners(pool);
        } else {
            logger.debug(() => 'postgres pool metrics disabled. If need, may enabled by VUE_APP_DOCHUB_LOG_POSTGRES_CONNECTION env with "Y" value');
        }
        pool.on('error', (err) => {
            logger.error(() => 'error in pool', err);
        });
    }
    return pool;
}


const stats = {
    connectionsCreated: 0,      // connect
    connectionsDestroyed: 0,    // remove
    connectionsAcquired: 0,     // acquire
    connectionsReleased: 0,     // release
    errorsCount: 0,             // error
    openedConnection: 0,        // открытые соединения
    connectionInUse: 0          // соединения в использовании
};

function getInternalMetrics(pool) {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount
    };
}

function setupEventListeners(pool) {
    // Создано новое физическое соединение
    pool.on('connect', () => {
        stats.connectionsCreated++;
        stats.openedConnection++;

        logger.debug(() => [
            'pg pool create new connect',
            { title: 'event', obj: 'connect' },
            { title: 'stats', obj: { ...stats } },
            { title: 'poolInternal', obj: getInternalMetrics(pool) }
        ]);
    });

    // Клиент взят из пула
    pool.on('acquire', () => {
        stats.connectionsAcquired++;
        stats.connectionInUse++;
        logger.debug(() => [
            'pg pool use connect from pool',
            { title: 'event', obj: 'acquire' },
            { title: 'stats', obj: { ...stats } },
            { title: 'poolInternal', obj: getInternalMetrics(pool) }
        ]);
    });

    // Клиент возвращен в пул
    pool.on('release', (err) => {
        stats.connectionsReleased++;
        stats.connectionInUse = Math.max(0, stats.connectionInUse - 1);

        if (err) {
            stats.errorsCount++;
            logger.debug(() => [
                'pg pool error when release connect',
                { title: 'event', obj: 'release_error' },
                { title: 'error', obj: err.message },
                { title: 'stats', obj: { ...stats } },
                { title: 'poolInternal', obj: getInternalMetrics(pool) }
            ]);
        } else {
            logger.debug(() => [
                'pg pool success release connect',
                { title: 'event', obj: 'release' },
                { title: 'stats', obj: { ...stats } },
                { title: 'poolInternal', obj: getInternalMetrics(pool) }
            ]);
        }
    });

    // Соединение удалено из пула
    pool.on('remove', () => {
        stats.connectionsDestroyed++;
        stats.openedConnection = Math.max(0, stats.openedConnection - 1);

        // Если соединение было активным при удалении, уменьшаем и активные
        // Но берем Math.max чтобы не уйти в отрицательные, если уже учли в release
        if (stats.connectionInUse > 0) {
            stats.connectionInUse = Math.max(0, stats.connectionInUse - 1);
        }

        logger.debug(() => [
            'pg pool close connect',
            { title: 'event', obj: 'remove' },
            { title: 'stats', obj: { ...stats } },
            { title: 'poolInternal', obj: getInternalMetrics(pool) }
        ]);
    });

    // Ошибка на клиенте
    pool.on('error', (err) => {
        stats.errorsCount++;
        logger.debug(() => [
            'pg pool error on client when try to connect',
            { title: 'event', obj: 'connection_error' },
            { title: 'error', obj: err.message },
            { title: 'stats', obj: { ...stats } },
            { title: 'poolInternal', obj: getInternalMetrics(pool) }
        ]);
    });
}
