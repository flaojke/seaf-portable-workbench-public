/*
  Copyright (C) 2023 Sber

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
      Vladislav Markin <markinvy@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2024, 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {ClusterCache} from './cache.mjs';
import {v4 as uuidv4} from 'uuid';
import storeManager from '../storage/manager.mjs';
import {loadStorageFromSources} from '@back/storage/manifest-source.ts';
import {Parser} from '@global/manifest/parser3/index.mjs';
import {parentPort} from 'node:worker_threads';
import {
    CLUSTER_MANIFEST,
    CLUSTER_MANIFEST_META,
    CLUSTER_MANIFEST_PARSER,
    CLUSTER_MANIFEST_UPDATE_TIME_KEY,
    DEFAULT_ALIAS_FOR_COMMON_MANIFEST,
    DEFAULT_PERMISSION_FOR_COMMON_MANIFEST,
    DEFAULT_PERMISSION_WITHOUT_ROLE_MODEL_V2
} from './constants.mjs';
import {toStorageBlob} from '@back/storage/storage-blob.ts';
import {changeLoggerImpl, getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {mainLogger} from '@back/utils/logger/constLoggers.mjs';
import {makeURIByBaseURI} from '@global/manifest/tools/uri.mjs';
import storageCache from '@back/storage/cache.mjs';
import {addFileProtocolIfNoProtocol} from '@back/helpers/uri.mjs';
import {normalizeCommon, validateRootManifest} from '@back/helpers/rootManifestVersionCheck.mjs';
import {ROLES_MODE_V2_ENABLED, ROLES_MODE_V2_VALUE} from '@back/helpers/env.mjs';
import {checkAwaitedPackages, replacePackageProblems} from './awaitedPackages.mjs';

changeLoggerImpl(mainLogger);

const LOG_TAG = 'manifest_loader';
const logger = getLoggerWithTag(LOG_TAG);

logger.info(() => `Manifest loader process node params: ${process.execArgv}; and options: ${process.env.NODE_OPTIONS}`);

const clusterCache = new ClusterCache();
const isV2RolesEnabled = ROLES_MODE_V2_ENABLED;
const parentFile = addFileProtocolIfNoProtocol(process.env.VUE_APP_DOCHUB_ROOT_MANIFEST);

try {
/**
 * Один цикл работы воркера: прочитать root-манифест, догрузить устаревшие импорты, прибрать следы
 * удалённых и отчитаться родительскому потоку. Тело плоское - это оркестрация, логика в функциях ниже.
 */
    await main();
} catch (error) {
    logger.error(() => `Manifest loader failed: ${error?.message ?? error}`, error);
    parentPort.postMessage({status: 'error', error: `${error?.message ?? error}`});
    throw error;
}

async function main() {
    const rootData = await readRootManifest();
    const common = normalizeCommon(rootData.common);
    const hasCommon = common.roots.length > 0;
    const reloadStart = Date.now();
    const cacheDriver = await clusterCache.getClusterCache();
    // сохраняем root манифест, чтобы при запросах перезагрузки его учитывать
    await clusterCache.setRootManifestData(rootData);

    logger.info(() => `in root manifest found ${rootData.imports.length} import(s) and `
        + `${hasCommon ? `common manifest from ${common.roots.length} root(s)` : 'no common manifest'}`
        + `, isV2RolesEnabled ${isV2RolesEnabled}`);
    throwIfUnsupportedWithoutRoleModel(rootData.imports.length, hasCommon);

    const actualManifestState = await syncActualManifestTimes(rootData, hasCommon);
    await loadImports({rootData, common, actualManifestState, cacheDriver, reloadStart});

    await forgetRemovedManifests(rootData, actualManifestState, cacheDriver);
    await clusterCache.saveActualManifestTimes(actualManifestState);
    await removeOldManifests(rootData, cacheDriver);
    process.exitCode = 0;

    reportSuccessToParent(reloadStart, rootData.imports.length + (hasCommon ? 1 : 0));
    await clusterCache.close();
    logger.debug(() => 'Connection to cache closed after load manifest');
}

/** Читает root-манифест из источника и приводит его к виду, пригодному для загрузки импортов */
async function readRootManifest() {
    const rootDataRaw = await storageCache.request(parentFile);
    const rootData = rootDataRaw.data;
    validateRootManifest(rootData);
    rootData.imports = convertPermissionToLowerCase(rootData.imports);
    throwIfDataDuplicates(rootData);
    return rootData;
}

