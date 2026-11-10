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
 * Прогрев кешей по загруженному манифесту: датасеты и пользовательское меню. Состав и порядок шагов
 * общие для backend-инициализации и кластерного writer'а, различаются только аргументами.
 *
 * Валидаторов здесь нет намеренно: прогрев включается флагом warmupNeeded из root-манифеста, а
 * валидаторы должны отрабатывать независимо от него - вызывающий зовёт их отдельно. Решение
 * "нужно ли прогревать" тоже принимает вызывающий, здесь только исполнение.
 */

import datasetsWarmup from '../cluster/datasets-warmup.mjs';
import userMenuWarmup from '../cluster/user-menu-warmup.mjs';
import type {ManifestStorage} from './storage-types.ts';

interface WarmupOptions {
    /** режим работы ядра; влияет на то, как датасет-прогрев ключует кеш */
    isCluster: boolean;
    /** мета прошлой загрузки: по ней в кластере определяется, какие датасеты можно не пересчитывать */
    oldManifestMeta?: Record<string, any>;
}

/**
 * @param storage - storage с уже построенной обвязкой
 * @param cache - реализация кеша, в который складывается прогретое
 */
export async function warmupCaches(storage: ManifestStorage, cache: any, {isCluster, oldManifestMeta}: WarmupOptions): Promise<void> {
    await datasetsWarmup(storage, cache, isCluster, oldManifestMeta, {});
    await userMenuWarmup(storage, cache);
}
