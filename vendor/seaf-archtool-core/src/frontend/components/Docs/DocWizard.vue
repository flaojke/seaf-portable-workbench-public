<!--
  Copyright (C) 2026 Sber

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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber
-->

<template>
  <div class="doc-wizard">
    <v-alert v-if="error" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
      <div class="dh-alert__text">{{ error }}</div>
    </v-alert>
    <template v-else>
      <h2 class="doc-wizard__title">{{ wizardTitle }}</h2>
      <v-stepper
        v-if="withSteps"
        v-bind:model-value="displayedIndex"
        class="doc-wizard__stepper"
        flat
        hide-actions
        v-bind:editable="false">
        <v-stepper-header>
          <div
            v-for="(step, index) in steps"
            v-bind:key="step.id"
            class="doc-wizard__step-group">
            <v-stepper-item
              v-bind:value="index + 1"
              v-bind:title="step.title"
              v-bind:complete="index < currentIndex"
              v-bind:editable="false"
              v-bind:class="{
                'doc-wizard__step--current': index === currentIndex,
                'doc-wizard__step--done': index < currentIndex
              }" />
            <v-divider
              v-if="index < steps.length - 1"
              class="doc-wizard__step-line"
              v-bind:class="{ 'doc-wizard__step-line--done': index < currentIndex }" />
          </div>
        </v-stepper-header>
      </v-stepper>
      <div v-if="currentStep" v-bind:key="currentStep.id" class="doc-wizard__content">
        <dochub-object v-if="isObjectSrc" v-bind:src="currentStep.src" />
        <iframe v-else class="doc-wizard__iframe" v-bind:src="currentStep.src" />
      </div>
      <div class="doc-wizard__actions">
        <v-btn
          class="doc-wizard__btn doc-wizard__btn--prev"
          variant="outlined"
          v-bind:disabled="!canGoPrev"
          v-on:click="goPrev">
          <template #prepend>
            <v-icon icon="mdi-chevron-left" v-bind:color="null" />
          </template>
          Назад
        </v-btn>
        <v-tooltip location="top" v-bind:disabled="!nextBlockReason">
          <template #activator="{ props }">
            <span class="doc-wizard__next" v-bind="props">
              <v-btn
                class="doc-wizard__btn"
                color="primary"
                variant="flat"
                v-bind:disabled="!canGoNext"
                v-on:click="goNext">
                Далее
                <template #append>
                  <v-icon icon="mdi-chevron-right" v-bind:color="null" />
                </template>
              </v-btn>
            </span>
          </template>
          <span class="doc-wizard__next-hint">{{ nextBlockReason }}</span>
        </v-tooltip>
      </div>
    </template>
  </div>
</template>

<script>
  import { WIZARD_NAV_KEY } from './wizardNavMixin';

  export default {
    name: 'DocWizard',
    // Wrapped components can block navigation forward with optional message. See wizardNavMixin.
    provide() {
      return {
        [WIZARD_NAV_KEY]: {
          setBlocked: (id, blocked, message) => this.setNavBlocked(id, blocked, message)
        }
      };
    },
    props: {
      profile: {
        type: Object,
        required: true
      },
      getContent: {
        type: Function,
        required: true
      },
      pullData: {
        type: Function,
        required: true
      },
      path: {
        type: String,
        required: true
      },
      params: {
        type: Object,
        default: null
      },
      toPrint: {
        type: Boolean,
        default: false
      }
    },
    data() {
      return {
        refresher: null,
        steps: [],
        currentStepId: null,
        error: null,
        navBlockers: {}
      };
    },
    computed: {
      wizardTitle() {
        return this.profile?.title || 'Wizard';
      },
      withSteps() {
        return this.profile?.wizardConfig?.showProgress !== false;
      },
      restricted() {
        return this.profile?.wizardConfig?.navigationRules?.restricted !== false;
      },
      currentIndex() {
        return this.steps.findIndex((step) => step.id === this.currentStepId);
      },
      displayedIndex() {
        return this.currentIndex + 1;
      },
      currentStep() {
        return this.steps[this.currentIndex] || null;
      },
      isObjectSrc() {
        return this.currentStep?.src?.startsWith('@');
      },
      canGoPrev() {
        return this.currentIndex > 0;
      },
      canGoNext() {
        const technicallyCanGoNext = this.currentIndex >= 0 && this.currentIndex < this.steps.length - 1;
        return this.restricted ? technicallyCanGoNext && !Object.keys(this.navBlockers).length : technicallyCanGoNext;
      },
      nextBlockReason() {
        if (this.canGoNext) return '';
        return Object.values(this.navBlockers).filter(Boolean).join('\n');
      }
    },
    watch: {
      profile() {
        this.onRefresh();
      },
      currentStepId() {
        this.navBlockers = {};
      }
    },
    mounted() {
      this.onRefresh();
    },
    beforeUnmount() {
      if (this.refresher) clearTimeout(this.refresher);
    },
    methods: {
      setNavBlocked(id, blocked, message) {
        if (blocked) {
          this.navBlockers[id] = message;
        } else if (id in this.navBlockers) {
          delete this.navBlockers[id];
        }
      },
      doRefresh() {
        this.pullData().then((result) => {
          try {
            if (!Array.isArray(result)) {
              throw new Error('Steps must be an array');
            }
            this.steps = result;
            this.error = null;
            this.resolveCurrentStep();
          } catch (e) {
            this.error = e;
          }
        }).catch((e) => this.error = e);
      },
      onRefresh() {
        if (this.refresher) clearTimeout(this.refresher);
        this.refresher = setTimeout(this.doRefresh, 50);
      },
      resolveCurrentStep() {
        if (!this.steps.length) {
          this.currentStepId = null;
          return;
        }
        const stillThere = this.steps.some((step) => step.id === this.currentStepId);
        if (!stillThere) this.currentStepId = this.steps[0].id;
      },
      goPrev() {
        if (!this.canGoPrev) return;
        this.currentStepId = this.steps[this.currentIndex - 1].id;
      },
      goNext() {
        if (!this.canGoNext) return;
        this.currentStepId = this.steps[this.currentIndex + 1].id;
      }
    }
  };
