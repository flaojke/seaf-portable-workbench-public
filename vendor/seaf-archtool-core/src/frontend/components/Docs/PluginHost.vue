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
      Artyom Prilip <artyom.prilip@gmail.com>, Sber - 2026
-->

<template>
  <v-alert v-if="hostState === 'metadata-error'" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
    <div class="dh-alert__title">Не удалось загрузить сведения о плагинах</div>
    <div class="dh-alert__text">{{ metadataError }}</div>
  </v-alert>

  <spinner v-else-if="hostState === 'loading'" />

  <v-alert v-else-if="hostState === 'plugin-error'" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
    <div class="dh-alert__title">Ошибка загрузки плагина</div>
    <dl class="dh-alert__fields">
      <dt>Тип документа</dt>
      <dd>{{ docType }}</dd>
      <dt>Расположение</dt>
      <dd>{{ path }}</dd>
    </dl>
    <pre v-if="pluginLoadError?.message" class="dh-alert__code">{{ pluginLoadError.message }}</pre>
  </v-alert>

  <v-alert v-else-if="hostState === 'unknown'" class="dh-alert dh-alert--warning" icon="mdi-alert-outline">
    <div class="dh-alert__title">Неизвестный тип документа [{{ docType }}]</div>
    <dl class="dh-alert__fields">
      <dt>Расположение</dt>
      <dd>{{ path }}</dd>
      <dt>Параметры</dt>
      <dd>{{ JSON.stringify(params) }}</dd>
    </dl>
    <pre class="dh-alert__code">{{ JSON.stringify(profile, null, 2) }}</pre>
  </v-alert>

  <error-boundary v-else v-bind:key="errorBoundaryKey" v-bind:on-error="onRendererError" tag="div" stop-propagation>
    <template #boundary="{ hasError, err, info }">
      <v-alert v-if="hasError" class="dh-alert dh-alert--error" icon="mdi-alert-circle-outline">
        <div class="dh-alert__title">Ошибка рендера документа</div>
        <dl class="dh-alert__fields">
          <dt>Тип документа</dt>
          <dd>{{ docType }}</dd>
          <dt>Расположение</dt>
          <dd>{{ path }}</dd>
          <dt>Этап</dt>
          <dd>{{ info }}</dd>
        </dl>
        <pre class="dh-alert__code">{{ err?.message || err }}</pre>
      </v-alert>
      <component
        v-bind:is="renderer"
        v-else
        v-bind:inline="inline"
        v-bind:params="params"
        v-bind:profile="profile"
        v-bind:path="path"
        v-bind:get-content="getContent"
        v-bind:put-entities="putEntities"
        v-bind:put-content="putContent"
        v-bind:to-print="toPrint"
        v-bind:event-bus="eventBus"
        v-bind:pull-data="pullData"
        v-bind:context-menu="contextMenu" />
    </template>
  </error-boundary>
</template>

<script setup lang="ts">
  import { resolvePluginHostState } from '@front/plugins/resolve-plugin-host-state';
  import Spinner from '@front/components/Controls/Spinner.vue';
  import { ErrorBoundary } from '@front/shared/ErrorBoundary';
  import { getLoggerWithTag } from '@global/logger/v2/logger.mjs';
  import { pluginManager } from '@front/plugins/plugin-manager';
  import { computed, ref, watch } from 'vue';

  const logger = getLoggerWithTag('f/c/D/PluginHost');

  defineOptions({
    name: 'PluginHost'
  });

  // TODO: Типизировать через дженерик
  const props = defineProps({
    metadataError: {
      type: String,
      default: null
    },
    renderer: {
      type: [String, Object, Function],
      default: null
    },
    docType: {
      type: String,
      default: 'unknown'
    },
    isReloading: {
      type: Boolean,
      default: false
    },
    pluginsReady: {
      type: Boolean,
      default: false
    },
    inline: {
      type: Boolean,
      default: false
    },
    params: {
      type: Object,
      default: () => ({})
    },
    profile: {
      type: Object,
      default: null
    },
    path: {
      type: String,
      default: ''
    },
    getContent: {
      type: Function,
      required: true
    },
    putEntities: {
      type: Function,
      required: true
    },
    putContent: {
      type: Function,
      required: true
    },
    toPrint: {
      type: Boolean,
      default: false
    },
    eventBus: {
      type: Object,
      required: true
    },
    pullData: {
      type: Function,
      required: true
    },
    contextMenu: {
      type: Array,
      default: () => []
    }
  });
  const errorBoundaryKey = ref(0);
  const pluginLoadError = ref<Error | null>(null);
  let loadRequestId = 0;

  const onRendererError = (
    error: unknown,
    _rendererInstance: unknown,
    info: string
  ): void => {
    logger.error(
      () => `Ошибка рендера документа типа [${props.docType}] `
        + `по пути [${props.path}], этап [${info}]`,
      error
    );
  };

  const availablePlugin = computed(() => {
    return pluginManager.getAvailablePluginByDocumentType(props.docType);
  });

  // Resolver определяет, что показывать: renderer, ожидание или ошибку.
  const hostState = computed(() => {
    return resolvePluginHostState({
      isReloading: props.isReloading,
      hasRenderer: Boolean(props.renderer),
      pluginsReady: props.pluginsReady,
      hasProfile: Boolean(props.profile),
      hasAvailablePlugin: Boolean(availablePlugin.value),
      hasMetadataError: Boolean(props.metadataError),
      hasPluginError: Boolean(pluginLoadError.value)
    });
  });

  const loadAvailablePlugin = async() => {
    const requestId = ++loadRequestId;

    pluginLoadError.value = null;

    if (
      props.isReloading
      || !props.pluginsReady
      || !props.profile
      || props.renderer
      || !availablePlugin.value
    ) {
      return;
    }

    const documentType = props.docType;

    try {
      await pluginManager.loadPluginByDocumentType(documentType);
    } catch (error: unknown) {
      if (requestId !== loadRequestId) return;

      pluginLoadError.value = error instanceof Error
        ? error
        : new Error(String(error));
    }
  };

  // Сбрасываем ошибку boundary при перерегистрации renderer
  // без размонтирования хоста.
  watch(() => props.renderer, () => {
    errorBoundaryKey.value++;
  });

  watch([
    () => props.docType,
    () => props.isReloading,
    () => props.pluginsReady,
    () => props.profile,
    () => props.renderer,
    availablePlugin
  ], loadAvailablePlugin, {
    immediate: true
  });
</script>
