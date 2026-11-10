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

import {describe, expect, jest, test} from '@jest/globals';

// putContent.ts тянет кеш (соединение с БД) и парсер - для проверки выбора цели записи это лишнее
// Фейковый кластерный кеш: put-content читает мету перед обновлением, поэтому get должен её отдавать.
// Префикс mock обязателен - иначе jest не пускает переменную в фабрику jest.mock (hoisting).
const mockCache = {store: {}};
jest.mock('@back/storage/cache.mjs', () => ({__esModule: true, default: {
    get: (k) => Promise.resolve(mockCache.store[k] ?? null),
    set: (k, v) => { mockCache.store[k] = v; return Promise.resolve(); }
}}));

const {createCommitData, resolveWritableStorage, updateManifestInfo, validateAndFormatContent} = require('@back/helpers/putContent.ts');
const {pushStorage, getStorage} = require('@back/storage/storageHolder.ts');
const {joinStorages} = require('@back/storage/storage-join.ts');

const role = (permission) => ({manifest: {}, hash: `h_${permission}`, permission});

describe('validateAndFormatContent: absolute gitlab URI', () => {
    const originalRootManifest = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST;

    beforeAll(() => {
        process.env.VUE_APP_DOCHUB_ROOT_MANIFEST = 'bitbucket:era:repo:main@root.yaml';
    });

    afterAll(() => {
        process.env.VUE_APP_DOCHUB_ROOT_MANIFEST = originalRootManifest;
    });

    test('абсолютный gitlab-путь не склеивается с root manifest', () => {
        const storage = {
            repositorySources: ['gitlab:34'],
            md5Map: {}
        };
        const content = {'gitlab:34:main@data.yaml': '{}'};

        const result = validateAndFormatContent(content, storage, 'hash');

        expect(Object.keys(result)).toEqual(['gitlab:34:main@data.yaml']);
    });
});

describe('validateAndFormatContent: абсолютный путь bitbucket с @ и без (ERA-3556)', () => {
    const originalRootManifest = process.env.VUE_APP_DOCHUB_ROOT_MANIFEST;
    const storage = {repositorySources: ['bitbucket:ERA:repo', 'bitbucket:ERA:data'], md5Map: {hash: 'bitbucket:ERA:repo:main@docs/root.yaml'}};
    const format = (content) => Object.keys(validateAndFormatContent(content, storage, 'hash'));

    beforeAll(() => {
        process.env.VUE_APP_DOCHUB_ROOT_MANIFEST = 'bitbucket:ERA:repo:main@docs/root.yaml';
    });

    afterAll(() => {
        process.env.VUE_APP_DOCHUB_ROOT_MANIFEST = originalRootManifest;
    });

    test('обе формы дают один и тот же путь', () => {
        expect(format({'bitbucket:ERA:data:main@table.yaml': '{}'})).toEqual(['bitbucket:ERA:data:main@table.yaml']);
        // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
        expect(format({'@bitbucket:ERA:data:main@table.yaml': '{}'})).toEqual(['bitbucket:ERA:data:main@table.yaml']);
    });

    test('кириллица, пробелы и + в пути не превращают его в относительный', () => {
        expect(format({'bitbucket:ERA:data:feature/x+y@данные/моя таблица.yaml': '{}'})).toEqual(['bitbucket:ERA:data:feature/x+y@данные/моя таблица.yaml']);
        // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
        expect(format({'@bitbucket:ERA:data:main@данные/моя таблица.yaml': '{}'})).toEqual(['bitbucket:ERA:data:main@данные/моя таблица.yaml']);
    });

    test('репозиторий в другом регистре - в написании манифеста', () => {
        expect(format({'BITBUCKET:era:Data:main@table.yaml': '{}'})).toEqual(['bitbucket:ERA:data:main@table.yaml']);
    });

    test('относительный путь с каталогом @name не обрезается по второй @', () => {
        expect(format({'@none/1.yaml': '{}'})).toEqual(['bitbucket:ERA:repo:main@docs/@none/1.yaml']);
    });

    test('неподключенный репозиторий и URL не на репозиторий отклоняются с 400', () => {
        expect(() => format({'bitbucket:ASSESS:other:main@table.yaml': '{}'})).toThrow(expect.objectContaining({status: 400}));
        expect(() => format({'http://localhost:8082/table.yaml': '{}'})).toThrow(expect.objectContaining({status: 400}));
    });

    test('createCommitData: путь к файлу с @ не обрезается', () => {
        expect(createCommitData({'bitbucket:ERA:repo:main@docs/@none/1.yaml': 'a'}))
            .toEqual({rootPath: 'bitbucket:ERA:repo:main', content: {'docs/@none/1.yaml': 'a'}});
    });
});

