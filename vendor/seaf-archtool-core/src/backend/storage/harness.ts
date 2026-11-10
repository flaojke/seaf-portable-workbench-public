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
 * Рантайм-обвязка манифеста: jsonata-драйвер, entities и посчитанная по манифесту schema.
 *
 * Обвязка нужна всем трём сценариям (backend-инициализация, кластерный writer, кластерное чтение),
 * но не зависит ни от загрузки манифеста из источников, ни от прогрева датасетов - поэтому вынесена
 * отдельно, и читающая сторона не тянет за собой writer-машинерию.
 *
 * Точки входа различаются не механикой, а тем, что вызывающий знает про storage: buildHarness для
 * заведомо свежего, ensureReaderHarness для разделяемого между запросами, buildRoleHarness для
 * ролевой модели v1, где обвязка своя на каждую роль.
 */

import entities from '../entities/entities.mjs';
import jsonataDriver from '../helpers/jsonata.mjs';
import jsonataFunctions from '@global/jsonata/functions.mjs';
import {jsonataPerformanceLogger} from '../utils/logger/index.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {DEFAULT_ROLE} from '../utils/roles.mjs';
import type {ManifestStorage, RoleStorage} from './storage-types.ts';

const logger = getLoggerWithTag('storage-harness');

/**
 * Строит jsonata/entities/schema по манифесту безусловно. Для вызывающих, у которых storage заведомо
 * свежий: backend-инициализация и кластерный writer - там storage только что приехал из
 * loadStorageFromSources/joinStorages, и проверять наличие обвязки незачем.
 */
export async function buildHarness(storage: ManifestStorage): Promise<void> {
    storage.jsonata = jsonataDriver(() => {
        return jsonataFunctions(() => storage.jsonata, storage.manifest.functions || {}, jsonataPerformanceLogger);
    }, () => storage.schema);
    storage.entities = entities(storage.jsonata, storage.manifest);
    storage.schema = await storage.entities.getSchema();
}

/**
 * Обвязка ролевой модели v1 (только backend-режим, в кластере она запрещена): на каждый манифест роли
 * свой jsonata-драйвер, entities и schema. Обвязкой самого storage становится обвязка роли по умолчанию.
 */
export async function buildRoleHarness(storage: RoleStorage): Promise<void> {
    const manifests = storage.manifests || {};
    logger.debug(() => `build harness per role (roles model v1 is on): ${Object.keys(manifests).length} role(s), default role ${DEFAULT_ROLE}`);
    storage.roleJsonata = Object.fromEntries(
        Object.entries(manifests).map(([role, manifest]: [string, any]) => [role,
            jsonataDriver(() => {
                return jsonataFunctions(() => storage.roleJsonata[role], manifest.functions || {}, jsonataPerformanceLogger);
            }, () => storage.roleSchema[role])
        ])
    );
    storage.jsonata = storage.roleJsonata[DEFAULT_ROLE];
    storage.roleEntities = Object.fromEntries(
        Object.entries(manifests).map(([role, manifest]) => [role, entities(storage.jsonata, manifest)])
    );
    storage.entities = storage.roleEntities[DEFAULT_ROLE];
    storage.roleSchema = {};
    for (const [role, roleEntity] of Object.entries(storage.roleEntities)) {
        storage.roleSchema[role] = await (roleEntity as any).getSchema();
    }
    storage.schema = storage.roleSchema[DEFAULT_ROLE];
}

/**
 * Проверяет работоспособность обвязки, а не заполненность полей: из кеша storage может приехать с
 * jsonata/entities/schema, но после JSON.stringify jsonata теряет методы, а entities становится {}.
 * Проверка на "!== undefined" в таком случае соврала бы, и запрос упал бы на
 * jsonata.expression is not a function.
 */
function hasHarness(storage: ManifestStorage): boolean {
    return typeof storage.jsonata?.expression === 'function';
}

/**
 * Кластерный путь чтения: storage здесь разделяется между всеми запросами своей комбинации permission,
 * поэтому обвязку строим только если её ещё нет - пересборка на каждый запрос была бы и лишней
 * работой, и перезаписью общего состояния из-под параллельных запросов.
 *
 * Переиспользовать безопасно: jsonata-драйвер - объект конфигурации (состояние запроса живёт в том,
 * что возвращает .expression(...)), а entities хранит manifest и посчитанную по нему schema - и то,
 * и другое стабильно, пока не изменился манифест.
 */
export async function ensureReaderHarness(storage: ManifestStorage): Promise<void> {
    if (hasHarness(storage)) {
        logger.trace(() => `reuse harness of storage ${storage.permission}`);
        return;
    }
    logger.trace(() => `build harness for storage ${storage.permission}: no working jsonata on it yet (raised from cache or invalidated)`);
    await buildHarness(storage);
}
