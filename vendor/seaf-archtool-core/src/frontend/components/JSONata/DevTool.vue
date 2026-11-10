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
      R.Piontik <r.piontik@mail.ru> - 2023
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2023
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2024
      Nikolay Temnyakov <temnjakovn@gmail.com>, Sber - 2025
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025, 2026
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <v-container class="sandbox" fluid>
    <splitpanes horizontal class="default-theme sandbox__panes">
      <pane v-bind:size="40">
        <div ref="datasetSelectorContainer" class="sandbox__console">
          <div class="sandbox-toolbar">
            <v-btn
              v-show="!autoExec"
              class="sandbox-toolbar__run"
              color="primary"
              variant="flat"
              size="small"
              title="Выполнить запрос"
              v-on:click="onExecute(true)">
              <template #prepend>
                <v-icon icon="mdi-play" v-bind:color="null" />
              </template>
              Выполнить
            </v-btn>
            <div v-if="isLogFuncAvailable" class="sandbox-toolbar__hint">
              Трассировка: <code>$log(value[, tag])</code>
            </div>
            <v-spacer />
            <v-autocomplete
              v-model="origin"
              multiple
              hide-details
              clearable
              density="compact"
              variant="outlined"
              spellcheck="false"
              v-bind:items="origins"
              v-bind:placeholder="originLabel"
              v-bind:menu-props="{ contentClass: 'dh-pick', offset: 4, maxHeight: 360 }"
              v-bind:list-props="{ class: 'dh-pick__list' }"
              title="Базовый источник данных"
              item-title="id"
              item-value="id"
              class="sandbox-toolbar__origin"
              v-on:update:model-value="clearOriginMap">
              <template #prepend-inner>
                <v-icon class="sandbox-toolbar__origin-icon" icon="mdi-database-outline" size="18" v-bind:color="null" />
              </template>
              <template #selection="{ item }">
                <v-chip
                  class="sandbox-toolbar__chip"
                  size="small"
                  closable
                  v-on:click:close="() => deleteOrigin(item.id)">
                  {{ item.id }}
                </v-chip>
              </template>
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
            </v-autocomplete>
            <v-menu
              location="bottom end"
              v-bind:offset="6"
              v-bind:close-on-content-click="false">
              <template #activator="{ props }">
                <v-btn
                  icon
                  v-bind="props"
                  class="sandbox-toolbar__more"
                  size="small"
                  variant="text"
                  title="Настройки"
                  aria-label="Настройки">
                  <v-icon icon="mdi-dots-vertical" v-bind:color="null" />
                </v-btn>
              </template>
              <v-list class="dh-menu" density="compact">
                <div class="dh-menu__caption">Выполнение</div>
                <!-- Переключатель не закрывает меню: всю строку можно нажать -->
                <v-list-item
                  class="dh-menu__item"
                  role="menuitemcheckbox"
                  v-bind:aria-checked="String(autoExec)"
                  v-on:click="autoExec = !autoExec">
                  <template #prepend>
                    <v-icon class="dh-menu__icon" icon="mdi-play-circle-outline" size="18" v-bind:color="null" />
                  </template>
                  <v-list-item-title class="dh-menu__title">Автовыполнение</v-list-item-title>
                  <v-list-item-subtitle class="dh-menu__subtitle">Запрос выполняется после каждого изменения</v-list-item-subtitle>
                  <template #append>
                    <v-switch
                      v-model="autoExec"
                      class="dh-menu__switch"
                      color="primary"
                      density="compact"
                      hide-details
                      v-on:click.stop />
                  </template>
                </v-list-item>
              </v-list>
            </v-menu>
          </div>
          <editor
            ref="editor"
            v-model="query"
            class="sandbox__editor" />
        </div>
      </pane>
      <pane v-bind:size="60">
        <!-- Ошибка и запрос выводятся интерполяцией и экранируются: запрос может прийти из ссылки -->
        <div v-if="error" class="sandbox__error" role="alert">
          <div class="sandbox__error-card">
            <div class="sandbox__error-title">
              <v-icon icon="mdi-alert-circle-outline" size="18" v-bind:color="null" />
              Ошибка в запросе
              <span v-if="errorInfo.code" class="sandbox__error-code">{{ errorInfo.code }}</span>
            </div>
            <div class="sandbox__error-message">{{ errorInfo.message }}</div>
            <template v-if="errorInfo.position !== null">
              <div class="sandbox__error-caption">Место ошибки в запросе</div>
              <pre class="sandbox__error-query">{{ errorInfo.before }}<mark class="sandbox__error-at" v-bind:class="{ 'sandbox__error-at--caret': !errorInfo.at }">{{ errorInfo.at }}</mark>{{ errorInfo.after }}</pre>
            </template>
          </div>
        </div>
        <div v-else class="sandbox__output">
          <div class="sandbox__log">
            <v-data-table
              v-bind:headers="logHeaders"
              v-bind:items="logItems"
              v-bind:items-per-page="-1"
              density="compact"
              fixed-header
              hide-default-footer
              no-data-text="Записей нет"
              class="sandbox__log-table">
              <template #item="{ item }">
                <tr
                  class="sandbox__log-row"
                  v-bind:class="{ 'sandbox__log-row--selected': item.id === selectedLog }"
                  v-bind:aria-selected="item.id === selectedLog"
                  tabindex="0"
                  v-on:click="logOnClick(item)"
                  v-on:keydown.enter="logOnClick(item)">
                  <td class="sandbox__log-moment">{{ item.moment }}</td>
                  <td>{{ item.tag }}</td>
                </tr>
              </template>
            </v-data-table>
          </div>
          <result class="sandbox__result" v-bind:jsoncode="result" />
        </div>
      </pane>
    </splitpanes>
  </v-container>
