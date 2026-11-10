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
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
-->

<template>
  <!-- Цвет задается стилями места использования; color=null отключает глобальный цвет VIcon по умолчанию -->
  <v-icon medium v-bind:color="null" v-bind="$attrs">
    {{ iconName }}
  </v-icon>
</template>

<script>
  export default {
    props: {
      type: {
        type: String,
        required: true
      }
    },
    computed: {
      iconName() {
        switch (this.type) {
          case 'save':
            return 'mdi-content-save-outline';
          case 'add-item':
            return 'mdi-playlist-plus';
          case 'remove-item':
            return 'mdi-playlist-remove';
          case 'edit-item':
            return 'mdi-playlist-edit';
          case 'filter':
            return 'mdi-filter-outline';
          case 'filter-off':
            return 'mdi-filter-off-outline';
          case 'filter-clean':
            return 'mdi-filter-remove-outline';
          case 'arrow-up':
            return 'mdi-arrow-up-bold';
          case 'arrow-down':
            return 'mdi mdi-arrow-down-bold';
          case 'cancel':
            return 'mdi mdi-close-circle';
          case 'menu-up':
            return 'mdi mdi-menu-up';
          case 'menu-down':
            return 'mdi mdi-menu-down';
          case 'excel':
            return 'mdi mdi-microsoft-excel';
          case 'reload':
            return 'mdi mdi-reload';
          case 'creation':
            return 'mdi mdi-creation';
          case 'upload':
            return 'mdi mdi-upload';
          case 'edit':
            return 'mdi mdi-pencil';
          case 'check':
            return 'mdi mdi-check-bold';
          case 'search':
            return 'mdi mdi-magnify';
          default:
            return null;
        }
      }
    }
  };
</script>

<style scoped></style>
