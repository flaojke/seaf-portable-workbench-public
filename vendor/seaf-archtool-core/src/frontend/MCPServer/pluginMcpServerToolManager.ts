import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';

import type {
  McpCallToolResult,
  McpToolDefinition,
  McpToolMetadata
} from './types/types';

const logger = getLoggerWithTag('f/MCPServer/pluginMcpServerToolManager');

class PluginMCPServerToolManager {
  tools: Map<string, McpToolDefinition>;

  constructor() {
    this.tools = new Map<string, McpToolDefinition>();
  }

  private toZodObject(inputSchema: Record<string, z.ZodTypeAny>) {
    return z.object(
      Object.fromEntries(
        Object.entries(inputSchema).map(([key, schema]) => [key, schema])
      )
    );
  }

  private registerMcpTool(tool: McpToolDefinition): void {
    logger.debug(
      () => `Регистрирую MCP-tool на клиенте: ${JSON.stringify(tool)}`
    );

    this.tools.set(tool.name, tool);
  }

  registerMcpToolList(toolList: McpToolDefinition[]): void {
    toolList.forEach((tool) => this.registerMcpTool(tool));
  }

  getToolsForPluginBackend(): McpToolMetadata[] {
    return [...this.tools.values()].map((tool) => ({
      name: tool.name,
      title: tool.schema.title,
      description: tool.schema.description,
      inputSchema: zodToJsonSchema(this.toZodObject(tool.schema.inputSchema), {
        target: 'jsonSchema7'
      }) as Record<string, unknown>
    }));
  }

  async executeHandler(
    name: string,
    args: Record<string, unknown>
  ): Promise<McpCallToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw new Error(`MCP тул не зарегистрирован: ${name}`);
    }
    if (!tool.handler) {
      throw new Error(`Для MCP тула не зарегистрирован хэндлер: ${name}`);
    }

    const parsedArgs = this.toZodObject(tool.schema.inputSchema).parse(args);
    return tool.handler(parsedArgs as Record<string, unknown>);
  }

  submitToolResultToPlugin(payload: {
    requestId: string;
    result?: unknown;
  }): void {
    // cefQuery нельзя вызывать из стека executeJavaScript/gatewayCallback —
    // иначе deadlock с HTTP-потоком MCP, который ждёт этот результат.
    window.setTimeout(() => {
      if (!window.$PAPI?.mcpServerSubmitResult) {
        logger.debug(() => [
          'В PAPI отсутствует mcpServerSubmitResult.',
          { title: 'Request ID', obj: payload.requestId }
        ]);
        return;
      }
      void window.$PAPI.mcpServerSubmitResult(payload).catch((error) => {
        logger.error(() => [
          'Не удалось отправить результат в плагин.',
          { title: 'Request ID', obj: payload.requestId }
        ], error);
      });
    }, 0);
  }
}

const pluginMcpServerToolManager = new PluginMCPServerToolManager();

export default pluginMcpServerToolManager;
