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
      Zaznobin Saveliy <zaznobins@yandex.ru>

  Contributors:
      Zaznobin Saveliy <zaznobins@yandex.ru> - 2026
-->

<template>
  <div class="arch-switcher">
    <v-menu
      v-model="orgMenuOpen"
      location="bottom start"
      v-bind:offset="4"
      v-bind:close-on-content-click="false">
      <template #activator="{ props }">
        <button
          type="button"
          class="arch-switcher__trigger"
          v-bind="props"
          v-bind:title="unavailableHint">
          <span v-if="current" class="arch-switcher__label">Организация: </span>
          <span
            class="arch-switcher__value"
            v-bind:class="{'arch-switcher__value--unavailable': !current}">
            {{ activeTitle }}
          </span>
          <v-icon
            icon="mdi-chevron-down"
            class="arch-switcher__chevron"
            v-bind:class="{'arch-switcher__chevron--open': orgMenuOpen}"
            size="20" />
        </button>
      </template>
      <div class="arch-switcher-menu">
        <template v-if="recent.length">
          <div class="arch-switcher-menu__section">НЕДАВНИЕ</div>
          <button
            v-for="right in recent"
            v-bind:key="'recent-' + right.alias"
            type="button"
            class="arch-switcher-menu__row"
            v-on:click="onPick(right)">
            <span class="arch-switcher-menu__name">{{ displayTitle(right) }}</span>
            <span class="arch-switcher-menu__alias">{{ right.alias }}</span>
          </button>
        </template>
        <template v-if="all.length">
          <div class="arch-switcher-menu__section">ВСЕ</div>
          <button
            v-for="right in all"
            v-bind:key="'all-' + right.alias"
            type="button"
            class="arch-switcher-menu__row"
            v-bind:class="{'arch-switcher-menu__row--selected': right.alias === activeAlias}"
            v-on:click="onPick(right)">
            <span
              class="arch-switcher-menu__name"
              v-bind:class="{'arch-switcher-menu__name--selected': right.alias === activeAlias}">
              {{ displayTitle(right) }}
            </span>
            <span class="arch-switcher-menu__alias">{{ right.alias }}</span>
          </button>
        </template>
        <button
          type="button"
          class="arch-switcher-menu__footer"
          v-bind:class="{'arch-switcher-menu__footer--ruled': all.length}"
          v-on:click="onAdvancedSearch">
          Расширенный поиск →
        </button>
      </div>
    </v-menu>

    <button
      v-if="branchSwitcherEnabled"
      type="button"
      class="arch-switcher__trigger arch-switcher__trigger--collapsed"
      disabled>
      <span class="arch-switcher__label">Ветка: </span>
      <span class="arch-switcher__value">main</span>
      <v-icon class="arch-switcher__chevron" size="20" icon="mdi-chevron-down" />
    </button>

    <span
      v-if="crumbs.length"
      class="arch-switcher__crumbs"
      v-bind:title="crumbsLabel">
      <span
        v-for="(crumb, index) in crumbs"
        v-bind:key="index"
        class="arch-switcher__part">
        <span
          class="arch-switcher__crumb"
          v-bind:class="{'arch-switcher__crumb--last': index === crumbs.length - 1}">{{ crumb }}</span>
        <span v-if="index < crumbs.length - 1" class="arch-switcher__sep"> / </span>
      </span>
    </span>
  </div>
</template>

