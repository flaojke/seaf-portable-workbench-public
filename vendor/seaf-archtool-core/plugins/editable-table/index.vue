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
  <div class="editable-table-colors editable-table-plugin">
    <loader v-if="loading" v-bind:table-name="tableName" />

    <error-block v-else-if="error" v-bind:error="error" />

    <dh-table
      v-else
      v-bind:table-data="tableData"
      v-bind:created-rows="createdRows"
      v-bind:headers="Object.values(tableHeaders)"
      v-bind:table-options="tableOptions"
      v-bind:base-u-r-i="markdownBaseURI"
      v-bind:selected-rows="selectedRows"
      v-bind:on-select="onSelect"
      v-bind:pull-profile-data="pullProfileData"
      v-bind:inline="inline"
      v-on:saveTable="saveTableToFiles"
      v-on:exportToExcel="handleExportToExcel"
      v-on:add-row="handleAddRow"
      v-on:remove-row="handleRemoveRow"
      v-on:fillSelected="activeDialog = 'mass-fill'"
      v-on:reload="reload"
      v-on:reset-created-rows-list="resetCreatedRowsList"
      v-on:change-sorting="resetCreatedRowsList"
      v-on:fill-column-with-ai="handleFillColumnWithAI" />

    <v-dialog
      v-bind:model-value="Boolean(activeDialog)"
      max-width="600"
      persistent>
      <mass-data-fill-card
        v-if="activeDialog === 'mass-fill'"
        v-bind:headers="Object.values(tableHeaders)"
        v-on:click-save="massDataFill"
        v-on:click-cancel="closeDialog" />
      <page-leave-boundary-card
        v-else-if="activeDialog === 'leave'"
        v-bind:table-name="tableName"
        v-bind:edited-components-to-leave="editedComponentsToLeave"
        v-on:leave="handleClickNext"
        v-on:cancel="handleClickBack" />
      <v-card v-else-if="activeDialog === 'loading'" class="dh-dialog" aria-busy="true">
        <dialog-header title="Заполняем столбец с помощью ИИ" />
        <div class="dh-dialog__body">
          <p class="dh-dialog__text">Окно закроется, когда агент вернёт значения.</p>
          <v-progress-linear indeterminate color="primary" rounded />
        </div>
      </v-card>
      <v-card v-else-if="activeDialog === 'error'" class="dh-dialog">
        <dialog-header v-bind:title="dialogTitle || 'Произошла ошибка'" closable v-on:close="closeDialog" />
        <div class="dh-dialog__body">
          <v-alert class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
            <div class="dh-alert__text">{{ dialogMessage }}</div>
          </v-alert>
        </div>
        <footer class="dh-dialog__footer">
          <v-btn class="dh-dialog__btn" color="primary" variant="flat" v-on:click="closeDialog">Закрыть</v-btn>
        </footer>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import TableDataMixin from './mixins/TableDataMixin.vue';
  import SaveTableMixin from './mixins/SaveTableMixin.vue';
  import CacheMixin from './mixins/CacheMixin.vue';
  import LeavingConfirmationMixin from './mixins/LeavingConfirmationMixin.vue';
  import GigaChatMixin from './mixins/GigaChatMixin.vue';

  import exportToExcel from '@front/helpers/exportToExcel';
  import { formatExcelLinkValue } from './lib/excelLink';
  import { chatService } from '@front/helpers/gigachat/ChatServiceConfigurer';
  import { wizardNavMixin } from '@front/components/Docs/wizardNavMixin';

  import ErrorBlock from './components/ErrorBlock/ErrorBlock.vue';
  import Table from './components/Table/Table.vue';
  import MassDataFillCard from './components/DialogCard/MassDataFillCard.vue';
  import Loader from './components/Loader/Loader.vue';
  import PageLeaveBoundaryCard from './components/PageLeaveBoundaryCard/PageLeaveBoundaryCard.vue';

  import env from '@front/helpers/env';
  import DialogHeader from '@front/components/Controls/DialogHeader.vue';

  export default {
    components: {
      DialogHeader,
      ErrorBlock,
      'dh-table': Table,
      MassDataFillCard,
      Loader,
      PageLeaveBoundaryCard
    },
    mixins: [
      TableDataMixin,
      SaveTableMixin,
      CacheMixin,
      LeavingConfirmationMixin,
      GigaChatMixin,
      wizardNavMixin
    ],
    props: {
      inline: {
        type: Boolean,
        default: false
      }
    },

    computed: {
      markdownBaseURI() {
        return this.getProfileBaseURI();
      }
    },

    watch: {
      'tableOptions.hasChange'(hasChange) {
        this.setWizardNextBlocked(Boolean(hasChange), 'Несохранённые изменения');
      }
    },

    beforeUnmount() {
      this.unregisterRouteLeave();
    },

    mounted() {
      this.loading = true;
      setTimeout(() => {
        this.init()
          .then(() => this.tableHeaders = this.tableHeaders.headers)
          .catch((err) => this.error = err)
          .finally(async() => {
            this.registerRouteLeave();
            this.chatService = await chatService();
            this.loading = false;
          });
      }, 100);
    },

    methods: {
      reload() {
        this.clearCache();

        this.loading = true;
        this.tableData = null;
        this.tableHeaders = [];
        this.selectedRows = [];
        this.activeDialog = null;
        this.tableLength = null;
        this.createdRows = [];
        this.error = null;
        this.tableOptions.hasChange = null;
        setTimeout(() => {
          this.init()
            .then(() => this.tableHeaders = this.tableHeaders.headers)
            .catch((err) => this.error = err)
            .finally(() => {
              this.loading = false;
            });
        }, 100);
      },

      createExcelHyperlinkData({ hyperlink, text }) {
        const base =
          typeof hyperlink === 'string' && hyperlink.startsWith('/') && !env.isPlugin()
            ? window.location.href
            : undefined;

        const url = new URL(hyperlink, base).toString();

        return {
          hyperlink: url,
          text: text ?? url
        };
      },

      formatToExcelUrlValue(tableLink) {
        // опасные адреса (javascript:, data:, vbscript:) — текстом, остальные — гиперссылкой
        return formatExcelLinkValue(tableLink, (link) => this.createExcelHyperlinkData(link), window.location.href);
      },

      handleExportToExcel(exportData) {
        const headers = Object.values(this.tableHeaders).map(
          ({ headerID, text, options, type }) => {
            let excelHeaderType;
            
            if(type === 'select') {
              excelHeaderType = 'dropdown';
            } else if(type === 'link' || type === 'upload') {
              excelHeaderType = 'link';
            } else {
              excelHeaderType = 'text';
            }

            const result = { text, value: headerID, type: excelHeaderType };
            if (options) {
              const tableOptions = [].concat(
                Array.isArray(options)
                  ? options
                  : [].concat(...Object.values(options))
              );
              Object.assign(result, {
                options: tableOptions.map(({ value }) => value)
              });
            }
            return result;
          }
        );

        const data = exportData.reduce((data, row) => {
          const [, tableRow] = row;
          const newRow = {};

          for (let i = 0; i < headers.length; i++) {
            const { value: headerID } = headers[i];
            const { type } = this.tableHeaders[headerID];

            let cellData = tableRow[headerID];

            if (type === 'checkbox') {
              cellData = cellData ? 'ИСТИНА' : 'ЛОЖЬ';

            } else if (cellData && (type === 'link' || type === 'upload')) {
              cellData = this.formatToExcelUrlValue(cellData);

            }

            newRow[headerID] = cellData ?? null;
          }
          data.push(newRow);
          return data;
        }, []);

        const tableDirectories = this.$attrs.path.split('/');
        const tableName = tableDirectories.at(-1);

        exportToExcel(headers, data, tableName);
      },

      handleRemoveRow(rowIdListToRemove) {
        const filteredTableDataEntries = Object.entries(this.tableData)
          .filter(([id]) => !rowIdListToRemove.includes(id));

        this.tableData = Object.fromEntries(filteredTableDataEntries);
        this.tableLength = Object.keys(this.tableData).length;
      },

      handleAddRow(newRow) {
        const newRowId = Object.keys(newRow)[0];
        this.createdRows.push(newRowId);

        this.tableData = { ...this.tableData, ...newRow};
        this.tableLength = Object.keys(this.tableData).length;
      },

      massDataFill(updatedColumns, data) {
        this.selectedRows.forEach(rowID => {
          updatedColumns.forEach((headerID) => {
            if (data[headerID] && typeof data[headerID] === 'object') {
              if (Array.isArray(data[headerID])) {
                this.tableData[rowID][headerID] = [...data[headerID]];
              } else {
                this.tableData[rowID][headerID] = { ...data[headerID] };
              }
            } else {
              this.tableData[rowID][headerID] = data[headerID];
            }
          });
        });

        this.activeDialog = null;
      },

      onSelect(value) {
        this.selectedRows = value;
      },

      closeDialog() {
        this.activeDialog = null;
        this.dialogTitle = null;
        this.dialogMessage = null;
      }
    }
  };
</script>

<style scoped>
.editable-table-plugin {
  font-size: 14px;
}
</style>
