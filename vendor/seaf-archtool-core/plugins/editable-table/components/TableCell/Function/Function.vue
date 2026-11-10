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
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2024
-->

<template>
  <div
    class="content-container"
    v-bind:style="stylesToApply">
    {{ value }}
  </div>
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
      pullProfileData: {
        type: Function,
        required: true
      },
      fn: {
        type: String,
        required: true
      },
      headerID: {
        type: String,
        required: true
      },
      row: {
        type: Object,
        required: true
      },
      styles: {
        type: Object,
        required: true
      }
    },
    emits: ['input'],

    data() {
      return {
        debounceTimeout: null
      };
    },

    computed: {
      stylesToApply() {
        return getStylesToApply(this.value, this.styles);
      }
    },

    watch: {
      row: {
        handler() {
          clearTimeout(this.debounceTimeout);
          this.debounceTimeout = setTimeout(this.handleRequest, 500);
        },
        deep: true
      }
    },

    mounted() {
      this.handleRequest();
    },

    beforeUnmount() {
      clearTimeout(this.debounceTimeout);
    },

    methods: {
      handleRequest() {
        return this.pullProfileData(this.fn, { row: this.row })
          .then((res) => this.$emit('input', res))
          .catch(() => this.$emit('input', 'Ошибка'))
          .finally(() => clearTimeout(this.debounceTimeout));
      }
    }
  };
</script>
