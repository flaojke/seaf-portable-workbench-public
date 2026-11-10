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
      Aksinenko Anatoly <aiaksinenko@sberbank.ru>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
-->

<template>
  <div class="table-wrapper">
    <action-bar
      class="action-bar"
      v-bind:table-options="tableOptions"
      v-bind:selected-rows="selectedRows"
      v-bind:is-filter-active="isFilterActive"
      v-bind:search-query="globalSearchInput"
      v-on:update:searchQuery="onGlobalSearchInput"
      v-on:clearSearch="clearGlobalSearch"
      v-on:saveTable="$emit('saveTable')"
      v-on:exportToExcel="$emit('exportToExcel', getExcelExportData())"
      v-on:addRow="startNewRowCreating"
      v-on:removeRow="removeRow"
      v-on:fillSelected="$emit('fillSelected')"
      v-on:resetFilters="onResetFilters"
      v-on:reload="$emit('reload')">
      <v-pagination
        v-if="filteredAndSortedItems.length > tableOptions.pageSize"
        class="pagination"
        v-bind:model-value="currentPage > numberOfPages ? numberOfPages : currentPage"
        v-bind:length="numberOfPages"
        v-bind:total-visible="4"
        v-on:update:modelValue="onChangePage" />
    </action-bar>

    <scroll-container v-bind:inline="inline">
      <div
        ref="table"
        class="table-body"
        v-bind:class="{ 'table-body_ttb': tableOptions.direction === 'ttb' }"
        v-bind:style="headerStyle">
        <template v-if="true">
          <checkbox
            v-if="tableOptions.selection"
            v-bind:ref="resizeObserve"
            key="header-select"
            class="cell cell_header"
            v-bind:checked="selectedRows.length === filteredAndSortedItems.length"
            v-on:change="onSelectAllRows" />
          <template v-for="header in headers">
            <cell-header
              v-if="header.display"
              v-bind:ref="resizeObserve"
              v-bind:key="`header:${header.headerID}`"
              class="cell cell_header"
              v-bind:header="header"
              v-bind:sort-map="sortMap"
              v-bind:resizable="tableOptions.direction === 'ltr'"
              v-on:click="onSetSort(header)"
              v-on:resize-start="onHeaderResize">
              <filter-dropdown
                v-if="header.filterable"
                v-bind:header="header"
                v-bind:filter="filters[header.headerID]"
                v-on:on-save="handleChangeFilter" />
              <button
                v-if="header.agent"
                class="button"
                v-on:click.stop="() => fillColumnWithAI(header.headerID)">
                <icon
                  class="button-icon"
                  type="creation"
                  v-bind:color="null" />
              </button>
            </cell-header>
          </template>
        </template>

        <template v-for="([rowID, row], rowIndex) in filteredAndSortedItemsSlice">
          <checkbox
            v-if="tableOptions.selection"
            v-bind:ref="resizeObserve"
            v-bind:key="`item-select:${rowID}`"
            v-bind:checked="selectedRows.includes(rowID)"
            class="cell cell_body"
            v-on:change="onSelectRowItem(rowID)" />
          <template v-for="(header, columnIndex) in headers">
            <cell-body
              v-if="header.display"
              v-bind:key="`item:${rowID}:${header.headerID}`"
              v-bind:ref="resizeObserve"
              v-bind:data-index="getElementIndex(rowIndex, columnIndex)"
              v-bind:data-render="header.render"
              v-bind:class="`cell cell_body ${header.type}`"
              v-bind:header="header"
              v-bind:row="row"
              v-bind:row-i-d="rowID"
              v-bind:base-u-r-i="baseURI"
              v-bind:pull-profile-data="pullProfileData"
              v-on:keydown="handleTableKeydown" />
          </template>
        </template>
      </div>
    </scroll-container>

    <v-dialog
      v-model="isDialogOpen"
      max-width="600"
      persistent>
      <new-row-card
        v-bind:table-rows="Object.keys(tableData)"
        v-on:click-save="createNewRow"
        v-on:click-cancel="isDialogOpen = false" />
    </v-dialog>
  </div>
</template>

