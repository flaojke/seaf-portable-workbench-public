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
  <div>
    <v-menu 
      v-model="isFilterOpen" 
      location="bottom" 
      transition="slide-y-transition"
      v-bind:disabled="false"
      content-class="editable-table-colors filter-dropdown-wrapper"
      v-bind:close-on-content-click="false">
      <template #activator="{ props }">
        <div v-bind="props" class="content">
          <button
            class="button"
            v-bind:class="{'button_active': $attrs.filter}">
            <icon
              class="button-icon"
              type="filter"
              v-bind:color="null" />
          </button>
        </div>
      </template>
      <filter-card 
        v-if="isFilterOpen" 
        v-bind="$attrs" 
        v-on:on-save="handleClickSave" 
        v-on:on-cancel="isFilterOpen = false" />
    </v-menu>
  </div>
</template>

<script>
  import Icon from '../Icon/Icon.vue';
  import FilterCard from './FilterCard.vue';

  export default {
    components: {  Icon, FilterCard },
    emits: ['on-save'],
    data() {
      return {
        isFilterOpen: false
      };
    },

    methods: {
      handleClickSave(filterValue) {
        this.isFilterOpen = false;
        this.$emit('on-save', filterValue);
      }
    }
  };
</script>

<style scoped>
:global(.filter-dropdown-wrapper) {
  box-shadow: var(--dh-shadow-overlay);
  border: 1px solid var(--dh-border);
  border-radius: var(--dh-radius);
  background-color: var(--dh-surface);
  padding: 12px;
}

.button {
  display: grid;
  background-color: transparent;
  border-radius: 4px;
  padding: 1px;
}

.button:hover {
  background-color: var(--dh-border);
}

.button-icon {
  font-size: 16px;
  color: var(--dh-text-muted);
}

.button_active,
.button_active:hover {
  background-color: var(--dh-primary);
}

.button_active .button-icon {
  color: var(--dh-on-primary);
}
</style>