<script lang="ts">
  import { defineComponent } from 'vue';

  import userRightStore from '@front/store/userRightStore.js';
  import consts from '@front/consts.js';
  import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
  import type { UserRight } from '@front/store/userRight';
  import { allSorted, recentSection, remember } from './recentArchitectures';
  import { buildBreadcrumbs } from './breadcrumbs';
  import { loadUserMenu, type UserMenuItem } from './userMenuCache';

  const logger = getLoggerWithTag('ArchSwitcherPane');

  export default defineComponent({
    name: 'ArchSwitcherPane',
    data() {
      return {
        orgMenuOpen: false,
        branchSwitcherEnabled: false,
        menuDataset: [] as UserMenuItem[],
        menuReady: false,
        menuLoadFailed: false,
        menuRequestId: 0
      };
    },
    computed: {
      // Момент загрузки манифеста: меняется при каждой загрузке, в том числе при обновлении манифеста на месте
      manifestMoment(): unknown {
        return this.$store.state.moment;
      },
      rights(): UserRight[] {
        const all = userRightStore.getAll();
        return Array.isArray(all) ? all as UserRight[] : [];
      },
      current(): UserRight | null {
        if (!Array.isArray(userRightStore.getAll())) return null;
        return userRightStore.getCurrent() || null;
      },
      activeAlias(): string {
        return this.current?.alias || '';
      },
      requestedAlias(): string {
        const raw = this.$route.query[consts.roleModelV2.urlAliasParamName];
        const value = Array.isArray(raw) ? raw[0] : raw;
        return typeof value === 'string' ? value.trim() : '';
      },
      activeTitle(): string {
        if (!this.current) return 'Недоступная архитектура';
        return this.displayTitle(this.current);
      },
      unavailableHint(): string | undefined {
        if (this.current) return undefined;
        const alias = this.requestedAlias;
        if (alias) return `Архитектура «${alias}» из адреса недоступна. Выберите другую.`;
        return 'Архитектура недоступна. Выберите другую.';
      },
      recent(): UserRight[] {
        return recentSection(this.rights, this.activeAlias);
      },
      all(): UserRight[] {
        return allSorted(this.rights);
      },
      crumbs(): string[] {
        if (!this.menuReady) return [];
        return buildBreadcrumbs({
          menu: this.menuDataset,
          route: this.$route
        });
      },
      crumbsLabel(): string {
        return this.crumbs.join(' / ');
      }
    },
    watch: {
      manifestMoment: {
        immediate: true,
        handler() {
          this.refreshMenu();
        }
      },
      $route() {
        if (this.menuLoadFailed) this.refreshMenu();
      }
    },
    created() {
      const current = this.current;
      if (current?.alias) remember(current.alias);
    },
    methods: {
      displayTitle(right: UserRight | null): string {
        return right?.title || right?.alias || '';
      },
      onPick(right: UserRight | null) {
        if (!right?.alias) return;
        this.orgMenuOpen = false;
        if (right.alias === this.activeAlias) return;
        remember(right.alias);
        const url = new URL('/main', window.location.origin);
        url.searchParams.set(consts.roleModelV2.urlAliasParamName, right.alias);
        // Полная перезагрузка: orgCtxRoutHandler на router.push переписывает _sfa-orgctx предыдущим контекстом.
        window.location.href = url.toString();
      },
      onAdvancedSearch() {
        this.orgMenuOpen = false;
        this.$router.push('/archChooser').catch(() => null);
      },
      async refreshMenu() {
        const requestId = ++this.menuRequestId;
        const keepVisible = this.menuDataset.length > 0;
        if (!keepVisible) this.menuReady = false;
        try {
          const dataset = await loadUserMenu(this.manifest, this.manifestMoment);
          if (requestId !== this.menuRequestId) return;
          this.menuDataset = dataset;
          this.menuLoadFailed = false;
        } catch (error) {
          logger.warn(() => 'user menu for breadcrumbs failed', error);
          if (requestId !== this.menuRequestId) return;
          this.menuLoadFailed = true;
        }
        this.menuReady = true;
      }
    }
  });
</script>

