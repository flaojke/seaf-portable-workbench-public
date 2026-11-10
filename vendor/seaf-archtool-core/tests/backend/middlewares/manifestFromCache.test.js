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

// Нужен настоящий контракт чтения/записи ClusterCache -> storageHolder -> manifestFromCache,
// поэтому мокаем только драйвер Postgres, а не сами эти модули
process.env.VUE_APP_DOCHUB_DATALAKE_CACHE = 'postgres';
// filterPermissionByReqDomain (резолвинг alias -> permission) работает только при включённой v2
process.env.VUE_APP_DOCHUB_ROLES_MODEL_V2 = 'y';

jest.mock('@back/drivers/postgres.mjs', () => ({
    __esModule: true,
    default: jest.fn()
}));

// env.mjs использует import.meta.url, что под babel-jest падает с "Cannot access '_filename'
// before initialization" при любом require(). К тестируемой логике отношения не имеет - мокаем
// только то, что реально читается по цепочке (ROLES_MODE_V2_ENABLED)
jest.mock('@back/helpers/env.mjs', () => ({
    __esModule: true,
    ROLES_MODE_V2_ENABLED: true,
    ROLES_MODE_V2_VALUE: 'y'
}));

// logger/index.mjs тянет logger-factory.mjs с top-level await, невалидным под babel-jest.
// Инфраструктурный perf-логгер к тестируемой логике не относится - мокаем с выключенным
// performanceLogger, как и в реальном коде по умолчанию
jest.mock('@back/utils/logger/index.mjs', () => ({
    __esModule: true,
    performanceLogger: null
}));

