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
      Nikolay Temnyakov <temnjakovn@gmail.com>, Sber - 2026
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2024
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2024
      R.Piontik <r.piontik@mail.ru> - 2023
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2025
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <v-app-bar
    app
    clipped-left
    color="primary"
    v-bind:class="{'print-version': isPrintVersion}"
    v-bind:order="0">
    <div class="main-layout__header">
      <div class="main-layout__header__menu">
        <v-app-bar-nav-icon v-on:click="() => handleDrawer()">
          <menu-icon style="padding: 5px 6px 4px 4px" />
        </v-app-bar-nav-icon>
        <div class="main-layout__header__menu__logo" style="cursor: pointer" v-on:click="onLogoClick">
          <header-logo />
          <v-toolbar-title>{{ title }}</v-toolbar-title>
        </div>
        <product-version />
        <v-btn v-if="isBackShow" icon v-on:click="back">
          <v-icon v-bind:color="null">mdi-arrow-left</v-icon>
        </v-btn>
        <v-btn v-if="isBackShow" icon v-on:click="debug">
          <v-icon v-bind:color="null">mdi-bug</v-icon>
        </v-btn>
        <v-btn v-if="isBackShow" icon v-on:click="refresh">
          <v-icon v-bind:color="null">mdi-refresh</v-icon>
        </v-btn>
      </div>
      <div class="main-layout__header__menu main-layout__hide-on-print">
        <div v-if="showOidcLogin" style="cursor: pointer">
          <!-- Подключаем новый компонент отображения профиля или кнопку для входа -->
          <initial-avatar v-if="hasUserData" />
          <login-button v-else />
        </div>
        <v-spacer />
        <v-btn
          v-if="isLocalArchitectureWorkspace"
          icon
          title="Поиск по архитектуре — Ctrl+K"
          aria-label="Поиск по архитектуре"
          v-on:click="openArchitectureSearch">
          <v-icon v-bind:color="null">mdi-magnify</v-icon>
        </v-btn>
        <v-btn
          v-if="isCriticalError"
          icon
          class="header-alert"
          title="Есть критические ошибки!"
          aria-label="Есть критические ошибки!"
          v-on:click="gotoProblems">
          <span class="header-alert__badge blink">
            <v-icon icon="mdi-exclamation-thick" size="16" v-bind:color="null" />
          </span>
        </v-btn>
        <v-btn v-if="gotoIconShow" icon title="Найти в коде" v-on:click="gotoCode">
          <v-icon style="display: inline" v-bind:color="null">mdi-code-tags</v-icon>
        </v-btn>
        <v-menu
          v-model="dotsMenu"
          location="bottom end"
          v-bind:offset="6"
          v-bind:close-on-content-click="false"
          v-on:after-leave="onDotsMenuClosed">
          <template #activator="{ props }">
            <v-btn
              icon
              v-bind="props"
              class="menu-btn"
              title="Дополнительно"
              aria-label="Дополнительно">
              <v-icon v-bind:color="null">mdi-dots-vertical</v-icon>
            </v-btn>
          </template>
          <v-list class="dh-menu" density="compact">
            <template v-if="isFilesFeatureEnabled">
              <file-status-center
                class="dh-menu__item"
                activator="menu-item"
                menu-title="Статусы загрузки файлов" />
              <v-divider class="dh-menu__divider" />
            </template>
            <div class="dh-menu__caption">Печать</div>
            <!-- Переключатели не закрывают меню: всю строку можно нажать -->
            <v-list-item
              class="dh-menu__item"
              role="menuitemcheckbox"
              v-bind:aria-checked="String(isPrintVersion)"
              v-on:click="isPrintVersion = !isPrintVersion">
              <template #prepend>
                <v-icon class="dh-menu__icon" icon="mdi-printer-eye" size="18" v-bind:color="null" />
              </template>
              <v-list-item-title class="dh-menu__title">Версия для печати</v-list-item-title>
              <template #append>
                <v-switch
                  v-model="isPrintVersion"
                  class="dh-menu__switch"
                  color="primary"
                  density="compact"
                  hide-details
                  v-on:click.stop />
              </template>
            </v-list-item>
            <v-list-item
              class="dh-menu__item"
              role="menuitemcheckbox"
              v-bind:aria-checked="String(isHideHeaderOnPrint)"
              v-on:click="isHideHeaderOnPrint = !isHideHeaderOnPrint">
              <template #prepend>
                <v-icon class="dh-menu__icon" icon="mdi-page-layout-header" size="18" v-bind:color="null" />
              </template>
              <v-list-item-title class="dh-menu__title">Скрывать шапку при печати</v-list-item-title>
              <template #append>
                <v-switch
                  v-model="isHideHeaderOnPrint"
                  class="dh-menu__switch"
                  color="primary"
                  density="compact"
                  hide-details
                  v-on:click.stop />
              </template>
            </v-list-item>
            <v-divider class="dh-menu__divider" />
            <v-list-item class="dh-menu__item" v-on:click="doPrint">
              <template #prepend>
                <v-icon class="dh-menu__icon" icon="mdi-printer" size="18" v-bind:color="null" />
              </template>
              <v-list-item-title class="dh-menu__title">Печать</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
        <v-btn
          v-if="isSupportButtonShow"
          icon
          title="Поддержка"
          v-on:click="isSupportModalOpen = true">
          <v-icon v-bind:color="null">mdi-lifebuoy</v-icon>
        </v-btn>
        <support-modal
          v-model="isSupportModalOpen"
          v-bind:channels="supportChannels" />
      </div>
    </div>
  </v-app-bar>
