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

import { describe, expect, it, jest } from '@jest/globals';

import {
  collectAgentStream,
  createAgentConfig,
  type AgentScenario,
  type AgentStreamService
} from '@front/helpers/gigachat/agent';

describe('gigachat agent helpers', () => {
  it('maps snake_case scenario fields and preserves caller extras', () => {
    const scenario: AgentScenario = {
      model: 'GigaChat-2',
      profanity_check: true,
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 42,
      n: 2,
      repetition_penalty: 1.1,
      history: false
    };

    expect(createAgentConfig(scenario, {
      profileBase: 'profile-base',
      extras: { jsonataQuery: 'query', customOption: 'custom' }
    })).toEqual({
      params: { base: 'profile-base' },
      profile: { base: 'profile-base' },
      pullDataTool: expect.any(Function),
      model: 'GigaChat-2',
      profanityCheck: true,
      temperature: 0.2,
      topP: 0.9,
      maxTokens: 42,
      n: 2,
      repetitionPenalty: 1.1,
      history: false,
      jsonataQuery: 'query',
      customOption: 'custom'
    });
  });

  it('checks generation before creating a stream', async() => {
    const message = jest.fn();
    const service = { message } as unknown as AgentStreamService;
    const assertCurrent = jest.fn(() => {
      throw new Error('stale generation');
    });

    await expect(collectAgentStream(service, 'session', 'request', { assertCurrent }))
      .rejects.toThrow('stale generation');
    expect(assertCurrent).toHaveBeenCalledTimes(1);
    expect(message).not.toHaveBeenCalled();
  });

  it('collects content chunks and throws on an error chunk', async() => {
    const service = {
      message: jest.fn(() => (async function*() {
        yield { content: ' first' };
        yield { content: ' second ' };
      })())
    } as unknown as AgentStreamService;

    await expect(collectAgentStream(service, 'session', 'request')).resolves.toBe('first second');

    const errorService = {
      message: jest.fn(() => (async function*() {
        yield { error: true, content: 'service failed' };
      })())
    } as unknown as AgentStreamService;

    await expect(collectAgentStream(errorService, 'session', 'request'))
      .rejects.toThrow('service failed');
  });
});