// joinStorages и ensureReaderHarness гоняют движок jsonata/entities - отдельная область, здесь она
// не проверяется. Моки оставляют результат видимым в req.storage: joinStorages с реальными
// mergeDeep/combineManifestHashes, чтобы тест по-прежнему проверял корректность мёржа, а
// ensureReaderHarness идемпотентным, чтобы проверять непересборку обвязки на переиспользуемом объекте
jest.mock('@back/storage/storage-join.ts', () => ({
    __esModule: true,
    joinStorages: jest.fn((storages) => {
        if (storages.length === 1) {
            return storages[0];
        }
        const {mergeDeep} = require('@global/helpers/mergedeep.mjs');
        const {combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');
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

jest.mock('@back/storage/harness.ts', () => {
    const buildSchemaMock = jest.fn(async(manifest) => ({builtSchemaFor: manifest}));
    return {
        __esModule: true,
        ensureReaderHarness: jest.fn(async(storage) => {
            if (storage.jsonata !== undefined) {
                return;
            }
            storage.schema = await buildSchemaMock(storage.manifest);
            storage.jsonata = {mockedJsonataFor: storage.permission};
            storage.entities = {mockedEntitiesFor: storage.permission};
        })
    };
});

const {CLUSTER_MANIFEST, CLUSTER_MANIFEST_META, DEFAULT_PERMISSION_FOR_COMMON_MANIFEST} =
    require('@back/cluster/constants.mjs');
const {combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');
const {HttpHeaders} = require('@global/helpers/httpHeaders.mjs');

const ROLE_PERMISSION = 'rolea';
const ROLE_ALIAS = 'aliasa';

/** In-memory замена постгресового cacheDriver: та же поверхность методов, что использует ClusterCache */
function makeFakeCacheDriver() {
    const store = new Map();
    return {
        async get(key) {
            return store.has(key) ? store.get(key) : null;
        },
        async setGuaranteed(key, value) {
            store.set(key, String(value));
        },
        async del(key) {
            store.delete(key);
        },
        async getKeysLike(prefix) {
            return [...store.keys()].filter(key => key.startsWith(prefix));
        },
        async getValuesWhereKeyStartWith(prefix) {
            return [...store.entries()].filter(([key]) => key.startsWith(prefix)).map(([, value]) => value);
        },
        async close() {}
    };
}

/**
 * Кладёт манифест в фейковый cacheDriver той же формой (contentBlob + manifestMeta), которую пишет
 * uploadImport() в manifest-loader.mjs - тест проверяет чтение на формате писателя, а не на удобной
 * для теста структуре.
 */
async function writeManifestAsLoaderWould(cacheDriver, {
    permission, manifest, manifestHash, problems = [], md5Map = {},
    repositorySources = [], warmupNeeded = false, commonManifestHash
}) {
    const contentBlob = {manifest, md5Map, repositorySources, permission, warmupNeeded};
    await cacheDriver.setGuaranteed(CLUSTER_MANIFEST + permission, JSON.stringify(contentBlob));

    const manifestMeta = {
        successLoadTimestamp: Date.now(),
        permission,
        manifestHash,
        error: undefined,
        problems,
        commonManifestHash,
        tsVersion: Date.now()
    };
    await cacheDriver.setGuaranteed(CLUSTER_MANIFEST_META + permission, JSON.stringify(manifestMeta));
}

/**
 * Пересобирает ClusterCache/storageHolder/manifestFromCache заново (module-scope state) и
 * подключает свежий фейковый cacheDriver к настоящему ClusterCache через замоканный postgres.mjs.
 */
function loadModules() {
    jest.resetModules();

    const fakeCacheDriver = makeFakeCacheDriver();
    require('@back/drivers/postgres.mjs').default.mockResolvedValue(fakeCacheDriver);

    const {ClusterCache} = require('@back/cluster/cache.mjs');
    const storageHolder = require('@back/storage/storageHolder.ts');
    const manifestFromCache = require('@back/middlewares/manifestFromCache.mjs').default;
    const {joinStorages} = require('@back/storage/storage-join.ts');

    return {ClusterCache, storageHolder, manifestFromCache, joinStorages, fakeCacheDriver};
}

/** Захватывает обработчик, зарегистрированный через app.use(...) в manifestFromCache.mjs */
function makeFakeApp() {
    let handler;
    return {
        app: {
            isCluster: true,
            use(fn) {
                handler = fn;
            }
        },
        getHandler: () => handler
    };
}

function makeReq({orgCtx, permissions = [ROLE_PERMISSION], path = '/seaf-core/api/core/entities/list'} = {}) {
    const headers = {};
    if (orgCtx !== undefined) {
        headers[HttpHeaders.X_SFA_ORGCTX] = orgCtx;
    }
    return {
        path,
        headers,
        tokenPayload: {payloadObj: {permissions: permissions.map(rp => ({rp, ra: 'read'}))}}
    };
}

function makeRes() {
    return {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        set: jest.fn().mockReturnThis()
    };
}

/** Полный цикл "запись как manifest-loader" + "подъём permissionByAlias" перед каждым тестом */
async function setupLoadedCluster() {
    const modules = loadModules();
    const {ClusterCache, storageHolder} = modules;
    const clusterCache = new ClusterCache();
    // ClusterCache читает/пишет через module-scope cacheDriver, который лениво инициализируется
    // только внутри getClusterCache() - так же, как manifest-loader.mjs делает это перед любыми
    // операциями с кешем
    await clusterCache.getClusterCache();

    const rootManifestData = {
        imports: [{permission: ROLE_PERMISSION, alias: ROLE_ALIAS, root: 'root://a'}],
        common: 'root://common'
    };
    // так же, как manifest-loader.mjs сохраняет root-манифест перед загрузкой импортов
    await clusterCache.setRootManifestData(rootManifestData);

    await writeManifestAsLoaderWould(modules.fakeCacheDriver, {
        permission: ROLE_PERMISSION,
        manifest: {a: 1, nested: {x: 1}},
        manifestHash: 'hRole',
        problems: ['problemRole'],
        md5Map: {roleKey: 'roleUrl'}
    });
    await writeManifestAsLoaderWould(modules.fakeCacheDriver, {
        permission: DEFAULT_PERMISSION_FOR_COMMON_MANIFEST,
        manifest: {b: 2, nested: {y: 2}},
        manifestHash: 'hCommon',
        problems: ['problemCommon'],
        md5Map: {commonKey: 'commonUrl'}
    });

    // так же, как cluster.mjs делает после успешного сообщения от воркера manifest-loader.mjs
    await storageHolder.invalidateStorageHolderCache(clusterCache);

    return {...modules, clusterCache};
}

/**
 * root-манифест без общего манифеста - штатная конфигурация. Блоба под __common в кеше нет и не
 * будет, поэтому и запрашивать его не должны.
 */
async function setupLoadedClusterWithoutCommon() {
    const modules = loadModules();
    const {ClusterCache, storageHolder} = modules;
    const clusterCache = new ClusterCache();
    await clusterCache.getClusterCache();
    await clusterCache.setRootManifestData({
        imports: [{permission: ROLE_PERMISSION, alias: ROLE_ALIAS, root: 'root://a'}]
    });
    await writeManifestAsLoaderWould(modules.fakeCacheDriver, {
        permission: ROLE_PERMISSION,
        manifest: {a: 1, nested: {x: 1}},
        manifestHash: 'hRole',
        problems: ['problemRole'],
        md5Map: {roleKey: 'roleUrl'}
    });
    await storageHolder.invalidateStorageHolderCache(clusterCache);
    return {...modules, clusterCache};
}

/**
 * Сценарий деградации: блоб роли в БД отсутствует (её загрузка упала либо блоб удалён), а common на
 * месте. Тогда getStorage отфильтрует роль и вернёт ОДИН общий манифест - его нельзя отдавать как
 * манифест пользователя, это данные, общие для всех организаций.
 */
async function setupOnlyCommonLoaded() {
    const modules = loadModules();
    const {ClusterCache, storageHolder} = modules;
    const clusterCache = new ClusterCache();
    await clusterCache.getClusterCache();
    await clusterCache.setRootManifestData({
        imports: [{permission: ROLE_PERMISSION, alias: ROLE_ALIAS, root: 'root://a'}],
        common: 'root://common'
    });
    await writeManifestAsLoaderWould(modules.fakeCacheDriver, {
        permission: DEFAULT_PERMISSION_FOR_COMMON_MANIFEST,
        manifest: {b: 2},
        manifestHash: 'hCommon',
        problems: [],
        md5Map: {commonKey: 'commonUrl'}
    });
    await storageHolder.invalidateStorageHolderCache(clusterCache);
    return {...modules, clusterCache};
}

describe('manifest-loader -> manifestFromCache: подъём манифеста из БД в req.storage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('happy path: манифест роли и common корректно поднимаются из "БД" и собираются во все нужные store-объекты', async() => {
        const {manifestFromCache, clusterCache, joinStorages} = await setupLoadedCluster();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: ROLE_ALIAS});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.storage).toBeDefined();

        // content манифеста роли и common смёржен (deep merge)
        expect(req.storage.manifest).toEqual({a: 1, b: 2, nested: {x: 1, y: 2}});
        // hash join'а посчитан по той же формуле, что использует и writer (прогрев)
        expect(req.storage.hash).toBe(combineManifestHashes(['hRole', 'hCommon']));
        expect(req.storage.manifestHash).toBe(combineManifestHashes(['hRole', 'hCommon']));
        // problems - список, не структура: должны быть СКЛЕЕНЫ, а не перезаписаны
        expect(req.storage.problems).toEqual(['problemRole', 'problemCommon']);
        // md5Map - объект: ключи обеих сторон объединяются, и сторона роли не затирается common'ом
        expect(req.storage.md5Map).toEqual({roleKey: 'roleUrl', commonKey: 'commonUrl'});

        // манифесты смёржены joinStorages, обвязка построена по уже смёрженному манифесту
        expect(joinStorages).toHaveBeenCalledWith([
            expect.objectContaining({permission: 'rolea'}),
            expect.objectContaining({permission: '__common'})
        ]);
        expect(req.storage.schema).toEqual({builtSchemaFor: {a: 1, b: 2, nested: {x: 1, y: 2}}});

        // jsonata/entities построены ensureReaderHarness (storage/harness.ts) - это и есть "рабочие" store-объекты
        expect(req.storage.jsonata).toEqual({mockedJsonataFor: 'rolea|__common'});
        expect(req.storage.entities).toEqual({mockedEntitiesFor: 'rolea|__common'});

        // parser на читающей стороне не появляется вовсе - его нет в схеме блоба (storage/storage-blob.ts)
        expect('parser' in req.storage).toBe(false);
    });

    test('параллельные запросы после сброса кеша читают блоб и мету каждого permission один раз', async() => {
        const {manifestFromCache, clusterCache, fakeCacheDriver} = await setupLoadedCluster();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);
        const get = jest.spyOn(fakeCacheDriver, 'get');

        const requests = Array.from({length: 20}, () => ({req: makeReq({orgCtx: ROLE_ALIAS}), next: jest.fn()}));
        await Promise.all(requests.map(({req, next}) => getHandler()(req, makeRes(), next)));

        // роль и common, у каждого блоб и мета - 4 чтения на все 20 запросов, а не 80
        expect(get).toHaveBeenCalledTimes(4);
        for (const {req, next} of requests) {
            expect(next).toHaveBeenCalledTimes(1);
            expect(req.storage).toBe(requests[0].req.storage);
        }
    });

    test('запрос без заголовка x-sfa-orgctx отклоняется с 400 и до req.storage не доходит', async() => {
        const {manifestFromCache, clusterCache} = await setupLoadedCluster();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: undefined});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(next).not.toHaveBeenCalled();
        expect(req.storage).toBeUndefined();
    });

    test('запрос с неизвестным alias (нет вообще такого alias в root-манифесте) отклоняется 401, а не падает', async() => {
        const {manifestFromCache, clusterCache} = await setupLoadedCluster();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: 'no-such-alias'});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(req.storage).toBeUndefined();
    });

    test('alias резолвится в permission, которого нет в правах пользователя из JWT - тоже отклоняется 401, а не падает', async() => {
        const {manifestFromCache, clusterCache} = await setupLoadedCluster();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        // root-манифест в setupLoadedCluster содержит только ROLE_PERMISSION/ROLE_ALIAS ('rolea'/'aliasa'),
        // поэтому берём другой alias, которого нет в правах текущего пользователя, но который
        // валидно резолвится через getPermissionByAlias (в отличие от предыдущего теста) -
        // это регрессия на TypeError: filterResult.permission is not iterable, когда permission
        // из alias не совпал ни с одним правом пользователя из JWT.
        const req = makeReq({orgCtx: ROLE_ALIAS, permissions: ['role-user-does-not-have']});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(req.storage).toBeUndefined();
    });
});

