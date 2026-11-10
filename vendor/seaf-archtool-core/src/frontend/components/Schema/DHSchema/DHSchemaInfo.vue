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
  <g>
    <rect
      rx="8"
      v-bind:x="x"
      v-bind:y="y"
      v-bind:width="width"
      v-bind:height="boxHeight"
      class="info" />
    <switch>
      <foreignObject
        class="info-text"
        v-bind:x="x"
        v-bind:y="y"
        v-bind:width="width"
        v-bind:height="boxHeight">
        <p>{{ text }}</p>
      </foreignObject>
      <text
        class="info-text"
        v-bind:x="x + 12"
        v-bind:y="y + 24">
        {{ text }}
      </text>
    </switch>
  </g>
</template>

<script>
  import { infoBoxHeight } from '@front/helpers/schemaInfoBox';

  export default {
    name: 'DHSchemaTrack',
    props: {
      x: {
        type: Number,
        default: 4
      },
      y: {
        type: Number,
        default: 4
      },
      width: {
        type: Number,
        default: 400
      },
      height: {
        type: Number,
        default: 48
      },
      text: {
        type: String,
        default: 'Тут пусто :('
      }
    },
    data() {
      return {
      };
    },
    computed: {
      // Высота по объему текста, чтобы длинное пояснение не обрезалось
      boxHeight() {
        return infoBoxHeight(this.text, this.width, this.height);
      }
    },
    methods: {
    }
  };

</script>

<style scoped>
/* Пояснение сценария — плашка-сведения палитры (как .dh-alert--info) */
.info {
  fill: var(--dh-status-info-bg);
  stroke: color-mix(in srgb, var(--dh-status-info-text) 30%, transparent);
  stroke-width: 1px;
  filter: drop-shadow(0 2px 6px color-mix(in srgb, var(--dh-text) 14%, transparent));
  transition: all 0.25s ease-in;
}

.info-text {
  color: var(--dh-text);
  fill: var(--dh-text);
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  transition: all 0.25s ease-in;
}

.info-text p {
  margin: 0;
  padding: 10px 12px;
}
</style>
