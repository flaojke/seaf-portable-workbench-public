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
      Vladislav Nefedov <clay.zenx@gmail.com>, Sber - 2024
      R.Piontik <r.piontik@mail.ru> - 2024
      Rostislav Kabalin <kabalin2009@yandex.ru> - 2022
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div
    class="plantuml-place"
    v-on:contextmenu="showMenu">
    <error-boundary
      v-bind:params="{error}"
      stop-propagation>
      <v-progress-circular
        v-if="isLoading"
        v-bind:size="64"
        v-bind:width="7"
        style="left: 50%; top: 50%; position: absolute; margin-left: -32px; margin-top: -32px;"
        v-bind:model-value="60"
        color="primary"
        indeterminate />
      <template v-else-if="render">
        <div v-if="ifShowFullscreen" class="fullscreen-icon">
          <v-icon v-on:click="toggleFullscreen">
            {{ isFullScreen ? 'mdi-close-box-outline' : 'mdi-fullscreen' }}
          </v-icon>
        </div>
        <div
          class="plantuml-schema"
          v-on:mousedown.prevent="zoomAndPanMouseDown"
          v-on:mousemove.prevent="zoomAndPanMouseMove"
          v-on:mouseup.prevent="zoomAndPanMouseUp"
          v-on:mouseleave.prevent="zoomAndPanMouseUp"
          v-on:wheel="zoomAndPanWheelHandler"
          v-html="svg" />
      </template>
    </error-boundary>
  </div>
</template>

