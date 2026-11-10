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
  <div
    class="mkr-grid-section"
    v-bind:class="{ 'mkr-grid-section--widget': widget.isWidget }"
    v-bind:style="style.section">
    <div
      v-if="widget.hasHeader"
      class="section-head"
      v-bind:class="{
        'section-head--switcher-inline': widget.headerSwitcher && !widget.switcherWrapped,
        'section-head--switcher-wrapped': widget.switcherWrapped
      }">
      <v-icon v-if="section.icon" class="section-head__icon" v-bind:color="null">{{ icon }}</v-icon>
      <span v-if="section.title" class="section-head__title">{{ section.title }}</span>
      <span v-if="headerTable?.ready && headerTable.total" class="section-head__count">{{ headerTable.total }}</span>
      <!-- Сюда вкладки содержимого выводят переключатель -->
      <div v-if="widget.headerSwitcher" ref="switcherSlot" class="section-head__switcher" />
      <div
        v-if="headerTable?.hasSearch || headerTable?.canExport"
        class="section-head__tools"
        v-bind:class="{
          'section-head__tools--search': headerTable.hasSearch,
          'section-head__tools--export': headerTable.canExport
        }">
        <v-text-field
          v-if="headerTable.hasSearch"
          v-model="headerSearch"
          class="section-head__search"
          prepend-inner-icon="mdi-magnify"
          placeholder="Поиск"
          aria-label="Поиск по таблице"
          density="compact"
          variant="outlined"
          single-line
          clearable
          hide-details />
        <v-btn
          v-if="headerTable.canExport"
          class="section-head__action"
          v-bind:disabled="headerTable.reloading"
          icon
          variant="text"
          size="small"
          title="Выгрузить в Excel"
          aria-label="Выгрузить в Excel"
          v-on:click="headerTable.exportToExcel()">
          <v-icon icon="mdi-microsoft-excel" size="20" v-bind:color="null" />
        </v-btn>
      </div>
    </div>
    <mkrcontent v-if="isContent" v-bind:src="src" v-bind:style="style.content" />
    <template v-else>
      <mkrcolumns
        v-if="(section.type || '').toLowerCase()==='columns'"
        v-bind:items="items" />
      <mkrrows
        v-if="(section.type || '').toLowerCase()==='rows'"
        v-bind:items="items" />
    </template>
  </div>
</template>

<script>
  import MKRColumns from './Columns.vue';
  import MKRContent from '../elements/Content.vue';
  import MKRRows from './Rows.vue';
  import { appendParams } from '../../helpers/src';
  import { isWidgetSection, sectionStyles } from '../../helpers/sectionStyle';
  import { WIDGET_CONTEXT, headerTable as findHeaderTable } from '@front/helpers/widgetContext';

  export default {
    name: 'MKRSection',
    components: {
      mkrcolumns: MKRColumns,
      mkrrows: MKRRows,
      mkrcontent: MKRContent
    },
    provide() {
      return {
        [WIDGET_CONTEXT]: this.widget
      };
    },
    props: {
      // Требуем обязательно передавать структуру секции
      section: {
        type: Object,
        required: true
      }
    },
    data() {
      const section = () => this.section;
      return {
        // Контекст виджета для вложенных документов: таблица выводит число строк и кнопку Excel
        // в заголовке секции. Признаки виджета и заголовка вычисляются по секции при чтении
        widget: {
          get isWidget() {
            return isWidgetSection(section());
          },
          get hasHeader() {
            return !!(section().title || section().icon);
          },
          tables: [],
          tabsOwner: null,
          headerSwitcher: false,
          switcherTarget: null,
          switcherWrapped: false
        }
      };
    },
    computed: {
      style() {
        return sectionStyles(this.section.style);
      },
      // Таблица, число строк и кнопка Excel которой выводятся в заголовке секции
      headerTable() {
        return findHeaderTable(this.widget);
      },
      // Поисковый запрос таблицы, поле которой выводится в заголовке
      headerSearch: {
        get() {
          return this.headerTable?.search || '';
        },
        set(value) {
          if (this.headerTable) this.headerTable.search = value;
        }
      },
      // NOTE: У иконок появился префикс mdi, нужно менять названия в метамодели.
      // Чтобы избежать этого сделал алиасы.
      icon() {
        const aliases = {
          description: 'mdi-file-document-outline',
          settings: 'mdi-cog'
        };

        return aliases[this.section.icon] || this.section.icon;
      },
      isObject() {
        return (this.section?.src || '').slice(0, 1) === '@';
      },
      src() {
        return appendParams(this.section.src, this.section.params);
      },
      isContent() {
        return !!this.section?.src;
      },
      items() {
        return this.section?.items || [];
      }
    },
    watch: {
      'widget.headerSwitcher'() {
        this.$nextTick(this.bindSwitcherSlot);
      }
    },
    mounted() {
      this.bindSwitcherSlot();
    },
    methods: {
      // Отдает вкладкам содержимого место для переключателя в строке заголовка
      bindSwitcherSlot() {
        this.widget.switcherTarget = this.$refs.switcherSlot || null;
      }
    }
  };
