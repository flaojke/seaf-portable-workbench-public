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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="bpmnjs-document-modeler">
    <div
      v-html="`
      <style>
        .bpmnjs-document-modeler .bjs-breadcrumbs {
          left: 180px !important;
          top: 34px !important;
        }
      </style>
    `" />
    <div v-bind:id="descId" class="desk" />
    <v-toolbar dense floating elevation="0" color="rgba(0, 0, 0, 0.03)" class="toolbar">
      <v-btn v-if="putContent" icon v-on:click="save">
        <v-icon>mdi-content-save</v-icon>
      </v-btn>
      <v-btn icon v-on:click="onExit(false)">
        <v-icon>mdi-exit-run</v-icon>
      </v-btn>
    </v-toolbar>
    <v-dialog
      v-model="saveRequest"
      width="500">
      <v-card>
        <v-card-title class="text-h5 grey lighten-2">
          Сохранить?
        </v-card-title>

        <v-card-text>
          В диаграмму внесены изменения. Если их не сохранить, то они будут утеряны.
        </v-card-text>

        <v-divider />

        <v-card-actions>
          <v-spacer />
          <v-btn
            text
            v-on:click="saveRequest = false; onExit(true)">
            Не сохранять
          </v-btn>
          <v-btn
            color="primary"
            text
            v-on:click="onExit(true)">
            Сохранить
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
</template>

<script>
  import BpmnModeler from 'bpmn-js/lib/Modeler';
  import BaseMixin from './BaseMixin.js';

  export default {
    mixins: [BaseMixin],
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
      }
    },
    data() {
      return {
        modeler: null,
        descId: `desc-${Date.now()}`,
        error: null,
        isChange: false,
        saveRequest: false
      };
    },
    methods: {
      async onExit(autosave) {
        if (autosave && this.isChange) await this.save();
        else if (this.isChange) {
          this.saveRequest = true;
          return;
        } else  {
          this.saveRequest = false;
        }
        this.$emit('onEdit', false);
      },

      init() {
        this.modeler = new BpmnModeler({
          container: `#${this.descId}`,
          keyboard: {
            bindTo: window
          }
        });

        this.modeler.on('element.changed', () => this.isChange = true);
      },
      applyContent(content) {
        this.modeler.importXML(content);
      },

      async save() {
        try {
          const { xml } = await this.modeler.saveXML({ format: true });
          await this.putContent(this.profile.source, xml);
          this.isChange = false;
          this.$emit('input', xml);
        } catch (err) {
          window.alert(`При сохранении возникла ошибка: ${err?.message}`);
          // eslint-disable-next-line no-console
          console.error(err);
        }
      }
    }
  };
</script>

<style scoped>
/* Холст редактора — flex-колонка на всю ширину без внутренних отступов; выходящее за край обрезается */
.desk {
  display: flex;
  flex-direction: column;
  min-height: 1000px;
  height: calc(100vh - 48px);
  width: 100%;
  max-width: none;
  padding: 0;
  position: relative;
  overflow: hidden;
}

.document {
  position: relative;
}

.toolbar {
  position: absolute;
  left: 82px;
  top: 20px;
  background-color: 0 !important;
  color: 0 !important;
  border: 1px solid rgba(0, 0, 0, 0.2) !important;
}
</style>
