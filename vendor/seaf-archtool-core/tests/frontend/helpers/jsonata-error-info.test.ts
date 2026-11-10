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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber

  Contributors:
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
*/

import jsonata from 'jsonata';
import { jsonataErrorInfo } from '@front/helpers/jsonataErrorInfo';

// Ошибка настоящей JSONata для запроса, выполненного так же, как в песочнице: обернутым в скобки
const errorOf = async(query: string): Promise<unknown> => {
  try {
    await jsonata(`(${query})`).evaluate({});
  } catch (error) {
    return error;
  }
  throw new Error(`Запрос выполнился без ошибки: ${query}`);
};

const place = (query: string, error: unknown) => {
  const { before, at, after } = jsonataErrorInfo(error, query);
  return { before, at, after };
};

describe('jsonataErrorInfo', () => {
  test('Синтаксическая ошибка: подсвечен токен, на котором остановился разбор', async() => {
    const query = 'foo.bar ]';
    const info = jsonataErrorInfo(await errorOf(query), query);

    expect(info.code).toBe('S0202');
    expect(info.message).toContain('got "]"');
    expect(place(query, await errorOf(query))).toEqual({ before: 'foo.bar ', at: ']', after: '' });
  });

  test('Подсвечивается только токен, а не весь остаток запроса', async() => {
    const query = '1 + "x"';

    expect(place(query, await errorOf(query))).toEqual({ before: '1 ', at: '+', after: ' "x"' });
  });

  test('Ошибка выполнения при вызове функции: токен стоит раньше позиции', async() => {
    expect(place('$unknown(1)', await errorOf('$unknown(1)'))).toEqual({ before: '$', at: 'unknown', after: '(1)' });
    expect(place('$string(1, 2, 3, 4)', await errorOf('$string(1, 2, 3, 4)')))
      .toEqual({ before: '$', at: 'string', after: '(1, 2, 3, 4)' });
  });

  test('Токен из обертки или конца выражения не найден в запросе — отметка-курсор в конце', async() => {
    for (const query of ['$.a +', 'a.(b', '"abc']) {
      const info = jsonataErrorInfo(await errorOf(query), query);

      expect(info.position).toBe(query.length);
      expect({ before: info.before, at: info.at, after: info.after }).toEqual({ before: query, at: '', after: '' });
    }
  });

  test('Позиция за пределами запроса ограничивается его границами', () => {
    expect(jsonataErrorInfo({ message: 'x', position: 100 }, 'abc').position).toBe(3);
    expect(jsonataErrorInfo({ message: 'x', position: 0 }, 'abc')).toMatchObject({ position: 0, before: '', after: 'abc' });
  });

  test('Ошибка без позиции (например, от backend) выводится только сообщением', () => {
    expect(jsonataErrorInfo({ message: 'Сервер недоступен', code: 'E500' }, 'a.b')).toEqual({
      message: 'Сервер недоступен', code: 'E500', position: null, before: '', at: '', after: ''
    });
  });

  test('Ошибка строкой или без сообщения', () => {
    expect(jsonataErrorInfo('Таймаут', 'a')).toMatchObject({ message: 'Таймаут', code: null, position: null });
    expect(jsonataErrorInfo(null, 'a').message).toBe('null');
    expect(jsonataErrorInfo({ position: 2 }, 'ab').message).toBe('[object Object]');
  });

  test('Без запроса место ошибки пустое', () => {
    expect(jsonataErrorInfo({ message: 'x', position: 5 }, undefined)).toMatchObject({ position: 0, before: '', at: '', after: '' });
  });
});
