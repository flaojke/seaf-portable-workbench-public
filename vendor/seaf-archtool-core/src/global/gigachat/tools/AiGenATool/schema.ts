import { Function as GigaChatToolSchema } from 'gigachat/interfaces';
import { ToolTypes } from '../types/ToolTypes';

export const AIGENA_TOOL_SCHEMA: GigaChatToolSchema = {
  name: ToolTypes.aiGena,
  description:
    'Взаимодействует с агентом AiGenA. Консультирует по стандартам ДЗО (инфраструктура и Cloud) и ИТ-трендам (актуальные технологии и их применение в Банке).',
  parameters: {
    type: 'object',
    properties: {
      message: {
        type: 'string',
        description: 'Запрос к ассистенту aiGenA'
      }
    },
    required: ['message']
  },
  return_parameters: {
    type: 'object',
    properties: {
      text: {
        type: 'string',
        description: 'Ответ ассистента'
      }
    },
    required: ['text']
  },
  few_shot_examples: [
    {
      request: 'Какие стандарты ДЗО действуют для размещения систем в облаке?',
      params: {
        message: 'Какие стандарты ДЗО действуют для размещения систем в облаке?'
      }
    }
  ]
};
