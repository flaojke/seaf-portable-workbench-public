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

// Подсветка найденного текста: поиск по главному меню, подсказки связей на странице поиска.

// Кусок текста; match — совпадение со словом запроса, выводится через <mark>
export interface MatchPart {
  text: string;
  match: boolean;
}

// Текст, разбитый на куски с совпадениями и без. Слова запроса — в нижнем регистре; подсвечиваются
// все вхождения всех слов, пересекающиеся совпадения сливаются. Если при смене регистра меняется
// длина строки (например, «İ»), позиции в нижнем регистре не совпадают с исходными, и подсветки нет.
export const highlightMatches = (value: unknown, terms: string[]): MatchPart[] => {
  const text = `${value ?? ''}`;
  const lower = text.toLocaleLowerCase();
  if (!terms.length || !text || (lower.length !== text.length)) return [{ text, match: false }];

  const marks: boolean[] = new Array(text.length).fill(false);
  terms.forEach((term) => {
    if (!term) return;
    for (let at = lower.indexOf(term); at >= 0; at = lower.indexOf(term, at + term.length)) {
      marks.fill(true, at, at + term.length);
    }
  });

  const parts: MatchPart[] = [];
  marks.forEach((match, i) => {
    const last = parts[parts.length - 1];
    if (last && (last.match === match)) last.text += text[i];
    else parts.push({ text: text[i], match });
  });
  return parts;
};
