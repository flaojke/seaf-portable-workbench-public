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
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

/**
 * Локальный (в памяти процесса) кеш кластерного чтения: storage'и по permission и результаты их
 * мёржа. Рантайм-обвязку (jsonata/entities/schema) не строит - это забота вызывающего.
 *
 * Здесь же живёт карта alias -> permission из root-манифеста (permissionByAlias) - отдельная
 * ответственность со своей стратегией обновления, см. invalidateStorageHolderCache.
 */

import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {ImportByPermissionAndAliasMap} from '@back/helpers/import-by-permission-and-alias-map.mjs';
import {normalizeCommon} from '@back/helpers/rootManifestVersionCheck.mjs';
import {joinStorages} from '@back/storage/storage-join.ts';
import type {ManifestStorage, RoleStorage} from '@back/storage/storage-types.ts';

/** storage каждого поднятого permission под своим ключом - ровно то, что лежит в кеше */
let storageByPermission = new Map<string, RoleStorage>();
/**
 * Результат мёржа вместе с составом, из которого он собран. Состав хранится массивом, а не выводится
 * из ключа: permission приходят из root-манифеста и могут содержать любой символ, включая разделитель.
 */
interface JoinedStorageEntry {
    permissions: string[];
    // eslint-disable-next-line no-undef
    ref: WeakRef<ManifestStorage>;
}

/** результаты мёржа нескольких permission; WeakRef - чтобы склейки не держали память вечно */
let joinedStorages = new Map<symbol, JoinedStorageEntry>();

/** Незавершённый подъём storage из БД; запись в pendingLoads служит ему ещё и признаком актуальности */
interface PendingLoad {
    /** false - подъём устарел, пока шёл: кеш за это время сбросили */
    done: Promise<boolean>;
}

/** подъёмы storage, которые сейчас в работе: параллельные запросы ждут один и тот же, а не читают БД каждый сам */
let pendingLoads = new Map<string, PendingLoad>();
let permissionByAlias = ImportByPermissionAndAliasMap.createEmpty();
/**
 * Объявлен ли в root-манифесте общий манифест. Читается и обновляется вместе с permissionByAlias:
 * пока root-манифест не прочитан, здесь false, но и запросы в этот момент не обслуживаются
 * (см. isPermissionByAliasEmpty)
 */
let commonManifestDeclared = false;

const logger = getLoggerWithTag('storageHolder');


export function getPermissionByAlias(alias: string): string | undefined {
    return permissionByAlias.getByAlias(alias)?.permission;
}

export function getAliasByPermission(permission: string): string | undefined {
    return permissionByAlias.getByPermission(permission)?.alias;
}

export function getImportByPermission(permission: string): any {
    return permissionByAlias.getByPermission(permission);
}

export function getImportByAlias(alias: string): any {
    return permissionByAlias.getByAlias(alias);
}

export function isPermissionByAliasEmpty(): boolean {
    return permissionByAlias.size() === 0;
}

/** Если общего манифеста нет, storage под его permission не появится - подмешивать его незачем */
export function isCommonManifestDeclared(): boolean {
    return commonManifestDeclared;
}

// Вызывается после завершённой перезагрузки, когда root-манифест уже записан в кеш, поэтому
// пустой/битый ответ здесь - транзиентный сбой чтения, а не штатное состояние. Сохраняем последнее
// валидное значение permissionByAlias вместо сброса, чтобы разовый сбой не обрушил резолвинг
// alias->permission для всех запросов сразу
async function initPermissionByAliasMap(cache: any): Promise<void> {
    const rootManifestData = await cache.getRootManifestData();
    if (!rootManifestData) {
        logger.warn(() => 'invoke cache.getRootManifestData return null or empty, app not see root manifest in cache, keep previous permissionByAlias value');
        return;
    }
    const imports = rootManifestData?.imports;
    if (!imports) {
        logger.warn(() => 'root manifest in cache not contains imports attribute, keep previous permissionByAlias value');
        return;
    }
    if (!Array.isArray(imports)) {
        logger.warn(() => 'root manifest in cache contains imports, but it is not array, keep previous permissionByAlias value');
        return;
    }

    permissionByAlias = new ImportByPermissionAndAliasMap(imports);
    commonManifestDeclared = normalizeCommon(rootManifestData.common).roots.length > 0;
    // Внутри ImportByPermissionAndAliasMap лежат Map, а JSON.stringify(Map) даёт {} - логируем
    // сами алиасы, а не объект целиком
    logger.trace(() => [
        `permissionByAlias map rebuilt, common manifest is ${commonManifestDeclared ? 'declared' : 'not declared'}`,
        {title: 'aliases', obj: imports.map((item: any) => item.alias)}
    ]);
}

