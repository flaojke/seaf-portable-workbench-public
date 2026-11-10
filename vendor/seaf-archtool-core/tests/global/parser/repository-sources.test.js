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

const parser = require('@global/manifest/parser3/index.mjs').default;

/**
 * repositorySources - единственный источник правды о том, в какие репозитории разрешена запись
 * (getUnconnectedRepositories в helpers/putContent.ts). Экземпляр Parser - модульный синглтон, а
 * кластерный воркер грузит манифесты всех permission подряд в одном процессе. Если набор не
 * сбрасывать между загрузками, каждый следующий permission получает репозитории всех предыдущих -
 * то есть право писать в чужие данные.
 */
describe('Parser.repositorySources: изоляция между последовательными загрузками', () => {
    beforeEach(() => {
        parser.clean();
    });

    test('clean() очищает набор репозиториев', () => {
        // формат URI: bitbucket:PROJECT:REPO:BRANCH@path - createRepositoryIDfromURI отбрасывает ветку
        parser.addRepositorySource('bitbucket:ERA:repo_first:master@some/file.yaml');
        expect([...parser.repositorySources]).toEqual(['bitbucket:ERA:repo_first']);

        parser.clean();

        expect([...parser.repositorySources]).toEqual([]);
    });

    test('репозитории предыдущей загрузки не протекают в следующую', () => {
        // загрузка №1 - условный common
        parser.addRepositorySource('bitbucket:ERA_TEMPLATE:ka_dzo:master@templates/root.yaml');
        parser.addRepositorySource('bitbucket:REFERENCE:reference_it_products:master@a.yaml');
        const afterCommon = [...parser.repositorySources];

        // загрузка №2 - манифест роли, тем же экземпляром парсера
        parser.clean();
        parser.addRepositorySource('bitbucket:assess:data_Euroday:master@Euroday.2022/x.yaml');

        expect(afterCommon).toHaveLength(2);
        expect([...parser.repositorySources]).toEqual(['bitbucket:assess:data_Euroday']);
    });

    test('не-репозиторные URI в набор не попадают', () => {
        parser.addRepositorySource('file:///metamodel/root.yaml');

        expect([...parser.repositorySources]).toEqual([]);
    });
});
