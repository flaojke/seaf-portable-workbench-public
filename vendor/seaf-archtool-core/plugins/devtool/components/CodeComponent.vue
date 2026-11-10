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
  <div class="crutch">
    <codemirror ref="codemirror" v-model="cmCode" v-bind:extensions="cmExtensions" v-bind:tab-size="4" />
  </div>
</template>

<script>
  import { Codemirror } from 'vue-codemirror';
  import { StreamLanguage } from '@codemirror/language';
  import { dracula } from '@uiw/codemirror-theme-dracula';
  import {parser} from './jsonata';

  export default {
    name: 'CodeComponent',
    components: {Codemirror},
    props: {
      modelValue: {
        type: String,
        default: ''
      },
      change: {
        type: Function,
        required: true
      }
    },

    data() {
      return {
        cmExtensions: [
          StreamLanguage.define(parser()),
          dracula
        ]
      };
    },
    computed: {
      cmCode: {
        get() {
          return this.modelValue;
        },
        set(value) {
          this.change(value);
        }
      }
    }
  };
</script>

<style>
  .CodeMirror {
    height: auto;
  }
  .crutch {
    display: flex;
    background-color: #282a36 !important;
    color: #f8f8f2 !important;
    height: 100%;
  }

  .cm-editor {
    flex: 1 1 0;
    min-height: 0;
  }

  .cm-scroller {
    overflow: auto;
  }
</style>
