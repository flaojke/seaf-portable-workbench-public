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
  DEFAULT_DRAWER_WIDTH,
  DRAWER_WIDTH_KEY,
  MAX_DRAWER_WIDTH,
  MIN_DRAWER_WIDTH,
  clampDrawerWidth,
  readDrawerWidth,
  saveDrawerWidth
} from '@front/helpers/menuDrawerWidth';

const memoryStorage = (initial: Record<string, string> = {}) => {
  const data = { ...initial };
  return {
    data,
    storage: () => ({
      getItem: (key: string) => data[key] ?? null,
      setItem: (key: string, value: string) => {
        data[key] = value;
      }
    })
  };
};

const unavailable = () => {
  throw new Error('localStorage недоступен');
};

describe('menuDrawerWidth', () => {
  test('Ширина ограничена 200–640px и округляется', () => {
    expect(clampDrawerWidth(150)).toBe(MIN_DRAWER_WIDTH);
    expect(clampDrawerWidth(1000)).toBe(MAX_DRAWER_WIDTH);
    expect(clampDrawerWidth(321.6)).toBe(322);
    expect(clampDrawerWidth(MIN_DRAWER_WIDTH)).toBe(200);
    expect(clampDrawerWidth(MAX_DRAWER_WIDTH)).toBe(640);
  });

  test('Сохраненная ширина читается и приводится к допустимым пределам', () => {
    expect(readDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: '420' }).storage)).toBe(420);
    expect(readDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: '5000' }).storage)).toBe(MAX_DRAWER_WIDTH);
    expect(readDrawerWidth(memoryStorage({ [DRAWER_WIDTH_KEY]: '120' }).storage)).toBe(MIN_DRAWER_WIDTH);
  });

  test('Без сохраненного значения или с испорченным значением — ширина по умолчанию', () => {
    for (const saved of [undefined, '', 'abc', '0', '-50', 'Infinity']) {
      const initial: Record<string, string> = saved === undefined ? {} : { [DRAWER_WIDTH_KEY]: saved };
      expect(readDrawerWidth(memoryStorage(initial).storage)).toBe(DEFAULT_DRAWER_WIDTH);
    }
  });

  test('Недоступное хранилище не ломает меню: ширина по умолчанию, сохранение пропускается', () => {
    expect(readDrawerWidth(unavailable)).toBe(DEFAULT_DRAWER_WIDTH);
    expect(() => saveDrawerWidth(400, unavailable)).not.toThrow();
  });

  test('Ширина сохраняется и читается обратно', () => {
    const { data, storage } = memoryStorage();

    saveDrawerWidth(456, storage);

    expect(data[DRAWER_WIDTH_KEY]).toBe('456');
    expect(readDrawerWidth(storage)).toBe(456);
  });
});
