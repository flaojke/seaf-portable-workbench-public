/*
  Copyright (C) 2026 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import type { ContentChunk } from '../../../global/gigachat/agent/type/ContentChunk';
import type { PullDataToolFn } from '../../../global/gigachat/agent/type/PullDataToolFn';
import type { AiAgentConfig } from '../../../global/gigachat/types/ai-config.types';

export interface AgentScenario {
  model?: string;
  profanity_check?: boolean;
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  repetition_penalty?: number;
  history?: boolean;
  [key: string]: unknown;
}

export interface AgentConfigOptions {
  profileBase: string;
  extras?: Record<string, unknown>;
}

export type RuntimeAgentConfig = AiAgentConfig;

const unavailablePullDataTool: PullDataToolFn = async() => {
  throw new Error('Инструмент получения данных не настроен для этого AI-сеанса.');
};

export interface AgentStreamService {
  message(message: string, sessionId: string): AsyncIterable<ContentChunk>;
}

export interface AgentStreamOptions {
  assertCurrent?: () => void;
}

export function createAgentConfig(
  scenario: AgentScenario,
  { profileBase, extras = {} }: AgentConfigOptions
): RuntimeAgentConfig {
  return {
    params: { base: profileBase },
    profile: { base: profileBase },
    pullDataTool: unavailablePullDataTool,
    model: scenario.model,
    profanityCheck: scenario.profanity_check,
    temperature: scenario.temperature,
    topP: scenario.top_p,
    maxTokens: scenario.max_tokens,
    n: scenario.n,
    repetitionPenalty: scenario.repetition_penalty,
    history: scenario.history,
    ...extras
  };
}

export async function collectAgentStream(
  service: AgentStreamService,
  sessionId: string,
  request: string,
  { assertCurrent }: AgentStreamOptions = {}
): Promise<string> {
  const chunks: string[] = [];
  assertCurrent?.();
  const stream = service.message(request, sessionId);
  for await (const chunk of stream) {
    assertCurrent?.();
    if (chunk?.error) {
      throw new Error(chunk.content || 'LLM-сервис вернул ошибку');
    }
    if (chunk?.content) chunks.push(chunk.content);
  }
  return chunks.join('').trim();
}
