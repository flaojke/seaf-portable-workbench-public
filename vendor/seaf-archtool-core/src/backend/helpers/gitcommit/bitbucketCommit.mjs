/*
  Copyright (C) 2023 Sber

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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Alexander Romashin <romashin.a.va@sberbank.ru>, Sber - 2025
*/

import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import bitbucket from '@back/helpers/bitbucket.mjs';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
import {parseBitbucketV1ApiError} from '@back/helpers/bitbucketErrorParser.mjs';
import { v4 as uuidv4 } from 'uuid';
import {BB_V1_DELAY_BETWEEN_COMMIT_FILE, BB_V1_FAST_FAIL_COMMIT_FILE} from '@back/helpers/env.mjs';
import {buildZipArchive, sendArchiveToAdapter} from '@back/helpers/gitcommit/utils.mjs';

const logger = getLoggerWithTag('bb-commit');

let ADAPTER_BITBUCKET_URL_SAVE;

const getRepositoryOptions = (bbPath) => {
    let rootPath = bbPath;
    if (!rootPath) {
        rootPath = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST;
    }
    const [protocol, projectID, repositoryID, source] = rootPath.split(':');
    const [branch] = source.split('@');
    const baseURL = process.env.VUE_APP_DOCHUB_BITBUCKET_URL;
    return {
        protocol,
        projectID,
        repositoryID,
        source,
        branch,
        baseURL: baseURL.endsWith('/') ? baseURL : `${baseURL}/`
    };
};

const checkItWasRequestWithoutChanges = (err) => {
    return (
        err?.response?.status === 409 &&
        err?.response?.data?.errors[0]?.message ===
        'The content provided is the same as what already exists. No change was committed.'
    );
};

const createBranch = async({newBranchName, repositoryOptions}) => {
    const result = {
        id: 0,
        stageName: 'Создание ветки',
        success: false
    };
    const {baseURL, projectID, repositoryID, branch} = repositoryOptions;
    result.message = `Создана ветка: ${newBranchName} от ветки ${branch} в репозитории ${repositoryID} в проекте ${projectID}`;
    const url = `${baseURL}rest/api/1.0/projects/${projectID}/repos/${repositoryID}/branches`;

    const body = {
        name: newBranchName,
        startPoint: `refs/heads/${branch}`
    };
    try {
        await axios({
            method: 'POST',
            url,
            data: body
        });
        result.success = true;
    } catch (err) {
        const axiosError = parseBitbucketV1ApiError(err);
        result.message = `Ошибка при создании ветки: ${newBranchName}`;
        result.error = `${axiosError.status}: ${axiosError.statusText}: ${axiosError.message}`;
    }
    return result;

};

const updateFile = async({branch, fileName, content, repositoryOptions, commitMessage}) => {
    const {baseURL, projectID, repositoryID} = repositoryOptions;

    const url = `${baseURL}rest/api/1.0/projects/${projectID}/repos/${repositoryID}/browse/${fileName}`;

    const body = new FormData();
    body.append('branch', branch);
    body.append('sourceCommitId', 'HEAD');
    body.append('content', content);
    body.append('message', commitMessage);

    const headers = body.getHeaders();

    logger.debug(() => [
        `send request to bb [PUT] ${url}`,
        {title: 'branch', obj: branch},
        {title: 'sourceCommitId', obj: 'HEAD'},
        {title: 'message', obj: commitMessage},
        {title: 'content', obj: content}
    ]);

    try {
        return await axios({
            method: 'PUT',
            headers,
            url,
            data: body
        });
    } catch (err) {
        if (!checkItWasRequestWithoutChanges(err)) {
            throw err;
        }
    }
};

const createNewFile = async({branch, fileName, content, repositoryOptions, commitMessage}) => {
    const {baseURL, projectID, repositoryID} = repositoryOptions;

    const url = `${baseURL}rest/api/1.0/projects/${projectID}/repos/${repositoryID}/browse/${fileName}`;

    const body = new FormData();
    body.append('branch', branch);
    body.append('type', 'file');
    body.append('message', commitMessage);
    body.append('content', content);

    const headers = body.getHeaders();

    return await axios({
        method: 'PUT',
        headers,
        url,
        data: body
    });
};

