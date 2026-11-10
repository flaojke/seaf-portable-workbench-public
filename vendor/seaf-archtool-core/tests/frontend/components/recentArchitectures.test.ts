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

import {
  RECENT_ARCHITECTURES_KEY,
  allSorted,
  readRecent,
  recentSection,
  remember
} from '@front/components/ArchSwitcher/recentArchitectures';

function memoryStorage(initial = {}) {
  const data = {...initial};
  return {
    getItem(key) {
      return Object.prototype.hasOwnProperty.call(data, key) ? data[key] : null;
    },
    setItem(key, value) {
      data[key] = String(value);
    }
  };
}

const rights = [
  {alias: 'beta', title: 'Бета'},
  {alias: 'alpha', title: 'Альфа'},
  {alias: 'alpha-2', title: 'Альфа'},
  {alias: 'ya', title: 'Яблоко'}
];

describe('recentArchitectures', () => {
  test('пустое хранилище не даёт НЕДАВНИЕ', () => {
    const storage = memoryStorage();

    expect(readRecent(storage)).toEqual([]);
    expect(recentSection(rights, 'beta', storage)).toEqual([]);
  });

  test('битый JSON и не-массив читаются как пустой список', () => {
    expect(readRecent(memoryStorage({[RECENT_ARCHITECTURES_KEY]: '{'}))).toEqual([]);
    expect(readRecent(memoryStorage({[RECENT_ARCHITECTURES_KEY]: '{"alias":"a"}'}))).toEqual([]);
    expect(readRecent(null)).toEqual([]);
  });

  test('remember пишет alias и usedAt и поднимает повторный выбор', () => {
    const storage = memoryStorage();

    remember('beta', storage, 10);
    remember('alpha', storage, 20);
    remember('beta', storage, 30);

    expect(readRecent(storage)).toEqual([
      {alias: 'beta', usedAt: 30},
      {alias: 'alpha', usedAt: 20}
    ]);
  });

  test('старый title в хранилище игнорируется', () => {
    const storage = memoryStorage({
      [RECENT_ARCHITECTURES_KEY]: JSON.stringify([
        {alias: 'beta', title: 'Устаревший заголовок', usedAt: 1}
      ])
    });

    expect(readRecent(storage)).toEqual([{alias: 'beta', usedAt: 1}]);
  });

  test('храним четыре вместе с активной, в НЕДАВНИХ три остальных', () => {
    const storage = memoryStorage({
      [RECENT_ARCHITECTURES_KEY]: JSON.stringify([
        {alias: 'ya', title: 'Яблоко', usedAt: 1},
        {alias: 'alpha', title: 'Альфа', usedAt: 2},
        {alias: 'beta', title: 'Бета', usedAt: 4},
        {alias: 'alpha-2', title: 'Альфа', usedAt: 3},
        {alias: 'beta', title: 'Старая Бета', usedAt: 0}
      ])
    });

    expect(readRecent(storage).map((item) => item.alias)).toEqual(['beta', 'alpha-2', 'alpha', 'ya']);
    expect(recentSection(rights, 'beta', storage).map((right) => right.alias)).toEqual(['alpha-2', 'alpha', 'ya']);

    remember('gone', storage, 5);

    expect(readRecent(storage).map((item) => item.alias)).toEqual(['gone', 'beta', 'alpha-2', 'alpha']);
    expect(recentSection(rights, 'beta', storage).map((right) => right.alias)).toEqual(['alpha-2', 'alpha']);
  });

  test('НЕДАВНИЕ идут от свежих к старым, без активной и без чужих alias', () => {
    const storage = memoryStorage();
    remember('ya', storage, 1);
    remember('gone', storage, 2);
    remember('beta', storage, 3);

    expect(recentSection(rights, 'beta', storage).map((right) => right.alias)).toEqual(['ya']);

    const ordered = memoryStorage();
    remember('ya', ordered, 1);
    remember('beta', ordered, 2);
    remember('alpha', ordered, 3);

    expect(recentSection(rights, 'alpha', ordered).map((right) => right.alias)).toEqual(['beta', 'ya']);
  });

  test('ВСЕ сортируются по отображаемому названию, затем по alias', () => {
    expect(allSorted(rights).map((right) => right.alias)).toEqual(['alpha', 'alpha-2', 'beta', 'ya']);
    expect(allSorted([
      {alias: 'beta', title: 'Бета'},
      {alias: 'яблоко'},
      {alias: 'alpha', title: 'Альфа'}
    ]).map((right) => right.alias)).toEqual(['alpha', 'beta', 'яблоко']);

    const source = [{alias: 'b', title: 'Б'}, {alias: 'a', title: 'А'}];
    allSorted(source);
    expect(source.map((right) => right.alias)).toEqual(['b', 'a']);
    expect(allSorted(null)).toEqual([]);
  });
});
