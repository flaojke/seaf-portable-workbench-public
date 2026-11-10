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
      R.Piontik <r.piontik@mail.ru> - 2024
      R.Piontik <r.piontik@mail.ru> - 2023
      R.Piontik <r.piontik@mail.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2021
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2024, 2026
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div>
    <v-alert v-if="!isReloading && error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__title">Не удалось загрузить документ</div>
      <dl class="dh-alert__fields">
        <dt>Расположение</dt>
        <dd>{{ path }}</dd>
      </dl>
      <pre class="dh-alert__code">{{ error }}</pre>
    </v-alert>

    <plugin-host
      v-else
      v-bind:metadata-error="pluginsMetadataError"
      v-bind:renderer="is"
      v-bind:doc-type="docType"
      v-bind:is-reloading="isReloading"
      v-bind:plugins-ready="pluginsReady"
      v-bind:inline="inline"
      v-bind:params="currentParams"
      v-bind:profile="profile"
      v-bind:path="currentPath"
      v-bind:get-content="getContentForPlugin"
      v-bind:put-entities="putEntities"
      v-bind:put-content="putContent"
      v-bind:to-print="isPrintVersion"
      v-bind:event-bus="eventBus"
      v-bind:pull-data="pullData"
      v-bind:context-menu="contextMenu" />

    <v-dialog v-if="!isPlugin" v-model="isDialogActive" max-width="500" v-bind:persistent="commitStatus === 'loading'">
      <v-card class="dh-dialog" v-bind:aria-busy="commitStatus === 'loading'">
        <dialog-header
          title="Сохранение в репозиторий"
          v-bind:closable="commitStatus !== 'loading'"
          v-on:close="isDialogActive = false" />
        <div class="dh-dialog__body">
          <template v-if="commitStatus === 'loading'">
            <p class="dh-dialog__text">Сохраняем изменения…</p>
            <v-progress-linear indeterminate color="primary" rounded />
          </template>
          <v-alert v-else-if="commitStatus === 201" class="dh-alert dh-alert--success" icon="mdi-check-circle-outline">
            <div class="dh-alert__title">Данные сохранены</div>
          </v-alert>
          <v-alert v-else class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
            <div class="dh-alert__title">
              {{ commitError?.message || "Ошибка при сохранении данных в репозиторий" }}
            </div>
            <pre v-if="commitError?.error" class="dh-alert__code">{{ commitError.error }}</pre>
          </v-alert>
        </div>
        <footer v-if="commitStatus !== 'loading'" class="dh-dialog__footer">
          <v-btn class="dh-dialog__btn" color="primary" variant="flat" v-on:click="isDialogActive = false">Закрыть</v-btn>
        </footer>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import { eventBus } from '@front/shared/eventBus';
  import { DocTypes } from '@front/components/Docs/enums/doc-types.enum';
  import AsyncApiComponent from '@front/components/Docs/DocAsyncApi.vue';
  import requests from '@front/helpers/requests';
  import datasets from '@front/helpers/datasets';
  import query from '@front/manifest/query';
  import uriTool from '@front/helpers/uri';
  import env from '@front/helpers/env';
  import { pluginManager } from '@front/plugins/plugin-manager';

  import Swagger from './DocSwagger.vue';
  import Plantuml from './DocPlantUML.vue';
  import DocMarkdown from './DocMarkdown.vue';
  import DocTable from './DocTable.vue';
  import DocMermaid from './DocMermaid.vue';
  import DocNetwork from './DocNetwork.vue';
  import DocSmartants from './DocSmartAnts.vue';
  import DocWizard from './DocWizard.vue';
  import PluginHost from '@front/components/Docs/PluginHost.vue';
  import DialogHeader from '@front/components/Controls/DialogHeader.vue';
  import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
  import { prepareEntitiesData } from '@global/manifest/tools/entitiesSource.mjs';

  const logger = getLoggerWithTag('DocHubDoc');

  // Для встроенных типов сразу возвращаем объекты компонентов.
  // Это убирает лишнюю зависимость от строковых имён и локальной регистрации.
  const inbuiltTypes = {
    [DocTypes.ASYNCAPI]: AsyncApiComponent,
    [DocTypes.OPENAPI]: Swagger,
    [DocTypes.PLANTUML]: Plantuml,
    [DocTypes.MARKDOWN]: DocMarkdown,
    [DocTypes.TABLE]: DocTable,
    [DocTypes.MERMAID]: DocMermaid,
    [DocTypes.NETWORK]: DocNetwork,
    [DocTypes.SMARTANTS]: DocSmartants,
    [DocTypes.WIZARD]: DocWizard
  };

  export default {
    name: 'DocHubDoc',
    components: {
      DialogHeader,
      PluginHost
    },
    props: {
      path: {
        type: String,
        default: '$URL$'
      },
      inline: { type: Boolean, default: false },
      // Параметры передающиеся в запросы документа
      // Если undefined - берутся из URL
      params: {
        type: Object,
        default: undefined
      },
      contextMenu: {
        type: Array,
        default() {
          return [];
        }
      }
    },
    data() {
      return {
        DocTypes,
        refresher: null,
        profileRequestId: 0,
        profile: null,
        error: null,
        currentPath : this.resolvePath(),
        currentParams: this.resolveParams(),
        dataProvider: datasets(),
        commitStatus: null,
        isDialogActive: false,
        isPlugin: env.isPlugin(),
        commitError: null
      };
    },
    computed: {
      eventBus() {
        return eventBus;
      },
      is() {
        return inbuiltTypes[this.docType]
          || pluginManager.getDocumentRenderer(this.docType)
          || null;
      },
      docType() {
        return (this.profile?.type || 'unknown').toLowerCase();
      },
      baseURI() {
        return uriTool.getBaseURIOfPath(this.currentPath);
      },
      isReloadingManifest() {
        return this.$store.state.isReloading;
      },
      manifestMoment() {
        return this.$store.state.moment;
      },
      isReloading() {
        return this.isReloadingManifest || !!this.refresher;
      },
      isPrintVersion() {
        return this.$store.state.isPrintVersion;
      },
      pluginsReady() {
        return this.$store.state.plugins.ready;
      },
      putContentForPlugin() {
        return (url, content) => {
          return new Promise((success, reject) => {
            const fullPath = uriTool.makeURIByBaseURI(url, this.baseURI);
            window.$PAPI.pushFile(fullPath, content)
              .then(success)
              .catch(reject);
          });
        };
      },
      putContentForBackend() {
        return (content) => {
          const hash = this.baseURI.split('/')[2];
          this.commitStatus = 'loading';
          this.isDialogActive = true;
          return requests.request(`backend://put-content/${hash}`, this.baseURI, {
            method: 'post',
            data: {
              content
            }
          })
            .then((answer) => {
              this.commitStatus = 201;
              return answer?.data?.commitResult;
            })
            .catch((err) => {
              this.commitStatus = 400;
              this.commitError = err?.response?.data?.commitResult;
              return err?.response?.data?.commitResult;
            });
        };
      },
      putEntities() {
        return async(entities, options) => {
          const docOptions = { baseURI: this.baseURI, ...options };
          if (this.isPlugin) {
            const data =  await prepareEntitiesData(entities, requests.request.bind(requests), logger, { baseURI: this.baseURI, ...options });
            for (const [uri, content] of Object.entries(data)) {
              this.putContentForPlugin(uri, content).catch((e) => {
                logger.error(() => `Error putting content to ${uri}`, e);
              });
            }
          } else {
            const hash = this.baseURI.split('/')[2];
            const data = await requests.request(`backend://prepare-entities/${hash}`, this.baseURI, {
              method: 'post',
              data: {
                content: entities,
                options: docOptions
              }
            });
            return this.putContentForBackend(data.data);
          }
        };
      },
      putContent() {
        return this.isPlugin
          ? this.putContentForPlugin
          : this.putContentForBackend;
      },
      pluginsMetadataError() {
        return this.$store.state.plugins.metadataError;
      }
    },
    watch: {
      '$route'() {
        this.refresh();
      },
      params() {
        this.refresh();
      },
      isReloadingManifest() {
        this.refresh();
      },
      manifestMoment() {
        this.refresh();
      }
    },
    mounted() {
      this.refresh();
    },
    unmounted() {
      this.profileRequestId++;
      clearTimeout(this.refresher);
    },
    methods: {
      isCurrentProfileRequest(requestId) {
        return requestId === this.profileRequestId;
      },
      pullProfileFromResource(uri, requestId) {
        requests.request(uri).then((response) => {
          if (!this.isCurrentProfileRequest(requestId)) return;
          const contentType = (response?.headers['content-type'] || '').split(';')[0].split('/')[1];
          this.error = null;
          this.profile = {
            type: contentType,
            source: `source:${encodeURIComponent(JSON.stringify(response.data))}`
          };
        }).catch((e) => {
          if (!this.isCurrentProfileRequest(requestId)) return;
          this.error = e?.message || 'Не удалось загрузить профиль документа';
        }).finally(() => {
          if (!this.isCurrentProfileRequest(requestId)) return;
          this.refresher = null;
        });
      },
      // Достаем данные профиля документа из DataLake
      pullProfileFromDataLake(dateLakeId, requestId) {
        query.expression( query.getObject(dateLakeId), null, this.resolveParams())
          .evaluate()
          .then((profile) => {
            if (!this.isCurrentProfileRequest(requestId)) return;
            this.error = null;
            this.profile = Object.assign({ $base: this.path }, profile);
          })
          .catch((e) => {
            if (!this.isCurrentProfileRequest(requestId)) return;
            this.error = e.message;
          })
          .finally(() => {
            if (!this.isCurrentProfileRequest(requestId)) return;
            this.currentPath = this.resolvePath();
            this.currentParams = this.resolveParams();
            this.refresher = null;
          });
      },
      // Обновляем контент документа
      refresh() {
        clearTimeout(this.refresher);
        const requestId = ++this.profileRequestId;

        this.refresher = setTimeout(() => {
          if (!this.isCurrentProfileRequest(requestId)) return;
          if (this.isReloadingManifest) {
            this.refresher = null;
            return;
          }
          this.profile = null;
          this.error = null;

          const path = this.resolvePath().slice(1).split('/');

          if (path[1]?.startsWith('blob:') || path[1]?.endsWith(':')) {
            this.pullProfileFromResource(path.slice(1).join('/'), requestId);
          } else {
            this.pullProfileFromDataLake(`"${path.join('"."')}"`, requestId);
          }
        }, 50);
      },
      resolveParams() {
        return this.params || this.$route.query || {};
      },
      // Определяем текущий путь к профилю документа
      resolvePath() {
        if (this.path === '$URL$') return this.$route.path;
        return this.profile?.$base || this.path;
      },
      // Провайдер контента файлов для плагинов
      //  url - прямой или относительный URL к файлу
      getContentForPlugin(url) {
        return new Promise((success, reject) => {
          const whiter = setInterval(() => {
            if (!this.isReloading) {
              requests.request(url, this.baseURI, { raw : true })
                .then(success)
                .catch(reject);
              clearInterval(whiter);
            }
          }, 50);
        });
      },
      // API к озеру данных архитектуры
      //  expression - JSONata запрос или идентификатор ресурса
      //  self - значение переменной $self в запросе
      //  params - значение переменной $params в запросе
      //  context - контекст запроса (по умолчанию равен manifest)
      pullData(expression, self_, params, context) {
        logger.trace(() => [
          'Pull data method',
          {title: 'expression', obj: expression},
          {title: 'self_', obj: self_},
          {title: 'params', obj: params},
          {title: 'context', obj: context}
        ]);
        if (!expression) {
          return this.dataProvider.releaseData(this.resolvePath(), params || this.params);
        }
        const subject = expression.source ? expression : { source: expression };
        return this.dataProvider.getData(context, subject, params);
      }
    }
  };
</script>

