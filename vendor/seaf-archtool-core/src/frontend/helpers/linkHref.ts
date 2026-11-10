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

// Проверка адреса ссылки (защита от XSS через javascript: и подобные схемы).
// Одно правило для всего портала: таблица, выгрузка таблицы в Excel и DCLink вызывают isUnsafeHref.
// Схема определяется только парсером URL (как в браузере), без регулярных выражений.

// Схемы, которые не выводятся ссылкой (чёрный список; списка разрешённых схем нет)
const UNSAFE_LINK_PROTOCOLS: readonly string[] = ['javascript:', 'data:', 'vbscript:'];

// Нельзя ли выводить адрес в href: опасная схема после разбора относительно base или адрес не разбирается
export function isUnsafeHref(href: unknown, base: string): boolean {
  try {
    const raw = typeof href === 'string' ? href : href == null ? '' : String(href);
    return UNSAFE_LINK_PROTOCOLS.includes(new URL(raw, base).protocol);
  } catch {
    return true;
  }
}
