/*
  Copyright (C) 2023 Sber

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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
*/

import { HEADER_RENDER_MODES, HEADER_TYPES } from './const';

export class TableError extends Error {
  constructor(message, code) {
    super(message);
    this.code = code;
  }
}

export const checkSourceDataFormat = (source) => {
  const { body } = source;

  if (!body || typeof body !== 'object') {
    const message =
      'Выражение в "source" должно вернуть объект со свойством "body":';
    const example = `
      source:
        body:               # обязательное
          row_1:
            column_1: value
            column_2: value
          row_2:
            column_1: value
            column_2: value
          ...
        headers:            # опциональное
          ...
    `;
    throw new TableError(message, example);
  }
};

export const checkHeadersFormat = (rawHeaders) => {
  if (!Array.isArray(rawHeaders))
    throw new TableError(
      'Значение "headers" не задано или не является массивом'
    );
};

export const checkIsHeadersIncludeValueProp = (rawHeaders) => {
  const headerValues = rawHeaders.map(({ value }) => value).filter(Boolean);
  if (headerValues.length !== rawHeaders.length) {
    throw new TableError(
      'Не задано значение идентификатора (value) для headers'
    );
  }
  const uniqValues = new Set(headerValues);
  if (uniqValues.size !== rawHeaders.length) {
    throw new TableError('Значения в "header/value" должны быть уникальными');
  }
};

export const checkEditableHeaderIncludePathProp = (header) => {
  if (header.editable && !header?.save?.path) {
    const message = `
 Не заполнены опции сохранения для редактируемой колонки (editable: true).
 Проверьте значение "save/path" для "${header.headerID}"
    `;
    throw new TableError(message);
  }
};

export const checkHasSourceInFnHeader = (header) => {
  if (!header?.fn || typeof header.fn !== 'string') {
    const message = `
Проверьте значение "fn" для "header/${header.headerID}" с типом "fn".
Допустимое значение - JSONata выражение с правилом форматирования
    `;
    throw new TableError(message);
  }
};

export const checkHeaderType = (headerType, headerID) => {
  if (!HEADER_TYPES.includes(headerType)) {
    const message = `
 Проверьте значение "type" для header "${headerID}".
 Указанное значение: ${headerType}.
 Допустимые значения: [ ${HEADER_TYPES.join(', ')} ]
    `;
    throw new TableError(message);
  }
};

export const checkHeaderRender = (header) => {
  if (!header.render) return;

  if (!HEADER_RENDER_MODES.includes(header.render)) {
    throw new TableError(`
 Проверьте значение "render" для header "${header.headerID}".
 Указанное значение: ${header.render}.
 Допустимые значения: [ ${HEADER_RENDER_MODES.join(', ')} ]
    `);
  }

  if (header.type !== 'text') {
    throw new TableError(`
 Режим "render: ${header.render}" поддерживается только для колонок "type: text".
 Колонка: "${header.headerID}", тип: "${header.type}".
    `);
  }
};

export const checkIsValidOptionIDPropsInSelectHeaders = (
  optionID,
  headerID,
  rawHeaders
) => {
  if (!rawHeaders.find(({ value }) => value === optionID)) {
    createInvalidOptionListError(headerID);
  }
};

export const createInvalidOptionListError = (headerID) => {
  const message = `
Проверьте значение "options" для "header/${headerID}".
Опции должны быть массивом или объектом (с обязательным свойством "option_id" - ссылкой на другую колонку)
  `;
  const example = `
      # 1. Пример с массивом:

      headers:
        - value: column_id_1
          type: select
          text: Пример # 1
          options:
            - value: option_id_1
              text: Опция 1
            - value: option_id_2

      # 2. Пример с объектом:

      headers:
        - value: column_id_1

        - value: column_id_2
          type: select
          text: Пример # 2
          option_id: column_id_1    # ссылка на значение в колонке 1

          options:                  
            example_1:              # группа селекторов используется если в column_id_1 значение example_1
              - value: option_id_1
                text: Опция 1
              - value: option_id_2
                text: Опция 2
            example_2:              # группа селекторов используется если в column_id_1 значение example_2
              - value: option_id_3
                text: Опция 3
              - value: option_id_4
                text: Опция 4
  `;

  throw new TableError(message, example);
};

export const checkHasOptionIDInSelectHeader = (header) => {
  if (!header?.optionID) {
    const message = `
Проверьте значение "option_id" для "header/${header.value}".
Для опций-объектов данное свойство обязательно.
    `;

    throw new TableError(message);
  }
};

export const checkTextValueFormat = (value, rowID, headerID) => {
  const isValidType =
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean';

  if (isValidType || !value) return;

  const message = `
Проверьте значение данных в таблице:
строка: "${rowID}" / колонка: "${headerID}"
Допустимое значение для "type: text" - string / number / boolean
Указанное значение: ${typeof value}
  `;

  throw new TableError(message);
};

export const checkSelectValueFormat = (value, rowID, headerID) => {
  const isValidValue =
    typeof value === 'string' || typeof value === 'boolean' || !value;

  if (!isValidValue) {
    const message = `
 Проверьте значение данных в таблице:
 строка: "${rowID}" / колонка: "${headerID}"
 Допустимое значение для "type: select" - string / boolean
 Указанное значение: ${typeof value}
    `;

    throw new TableError(message);
  }
};

export const checkMultipleSelectValueFormat = (value, rowID, headerID) => {
  if (value && !Array.isArray(value)) {
    const message = `
Проверьте значение данных в таблице:
строка: ${rowID} / колонка: ${headerID}
Допустимое значение для "type: multiple-select" - массив
    `;

    throw new TableError(message);
  }
};
