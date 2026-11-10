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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>
*/
import { describe, test, expect, jest } from '@jest/globals';

jest.mock('@global/manifest/parser3/index.mjs', () => {
    // мок парсера, т.к. он в методе дефолтное значение
    const actual = jest.requireActual('@global/manifest/parser3/index.mjs');

    return {
        __esModule: true,
        ...actual,                 // всё остальное из модуля — как есть, на случай других нужных функций
        default: { sources: {} },  // sources нужно подставлять во время теста в parser.sources если не передавать manifestParser
        SourceItem: class SourceItem {},
        isSourceItem: jest.fn(actual.isSourceItem) // spy: передаем вызов напрямую, функция не зависит от данных парсера
    };
});

import { updateRootFilesInPutContent } from '@global/helpers/updateRootFiles/updateRootFilesInPutContent';
import parser from '@global/manifest/parser3/index.mjs';

// настоящий (немоканный) SourceItem — нужен, чтобы получить объект, реально помеченный
// SOURCE_ITEM_TAG, и таким образом задеть ветку isSourceItem(source) === true
// в updateImportsInSource (в отличие от plain-объектов из parserSources в остальных кейсах)
const { SourceItem: RealSourceItem } = jest.requireActual('@global/manifest/parser3/index.mjs');

describe('updateRootFilesInPutContent', () => {
    /**
     * Каждый кейс:
     * - description   — название теста
     * - input         — параметры вызова функции: { rootUri, baseUri, indexFileName, commitData, manifestParser? }
     * - parserSources — содержимое parser.sources (замоканный синглтон),
     *                    актуально даже если input.manifestParser не передан
     * - expected      — ожидаемый результат
     */
    const testCases = [
        {
            description: 'plugin: 3 из 3 файлов есть в sources',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/base_data.yaml': {
                    'imports': []
                },
                'plugin:/idea/source/seaf-examples/examples/base/base.test.yaml': {
                    'imports': []
                },
                'plugin:/idea/source/seaf-examples/examples/base/base_new.test.yaml': {
                    'imports': []
                }
            },
            expected: {}
        },
        {
            description: 'plugin: 1 из 3 файлов есть в sources',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/base_data.yaml': { // неважно откуда импортирован
                    'imports': []
                },
                'plugin:/idea/source/seaf-examples/examples/base/root.yaml': {
                    'imports': []
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base.test.yaml\n  - base_new.test.yaml\n'
            }
        },
        {
            description: 'plugin: 0 из 3 файлов есть в sources',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/root.yaml': {
                    'imports': []
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_data.yaml\n  - base.test.yaml\n  - base_new.test.yaml\n'
            }
        },
        {
            description: 'plugin: один файл имеет путь выше (..) на 1 уровень',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '../base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/root.yaml': {
                    'imports': []
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_new.test.yaml\n',
                '../root.yaml': 'imports:\n  - base.test.yaml\n  - base/root.yaml\n'
            }
        },
        {
            description: 'plugin: Корневой файл всегда $root',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '../base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/$root': {
                    'imports': []
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_new.test.yaml\n',
                '../root.yaml': 'imports:\n  - base.test.yaml\n  - seaf-examples/root.yaml\n',
                '../$root': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'plugin: один файл имеет путь выше (..) и уходит выше root, выше не пускаем',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '../../../../../base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/$root': {
                    'imports': []
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_new.test.yaml\n',
                '../root.yaml': 'imports:\n  - base.test.yaml\n  - seaf-examples/root.yaml\n',
                '../$root': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'plugin: если нигде не найдено — создаётся вся цепочка root.yaml вплоть до импорта в $root',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'root.yaml': 'imports:\n  - base_data.yaml\n',
                '../root.yaml': 'imports:\n  - base/root.yaml\n',
                '../../root.yaml': 'imports:\n  - examples/root.yaml\n',
                '../../../root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                '../../../$root': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'plugin: существующие манифест и импорты не изменяются',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/root.yaml': {
                    'test': 'test',
                    'imports': [
                        'plugin:/idea/source/seaf-examples/examples/base/not_loose.yaml' // так импорт выглядит в sources
                    ]
                }
            },
            expected: {
                'root.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            }
        },
        {
            description: 'plugin: root пришел вместе с файлами',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'root.yaml': 'imports:\n  - base_data.yaml'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/root.yaml': {
                    'imports': [
                        'plugin:/idea/source/seaf-examples/examples/base/not_loose.yaml' // так импорт выглядит в sources
                    ]
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            }
        },
        {
            description: 'plugin: root.yaml есть уровнем выше, добавление должно быть в него без потерь + новый',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/root.yaml': {
                    'test': 'test',
                    'imports': [
                        'plugin:/idea/source/seaf-examples/examples/not_loose.yaml' // так импорт выглядит в sources
                    ]
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_data.yaml\n',
                '../root.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - base/root.yaml\n'
            }
        },
        {
            description: 'plugin: путь от корня считается относительным',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '/base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/root.yaml': {
                    'imports': [
                        'plugin:/idea/source/seaf-examples/examples/base/not_loose.yaml' // так импорт выглядит в sources
                    ]
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            }
        },
        {
            description: 'plugin: rootUri в виде пути до .yml файла нормализуется так же, как до .yaml',
            input: {
                rootUri: 'plugin:/idea/source/config.yml',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'plugin:/idea/source/seaf-examples/examples/base/root.yaml': {
                    'imports': [
                        'plugin:/idea/source/seaf-examples/examples/base/not_loose.yaml' // так импорт выглядит в sources
                    ]
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            }
        },

        {
            description: 'plugin: committed-файл называется как indexFileName и совпадает с авто-сгенерированным путём соседнего файла (сам себя импортировать не должен)',
            input: {
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base/data.yaml': 'x',
                    'root.yaml': 'x' // резолвится в .../seaf-examples/root.yaml - ровно туда, куда climbing base/data.yaml поднимется сам
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'base/root.yaml': 'imports:\n  - data.yaml\n',
                'root.yaml': 'imports:\n  - base/root.yaml\n', // без самоимпорта
                '../root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                '../$root': 'imports:\n  - root.yaml\n'
            }
        },
        // ======= VSCODE (rootUri сам указывает на реальный root-файл, а не на $root) ==========
        // В отличие от JetBrains, у vscode нет метассылки "$root": rootUri сразу указывает
        // на прямой абсолютный путь к уже существующему seaf.yaml/dochub.yaml (см.
        // normalizeRootUri - ветка "путь до .yaml/.yml файла"), и этот же rootUri
        // используется как технический корневой файл - отдельного параметра для этого
        // не требуется. Вся остальная логика (merge в существующий манифест, self-import
        // guard, clamp по "..") не зависит от схемы URI — подробно она уже покрыта в
        // plugin-кейсах выше, здесь проверяются только сценарии, специфичные именно для vscode.

        {
            description: 'vscode: rootUri (реальный путь к файлу) корректно дополняется существующим манифестом (не создаётся $root)',
            input: {
                rootUri: 'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/seaf.yaml',
                baseUri: 'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/seaf.yaml': {
                    'test': 'test',
                    'imports': [
                        'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/not_loose.yaml'
                    ]
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_data.yaml\n',
                '../root.yaml': 'imports:\n  - base/root.yaml\n',
                '../seaf.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - root.yaml\n'
            }
        },
        {
            description: 'vscode: один файл имеет путь выше (..) и уходит выше root, выше не пускаем (аналог plugin-кейса, другая схема URI)',
            input: {
                rootUri: 'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/seaf.yaml',
                baseUri: 'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/seaf-examples/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '../../../../../base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'https://file+.vscode-resource.vscode-cdn.net/c%3A/work/seaf_public_copy/public/workspace/ka_dzo_modify/seaf.yaml': {
                    'imports': []
                }
            },
            expected: {
                'root.yaml': 'imports:\n  - base_new.test.yaml\n',
                '../root.yaml': 'imports:\n  - base.test.yaml\n  - seaf-examples/root.yaml\n',
                '../seaf.yaml': 'imports:\n  - root.yaml\n'
            }
        },

        // ======= PORTAL ABSOLUTE ==========

        {
            description: 'portal abs: 3 из 3 файлов есть в sources',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': {
                    'imports': []
                },
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.test.yaml': {
                    'imports': []
                },
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_new.test.yaml': {
                    'imports': []
                }
            },
            expected: {}
        },
        {
            description: 'portal abs: 1 из 3 файлов есть в sources',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': {
                    'imports': []
                },
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': {
                    'imports': []
                }
            },
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': 'imports:\n  - base.test.yaml\n  - base_new.test.yaml\n'
            }
        },
        {
            description: 'portal abs: 0 из 3 файлов есть в sources',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': {
                    'imports': []
                }
            },
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': 'imports:\n  - base_data.yaml\n  - base.test.yaml\n  - base_new.test.yaml\n'
            }
        },
        {
            description: 'portal abs: 0 из 3 файлов есть в sources, ни seaf.yaml ни dochub.yaml нет — создаётся вся цепочка + новый seaf.yaml',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': 'imports:\n  - base_data.yaml\n  - base.test.yaml\n  - base_new.test.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/root.yaml': 'imports:\n  - base/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/root.yaml': 'imports:\n  - examples/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'portal abs: если есть seaf.yaml, импорт идёт в него, а не в dochub.yaml',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': {
                    'imports': []
                },
                'bitbucket:WORK:ka_dzo_modify:test_save@dochub.yaml': {
                    'imports': []
                }
            },
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/root.yaml': 'imports:\n  - base_data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'portal abs: indexFileName === "dochub.yaml" - корневой индекс-файл не должен импортировать сам себя',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'dochub.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/data.yaml': 'x'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/dochub.yaml': 'imports:\n  - data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/dochub.yaml': 'imports:\n  - base/dochub.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@dochub.yaml': 'imports:\n  - seaf-examples/dochub.yaml\n' // без самоимпорта
            }
        },
        {
            description: 'portal abs: indexFileName === "seaf.yaml" - корневой индекс-файл не должен импортировать сам себя (если его нет в sources)',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'seaf.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/data.yaml': 'x'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/seaf.yaml': 'imports:\n  - data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/seaf.yaml': 'imports:\n  - base/seaf.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'imports:\n  - seaf-examples/seaf.yaml\n' // без самоимпорта
            }
        },
        {
            description: 'portal abs: indexFileName === "seaf.yaml", корневой seaf.yaml уже существует в sources - импорт дописывается один раз, без самоимпорта',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'seaf.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/data.yaml': 'x'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': {
                    test: 'test',
                    imports: ['bitbucket:WORK:ka_dzo_modify:test_save@not_loose.yaml']
                }
            },
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/seaf.yaml': 'imports:\n  - data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/seaf.yaml': 'imports:\n  - base/seaf.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - seaf-examples/seaf.yaml\n'
            }
        },
        {
            description: 'portal abs: существующие манифест и импорты не изменяются',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': {
                    'test': 'test',
                    'imports': [
                        'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/not_loose.yaml'
                    ]
                }
            },
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            }
        },
        {
            description: 'portal abs: root.yaml есть уровнем выше, добавление должно быть в него без потерь + новый',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: {
                    'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/root.yaml': {
                    'test': 'test',
                    'imports': [
                        'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/not_loose.yaml'
                    ]
                }
            },
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/root.yaml': 'imports:\n  - base_data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/root.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - base/root.yaml\n'
            }
        },

        // ======= PORTAL RELATIVE ==========
        // Вся функциональная логика (merge в существующий манифест, seaf/dochub-приоритет,
        // self-import при совпадении имени, полная цепочка) уже покрыта в PORTAL ABSOLUTE —
        // она не зависит от способа адресации (abs/rel). Здесь проверяется только то, что
        // relative-путь (с baseUri) резолвится в тот же абсолютный URI, что и в abs-варианте.

        {
            description: 'portal rel: 3 из 3 файлов есть в sources (относительные пути резолвятся ровно в те abs URI, что уже в sources)',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: 'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"',
                    'base.test.yaml': 'base:\n  row_1:\n    load: \n  ',
                    'base_new.test.yaml': 'base:\n  row_1:\n    test: chocolate\n    test_wron_file: \n'
                },
                manifestParser: undefined
            },
            parserSources: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_data.yaml': {
                    'imports': []
                },
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base.test.yaml': {
                    'imports': []
                },
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/examples/base/base_new.test.yaml': {
                    'imports': []
                }
            },
            expected: {}
        },
        {
            description: 'portal rel: обычный относительный путь резолвится в правильный абсолютный URI',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: 'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    'base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/root.yaml': 'imports:\n  - base_data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'portal rel: путь с ".." резолвится в тот же абсолютный URI, что и обычный относительный',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: 'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '../base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/root.yaml': 'imports:\n  - base_data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'imports:\n  - root.yaml\n'
            }
        },
        {
            description: 'portal rel: путь от корня (ведущий "/") считается относительным — резолвится так же, как обычный',
            input: {
                rootUri: 'bitbucket:WORK:ka_dzo_modify:test_save@',
                baseUri: 'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/base.yaml',
                indexFileName: 'root.yaml',
                commitData: {
                    '/base_data.yaml': 'base:\n  row_1:\n    ID: "1"'
                },
                manifestParser: undefined
            },
            parserSources: {},
            expected: {
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf-examples/root.yaml': 'imports:\n  - base_data.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@root.yaml': 'imports:\n  - seaf-examples/root.yaml\n',
                'bitbucket:WORK:ka_dzo_modify:test_save@seaf.yaml': 'imports:\n  - root.yaml\n'
            }
        }
    ];

    const activeCases = testCases;
    // const activeCases = testCases.filter(c => c.description === 'plugin: один файл имеет путь выше (..) и уходит выше root');
    test.each(activeCases)('$description', ({ input, parserSources = {}, expected }) => {
        parser.sources = parserSources;

        const result = updateRootFilesInPutContent(input);

        expect(result).toEqual(expected);
    });

    describe('updateRootFilesInPutContent: found source в manifestParser.sources — настоящий SourceItem', () => {
        // в остальных кейсах parserSources — plain-объекты, isSourceItem(source) для них всегда false,
        // поэтому updateImportsInSource всегда идёт по ветке else. Эти два теста используют реальный
        // SourceItem, чтобы задеть ветку if (isSourceItem(source)) { manifest = { ...source?.manifest }; }
        // и показать, что в этом случае результат не содержит вложенного ключа "manifest:" —
        // в отличие от plain-объектов, где spread копирует их целиком вместе с ключом manifest.

        test('импорт передан абсолютным путём', () => {
            const uri = 'plugin:/idea/source/seaf-examples/examples/base/root.yaml';
            parser.sources = {
                [uri]: new RealSourceItem({
                    ownerUri: uri,
                    uri,
                    data: {
                        test: 'test',
                        imports: ['plugin:/idea/source/seaf-examples/examples/base/not_loose.yaml']
                    }
                })
            };

            const result = updateRootFilesInPutContent({
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: { 'base_data.yaml': 'base:\n  row_1:\n    ID: "1"' }
            });

            expect(result).toEqual({
                'root.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            });
        });

        test('импорт передан относительным путём (SourceItem сам приводит его к полному через makeURIByBaseURI)', () => {
            const uri = 'plugin:/idea/source/seaf-examples/examples/base/root.yaml';
            parser.sources = {
                [uri]: new RealSourceItem({
                    ownerUri: uri,
                    uri,
                    data: {
                        test: 'test',
                        imports: ['not_loose.yaml']
                    }
                })
            };

            const result = updateRootFilesInPutContent({
                rootUri: 'plugin:/idea/source/$root',
                baseUri: 'plugin:/idea/source/seaf-examples/examples/base/base.yaml',
                indexFileName: 'root.yaml',
                commitData: { 'base_data.yaml': 'base:\n  row_1:\n    ID: "1"' }
            });

            expect(result).toEqual({
                'root.yaml': 'test: test\nimports:\n  - not_loose.yaml\n  - base_data.yaml\n'
            });
        });
    });

    describe('updateRootFilesInPutContent: валидация rootUri', () => {
        const baseInput = {
            baseUri: '',
            indexFileName: 'root.yaml',
            commitData: { 'a/data.yaml': 'x' },
            manifestParser: { sources: {} }
        };

        test('rootUri = "" должен явно упасть, а не тихо работать без защиты от выхода за root', () => {
            expect(() =>
                updateRootFilesInPutContent({ ...baseInput, rootUri: '' })
            ).toThrow(/rootUri/i);
        });

        test("rootUri = '/' должен явно упасть по той же причине", () => {
            expect(() =>
                updateRootFilesInPutContent({ ...baseInput, rootUri: '/' })
            ).toThrow(/rootUri/i);
        });

        test('rootUri содержит "@", но не является URI bitbucket:/gitlab: - должен явно упасть, а не ошибочно считаться git-схемой', () => {
            expect(() =>
                updateRootFilesInPutContent({ ...baseInput, rootUri: 'someuser@somehost:repo' })
            ).toThrow(/rootUri/i);
        });

        test('rootUri в формате gitlab: (см. example.env) распознаётся как git-схема наравне с bitbucket:', () => {
            const result = updateRootFilesInPutContent({
                baseUri: '',
                indexFileName: 'root.yaml',
                commitData: { 'gitlab:34:main@data.yaml': 'x' },
                manifestParser: { sources: {} },
                rootUri: 'gitlab:34:main@'
            });

            expect(result).toEqual({
                'gitlab:34:main@root.yaml': 'imports:\n  - data.yaml\n',
                'gitlab:34:main@seaf.yaml': 'imports:\n  - root.yaml\n'
            });
        });

        test('rootUri указывает на файл с расширением .yml - обрабатывается так же, как .yaml', () => {
            expect(() =>
                updateRootFilesInPutContent({
                    ...baseInput,
                    rootUri: 'plugin:/idea/source/config.yml',
                    baseUri: 'plugin:/idea/source/a/base.yaml'
                })
            ).not.toThrow();
        });

        test('rootUri указывает на файл с расширением, отличным от .yaml/.yml (например .yaml2) - должен явно упасть, а не портить пути молча', () => {
            expect(() =>
                updateRootFilesInPutContent({
                    ...baseInput,
                    rootUri: 'plugin:/idea/source/config.yaml2',
                    baseUri: 'plugin:/idea/source/a/base.yaml'
                })
            ).toThrow(/rootUri/i);
        });

        test('rootUri = undefined/null должен явно упасть', () => {
            expect(() =>
                updateRootFilesInPutContent({ ...baseInput, rootUri: undefined })
            ).toThrow(/rootUri/i);
        });
    });

});
