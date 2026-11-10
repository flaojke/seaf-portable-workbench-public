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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
*/

import {describe, expect, it} from '@jest/globals';
import uriTool, {makeURIByBaseURI} from '@global/manifest/tools/uri.mjs';
import gitlabDriver from '@global/gitlab/driver.mjs';
import bitbucketDriver from '@global/bitbucket/driver.mjs';

const GITLAB_SERVER = 'https://gitlab.example/';
const BITBUCKET_SERVER = 'https://bitbucket.example/';
const ADAPTER_URL = 'http://gas:8082';

const createTool = (config) => new uriTool({
    gitlab_server: GITLAB_SERVER,
    bitbucket_server: BITBUCKET_SERVER,
    gitlabAdapterUrl: ADAPTER_URL,
    bitbucketAdapterUrl: ADAPTER_URL,
    ...config
});

/**
 * Кейс разрешения относительного пути внутри git-репозитория.
 * Пути указываются от корня репозитория, без префикса `protocol:...@`: префикс подставляется из REPOSITORIES.
 *
 * @typedef {Object} RelativeCase
 * @property {string} name - название теста
 * @property {string} baseFile - путь к файлу, относительно которого разрешается uri
 * @property {string} uri - относительный путь, как он записан в манифесте
 * @property {string} expected - ожидаемый путь к целевому файлу
 */

/** @type {RelativeCase[]} */
const RELATIVE_CASES = [
    {name: 'файл в той же папке', baseFile: 'catalog/root.yaml', uri: 'data.yaml', expected: 'catalog/data.yaml'},
    {name: 'файл в той же папке через ./', baseFile: 'catalog/root.yaml', uri: './data.yaml', expected: 'catalog/data.yaml'},
    {name: 'файл во вложенной папке', baseFile: 'catalog/root.yaml', uri: 'data/x.yaml', expected: 'catalog/data/x.yaml'},
    {name: 'файл в соседней папке через ../', baseFile: 'catalog/root.yaml', uri: '../common/x.yaml', expected: 'common/x.yaml'},
    {name: 'файл от корня репозитория через /', baseFile: 'catalog/root.yaml', uri: '/root.yaml', expected: 'root.yaml'},
    {name: 'выход за корень репозитория не покидает репозиторий', baseFile: 'catalog/root.yaml', uri: '../../x.yaml', expected: 'x.yaml'},
    {name: 'базовый файл в корне репозитория', baseFile: 'root.yaml', uri: 'data/x.yaml', expected: 'data/x.yaml'},
    {name: 'глубокая вложенность базового файла', baseFile: 'a/b/c/root.yaml', uri: '../d.yaml', expected: 'a/b/d.yaml'}
];

const REPOSITORIES = [
    {protocol: 'gitlab', prefix: 'gitlab:2:main', modes: [{gitlabMode: 'api'}, {gitlabMode: 'adapter'}]},
    {protocol: 'gitlab', prefix: 'gitlab:2:release/1.0', modes: [{gitlabMode: 'api'}, {gitlabMode: 'adapter'}]},
    {
        protocol: 'bitbucket',
        prefix: 'bitbucket:PROJ:repo:main',
        modes: [{bitbucketMode: 'v1'}, {bitbucketMode: 'v2'}, {bitbucketMode: 'adapter'}]
    }
];

describe('makeURIByBaseURI: относительные пути в git-репозиториях', () => {
    describe.each(REPOSITORIES)('$prefix', ({prefix}) => {
        it.each(RELATIVE_CASES)('$name', ({baseFile, uri, expected}) => {
            expect(makeURIByBaseURI(uri, `${prefix}@${baseFile}`)).toBe(`${prefix}@${expected}`);
        });
    });
});

