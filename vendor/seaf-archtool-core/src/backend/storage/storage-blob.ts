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
 * Персистентная форма storage: проекция RoleStorage, которая уезжает в кеш под ключом
 * CLUSTER_MANIFEST + permission. Через неё пишут manifest-loader и putContent, читает
 * manifestFromCache - набор полей общий для всех троих.
 *
 * Это явный allowlist, а не вычёркивание лишнего: новое рантайм-поле не попадёт в БД молча.
 * Вне блоба остаются hash/manifestHash/commonManifestHash/problems (лежат в CLUSTER_MANIFEST_META,
 * читаются без тяжёлого содержимого), parser (CLUSTER_MANIFEST_PARSER, нужен только write-пути),
 * mergeMap, признаки формы kind/parts/writable (выводятся при мёрже) и рантайм-обвязка
 * jsonata/entities/schema (не переживает сериализацию, строится заново в harness).
 */

import type {RoleStorage} from './storage-types.ts';

export interface StorageBlob {
    manifest: Record<string, any>;
    md5Map?: Record<string, string>;
    repositorySources?: string[];
    permission: string;
    warmupNeeded?: boolean;
}

/**
 * Тем же селектором данные и поднимаются из кеша, поэтому лишние поля в старых записях БД
 * отбрасываются при чтении.
 *
 * @param source - storage (на записи) либо распарсенный блоб из кеша (на чтении: hash/problems там нет,
 *      они приезжают отдельно из manifestMeta - поэтому Partial)
 */
export function toStorageBlob(source: Partial<RoleStorage> | StorageBlob): StorageBlob {
    return {
        manifest: source.manifest,
        md5Map: source.md5Map,
        repositorySources: source.repositorySources,
        permission: source.permission,
        warmupNeeded: source.warmupNeeded
    };
}
