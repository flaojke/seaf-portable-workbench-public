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

  Maintainers:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026
*/

// В дальнейшем планируется формировать конфиг в самом агенте, на текущем этапе логика вынесена в хелпер
export function createScenarioConfig(
  scenarioId,
  scenarios,
  isSubagent = false
) {
  const scenario = scenarios[scenarioId];

  const documentConfig = {
    jsonataParams: this.params,
    profile: { base: this.profile.$base }
  };

  const helperConfig = {
    pullDataTool: this.createPullDataToolWrapper(scenario.origin)
  };

  const gigachatConfig = {
    model: scenario.model,
    temperature: scenario.temperature,
    n: scenario.n,
    topP: scenario.top_p,
    maxTokens: scenario.max_tokens,
    repetitionPenalty: scenario.repetition_penalty,
    profanityCheck: scenario.profanity_check
  };

  let subagentsConfig = null;
  if (Array.isArray(scenario?.subagents) && !isSubagent) {
    const configList = scenario?.subagents
      .filter(({ id }) => typeof id === 'string' && scenarios[id])
      .map((subagent) => {
        const subagentScenario = scenarios[subagent.id]; 
        return {
          ...subagent,
          systemPrompt: subagentScenario.system_prompt,
          config: createScenarioConfig.call(
            this,
            subagent.id,
            scenarios,
            true
          )
        };
      });

    if (configList.length) {
      subagentsConfig = configList;
    }
  }

  const agentConfig = Object.assign(gigachatConfig, {
    jsonataQuery: scenario.query,
    jsonataOrigin: scenario.origin,

    history: isSubagent ? false : scenario.history,
    hidden: scenario?.hidden === true,

    mcpServers: scenario.mcp_servers,
    promptInjection: scenario.prompt_injection,
    tools: scenario.tools,
    subagents: subagentsConfig
  });

  return Object.assign(agentConfig, documentConfig, helperConfig);
}
