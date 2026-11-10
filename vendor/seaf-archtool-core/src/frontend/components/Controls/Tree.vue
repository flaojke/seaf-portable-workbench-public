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
      Rostislav Kabalin <kabalin2009@yandex. ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2021
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <tree-item v-bind:items="items" />
</template>

<script>
  /*
    Общее дерево: раздел «Проблемы», плагин markaper.
    Состояние раскрытия хранится здесь и передается пунктам всех уровней через provide (dhTree).
    Раздел с флагом expand в данных раскрывается при получении данных.
  */
  import TreeItem from './TreeItem.vue';
  import { expandedTreeKeys } from '@front/helpers/treeExpand';

  export default {
    name: 'Tree',
    components: {
      TreeItem
    },
    provide() {
      return {
        dhTree: {
          isExpanded: (key) => !!this.expands[key],
          setExpanded: (key, value) => {
            this.expands[key] = !!value;
          }
        }
      };
    },
    props: {
      items: { type: Array, default: () => ([]) }
    },
    data() {
      return {
        // Раскрытые разделы: ключ пункта -> true
        expands: {}
      };
    },
    watch: {
      items: {
        immediate: true,
        handler(items) {
          expandedTreeKeys(items).forEach((key) => {
            this.expands[key] = true;
          });
        }
      }
    }
  };
</script>
