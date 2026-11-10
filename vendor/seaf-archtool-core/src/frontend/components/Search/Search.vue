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
  restrictions under the License.

  Maintainers:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2026
      Marat Niyazmatov, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="search-page">
    <!-- Строка поиска и переключатель сущностей -->
    <div class="search-header">
      <v-text-field
        v-model="searchQuery"
        variant="outlined"
        density="compact"
        clearable
        hide-details
        spellcheck="false"
        placeholder="Введите запрос для поиска…"
        class="search-input flex-grow-1"
        v-on:keyup.enter="performSearch">
        <template #prepend-inner>
          <v-icon class="search-input__icon" icon="mdi-magnify" size="20" v-bind:color="null" />
        </template>
      </v-text-field>
      <v-btn
        color="primary"
        variant="flat"
        class="search-btn"
        v-on:click="performSearch">
        Найти
      </v-btn>
      <v-btn
        v-bind:disabled="!(results?.length > 0)"
        color="primary"
        variant="outlined"
        class="search-btn search-btn--secondary"
        v-on:click="csvExport">
        <template #prepend>
          <v-icon icon="mdi-download" size="18" v-bind:color="null" />
        </template>
        Экспорт CSV
      </v-btn>
    </div>

    <!-- Переключатель сущностей (типы объектов) -->
    <div class="entities-picker">
      <span>
        Поиск по сущностям:
        <span class="entity-indicator">{{ entities.find((ele) => ele.key === selectedEntityKey)?.title }}</span>
      </span>
      <button
        v-if="!entitiesLoading"
        type="button"
        class="entities-button"
        v-bind:aria-expanded="showEntities"
        v-on:click="showEntities = !showEntities">
        {{ showEntities ? 'Скрыть' : 'Изменить' }}
      </button>
    </div>
    <div v-if="entities.length" v-bind:class="[{['entity-tabs--hidden']: !showEntities}, 'entity-tabs']">
      <div class="entity-chips">
        <v-chip
          v-for="ent in entities"
          v-bind:key="ent.key"
          class="entity-chip"
          v-bind:class="{ 'entity-chip--active': selectedEntityKey === ent.key }"
          v-bind:aria-pressed="selectedEntityKey === ent.key"
          variant="flat"
          size="x-small"
          v-on:click="onEntitySelect(ent.key)">
          {{ ent.title }}
        </v-chip>
      </div>
    </div>

    <!-- Основной контент: результаты слева, фильтры справа -->
    <div class="search-content">
      <!-- Результаты поиска (левая колонка) -->
      <div class="results-column">
        <div class="results-panel">
          <div v-if="searchLoading" class="text-center pa-4">
            <v-progress-circular indeterminate color="primary" />
            <div class="mt-2">Загрузка...</div>
          </div>
          <div v-else-if="searchError" class="pa-3">
            <v-alert class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">{{ searchError }}</v-alert>
          </div>
          <div v-else-if="!selectedEntityKey" class="pa-4 text-center search-muted">
            Выберите сущность для поиска
          </div>
          <div v-else-if="results.length === 0 && searchPerformed" class="pa-4 text-center search-muted">
            <div>Ничего не найдено</div>
            <v-chip
              v-if="outputIsFiltered"
              class="mt-2 search-count-chip"
              size="x-small"
              variant="flat">
              фильтры: {{ appliedFiltersCount }}
            </v-chip>
          </div>
          <div v-else-if="results.length > 0" class="results-list">
            <div class="results-status">
              <span>Найдено {{ results.length }}</span>
              <v-chip
                v-if="outputIsFiltered"
                class="search-count-chip"
                size="x-small"
                variant="flat">
                фильтры: {{ appliedFiltersCount }}
              </v-chip>
            </div>
            <div class="results-table-wrap">
              <v-data-table
                v-bind:headers="tableHeaders"
                v-bind:items="results"
                v-bind:items-per-page="-1"
                item-value="itemKey"
                fixed-header
                height="100%"
                density="compact"
                hide-default-footer
                class="results-table">
                <template #[`item.company`]="{ item }">
                  {{ item.company || '—' }}
                </template>
                <template #[`item._sfa_key`]="{ item }">
                  <d-c-link
                    v-if="item.card"
                    v-bind:href="getCardUrl(item.card)"
                    target="_blank"
                    rel="noopener"
                    class="result-link">
                    {{ item._sfa_key || '—' }}
                  </d-c-link>
                  <span v-else>{{ item._sfa_key || '—' }}</span>
                </template>
                <template #[`item.entityTitle`]="{ item }">
                  {{ item.entityTitle || '—' }}
                </template>
                <template #[`item.title`]="{ item }">
                  <d-c-link
                    v-if="item.card"
                    v-bind:href="getCardUrl(item.card)"
                    target="_blank"
                    rel="noopener"
                    class="result-link">
                    {{ item.title || item._sfa_key || '—' }}
                  </d-c-link>
                  <span v-else>{{ item.title || item._sfa_key || '—' }}</span>
                </template>
                <template #[`item.description`]="{ item }">
                  {{ item.description || '—' }}
                </template>
              </v-data-table>
            </div>
          </div>
        </div>
      </div>

      <!-- Фильтры (правая колонка) -->
      <div class="filters-column">
        <div class="filters-panel">
          <div class="filters-header">
            <span>Фильтры</span>
            <v-chip
              v-if="outputIsFiltered"
              class="search-count-chip"
              size="x-small"
              variant="flat">
              {{ appliedFiltersCount }}
            </v-chip>
          </div>
          <div v-if="!selectedEntityKey" class="pa-2 text-center search-muted text-caption">
            Выберите сущность — появятся доступные фильтры
          </div>
          <div v-else-if="selectedEntityKey === SEARCH_ALL_KEY" class="pa-2 text-center search-muted text-caption">
            В режиме «Все» поиск по словам в наименовании и описании
          </div>
          <div v-else-if="filterError" class="pa-2 text-center search-muted text-caption">{{ filterError }}</div>
          <div v-else-if="filtersLoading" class="pa-2 text-center">
            <v-progress-circular indeterminate size="24" />
          </div>
          <div v-else-if="filterFields.length === 0" class="pa-2 text-center search-muted text-caption">
            Нет фильтруемых полей
          </div>
          <div v-else class="filters-form">
            <div
              v-for="field in filterFields"
              v-bind:key="field.key"
              class="filter-field mb-2">
              <div class="filter-field-label">{{ field.title || field.key }}</div>
              <filter-input
                v-bind:field="field"
                v-bind:value="getFilterValue(field.key)"
                v-bind:load-suggestions="getFilterSuggestions"
                v-on:input="onFilterChange(field.key, $event)" />
            </div>
            <v-btn
              v-bind:disabled="!canApplyFilters"
              v-bind:variant="canApplyFilters ? 'flat' : 'text'"
              size="small"
              color="primary"
              class="search-btn"
              v-on:click="performSearch">
              Применить фильтры
            </v-btn>
            <v-btn
              v-if="outputIsFiltered"
              size="small"
              variant="text"
              class="search-btn search-btn--reset"
              v-on:click="clearFilters">
              Сбросить фильтры
            </v-btn>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue';
  import { useStore } from 'vuex';
  import { requestToBackend } from '@front/helpers/backend.api.helper';
  import datasets from '@front/helpers/datasets';
  import { getFiltersForEntity, getFilterValueSuggestions, getSearchEntitiesList, performInEntitySearch, performSearchAll } from '@global/search/search-perform.mjs';
  import { SearchDataProvider } from '@global/search/search-data.mjs';
  import FilterInput from './FilterInput.vue';
  import env from '@front/helpers/env';
  import {getLoggerWithTag} from '@global/logger/v2/logger.mjs';
  import { SEARCH_ALL_KEY } from '@global/search/constants.mjs';
  import { collectRelFields, parseRelTarget } from '@global/search/search-utils.mjs';
  import downloadHelper from '@front/helpers/download.js';
  import DCLink from '@front/components/Controls/DCLink.vue';

  defineOptions({
    name: 'Search'
  });

  const logger = getLoggerWithTag('search-component');
  const store = useStore();
  const manifest = computed(() => store.state.manifest || {});
  const frontEntities = computed(() => store.state.entities);

  function meaningfulFilters(source) {
    const output = {};
    if (!source) return output;
    for (const key of Object.keys(source)) {
      const value = source[key];
      if (value != null && value !== '') {
        output[key] = value;
      }
    }
    return output;
  }

  function areFiltersEqual(left, right) {
    const a = meaningfulFilters(left);
    const b = meaningfulFilters(right);
    const aKeys = Object.keys(a);
    if (aKeys.length !== Object.keys(b).length) return false;
    for (let i = 0; i < aKeys.length; i++) {
      const key = aKeys[i];
      if (a[key] !== b[key]) return false;
    }
    return true;
  }

  const showEntities = ref(false);
  const entities = ref([]);
  const hasCompanies = ref(false);
  const selectedEntityKey = ref(null);
  const filterFields = ref([]);
  const filterError = ref(null);
  const searchQuery = ref('');
  const filters = ref({});
  const results = ref([]);
  const searchLoading = ref(false);
  const searchError = ref(null);
  const searchPerformed = ref(false);
  const entitiesLoading = ref(false);
  const filtersLoading = ref(false);
  const appliedFilters = ref({});
  let searchDataProvider = null;

  const activeFiltersCount = computed(() => Object.keys(meaningfulFilters(filters.value)).length);
  const appliedFiltersCount = computed(() => Object.keys(meaningfulFilters(appliedFilters.value)).length);
  const outputIsFiltered = computed(() => appliedFiltersCount.value > 0);
  const filtersAreDirty = computed(() => !areFiltersEqual(filters.value, appliedFilters.value));
  const canApplyFilters = computed(() => filtersAreDirty.value && activeFiltersCount.value > 0);
  const tableHeaders = computed(() => {
    const headers = [
      { title: 'Ключ', key: '_sfa_key', sortable: true },
      { title: 'Тип объекта', key: 'entityTitle', sortable: true, width: '180px' },
      { title: 'Наименование', key: 'title', sortable: true },
      { title: 'Описание', key: 'description', sortable: true }
    ];
    if (hasCompanies.value) {
      headers.unshift({ title: 'Компания', key: 'company', sortable: true, width: '140px' });
    }
    return headers;
  });

  function initSearchDataProvider() {
    if (env.isBackendMode || !manifest.value) {
      searchDataProvider = null;
      return;
    }
    searchDataProvider = new SearchDataProvider(manifest.value, (datasetId) =>
      datasets().releaseData(`/datasets/${datasetId}`)
    );
  }

  async function collectRelEntityIds(choice) {
    const fullSchema = (await frontEntities.value?.getSchema()) ?? manifest.value;
    return collectRelFields(fullSchema, choice, manifest.value)
      .map(rel => parseRelTarget(rel.relTarget)?.entityId)
      .filter(Boolean);
  }

  async function getFilterSuggestions(relTarget, query) {
    let data;
    try {
      if (env.isBackendMode) {
        data = await requestToBackend(
          `/seaf-core/api/core/storage/search/rel-suggestions?relTarget=${encodeURIComponent(relTarget)}&query=${encodeURIComponent(query)}`
        );
      } else {
        const parsed = parseRelTarget(relTarget);
        let entityData;
        if (parsed?.entityId && searchDataProvider) {
          entityData = await searchDataProvider.getEntityData(parsed.entityId);
        }
        data = getFilterValueSuggestions(manifest.value, relTarget, query.trim().toLowerCase(), entityData);
      }
    } catch (e) {
      logger.error(() => 'Error loading filter suggestions', { field: relTarget, query, error: e });
      return [];
    }
    return data;
  }

  async function loadEntities() {
    entitiesLoading.value = true;
    try {
      const data = env.isBackendMode ? await requestToBackend('/seaf-core/api/core/storage/search/searchable-entities') : getSearchEntitiesList(manifest.value);
      const rawEntities = data?.entities ?? (Array.isArray(data) ? data : []);
      entities.value = Array.isArray(rawEntities) ? rawEntities : [];
      hasCompanies.value = Boolean(data?.hasCompanies);
      if (entities.value.length && !selectedEntityKey.value) {
        selectedEntityKey.value = entities.value[0].key;
      }
    } catch (e) {
      entities.value = [];
      hasCompanies.value = false;
      searchError.value = 'Не удалось загрузить список сущностей';
      logger.error(() => 'Failed to load the list of searchable entities', {
        error: e
      });
    } finally {
      entitiesLoading.value = false;
    }
  }

  async function loadFilterFields(choice) {
    filtersLoading.value = true;
    filterError.value = null;
    try {
      let data;
      if (env.isBackendMode) {
        data = await requestToBackend(`/seaf-core/api/core/storage/search/entity-filters?choice=${encodeURIComponent(choice)}`);
      } else {
        const fullSchema = await frontEntities.value?.getSchema();
        const entitySchema = fullSchema?.properties?.[choice] ?? manifest.value.entities[choice]?.schema;
        if (!entitySchema) {
          throw new Error(`Schema for entity ${choice} not found`);
        }
        data = getFiltersForEntity(manifest.value, choice, fullSchema, entitySchema);
      }
      filterFields.value = Array.isArray(data) ? data : [];
      filters.value = {};
    } catch (e) {
      filterFields.value = [];
      filterError.value = 'Не удалось загрузить поля фильтров для сущности';
      logger.error('Error loading filter fields', {
        error: e,
        entity: choice
      });
    } finally {
      filtersLoading.value = false;
    }
  }

  function resetEntitySearchState() {
    filters.value = {};
    appliedFilters.value = {};
    results.value = [];
    searchPerformed.value = false;
    searchError.value = null;
  }

  function onEntitySelect(key) {
    selectedEntityKey.value = key;
  }

  function getFilterValue(fieldKey) {
    return filters.value[fieldKey];
  }

  function onFilterChange(fieldKey, value) {
    filters.value = {
      ...filters.value,
      [fieldKey]: value
    };
  }

  function clearFilters() {
    filters.value = {};
    performSearch();
  }

  function buildFiltersArray() {
    const arr = [];
    filterFields.value.forEach(f => {
      const v = filters.value[f.key];
      if (v == null || v === '') return;
      let operator = 'eq';
      let ignoreCase = false;
      let value = v;
      if (f.type === 'string') {
        operator = 'contains';
        value = String(v);
        ignoreCase = true;
      } else if (f.type === 'rel') {
        operator = 'contains';
        value = String(v);
        ignoreCase = true;
      } else if (f.type === 'number' || f.type === 'integer') {
        value = Number(v);
      } else if (f.type === 'enum' || f.enumValues) {
        operator = 'eq';
        value = v;
      }
      arr.push({
        field: f.key,
        operator,
        value,
        ignoreCase
      });
    });
    return arr;
  }

  async function performSearch() {
    if (!selectedEntityKey.value) return;
    searchLoading.value = true;
    searchError.value = null;
    searchPerformed.value = true;
    try {
      const activeFilters = buildFiltersArray();
      const payload = {
        choice: selectedEntityKey.value,
        filters: activeFilters,
        searchQuery: searchQuery.value?.trim() || ''
      };
      let data;
      if (env.isBackendMode) {
        data = await requestToBackend('/seaf-core/api/core/storage/search/search-run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        const queryWords = payload.searchQuery.split(/\s+/).filter(Boolean);
        if (selectedEntityKey.value === SEARCH_ALL_KEY) {
          let entityDataMap;
          if (searchDataProvider) {
            const searchableIds = getSearchEntitiesList(manifest.value).entities
              .map(e => e.key)
              .filter(k => k !== SEARCH_ALL_KEY);
            entityDataMap = await searchDataProvider.getEntityDataMap(searchableIds);
          }
          data = performSearchAll(manifest.value, queryWords, entityDataMap);
        } else {
          const fullSchema = (await frontEntities.value?.getSchema()) ?? manifest.value;
          const entitySchema = fullSchema?.properties?.[selectedEntityKey.value] ?? manifest.value.entities[selectedEntityKey.value]?.schema;
          let entityDataMap;
          let entityData;
          if (searchDataProvider) {
            const relEntityIds = await collectRelEntityIds(selectedEntityKey.value);
            entityDataMap = await searchDataProvider.getEntityDataMap([
              selectedEntityKey.value,
              ...relEntityIds
            ]);
            entityData = entityDataMap[selectedEntityKey.value];
          }
          data = performInEntitySearch(
            manifest.value,
            fullSchema,
            entitySchema,
            payload.choice,
            payload.filters,
            queryWords,
            entityData,
            entityDataMap
          );
        }
      }
      if (Array.isArray(data)) {
        results.value = data.map(item => {
          item.itemKey = getItemKey(item);
          return item;
        });
      } else {
        results.value = [];
      }
    } catch (e) {
      results.value = [];
      searchError.value = e?.message || 'Ошибка при выполнении поиска';
      logger.error(() => 'Error performing search', { error: e });
    } finally {
      searchLoading.value = false;
      appliedFilters.value = meaningfulFilters(filters.value);
    }
  }

  function csvExport() {
    if (!results.value.length) return;
    const headers = tableHeaders.value.map(h => h.key);
    const input = results.value.map(item => {
      const output = [];
      headers.forEach(h => {
        output.push(item[h]);
      });
      return output;
    });
    const csvString = [
      headers.join(';'),
      ...input.map(row => {
        let output = [];
        for (const item of row) {
          if (item?.match(/[,;\r\n]/)) {
            output.push(`"${item}"`);
          } else {
            output.push(item);
          }
        }
        return output.join(';');
      })
    ].join('\n');
    const data = window.btoa(unescape(encodeURIComponent(csvString)));
    downloadHelper.download(`data:text/plain;base64,${data}`, 'search.csv');
  }

  function getItemKey(item) {
    return `${item._sfa_entity || ''}_${item._sfa_key || ''}`;
  }

  function getCardUrl(cardPath) {
    if (!cardPath) return '#';
    if (URL.canParse(cardPath)) {
      return cardPath;
    }
    return cardPath.startsWith('/') ? cardPath : '/' + cardPath;
  }

  watch(selectedEntityKey, (val) => {
    resetEntitySearchState();
    if (val && val !== SEARCH_ALL_KEY) {
      loadFilterFields(val);
    } else {
      filterFields.value = [];
    }
  });

  onMounted(async() => {
    initSearchDataProvider();
    await loadEntities();
  });
</script>

<style scoped>
/* Цвета — из общей палитры представлений (presentation.css) */
.search-page {
  display: flex;
  flex-direction: column;
  height: calc(100dvh - 67px);
  min-height: 600px;
  max-width: 1400px;
  margin: 0 auto;
  padding: 12px 16px;
  color: var(--dh-text);
}
.search-header {
  display: flex;
  align-items: center;
  height: auto;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}
/* Поле поиска — как поля фильтров (FilterInput.vue) */
.search-input {
  flex: 1;
  min-width: 300px;
  max-width: 600px;
}
.search-input :deep(.v-field) {
  background: var(--dh-surface);
}
.search-input :deep(.v-field__outline) {
  --v-field-border-opacity: 1;
  color: var(--dh-border-strong);
}
.search-input :deep(.v-field--focused .v-field__outline) {
  color: var(--dh-primary);
}
.search-input__icon {
  color: var(--dh-text-muted);
}
/* Кнопки без тени и без прописных букв, как «Выполнить» в песочнице JSONata */
.search-btn {
  letter-spacing: normal;
  text-transform: none;
}
.search-btn--secondary {
  border-color: var(--dh-border-strong);
  background: var(--dh-surface);
}
.search-btn--reset {
  color: var(--dh-text-secondary);
}
/* Строка выбора сущности — отдельный ряд высотой от 28px с отступом 8px до панели чипов */
.entities-picker {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 12px;
  min-height: 28px;
  margin-bottom: 8px;
  color: var(--dh-text-secondary);
  line-height: 20px;
}
.entity-indicator {
  color: var(--dh-primary-strong);
  font-weight: 600;
}
.entities-button {
  flex: none;
  height: 28px;
  padding: 0 10px;
  color: var(--dh-primary-strong);
  font-size: 14px;
  line-height: 28px;
  border: none;
  background: var(--dh-primary-soft);
  border-radius: 6px;
  &:hover {
    background: color-mix(in srgb, var(--dh-primary) 18%, white);
  }
  &:focus-visible {
    outline: 2px solid var(--dh-primary);
    outline-offset: 1px;
  }
}
.entity-tabs {
  display: grid;
  grid-template-rows: 1fr;
  height: auto;
  margin-bottom: 8px;
  transition: grid-template-rows 0.5s ease;
}
.entity-tabs--hidden {
  grid-template-rows: 0fr;
}
.entity-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
  overflow: hidden;
}
/* Чипы сущностей — как чипы представлений; выбранная сущность — фирменного цвета */
.entity-chip {
  height: 24px;
  margin: 0;
  border: 1px solid var(--dh-chip-border);
  background: var(--dh-chip-bg);
  color: var(--dh-chip-text);
  font-size: 12px;
  cursor: pointer;
}
.entity-chip :deep(.v-chip__underlay),
.search-count-chip :deep(.v-chip__underlay) {
  display: none;
}
.entity-chip:hover {
  border-color: var(--dh-primary);
}
.entity-chip--active {
  border-color: var(--dh-primary);
  background: var(--dh-primary);
  color: var(--dh-on-primary);
  font-weight: 600;
}
/* Счетчик примененных фильтров */
.search-count-chip {
  background: var(--dh-primary-soft);
  color: var(--dh-primary-strong);
  font-weight: 600;
}
.search-muted {
  color: var(--dh-text-muted);
}
.search-content {
  display: flex;
  min-height: 300px;
  gap: 16px;
  align-items: stretch;
}
/* min-width: 0 — длинные ключи в таблице не раздвигают колонку и не выталкивают фильтры за край */
.results-column {
  flex-grow: 1;
  flex-basis: 0;
  min-width: 0;
}
.filters-column {
  flex: none;
  width: 280px;
  height: 100%;
}
@media (max-width: 960px) {
  .search-page {
    height: unset;
  }
  .search-content {
    flex-direction: column;
  }
  .results-column {
    width: 100%;
    height: auto;
  }
  .results-panel {
    height: unset;
  }
  .filters-column {
    order: -1;
    width: 100%;
    height: auto;
  }
}
.results-panel {
  height: 100%;
  overflow: hidden;
  background: var(--dh-surface);
  border: 1px solid var(--dh-border);
  border-radius: var(--dh-radius);
}
.results-panel .pa-8,
.results-panel .pa-4 {
  padding: 16px !important;
}
.results-list {
  position: relative;
  display: flex;
  flex-direction: column;
  height: 100%;
}
.results-status {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  font-size: 13px;
  color: var(--dh-text-secondary);
  border-bottom: 1px solid var(--dh-border);
  flex-shrink: 0;
}
.results-table-wrap {
  flex: 1;
  min-height: 0;
}
.filters-panel {
  display: flex;
  flex-direction: column;
  background: var(--dh-surface-alt);
  border: 1px solid var(--dh-border);
  border-radius: var(--dh-radius);
  padding: 12px;
  height: 100%;
  overflow-y: auto;
}
.filters-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--dh-text);
}
.filter-field {
  margin-bottom: 12px;
}
.filter-field-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--dh-text-secondary);
  margin-bottom: 4px;
}
/* Таблица результатов — как таблицы представлений */
.results-table {
  height: 100%;
  color: var(--dh-text);
  font-size: 13px;
}
.results-table :deep(th) {
  background: var(--dh-surface-header) !important;
  color: var(--dh-text-secondary);
  font-size: 12px;
  font-weight: 600;
  border-bottom: 1px solid var(--dh-border-strong) !important;
}
.results-table :deep(td) {
  border-bottom: 1px solid var(--dh-border) !important;
  /* Длинные ключи без пробелов переносятся, чтобы все колонки помещались без горизонтальной прокрутки */
  overflow-wrap: anywhere;
}
.results-table :deep(tbody tr:hover) {
  background: var(--dh-surface-hover);
}
.result-link {
  color: var(--dh-primary-strong);
  text-decoration: none;
}
.result-link:hover {
  text-decoration: underline;
}
</style>
