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
      Temnyakov Nikolay <temnjakovn@gmail.com>, Sber

  Contributors:
      Temnyakov Nikolay <temnjakovn@gmail.com>, Sber - 2025
-->

<script>
  import ActionFileModal from './ActionFileModal.vue';

  export default {
    components: {
      'action-file-modal': ActionFileModal
    },
    data() {
      return {
        modal: false
      };
    },
    watch: {
      modal(newValue) {
        if(!newValue) this.$refs?.button?.focus();
      }
    },
    methods: {
      setModal(bool) {
        this.modal = bool;
      },
      upload(response) {
        this.$emit('upload', response);
      }
    }
  };
</script>

<template>
  <div>
    <button 
      ref="button" 
      title="Загрузить файл"
      class="data__upload focus-element" 
      v-on:click="modal = true"
      v-on:keydown.space.prevent="$event.target.click()">
      <v-icon>mdi mdi-upload</v-icon>
    </button>
    <action-file-modal v-bind:modal="modal" v-on:modal="setModal" v-on:upload="upload" />
  </div>
</template>

<style scoped>
.data__upload {
  padding: 2px;
  border-radius: 50%;
  border: 1px solid #D1F1E2;
  background-color: #D1F1E2;
}

.data__upload:hover {
  border-color: #40C686;
  transition: .25s;
}
</style>