describe('makeURL: относительный путь разрешается так же, как абсолютный URI', () => {
    const cases = REPOSITORIES.flatMap((repo) => repo.modes.map((mode) => ({...repo, mode})));

    describe.each(cases)('$prefix $mode', ({protocol, prefix, mode}) => {
        const tool = createTool(mode);

        it.each(RELATIVE_CASES)('$name', ({baseFile, uri, expected}) => {
            const expectedURL = tool.makeURL(`${prefix}@${expected}`).url.toString();

            const result = tool.makeURL(uri, `${prefix}@${baseFile}`);

            expect(result.type).toBe(protocol);
            expect(result.url.toString()).toBe(expectedURL);
        });
    });
});

describe('makeURL: явные URL для режима adapter', () => {
    it('gitlab: файл во вложенной папке', () => {
        const tool = createTool({gitlabMode: 'adapter'});

        const result = tool.makeURL('data/x.yaml', 'gitlab:2:main@catalog/root.yaml');

        expect(result.url.toString()).toBe('http://gas:8082/api/v1/vcs/file/catalog/data/x.yaml?repo=2&branch=main');
    });

    it('gitlab: файл в соседней папке', () => {
        const tool = createTool({gitlabMode: 'adapter'});

        const result = tool.makeURL('../common/x.yaml', 'gitlab:2:main@catalog/root.yaml');

        expect(result.url.toString()).toBe('http://gas:8082/api/v1/vcs/file/common/x.yaml?repo=2&branch=main');
    });

    it('bitbucket: файл во вложенной папке', () => {
        const tool = createTool({bitbucketMode: 'adapter'});

        const result = tool.makeURL('data/x.yaml', 'bitbucket:PROJ:repo:main@catalog/root.yaml');

        expect(result.url.toString())
            .toBe('http://gas:8082/api/v1/vcs/file/catalog/data/x.yaml?project=PROJ&repo=repo&branch=main');
    });

    it('bitbucket: файл от корня репозитория', () => {
        const tool = createTool({bitbucketMode: 'adapter'});

        const result = tool.makeURL('/root.yaml', 'bitbucket:PROJ:repo:main@catalog/root.yaml');

        expect(result.url.toString())
            .toBe('http://gas:8082/api/v1/vcs/file/root.yaml?project=PROJ&repo=repo&branch=main');
    });
});

/**
 * Кейс разрешения относительного пути с символами, требующими URL-кодирования.
 * uri встречается в двух формах: как записан в манифесте и уже закодированным
 * (storage-прокси передаёт путь из req.originalUrl). В обоих случаях путь к файлу кодируется ровно один раз.
 *
 * @typedef {Object} EncodedCase
 * @property {string} name - название теста
 * @property {string} uri - относительный путь
 * @property {string} expected - ожидаемый путь к целевому файлу в раскодированном виде
 */

/** @type {EncodedCase[]} */
const ENCODED_CASES = [
    {name: 'пробел в имени файла', uri: 'a b.yaml', expected: 'catalog/a b.yaml'},
    {name: 'закодированный пробел в имени файла', uri: 'a%20b.yaml', expected: 'catalog/a b.yaml'},
    {name: 'кириллица в пути', uri: 'доки/файл.md', expected: 'catalog/доки/файл.md'},
    {name: 'закодированная кириллица в пути', uri: '%D0%B4%D0%BE%D0%BA%D0%B8/x.md', expected: 'catalog/доки/x.md'},
    {name: 'кириллица и пробел с переходом вверх', uri: '../общие/a b.yaml', expected: 'общие/a b.yaml'}
];

