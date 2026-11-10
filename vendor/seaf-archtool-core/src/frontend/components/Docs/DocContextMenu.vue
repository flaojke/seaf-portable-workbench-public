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
  <v-menu
    v-model="isShow"
    v-bind:target="[x, y]"
    style="z-index: 1000"
    location="bottom start">
    <v-list class="dh-menu dh-menu--compact" density="compact">
      <div v-for="entry in entries" v-bind:key="entry.key">
        <v-divider v-if="entry.divider" class="dh-menu__divider" />
        <div v-if="entry.caption" class="dh-menu__caption">{{ entry.caption }}</div>
        <v-list-item
          v-if="entry.item"
          class="dh-menu__item"
          link
          v-on:click="entry.item.on(entry.item)">
          <template v-if="entry.item.icon" #prepend>
            <v-icon class="dh-menu__icon" v-bind:icon="entry.item.icon" size="18" v-bind:color="null" />
          </template>
          <v-list-item-title class="dh-menu__title">
            {{ entry.item.title }}
          </v-list-item-title>
        </v-list-item>
      </div>
    </v-list>
  </v-menu>
</template>

<script>
  /*
    Меню по правому клику у документов.
    Пункт: { id, title, on, icon?, group? }. null — разделитель.
    Подпись группы выводится там, где меняется group; перед новой группой ставится разделитель.
    Стили — общие стили меню (menus.css, .dh-menu--compact).
  */
  import { docContextMenuRows } from './docContextMenuState';

  export default {
    name: 'DocContextMenu',
    props: {
      items: {
        type: Array,
        default: () => []
      },
      x: {
        type: Number,
        default: 0
      },
      y: {
        type: Number,
        default: 0
      },
      modelValue: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:modelValue'],
    computed: {
      isShow: {
        get() { return this.modelValue; },
        set(value) { this.$emit('update:modelValue', value); }
      },
      // Плоский список строк меню: пункты, разделители и подписи групп
      entries() {
        return docContextMenuRows(this.items);
      }
    }
  };
</script>

