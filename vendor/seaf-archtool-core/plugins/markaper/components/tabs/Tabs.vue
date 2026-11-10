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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      R.Piontik <r.piontik@mail.ru> - 2023
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="mkr-tabs">
    <v-alert v-if="error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__text">{{ error }}</div>
    </v-alert>
    <!-- Переключатель виджета с заголовком выводится в строке заголовка -->
    <teleport v-if="tabs.length" v-bind:to="headerTarget || 'body'" v-bind:disabled="!headerTarget">
      <div
        ref="bar"
        class="mkr-tabs__bar"
        v-bind:class="barClasses">
        <button
          v-for="index in layout.visible"
          v-bind:key="tabs[index].src"
          type="button"
          class="mkr-tabs__tab"
          v-bind:class="{ 'mkr-tabs__tab--selected': currentTab === index }"
          v-bind:aria-pressed="isSwitcher ? currentTab === index : undefined"
          v-bind:aria-current="!isSwitcher && currentTab === index ? 'true' : undefined"
          v-bind:title="tabs[index].title"
          v-on:click="currentTab = index">
          <span
            class="mkr-tabs__title"
            v-bind:style="currentTab === index && selectedTitleWidth ? { maxWidth: `${selectedTitleWidth}px` } : null">
            {{ tabs[index].title }}
          </span>
        </button>
        <v-menu v-if="layout.hidden.length" location="bottom end">
          <template #activator="{ props: menuProps }">
            <button type="button" class="mkr-tabs__tab mkr-tabs__more" v-bind="menuProps">
              Ещё <b class="mkr-tabs__more-count">{{ layout.hidden.length }}</b>
              <v-icon class="mkr-tabs__more-icon" icon="mdi-chevron-down" size="16" v-bind:color="null" />
            </button>
          </template>
          <v-list class="dh-menu dh-menu--compact" density="compact">
            <v-list-item
              v-for="index in layout.hidden"
              v-bind:key="tabs[index].src"
              class="dh-menu__item"
              link
              v-on:click="selectFromMenu(index)">
              <v-list-item-title class="dh-menu__title">{{ tabs[index].title }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <!-- Линейка: невидимые копии всех вкладок и кнопки «Ещё» для замера ширины; выбранная
             вкладка полужирная и шире остальных -->
        <div ref="ruler" class="mkr-tabs__ruler" aria-hidden="true">
          <span
            v-for="(tab, index) in tabs"
            v-bind:key="tab.src"
            class="mkr-tabs__tab"
            v-bind:class="{ 'mkr-tabs__tab--selected': currentTab === index }">
            <span class="mkr-tabs__title">{{ tab.title }}</span>
          </span>
          <span class="mkr-tabs__tab mkr-tabs__more">
            Ещё <b class="mkr-tabs__more-count">{{ tabs.length }}</b>
            <v-icon class="mkr-tabs__more-icon" icon="mdi-chevron-down" size="16" v-bind:color="null" />
          </span>
        </div>
      </div>
    </teleport>
    <v-window v-model="currentTab" class="mkr-tabs__window">
      <v-window-item
        v-for="(tab, index) in tabs"
        v-bind:key="tab.src"
        v-bind:value="index">
        <mkrtabpane v-bind:active="currentTab === index">
          <mkrcontent v-if="tab.src" v-bind:src="tab.src" />
        </mkrtabpane>
      </v-window-item>
    </v-window>
  </div>
</template>

<script>

  import schema from '../../schema/select';
  import {
    appendParams,
    createTabsStorageKey,
    getTabIdentity,
    readStoredTabIdentity,
    resolveCurrentTab,
    writeStoredTabIdentity
  } from '../../helpers/src';
  import { frameWidth, isSwitcherKind, layoutTabs, measureTabs, sameWidths, selectedTitleWidth } from '../../helpers/tabsLayout';
  import { WIDGET_CONTEXT, claimWidgetTabs } from '@front/helpers/widgetContext';
  import MKRContent from '../elements/Content.vue';
  import MKRTabPane from './TabPane.vue';

  import ajv from 'ajv';
  const ajv_localize = require('ajv-i18n/localize/ru');
  const tabsLogger = DocHub.documents.getLoggerWithTag('markaper-tabs');


  // Ширина содержимого элемента без внутренних отступов
  const contentWidth = (element) => {
    const style = getComputedStyle(element);
    return element.clientWidth - (parseFloat(style.paddingLeft) || 0) - (parseFloat(style.paddingRight) || 0);
  };

  export default {
    name: 'MKRTabs',
    components: {
      mkrcontent: MKRContent,
      mkrtabpane: MKRTabPane
    },
    inject: {
      // Виджет сетки, в котором лежат вкладки
      widget: { from: WIDGET_CONTEXT, default: null }
    },
    props: {
      // Требуем обязательно передавать профайл документа
      profile: {
        type: Object,
        required: true
      },
      // Требуем обязательно передавать функцию получения контента
      getContent: {
        type: Function,
        required: true
      },
      // Требуем обязательно передавать функцию доступа к Data Lake
      pullData: {
        type: Function,
        required: true
      },
      // Требуем обязательно сообщать путь к объекту описывающему документ в коде
      path: {
        type: String,
        required: true
      },
      // Запрашиваем параметры рендеринга
      params: {
        type: Object,
        default: null
      },
      // Признак рендеринга для печати
      toPrint: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        currentTab: null,
        // Указатель на таймаут рефрешера
        refresher: null,
        tabs: [],
        error: null,
        // Вкладки первыми заняли виджет
        ownsWidget: false,
        // Ширины вкладок и кнопки «Ещё» замерены
        measured: false,
        widths: [],
        moreWidth: 0,
        // Ширина строки для вкладок
        available: 0,
        // Место вкладки вокруг названия: внутренние отступы и рамка вкладки
        tabFrame: 0
      };
    },
    computed: {
      // Вид задает поле kind представления: kind: switcher — переключатель
      isSwitcher() {
        return isSwitcherKind(this.profile?.kind);
      },
      // Переключатель — содержимое виджета с заголовком: он стоит в строке заголовка
      inHeader() {
        return this.isSwitcher && this.ownsWidget && !!this.widget?.isWidget && !!this.widget?.hasHeader;
      },
      // Переключатель — первая строка виджета без заголовка
      atWidgetTop() {
        return this.isSwitcher && this.ownsWidget && !!this.widget?.isWidget && !this.widget?.hasHeader;
      },
      headerTarget() {
        return this.inHeader ? this.widget.switcherTarget : null;
      },
      // Строка вкладок уходит в заголовок виджета, поэтому вид задается ее собственными классами
      barClasses() {
        return {
          'mkr-tabs__bar--switcher': this.isSwitcher,
          'mkr-tabs__bar--in-widget': !!this.widget?.isWidget,
          'mkr-tabs__bar--in-header': !!this.headerTarget,
          'mkr-tabs__bar--widget-top': this.atWidgetTop,
          'mkr-tabs__bar--measured': this.measured
        };
      },
      // Вкладки в строке и в меню «Ещё»; до замера в строке все вкладки, строка невидима
      layout() {
        if (!this.measured) return layoutTabs(this.tabs.map(() => 0), this.currentTab, 0, 0);
        return layoutTabs(this.widths, this.currentTab, this.available, this.moreWidth);
      },
      // Выбранная вкладка вместе с кнопкой «Ещё» шире строки — ее название сокращается
      selectedTitleWidth() {
        return selectedTitleWidth(this.layout, this.available, this.moreWidth, this.tabFrame);
      },
      tabsStorageKey() {
        const location = typeof window === 'undefined'
          ? ''
          : `${window.location.pathname}${window.location.search}${window.location.hash}`;

        return createTabsStorageKey(this.path, location, this.params);
      }
    },
    watch: {
      currentTab(index) {
        this.persistCurrentTab(index);
        this.scheduleMeasure();
      },
      tabs() {
        this.measured = false;
        this.$nextTick(this.observe);
      },
      headerTarget() {
        this.$nextTick(this.observe);
      },
      profile() {
        // При изменении переметров, генерируем событие обновления
        this.onRefresh();
      }
    },
    created() {
      this.widgetClaim = claimWidgetTabs(this.widget, Symbol('mkr-tabs'));
      this.ownsWidget = !!this.widgetClaim;
      if (this.inHeader) this.widgetClaim.showInHeader();
    },
    mounted() {
      // При монтировании компонента в DOM, генерируем событие обновления
      this.onRefresh();
    },
    beforeUnmount() {
      this.resizeObserver?.disconnect();
      if (this.measureFrame) cancelAnimationFrame(this.measureFrame);
      this.widgetClaim?.release();
    },
    methods: {
      // Обновляем данные модели разметки
      doRefresh() {
        this.pullData().then((result) =>{
          try {
            // Валидируем данные по структуре
            const rules = new ajv({ allErrors: true });
            const validator = rules.compile(schema);
            if (!validator(result)) {
              ajv_localize(validator.errors);
              this.error = JSON.stringify(validator.errors, null, 4);
              return;
            }
            // Если все в порядке, обновляем модель
            const storedIdentity = readStoredTabIdentity(
              this.getSessionStorage(),
              this.tabsStorageKey,
              tabsLogger
            );
            this.tabs = result.map((item) => {
              return Object.assign({}, item, {src: appendParams(item.src, item.params)});
            });
            this.error = null;
            this.currentTab = resolveCurrentTab(this.tabs, storedIdentity);
            this.persistCurrentTab(this.currentTab);
          } catch (e) {
            this.error = e;
          }
        }).catch((e) => this.error = e);
      },
      getSessionStorage() {
        if (typeof window === 'undefined') return null;

        try {
          return window.sessionStorage;
        } catch (_error) {
          return null;
        }
      },
      persistCurrentTab(index) {
        const identity = getTabIdentity(this.tabs[index]);
        writeStoredTabIdentity(
          this.getSessionStorage(),
          this.tabsStorageKey,
          identity,
          tabsLogger
        );
      },
      // Вкладка из меню встает в строку; фокус переходит на нее
      selectFromMenu(index) {
        this.currentTab = index;
        this.$nextTick(() => requestAnimationFrame(() => {
          this.$refs.bar?.querySelector(':scope > .mkr-tabs__tab--selected')?.focus();
        }));
      },
      // Следит за шириной строки и линейки: при изменении раскладка определяется заново
      observe() {
        this.resizeObserver?.disconnect();
        const bar = this.$refs.bar;
        if (!bar) return;
        // Без ResizeObserver строка измеряется один раз
        if (typeof ResizeObserver === 'undefined') {
          this.scheduleMeasure();
          return;
        }
        // Раскладку строки меняет только ширина: изменения высоты содержимого вкладки замер не запускают
        if (!this.resizeObserver) {
          this.observedWidths = new WeakMap();
          this.resizeObserver = new ResizeObserver((entries) => {
            const widthChanged = entries
              .map((entry) => {
                const changed = this.observedWidths.get(entry.target) !== entry.contentRect.width;
                this.observedWidths.set(entry.target, entry.contentRect.width);
                return changed;
              })
              .some(Boolean);
            if (widthChanged) this.scheduleMeasure();
          });
        }
        [bar.parentElement, this.$refs.ruler, this.headerTarget?.parentElement]
          .filter(Boolean)
          .forEach((element) => this.resizeObserver.observe(element));
        this.scheduleMeasure();
      },
      scheduleMeasure() {
        if (this.measureFrame) return;
        this.measureFrame = requestAnimationFrame(() => {
          this.measureFrame = null;
          this.measure();
        });
      },
      // Собирает из DOM ширины линейки, строки и заголовка для measureTabs и сохраняет результат
      measure() {
        const bar = this.$refs.bar;
        const ruler = this.$refs.ruler;
        if (!bar || !ruler) return;
        const barStyle = getComputedStyle(bar);
        const visible = !!bar.offsetParent;
        // После показа скрытой вкладки замер вызывает ResizeObserver
        const result = measureTabs({
          visible,
          parentWidth: visible ? contentWidth(bar.parentElement) : 0,
          gap: parseFloat(barStyle.columnGap) || 0,
          frame: frameWidth(barStyle),
          rulerWidths: visible ? [...ruler.children].map((element) => element.getBoundingClientRect().width) : [],
          selected: this.currentTab,
          header: visible && this.headerTarget ? this.headerRow() : null
        });
        if (!result) return;
        // Место вкладки вокруг названия — по стилю вкладки в линейке
        if (ruler.children.length > 1) this.tabFrame = frameWidth(getComputedStyle(ruler.children[0]));
        this.moreWidth = result.moreWidth;
        if (!sameWidths(this.widths, result.widths)) this.widths = result.widths;
        this.available = result.available;
        if (result.wrapped !== null) this.widgetClaim?.setWrapped(result.wrapped);
        this.measured = true;
      },
      // Строка заголовка с переключателем: ширина содержимого и ширины остальных показанных элементов
      headerRow() {
        const head = this.headerTarget.parentElement;
        const others = [...head.children].filter((element) => element !== this.headerTarget && element.offsetParent);
        return {
          width: contentWidth(head),
          gap: parseFloat(getComputedStyle(head).columnGap) || 0,
          others: others.map((element) => element.getBoundingClientRect().width)
        };
      },
      // Обработчик события обновления
      onRefresh() {
        // Если обработчик уже запущен, останавливаем его
        if (this.refresher) clearTimeout(this.refresher);
        // Для исключения избыточных обращений к Data Lake откладывам обноление на 50мс
        this.refresher = setTimeout(this.doRefresh, 50);
      }
    }
  };
