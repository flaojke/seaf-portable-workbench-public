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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
-->
      
<template>
  <div class="wrapper">
    <h2>Ошибка</h2>

    <p class="description">
      {{ error.message }}
    </p>

    <div v-if="error.code" class="code-block">
      <code class="code">
        {{ error.code }}
      </code>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      error: {
        type: Error,
        required: true
      }
    }
  };
</script>

<style scoped>
/* Мягкий фон ошибки с цветной полосой: темный текст на насыщенном красном плохо читается */
.wrapper {
  padding: 16px;
  width: 100%;
  min-height: 100px;
  background-color: var(--dh-status-bad-bg);
  border-left: 4px solid var(--color-warning);
  color: var(--dh-status-bad-text);
}

.description {
  font-size: 16px;
  font-weight: 600;
  white-space: pre-line;
}

.code-block {
  padding: 8px 2px;
  border-radius: 4px;
  background-color: var(--dh-surface);
  color: var(--dh-text);
  font-size: 16px;
}

.code {
  white-space: pre-wrap;
}
</style>
