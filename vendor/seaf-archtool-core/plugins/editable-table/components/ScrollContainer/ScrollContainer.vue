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
      Aksinenko Anatoly <aiaksinenko@sberbank.ru>, Sber - 2026
-->

<template>
  <div class="scroll-container">
    <div
      ref="content"
      class="content"
      v-on:scroll="onScroll"
      v-on:wheel="onWheel">
      <div ref="content-body">
        <slot />
      </div>
    </div>
    <div
      ref="scroll-bar"
      class="scroll-bar"
      v-bind:class="{ 'scroll-bar_hidden': !hasOverflow }"
      v-on:scroll="onScroll">
      <div ref="content-shadow" class="content-shadow" />
    </div>
  </div>
</template>

<script>
  export default {
    props: {
      inline: {
        type: Boolean,
        required: true
      }
    },
    data() {
      return {
        wrapperElement: null,
        contentElement: null,
        // Таблица шире области просмотра: показываем полосу прокрутки
        hasOverflow: false,
        observer: new ResizeObserver((entries) => {
          this.updateViewportHeight();
          this.updateOverflow();

          for (let i = 0; i < entries.length; i++) {
            const contentShadow = this.$refs['content-shadow'];

            if (contentShadow instanceof HTMLElement) {
              const { scrollWidth } = entries[i].target;
              contentShadow.style.width = `${scrollWidth}px`;
            }
          }
        })
      };
    },
    mounted() {
      const wrapperElement = this.$refs['content-body'];

      if (wrapperElement && wrapperElement instanceof HTMLElement) {
        this.wrapperElement = wrapperElement;
        this.observer.observe(wrapperElement);

        const contentElement = wrapperElement.firstElementChild;

        if (contentElement && contentElement instanceof HTMLElement) {
          this.contentElement = contentElement;
          this.observer.observe(contentElement);
        }

        window.addEventListener('resize', this.updateViewportHeight);
        window.addEventListener('resize', this.updateOverflow);
        this.$nextTick(this.updateViewportHeight);
      }
    },

    beforeUnmount() {
      if (this.wrapperElement) {
        this.observer.unobserve(this.wrapperElement);
      }
      if (this.contentElement) {
        this.observer.unobserve(this.contentElement);
      }
      window.removeEventListener('resize', this.updateViewportHeight);
      window.removeEventListener('resize', this.updateOverflow);
      this.observer.disconnect();
    },

    methods: {
      updateViewportHeight() {
        if (!this.$el) return;
        if (this.inline) return;

        const availableHeight = window.innerHeight - this.$el.getBoundingClientRect().top - 2;
        this.$el.style.maxHeight = `${Math.max(availableHeight, 120)}px`;
      },

      updateOverflow() {
        const content = this.$refs.content;
        if (content instanceof HTMLElement) {
          this.hasOverflow = content.scrollWidth > content.clientWidth;
        }
      },
      // Горизонтальная прокрутка колесом и трекпадом над таблицей. У области таблицы
      // overflow-x: hidden (полоса прокрутки вынесена в scroll-bar), поэтому браузер сам
      // ее не сдвигает. Горизонтальный жест трекпада или колесо с Shift сдвигают таблицу;
      // у края таблицы событие не перехватывается и прокручивает страницу.
      onWheel(e) {
        const content = this.$refs.content;
        if (!(content instanceof HTMLElement)) return;

        const maxScrollLeft = content.scrollWidth - content.clientWidth;
        if (maxScrollLeft <= 0) return;

        const isHorizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
        let delta = isHorizontal ? e.deltaX : (e.shiftKey ? e.deltaY : 0);
        if (!delta) return;

        // deltaMode: 1 — строки (колесо мыши в Firefox), 2 — страницы
        if (e.deltaMode === 1) delta *= 16;
        else if (e.deltaMode === 2) delta *= content.clientWidth;

        const scrollLeft = Math.min(maxScrollLeft, Math.max(0, content.scrollLeft + delta));
        if (scrollLeft === content.scrollLeft) return;

        e.preventDefault();
        content.scrollLeft = scrollLeft;
      },
      onScroll(e) {
        const { scrollLeft } = e.target;

        const element = e.target === this.$refs.content
          ? this.$refs['scroll-bar']
          : this.$refs.content;

        if (element.scrollLeft !== scrollLeft) {
          element.scrollLeft = e.target.scrollLeft;
        }
      }
    }
  };
</script>

<style scoped>
.scroll-container {
  display: flex;
  flex-direction: column;
}

.content {
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
}

/*
  Полоса горизонтальной прокрутки прилипает к нижнему краю окна, пока таблица на экране:
  у длинной встроенной таблицы (inline, без ограничения высоты) иначе она оказывается
  под последней строкой.
*/
.scroll-bar {
  box-sizing: content-box;
  flex: none;
  position: sticky;
  bottom: 0;
  z-index: 10;
  padding-top: 4px;
  height: 16px;
  overflow-x: auto;
  overflow-y: hidden;
  background-color: var(--dh-surface);
  border-top: 1px solid var(--dh-border);
  scrollbar-color: auto;
}

.scroll-bar_hidden {
  display: none;
}

/* Полоса всегда видна: в macOS системные полосы по умолчанию скрыты до начала прокрутки */
.scroll-bar::-webkit-scrollbar {
  height: 10px;
}

.scroll-bar::-webkit-scrollbar-track {
  background: transparent;
}

.scroll-bar::-webkit-scrollbar-thumb {
  background-color: var(--dh-border-strong);
  border-radius: 5px;
}

.scroll-bar::-webkit-scrollbar-thumb:hover {
  background-color: var(--dh-text-muted);
}

@supports not selector(::-webkit-scrollbar) {
  .scroll-bar {
    scrollbar-width: thin;
    scrollbar-color: var(--dh-border-strong) transparent;
  }
}

.content-shadow {
  height: 1px;
  visibility: hidden;
}
</style>
