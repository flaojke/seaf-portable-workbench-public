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
import {
    decodePath,
    parseAbsoluteRepositoryPath,
    resolveConnectedRepositoryPath
} from '@back/helpers/repositoryPath.ts';

describe('parseAbsoluteRepositoryPath', () => {
    test('абсолютный путь bitbucket: и gitlab: возвращается как есть', () => {
        expect(parseAbsoluteRepositoryPath('bitbucket:ERA:repo:main@data/table.yaml')).toBe('bitbucket:ERA:repo:main@data/table.yaml');
        expect(parseAbsoluteRepositoryPath('bitbucket:ERA:repo:release/1.0@data/table.yaml')).toBe('bitbucket:ERA:repo:release/1.0@data/table.yaml');
        expect(parseAbsoluteRepositoryPath('gitlab:34:main@data/table.yaml')).toBe('gitlab:34:main@data/table.yaml');
    });

    // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
    test('устаревшая форма @bitbucket: приводится к форме без @', () => {
        expect(parseAbsoluteRepositoryPath('@bitbucket:ERA:repo:main@data/table.yaml')).toBe('bitbucket:ERA:repo:main@data/table.yaml');
    });

    test('относительный путь - null, в том числе каталог с @ в начале', () => {
        expect(parseAbsoluteRepositoryPath('data/table.yaml')).toBeNull();
        expect(parseAbsoluteRepositoryPath('../data/table.yaml')).toBeNull();
        expect(parseAbsoluteRepositoryPath('@none/1.yaml')).toBeNull();
        expect(parseAbsoluteRepositoryPath('./bitbucket:ERA:repo:main@data/table.yaml')).toBeNull();
    });

    test('путь не по формату регулярного выражения всё равно абсолютный (ERA-3556)', () => {
        // Раньше такие пути шли в request как относительные и читались, минуя проверку репозитория
        expect(parseAbsoluteRepositoryPath('BITBUCKET:ERA:repo:main@data/table.yaml')).toBe('bitbucket:ERA:repo:main@data/table.yaml');
        expect(parseAbsoluteRepositoryPath('bitbucket:ERA:repo:main@data/моя таблица.yaml')).toBe('bitbucket:ERA:repo:main@data/моя таблица.yaml');
        expect(parseAbsoluteRepositoryPath('bitbucket:ERA:repo:feature/x+y@data/table.yaml')).toBe('bitbucket:ERA:repo:feature/x+y@data/table.yaml');
        // TODO: ERA-2973 устаревшая форма '@bitbucket:...' оставлена на 1-1.5 мес для обратной совместимости
        expect(parseAbsoluteRepositoryPath('@bitbucket:ERA:repo:main@data/моя таблица.yaml')).toBe('bitbucket:ERA:repo:main@data/моя таблица.yaml');
    });

    test('@ в пути к файлу не отделяет репозиторий', () => {
        expect(parseAbsoluteRepositoryPath('bitbucket:ERA:repo:main@data/@none/1.yaml')).toBe('bitbucket:ERA:repo:main@data/@none/1.yaml');
    });

    test('абсолютный URL не на репозиторий отклоняется с 400', () => {
        for (const path of ['http://localhost:8082/actuator/health', 'https://example.com/a.yaml', 'file:///etc/passwd']) {
            expect(() => parseAbsoluteRepositoryPath(path)).toThrow(expect.objectContaining({status: 400}));
        }
    });

    test('путь к репозиторию не по формату отклоняется с 400', () => {
        for (const path of ['bitbucket:ERA:repo:main', 'bitbucket:ERA:repo:main@', 'bitbucket:ERA:repo@data.yaml', 'bitbucket:ERA::main@data.yaml', 'gitlab:34@data.yaml']) {
            expect(() => parseAbsoluteRepositoryPath(path)).toThrow(expect.objectContaining({status: 400}));
        }
    });
});

describe('decodePath', () => {
    test('раскодирует путь из URL, некорректное кодирование оставляет как есть', () => {
        expect(decodePath('bitbucket:ERA:repo:main@data/_ind%65x.yaml')).toBe('bitbucket:ERA:repo:main@data/_index.yaml');
        expect(decodePath('data/%ZZ.yaml')).toBe('data/%ZZ.yaml');
    });

    test('закодированный путь после раскодирования распознаётся как абсолютный (ERA-3556)', () => {
        expect(parseAbsoluteRepositoryPath(decodePath('%62itbucket:ERA:repo:main@data/_ind%65x.yaml'))).toBe('bitbucket:ERA:repo:main@data/_index.yaml');
    });
});

describe('resolveConnectedRepositoryPath', () => {
    const sources = ['bitbucket:ERA_TEMPLATE:seafera-portal', 'gitlab:34'];

    test('подключенный репозиторий: путь с написанием репозитория из манифеста', () => {
        expect(resolveConnectedRepositoryPath('bitbucket:ERA_TEMPLATE:seafera-portal:main@data.yaml', sources)).toBe('bitbucket:ERA_TEMPLATE:seafera-portal:main@data.yaml');
        expect(resolveConnectedRepositoryPath('gitlab:34:main@data.yaml', sources)).toBe('gitlab:34:main@data.yaml');
    });

    test('регистр ключа проекта и slug Bitbucket не важен, ветка и путь не меняются', () => {
        expect(resolveConnectedRepositoryPath('bitbucket:era_template:Seafera-Portal:Main@Data.yaml', sources)).toBe('bitbucket:ERA_TEMPLATE:seafera-portal:Main@Data.yaml');
    });

    test('неподключенный репозиторий - null', () => {
        expect(resolveConnectedRepositoryPath('bitbucket:ASSESS:data_euroday:master@x.yaml', sources)).toBeNull();
        expect(resolveConnectedRepositoryPath('gitlab:35:main@data.yaml', sources)).toBeNull();
        expect(resolveConnectedRepositoryPath('bitbucket:ERA_TEMPLATE:seafera-portal:main@data.yaml')).toBeNull();
    });
});
