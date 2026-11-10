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
  <div class="excel-screen">
    <h2 class="excel-screen__title">{{ templateName }}</h2>
    <v-btn
      class="excel-screen__button"
      color="primary"
      variant="flat"
      v-on:click="onLoad">
      <template #prepend>
        <v-icon icon="mdi-file-upload-outline" v-bind:color="null" />
      </template>
      Загрузить Excel
    </v-btn>
  </div>
</template>

<script>
  import gateway from '@ide/gateway';
  import ExcelJS from 'exceljs';
  import yaml from 'yaml';
  import env, { Plugins } from '@front/helpers/env';
  import { MAX_FILE_NAME_LENGTH } from '../lib/const';
  import { excelTemplateName } from '../lib/templateName';

  const logger = DocHub.documents.getLoggerWithTag('excel-import');

  const FILE_DATA_NAME = 'file';
  const TABLE_DATA_NAME = 'table';

  export default {
    props: {
      profile: {
        type: Object,
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
      },
      getContent: {
        type: Function,
        required: true
      }
    },

    data() {
      return {
        data: {}
      };
    },

    computed: {
      templateName() {
        return excelTemplateName(this.profile?.$base);
      }
    },

    mounted() {
      if (env.isPlugin(Plugins.idea)) {
        gateway.appendListener('plugin:/idea/gateway/uploaded', this.execute);
      }
    },

    beforeUnmount() {
      if (env.isPlugin(Plugins.idea)) {
        gateway.removeListener('plugin:/idea/gateway/uploaded', this.execute);
      }
    },

    methods: {
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

      async onLoad() {
        this.data = {};
        const result = window.$PAPI.upload();

        if (env.isPlugin(Plugins.vscode)) {
          result.then((res) => this.execute(res));
        }
      },

      async execute(file) {
        if (env.isPlugin(Plugins.idea)) {
          gateway.removeListener('plugin:/idea/gateway/uploaded', this.execute);
        }

        const tableResult = await this.pasreWorkbook(file);
        if (!tableResult) return;

        const { tables } = this.profile;
        if (!Array.isArray(tables)) {
          return logger.error(() => 'Значение "tables" должно быть массивом');
        }

        const fileDataCache = {};
        const requiredProps = ['name', 'output', 'source'];

        for (let i = 0; i < tables.length; i++) {
          const { name, output, source } = tables[i];

          const notFilledProps = requiredProps.reduce((acc, prop) => {
            if (!tables[i]?.[prop]) {
              acc.push(prop);
            }
            return acc;
          }, []);

          if (notFilledProps.length > 0) {
            logger.error(
              () =>
                `Не указаны обязательные свойства - ${notFilledProps.join(', ')}`
            );
            continue;
          }

          const tableData = this.data[name];

          if (!tableData) {
            logger.error(() => `Таблица ${name} не найдена в загруженном файле`);
            continue;
          }

          const tableExtraData = {[TABLE_DATA_NAME]: tableData};

          let path;
          try {
            path = await this.pullProfileData(output, tableExtraData);
            if(!(typeof path === 'string' && path.trim().length > 0)) {
              throw new Error(`Значение дожно быть строкой. Текущее значение: ${typeof path}`);
            }

            const lastDot = path.lastIndexOf('.');
            if (lastDot === -1) {
              throw new Error(`В имени файла не содержится расширение, такое сохранить не получится: ${path}`);
            }
            const fileName = path.substring(0, lastDot);
            const extension = path.substring(lastDot + 1);
            if(fileName.length > MAX_FILE_NAME_LENGTH) {
              throw new Error(`Максимальная длина имени файла не должна превышать ${MAX_FILE_NAME_LENGTH} символов. Ваш файл состоит из ${fileName.length} символов!`);
            }
            if(!(extension === 'json' || extension === 'yaml')) {
              throw new Error(`Некорректное расширение файла: "${extension}"`);
            }
          } catch (err) {
            return logger.error(
              () => `Ошибка при расчете пути сохранения "output": \n${err?.message}`,
              err
            );
          }

          let fileData;
          try {
            fileData = fileDataCache[path] ?? (await this.getDataFromFile(path));
          } catch (err) {
            return logger.error(() => err.message, err);
          }

          const extraData = Object.assign(
            tableExtraData,
            fileData ? { [FILE_DATA_NAME]: fileData } : null
          );

          try {
            fileDataCache[path] = await this.pullProfileData(source, extraData);
          } catch (e) {
            return logger.error(() => 'Ошибка при выполнении JSONanta-выражения');
          }
        }

        if (this.profile.yaml && 'null_replace_string' in this.profile.yaml) {
          yaml.scalarOptions.null.nullStr = this.profile.yaml.null_replace_string;
        }
        const originNullOption = yaml.scalarOptions.null.nullStr;
        for (let path in fileDataCache) {
          const result = fileDataCache[path];
          try {
            this.putContent(path, yaml.stringify(result, { simpleKeys: true }));
          } catch (e) {
            logger.error(() => `Ошибка при сохранении файла "${path}"`);
          }
        }
        yaml.scalarOptions.null.nullStr = originNullOption;

        if (env.isPlugin(Plugins.idea)) {
          gateway.appendListener('plugin:/idea/gateway/uploaded', this.execute);
        }
      },

      async pasreWorkbook(file) {
        try {
          const response = Object.values(file)[0];
          const { data } = JSON.parse(response);

          const binaryString = atob(data);

          const uint8Array1 = new Uint8Array(binaryString.length);
          for (let i = 0; i < binaryString.length; i++) {
            uint8Array1[i] = binaryString.charCodeAt(i);
          }

          const blob = new Blob([uint8Array1], {
            type: 'application/vnd.ms-excel'
          });

          const arrayBuffer = await blob.arrayBuffer();
          const uint8Array = new Uint8Array(arrayBuffer);

          const workbook = new ExcelJS.Workbook();
          await workbook.xlsx.load(uint8Array);

          workbook.worksheets.forEach((list) => {
            const tables = list.getTables();

            tables.forEach(({ table, name }) => {
              const tableData = [];
              const tableName = name || table?.name || table?.displayName;

              if(!tableName) {
                const tablePosition = table.tableRef || table.autoFilterRef;
                logger.debug(() => `Не найден идентификатор (имя) таблицы. Данные ${tablePosition} не загружены.`);
                return;
              }

              const [firstCell, lastCell] = table.tableRef.split(':');
              const { col: firstColIndex, row: firstRowIndex } =
                list.getCell(firstCell).fullAddress;
              const { col: lastColIndex, row: lastRowIndex } =
                list.getCell(lastCell).fullAddress;

              let currentRowIndex = firstRowIndex + 1;

              while (currentRowIndex <= lastRowIndex) {
                const rowData = [];
                const row = list.getRow(currentRowIndex);
                let currentColIndex = firstColIndex;

                while (currentColIndex <= lastColIndex) {
                  rowData.push(row.getCell(currentColIndex).value || null);
                  currentColIndex++;
                }
                tableData.push(rowData);
                currentRowIndex++;
              }

              this.data[tableName] = tableData;
            });
          });

          return this.data;
        } catch {
          logger.error(() => 'Ошибка при получении данных из табллицы');
          return;
        }
      },

      async getDataFromFile(path) {
        return this.getContent(path)
          .then((res) => {
            let data;
            if (env.isPlugin(Plugins.idea)) {
              data = res.data;
            } else {
              data = yaml.parse(res.data);
            }
            return data;
          })
          .catch((err) => {
            // Новый файл создаём, только когда источник явно ответил, что файла нет. Иначе (нет доступа,
            // сбой источника, VS Code без кода ответа) файл перезаписался бы данными импорта
            if (err?.response?.status === 404 || err?.code === 'FileNotFound') {
              logger.info(() => `Файл "${path}" не найден. При сохранении, будет создан новый файл`);
              return null;
            }
            const reason = err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '');
            throw new Error(`Не удалось прочитать файл "${path}", данные не сохранены${reason ? `: ${reason}` : ''}`);
          });
      }
    }
  };
</script>

<style scoped src="./excelScreen.css"></style>
