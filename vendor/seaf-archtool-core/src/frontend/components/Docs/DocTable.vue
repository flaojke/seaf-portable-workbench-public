<!--
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2025
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2023
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2024
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <box
    v-bind:errors="errors"
    v-bind:path="path"
    v-on:doc-contextmenu="showContextMenu">
    <v-card
      v-bind:variant="inWidget ? 'flat' : 'outlined'"
      class="doc-table-card"
      v-bind:class="{ 'doc-table-card--in-widget': inWidget }">
      <div v-if="isToolbarShown" class="doc-table__toolbar">
        <v-text-field
          v-if="hasSearch"
          v-model="search"
          class="doc-table__search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Поиск по таблице"
          density="compact"
          variant="outlined"
          single-line
          clearable
          hide-details />
        <v-spacer />
        <v-btn
          variant="tonal"
          color="primary"
          size="small"
          prepend-icon="mdi-microsoft-excel"
          v-bind:disabled="isReloading"
          v-on:click="handleExportToExcel">
          Excel
        </v-btn>
      </div>
      <v-data-table
        v-bind:mobile-breakpoint="0"
        v-bind:headers="tableHeaders"
        v-bind:items="items"
        v-bind:search="search"
        v-bind:items-per-page="isPrintVersion ? -1 : itemsPerPage"
        v-bind:items-per-page-options="itemsPerPageOptions"
        v-bind:multi-sort="true"
        v-bind:hide-default-footer="isFooterHidden"
        v-bind:hide-default-header="isEmpty"
        v-bind:loading="isReloading ? 'primary' : false"
        density="compact"
        hover
        class="doc-table">
        <template #item="{ item }">
          <tr>
            <td
              v-for="(field, index) in rowFields(item.raw || item)"
              v-bind:key="index"
              v-bind:class="{ 'doc-table__cell_nowrap': columnLayouts[index]?.nowrap }"
              v-bind:align="field.align">
              <template v-if="field.link">
                <d-c-link v-bind:href="field.link">{{ field.value }}</d-c-link>
              </template>
              <span
                v-else-if="field.status && field.value"
                class="doc-table__status"
                v-bind:class="`doc-table__status_${field.status}`">{{ field.value }}</span>
              <template v-else>{{ field.value }}</template>
            </td>
          </tr>
        </template>
        <template #no-data>
          <div v-if="isReady" class="doc-table__empty">
            Нет данных
          </div>
          <v-skeleton-loader v-else type="table-row@3" />
        </template>
      </v-data-table>
    </v-card>
  </box>
</template>

<script>

  import { toRaw } from 'vue';
  import DCLink from '@front/components/Controls/DCLink.vue';

  import DocMixin from './DocMixin';
  import exportToExcel from '@front/helpers/exportToExcel';
  import * as docTable from '@front/helpers/docTable';
  import { WIDGET_CONTEXT, WIDGET_TAB, createWidgetTable, headerTable, registerWidgetTable } from '@front/helpers/widgetContext';

  export default {
    name: 'DocTable',
    components: {
      DCLink
    },
    mixins: [DocMixin],
    inject: {
      // Виджет сетки markaper, в котором лежит таблица
      widget: { from: WIDGET_CONTEXT, default: null },
      // Вкладка markaper, в которой лежит таблица
      widgetTab: { from: WIDGET_TAB, default: null }
    },
    props: {
      document: { type: String, default: '' }
    },
    data() {
      return {
        search: '',
        isReady: false,
        // Строки прошлой загрузки: таблица показывает их, пока данные перезагружаются
        loadedItems: []
      };
    },
    computed: {
      headers() {
        return this.profile?.headers || [];
      },
      columnLayouts() {
        return this.headers.map((column) => docTable.columnLayout(column, this.items));
      },
      tableHeaders() {
        return this.headers.map((column, index) => {
          const minWidth = this.columnLayouts[index].minWidth;
          return {
            ...column,
            title: column.title || column.text,
            key: column.key ?? column.value,
            ...(minWidth ? { minWidth: `${minWidth}px` } : {})
          };
        });
      },
      items() {
        return docTable.tableItems(this.source.dataset, this.source.status, this.loadedItems);
      },
      // Таблица в виджете: рамку рисует виджет
      inWidget() {
        return !!this.widget?.isWidget;
      },
      // Панель таблицы — число строк, поиск и кнопка Excel — выводится в заголовке виджета
      isToolbarInWidgetHeader() {
        return !!this.widgetTable && toRaw(headerTable(this.widget)) === this.widgetTable;
      },
      // Строки прошлой загрузки остаются на месте, у таблицы — полоса загрузки, выгрузка недоступна
      isReloading() {
        return docTable.isTableReloading(this.isReady, this.source.status);
      },
      isEmpty() {
        return docTable.isTableEmpty(this.isReady, this.items.length);
      },
      hasSearch() {
        return docTable.hasTableSearch(this.items.length);
      },
      isToolbarShown() {
        return docTable.isToolbarShown({
          isPrintVersion: this.isPrintVersion,
          isReady: this.isReady,
          itemsCount: this.items.length,
          inWidgetHeader: this.isToolbarInWidgetHeader
        });
      },
      perPage() {
        return (this.profile || {})['per-page'];
      },
      isTemplate() {
        return true;
      },
      itemsPerPage() {
        return docTable.resolveItemsPerPage(this.perPage);
      },
      itemsPerPageOptions() {
        return docTable.itemsPerPageOptions(this.itemsPerPage);
      },
      isFooterHidden() {
        return docTable.isFooterHidden(this.isPrintVersion, this.items.length, this.itemsPerPage);
      }
    },
    created() {
      this.widgetTable = null;
      this.unregisterWidgetTable = null;
      if (!this.widget) return;

      this.widgetTable = createWidgetTable(this);
      this.unregisterWidgetTable = registerWidgetTable(this.widget, this.widgetTable);
    },
    beforeUnmount() {
      this.unregisterWidgetTable?.();
    },
    methods: {
      refresh() {
        this.loadedItems = this.items;
        this.sourceRefresh().finally(() => this.isReady = true);
      },
      handleExportToExcel() {
        exportToExcel(this.headers, this.source.dataset, this.document || this.id);
      },
      rowFields(row) {
        return docTable.rowFields(this.headers, row);
      }
    }

  };
