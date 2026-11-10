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
  <label class="wrapper" v-bind:style="stylesToApply">
    <textarea
      ref="textarea"
      v-bind:value="value"
      class="text-area focus-element"
      rows="1"
      v-bind:disabled="disabled"
      v-on:keydown="handleKeydown"
      v-on:input="handleInput" />
  </label>
</template>

<script>
  import { getStylesToApply } from '../../../lib/helpers';

  export default {
    props: {
      value: {
        type: [Number, String],
        required: false,
        default: ''
      },
      styles: {
        type: Object,
        required: false,
        default: () => ({})
      },
      disabled: {
        type: Boolean,
        required: false,
        default: false
      },
      autoFocus: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    emits: ['input'],

    computed: {
      stylesToApply() {
        return getStylesToApply(this.value, this.styles);
      }
    },

    mounted() {
      if (this.autoFocus) {
        this.focusInput();
      }
    },

    methods: {
      handleKeydown(e) {
        if (e.key === ' ') {
          e.stopPropagation();
        }

        if (e.altKey && e.key === 'Enter') {
          e.stopPropagation();
          const input = e.target;
          const start = input.selectionStart;
          const end = input.selectionEnd;
          const currentValue = input.value;
          input.value =
            currentValue.substring(0, start) + '\n' + currentValue.substring(end);
          input.selectionStart = input.selectionEnd = start + 1;
          this.$emit('input', this.value);
        }
      },
      focusInput() {
        setTimeout(() => {
          this.$refs.textarea && this.$refs.textarea.focus();
        }, 150);
      },
      handleInput(e) {
        this.$emit('input', e.target.value);
      }
    }
  };
</script>

<style scoped>
.wrapper {
  position: relative;
  cursor: text;

  width: 100%;
  height: 100%;
  display: block;
}

.text-area {
  outline: none;
  padding: 0;
  overflow: hidden;
  resize: none;
  width: 100%;
  background-color: transparent;
  border: none;
}
</style>
