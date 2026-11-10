<!--
  Copyright (C) 2026 Sber

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
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber

  Contributors:
      Sergeev Viktor <sergeevviktor017@gmail.com>, Sber - 2026
      Zaznobin Saveliy <zaznobins@yandex.ru> - 2026
-->

<!--
Компонент для отображения архитектур исходя из прав пользователя
У пользователя есть права на доступ к одной или нескольким архитектурам.
Здесь мы отображаем список прав, который по сути является и списком доступных архитектур.

При этом под архитектурой понимается не отдельная сущность, а набор импортов в root.yaml файле
Внутри одной архитектуры может быть 1 или несколько организаций.
В общем мы принимаем что 1 право дает доступ к 1 архитектуре, которая содержит данные
-->
<template>
  <div class="orgctx-container">
    <h3>
      Список доступных архитектур
    </h3>
    <div v-if="nextManifest !== null" class="description">
      Меняем архитектуру на {{ nextManifest }}...
    </div>

    <div class="orgctx-filters">
      <v-text-field
        v-model="titleQuery"
        class="orgctx-filters__field"
        variant="outlined"
        density="compact"
        hide-details
        placeholder="Название" />
      <v-text-field
        v-model="aliasQuery"
        class="orgctx-filters__field"
        variant="outlined"
        density="compact"
        hide-details
        placeholder="Псевдоним" />
      <v-select
        v-model="accessLevel"
        class="orgctx-filters__field"
        variant="outlined"
        density="compact"
        hide-details
        item-title="title"
        item-value="value"
        v-bind:items="accessOptions" />
      <button
        type="button"
        class="orgctx-filters__reset"
        v-bind:disabled="!hasActiveFilters"
        v-on:click="resetFilters">
        Сбросить
      </button>
    </div>

    <div class="table-wrapper">
      <table class="orgctx-table">
        <thead>
          <tr>
            <th>Название</th>
            <th>Право (Permission)</th>
            <th>Псевдоним (Alias)</th>
            <th>Уровень доступа</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="right in filteredRights"
            v-bind:key="right.alias"
            v-bind:class="{ selected: selectedAlias === right.alias }"
            v-on:mouseup.prevent="changeArch($event, right)">
            <td>{{ right.title }}</td>
            <td>{{ right.permission }}</td>
            <td>{{ right.alias }}</td>
            <td>{{ right.ra }}</td>
          </tr>
          <tr v-if="filteredEmpty" class="orgctx-table__empty">
            <td colspan="4">Ничего не найдено</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
