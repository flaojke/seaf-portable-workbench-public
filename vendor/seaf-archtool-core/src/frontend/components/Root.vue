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
      Navasardyan Suren, Sber - 2023
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
      Zaznobin Saveliy <zaznobins@yandex.ru> - 2026
-->

<template>
  <v-app
    id="keep"
    class="app"
    v-bind:class="{
      'no-select-text': isDrawerResize,
      'hide-header-on-print': hideHeaderOnPrint
    }">
    <header-component
      v-bind:hide-header-on-print="hideHeaderOnPrint"
      v-on:update:hide-header-on-print="hideHeaderOnPrint = $event"
      v-on:handleDrawer="handleDrawer" />

    <v-navigation-drawer
      ref="drawer"
      v-model="drawer"
      class="app-navigation-drawer"
      v-bind:width="width"
      v-bind:temporary="navIsTemporary"
      v-bind:order="0">
      <menu-component />
      <!-- Правая граница меню — ручка: перетаскивание меняет ширину, двойной щелчок возвращает ширину по умолчанию -->
      <div
        v-if="!navIsTemporary"
        class="app-navigation-drawer__resizer"
        title="Потяните, чтобы изменить ширину меню. Двойной щелчок — ширина по умолчанию"
        v-on:pointerdown="startDrawerResize"
        v-on:dblclick="setDrawerWidth(defaultDrawerSize)" />
    </v-navigation-drawer>

    <plugin-init v-if="isNotInited" />

    <v-main v-else class="main-view">
      <arch-switcher-pane v-if="archChooserEnabled" />
      <div class="main-view__body">
        <problems v-if="isCriticalError" />
        <router-view v-else class="router-view-content" />
      </div>
    </v-main>

    <!-- Меню по правому клику у документов: одно на приложение -->
    <doc-context-menu
      v-model="docContextMenu.show"
      v-bind:x="docContextMenu.x"
      v-bind:y="docContextMenu.y"
      v-bind:items="docContextMenu.items" />

    <template v-if="isLoading">
      <div class="loading-splash" />
      <v-progress-circular
        class="wheel"
        v-bind:size="64"
        v-bind:width="7"
        v-bind:model-value="60"
        color="primary"
        indeterminate />
    </template>
  </v-app>
</template>

<script>
  import PluginInit from '@idea/components/Init.vue';
  import env from '@front/helpers/env';

  import MenuComponent from './Layouts/Menu';
  import HeaderComponent from './Layouts/Header';
  import ArchSwitcherPane from './ArchSwitcher/ArchSwitcherPane.vue';
  import Problems from './Problems/Problems.vue';
  import DocContextMenu from './Docs/DocContextMenu.vue';
  import { docContextMenu } from './Docs/docContextMenuState';
  import { DEFAULT_DRAWER_WIDTH, clampDrawerWidth, readDrawerWidth, saveDrawerWidth } from '@front/helpers/menuDrawerWidth';

  export default {
    name: 'Root',
    components: {
      MenuComponent,
      HeaderComponent,
      DocContextMenu,
      ArchSwitcherPane,
      PluginInit,
      Problems
    },
    data() {
      return {
        drawer: null,
        isDrawerResize: false,
        width: readDrawerWidth(),
        defaultDrawerSize: DEFAULT_DRAWER_WIDTH,
        hideHeaderOnPrint: false,
        isPlugin: env.isPlugin(),
        docContextMenu,
        archChooserEnabled: env.archChooserEnabled
      };
    },
    computed: {
      isLoading() {
        return this.$store.state.isReloading;
      },
      isNotInited() {
        return this.isPlugin && this.$store.state.notInited;
      },
      isCriticalError() {
        return this.isPlugin && this.$store.state.criticalError;
      },
      navIsTemporary() {
        return this.$store.state.isPrintVersion;
      }
    },
    methods: {
      handleDrawer(value) {
        this.drawer = value ?? !this.drawer;
      },
      // Меню прижато к левому краю окна, поэтому ширина равна координате указателя
      startDrawerResize(event) {
        if (event.button !== 0) return;

        const handle = event.currentTarget;
        const onMove = (e) => {
          this.width = clampDrawerWidth(e.clientX);
        };
        const onEnd = () => {
          handle.removeEventListener('pointermove', onMove);
          handle.removeEventListener('pointerup', onEnd);
          handle.removeEventListener('pointercancel', onEnd);
          this.isDrawerResize = false;
          saveDrawerWidth(this.width);
        };

        handle.setPointerCapture(event.pointerId);
        handle.addEventListener('pointermove', onMove);
        handle.addEventListener('pointerup', onEnd);
        handle.addEventListener('pointercancel', onEnd);
        this.isDrawerResize = true;
      },
      setDrawerWidth(value) {
        this.width = clampDrawerWidth(value);
        saveDrawerWidth(this.width);
      }
    }
  };
