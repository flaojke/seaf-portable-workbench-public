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
      Yushkov Alexandr <asyushkov@gmail.com>

  Contributors:
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
*/

// Отображаемый текст ячеек редактируемой таблицы. Общие функции для компонентов ячеек
// (Select.vue, Link.vue) и глобального поиска: поиск должен находить ровно то, что видно на экране.

export interface SelectOption {
  value: unknown;
  text?: string;
}

/** Варианты select: общий список или группы, выбираемые по значению колонки option_id. */
export type SelectOptions = SelectOption[] | Record<string, SelectOption[]> | null | undefined;

export interface LinkItem {
  text?: string;
  href?: string;
}

const hasOwn = (object: object, key: string): boolean => Object.prototype.hasOwnProperty.call(object, key);

/**
 * Варианты select / multiple-select, доступные строке.
 * options уже нормализованы formatHeaderSelectorOptionList: массив — общий для всех строк,
 * объект групп — группа выбирается по значению колонки option_id в этой строке.
 * Ключ проверяется как собственное свойство: значение строки вроде `toString` или `constructor`
 * не должно попадать в свойства прототипа объекта групп.
 */
export function getRowOptions(
  options: SelectOptions,
  optionID: string | null | undefined,
  row: Record<string, unknown> | null | undefined
): SelectOption[] {
  if (Array.isArray(options)) return options;
  if (!options || typeof options !== 'object' || !optionID) return [];
  const value = row?.[optionID];
  if (value === null || value === undefined) return [];
  const key = String(value);
  if (!hasOwn(options, key)) return [];
  const group = options[key];
  return Array.isArray(group) ? group : [];
}

/**
 * Карта «значение варианта → текст варианта». Объект без прототипа: значение ячейки
 * вроде `constructor`, которого нет среди вариантов, не находит текст в Object.prototype.
 */
export function getOptionTextMap(options: SelectOption[] | null | undefined): Record<string, string | undefined> {
  const map: Record<string, string | undefined> = Object.create(null);
  (options ?? []).forEach(({ value, text }) => {
    map[String(value)] = text;
  });
  return map;
}

/** Текст элемента ссылки так, как его показывает Link.vue: строка как есть, иначе text или href. */
export function getLinkText(link: LinkItem | string | null | undefined): string {
  if (!link) return '';
  return typeof link === 'string' ? link : link.text || link.href || '';
}
