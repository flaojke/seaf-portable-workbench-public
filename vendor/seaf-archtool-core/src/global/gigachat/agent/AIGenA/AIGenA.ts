/*
  Copyright (C) 2025 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
    Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025

  Contributors:
    Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
*/

import { AiSerializableSession } from '@global/gigachat/types/ai-session.types';
import { RequestWithBenefits } from '@back/controllers/gigachat';
import { AiAgent } from '../AiAgent';
import { AgentType } from '@global/gigachat/types/ai-config.types';
import { ContentChunk } from '../type/ContentChunk';
import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
import { GigaChatClientConfig } from 'gigachat';
import { requestAiGena } from '@back/helpers/gigachat/requestAiGena';

const LOGGER_NAME = 'AIGenAChatAgent';
const logger = getLoggerWithTag(LOGGER_NAME);

export class AiGenAChatAgent implements AiAgent {
  type: AgentType = 'aigena';
  description = 'Взаимодействие с api ai-gena';

  config: GigaChatClientConfig;

  constructor(config: GigaChatClientConfig) {
    this.config = config;
  }

  async *handleMessage(
    message: string,
    session: AiSerializableSession,
    request: RequestWithBenefits
  ): AsyncIterable<ContentChunk> {
    const gigachatSession = session as AiSerializableSession;

    let isSuccessRequest = true;
    let content;
    try {
      logger.debug(
        () =>
          `Session ${gigachatSession.id}. Request to AIGenA API.`
      );

      const response = await requestAiGena(message, request, this.config);
      content = response.data.msgText;
    } catch (e) {
      logger.error(() => `Session ${gigachatSession.id}. Request to AIGenA failed:`, e);

      isSuccessRequest = false;
      content = `Произошла ошибка при отправке сообщения.\n${
        e?.message || e?.cause?.message || ''
      }`;
    }

    if (isSuccessRequest) {
      gigachatSession.messages.push({ role: 'user', content: message });
      gigachatSession.messages.push({ role: 'assistant', content });
    }

    yield { content };
  }

  // глушу предупреждение т.к. метод пока остается, но ничего не делает
  // eslint-disable-next-line no-unused-vars
  async endChat(session: AiSerializableSession): Promise<void> {
  }
}
