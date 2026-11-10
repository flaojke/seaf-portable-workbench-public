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
    <dialog-header title="Данные не сохранены" />

    <div class="dh-dialog__body">
      <p class="dh-dialog__text">Сохраните или отмените изменения перед переходом.</p>

      <ul v-if="editedComponentsToLeave?.length" class="leave-tables">
        <li v-for="(comp, index) in editedComponentsToLeave" v-bind:key="index" class="leave-tables__item">
          <v-icon icon="mdi-table-edit" size="18" v-bind:color="null" />
          {{ comp.tableName || tableName }}
        </li>
      </ul>
    </div>

    <footer class="dh-dialog__footer">
      <v-btn class="dh-dialog__btn" variant="text" v-on:click="$emit('cancel')">Вернуться</v-btn>
      <v-btn class="dh-dialog__btn dh-dialog__btn--danger" variant="flat" v-on:click="$emit('leave')">
        Отменить и продолжить
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
      editedComponentsToLeave: {
        type: Array,
        requred: false,
        default: () => ([])
      },
      tableName: {
        type: String,
        required: true
      }
    },
    emits: ['leave', 'cancel']
  };
</script>

<style scoped>
.leave-tables {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.leave-tables__item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: var(--dh-radius);
  background: var(--dh-surface-alt);
  color: var(--dh-text);
  font-weight: 600;
  overflow-wrap: anywhere;
}

.leave-tables__item .v-icon {
  color: var(--dh-text-muted);
}
</style>
