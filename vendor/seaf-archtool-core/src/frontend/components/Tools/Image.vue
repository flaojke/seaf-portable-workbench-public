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
      R.Piontik <r.piontik@mail.ru> - 2022
      R.Piontik <r.piontik@mail.ru> - 2023
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div class="image-cont" v-bind:class="{ 'drag-active': isLMBDragActive }">
    <v-alert v-if="error" class="dh-alert dh-alert--warning" icon="mdi-image-broken-variant">
      <div class="dh-alert__title">Не удалось загрузить изображение</div>
      <div class="dh-alert__text">Проверьте, что ресурс доступен, а политики CORS настроены верно.</div>
      <dl class="dh-alert__fields">
        <dt>URL</dt>
        <dd>{{ url.toString() }}</dd>
        <dt>Ошибка</dt>
        <dd>{{ error }}</dd>
      </dl>
    </v-alert>
    <img v-else ref="imgEle" v-bind:alt="alt" v-bind:src="data" v-bind:style="imageStyle">
    <div v-if="availableFullscreen" class="fullscreen-icon">
      <v-icon class="icon-fullscreen" v-on:click="toggleFullscreen">
        {{ isFullScreen ? 'mdi-close-box-outline' : 'mdi-fullscreen' }}
      </v-icon>
    </div>
  </div>
</template>

