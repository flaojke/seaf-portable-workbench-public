import { Function as GigaChatToolSchema } from 'gigachat/interfaces';

export const searchToolSchema: GigaChatToolSchema = {
  description: `
    Поиск по даталейку (datalake search).

    Типичный порядок вызовов:
      1. action=entities — получить список доступных сущностей.
      2. action=filters — получить фильтры для выбранной сущности (choice).
      3. action=run — выполнить поиск с фильтрами и/или текстовым запросом.

    Параметры зависят от action:
      - entities: дополнительные параметры не нужны.
      - filters: обязателен choice (ключ сущности).
      - run: обязателен choice; filters — массив фильтров в формате search-run;
        searchQuery — необязательная строка текстового поиска.
  `,
  name: 'search',
  parameters: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['entities', 'filters', 'run'],
        description:
          'Операция поиска: entities — список сущностей; filters — фильтры сущности; run — выполнить поиск'
      },
      choice: {
        type: 'string',
        description:
          'Ключ сущности для поиска (из результата action=entities). Для поиска по всем сущностям — "__all__"'
      },
      filters: {
        type: 'array',
        description:
          'Массив фильтров в формате search-run. Каждый элемент: field, operator, value',
        items: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Ключ поля фильтра'
            },
            operator: {
              type: 'string',
              description:
                'Оператор фильтра (eq, contains, startsWith, endsWith, exists, in и др.)'
            },
            value: {
              type: 'string',
              description:
                'Значение фильтра (всегда строка из‑за ограничений GigaChat schema). ' +
                'Скаляры: "Beta", "42", "true". Для операторов in/between — JSON-массив строкой: \'["a","b"]\' или \'[1,10]\'. ' +
                'Инструмент сам приведёт тип перед поиском.'
            }
          },
          required: ['field', 'operator', 'value']
        }
      },
      searchQuery: {
        type: 'string',
        description: 'Текстовый поисковый запрос (слова через пробел)'
      }
    },
    required: ['action']
  },
  return_parameters: {
    type: 'object',
    properties: {
      entities: {
        type: 'array',
        description: 'Список сущностей (action=entities)'
      },
      hasCompanies: {
        type: 'boolean',
        description: 'Есть ли данные по компаниям (action=entities)'
      },
      total: {
        type: 'number',
        description: 'Полное число найденных результатов до ограничения (action=run)'
      },
      results: {
        type: 'array',
        description: 'Найденные объекты, не более 50 штук (action=run)'
      }
    }
  },
  few_shot_examples: [
    {
      request: 'Какие сущности доступны для поиска?',
      params: {
        action: 'entities'
      }
    },
    {
      request: 'Покажи фильтры для сущности systems',
      params: {
        action: 'filters',
        choice: 'systems'
      }
    },
    {
      request: 'Найди в systems объекты с названием Alpha',
      params: {
        action: 'run',
        choice: 'systems',
        filters: [],
        searchQuery: 'Alpha'
      }
    },
    {
      request: 'Найди systems где title содержит Beta',
      params: {
        action: 'run',
        choice: 'systems',
        filters: [
          {
            field: 'title',
            operator: 'contains',
            value: 'Beta'
          }
        ],
        searchQuery: ''
      }
    }
  ]
};