const createFileResult = ({path, branch, mode = null, success = false, message = undefined, error = undefined}) => {
    const result = {
        success: success,
        path: path,
        mode: mode,
        writeToBranch: branch
    };
    if (message !== undefined) {
        result.message = message;
    }
    if (error !== undefined) {
        result.error = error;
    }
    return result;
};

const writeFile = async({branch, fileName, content, repositoryOptions, commitMessage}) => {
    const result = createFileResult({path: fileName, branch: branch, mode: 'update', success: false});
    logger.debug(() => `try update file ${fileName} in branch ${branch}, with content [${JSON.stringify(content)}]`);
    try {
        await updateFile({branch, fileName, content, repositoryOptions, commitMessage});
        result.success = true;
        return result;
    } catch (err) {
        logger.debug(() => `updateFile ${fileName} get error`, err);
        if (err?.response?.status !== 404) {
            const axiosError = parseBitbucketV1ApiError(err);
            result.message = `Ошибка при обновлении файла "${fileName}" в ветке "${branch}"`;
            result.error = `${axiosError.status}: ${axiosError.statusText}: ${axiosError.message}`;
            throw result;
        }
        // если статус 404, то ничего не делаем, попробуем создать файл
    }

    result.mode = 'create';
    logger.debug(() => `${fileName} not found in branch ${branch}, create new`);
    try {
        await createNewFile({branch, fileName, content, repositoryOptions, commitMessage});
        result.success = true;
        return result;
    } catch (err) {
        const axiosError = parseBitbucketV1ApiError(err);
        logger.debug(() => [
            `createNewFile ${fileName} get error`,
            {title: 'axiosError', obj: axiosError}
        ]);
        result.message = `Ошибка при создании файла "${fileName}" в ветке "${branch}"`;
        result.error = `${axiosError.status}: ${axiosError.statusText}: ${axiosError.message}`;
        throw result;
    }
};

const writeFileListWidthDelay = async({branchName, contentObject, repositoryOptions, commitMessageSuffix}) => {
    const dataList = Object.entries(contentObject);

    const result = {
        id: 1,
        stageName: 'Запись файлов',
        files: [],
        success: true
    };

    for (let i = 0; i < dataList.length; i++) {
        const [path, data] = dataList[i];
        logger.debug(() => `write file ${path}, data [${JSON.stringify(data)}]`);
        try {
            const commitMessage = `seaf: Сохранение файла ${path} ${commitMessageSuffix}`;
            const fileResult = await writeFile({
                branch: branchName,
                fileName: path,
                content: data,
                repositoryOptions: repositoryOptions,
                commitMessage: commitMessage
            });
            result.files.push(fileResult);
        } catch (errorObject) {
            result.files.push(errorObject);
            result.success = false; // если хоть один файл не удалось загрузить - считаем шаг с ошибкой
            result.error = errorObject.error;
            result.message = errorObject.message;

            if (BB_V1_FAST_FAIL_COMMIT_FILE) {
                const skippedFiles = dataList.slice(i + 1).map(([skippedPath]) => createFileResult({
                    path: skippedPath,
                    branch: branchName,
                    mode: 'skipped',
                    success: false,
                    message: `Запись файла "${skippedPath}" пропущена: остановлено после ошибки в файле "${path}"`
                }));
                result.files.push(...skippedFiles);
                break;
            }
        }
        if (i < dataList.length - 1) { // для последнего элемента пауза не нужна
            await new Promise(resolve => setTimeout(resolve, BB_V1_DELAY_BETWEEN_COMMIT_FILE));
        }
    }

    return result;
};