describe('makeURL: относительный путь с символами, требующими кодирования, кодируется один раз', () => {
    const BASE_FILE = 'catalog/root.yaml';

    const gitlabCases = [{gitlabMode: 'api'}, {gitlabMode: 'adapter'}];
    describe.each(gitlabCases)('gitlab:2:main $gitlabMode', (mode) => {
        const tool = createTool(mode);
        const driver = new gitlabDriver({gitlab_server: GITLAB_SERVER, gitlabAdapterUrl: ADAPTER_URL, ...mode});

        it.each(ENCODED_CASES)('$name', ({uri, expected}) => {
            const result = tool.makeURL(uri, `gitlab:2:main@${BASE_FILE}`);

            expect(result.url.toString()).toBe(driver.makeFileURI('2', expected, 'main', 'raw').toString());
        });
    });

    const bitbucketCases = [{bitbucketMode: 'v1'}, {bitbucketMode: 'v2'}, {bitbucketMode: 'adapter'}];
    describe.each(bitbucketCases)('bitbucket:PROJ:repo:main $bitbucketMode', (mode) => {
        const tool = createTool(mode);
        const driver = new bitbucketDriver({bitbucket_server: BITBUCKET_SERVER, bitbucketAdapterUrl: ADAPTER_URL, ...mode});

        it.each(ENCODED_CASES)('$name', ({uri, expected}) => {
            const result = tool.makeURL(uri, `bitbucket:PROJ:repo:main@${BASE_FILE}`);

            expect(result.url.toString()).toBe(driver.makeFileURI('PROJ', 'repo', expected, 'main').toString());
        });
    });

    it('gitlab api: явный URL для пробела и кириллицы', () => {
        const tool = createTool({gitlabMode: 'api'});

        expect(tool.makeURL('a%20b.yaml', `gitlab:2:main@${BASE_FILE}`).url.toString())
            .toBe('https://gitlab.example/api/v4/projects/2/repository/files/catalog%2Fa%20b.yaml/raw?ref=main');
        expect(tool.makeURL('доки/x.md', `gitlab:2:main@${BASE_FILE}`).url.toString())
            .toBe('https://gitlab.example/api/v4/projects/2/repository/files/catalog%2F%D0%B4%D0%BE%D0%BA%D0%B8%2Fx.md/raw?ref=main');
    });

    it('bitbucket v1: явный URL для пробела и кириллицы', () => {
        const tool = createTool({bitbucketMode: 'v1'});

        expect(tool.makeURL('a%20b.yaml', `bitbucket:PROJ:repo:main@${BASE_FILE}`).url.toString())
            .toBe('https://bitbucket.example/rest/api/1.0/projects/PROJ/repos/repo/raw/catalog/a%20b.yaml?at=main');
        expect(tool.makeURL('доки/x.md', `bitbucket:PROJ:repo:main@${BASE_FILE}`).url.toString())
            .toBe('https://bitbucket.example/rest/api/1.0/projects/PROJ/repos/repo/raw/catalog/%D0%B4%D0%BE%D0%BA%D0%B8/x.md?at=main');
    });
});

/**
 * Кейс абсолютного git-URI с символами, требующими URL-кодирования.
 * Путь к файлу кодируется ровно один раз; некорректная последовательность '%' не роняет разбор.
 *
 * @typedef {Object} AbsoluteEncodedCase
 * @property {string} name - название теста
 * @property {string} path - путь к файлу в URI после '@'
 * @property {string} expected - ожидаемый путь к файлу в раскодированном виде
 */

/** @type {AbsoluteEncodedCase[]} */
const ABSOLUTE_ENCODED_CASES = [
    {name: 'кириллица в пути', path: 'доки/файл.md', expected: 'доки/файл.md'},
    {name: 'закодированная кириллица в пути', path: '%D0%B4%D0%BE%D0%BA%D0%B8/x.md', expected: 'доки/x.md'},
    {name: 'кириллица и пробел в пути', path: 'доки/a b.yaml', expected: 'доки/a b.yaml'},
    {name: 'одиночный % в имени файла', path: '100%.yaml', expected: '100%.yaml'}
];

