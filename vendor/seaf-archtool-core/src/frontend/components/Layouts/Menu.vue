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
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025, 2026
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <nav class="dh-nav" aria-label="Меню">
    <errexp v-if="error" v-bind:error="error" />
    <template v-else>
      <!-- Поиск по меню закреплен над деревом и не уезжает при прокрутке -->
      <div class="dh-nav__head">
        <v-text-field
          class="dh-nav__filter"
          density="compact"
          variant="outlined"
          rounded="lg"
          hide-details
          clearable
          spellcheck="false"
          autocomplete="off"
          placeholder="Найти в меню"
          v-bind:model-value="filter.text"
          v-on:update:model-value="inputFilter"
          v-on:keydown.esc="inputFilter('')">
          <template #prepend-inner>
            <v-icon class="dh-nav__filter-icon" icon="mdi-magnify" size="18" v-bind:color="null" />
          </template>
        </v-text-field>
        <v-btn
          class="dh-nav__collapse"
          icon
          variant="text"
          size="small"
          title="Свернуть все разделы"
          aria-label="Свернуть все разделы"
          v-bind:disabled="!canCollapse"
          v-on:click="collapseAll">
          <v-icon icon="mdi-unfold-less-horizontal" size="18" v-bind:color="null" />
        </v-btn>
      </div>

      <div
        ref="tree"
        class="dh-nav__tree"
        v-on:wheel.passive="stopKeepingSelectedInView"
        v-on:touchstart.passive="stopKeepingSelectedInView"
        v-on:pointerdown="stopKeepingSelectedInView"
        v-on:keydown="stopKeepingSelectedInView">
        <v-list v-if="treeItems.length" density="compact" class="dh-nav__list">
          <v-list-item
            v-for="item in treeItems"
            v-bind:key="item.location"
            v-bind:href="item.route"
            v-bind:class="itemClasses(item)"
            v-bind:style="{ '--dh-nav-level': item.level }"
            v-bind:aria-current="isMenuItemSelected(item) ? 'page' : undefined"
            v-bind:aria-expanded="item.isGroup ? String(isExpandItem(item)) : undefined"
            v-on:dragstart.prevent
            v-on:keydown.right.prevent="expandItem(item, true)"
            v-on:keydown.left.prevent="expandItem(item, false)"
            v-on:click.prevent="onClickMenuItem($event, item)">
            <template #prepend>
              <span
                class="dh-nav__toggle"
                v-bind:class="{ 'dh-nav__toggle--group': item.isGroup, 'dh-nav__toggle--open': isExpandItem(item) }"
                v-on:click.prevent.stop="onClickMenuExpand(item)">
                <v-icon v-if="item.isGroup" icon="mdi-menu-right" size="18" v-bind:color="null" />
              </span>
            </template>

            <v-list-item-title class="dh-nav__title">
              <component
                v-bind:is="part.match ? 'mark' : 'span'"
                v-for="(part, p) in titleParts(item.title)"
                v-bind:key="p"
                v-bind:class="{ 'dh-nav__match': part.match }">
                {{ part.text }}
              </component>
            </v-list-item-title>

            <template v-if="item.icon" #append>
              <v-icon class="dh-nav__icon" v-bind:icon="iconName(item.icon)" size="18" v-bind:color="null" />
            </template>
          </v-list-item>
        </v-list>
        <div v-else-if="filter.query" class="dh-nav__empty">
          Ничего не найдено
          <span class="dh-nav__empty-hint">Все слова запроса ищутся в названии пункта и его разделов</span>
        </div>
      </div>

      <!-- Служебные пункты ядра всегда видны внизу, независимо от длины дерева и фильтра -->
      <v-list v-if="serviceItems.length" density="compact" class="dh-nav__service">
        <v-list-item
          v-for="item in serviceItems"
          v-bind:key="item.location"
          v-bind:href="item.route"
          v-bind:class="itemClasses(item)"
          v-bind:aria-current="isMenuItemSelected(item) ? 'page' : undefined"
          v-on:dragstart.prevent
          v-on:click.prevent="onClickMenuItem($event, item)">
          <template #prepend>
            <v-icon class="dh-nav__icon" v-bind:icon="iconName(item.icon)" size="18" v-bind:color="null" />
          </template>
          <v-list-item-title class="dh-nav__title">{{ item.title }}</v-list-item-title>
          <template v-if="item.route === '/problems' && problemsCount" #append>
            <span class="dh-nav__badge" v-bind:title="`Отклонений: ${problemsCount}`">{{ problemsCount }}</span>
          </template>
        </v-list-item>
      </v-list>
    </template>
  </nav>
</template>

