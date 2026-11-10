<!--
  Copyright (C) 2026 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  restrictions under the License.

  Maintainers:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
      Marat Niyazmatov, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="search-filter">
    <v-menu
      v-if="field.type === 'rel'"
      v-model="relMenuOpen"
      v-bind:close-on-content-click="false"
      location="bottom start"
      v-bind:offset="4"
      v-bind:max-height="300"
      content-class="dh-pick">
      <template #activator="{ props }">
        <v-text-field
          v-bind="{ ...props, ...fieldProps }"
          v-bind:model-value="value"
          placeholder="Начните вводить название"
          v-on:update:modelValue="onRelInput">
          <!-- Индикатор внутри поля, чтобы поле связи было той же ширины, что и остальные -->
          <template #append-inner>
            <v-progress-circular
              v-if="relSuggestionsLoading"
              class="search-filter__loader"
              v-bind:indeterminate="true"
              v-bind:size="16"
              v-bind:width="2" />
          </template>
        </v-text-field>
      </template>
      <v-list density="compact" class="dh-pick__list">
        <v-list-item
          v-for="(item, idx) in relSuggestions"
          v-bind:key="idx"
          class="dh-pick__item"
          v-bind:class="{ 'dh-pick__item--selected': item.value === value }"
          v-on:click="onRelSelect(item.value)">
          <v-list-item-title class="dh-pick__title">
            <component
              v-bind:is="part.match ? 'mark' : 'span'"
              v-for="(part, pIdx) in titleParts(item.text)"
              v-bind:key="pIdx"
              v-bind:class="{ 'dh-pick__match': part.match }">
              {{ part.text }}
            </component>
          </v-list-item-title>
        </v-list-item>
        <div v-if="!relSuggestions.length" class="dh-pick__empty">
          {{ relSuggestionsLoading ? 'Ищем…' : 'Ничего не найдено' }}
        </div>
      </v-list>
    </v-menu>
    <v-select
      v-else-if="isEnum"
      v-bind="fieldProps"
      v-bind:model-value="value"
      v-bind:items="field.enumValues"
      v-bind:menu-props="{ contentClass: 'dh-pick', offset: 4, maxHeight: 320 }"
      v-bind:list-props="{ class: 'dh-pick__list' }"
      placeholder="Любое значение"
      v-on:update:modelValue="onInput">
      <template #item="{ props }">
        <v-list-item v-bind="props" role="option" class="dh-pick__item">
          <template #append="{ isSelected }">
            <v-icon
              v-if="isSelected"
              class="dh-pick__check"
              icon="mdi-check"
              size="18"
              v-bind:color="null" />
          </template>
        </v-list-item>
      </template>
    </v-select>
    <v-text-field
      v-else
      v-bind="fieldProps"
      v-bind:model-value="value"
      v-bind:type="isNumber ? 'number' : 'text'"
      v-bind:placeholder="isNumber ? 'Равно…' : 'Содержит…'"
      v-on:update:modelValue="onInput" />
  </div>
</template>

<script>
  import { highlightMatches } from '@front/helpers/highlightMatches';

  export default {
    name: 'FilterInput',
    props: {
      field: {
        type: Object,
        required: true
      },
      value: {
        type: [String, Number, Boolean],
        default: null
      },
      loadSuggestions: {
        type: Function,
        default: () => []
      }
    },
    emits: ['input'],
    data() {
      return {
        relSuggestions: [],
        relSuggestionsLoading: false,
        relSuggestDebounceTimer: null,
        relMenuOpen: false
      };
    },
    computed: {
      isNumber() {
        return this.field.type === 'number' || this.field.type === 'integer';
      },
      isEnum() {
        return !this.isNumber && !!this.field.enumValues?.length;
      },
      // Подпись поля выводится над ним; подсказка в поле говорит, какое значение в нем ожидается
      fieldProps() {
        return {
          density: 'compact',
          variant: 'outlined',
          'hide-details': true,
          clearable: true,
          spellcheck: 'false',
          autocomplete: 'off'
        };
      },
      relQuery() {
        return this.value != null ? String(this.value).trim().toLocaleLowerCase() : '';
      }
    },
    methods: {
      onRelInput(value) {
        const val = this.normalizeInputValue(value);

        this.$emit('input', val);
        if (this.relSuggestDebounceTimer) {
          clearTimeout(this.relSuggestDebounceTimer);
        }

        const query = val != null ? String(val).trim() : '';
        if (query.length === 0) {
          this.relSuggestions = [];
          this.relMenuOpen = false;
          return;
        }

        this.relMenuOpen = true;
        this.relSuggestDebounceTimer = setTimeout(() => {
          this.loadRelSuggestions(query);
          this.relSuggestDebounceTimer = null;
        }, 400);
      },
      // Подсвечивает в подсказке введенный текст — так же, как поиск по меню
      titleParts(text) {
        return highlightMatches(text, this.relQuery ? [this.relQuery] : []);
      },
      onRelSelect(selectedValue) {
        this.$emit('input', selectedValue);
        this.relMenuOpen = false;
      },
      normalizeInputValue(value) {
        if (value instanceof Event) {
          return value.target?.value ?? '';
        }

        if (value && typeof value === 'object' && 'target' in value) {
          return value.target?.value ?? '';
        }

        return value;
      },
      onInput(value) {
        this.$emit('input', this.normalizeInputValue(value));
      },
      async loadRelSuggestions(query) {
        const relTarget = this.field.relTarget;
        if (!relTarget || !query) {
          this.relSuggestions = [];
          return;
        }
        this.relSuggestions = [];
        this.relSuggestionsLoading = true;
        try {
          const data = await this.loadSuggestions(relTarget, query);
          this.relSuggestions = Array.isArray(data) ? data : [];
        } catch (e) {
          this.relSuggestions = [];
        } finally {
          this.relSuggestionsLoading = false;
        }
      }
    }
  };
</script>

<style scoped>
  .search-filter :deep(.v-field) {
    font-size: 13px;
    background: var(--dh-surface);
  }

  .search-filter :deep(.v-field__outline) {
    --v-field-border-opacity: 1;
    color: var(--dh-border-strong);
  }

  .search-filter :deep(.v-field--focused .v-field__outline) {
    color: var(--dh-primary);
  }

  .search-filter :deep(.v-select__menu-icon),
  .search-filter :deep(.v-field__clearable .v-icon) {
    color: var(--dh-text-muted);
    opacity: 1;
  }

  .search-filter__loader {
    color: var(--dh-primary);
  }
</style>

