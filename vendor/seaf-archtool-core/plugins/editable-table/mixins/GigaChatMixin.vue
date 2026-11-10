<!--
  Copyright (C) 2023 Sber

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
      Marat Niyazmatov, Sber

  Contributors:
      Marat Niyazmatov, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<script>
  import { collectAgentStream, createAgentConfig as createSharedAgentConfig } from '@front/helpers/gigachat/agent';
  import { fillColumnRows, formatAgentRequest, parseColumnAgent, runWithAiFillDialogs } from '../lib/aiColumnFill';
  import { logger } from '../index';

  const GIGA_CHAT_EMPTY_RESPONSE = 'None';

  export default {
    data() {
      return {
        chatService: null
      };
    },
    methods: {
      async handleFillColumnWithAI(headerID) {
        await runWithAiFillDialogs(this, () => this.runFillColumnWithAI(headerID), logger);
      },

      async runFillColumnWithAI(headerID) {
        const header = this.tableHeaders[headerID];
        const { agentPath, docId, scenarioId, settings } = parseColumnAgent(header?.agent, header?.text || headerID);
        logger.debug(() => `Агент столбца ${headerID}: ${agentPath} (документ ${docId}, сценарий ${scenarioId})`);

        const { params, input_headers, request } = settings;

        const urlParams = this.$attrs.params || {};
        const agentParams = params.reduce((acc, param) => {
          return Object.assign(acc, typeof param === 'object' ? param : null);
        }, {});

        params.forEach(param => {
          if (urlParams[param] && !agentParams[param]) {
            agentParams[param] = urlParams[param];
          }
        });

        await fillColumnRows(
          Object.entries(this.tableData),
          {
            start: () => this.initializeAgent(docId, scenarioId, agentParams),
            send: (sessionId, message) => this.sendMessageToAgent(sessionId, message),
            end: (sessionId) => this.chatService.endChat(sessionId)
          },
          (rowData) => formatAgentRequest(request, input_headers, rowData),
          (rowId, response) => this.applyAgentResponse(headerID, rowId, response),
          logger
        );
      },

      // Записывает ответ агента в ячейку с учетом типа столбца; false — ответ пустой, строка пропущена
      applyAgentResponse(headerID, rowId, response) {
        logger.debug(() => [`Получен ответ от агента для строки ${rowId}`, { title: 'response', obj: { response } }]);

        let cleanResponse = typeof response === 'string' ? response.trim() : JSON.stringify(response);

        if (cleanResponse && cleanResponse !== GIGA_CHAT_EMPTY_RESPONSE) {
          if (
            (cleanResponse.startsWith('"') && cleanResponse.endsWith('"')) ||
            (cleanResponse.startsWith('\'') && cleanResponse.endsWith('\''))
          ) {
            cleanResponse = cleanResponse.slice(1, -1);
          }

          const headerType = this.tableHeaders[headerID].type;
          if (headerType === 'select') {
            const headerOptions = this.tableHeaders[headerID].options;

            const generatedValue = typeof cleanResponse === 'string' ? cleanResponse.trim().toLowerCase() : cleanResponse;

            const option = headerOptions.find(({ value, text }) => {
              const lowerCaseValue = typeof value === 'string' ? value.toLowerCase() : value;
              const lowerCaseText = typeof text === 'string' ? text.toLowerCase() : text;

              return (lowerCaseValue == generatedValue || lowerCaseText == generatedValue);
            });

            cleanResponse = option ? option.value : null;

          } else if (headerType === 'multiple-select') {
            cleanResponse = this.fixSingleQuoteJSON(cleanResponse);
            try {
              cleanResponse = JSON.parse(cleanResponse);
            } catch(err) {
              if (cleanResponse.startsWith('[') && cleanResponse.endsWith(']')) {
                cleanResponse = cleanResponse.slice(1, -1).trim();
              }
              cleanResponse = cleanResponse.split(',')
                .map(item => {
                  const trimedItem = item.trim();
                  try {
                    return JSON.parse(trimedItem);
                  } catch(err) {
                    return trimedItem;
                  }
                });
            }

            if(Array.isArray(cleanResponse)) {
              const headerOptions = this.tableHeaders[headerID].options;
            
              const values = cleanResponse
                .map((v) => {
                  const generatedValue = typeof v === 'string' ? v.trim().toLowerCase() : v;
                  const option = headerOptions.find(({ value, text }) => {
                    const lowerCaseValue = typeof value === 'string' ? value.toLowerCase() : value;
                    const lowerCaseText = typeof text === 'string' ? text.toLowerCase() : text;

                    return (lowerCaseValue == generatedValue || lowerCaseText == generatedValue);
                  });
                  return option ? option.value : null;
                });
              
              const filteredValues = values.reduce((acc, v) => {
                if(Boolean(v) && !acc.includes(v)) {
                  acc.push(v);
                }
                return acc;
              }, []);

              if(cleanResponse.length !== filteredValues.length) {
                logger.warn(() => [
                  'Сгенерированные значения не содержатся в списке опций',
                  { title: 'Доступные опции', obj: headerOptions },
                  { title: 'Сгенерированные опции', obj: cleanResponse }
                ]);
              } 

              cleanResponse = filteredValues.length > 0 ? filteredValues : null;
            } else {
              throw new Error('Сгенерированное значение должно быть массивом');
            }

          } else if (headerType === 'checkbox') {
            cleanResponse = typeof cleanResponse === 'boolean' 
              ? cleanResponse
              : cleanResponse === 'true' 
                ? true
                : false;
          }
          
          this.tableData[rowId][headerID] = cleanResponse;
          logger.debug(() => `Записан результат в строку ${rowId}: ${cleanResponse}`);
          return true;
        }
        logger.debug(() => `Пропускаем строку ${rowId}, ответ пустой или ${GIGA_CHAT_EMPTY_RESPONSE}`);
        return false;
      },

      fixSingleQuoteJSON(str) {
        return str.replace(/(?<!\\)'/g, '"');
      },

      async initializeAgent(docId, scenarioId, params) {
        const expression = `($.docs."${docId}")`;
        let agentDoc;
        try {
          logger.debug(() => `Поиск агента ${docId}.scenarios.${scenarioId}`);
          agentDoc = await this.pullData(expression, null, params);
        } catch (error) {
          logger.warn(() => 'Ошибка при поиске агента', error);
        }

        const scenario = agentDoc?.scenarios?.[scenarioId];

        if (!agentDoc || !scenario) {
          throw new Error(`Агент "${docId}.scenarios.${scenarioId}" не найден`);
        }

        const agentConfig = this.createAgentConfig(scenario, {subagents: false});

        agentConfig.jsonataParams = params;

        // Получаем системный промпт и контекст
        const systemPrompt = scenario.system_prompt;

        const bindedPullData = this.pullData.bind(this);
        const pullDataTool = (...args) => {
          const [query, params, origin] = args;
          return bindedPullData({source: query, origin}, null, params ?? {});
        };

        // Если есть query, настраиваем контекстные данные
        if (scenario.query) {
          agentConfig.pullDataTool = pullDataTool;
        }

        return await this.chatService.startChat(systemPrompt, scenario.type, agentConfig);
      },

      async sendMessageToAgent(sessionId, message) {
        try {
          return await collectAgentStream(this.chatService, sessionId, message);

        } catch (error) {
          logger.error(() => 'Ошибка при отправке сообщения агенту', error);
          throw error;
        }
      },

      createAgentConfig(scenario, options) {
        const { subagents } = options;

        return createSharedAgentConfig(scenario, {
          profileBase: this.profile.$base,
          extras: {
            jsonataQuery: scenario.query,
            jsonataParams: this.params || (this.$route && this.$route.query) || null,
            jsonataOrigin: scenario.origin || null,
            mcpServers: scenario.mcp_servers,
            promptInjection: scenario?.prompt_injection,
            tools: scenario.tools,
            subagents: subagents ? scenario.subagents : null
          }
        });
      }
    }
  };
</script>
