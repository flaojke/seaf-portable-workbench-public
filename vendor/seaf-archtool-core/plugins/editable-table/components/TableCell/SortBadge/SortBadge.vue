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
-->

<template>
  <div class="badge" v-bind:title="title">
    <div class="sorting-priority">{{ priority }}</div>
    <v-icon size="14" v-bind:color="null">
      {{ iconName }}
    </v-icon>
  </div>
</template>

<script>
  // Направление сортировки показывает стрелка (Т7.10): по возрастанию — вверх, по убыванию — вниз
  export default {
    props: {
      priority: {
        type: [String, Number],
        required: false,
        default: ''
      },
      direction: {
        type: String,
        required: true
      }
    },
    computed: {
      isAscending() {
        return this.direction === 'inc';
      },
      iconName() {
        return this.isAscending ? 'mdi-arrow-up' : 'mdi-arrow-down';
      },
      title() {
        const direction = this.isAscending ? 'по возрастанию' : 'по убыванию';
        return this.priority ? `Сортировка ${direction}, приоритет ${this.priority}` : `Сортировка ${direction}`;
      }
    }
  };
</script>

<style scoped>
.badge {
  display: flex;
  align-items: center;
  border-radius: 6px;
  padding: 0 2px;
  font-size: 12px;
  font-weight: 600;
  color: var(--dh-on-primary);
  background-color: var(--color-primary-focus);
}
</style>
