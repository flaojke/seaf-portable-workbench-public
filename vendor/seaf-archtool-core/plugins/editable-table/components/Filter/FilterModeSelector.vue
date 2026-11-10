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
  <v-expansion-panels v-model="panel" class="modes" flat>
    <v-expansion-panel>
      <v-expansion-panel-title class="panel-header">
        {{ modesNameMap[mode] }}
      </v-expansion-panel-title>
      <v-expansion-panel-text class="panel-content">
        <div class="settings">
          <label
            v-for="item in filtrationModes"
            v-bind:key="item"
            class="mode-item"
            v-bind:class="{
              'mode-item_selected': item === mode
            }">
            <input type="radio" class="radio" name="radio" v-bind:checked="item === mode" v-on:change="$emit('change', item)">
            <span class="mode-text">{{ modesNameMap[item] }}</span>
            <v-icon
              v-if="item === mode"
              class="mode-check"
              icon="mdi-check"
              size="16"
              v-bind:color="null" />
          </label>
        </div>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>
</template>

<script>
  import { FILTRATION_MODES_NAMES, FILTRATION_MODES_NAMES_OVERRIDES } from '../../lib/const';

  export default {
    props: {
      mode: {
        type: String,
        required: true
      },
      filtrationModes: {
        type: Array,
        required: true
      },
      header: {
        type: Object,
        required: true
      }
    },
    emits: ['change'],
    data() {
      return {
        panel: 0
      };
    },
    computed: {
      modesNameMap() {
        const override = FILTRATION_MODES_NAMES_OVERRIDES?.[this.header.type] ?? {};
        return { ...FILTRATION_MODES_NAMES, ...override };
      }
    }
  };
</script>

<style scoped>
.modes :deep(.v-expansion-panel) {
  border: 1px solid var(--dh-border-strong);
  border-radius: 6px;
  background: var(--dh-surface);
}

.panel-header.v-expansion-panel-title {
  min-height: 36px;
  padding: 6px 10px;
  color: var(--dh-text);
  font-size: 13px;
  font-weight: 600;
}

.panel-header :deep(.v-expansion-panel-title__overlay) {
  display: none;
}

.panel-content:deep(.v-expansion-panel-text__wrapper) {
  padding: 0 4px 4px;
}

.settings {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.mode-item {
  display: flex;
  align-items: center;
  gap: 8px;
  min-height: 30px;
  padding: 5px 8px;
  border-radius: 6px;
  color: var(--dh-text);
  font-size: 13px;
  line-height: 18px;
  cursor: pointer;
}

.mode-item:hover {
  background-color: var(--dh-surface-hover);
}

.mode-text {
  flex: 1 1 auto;
}

.mode-check {
  flex: none;
  color: var(--dh-primary);
}

.radio {
  display: none;
}

.mode-item_selected,
.mode-item_selected:hover {
  background-color: var(--dh-primary-soft);
  color: var(--dh-primary-strong);
  font-weight: 600;
}
</style>
