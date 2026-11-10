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
  <!-- Окно выносится из корня плагина, поэтому цвета плагина подключаются здесь -->
  <v-card class="dh-dialog editable-table-colors">
    <dialog-header title="Заполнить выбранные строки" closable v-on:close="onClickCancel" />

    <div class="dh-dialog__body">
      <p class="dh-dialog__text">Отметьте столбцы и задайте значения — они будут записаны во все выбранные строки.</p>

      <label class="fill-select fill-select--all">
        <dh-checkbox v-bind:checked="selected.length === editableHeaders.length" v-on:change="onSelectAll" />
        Выбрать все
        <span class="fill-count">{{ selected.length }} из {{ editableHeaders.length }}</span>
      </label>

      <div class="fill-list">
        <div v-for="header in editableHeaders" v-bind:key="header.headerID" class="fill-item">
          <label class="fill-select">
            <dh-checkbox
              v-bind:id="header.headerID"
              v-bind:checked="selected.includes(header.headerID)"
              v-on:change="onSelect(header.headerID)" />
            {{ header.text }}
          </label>
          <cell-body v-bind:header="header" v-bind:row="data" class="cell cell_body" />
        </div>
      </div>
    </div>

    <footer class="dh-dialog__footer">
      <v-btn class="dh-dialog__btn" variant="text" v-on:click="onClickCancel">Отменить</v-btn>
      <v-btn
        class="dh-dialog__btn"
        color="primary"
        variant="flat"
        v-bind:disabled="selected.length === 0"
        v-on:click="onClickSave">
        Сохранить
      </v-btn>
    </footer>
  </v-card>
</template>

<script>
  import DialogHeader from '@front/components/Controls/DialogHeader.vue';
  import Checkbox from '../TableCell/Checkbox/Checkbox.vue';
  import CellBody from '../TableCell/CellBody.vue';

  export default {
    components: {
      DialogHeader,
      'dh-checkbox': Checkbox,
      CellBody
    },
    props: {
      headers: {
        type: Array,
        required: true
      }
    },
    emits: ['click-save', 'click-cancel'],
    data() {
      return {
        data: {},
        selected: []
      };
    },
    computed: {
      editableHeaders() {
        return this.headers.filter(({ editable }) => Boolean(editable));
      }
    },
    methods: {
      onSelect(id) {
        this.selected = this.selected.includes(id)
          ? this.selected.filter((item) => item !== id)
          : [...this.selected, id];
      },
      onSelectAll() {
        this.selected =
          this.selected.length < this.editableHeaders.length
            ? this.editableHeaders.map(({ headerID }) => headerID)
            : [];
      },
      resetData() {
        this.selected = [];
        this.data = {};
      },
      onClickSave() {
        this.$emit('click-save', this.selected, this.data);
        this.resetData();
      },
      onClickCancel() {
        this.$emit('click-cancel');
        this.resetData();
      }
    }
  };
</script>

<style scoped>
.fill-select {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--dh-text);
  cursor: pointer;
}

.fill-select--all {
  padding: 0 0 10px;
  border-bottom: 1px solid var(--dh-border);
  font-weight: 600;
}

.fill-count {
  margin-left: auto;
  color: var(--dh-text-muted);
  font-weight: 400;
}

.fill-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding-top: 12px;
}

.fill-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.cell {
  position: relative;
  min-height: 32px;
  border: 1px solid var(--dh-border-strong);
  border-radius: var(--dh-radius);
  background: var(--dh-surface);
}

.cell > :first-child {
  min-height: 100%;
  padding: 4px 8px;
}

.cell.cell_editable:hover:not(:focus-within) {
  border-color: var(--dh-primary);
  border-style: dashed;
}

.cell:focus-within {
  border-color: var(--dh-primary);
  box-shadow: 0 0 0 1px var(--dh-primary);
}
</style>
