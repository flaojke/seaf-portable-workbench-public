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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026
      Alexander Romashin <alexander.romashin@gmail.com>, Sber - 2026
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
*/

import {parseAbsoluteRepositoryPath, resolveConnectedRepositoryPath} from './repositoryPath.ts';
import {HttpError} from './httpError.mjs';
import {Parser} from '@global/manifest/parser3/index.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import cache from '@back/storage/cache.mjs';
import {
    CLUSTER_COMMAND_REFRESH_TIMESTAMP,
    CLUSTER_MANIFEST,
    CLUSTER_MANIFEST_META,
    CLUSTER_MANIFEST_PARSER
} from '@back/cluster/constants.mjs';
import {toStorageBlob} from '@back/storage/storage-blob.ts';
import {isCommonStorage} from '@back/storage/storage-types.ts';
import {dropStorages} from '@back/storage/storageHolder.ts';
import type {ManifestStorage, RoleStorage} from '@back/storage/storage-types.ts';

import YAML from 'yaml';
import objectHash from 'object-hash';

const logger = getLoggerWithTag('/b/h/putContent');

const normalizePathToFile = (path: string): string => {
  const CURRENT = '.';
  const BACK = '..';
  const PATH_SEPARATOR = '/';

  const splitedPath = path.split(PATH_SEPARATOR);

  let normalizedSlicedPath = [];

  for (let i = 0; i < splitedPath.length; i++) {
    const dir = splitedPath[i];
    switch (dir) {
      case BACK:
        normalizedSlicedPath = normalizedSlicedPath.slice(0, -1);
        break;
      case CURRENT:
      case '':
        break;
      default:
        normalizedSlicedPath.push(dir);
    }
  }
  return normalizedSlicedPath.join(PATH_SEPARATOR);
};

const normalizePathsInContent = (content: Record<string, any>, baseDir?: string) => {
  const contentWithNormalizedPaths = {};

  const appRootManifestRepositoryPath = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST.split('@')[0];

  for (const userSpecifiedUri in content) {
    // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости.
    // Её принимает parseAbsoluteRepositoryPath; без неё такой путь станет относительным и запишется в корневой
    // репозиторий файлом с '@bitbucket:...' в пути - при отказе от формы отклонять её явно
    let path = parseAbsoluteRepositoryPath(userSpecifiedUri);
    if (!path) {
        //  TODO: тут бы проверить что имя файла норм, а то ошибка непонятная (неправильно расширение) и позже
      const pathToFile = baseDir ? `${baseDir}/${userSpecifiedUri}` : userSpecifiedUri;
      path = `${appRootManifestRepositoryPath}@${pathToFile}`;
    }

    // репозиторий отделяет первая '@', дальше она может встречаться в пути к файлу (каталог '@name')
    const separator = path.indexOf('@');
    const repositoryInfo = path.slice(0, separator);
    const filePath = path.slice(separator + 1);

    const normalizedFilePath = normalizePathToFile(filePath);
    const normalizedUri = `${repositoryInfo}@${normalizedFilePath}`;

    contentWithNormalizedPaths[normalizedUri] = content[userSpecifiedUri];
  }

  return contentWithNormalizedPaths;
};

const reposFromAllFiles = (pathList: string[]): Set<string> => {
  return new Set(pathList.map((path) => path.split('@')[0]));
};

const parseContent = (url: string, content: string) => {
  if (url.endsWith('.yaml')) {
    return YAML.parse(content);
  } else if (url.endsWith('.json')) {
    return JSON.parse(content);
  } else {
    throw new HttpError(`Не удалось обработать файл ${url} (куда сохранять данные). Допустимые форматы: "yaml", "json".`, 400);
  }
};

/**
 * Приводит storage запроса к тому storage, в который допустима запись: у JoinedStorage это .writable,
 * так как по его склеенному permission в кеше нет ни манифеста, ни parser'а.
 *
 * Вызывать один раз в начале обработки запроса, а дальше по всей цепочке (валидация, restoreParser,
 * onChange, updateManifestInfo) работать только с результатом - иначе часть шагов уйдёт по склеенному
 * permission, а часть по настоящему.
 */
export function resolveWritableStorage(storage: ManifestStorage): RoleStorage {
  // Сюда можно попасть и без join: если манифест роли не поднялся, в req.storage останется один
  // только общий манифест. Писать в него нельзя - он общий для всех организаций
  if (isCommonStorage(storage)) {
    throw new HttpError('Общий манифест недоступен для записи', 400);
  }
  if (storage?.kind !== 'joined') {
    return storage;
  }
  if (!storage.writable) {
    // не-common частей несколько - непонятно, в манифест какой роли писать
    throw new HttpError('Сохранение данных не доступно если у пользователя есть права на несколько организаций', 400);
  }
  logger.debug(() => `put content: joined storage ${storage.permission}, write target is ${storage.writable.permission}`);
  return storage.writable;
}

