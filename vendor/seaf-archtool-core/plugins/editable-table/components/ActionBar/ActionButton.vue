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
  <v-tooltip location="bottom" class="wrapper">
    <template #activator="{ props }">
      <button
        class="button"
        v-bind:class="{'focused': focused, 'primary': primary, 'with-label': !!label}"
        v-bind="props"
        v-bind:disabled="disabled"
        v-on:click="$emit('click')">
        <icon class="icon" v-bind:type="iconType" size="18" v-bind:color="null" />
        <span v-if="label" class="label">{{ label }}</span>
      </button>
    </template>
    <span>{{ tooltip }}</span>
  </v-tooltip>
</template>

<script>
  import Icon from '../Icon/Icon.vue';
  export default {
    components: { Icon },
    props: {
      tooltip: {
        type: String,
        required: false,
        default: ''
      },
      disabled: {
        type: Boolean,
        required: false,
        default: false
      },
      iconType: {
        type: String,
        required: true
      },
      focused: {
        type: Boolean,
        required: false,
        default: false
      },
      // Видимая подпись рядом с иконкой; подсказка (tooltip) показывается и при наличии подписи
      label: {
        type: String,
        required: false,
        default: ''
      },
      // Основное действие (закрашенная кнопка)
      primary: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    emits: ['click']
  };
</script>

<style scoped>
.wrapper {
  background: none !important;
}
.button {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 7px;
  border: 1px solid var(--dh-border-strong);
  border-radius: var(--dh-radius);
  background-color: var(--dh-surface);
  color: var(--dh-text);
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
}
.button.with-label {
  padding: 0 10px;
}
.button:hover:not(:disabled) {
  background-color: var(--dh-surface-hover);
}
.button:disabled {
  opacity: .45;
  cursor: default;
  background-color: var(--dh-surface) !important;
  border: 1px solid var(--dh-border-strong) !important;
  color: var(--dh-text) !important;
}
.button.primary {
  background-color: var(--dh-primary);
  border-color: var(--dh-primary);
  color: var(--dh-on-primary);
}
.button.primary:hover:not(:disabled) {
  background-color: var(--dh-primary-strong);
}
/* Есть несохраненные изменения / активный фильтр */
.button.focused:not(.primary) {
  background-color: var(--dh-primary-soft);
  border-color: var(--dh-primary);
  color: var(--dh-primary-strong);
}
.button.primary.focused::after {
  content: "";
  position: absolute;
  top: -4px;
  right: -4px;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--dh-attention);
  border: 2px solid var(--dh-surface);
}
</style>