</template>

<script>
  import env, {Plugins} from '@front/helpers/env';

  import InitialAvatar from '@front/components/Account/InitialAvatar.vue';
  import LoginButton from '@front/components/Account/LoginButton.vue';
  import FileStatusCenter from '@front/components/Account/FileStatusCenter.vue';

  import HeaderLogo from './HeaderLogo';
  import MenuIcon from './MenuIcon';
  import ProductVersion from './Version/ProductVersion';
  import SupportModal from './SupportModal.vue';
  import userStore from '@front/store/userStore.js';

  export default {
    name: 'Header',
    components: {
      InitialAvatar,
      HeaderLogo,
      MenuIcon,
      LoginButton,
      ProductVersion,
      FileStatusCenter,
      SupportModal
    },
    props: {
      hideHeaderOnPrint: {
        type: Boolean,
        default: false
      }
    },
    emits: ['update:hideHeaderOnPrint', 'handleDrawer'],
    data() {
      return {
        isBackShow: env.isPlugin(Plugins.vscode),
        dotsMenu: false,
        printPending: false,
        isSupportModalOpen: false,
        title: env.projectTitle,
        isLocalArchitectureWorkspace: ['localhost', '127.0.0.1'].includes(window.location.hostname)
      };
    },
    mounted() {
      window.addEventListener('keydown', this.architectureSearchHotkey);
    },
    beforeUnmount() {
      window.removeEventListener('keydown', this.architectureSearchHotkey);
    },
    computed: {
      hasUserData() {
        return userStore.isAuthenticated();
      },
      showOidcLogin() {
        return env.showOidcLogin;
      },
      supportChannels() {
        return env.supportChannels || [];
      },
      isSupportButtonShow() {
        return env.showSupportButton && env.supportChannels?.length > 0;
      },
      isFilesFeatureEnabled() {
        return env.usingS3Mode;
      },
      gotoIconShow() {
        return env.isPlugin() && this.$route.name === 'entities';
      },
      isCriticalError() {
        return !!(this.$store.state.problems || []).find((item) => item.critical);
      },
      isPrintVersion: {
        set(value) {
          this.handleDrawer(!value);
          this.$store.commit('setPrintVersion', value);
        },
        get() {
          return this.$store.state.isPrintVersion;
        }
      },
      isHideHeaderOnPrint: {
        set(value) {
          this.$emit('update:hideHeaderOnPrint', value);
        },
        get() {
          return this.hideHeaderOnPrint;
        }
      },
      isFullScreenMode: {
        set(value) {
          this.$store.commit('setFullScreenMode', value);
        },
        get() {
          return this.$store.state.isFullScreenMode;
        }
      }
    },
    watch: {
      dotsMenu(value) {
        if (value) this.printPending = false;
      }
    },
    methods: {
      architectureSearchHotkey(event) {
        if (this.isLocalArchitectureWorkspace && (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
          event.preventDefault();
          this.openArchitectureSearch();
        }
      },
      openArchitectureSearch() {
        const frame = document.querySelector('iframe[title="Рабочее пространство SEAF — LSV"]');
        if (frame?.contentWindow) {
          try {
            const target = new URL(frame.src);
            if (target.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(target.hostname)) {
              frame.contentWindow.postMessage({type: 'seaf-open-search'}, target.origin);
              return;
            }
          } catch { /* Navigate to the known local workspace if the frame is not usable. */ }
        }
        this.$router.push({path: '/entities/docs/blank', query: {'dh-doc-id': 'local.home.workspace', 'seaf-search': '1'}}).catch(() => null);
      },
      doPrint() {
        this.printPending = true;
        this.dotsMenu = false;
      },
      // Запускаем печать после after-leave, чтобы закрывающееся меню не попало в print preview.
      onDotsMenuClosed() {
        if (!this.printPending) return;

        this.printPending = false;

        if (env.isPlugin(Plugins.vscode)) {
          window.$PAPI.print();
        } else window.print();
      },
      handleDrawer(value) {
        this.$emit('handleDrawer', value);
      },
      back() {
        this.$router.back();
      },
      gotoProblems() {
        this.$router.push({name: 'problems'}).catch(() => null);
      },
      debug() {
        window.$PAPI.debug();
      },
      async refresh() {
        const currentRoute = { path: this.$route.path, query: this.$route.query };
        await window.$PAPI.reload(currentRoute);
      },
      onLogoClick() {
        this.$router.push({name: 'main'}).catch(() => null);
      },
      gotoCode() {
        const location = window.location;
        const struct = window.location.hash.split('/');
        const entity = struct?.[2];
        const url = new URL(location.hash.slice(1), location);

        // Пытаюсь извлечь идентификатор из параметра содержащем "id" или "domain" (для berezka)
        // или в качестве идентификатора берется хвост от urlа
        // TODO: надо переделать
        const idRegex = /\b(\w*id|domain\w*)=([^&\s]+)\b/;
        const id = idRegex.exec(url.search)?.[2] || struct[struct.length -1];

        if(!entity || !id) return false;

        // Запрос в ide на открытие entity c id
        window.$PAPI.goto(null, entity, id);
      }
    }
  };
</script>

<style scoped>
.main-layout__header {
  display: flex;
  justify-content: space-between;
  width: 100%;
  padding: 0 10px;
}

.main-layout__header__menu {
  display: flex;
  align-items: center;
  gap: 10px;
}

/* Меню «⋮»: общий стиль .dh-menu (menus.css); здесь — только пункт статусов загрузки файлов */
.dh-menu :deep(.file-status-center__menu-list-item) {
  min-height: 36px;
  padding: 4px 8px;
  border-radius: 6px;
}

.dh-menu :deep(.file-status-center__menu-list-item .v-list-item__overlay) {
  display: none;
}

.dh-menu :deep(.file-status-center__menu-list-item:hover) {
  background: var(--dh-surface-hover);
}

.dh-menu :deep(.file-status-center__menu-list-item .v-list-item__spacer) {
  width: 10px;
}

.dh-menu :deep(.file-status-center__menu-list-item .v-list-item-title) {
  font-size: 13px;
  line-height: 18px;
  letter-spacing: normal;
}

.main-layout__header__menu__logo {
  display: flex;
  align-items: center;
  gap: 2px;
}

.main-layout__header__menu__logo :global(.v-toolbar-title) {
  color: var(--dh-on-primary);
  /* Фиксируем размеры, так как vscode меняется базовый размер rem через reset.css */
  font-size: 20px;
  line-height: 1.4;
}

.menu-btn {
  color: var(--dh-on-primary);
  z-index: 1;
}

.main-layout__hide-on-print {
  @media print {
    display: none;
  }
}

header.print-version {
  position: absolute;
}

@keyframes blink {
  50% {
    opacity: 0.0;
  }
}

/* Критические ошибки: красный кружок с белым «!» и белым кольцом — заметен на фирменном фоне шапки.
   Кружок — блок 24px, глиф «!» выровнен в нем по центру flex-раскладкой */
.header-alert__badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--dh-danger);
  box-shadow: 0 0 0 2px var(--dh-on-primary);
  color: var(--dh-on-primary);
}

.blink {
  animation: blink 1s step-start 0s infinite;
}
</style>