</template>

<script>
  import cookie from 'vue-cookie';
  import env from '@front/helpers/env';
  import yaml from 'yaml';

  import query from '@front/manifest/query';
  import datasets from '@front/helpers/datasets';

  import editor from './JSONataEditor.vue';
  import result from './JSONResult.vue';
  import {Base64URLToUTF8} from '@front/helpers/strings';
  import { jsonataErrorInfo } from '@front/helpers/jsonataErrorInfo';
  import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';

  import { Splitpanes, Pane } from 'splitpanes';
  import 'splitpanes/dist/splitpanes.css';

  const logger = getLoggerWithTag('f/c/J/DevTool');

  const COOKIE_NAME_QUERY = 'json-dev-tool-query';
  const COOKIE_NAME_AUTOEXEC = 'json-dev-tool-autoexec';

  export default {
    name: 'JSONataDevTool',
    components: {
      editor,
      result,
      Splitpanes,
      Pane
    },
    props: {
      jsonataSource: {
        type: String,
        default: null
      }
    },
    data() {
      return {
        isLogFuncAvailable: !env.isBackendMode,
        query: cookie.get(COOKIE_NAME_QUERY) || localStorage.getItem('query_id') || '"Здесь введите JSONata запрос."',
        error: null,
        observer: null, // Таймер отложенного исполнения запросов
        jsonata: null,
        selectedLog: 0,
        autoExec: cookie.get(COOKIE_NAME_AUTOEXEC) === 'true',
        origin: null,   // Выбранный базовый источник
        //TODO: нужно в целом уйти от выборки массива к мапе в ориджинах
        originMap: null,
        origins: [],    // Список доступных источников данных
        logHeaders: [
          {
            title: 'Время, с',
            align: 'start',
            key: 'moment'
          },
          {
            title: 'Тег',
            align: 'start',
            key: 'tag'
          }
        ],
        logItems: []
      };
    },
    computed: {
      // Сообщение об ошибке и место ошибки в запросе
      errorInfo() {
        return jsonataErrorInfo(this.error, this.query);
      },
      result() {
        return this.logItems[this.selectedLog]?.value || '';
      },
      isLoading() {
        return this.$store.state.isReloading;
      },
      originLabel() {
        return this.originMap ? 'Origin вычислен в IDE' : 'Источник данных (origin)';
      }
    },
    watch: {
      origin() {
        this.onExecute();
      },
      isLoading() {
        this.doAutoExecute();
      },
      autoExec(value) {
        value && this.onExecute();
        cookie.set(COOKIE_NAME_AUTOEXEC, value, 365);
      },
      query() {
        this.onExecute();
      },
      manifest() {
        this.refreshOrigins(); // Обновляем список источников данных, если архитектурный манифест изменился
        this.loadJsonataQuery(); // Переподтягиваем при необходимости jsonata запрос из источника
      },
      jsonataSource(value) {
        this.loadJsonataQuery(value);
      }
    },
    unmounted() {
      clearInterval(this.timer);
      this.datasetSelect?.removeEventListener('wheel', this.scrollHorizontally);
    },
    mounted() {
      this.doAutoExecute();
      this.refreshOrigins();
      this.loadJsonataQuery();

      this.timer = setInterval(() => {
        localStorage.setItem('query_id', this.query);
      }, 2000);

      this.datasetSelect = this.$refs.datasetSelectorContainer.querySelector('.v-field__field .v-field__input');
      this.datasetSelect?.addEventListener('wheel', this.scrollHorizontally, { passive: false });
    },
    methods: {
      scrollHorizontally(e) {
        e.currentTarget.scrollLeft += e.deltaY;
        e.preventDefault();
      },

      deleteOrigin(originId) {
        this.origin = this.origin.filter(id => id !== originId);
        this.originMap = null;
      },
      clearOrigin() {
        this.origin = null;
        this.originMap = null;
        this.doAutoExecute();
      },
      clearOriginMap() {
        this.originMap = null;
      },
      refreshOrigins() {
        const pipe = query.expression(`([(datasets.$spread().{
          "id": $keys()[0],
          "title": *.title
      })])`, null, null, true, { log: this.log});
        pipe.evaluate().then((data) => this.origins = data);
      },
      doAutoExecute() {
        if (!this.isLoading && this.autoExec) this.onExecute();
      },
      loadJsonataQuery(param_id) {
        const src = param_id || this.jsonataSource;
        if (!src) return;

        const srcSplitPos = src.search(':');
        const sourceSplitPos = src.indexOf(':', srcSplitPos + 1);
        const jType = src.substring(0, srcSplitPos);
        const jSource = sourceSplitPos !== -1 ? src.substring(sourceSplitPos + 1) : '';

        if (jType === 'file' || jType === 'selection' || jType === 'element') {
          this.query = Base64URLToUTF8(jSource);
        } else if (jType === 'source') {
          try {
            const data = Object.values(yaml.parse(Base64URLToUTF8(jSource)))[0];
            this.originMap = data.origin;
            if (!this.originMap) {
              this.origin = [];
            } else if (typeof this.originMap === 'string') {
              this.origin = [this.originMap];
            } else if (typeof this.originMap === 'object' && !Array.isArray(this.originMap)) {
              this.origin = [];
            }
            this.query = data.source;
          } catch (e) {
            logger.error(() => 'Error of parsing data from IDE (source request)', e);
          }
        }
      },
      logOnClick(item) {
        this.selectedLog = item.id;
      },
      log(value, tag) {
        this.logItems.push({
          id: this.logItems.length,
          moment: (((new Date()).getTime() - this.jsonata?.expOrigin?.trace?.start || 0) * 0.001).toFixed(5),
          value: value ? JSON.parse(JSON.stringify(value)) : value,
          tag
        });
        return value;
      },

      doExecute(context) {
        cookie.set(COOKIE_NAME_QUERY, this.query, 365);
        this.error = null;
        this.logItems = [];
        if (env.isBackendMode && this.origin?.length) {
          const origin = this.origin.length > 1
            ? this.origin.reduce((acc, ele) => {acc[ele] = ele; return acc;} ,{})
            : this.origin[0];
          datasets().getData(null, {
            origin: origin,
            source: `(${this.query})`,
            separateDatasets: true
          }).then((data) => {
            this.log(JSON.stringify(data, null, 4), 'END');
          }).catch((err) => this.error = err);
        } else {
          this.jsonata = query.expression(`(${this.query})`, null, null, true, { log: this.log});
          this.jsonata.evaluate(context).then((data) => {
            const result = JSON.stringify(data, null, 4);
            this.logItems.push({
              id: this.logItems.length,
              moment: ((this.jsonata?.expOrigin?.trace?.end - this.jsonata?.expOrigin?.trace?.start || 0) * 0.001).toFixed(5),
              tag: 'END',
              value: result
            });
            this.selectedLog = this.logItems.length - 1;
          }).catch((e) => this.error = e);
        }
      },
      onExecute(force) {
        this.observer && clearTimeout(this.observer);
        if (this.autoExec || force) {

          const request = async() => {
            this.observer = null;

            const getData = async(origin) => {
              if (origin.startsWith('(')) {
                return query.expression(origin).evaluate();
              } else {
                const path = `/datasets/${origin}`;
                const meta = await datasets().pathResolver(path);
                const subject = Object.assign({ _id: path.split('/').pop() }, meta.subject || {});
                const baseURI = meta.baseURI || '/';
                return datasets().parseSource(
                  meta.context,
                  origin,
                  subject,
                  undefined,
                  baseURI
                );
              }
            };

            if (this.origin && !env.isBackendMode) {
              let originData = null;
              if (this.originMap) {
                if (typeof this.originMap === 'string') {
                  originData = Promise.resolve(getData(this.originMap));
                } else if (typeof this.originMap === 'object' && !Array.isArray(this.originMap)) {
                  originData = Promise.all(Object.entries(this.originMap).map(async([key, value]) => [key, await getData(value)]))
                    .then(entries => Object.fromEntries(entries));
                } else {
                  // eslint-disable-next-line no-console
                  logger.error(() => `origin is not string or object: ${JSON.stringify(this.originMap)}`);
                  return;
                }
              } else {
                originData = Promise.all(this.origin.map(async(origin) => ({ [origin]: await getData(origin) })))
                  .then((data) => this.origin.length > 1 ? data : data[0]);

              }

              originData.then((data) => this.doExecute(data))
                .catch((e) => this.error = e);
            } else {
              this.doExecute();
            }
          };

          this.observer = setTimeout(request, force ? 10 : 500);
        }
      }
    }
  };
