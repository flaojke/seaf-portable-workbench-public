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
      Zaznobin Saveliy <zaznobins@yandex.ru>

  Contributors:
      Zaznobin Saveliy <zaznobins@yandex.ru> - 2026
*/

import {accessOptionsFromRights, filterRights} from '@front/components/ArchChooser/filterRights';

const rights = [
  {title: 'Березка', alias: 'berezka', ra: 'read'},
  {title: 'Альфа Банк', alias: 'alpha', ra: 'write'},
  {title: 'Репозиторий', alias: 'repo', ra: 'repo_read'},
  {title: null, alias: null, ra: null}
];

describe('filterRights', () => {
  test('пустые фильтры возвращают тот же массив', () => {
    expect(filterRights(rights, {title: '', alias: '   ', ra: null})).toBe(rights);
  });

  test('название ищется через includes без учёта регистра', () => {
    expect(filterRights(rights, {title: 'АЛЬФА'})).toEqual([rights[1]]);
  });

  test('псевдоним ищется через includes без учёта регистра', () => {
    expect(filterRights(rights, {alias: 'BER'})).toEqual([rights[0]]);
  });

  test('уровень доступа сравнивается целиком: read не захватывает repo_read', () => {
    expect(filterRights(rights, {ra: 'read'})).toEqual([rights[0]]);
    expect(filterRights(rights, {ra: 'REPO_READ'})).toEqual([rights[2]]);
  });

  test('пробелы по краям уровня не мешают найти его же', () => {
    const padded = [{title: 'Березка', alias: 'berezka', ra: ' READ '}];

    expect(filterRights(padded, {ra: 'read'})).toEqual(padded);
    expect(filterRights(padded, {ra: ' READ '})).toEqual(padded);
  });

  test('фильтры складываются через И', () => {
    expect(filterRights(rights, {title: 'а', alias: 'alpha', ra: 'write'})).toEqual([rights[1]]);
    expect(filterRights(rights, {title: 'а', alias: 'alpha', ra: 'read'})).toEqual([]);
  });

  test('пробелы в текстовом фильтре не фильтруют', () => {
    expect(filterRights(rights, {title: '   '})).toBe(rights);
  });

  test('пустые поля строки не роняют фильтрацию', () => {
    expect(filterRights(rights, {title: 'нет такого'})).toEqual([]);
    expect(filterRights([{title: null, alias: undefined, ra: 1}], {ra: 'read'})).toEqual([]);
  });
});

describe('accessOptionsFromRights', () => {
  test('пункты — уникальные уровни из показанных архитектур, по алфавиту', () => {
    expect(accessOptionsFromRights([
      {ra: 'write'},
      {ra: 'READ'},
      {ra: ' READ '},
      {ra: 'write'},
      {ra: 'repo_read'},
      {ra: null},
      {ra: '   '},
      {ra: 1}
    ])).toEqual([
      {title: 'Все уровни', value: null},
      {title: 'read', value: 'read'},
      {title: 'repo_read', value: 'repo_read'},
      {title: 'write', value: 'write'}
    ]);
  });

  test('без прав остаётся только «все уровни»', () => {
    expect(accessOptionsFromRights(null)).toEqual([{title: 'Все уровни', value: null}]);
    expect(accessOptionsFromRights([])).toEqual([{title: 'Все уровни', value: null}]);
  });
});
