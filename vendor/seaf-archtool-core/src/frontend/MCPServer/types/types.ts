import type { z } from 'zod';

export interface McpCallToolContent {
  type: string;
  text?: string;
  [key: string]: unknown;
}

export interface McpCallToolResult {
  content: McpCallToolContent[];
  isError?: boolean;
}

export type McpToolHandler = (
  args: Record<string, unknown>
) => Promise<McpCallToolResult>;

export interface McpToolDefinition {
  name: string;
  schema: {
    title: string;
    description: string;
    inputSchema: Record<string, z.ZodTypeAny>;
  };
  handler: McpToolHandler | null;
}

export interface McpToolMetadata {
  name: string;
  title: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpCallToolPayload {
  requestId: string;
  toolName: string;
  arguments?: Record<string, unknown>;
}