/** Кладёт поднятый из БД storage в локальный кеш под ключом permission */
export function pushStorage(permission: string, storage: RoleStorage): void {
    logger.trace(() => `Pushed storage ${permission} -> ${JSON.stringify(storage).substring(0, 100)}`);
    storageByPermission.set(permission, storage);
}

/**
 * Отдаёт storage для набора прав: отбрасывает права, по которым storage ещё не поднят из БД,
 * мёржит оставшиеся и кеширует результат мёржа. Если не осталось ни одного - возвращает undefined.
 * Рантайм-обвязку не строит.
 */
export function getStorage(permissions?: string[]): ManifestStorage | undefined {
    let filteredPermission: string[];
    if (!permissions || permissions.length < 1 ) {
        filteredPermission = [...storageByPermission.keys()];
    } else {
        // Отбрасываем права, по которым storage не поднят: среди прав пользователя могут быть
        // права других сервисов
        filteredPermission = permissions.filter(permission => Boolean(storageByPermission.get(permission)));
    }

    logger.trace(() => [
        'after filter keys by exist storage in storageByPermission',
        {title: 'permissions', obj: permissions},
        {title: 'filteredPermission', obj: filteredPermission},
        {title: 'storageByPermission.keys', obj: [...storageByPermission.keys()]}
    ]);

    if (filteredPermission.length === 0) {
        logger.debug(() => 'after filter permission by exist keys in storageByPermission, filteredPermission array is empty, check in \'trace\' log level');
        return undefined;
    }

    const isJoin = filteredPermission.length > 1;
    // Ключ кеша - JSON массива, а не склейка через разделитель: склейка неоднозначна, если сама
    // permission содержит этот разделитель (['a', 'b', 'c'] и ['a|b', 'c'] дали бы один ключ 'a|b|c',
    // и второй запрос получил бы чужой storage). joinPermission ниже нужен только для логов
    const joinKey = Symbol.for(JSON.stringify(filteredPermission));
    const joinPermission = filteredPermission.join('|');
    if (isJoin) {
        logger.trace(() => `after filter permission by exist storage, it contains only ${joinPermission}`);
        // Одиночная permission кеша не требует - она и так лежит в storageByPermission под своим
        // ключом (тот же объект, что вернёт joinStorages ниже), отдельно кешировать нечего.
        const cachedStorage = joinedStorages.get(joinKey)?.ref.deref();
        if (cachedStorage) {
            logger.trace(() => `find storage by permission ${joinPermission} in local weakref cache`);
            return cachedStorage;
        }
    }

    // Все filteredPermission гарантированно есть в storageByPermission: выше они либо взяты из его
    // же ключей, либо отфильтрованы по наличию
    const storagesToJoin = filteredPermission.map((permission) => storageByPermission.get(permission));

    // joinStorages комбинирует уже посчитанные .hash частей той же формулой, что и writer при
    // прогреве role+common, поэтому ключ кеша на чтении совпадёт с тем, что записал прогрев
    const storage = joinStorages(storagesToJoin);
    if (isJoin) {
        logger.trace(() => `merge ${storagesToJoin.length} storages by permission ${joinPermission}, new hash = ${storage.hash}`);
        // eslint-disable-next-line no-undef
        joinedStorages.set(joinKey, {permissions: filteredPermission, ref: new WeakRef(storage)});
    } else {
        logger.trace(() => `return storage by permission ${filteredPermission[0]}`);
    }
    return storage;
}

export function checkAllKeys(permissions?: string[]): string[] {
    if (!permissions) {
        return [];
    }
    return permissions.filter(item => !storageByPermission.has(item));
}

