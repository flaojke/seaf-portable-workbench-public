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
      Yushkov Alexandr <asyushkov@gmail.com> - 2026
-->

<template>
  <div>
    <div v-if="data" class="link-list">
      <div v-for="(link, ind) in data" v-bind:key="ind">
        <p v-if="link && typeof link === 'string'" v-bind:style="stylesToApply[ind]" class="text">
          {{ link }}
        </p>
        <d-c-link
          v-else-if="link && typeof link === 'object'"
          v-bind:href="link.href"
          v-bind:style="stylesToApply[ind]">
          {{ getLinkText(link) }}
        </d-c-link>
      </div>
    </div>
  </div>
</template>

<script>
  import DCLink from '@front/components/Controls/DCLink.vue';
  import { formatLinkData, getStylesToApply } from '../../../lib/helpers';
  import { getLinkText } from '../../../lib/cellText';

  export default {
    components: {
      DCLink
    },
    props: {
      value: {
        type: [String, Array, Object],
        required: false,
        default: ''
      },
      styles: {
        type: Object,
        required: true,
        default: () => ({})
      }
    },

    computed: {
      data() {
        return formatLinkData(this.value);
      },
      stylesToApply() {
        return this.data.map((link) => getStylesToApply(typeof link === 'string' ? link : link.href, this.styles));
      }
    },
    methods: {
      getLinkText
    }
  };
</script>

<style scoped>
.link-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.link-list :nth-child(n) {
  width: fit-content;
}

.text {
  margin: 0;
}
</style>
