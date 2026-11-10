import { v4 as uuid4 } from 'uuid';

import { AiSessionConfig, AiSerializableSession } from '@global/gigachat/types/ai-session.types';

export const createSession = (
  config: AiSessionConfig
): AiSerializableSession | undefined => {
  const session = {
    id: uuid4(),
    config: config.agentConfig,
    created: Date.now(),
    lastAccess: Date.now()
  };

  const { type, systemPrompt } = config;

  if (type === 'simple' || type === 'aigena' || type === 'gigachat') {
    return Object.assign(session, {
      type,
      messages: [
        { role: 'system', content: systemPrompt }
      ] as AiSerializableSession['messages']
    }) as AiSerializableSession;
  } else {
    throw new Error(`Invalid session type - ${config.type}`);
  }
};
