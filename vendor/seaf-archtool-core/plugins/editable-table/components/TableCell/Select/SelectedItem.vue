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
  <div class="selected-item" v-on:click.stop>
    <button v-if="!disabled" class="button" v-on:click.stop="handleClick">
      <icon type="cancel" size="14" v-bind:color="null" />
    </button>
    {{ text }}
  </div>
</template>

<script>
  import Icon from '../../Icon/Icon.vue';

  export default {
    components: { Icon },
    props: {
      text: {
        type: String,
        required: false,
        default: ''
      },
      id: {
        type: [String, Number, Boolean],
        required: true
      },
      disabled: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    emits: ['remove-item'],
    methods: {
      handleClick() {
        this.$emit('remove-item', this.id);
      }
    }
  };
</script>

<style scoped>
.selected-item {
  max-width: 100%;

  background-color: var(--color-bg-chips);
  border: 1px solid var(--dh-chip-border);
  border-radius: 6px;
  padding: 1px 7px;

  color: var(--dh-chip-text);
  font-size: 0.8125rem;
  line-height: 1.4;

  overflow-wrap: break-word;
}

.button {
  margin-left: 6px;
  float: right;

  padding: 0;
  background-color: transparent;
  border: none;
  color: var(--dh-text-muted);
  opacity: .45;
}

.selected-item:hover .button,
.button:focus-visible {
  opacity: 1;
}

.button:focus {
  outline-color: var(--color-focus);
}
</style>