describe('resolveWritableStorage', () => {
    test('storage одной роли возвращается как есть', () => {
        const single = role('bitbucket:era:repo_x');

        expect(resolveWritableStorage(single)).toBe(single);
    });

    test('роль + common: цель записи - storage роли, а не склейка', () => {
        const roleA = role('bitbucket:era:repo_x');
        const joined = joinStorages([roleA, role('__common')]);
        // именно этот permission раньше уезжал в ключи кеша и ломал restoreParser
        expect(joined.permission).toBe('bitbucket:era:repo_x|__common');

        const target = resolveWritableStorage(joined);

        expect(target).toBe(roleA);
        expect(target.permission).toBe('bitbucket:era:repo_x');
    });

    test('только общий манифест (манифест роли не поднялся): запись отклоняется', () => {
        // сюда попадаем без join: getStorage отфильтровал роль, которой нет в кеше, и вернул common
        const commonOnly = role('__common');

        expect(commonOnly.kind).toBeUndefined(); // по форме неотличим от storage роли
        expect(() => resolveWritableStorage(commonOnly)).toThrow(
            expect.objectContaining({status: 400})
        );
    });

    test('common внутри join тоже не может стать целью записи', () => {
        const joined = joinStorages([role('__common'), role('bitbucket:era:repo_x')]);

        expect(resolveWritableStorage(joined).permission).toBe('bitbucket:era:repo_x');
    });

    test('несколько ролей: запись отклоняется с 400, а не падает дальше по цепочке', () => {
        const joined = joinStorages([role('roleA'), role('roleB'), role('__common')]);

        expect(() => resolveWritableStorage(joined)).toThrow(
            expect.objectContaining({status: 400})
        );
    });
});

describe('updateManifestInfo: согласованность локального кеша после записи', () => {
    // parser.onChange правит storage.manifest по ссылке, а schema/обвязка остаются посчитанными по
    // прежнему содержимому. Поэтому после записи storage роли должен выбрасываться из локального
    // кеша - иначе до ближайшей инвалидации (~5 c) запросы шли бы с новым манифестом и старой schema.
    const fakeParser = {manifest: {changed: true}, parserVersion: 'v3'};

    test('в кластере storage роли выбрасывается из локального кеша сразу после записи', async() => {
        const roleStorage = role('bitbucket:era:repo_drop');
        pushStorage(roleStorage.permission, roleStorage);
        expect(getStorage([roleStorage.permission])).toBe(roleStorage);

        await updateManifestInfo(fakeParser, roleStorage, true);

        expect(getStorage([roleStorage.permission])).toBeUndefined();
    });

    test('в backend-режиме локальный кеш не трогается - там storage единственный на процесс', async() => {
        const roleStorage = role('bitbucket:era:repo_keep');
        pushStorage(roleStorage.permission, roleStorage);

        await updateManifestInfo(fakeParser, roleStorage, false);

        expect(getStorage([roleStorage.permission])).toBe(roleStorage);
    });
});

describe('updateManifestInfo: hash манифеста в мете', () => {
    // Кеш датасетов ключуется по meta.manifestHash (getCachePrefixWithDomain). Если не обновить мету,
    // новое содержимое отдаётся под старым hash и представления показывают старые значения.
    const fakeParser = {manifest: {changed: true}, parserVersion: 'v3'};
    const permission = 'bitbucket:era:repo_meta';
    const metaKey = 'SEAF.manifest.meta__' + permission;

    test('hash обновляется, остальные поля меты сохраняются', async() => {
        mockCache.store[metaKey] = JSON.stringify({
            permission, manifestHash: 'старый', problems: ['проблема'],
            commonManifestHash: 'hCommon', tsVersion: 111, successLoadTimestamp: 222
        });

        await updateManifestInfo(fakeParser, role(permission), true);

        const meta = JSON.parse(mockCache.store[metaKey]);
        expect(meta.manifestHash).not.toBe('старый');
        expect(meta.manifestHash).toBe(require('object-hash')(fakeParser.manifest));
        expect(meta.problems).toEqual(['проблема']);
        expect(meta.commonManifestHash).toBe('hCommon');
        expect(meta.tsVersion).toBe(111);
        expect(meta.successLoadTimestamp).toBe(222);
    });

    test('в backend-режиме мета не трогается - её там нет вовсе', async() => {
        mockCache.store = {};

        await updateManifestInfo(fakeParser, role(permission), false);

        expect(Object.keys(mockCache.store)).toEqual([]);
    });
});
