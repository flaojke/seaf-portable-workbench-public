import { AiGenAToolCallback } from '@global/gigachat/tools/AiGenATool/AiGenATool';
import { requestAiGena } from '../requestAiGena';

export const aiGenaToolCallback: AiGenAToolCallback = async(
  message,
  request,
  config
) => {
  const response = await requestAiGena(message, request, config);
  return { text: response.data.msgText };
};
