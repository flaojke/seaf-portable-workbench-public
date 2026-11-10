import { DocumentConfigType } from './DocumentConfigType';
import { ToolConfigType } from './ToolConfigType';
import { ToolTypes } from './ToolTypes';
import { GigaChatFunctionSchema } from '@global/gigachat/types/gigachat.types';

export interface ToolInterface {
  type: ToolTypes;
  schema?: GigaChatFunctionSchema;
  execute: (
    args: Record<string, any>,
    toolConfig: ToolConfigType,
    seafConfig: DocumentConfigType,
    sessionId: string,
    requestOptions: any
  ) => unknown;
}
