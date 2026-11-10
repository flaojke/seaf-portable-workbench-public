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

import {
  EXCEPTION_STATUS,
  PROBLEM_STATUS,
  isShownOnTab,
  problemsCount,
  problemsCountTone,
  problemsNodeStatus
} from '@front/helpers/problemsTree';

describe('problemsTree', () => {
  test('На вкладке «Все» видны и отклонения, и исключения; на остальных — только свои', () => {
    expect(isShownOnTab('all', false)).toBe(true);
    expect(isShownOnTab('all', true)).toBe(true);
    expect(isShownOnTab('error', false)).toBe(true);
    expect(isShownOnTab('error', true)).toBe(false);
    expect(isShownOnTab('warning', true)).toBe(true);
    expect(isShownOnTab('warning', false)).toBe(false);
  });

  test('Бейдж считает то, что видно на выбранной вкладке', () => {
    expect(problemsCount('error', 3, 2)).toBe(3);
    expect(problemsCount('warning', 3, 2)).toBe(2);
    expect(problemsCount('all', 3, 2)).toBe(5);
  });

  test('Цвет бейджа: отклонения — красный, исключения — янтарный', () => {
    expect(problemsCountTone('error', 3)).toBe('bad');
    expect(problemsCountTone('warning', 3)).toBe('wip');
    expect(problemsCountTone('warning', 0)).toBe('wip');
  });

  test('На вкладке «Все» бейдж красный, если среди посчитанного есть отклонения', () => {
    expect(problemsCountTone('all', 1)).toBe('bad');
    expect(problemsCountTone('all', 0)).toBe('wip');
  });

  test('Значок узла: отклонения важнее исключений, без них значок не меняется', () => {
    expect(problemsNodeStatus(2, 5)).toEqual(PROBLEM_STATUS);
    expect(problemsNodeStatus(0, 5)).toEqual(EXCEPTION_STATUS);
    expect(problemsNodeStatus(0, 0)).toBeNull();
    expect(PROBLEM_STATUS).toEqual({ icon: 'mdi-alert-circle', tone: 'bad' });
    expect(EXCEPTION_STATUS).toEqual({ icon: 'mdi-alert', tone: 'wip' });
  });
});