</script>

<style scoped>
  /* Панель инструментов песочницы. Цвета — из общей палитры представлений (presentation.css) */
  .sandbox-toolbar {
    display: flex;
    flex: none;
    align-items: center;
    gap: 8px;
    min-height: 48px;
    padding: 6px 8px 6px 12px;
    border-bottom: 1px solid var(--dh-border);
    background: var(--dh-surface-alt);
  }

  .sandbox-toolbar__run {
    flex: none;
    letter-spacing: normal;
    text-transform: none;
  }

  .sandbox-toolbar__hint {
    overflow: hidden;
    color: var(--dh-text-muted);
    font-size: 12px;
    white-space: nowrap;
    text-overflow: ellipsis;
  }

  .sandbox-toolbar__hint code {
    padding: 1px 4px;
    border-radius: 4px;
    background: var(--dh-chip-bg);
    color: var(--dh-text-secondary);
    font-family: var(--dh-font-mono);
    font-size: 12px;
  }

  .sandbox-toolbar__origin {
    flex: 0 1 70%;
    min-width: 240px;
  }

  .sandbox-toolbar__origin :deep(.v-field) {
    font-size: 13px;
    background: var(--dh-surface);
  }

  .sandbox-toolbar__origin :deep(.v-field__outline) {
    --v-field-border-opacity: 1;
    color: var(--dh-border-strong);
  }

  .sandbox-toolbar__origin :deep(.v-field--focused .v-field__outline) {
    color: var(--dh-primary);
  }

  /* Выбранные источники в одну строку; колесо мыши листает их по горизонтали (scrollHorizontally) */
  .sandbox-toolbar__origin :deep(.v-field__input) {
    flex-wrap: nowrap;
    overflow-x: auto;
    scrollbar-width: none;
  }

  .sandbox-toolbar__origin :deep(.v-autocomplete__menu-icon),
  .sandbox-toolbar__origin-icon {
    color: var(--dh-text-muted);
    opacity: 1;
  }

  .sandbox-toolbar__chip {
    flex: none;
    border: 1px solid var(--dh-chip-border);
    background: var(--dh-chip-bg);
    color: var(--dh-chip-text);
    font-size: 12px;
  }

  /* Фон чипа — из палитры; подложка Vuetify скрыта */
  .sandbox-toolbar__chip :deep(.v-chip__underlay) {
    display: none;
  }

  .sandbox-toolbar__chip :deep(.v-chip__close) {
    color: var(--dh-text-muted);
  }

  .sandbox-toolbar__chip :deep(.v-chip__close:hover) {
    color: var(--dh-text);
  }

  .sandbox-toolbar__more {
    flex: none;
    color: var(--dh-text-secondary);
  }
