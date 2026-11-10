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

import { BITBUCKET_URI_PREFIX, GITLAB_URI_PREFIX } from '@global/constants.mjs';
import { createRepositoryIDfromURI } from '@global/manifest/parser3/helpers.mjs';
import { HttpError } from './httpError.mjs';

const REPOSITORY_PROTOCOLS: string[] = [BITBUCKET_URI_PREFIX, GITLAB_URI_PREFIX];
// TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
const LEGACY_ABSOLUTE_PATH_PREFIX = '@';

function parseURL(path: string): URL | null {
    try {
        return new URL(path);
    } catch {
        return null;
    }
}

// Раскодирует путь из URL; некорректное %-кодирование оставляет как есть
export function decodePath(path: string): string {
    try {
        return decodeURIComponent(path);
    } catch {
        return path;
    }
}

/**
 * Разбирает путь к файлу так же, как его потом прочтёт request (new URL), а не по формату: иначе
 * абсолютный путь, не похожий на формат (регистр схемы, кириллица, пробелы), ушёл бы на чтение и
 * запись как относительный, минуя проверку репозитория по манифесту.
 *
 * @param path путь из профиля документа; из URL запроса - уже раскодированный
 * @returns абсолютный путь к файлу репозитория вида 'bitbucket:P:R:B@path/file.yaml' (схема в нижнем
 *          регистре, путь к файлу раскодирован) или null для относительного пути
 * @throws HttpError 400 - абсолютный URL не на репозиторий (http:, file: и т.п.) или не по формату
 */
export function parseAbsoluteRepositoryPath(path: string): string | null {
    let url = parseURL(path);
    // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости.
    // Остальное с '@' в начале - относительный путь (каталог '@name' в репозитории)
    if (!url && path.startsWith(LEGACY_ABSOLUTE_PATH_PREFIX)) {
        const legacyURL = parseURL(path.slice(LEGACY_ABSOLUTE_PATH_PREFIX.length));
        if (legacyURL && REPOSITORY_PROTOCOLS.includes(legacyURL.protocol)) {
            url = legacyURL;
        }
    }
    if (!url) {
        return null;
    }
    if (!REPOSITORY_PROTOCOLS.includes(url.protocol)) {
        throw new HttpError(`Недопустимый путь к файлу ${path}: допустимы относительные пути и пути к репозиториям (${REPOSITORY_PROTOCOLS.join(', ')})`, 400);
    }
    const repositoryPath = `${url.protocol}${decodePath(url.pathname)}`;
    // bitbucket:проект:репозиторий:ветка@путь, gitlab:проект:ветка@путь - так же их разбирает uri.mjs при чтении
    const separator = repositoryPath.indexOf('@');
    const segments = repositoryPath.slice(url.protocol.length, separator).split(':');
    const segmentCount = url.protocol === BITBUCKET_URI_PREFIX ? 3 : 2;
    if (separator < 0 || separator === repositoryPath.length - 1 || segments.length !== segmentCount || segments.some((segment) => !segment)) {
        throw new HttpError(`Путь к файлу ${path} не соответствует формату 'bitbucket:проект:репозиторий:ветка@путь' или 'gitlab:проект:ветка@путь'`, 400);
    }
    return repositoryPath;
}

// В Bitbucket ключ проекта и slug репозитория не зависят от регистра (их приводит к нужному виду драйвер)
function repositoryKey(repositoryID: string): string {
    return repositoryID.startsWith(BITBUCKET_URI_PREFIX) ? repositoryID.toLowerCase() : repositoryID;
}

/**
 * Сверяет репозиторий пути с репозиториями манифеста.
 *
 * @param repositoryPath абсолютный путь к файлу репозитория (результат parseAbsoluteRepositoryPath)
 * @param repositorySources репозитории, подключенные к манифесту
 * @returns тот же путь с написанием репозитория из манифеста (по нему parser узнаёт файл при обновлении
 *          манифеста после записи) или null, если репозиторий к манифесту не подключен
 */
export function resolveConnectedRepositoryPath(repositoryPath: string, repositorySources: string[] = []): string | null {
    const repositoryID: string = createRepositoryIDfromURI(repositoryPath);
    const key = repositoryKey(repositoryID);
    const source = repositorySources.find((item) => repositoryKey(item) === key);
    return source ? `${source}${repositoryPath.slice(repositoryID.length)}` : null;
}
