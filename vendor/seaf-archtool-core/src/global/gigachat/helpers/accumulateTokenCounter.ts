import { Usage } from 'gigachat/interfaces';
import { AiTokenCounter } from '../types/ai-session.types';

const gigaChatTokensNameMap = {
  prompt: 'prompt_tokens',
  completion: 'completion_tokens',
  total: 'total_tokens'
};

const tokenTypes = Object.keys(gigaChatTokensNameMap);

export const accumulateTokenCounter = (
  currentTokens: AiTokenCounter,
  spentTokens: AiTokenCounter | Usage
) => {
  for (let i = 0; i < tokenTypes.length; i++) {
    const tokenType = tokenTypes[i];
    const gigachatTokenType = gigaChatTokensNameMap[tokenType];

    const count = spentTokens?.[tokenType] ?? spentTokens?.[gigachatTokenType];

    if (typeof count === 'number') {
      currentTokens[tokenType] += count;
    }
  }
};
