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
  <label class="wrapper" v-bind:style="stylesToApply">
    <input
      class="checkbox focus-element"
      type="checkbox"
      v-bind:checked="checked"
      v-bind:disabled="disabled"
      v-on:keydown.space.prevent="$event.target.click()"
      v-on:change="handleChange">
  </label>
</template>

<script>
  import { getStylesToApply } from '../../../lib/helpers';

  export default {
    props: {
      checked: {
        type: [Boolean, null],
        required: false,
        default: false
      },
      disabled: {
        type: Boolean,
        required: false,
        default: false
      },
      styles: {
        type: Object,
        required: false,
        default: () => ({})
      }
    },
    emits: ['change'],
    computed: {
      stylesToApply() {
        return getStylesToApply(this.checked, this.styles);
      }
    },
    methods: {
      handleChange(e) {
        this.$emit('change', e.target.checked);
      }
    }
  };
</script>

<style scoped>
.wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
}

.checkbox {
  cursor: pointer;
  margin: 0;
  accent-color: var(--dh-primary);
  width: 18px;
  height: 18px;
}

.checkbox:focus {
  outline-color: var(--color-focus);
}
</style>