<script>
  import { ErrorBoundary } from '@front/shared/ErrorBoundary/index';
  import { openDocContextMenu } from '@front/components/Docs/docContextMenuState';

  import plantUML from '@front/helpers/plantuml';
  import href from '@front/helpers/href';
  import copyToClipboard from '@front/helpers/clipboard';
  import download from '@front/helpers/download';
  import fullScreen from '@front/helpers/fullscreen';

  import ZoomAndPan from './zoomAndPan';

  const EVENT_COPY_SOURCE_TO_CLIPBOARD = 'copysource';

  export default {
    name: 'PlantUML',
    components: {
      ErrorBoundary
    },
    mixins: [ZoomAndPan],
    props: {
      uml: { type: String, default: '' },         // PlantUML диаграмма
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      postrender: { type: Function, default: () => {} }, // POST обработчик
      sourceAvailable: { type: Boolean, default: false },
      contextMenu: { type: Array, default() {return []; } }
    },
    emits: [
      EVENT_COPY_SOURCE_TO_CLIPBOARD // Копирование источника данных
    ],
    data() {
      return {
        menu: { // Контекстное меню
          items: (() => {
            const result = [
              { id: 'copy-puml', group: 'Схема', icon: 'mdi-content-copy', title: 'Копировать PlantUML', on: () => copyToClipboard(this.uml) }
            ];
            this.sourceAvailable && result.push({ id: 'copy-json', group: 'Схема', icon: 'mdi-code-json', title: 'Копировать JSON', on: () => this.$emit(EVENT_COPY_SOURCE_TO_CLIPBOARD) });
            return result;
          }).call()
        },
        render: true,
        error: null,
        requestRevision: 0,
        isUnmounted: false,
        rerenderTimer: null,
        resizeObserver: null,
        svg: '',
        isLoading: true,
        svgEl: null,
        isFullScreen: false,
        ifShowFullscreen: fullScreen.isAvailable()
      };
    },
    computed: {
      zoomAndPanElement() {
        return this.svgEl;
      },
      viewBox() {
        if (this.cacheViewBox) return this.cacheViewBox;
        let result = null;
        if (navigator.userAgent.toLowerCase().includes('firefox')) {
          // eslint-disable-next-line no-useless-escape
          const regex = /<svg.*?viewBox=\"(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\s*(-?(?:\d+(?:\.\d+)?|\.\d+)(?:e\d+)?)\".*?>/;
          const parsed = this.svg.match(regex);
          parsed && (result = {
            x: Number.parseFloat(parsed[1]),
            y: Number.parseFloat(parsed[2]),
            width: Number.parseFloat(parsed[3]),
            height: Number.parseFloat(parsed[4])
          });
        } else if (this.svgEl) result = this.svgEl.viewBox.baseVal;
        // eslint-disable-next-line vue/no-side-effects-in-computed-properties
        return result ? (this.cacheViewBox = result) : { x:0, y:0, width:0, height:0 };
      },
      menuItems() {
        const result = [].concat(this.contextMenu);
        if (!this.error) {
          result.push(
            { id:'save-svg', group: 'Схема', icon: 'mdi-file-download-outline', title: 'Скачать SVG', on: () => download.downloadSVG(this.svg)}
          );
          result.push(
            { id: 'save-png', group: 'Схема', icon: 'mdi-image-outline', title: 'Скачать PNG', on: () => download.downloadSVGAsPNG(this.svg) }
          );
        }
        return result.concat(this.menu.items);
      }
    },
    watch: {
      uml() {
        this.reloadSVG();
      }
    },
    mounted() {
      window.addEventListener('resize', this.reRender);
      this.resizeObserver = new ResizeObserver(this.reRender);
      this.resizeObserver.observe(this.$el);
      this.reloadSVG();
    },
    beforeUnmount(){
      this.isUnmounted = true;
      this.requestRevision += 1;
      window.removeEventListener('resize', this.reRender);
      this.resizeObserver?.disconnect();
      this.rerenderTimer && clearTimeout(this.rerenderTimer);
    },
    methods: {
      toggleFullscreen() {
        fullScreen.toggle(this.$el, (value) => {
          this.isFullScreen = value;
        });
      },
      reRender() {
        if (this.rerenderTimer) clearTimeout(this.rerenderTimer);
        this.rerenderTimer = setTimeout(() => {
          this.render = false;
          this.$nextTick(() => {
            this.render = true;
            this.$nextTick(() => {
              this.prepareSVG();
              this.$nextTick(() => this.doResize());
            });
          });
        }, 0);
      },
      doResize() {
        if (!this.svgEl || !this.svgEl.clientWidth || !this.svgEl.clientHeight) return;

        const originWidth = this.viewBox.width;

        if (this.$el.clientWidth > this.viewBox.width) {
          this.viewBox.width = this.$el.clientWidth;
        }

        const originHeight = this.viewBox.height * (this.svgEl.clientWidth / this.viewBox.width);

        this.svgEl.style.height = originHeight;

        if (originHeight < this.$el.clientHeight) {
          const k = this.viewBox.height / originHeight;
          this.svgEl.style.height = this.$el.clientHeight;
          this.viewBox.height = this.$el.clientHeight * k;
        }

        const offsetX = (this.viewBox.width - originWidth) / 2;
        const offsetY = (this.$el.clientHeight - originHeight) / 2;
        this.viewBox.x -= offsetX;
        this.viewBox.y -= offsetY > 0 ? offsetY : 0;
      },
      prepareSVG() {
        this.svgEl = this.$el.querySelectorAll('svg')[0];
        this.cacheViewBox = null;
        if (this.svgEl) {
          this.svgEl.style = null;
          this.svgEl.setAttribute('encoding', 'UTF-8');
          this.doResize();
          href.elProcessing(this.svgEl);
          if (this.postrender) this.postrender(this.svgEl);
        }
      },
      reloadSVG() {
        const revision = ++this.requestRevision;
        if (!this.uml) {
          this.svg = '';
          this.isLoading = false;
          return;
        }

        this.error = null;
        this.isLoading = true;

        this.$nextTick(() => {
          if (this.isUnmounted || revision !== this.requestRevision) return;
          const request = plantUML.prepareRequest(this.uml);

          request.then((response) => {
            if (this.isUnmounted || revision !== this.requestRevision) return;
            this.svg = response.data.toString();
            this.isLoading = false;
            this.$nextTick(() => this.reRender());
          }).catch((error) => {
            if (this.isUnmounted || revision !== this.requestRevision) return;
            if (error.response && error.response.status === 400) {
              this.$nextTick(() => this.reRender());
            }
            this.error = error;
          }).finally(()=> {
            if (!this.isUnmounted && revision === this.requestRevision) this.isLoading = false;
          });
        });
      },
      showMenu(event) {
        openDocContextMenu(event, this.menuItems);
        event.stopPropagation();
      }
    }
  };
</script>

<style>

.plantuml-schema {
  width: 100%;
}

.plantuml-schema svg {
  width: 100%;
  height: auto;
}
.plantuml-place {
  position: relative;
  background-color: var(--dh-surface);
}
.plantuml-place:hover .fullscreen-icon {
  display:block !important;
}
.fullscreen-icon {
  position: absolute;
  right: 20px;
  top: 20px;
  display: none;
}

@media print {
  .plantuml-place {
    break-inside: avoid-page;
    page-break-inside: avoid;
  }

  .plantuml-schema svg {
    display: block;
    width: 100% !important;
    height: auto !important;
    max-height: 90vh;
    margin: 0 auto;
  }
}
</style>
