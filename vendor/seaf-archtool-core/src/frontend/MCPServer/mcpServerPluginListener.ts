import gateway from '@ide/gateway';
import pluginMcpServerToolManager from '@front/MCPServer/pluginMcpServerToolManager';
import type { McpCallToolPayload } from '@front/MCPServer/types/types';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';

import { MCP_SERVER_INVOKE_TOOL } from './constant/actions';

const logger = getLoggerWithTag('f/MCPServer/gateway');
let listenerRegistered = false;

function toErrorResult(message: string) {
  return {
    isError: true,
    content: [{ type: 'text', text: message }]
  };
}

const listenerCallback = async(payload: McpCallToolPayload) => {
  const { requestId, toolName, arguments: toolArgs = {} } = payload ?? {};
  try {
    if (!requestId || !toolName) {
      throw new Error(
        `Некорректный payload invokeTool: ${JSON.stringify(payload)}`
      );
    }

    logger.debug(() => [
      `Вызван gateway listener по событию ${MCP_SERVER_INVOKE_TOOL}`,
      { title: 'Request ID', obj: requestId },
      { title: 'Tool name', obj: toolName }
    ]);

    const result = await pluginMcpServerToolManager.executeHandler(
      toolName,
      toolArgs
    );

    logger.debug(() => [
      'Вызов тула успешно завершён.',
      { title: 'Request ID', obj: requestId },
      { title: 'Tool name', obj: toolName },
      { title: 'Response', obj: result }
    ]);

    pluginMcpServerToolManager.submitToolResultToPlugin({ requestId, result });
  } catch (error) {
    const message = error?.message ? error.message : JSON.stringify(error);

    logger.error(() => [
      'Ошибка при вызове тула.',
      { title: 'Request ID', obj: requestId },
      { title: 'Tool name', obj: toolName }
    ], error);

    pluginMcpServerToolManager.submitToolResultToPlugin({
      requestId,
      result: toErrorResult(message)
    });
  }
};

export function registerMcpServerPluginListener(): void {
  if (listenerRegistered) {
    return;
  }
  listenerRegistered = true;

  gateway.appendListener(MCP_SERVER_INVOKE_TOOL, listenerCallback);

  logger.debug(
    () =>
      `Зарегистрирован gateway listener по событию ${MCP_SERVER_INVOKE_TOOL}`
  );
}
