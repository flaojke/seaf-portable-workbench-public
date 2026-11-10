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

<script>
  import yaml from 'yaml';
  import env, { Plugins } from '@front/helpers/env';
  import {logger} from '../index';
  import { CellDataError } from '../lib/const';
  import { restoreLinkSource, restoreLinkSourceTable } from '../lib/linkSource';
  import uriTool from '@front/helpers/uri';
  import { updateRootFilesInPutContent, isIndexFileNameValid} from '@global/helpers/updateRootFiles/updateRootFilesInPutContent';

  export default {
    methods: {
      getProfileBaseURI() {
        return uriTool.getBaseURIOfPath(this.profile.$base) || '';
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
            // сбой источника, VS Code без кода ответа) файл перезаписался бы данными одной таблицы
            if (err?.response?.status === 404 || err?.code === 'FileNotFound') {
              logger.info( () => `Файл "${path}" не найден. При сохранении, будет создан новый файл`);
              return null;
            }
            logger.error( () => `Не удалось получить данные из файла "${path}"`, err);
            const reason = err?.response?.data?.message || err?.message || (typeof err === 'string' ? err : '');
            throw new Error(`Не удалось прочитать файл "${path}", данные не сохранены${reason ? `: ${reason}` : ''}`);
          });
      },

      mergeDataTable(slicedData) {
        for (let rowID in this.tableData) {
          const tableRow = this.tableData[rowID];

          for (let headerID in this.tableHeaders) {
            const { save } = this.tableHeaders[headerID];

            if (!save) continue;

            const { path } = save;
            let tableValue = tableRow[headerID] instanceof CellDataError
              ? null
              : restoreLinkSource(tableRow[headerID], this.linkSourceData?.[rowID]?.[headerID]);

            if (!slicedData[path]) {
              slicedData[path] = {};
            }

            if (!slicedData[path][rowID]) {
              slicedData[path][rowID] = {};
            }

            slicedData[path][rowID][headerID] = tableValue;
          }
        }
        return slicedData;
      },

      getPathList() {
        const pathList = new Set();
        for (let columnId in this.tableHeaders) {
          const { save } = this.tableHeaders[columnId];
          if (save) {
            pathList.add(save.path);
          }
        }
        return [...pathList];
      },

      async saveTableToFiles() {
        const prevHasChange = this.tableOptions.hasChange;

        const pathList = this.getPathList();

        Promise.resolve()
          .then(() => {
            if (!env.isBackendMode) {
              // плагин не умеет работать с путями для bitbucket, отфильтруем их если они есть
              const invalidPath = pathList.filter((path) => path.startsWith('bitbucket:'));
              if (invalidPath.length > 0) {
                throw new Error(`При сохранении данных таблицы один из путей save.path указывает на bitbucket с такими данными таблицу не получится сохранить. Все ошибочные пути ${invalidPath}`);
              }
            }
          })
          .then(() => Promise.all(pathList.map((path) => this.getDataFromFile(path))))
          .then((slices) => pathList.reduce((acc, path, index) => Object.assign(acc, {[path]: slices[index]}), {}))
          .then(async(slicedFileData) => {
            let mergedSlicedData = {};
            if (this.profile.format) {
              const FILE_DATA_NAME = 'file';
              const TABLE_DATA_NAME = 'table';
              const FULL_TABLE_DATA_NAME = 'full_table';

              const slicedTableData = this.mergeDataTable({});
              // ячейки link с опасными ссылками — исходные значения, как в table; tableData не меняется
              const fullTableData = restoreLinkSourceTable(this.tableData, this.linkSourceData);

              for (let path in slicedFileData) {

                const extraData = {
                  [TABLE_DATA_NAME]: slicedTableData[path],
                  [FULL_TABLE_DATA_NAME]: fullTableData
                };

                if (slicedFileData[path]) {
                  Object.assign(extraData, { [FILE_DATA_NAME]: slicedFileData[path] });
                }

                try {
                  mergedSlicedData[path] = await this.pullProfileData(this.profile.format, extraData);
                } catch (e) {
                  throw new Error(`
                    Произошла ошибка при попытке трансформации данных.
                    Проверьте возможность применения описанного JSONata выражения в "format":
                    ${(e.message ? e.message : e).join('\n')}
                  `);
                }

              }
            } else {
              mergedSlicedData = this.mergeDataTable(slicedFileData);
            }

            return mergedSlicedData;
          })
          .then((mergedSlicedData) => {
            yaml.scalarOptions.null.nullStr = this.tableOptions.nullStr;
            const yamlOption = { simpleKeys: true };
            return Object.keys(mergedSlicedData).reduce((acc, path) => {
              const yamlString = yaml.stringify(mergedSlicedData[path], yamlOption);
              return Object.assign(acc, {[path]: yamlString});
            }, {});
          })
          .then(async(yamledSlicedData) => {
            let isSaveSuccess;
            if (env.isBackendMode) {
              if (this.updateIndexFile) {
                // TODO: ERA-2933: временный осознанный костыль для передачи параметра
                Object.assign(yamledSlicedData, {['__sfaUpdateIndexFile']: this.updateIndexFile});
              }
              const result = await this.putContent(yamledSlicedData);
              isSaveSuccess = result?.success || false;
            } else {
              if(this.updateIndexFile) {
                if(!isIndexFileNameValid(this.updateIndexFile)) {
                  throw new Error(`updateIndexFile (${this.updateIndexFile}) не должен содержать запрещенные символы, допустимы (a-z, A-Z, 0-9, _)"`);
                }
                const updatedImports = updateRootFilesInPutContent({
                  baseUri: this.getProfileBaseURI(),
                  rootUri: env.rootManifest,
                  indexFileName: this.updateIndexFile,
                  commitData: yamledSlicedData
                });
                Object.assign(yamledSlicedData, updatedImports);
              }

              for (let path in yamledSlicedData) {
                this.putContent(path, yamledSlicedData[path]);
              }
              isSaveSuccess = true;
            }

            if (isSaveSuccess) {
              this.tableOptions.hasChange = null;
            }
            this.markStorageAboutTableSaving();
            this.clearCache();
          })
          .catch((e) => {
            logger.error( () => 'Ошибка при сохранении данных', e);
            this.tableOptions.hasChange = prevHasChange;
            this.dialogTitle = 'Не удалось сохранить данные';
            this.dialogMessage = e?.message || 'Ошибка при сохранении данных';
            this.activeDialog = 'error';
          });
      }
    }
  };
</script>