</style>

<style scoped>
  /* Раскладка песочницы: редактор сверху, журнал и результат снизу */
  .sandbox {
    position: relative;
    display: flex;
    flex-direction: column;
    width: 100%;
    max-width: none;
    height: 100%;
    max-height: 100%;
    min-height: 0;
    padding: 0;
    overflow: hidden;
  }

  .sandbox__panes {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .sandbox__panes :deep(.splitpanes__pane) {
    min-height: 0;
    overflow: hidden;
    background: var(--dh-surface);
  }

  /* Ручка между панелями — светлая полоса палитры с тонкой границей */
  .sandbox__panes.default-theme :deep(.splitpanes__splitter) {
    border-top: 1px solid var(--dh-border);
    background: var(--dh-surface-alt);
  }

  .sandbox__panes.default-theme :deep(.splitpanes__splitter::before),
  .sandbox__panes.default-theme :deep(.splitpanes__splitter::after) {
    background: var(--dh-border-strong);
  }

  .sandbox__console {
    display: flex;
    flex-direction: column;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  .sandbox__editor {
    flex: 1 1 auto;
    display: block;
    width: 100%;
    height: auto;
    min-height: 0;
    padding: 4px 0;
    overflow: hidden;
  }

  .sandbox__output {
    display: flex;
    width: 100%;
    height: 100%;
    min-height: 0;
    overflow: hidden;
  }

  /* Журнал выполнения */
  .sandbox__log {
    flex: 0 0 30%;
    min-width: 200px;
    max-width: 420px;
    height: 100%;
    overflow: hidden;
    border-right: 1px solid var(--dh-border);
  }

  .sandbox__log-table {
    height: 100%;
    color: var(--dh-text);
    font-size: 13px;
  }

  .sandbox__log-table :deep(th) {
    height: 36px !important;
    background: var(--dh-surface-header) !important;
    color: var(--dh-text-secondary);
    font-size: 12px;
    font-weight: 600;
    border-bottom: 1px solid var(--dh-border-strong) !important;
  }

  .sandbox__log-table :deep(td) {
    height: 32px !important;
    border-bottom: 1px solid var(--dh-border) !important;
  }

  .sandbox__log-table :deep(.v-data-table__td--no-data),
  .sandbox__log-table :deep(.v-data-table-rows-no-data td) {
    color: var(--dh-text-muted);
    border-bottom: none !important;
  }

  .sandbox__log-row {
    cursor: pointer;
  }

  .sandbox__log-row:hover {
    background: var(--dh-surface-hover);
  }

  .sandbox__log-row:focus-visible {
    outline: 2px solid var(--dh-primary);
    outline-offset: -2px;
  }

  /* Выбранная запись — как выбранный пункт меню: светлый фирменный фон и полоса слева */
  .sandbox__log-row--selected,
  .sandbox__log-row--selected:hover {
    background: var(--dh-primary-soft);
    color: var(--dh-primary-strong);
    font-weight: 600;
  }

  .sandbox__log-row--selected td:first-child {
    box-shadow: inset 3px 0 0 var(--dh-primary);
  }

  .sandbox__log-moment {
    font-family: var(--dh-font-mono);
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }

  .sandbox__result {
    flex: 1 1 auto;
    min-width: 0;
    height: 100%;
  }

  /* Ошибка выполнения */
  .sandbox__error {
    height: 100%;
    padding: 16px;
    overflow: auto;
  }

  .sandbox__error-card {
    max-width: 960px;
    padding: 12px 16px;
    border: 1px solid var(--dh-border);
    border-left: 3px solid var(--dh-danger);
    border-radius: var(--dh-radius);
    background: var(--dh-surface);
    color: var(--dh-text);
  }

  .sandbox__error-title {
    display: flex;
    align-items: center;
    gap: 6px;
    color: var(--dh-danger);
    font-size: 14px;
    font-weight: 600;
  }

  .sandbox__error-code {
    padding: 0 6px;
    border-radius: 4px;
    background: var(--dh-status-bad-bg);
    color: var(--dh-status-bad-text);
    font-family: var(--dh-font-mono);
    font-size: 12px;
    font-weight: 500;
  }

  .sandbox__error-message {
    margin-top: 6px;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  .sandbox__error-caption {
    margin: 12px 0 4px;
    color: var(--dh-text-muted);
    font-size: 12px;
  }

  .sandbox__error-query {
    margin: 0;
    padding: 10px 12px;
    border-radius: var(--dh-radius);
    background: var(--dh-surface-alt);
    font-family: var(--dh-font-mono);
    font-size: 13px;
    line-height: 1.6;
    white-space: pre-wrap;
    overflow-wrap: anywhere;
  }

  /* Токен, на котором остановился разбор; без токена — отметка в месте ошибки */
  .sandbox__error-at {
    background: var(--dh-status-bad-bg);
    color: var(--dh-status-bad-text);
    text-decoration: underline wavy var(--dh-danger);
    text-underline-offset: 3px;
  }

  /* Токен неизвестен — отметка-курсор, текст запроса не меняется */
  .sandbox__error-at--caret {
    display: inline-block;
    width: 2px;
    height: 1.2em;
    margin: 0 1px;
    vertical-align: text-bottom;
    background: var(--dh-danger);
  }

  @media (max-width: 800px) {
    .sandbox__output {
      flex-direction: column;
    }

    .sandbox__log {
      flex: 0 0 8em;
      max-width: none;
      height: auto;
      border-right: none;
      border-bottom: 1px solid var(--dh-border);
    }

    .sandbox__result {
      height: auto;
      min-height: 0;
    }
  }
</style>
