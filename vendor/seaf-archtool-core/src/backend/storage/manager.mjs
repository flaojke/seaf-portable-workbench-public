/*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2023
	  R.Piontik <r.piontik@mail.ru> - 2024
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2024
      Temnyakov Nikolay <temnjakovn@gmail.com>, Sber - 2024
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
*/

import cache from './cache.mjs';
import '../helpers/env.mjs';
import {isRolesMode} from '../utils/roles.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {DEFAULT_PERMISSION_FOR_COMMON_MANIFEST} from '../cluster/constants.mjs';
import {buildHarness, buildRoleHarness} from './harness.ts';
import {warmupCaches} from './warmup-pipeline.ts';
import validators from '../helpers/validators.mjs';
import {joinStorages} from './storage-join.ts';
import {isCommonStorage} from './storage-types.ts';

const LOG_TAG = 'storage-manager';
const logger = getLoggerWithTag(LOG_TAG);

// Общий выход из buildWriterHarness, когда прогрев не даст нового результата: обе ветки
// заканчиваются одинаково, разнится только текст в лог
function skipWarmup(storage, oldManifestMeta, message) {
    logger.debug(() => message);
    storage.problems = oldManifestMeta?.problems ?? storage.problems;
    return storage;
}

export default {
    // Backend-режим (isCluster=false): манифест один глобальный, common тут не бывает, сравнивать
    // hash с прошлым разом не с чем - прогрев, если он включён, выполняется всегда
    applyManifest: async function(storage) {
        // валидаторам и прогреву ниже нужна schema
        if (isRolesMode()) {
            await buildRoleHarness(storage);
        } else {
            logger.debug(() => 'build harness for a single manifest (roles model v1 is off)');
            await buildHarness(storage);
        }
        storage.hash = storage.manifestHash;
        if (storage.warmupNeeded) {
            await warmupCaches(storage, cache, {isCluster: false, oldManifestMeta: undefined});
        } else {
            logger.debug(() => 'skip datasets/user-menu warmup: warmupNeeded is off for this import in root manifest');
        }
        // Валидаторы вне гейта warmupNeeded: прогрев кешей и проверка манифеста на соответствие
        // правилам - разные вещи
        await validators(storage);
        return storage;
    },
    // Cluster-writer путь, по одному permission за раз. Ролевой модели v1 здесь нет: в кластере она
    // запрещена и падает на старте. Для не изменившегося с прошлой загрузки манифеста harness не
    // строится вовсе - ни прогрев, ни валидаторы нового результата не дадут, problems берутся из
    // прошлой меты. Сам harness одноразовый, нужен прогреву с валидаторами и в БД не персистится
    buildWriterHarness: async function(storage, oldManifestMeta, commonManifestHash, getCommonStorageData) {
        storage.hash = storage.manifestHash;
        // target - манифест, на котором реально считаются датасеты/меню/валидаторы: сама роль либо
        // роль, смёрженная с common. harness строится уже после развилки, одинаково для обеих веток.
        // Возвращается и персистится при этом всегда storage, а не target
        let target;
        if (!getCommonStorageData) {
            logger.debug(() => `Manifest ${storage.permission}: no-common path, common manifest is not loaded in this cycle (no 'common' in root manifest, or roles model v2 is off)`);
            if (storage.hash === oldManifestMeta?.manifestHash) {
                // Манифест не изменился с прошлого раза - прогрев датасетов и валидаторы не дадут новый результат
                return skipWarmup(storage, oldManifestMeta, `Manifest ${storage.permission} not changed, skip datasets/user-menu warmup and validators`);
            }
            target = storage;
        } else {
            storage.commonManifestHash = commonManifestHash;
            const manifestUnchanged = storage.hash === oldManifestMeta?.manifestHash;
            const commonUnchanged = commonManifestHash !== undefined && commonManifestHash === oldManifestMeta?.commonManifestHash;
            // По одному сообщению skipWarmup не видно, что именно изменилось - манифест роли или
            // common, - а от этого зависит, чего ждать от прогрева
            logger.debug(() => `Manifest ${storage.permission}: with-common path, role manifest ${manifestUnchanged ? 'not changed' : `changed (${oldManifestMeta?.manifestHash} -> ${storage.hash})`}, common ${commonUnchanged ? 'not changed' : `changed (${oldManifestMeta?.commonManifestHash} -> ${commonManifestHash})`}`);
            if (manifestUnchanged && commonUnchanged) {
                return skipWarmup(storage, oldManifestMeta, `Manifest ${storage.permission} and common manifest not changed, skip warmup and validators`);
            }
            const commonStorageData = await getCommonStorageData();
            target = joinStorages([
                storage,
                {
                    manifest: commonStorageData.manifest,
                    md5Map: commonStorageData.md5Map,
                    hash: commonManifestHash,
                    permission: DEFAULT_PERMISSION_FOR_COMMON_MANIFEST
                }
            ]);
        }
        await buildHarness(target); // валидаторам и прогреву нужна schema
        // Прогрев и валидаторы складывают проблемы в target.problems, но в ветке с common target -
        // новый объект от joinStorages со своим массивом, а персистится storage роли. Без подмены
        // массива результаты валидации потерялись бы вместе с одноразовым target
        target.problems = storage.problems;
        if (storage.warmupNeeded) {
            await warmupCaches(target, cache, {isCluster: true, oldManifestMeta});
        } else {
            logger.debug(() => `Manifest ${storage.permission}: skip datasets/user-menu warmup, warmupNeeded is off for this import in root manifest`);
        }
        // Исключение - сам common: он проверяется в составе каждой роли, на смёрженном target.
        // Отдельно пользователю он не отдаётся, данных в нём нет, а найденные на нём проблемы уехали
        // бы в мету __common и на чтении примешались бы к problems каждой роли
        if (!isCommonStorage(storage)) {
            await validators(target);
        } else {
            logger.debug(() => `Manifest ${storage.permission}: skip validators, common manifest is validated as a part of every role`);
        }
        return storage;
    }
};