describe('makeURL: абсолютный URI с символами, требующими кодирования, кодируется один раз', () => {
    const gitlabCases = [{gitlabMode: 'api'}, {gitlabMode: 'adapter'}];
    describe.each(gitlabCases)('gitlab:2:main $gitlabMode', (mode) => {
        const tool = createTool(mode);
        const driver = new gitlabDriver({gitlab_server: GITLAB_SERVER, gitlabAdapterUrl: ADAPTER_URL, ...mode});

        it.each(ABSOLUTE_ENCODED_CASES)('$name', ({path, expected}) => {
            const result = tool.makeURL(`gitlab:2:main@${path}`);

            expect(result.url.toString()).toBe(driver.makeFileURI('2', expected, 'main', 'raw').toString());
        });
    });

    const bitbucketCases = [{bitbucketMode: 'v1'}, {bitbucketMode: 'v2'}, {bitbucketMode: 'adapter'}];
    describe.each(bitbucketCases)('bitbucket:PROJ:repo:main $bitbucketMode', (mode) => {
        const tool = createTool(mode);
        const driver = new bitbucketDriver({bitbucket_server: BITBUCKET_SERVER, bitbucketAdapterUrl: ADAPTER_URL, ...mode});

        it.each(ABSOLUTE_ENCODED_CASES)('$name', ({path, expected}) => {
            const result = tool.makeURL(`bitbucket:PROJ:repo:main@${path}`);

            expect(result.url.toString()).toBe(driver.makeFileURI('PROJ', 'repo', expected, 'main').toString());
        });
    });

    it('gitlab api: явный URL для кириллицы', () => {
        const tool = createTool({gitlabMode: 'api'});

        expect(tool.makeURL('gitlab:2:main@доки/x.md').url.toString())
            .toBe('https://gitlab.example/api/v4/projects/2/repository/files/%D0%B4%D0%BE%D0%BA%D0%B8%2Fx.md/raw?ref=main');
    });

    it('gitlab adapter: явный URL для кириллицы', () => {
        const tool = createTool({gitlabMode: 'adapter'});

        expect(tool.makeURL('gitlab:2:main@доки/x.md').url.toString())
            .toBe('http://gas:8082/api/v1/vcs/file/%D0%B4%D0%BE%D0%BA%D0%B8/x.md?repo=2&branch=main');
    });

    it('bitbucket v1: явный URL для кириллицы', () => {
        const tool = createTool({bitbucketMode: 'v1'});

        expect(tool.makeURL('bitbucket:PROJ:repo:main@доки/x.md').url.toString())
            .toBe('https://bitbucket.example/rest/api/1.0/projects/PROJ/repos/repo/raw/%D0%B4%D0%BE%D0%BA%D0%B8/x.md?at=main');
    });

    it('кириллица из относительного и абсолютного пути даёт одинаковый URL', () => {
        const tool = createTool({gitlabMode: 'adapter'});

        expect(tool.makeURL('доки/x.md', 'gitlab:2:main@root.yaml').url.toString())
            .toBe(tool.makeURL('gitlab:2:main@доки/x.md').url.toString());
    });
});

/**
 * Кейс разрешения относительного пути при базе `backend:`.
 * makeURIByBaseURI кодирует '..' как '←' (%E2%86%90), чтобы URL не схлопнул переход вверх; backend раскодирует его обратно.
 * makeURL нормализует '..' без кодирования.
 *
 * @typedef {Object} BackendCase
 * @property {string} base - базовый URI `backend://<hash>/...`, относительно которого разрешается uri
 * @property {string} uri - относительный путь
 * @property {string} expected_makeURIByBaseURI - ожидаемый результат makeURIByBaseURI(uri, base)
 * @property {string} expected_makeURL - ожидаемый результат makeURL(uri, base).url
 */

