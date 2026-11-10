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
      mtrhnv - 2026

  Contributors:
      mtrhnv - 2026
*/

import crypto from 'crypto';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import { v4 as uuidv4 } from 'uuid';
import {buildZipArchive, sendArchiveToAdapter} from '@back/helpers/gitcommit/utils.mjs';

const logger = getLoggerWithTag('gl-commit');

let ADAPTER_GITLAB_URL_SAVE;

const getRepositoryOptions = (path) => {
    let rootPath = path;
    if (!rootPath) {
        rootPath = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST;
    }
    const [protocol, projectID, source] = String(rootPath || '').split(':');
    const branch = source?.split('@')[0];
    if (protocol !== 'gitlab' || !projectID || !branch) {
        throw new Error(`Некорректный GitLab URI: ${rootPath}`);
    }
    return {
        protocol,
        projectID,
        branch
    };
};

const commitToGitlabApiAdapter = async({content, rootPath, userInfo}) => {
    const result = {
        success: false
    };
    try {
        if (!process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL) {
            logger.error(() => 'env VUE_APP_DOCHUB_GITLAB_ADAPTER_URL not exist or empty, it\'s required for save by adapter');
            throw new Error('Сохранение данных невозможно (1)');
        }

        if (!ADAPTER_GITLAB_URL_SAVE) {
            try {
                ADAPTER_GITLAB_URL_SAVE = new URL('/api/v1/send-files', process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL).toString();
            } catch (e) {
                logger.error(() => `Incorrect value in env VUE_APP_DOCHUB_GITLAB_ADAPTER_URL, can't create URL to gas ${process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL}`);
                result.success = false;
                throw new Error('Сохранение данных невозможно');
            }
        }

        const {sub, name, surname, email} = userInfo || {};
        if (!sub || !name || !surname) {
            throw new Error('Недостаточно данных пользователя из JWT-токена для отправки в gitlab-адаптер (sub/name/surname)');
        }

        const {protocol, projectID, branch} = getRepositoryOptions(rootPath);
        const repoUrl = `${protocol}:${projectID}`;

        const archiveBuffer = buildZipArchive(content);
        const checksum = crypto.createHash('sha256').update(archiveBuffer).digest('hex');
        const processId = uuidv4();

        const sendResult = await sendArchiveToAdapter({
            adapterUrl: ADAPTER_GITLAB_URL_SAVE,
            archiveBuffer: archiveBuffer,
            checksum: checksum,
            repoUrl: repoUrl,
            branch: branch,
            processId: processId,
            sub: sub,
            name: name,
            surname: surname,
            email: email
        });
        if (!sendResult.success) {
            const {message, error} = sendResult;
            return Object.assign(result, {message, error});
        }

        result.success = true;
    } catch (err) {
        const traceId = uuidv4();
        logger.error(() => `${traceId}: Error when put-content with gitlab adapter`, err);
        result.success = false;
        result.message = `Непредвиденная ошибка: ${traceId}`;
        result.error = err.message;
    }

    return result;
};

/**
 * @typedef {{
 *     content: object,
 *     rootPath: string,
 *     userInfo?: {
 *       sub?: string,
 *       name?: string,
 *       surname?: string,
 *       email?: string
 *     }
 * }} CommitData
 */

/**
 * @param {CommitData} data
 */
export const commitToGitlab = async(data) => {
    const writeMode = process.env.VUE_APP_DOCHUB_GITLAB_MODE;
    const content = data?.content;
    if (!content || typeof content !== 'object') {
        return {
            success: false,
            message: 'Некорректные данные для коммита в GitLab',
            error: 'content is required'
        };
    }
    logger.debug(() => [
        `Write files to gitlab with write mode ${writeMode}`,
        {title: 'fileNames', obj: Object.keys(content)}
    ]);
    switch (writeMode) {
        case 'adapter':
            return commitToGitlabApiAdapter({...data, content});
        default:
            return {
                success: false,
                message: 'Запись в GitLab доступна только через adapter (VUE_APP_DOCHUB_GITLAB_MODE=adapter)',
                error: `Неподдерживаемый режим записи: ${writeMode}`
            };
    }
};
