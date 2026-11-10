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

import {describe, expect, it} from '@jest/globals';
import gitlabDriver from '@global/gitlab/driver.mjs';

describe('gitlab driver', () => {
    const gitlabServer = 'https://gitlab.example.com/';

    it('makeFileURI в режиме api строит GitLab REST URL', () => {
        const driver = new gitlabDriver({
            gitlab_server: gitlabServer,
            gitlabMode: 'api'
        });
        const url = driver.makeFileURI('34', 'path/to/file.yaml', 'main', 'raw');
        expect(url.toString()).toBe(
            'https://gitlab.example.com/api/v4/projects/34/repository/files/path%2Fto%2Ffile.yaml/raw?ref=main'
        );
    });

    it('makeFileURI в режиме adapter строит GAS URL', () => {
        const driver = new gitlabDriver({
            gitlab_server: gitlabServer,
            gitlabMode: 'adapter',
            gitlabAdapterUrl: 'http://gas:8082'
        });
        const url = driver.makeFileURI('2', 'catalog/root.yaml', 'main', 'raw');
        expect(url.toString()).toBe(
            'http://gas:8082/api/v1/vcs/file/catalog/root.yaml?repo=2&branch=main'
        );
    });

    it('adapter без URL выбрасывает ошибку конфигурации', () => {
        const driver = new gitlabDriver({
            gitlab_server: gitlabServer,
            gitlabMode: 'adapter'
        });
        expect(() => driver.makeFileURI('2', 'root.yaml', 'main')).toThrow(
            'VUE_APP_DOCHUB_GITLAB_ADAPTER_URL'
        );
    });

    it('использует gitlabMode из config при каждом вызове', () => {
        const config = {
            gitlab_server: gitlabServer,
            gitlabMode: 'api'
        };
        const driver = new gitlabDriver(config);
        expect(driver.makeFileURI('34', 'path/to/file.yaml', 'main', 'raw').toString()).toContain('/api/v4/projects/');

        config.gitlabMode = 'adapter';
        config.gitlabAdapterUrl = 'http://gas:8082';
        expect(driver.makeFileURI('2', 'catalog/root.yaml', 'main', 'raw').toString()).toBe(
            'http://gas:8082/api/v1/vcs/file/catalog/root.yaml?repo=2&branch=main'
        );
    });
});
