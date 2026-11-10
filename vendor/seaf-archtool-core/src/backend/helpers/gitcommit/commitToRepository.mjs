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
      mtrhnv, Sber - 2026

  Contributors:
      mtrhnv - 2026
*/

import {commitToBitbucket} from '@back/helpers/gitcommit/bitbucketCommit.mjs';
import {commitToGitlab} from '@back/helpers/gitcommit/gitlabCommit.mjs';

const BITBUCKET_PROTOCOL_NAME = 'bitbucket';
const GITLAB_PROTOCOL_NAME = 'gitlab';
export const ALLOW_PROTOCOLS_TO_COMMIT = [BITBUCKET_PROTOCOL_NAME, GITLAB_PROTOCOL_NAME];

/**
 * @param {{
 *   rootPath: string,
 *   content: object,
 *   userInfo?: object
 * }} data
 */
export const commitToRepository = async(data) => {
    const protocol = data.rootPath?.split(':')[0];
    if (protocol === GITLAB_PROTOCOL_NAME) {
        return commitToGitlab(data);
    }
    if (protocol === BITBUCKET_PROTOCOL_NAME) {
        return commitToBitbucket(data);
    }
    return {
        success: false,
        message: `Неподдерживаемый протокол репозитория: ${protocol}, поддерживается только ${ALLOW_PROTOCOLS_TO_COMMIT}`,
        error: 'commitToRepository'
    };
};
