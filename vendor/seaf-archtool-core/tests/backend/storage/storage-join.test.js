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

// Здесь ничего не мокаем: joinStorages - чистая функция, а её реальное поведение (в частности то,
// какую часть она признаёт writable) - предусловие корректности put-content.
const {joinStorages} = require('@back/storage/storage-join.ts');
const {combineManifestHashes} = require('@back/helpers/cachePrefixByDomain.mjs');
const {DEFAULT_PERMISSION_FOR_COMMON_MANIFEST} = require('@back/cluster/constants.mjs');

const role = (permission, manifest, extra = {}) => ({
    manifest,
    md5Map: {[`${permission}Key`]: `${permission}Url`},
    hash: `hash_${permission}`,
    manifestHash: `hash_${permission}`,
    permission,
    problems: [`problem_${permission}`],
    ...extra
});

describe('joinStorages', () => {
    test('один storage возвращается как есть - мёржить нечего и признаком join он не помечается', () => {
        const single = role('roleA', {a: 1});

        const result = joinStorages([single]);

        expect(result).toBe(single);
        expect(result.kind).toBeUndefined();
        expect(result.hash).toBe('hash_roleA'); // hash не пересчитывается поверх самого себя
    });

    test('роль + common: мёржит данные, складывает problems и комбинирует hash частей', () => {
        const roleA = role('roleA', {role: 'A', nested: {x: 1}});
        const common = role(DEFAULT_PERMISSION_FOR_COMMON_MANIFEST, {common: true, nested: {y: 2}});

        const joined = joinStorages([roleA, common]);

        expect(joined.kind).toBe('joined');
        expect(joined.manifest).toEqual({role: 'A', common: true, nested: {x: 1, y: 2}});
        expect(joined.md5Map).toEqual({roleAKey: 'roleAUrl', __commonKey: '__commonUrl'});
        expect(joined.problems).toEqual(['problem_roleA', 'problem___common']);
        expect(joined.permission).toBe('roleA|__common');
        expect(joined.hash).toBe(combineManifestHashes(['hash_roleA', 'hash___common']));
        expect(joined.manifestHash).toBe(joined.hash);
    });

    test('роль + common: parts хранят исходные storage, writable указывает на роль', () => {
        const roleA = role('roleA', {role: 'A'});
        const common = role(DEFAULT_PERMISSION_FOR_COMMON_MANIFEST, {common: true});

        const joined = joinStorages([roleA, common]);

        expect(joined.parts).toEqual([roleA, common]);
        // writable - это НЕ склеенный объект: у него настоящий permission, по которому в кеше лежат
        // и манифест, и parser. Именно в него допустима запись через put-content
        expect(joined.writable).toBe(roleA);
        expect(joined.writable.permission).toBe('roleA');
    });

    test('роль + common: repositorySources - объединение частей без дублей', () => {
        // По этому набору controllers/storage пускает чтение по абсолютному пути. Без него у склейки
        // пустой allowlist, и файл из репозитория роли не читается (ERA-3462)
        const roleA = role('roleA', {role: 'A'}, {repositorySources: ['bitbucket:p:shared', 'bitbucket:p:data_A']});
        const common = role(DEFAULT_PERMISSION_FOR_COMMON_MANIFEST, {common: true}, {repositorySources: ['bitbucket:p:shared']});

        const joined = joinStorages([roleA, common]);

        expect(joined.repositorySources).toEqual(['bitbucket:p:shared', 'bitbucket:p:data_A']);
    });

    test('часть без repositorySources не роняет склейку', () => {
        const joined = joinStorages([role('roleA', {role: 'A'}, {repositorySources: ['bitbucket:p:data_A']}), role('roleB', {role: 'B'})]);

        expect(joined.repositorySources).toEqual(['bitbucket:p:data_A']);
    });

    test('несколько ролей + common: writable не определён - писать некуда', () => {
        const roleA = role('roleA', {role: 'A'});
        const roleB = role('roleB', {role: 'B'});
        const common = role(DEFAULT_PERMISSION_FOR_COMMON_MANIFEST, {common: true});

        const joined = joinStorages([roleA, roleB, common]);

        expect(joined.kind).toBe('joined');
        expect(joined.parts).toEqual([roleA, roleB, common]);
        expect(joined.writable).toBeUndefined();
    });

    test('две роли без common: writable тоже не определён', () => {
        const joined = joinStorages([role('roleA', {role: 'A'}), role('roleB', {role: 'B'})]);

        expect(joined.writable).toBeUndefined();
    });
});