describe('root-манифест без общего манифеста', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('__common не подмешивается в права: запрос обслуживается, за несуществующим блобом в кеш не ходим', async() => {
        const {manifestFromCache, clusterCache, fakeCacheDriver, joinStorages} = await setupLoadedClusterWithoutCommon();
        // Спай ставим после подъёма permissionByAlias, чтобы видеть только обращения самого запроса
        const getSpy = jest.spyOn(fakeCacheDriver, 'get');
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: ROLE_ALIAS});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).not.toHaveBeenCalled();
        expect(next).toHaveBeenCalledTimes(1);
        expect(req.storage.permission).toBe(ROLE_PERMISSION);
        expect(req.storage.manifest).toEqual({a: 1, nested: {x: 1}});

        // ключи общего манифеста в кеше не запрашивались - ни блоб, ни мета
        const requestedKeys = getSpy.mock.calls.map(([key]) => key);
        expect(requestedKeys.filter((key) => key.includes(DEFAULT_PERMISSION_FOR_COMMON_MANIFEST))).toEqual([]);
        // мёржить не с чем - в join уходит один storage роли
        expect(joinStorages).toHaveBeenCalledWith([expect.objectContaining({permission: ROLE_PERMISSION})]);
    });

    test('прав у пользователя нет вовсе - по-прежнему 401, а не пустой мёрж', async() => {
        const {manifestFromCache, clusterCache} = await setupLoadedClusterWithoutCommon();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: ROLE_ALIAS, permissions: ['role-user-does-not-have']});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(req.storage).toBeUndefined();
    });
});

