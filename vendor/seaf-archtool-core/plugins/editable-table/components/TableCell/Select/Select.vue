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
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
-->

<template>
  <div class="select">
    <v-menu 
      v-model="isMenuActive" 
      location="bottom" 
      transition="slide-y-transition"
      v-bind:disabled="isOptionsDisabled"
      v-bind:close-on-content-click="false">
      <template #activator="{ props }">
        <div v-bind="props" class="content" v-on:keydown="handleKeydown">
          <button ref="button" class="dropdown-botton focus-element" v-bind:disabled="isOptionsDisabled">
            <icon
              type="menu-up"
              class="dropdown-icon"
              v-bind:class="{
                'dropdown-icon_open': props['aria-expanded'] === 'true',
                'dropdown-icon_inactive': isOptionsDisabled  
              }" />
          </button>
          <div v-if="selectedItems.length > 0" class="selected-list">
            <selected-item
              v-for="(selectID, index) in selectedItems"
              v-bind:id="selectID"
              v-bind:key="selectID"
              v-bind:style="stylesToApply[index]"
              v-bind:text="optionNameMap[selectID]"
              v-bind:disabled="disabled"
              v-on:remove-item="handleChange" />
          </div>
        </div>
      </template>
      <options
        v-if="isMenuActive"
        v-bind:is-open="isMenuActive"
        class="dropdown" 
        v-bind:options="selectedOptions"
        v-bind:value="selectedItems"
        v-bind:multiple="multiple"
        v-on:on-close="isMenuActive = false"
        v-on:change="handleChange" />
    </v-menu>
  </div>
</template>

<script>
  import { getStylesToApply } from '../../../lib/helpers';
  import { getOptionTextMap, getRowOptions } from '../../../lib/cellText';

  import SelectedItem from './SelectedItem.vue';
  import Options from './Options.vue';
  import Icon from '../../Icon/Icon.vue';

  export default {
    components: { SelectedItem, Options, Icon },

    props: {
      value: {
        type: null,
        required: true
      },
      options: {
        type: [Array, Object],
        required: true
      },
      multiple: {
        type: Boolean,
        required: false,
        default: false
      },
      disabled: {
        type: Boolean,
        required: false,
        default: false
      },
      headerID: {
        type: String,
        required: true
      },
      row: {
        type: Object,
        required: true
      },
      optionID: {
        type: String,
        required: false,
        default: null
      },
      styles: {
        type: Object,
        required: true
      }
    },
    emits: ['input'],

    data() {
      return {
        isMenuActive: false
      };
    },

    computed: {
      selectedItems() {
        if (typeof this.value !== 'boolean' && !this.value) return [];
        return Array.isArray(this.value)
          ? this.value
          : [this.value];
      },

      currentOptionKey() {
        return Array.isArray(this.options) ? null : this.row[this.optionID];
      },

      selectedOptions() {
        return getRowOptions(this.options, this.optionID, this.row);
      },

      optionNameMap() {
        return getOptionTextMap(this.selectedOptions);
      },

      isOptionsDisabled() {
        return this.disabled || this.selectedOptions.length === 0;
      },

      stylesToApply() {
        return this.selectedItems.map(value => getStylesToApply(value, this.styles));
      }

    },

    watch: {
      currentOptionKey() {
        this.cleanValue();
      },
      isMenuActive(newValue) {
        if(newValue === false) {
          this.$refs.button.focus();
        }
      }
    },

    methods: {
      handleKeydown(e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
          return;
        } else if (e.key === 'F2') {
          this.isMenuActive = !this.isMenuActive;
        }
      },

      cleanValue() {
        this.$emit('input', null);
      },

      handleChange(id) {
        let newValue;
        if (this.multiple) {
          if (typeof this.value !== 'boolean' && !this.value) {
            newValue = [id];
          } else {
            newValue = this.value.includes(id)
              ? this.value.filter(value => value !== id)
              : [...this.value, id];
            if (newValue.length === 0) {
              newValue = null;
            }
          }
        } else {
          newValue = this.value === id ? null : id;
          if(newValue !== null) this.$refs.button.click();
        }

        this.$emit('input', newValue);
      }
    }
  };
</script>

<style scoped>
.select {
  padding: 0 !important;
}

.content {
  height: 100%;
  position: relative;
}

.dropdown-botton {
  position: absolute;
  top: -6px;
  right: -4px;

  padding: 0;
  background-color: transparent;
  border: none;
}

.dropdown-botton:focus {
  outline: none;
}

.dropdown-icon {
  color: var(--dh-text-muted);
}

.content:hover .dropdown-icon,
.dropdown-botton:focus-visible .dropdown-icon,
.dropdown-icon_open {
  color: var(--color-primary);
}

.dropdown-icon_open {
  transform: rotateX(180deg);
}

.dropdown-icon_inactive {
  opacity: .3;
}

.selected-list {
  padding: 16px 4px 4px 4px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-flow: row wrap;
}

.selected-list :nth-child(n) {
  align-self: flex-start;
}

.dropdown {
  min-width: 200px;
  max-width: 600px;
  z-index: 10;
  border: 1px solid var(--dh-border);
  border-radius: var(--dh-radius);
  background-color: var(--dh-surface);
  box-shadow: var(--dh-shadow-overlay);
}
</style>