/** @type {BackendCase[]} */
const BACKEND_CASES = [
    {
        base: 'backend://abc/',
        uri: 'data.yaml',
        expected_makeURIByBaseURI: 'backend://abc/data.yaml',
        expected_makeURL: 'backend://abc/data.yaml'
    },
    {
        base: 'backend://abc/',
        uri: './data.yaml',
        expected_makeURIByBaseURI: 'backend://abc/data.yaml',
        expected_makeURL: 'backend://abc/data.yaml'
    },
    {
        base: 'backend://abc/',
        uri: 'data/x.yaml',
        expected_makeURIByBaseURI: 'backend://abc/data/x.yaml',
        expected_makeURL: 'backend://abc/data/x.yaml'
    },
    {
        base: 'backend://abc/',
        uri: '../x.yaml',
        expected_makeURIByBaseURI: 'backend://abc/%E2%86%90/x.yaml',
        expected_makeURL: 'backend://abc/x.yaml'
    },
    {
        base: 'backend://abc/',
        uri: 'a/../../x.yaml',
        expected_makeURIByBaseURI: 'backend://abc/a/%E2%86%90/%E2%86%90/x.yaml',
        expected_makeURL: 'backend://abc/x.yaml'
    },
    {
        base: 'backend://abc/',
        uri: '/x.yaml',
        expected_makeURIByBaseURI: 'backend://abc/x.yaml',
        expected_makeURL: 'backend://abc/x.yaml'
    },
    {
        base: 'backend://abc/',
        uri: 'x.yaml?q=1#h',
        expected_makeURIByBaseURI: 'backend://abc/x.yaml?q=1#h',
        expected_makeURL: 'backend://abc/x.yaml?q=1#h'
    },
    {
        base: 'backend://abc/catalog/root.yaml',
        uri: 'data.yaml',
        expected_makeURIByBaseURI: 'backend://abc/catalog/data.yaml',
        expected_makeURL: 'backend://abc/catalog/data.yaml'
    },
    {
        base: 'backend://abc/catalog/root.yaml',
        uri: '../x.yaml',
        expected_makeURIByBaseURI: 'backend://abc/catalog/%E2%86%90/x.yaml',
        expected_makeURL: 'backend://abc/x.yaml'
    },
    {
        base: 'backend://abc/catalog/root.yaml',
        uri: '/x.yaml',
        expected_makeURIByBaseURI: 'backend://abc/x.yaml',
        expected_makeURL: 'backend://abc/x.yaml'
    }
];

describe('относительные пути при базе backend:', () => {
    const tool = createTool({gitlabMode: 'api'});

    describe('makeURIByBaseURI кодирует ".." как "←"', () => {
        it.each(BACKEND_CASES)('$base + $uri', ({base, uri, expected_makeURIByBaseURI}) => {
            expect(makeURIByBaseURI(uri, base)).toBe(expected_makeURIByBaseURI);
        });
    });

    describe('makeURL нормализует ".." без кодирования', () => {
        it.each(BACKEND_CASES)('$base + $uri', ({base, uri, expected_makeURL}) => {
            const result = tool.makeURL(uri, base);

            expect(result.type).toBe('web');
            expect(result.url.toString()).toBe(expected_makeURL);
        });
    });

    it('абсолютный gitlab-URI не зависит от backend-базы', () => {
        expect(makeURIByBaseURI('gitlab:2:main@x.yaml', 'backend://abc/')).toBe('gitlab:2:main@x.yaml');
        expect(tool.makeURL('gitlab:2:main@x.yaml', 'backend://abc/').url.toString())
            .toBe('https://gitlab.example/api/v4/projects/2/repository/files/x.yaml/raw?ref=main');
    });

    it('абсолютный http-URL не зависит от backend-базы', () => {
        expect(makeURIByBaseURI('https://h/x.yaml', 'backend://abc/')).toBe('https://h/x.yaml');
        expect(tool.makeURL('https://h/x.yaml', 'backend://abc/').url.toString()).toBe('https://h/x.yaml');
    });
});

describe('относительные пути при базе http:', () => {
    const tool = createTool({gitlabMode: 'api'});

    it.each([
        {
            uri: 'data/x.yaml',
            base: 'https://h/docs/root.yaml',
            expected: 'https://h/docs/data/x.yaml'
        },
        {
            uri: '../x.yaml',
            base: 'https://h/docs/root.yaml',
            expected: 'https://h/x.yaml'
        },
        {
            uri: '/x.yaml',
            base: 'https://h/docs/root.yaml',
            expected: 'https://h/x.yaml'
        }
    ])('$uri относительно $base', ({uri, base, expected}) => {
        expect(makeURIByBaseURI(uri, base)).toBe(expected);

        const result = tool.makeURL(uri, base);

        expect(result.type).toBe('web');
        expect(result.url.toString()).toBe(expected);
    });
});
