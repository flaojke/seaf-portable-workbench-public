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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber
*/

import {strToU8, zipSync} from 'fflate';
import FormData from 'form-data';
import axios from 'axios';
import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';

const logger = getLoggerWithTag('b/h/gitcommit/utils');

export const buildZipArchive = (contentObject) => {
    const files = {};
    for (const path in contentObject) {
        files[path] = strToU8(contentObject[path]);
    }
    return Buffer.from(zipSync(files));
};


const parseAdapterError = (error) => {
    if (axios.isAxiosError(error)) {
        // Если это ошибка axios
        const status = error.response?.status || 0;
        const statusText = error.response?.data?.errorCode || 'Unknown code';
        const message = `id = ${error.response?.data?.errorId}: ${error.response?.data?.errorMessage}`;

        return {
            status,
            statusText,
            message,
            isAxiosError: true
        };
    } else if (error instanceof Error) {
        // Если это обычная ошибка JS
        return {
            status: 400,
            statusText: 'Client Error',
            message: error.message,
            isAxiosError: false
        };
    } else {
        // Если это что-то еще
        return {
            status: 400,
            statusText: 'Unknown Error',
            message: String(error),
            isAxiosError: false
        };
    }
};

export const sendArchiveToAdapter = async({adapterUrl, archiveBuffer, checksum, repoUrl, branch, processId, sub, name, surname, email}) => {
    const result = {
        success: false
    };

    const body = new FormData();
    body.append('process_id', processId);
    body.append('repo_url', repoUrl);
    body.append('sub', sub);
    body.append('name', name);
    body.append('surname', surname);
    if (email) {
        body.append('email', email);
    }
    body.append('branch_name', branch);
    body.append('file', archiveBuffer, {filename: 'archive.zip', contentType: 'application/zip'});

    const headers = {
        ...body.getHeaders(),
        'X-Checksum': checksum
    };

    logger.debug(() => [
        `send request to gas [POST] ${adapterUrl}`,
        {title: 'process_id', obj: processId},
        {title: 'repo_url', obj: repoUrl},
        {title: 'sub', obj: sub},
        {title: 'branch_name', obj: branch},
        {title: 'X-Checksum', obj: checksum}
    ]);

    try {
        await axios({
            method: 'POST',
            url: adapterUrl,
            headers: headers,
            data: body
        });
        result.success = true;
    } catch (err) {
        const axiosError = parseAdapterError(err);
        result.message = 'Ошибка при отправке файлов в gas';
        result.error = `${axiosError.status}: ${axiosError.statusText}: ${axiosError.message}`;
    }

    return result;
};

