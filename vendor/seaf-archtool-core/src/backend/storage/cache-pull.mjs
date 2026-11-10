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

/**
 * Получение значения кеша данных, который хранится в БД: память процесса перед БД, расчёт при промахе
 * и запись посчитанного. Вынесено из cache.mjs, чтобы не тянуть за собой его зависимости.
 *
 * Память здесь двух видов:
 *  - память процесса живёт до сброса (clearPullMemory) и держит объекты слабыми ссылками: под нагрузкой
 *    запросов значений слишком много, чтобы удерживать их все;
 *  - память прогрева (runWarmupWithMemory) живёт, пока идёт прогрев одного префикса, и держит всё
 *    посчитанное сильными ссылками.
 */

import {performance} from 'node:perf_hooks';
import {Mutex} from 'async-mutex';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {MAX_CACHE_LINE_LENGTH} from '@back/helpers/env.mjs';

const logger = getLoggerWithTag('manifest-cache');

/** md5-ключ -> WeakRef на объект либо {scalar} для пустого значения, числа и boolean */
let processMemory = new Map();
/** md5-ключ -> Mutex: расчёт и запись одного ключа не идут в этом процессе параллельно */
let locks = new Map();
/**
 * префикс кеша -> его прогрев: values - память прогрева (md5-ключ -> значение), lastWrite - последняя
 * поставленная запись в БД, за которой встаёт следующая
 */
const warmupByPrefix = new Map();

function remember(md5Key, value) {
    if (value !== null && typeof value === 'object') {
        // eslint-disable-next-line no-undef
        processMemory.set(md5Key, new WeakRef(value));
    } else if (typeof value !== 'string') {
        // Пустой результат - тоже результат: без записи о нём каждое обращение читало бы БД заново.
        // Слабой ссылкой его не удержать, поэтому храним само значение
        processMemory.set(md5Key, {scalar: value});
    } else {
        // Строку слабой ссылкой тоже не удержать, а размер её не ограничен - не запоминаем
        processMemory.delete(md5Key);
    }
}

/** @returns {{value: any}|undefined} undefined, если память о ключе ничего не знает */
function recall(md5Key) {
    const entry = processMemory.get(md5Key);
    if (!entry) {
        return undefined;
    }
    if ('scalar' in entry) {
        return {value: entry.scalar};
    }
    const value = entry.deref();
    return value === undefined ? undefined : {value};
}

/**
 * Отдаёт значение ключа: из памяти, из БД либо посчитав его через resolve и записав в БД.
 * @param cache - реализация кеша: формат строки в БД (objectToCache/cacheToObject)
 * @param driver - драйвер БД
 * @param resolve - считает значение при промахе; без него промах отдаёт то, что вернула БД
 * @param prefix - префикс кеша, которому принадлежит ключ
 * @param md5Key - ключ в БД
 * @param key - исходный ключ, для логов
 */
export async function pullWithDriver(cache, driver, resolve, prefix, md5Key, key) {
    if (!locks.has(md5Key)) {
        locks.set(md5Key, new Mutex());
    }
    return await locks.get(md5Key).runExclusive(async() => {
        const warmup = warmupByPrefix.get(prefix);
        const warmupMemory = warmup?.values;
        if (warmupMemory?.has(md5Key)) {
            logger.trace(() => `pullWithDriver: key ${key} (${md5Key}) found in warmup memory`);
            return warmupMemory.get(md5Key);
        }
        const remembered = warmupMemory ? undefined : recall(md5Key);
        if (remembered) {
            logger.trace(() => `pullWithDriver: key ${key} (${md5Key}) found in memory cache`);
            return remembered.value;
        }

        // Под префиксом прогрева в БД лежит только то, что посчитано в этом же прогреве, а оно уже в
        // его памяти: читать БД незачем, сразу считаем
        const cached = warmupMemory && resolve ? null : await driver.get(md5Key);
        let result = cached;
        if (cached) {
            logger.trace(() => `pullWithDriver: get ${key} (${md5Key}) len ${cached.length}`);
            result = cache.cacheToObject(cached)?.value;
        } else if (resolve) {
            const startTime = performance.now();
            result = await resolve();
            const cacheLine = cache.objectToCache({value: result});
            const cacheLineLength = cacheLine?.length;
            logger.trace(() => `pullWithDriver: resolve ${key} (${md5Key}) ` + (cacheLine ? `len ${cacheLineLength}` : 'nothing') + `. Time: ${performance.now() - startTime}ms`);
            if (cacheLineLength > MAX_CACHE_LINE_LENGTH) {
                throw Error(`Save value to cache by key ${key} over limit (length: ${cacheLineLength}, limit: ${MAX_CACHE_LINE_LENGTH}), md5key = [${md5Key}]`);
            }
            await (warmup ? writeInTurn(warmup, () => driver.set(md5Key, cacheLine)) : driver.set(md5Key, cacheLine));
        } else {
            // значения нет ни в БД, ни способа его посчитать - запоминать нечего
            return result;
        }

        if (warmupMemory) {
            warmupMemory.set(md5Key, result);
        } else {
            remember(md5Key, result);
        }
        return result;
    });
}