<style scoped>
  .arch-switcher {
    display: flex;
    min-height: 60px;
    align-items: center;
    justify-content: flex-start;
    gap: 16px;
    flex-shrink: 0;
    padding: 6px 12px;
    background: var(--dh-primary-soft);
    border-bottom: 1px solid #e0e0e0;
  }

  .arch-switcher__trigger {
    display: inline-flex;
    align-items: center;
    min-width: 280px;
    gap: 4px;
    margin: 0;
    padding: 10px 13px;
    border: 1px solid #ddd;
    border-radius: 8px;
    background: #fff;
    font: inherit;
    font-size: 14px;
    line-height: 20px;
    cursor: pointer;
    color: inherit;
    letter-spacing: 0.02em;
    &:hover {
      background: var(--dh-primary-soft);
    }
    &:disabled {
      opacity: 0.5;
      cursor: default;
      pointer-events: none;
    }
  }

  .arch-switcher__trigger--collapsed {
    min-width: unset;
  }

  .arch-switcher__label {
    color: #9e9e9e;
    font-weight: 400;
  }

  .arch-switcher__value {
    font-weight: 700;
    color: var(--color-brand-primary, #00755d);
  }

  .arch-switcher__value--unavailable {
    color: #c62828;
  }

  .arch-switcher__trigger:disabled .arch-switcher__label {
    color: #9e9e9e;
  }

  .arch-switcher__trigger:disabled .arch-switcher__value {
    color: var(--color-brand-primary, #00755d);
    -webkit-text-fill-color: var(--color-brand-primary, #00755d);
  }

  .arch-switcher__chevron {
    color: inherit;
    opacity: 1;
    margin-left: auto;
    transform: scale(1.5);
    transition: transform 0.3s ease-in-out;
  }

  .arch-switcher__chevron--open {
    transform: rotate(180deg) scale(1.5);
  }

  .arch-switcher__crumbs {
    display: flex;
    flex: 1 1 auto;
    align-items: baseline;
    min-width: 0;
    overflow: hidden;
    font-size: 14px;
    line-height: 20px;
    user-select: text;
  }

  .arch-switcher__part {
    display: flex;
    flex: 0 1 auto;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
  }

  /* Предыдущие сегменты отдают ширину первыми, последний сжимается только когда они уже исчезли. */
  .arch-switcher__part:not(:last-child) {
    flex-shrink: 1000;
  }

  .arch-switcher__crumb,
  .arch-switcher__sep {
    color: #757575;
  }

  .arch-switcher__crumb {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .arch-switcher__sep {
    flex: none;
  }

  .arch-switcher__crumb--last {
    font-weight: 600;
    color: #212121;
  }

  @media print {
    .arch-switcher {
      display: none;
    }
  }
</style>

<style>
  .arch-switcher-menu {
    min-width: 280px;
    max-height: 70vh;
    overflow: auto;
    padding: 4px 0;
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 4px 20px rgba(0,0,0,.10);
  }

  .arch-switcher-menu__section {
    padding: 8px 12px 4px;
    font-size: 11px;
    font-weight: 600;
    letter-spacing: 0.04em;
    color: #9e9e9e;
    user-select: none;
  }

  .arch-switcher-menu__row,
  .arch-switcher-menu__footer {
    display: flex;
    align-items: center;
    width: 100%;
    margin: 0;
    padding: 8px 12px;
    border: 0;
    background: transparent;
    font: inherit;
    font-size: 14px;
    line-height: 20px;
    text-align: left;
    cursor: pointer;
    color: #000;
  }

  .arch-switcher-menu__row {
    justify-content: space-between;
    gap: 16px;
  }

  .arch-switcher-menu__row:hover,
  .arch-switcher-menu__footer:hover {
    background: #f5f5f5;
  }

  .arch-switcher-menu__row--selected,
  .arch-switcher-menu__row--selected:hover {
    background: var(--color-brand-soft);
  }

  .arch-switcher-menu__name {
    color: #000;
    font-weight: 400;
  }

  .arch-switcher-menu__name--selected {
    font-weight: 700;
    color: var(--color-brand-primary, #00755d);
  }

  .arch-switcher-menu__alias {
    flex-shrink: 0;
    font-size: 12px;
    font-weight: 700;
    opacity: 0.55;
    color: #000;
  }

  .arch-switcher-menu__footer {
    justify-content: flex-start;
  }

  .arch-switcher-menu__footer--ruled {
    border-top: 1px solid #e0e0e0;
    margin-top: 4px;
  }
</style>
