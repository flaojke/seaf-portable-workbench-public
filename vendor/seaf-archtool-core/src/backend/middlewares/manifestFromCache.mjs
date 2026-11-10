/*
  Copyright (C) 2025 Sber

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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {ensureReaderHarness} from '@back/storage/harness.ts';
import {
    checkAllKeys,
    ensureStoragesLoaded,
    getPermissionByAlias, getStorage,
    isCommonManifestDeclared,
    isPermissionByAliasEmpty
} from '@back/storage/storageHolder.ts';
import {ROLES_MODE_V2_ENABLED} from '@back/helpers/env.mjs';
import {
    DEFAULT_PERMISSION_FOR_COMMON_MANIFEST
} from '@back/cluster/constants.mjs';
import {toStorageBlob} from '@back/storage/storage-blob.ts';
import {isCommonStorage} from '@back/storage/storage-types.ts';
import {performanceLogger} from '@back/utils/logger/index.mjs';
import {HttpHeaders} from '@global/helpers/httpHeaders.mjs';
import {noNeedManifest} from '@back/helpers/manifestNeedChecker.mjs';
import {getPermissionWithAccess} from '@back/utils/get-user-permission.mjs';

const LOG_TAG = '/b/m/manifestFromCache';
const logger = getLoggerWithTag(LOG_TAG);
const perfLogger = performanceLogger?.getGenericLogger();


/**
 * Добавляем в запрос storage (манифест вместе с md5Map/hash/problems и рантайм-обвязкой) - req.storage.
 * Если работаем в режиме кластера, тогда:
 *  - собираем storage на основе полученных прав если ролевая модель включена
 *  - собираем storage по общему манифесту если ролевая модель выключена
 * Если работаем в режиме backend, тогда берём storage из app.storage
 * @param app - глобальное пространство
 * @param cache - реализация кеша
 */
