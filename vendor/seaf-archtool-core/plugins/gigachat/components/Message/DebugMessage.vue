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
  <div v-if="tokens" class="debug-message">
    <div>
      <span> Токены: {{ tokens?.total || 0 }}. </span>
      <span> Запрос: {{ tokens?.prompt || 0 }}. </span>
      <span> Ответ: {{ tokens?.completion || 0 }}. </span>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      tokens: {
        type: Object,
        default: null
      }
    }
  };
</script>

<style scoped>
/* Расход токенов — служебная строка приглушённым цветом (как «Найдено N» в поиске) */
.debug-message {
  margin-top: 6px;
  color: var(--dh-text-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