</script>

<style scoped>
table {
  max-width: 100%;
}
td {
  white-space: pre-wrap
}

td.doc-table__cell_nowrap {
  white-space: pre;
}

.doc-table-card {
  border-color: var(--dh-border);
  border-radius: var(--dh-radius-lg);
}

.doc-table-card--in-widget {
  border: 0;
  border-radius: 0;
  background: transparent;
}

.doc-table-card--in-widget .doc-table__toolbar {
  padding: 4px var(--dh-widget-inset) 10px;
}

.doc-table__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px 12px;
  padding: 10px 12px;
}

.doc-table__search {
  max-width: 280px;
}

.doc-table__empty {
  padding: 4px 0;
  color: var(--dh-text-muted);
}

.doc-table__status {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 1px 10px;
  border-radius: 999px;
  font-size: 0.8125rem;
  font-weight: 500;
  white-space: nowrap;
  background: var(--dh-chip-bg);
  color: var(--dh-chip-text);
}

.doc-table__status::before {
  content: "";
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.doc-table__status_ok { background: var(--dh-status-ok-bg); color: var(--dh-status-ok-text); }
.doc-table__status_wip { background: var(--dh-status-wip-bg); color: var(--dh-status-wip-text); }
.doc-table__status_off { background: var(--dh-status-off-bg); color: var(--dh-status-off-text); }
.doc-table__status_bad { background: var(--dh-status-bad-bg); color: var(--dh-status-bad-text); }
</style>

<style>
.doc-table thead tr th {
  white-space: nowrap;
  background: var(--dh-surface-header-tint) !important;
  color: var(--dh-text-secondary);
  font-weight: 600 !important;
  font-size: 0.8125rem;
  border-top: 1px solid var(--dh-border);
}

/* Полоса загрузки под шапкой лежит поверх строк и не меняет высоту таблицы */
.doc-table thead tr.v-data-table-progress > th {
  border-top: 0;
  background: none !important;
}

.doc-table tbody td {
  padding-top: 8px !important;
  padding-bottom: 8px !important;
  vertical-align: top;
  line-height: 1.45;
  color: var(--dh-text);
  border-bottom-color: var(--dh-border) !important;
}

/* Тень у края с непоказанными столбцами, по всей высоте таблицы вместе с шапкой: светлые полосы
   прокручиваются вместе с таблицей и закрывают тень, когда таблица прокручена до края. Шапка
   полупрозрачная, тень видна и под ней */
.doc-table .v-table__wrapper {
  background:
    linear-gradient(to right, var(--dh-surface) 30%, transparent) left center / 40px 100% no-repeat local,
    linear-gradient(to left, var(--dh-surface) 30%, transparent) right center / 40px 100% no-repeat local,
    linear-gradient(to right, var(--dh-shadow-scroll-edge), transparent) left center / 12px 100% no-repeat scroll,
    linear-gradient(to left, var(--dh-shadow-scroll-edge), transparent) right center / 12px 100% no-repeat scroll;
}

/* Таблица в виджете: строки от края до края, текст крайних столбцов на вертикали заголовка виджета */
.doc-table-card--in-widget .doc-table th:first-child,
.doc-table-card--in-widget .doc-table td:first-child {
  padding-left: var(--dh-widget-inset) !important;
}

.doc-table-card--in-widget .doc-table th:last-child,
.doc-table-card--in-widget .doc-table td:last-child {
  padding-right: var(--dh-widget-inset) !important;
}

.doc-table-card--in-widget .doc-table .v-data-table-rows-no-data {
  text-align: left;
}

.doc-table tbody td a {
  color: var(--dh-primary-strong);
  font-weight: 500;
}

.doc-table .v-data-table-footer {
  font-size: 0.8125rem;
  color: var(--dh-text-secondary);
  border-top: 1px solid var(--dh-border);
}
</style>