describe('деградация: манифест роли не поднялся, в кеше только common', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('общий манифест не отдаётся пользователю как свой - 401, а не чужие данные', async() => {
        const {manifestFromCache, clusterCache} = await setupOnlyCommonLoaded();
        const {app, getHandler} = makeFakeApp();
        manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: ROLE_ALIAS});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(req.storage).toBeUndefined();
    });

    test('блоб роли на месте, но meta.manifestHash отсутствует - permission пропускается, отдаётся только common', async() => {
        const modules = loadModules();
        const {ClusterCache, storageHolder} = modules;
        const clusterCache = new ClusterCache();
        await clusterCache.getClusterCache();
        await clusterCache.setRootManifestData({
            imports: [{permission: ROLE_PERMISSION, alias: ROLE_ALIAS, root: 'root://a'}],
            common: 'root://common'
        });
        await writeManifestAsLoaderWould(modules.fakeCacheDriver, {
            permission: ROLE_PERMISSION,
            manifest: {a: 1},
            manifestHash: undefined,
            md5Map: {}
        });
        await writeManifestAsLoaderWould(modules.fakeCacheDriver, {
            permission: DEFAULT_PERMISSION_FOR_COMMON_MANIFEST,
            manifest: {b: 2},
            manifestHash: 'hCommon',
            md5Map: {commonKey: 'commonUrl'}
        });
        await storageHolder.invalidateStorageHolderCache(clusterCache);

        const {app, getHandler} = makeFakeApp();
        modules.manifestFromCache(app, clusterCache);

        const req = makeReq({orgCtx: ROLE_ALIAS});
        const res = makeRes();
        const next = jest.fn();

        await getHandler()(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(next).not.toHaveBeenCalled();
        expect(req.storage).toBeUndefined();
    });
});
