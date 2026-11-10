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
 * Загрузка манифеста из источников и сборка storage вокруг него. Единственная точка, где читаются
 * внешние источники (метамодель, документация, root-манифест, файл ролей v1) и где живёт глобальный
 * singleton парсера. Всё, что происходит после загрузки - обвязка, мёрж, прогрев - от модуля не зависит.
 *
 * Возвращается не манифест, а storage: манифест вместе с hash/md5Map/mergeMap/problems/repositorySources.
 */

import manifestParser from '@global/manifest/parser3/index.mjs';
import cache from './cache.mjs';
import md5 from 'md5';
import events from '../helpers/events.mjs';
import objectHash from 'object-hash';
import '../helpers/env.mjs';
import {DEFAULT_ROLE, isRolesMode, loader, newManifest} from '../utils/roles.mjs';
import uriTool, {addFileProtocolIfNoProtocol} from '../helpers/uri.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import type {RoleStorage} from './storage-types.ts';

const logger = getLoggerWithTag('manifest-source');
logger.info(() => `Manifest source uses manifest parser ${manifestParser.parserVersion}`);

/**
 * Parser пользуется этими полями (this.cache.request, this.onError, this.onStartReload,
 * this.onReloaded), но не объявляет их - они инжектятся снаружи. Описываем контракт инъекции здесь,
 * чтобы он был виден хотя бы на стороне вызывающего.
 */
interface ConfigurableParser {
    logger: unknown;
    cache: unknown;
    onError: (errorType: string, errorData: {uri?: string; error?: unknown}) => void;
    onStartReload: (parser?: unknown) => void;
    onReloaded: (parser?: unknown) => void;
}

// Конфигурация глобального singleton'а парсера: парсером пользуется только загрузка, дальше по
// конвейеру storage идёт уже без него
const configurableParser = manifestParser as unknown as ConfigurableParser;
configurableParser.logger = logger;
configurableParser.cache = cache;
configurableParser.onError = (errorType, errorData) => {
    logger.error(() => `Error of loading manifest (${errorType}) by url ${errorData.uri} -- ${errorData.error}`);
};
configurableParser.onStartReload = () => {
    logger.info(() => 'Manifest start reloading');
};
configurableParser.onReloaded = () => {
    logger.info(() => 'Manifest is reloaded');
};

export const pushRequest = manifestParser.pushRequest;

/**
 * Импортирует в парсер всё, из чего складывается манифест: метамодель, документацию и корневой
 * манифест (из аргумента либо из VUE_APP_DOCHUB_ROOT_MANIFEST). uri может быть массивом - так common
 * собирается из нескольких корней (общий root плюс root каждого архитектурного пакета)
 */
async function importFromSources(uri?: string | string[], addMetamodelAndDocs = true): Promise<void> {
    manifestParser.clean();
    manifestParser.startLoad();

    if (addMetamodelAndDocs) {
        const metamodel = addFileProtocolIfNoProtocol(process.env.VUE_APP_DOCHUB_METAMODEL || '/metamodel/root.yaml');
        logger.info(() => `start import metamodel by url ${metamodel}`);
        await manifestParser.import(metamodel);
        if ((process.env.VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS || 'y').toLowerCase() === 'y') {
            const documentationUrl = 'file:///documentation/dochub.yaml';
            logger.info(() => `start import docs by default url ${documentationUrl}`);
            await manifestParser.import(documentationUrl);
        } else {
            logger.info(() => `import docs disabled by VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS = ${process.env.VUE_APP_DOCHUB_APPEND_DOCHUB_DOCS}`);
        }
    }

    const uris = uri ? (Array.isArray(uri) ? uri : [uri]) : [];
    if (uris.length > 0) {
        for (const singleUri of uris) {
            const importUri = addFileProtocolIfNoProtocol(singleUri);
            logger.info(() => `start import manifest by url ${importUri}`);
            await manifestParser.import(importUri);
        }
    } else if (process.env.VUE_APP_DOCHUB_ROOT_MANIFEST) {
        const envParamManifest = addFileProtocolIfNoProtocol(process.env.VUE_APP_DOCHUB_ROOT_MANIFEST);
        logger.info(() => `start import manifest by env param ${envParamManifest}`);
        await manifestParser.import(envParamManifest);
    } else {
        logger.info(() => 'no manifest to import, params uri and env (process.env.VUE_APP_DOCHUB_ROOT_MANIFEST) not exist value');
    }

    manifestParser.checkAwaitedPackages();
    manifestParser.checkLoaded();
    manifestParser.stopLoad();
}

