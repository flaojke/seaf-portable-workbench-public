import { Function as GigaChatToolSchema } from 'gigachat/interfaces';
import { ToolInterface } from '../types/ToolInterface';
import { ToolTypes } from '../types/ToolTypes';
import { ToolConfigType } from '../types/ToolConfigType';
import { RequestWithBenefits } from '@back/controllers/gigachat';
import { DocumentConfigType } from '../types/DocumentConfigType';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import { GigaChatClientConfig } from 'gigachat';
import { AIGENA_TOOL_SCHEMA } from './schema';

const LOGGER_NAME = 'JSONataTool';
const logger = getLoggerWithTag(LOGGER_NAME);

export type AiGenAToolCallback = (
  message: string,
  request: RequestWithBenefits,
  config: GigaChatClientConfig
) => Promise<{ text: string }>;

export class AiGenATool implements ToolInterface {
  type: ToolTypes.aiGena;
  schema: GigaChatToolSchema;
  config: GigaChatClientConfig;
  private callback: AiGenAToolCallback;

  constructor(callback: AiGenAToolCallback, config: GigaChatClientConfig) {
    this.type = ToolTypes.aiGena;
    this.schema = AIGENA_TOOL_SCHEMA;
    this.callback = callback;
    this.config = config;

    logger.debug(
      () => `AiGenATool tool registered with type: "${ToolTypes.aiGena}"`
    );
  }

  async execute(
    args: Record<string, string>,
    toolConfig: ToolConfigType,
    documentConfig: DocumentConfigType,
    sessionId: string,
    request?: RequestWithBenefits
  ) {
    const { message } = args;

    if (typeof message !== 'string') {
      throw new Error(
        `Ошибка в инструменте с типом "${
          this.type
        }". Поле "message" должно быть строкой. Сформированные параметры: "${JSON.stringify(
          args
        )}"!`
      );
    }

    return await this.callback(message, request, this.config);
  }
}