</script>

<style scoped>
  .mkr-grid-section > .dochub-object {
    margin: 0 !important;
    position: relative;
  }

  /* Заголовок виджета — на отступе от края; у виджета с рамкой и без нее расположение одинаково */
  .section-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    row-gap: 4px;
    min-height: 52px;
    padding: 12px calc(var(--dh-widget-inset) - 8px) 4px var(--dh-widget-inset);
    color: var(--dh-text);
  }

  .section-head__title {
    min-width: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    line-height: 1.4;
  }

  .section-head__icon {
    font-size: 20px;
    color: var(--dh-text-secondary);
  }

  .section-head__count {
    flex: none;
    white-space: nowrap;
    font-size: 0.8125rem;
    color: var(--dh-text-muted);
    font-variant-numeric: tabular-nums;
  }

  /* Переключатель вкладок занимает свободное место между названием и панелью таблицы
     и прижат к панели */
  .section-head__switcher {
    display: flex;
    flex: 1 1 0;
    justify-content: flex-end;
    min-width: 0;
  }

  /* Переключатель не поместился рядом с названием — вторая строка заголовка */
  .section-head--switcher-wrapped .section-head__switcher {
    flex-basis: 100%;
    justify-content: flex-start;
    order: 1;
  }

  /* Поиск и Excel — одна группа справа; если рядом с названием ей не хватает места, она целиком
     переходит на вторую строку заголовка */
  .section-head__tools {
    display: flex;
    flex: 0 1 auto;
    align-items: center;
    gap: 4px;
    min-width: 0;
    margin-left: auto;
  }

  /* С полем поиска панель переходит на вторую строку, только когда рядом с названием
     не помещается поле шириной 140px с кнопкой Excel. Если места больше, панель растягивается
     до полной ширины, а поле — до 200px */
  .section-head__tools--search {
    flex: 1 1 140px;
    max-width: max-content;
  }

  .section-head__tools--search.section-head__tools--export {
    flex-basis: calc(140px + 4px + 40px);
  }

  /* Пока переключатель стоит в строке названия, панель таблицы — полной ширины: место для вкладок
     освобождают сначала они сами (меню «Ещё», вторая строка заголовка), затем поле поиска */
  .section-head--switcher-inline .section-head__tools--search {
    flex: none;
  }

  .section-head__search {
    flex: 0 1 auto;
    width: 200px;
    min-width: 140px;
  }

  .section-head__search :deep(.v-field__input) {
    min-height: 32px;
    padding-top: 4px;
    padding-bottom: 4px;
  }

  .section-head__action {
    flex: none;
    color: var(--dh-text-secondary);
  }

  .section-head__action:hover,
  .section-head__action:focus-visible {
    color: var(--dh-primary);
  }
</style>
