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

import {beforeEach, describe, expect, test} from '@jest/globals';

const {default: parser, SourceItem} = require('@global/manifest/parser3/index.mjs');

/**
 * $package: структурная валидация объявления при сборке карты {packageId: version}
 * (_getMetamodelVersions). Сверка с ожиданиями из root-манифеста сюда сознательно не входит -
 * это забота manifest-loader.mjs, а не парсера. Тесты собирают this.sources напрямую через
 * SourceItem вместо реального import(), который требует сети/кеша
 */
describe('Parser: объявления $package', () => {
    beforeEach(() => {
        parser.clean();
        // clean() намеренно не трогает errors (см. parser3/index.mjs) - в проде он самоочищается
        // при повторной загрузке того же URI, а тут URI у каждого теста свои и синглтон общий,
        // поэтому изоляцию errors между тестами обеспечиваем здесь
        parser.errors = {};
    });

    const source = (uri, data) => new SourceItem({ownerUri: 'file:///root.yaml', uri, data});

    describe('_getMetamodelVersions: структурная валидация объявления', () => {
        test('валидный пакет попадает в metamodels без ошибок', () => {
            parser.sources['file:///pkg-a.yaml'] = source('file:///pkg-a.yaml', {
                $package: {pkgA: {version: '1.2.0'}}
            });

            const metamodels = parser._getMetamodelVersions();

            expect(metamodels).toEqual({pkgA: '1.2.0'});
            expect(parser.errors).toEqual({});
        });

        test('источники без $package игнорируются', () => {
            parser.sources['file:///plain.yaml'] = source('file:///plain.yaml', {entities: {}});

            expect(parser._getMetamodelVersions()).toEqual({});
            expect(parser.errors).toEqual({});
        });

        test('$package без идентификатора пакета - ошибка PackageDeclaration, пакет не попадает в metamodels', () => {
            parser.sources['file:///broken.yaml'] = source('file:///broken.yaml', {$package: {}});

            const metamodels = parser._getMetamodelVersions();

            expect(metamodels).toEqual({});
            expect(parser.errors['file:///broken.yaml']).toEqual(
                expect.objectContaining({name: 'PackageDeclaration'})
            );
        });

        test('$package без version - ошибка PackageDeclaration, пакет не попадает в metamodels', () => {
            parser.sources['file:///no-version.yaml'] = source('file:///no-version.yaml', {
                $package: {pkgB: {name: 'Package B'}}
            });

            const metamodels = parser._getMetamodelVersions();

            expect(metamodels).toEqual({});
            expect(parser.errors['file:///no-version.yaml']).toEqual(
                expect.objectContaining({name: 'PackageDeclaration'})
            );
        });

        // Конфликт версий даёт сразу два результата: ошибку и всё же заполненную карту версий
        test('один и тот же packageId с разными версиями в разных источниках - ошибка PackageDeclaration, в карте остаётся последний по порядку обхода', () => {
            parser.sources['file:///pkg-c-v1.yaml'] = source('file:///pkg-c-v1.yaml', {
                $package: {pkgC: {version: '1.0.0'}}
            });
            parser.sources['file:///pkg-c-v2.yaml'] = source('file:///pkg-c-v2.yaml', {
                $package: {pkgC: {version: '2.0.0'}}
            });

            const metamodels = parser._getMetamodelVersions();

            expect(Object.values(parser.errors)).toContainEqual(
                expect.objectContaining({name: 'PackageDeclaration'})
            );
            // Выбор произвольный, но детерминированный: именно эта версия уедет в checkAwaitedPackages,
            // поэтому фиксируем её тестом, чтобы поведение не поехало молча
            expect(metamodels).toEqual({pkgC: '2.0.0'});
        });

        test('один и тот же packageId с одинаковой версией в разных источниках - без ошибок', () => {
            parser.sources['file:///pkg-d-a.yaml'] = source('file:///pkg-d-a.yaml', {
                $package: {pkgD: {version: '1.0.0'}}
            });
            parser.sources['file:///pkg-d-b.yaml'] = source('file:///pkg-d-b.yaml', {
                $package: {pkgD: {version: '1.0.0'}}
            });

            const metamodels = parser._getMetamodelVersions();

            expect(metamodels).toEqual({pkgD: '1.0.0'});
            expect(parser.errors).toEqual({});
        });
    });

    /**
     * Контракт между парсером и потребителем onError: тип ошибки должен совпадать с тем, что
     * разбирает обработчик во фронтенде (storage/gitlab.js) - иначе дублирование импорта
     * показывается пользователю как сетевая ошибка
     */
    describe('типы ошибок, которые уезжают в onError', () => {
        const errorTypeOf = (error) => {
            const seen = [];
            parser.onError = (errorType) => seen.push(errorType);
            try {
                parser.registerError(error, error.uri);
            } finally {
                parser.onError = null;
            }
            return seen;
        };

        test('дублирование импорта -> duplicate-import', () => {
            expect(errorTypeOf({name: 'DuplicateImport', uri: 'file:///dup.yaml', message: 'дубль'}))
                .toEqual(['duplicate-import']);
        });

        test('дефект объявления $package -> package', () => {
            expect(errorTypeOf({name: 'PackageDeclaration', uri: 'file:///pkg.yaml', message: 'нет version'}))
                .toEqual(['package']);
        });

        test('неизвестное имя ошибки по-прежнему считается сетевой', () => {
            expect(errorTypeOf({name: 'SomethingElse', uri: 'file:///x.yaml', message: 'что-то'}))
                .toEqual(['net']);
        });
    });
});
