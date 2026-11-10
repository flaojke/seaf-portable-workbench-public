import { GigaChatFunctionSchema } from '../types/gigachat.types';

export const subagentBaseSchema: Omit<
  GigaChatFunctionSchema,
  'name' | 'description'
> = {
  parameters: {
    type: 'object',
    properties: {
      request: {
        type: 'string',
        description:
          'Задача для субагента: что нужно сделать и какой результат ожидается'
      }
    },
    required: ['request']
  }
};
