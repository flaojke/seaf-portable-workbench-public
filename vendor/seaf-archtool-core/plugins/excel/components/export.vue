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
    <v-alert
      v-if="error"
      class="dh-alert dh-alert--error excel-export__alert"
      icon="mdi-alert-circle-outline">
      <div class="dh-alert__title">Не удалось подготовить выгрузку</div>
      <div class="dh-alert__text">{{ error }}</div>
      <pre v-if="errorDetails" class="dh-alert__code">{{ errorDetails }}</pre>
    </v-alert>

    <v-btn
      v-else
      class="excel-screen__button"
      variant="flat"
      v-bind:loading="loading"
      v-bind:disabled="loading || !!error"
      color="primary"
      v-on:click="onSave">
      <template #prepend>
        <v-icon icon="mdi-microsoft-excel" v-bind:color="null" />
      </template>
      {{ buttonText }}
    </v-btn>
  </div>
</template>

<script>
  const logger = DocHub.documents.getLoggerWithTag('excel-export');

  import { MAX_FILE_NAME_LENGTH } from '../lib/const';
  import { Book } from '../lib/utils';
  import { excelTemplateName } from '../lib/templateName';

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
        data: {},
        loading: false,
        error: null,
        errorDetails: null,
        buttonText: 'Сохранить шаблон'
      };
    },

    computed: {
      templateName() {
        return excelTemplateName(this.profile?.$base);
      }
    },

    mounted() {
      this.loading = true;

      this.init().
        catch((e) => {
          this.error = 'Произошла непредвиденная ошибка при получении данных для компонентов';
          this.errorDetails = e?.message || String(e);
          logger.error(() => this.error, e);
        })
        .finally(() => this.loading = false);

    },

    methods: {
      async getFileName() {
        if(typeof this.profile?.file_name === 'string' && this.profile.file_name.trim()) {
          try {
            const fileName = await this.pullProfileData(this.profile.file_name);

            if(typeof fileName !== 'string') {
              throw new Error('The file name must be a string');
            }
            if(fileName.length > MAX_FILE_NAME_LENGTH) {
              throw new Error(`The maximum file name length is ${MAX_FILE_NAME_LENGTH}. Your length: ${fileName.length}`);
            }
            return fileName;
          } catch(e) {
            logger.error(() => 'Ошибка при формировании имени файла (file_name)', e);
            throw e;
          }
        }
        return `dh_${Date.now()}`;
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
        if(this.profile.button_text) {
          this.pullProfileData(this.profile.button_text)
            .then((res) => this.buttonText = res);
        }
        const list = [];
        this.profile.pages.forEach(page => {
          if (page.components) {
            page.components.forEach(async(component) => {
              if (component.source) {
                list.push(this.pullProfileData(component.source).then(res => {
                  if (typeof res === 'object' && res.body) {
                    this.data[component.name] = res;
                  } else {
                    this.error =
                      `JSONata выражение в поле 'source' для компонента ${component.name} должно вернуть объект с обязательным полем 'body' и опциональным полем 'headers'`;
                  }
                }));
              }
            });
          }
        });
        return Promise.all(list);
      },

      async onSave() {
        const book = new Book(this.profile.options);

        this.profile.pages.forEach(page => {
          const { name, link, title, subtitle, description, components = [] } = page;
          const list = book.createPage(page);

          list.addLink(link);
          list.addTitle(title);
          list.addSubtitle(subtitle);
          list.addDescription(description);
          list.addEmptyRows(1);

          components.forEach(component => {
            if (component.type === 'template') {
              if (!this.profile?.templates?.[component.name]) {
                return this.error = `Не удалось получить шаблон (template) для компонента "${component.name}" на странице "${name}"`;
              }
              component = this.profile?.templates?.[component.name];
            }

            const { type, title, subtitle, description } = component;

            list.addTitle(title);
            list.addSubtitle(subtitle);
            list.addDescription(description);

            if (type === 'table') {
              list.addComponentTable(component, this.data[component.name]);
            } else if (type === 'rows') {
              list.addComponentRows(component);
            }

            list.addEmptyRows(1);
          });

          list.applyPageSettings(page);
        });

        !this.error && book.download(await this.getFileName());
      }
    }
  };
</script>

<style scoped src="./excelScreen.css"></style>

<style scoped>
  .excel-export__alert {
    width: 100%;
    max-width: 720px;
  }
</style>
