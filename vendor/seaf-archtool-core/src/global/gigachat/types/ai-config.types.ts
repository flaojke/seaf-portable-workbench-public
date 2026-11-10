import { PullDataToolFn } from '../agent/type/PullDataToolFn';
import { GigaChatFunctionSchema } from './gigachat.types';

export type AgentType = 'simple' | 'aigena' | 'gigachat';

export interface AiAgentToolConfig {
  name: string;
  query: string;
  schema: GigaChatFunctionSchema;
}

type MCPConfig = {
  url: string,
  transport: string,
};

export type AiAgentConfig = {
  subagents?: Array<{
    systemPrompt: string,
    id: string,
    description: string,
    schema?: GigaChatFunctionSchema
    config: Omit<AiAgentConfig, 'subagents'>    // субагент не должен быть супервизором
  }>,
  promptInjection?: string,   // Инъекция для пользовательского промпта
  params: {
    base: string              // base презентаций (profile.$base)
  },
  profile?: {
    base: string
  },
  jsonataQuery?: string,      // запрос, который используется для построения контекста в system prompt
  jsonataParams?: any,        // параметры, передаваемые в JSONata как $params
  jsonataOrigin?: any,        // origin презентаций (profile.origin / $base)
  pullDataTool: PullDataToolFn,
  model?: string,             // название модели, которое можно узнать методом https://gigachat.devices.sberbank.ru/api/v1/models
  profanityCheck?: boolean,   // цензура
  temperature?: number,       // Температура выборки в диапазоне от ноля до двух
  topP?: number,              // Вероятностная масса токенов в диапазоне от 0 до 1
  maxTokens?: number,         // Максимальное количество токенов, которые будут использованы для создания ответов
  n?: number,                 // Количество вариантов ответов, которые нужно сгенерировать для каждого входного сообщения
  repetitionPenalty?: number, // Допустимое количество повторений слов
  history?: boolean           // История сообщений
  hidden?: boolean            // Флаг скрытия чата
  tools?: AiAgentToolConfig[] // Список тулов
  mcpServers?: MCPConfig[]    // Список mcp серверов
}
