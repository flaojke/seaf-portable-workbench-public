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
 * Мёрж нескольких storage в один. Чистая функция от данных, вынесена отдельно, чтобы читающая
 * сторона не тянула за собой парсер, кеш, прогрев и ролевую модель.
 */

import {mergeDeep} from '@global/helpers/mergedeep.mjs';
import {combineManifestHashes} from '@back/helpers/cachePrefixByDomain.mjs';
import {isCommonStorage} from './storage-types.ts';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import type {ManifestStorage, RoleStorage} from './storage-types.ts';

const logger = getLoggerWithTag('storage-join');

/**
 * Мёржит N уже загруженных storage (роль+common либо несколько ролей на чтении) по данным:
 * .manifest/.md5Map/.hash/.permission/.problems/.repositorySources. Обвязку не строит - вызывающий обязан пересобрать
 * её от смёрженного .manifest, иначе кастомные функции и пути одной из частей окажутся невидимы при
 * вычислении датасетов, меню и валидаторов.
 *
 * Один элемент возвращается как есть: он и так представление самого себя, повторно хешировать и
 * помечать его как join не нужно.
 */
export function joinStorages(storages: RoleStorage[]): ManifestStorage {
    if (storages.length === 1) {
        logger.trace(() => `nothing to join: the only storage ${storages[0]?.permission} is returned as is, without join mark`);
        return storages[0];
    }
    const manifest = mergeDeep({}, storages.map((s) => s.manifest));
    const md5Map = Object.assign({}, ...storages.map((s) => s.md5Map));
    const hash = combineManifestHashes(storages.map((s) => s.hash));
    const permission = storages.map((s) => s.permission).join('|');
    const problems = storages.flatMap((s) => s.problems ?? []);
    // Читать по абсолютному пути можно из репозитория любой части: на каждую у пользователя есть доступ
    const repositorySources = [...new Set(storages.flatMap((s) => s.repositorySources ?? []))];
    const writableParts = storages.filter((s) => !isCommonStorage(s));
    logger.trace(() => `join ${storages.length} storages (${permission}) into one view, hash ${hash}, writable part ${writableParts.length === 1 ? writableParts[0].permission : 'is not defined (not exactly one non-common part)'}`);

    return {
        kind: 'joined',
        manifest,
        md5Map,
        hash,
        manifestHash: hash,
        permission,
        problems,
        repositorySources,
        parts: storages,
        // Писать можно, только когда не-common часть ровно одна. Несколько ролей сразу - писать
        // некуда, и это штатная ситуация, а не ошибка
        writable: writableParts.length === 1 ? writableParts[0] : undefined
    };
}