<script>
  import requests from '@front/helpers/requests';
  import uriTool from '@front/helpers/uri';
  import fullScreen from '@front/helpers/fullscreen';

  const ZOOM_STEP = 1.1;
  const ZOOM_MAX = 8;
  const WHEEL_NOTCH_PX = 100;

  export default {
    name: 'DHImage',
    props: {
      src: { type: String, default: '' },
      baseURI: { type: String, default: '' },
      alt: { type: String, default: '' }
    },
    data() {
      return {
        error: null,
        data: null,
        objectURL: null,
        requestRevision: 0,
        isUnmounted: false,
        isFullScreen: false,
        isDownscaled: false,
        resObserver: null,
        isLMBDragActive: false,
        dragStartX: 0,
        dragStartY: 0,
        dragStartScrollLeft: 0,
        dragStartScrollTop: 0,
        dragListenersAttached: false,
        zoomScale: 1,
        zoomWidth: null
      };
    },
    computed: {
      availableFullscreen() {
        return fullScreen.isAvailable() && this.isDownscaled || this.isFullScreen;
      },
      url() {
        return uriTool.makeURL(this.src, this.baseURI).url;
      },
      imageStyle() {
        if (!this.isFullScreen) return { maxWidth: '100%' };
        if (!this.zoomWidth) return { maxWidth: 'none' };
        return {
          maxWidth: 'none',
          width: `${this.zoomWidth}px`,
          height: 'auto'
        };
      }
    },
    watch: {
      src() {
        this.reloadImage();
      },
      baseURI() {
        this.reloadImage();
      },
      isFullScreen(active) {
        if (active) {
          this.attachLMBDragListeners();
        } else {
          this.detachLMBDragListeners();
          this.resetZoom();
        }
      }
    },
    mounted() {
      this.reloadImage();
      this.observer = new ResizeObserver(this.handleResize);
      this.observeImage();
    },
    beforeUnmount() {
      this.isUnmounted = true;
      this.requestRevision += 1;
      this.observer?.disconnect();
      this.detachLMBDragListeners();
      this.revokeObjectURL();
    },
    methods: {
      reloadImage() {
        const revision = ++this.requestRevision;
        this.error = null;
        this.data = null;
        this.resetZoom();
        this.revokeObjectURL();
        if (!this.src) return;

        requests.request(this.src, this.baseURI, { responseType: 'arraybuffer' })
          .then((response) => {
            if (this.isUnmounted || revision !== this.requestRevision) return;
            this.objectURL = URL.createObjectURL(new Blob([response.data], { type: response.headers['content-type']}));
            this.data = this.objectURL;
            this.$nextTick(this.observeImage);
          })
          .catch((e) => {
            if (!this.isUnmounted && revision === this.requestRevision) this.error = e;
          });
      },
      revokeObjectURL() {
        if (!this.objectURL) return;
        URL.revokeObjectURL(this.objectURL);
        this.objectURL = null;
      },
      observeImage() {
        const image = this.$refs.imgEle;
        if (this.observer && image) this.observer.observe(image);
      },
      handleResize(entries) {
        const img = entries[0].target;
        this.isDownscaled = img.naturalWidth > img.clientWidth;
      },
      toggleFullscreen() {
        fullScreen.toggle(this.$el, (value) => {
          this.isFullScreen = value;
        });
      },
      attachLMBDragListeners() {
        if (this.dragListenersAttached) return;

        this.$el.addEventListener('mousedown', this.onLMBMouseDown);
        this.$el.addEventListener('wheel', this.onImageWheel, { passive: false });
        window.addEventListener('mousemove', this.onLMBMouseMove);
        window.addEventListener('mouseup', this.onLMBMouseUp);
        this.dragListenersAttached = true;
      },
      detachLMBDragListeners() {
        this.$el.removeEventListener('mousedown', this.onLMBMouseDown);
        this.$el.removeEventListener('wheel', this.onImageWheel);
        window.removeEventListener('mousemove', this.onLMBMouseMove);
        window.removeEventListener('mouseup', this.onLMBMouseUp);
        this.isLMBDragActive = false;
        this.dragListenersAttached = false;
      },
      onLMBMouseDown(event) {
        if (event.button !== 0 || !this.isFullScreen) return;

        event.preventDefault();
        this.isLMBDragActive = true;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        this.dragStartScrollLeft = this.$el.scrollLeft;
        this.dragStartScrollTop = this.$el.scrollTop;
      },
      onLMBMouseMove(event) {
        if (!this.isLMBDragActive) return;

        this.$el.scrollLeft = this.dragStartScrollLeft - (event.clientX - this.dragStartX);
        this.$el.scrollTop = this.dragStartScrollTop - (event.clientY - this.dragStartY);
      },
      onLMBMouseUp(event) {
        if (event.button !== 0) return;

        this.isLMBDragActive = false;
      },
      onImageWheel(event) {
        if (!this.isFullScreen) return;

        const img = this.$refs.imgEle;
        if (!img?.naturalWidth || !img?.naturalHeight || !img.clientWidth) return;

        const factor = this.wheelZoomFactor(event);
        if (factor === 1) return;

        event.preventDefault();
        const nextScale = this.clampZoom(this.zoomScale * factor, img);
        if (Math.abs(nextScale - this.zoomScale) < 1e-4) return;

        const imgRect = img.getBoundingClientRect();
        const relX = (event.clientX - imgRect.left) / imgRect.width;
        const relY = (event.clientY - imgRect.top) / imgRect.height;

        this.zoomScale = nextScale;
        this.zoomWidth = Math.max(1, Math.round(img.naturalWidth * nextScale));
        img.style.width = `${this.zoomWidth}px`;

        const nextRect = img.getBoundingClientRect();
        const container = this.$el;
        container.scrollLeft += nextRect.left - (event.clientX - relX * nextRect.width);
        container.scrollTop += nextRect.top - (event.clientY - relY * nextRect.height);
      },
      wheelZoomFactor(event) {
        let dy = event.deltaY;
        if (!dy) return 1;
        if (event.deltaMode === 1) dy *= 40;
        else if (event.deltaMode === 2) dy *= 800;
        return Math.pow(ZOOM_STEP, -dy / WHEEL_NOTCH_PX);
      },
      clampZoom(scale, img) {
        const container = this.$el;
        if (!container.clientWidth || !container.clientHeight) return scale;

        const fit = Math.min(
          container.clientWidth / img.naturalWidth,
          container.clientHeight / img.naturalHeight
        );
        const min = Math.min(1, fit) || 1;
        return Math.min(ZOOM_MAX, Math.max(min, scale));
      },
      resetZoom() {
        this.zoomScale = 1;
        this.zoomWidth = null;
      }
    }
  };
</script>

<style scoped>
.image-cont {
  position: relative;
}

.icon-fullscreen {
  background: color-mix(in srgb, var(--dh-surface) 93%, transparent);
  border-radius: 20%;
}

.image-cont:hover > .fullscreen-icon {
  display:block;
}

.image-cont:fullscreen > .fullscreen-icon {
  position: fixed;
}

.image-cont:fullscreen {
  overflow: auto;
  display: flex;
  align-items: flex-start;
  justify-content: flex-start;
  cursor: grab;
}

.image-cont:fullscreen.drag-active {
  cursor: grabbing;
}

.image-cont:fullscreen > img {
  max-width: unset;
  margin: auto;
  flex-shrink: 0;
}

</style>
