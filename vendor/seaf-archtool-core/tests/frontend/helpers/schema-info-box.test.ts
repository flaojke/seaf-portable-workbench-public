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

import { INFO_LINE_HEIGHT, INFO_PADDING_Y, infoBoxHeight } from '@front/helpers/schemaInfoBox';

const oneLine = INFO_LINE_HEIGHT + INFO_PADDING_Y * 2;

describe('infoBoxHeight', () => {
  test('Короткое пояснение — не ниже заданной высоты', () => {
    expect(infoBoxHeight('Шаг 1', 400, 48)).toBe(48);
    expect(infoBoxHeight('', 400, 48)).toBe(48);
  });

  test('Однострочное пояснение не ниже одной строки с отступами', () => {
    expect(infoBoxHeight('Шаг 1', 400, 10)).toBe(oneLine);
  });

  test('Длинное пояснение растягивает плашку на нужное число строк', () => {
    // 400px ширины — 376px под текст, это ~50 символов в строке
    expect(infoBoxHeight('x'.repeat(50), 400, 48)).toBe(48);
    expect(infoBoxHeight('x'.repeat(51), 400, 48)).toBe(2 * INFO_LINE_HEIGHT + INFO_PADDING_Y * 2);
    expect(infoBoxHeight('x'.repeat(250), 400, 48)).toBe(5 * INFO_LINE_HEIGHT + INFO_PADDING_Y * 2);
  });

  test('Чем уже плашка, тем она выше', () => {
    const text = 'Пользователь отправляет заявку, система проверяет данные и передает их в обработку';

    expect(infoBoxHeight(text, 200, 48)).toBeGreaterThan(infoBoxHeight(text, 600, 48));
  });

  test('Слишком узкая плашка и текст не строкой не ломают расчет', () => {
    expect(Number.isFinite(infoBoxHeight('abc', 0, 48))).toBe(true);
    expect(infoBoxHeight(null, 400, 48)).toBe(48);
    expect(infoBoxHeight(12345, 400, 10)).toBe(oneLine);
  });
});
