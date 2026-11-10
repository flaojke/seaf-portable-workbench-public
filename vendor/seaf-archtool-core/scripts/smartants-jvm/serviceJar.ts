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

// JAR SmartAnts-сервиса на JVM для npm run smartants-jvm-up. В core JAR не хранится: версия и SHA-256
// закреплены в smartants-service.properties, а сам файл берётся из Maven Central (или его зеркала)
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Версия и SHA-256 SmartAnts-сервиса на JVM, закреплённые в core
export const SERVICE_PIN_FILE = path.resolve(__dirname, '../../src/assets/libs/smartants-service.properties');

export type ServicePin = {version: string; sha256: string};

export function readServicePin(file: string = SERVICE_PIN_FILE): ServicePin {
    const { SMARTANTS_VERSION: version, SMARTANTS_SHA256: sha256 } = dotenv.parse(fs.readFileSync(file));
    if (!version || !/^[0-9a-f]{64}$/.test(sha256 ?? '')) {
        throw new Error(`${file}: SMARTANTS_VERSION and SMARTANTS_SHA256 (64 hex chars) are required`);
    }
    return { version, sha256 };
}

export const DEFAULT_MAVEN_REPOSITORY = 'https://repo1.maven.org/maven2';
export const DEFAULT_CACHE_DIR = path.resolve(__dirname, '../../node_modules/.cache/seaf-smartants');

const ARTIFACT_PATH = 'su/seaf/archtool/smartants-service';

export function serviceJarName(version: string): string {
    return `smartants-service-${version}-all.jar`;
}

export function serviceJarUrl(version: string, repository: string = DEFAULT_MAVEN_REPOSITORY): string {
    return `${repository.replace(/\/+$/, '')}/${ARTIFACT_PATH}/${version}/${serviceJarName(version)}`;
}

function sha256Of(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
}

// Почему файл не подходит: undefined - подходит, иначе причина для сообщения об ошибке
function checkPinnedFile(file: string, sha256: string): string | undefined {
    if (!fs.existsSync(file)) return 'no file';
    const actual = sha256Of(fs.readFileSync(file));
    return actual === sha256 ? undefined : `SHA-256 ${actual} does not match pinned`;
}

async function fetchBytes(url: string): Promise<Buffer> {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return Buffer.from(await res.arrayBuffer());
}

// Node fetch сообщает только "fetch failed", настоящая причина (ENOTFOUND, ECONNREFUSED, сертификат) - в cause
function describeFetchError(err: unknown): string {
    const error = err as {message?: string; cause?: {code?: string; message?: string}} | null | undefined;
    const cause = error?.cause;
    if (!cause) return error?.message ?? `${err}`;
    const reason = cause.code && !`${cause.message}`.includes(cause.code) ? `${cause.code} ${cause.message}` : cause.message;
    return `${error?.message}: ${reason}`;
}

type ResolveServiceJarOptions = {
    env?: typeof process.env;
    pin?: ServicePin;
    home?: string;
    cacheDir?: string;
    download?: (url: string) => Promise<Buffer>;
};

type ResolvedServiceJar = {jar: string; source: string};

// Путь к JAR в порядке: VUE_APP_SEAF_SMARTANTS_JAR (как есть), локальный репозиторий Maven, кэш проекта.
// Из ~/.m2 и кэша берётся только файл с закреплённой SHA-256; иначе JAR скачивается в кэш и проверяется.
// Если JAR получить не удалось, ошибка перечисляет все проверенные места и что задать
export async function resolveServiceJar({
    env = process.env,
    pin = readServicePin(),
    home = os.homedir(),
    cacheDir = DEFAULT_CACHE_DIR,
    download = fetchBytes
}: ResolveServiceJarOptions = {}): Promise<ResolvedServiceJar> {
    if (env.VUE_APP_SEAF_SMARTANTS_JAR) {
        const jar = path.resolve(env.VUE_APP_SEAF_SMARTANTS_JAR);
        if (!fs.existsSync(jar)) throw new Error(`VUE_APP_SEAF_SMARTANTS_JAR=${env.VUE_APP_SEAF_SMARTANTS_JAR}: file ${jar} not found`);
        return { jar, source: 'VUE_APP_SEAF_SMARTANTS_JAR' };
    }

    const name = serviceJarName(pin.version);
    const mavenLocal = path.join(home, '.m2', 'repository', ARTIFACT_PATH, pin.version, name);
    const mavenLocalProblem = checkPinnedFile(mavenLocal, pin.sha256);
    if (!mavenLocalProblem) return { jar: mavenLocal, source: 'maven-local' };

    const cached = path.join(cacheDir, name);
    const cachedProblem = checkPinnedFile(cached, pin.sha256);
    if (!cachedProblem) return { jar: cached, source: 'cache' };

    const repository = env.VUE_APP_SEAF_SMARTANTS_MAVEN_REPOSITORY || DEFAULT_MAVEN_REPOSITORY;
    const url = serviceJarUrl(pin.version, repository);
    let downloadProblem: string | undefined;
    try {
        const data = await download(url);
        const actual = sha256Of(data);
        if (actual === pin.sha256) {
            fs.mkdirSync(cacheDir, { recursive: true });
            const tmp = `${cached}.${process.pid}.tmp`;
            fs.writeFileSync(tmp, data);
            fs.renameSync(tmp, cached);
            return { jar: cached, source: url };
        }
        downloadProblem = `SHA-256 ${actual} does not match pinned`;
    } catch (err) {
        downloadProblem = describeFetchError(err);
    }

    throw new Error([
        `SmartAnts JVM service JAR ${name} not found (version ${pin.version}, SHA-256 ${pin.sha256} pinned in ${SERVICE_PIN_FILE}). Checked:`,
        '  - VUE_APP_SEAF_SMARTANTS_JAR: not set',
        `  - local Maven repository ${mavenLocal}: ${mavenLocalProblem}`,
        `  - cache ${cached}: ${cachedProblem}`,
        `  - download ${url}: ${downloadProblem}`,
        'Set in .env one of:',
        '  VUE_APP_SEAF_SMARTANTS_JAR=<path to smartants-service JAR>',
        `  VUE_APP_SEAF_SMARTANTS_MAVEN_REPOSITORY=<Maven Central mirror URL> (now ${repository})`,
        'or put the JAR into the local Maven repository or cache path above.'
    ].join('\n'));
}