/**
 * Ставит запись прогрева в очередь за предыдущей. Источники одного датасета считаются одновременно и
 * писались бы в БД тоже одновременно, каждый своим соединением; по очереди им хватает одного.
 */
function writeInTurn(warmup, write) {
    const written = warmup.lastWrite.then(write);
    // сбой одной записи достаётся только её датасету, очередь идёт дальше
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    warmup.lastWrite = written.catch(() => {});
    return written;
}

/**
 * Выполняет прогрев префикса, удерживая в памяти всё, что за это время под ним посчитано. Префикс
 * должен быть своим у прогрева: его данные считаются с нуля, из БД под ним ничего не читается, а
 * записи в БД идут по одной.
 *
 * Без этого посчитанное перечитывалось бы из БД - при каждом обращении к датасету, чей результат
 * успел уйти из памяти процесса, - а датасет с десятками источников читал и писал бы их все разом,
 * каждый отдельным соединением.
 * @param prefix - префикс кеша, под которым идёт прогрев
 * @param warmup - сам прогрев
 */
export async function runWarmupWithMemory(prefix, warmup) {
    if (warmupByPrefix.has(prefix)) {
        // вложенный вызов: память уже держит внешний
        return await warmup();
    }
    warmupByPrefix.set(prefix, {values: new Map(), lastWrite: Promise.resolve()});
    try {
        return await warmup();
    } finally {
        warmupByPrefix.delete(prefix);
    }
}

/**
 * То, что память прогрева знает о ключах, переходит в память процесса под новыми ключами: читающие
 * следом из под нового префикса не пойдут за тем же в БД.
 */
function carryWarmupMemory(sourcePrefix, pairs) {
    const warmupMemory = warmupByPrefix.get(sourcePrefix)?.values;
    if (!warmupMemory) {
        return;
    }
    for (const [source, target] of pairs) {
        if (warmupMemory.has(source)) {
            remember(target, warmupMemory.get(source));
        }
    }
}

/**
 * Переносит прогретые ключи под другой префикс - и в БД, и в памяти.
 *
 * Память переносится первой: если перенос в БД упадёт, идущие следом прогрев меню и валидаторы
 * возьмут посчитанное из памяти процесса, а не станут считать его заново. Гарантии тут нет - память
 * процесса держит объекты слабыми ссылками, - но обращаются они сразу, пока значения ещё на месте.
 * @param driver - драйвер БД
 * @param sourcePrefix - префикс прогрева
 * @param pairs - пары md5-ключей [прежний, новый]
 */
export async function moveWarmedKeys(driver, sourcePrefix, pairs) {
    carryWarmupMemory(sourcePrefix, pairs);
    await driver.renameMany(pairs);
}

/** Сбрасывает память процесса. Память идущего прогрева не трогает: ею владеет сам прогрев */
export function clearPullMemory() {
    processMemory = new Map();
    locks = new Map();
}
