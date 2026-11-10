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
      Nikolay Temnyakov <temnjakovn@gmail. com>, Sber

  Contributors:
      Nikolay Temnyakov <temnjakovn@gmail. com>, Sber - 2025
      Alexandr Anenburg <anenburg.alexandr@mail.ru>, Sber - 2025
-->

<template>
  <div class="cell_upload" v-bind:style="stylesToApply">
    <div v-if="!disabled" class="upload-block">
      <uploader class="uploader" v-on:upload="upload" />
    </div>

    <div v-if="showSeparator" class="separator" />

    <div v-if="showLinks" class="links">
      <div v-for="(item, ind) of links" v-bind:key="ind">
        <link-editor
          v-if="item === itemToEdit"
          v-bind:link="item" 
          v-on:save="editLinkItem"
          v-on:cancel="toggleEditor(item)" />
        <link-item
          v-else
          v-bind:link="item"
          v-bind:disabled="disabled"
          v-on:edit="toggleEditor(item)" 
          v-on:remove="removeLinkItem(item)" />
      </div>
    </div>
  </div>
</template>

<script>
  import { formatLinkData, getStylesToApply } from '../../../lib/helpers';
  import Uploader from '@front/components/Uploader';
  import LinkItem from './LinkItem.vue';
  import LinkEditor from './LinkEditor.vue';

  export default {
    components: {
      uploader: Uploader,
      'link-item': LinkItem,
      LinkEditor
    },
    props: {
      value: {
        type: null,
        required: false,
        default: () => ([])
      },
      styles: {
        type: Object,
        required: true,
        default: () => ({})
      },
      disabled: {
        type: Boolean,
        required: true,
        default: true
      }
    },
    emits: ['input'],
    data() {
      return {
        links: formatLinkData(this.value, true) ?? [],
        itemToEdit: null
      };
    },
    computed: {
      stylesToApply() {
        return getStylesToApply(this.value, this.styles);
      },
      showLinks() {
        return Array.isArray(this.links) && this.links.length;
      },
      showSeparator(){
        return !this.disabled && this.showLinks;
      }
    },

    methods: {
      upload(response) {
        const newLinks = response?.descriptor?.uploadCloudInfo?.cloudUrl;
        if(!newLinks) return;
        const formatedLinks = formatLinkData(newLinks, true);
        if(!formatedLinks) return;

        this.links = [...this.links, ...formatedLinks];
        this.$emit('input', this.links);
      },
      toggleEditor(item) {
        this.itemToEdit = this.itemToEdit === item ? null : item;
      },
      editLinkItem(updatedLink) {
        const itemIndex = this.links.indexOf(this.itemToEdit);
        if(itemIndex < 0) return;
        this.links[itemIndex] = updatedLink;
        this.itemToEdit = null;
        this.$emit('input', this.links);
      },
      removeLinkItem(itemToRemove) {
        this.links = this.links.filter(item => item !== itemToRemove);
        const newData = this.links.length === 0
          ? null
          : this.links;
        this.$emit('input', newData);
      }
    }
  };
</script>

<style scoped>
.upload-block {
  display: flex;
  gap: 8px;
  align-items: center;
  padding: 4px;
}

.separator {
  height: 10px;
}

.uploader {
  font-size: 14px;
}

.links {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
