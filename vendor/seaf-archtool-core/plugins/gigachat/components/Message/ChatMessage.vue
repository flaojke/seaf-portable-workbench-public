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
  <message-container v-bind:is-user-message="isUserMessage">
    <agent-logo v-if="!isUserMessage" v-bind:agent-type="agentType" />

    <div v-if="msg.text" class="message-content">
      <div v-html="renderMarkdown(parsedText)" />
      <debug-message v-if="showTokenCounter" v-bind:tokens="msg.tokens" />
    </div>

    <div v-else class="loading-message">
      <div class="loading-spinner" />
      <span>Думаю...</span>
    </div>
  </message-container>
</template>

<script>
  import { marked } from 'marked';
  import MessageContainer from './MessageContainer.vue';
  import DebugMessage from './DebugMessage.vue';
  import AgentLogo from '../AgentLogo/AgentLogo.vue';
  import DOMPurify from 'dompurify';

  export default {
    components: { MessageContainer, DebugMessage, AgentLogo },
    props: {
      msg: {
        type: Object,
        required: true
      },
      index: {
        type: Number,
        required: true
      },
      agentType: {
        type: String,
        required: true
      },
      isTokenCounterEnabled: {
        type: Boolean,
        default: false
      }
    },
    computed: {
      isUserMessage() {
        return this.msg?.role === 'user';
      },
      showTokenCounter() {
        return this.isTokenCounterEnabled && !this.isUserMessage && this.msg?.tokens;
      },
      parsedText() {
        try {
          return JSON.parse(this.msg.text);
        } catch {
          return this.msg.text;
        }
      }
    },
    methods: {
      renderMarkdown(text) {
        if (typeof text !== 'string') {
          text = text.toString();
        }
        // Если текст начинается и заканчивается тройными обратными кавычками,
        // извлекаем содержимое и обрабатываем его отдельно
        const codeBlockRegex = /^```[\s\S]*?\n([\s\S]*?)```$/;
        const match = text.match(codeBlockRegex);

        if (match) {
          text = match[1]; // Извлекаем содержимое между маркерами ```
        }

        marked.setOptions({
          breaks: true,
          gfm: true,
          tables: true,
          headerIds: true,
          mangle: false,
          pedantic: false,
          sanitize: false,
          smartLists: true,
          smartypants: true,
          xhtml: false
        });

        // Добавляем обработку случая, когда таблица находится внутри pre>code
        const preCodeRegex = /<pre><code>([\s\S]*?)<\/code><\/pre>/g;
        let rendered = marked(text);
        rendered = rendered.replace(preCodeRegex, (_, content) => {
          return marked(content);
        });

        return DOMPurify.sanitize(rendered);
      }
    }
  };
</script>

<style scoped>
/*
  Markdown в ответах. Оформление повторяет документы (DocMarkdown.vue) на токенах палитры,
  но компактнее: текст 14px, заголовки не крупнее 18px.
*/
.message-content {
  flex: 1 1 auto;
  min-width: 0;
  width: 100%;
  color: var(--dh-text);
  font-size: 14px;
  line-height: 22px;
}

.message-content :deep(p) {
  margin: 0 0 8px;
}

.message-content :deep(:is(p, ul, ol, pre, blockquote, table):last-child) {
  margin-bottom: 0;
}

.message-content :deep(:is(h1, h2, h3, h4, h5, h6)) {
  margin: 16px 0 6px;
  color: var(--dh-text);
  font-weight: 600;
  line-height: 1.3;
  text-wrap: balance;
}

.message-content :deep(:is(h1, h2, h3, h4, h5, h6):first-child) {
  margin-top: 0;
}

.message-content :deep(h1) {
  font-size: 18px;
}

.message-content :deep(h2) {
  font-size: 16px;
}

.message-content :deep(:is(h3, h4, h5, h6)) {
  font-size: 14px;
}

.message-content :deep(ul),
.message-content :deep(ol) {
  margin: 0 0 8px;
  padding-left: 22px;
}

.message-content :deep(li) {
  margin: 2px 0;
}

.message-content :deep(li::marker) {
  color: var(--dh-text-muted);
}

/* Цитата — выноска, как в документах */
.message-content :deep(blockquote) {
  margin: 0 0 8px;
  padding: 8px 12px;
  border-left: 3px solid var(--dh-primary);
  border-radius: 0 var(--dh-radius) var(--dh-radius) 0;
  background: var(--dh-primary-soft);
  color: var(--dh-text);
}

.message-content :deep(blockquote > :last-child) {
  margin-bottom: 0;
}

.message-content :deep(hr) {
  margin: 12px 0;
  border: none;
  border-top: 1px solid var(--dh-border);
}

.message-content :deep(a) {
  color: var(--dh-primary-strong);
  text-decoration: none;
}

.message-content :deep(a:hover) {
  text-decoration: underline;
}

.message-content :deep(img) {
  max-width: 100%;
  height: auto;
  margin: 4px 0;
  border-radius: var(--dh-radius);
}

/* Inline-код */
.message-content :deep(:not(pre) > code) {
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--dh-surface-alt);
  color: var(--dh-text);
  font-family: var(--dh-font-mono);
  font-size: 0.875em;
}

/* Блоки кода */
.message-content :deep(pre) {
  margin: 0 0 8px;
  padding: 10px 12px;
  overflow: auto;
  border-radius: var(--dh-radius);
  background: var(--dh-surface-alt);
  color: var(--dh-text);
  font-family: var(--dh-font-mono);
  font-size: 13px;
  line-height: 1.6;
  tab-size: 4;
}

.message-content :deep(pre code) {
  padding: 0;
  background: none;
  color: inherit;
  font: inherit;
}

.message-content :deep(kbd) {
  padding: 1px 5px;
  border: 1px solid var(--dh-border-strong);
  border-bottom-width: 2px;
  border-radius: 4px;
  background: var(--dh-surface);
  font-family: var(--dh-font-mono);
  font-size: 0.85em;
}

.message-content :deep(mark) {
  padding: 0 2px;
  border-radius: 2px;
  background: var(--dh-status-wip-bg);
  color: inherit;
}

/* Таблицы — как в документах; широкая таблица прокручивается внутри ответа */
.message-content :deep(table) {
  display: block;
  width: max-content;
  max-width: 100%;
  margin: 0 0 8px;
  overflow-x: auto;
  border: 1px solid var(--dh-border);
  border-radius: var(--dh-radius);
  border-collapse: separate;
  border-spacing: 0;
  font-size: 13px;
  line-height: 20px;
}

.message-content :deep(th),
.message-content :deep(td) {
  padding: 6px 10px;
  border-bottom: 1px solid var(--dh-border);
  text-align: left;
  vertical-align: top;
}

.message-content :deep(th) {
  border-bottom-color: var(--dh-border-strong);
  background: var(--dh-surface-header);
  color: var(--dh-text-secondary);
  font-weight: 600;
}

.message-content :deep(tbody tr:last-child td) {
  border-bottom: none;
}

.message-content :deep(tbody tr:hover td) {
  background: var(--dh-surface-hover);
}

/* «Думаю…» — приглушённый текст и индикатор фирменного цвета */
.loading-message {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dh-text-muted);
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--dh-border);
  border-top: 2px solid var(--dh-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

</style>
