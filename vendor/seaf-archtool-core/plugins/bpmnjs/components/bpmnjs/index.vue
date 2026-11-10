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
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
-->

<template>
  <div v-bind:class="styles">
    <modeler
      v-if="isEdit"
      v-bind:value="content"
      v-bind:profile="profile"
      v-bind:get-content="getContent"
      v-bind:put-content="proxyPutContent"
      v-on:input="content = $event"
      v-on:onEdit="onEdit"
      v-on:click.stop />
    <viewer
      v-else
      v-bind:value="content"
      v-bind:profile="profile"
      v-bind:get-content="getContent"
      v-bind:put-content="proxyPutContent"
      v-on:input="content = $event"
      v-on:onEdit="onEdit"
      v-on:click.stop />
    <div v-if="!isEnable" class="placeholder" v-on:click.stop="doEnable" />
  </div>
</template>

<script>
  import modeler from './Modeler.vue';
  import viewer from './Viewer.vue';
  import emptyDiagram from '!!raw-loader!../../resource/empty.bpmn';

  export default {
    components: {
      modeler,
      viewer
    },
    props: {
      // Требуем обязательно передавать профайл документа
      profile: {
        type: Object,
        required: true
      },
      // Требуем обязательно передавать функцию получения контента
      getContent: {
        type: Function,
        required: true
      },
      // Получаем функцию сохранения контента если есть
      putContent: {
        type: Function,
        default: null,
        required: false
      },
      // Шина событий
      eventBus: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        isEdit: false,
        content: emptyDiagram,
        error: null,
        source: null,
        updateCommit: 0,
        enable: false
      };
    },
    computed: {
      // Определяет активность компонента для взаимодействия
      isEnable() {
        return this.enable || this.isEdit;
      },
      // Стили диаграммы
      styles() {
        return 'bpmnjs ' + (this.isEnable ? 'enable' : '');
      },
      // Обработчик сохранения данных
      // eslint-disable-next-line vue/return-in-computed-property
      proxyPutContent() {
        if (!this.putContent) return null;
        // eslint-disable-next-line vue/no-async-in-computed-properties
        return (source, xml) => {
          return new Promise((success, reject) => {
            this.beginUpdate();
            this.putContent(source, xml)
              .then(success)
              .catch(reject);
          });
        };
      }
    },
    watch: {
      profile(value) {
        (value.source !== this.source) && this.reload();
      }
    },
    mounted() {
      this.reload();
      this.eventBus.on('on-changed-source', this.onChangedSource);
    },
    beforeUnmount() {
      this.eventBus.off('on-changed-source', this.onChangedSource);
      document.removeEventListener('click', this.doDisable);
    },
    created() {
      document.addEventListener('click', this.doDisable);
    },
    methods: {
      // Обработчик события обновления данных
      onChangedSource(source) {
        source.endsWith(this.profile.source) && this.endUpdate() && this.reload();
      },
      // Включаем интерактивный режим
      doEnable() {
        this.enable = true;
      },
      doDisable() {
        this.enable = false;
      },
      // Процесс обновления начат
      beginUpdate() {
        setTimeout(() => this.endUpdate(), 3000); // Таймаут для обновления
        return !!(++this.updateCommit);
      },
      // Процесс обновления завершен
      endUpdate() {
        return !(this.updateCommit>0 && this.updateCommit--);
      },
      // Переход в режим редактирования
      onEdit(mode) {
        this.isEdit = mode;
      },
      // Загрузка контента
      async reload() {
        this.getContent(this.profile.source)
          .then((response) => {
            this.source = this.profile.source;
            this.content = response.data || emptyDiagram;
          })
          .catch((error) => {
            this.content = emptyDiagram;
            this.error = `Ошибка загрузки файла [${this.profile.source}]: <br> ${error}</div>`;
          });
      }
    }
  };
</script>

<style scoped>

.bpmnjs {
  min-height: 400px;
  position: relative;
}

.placeholder {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
}

.bpmnjs:hover {
  margin: -1px;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
  border-radius: 4px;
}

.bpmnjs.enable,
.bpmnjs.enable:hover {
  margin: -2px;
  border: 2px solid rgba(0, 0, 0, 0.4) !important;
  border-radius: 4px;
}

</style>
