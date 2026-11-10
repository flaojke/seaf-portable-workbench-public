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
 * Формы storage: RoleStorage - то, что лежит в кеше под своим permission, JoinedStorage - результат
 * их мёржа, представление только для чтения. Различие держится и типом (JoinedStorage не присваивается
 * туда, где ждут RoleStorage), и рантайм-полем kind.
 *
 * Типы проверяются гейтом `npm run type-check` с узким include: полный tsc по проекту даёт
 * предсуществующие ошибки. Гейт покрывает только .ts, вызывающие на .mjs типов не видят - поэтому
 * основная линия обороны рантайм-проверки (kind, isCommonStorage).
 */

import {DEFAULT_PERMISSION_FOR_COMMON_MANIFEST} from '@back/cluster/constants.mjs';

/** Данные манифеста, общие для любой формы storage */
export interface StorageData {
    manifest: Record<string, any>;
    md5Map?: Record<string, string>;
    /** hash содержимого; у смёрженного - комбинация hash'ей частей (combineManifestHashes) */
    hash: string;
    manifestHash?: string;
    /**
     * ключ, под которым storage лежит в кластерном кеше. В backend-режиме манифест один на процесс
     * и permission у него нет вовсе - поэтому поле опционально. У JoinedStorage это склейка ключей
     * частей через '|', и по ней в кеше ничего не лежит.
     */
    permission?: string;
    problems?: any[];
    /** обвязка: появляется не сразу - storage поднимается из кеша без неё */
    jsonata?: any;
    entities?: any;
    schema?: any;
}

/**
 * Storage одного permission: ровно то, что лежит в кеше под своим ключом и что грузит/пишет writer.
 * Только в него можно писать через put-content.
 */
export interface RoleStorage extends StorageData {
    kind?: 'role';
    manifests?: Record<string, any>;
    roleId?: string;
    /** обвязка ролевой модели v1: своя на каждую роль, строится buildRoleHarness */
    roleJsonata?: Record<string, any>;
    roleEntities?: Record<string, any>;
    roleSchema?: any;
    repositorySources?: string[];
    warmupNeeded?: boolean;
    commonManifestHash?: string;
    /** только на write-пути (кластерный writer и put-content), персистится отдельным ключом */
    parser?: any;
    mergeMap?: Record<string, any>;
}

/**
 * Результат мёржа нескольких storage - представление для чтения. Собственного места в кеше не имеет,
 * писать в него нельзя: см. parts/writable.
 */
export interface JoinedStorage extends StorageData {
    kind: 'joined';
    /**
     * склейка permission всех частей через '|' ('roleA|__common'). Это НЕ ключ кеша: по нему не найти
     * ни манифест, ни parser - адресоваться к настоящим storage нужно через parts/writable.
     */
    permission: string;
    /** из чего собран */
    parts: RoleStorage[];
    /**
     * объединение repositorySources частей: allowlist чтения по абсолютному пути (controllers/storage).
     * Запись проверяется по repositorySources writable, а не по этому набору
     */
    repositorySources: string[];
    /** единственная не-common часть, если она одна: единственный storage, в который допустима запись */
    writable?: RoleStorage;
}

export type ManifestStorage = RoleStorage | JoinedStorage;

/**
 * Общий манифест - тот же RoleStorage, отличается только своим permission. Признак выводится из
 * permission, а не проставляется флагом: флаг можно забыть выставить в очередном месте создания
 * storage, и защита от записи молча перестанет работать (fail-open).
 *
 * Писать в общий манифест нельзя: он подмешивается в запрос каждого пользователя, и правка через
 * одну организацию была бы видна во всех.
 */
export function isCommonStorage(storage: {permission?: string} | undefined | null): boolean {
    return storage?.permission === DEFAULT_PERMISSION_FOR_COMMON_MANIFEST;
}
