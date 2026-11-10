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

import {describe, expect, it, jest} from '@jest/globals';

const mockCommitToBitbucket = jest.fn(async() => ({success: true, source: 'bitbucket'}));
const mockCommitToGitlab = jest.fn(async() => ({success: true, source: 'gitlab'}));

jest.mock('@back/helpers/gitcommit/bitbucketCommit.mjs', () => ({
    commitToBitbucket: (...args) => mockCommitToBitbucket(...args)
}));

jest.mock('@back/helpers/gitcommit/gitlabCommit.mjs', () => ({
    commitToGitlab: (...args) => mockCommitToGitlab(...args)
}));

import {commitToRepository} from '@back/helpers/gitcommit/commitToRepository.mjs';

describe('commitToRepository', () => {
    it('маршрутизирует bitbucket URI в commitToBitbucket', async() => {
        mockCommitToBitbucket.mockClear();
        const result = await commitToRepository({
            rootPath: 'bitbucket:PROJ:repo:main',
            content: {'root.yaml': 'data: 1'}
        });
        expect(mockCommitToBitbucket).toHaveBeenCalledWith(expect.objectContaining({rootPath: 'bitbucket:PROJ:repo:main'}));
        expect(result.source).toBe('bitbucket');
    });

    it('маршрутизирует gitlab URI в commitToGitlab с rootPath, content и userInfo', async() => {
        mockCommitToGitlab.mockClear();
        const content = {'root.yaml': 'data: 1'};
        const userInfo = {sub: 'user-1', name: 'Ivan', surname: 'Petrov'};
        const rootPath = 'gitlab:2:main';
        const result = await commitToRepository({
            rootPath,
            content,
            userInfo
        });
        expect(mockCommitToGitlab).toHaveBeenCalledWith({
            content,
            rootPath: rootPath,
            userInfo
        });
        expect(result.source).toBe('gitlab');
    });

    it('возвращает ошибку для неизвестного протокола', async() => {
        const result = await commitToRepository({
            rootPath: 'unknown:1:main',
            content: {}
        });
        expect(result.success).toBe(false);
    });
});
