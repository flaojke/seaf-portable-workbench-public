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

import {afterEach, describe, expect, it, jest} from '@jest/globals';

const mockAxios = jest.fn(async() => ({status: 200}));
jest.mock('axios', () => ({
    __esModule: true,
    default: Object.assign((...args) => mockAxios(...args), {
        isAxiosError: (error) => error?.isAxiosError === true
    })
}));
jest.mock('uuid', () => ({
    v4: () => '00000000-0000-4000-8000-000000000001'
}));

const restoreEnv = (name, original) => {
    if (original === undefined) {
        delete process.env[name];
    } else {
        process.env[name] = original;
    }
};

async function importCommitToGitlab(freshModule = false) {
    if (freshModule) {
        jest.resetModules();
    }
    const module = await import('@back/helpers/gitcommit/gitlabCommit.mjs');
    return module.commitToGitlab;
}

describe('commitToGitlab', () => {
    const originalMode = process.env.VUE_APP_DOCHUB_GITLAB_MODE;
    const originalAdapterUrl = process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL;

    afterEach(() => {
        restoreEnv('VUE_APP_DOCHUB_GITLAB_MODE', originalMode);
        restoreEnv('VUE_APP_DOCHUB_GITLAB_ADAPTER_URL', originalAdapterUrl);
        mockAxios.mockClear();
    });

    it('возвращает ошибку без content', async() => {
        const commitToGitlab = await importCommitToGitlab();
        const result = await commitToGitlab({
            rootPath: 'gitlab:2:main'
        });
        expect(result.success).toBe(false);
        expect(result.error).toBe('content is required');
    });

    it('возвращает ошибку при режиме api (без adapter)', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'api';
        const commitToGitlab = await importCommitToGitlab(true);
        const result = await commitToGitlab({
            rootPath: 'gitlab:2:main',
            content: {'root.yaml': 'data: 1'}
        });
        expect(result.success).toBe(false);
        expect(result.message).toContain('adapter');
    });

    it('в режиме adapter передаёт branch_name, process_id и X-Checksum', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'adapter';
        process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL = 'http://gas.example:8082';
        jest.resetModules();
        const {default: FormDataImpl} = await import('form-data');
        const {commitToGitlab} = await import('@back/helpers/gitcommit/gitlabCommit.mjs');
        const appendSpy = jest.spyOn(FormDataImpl.prototype, 'append');
        try {
            const result = await commitToGitlab({
                rootPath: 'gitlab:2:release/1.0@root.yaml',
                content: {'root.yaml': 'data: 1'},
                userInfo: {
                    sub: 'user-1',
                    name: 'Ivan',
                    surname: 'Petrov',
                    email: 'ivan@example.com'
                }
            });
            expect(result.success).toBe(true);
            expect(appendSpy).toHaveBeenCalledWith('branch_name', 'release/1.0');
            expect(appendSpy).toHaveBeenCalledWith('repo_url', 'gitlab:2');
            expect(appendSpy).toHaveBeenCalledWith('process_id', '00000000-0000-4000-8000-000000000001');
            expect(mockAxios).toHaveBeenCalledWith(expect.objectContaining({
                method: 'POST',
                headers: expect.objectContaining({
                    'X-Checksum': expect.any(String)
                })
            }));
        } finally {
            appendSpy.mockRestore();
        }
    });

    it('возвращает ошибку без VUE_APP_DOCHUB_GITLAB_ADAPTER_URL', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'adapter';
        delete process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL;
        const commitToGitlab = await importCommitToGitlab(true);
        const result = await commitToGitlab({
            rootPath: 'gitlab:2:main@root.yaml',
            content: {'root.yaml': 'data: 1'},
            userInfo: {sub: 'u1', name: 'Ivan', surname: 'Petrov'}
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Сохранение данных невозможно');
    });

    it('возвращает ошибку при некорректном adapter URL', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'adapter';
        process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL = 'not-a-valid-url';
        const commitToGitlab = await importCommitToGitlab(true);
        const result = await commitToGitlab({
            rootPath: 'gitlab:2:main@root.yaml',
            content: {'root.yaml': 'data: 1'},
            userInfo: {sub: 'u1', name: 'Ivan', surname: 'Petrov'}
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Сохранение данных невозможно');
    });

    it('возвращает ошибку без sub/name/surname в userInfo', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'adapter';
        process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL = 'http://gas.example:8082';
        const commitToGitlab = await importCommitToGitlab(true);
        const result = await commitToGitlab({
            rootPath: 'gitlab:2:main@root.yaml',
            content: {'root.yaml': 'data: 1'},
            userInfo: {sub: 'u1'}
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('sub/name/surname');
    });

    it('возвращает message и error при ошибке axios', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'adapter';
        process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL = 'http://gas.example:8082';
        mockAxios.mockRejectedValueOnce(new Error('adapter request failed'));
        const commitToGitlab = await importCommitToGitlab(true);
        const result = await commitToGitlab({
            rootPath: 'gitlab:2:main@root.yaml',
            content: {'root.yaml': 'data: 1'},
            userInfo: {sub: 'u1', name: 'Ivan', surname: 'Petrov'}
        });
        expect(result.success).toBe(false);
        expect(result.message).toBe('Ошибка при отправке файлов в gas');
        expect(result.error).toContain('adapter request failed');
    });

    it('возвращает ошибку при некорректном GitLab URI', async() => {
        process.env.VUE_APP_DOCHUB_GITLAB_MODE = 'adapter';
        process.env.VUE_APP_DOCHUB_GITLAB_ADAPTER_URL = 'http://gas.example:8082';
        const commitToGitlab = await importCommitToGitlab(true);
        const result = await commitToGitlab({
            rootPath: 'not-gitlab:bad',
            content: {'root.yaml': 'data: 1'},
            userInfo: {sub: 'u1', name: 'Ivan', surname: 'Petrov'}
        });
        expect(result.success).toBe(false);
        expect(result.error).toContain('Некорректный GitLab URI');
    });
});
