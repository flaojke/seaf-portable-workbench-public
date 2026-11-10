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

const {normalizeCommon, validateRootManifest} = require('@back/helpers/rootManifestVersionCheck.mjs');

const validImports = [{root: 'a/root.yaml', permission: 'roleA', alias: 'roleA'}];
const rootJson = (common) => ({imports: validImports, ...(common !== undefined ? {common} : {})});

describe('validateRootManifest: common, собранный из архитектурных пакетов', () => {
    test('common отсутствует - как и раньше, не проверяется', () => {
        expect(() => validateRootManifest(rootJson())).not.toThrow();
    });

    test('common - строка (legacy URI) - валидна без объектных полей', () => {
        expect(() => validateRootManifest(rootJson('root://common'))).not.toThrow();
    });

    test('common - объект только с root - валиден', () => {
        expect(() => validateRootManifest(rootJson({root: 'root://common'}))).not.toThrow();
    });

    test('common - объект только с packages - валиден', () => {
        expect(() => validateRootManifest(rootJson({
            packages: [{root: 'packages/base.yaml', id: 'base', version: '1.0.0'}]
        }))).not.toThrow();
    });

    test('common - объект с root и packages одновременно - валиден', () => {
        expect(() => validateRootManifest(rootJson({
            root: 'root://common',
            packages: [{root: 'packages/base.yaml', id: 'base', version: '1.0.0'}]
        }))).not.toThrow();
    });

    test('common - пустой объект - валиден: это то же самое, что отсутствующий common', () => {
        expect(() => validateRootManifest(rootJson({}))).not.toThrow();
    });

    test('common - тривиальный объект с пустым packages - тоже валиден', () => {
        expect(() => validateRootManifest(rootJson({packages: []}))).not.toThrow();
    });

    test('common - массив - ошибка (не строка и не объект-конфиг)', () => {
        expect(() => validateRootManifest(rootJson(['root://common']))).toThrow(/must be a string.*or an object/);
    });

    test('common - число - ошибка', () => {
        expect(() => validateRootManifest(rootJson(42))).toThrow(/must be a string.*or an object/);
    });

    test('common.root не строка - ошибка', () => {
        expect(() => validateRootManifest(rootJson({root: 123}))).toThrow(/'common.root' must be a string/);
    });

    test('common.packages не массив - ошибка', () => {
        expect(() => validateRootManifest(rootJson({packages: 'base'}))).toThrow(/'common.packages' must be an array/);
    });

    test('common.packages[i] без root/id/version - все три ошибки перечислены', () => {
        expect(() => validateRootManifest(rootJson({packages: [{}]}))).toThrow(
            /common\.packages\[0\] must have a non-empty 'root'.*common\.packages\[0\] must have a non-empty 'id'.*common\.packages\[0\] must have a non-empty 'version'/
        );
    });

    // Незакавыченную версию YAML отдаёт числом, а число 1.10 неотличимо от 1.1 - это разные
    // требования semver, и молча подставить одно вместо другого хуже, чем отвергнуть манифест
    test('common.packages[i] с версией-числом - ошибка: версия обязана быть в кавычках', () => {
        expect(() => validateRootManifest(rootJson({packages: [{root: 'root://a', id: 'a', version: 1.1}]})))
            .toThrow(/must have a non-empty 'version' property/);
    });

    test('common.packages[i] с версией-строкой из двух частей - не ошибка', () => {
        expect(() => validateRootManifest(rootJson({packages: [{root: 'root://a', id: 'a', version: '1.10'}]})))
            .not.toThrow();
    });

    test('common.packages[i] с версией-объектом - всё ещё ошибка', () => {
        expect(() => validateRootManifest(rootJson({packages: [{root: 'root://a', id: 'a', version: {}}]})))
            .toThrow(/must have a non-empty 'version' property/);
    });

    test('common.packages[i] с пустой строкой в id - тоже ошибка (не только отсутствие поля)', () => {
        expect(() => validateRootManifest(rootJson({
            packages: [{root: 'packages/base.yaml', id: '', version: '1.0.0'}]
        }))).toThrow(/common\.packages\[0\] must have a non-empty 'id'/);
    });

    test('common ошибка не маскирует и не подавляет обычные ошибки imports - обе попадают в общее сообщение', () => {
        const invalidRootJson = {
            imports: [{permission: 'roleA', alias: 'roleA'}], // без root
            common: {root: 42} // common.root не строка
        };
        expect(() => validateRootManifest(invalidRootJson)).toThrow(
            /imports\[0\] must have 'root'.*'common.root' must be a string/
        );
    });
});

/**
 * Вырожденные записи common (нет поля, пустая строка, {}, {packages: []}, {root: ''}) должны давать
 * одинаковый результат - иначе {packages: []} довело бы загрузку до пустого списка корней, и
 * importFromSources подставил бы в __common корневой манифест из VUE_APP_DOCHUB_ROOT_MANIFEST
 */
describe('normalizeCommon: что считается отсутствием общего манифеста', () => {
    test.each([
        ['поля нет вовсе', undefined],
        ['null', null],
        ['пустая строка', ''],
        ['пустой объект', {}],
        ['тривиальный объект с пустым packages', {packages: []}],
        ['root - пустая строка', {root: ''}],
        ['root пустой и packages пустой', {root: '', packages: []}]
    ])('%s -> общего манифеста нет', (_name, common) => {
        expect(normalizeCommon(common).roots).toEqual([]);
    });

    test('строка (legacy) - один корень', () => {
        expect(normalizeCommon('root://common').roots).toEqual(['root://common']);
    });

    test('root плюс пакеты - корни в порядке объявления, root первым', () => {
        const common = {
            root: 'root://common',
            packages: [{root: 'root://pkgA', id: 'a', version: '1.0.0'}, {root: 'root://pkgB', id: 'b', version: '1.0.0'}]
        };

        expect(normalizeCommon(common).roots).toEqual(['root://common', 'root://pkgA', 'root://pkgB']);
    });

    test('только пакеты, без root - корни всё равно есть', () => {
        const common = {packages: [{root: 'root://pkgA', id: 'a', version: '1.0.0'}]};

        expect(normalizeCommon(common).roots).toEqual(['root://pkgA']);
    });

    test('версия не приводится к строке: 1.10 и 1.1 числами неразличимы, такой манифест отвергается валидацией', () => {
        const common = {packages: [{root: 'root://pkgA', id: 'a', version: 1.1}]};

        expect(normalizeCommon(common).packages).toEqual([{root: 'root://pkgA', id: 'a', version: 1.1}]);
        expect(() => validateRootManifest(rootJson(common))).toThrow(/'version' property/);
    });

    test('packages отдаются как есть - на них опирается сверка ожидаемых версий', () => {
        const packages = [{root: 'root://pkgA', id: 'a', version: '1.0.0'}];

        expect(normalizeCommon({packages}).packages).toEqual(packages);
        expect(normalizeCommon('root://common').packages).toBeUndefined();
    });

    test('мусор вместо common не роняет нормализацию', () => {
        expect(normalizeCommon(42).roots).toEqual([]);
        expect(normalizeCommon(['root://common']).roots).toEqual([]);
        expect(normalizeCommon({packages: 'not-an-array'}).roots).toEqual([]);
    });
});
