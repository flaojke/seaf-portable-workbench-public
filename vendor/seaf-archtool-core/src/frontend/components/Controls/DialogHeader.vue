<!--
  Copyright (C) 2026 Sber

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
      Konstantin Myachin <kvmyachin@gmail.com>, Sber

  Contributors:
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <header class="dh-dialog__header">
    <h2 class="dh-dialog__title">{{ title }}</h2>
    <v-btn
      v-if="closable"
      class="dh-dialog__close"
      icon
      variant="text"
      size="small"
      title="Закрыть"
      aria-label="Закрыть"
      v-on:click="$emit('close')">
      <v-icon icon="mdi-close" size="20" v-bind:color="null" />
    </v-btn>
  </header>
</template>

<script>
  /*
    Шапка диалога в общем стиле (dialogs.css): заголовок и крестик «Закрыть».
    Крестик — только у окон, которые закрываются без потери данных (closable);
    у окон ожидания и окна ухода со страницы его нет.
  */
  export default {
    name: 'DialogHeader',
    props: {
      title: {
        type: String,
        required: true
      },
      closable: {
        type: Boolean,
        default: false
      }
    },
    emits: ['close']
  };
</script>
