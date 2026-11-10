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
      Alexander Romashin, Sber

  Contributors:
      Alexander Romashin, Sber - 2025
      Marat Niyazmatov, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div
    class="ai-chat"
    v-bind:class="inline ? 'ai-chat__inline' : 'dh-full-height'">
    <!-- Контейнер для отображения сообщений -->
    <button
      type="button"
      class="clear-button"
      title="Очистить чат"
      aria-label="Очистить чат"
      v-on:click="clearChat">
      <v-icon icon="mdi-eraser" size="18" v-bind:color="null" />
    </button>

    <chat-dialog
      v-bind:messages="visibleMessages"
      v-bind:agent-type="activeAgentType" />

    <!-- Контейнер для ввода сообщения -->
    <footer class="input-container">
      <input-block v-model="message" v-on:send-message="sendMessage" />
      <toggle v-bind:toggles="toggles" v-on:on-click="toggleOption" />
    </footer>
  </div>
</template>

<script>
  import { chatService } from '@front/helpers/gigachat/ChatServiceConfigurer';
  import { logger } from '../index';

  import ChatDialog from './ChatDialog.vue';
  import InputBlock from './InputBlock.vue';
  import Toggle from './Toggle.vue';
  import { loadFromStorage, removeFromStorage, saveToStorage } from '../helpers/storage.js';
  import { createScenarioConfig } from '../helpers/create-config.js';

  export default {
    name: 'AiChat',
    components: { ChatDialog, InputBlock, Toggle },
    props: {
      params: {
        type: Object,
        default: null
      },
      profile: {
        type: Object,
        required: true
      },
      pullData: {
        type: Function,
        required: true
      },
      inline: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        message: '',
        toggles: [],
        chatService: null,
        activeAgentType: null
      };
    },
    computed: {
      visibleMessages() {
        const activeToggle = this.toggles.find(t => t.active);
        return activeToggle?.messagesList?.filter(msg => msg.role !== 'system');
      },
      activeToggle() {
        return this.toggles.find(t => t.active);
      }
    },
    async created() {
      logger.debug(() => [{ title: 'Profile данные:', obj: this.profile }]);
      this.chatService = await chatService();

      if (this.profile?.scenarios) {
        logger.debug(() => [{ title: 'Scenarios:', obj: this.profile.scenarios }]);

        try {
          const agents = await this.chatService.getAgentsList();
          logger.info(() => `Получены подключенные агенты: ${JSON.stringify(agents)}`);
          const agentKeys = new Set(agents.map((v) => v.type));
          this.toggles = Object.entries(this.profile.scenarios)
            .filter(([scenarioId, scenario]) => {
              const isValidType = agentKeys.has(scenario.type);
              const isHidden = scenario?.hidden === true;
              if (isValidType && !isHidden) {
                return true;
              } else {
                const errorList = [
                  `Чат "${scenarioId}" исключен из отображения.`,
                  isValidType ? null : `Неизвестный тип агента: ${scenario.type}`,
                  isHidden ? 'Чат скрыт (hidden: true)' : null
                ].filter(Boolean);
                logger.debug(() => errorList);
                return false;
              }
            })
            .map(([scenarioId, scenario]) => {
              const path = [this.profile.$base.split('/').slice(1), 'scenarios', scenarioId];
              return {
                key: path.join('/'),
                scenarioId,
                type: scenario.type,
                label: scenario.title,
                active: false,
                sessionId: null,
                messagesList: null
              };
            });
        } catch (error) {
          logger.error(() => 'Ошибка при инициализации списка агентов:', error);
        }

        if(this.toggles.length === 0) {
          logger.warn(() => 'Нет сценариев для отображения.');
          return;
        }

        const activeToggle = this.toggles[0];
        activeToggle.active = true;
        this.openSession(activeToggle);

        logger.debug(() => [{ title: 'Initialized toggles:', obj: this.toggles }]);
      }
    },
    methods: {
      async sendMessage() {
        const userMessage = this.message.trim();
        if (!userMessage) return;
        const activeToggle = this.toggles.find(t => t.active);
        if (!activeToggle || !activeToggle.sessionId) return;

        activeToggle.messagesList.push({
          text: userMessage,
          role: 'user'
        });
        saveToStorage(activeToggle);
        this.message = '';

        let assistantMessageIndex = activeToggle.messagesList.length;
        activeToggle.messagesList.push({
          text: '',
          role: 'assistant'
        });

        try {
          const stream = this.chatService.message(userMessage, activeToggle.sessionId);
          for await (const chunk of stream) {
            if (chunk.content) {
              activeToggle.messagesList[assistantMessageIndex].text =
                (activeToggle.messagesList[assistantMessageIndex].text || '') + chunk.content;
              saveToStorage(activeToggle);
            }

            // Обрабатываем токены отдельно
            if (chunk.tokens) {
              logger.debug(() => [{ title: '🔧 Получены токены:', obj: chunk.tokens }]);
              activeToggle.messagesList[assistantMessageIndex].tokens = chunk.tokens;
              saveToStorage(activeToggle);

              // Принудительно обновляем Vue для отображения токенов
              this.$nextTick(() => {
                this.$forceUpdate();
              });
            }

            // Обрабатываем логи JSONata
            if (chunk.logs && Array.isArray(chunk.logs)) {
              chunk.logs.forEach((logEntry) => {
                logger.debug(() => [{ title: `[gigachat-log]${logEntry.tag ? `[${logEntry.tag}]` : ''}:`, obj: logEntry.content }]);
              });
            }
          }
        } catch (error) {
          logger.error(() => 'Ошибка при отправке сообщения:', error);
          const lastMessage = activeToggle.messagesList[activeToggle.messagesList.length - 1];
          if (lastMessage && lastMessage.role === 'assistant' && !lastMessage.text) {
            lastMessage.text = 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.';
            saveToStorage(activeToggle);
          }
        }
      },
      async toggleOption(index) {
        const currentToggle = this.toggles.find(t => t.active);
        if (currentToggle) {
          saveToStorage(currentToggle);
        }
        this.toggles.forEach((t, i) => {
          t.active = i === index;
        });
        const selectedToggle = this.toggles[index];
        this.openSession(selectedToggle);
      },
      async clearChat() {
        const activeToggle = this.toggles.find(t => t.active);
        try {
          if (activeToggle.sessionId) {
            try {
              this.chatService.endChat(activeToggle.sessionId);
              removeFromStorage(activeToggle);
              activeToggle.sessionId = null;
              activeToggle.messagesList = null;
            } catch (error) {
              logger.error(() => 'Ошибка при завершении сессии чата:', error);
            }
          }
          await this.openSession(activeToggle);
        } catch (error) {
          logger.error(() => 'Ошибка при очистке чата:', error);
          activeToggle.messagesList = [
            {
              text: 'Произошла ошибка при очистке чата. Пожалуйста, попробуйте еще раз.',
              role: 'system'
            }
          ];
          saveToStorage(activeToggle);
        }
      },
      async openSession(activeToggle) {
        this.activeAgentType = activeToggle.type;
        loadFromStorage(activeToggle);
        if (!activeToggle.sessionId) {
          activeToggle.messagesList = [];
        }

        const agentConfig = createScenarioConfig.call(this, activeToggle.scenarioId, this.profile.scenarios);

        const { system_prompt, type } = this.profile.scenarios[activeToggle.scenarioId];

        activeToggle.sessionId = await this.chatService.startChat(system_prompt, type, agentConfig, activeToggle.sessionId);
        saveToStorage(activeToggle);
      },
      // Создает wrapper для pullDataTool, который поддерживает origin и логи в режиме плагина
      createPullDataToolWrapper(scenarioOrigin) {
        return async(query, params, originArg) => {
          const origin = originArg || scenarioOrigin;

          let result;
          try {
            logger.debug(() => 'Trying execute query');
            result = await this.pullData({ source: `(${query})`, origin }, null, params ?? {});
            logger.debug(() => 'Query executed successfully');

          } catch (error) {
            logger.error(() => 'Query execution failed:', error);

          }
          return result;
        };
      }
    }
  };
</script>

<style scoped>
/* Цвета — из общей палитры представлений (presentation.css) */
.ai-chat {
  position: relative;
  display: flex;
  flex-direction: column;
  font-size: 13px;
  color: var(--dh-text);
  background: var(--dh-surface);
}

.ai-chat__inline {
  height: auto;
  min-height: 0;
  overflow: visible;
}

.input-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--dh-surface);
  border-top: 1px solid var(--dh-border);
  box-sizing: border-box;
  width: 100%;
  position: sticky;
  bottom: 0;
  z-index: 10;
}

/* Очистка чата — второстепенная круглая кнопка; при наведении — в цветах ошибки, так как стирает переписку */
.clear-button {
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 10;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--dh-border);
  border-radius: 50%;
  background: var(--dh-surface);
  color: var(--dh-text-muted);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

.clear-button:hover {
  border-color: var(--dh-status-bad-bg);
  background: var(--dh-status-bad-bg);
  color: var(--dh-danger);
}

.clear-button:focus-visible {
  outline: 2px solid var(--dh-primary);
  outline-offset: 2px;
}
</style>