<script>
  import uri from '@front/helpers/uri';
  import errexp from '@front/components/JSONata/JSONataErrorExplainer.vue';
  import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
  import { buildMenuTree, isOnMenuTrail, menuFilterTerms, menuIconName, menuRows, splitMenuItems } from '@front/helpers/menuTree';
  import { highlightMatches } from '@front/helpers/highlightMatches';
  import { findBestMenuItem, menuRouteMatches } from '@front/components/ArchSwitcher/breadcrumbs';
  import { loadUserMenu } from '@front/components/ArchSwitcher/userMenuCache';

  const logger = getLoggerWithTag('Menu.vue');

  export default {
    name: 'Menu',
    components: {
      errexp
    },
    data() {
      return {
        // Открытые пункты меню
        currentRoute: this.$router.currentRoute,
        error: null,
        treeMenu: null,
        treeMenuRequestId: 0,
        filter: {
          text: '',
          query: '',
          timer: null
        },
        menuCache: null,
        // Выбранный пункт удерживается в видимой области, пока пользователь сам не прокрутил дерево
        keepSelectedInView: false,
        treeResizeObserver: null,
        expands: {
          architect: true,
          docs: true
        }
      };
    },
    computed: {
      // Выясняем сколько значимых отклонений зафиксировано
      // исключения не учитываем
      problemsCount() {
        let result = 0;
        this.problems.map((validator) => {
          (validator.items || []).map((problem) =>
            !problem.exception && result++
          );
        });
        return result;
      },
      problems() {
        return this.$store.state.problems || [];
      },
      // Момент загрузки манифеста: меняется при каждой загрузке, в том числе при обновлении манифеста на месте
      manifestMoment() {
        return this.$store.state.moment;
      },
      menu() {
        return menuRows(this.treeMenu, (location) => !!this.expands[location] || !!this.filter.query);
      },
      treeItems() {
        return this.menu;
      },
      // Служебные пункты ядра всегда видны внизу меню; «Проблемы» — только если проблемы есть
      serviceItems() {
        return splitMenuItems(this.menuCache).service
          .filter((item) => (item.route !== '/problems') || this.problems.length);
      },
      // Расположение текущего пункта: его предки выделяются в дереве как путь к странице.
      selectedLocation() {
        return findBestMenuItem(this.menuCache, this.currentRoute)?.location || null;
      },
      canCollapse() {
        return !this.filter.query && this.menu.some((item) => item.isGroup && this.expands[item.location]);
      },
      filterTerms() {
        return menuFilterTerms(this.filter.query);
      }
    },
    watch: {
      manifestMoment() {
        this.menuCache = null;
        this.refreshTreeMenu();
      },
      $route(to) {
        this.currentRoute = to;
        this.refreshTreeMenu(true);
      },
      'filter.query'() {
        this.stopKeepingSelectedInView();
        this.refreshTreeMenu();
      },
      'filter.text'(value) {
        if (this.filter.timer) clearTimeout(this.filter.timer);

        const len = (this.menuCache || []).length;
        let sens = 50;

        if (len > 1000) sens = 500;
        else if (len > 500) sens = 300;

        this.filter.timer = setTimeout(() => {
          this.filter.query = value && value.length > 1 ? value.toLocaleLowerCase() : '';
        }, sens);
      }
    },
    mounted() {
      this.refreshTreeMenu(true);
    },
    beforeUnmount() {
      this.treeResizeObserver?.disconnect();
    },
    methods: {
      async buildTreeMenu() {
        const result = { items: {} };
        const requestId = this.treeMenuRequestId;
        try {
          const dataset = this.menuCache || await loadUserMenu(this.manifest, this.manifestMoment);
          if (requestId !== this.treeMenuRequestId) return result;
          if (!this.menuCache) this.menuCache = dataset;
          const route = this.currentRoute;

          logger.debug(() => [
            'build menu tree',
            {title: 'menu dataset', obj: dataset},
            {title: 'filter', obj: this.filter}
          ]);

          // Дерево строится только из пунктов метамодели; служебные пункты выводятся внизу (serviceItems).
          // Пункт метамодели с тем же location, что у служебного, остается в дереве отдельным узлом
          const { tree, expand } = buildMenuTree(
            splitMenuItems(dataset).tree,
            (location) => this.isInFilter(location),
            (itemRoute) => menuRouteMatches(itemRoute, route)
          );
          result.items = tree.items;
          // Путь к текущему пункту раскрывается после отрисовки дерева
          expand.length && this.$nextTick(() => {
            if (this.currentRoute !== route) return;
            expand.forEach((location) => {
              if (!this.expands[location]) this.expands[location] = true;
            });
          });
          this.error = null;
        } catch (err) {
          if (requestId !== this.treeMenuRequestId) return result;
          logger.error(() => 'Error when build menu tree', err);
          this.error = err;
        }
        return result;
      },
      async refreshTreeMenu(scrollToSelected = false) {
        const requestId = ++this.treeMenuRequestId;
        const treeMenu = await this.buildTreeMenu();

        if (requestId === this.treeMenuRequestId) {
          this.treeMenu = treeMenu;
          scrollToSelected && this.scrollToSelected();
        }
      },
      // Путь к текущему пункту раскрывается в $nextTick (buildTreeMenu), поэтому ждем отрисовку.
      // Одной прокрутки мало: высота дерева меняется и позже (например, после загрузки проблем внизу
      // появляется пункт «Проблемы»), поэтому при каждом изменении размера пункт снова возвращается в видимую область
      scrollToSelected() {
        this.keepSelectedInView = true;
        this.$nextTick(() => this.$nextTick(() => {
          this.observeTreeSize();
          this.revealSelected();
        }));
      },
      revealSelected() {
        if (!this.keepSelectedInView) return;
        this.$refs.tree?.querySelector('.dh-nav__item--selected')?.scrollIntoView({ block: 'nearest' });
      },
      // Следим и за областью дерева, и за самим списком: меняться может любой из них
      observeTreeSize() {
        const tree = this.$refs.tree;
        if (!tree || (typeof ResizeObserver === 'undefined')) return;
        if (!this.treeResizeObserver) this.treeResizeObserver = new ResizeObserver(() => this.revealSelected());
        this.treeResizeObserver.disconnect();
        this.treeResizeObserver.observe(tree);
        tree.firstElementChild && this.treeResizeObserver.observe(tree.firstElementChild);
      },
      stopKeepingSelectedInView() {
        this.keepSelectedInView = false;
      },
      // При поиске раскрыты все группы, треугольник это показывает
      isExpandItem(item) {
        return !!item.isGroup && (!!this.filter.query || !!this.expands[item.location]);
      },
      isOnTrail(item) {
        return isOnMenuTrail(item.location, this.selectedLocation);
      },
      itemClasses(item) {
        return {
          'dh-nav__item': true,
          'dh-nav__item--root': item.level === 0,
          'dh-nav__item--selected': this.isMenuItemSelected(item),
          'dh-nav__item--trail': this.isOnTrail(item)
        };
      },
      // Название пункта, разбитое на фрагменты с отметкой совпадений со словами поиска
      titleParts(title) {
        return highlightMatches(title, this.filterTerms);
      },
      // Иконки в метамодели задаются и в MDI (mdi-*), и в Material Icons (description и т.п.)
      iconName(icon) {
        return menuIconName(icon);
      },
      expandItem(item, value) {
        if (!item.isGroup || this.filter.query) return;
        this.expands[item.location] = value;
      },
      collapseAll() {
        this.expands = {};
      },
      // Прокладка сделана т.к. инпут с v-model тупит при большом меню
      inputFilter(text) {
        this.filter.text = text;
      },
      isInFilter(text) {
        if (!this.filter.query) return true;
        const struct = this.filter.query.split(' ');
        const request = text.toLocaleLowerCase();
        for (let i = 0; i < struct.length; i++) {
          if (struct[i] && (request.indexOf(struct[i]) < 0)) return false;
        }
        return true;
      },
      isMenuItemSelected(item) {
        return menuRouteMatches(item.route, this.currentRoute);
      },
      onClickMenuItem($event, item) {
        if (item.route) {
          if (uri.isExternalURI(item.route)) {
            window.open(item.route, '_blank');
          } else {
            if ($event.ctrlKey || $event.metaKey) {
              const routeData = this.$router.resolve(item.route);
              window.open(routeData.href, '_blank');
            } else {
              this.$router.push(item.route).catch(() => null);
            }
          }
        } else this.onClickMenuExpand(item);
      },
      onClickMenuExpand(item) {
        if (!item.isGroup || this.filter.query) return;
        this.expands[item.location] = !this.expands[item.location];
      },
      //отрабатывает при клике на элементе меню
      getLevel(item) {
        return item.route.split('/').length;
      }
    }
  };
