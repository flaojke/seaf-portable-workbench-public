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
 * execWithRetry: наблюдаемость серии попыток. Логи тут не украшение - по ним в проде отличают
 * восстановившийся ретрай от окончательного отказа, поэтому проверяются как поведение.
 * Сообщения ленивые (msgFn), мок их вызывает - заодно проверяется, что лямбды не падают.
 */
import {beforeEach, describe, expect, jest, test} from '@jest/globals';

const logged = {trace: [], debug: [], info: [], warn: [], error: []};

jest.mock('@global/logger/v2/logger.mjs', () => ({
    __esModule: true,
    getLoggerWithTag: () => ({
        trace: (msgFn) => logged.trace.push(String(msgFn())),
        debug: (msgFn) => logged.debug.push(String(msgFn())),
        info: (msgFn) => logged.info.push(String(msgFn())),
        warn: (msgFn) => logged.warn.push(String(msgFn())),
        error: (msgFn) => logged.error.push(String(msgFn()))
    })
}));

const {execWithRetry} = require('@global/helpers/retry.mjs');

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const uuidOf = (line) => line.split(':')[0];

describe('execWithRetry', () => {
    beforeEach(() => {
        for (const level of Object.keys(logged)) {
            logged[level].length = 0;
        }
    });

    test('успех с первой попытки: результат отдан, лишнего в debug нет', async() => {
        const fn = jest.fn().mockResolvedValue('ok');

        await expect(execWithRetry(3, 0, fn)).resolves.toBe('ok');

        expect(fn).toHaveBeenCalledTimes(1);
        // строки про успех после ретрая быть не должно - попыток не было
        expect(logged.debug).toEqual([]);
        expect(logged.trace).toEqual([expect.stringContaining('Attempt 1')]);
    });

    test('успех после сбоев: видно и неудачные попытки, и что серия восстановилась', async() => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('boom 1'))
            .mockRejectedValueOnce(new Error('boom 2'))
            .mockResolvedValue('ok');

        await expect(execWithRetry(3, 0, fn)).resolves.toBe('ok');

        expect(fn).toHaveBeenCalledTimes(3);
        expect(logged.debug).toEqual([
            expect.stringContaining('Attempt 1 failed with error: boom 1'),
            expect.stringContaining('Attempt 2 failed with error: boom 2'),
            expect.stringContaining('Attempt 3 success')
        ]);
    });

    test('все строки одной серии помечены одним uuid - иначе их не связать в логе', async() => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue('ok');

        await execWithRetry(2, 0, fn);

        const uuids = [...logged.trace, ...logged.debug].map(uuidOf);
        expect(uuids.every((id) => UUID_RE.test(id))).toBe(true);
        expect(new Set(uuids).size).toBe(1);
    });

    test('попытки исчерпаны: пробрасывается последняя ошибка и пишется строка об отказе', async() => {
        const lastError = new Error('boom 3');
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('boom 1'))
            .mockRejectedValueOnce(new Error('boom 2'))
            .mockRejectedValue(lastError);

        await expect(execWithRetry(2, 0, fn)).rejects.toBe(lastError);

        expect(fn).toHaveBeenCalledTimes(3);
        expect(logged.debug.at(-1)).toContain('All 3 attempt(s) failed, last error: boom 3');
    });

    test('без ретраев (retryCount = 0) отказ тоже не остаётся молчаливым', async() => {
        const fn = jest.fn().mockRejectedValue(new Error('boom'));

        await expect(execWithRetry(0, 0, fn)).rejects.toThrow('boom');

        expect(fn).toHaveBeenCalledTimes(1);
        // паузы и "trying again" тут нет - повторять нечем, но факт отказа виден
        expect(logged.debug).toEqual([expect.stringContaining('All 1 attempt(s) failed')]);
    });

    test('пауза между попытками выдерживается', async() => {
        const fn = jest.fn()
            .mockRejectedValueOnce(new Error('boom'))
            .mockResolvedValue('ok');

        const start = Date.now();
        await execWithRetry(1, 40, fn);

        expect(Date.now() - start).toBeGreaterThanOrEqual(35);
    });
});
