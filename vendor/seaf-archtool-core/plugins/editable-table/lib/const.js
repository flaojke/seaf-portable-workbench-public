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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2024
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
*/

export const SELECT_ROW_WIDTH = '45px';

export const HEADER_TYPES = [
  'text',
  'select',
  'multiple-select',
  'checkbox',
  'link',
  'fn',
  'upload'
];

export const HEADER_RENDER_MODES = [
  'markdown'
];

export class CellDataError {
  constructor(value, message) {
    this.value = value;
    this.message = message;
  }
}

export const DEFAULT_HEADER_ITEM_OPTIONS = {
  optionsListSize: 16,
  type: 'text',
  width: 'auto'
};

export const FILTRATION_MODES = {
  empty: 'empty',
  notEmpty: 'notEmpty',
  correspondsPartially: 'correspondsPartially',
  correspondsFully: 'correspondsFully',
  regExp: 'regExp',
  oneOfMany: 'oneOfMany'
};

export const FILTRATION_MODES_NAMES = {
  [FILTRATION_MODES.empty]: 'Только незаполненные',
  [FILTRATION_MODES.notEmpty]: 'Только заполненные',
  [FILTRATION_MODES.correspondsPartially]: 'Частичное соответствие',
  [FILTRATION_MODES.correspondsFully]: 'Полное соответствие',
  [FILTRATION_MODES.regExp]: 'Регулярное выражение',
  [FILTRATION_MODES.oneOfMany]: 'Один из многих'
};

export const FILTRATION_MODES_NAMES_OVERRIDES = {
  'multiple-select': {
    [FILTRATION_MODES.oneOfMany]: 'Или',
    [FILTRATION_MODES.correspondsFully]: 'И'
  },
  'select': {
    [FILTRATION_MODES.oneOfMany]: 'Или'
  }
};

export const HEADER_TYPES_FILTRATION_MODES = {
  text: {
    availableValues: [
      FILTRATION_MODES.empty,
      FILTRATION_MODES.notEmpty,
      FILTRATION_MODES.correspondsPartially,
      FILTRATION_MODES.correspondsFully,
      FILTRATION_MODES.regExp
      // FILTRATION_MODES.oneOfMany
    ],
    default: FILTRATION_MODES.correspondsPartially
  },
  select: {
    availableValues: [
      FILTRATION_MODES.empty,
      FILTRATION_MODES.notEmpty,
      // FILTRATION_MODES.correspondsPartially,
      FILTRATION_MODES.correspondsFully,
      // FILTRATION_MODES.regExp,
      FILTRATION_MODES.oneOfMany
    ],
    default: FILTRATION_MODES.correspondsFully
  },
  'multiple-select': {
    availableValues: [
      FILTRATION_MODES.empty,
      FILTRATION_MODES.notEmpty,
      FILTRATION_MODES.correspondsPartially,
      FILTRATION_MODES.correspondsFully,
      // FILTRATION_MODES.regExp,
      FILTRATION_MODES.oneOfMany
    ],
    default: FILTRATION_MODES.correspondsPartially
  },
  checkbox: {
    availableValues: [
      // FILTRATION_MODES.empty,
      // FILTRATION_MODES.notEmpty,
      // FILTRATION_MODES.correspondsPartially,
      FILTRATION_MODES.correspondsFully
      // FILTRATION_MODES.regExp,
      // FILTRATION_MODES.oneOfMany,
    ],
    default: FILTRATION_MODES.correspondsFully
  },
  link: {
    availableValues: [
      FILTRATION_MODES.empty,
      FILTRATION_MODES.notEmpty,
      FILTRATION_MODES.correspondsPartially
      // FILTRATION_MODES.correspondsFully
      // FILTRATION_MODES.regExp,
      // FILTRATION_MODES.oneOfMany,
    ],
    default: FILTRATION_MODES.correspondsPartially
  },
  fn: {
    availableValues: [
      FILTRATION_MODES.empty,
      FILTRATION_MODES.notEmpty,
      FILTRATION_MODES.correspondsPartially,
      FILTRATION_MODES.correspondsFully
      // FILTRATION_MODES.regExp,
      // FILTRATION_MODES.oneOfMany,
    ],
    default: FILTRATION_MODES.correspondsPartially
  },
  upload: {
    availableValues: [
      FILTRATION_MODES.empty,
      FILTRATION_MODES.notEmpty,
      FILTRATION_MODES.correspondsPartially,
      FILTRATION_MODES.correspondsFully
      // FILTRATION_MODES.regExp,
      // FILTRATION_MODES.oneOfMany,
    ],
    default: FILTRATION_MODES.correspondsPartially
  }
};

// Глобальный поиск (профиль: global_search: true)
export const GLOBAL_SEARCH_DEBOUNCE = 300;
// Типы колонок, у которых в ячейке нет текста для поиска
export const GLOBAL_SEARCH_EXCLUDED_TYPES = ['checkbox'];