/**
 * Если ролевая модель v2 выключена, то мы можем работать только с 1 доменом, доступным всем.
 * Общий манифест в этом режиме тоже не поддерживается: подмешивать его не к чему, домен и так один
 */
function throwIfUnsupportedWithoutRoleModel(importsCount, hasCommon) {
    if (isV2RolesEnabled) {
        return;
    }
    if (importsCount > 1) {
        throw new Error('If the role model is disabled, the root manifest cannot contain more than 1 imports. ' +
            `Value of VUE_APP_DOCHUB_ROLES_MODEL_V2=${ROLES_MODE_V2_VALUE}, count imports = ${importsCount}`);
    }
    if (hasCommon) {
        throw new Error('If the role model is disabled, the root manifest cannot declare a common manifest. ' +
            `Value of VUE_APP_DOCHUB_ROLES_MODEL_V2=${ROLES_MODE_V2_VALUE}`);
    }
}

/**
 * Приводит сохранённые времена последней успешной загрузки в соответствие с текущим root-манифестом:
 * если состояния нет совсем - заполняет целиком, иначе только добавляет появившиеся алиасы (со
 * значением -1, то есть "никогда не грузился").
 */
async function syncActualManifestTimes(rootData, hasCommon) {
    const aliases = rootData.imports.map((el) => el.alias);
    if (hasCommon) {
        aliases.push(DEFAULT_ALIAS_FOR_COMMON_MANIFEST);
    }

    let actualManifestState = await clusterCache.getActualManifestTimes();
    if (!actualManifestState || typeof actualManifestState !== 'object') {
        logger.warn(() => `no valid actual manifest times in cache (got ${JSON.stringify(actualManifestState)}), reset all ${aliases.length} alias(es) to "never loaded" - every manifest will be reloaded in this cycle`);
        actualManifestState = {};
        for (const alias of aliases) {
            actualManifestState[alias] = -1;
        }
        await clusterCache.saveActualManifestTimes(actualManifestState);
        return actualManifestState;
    }

    const newAliases = aliases.filter((alias) => !actualManifestState[alias]);
    for (const alias of newAliases) {
        actualManifestState[alias] = -1;
    }
    if (newAliases.length > 0) {
        logger.info(() => `new alias(es) in root manifest: ${newAliases}, marked as "never loaded" and will be loaded in this cycle`);
        await clusterCache.saveActualManifestTimes(actualManifestState);
    }
    logger.debug(() => `actual manifest times synced: ${JSON.stringify(actualManifestState)}`);
    return actualManifestState;
}

/**
 * Грузит импорт, только если его ждут свежее, чем он есть сейчас. Единая точка для всех трёх
 * сценариев загрузки - и общего манифеста, и ролей, и единственного домена без ролевой модели.
 */
async function uploadIfExpired({alias, uploadParams, actualManifestState, reloadStart}) {
    const expectTimeManifest = await clusterCache.getExpectTimeManifest(alias);
    const actualTimeManifest = actualManifestState[alias];
    const times = () => `expected time ${expectTimeManifest}${expectTimeManifest ? '' : ' (no update requested)'}`
        + `, actual time ${actualTimeManifest}${actualTimeManifest === -1 ? ' (never loaded)' : ''}`;

    if (expectTimeManifest > actualTimeManifest) {
        logger.info(() => `Manifest with alias ${alias} is expired, start update: ${times()}`);
        const startedAt = Date.now();
        await uploadImport({...uploadParams, reloadStart});
        logger.info(() => `Manifest with alias ${alias} update finished in ${Date.now() - startedAt} ms, actual time moved to ${reloadStart}`);
        actualManifestState[alias] = reloadStart;
        return;
    }
    logger.debug(() => `skip update manifest with alias ${alias}: not expired, ${times()}`);
}

/**
 * Общий манифест: при необходимости перезагружает его и отдаёт то, что нужно ролям для мёржа -
 * его hash и ленивый загрузчик содержимого. common - результат normalizeCommon.
 *
 * Порядок корней (root первым, дальше пакеты по порядку объявления) задаёт приоритет мёржа в parser3:
 * при совпадении путей выигрывает последний источник, то есть пакет перекрывает root
 */
