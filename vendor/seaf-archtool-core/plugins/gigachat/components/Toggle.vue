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
  <div class="toggle-container">
    <button
      v-for="(toggle, index) in toggles"
      v-bind:key="index"
      type="button"
      class="toggle-button"
      v-bind:class="{ active: toggle.active }"
      v-bind:aria-pressed="!!toggle.active"
      v-on:click="onClick(index)">
      {{ toggle.label }}
    </button>
  </div>
</template>

<script>
  export default {
    props: {
      toggles: {
        type: Array,
        default: () => ([])
      }
    },
    methods: {
      onClick(index) {
        this.$emit('on-click', index);
      }
    }
  };
</script>

<style scoped>
/* Выбор агента — как чипы сущностей на странице поиска; выбранный — фирменного цвета */
.toggle-container {
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  gap: 6px;
}

.toggle-button {
  height: 28px;
  padding: 0 12px;
  border: 1px solid var(--dh-chip-border);
  border-radius: 999px;
  background: var(--dh-chip-bg);
  color: var(--dh-chip-text);
  font-size: 13px;
  line-height: 26px;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, color 0.15s ease;
}

.toggle-button:hover {
  border-color: var(--dh-primary);
}

.toggle-button:focus-visible {
  outline: 2px solid var(--dh-primary);
  outline-offset: 2px;
}

.toggle-button.active {
  border-color: var(--dh-primary);
  background: var(--dh-primary);
  color: var(--dh-on-primary);
  font-weight: 600;
}
</style>
