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
-->

<template>
  <div
    ref="cellBody"
    v-bind:class="classCell"
    tabindex="0"
    v-on:keydown="handleKeydown"
    v-on:input.capture="resize">
    <dh-error
      v-if="hasError"
      v-bind:value="row[headerID]"
      v-on:reset-error="resetError" />

    <dh-markdown
      v-else-if="type === 'text' && renderMode === 'markdown'"
      ref="markdown"
      v-bind:value="row[headerID]"
      v-bind:base-u-r-i="baseURI"
      v-bind:disabled="disabled"
      v-bind:styles="styles"
      v-on:input="updateValue"
      v-on:focus-cell="focusCell" />

    <dh-text
      v-else-if="type === 'text' && disabled"
      v-bind:value="row[headerID]"
      v-bind:styles="styles" />

    <dh-textarea
      v-else-if="type === 'text' && !disabled"
      v-bind:value="row[headerID]"
      v-bind:styles="styles"
      v-on:input="updateValue" />

    <dh-select
      v-else-if="type === 'select' || type === 'multiple-select'"
      v-bind:value="row[headerID]"
      v-bind:option-i-d="optionID"
      v-bind:disabled="disabled"
      v-bind:header-i-d="headerID"
      v-bind:options="options"
      v-bind:multiple="type === 'multiple-select'"
      v-bind:styles="styles"
      v-bind:row="row"
      v-on:input="updateValue" />

    <dh-checkbox
      v-else-if="type === 'checkbox'"
      v-bind:checked="row[headerID]"
      v-bind:disabled="disabled"
      v-bind:styles="styles"
      v-on:change="updateValue" />

    <dh-link v-else-if="type === 'link'" v-bind:value="row[headerID]" v-bind:styles="styles" />

    <dh-fn
      v-else-if="type === 'fn'"
      v-bind:value="row[headerID]"
      v-bind:styles="styles"
      v-bind:header-i-d="headerID"
      v-bind:fn="fn"
      v-bind:row="row" 
      v-bind:pull-profile-data="pullProfileData"
      v-on:input="updateValue" />

    <dh-upload
      v-else-if="type === 'upload'"
      v-bind:value="row[headerID]"
      v-bind:disabled="disabled"
      v-bind:styles="styles"
      v-on:input="updateValue" />
  </div>
</template>

<script>
  import CellMixin from '../../mixins/CellMixin.vue';

  export default {
    mixins: [CellMixin],
    props: {
      baseURI: {
        type: String,
        required: false,
        default: ''
      },
      pullProfileData: {
        type: Function,
        required: false,
        default: null
      }
    },
    emits: ['keydown'],
    data() {
      return {
        resizeObserver: null
      };
    },
    mounted() {
      this.resize();
      this.initResizeObserver();
    },
    updated() {
      this.resize();
    },
    beforeUnmount() {
      this.destroyResizeObserver();
    },
    methods: {
      initResizeObserver() {
        const cellBody = this.$refs.cellBody;
        if (!cellBody) {
          return;
        }

        this.resizeObserver = new ResizeObserver(this.resize);
        this.resizeObserver.observe(cellBody);
      },
      destroyResizeObserver() {
        if (this.resizeObserver) {
          this.resizeObserver.disconnect();
          this.resizeObserver = null;
        }
      },
      resize() {
        this.$nextTick(() => {
          const cellBody = this.$refs.cellBody;
          if (!cellBody) {
            return;
          }

          const textareas = cellBody.querySelectorAll('textarea:not(.markdown-editor)');
          textareas.forEach((textarea) => {
            textarea.style.height = 'auto';
            textarea.style.height = (textarea.scrollHeight || 24) + 'px';
          });
        });
      },
      handleKeydown(event) {
        if (
          this.type === 'text' &&
          this.renderMode === 'markdown' &&
          !this.disabled &&
          (event.key === 'F2' || event.key === 'Enter') &&
          event.target === this.$refs.cellBody
        ) {
          event.preventDefault();
          event.stopPropagation();
          this.$refs.markdown?.startEditing();
          return;
        }
        this.$emit('keydown', event);
      },
      updateValue(value) {
        this.row[this.headerID] = value;
      },
      focusCell() {
        this.$refs.cellBody?.focus();
      },
      resetError() {
        this.hasError = false;
        this.row[this.headerID] = null;
      }
    }
  };
</script>
