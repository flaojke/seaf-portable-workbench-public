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
  <div v-bind:class="classCell">
    <div class="wrapper" v-on:click="handleClick">
      <div class="text">
        {{ text }}
      </div>

      <sort-badge
        v-if="sortMap[headerID]"
        class="badge"
        v-bind:priority="sortMap[headerID].priority + 1"
        v-bind:direction="sortMap[headerID].direction" />

      <div class="action-block">
        <slot />
      </div>
    </div>
    <div
      v-if="resizable"
      class="resize-handle"
      v-on:mousedown.stop.prevent="handleResizeMouseDown" />
  </div>
</template>

<script>
  import CellMixin from '../../mixins/CellMixin.vue';
  import SortBadge from './SortBadge/SortBadge.vue';

  export default {
    components: { SortBadge },
    mixins: [CellMixin],
    props: {
      sortMap: {
        type: Object,
        required: true
      },
      header: {
        type: Object,
        required: true
      },
      resizable: {
        type: Boolean,
        default: false
      }
    },
    emits: ['click', 'resize-start'],
    data() {
      return {
        headerID: this.header.headerID,
        text: this.header.text ?? this.header.value
      };
    },
    methods: {
      handleClick() {
        this.header.sortable && this.$emit('click');
      },
      handleResizeMouseDown(event) {
        this.$emit('resize-start', { event, headerID: this.headerID });
      }
    }
  };
</script>

<style scoped>
.wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  gap: 6px;

  position: relative;

  color: var(--dh-text-secondary);
  font-size: 0.8125rem;
  font-weight: 600;
  line-height: 1.3;
}

.text {
  flex: 1;
  min-width: 0;
  text-align: left;
}

.badge {
  flex: none;
}

.action-block {
  flex: none;
  order: 2;

  display: flex;
  gap: 2px;
}

/* Ручка изменения ширины колонки видна только при наведении */
.resize-handle {
  position: absolute;
  top: 0;

  right: -6px;
  width: 12px;

  height: 100%;
  cursor: col-resize;

  z-index: 5;

  opacity: 0;
  background: linear-gradient(
    to right,
    transparent 0%,
    transparent 40%,
    var(--dh-primary) 40%,
    var(--dh-primary) 60%,
    transparent 60%,
    transparent 100%
  );
}

.resize-handle:hover {
  opacity: .8;
}
</style>
