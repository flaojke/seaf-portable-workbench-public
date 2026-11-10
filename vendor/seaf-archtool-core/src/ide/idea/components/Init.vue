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
      Rostislav Kabalin <kabalin2009@yandex.ru>

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2024
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
-->

<template>
  <section class="init-project">
    <div class="init-project__text">
      Корневой манифест архитектуры <strong>{{ seafFileName }} (или {{ dochubFileName }})</strong> не обнаружен или не может быть загружен.
      <br><br>
      Если файл существует, пожалуйста, проверьте его содержимое на наличие ошибок. Если манифест отсутствует, воспользуйтесь помощником для его создания.
    </div>
    <div class="init-project__controls">
      <button type="button" v-on:click="initEmptyProject">
        Создать пустой файл
      </button>
      <button type="button" v-on:click="initExampleProject">
        Создать пример
      </button>
    </div>
  </section>
</template>

<script>
  import { DOCHUB_INDEX_FILE_NAME, SEAF_INDEX_FILE_NAME } from '@global/constants.mjs';

  export default {
    name: 'Empty',
    props: {
      seafFileName: {
        type: String,
        default: SEAF_INDEX_FILE_NAME
      },
      dochubFileName: {
        type: String,
        default: DOCHUB_INDEX_FILE_NAME
      }
    },
    data() {
      return {};
    },
    methods: {
      initEmptyProject() {
        window.$PAPI.initProject();
      },
      initExampleProject() {
        window.$PAPI.initProject('example');
      }
    }
  };
</script>

<style scoped>
  .init-project {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 3rem;
  }

  .init-project__text {
    max-width: 560px;
  }

  .init-project__controls {
    display: flex;
    flex-direction: column;
    flex-wrap: wrap;
    justify-content: center;
    align-items: center;
    gap: 16px;
  }

  .init-project__controls > button {
    cursor: pointer;
    max-width: 200px;
    width: fit-content;
    padding: 8px 12px;
    border: none;
    color: white;
    font-size: 14px;
    border-radius: 5px;
    background-color: #00796B;
    transition: background-color 0.3s ease;
    box-sizing: border-box;
  }

  .init-project__controls > button:hover {
    background-color: #00695c;
  }

  .init-project__controls > button:focus-visible {
    outline: 3px solid #80cbc4;
    outline-offset: 2px;
  }
</style>