</script>

<style>
  .app {
    height: 100vh;

    @media print {
      height: unset;
    }
  }

  .main-view {
    height: 100%;
    display: flex;
    flex-direction: column;
    min-height: 0;
    @media print {
      display: block;
      position: static !important;
      overflow: hidden;
    }
  }

  .main-view__body {
    flex: 1 1 auto;
    min-height: 0;
    display: flex;
    flex-direction: column;

    @media print {
      display: block;
      min-height: unset;
      overflow: visible;
    }
  }

  .router-view-content {
    overflow: auto;
    flex: 1 1 auto;
    min-height: 0;

    @media print {
      overflow: unset;
      max-height: unset;
    }
  }

  .router-view-content:has(.dh-full-height) {
    overflow: hidden;
  }

  .router-view-content:has(.dh-full-height) > div,
  .router-view-content:has(.dh-full-height) > div > div {
    height: 100%;
    min-height: 0;
  }

  /* Прокрутка контента — тонкая и нейтральная, как у дерева меню */
  .router-view-content {
    scrollbar-width: thin;
    scrollbar-color: var(--dh-border-strong) transparent;
  }

  .swagger-ui {
    width: 100%;
  }

  .router-view-content > div > div,
  .router-view-content > div > div > div {
    height: 100%;
  }

  .app-navigation-drawer {
    border-color: var(--dh-border);
  }

  .app-navigation-drawer__resizer {
    position: absolute;
    top: 0;
    right: -4px;
    bottom: 0;
    z-index: 1;
    width: 8px;
    cursor: col-resize;
    touch-action: none;
  }

  .app-navigation-drawer__resizer::after {
    content: '';
    position: absolute;
    top: 0;
    bottom: 0;
    left: 3px;
    width: 2px;
    background: transparent;
    transition: background-color 0.15s ease;
  }

  .app-navigation-drawer__resizer:hover::after,
  .no-select-text .app-navigation-drawer__resizer::after {
    background: var(--dh-primary);
  }

  /* Пока тянут ручку, меню и контент меняют размер без анимации Vuetify */
  .no-select-text .v-navigation-drawer,
  .no-select-text .v-main {
    transition: none;
  }

  .no-select-text {
    cursor: col-resize;
  }

  .no-select-text * {
    user-select: none;
    -moz-user-select: none;
    -webkit-user-select: none;
    -ms-user-select: none;
  }

  .loading-splash {
    background: var(--dh-surface);
    opacity: 0.7;
    z-index: 10;
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
    filter: blur(8px);
    -webkit-filter: blur(8px);
  }

  .wheel {
    z-index: 100;
    left: 50%;
    top: 50vh;
    position: absolute !important;
    margin-left: -32px;
    margin-top: -32px;
  }

  /* Выделение текста — светлым фирменным цветом, текст остается своего цвета */
  ::selection {
    background-color: var(--dh-selection);
    color: inherit;
  }

  /* We need to fight with the Vuetify to hide the header on print and shift the content up*/
  @media print {
    .hide-header-on-print {
      --v-layout-top: 0px !important;
    }

    .hide-header-on-print .v-app-bar {
      display: none !important;
    }

    .hide-header-on-print .main-view {
      --v-layout-top: 0px;
      padding-top: 0 !important;
    }

    .hide-header-on-print .v-navigation-drawer {
      top: 0 !important;
    }
  }
</style>
