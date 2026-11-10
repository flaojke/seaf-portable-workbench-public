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

const {toManifestInfoDto} = require('@back/cluster/manifestInfoDto.mjs');

/**
 * /health/info отдаёт результат toManifestInfoDto как есть - это единственная граница, защищающая
 * публичный контракт от роста внутренней модели manifestMeta
 */
describe('toManifestInfoDto: whitelist полей /health/info', () => {
    test('успешная загрузка роли - переносит известные поля и считает ISO-таймстемп', () => {
        const dto = toManifestInfoDto({
            permission: 'roleA',
            manifestHash: 'hashA',
            problems: [{id: 'p1', title: 't', items: []}],
            commonManifestHash: 'hashCommon',
            tsVersion: 1000,
            successLoadTimestamp: 1717000000000
        });

        expect(dto).toEqual({
            permission: 'roleA',
            manifestHash: 'hashA',
            problems: [{id: 'p1', title: 't', items: []}],
            commonManifestHash: 'hashCommon',
            error: undefined,
            tsVersion: 1000,
            successLoadTimestamp: 1717000000000,
            successLoadTimestampISO: new Date(1717000000000).toISOString(),
            errorLoadTimestamp: undefined
        });
    });

    test('ошибка загрузки - считает errorLoadTimestampISO, без successLoadTimestampISO', () => {
        const dto = toManifestInfoDto({
            error: 'boom',
            errorLoadTimestamp: 1717000000000,
            tsVersion: 1000
        });

        expect(dto.errorLoadTimestampISO).toBe(new Date(1717000000000).toISOString());
        expect(dto.successLoadTimestampISO).toBeUndefined();
    });

    test('внутренние поля, не входящие в whitelist, не попадают в DTO', () => {
        const dto = toManifestInfoDto({
            permission: '__common',
            manifestHash: 'hashCommon',
            problems: [{id: 'seaf.common.package.pkgA', title: 'Пакет "pkgA"', items: []}],
            someFutureInternalField: 'should not leak',
            tsVersion: 1000
        });

        expect(dto).not.toHaveProperty('someFutureInternalField');
        expect(Object.keys(dto).sort()).toEqual([
            'commonManifestHash', 'error', 'errorLoadTimestamp', 'manifestHash',
            'permission', 'problems', 'successLoadTimestamp', 'tsVersion'
        ]);
    });

    test('пустой manifestMeta ({}) не падает - все поля undefined, ISO не считаются', () => {
        expect(() => toManifestInfoDto({})).not.toThrow();
        const dto = toManifestInfoDto({});
        expect(dto.successLoadTimestampISO).toBeUndefined();
        expect(dto.errorLoadTimestampISO).toBeUndefined();
    });
});
