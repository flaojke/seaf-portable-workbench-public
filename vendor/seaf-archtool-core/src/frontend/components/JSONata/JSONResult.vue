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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="json-result">
    <div v-if="jsoncode" class="json-result__actions">
      <v-btn
        type="button"
        class="json-result__btn"
        icon
        size="small"
        variant="text"
        title="Сохранить в файл"
        aria-label="Сохранить в файл"
        v-on:click="saveResult">
        <v-icon icon="mdi-content-save-outline" size="18" v-bind:color="null" />
      </v-btn>
      <copy-button
        class="json-result__btn"
        size="small"
        variant="text"
        title="Копировать результат"
        v-bind:get-copied-text="getJsonataToCopy" />
    </div>
    <pre v-if="jsoncode" class="language-json json-result__code" tabindex="0"><code v-if="!isReload" class="language-json">{{ jsoncode }}</code></pre>
    <div v-else class="json-result__empty">Результат появится после выполнения запроса</div>
  </div>
</template>

<script>
  import downloadHelper from '@front/helpers/download.js';
  import CopyButton from '@front/components/Buttons/CopyButton.vue';

  export default {
    name: 'JSONResult',
    components: {
      CopyButton
    },
    props: {
      jsoncode: {
        type: [String],
        default: ''
      }
    },
    data() {
      return {
        isReload: true
      };
    },
    watch: {
      jsoncode() {
        this.reload();
      }
    },
    mounted() {
      this.reload();
    },
    methods: {
      reload() {
        this.isReload = true;
        this.$nextTick(() => {
          this.isReload = false;
          if (this.jsoncode.length < 5000) {
            // eslint-disable-next-line no-undef
            this.$nextTick(() => Prism.highlightAll());
          }
        });
      },
      async saveResult() {
        const data = window.btoa(unescape(encodeURIComponent(this.jsoncode)));
        downloadHelper.download(`data:text/plain;base64,${data}`, 'jsonata-output.txt');
      },
      getJsonataToCopy() {
        return this.jsoncode;
      }
    }
  };
</script>

<style scoped>
  /* Цвета — из общей палитры представлений (presentation.css) */
  .json-result {
    position: relative;
    display: flex;
    flex-direction: column;
    min-height: 0;
    background: var(--dh-surface-alt);
  }

  /* Кнопки закреплены в углу и не уезжают при прокрутке результата */
  .json-result__actions {
    position: absolute;
    top: 8px;
    right: 16px;
    display: flex;
    gap: 2px;
    padding: 2px;
    border: 1px solid var(--dh-border);
    border-radius: var(--dh-radius);
    background: var(--dh-surface);
    /* New stacking context is needed here, because Vuetify 4 did something unnatural with the buttons and they freeze the browser in some cases if left in common context. */
    z-index: 1;
  }

  .json-result__btn {
    color: var(--dh-text-secondary);
  }

  .json-result__btn:hover {
    color: var(--dh-primary);
  }

  /* Тема Prism задает свой фон, отступы и тень текста — приводим к блокам кода в markdown */
  .json-result__code {
    flex: 1 1 auto;
    min-height: 0;
    margin: 0;
    padding: 12px 16px;
    overflow: auto;
    border: none;
    border-radius: 0;
    background: transparent;
    font-family: var(--dh-font-mono);
    font-size: 13px;
    line-height: 1.6;
  }

  .json-result__code code {
    font-family: inherit;
    font-size: inherit;
    line-height: inherit;
    text-shadow: none;
  }

  .json-result__code :deep(.token) {
    background: none;
  }

  .json-result__empty {
    padding: 16px;
    color: var(--dh-text-muted);
    font-size: 13px;
  }
</style>
