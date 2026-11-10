import { AgentType, AiAgentConfig } from './ai-config.types';
import { GigaChatMessage } from './gigachat.types';

export type AiSessionConfig = {
  type: AgentType;
  systemPrompt: string;
  agentConfig: AiAgentConfig;
}

export type AiTokenCounter = {
  total: number,
  prompt: number,
  completion: number
}

export type AiSerializableSession = {
  id: string;
  type: AgentType;
  config: AiAgentConfig,
  messages: Array<GigaChatMessage>;
  created: number;
  lastAccess:  number;
  tokens?: AiTokenCounter;
  pendingLogs?: Array<{content: any, tag?: string, timestamp: number}>;
}
