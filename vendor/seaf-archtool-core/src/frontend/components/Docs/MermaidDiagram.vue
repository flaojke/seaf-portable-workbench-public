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
  <div class="mermaid-diagram">
    <v-alert v-if="error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__title">Не удалось построить диаграмму Mermaid</div>
      <pre class="dh-alert__code">{{ error.message || error }}</pre>
    </v-alert>
    <div v-else v-html="svg" />
  </div>
</template>

<script>
  import mermaid from 'mermaid';
  import mindmap from '@mermaid-js/mermaid-mindmap';

  import href from '@front/helpers/href';
  import { prepareMermaidSVG } from '@front/helpers/mermaid';

  mermaid.initialize({
    flowchart: { htmlLabels: false },
    htmlLabels: false
  });

  let diagramSequence = 0;
  let mindmapRegistrationPromise = null;

  function ensureMindmapRegistered() {
    if (window.as_mindmap) return Promise.resolve();
    if (!mindmapRegistrationPromise) {
      mindmapRegistrationPromise = mermaid.registerExternalDiagrams([mindmap]).then(() => {
        window.as_mindmap = true;
      }).catch((error) => {
        mindmapRegistrationPromise = null;
        throw error;
      });
    }
    return mindmapRegistrationPromise;
  }

  export default {
    name: 'MermaidDiagram',
    props: {
      source: {
        type: String,
        default: ''
      }
    },
    data() {
      return {
        svg: '',
        error: null,
        renderRevision: 0
      };
    },
    watch: {
      source: {
        immediate: true,
        handler() {
          this.renderDiagram();
        }
      }
    },
    beforeUnmount() {
      this.renderRevision += 1;
    },
    methods: {
      async renderDiagram() {
        const revision = ++this.renderRevision;
        this.svg = '';
        this.error = null;
        if (!this.source) return;

        const id = `inline_mermaid_${Date.now()}_${++diagramSequence}`;
        try {
          await ensureMindmapRegistered();
          const { svg } = await mermaid.render(id, this.source);
          if (revision !== this.renderRevision) return;

          this.svg = prepareMermaidSVG(svg);
          this.$nextTick(() => href.elProcessing(this.$el));
        } catch (error) {
          if (revision === this.renderRevision) this.error = error;
        }
      }
    }
  };
</script>

<style scoped>
.mermaid-diagram {
  max-width: 100%;
  overflow: auto;
}

.mermaid-diagram :deep(svg) {
  display: block;
  max-width: 100%;
  height: auto;
}
</style>