<script>
  import { GLOBAL_SEARCH_DEBOUNCE, SELECT_ROW_WIDTH } from '../../lib/const';
  import { checkIsValueEmpty, getMultipleRowSorter } from '../../lib/helpers';
  import {
    checkIsGlobalSearchActive,
    createSearchDebouncer,
    getSelectionWithinItems,
    getTableFilteredItems,
    normalizeGlobalSearchQuery
  } from '../../lib/globalSearch';

  import ResizeObserverMixin from './ResizeObserverMixin.vue';
  import TableOptionsCacheMixinVue from './TableOptionsCacheMixin.vue';
  import NavigationMixin from './NavigationMixin.vue';
  import NewRowMixin from './NewRowMixin.vue';

  import ActionBar from '../ActionBar/ActionBar.vue';
  import CellHeader from '../TableCell/CellHeader.vue';
  import CellBody from '../TableCell/CellBody.vue';
  import ScrollContainer from '../ScrollContainer/ScrollContainer.vue';
  import Checkbox from '../TableCell/Checkbox/Checkbox.vue';
  import FilterDropdown from '../Filter/FilterDropdown.vue';
  import Icon from '../Icon/Icon.vue';

  export default {
    components: {
      ActionBar,
      CellHeader,
      CellBody,
      ScrollContainer,
      Checkbox,
      FilterDropdown,
      Icon
    },
    mixins: [
      ResizeObserverMixin,
      TableOptionsCacheMixinVue,
      NavigationMixin,
      NewRowMixin
    ],
    props: {
      inline: {
        type: Boolean,
        required: true
      },
      tableData: {
        type: Object,
        required: true
      },
      headers: {
        type: Array,
        required: true
      },
      tableOptions: {
        type: Object,
        required: true
      },
      baseURI: {
        type: String,
        required: false,
        default: ''
      },
      onSelect: {
        type: Function,
        required: true
      },
      selectedRows: {
        type: Array,
        required: true
      },
      createdRows: {
        type: Array,
        required: true
      },
      pullProfileData: {
        type: Function,
        required: true
      }
    },
    emits: ['saveTable', 'exportToExcel', 'fillSelected', 'reload', 'reset-created-rows-list', 'fill-column-with-ai', 'change-sorting', 'remove-row', 'add-row'],

    data() {
      const cachedGlobalSearch = this.tableOptions.globalSearch && typeof this.getOptionsCache()?.globalSearch === 'string'
        ? this.getOptionsCache().globalSearch
        : '';
      return {
        filters: this.getOptionsCache()?.filters ?? {},
        globalSearch: cachedGlobalSearch,
        globalSearchInput: cachedGlobalSearch,
        sortList:  this.getOptionsCache()?.sortList ?? [],
        currentPage: this.getOptionsCache()?.page ?? 1,
        isDialogOpen: false,
        columnWidths: this.getOptionsCache()?.columnWidths ?? {}
      };
    },
    computed: {
      visibleHeaders() {
        return this.headers.filter(({display}) => display);
      },

      headerStyle() {

        const headerWidthList = this.visibleHeaders.reduce((acc, header) => {
          const width = this.columnWidths[header.headerID] || header.width;
          acc.push(width);
          return acc;
        }, this.tableOptions.selection ? [SELECT_ROW_WIDTH] : []);

        const direction = this.tableOptions.direction;

        const tableHeadersSize =  this.visibleHeaders.length + Number(this.tableOptions.selection);
        const tableRowsSize =  Math.min(Object.keys(this.tableData).length, this.filteredAndSortedItemsSlice.length) + Number(this.tableOptions.filtration);

        const columnsLength = direction === 'ltr' ? tableHeadersSize : tableRowsSize;
        const rowsLength = direction === 'ltr' ? tableRowsSize : tableHeadersSize;

        const gridTemplateColumns = direction === 'ltr'
          ? headerWidthList.join(' ')
          : `repeat(${columnsLength}, auto)`;

        const gridAutoFlow = direction === 'ltr' ? 'row' : 'column';

        return {
          'grid-template-columns': gridTemplateColumns,
          'grid-template-rows': `repeat(${rowsLength}, auto)`,
          'grid-auto-flow': gridAutoFlow
        };
      },
      items() {
        return Object.entries(this.tableData);
      },
      itemsLength() {
        return this.items.length;
      },
      filteredItems() {
        return getTableFilteredItems({
          items: this.items,
          filters: this.filters,
          headers: this.headers,
          createdRows: this.createdRows,
          globalSearch: this.globalSearch,
          isColumnFilterActive: this.isColumnFilterActive,
          isGlobalSearchActive: this.isGlobalSearchActive
        });
      },
      filteredAndSortedItems() {
        return this.sortList.length > 0
          ? [...this.filteredItems].sort(getMultipleRowSorter(this.sortList, this.createdRows))
          : this.filteredItems;
      },
      numberOfPages() {
        return Math.ceil(this.filteredAndSortedItems.length / this.tableOptions.pageSize);
      },
      filteredAndSortedItemsSlice() {
        const startIndex = (this.currentPage - 1) * this.tableOptions.pageSize;
        return this.filteredAndSortedItems.slice(
          startIndex,
          startIndex + this.tableOptions.pageSize
        );
      },
      isGlobalSearchActive() {
        return checkIsGlobalSearchActive(this.tableOptions.globalSearch, this.globalSearch);
      },
      isFilterActive() {
        return this.isColumnFilterActive || this.isGlobalSearchActive;
      },
      isColumnFilterActive() {
        for (let i = 0; i < this.headers.length; i++) {
          const id = this.headers[i].headerID;
          const value = this.filters[id];
          if (!checkIsValueEmpty(value)) {
            return true;
          }
        }
        return false;
      },
      sortMap() {
        const result = {};
        this.sortList.forEach((sorter, index) => {
          result[sorter.value] = { ...sorter, priority: index };
        });
        return result;
      },
      isSortActive() {
        return this.sortList.length > 0;
      }
    },

    watch: {
      filters: {
        deep: true,
        handler() {
          this.currentPage = 1;
          this.updateOptionsCache();
          this.$emit('reset-created-rows-list');
        }
      },
      globalSearch(newValue, oldValue) {
        this.updateOptionsCache();
        if (normalizeGlobalSearchQuery(newValue) === normalizeGlobalSearchQuery(oldValue)) return;
        this.currentPage = 1;
        this.$emit('reset-created-rows-list');
      },
      // Выделение сокращается до видимых строк при любом изменении итогового списка:
      // поиск, фильтр колонки, правка значения, сброс createdRows
      filteredItems(items) {
        const keptRows = getSelectionWithinItems(this.selectedRows, items);
        if (keptRows) this.onSelect(keptRows);
      },
      sortList: {
        deep: true,
        handler() {
          this.updateOptionsCache();
        }
      },
      itemsLength() {
        this.currentPage = this.numberOfPages;

        setTimeout(() => {
          const lastIndex =
            this.$refs?.table?.children?.length - this.headers.length - +Boolean(this.tableOptions.selection);
          if(lastIndex) this.$refs.table.children[lastIndex].scrollIntoView();
        }, 100);
      }
    },

    created() {
      // Нереактивное поле экземпляра: отложенное применение запроса
      this.searchDebouncer = createSearchDebouncer((query) => {
        this.globalSearch = query;
      }, GLOBAL_SEARCH_DEBOUNCE);
    },

    beforeUnmount() {
      this.searchDebouncer.cancel();
    },

    methods: {
      getExcelExportData() {
        return this.tableOptions.isExcelExportFiltered
          ? this.filteredAndSortedItems
          : this.items;
      },

      fillColumnWithAI(headerID) {
        this.$emit('fill-column-with-ai', headerID);
      },

      handleChangeFilter(newFilter) {
        this.filters = Object.assign({}, this.filters, newFilter);
      },

      onChangePage(newPage) {
        this.currentPage = newPage;
        this.updateOptionsCache();
      },

      onResetFilters() {
        this.filters = {};
        this.clearGlobalSearch();
      },

      // Очистка поля (Esc, крестик, «Сбросить») применяется сразу, без паузы ввода
      clearGlobalSearch() {
        this.searchDebouncer.cancel();
        this.globalSearchInput = '';
        this.globalSearch = '';
      },

      onGlobalSearchInput(value) {
        this.globalSearchInput = value;
        this.searchDebouncer.input(value);
      },

      onSelectRowItem(rowID) {
        const newValue = this.selectedRows.includes(rowID)
          ? this.selectedRows.filter((selected) => selected !== rowID)
          : [...this.selectedRows, rowID];
        this.onSelect(newValue);
      },

      onSelectAllRows() {
        const newValue =
          this.selectedRows.length === this.filteredAndSortedItems.length
            ? []
            : this.filteredAndSortedItems.map(([rowID]) => rowID);
        this.onSelect(newValue);
      },

      onSetSort(header) {
        this.$emit('change-sorting');
        const { headerID, type } = header;

        let options = null;
        if (header?.options) {
          options = (Array.isArray(header.options)
            ? header.options
            : header.options[header.optionID] || []
          ).reduce((acc, option) =>
            Object.assign(acc, {[option.value] :  option.text || option.value}), {});
        }

        if (!this.sortMap[headerID]) {
          this.sortList = [
            ...this.sortList,
            {
              value: headerID,
              direction: 'inc',
              type,
              options
            }
          ];
          return;
        }

        if (this.sortMap[headerID].direction === 'inc') {
          const index = this.sortMap[headerID].priority;
          this.sortList[index].direction = 'dec';
          return;
        }

        this.sortList = this.sortList.filter(({ value }) => value !== headerID);
      },

      onHeaderResize({ event, headerID }) {
        const MIN_WIDTH = 40;
        const startX = event.clientX;
        const columnEl = event.target.closest('.cell_header');

        if (!columnEl) return;

        const startWidth = columnEl.offsetWidth;

        const onMouseMove = (moveEvent) => {
          const delta = moveEvent.clientX - startX;
          const newWidth = Math.max(MIN_WIDTH, startWidth + delta);
          this.columnWidths[headerID] = `${newWidth}px`;
          this.updateOptionsCache();
        };

        const onMouseUp = () => {
          window.removeEventListener('mousemove', onMouseMove);
          window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
      }
    }
  };
</script>

<style scoped>
.table-wrapper {
  display: flex;
  flex-direction: column;
}

.action-bar {
  position: sticky;
  top: 0;
  left: 0;
  z-index: 8;
  background-color: var(--dh-surface-overlay);
  padding: 8px 4px;
  align-self: stretch;
}

.table-body {
  position: relative;
  display: grid;
  width: fit-content;

  background-color: var(--color-border);
  gap: 1px;
  padding: 1px;
}

.table-body_ttb :deep(.inline-markdown.editable-table-markdown .inline-markdown-table-container) {
  min-width: 280px;
}

.cell {
  position: relative;
  min-height: 30px;
  outline: 2px solid transparent;
}

.cell > :first-child {
  padding: 6px 8px;
  height: 100%;
}

.cell.cell_body {
  background-color: var(--color-bg-cell);
}

/* Горизонтальный отступ дает .wrapper заголовка через .cell > :first-child, как у ячеек тела */
.cell.cell_header {
  background-color: var(--color-bg-header);
  padding: 8px 0;
}

.cell.cell_pinned,
.cell.cell_freeze_left {
  position: sticky;
  z-index: 6;
  outline-color: var(--color-border);
}

.cell.cell_pinned {
  left: 0;
}

.cell.cell_freeze_top {
  position: sticky;
  z-index: 7;
  outline-color: var(--color-border);
}

.cell.cell_freeze_corner {
  z-index: 9;
}

.cell.cell_editable:hover:not(:focus-within):not(.cell_header) {
  outline-color: var(--color-focus);
  outline-style: dashed;
}

.cell.cell_editable:focus-within {
  outline-color: var(--color-focus);
}

.cell:not(.cell_editable):focus-within {
  outline-color: var(--color-gray);
}

.pagination {
  padding-left: 32px;
  color:  var(--color-focus);
  position: relative;
}

.pagination::before {
  content: "";
  height: 100%;
  border-left: 1px solid var(--dh-border-strong);
  position: absolute;
  left: 16px;
  top: 0;
}

/* Кнопка ИИ-агента в шапке колонки: в одном стиле с кнопкой фильтра (FilterDropdown) */
.button {
  display: grid;
  background-color: transparent;
  border-radius: 4px;
  padding: 1px;
}

.button:hover {
  background-color: var(--dh-border);
}

.button-icon {
  font-size: 16px;
  color: var(--dh-text-muted);
}

.pagination >>> .v-pagination {
  height: 28px;
  margin-bottom: 0;
}

.pagination >>> button {
  width: auto;
  height: 24px;
  font-size: 14px;
  font-weight: 600;
  margin-top: 0;
  margin-bottom: 0;
}
</style>
