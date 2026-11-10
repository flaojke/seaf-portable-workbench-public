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
-->

<template>
  <div class="upload-link">
    <div v-if="!disabled" class="control-action">
      <button class="button" v-on:click="handleClickRemoveButton">
        <icon class="button-icon" type="cancel" />
      </button>
      <button class="button" v-on:click="handleClickEditButton">
        <icon class="button-icon" type="edit" />
      </button>
    </div>

    <dh-link v-bind:href="link.href"> {{ link.text }} </dh-link>
  </div>
</template>

<script>
  import Icon from '../../Icon/Icon.vue';
  import DCLinkVue from '@front/components/Controls/DCLink.vue';

  export default {
    components: {
      icon: Icon,
      'dh-link': DCLinkVue
    },
    props: {
      link: {
        type: Object,
        required: true
      },
      disabled: {
        type: Boolean,
        required: true,
        default: true
      }
    },
    methods: {
      handleClickEditButton() {
        this.$emit('edit');
      },
      handleClickRemoveButton() {
        this.$emit('remove');
      }
    }
  };
</script>

<style scoped>
.upload-link {
  display: flex;
  gap: 8px;
}

.control-action {
  display: flex;
  gap: 4px;
  align-items: start;
}

.button {
  background: none;
  border: 1px solid transparent;
  padding: 1px;
  opacity: 0.65;
  border-radius: 4px;
  cursor: pointer;
}

.button:hover {
  opacity: 1;
  border-color: var(--color-primary);
  transition: 0.2s;
}

.button-icon {
  font-size: 18px;
  color: var(--color-primary);
}
</style>