const createPR = async({fromBranch, repositoryOptions, commitMessageSuffix}) => {
    const {baseURL, projectID, repositoryID, branch} = repositoryOptions;
    const result = {
        id: 2,
        stageName: `Создание pull request из ветки ${fromBranch} в ветку ${branch}`,
        success: false
    };

    const url = `${baseURL}rest/api/1.0/projects/${projectID}/repos/${repositoryID}/pull-requests`;

    const body = {
        title: `SEAF put content ${commitMessageSuffix}`,
        // description: 'Описание для PR',
        closeSourceBranch: true,
        fromRef: {
            id: `refs/heads/${fromBranch}`
        },
        toRef: {
            id: `refs/heads/${branch}`
        }
    };

    try {
        const axiosResponse = await axios({
            method: 'POST',
            url,
            data: body
        });
        const data = axiosResponse.data;
        result.prId = data?.id;
        result.prVersion = data?.version;

        if (result.prId == null || result.prVersion == null) {
            logger.error(() => [
                'incorrect bitbucket answer for create pr',
                {title: 'answer.data', obj: data}
            ]);
            throw new Error('Bitbucket return incorrect answer');
        }

        result.message = `Создан PR #${result.prId}`;
        result.success = true;
        return result;
    } catch (err) {
        const axiosError = parseBitbucketV1ApiError(err);
        result.message = `Ошибка при создании pull-request ("${fromBranch}" ~> "${branch}")`;
        result.error = `${axiosError.status}: ${axiosError.statusText}: ${axiosError.message}`;
        return result;
    }
};

const mergePR = async({prId, version, repositoryOptions}) => {

    const result = {
        id: 3,
        stageName: `Слияние pull request #${prId}`,
        success: false
    };
    const {baseURL, projectID, repositoryID} = repositoryOptions;

    const url = `${baseURL}rest/api/1.0/projects/${projectID}/repos/${repositoryID}/pull-requests/${prId}/merge`;

    const body = {
        version
    };

    try {
        await axios({
            method: 'POST',
            url,
            data: body
        });
        result.message = 'PR успешно влит';
        result.success = true;
    } catch (err) {
        const axiosError = parseBitbucketV1ApiError(err);
        result.message = `Merge-request #${prId} завершился с ошибкой`;
        result.error = `${axiosError.status}: ${axiosError.statusText}: ${axiosError.message}`;
    }
    return result;
};

const commitToBitbucketApiV1 = async({content, rootPath, userInfo}) => {
    const result = {
        success: false,
        stack: []
    };

    try {
        logger.debug(() => `Объект userInfo перед попыткой коммита в bitbucket: ${JSON.stringify(userInfo)}`);
        const {sub, name, surname} = userInfo || {};
        if (!sub || !name || !surname) {
            throw new Error('Недостаточно данных пользователя из JWT-токена для отправки в bitbucket (sub/name/surname)');
        }

        const commitMessageAuthorSuffix = `от ${name} ${surname} (${sub})`;

        const newBranchName = `commit/${Date.now()}`;
        const repositoryOptions = getRepositoryOptions(rootPath);
        const createBranchResult = await createBranch({newBranchName: newBranchName, repositoryOptions: repositoryOptions});
        result.stack.push(createBranchResult);
        if (!createBranchResult.success) {
            const {message, error} = createBranchResult;
            return Object.assign(result, {message, error});
        }

        const writeFilesResult = await writeFileListWidthDelay({
            branchName: newBranchName,
            contentObject: content,
            repositoryOptions: repositoryOptions,
            commitMessageSuffix: commitMessageAuthorSuffix
        });
        result.stack.push(writeFilesResult);
        if (!writeFilesResult.success) {
            logger.debug(() => [
                'error when save file in bb',
                {title: 'result.writeFiles', obj: writeFilesResult}
            ]);
            const {message, error} = writeFilesResult;
            return Object.assign(result, {message, error});
        }

        const pullRequestResult = await createPR({
            fromBranch: newBranchName,
            repositoryOptions: repositoryOptions,
            commitMessageSuffix: commitMessageAuthorSuffix
        });
        result.stack.push(pullRequestResult);
        if (!pullRequestResult.success) {
            const {message, error} = pullRequestResult;
            return Object.assign(result, {message, error});
        }

        const { prId, prVersion } =  pullRequestResult;

        const mergeRequestResult = await mergePR({
            prId: prId,
            version: prVersion,
            repositoryOptions: repositoryOptions
        });
        result.stack.push(mergeRequestResult);
        if (!mergeRequestResult.success) {
            const {message, error} = mergeRequestResult;
            Object.assign(result, {message, error});
        }
        result.success = mergeRequestResult.success; // процесс успешно завершен, если последний шаг успешный
    } catch (err) {
        const traceId = uuidv4();
        logger.error(() => `${traceId}: Error when put-content, state = ${result}`, err);
        result.success = false;
        result.message = `Непредвиденная ошибка: ${traceId}`;
        result.error = err.message;
    }
    return result;
};