async function loadCommonManifest({common, actualManifestState, cacheDriver, reloadStart}) {
    const {roots, packages} = common;
    if (roots.length === 0) {
        logger.debug(() => 'root manifest has no common manifest to load (no declaration, or it is empty)');
        return {};
    }
    logger.trace(() => `start importing common manifest from ${roots.length} root(s)`);
    await uploadIfExpired({
        alias: DEFAULT_ALIAS_FOR_COMMON_MANIFEST,
        actualManifestState,
        reloadStart,
        uploadParams: {
            _import: {
                root: roots,
                permission: DEFAULT_PERMISSION_FOR_COMMON_MANIFEST,
                alias: DEFAULT_ALIAS_FOR_COMMON_MANIFEST
            },
            cacheDriver,
            loadMetamodelAndDocs: true,
            awaitedPackages: packages
        }
    });

    // Хеш common читаем из manifestMeta, не трогая тяжёлое содержимое, независимо от того,
    // перезагружали мы его в этом цикле или нет
    const commonManifestMeta = JSON.parse(await cacheDriver.get(CLUSTER_MANIFEST_META + DEFAULT_PERMISSION_FOR_COMMON_MANIFEST)) || {};
    return {
        commonManifestHash: commonManifestMeta.manifestHash,
        getCommonStorageData: createLazyCommonStorageDataLoader()
    };
}

/**
 * Блоб common тяжёлый (единицы МБ), поэтому грузим его лениво и один раз за цикл воркера, даже если
 * common нужен нескольким ролям. Отдаём не манифест целиком, а только нужные для мёржа данные.
 *
 * Кешируем лишь успешный результат: оставленный в переменной отвергнутый промис раздавался бы каждой
 * следующей роли цикла, и разовый сбой чтения блоба ронял бы загрузку всех ролей подряд. Сброс мемо
 * в catch даёт следующей роли сходить в кеш заново; текущая свою ошибку всё равно получает.
 */
function createLazyCommonStorageDataLoader() {
    let commonStorageDataPromise;
    return () => {
        if (!commonStorageDataPromise) {
            logger.debug(() => 'loading common storage blob from cache for merge (expensive)');
            commonStorageDataPromise = clusterCache.getStorageBlob(DEFAULT_PERMISSION_FOR_COMMON_MANIFEST)
                .then((blob) => ({manifest: blob?.manifest, md5Map: blob?.md5Map}))
                .catch((error) => {
                    commonStorageDataPromise = undefined;
                    logger.warn(() => `loading common storage blob failed, next role will retry. Error ${error}`);
                    throw error;
                });
        }
        return commonStorageDataPromise;
    };
}

/** Загружает всё, что перечислено в root-манифесте: общий манифест и манифесты доменов */
async function loadImports({rootData, common, actualManifestState, cacheDriver, reloadStart}) {
    if (!isV2RolesEnabled) {
        // Домен здесь ровно один и общего манифеста нет - это гарантирует гард выше. Грузим домен
        // с заглушкой права, чтобы дать доступ всем (обратная совместимость с режимом без ролевой
        // модели), и с метамоделью: брать её из общего манифеста здесь неоткуда
        const _import = rootData.imports[0];
        await uploadIfExpired({
            alias: _import.alias,
            actualManifestState,
            reloadStart,
            uploadParams: {
                _import,
                permission: DEFAULT_PERMISSION_WITHOUT_ROLE_MODEL_V2,
                cacheDriver,
                loadMetamodelAndDocs: true
            }
        });
        return;
    }

    const {commonManifestHash, getCommonStorageData} =
        await loadCommonManifest({common, actualManifestState, cacheDriver, reloadStart});

    // Обычно метамодель и документация приходят домену мёржем с общим манифестом. Если общего
    // манифеста нет, их грузит каждый домен сам
    const loadMetamodelAndDocs = !getCommonStorageData;
    for (const _import of rootData.imports) {
        logger.trace(() => `start importing manifest with alias ${_import.alias}`);
        await uploadIfExpired({
            alias: _import.alias,
            actualManifestState,
            reloadStart,
            uploadParams: {_import, cacheDriver, loadMetamodelAndDocs, commonManifestHash, getCommonStorageData}
        });
    }
}

