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
       Александр Трубников <a.trubnikov@samolet.ru>

  Contributors:
      Александр Трубников <a.trubnikov@samolet.ru> - 2023
-->

<template>
  <div class="json-viewer-box">
    <!-- разное поведение для preview-mode и expand-depth с большим числом. preview-mode слегка увеличивает производительность -->
    <json-viewer v-if="data" v-bind:value="data" v-bind:expand-depth="expandDepth" v-bind:show-double-quotes="true" v-bind:preview-mode="autoExpand" v-bind:copyable="copyable" v-bind:show-array-index="false" />
  </div>
</template>

<script>
  import JsonViewer from 'vue-json-viewer';
  import 'vue-json-viewer/style.css';


  export default {
    name: 'ResponseComponent',
    components: {JsonViewer},
    props: {
      data: {
        type: [Object, Array],
        required: true
      },
      autoExpand: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        copyable: {
          copyText: 'Копировать',
          copiedText: 'Скопировано',
          timeout: 2000
        }
      };
    },
    computed: {
      expandDepth() {
        return (this.autoExpand === true) ? 1000 : 1;
      }
    }
  };
</script>

<style>
  .json-viewer-box .jv-container .jv-code {
    padding: 0;
  }
  .json-viewer-box .jv-container.jv-light {
    font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
  }
</style>