</script>

<style scoped>
  /*
    Цвета меню — из общей палитры представлений (presentation.css).
    Стили Vuetify лежат в CSS-слоях, поэтому scoped-правила перекрывают их без !important.
  */
  .dh-nav {
    display: flex;
    flex-direction: column;
    height: 100%;
    color: var(--dh-text);
    background: var(--dh-surface);
  }

  .dh-nav__head {
    flex: none;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 12px 6px 8px 12px;
  }

  .dh-nav__filter {
    flex: 1 1 auto;
  }

  .dh-nav__filter :deep(.v-field) {
    font-size: 13px;
    background: var(--dh-surface);
  }

  .dh-nav__filter :deep(.v-field__outline) {
    --v-field-border-opacity: 1;
    color: var(--dh-border-strong);
  }

  .dh-nav__filter :deep(.v-field--focused .v-field__outline) {
    color: var(--dh-primary);
  }

  .dh-nav__filter-icon {
    color: var(--dh-text-muted);
  }

  .dh-nav__collapse {
    flex: none;
    color: var(--dh-text-secondary);
  }

  .dh-nav__tree {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    scrollbar-gutter: stable;
    scrollbar-width: thin;
    scrollbar-color: var(--dh-border-strong) transparent;
  }

  .dh-nav__list,
  .dh-nav__service {
    padding: 0 0 8px;
    background: transparent;
    color: inherit;
  }

  .dh-nav__item {
    --dh-nav-indent: 12px;

    min-height: 32px;
    margin: 0 8px;
    padding: 7px 8px 7px calc(4px + var(--dh-nav-level, 0) * var(--dh-nav-indent));
    border-radius: var(--dh-radius);
    color: var(--dh-text);
  }

  /*
    Направляющие уровней: по линии под треугольником каждого предка.
    Треугольник уровня N центрирован на 4px + N * 12px + 10px от края пункта.
  */
  .dh-nav__item::before {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 14px;
    width: calc(var(--dh-nav-level, 0) * var(--dh-nav-indent));
    background-image: repeating-linear-gradient(
      to right,
      var(--dh-border) 0 1px,
      transparent 1px var(--dh-nav-indent)
    );
    pointer-events: none;
  }

  /* Наведение и фокус пункта — цвета палитры; подложка и рамка фокуса Vuetify скрыты */
  .dh-nav__item :deep(.v-list-item__overlay),
  .dh-nav__item::after {
    display: none;
  }

  .dh-nav__item:hover {
    background: var(--dh-surface-hover);
  }

  .dh-nav__item:focus-visible {
    outline: 2px solid var(--dh-primary);
    outline-offset: -2px;
  }

  .dh-nav__item--selected,
  .dh-nav__item--selected:hover {
    background: var(--dh-primary-soft);
    box-shadow: inset 3px 0 0 var(--dh-primary);
    color: var(--dh-primary-strong);
  }

  /* Треугольник и иконка — по первой строке переносящегося названия */
  .dh-nav__item :deep(.v-list-item__prepend),
  .dh-nav__item :deep(.v-list-item__append) {
    align-self: start;
  }

  .dh-nav__item :deep(.v-list-item__spacer) {
    width: 4px;
  }

  .dh-nav__title {
    font-size: 13px;
    font-weight: 400;
    line-height: 18px;
    letter-spacing: normal;
    white-space: normal;
    overflow: visible;
    overflow-wrap: break-word;
    text-wrap: pretty;
  }

  .dh-nav__item--root .dh-nav__title,
  .dh-nav__item--trail .dh-nav__title,
  .dh-nav__item--selected .dh-nav__title {
    font-weight: 600;
  }

  .dh-nav__toggle {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 18px;
    border-radius: 4px;
    color: var(--dh-text-muted);
  }

  .dh-nav__toggle--group:hover {
    background: var(--dh-surface-header);
    color: var(--dh-text);
  }

  .dh-nav__toggle .v-icon {
    transition: transform 0.15s ease;
  }

  .dh-nav__toggle--open .v-icon {
    transform: rotate(90deg);
  }

  .dh-nav__item--selected .dh-nav__toggle {
    color: var(--dh-primary-strong);
  }

  .dh-nav__icon {
    color: var(--dh-text-muted);
    opacity: 1;
  }

  .dh-nav__item--selected .dh-nav__icon {
    color: var(--dh-primary);
  }

  .dh-nav__match {
    border-radius: 2px;
    background: var(--dh-status-wip-bg);
    color: inherit;
  }

  .dh-nav__empty {
    padding: 24px 16px;
    color: var(--dh-text-secondary);
    font-size: 13px;
    line-height: 18px;
    text-align: center;
  }

  .dh-nav__empty-hint {
    display: block;
    margin-top: 4px;
    color: var(--dh-text-muted);
    font-size: 12px;
  }

  .dh-nav__service {
    flex: none;
    padding: 6px 0;
    border-top: 1px solid var(--dh-border);
  }

  .dh-nav__service .dh-nav__item {
    padding-left: 10px;
  }

  .dh-nav__service .dh-nav__item :deep(.v-list-item__spacer) {
    width: 10px;
  }

  .dh-nav__badge {
    display: inline-block;
    min-width: 20px;
    padding: 0 6px;
    border-radius: 9px;
    background: var(--dh-status-bad-bg);
    color: var(--dh-status-bad-text);
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    text-align: center;
  }
</style>
