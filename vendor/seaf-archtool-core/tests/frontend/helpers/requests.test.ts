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

import {beforeEach, describe, expect, jest, test} from '@jest/globals';

jest.mock('axios', () => {
    const axios = Object.assign(jest.fn(() => Promise.resolve({data: null})), {
        interceptors: {request: {use: jest.fn()}, response: {use: jest.fn()}}
    });
    return axios;
});
jest.mock('@front/helpers/env', () => ({
    __esModule: true,
    default: {
        isBackendMode: true,
        isEnvelopedRequests: false,
        isPlugin: () => false,
        backendFileStorageURL: 'http://localhost:3030/seaf-core/api/core/storage/'
    },
    Plugins: {idea: 'idea', vscode: 'vscode'}
}));
jest.mock('@front/helpers/uri', () => ({}));
jest.mock('@front/helpers/gitlab', () => ({}));
jest.mock('@front/helpers/cache', () => ({requestCacheInterceptor: jest.fn(), responseCacheInterceptor: jest.fn()}));
jest.mock('@front/store/userStore.js', () => ({}));
jest.mock('@front/helpers/orgCtxTools.js', () => ({extreactOrgCtxFromWindow: jest.fn(), isUriHostEqualBackendHost: jest.fn()}));

import axios from 'axios';
import requests from '@front/helpers/requests';

const HASH = 'ea3bd1a6325b46617fa4707b78338732';
const BASE_URI = `backend://${HASH}/`;
const STORAGE_URL = `http://localhost:3030/seaf-core/api/core/storage/${HASH}/`;

const axiosMock = jest.mocked(axios) as unknown as jest.Mock<(params: {url: URL}) => Promise<unknown>>;

const requestedURL = (uri: string): string => {
    requests.request(uri, BASE_URI, {raw: true});
    return axiosMock.mock.calls[0][0].url.toString();
};

describe('requests.request: путь относительно backend://', () => {
    beforeEach(() => axiosMock.mockClear());

    test('абсолютный путь bitbucket: уходит в storage, а не становится URL со схемой bitbucket: (ERA-3556)', () => {
        expect(requestedURL('bitbucket:ERA_TEMPLATE:portal:release-1.0@data/table.yaml'))
            .toBe(`${STORAGE_URL}bitbucket:ERA_TEMPLATE:portal:release-1.0@data/table.yaml`);
    });

    test('абсолютный путь gitlab: уходит в storage', () => {
        expect(requestedURL('gitlab:34:main@data/table.yaml')).toBe(`${STORAGE_URL}gitlab:34:main@data/table.yaml`);
    });

    // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
    test('устаревший путь @bitbucket: по-прежнему уходит в storage как есть', () => {
        expect(requestedURL('@bitbucket:ERA_TEMPLATE:portal:main@data/table.yaml'))
            .toBe(`${STORAGE_URL}@bitbucket:ERA_TEMPLATE:portal:main@data/table.yaml`);
    });

    test('относительный путь разрешается от storage, ".." кодируется', () => {
        expect(requestedURL('data/table.yaml')).toBe(`${STORAGE_URL}data/table.yaml`);
        axiosMock.mockClear();
        expect(requestedURL('../data/table.yaml')).toBe(`${STORAGE_URL}%E2%86%90/data/table.yaml`);
    });
});