export const validateAndFormatContent = (content: unknown, storage: RoleStorage, hash: string) => {
  if (!(content && typeof content === 'object' && !Array.isArray(content))) {
    throw new HttpError(
      'Отсутствует тело запроса, или нет обязательного атрибута content, или он не json объект (не массив)',
      400
    );
  }

  let baseDir = storage?.md5Map?.[hash];
  if (baseDir) {
    baseDir = baseDir.split('@')[1].split('/').slice(0, -1).join('/');
  }

  const contentWIthNormalizedPaths = normalizePathsInContent(content, baseDir);

  // Репозиторий пишем в написании манифеста: по нему parser узнаёт изменённый файл при обновлении манифеста
  const connectedContent = {};
  const unconnectedRepositories = [];
  for (const path in contentWIthNormalizedPaths) {
    const connectedPath = resolveConnectedRepositoryPath(path, storage?.repositorySources);
    if (connectedPath) {
      connectedContent[connectedPath] = contentWIthNormalizedPaths[path];
    } else {
      unconnectedRepositories.push(path);
    }
  }

  const repoList = reposFromAllFiles([...Object.keys(connectedContent), ...unconnectedRepositories]);
  if (repoList.size !== 1) {
    logger.info(() => 'Производимые изменения должны осуществляться в одном репозитории,' +
        ' файлы куда планируется сохранить данные, находятся в разных, это надо исправлять в yaml настройках таблицы.' +
        `Видимые репозитории: ${repoList}`);
    throw new HttpError('Производимые изменения должны осуществляться в одном репозитории,' +
        ' файлы куда планируется сохранить данные, находятся в разных, это надо исправлять в yaml настройках таблицы', 400);
  }

  if (unconnectedRepositories.length !== 0) {
    logger.info(() => 'Репозиторий изменяемого файла должен быть подключен к манифесту. ' +
        `Репозиторий, который не подключен (нет ни одного импорта) ${unconnectedRepositories}.` +
        'Данные из неподключенных репозиториев не попадут в манифест');
    throw new HttpError('Репозиторий изменяемого файла должен быть подключен к манифесту, это надо исправлять в yaml настройках таблицы', 400);
  }

  return connectedContent;
};

export const createCommitData = (validatedAndFormatedContent: Record<string, string>) => {
  const dataToCommit = {};
  let rootPath;
  for (const path in validatedAndFormatedContent) {
    const separator = path.indexOf('@');
    const repositoryInfo = path.slice(0, separator);
    const pathToFile = path.slice(separator + 1);
    dataToCommit[pathToFile] = validatedAndFormatedContent[path];

    if (!rootPath) {
      rootPath = repositoryInfo;
    }
  }

  return {
    rootPath: rootPath,
    content: dataToCommit
  };
};

export const createLayerUpdateDataByParser = (validatedAndFormatedContent: Record<string, string>) => {
  return Object.keys(validatedAndFormatedContent).map((path) => {
    return {
      [path]: parseContent(path, validatedAndFormatedContent[path])
    };
  });
};

export async function restoreParser(storage: RoleStorage): Promise<any> {
    if (storage.parser) {
        logger.debug(() => 'when restore parser for request, use existing parser in storage, not really restore');
        return storage.parser;
    }
    const permission = storage.permission;
    logger.debug(() => `restore parser for permission ${permission} from cache`);
    const parserFromCache = await cache.get(CLUSTER_MANIFEST_PARSER + `${permission}`);
    const parser = Parser.fromExistData(storage.manifest, JSON.parse(parserFromCache));
    // Parser пользуется полем cache (this.cache.request), но не объявляет его - реализация
    // инжектится снаружи
    (parser as any).cache = cache;
    return parser;
}

export async function updateManifestInfo(parser: any, storage: RoleStorage, isCluster: boolean): Promise<void> {
    const newHash = objectHash(parser.manifest);
    if (isCluster) {
        storage.hash = newHash;
        storage.manifestHash = newHash;
        storage.parser = null;
        await cache.set(CLUSTER_MANIFEST_PARSER + `${storage.permission}`, JSON.stringify(Parser.toPersistedData(parser)));
        // Той же схемой, что и manifest-loader при перезагрузке, - иначе в блоб попала бы рантайм-обвязка,
        // после сериализации нерабочая, но выглядящая заполненной при чтении
        await cache.set(CLUSTER_MANIFEST + `${storage.permission}`, JSON.stringify(toStorageBlob(storage)));
        // Читающая сторона берёт hash из меты, и по нему же ключуется кеш датасетов. Не обновив мету,
        // мы отдавали бы новое содержимое под старым hash, и представления продолжали бы показывать
        // значения, посчитанные по прежнему манифесту.
        //
        // Остальные поля меты сохраняем: problems и commonManifestHash нужны читающей стороне, а
        // successLoadTimestamp/tsVersion - бухгалтерия manifest-loader'а, из источников мы не грузили
        const metaKey = CLUSTER_MANIFEST_META + `${storage.permission}`;
        const manifestMeta = JSON.parse(await cache.get(metaKey)) || {};
        manifestMeta.manifestHash = newHash;
        await cache.set(metaKey, JSON.stringify(manifestMeta));

        // Сдвиг timestamp'а - сигнал остальным подам, что содержимое изменилось: мастер подхватит его
        // при ближайшем опросе и разошлёт полную инвалидацию. Какая именно permission изменилась,
        // мы не сообщаем: список не переживает двух событий в одном окне опроса
        await cache.set(CLUSTER_COMMAND_REFRESH_TIMESTAMP, Date.now());
        // Тот же сброс, что через ~5 секунд придёт от мастера (CHECK_CLUSTER_STATUS_INTERVAL), но
        // делаем сразу: этот процесс уже знает, что изменилось. Без него storage остаётся в локальном
        // кеше несогласованным - parser.onChange правит storage.manifest по ссылке, а schema и обвязка
        // остаются посчитанными по прежнему содержимому, и hasHarness() ничего не пересобирает
        logger.debug(() => `drop local storage ${storage.permission} right after write, do not wait for master broadcast`);
        dropStorages([storage.permission]);
    } else {
        storage.hash = newHash;
        storage.manifestHash = newHash;
        storage.hash = storage.manifestHash;
    }
}
