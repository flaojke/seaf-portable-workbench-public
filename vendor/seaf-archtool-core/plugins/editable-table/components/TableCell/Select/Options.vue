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
  <div ref="options" class="editable-table-colors options" tabindex="1" v-on:keydown="handleKeyDown">
    <div v-if="isFilterShowed" class="filter">
      <text-area
        v-bind:value="filter"
        v-bind:disabled="false"
        class="input"
        v-on:input="filter = $event" />
      <strong 
        v-if="filteredOptions.length !== options.length"
        class="counter">
        {{ `${filteredOptions.length} / ${options.length}` }}
      </strong>
    </div>

    <options-list 
      ref="optionsList"
      class="options-list" 
      v-bind:options="filteredOptions" 
      v-bind:value="value"
      v-bind:multiple="multiple" 
      v-on:change="handleChange" />
  </div>
</template>

<script>
  import { DEFAULT_HEADER_ITEM_OPTIONS } from '../../../lib/const';

  import Textarea from '../Textarea/Textarea.vue';
  import OptionsList from './OptionsList.vue';

  export default {
    components: { 
      'text-area': Textarea, 
      OptionsList 
    },
    props: {
      options: {
        type: Array,
        required: true
      },
      value: {
        type: Array,
        required: true
      },
      multiple: {
        type: Boolean,
        required: true
      },
      isOpen: {
        type: Boolean,
        required: true
      },
      showFilter: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    emits: ['on-close', 'change'],
    data() {
      return {
        filter: '',
        focusIndex: 0
      };
    },
    computed: {
      filteredOptions() {
        if (!this.filter.trim()) {
          return this.options;
        } else {
          return this.options
            .filter(({ text }) => text.toLowerCase()
              .includes(this.filter.toLowerCase()));
        }
      },
      isFilterShowed() {
        return this.showFilter || (DEFAULT_HEADER_ITEM_OPTIONS.optionsListSize <= this.options.length);
      }
    },

    watch: {
      isOpen(newValue){
        newValue && this.focusInputElement();
      },
      
      focusIndex(newValue) {
        if(newValue === 0) {
          this.focusInputElement();
        } else {
          const element = this.$refs.optionsList.$el.children[newValue - 1];
          element.focus();
        }
      }
    },

    mounted() {
      setTimeout(() => {
        this.isFilterShowed ? this.focusInputElement() : this.$refs.options.focus();
      }, 150);
    },

    methods: {
      handleKeyDown(e) {
        if (e.key === 'Escape' || e.key === 'Enter' || e.key === 'F2') {
          this.$emit('on-close');

        } else if(e.key === 'ArrowUp') {
          this.focusIndex = Math.max(this.isFilterShowed ? 0 : 1, this.focusIndex - 1);

        } else if(e.key === 'ArrowDown') {
          this.focusIndex = Math.min(this.filteredOptions.length, this.focusIndex + 1);
          
        } else if(e.target?.classList?.contains('text-area')) {
          return;
          
        }

        e.preventDefault();
        e.stopPropagation();

      }, 

      focusInputElement() {
        if(this.isFilterShowed && this.$refs.options) {
          const input = this.$refs.options.querySelector('.text-area');
          if(input) {
            input.focus();
            this.focusIndex = 0;
          }
        }
      },

      handleChange(id) {
        this.$emit('change', id);
      }
    }
  };
</script>

<style scoped>
.options {
  font-size: 13px;
  padding: 4px 0;
}

.options-list {
  max-height: calc(100vh * 0.7)
}

.filter {
  margin: 4px 6px 12px 6px;
  position: relative;
}

.input {
  padding: 6px 8px;
  border: 1px solid var(--dh-border-strong);
  border-radius: 6px;
}

.input:focus-within {
  border-color: var(--dh-primary);
  box-shadow: 0 0 0 1px var(--dh-primary);
}

/* Число найденных вариантов из общего числа */
.counter {
  position: absolute;
  top: 50%;
  right: 8px;
  transform: translateY(-50%);
  padding: 0 6px;
  border-radius: 9px;
  background-color: var(--dh-chip-bg);
  color: var(--dh-text-secondary);
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
}
</style>