export default (app, cache) => {
    /**
     * Читает storage одного permission из кластерного кеша. Блоб и мету читаем параллельно: блобы
     * тяжёлые (common - единицы МБ), а последовательное чтение превращало холодный старт воркера в
     * сумму round-trip'ов.
     * @returns storage либо undefined, если поднимать нечего
     */
    async function loadStorageFromCache(permission) {
        const [storageBlob, meta] = await Promise.all([
            cache.getStorageBlob(permission),
            cache.getManifestMeta(permission)
        ]);
        if (!storageBlob) {
            // Права есть, а блоба в кластерном кеше нет: загрузка упала, блоб ещё не записан
            // после старта, либо импорт убрали из root-манифеста
            logger.warn(() => `no storage blob in cluster cache for permission ${permission}, skip it`);
            return undefined;
        }
        if (!meta?.manifestHash) {
            // hash ключует кеш датасетов вместе с permission - без него ключ становится
            // "undefined.<permission>" и не меняется при смене содержимого манифеста, отдавая
            // устаревшие данные из кеша, поэтому такой storage не поднимаем
            logger.warn(() => `storage blob for permission ${permission} has no manifestHash in meta, skip it`);
            return undefined;
        }
        logger.trace(() => `raised storage from cluster cache for permission ${permission}`);
        // Поднимаем тем же селектором, которым писали, поэтому лишние поля старых блобов
        // (включая нерабочую после сериализации обвязку) сюда не попадут. hash/problems/
        // commonManifestHash персистятся отдельно в manifestMeta - собираем всё обратно здесь
        return {
            ...toStorageBlob(storageBlob),
            hash: meta.manifestHash,
            manifestHash: meta.manifestHash,
            problems: meta.problems,
            commonManifestHash: meta.commonManifestHash
        };
    }

    // Если запущены в режиме кластера, то проверяем, подходит ли кеш для использования. Если нет - кидаем ошибку
    app.isCluster && throwIfCacheNotValidForUse(cache);

    /**
     * Дополнительная фильтрация если в заголовках запроса передан домен
     * Тогда получится сжать количество требуемых манифестов для запроса до 1, который указан в заголовке.
     * Если домена, который передан в заголовке нет в списке прав, то возвращается пустой массив
     * @param req - запрос
     * @param permissions - список прав пользователя из токена
     * @returns json объект с атрибутами:
     *      success - статус успешна проверка или нет
     *      permission - если проверка успешная, то тут право соответстующее домену из заголовка
     *      message - сообщение об ошибке, если запрос не удачный
     */
    async function filterPermissionByReqDomain(req, permissions) {
        if (!ROLES_MODE_V2_ENABLED) { // если ролевая модель выключена, то манифест один, возвращаем permissions как есть
            return {success: true, permission: permissions};
        }
        const orgCtx = req.headers[HttpHeaders.X_SFA_ORGCTX];
        if (!orgCtx) {
            return {success: false, failStatus: 400, message: `required header ${HttpHeaders.X_SFA_ORGCTX} not found or empty`};
        }
        if (isPermissionByAliasEmpty()) {
            return {success: false, message: 'no data of root manifest, try later, check logs'};
        }
        const permissionFromDomain = getPermissionByAlias(orgCtx);
        let result = permissions?.find(p => p === permissionFromDomain);
        logger.trace(() => [
            'permissions after domain alias filter',
            {title: 'domain(orgCtx from header)', obj: orgCtx},
            {title: 'permission associated by domain', obj: permissionFromDomain},
            {title: 'filter result', obj: result}
        ]);
        if (result) {
            // по результам find у нас либо undefined либо 1 элемент, если он есть, тогда обернем его в массив
            // пока так надо в ожидании доработки по common манифесту (они будут склеиваться возможно)
            // TODO: если про common манифест (ERA-1832) забыли и никто не знает о чем разговор,
            //       то можно переделать на один элемент, но важно и обработку в app.use поправить
            result = [result];
        }
        return {success: true, permission: result};
    }

    app.use(async(req, res, next) => {
        try {
            perfLogger?.setStart();
            if (noNeedManifest(req)) {
                return next();
            }
            if (!app.isCluster) {
                req.storage = app.storage;
            } else {
                let permissions = getPermissionWithAccess(req)
                    ?.map(el => el.rp);
                logger.trace(() => `user jwt permissions = ${permissions}`);
                if (!Array.isArray(permissions) || permissions.length === 0) {
                    logger.debug(() => 'user have no permissions in jwt');
                    res.status(401).json({error: 'no manifest for user permissions (empty permissions)'});
                    return;
                }
                const filterResult = await filterPermissionByReqDomain(req, permissions);
                if (!filterResult.success) {
                    logger.warn(() => `permission filter by domain rejected request: ${filterResult.message}`);
                    if (filterResult.failStatus) {
                        res.status(filterResult.failStatus)
                            .json({error: filterResult.message});
                    } else {
                        // если проверка прав не удалась, тогда прерываем обработку
                        res.set(HttpHeaders.RETRY_AFTER, '60') // Попробуй через 60 секунд
                            .status(503)
                            .json({error: filterResult.message});
                    }
                    return;
                }
                const userPermissions = filterResult.permission ?? [];
                if (userPermissions.length === 0) {
                    logger.debug(() => 'user have no permissions after filter by org ctx (no have permission on selected orgctx)');
                    res.status(401).json({error: 'no manifest for user permissions (empty permissions or only common)'});
                    return;
                }
                // Общий манифест подмешиваем, только если он объявлен в root-манифесте: иначе
                // storage под этим permission не появится никогда, а каждый запрос ходил бы за его
                // блобом и метой в кластерный кеш - впустую и с предупреждением в лог
                permissions = isCommonManifestDeclared()
                    ? [...userPermissions, DEFAULT_PERMISSION_FOR_COMMON_MANIFEST]
                    : userPermissions;
                const notExistPermissions = checkAllKeys(permissions);
                if (notExistPermissions.length) {
                    logger.debug(() => `permissions ${notExistPermissions} are not in process cache, read them from cluster cache`);
                } else {
                    logger.trace(() => `all permissions ${permissions} are already in process cache, no read from cluster cache needed`);
                }
                await ensureStoragesLoaded(notExistPermissions, loadStorageFromCache);
                const storage = getStorage(permissions);
                if (!storage) {
                    logger.debug(() => `no storage found for permissions ${permissions}`);
                    // текст ответа не трогаем - это контракт для вызывающей стороны
                    res.status(401).json({error: 'no manifest for user permissions (not found)'});
                    return;
                } else if (isCommonStorage(storage)) {
                    // Права роль+common мы запрашивали, но storage роли в кеш не поднялся (её загрузка
                    // упала, либо блоб удалён) - от мёржа остался один общий манифест. Отдавать его
                    // как манифест пользователя нельзя: это чужие данные, общие для всех организаций.
                    // Проверка выше отсекает этот случай только по СПИСКУ прав, а не по тому, что
                    // реально нашлось, - её сообщение ('...or only common') относится и сюда.
                    logger.warn(() => `only common manifest resolved for permissions ${permissions}, role manifest is not loaded`);
                    res.status(401).json({error: 'no manifest for user permissions (empty permissions or only common)'});
                    return;
                } else {
                    await ensureReaderHarness(storage);
                    req.storage = storage;
                    logger.trace(() => `apply storage by manifest hash ${storage.hash}`);
                }
            }
            if (req.storage) {
                next();
            } else {
                res.status(401).json({error: 'access denied'});
            }
        } finally {
            perfLogger?.setEnd();
        }
    });

    /**
     * Для работы этого фильтра нужен кластерный кеш (ClusterCache): из него берутся блобы storage и их мета
     * Если ее нет, то использовать такой кеш не получится
     * @param cache
     * @returns {boolean}
     */
    function throwIfCacheNotValidForUse(cache) {
        if (!cache || !cache.isClusterCache) {
            throw Error('It\'s impossible to use the passed cache for middleware operation; the required getStorageBlob function is missing. The cache implementation must be modified or it must not be passed.');
        }
    }
};