/**
 * Ролевая модель v1 (только backend-режим, в кластере запрещена): по файлу ролей строит отдельный
 * манифест на каждую роль, отфильтровав исходный. Ошибку загрузки файла ролей выше не поднимаем,
 * ограничиваемся записью в лог.
 */
async function buildRoleManifests(originManifest: Record<string, any>): Promise<Record<string, any>> {
    const manifests: Record<string, any> = {origin: originManifest};
    Object.freeze(manifests.origin);

    const {URI} = global.$roles;
    try {
        // форма файла ролей нигде не описана - грузится как есть из YAML/JSON
        const rolesManifest: any = await loader(uriTool.makeURL(URI).url);
        const defaultRoles: any = await loader(uriTool.makeURL('default.yaml', URI).url);
        const systemRoles = defaultRoles?.roles || [];
        const exclude = defaultRoles?.exclude || [];

        for (const role in rolesManifest?.roles) {
            const filters = systemRoles.concat(rolesManifest?.roles[role]);
            logger.debug(() => `start build manifest for role [${role}]`);
            manifests[role] = newManifest(manifests.origin, exclude, filters);
            logger.debug(() => `finish build manifest for role [${role}]`);
        }
    } catch (e: any) {
        logger.error(() => `Ошибка при загрузке манифеста с ролями ${e.uri || URI}: ${e.message}`);
    }
    return manifests;
}

/**
 * Карта склейки объектов (mergeMap) и карта путей к ресурсам по md5 пути (md5Map). Строятся вместе:
 * md5Map наполняется теми же ключами, на которые mergeMap ссылается через backend://<md5>/.
 */
function buildMergeAndMd5Maps(): {mergeMap: Record<string, string[]>; md5Map: Record<string, string>} {
    const mergeMap: Record<string, string[]> = {};
    const md5Map: Record<string, string> = {};

    for (const path in manifestParser.mergeMap) {
        mergeMap[path] = manifestParser.mergeMap[path].map((url) => {
            const hash = md5(path);
            md5Map[hash] = url;
            return `backend://${hash}/`;
        });
    }
    return {mergeMap, md5Map};
}

/**
 * Полная загрузка: импорт источников -> (при ролевой модели v1) манифесты ролей -> сборка storage.
 *
 * @param uri - корневой манифест; если не задан, берётся из VUE_APP_DOCHUB_ROOT_MANIFEST. Массив -
 *   несколько корней, сливаемых в одно дерево
 * @param addMetamodelAndDocs - подключать ли метамодель и документацию. В кластере их грузит общий
 *   манифест, а домены получают их мёржем с ним; если общего манифеста нет, грузит каждый домен
 */
export async function loadStorageFromSources(uri?: string | string[], addMetamodelAndDocs = true): Promise<RoleStorage> {
    logger.info(() => 'Run full reload manifest');
    cache.errorClear();

    await importFromSources(uri, addMetamodelAndDocs);

    let baseManifest = manifestParser.manifest;
    if (!baseManifest?.datasets) {
        baseManifest.datasets = {};
    }

    let manifests: Record<string, any> = {};
    if (isRolesMode()) {
        manifests = await buildRoleManifests(baseManifest);
        baseManifest = manifests[DEFAULT_ROLE];
    }

    // hash считаем по полному манифесту: при ролевой модели v1 baseManifest - это манифест одной
    // роли, поэтому берём весь набор манифестов ролей, иначе состояние контролировалось бы неполно
    const fullManifest = isRolesMode() ? manifests : manifestParser.manifest;
    const manifestHash = objectHash(fullManifest);
    const {mergeMap, md5Map} = buildMergeAndMd5Maps();
    const problems = Object.keys(cache.errors || {}).map((key) => cache.errors[key]) || [];

    logger.info(() => 'Full reload is done');
    logger.info(() => `Hash of manifest is ${manifestHash}`);

    if (problems.length) {
        events.onFoundLoadingError();
    }

    return {
        manifest: baseManifest,
        parser: manifestParser,
        hash: manifestHash,
        manifestHash,
        mergeMap,
        md5Map,
        manifests,
        roleId: DEFAULT_ROLE,
        problems,
        repositorySources: [...manifestParser.repositorySources]
    };
}
