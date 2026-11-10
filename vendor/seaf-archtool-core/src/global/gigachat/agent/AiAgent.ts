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
      Alexander Romashin, Sber

  Contributors:
      Alexander Romashin, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
*/

import {AgentType} from '../types/ai-config.types';
import {ContentChunk} from '@global/gigachat/agent/type/ContentChunk';
import {PullDataToolFn} from './type/PullDataToolFn';
import {AiSerializableSession} from '../types/ai-session.types';
import {RequestWithBenefits} from '@back/controllers/gigachat';

export interface AiAgent {
  readonly type: AgentType;
  readonly description?: string;
  pullDataTool?: PullDataToolFn;

  fillNewChat?(systemPrompt: string, sessionSerializable: AiSerializableSession): Promise<void>;
  handleMessage(message: string, session: AiSerializableSession, request?: RequestWithBenefits): AsyncIterable<ContentChunk>;
  endChat(session: AiSerializableSession): Promise<void>;
}
