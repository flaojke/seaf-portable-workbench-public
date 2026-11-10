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
  <div class="editable-table-colors wrapper">
    <div class="header">
      <span class="header-caption">Фильтр</span>
      <h4 class="header-title">{{ header.text ?? header.value }}</h4>
    </div>

    <filter-options-selector
      v-if="filtrationModesList.length > 1"
      v-bind:filtration-modes="filtrationModesList"
      v-bind:mode="filtrationMode"
      v-bind:header="header"
      v-on:change="filtrationMode = $event" />

    <template v-if="!isEmptyMode">
      <template v-if="header.type === 'multiple-select' || header.type === 'select' || header.type === 'checkbox'">
        <div v-if="selectedItems.length > 0" class="selected-list">
          <selected-item
            v-for="(selectID) in selectedItems"
            v-bind:id="selectID"
            v-bind:key="selectID"
            v-bind:disabled="header.type === 'checkbox'"
            v-bind:text="optionNameMap[selectID]"
            v-on:remove-item="handleChangeFromOptions" />
        </div>

        <options
          v-bind:show-filter="header.type !== 'checkbox'"
          v-bind:is-open="true"
          v-bind:options="mergedOptions"
          class="options"
          v-bind:value="selectedItems"
          v-bind:multiple="isMultipleSelector"
          v-on:on-close="() => { }"
          v-on:change="handleChangeFromOptions" />
      </template>

      <template v-else>
        <dh-textarea
          v-bind:value="value"
          auto-focus
          class="input"
          v-on:input="value = $event" />
      </template>
    </template>

    <!-- «Применить»: фильтр меняет только набор видимых строк, данные таблицы остаются как есть -->
    <div class="action-block">
      <v-btn class="action action_reset" variant="text" size="small" v-on:click="onReset">Сбросить</v-btn>
      <v-spacer />
      <v-btn class="action" variant="text" size="small" v-on:click="$emit('on-cancel')">Отмена</v-btn>
      <v-btn
        class="action"
        color="primary"
        variant="flat"
        size="small"
        v-bind:disabled="isSaveButtonDisabled"
        v-on:click="onSave">
        Применить
      </v-btn>
    </div>
  </div>
</template>

<script>
  import { FILTRATION_MODES, HEADER_TYPES_FILTRATION_MODES } from '../../lib/const';
  import { checkIsValueEmpty } from '../../lib/helpers';
  
  import Textarea from '../TableCell/Textarea/Textarea.vue';
  import FilterOptionsSelector from './FilterModeSelector.vue';
  import Options from '../TableCell/Select/Options.vue';
  import SelectedItem from '../TableCell/Select/SelectedItem.vue';

  export default {
    components: {
      'dh-textarea': Textarea,
      FilterOptionsSelector,
      Options,
      SelectedItem
    },
    props: {
      header: {
        type: Object,
        required: true
      },
      filter: {
        type: Object,
        required: true,
        default: () => ({})
      }
    },
    emits: ['on-save', 'on-cancel'],
    data() {
      return {
        checkboxOptions: [
          { value: true, text: 'Да' },
          { value: false, text: 'Нет' }
        ],

        filtrationModesList: HEADER_TYPES_FILTRATION_MODES[this.header.type].availableValues,

        value: this.filter?.value,
        filtrationMode: this.filter?.filtrationMode ?? HEADER_TYPES_FILTRATION_MODES[this.header.type].default
      };
    },

    computed: {
      isEmptyMode() {
        return this.filtrationMode === FILTRATION_MODES.empty ||  this.filtrationMode === FILTRATION_MODES.notEmpty;
      },

      isSelector() {
        return this.header.type === 'multiple-select' || this.header.type === 'select' || this.header.type === 'checkbox';
      },

      isMultipleSelector() {
        return this.header.type === 'multiple-select' || this.filtrationMode === FILTRATION_MODES.oneOfMany;
      },

      isSaveButtonDisabled() {
        return !this.isEmptyMode && (this.value === null || this.value === undefined || this.value?.length === 0);
      },

      mergedOptions() {
        if (this.header.type === 'checkbox') {
          return this.checkboxOptions;
        } else if (this.isSelector) {
          return Array.isArray(this.header.options)
            ? this.header.options
            : Object.values(this.header.options).reduce((acc, value) => acc.concat(value), []);
        }
        return null;
      },

      optionNameMap() {
        return Object.assign({}, ...this.mergedOptions.map(({ value, text }) => ({ [value]: text })));
      },

      selectedItems() {
        if (this.isSelector && (this.value || typeof this.value === 'boolean')) {
          return Array.isArray(this.value)
            ? this.value
            : [this.value];
        } else {
          return [];
        }
      }
    },

    watch: {
      filtrationMode() {
        this.value = null;
      }
    },

    methods: {
      onSave() {
        if (
          this.filtrationMode !== FILTRATION_MODES.empty &&
          this.filtrationMode !== FILTRATION_MODES.notEmpty &&
          checkIsValueEmpty(this.value)
        ) {
          return this.onReset();
        }

        const filter = { [this.header.headerID]: { filtrationMode: this.filtrationMode, value: this.value } };
        this.$emit('on-save', filter);
      },

      onReset() {
        const filter = { [this.header.headerID]: undefined };
        this.$emit('on-save', filter);
      },

      handleChangeFromOptions(value) {
        let newValue;
        if (this.isMultipleSelector) {
          if (typeof this.value !== 'boolean' && !this.value) {
            newValue = [value];
          } else {
            newValue = this.value.includes(value)
              ? this.value.filter(selectedValue => selectedValue !== value)
              : [...this.value, value];

            if (newValue.length === 0) {
              newValue = null;
            }
          }
          this.value = newValue;
        } else {
          this.value = value === this.value ? null : value;
        }
      }
    }
  };
</script>



<style scoped>
.wrapper {
  display: flex;
  flex-direction: column;
  gap: 12px;
  width: 360px;
  max-width: calc(100vw - 32px);
  color: var(--dh-text);
  font-size: 13px;
}

.header {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.header-caption {
  color: var(--dh-text-muted);
  font-size: 11px;
  font-weight: 600;
  line-height: 16px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.header-title {
  margin: 0;
  font-size: 15px;
  line-height: 20px;
  overflow-wrap: break-word;
}

.input {
  min-height: 36px;
  padding: 8px 10px;
  border: 1px solid var(--dh-border-strong);
  border-radius: 6px;
}

.input:hover:not(:focus-within) {
  border-color: var(--dh-text-muted);
}

.input:focus-within {
  border-color: var(--dh-primary);
  box-shadow: 0 0 0 1px var(--dh-primary);
}

.selected-list {
  max-width: 100%;
  padding: 16px 4px 4px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-flow: row wrap;
}

.options>>>.options-list {
  max-height: 210px;
}

.action-block {
  display: flex;
  align-items: center;
  gap: 4px;
  padding-top: 4px;
  border-top: 1px solid var(--dh-border);
  margin-top: 4px;
}

.action {
  text-transform: none;
  letter-spacing: normal;
  font-size: 13px;
}

.action_reset {
  color: var(--dh-danger);
}
</style>
