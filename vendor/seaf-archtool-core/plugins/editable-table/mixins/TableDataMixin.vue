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

<script>
  import { CellDataError, DEFAULT_HEADER_ITEM_OPTIONS } from '../lib/const';
  import { resolveHeaderWidth } from '../lib/headerWidth';
  import { filterValuesByOptions, formatHeaderSelectorOptionList, formatLinkData, mergeHeaders } from '../lib/helpers';
  import { collectLinkSource } from '../lib/linkSource';
  import {
    checkEditableHeaderIncludePathProp,
    checkHasSourceInFnHeader,
    checkHeadersFormat,
    checkHeaderRender,
    checkHeaderType,
    checkIsHeadersIncludeValueProp,
    checkIsValidOptionIDPropsInSelectHeaders,
    checkMultipleSelectValueFormat,
    checkSelectValueFormat,
    checkSourceDataFormat,
    checkTextValueFormat,
    TableError
  } from '../lib/tableDataValidate';

  const normalizeFreezeValue = (value) => {
    const number = Number(value);

    return Number.isInteger(number) && number > 0 ? number : 0;
  };

  export default {
    props: {
      profile: {
        type: Object,
        required: true
      },
      getContent: {
        type: Function,
        required: true
      },
      putContent: {
        type: Function,
        default: null,
        required: false
      },
      pullData: {
        type: Function,
        required: true
      }
    },

    data() {
      return {
        loading: true,

        tableData: null,
        tableHeaders: [],
        // Исходные значения ячеек link с опасными ссылками: в таблице они текст, в файл и format уходят как были
        linkSourceData: {},

        selectedRows: [],
        createdRows: [],

        activeDialog: null,
        dialogTitle: null,
        dialogMessage: null,

        tableOptions: {
          selection: this.profile.selection === true,
          filtration: this.profile.filtration ?? true,
          globalSearch: this.profile.global_search === true,
          direction: this.profile.direction ?? 'ltr',
          freeze: {
            rows: normalizeFreezeValue(this.profile.freeze?.rows),
            columns: normalizeFreezeValue(this.profile.freeze?.columns)
          },
          editable: null,
          pinned: null,
          pageSize: this.profile.page_size ?? 20,
          hasExcelExport: this.profile?.excel_export === undefined ? true : Boolean(this.profile.excel_export),
          isExcelExportFiltered: this.profile?.excel_export_filter === true,
          hasChange: null,
          isNewRowAllowed: this.profile?.new_row_allowed !== false,
          isRowRemoveAllowed: (this.profile.selection === true) && (this.profile?.row_remove_allowed !== false),
          nullStr: this.profile?.yaml?.null_replace_string === undefined 
            ? '' 
            : typeof this.profile.yaml.null_replace_string === 'string'
              ? this.profile.yaml.null_replace_string
              : 'null',
          newRow: this.profile?.['new_row'],
          title: this.profile?.['title']
        },
        
        showDataError: this.profile.show_data_error === true,
        tableLength: null,
        error: null,
        
        updateIndexFile: this.profile.update_index_file ?? null
      };
    },

    computed: {
      tableName() {
        if(this.tableOptions.title) return this.tableOptions.title;

        try {
          const path = this.profile.$base.split('/');
          return path.at(-1);
        } catch {
          return 'editable table';
        }
      }
    },

    methods: {
      resetCreatedRowsList() {
        if(this.createdRows.length > 0) {
          this.createdRows = [];
          this.tableData = { ...this.tableData };
        }
      },

      pullProfileData(expression, extraData) {
        if (!expression) return;

        const requestProfile = { source: expression };
        let profileOrigin = this.profile.origin;

        if (profileOrigin && extraData) {
          if (typeof profileOrigin === 'string') {
            profileOrigin = { [profileOrigin]: profileOrigin };
          }
          requestProfile.origin = Object.assign({}, profileOrigin, extraData);
        } else if (profileOrigin && !extraData) {
          requestProfile.origin = profileOrigin;
        } else if (!profileOrigin && extraData) {
          requestProfile.origin = extraData;
        }

        return this.pullData(requestProfile, null, this.$attrs.params);
      },

      async init() {
        const sourceData = await this.pullData()
          .catch(({ message }) => {
            const description = `
              Произошла ошибка при расчете "source" или "origin":
              (для отладки воспользуйтесь логом "JSONata error")
            `;
            throw new TableError(description, message);
          });

        checkSourceDataFormat(sourceData);

        const { body: rawTableData, headers: sourceHeaders, title: sourceTitle } = sourceData;

        const mergedHeaders = mergeHeaders(this.profile.headers, sourceHeaders);

        if(sourceTitle) this.tableOptions.title = sourceTitle;

        this.tableHeaders = await this.formatTableHeaders(mergedHeaders);

        // до ветвления кэш / источник: таблица из кэша сохраняется так же, как из источника
        this.linkSourceData = collectLinkSource(rawTableData, this.tableHeaders.headers);

        const cache = this.getFromCache();
        if(cache) {
          this.tableData = cache.data;
          this.createdRows = cache.createdRows;
          this.updateCacheWithEditedTables();
        } else {
          this.tableData = this.formatTableData(rawTableData, this.tableHeaders);
        }
      },

      async formatTableHeaders(rawHeaders) {
        const queue = [];
        const formatedHeaders = {};

        checkHeadersFormat(rawHeaders);
        checkIsHeadersIncludeValueProp(rawHeaders);

        for (let i = 0; i < rawHeaders.length; i++) {
          const header = rawHeaders[i];

          const formatedHeaderItem = {
            headerID: header.value,
            text: header.text ?? header.value,
            type: header.type ?? DEFAULT_HEADER_ITEM_OPTIONS.type,
            render: header.render,
            
            editable: header.type === 'fn' || header.type === 'link'
              ? false
              : header.editable === true,
            save: header.save,

            options: header.options,
            optionID: header.option_id,
            fn: header.fn,

            styles: {
              _default: header.style ?? {},
              ...(header.styles ?? {})
            },
            width: resolveHeaderWidth(header.width, header.type, header.render),
            pinned: this.tableOptions.direction === 'ltr' && header.pinned === true,

            sortable: header.sortable === false ? false : true,
            filterable: this.profile.filtration === false 
              ? false 
              : header?.filterable === false ? false : true,

            display: header?.display !== false,

            agent: header?.agent
          };

          if (formatedHeaderItem.filterable && !this.tableOptions.filtration) this.tableOptions.filtration = true;
          if (formatedHeaderItem.editable && !this.tableOptions.editable) this.tableOptions.editable = true;
          if (formatedHeaderItem.pinned && !this.tableOptions.pinned) this.tableOptions.pinned = true;

          checkEditableHeaderIncludePathProp(formatedHeaderItem);
          checkHeaderType(formatedHeaderItem.type, formatedHeaderItem.headerID);
          checkHeaderRender(formatedHeaderItem);

          if (formatedHeaderItem.type === 'select' || formatedHeaderItem.type === 'multiple-select') {
            if (typeof formatedHeaderItem?.options === 'string') {
              formatedHeaderItem.options = await this.pullProfileData(formatedHeaderItem.options)
                .catch(({ message }) => {
                  throw new TableError(`Ошибка вычислении "options" для колонки ${formatedHeaderItem.headerID}:`, message);
                });
            }

            formatedHeaderItem.options = formatHeaderSelectorOptionList(formatedHeaderItem.options, formatedHeaderItem.headerID);

            if (!Array.isArray(formatedHeaderItem.options)) {
              checkIsValidOptionIDPropsInSelectHeaders(formatedHeaderItem.optionID, formatedHeaderItem.headerID, rawHeaders);
            }

          } else if (formatedHeaderItem.type === 'fn') {
            checkHasSourceInFnHeader(formatedHeaderItem);
          }

          queue.push(formatedHeaderItem.headerID);
          formatedHeaders[formatedHeaderItem.headerID] = formatedHeaderItem;
        }

        return { queue, headers: formatedHeaders };
      },

      formatTableData(rawTableData, tableHeaders) {
        const { headers } = tableHeaders;
        const dataTable = {};

        for (let rowID in rawTableData) {
          const row = rawTableData[rowID] ?? {};

          if (dataTable[rowID] === undefined) {
            dataTable[rowID] = {};
          }

          for (let headerID in headers) {
            const { type } = headers[headerID];

            try {
              if (type === 'checkbox') {
                dataTable[rowID][headerID] = !!row[headerID];
                continue;
              } else if (type === 'link' || type === 'upload') {
                dataTable[rowID][headerID] = row[headerID]
                  ? formatLinkData(row[headerID], type === 'upload')
                  : null;
                continue;
              } else if (type === 'select' || type === 'multiple-select') {
                type === 'select'
                  ? checkSelectValueFormat(row[headerID], rowID, headerID)
                  : checkMultipleSelectValueFormat(row[headerID], rowID, headerID);

                const options = headers[headerID].options;
                row[headerID] = filterValuesByOptions(row[headerID], options);
              } else if (type === 'text') {
                checkTextValueFormat(row[headerID], rowID, headerID);
                if(typeof row[headerID] === 'boolean') {
                  dataTable[rowID][headerID] = JSON.stringify(row[headerID]);
                  continue;
                }
              }
            } catch(error) {
              if(this.showDataError) {
                row[headerID] = new CellDataError(row[headerID], error.message);
              } else {
                throw error;
              }
            }

            dataTable[rowID][headerID] = row[headerID] ?? null;
          }
        }
        return dataTable;
      }

    }
  };
</script>
