import { GigaChatFunctionSchema } from '@global/gigachat/types/gigachat.types';
import { ToolTypes } from './ToolTypes';

export type ToolConfigType = {
  query?: string;
  type: ToolTypes;
  schema?: GigaChatFunctionSchema;
};
