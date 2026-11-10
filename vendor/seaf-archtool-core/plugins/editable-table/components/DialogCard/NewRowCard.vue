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
  <v-card class="dh-dialog">
    <dialog-header title="Новая строка" closable v-on:close="onClickCancel" />
    <div class="dh-dialog__body">
      <v-text-field
        v-model="value"
        label="Идентификатор строки"
        variant="outlined"
        density="comfortable"
        color="primary"
        autofocus
        v-bind:rules="rules"
        hide-details="auto" />
    </div>
    <footer class="dh-dialog__footer">
      <v-btn class="dh-dialog__btn" variant="text" v-on:click="onClickCancel">Отменить</v-btn>
      <v-btn
        class="dh-dialog__btn"
        color="primary"
        variant="flat"
        v-bind:disabled="hasError"
        v-on:click="onClickSave">
        Сохранить
      </v-btn>
    </footer>
  </v-card>
</template>

<script>
  import DialogHeader from '@front/components/Controls/DialogHeader.vue';

  export default {
    components: {
      DialogHeader
    },
    props: {
      tableRows: {
        type: Array,
        required: true
      }
    },
    emits: ['click-save', 'click-cancel'],
    data() {
      return {
        value: '',
        rules: [
          value => !!value?.trim() || 'Не может быть пустым.',
          value => !this.tableRows.includes(value.trim()) || 'Строка с таким идентификатором уже существует'
        ]
      };
    },
    computed: {
      hasError() {
        for (let i = 0; i < this.rules.length; i++) {
          const rule = this.rules[i];
          if (!(rule(this.value) === true)) {
            return true;
          }
        }
        return false;
      }
    },

    methods: {
      onClickSave() {
        this.$emit('click-save', this.value);
      },
      onClickCancel() {
        this.$emit('click-cancel');
      }
    }
  };
</script>