/** Забываем времена загрузки тех манифестов, которых в текущем root-манифесте уже нет */
async function forgetRemovedManifests(rootData, actualManifestState, cacheDriver) {
    const rootAlias = [...rootData.imports.map((el) => el.alias), DEFAULT_ALIAS_FOR_COMMON_MANIFEST];
    for (const alias in actualManifestState) {
        if (!rootAlias.includes(alias)) {
            delete actualManifestState[alias];
            await cacheDriver.del(CLUSTER_MANIFEST_UPDATE_TIME_KEY + `${alias}`);
        }
    }
}

/** Сообщает родительскому потоку, что цикл загрузки завершён успешно */
function reportSuccessToParent(reloadStart, manifestCount) {
    const endLoadTime = Date.now();
    logger.debug(() => `send success post message with endLoadTime ${endLoadTime}`);
    logger.info(() => `Load ${manifestCount} manifests took ${endLoadTime - reloadStart} ms`);
    parentPort.postMessage({status: 'success', endLoadTime: endLoadTime});
}

/**
 * Проверяем, что в манифесте нет дубликатов permission или alias. Если дубликаты есть, то кидаем ошибку
 */
function throwIfDataDuplicates(rootData) {
    const permissionDuplicate = countDuplicate(rootData.imports, el => el.permission.toLowerCase());
    const aliasDuplicate = countDuplicate(rootData.imports, el => el.alias.toLowerCase());
    let message = '';
    if (permissionDuplicate.length > 0) {
        message += `permissions (${permissionDuplicate}) `;
    }
    if (aliasDuplicate.length > 0) {
        message += `alias (${aliasDuplicate})`;
    }
    if (message && message !== '') {
        throw Error(` The root manifest contains a list of imports with ${message}. The duplicate must be removed.`);
    }
}

function countDuplicate(data, mapFunc) {
    let sourcePermissionsArray = data.map(mapFunc);
    const counts = {};
    for (const item of sourcePermissionsArray) {
        counts[item] = (counts[item] || 0) + 1;
    }
    return Object.keys(counts).filter(key => counts[key] > 1);
}

/**
 * Переводим все permission в нижний регистр, чтобы они везде были одинаковые
 */
function convertPermissionToLowerCase(data) {
    return data.map(item => ({
        ...item,
        permission: item.permission.toLowerCase()
    }));
}

async function uploadImport({_import, permission = _import.permission, cacheDriver, loadMetamodelAndDocs, commonManifestHash, getCommonStorageData, awaitedPackages, reloadStart}) {
    let storage;
    const manifestMetaCacheKey = CLUSTER_MANIFEST_META + `${permission}`;
    const manifestMeta = JSON.parse(await cacheDriver.get(manifestMetaCacheKey)) || {};
    logger.info(() => [
        `Start loading manifest with permission ${permission}`,
        {title: 'import element', obj: _import}
    ]);
    try {
        const fullRootFilePath = Array.isArray(_import.root)
            ? _import.root.map((root) => makeURIByBaseURI(root, parentFile))
            : makeURIByBaseURI(_import.root, parentFile);
        storage = await storeManager.buildWriterHarness(await loadStorageFromSources(fullRootFilePath, loadMetamodelAndDocs).then(async(s) => {
            logger.debug(() => `loadStorageFromSources with import ${permission} in manifest loader is finished`);
            return {
                ...s,
                permission,
                warmupNeeded: _import.warmupNeeded || false
            };
        }), manifestMeta, commonManifestHash, getCommonStorageData);
        logger.debug(() => `storeManager.buildWriterHarness with import ${permission} finish success`);

        if (awaitedPackages) {
            const packageProblems = checkAwaitedPackages(storage.parser.metamodels, awaitedPackages);
            storage.problems = replacePackageProblems(storage.problems, packageProblems);
            logger.info(() => `Common package check: ${packageProblems.length} mismatch(es) out of ${awaitedPackages.length} awaited package(s)`);
        }

        logger.info(() => `Manifest with permission ${permission}. Old hash ${manifestMeta.manifestHash}, new hash ${storage.hash}`);
        if (manifestMeta.manifestHash !== storage.hash) {
            await cacheDriver.setGuaranteed(CLUSTER_MANIFEST_PARSER + `${permission}`, JSON.stringify(Parser.toPersistedData(storage.parser)));

            await cacheDriver.setGuaranteed(CLUSTER_MANIFEST + `${permission}`, JSON.stringify(toStorageBlob(storage)));

            manifestMeta.successLoadTimestamp = Date.now();
            manifestMeta.permission = permission;
            manifestMeta.manifestHash = storage.hash;
            manifestMeta.error = undefined;
            logger.info(() => `Manifest loader successfully set manifest to cache: ${permission}`);
        } else {
            logger.info(() => `Manifest with ${permission} not changed. Just update manifestMeta.tsVersion.`);
        }
        // problems и hash common-манифеста сохраняем независимо от того, изменился ли сам манифест:
        // это единственное место, где состояние прогрева/валидации персистится между циклами воркера
        manifestMeta.problems = storage.problems;
        if (storage.commonManifestHash !== undefined) {
            manifestMeta.commonManifestHash = storage.commonManifestHash;
        }
        manifestMeta.tsVersion = reloadStart;
    } catch (error) {
        const errorMessage = `${uuidv4()}: Manifest loader failed to set manifest. ${error.message}`;
        manifestMeta.error = errorMessage;
        manifestMeta.errorLoadTimestamp = Date.now();
        manifestMeta.tsVersion = reloadStart;
        logger.error(() => errorMessage, error);
    }
    await cacheDriver.setGuaranteed(manifestMetaCacheKey, JSON.stringify(manifestMeta));
    return storage;
}

