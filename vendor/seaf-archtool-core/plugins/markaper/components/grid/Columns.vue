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
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2023
      Saveliy Zaznobin <zaznobins@yandex.ru> - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div
    class="mkr-grid-row"
    v-bind:class="{ 'mkr-grid-row--tracks': gridTemplateColumns }"
    v-bind:style="gridTemplateColumns">
    <dhsection
      v-for="(item, index) in items"
      v-bind:key="index"
      class="mkr-grid-col"
      v-bind:style="itemStyles[index]"
      v-bind:section="item" />
  </div>
</template>

<script>
  import { defineAsyncComponent } from 'vue';
  import { columnsSpacing, spacingMargin } from '../../helpers/sectionStyle';

  // Колонок в строке сетки без заданной ширины: grid-template-columns в стилях .mkr-grid-row
  const DEFAULT_TRACKS = 2;

  export default {
    name: 'MKRColumn',
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
      // Промежуток между колонками: сетка дополняет margin каждой пары соседних секций до
      // --dh-widget-gap. Добавка входит в margin-left колонки от соседа слева и в margin-top
      // от колонки сверху; какие добавки действуют, выбирают стили через --mkr-grid-col-extra-*:
      // колонки в строках сетки или колонки друг под другом
      itemStyles() {
        const tracks = this.gridTemplateColumns ? this.items.length : DEFAULT_TRACKS;
        return columnsSpacing(this.items, tracks).map(({ left, top, stacked }) => {
          const vertical = top || stacked;
          return {
            ...(left ? {
              '--mkr-grid-extra-left': left.extra,
              ...spacingMargin(left, 'var(--mkr-grid-col-extra-left, 0px)')
            } : {}),
            ...(top ? { '--mkr-grid-extra-top': top.extra } : {}),
            ...(stacked ? { '--mkr-grid-extra-stacked': stacked.extra } : {}),
            ...(vertical ? spacingMargin(vertical, 'var(--mkr-grid-col-extra-top, 0px)') : {})
          };
        });
      },
      gridTemplateColumns() {
        if (!this.items.some((item) => item.width)) return null;
        if (this.items.length === 1) return { 'grid-template-columns': '1fr' };
        const row = this.items.map((item) => item.width || '1fr').join(' ');
        return { 'grid-template-columns': row };
      }
    },
    methods: {
    }
  };
</script>

<style scoped>
  .mkr-grid-row {
    display: grid;
    grid-template-columns: 0.8fr 1fr;
    overflow-inline: auto;
  }
  .mkr-grid-col {
    --mkr-grid-col-extra-left: var(--mkr-grid-extra-left, 0px);
    --mkr-grid-col-extra-top: var(--mkr-grid-extra-top, 0px);
  }
  @media (max-width: 640px) {
    .mkr-grid-row {
      grid-template-columns: 1fr;
    }
    /* Колонки без заданной ширины стоят друг под другом: промежуток между ними — по вертикали */
    .mkr-grid-row:not(.mkr-grid-row--tracks) > .mkr-grid-col {
      --mkr-grid-col-extra-left: 0px;
      --mkr-grid-col-extra-top: var(--mkr-grid-extra-stacked, 0px);
    }
  }
</style>
