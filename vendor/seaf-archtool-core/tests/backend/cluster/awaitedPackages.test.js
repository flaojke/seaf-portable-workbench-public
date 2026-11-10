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

const {checkAwaitedPackages, replacePackageProblems} = require('@back/cluster/awaitedPackages.mjs');

describe('checkAwaitedPackages: сверка common.packages с parser.metamodels', () => {
    test('пустой список ожиданий - нет проблем', () => {
        expect(checkAwaitedPackages({pkgA: '1.0.0'}, [])).toEqual([]);
        expect(checkAwaitedPackages({pkgA: '1.0.0'}, undefined)).toEqual([]);
    });

    test('пакет присутствует и версия удовлетворяет диапазону - без проблем', () => {
        const problems = checkAwaitedPackages({pkgA: '2.5.0'}, [{id: 'pkgA', version: '>=2.0.0 <3.0.0'}]);
        expect(problems).toEqual([]);
    });

    test('пакет не найден - problem с описанием отсутствия', () => {
        const problems = checkAwaitedPackages({}, [{id: 'pkgA', version: '>=2.0.0'}]);

        expect(problems).toEqual([{
            id: 'seaf.common.package.pkgA',
            title: 'Пакет "pkgA"',
            items: [{
                uid: 'seaf.common.package.pkgA',
                title: 'Пакет не найден в common',
                description: 'Ожидался пакет "pkgA" версии >=2.0.0, не найден в собранном common'
            }]
        }]);
    });

    test('версия пакета вне диапазона - problem с описанием несоответствия', () => {
        const problems = checkAwaitedPackages({pkgA: '1.0.0'}, [{id: 'pkgA', version: '>=2.0.0'}]);

        expect(problems).toEqual([{
            id: 'seaf.common.package.pkgA',
            title: 'Пакет "pkgA"',
            items: [{
                uid: 'seaf.common.package.pkgA',
                title: 'Версия пакета не соответствует ожидаемой',
                description: 'Ожидалась версия >=2.0.0, обнаружена 1.0.0'
            }]
        }]);
    });

    test('нестрогая версия ("1.1") приводится (semver.coerce) и сравнивается с диапазоном', () => {
        expect(checkAwaitedPackages({pkgA: '1.1'}, [{id: 'pkgA', version: '>=1.0.0 <2.0.0'}])).toEqual([]);
    });

    test('точная версия как диапазон: несовпадающий patch - проблема', () => {
        const problems = checkAwaitedPackages({pkgA: '1.3.1'}, [{id: 'pkgA', version: '1.3.0'}]);
        expect(problems).toHaveLength(1);
    });

    test('некорректный диапазон в ожидании - отдельная проблема, а не мнимое несовпадение', () => {
        const problems = checkAwaitedPackages({pkgA: '1.2.3'}, [{id: 'pkgA', version: 'не-версия'}]);

        expect(problems).toHaveLength(1);
        expect(problems[0].items[0].title).toBe('Ожидаемая версия задана некорректно');
        // semver.satisfies на кривом диапазоне молча возвращает false, поэтому без отдельной ветки
        // пользователь увидел бы "Ожидалась версия не-версия, обнаружена 1.2.3" и искал бы не там
        expect(problems[0].items[0].description).toMatch(/не является корректным диапазоном/);
    });

    test('пакета нет И диапазон кривой - сообщаем про диапазон, это первопричина', () => {
        const problems = checkAwaitedPackages({}, [{id: 'pkgA', version: '?!'}]);

        expect(problems[0].items[0].title).toBe('Ожидаемая версия задана некорректно');
    });

    test('несколько ожидаемых пакетов: репортятся только реально несовпадающие', () => {
        const problems = checkAwaitedPackages(
            {pkgA: '1.0.0', pkgB: '2.0.0'},
            [{id: 'pkgA', version: '1.0.0'}, {id: 'pkgB', version: '>=3.0.0'}, {id: 'pkgC', version: '1.0.0'}]
        );

        expect(problems.map((p) => p.id)).toEqual(['seaf.common.package.pkgB', 'seaf.common.package.pkgC']);
    });
});

describe('replacePackageProblems: замена, а не накопление package-проблем между циклами', () => {
    test('пустой исходный список - просто добавляет новые', () => {
        const fresh = [{id: 'seaf.common.package.pkgA', title: 'x', items: []}];
        expect(replacePackageProblems([], fresh)).toEqual(fresh);
        expect(replacePackageProblems(undefined, fresh)).toEqual(fresh);
    });

    test('старые package-проблемы (из прошлой manifestMeta) заменяются свежими, не дублируются', () => {
        const stale = [{id: 'seaf.common.package.pkgA', title: 'старое', items: []}];
        const fresh = [{id: 'seaf.common.package.pkgA', title: 'свежее', items: []}];

        expect(replacePackageProblems(stale, fresh)).toEqual(fresh);
    });

    test('проблемы других типов (например от validators) сохраняются рядом', () => {
        const mixed = [
            {id: 'seaf.metamodel.ai.agents', title: 'не про пакеты', items: []},
            {id: 'seaf.common.package.pkgA', title: 'старое', items: []}
        ];
        const fresh = [{id: 'seaf.common.package.pkgA', title: 'свежее', items: []}];

        expect(replacePackageProblems(mixed, fresh)).toEqual([
            {id: 'seaf.metamodel.ai.agents', title: 'не про пакеты', items: []},
            {id: 'seaf.common.package.pkgA', title: 'свежее', items: []}
        ]);
    });

    test('пакет, переставший быть проблемой, пропадает без следа старой записи', () => {
        const stale = [{id: 'seaf.common.package.pkgA', title: 'старое', items: []}];

        expect(replacePackageProblems(stale, [])).toEqual([]);
    });
});