/**
 * Удаление из кеша манифестов, которых нет в rootData. То есть они были удалены из текущего рут манифеста
 * @param rootData - текущий рут манифест
 * @param cacheDriver - драйвер кластерного кеша
 */
async function removeOldManifests(rootData, cacheDriver) {
    // эта конструкция нужна, чтобы проверить и удалить все следы манифеста, если вдруг 1 или 2 уже были удалены
    // так мы вытаскиваем все следы и удаляем в любом случае все
    const permissionsInCache = new Set([
        ...(await getPermissionFromCache(CLUSTER_MANIFEST, cacheDriver)),
        ...(await getPermissionFromCache(CLUSTER_MANIFEST_META, cacheDriver)),
        ...(await getPermissionFromCache(CLUSTER_MANIFEST_PARSER, cacheDriver))
    ]);

    if (permissionsInCache.size === 0) {
        logger.info(() => `in cache no one manifest (keys with ${CLUSTER_MANIFEST} or ${CLUSTER_MANIFEST_PARSER} prefix)`);
        return;
    }

    let permissionInRoot = [...rootData.imports.map(el => el.permission), DEFAULT_PERMISSION_FOR_COMMON_MANIFEST];
    if (!isV2RolesEnabled) {
        logger.info(() => `Role mode 2 is disabled, so we don't check against the actual permissions array, but replace it with the default permission '${DEFAULT_PERMISSION_WITHOUT_ROLE_MODEL_V2}'`);
        permissionInRoot = [DEFAULT_PERMISSION_WITHOUT_ROLE_MODEL_V2];
    }
    const manifestPermissionForRemove = [];
    for (const permission of permissionsInCache) {
        const isExist = permissionInRoot.find(el => el === permission);
        if (!isExist) {
            manifestPermissionForRemove.push(permission);
        }
    }
    if (manifestPermissionForRemove.length === 0) {
        logger.info(() => 'all of manifest contains in current rootData, nothing to remove');
        return;
    }

    for (const permission of manifestPermissionForRemove) {
        logger.debug(() => `delete manifest ${permission}
                            from cache`);
        await cacheDriver.del(CLUSTER_MANIFEST_PARSER + `${permission}`);
        await cacheDriver.del(CLUSTER_MANIFEST + `${permission}`);
        await cacheDriver.del(CLUSTER_MANIFEST_META + `${permission}`);
    }
    logger.info(() => `removed ${manifestPermissionForRemove.length} old manifest `);
}

/**
 * Получить список прав из кеша по ключу.
 * Ищем в кеше все элементы по префиксу, и удаляем сам префикс.
 * В данном файле этот метод нужен для поиска прав манифестов в кеше
 * @param keyPrefix - префикс для поиска
 * @param cacheDriver - драйвер кластерного кеша
 */
async function getPermissionFromCache(keyPrefix, cacheDriver) {
    const keyPrefixLength = keyPrefix.length;
    const keyPrefixEscaped = keyPrefix.replace(/_/g, '\\_');
    const arrayFromCache = await cacheDriver.getKeysLike(keyPrefixEscaped);
    if (!Array.isArray(arrayFromCache)) {
        return [];
    }
    return arrayFromCache.map(str => str.slice(keyPrefixLength));

}

