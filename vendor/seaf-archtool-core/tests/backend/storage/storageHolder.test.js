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

const {combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');

// joinStorages мокается с реальными mergeDeep/combineManifestHashes, иначе тест перестал бы проверять
// корректность мёржа данных/problems/hash/permission. Обвязку storageHolder не строит вовсе,
// поэтому harness здесь не участвует
jest.mock('@back/storage/storage-join.ts', () => ({
    __esModule: true,
    joinStorages: jest.fn((storages) => {
        if (storages.length === 1) {
            return storages[0];
        }
        const {combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');
        const {mergeDeep} = require('@global/helpers/mergedeep.mjs');
        const manifest = mergeDeep({}, storages.map((s) => s.manifest));
        const hash = combineManifestHashes(storages.map((s) => s.hash));
        return {
            manifest,
            md5Map: Object.assign({}, ...storages.map((s) => s.md5Map)),
            hash,
            manifestHash: hash,
            permission: storages.map((s) => s.permission).join('|'),
            problems: storages.flatMap((s) => s.problems ?? []),
            kind: 'joined',
            parts: storages,
            writable: storages.filter((s) => s.permission !== '__common').length === 1
                ? storages.find((s) => s.permission !== '__common')
                : undefined
        };
    })
}));

/**
 * storageHolder хранит своё состояние в module-scope переменных (синглтон на процесс), поэтому перед
 * каждым тестом модуль и его мок joinStorages пересоздаются через jest.resetModules() + require().
 */
function loadStorageHolder() {
    jest.resetModules();
    const storageHolder = require('@back/storage/storageHolder.ts');
    const {joinStorages} = require('@back/storage/storage-join.ts');
    return {storageHolder, joinStorages};
}

/** Мок clusterCache с одним методом, который реально использует storageHolder - getRootManifestData */
function makeClusterCache(rootManifestData) {
    return {
        getRootManifestData: jest.fn().mockResolvedValue(rootManifestData)
    };
}

describe('storageHolder', () => {
    let storageHolder;
    let joinStorages;

    beforeEach(() => {
        ({storageHolder, joinStorages} = loadStorageHolder());
    });

    describe('подъём storage из БД в локальный кеш: pushStorage / checkAllKeys', () => {
        test('checkAllKeys с пустым/отсутствующим списком прав возвращает пустой массив', () => {
            expect(storageHolder.checkAllKeys(null)).toEqual([]);
            expect(storageHolder.checkAllKeys(undefined)).toEqual([]);
        });

        test('checkAllKeys возвращает только права, которых ещё нет в локальном кеше (их и нужно подгрузить из БД)', () => {
            storageHolder.pushStorage('roleA', {manifest: {a: 1}, hash: 'hA', problems: []});

            expect(storageHolder.checkAllKeys(['roleA', 'roleB'])).toEqual(['roleB']);
        });
    });

    describe('getManifest: один permission', () => {
        test('отдаёт тот же объект из локального кеша, не подменяя его копией', async() => {
            const single = {manifest: {a: 1}, hash: 'hA', manifestHash: 'hA', problems: []};
            storageHolder.pushStorage('roleA', single);

            const first = await storageHolder.getStorage(['roleA']);
            expect(first).toBe(single);
            expect(joinStorages).toHaveBeenCalledTimes(1);

            const second = await storageHolder.getStorage(['roleA']);
            // тот же объект между запросами - на нём и переиспользуется однажды собранная обвязка
            expect(second).toBe(first);
            expect(joinStorages).toHaveBeenCalledTimes(2); // N=1 в joinedStorages не кешируется, joinStorages зовётся снова (и возвращает единственный элемент как есть)
        });

        test('без явного списка permissions использует все permission, уже поднятые в локальный кеш', async() => {
            storageHolder.pushStorage('roleOnly', {manifest: {z: 1}, hash: 'hZ', problems: []});

            const result = await storageHolder.getStorage();

            expect(result.manifest).toEqual({z: 1});
        });

        test('permission, для которого storage ещё не поднят в локальный кеш, даёт undefined', async() => {
            const result = await storageHolder.getStorage(['unknownPermission']);

            expect(result).toBeUndefined();
        });
    });

    describe('getManifest: join нескольких permission (роль + common)', () => {
        function pushRoleAndCommon() {
            storageHolder.pushStorage('roleA', {
                manifest: {role: 'A'},
                hash: 'hA',
                manifestHash: 'hA',
                permission: 'roleA',
                problems: ['problemA']
            });
            storageHolder.pushStorage('common', {
                manifest: {common: true},
                hash: 'hC',
                manifestHash: 'hC',
                permission: 'common',
                problems: ['problemC']
            });
        }

        test('мёржит содержимое, склеивает problems списком (не перезаписывает) и считает hash по combineManifestHashes', async() => {
            pushRoleAndCommon();

            const joined = await storageHolder.getStorage(['roleA', 'common']);

            expect(joined.manifest).toEqual({role: 'A', common: true});
            expect(joined.problems).toEqual(['problemA', 'problemC']);
            expect(joined.hash).toBe(combineManifestHashes(['hA', 'hC']));
            expect(joined.manifestHash).toBe(combineManifestHashes(['hA', 'hC']));
            expect(joined.permission).toBe('roleA|common');
            expect(joined.kind).toBe('joined');
            expect(joinStorages).toHaveBeenCalledWith([
                expect.objectContaining({manifest: {role: 'A'}, hash: 'hA', permission: 'roleA'}),
                expect.objectContaining({manifest: {common: true}, hash: 'hC', permission: 'common'})
            ]);
        });

        test('повторный запрос той же комбинации отдаётся из joinedStorages-кеша без пересчёта', async() => {
            pushRoleAndCommon();

            const first = await storageHolder.getStorage(['roleA', 'common']);
            const joinStoragesCallsAfterFirst = joinStorages.mock.calls.length;
            const second = await storageHolder.getStorage(['roleA', 'common']);

            expect(second).toBe(first);
            expect(joinStorages).toHaveBeenCalledTimes(joinStoragesCallsAfterFirst); // взято из joinedStorages-кеша, joinStorages не вызывается повторно
        });

        test('если реально в кеше есть только 1 из 2 запрошенных permission - срабатывает одиночная ветка, а не join', async() => {
            storageHolder.pushStorage('roleA', {manifest: {role: 'A'}, hash: 'hA', problems: []});

            const result = await storageHolder.getStorage(['roleA', 'missingPermission']);

            expect(result.manifest).toEqual({role: 'A'});
            expect(result.kind).toBeUndefined();
        });
    });

    describe('invalidateStorageHolderCache: инвалидация storageByPermission / joinedStorages', () => {
        test('сброс полный: локально подгруженные манифесты и все join-комбинации выбрасываются', async() => {
            storageHolder.pushStorage('roleA', {manifest: {a: 1}, hash: 'hA', problems: []});
            storageHolder.pushStorage('roleB', {manifest: {b: 1}, hash: 'hB', problems: []});
            await storageHolder.getStorage(['roleA', 'roleB']); // прогреваем join-кеш

            await storageHolder.invalidateStorageHolderCache(makeClusterCache(null));

            expect(storageHolder.checkAllKeys(['roleA', 'roleB'])).toEqual(['roleA', 'roleB']);
            expect(await storageHolder.getStorage(['roleA', 'roleB'])).toBeUndefined();
        });

        test('initPermissionByAliasMap вызывается синхронно вместе со сбросом', async() => {
            const rootManifestData = {imports: [{permission: 'roleA', alias: 'aliasA', root: 'root://a'}]};
            const clusterCache = makeClusterCache(rootManifestData);

            await storageHolder.invalidateStorageHolderCache(clusterCache);

            expect(clusterCache.getRootManifestData).toHaveBeenCalledTimes(1);
        });
    });

    describe('ensureStoragesLoaded: подъём недостающих storage из БД', () => {
        const storageOf = (permission, hash = `h_${permission}`) => ({manifest: {permission}, hash, manifestHash: hash, problems: []});

        /** Чтение из БД, которое завершается по команде теста: так видно, что происходит, пока оно идёт */
        function makeControlledLoad() {
            const calls = [];
            const loadStorage = jest.fn((permission) => new Promise((resolve, reject) => {
                calls.push({permission, resolve, reject});
            }));
            return {loadStorage, calls};
        }

        test('параллельные запросы одного permission делят одно чтение из БД', async() => {
            const {loadStorage, calls} = makeControlledLoad();

            const requests = Array.from({length: 20}, () => storageHolder.ensureStoragesLoaded(['roleA', '__common'], loadStorage));
            expect(loadStorage).toHaveBeenCalledTimes(2);
            calls.forEach(({permission, resolve}) => resolve(storageOf(permission)));
            await Promise.all(requests);

            expect(loadStorage).toHaveBeenCalledTimes(2);
            expect(storageHolder.checkAllKeys(['roleA', '__common'])).toEqual([]);
        });

        test('уже поднятые permission из БД не читаются', async() => {
            storageHolder.pushStorage('roleA', storageOf('roleA'));
            const loadStorage = jest.fn(async(permission) => storageOf(permission));

            await storageHolder.ensureStoragesLoaded(['roleA', 'roleB'], loadStorage);

            expect(loadStorage).toHaveBeenCalledTimes(1);
            expect(loadStorage).toHaveBeenCalledWith('roleB');
        });

        test('поднимать нечего (undefined) - в локальный кеш ничего не попадает, следующий запрос читает заново', async() => {
            const loadStorage = jest.fn(async() => undefined);

            await storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            await storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);

            expect(storageHolder.checkAllKeys(['roleA'])).toEqual(['roleA']);
            expect(loadStorage).toHaveBeenCalledTimes(2);
        });

        test('ошибка чтения достаётся всем ожидающим и не запоминается', async() => {
            const {loadStorage, calls} = makeControlledLoad();

            const first = storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            const second = storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            calls[0].reject(new Error('pg is down'));
            await expect(first).rejects.toThrow('pg is down');
            await expect(second).rejects.toThrow('pg is down');

            await storageHolder.ensureStoragesLoaded(['roleA'], async(permission) => storageOf(permission));
            expect(storageHolder.checkAllKeys(['roleA'])).toEqual([]);
        });

        test('кеш сбросили, пока шло чтение: прочитанное до сброса не попадает в кеш, ожидающий получает свежее', async() => {
            const {loadStorage, calls} = makeControlledLoad();

            const request = storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            await storageHolder.invalidateStorageHolderCache(makeClusterCache(null));
            calls[0].resolve(storageOf('roleA', 'hOld'));
            // устаревшее чтение отброшено, запущено повторное
            await new Promise((resolve) => setImmediate(resolve));
            expect(storageHolder.checkAllKeys(['roleA'])).toEqual(['roleA']);
            expect(loadStorage).toHaveBeenCalledTimes(2);

            calls[1].resolve(storageOf('roleA', 'hNew'));
            await request;

            expect(storageHolder.getStorage(['roleA']).hash).toBe('hNew');
        });

        test('запрос, пришедший после сброса, не ждёт чтение, начатое до сброса', async() => {
            const {loadStorage, calls} = makeControlledLoad();

            const before = storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            await storageHolder.invalidateStorageHolderCache(makeClusterCache(null));
            const after = storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            expect(loadStorage).toHaveBeenCalledTimes(2);

            calls[1].resolve(storageOf('roleA', 'hNew'));
            await after;
            expect(storageHolder.getStorage(['roleA']).hash).toBe('hNew');

            calls[0].resolve(storageOf('roleA', 'hOld'));
            await before;
            expect(storageHolder.getStorage(['roleA']).hash).toBe('hNew');
            expect(loadStorage).toHaveBeenCalledTimes(2);
        });

        test('dropStorages во время чтения: содержимое, прочитанное до записи, в кеш не попадает', async() => {
            const {loadStorage, calls} = makeControlledLoad();

            const request = storageHolder.ensureStoragesLoaded(['roleA'], loadStorage);
            storageHolder.dropStorages(['roleA']);
            calls[0].resolve(storageOf('roleA', 'hOld'));
            await new Promise((resolve) => setImmediate(resolve));
            calls[1].resolve(storageOf('roleA', 'hNew'));
            await request;

            expect(storageHolder.getStorage(['roleA']).hash).toBe('hNew');
        });
    });

    // dropStorages остался точечным: его зовёт put-content для своего процесса, который сам себе
    // источник события, - терять там нечего в отличие от кластерной рассылки
    describe('dropStorages: точечный сброс на стороне того, кто сам записал контент', () => {
        test('удаляет только указанные права и join-комбинации с их участием', async() => {
            storageHolder.pushStorage('roleA', {manifest: {a: 1}, hash: 'hA', problems: []});
            storageHolder.pushStorage('roleB', {manifest: {b: 1}, hash: 'hB', problems: []});
            storageHolder.pushStorage('roleC', {manifest: {c: 1}, hash: 'hC', problems: []});
            const joinAB = await storageHolder.getStorage(['roleA', 'roleB']);
            const joinBC = await storageHolder.getStorage(['roleB', 'roleC']);

            storageHolder.dropStorages(['roleA']);

            // roleA удалён из локального кеша, roleB/roleC - нет
            expect(storageHolder.checkAllKeys(['roleA', 'roleB', 'roleC'])).toEqual(['roleA']);

            // join roleB|roleC не задет - тот же объект, без пересчёта
            const joinBCAfter = await storageHolder.getStorage(['roleB', 'roleC']);
            expect(joinBCAfter).toBe(joinBC);

            // join roleA|roleB должен был быть удалён: поднимаем roleA заново с изменившимся
            // содержимым и проверяем, что join пересчитан, а не отдан из WeakRef-кеша
            storageHolder.pushStorage('roleA', {manifest: {a: 2}, hash: 'hA2', problems: []});
            const joinABAfter = await storageHolder.getStorage(['roleA', 'roleB']);
            expect(joinABAfter).not.toBe(joinAB);
            expect(joinABAfter.manifest).toEqual({a: 2, b: 1});
        });

        test('permission с вертикальной чертой внутри: join инвалидируется по составу, а не по разбору ключа', async() => {
            // Ключ join-кеша - склейка через '|', и сама permission может содержать '|'. При разборе
            // ключа обратно 'org|a' распалось бы на 'org' и 'a', и этот join не сбросился бы вовсе,
            // а следующий запрос отдал бы устаревшее содержимое
            storageHolder.pushStorage('org|a', {manifest: {a: 1}, hash: 'hA', problems: []});
            storageHolder.pushStorage('b', {manifest: {b: 1}, hash: 'hB', problems: []});
            const joinBefore = await storageHolder.getStorage(['org|a', 'b']);

            storageHolder.dropStorages(['org|a']);

            storageHolder.pushStorage('org|a', {manifest: {a: 2}, hash: 'hA2', problems: []});
            const joinAfter = await storageHolder.getStorage(['org|a', 'b']);
            expect(joinAfter).not.toBe(joinBefore);
            expect(joinAfter.manifest).toEqual({a: 2, b: 1});
        });
    });

    describe('ключ join-кеша', () => {
        test('наборы прав, дающие одинаковую склейку, не подменяют друг друга в кеше', async() => {
            // ['a', 'b', 'c'] и ['a|b', 'c'] склеиваются в одну строку 'a|b|c'. Ключ кеша строится по
            // массиву, поэтому наборы остаются разными и второй запрос не получает чужой storage
            storageHolder.pushStorage('a', {manifest: {a: 1}, hash: 'h1', problems: []});
            storageHolder.pushStorage('b', {manifest: {b: 1}, hash: 'h2', problems: []});
            storageHolder.pushStorage('c', {manifest: {c: 1}, hash: 'h3', problems: []});
            storageHolder.pushStorage('a|b', {manifest: {ab: 1}, hash: 'h4', problems: []});

            const threeParts = await storageHolder.getStorage(['a', 'b', 'c']);
            const twoParts = await storageHolder.getStorage(['a|b', 'c']);

            expect(threeParts).not.toBe(twoParts);
            expect(threeParts.manifest).toEqual({a: 1, b: 1, c: 1});
            expect(twoParts.manifest).toEqual({ab: 1, c: 1});
        });
    });

    describe('initPermissionByAliasMap (через invalidateStorageHolderCache): подъём root-манифеста из БД в alias-карту', () => {
        const rootManifestData = {
            imports: [
                {permission: 'roleA', alias: 'aliasA', root: 'root://a'},
                {permission: 'roleB', alias: 'aliasB', root: 'root://b'}
            ]
        };

        test('изначально (до первой успешной загрузки) permissionByAlias пуста', () => {
            expect(storageHolder.isPermissionByAliasEmpty()).toBe(true);
        });

        test('валидный root-манифест из БД корректно строит permissionByAlias в обе стороны (permission<->alias)', async() => {
            await storageHolder.invalidateStorageHolderCache(makeClusterCache(rootManifestData), undefined);

            expect(storageHolder.isPermissionByAliasEmpty()).toBe(false);
            expect(storageHolder.getPermissionByAlias('aliasA')).toBe('roleA');
            expect(storageHolder.getAliasByPermission('roleB')).toBe('aliasB');
            expect(storageHolder.getImportByPermission('roleA')).toEqual(rootManifestData.imports[0]);
            expect(storageHolder.getImportByAlias('aliasB')).toEqual(rootManifestData.imports[1]);
        });

        test.each([
            ['getRootManifestData вернул null/пусто', null],
            ['корневой манифест без атрибута imports', {}],
            ['imports присутствует, но не массив', {imports: 'not-an-array'}]
        ])(
            'регрессия: аномальный ответ кеша (%s) НЕ сбрасывает уже загруженный permissionByAlias, а сохраняет предыдущее значение',
            async(_description, anomalousRootData) => {
                await storageHolder.invalidateStorageHolderCache(makeClusterCache(rootManifestData), undefined);
                expect(storageHolder.getPermissionByAlias('aliasA')).toBe('roleA');

                await storageHolder.invalidateStorageHolderCache(makeClusterCache(anomalousRootData), undefined);

                expect(storageHolder.getPermissionByAlias('aliasA')).toBe('roleA');
                expect(storageHolder.isPermissionByAliasEmpty()).toBe(false);
            }
        );

        test('аномальный ответ кеша при самом первом вызове (нет предыдущего валидного значения) не падает и оставляет карту пустой', async() => {
            await storageHolder.invalidateStorageHolderCache(makeClusterCache(null), undefined);

            expect(storageHolder.isPermissionByAliasEmpty()).toBe(true);
            expect(storageHolder.getPermissionByAlias('aliasA')).toBeUndefined();
        });
    });
});
