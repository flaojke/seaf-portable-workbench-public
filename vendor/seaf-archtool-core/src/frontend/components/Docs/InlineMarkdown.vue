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
      Sber
-->

<template>
  <div ref="content" class="inline-markdown" v-html="html" />
</template>

<script>
  import { createVNode, render } from 'vue';

  import href from '@front/helpers/href';
  import {
    INLINE_MARKDOWN_EMBED_ATTRIBUTE,
    renderInlineMarkdown
  } from '@front/helpers/inlineMarkdown';
  import Image from '@front/components/Tools/Image.vue';
  import PlantUML from '@front/components/Schema/PlantUML.vue';
  import MermaidDiagram from './MermaidDiagram.vue';

  export default {
    name: 'InlineMarkdown',
    props: {
      value: {
        type: [Number, String],
        default: ''
      },
      baseURI: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        html: '',
        embeds: [],
        mountedTargets: [],
        intersectionObserver: null,
        isVisible: false,
        isUnmounted: false
      };
    },
    watch: {
      value: {
        immediate: true,
        handler() {
          this.prepareContent();
        }
      },
      baseURI() {
        this.prepareContent();
      }
    },
    mounted() {
      this.observeVisibility();
      this.mountEmbedsWhenReady();
    },
    beforeUnmount() {
      this.isUnmounted = true;
      this.intersectionObserver?.disconnect();
      this.unmountEmbeds();
    },
    methods: {
      prepareContent() {
        const rendered = renderInlineMarkdown(this.value);
        this.unmountEmbeds();
        this.html = rendered.html;
        this.embeds = rendered.embeds;
        this.mountEmbedsWhenReady();
      },
      observeVisibility() {
        if (typeof IntersectionObserver !== 'function') {
          this.isVisible = true;
          return;
        }

        this.intersectionObserver = new IntersectionObserver((entries) => {
          if (entries.some(({ isIntersecting }) => isIntersecting)) {
            this.isVisible = true;
            this.intersectionObserver?.disconnect();
            this.mountEmbedsWhenReady();
          }
        });
        this.intersectionObserver.observe(this.$el);
      },
      mountEmbedsWhenReady() {
        if (this.isUnmounted || !this.$el || !this.isVisible) return;

        this.$nextTick(() => {
          if (this.isUnmounted || !this.$refs.content) return;
          this.unmountEmbeds();
          const embedByID = Object.fromEntries(this.embeds.map((embed) => [embed.id, embed]));
          const selector = `[${INLINE_MARKDOWN_EMBED_ATTRIBUTE}]`;
          const targets = this.$refs.content?.querySelectorAll(selector) || [];

          targets.forEach((target) => {
            const id = target.getAttribute(INLINE_MARKDOWN_EMBED_ATTRIBUTE);
            const embed = embedByID[id];
            if (!embed) return;

            let component;
            let props;
            if (embed.type === 'image') {
              component = Image;
              props = { src: embed.src, alt: embed.alt, baseURI: this.baseURI };
            } else if (embed.type === 'mermaid') {
              component = MermaidDiagram;
              props = { source: embed.source };
            } else if (embed.type === 'plantuml') {
              component = PlantUML;
              props = { uml: embed.source, contextMenu: [] };
            } else {
              return;
            }

            const vnode = createVNode(component, props);
            vnode.appContext = this.$.appContext;
            render(vnode, target);
            this.mountedTargets.push(target);
          });

          href.elProcessing(this.$refs.content);
        });
      },
      unmountEmbeds() {
        this.mountedTargets.forEach((target) => render(null, target));
        this.mountedTargets = [];
      }
    }
  };
</script>

<style scoped>
.inline-markdown {
  max-width: 100%;
  overflow-x: auto;
  overflow-wrap: anywhere;
  line-height: 1.45;
}

.inline-markdown :deep(> :first-child) {
  margin-top: 0;
}

.inline-markdown :deep(> :last-child) {
  margin-bottom: 0;
}

.inline-markdown :deep(p),
.inline-markdown :deep(ul),
.inline-markdown :deep(ol),
.inline-markdown :deep(pre) {
  margin: 0 0 8px;
}

.inline-markdown :deep(table) {
  border-collapse: collapse;
}

.inline-markdown.editable-table-markdown :deep(.inline-markdown-table-container) {
  contain: inline-size;
  min-width: 0;
  max-width: 100%;
  overflow-x: auto;
}

.inline-markdown.editable-table-markdown :deep(table) {
  width: max-content;
}

.inline-markdown :deep(th),
.inline-markdown :deep(td) {
  border: 1px solid #ccc;
  padding: 4px 8px;
  text-align: left;
  vertical-align: top;
}

.inline-markdown :deep(th) {
  background: #00755d;
  color: #fff;
}

.inline-markdown :deep(pre) {
  max-width: 100%;
  padding: 8px;
  overflow: auto;
  background: #f5f5f5;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.inline-markdown :deep([data-inline-markdown-embed]) {
  display: block;
  max-width: 100%;
  max-height: 480px;
  overflow: auto;
}
</style>
