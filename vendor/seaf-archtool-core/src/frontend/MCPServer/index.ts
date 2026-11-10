import { addPapiSettingUpdateCallbacks } from '@ide/papiLifeCycle';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import env from '@front/helpers/env';
import pluginMcpServerToolManager from '@front/MCPServer/pluginMcpServerToolManager';

import { registerMcpServerPluginListener } from './mcpServerPluginListener';

import { jsonata } from './schemas/jsonata';
import { search } from './schemas/search';

const logger = getLoggerWithTag('f/MCPServer');

const mcpServerToolSchemas = [jsonata, search];
let initialized = false;

function registerPluginMCPTool(): void {
  if (!env.mcpServerEnabled) {
    logger.info(() => 'MCP-сервер отключён в настройках плагина.');
    return;
  }

  if (!window.$PAPI?.mcpServerRegisterTools) {
    return;
  }

  registerMcpServerPluginListener();

  pluginMcpServerToolManager.registerMcpToolList(mcpServerToolSchemas);

  const tools = pluginMcpServerToolManager.getToolsForPluginBackend();

  window.$PAPI
    .mcpServerRegisterTools({ tools })
    .then(() => window.$PAPI.mcpServerStatus())
    .then((status) => {
      logger.debug(
        () =>
          `Статус MCP-сервера после регистрации тулов: ${JSON.stringify(
            status
          )}`
      );
    })
    .catch((error) => {
      logger.error(
        () => 'Регистрация MCP-тулов на сервере плагина завершилась с ошибкой',
        error
      );
    });
}

export function initMcpServer(): void {
  if (initialized) {
    return;
  }
  initialized = true;

  addPapiSettingUpdateCallbacks({
    funcName: 'mcpInit',
    func: () => registerPluginMCPTool()
  });

  logger.info(() => 'Инициализации MCP-сервера...');
}
