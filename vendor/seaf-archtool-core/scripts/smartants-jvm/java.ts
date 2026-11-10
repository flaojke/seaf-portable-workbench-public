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

import path from 'path';
import { spawnSync } from 'child_process';

export const MIN_JAVA_MAJOR = 21;

// Мажорная версия из вывода `java -version`: "21.0.12" -> 21, "1.8.0_402" -> 8
export function parseJavaMajor(versionOutput: string | undefined): number | null {
    const match = /version "(\d+)(?:\.(\d+))?/.exec(versionOutput ?? '');
    if (!match) return null;
    const first = Number(match[1]);
    return first === 1 && match[2] !== undefined ? Number(match[2]) : first;
}

// Кандидаты в порядке приоритета: JAVA_HOME, затем java из PATH
type JavaCandidate = {source: 'JAVA_HOME' | 'PATH'; command: string};
type JavaProbe = (command: string, env: typeof process.env) => number | null;

export function javaCandidates(env: typeof process.env): JavaCandidate[] {
    const exe = process.platform === 'win32' ? 'java.exe' : 'java';
    const result: JavaCandidate[] = [];
    if (env.JAVA_HOME) result.push({ source: 'JAVA_HOME', command: path.join(env.JAVA_HOME, 'bin', exe) });
    result.push({ source: 'PATH', command: exe });
    return result;
}

// Первая Java не ниже MIN_JAVA_MAJOR. Ошибка перечисляет всё, что проверено
export function resolveJava(env: typeof process.env = process.env, probe: JavaProbe = probeJava): JavaCandidate & {major: number} {
    const checked = [];
    for (const candidate of javaCandidates(env)) {
        const major = probe(candidate.command, env);
        if (major !== null && major >= MIN_JAVA_MAJOR) return { ...candidate, major };
        checked.push(`${candidate.source}: ${candidate.command} (${major === null ? 'not found' : `major ${major}`})`);
    }
    throw new Error(`No suitable Java ${MIN_JAVA_MAJOR}+ found. Checked: ${checked.join('; ')}`);
}

function probeJava(command: string, env: typeof process.env): number | null {
    const res = spawnSync(command, ['-version'], { env, encoding: 'utf8' });
    if (res.error || res.status !== 0) return null;
    // java -version пишет в stderr
    return parseJavaMajor(`${res.stderr}${res.stdout}`);
}
