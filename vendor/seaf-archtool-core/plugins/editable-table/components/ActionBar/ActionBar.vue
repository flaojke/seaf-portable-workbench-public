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
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
-->

<template>
  <div v-if="isBarVisible" class="action-block">
    <!-- Действия над таблицей целиком -->
    <div v-if="tableOptions.editable || tableOptions.hasExcelExport" class="action-row">
      <action-button
        v-if="tableOptions.editable"
        tooltip="Сохранить"
        label="Сохранить"
        primary
        icon-type="save"
        v-bind:focused="tableOptions.hasChange"
        v-on:click="handleClick(actions.saveTable)" />

      <action-button
        v-if="tableOptions.editable"
        tooltip="Отменить изменения"
        icon-type="reload"
        v-bind:disabled="!tableOptions.hasChange"
        v-on:click="handleClick(actions.reload)" />

      <action-button
        v-if="tableOptions.hasExcelExport"
        tooltip="Экспорт в Excel"
        label="Excel"
        icon-type="excel"
        v-on:click="handleClick(actions.exportToExcel)" />
    </div>

    <!-- Действия со строками, фильтры и пагинация -->
    <div class="action-row">
      <action-button
        v-if="tableOptions.editable && tableOptions.isNewRowAllowed"
        tooltip="Добавить строку"
        label="Добавить"
        icon-type="add-item"
        v-on:click="handleClick(actions.addRow)" />

      <action-button
        v-if="tableOptions.editable && tableOptions.isRowRemoveAllowed"
        tooltip="Удалить строку"
        label="Удалить"
        icon-type="remove-item"
        v-on:click="handleClick(actions.removeRow)" />

      <action-button
        v-if="tableOptions.editable && tableOptions.selection"
        v-bind:disabled="selectedRows.length === 0"
        tooltip="Заполнить выделенное"
        label="Заполнить"
        icon-type="edit-item"
        v-on:click="handleClick(actions.fillSelected)" />

      <action-button
        v-if="tableOptions.filtration || tableOptions.globalSearch"
        v-bind:tooltip="tableOptions.globalSearch ? 'Сбросить фильтры и поиск' : 'Сбросить фильтры'"
        label="Сбросить"
        icon-type="filter-clean"
        v-bind:focused="isFilterActive"
        v-on:click="handleClick(actions.resetFilters)" />

      <label
        v-if="tableOptions.globalSearch"
        class="search-box"
        v-bind:class="{ 'search-box_active': searchQuery.trim() !== '' }">
        <icon class="search-icon" type="search" size="18" v-bind:color="null" />
        <input
          ref="searchInput"
          class="search-input"
          type="text"
          placeholder="Поиск"
          aria-label="Поиск по таблице"
          v-bind:value="searchQuery"
          v-on:input="onSearchInput($event.target.value)"
          v-on:keydown.esc="clearSearch">
        <button
          v-if="searchQuery"
          type="button"
          class="search-clear"
          aria-label="Очистить поиск"
          v-on:click="clearSearch">
          <icon type="cancel" size="16" v-bind:color="null" />
        </button>
      </label>

      <div>
        <slot />
      </div>
    </div>
  </div>
</template>

<script>
  import ActionButton from './ActionButton.vue';
  import Icon from '../Icon/Icon.vue';

  export default {
    components: { ActionButton, Icon },
    props: {
      tableOptions: {
        type: Object,
        required: true
      },
      isFilterActive: {
        type: Boolean,
        required: true
      },
      selectedRows: {
        type: Array,
        required: true
      },
      searchQuery: {
        type: String,
        required: false,
        default: ''
      }
    },
    emits: ['saveTable', 'exportToExcel', 'addRow', 'removeRow', 'fillSelected', 'resetFilters', 'reload', 'update:searchQuery', 'clearSearch'],
    data() {
      return {
        actions: {
          saveTable: 'saveTable',
          exportToExcel: 'exportToExcel',
          addRow: 'addRow',
          removeRow: 'removeRow',
          fillSelected: 'fillSelected',
          resetFilters: 'resetFilters',
          reload: 'reload'
        },
        isBarVisible: this.tableOptions.editable
          || this.tableOptions.hasExcelExport
          || this.tableOptions.filtration
          || this.tableOptions.globalSearch
      };
    },
    methods: {
      handleClick(action) {
        this.$emit(action);
      },
      onSearchInput(value) {
        this.$emit('update:searchQuery', value);
      },
      // Очистка применяется сразу (без паузы ввода); фокус остаётся в поле, чтобы продолжить ввод
      clearSearch() {
        this.$emit('clearSearch');
        this.$refs.searchInput?.focus();
      }
    }
  };
</script>

<style scoped>
.action-block {
  max-width: calc(100vw - 28px);
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0;
}

.action-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

/* Поле глобального поиска — в одном стиле с кнопками панели (ActionButton) */
.search-box {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: 220px;
  height: 32px;
  padding: 0 8px 0 10px;
  border: 1px solid var(--dh-border-strong);
  border-radius: var(--dh-radius);
  background-color: var(--dh-surface);
  color: var(--dh-text);
  cursor: text;
}

.search-box:hover {
  background-color: var(--dh-surface-hover);
}

/* Фокус и непустой запрос — как активный фильтр у кнопки «Сбросить» */
.search-box:focus-within,
.search-box_active {
  border-color: var(--dh-primary);
  box-shadow: inset 0 0 0 1px var(--dh-primary);
  background-color: var(--dh-surface);
}

.search-icon {
  color: var(--dh-text-secondary);
}

.search-box:focus-within .search-icon,
.search-box_active .search-icon {
  color: var(--dh-primary);
}

.search-input {
  flex: 1;
  min-width: 0;
  height: 100%;
  border: none;
  outline: none;
  background: transparent;
  color: var(--dh-text);
  font-size: 0.8125rem;
}

.search-input::placeholder {
  color: var(--dh-text-muted);
  opacity: 1;
}

.search-clear {
  display: flex;
  padding: 0;
  border: none;
  background: transparent;
  cursor: pointer;
  color: var(--dh-text-muted);
}

.search-clear:hover {
  color: var(--dh-text);
}
</style>
