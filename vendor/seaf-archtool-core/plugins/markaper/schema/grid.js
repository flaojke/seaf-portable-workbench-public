/*
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
	    R.Piontik <r.piontik@mail.ru> - 2023
*/

// JSONSchema для данных модели

const PATTERN_UNITS = '^[0-9|\\.]*(%|px|vw|vh|vmin|vmax|em|rem)$';

export default {
    anyOf: [
        {
            type: 'object',
            properties: {
                type: {
                    title: 'Тип секции',
                    type: 'string',
                    enum: ['columns']
                },
                items: {
                    title: 'Элементы разметки',
                    type: 'array',
                    items: {
                        $ref: '#/'
                    }
                }
            },
            required: ['type', 'items']
        },
        {
            type: 'object',
            properties: {
                type: {
                    title: 'Тип секции',
                    type: 'string',
                    enum: ['rows']
                },
                items: {
                    title: 'Элементы разметки',
                    type: 'array',
                    items: {
                        $ref: '#/'
                    }
                }
            },
            required: ['type', 'items']
        },
        {
            type: 'object',
            properties: {
                title: {
                    title: 'Заголовок секции',
                    type: 'string'
                },
                icon: {
                    title: 'Иконка',
                    type: 'string'
                },
                border: {
                    title: 'Рамка',
                    type: 'boolean'
                },
                style: {
                    type: 'object',
                    properties: {
                        padding: {
                            title: 'Внутренний отступ',
                            type: 'string',
                            pattern: PATTERN_UNITS
                        },
                        'min-height': {
                            title: 'Минимальная высота',
                            type: 'string',
                            pattern: PATTERN_UNITS
                        },
                        'min-width': {
                            title: 'Минимальная ширина',
                            type: 'string',
                            pattern: PATTERN_UNITS
                        },
                        'max-height': {
                            title: 'Максимальная высота',
                            type: 'string',
                            pattern: PATTERN_UNITS
                        },
                        'max-width': {
                            title: 'Максимальная ширина',
                            type: 'string',
                            pattern: PATTERN_UNITS
                        },
                        'border': {
                            title: 'Рамка',
                            type: 'boolean'
                        }
                    },
                    additionalProperties: false
                },
                height: {
                    title: 'Высота секции',
                    type: 'string',
                    pattern: PATTERN_UNITS
                },
                width: {
                    title: 'Ширина секции',
                    type: 'string',
                    pattern: PATTERN_UNITS
                },
                src: require('./src').default,
                params: require('./urlparams').default
            }
        }
    ]
};
