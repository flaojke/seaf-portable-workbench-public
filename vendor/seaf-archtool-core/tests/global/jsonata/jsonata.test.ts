/*
  Copyright (C) 2023 Sber

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
      Navasardyan Suren, Sber

  Contributors:
      Navasardyan Suren, Sber - 2023
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
*/

import {afterEach, describe, expect, it} from '@jest/globals';
import driver from '@global/jsonata/driver.mjs';
import driverData from '../__mocks__/jsonata/driver.json';
import fixturesData from '../__fixtures__/jsonata/driver.json';
import manifest from '../__mocks__/manifest.json';

describe('jsonata', () => {

  describe('driver', () => {
    afterEach(() => {
      driver.manifestSchema = null;
    });

    it('[expression&evaluate]: Должен обработать без ошибок', async() =>
      expect(
        await driver
          .expression(driverData.expression, driverData.self_)
          .evaluate(manifest))
        .toEqual(fixturesData)
    );

    it('$manifestschema() возвращает {} если схема не подключена', async() => {
      expect(
        await driver.expression('$manifestschema()').evaluate({})
      ).toEqual({});
    });

    it('$tryexecute() возвращает текст ошибки и не роняет запрос', async() => {
      expect(await driver.expression(`{
        "ok": $tryexecute(function($a, $b) { $a + $b }, [1, 2]),
        "bad": $tryexecute(function($v) { $number($v) }, ["abc"]),
        "notfn": $tryexecute(1, []),
        "notarr": $tryexecute(function($v) { $v }, {"a": 1})
      }`).evaluate({})).toEqual({
        ok: {success: true, result: 3},
        bad: {
          success: false,
          result: null,
          error: 'Unable to cast value to a number: "abc"'
        },
        notfn: {
          success: false,
          result: null,
          error: 'tryExecute error: First argument of tryExecute must be a function. Received number instead.'
        },
        notarr: {
          success: false,
          result: null,
          error: 'tryExecute error: Second argument of tryExecute must be an array. Received object instead.'
        }
      });
    });

    it('$manifestschema() читает getter в момент вызова, а не в expression()', async() => {
      let schema = null;
      driver.manifestSchema = () => schema;

      const exp = driver.expression('$manifestschema()');
      schema = {type: 'object', properties: {foo: {type: 'string'}}};

      expect(await exp.evaluate({})).toEqual(schema);
    });
  });
});
