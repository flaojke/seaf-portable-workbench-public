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

import { expandedTreeKeys } from '@front/helpers/treeExpand';

describe('expandedTreeKeys', () => {
  test('Разделы с флагом expand собираются на любой глубине', () => {
    const items = [
      { key: 'a', expand: true, items: [{ key: 'a/1', items: [{ key: 'a/1/x', expand: true }] }] },
      { key: 'b', items: [{ key: 'b/1', expand: true }] },
      { key: 'c', expand: false }
    ];

    expect(expandedTreeKeys(items)).toEqual(['a', 'a/1/x', 'b/1']);
  });

  test('Без данных и без флагов раскрытых разделов нет', () => {
    expect(expandedTreeKeys([{ key: 'a', items: [{ key: 'b' }] }])).toEqual([]);
    expect(expandedTreeKeys([])).toEqual([]);
    expect(expandedTreeKeys(null)).toEqual([]);
  });
});
