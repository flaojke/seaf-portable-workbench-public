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
      Vladislav Markin, Sber

  Contributors:
      Vladislav Markin, Sber - 2026
*/

import {beforeEach, describe, expect, test} from '@jest/globals';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

import {SERVICE_PIN_FILE, readServicePin, resolveServiceJar, serviceJarUrl} from '../../../scripts/smartants-jvm/serviceJar.ts';

const JAR = Buffer.from('smartants-service jar');
const PIN = { version: '1.22.0', sha256: crypto.createHash('sha256').update(JAR).digest('hex') };
const NAME = 'smartants-service-1.22.0-all.jar';

describe('readServicePin', () => {
    test('закреплённая в core версия читается', () => {
        const pin = readServicePin(SERVICE_PIN_FILE);
        expect(pin.version).toMatch(/^\d+\.\d+\.\d+$/);
        expect(pin.sha256).toMatch(/^[0-9a-f]{64}$/);
    });

    test('без SHA-256 - ошибка', () => {
        const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sa-pin-')), 'pin.env');
        fs.writeFileSync(file, 'SMARTANTS_VERSION=1.22.0\n');
        expect(() => readServicePin(file)).toThrow('SMARTANTS_SHA256');
    });
});

test('serviceJarUrl: Maven Central и зеркало со слэшем в конце', () => {
    expect(serviceJarUrl('1.22.0')).toBe(
        'https://repo1.maven.org/maven2/su/seaf/archtool/smartants-service/1.22.0/' + NAME);
    expect(serviceJarUrl('1.22.0', 'https://nexus/maven/')).toBe(
        'https://nexus/maven/su/seaf/archtool/smartants-service/1.22.0/' + NAME);
});

describe('resolveServiceJar', () => {
    let home: string, cacheDir: string, calls: string[];
    const download = async(url: string): Promise<Buffer> => {
        calls.push(url);
        return JAR;
    };

    beforeEach(() => {
        const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sa-jar-'));
        home = path.join(root, 'home');
        cacheDir = path.join(root, 'cache');
        calls = [];
    });

    const resolve = (env = {}) => resolveServiceJar({ env, pin: PIN, home, cacheDir, download });

    test('явный путь берётся как есть, без загрузки', async() => {
        const file = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'sa-own-')), 'x.jar');
        fs.writeFileSync(file, 'own build');
        const res = await resolve({ VUE_APP_SEAF_SMARTANTS_JAR: file });
        expect(res).toEqual({ jar: file, source: 'VUE_APP_SEAF_SMARTANTS_JAR' });
        expect(calls).toEqual([]);
    });

    test('явный путь к несуществующему файлу - ошибка с именем переменной', async() => {
        await expect(resolve({ VUE_APP_SEAF_SMARTANTS_JAR: '/nonexistent/x.jar' }))
            .rejects.toThrow('VUE_APP_SEAF_SMARTANTS_JAR=/nonexistent/x.jar: file');
        expect(calls).toEqual([]);
    });

    test('~/.m2 с закреплённой SHA-256', async() => {
        const file = path.join(home, '.m2/repository/su/seaf/archtool/smartants-service/1.22.0', NAME);
        fs.mkdirSync(path.dirname(file), { recursive: true });
        fs.writeFileSync(file, JAR);
        expect(await resolve()).toEqual({ jar: file, source: 'maven-local' });
        expect(calls).toEqual([]);
    });

    test('загрузка в кэш, затем повтор из кэша; чужой файл в ~/.m2 не берётся', async() => {
        const m2 = path.join(home, '.m2/repository/su/seaf/archtool/smartants-service/1.22.0', NAME);
        fs.mkdirSync(path.dirname(m2), { recursive: true });
        fs.writeFileSync(m2, 'local build');

        const first = await resolve({ VUE_APP_SEAF_SMARTANTS_MAVEN_REPOSITORY: 'https://nexus/maven' });
        expect(first.jar).toBe(path.join(cacheDir, NAME));
        expect(calls).toEqual(['https://nexus/maven/su/seaf/archtool/smartants-service/1.22.0/' + NAME]);
        expect(fs.readFileSync(first.jar)).toEqual(JAR);

        expect(await resolve()).toEqual({ jar: path.join(cacheDir, NAME), source: 'cache' });
        expect(calls).toHaveLength(1);
    });

    test('SHA-256 не совпала - ошибка, кэш не создаётся', async() => {
        const bad = () => resolveServiceJar({ env: {}, pin: PIN, home, cacheDir, download: async() => Buffer.from('x') });
        await expect(bad()).rejects.toThrow('does not match pinned');
        expect(fs.existsSync(path.join(cacheDir, NAME))).toBe(false);
    });

    test('сеть недоступна - ошибка перечисляет проверенные места, причину и что задать', async() => {
        const m2 = path.join(home, '.m2/repository/su/seaf/archtool/smartants-service/1.22.0', NAME);
        fs.mkdirSync(path.dirname(m2), { recursive: true });
        fs.writeFileSync(m2, 'local build');
        const offline = async() => {
            throw new TypeError('fetch failed', { cause: Object.assign(new Error('getaddrinfo ENOTFOUND repo1.maven.org'), { code: 'ENOTFOUND' }) });
        };
        const err = await resolveServiceJar({ env: {}, pin: PIN, home, cacheDir, download: offline }).catch((e) => e);
        expect(err.message).toContain(`${m2}: SHA-256`);
        expect(err.message).toContain(`${path.join(cacheDir, NAME)}: no file`);
        expect(err.message).toContain(`${serviceJarUrl('1.22.0')}: fetch failed: getaddrinfo ENOTFOUND repo1.maven.org`);
        expect(err.message).toContain('VUE_APP_SEAF_SMARTANTS_JAR=<path');
        expect(err.message).toContain('VUE_APP_SEAF_SMARTANTS_MAVEN_REPOSITORY=<Maven Central mirror URL> (now https://repo1.maven.org/maven2)');
    });

    test('HTTP-ошибка зеркала попадает в сообщение', async() => {
        const notFound = async() => {
            throw new Error('HTTP 404');
        };
        const env = { VUE_APP_SEAF_SMARTANTS_MAVEN_REPOSITORY: 'https://nexus/maven' };
        await expect(resolveServiceJar({ env, pin: PIN, home, cacheDir, download: notFound }))
            .rejects.toThrow('https://nexus/maven/su/seaf/archtool/smartants-service/1.22.0/' + NAME + ': HTTP 404');
    });
});
