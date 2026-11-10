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

// Пояснение сценария SmartAnts (Schema/DHSchema/DHSchemaInfo.vue): высота плашки по объему текста.
// Текст выводится в foreignObject, и SVG не подстраивает высоту под содержимое — ее нужно оценить заранее.

// Шрифт 14px: средняя ширина символа ~7.5px, высота строки 20px
export const INFO_CHAR_WIDTH = 7.5;
export const INFO_LINE_HEIGHT = 20;
// Отступы текста от краев плашки: 12px слева и справа, 10px сверху и снизу
export const INFO_PADDING_X = 12;
export const INFO_PADDING_Y = 10;

// Высота плашки: не меньше заданной и достаточная, чтобы длинное пояснение не обрезалось
export const infoBoxHeight = (text: unknown, width: number, minHeight: number): number => {
  const lineWidth = Math.max(width - INFO_PADDING_X * 2, 1);
  const lines = Math.max(1, Math.ceil((String(text ?? '').length * INFO_CHAR_WIDTH) / lineWidth));
  return Math.max(minHeight, lines * INFO_LINE_HEIGHT + INFO_PADDING_Y * 2);
};
