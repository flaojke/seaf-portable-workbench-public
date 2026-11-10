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

import {describe, expect, it} from '@jest/globals';
import {BuildSequence} from '@front/helpers/buildSequence';

describe('BuildSequence', () => {
  it('последнее построение актуально', () => {
    const seq = new BuildSequence();
    const build = seq.start();
    expect(seq.isStale(build)).toBe(false);
    expect(seq.last).toBe(build);
  });

  it('новое построение делает предыдущее устаревшим', () => {
    const seq = new BuildSequence();
    const first = seq.start();
    const second = seq.start();
    expect(seq.isStale(first)).toBe(true);
    expect(seq.isStale(second)).toBe(false);
  });

  it('применяется только ответ на последний запрос, даже если он пришёл раньше', async() => {
    const seq = new BuildSequence();
    const applied: string[] = [];
    const run = (result: string, delay: number) => {
      const build = seq.start();
      return new Promise<void>((resolve) => setTimeout(() => {
        if (!seq.isStale(build)) applied.push(result);
        resolve();
      }, delay));
    };
    // Первый (медленный) запрос отвечает после второго
    await Promise.all([run('first', 20), run('second', 1)]);
    expect(applied).toEqual(['second']);
  });

  it('запуск без запроса (пустая схема) отменяет ожидаемый ответ', () => {
    const seq = new BuildSequence();
    const pending = seq.start();
    seq.start();
    expect(seq.isStale(pending)).toBe(true);
  });
});
