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
  <div class="options-list scroll-bar">
    <label
      v-for="option in options"
      v-bind:key="option.value"
      class="options-item"
      v-bind:class="classOptionItemSelected(option.value)"
      tabindex="1"
      v-on:keydown="handleKeydown"
      v-on:change.stop>
      <checkbox
        v-if="multiple"
        v-bind:checked="value?.includes(option.value)"
        v-bind:disabled="false"
        v-on:change="handleChange(option.value)" />
      <input 
        v-else 
        type="radio"
        class="radio" 
        name="option-item" 
        v-bind:checked="value?.includes(option.value)" 
        v-on:change="handleChange(option.value)">
      <span class="option-text">
        {{ option.text }}
      </span>
      <v-icon
        v-if="!multiple && value?.includes(option.value)"
        class="option-check"
        icon="mdi-check"
        size="16"
        v-bind:color="null" />
    </label>
  </div>
</template>

<script>
  import Checkbox from '../Checkbox/Checkbox.vue';

  export default {
    components: { Checkbox },

    props: {
      options: {
        type: Array,
        required: true
      },
      value: {
        type: Array,
        required: true
      },
      multiple: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    emits: ['change'],
    methods: {
      handleKeydown(e) {
        e.preventDefault();
        if(e.key === ' ') {
          e.target.click();
        }
      },
      handleChange(id) {
        this.$emit('change', id);
      },
      classOptionItemSelected(optionValue) {
        return {
          'options-item_selected': this.value?.includes(optionValue)
        };
      }
    }
  };
</script>

<style scoped>
.options-list {
  overflow: auto;
  padding: 0 4px;
}

.options-item {
  display: flex;
  gap: 10px;
  align-items: center;
  width: 100%;
  min-height: 32px;
  padding: 6px 8px;
  border-radius: 6px;
  color: var(--dh-text);
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
}

.option-text {
  flex: 1 1 auto;
  min-width: 0;
  overflow-wrap: break-word;
}

.options-item:hover,
.options-item:focus,
.options-item:focus-within {
  background-color: var(--dh-surface-hover);
  outline: none;
}

.options-item:focus-visible {
  outline: 2px solid var(--dh-primary);
  outline-offset: -2px;
}

.options-item_selected,
.options-item_selected:hover {
  background-color: var(--dh-primary-soft);
  color: var(--dh-primary-strong);
  font-weight: 600;
}

.option-check {
  flex: none;
  color: var(--dh-primary);
}

.radio {
  display: none;
}
</style>
