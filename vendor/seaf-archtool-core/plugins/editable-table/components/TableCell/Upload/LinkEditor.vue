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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026

  Contributors:
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="edit-block">
    <input v-model="inputHref" disabled class="input" type="text" placeholder="ссылка">
    <input
      v-model="inputText"
      class="input"
      type="text"
      placeholder="отображаемое значение"
      v-on:keydown.stop>

    <div class="format-action">
      <button class="button" v-bind:disabled="!isValidURL" v-on:click="handleClickSaveButton">
        <icon class="button-icon" type="check" />
      </button>
      <button class="button" v-on:click="handleClickCancelButton">
        <icon class="button-icon button-icon_cancel" type="cancel" />
      </button>
    </div>
  </div>
</template>

<script>
  import { checkIsValidUrl } from '../../../lib/helpers.js';
  import Icon from '../../Icon/Icon.vue';

  export default {
    components: {
      icon: Icon
    },
    props: {
      link: {
        type: Object,
        required: true
      }
    },
    data() {
      return {
        inputHref: this.link.href ?? '',
        inputText: this.link.href === this.link.text ? '' : this.link.text
      };
    },
    computed: {
      isValidURL() {
        return checkIsValidUrl(this.inputHref);
      }
    },
    methods: {
      handleClickSaveButton() {
        const text =
          typeof this.inputText === 'string' && this.inputText.trim()
            ? this.inputText.trim()
            : null;
        this.$emit('save', {
          href: this.inputHref,
          text: text || this.inputHref
        });
      },
      handleClickCancelButton() {
        this.$emit('cancel');
      }
    }
  };
</script>

<style scoped>
.edit-block {
  width: 100%;
  padding: 6px;
  border: 1px solid var(--color-gray-dark);
  border-radius: 4px;

  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* Поля ссылки и текста — на всю ширину блока, с тонкой рамкой и отступом 4px */
.input {
  flex: 1 1 auto;
  display: block;
  width: 100%;
  height: auto;
  min-height: 0;
  padding: 4px;
  overflow: hidden;
  resize: none;
  border: solid 1px #eee;
  outline: 1px solid var(--color-white-dark);
  border-radius: 4px;
}

.input::placeholder {
  opacity: 0.35;
}

.input:focus {
  outline-color: var(--color-primary);
}

.format-action {
  display: flex;
  gap: 8px;
}

.button {
  background: none;
  border: 1px solid transparent;
  padding: 1px;
  opacity: 0.65;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover:not(:disabled) {
  opacity: 1;
  border-color: var(--color-primary);
  transition: 0.2s;
}

.button:disabled {
  background: none;
}

.button:disabled > .button-icon {
  color: var(--color-gray);
}

.button-icon {
  font-size: 18px;
  color: var(--color-primary);
}

.button-icon_cancel {
  color: var(--color-gray);
}
</style>
