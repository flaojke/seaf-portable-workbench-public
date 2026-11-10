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

// Тяжёлые зависимости writer-пути: обвязка гоняет jsonata/entities, прогрев и валидаторы лезут в кеш.
// Нас интересует только порядок и адресация - что и на каком объекте вызывается.
jest.mock('@back/storage/harness.ts', () => ({
    __esModule: true,
    buildHarness: jest.fn(async() => undefined),
    ensureReaderHarness: jest.fn(async() => undefined)
}));
jest.mock('@back/storage/warmup-pipeline.ts', () => ({
    __esModule: true,
    warmupCaches: jest.fn(async() => undefined)
}));
jest.mock('@back/helpers/validators.mjs', () => ({
    __esModule: true,
    // валидатор всегда находит одну проблему - так видно, куда она попадает
    default: jest.fn(async(storage) => {
        storage.problems = storage.problems || [];
        storage.problems.push('НАЙДЕНО ВАЛИДАТОРОМ');
    })
}));
jest.mock('@back/storage/cache.mjs', () => ({__esModule: true, default: {errorClear: jest.fn(), errors: {}}}));
// Модули, которые на уровне импорта читают __filename/import.meta и под jest не грузятся.
// Для writer-пути они не нужны: entities и jsonata задействованы только в v1-ветке applyManifest,
// env.mjs импортируется ради сайд-эффектов, а роли v1 в кластере запрещены.
jest.mock('@back/entities/entities.mjs', () => ({__esModule: true, default: jest.fn()}));
jest.mock('@back/helpers/env.mjs', () => ({__esModule: true}));
jest.mock('@back/helpers/jsonata.mjs', () => ({__esModule: true, default: jest.fn()}));
jest.mock('@back/utils/logger/index.mjs', () => ({__esModule: true, jsonataPerformanceLogger: null, performanceLogger: null}));
jest.mock('@back/utils/roles.mjs', () => ({__esModule: true, DEFAULT_ROLE: 'default', isRolesMode: () => false}));

const storeManager = require('@back/storage/manager.mjs').default;
const {warmupCaches} = require('@back/storage/warmup-pipeline.ts');
const validators = require('@back/helpers/validators.mjs').default;

const roleStorage = (over = {}) => ({
    manifest: {role: 'A'}, md5Map: {}, hash: 'hRole', manifestHash: 'hRole',
    permission: 'bitbucket:era:repo_a', problems: [], warmupNeeded: true, ...over
});

describe('buildWriterHarness: валидаторы и прогрев', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('без warmupNeeded прогрева нет, а валидаторы всё равно отрабатывают', async() => {
        const storage = roleStorage({warmupNeeded: false});

        await storeManager.buildWriterHarness(storage, {manifestHash: 'другой'}, undefined, undefined);

        expect(warmupCaches).not.toHaveBeenCalled();
        expect(validators).toHaveBeenCalledTimes(1);
        expect(storage.problems).toEqual(['НАЙДЕНО ВАЛИДАТОРОМ']);
    });

    test('с warmupNeeded отрабатывают и прогрев, и валидаторы', async() => {
        const storage = roleStorage();

        await storeManager.buildWriterHarness(storage, {manifestHash: 'другой'}, undefined, undefined);

        expect(warmupCaches).toHaveBeenCalledTimes(1);
        expect(validators).toHaveBeenCalledTimes(1);
        expect(storage.problems).toEqual(['НАЙДЕНО ВАЛИДАТОРОМ']);
    });

    test('в ветке с common проблемы попадают в storage роли, а не в одноразовый join', async() => {
        const storage = roleStorage();
        const getCommonStorageData = async() => ({manifest: {common: true}, md5Map: {}});

        await storeManager.buildWriterHarness(storage, {manifestHash: 'другой'}, 'hCommon', getCommonStorageData);

        // именно storage персистится загрузчиком (manifestMeta.problems = storage.problems)
        expect(storage.problems).toEqual(['НАЙДЕНО ВАЛИДАТОРОМ']);
    });

    test('манифест не изменился - ни прогрева, ни валидаторов, problems берутся из прошлой меты', async() => {
        const storage = roleStorage();

        await storeManager.buildWriterHarness(storage, {manifestHash: 'hRole', problems: ['из прошлой загрузки']}, undefined, undefined);

        expect(warmupCaches).not.toHaveBeenCalled();
        expect(validators).not.toHaveBeenCalled();
        expect(storage.problems).toEqual(['из прошлой загрузки']);
    });

    test('сам common отдельно не валидируется - он проверяется в составе каждой роли', async() => {
        const common = roleStorage({permission: '__common', warmupNeeded: false, hash: 'hCommon', manifestHash: 'hCommon'});

        await storeManager.buildWriterHarness(common, {manifestHash: 'другой'}, undefined, undefined);

        expect(validators).not.toHaveBeenCalled();
        expect(common.problems).toEqual([]);
    });
});