const commitToBitbucketApiV2 = async({content}) => {
    const result = {
        success: false,
        createBranch: null,
        writeFiles: null,
        createPR: null,
        mergePR: null
    };
    const {projectID, repositoryID, branch} = getRepositoryOptions();

    const requestUri = bitbucket.makeSourceURI(projectID, repositoryID);

    const data = new URLSearchParams();
    data.append('branch', branch);

    for (let url in content) {
        data.append(url, content[url]);
    }

    try {
        await axios({
            method: 'POST',
            url: requestUri.toString(),
            data
        });
        result.success = true;
    } catch (err) {
        const traceId = uuidv4();
        logger.error(() => `${traceId}: error when put content with bb v2`, err);
        const axiosError = parseBitbucketV1ApiError(err);
        result.message = `Непредвиденная ошибка: ${traceId}`;
        result.error = axiosError.message;
        result.success = false;
    }
    return result;
};

const commitToBitbucketApiAdapter = async({content, rootPath, userInfo}) => {
    const result = {
        success: false
    };
    try {
        if (!process.env.VUE_APP_DOCHUB_BITBUCKET_ADAPTER_URL) {
            logger.error(() => 'env VUE_APP_DOCHUB_BITBUCKET_ADAPTER_URL, not exist or empty, it\'s required for save by adapter');
            throw new Error('Сохранение данных невозможно (1)');
        }


        if (!ADAPTER_BITBUCKET_URL_SAVE) {
            try {
                ADAPTER_BITBUCKET_URL_SAVE = new URL('/api/v1/send-files', process.env.VUE_APP_DOCHUB_BITBUCKET_ADAPTER_URL).toString();
            } catch (e) {
                logger.error(() => `Incorrect value in env VUE_APP_DOCHUB_BITBUCKET_ADAPTER_URL, can't create URL to gas ${process.env.VUE_APP_DOCHUB_BITBUCKET_ADAPTER_URL}`);
                result.success = false;
                throw new Error('Сохранение данных невозможно');
            }
        }

        const {sub, name, surname, email} = userInfo || {};
        if (!sub || !name || !surname) {
            throw new Error('Недостаточно данных пользователя из JWT-токена для отправки в bitbucket-адаптер (sub/name/surname)');
        }

        const {protocol, projectID, repositoryID, branch} = getRepositoryOptions(rootPath);
        const repoUrl = `${protocol}:${projectID}:${repositoryID}`;

        const archiveBuffer = buildZipArchive(content);
        const checksum = crypto.createHash('sha256').update(archiveBuffer).digest('hex');
        const processId = uuidv4();

        const sendResult = await sendArchiveToAdapter({
            adapterUrl: ADAPTER_BITBUCKET_URL_SAVE,
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
        logger.error(() => `${traceId}: Error when put-content with bb adapter`, err);
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
 *
 * @param {CommitData} data
 */
export const commitToBitbucket = (data) => {
    let writeMode = process.env.VUE_APP_DOCHUB_BITBUCKET_WRITE_MODE;
    if (!writeMode) {
        writeMode = process.env.VUE_APP_DOCHUB_BITBUCKET_MODE; // по дефолту берем режим чтения, чтобы работало у тех кто не испольузет адаптер
    }
    logger.debug(() => [
        `Write files to bb with write mode ${writeMode}`,
        {title: 'fileNames', obj: Object.keys(data?.content)}
    ]);
    switch (writeMode) {
        case 'v1':
            return commitToBitbucketApiV1(data);
        case 'v2':
            return commitToBitbucketApiV2(data);
        case 'adapter':
            return commitToBitbucketApiAdapter(data);
        default:
            throw Error('Некорректно указано значение VUE_APP_DOCHUB_BITBUCKET_WRITE_MODE');
    }
};
