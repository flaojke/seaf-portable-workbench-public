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

<!-- Содержимое вкладки: сообщает вложенным документам, открыта ли вкладка. Вкладка открыта,
     если открыта она сама и вкладка, в которую она вложена. -->
<template>
  <div class="mkr-tab-pane">
    <slot />
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';
  import { WIDGET_TAB, type WidgetTab, nestedTab } from '@front/helpers/widgetContext';

  export default defineComponent({
    name: 'MKRTabPane',
    inject: {
      parentTab: { from: WIDGET_TAB, default: null }
    },
    provide() {
      return {
        [WIDGET_TAB]: nestedTab(() => this.active, this.parentTab as WidgetTab | null)
      };
    },
    props: {
      // Вкладка открыта
      active: {
        type: Boolean,
        default: false
      }
    }
  });
</script>

<style scoped>
  /* Отступ от строки вкладок до содержимого задает строка вкладок */
  .mkr-tab-pane > :deep(.dochub-object) {
    margin: 0 !important;
  }
</style>