</script>

<style scoped>
  .doc-wizard {
    padding: 16px;
  }

  .doc-wizard__title {
    margin: 0 0 12px;
    color: var(--dh-text);
    font-size: 20px;
    font-weight: 600;
    line-height: 28px;
  }

  .doc-wizard__stepper {
    margin-bottom: 16px;
    pointer-events: none;
    background: transparent;
  }

  .doc-wizard__stepper :deep(.v-stepper-header) {
    box-shadow: none;
  }

  .doc-wizard__step-group {
    display: contents;
  }

  /* Шаги: текущий — фирменный кружок и полужирное название, пройденные — галочка на светлом
     фирменном фоне, будущие — приглушенные. Цвета — из палитры (presentation.css) */
  .doc-wizard__stepper :deep(.v-stepper-item) {
    padding: 12px 16px;
    color: var(--dh-text-muted);
    opacity: 1;
  }

  .doc-wizard__stepper :deep(.v-stepper-item__avatar.v-avatar) {
    width: 26px;
    height: 26px;
    border: 1px solid var(--dh-border-strong);
    background: var(--dh-surface);
    color: var(--dh-text-muted);
    font-size: 13px;
    font-weight: 600;
  }

  .doc-wizard__stepper :deep(.v-stepper-item__title) {
    font-size: 14px;
    line-height: 20px;
  }

  .doc-wizard__stepper :deep(.doc-wizard__step--current) {
    color: var(--dh-text);
  }

  .doc-wizard__stepper :deep(.doc-wizard__step--current .v-stepper-item__avatar.v-avatar) {
    border-color: var(--dh-primary);
    background: var(--dh-primary);
    color: var(--dh-on-primary);
  }

  .doc-wizard__stepper :deep(.doc-wizard__step--current .v-stepper-item__title) {
    font-weight: 600;
  }

  .doc-wizard__stepper :deep(.doc-wizard__step--done) {
    color: var(--dh-text-secondary);
  }

  .doc-wizard__stepper :deep(.doc-wizard__step--done .v-stepper-item__avatar.v-avatar) {
    border-color: var(--dh-primary);
    background: var(--dh-primary-soft);
    color: var(--dh-primary-strong);
  }

  /* Галочка пройденного шага: глобальный цвет VIcon приходит inline-стилем */
  .doc-wizard__stepper :deep(.doc-wizard__step--done .v-stepper-item__avatar .v-icon) {
    color: var(--dh-primary-strong) !important;
  }

  /* У Vuetify разделитель заходит под соседние шаги (margin 0 -16px); оставляем зазор 8px до названий */
  .doc-wizard__step-line {
    margin: 0 -8px;
    border-color: var(--dh-border-strong);
    opacity: 1;
  }

  .doc-wizard__step-line--done {
    border-color: var(--dh-primary);
  }

  .doc-wizard__content {
    margin-bottom: 16px;
    min-height: 240px;
  }

  .doc-wizard__iframe {
    width: 100%;
    height: 100%;
    border: none;
    min-height: 480px;
  }

  .doc-wizard__actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .doc-wizard__next {
    display: inline-flex;
  }

  .doc-wizard__btn {
    height: 36px;
    border-radius: var(--dh-radius);
    font-size: 14px;
    font-weight: 500;
    letter-spacing: normal;
    text-transform: none;
  }

  .doc-wizard__btn--prev {
    border-color: var(--dh-border-strong);
    color: var(--dh-text);
  }

  .doc-wizard__btn--prev:hover {
    background: var(--dh-surface-hover);
  }

  .doc-wizard__next-hint {
    white-space: pre-line;
  }
</style>