/**
 * Запускает подъём storage одного permission и регистрирует его в pendingLoads. Результат попадает
 * в локальный кеш, только если за время чтения кеш не сбросили: иначе прочитанное до сброса
 * содержимое осталось бы в нём до следующей перезагрузки.
 */
function startLoad(permission: string, loadStorage: (permission: string) => Promise<RoleStorage | undefined>): PendingLoad {
    const pending = {} as PendingLoad;
    pendingLoads.set(permission, pending);
    pending.done = (async() => {
        try {
            const storage = await loadStorage(permission);
            if (pendingLoads.get(permission) !== pending) {
                logger.debug(() => `storage ${permission} was invalidated while it was being loaded, loaded content is dropped`);
                return false;
            }
            if (storage) {
                pushStorage(permission, storage);
            }
            return true;
        } finally {
            if (pendingLoads.get(permission) === pending) {
                pendingLoads.delete(permission);
            }
        }
    })();
    return pending;
}

/**
 * Поднимает в локальный кеш storage тех permission, которых в нём ещё нет. Одновременные запросы
 * одного permission делят один подъём: блобы тяжёлые (общий манифест - единицы МБ), и после сброса
 * кеша каждый запрос, читающий их сам, занимал бы свои соединения с БД.
 *
 * Ошибка чтения достаётся всем ожидающим и не запоминается - следующий запрос читает заново.
 *
 * @param permissions - права, storage которых нужен запросу
 * @param loadStorage - читает storage одного permission из БД; undefined, если поднимать нечего
 */
export async function ensureStoragesLoaded(
    permissions: string[],
    loadStorage: (permission: string) => Promise<RoleStorage | undefined>
): Promise<void> {
    await Promise.all(checkAllKeys(permissions).map(async(permission) => {
        // Устаревший подъём не годится и тем, кто его ждал: повторяем уже на содержимом после сброса,
        // если за это время storage не поднял кто-то другой
        let actual = false;
        while (!actual && !storageByPermission.has(permission)) {
            const pending = pendingLoads.get(permission) ?? startLoad(permission, loadStorage);
            actual = await pending.done;
        }
    }));
}

/**
 * Выбрасывает из локального кеша storage'и указанных прав и все join-комбинации, в которые они
 * входят. Следующий запрос поднимет их из БД заново - вместе со свежей обвязкой и schema.
 *
 * Отдельно от invalidateStorageHolderCache: тот, кто сам только что записал содержимое (put-content),
 * уже знает, что изменилось, и ему незачем ни ждать мастера, ни перечитывать карту alias -> permission.
 */
export function dropStorages(permissions: string[]): void {
    for (const permission of permissions) {
        storageByPermission.delete(permission);
        pendingLoads.delete(permission);
    }
    for (const [key, entry] of joinedStorages) {
        if (entry.permissions.some((permission) => permissions.includes(permission))) {
            joinedStorages.delete(key);
        }
    }
}

/**
 * Инвалидирует локальный (в памяти процесса) кеш storage'ей. Совмещает две разные стратегии:
 *  - storageByPermission/joinedStorages только удаляются (lazy/cache-aside), наполняет их обратно
 *    вызывающая сторона при следующем запросе;
 *  - permissionByAlias тут же синхронно перечитывается целиком (eager), см. initPermissionByAliasMap.
 *
 * Сброс всегда полный: точечный требует, чтобы до каждого пода доехал список изменившихся прав, а
 * передать его одним полем последнего события нельзя - два события в одном окне опроса затирают друг
 * друга, и права первого не сбрасываются уже никогда. Экономии при этом почти нет: подъём после сброса
 * ленивый и только для прав текущего запроса.
 *
 * Точечный сброс остался там, где терять нечего по построению - dropStorages в put-content
 * (один процесс, синхронно, сам себе источник события).
 */
export async function invalidateStorageHolderCache(clusterCache: any): Promise<void> {
    logger.debug(() => 'invalidate StorageHolder cache: full reset');
    storageByPermission = new Map();
    joinedStorages = new Map();
    pendingLoads = new Map();
    await initPermissionByAliasMap(clusterCache);
}
