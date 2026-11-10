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

import {describe, expect, test} from '@jest/globals';
import path from 'path';

import {parseJavaMajor, resolveJava} from '../../../scripts/smartants-jvm/java.ts';

describe('parseJavaMajor', () => {
    test.each([
        ['openjdk version "21.0.12" 2026-07-21 LTS', 21],
        ['openjdk version "25.0.4.1" 2026-08-18', 25],
        ['java version "1.8.0_402"', 8],
        ['openjdk version "17" 2021-09-14', 17],
        ['bash: java: command not found', null],
        [undefined, null]
    ])('%s -> %s', (output, major) => {
        expect(parseJavaMajor(output)).toBe(major);
    });
});

describe('resolveJava', () => {
    const javaHome = path.join('/opt', 'jdk');
    const javaHomeCmd = path.join(javaHome, 'bin', 'java');

    test('JAVA_HOME has priority over PATH', () => {
        const probe = () => 21;
        expect(resolveJava({JAVA_HOME: javaHome}, probe)).toEqual({source: 'JAVA_HOME', command: javaHomeCmd, major: 21});
    });

    test('old JAVA_HOME falls through to PATH', () => {
        const probe = (cmd) => (cmd === javaHomeCmd ? 17 : 25);
        expect(resolveJava({JAVA_HOME: javaHome}, probe)).toMatchObject({source: 'PATH', major: 25});
    });

    test('no suitable Java: the error names what was checked', () => {
        const probe = (cmd) => (cmd === javaHomeCmd ? 17 : null);
        expect(() => resolveJava({JAVA_HOME: javaHome}, probe))
            .toThrow(`No suitable Java 21+ found. Checked: JAVA_HOME: ${javaHomeCmd} (major 17); PATH: java (not found)`);
    });
});
