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

import { highlightMatches } from '@front/helpers/highlightMatches';

describe('highlightMatches', () => {
  test('Без запроса текст — один кусок без подсветки', () => {
    expect(highlightMatches('Документы', [])).toEqual([{ text: 'Документы', match: false }]);
  });

  test('Совпадения подсвечиваются без учета регистра, исходный регистр сохраняется', () => {
    expect(highlightMatches('Редактируемые таблицы', ['табл'])).toEqual([
      { text: 'Редактируемые ', match: false },
      { text: 'табл', match: true },
      { text: 'ицы', match: false }
    ]);
    expect(highlightMatches('JSONata', ['json'])).toEqual([
      { text: 'JSON', match: true },
      { text: 'ata', match: false }
    ]);
  });

  test('Подсвечиваются все вхождения и все слова запроса', () => {
    expect(highlightMatches('a-b-a', ['a'])).toEqual([
      { text: 'a', match: true },
      { text: '-b-', match: false },
      { text: 'a', match: true }
    ]);
    expect(highlightMatches('Схема домена', ['схем', 'домен'])).toEqual([
      { text: 'Схем', match: true },
      { text: 'а ', match: false },
      { text: 'домен', match: true },
      { text: 'а', match: false }
    ]);
  });

  test('Пересекающиеся совпадения разных слов сливаются в один кусок', () => {
    expect(highlightMatches('abcd', ['abc', 'bcd'])).toEqual([{ text: 'abcd', match: true }]);
  });

  test('Если смена регистра меняет длину строки, текст выводится без подсветки', () => {
    expect(highlightMatches('İstanbul', ['stan'])).toEqual([{ text: 'İstanbul', match: false }]);
  });

  test('Пустой текст и значение не строкой', () => {
    expect(highlightMatches(undefined, ['a'])).toEqual([{ text: '', match: false }]);
    expect(highlightMatches(2026, ['20'])).toEqual([
      { text: '20', match: true },
      { text: '26', match: false }
    ]);
  });

  test('Подсказка связи на странице поиска: введенный текст — одно слово вместе с пробелами', () => {
    expect(highlightMatches('Система Береза', ['ема бер'])).toEqual([
      { text: 'Сист', match: false },
      { text: 'ема Бер', match: true },
      { text: 'еза', match: false }
    ]);
    expect(highlightMatches('Система Береза', ['дуб'])).toEqual([{ text: 'Система Береза', match: false }]);
  });
});