<script>
  import userRightStore from '@front/store/userRightStore.js';
  import consts from '@front/consts.js';
  import sanitizeUrl from '@global/helpers/sanitizeUrl.mjs';
  import {accessOptionsFromRights, filterRights} from './filterRights';
  import {remember} from '@front/components/ArchSwitcher/recentArchitectures';

  const TEXT_FILTER_DELAY = 200;

  export default {
    name: 'ArchChooser',
    data() {
      return {
        nextManifest: null,
        rights: [],
        selectedAlias: userRightStore.getCurrent()?.alias,
        titleQuery: '',
        aliasQuery: '',
        appliedTitle: '',
        appliedAlias: '',
        accessLevel: null,
        textFilterTimer: null
      };
    },
    computed: {
      accessOptions() {
        return accessOptionsFromRights(this.rights);
      },
      hasActiveFilters() {
        return Boolean(this.titleQuery.trim() || this.aliasQuery.trim() || this.accessLevel);
      },
      filteredRights() {
        return filterRights(this.rights, {
          title: this.appliedTitle,
          alias: this.appliedAlias,
          ra: this.accessLevel
        });
      },
      filteredEmpty() {
        const filtered = Boolean(
          this.appliedTitle.trim() || this.appliedAlias.trim() || this.accessLevel
        );
        return filtered && !this.filteredRights.length;
      }
    },
    watch: {
      titleQuery: 'scheduleTextFilter',
      aliasQuery: 'scheduleTextFilter'
    },
    mounted() {
      this.rights = userRightStore.getAll();
      this.isReloading = false;
    },
    beforeUnmount() {
      clearTimeout(this.textFilterTimer);
    },
    methods: {
      scheduleTextFilter() {
        clearTimeout(this.textFilterTimer);
        this.textFilterTimer = setTimeout(() => {
          this.textFilterTimer = null;
          this.appliedTitle = this.titleQuery;
          this.appliedAlias = this.aliasQuery;
        }, TEXT_FILTER_DELAY);
      },
      resetFilters() {
        this.titleQuery = '';
        this.aliasQuery = '';
        this.appliedTitle = '';
        this.appliedAlias = '';
        this.accessLevel = null;
      },
      changeArch($event, right) {
        if ($event.button > 1) {
          return;
        }
        const url = new URL(sanitizeUrl(window.location.href));
        if ($event.ctrlKey || $event.button === 1) {
          url.searchParams.set(consts.roleModelV2.urlAliasParamName, right.alias);
          window.open(url, '_blank');
          return;
        }
        const currentAlias = userRightStore.getCurrent()?.alias;
        if (right.alias === currentAlias) {
          return;
        }
        remember(right.alias);
        url.searchParams.set(consts.roleModelV2.urlAliasParamName, right.alias);
        this.nextManifest = right.name || right.alias;
        window.location.href = url.toString();
      }
    }
  };
</script>

<style scoped>
.orgctx-container {
  display: flex;
  flex-direction: column;
  height: 100%; /* если нужно */
  max-height: 100vh;
  margin: 20px;
}

.orgctx-filters {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
  background: transparent;
  flex-shrink: 0;
}

.orgctx-filters__field {
  flex: 0 0 220px;
  max-width: 220px;
}

.orgctx-filters__reset {
  border: 0;
  background: none;
  box-shadow: none;
  padding: 0;
  margin: 0;
  font: inherit;
  font-size: 14px;
  line-height: 1;
  color: #333;
  cursor: pointer;
}

.orgctx-filters__reset:disabled {
  color: #bdbdbd;
  cursor: default;
}

.description {
   background-color: #f5f5f5;
   padding: 15px;
   border-radius: 4px;
   margin-bottom: 20px;
   border-left: 4px solid rgb(0, 117, 93);
   line-height: 1.5;
   color: #333;
   flex-shrink: 0; /* Не сжимается */
   height: auto; /* Естественная высота */
 }

.table-wrapper {
  flex: 1; /* Занимает оставшееся место */
  min-height: 0; /* Важно для flex-контейнера */
  overflow: auto; /* Скролл если таблица большая */
}

.orgctx-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.orgctx-table thead {
  background-color: #f5f5f5;
  border-bottom: 2px solid #e0e0e0;
}

.orgctx-table th {
  padding: 12px 16px;
  text-align: left;
  font-weight: 600;
  color: #333;
}

.orgctx-table thead th {
  position: sticky;
  top: 0;
  background-color: #f5f5f5;
  z-index: 10;
}

.orgctx-table td {
  padding: 12px 16px;
  border-bottom: 1px solid #e0e0e0;
  color: #555;
}

.orgctx-table tbody tr {
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.orgctx-table tbody tr:hover {
  background-color: #f5f5f5;
}

.orgctx-table tbody tr.selected {
  background-color: #e3f2fd;
  border-left: 3px solid rgb(0, 117, 93);
}

.orgctx-table tbody tr.selected td:first-child {
  border-left: 3px solid rgb(0, 117, 93);
  padding-left: 13px; /* Компенсируем border */
}

.orgctx-table tbody tr.orgctx-table__empty,
.orgctx-table tbody tr.orgctx-table__empty:hover {
  cursor: default;
  background-color: transparent;
}

.orgctx-table__empty td {
  color: #757575;
  text-align: center;
}
</style>
