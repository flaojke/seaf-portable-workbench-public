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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="loader" role="status" aria-live="polite">
    <v-progress-circular indeterminate color="primary" size="28" width="3" />
    <div class="loader__text">
      Загружаем таблицу
      <span class="loader__name">{{ tableName }}</span>
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      tableName: {
        type: String,
        required: true
      }
    }
  };
</script>

<style scoped>
.loader {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  min-height: 120px;
  padding: 16px;
  color: var(--dh-text-secondary);
  font-size: 14px;
  text-align: center;
}

.loader__text {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.loader__name {
  color: var(--dh-text-muted);
  font-size: 12px;
  overflow-wrap: anywhere;
}
</style>
