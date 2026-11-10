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
import {smartantsErrorText} from '@front/helpers/smartantsError';

const PREFIX = 'Не удалось построить схему SmartAnts';

// Ошибка axios при ответе backend 503
const backendError = (data: unknown) => Object.assign(new Error('Request failed with status code 503'), {response: {status: 503, data}});

describe('smartantsErrorText', () => {
    test('JVM service rejection', () => {
        const e = backendError({message: 'Smartants Error', result: {result: 'ERROR', queryID: 'q', error: {name: 'SmartAntsUnsupported', message: 'non-empty array grid'}}});
        expect(smartantsErrorText(e)).toBe(`${PREFIX}. SmartAntsUnsupported: non-empty array grid`);
    });

    test('Node service error serialized as an empty object', () => {
        const e = backendError({message: 'Smartants Error', result: {result: 'ERROR', queryID: 'q', error: {}}});
        expect(smartantsErrorText(e)).toBe(`${PREFIX}. Smartants Error`);
    });

    test('service unreachable', () => {
        expect(smartantsErrorText(backendError({message: 'Smartants Error', result: {message: {}}}))).toBe(`${PREFIX}. Smartants Error`);
    });

    test('backend without a JSON body falls back to the request error', () => {
        expect(smartantsErrorText(backendError('<html>Bad gateway</html>'))).toBe(`${PREFIX}. Request failed with status code 503`);
    });

    test('browser worker rejection', () => {
        expect(smartantsErrorText({name: 'TypeError', message: 'x is undefined'})).toBe(`${PREFIX}. TypeError: x is undefined`);
    });

    test('legacy error with text', () => {
        expect(smartantsErrorText({text: 'Ошибка'})).toBe(`${PREFIX}. Ошибка`);
    });

    test('nothing to describe', () => {
        expect(smartantsErrorText(undefined)).toBe(PREFIX);
        expect(smartantsErrorText({})).toBe(PREFIX);
    });
});
