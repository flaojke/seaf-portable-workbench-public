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

// Чтение из источника не нужно: проверяем, какой путь контроллер отдаёт на чтение и отдаёт ли вообще.
// Префикс mock обязателен - иначе jest не пускает переменную в фабрику jest.mock (hoisting)
const mockRequestRaw = jest.fn<(uri: string, baseURI: string | null) => Promise<{data: string, contentType: string}>>(
    () => Promise.resolve({data: 'a: 1', contentType: 'application/x-yaml'})
);
jest.mock('@back/helpers/request.mjs', () => ({
    __esModule: true,
    default: jest.fn(() => Promise.resolve()),
    requestRaw: (uri: string, baseURI: string | null) => mockRequestRaw(uri, baseURI)
}));

import registerStorageController from '@back/controllers/storage.mjs';

type Response = {statusCode: number, body: unknown, status: (code: number) => Response, json: (body: unknown) => Response};
type Handler = (req: unknown, res: Response) => Promise<void>;

const HASH = 'ea3bd1a6325b46617fa4707b78338732';
const BASE_URL = 'bitbucket:ERA:repo:main@docs/root.yaml';
const STORAGE_URL = '/core/storage';

const routes: Record<string, Handler> = {};
registerStorageController({get: (path: string, handler: Handler) => { routes[path] = handler; }});

// path - как в URL запроса (закодированный), так его видит express в req.originalUrl
const read = async(path: string): Promise<Response> => {
    const req = {
        params: {hash: HASH},
        originalUrl: `${STORAGE_URL}/${HASH}/${path}?envelope=true`,
        query: {envelope: 'true'},
        storage: {md5Map: {[HASH]: BASE_URL}, repositorySources: ['bitbucket:ERA:repo', 'bitbucket:ERA:data']}
    };
    const res: Response = {
        statusCode: 200,
        body: undefined,
        status(code) { this.statusCode = code; return this; },
        json(body) { this.body = body; return this; }
    };
    await routes[`${STORAGE_URL}/:hash/*`](req, res);
    return res;
};

describe('controllers/storage: чтение файла по абсолютному пути (ERA-3556)', () => {
    beforeEach(() => mockRequestRaw.mockClear());

    // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
    test('путь с @ и без читается из репозитория манифеста одинаково', async() => {
        for (const path of ['bitbucket:ERA:data:main@table.yaml', '@bitbucket:ERA:data:main@table.yaml']) {
            mockRequestRaw.mockClear();
            expect((await read(path)).statusCode).toBe(200);
            expect(mockRequestRaw).toHaveBeenCalledWith('bitbucket:ERA:data:main@table.yaml', BASE_URL);
        }
    });

    test('кириллица и пробелы раскодируются, регистр репозитория - как в манифесте', async() => {
        expect((await read('bitbucket:era:Data:main@%D0%BC%D0%BE%D1%8F%20table.yaml')).statusCode).toBe(200);
        expect(mockRequestRaw).toHaveBeenCalledWith('bitbucket:ERA:data:main@моя table.yaml', BASE_URL);
    });

    test('относительный путь уходит на чтение как есть, в том числе каталог с @', async() => {
        for (const path of ['data/table.yaml', '@none/1.yaml']) {
            mockRequestRaw.mockClear();
            expect((await read(path)).statusCode).toBe(200);
            expect(mockRequestRaw).toHaveBeenCalledWith(path, BASE_URL);
        }
    });

    test('чужой репозиторий не читается, как бы ни был записан путь', async() => {
        const paths = [
            'bitbucket:ASSESS:other:main@index.yaml',
            // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
            '@bitbucket:ASSESS:other:main@index.yaml',
            'bitbucket:ASSESS:other:main@ind%65x.yaml',
            'BITBUCKET:ASSESS:other:main@index.yaml',
            '%62itbucket:ASSESS:other:main@index.yaml'
        ];
        for (const path of paths) {
            const res = await read(path);
            expect({path, status: res.statusCode}).toEqual({path, status: 400});
        }
        expect(mockRequestRaw).not.toHaveBeenCalled();
    });

    test('URL не на репозиторий не читается: core не ходит по произвольным адресам', async() => {
        // express схлопывает '//' в пути, на чтение приходит 'http:/host'
        for (const path of ['http://localhost:8082/actuator/health', 'http:/localhost:8082/actuator/health', 'file:///etc/passwd']) {
            const res = await read(path);
            expect({path, status: res.statusCode}).toEqual({path, status: 400});
        }
        expect(mockRequestRaw).not.toHaveBeenCalled();
    });
});