</script>

<style scoped>
  /* Вкладки первого уровня: названия в строку, выбранная подчеркнута; линия под строкой
     на всю ширину блока */
  .mkr-tabs__bar {
    position: relative;
    display: flex;
    align-items: stretch;
    min-width: 0;
    height: 40px;
    margin-bottom: 16px;
    overflow: hidden;
    visibility: hidden;
    box-shadow: inset 0 -1px 0 var(--dh-border);
  }

  .mkr-tabs__bar--measured {
    visibility: visible;
  }

  /* В виджете текст первой вкладки — на отступе содержимого */
  .mkr-tabs__bar--in-widget {
    padding-left: calc(var(--dh-widget-inset) - 12px);
  }

  .mkr-tabs__tab {
    display: inline-flex;
    flex: none;
    align-items: center;
    gap: 4px;
    padding: 0 12px;
    border: 0;
    background: none;
    color: var(--dh-text-secondary);
    font: inherit;
    font-size: 0.8125rem;
    line-height: 1.2;
    white-space: nowrap;
    cursor: pointer;
  }

  .mkr-tabs__tab:hover {
    color: var(--dh-text);
  }

  .mkr-tabs__tab:focus-visible {
    outline: 2px solid var(--dh-primary);
    outline-offset: -2px;
  }

  .mkr-tabs__tab--selected,
  .mkr-tabs__tab--selected:hover {
    color: var(--dh-primary-strong);
    font-weight: 600;
    box-shadow: inset 0 -2px 0 var(--dh-primary);
  }

  .mkr-tabs__title {
    display: block;
    max-width: 260px;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .mkr-tabs__more-count {
    color: var(--dh-text);
    font-weight: 600;
  }

  .mkr-tabs__more-icon {
    color: inherit;
  }

  /* Переключатель: кнопки на общей подложке; ширина по кнопкам */
  .mkr-tabs__bar--switcher {
    display: inline-flex;
    gap: 2px;
    height: auto;
    max-width: 100%;
    margin-bottom: 12px;
    padding: 2px;
    border: 1px solid var(--dh-border);
    border-radius: 8px;
    background: var(--dh-surface-alt);
    box-shadow: none;
  }

  .mkr-tabs__bar--switcher.mkr-tabs__bar--in-widget {
    margin-right: var(--dh-widget-inset);
    margin-left: var(--dh-widget-inset);
    padding-left: 2px;
  }

  /* В виджете без заголовка переключатель стоит на месте строки заголовка */
  .mkr-tabs__bar--switcher.mkr-tabs__bar--widget-top {
    margin-top: 12px;
  }

  .mkr-tabs__bar--switcher .mkr-tabs__tab {
    height: 28px;
    border-radius: 6px;
  }

  .mkr-tabs__bar--switcher .mkr-tabs__tab--selected,
  .mkr-tabs__bar--switcher .mkr-tabs__tab--selected:hover {
    background: var(--dh-surface);
    color: var(--dh-text);
    font-weight: 500;
    box-shadow: var(--dh-shadow-raised);
  }

  /* Переключатель в строке заголовка виджета */
  .mkr-tabs__bar--switcher.mkr-tabs__bar--in-header {
    margin: 0;
  }

  /* Линейка не видна и не занимает места */
  .mkr-tabs__ruler {
    position: absolute;
    top: 0;
    left: 0;
    display: flex;
    gap: inherit;
    height: 0;
    overflow: hidden;
    visibility: hidden;
    pointer-events: none;
  }
</style>
