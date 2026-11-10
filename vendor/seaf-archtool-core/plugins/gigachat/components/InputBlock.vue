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
  <div class="input-row">
    <textarea
      ref="messageInput"
      class="message-input"
      v-bind:value="modelValue"
      placeholder="Введите сообщение…"
      aria-label="Сообщение"
      v-on:input="onInput"
      v-on:keydown.enter.exact.prevent="onClickButton"
      v-on:keydown.enter.shift.exact.prevent="createNewLine" />
    <button
      type="button"
      class="send-button"
      title="Отправить (Enter). Новая строка — Shift+Enter"
      aria-label="Отправить"
      v-on:click="onClickButton">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="send-icon">
        <path
          d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
      </svg>
    </button>
  </div>
</template>

<script>
  export default {
    props: {
      modelValue: {
        type: String,
        default: ''
      }
    },
    emits: ['update:modelValue', 'send-message'],
    methods: {
      onInput(event) {
        this.$emit('update:modelValue', event.target.value);
        this.resizeInput(event);
      },
      createNewLine(event) {
        this.$emit('update:modelValue', this.modelValue + '\n');
        this.resizeInput(event);
      },
      resizeInput(event) {
        const textarea = event.target;
        textarea.style.height = 'auto';
        const maxHeight = 120;
        const newHeight = textarea.scrollHeight;
        textarea.style.height = (newHeight < maxHeight ? newHeight : maxHeight) + 'px';
      },
      onClickButton() {
        this.$emit('send-message');
        this.$nextTick(() => {
          if (this.$refs.messageInput) {
            this.$refs.messageInput.style.height = 'auto';
          }
        });
      }
    }
  };
</script>

<style scoped>
/* Поле ввода — как поля фильтров поиска; цвета — из общей палитры (presentation.css) */
.input-row {
  display: flex;
  align-items: flex-end;
  gap: 8px;
}

.message-input {
  flex: 1;
  min-height: 40px;
  max-height: 120px;
  padding: 9px 12px;
  border: 1px solid var(--dh-border-strong);
  border-radius: var(--dh-radius);
  background: var(--dh-surface);
  color: var(--dh-text);
  resize: none;
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 20px;
  overflow-y: hidden;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.message-input::placeholder {
  color: var(--color-text-tertiary);
}

.message-input:focus {
  border-color: var(--dh-primary);
  box-shadow: 0 0 0 1px var(--dh-primary);
}

/* Отправка — основная круглая кнопка фирменного цвета */
.send-button {
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: var(--dh-primary);
  color: var(--dh-on-primary);
  cursor: pointer;
  transition: background-color 0.15s ease;
}

.send-button:hover {
  background: var(--dh-primary-strong);
}

.send-button:focus-visible {
  outline: 2px solid var(--dh-primary);
  outline-offset: 2px;
}

.send-icon {
  width: 20px;
  height: 20px;
  margin-left: 2px;
}
</style>
