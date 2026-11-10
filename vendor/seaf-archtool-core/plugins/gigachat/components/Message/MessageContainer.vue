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
  <div class="message-wrapper" v-bind:class="{ 'my-message-wrapper': isUserMessage }">
    <div class="chat-message" v-bind:class="{ 'my-message': isUserMessage }">
      <slot />
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      isUserMessage: {
        type: Boolean,
        required: true
      }
    }
  };
</script>

<style scoped>
/* Облачка сообщений. Цвета — из общей палитры представлений (presentation.css) */
.message-wrapper {
  display: flex;
  width: 100%;
  justify-content: start;
  align-items: flex-start;
  margin-bottom: 16px;
}

.my-message-wrapper {
  justify-content: flex-end;
}

.chat-message {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  width: 90%;
  padding: 8px 12px;
  margin-bottom: 0;
  word-wrap: break-word;
  overflow-wrap: break-word;
  min-width: 50px;
  border-radius: 12px;
  color: var(--dh-text);
}

/* Сообщение пользователя — светлое фирменное облачко с «хвостиком» справа внизу */
.my-message {
  width: auto;
  max-width: 60%;
  border: 1px solid color-mix(in srgb, var(--dh-primary) 18%, white);
  border-bottom-right-radius: 4px;
  background: var(--dh-primary-soft);
  font-size: 14px;
  line-height: 20px;
}
</style>
