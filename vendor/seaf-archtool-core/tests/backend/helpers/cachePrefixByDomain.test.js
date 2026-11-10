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

import {describe, expect, test} from '@jest/globals';

const {collectActualCacheHashes, combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');
const {joinStorages} = require('@back/storage/storage-join.ts');

const COMMON = '__common';
const meta = (permission, manifestHash) => ({permission, manifestHash});

describe('collectActualCacheHashes: hash\'и актуальных данных кеша', () => {
    test('роль с общим манифестом: остаются её hash, hash общего и их комбинация', () => {
        const hashes = collectActualCacheHashes([meta('role_a', 'hA'), meta(COMMON, 'hC')]);

        expect(hashes.sort()).toEqual(['hA', 'hC', combineManifestHashes(['hA', 'hC'])].sort());
    });

    test('комбинация совпадает с hash, под которым роль с общим манифестом пишет и читает кеш', () => {
        const role = {manifest: {}, md5Map: {}, hash: 'hA', permission: 'role_a', problems: []};
        const common = {manifest: {}, md5Map: {}, hash: 'hC', permission: COMMON, problems: []};

        const hashes = collectActualCacheHashes([meta('role_a', 'hA'), meta(COMMON, 'hC')]);

        expect(hashes).toContain(joinStorages([role, common]).hash);
    });

    test('без общего манифеста остаются только hash\'и ролей', () => {
        expect(collectActualCacheHashes([meta('role_a', 'hA'), meta('role_b', 'hB')]).sort()).toEqual(['hA', 'hB']);
    });

    test('каждая роль комбинируется с общим манифестом, но не с другой ролью', () => {
        const hashes = collectActualCacheHashes([meta('role_a', 'hA'), meta('role_b', 'hB'), meta(COMMON, 'hC')]);

        expect(hashes).toHaveLength(5);
        expect(hashes).toContain(combineManifestHashes(['hA', 'hC']));
        expect(hashes).toContain(combineManifestHashes(['hB', 'hC']));
        expect(hashes).not.toContain(combineManifestHashes(['hA', 'hB']));
    });

    test('мета без hash (манифест ещё ни разу не загрузился) и пустые значения пропускаются', () => {
        expect(collectActualCacheHashes([null, {}, {permission: 'role_a', error: 'load failed'}, meta('role_b', 'hB')])).toEqual(['hB']);
    });

    test('меты нет - актуальных hash\'ей нет', () => {
        expect(collectActualCacheHashes([])).toEqual([]);
    });
});
