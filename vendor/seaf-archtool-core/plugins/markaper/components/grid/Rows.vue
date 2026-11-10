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
      R.Piontik <r.piontik@mail.ru> - 2023
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div v-bind:class="{ 'mkr-grid-rows--spaced': itemStyles.some(Boolean) }">
    <dhsection
      v-for="(item, index) in items"
      v-bind:key="index"
      v-bind:style="itemStyles[index]"
      v-bind:section="item" />
  </div>
</template>

<script>
  import { defineAsyncComponent } from 'vue';
  import { gridSpacing, spacingMargin } from '../../helpers/sectionStyle';

  export default {
    name: 'MKRRow',
    components: {
      dhsection: defineAsyncComponent(() => import('./Section.vue'))
    },
    props: {
      // Требуем обязательно передавать структуру секции
      items: {
        type: Array,
        required: true
      }
    },
    data() {
      return {
      };
    },
    computed: {
      // Промежуток между строками: сетка дополняет margin каждой пары соседних секций
      // до --dh-widget-gap, добавка входит в margin-top строки
      itemStyles() {
        return gridSpacing(this.items, 'rows').map((spacing) => (spacing ? spacingMargin(spacing) : null));
      }
    }
  };
</script>

<style scoped>
  /* В сетке margin соседних строк складываются */
  .mkr-grid-rows--spaced {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }
</style>
