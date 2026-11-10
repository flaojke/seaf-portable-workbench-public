<!--
  Copyright (C) 2021 owner Roman Piontik R.Piontik@mail.ru

  Copyright (C) 2022 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

  In any derivative products, you must retain the information of
  owner of the original code and provide clear attribution to the project

  https://dochub.info

  The use of this product or its derivatives for any purpose cannot be a secret.


  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.

  Maintainers:
      R.Piontik <r.piontik@mail.ru>

  Contributors:
      Navasardyan Suren, Sber - 2022
      R.Piontik <r.piontik@mail.ru> - 2022
      Vladislav Markin <markinvy@yandex.ru>, Sber - 2025
-->

<template>
  <box
    style="overflow-x: auto;"
    v-bind:errors="errors"
    v-bind:path="path"
    v-on:doc-contextmenu="showContextMenu">
    <mermaid-diagram v-if="diagramSource" v-bind:source="diagramSource" />
  </box>
</template>

<script>
  import mustache from 'mustache';

  import requests from '@front/helpers/requests';

  import DocMixin from './DocMixin';
  import MermaidDiagram from './MermaidDiagram.vue';

  export default {
    name: 'DocMermaid',
    components: {
      MermaidDiagram
    },
    mixins: [DocMixin],
    data() {
      return {
        content: ''
      };
    },
    computed: {
      diagramSource() {
        if (!this.content) return '';
        return this.isTemplate
          ? mustache.render(this.content, this.source.dataset)
          : this.content;
      }
    },
    methods: {
      refresh() {
        this.sourceRefresh().then(() => {
          requests.request(this.url).then(({ data }) => {
            this.content = data?.toString() || '';
          }).catch((e) => this.error = e);
        });
      }
    }
  };
</script>
