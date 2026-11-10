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
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber

  Contributors:
      Saveliy Zaznobin <zaznobins@yandex.ru>, Sber - 2025, 2026
      Aksinenko Anatoly <aiaksinenko@sberbnak.ru>, Sber - 2026
      Konstantin Myachin <kvmyachin@gmail.com>, Sber - 2026
-->

<template>
  <div id="seaf2drawiojs">
    <div class="header-bar">
      <h1 class="title">{{ title }}</h1>
      <v-tooltip v-if="routingNotice" v-bind:text="routingNotice" location="bottom" max-width="300" open-on-click>
        <template #activator="{ props }">
          <v-btn v-bind="props" size="small" variant="text" color="warning" icon="mdi-alert-circle-outline" v-bind:aria-label="routingNotice" />
        </template>
      </v-tooltip>
      <v-btn v-if="routingNotice" size="small" variant="text" icon="mdi-refresh" aria-label="Повторить" title="Повторить" v-bind:disabled="routingPending" v-on:click="onRefresh" />
      <v-btn v-if="aiConfig.enabled" color="secondary" v-on:click="aiDialogOpen = true">Перестроить с ИИ</v-btn>
      <v-btn v-if="aiApplied" color="secondary" v-on:click="handleAiRestore">Вернуть исходную схему</v-btn>
      <v-btn
        color="primary"
        v-bind:disabled="savingTransform || exporting || routingPending || !!routingError || !editorReady || !diagram || !!diffError || aiExportBlocked"
        v-bind:loading="savingTransform || exporting"
        v-on:click="initiateExport(saveTransform)">
        {{ diffPath ? 'Save transformations' : 'Export transformations' }}
      </v-btn>
      <v-btn v-if="withSaving" color="primary" v-bind:disabled="exporting || routingPending || !!routingError || !editorReady || aiExportBlocked" v-on:click="initiateExport(saveArch)">Export arch</v-btn>
      <v-btn color="primary" v-bind:disabled="aiExportBlocked" v-on:click="exportData">Export data</v-btn>
    </div>
    <v-alert v-if="diffError || exportError" class="dh-alert dh-alert--error ma-4" icon="mdi-alert-circle-outline">
      {{ diffError || exportError }}
    </v-alert>
    <v-alert v-if="aiApplied" class="dh-alert dh-alert--warning ai-status" icon="mdi-alert-outline">
      Активен компактный AI-датасет. Экспорт и сохранение заблокированы до обновления исходных данных.
    </v-alert>
    <ai-draft-dialog
      v-if="aiBaselineData"
      ref="aiDraftDialog"
      v-model="aiDialogOpen"
      v-bind:profile="profile"
      v-bind:config="aiConfig"
      v-bind:baseline-data="aiBaselineData"
      v-bind:layout-settings="layoutSettings"
      v-bind:templates="templates"
      v-bind:diff="diff"
      v-bind:logger="renderLogger"
      v-on:busy-change="aiBusy = $event"
      v-on:preview="handleAiPreview"
      v-on:restore="handleAiRestore"
      v-on:apply="handleAiApply" />
    <div v-if="routingPending" class="routing-status" aria-live="polite">{{ routingStatus }}</div>
    <iframe v-if="!routingError || xml" ref="frame" class="diagram-cont" v-bind:inert="routingPending ? '' : null" v-bind:src="serverURI" />
  </div>
</template>

<script>
  import { markRaw, ref, toRaw } from 'vue';
  import yaml from 'yaml';

  import env from '@front/helpers/env';
  import { buildDrawioUrl } from '@front/helpers/drawioUrl';
  import { layoutSettingsFromProfile } from '../lib/layout-settings';
  import {
    createExportOperationState,
    parseDrawioMessage
  } from '../lib/export-operation';
  import AiDraftDialog from './AiDraftDialog.vue';
  import {
    getDiffContent,
    mergeDiffs,
    manualRouteIds,
    normalizeDiffPath,
    putDiffContent,
    stringifyDiffContent
  } from '../lib/transformations';
  import uriTool from '@front/helpers/uri';
  import { resolvePathInsideRoot } from '@global/helpers/updateRootFiles/updateRootFilesInPutContent';
  import {
    isAiExportBlocked,
    resolveAiDraftConfig
  } from '../lib/ai-draft';
  import { renderSeafDiagram } from '../lib/renderer';
  import { createLayerColorMap, parseDiagramDocument, replaceDiagramPage, routeCorridorPage, splitDiagramPages } from '../lib/corridor-routing';
  import { routingIssueMessage } from '../lib/routing-diagnostics';
  import libraryElements from '!!raw-loader!../lib/lib.yaml';
  const logger = DocHub.documents.getLoggerWithTag('seaf2drawiojs');

  const SEAF2DRAWIO_MANDATORY_PARAMS = {
    embed: '1',
    proto: 'json',
    configure: '1'
  };

  const libItems = yaml.parse(libraryElements);

  const library = [{
    'title': {
      'main': 'SEAF'
    },
    'entries': [{
      'id': 'seaf-graphics',
      'title': {
        'main': 'SEAF'
      },
      'desc': {
        'main': 'SEAF Architecture Nodes' },
      'libs': [{
        'title': {
          'main': 'SEAF Framework'
        },
        'data': libItems
      }]
    }]
  }];

  export default {
    name: 'Seaf2drawiojs',
    components: {
      AiDraftDialog
    },
    props: {
      // Требуем обязательно передавать профайл документа
      profile: {
        type: Object,
        required: true
      },
      // Требуем обязательно передавать функцию получения контента
      getContent: {
        type: Function,
        required: true
      },
      // Требуем обязательно передавать функцию доступа к Data Lake
      pullData: {
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
      // Требуем обязательно сообщать путь к объекту описывающему документ в коде
      path: {
        type: String,
        required: true
      },
      // Запрашиваем параметры рендеринга
      params: {
        type: Object,
        default: null
      },
      // Признак рендеринга для печати
      toPrint: {
        type: Boolean,
        default: false
      }
    },
    setup() {
      const frame = ref(null);
      return {
        frame
      };
    },
    data() {
      return {
        editorReady: false,
        withSaving: false,
        title: 'Loading...',
        xml: null,
        resultXml: null,
        diagram: null,
        diffPath: null,
        diffContentPath: null,
        loadedDiff: null,
        diffError: null,
        savingTransform: false,
        exportController: null,
        exportError: null,
        routingPending: false,
        routingController: null,
        routingError: null,
        routingNotice: '',
        routingGeneration: 0,
        routingStatus: '',
        aiConfig: resolveAiDraftConfig(this.profile, null),
        aiDialogOpen: false,
        aiBusy: false,
        aiPreviewXml: null,
        aiApplied: false,
        aiBaselineData: null,
        renderLogger: logger,
        diagramPages: {'main': ['Main Schema'], 'office': [], 'dc': []},
        diagramIds: {'Main Schema': []}
      };
    },
    computed: {
      serverURI() {
        return buildDrawioUrl({
          documentParams: this.profile?.drawio_url_params,
          componentMandatory: SEAF2DRAWIO_MANDATORY_PARAMS
        });
      },
      aiExportBlocked() {
        return isAiExportBlocked(this);
      },
      exporting() {
        return Boolean(this.exportController?.current);
      }
    },
    watch: {
      editorReady() {
        if (this.editorReady && this.xml) this.loadContent();
      },
      serverURI(uri) {
        logger.info(() => `Draw.io server URI changed: ${uri}`);
      }
    },
    created() {
      this.exportController = createExportOperationState(() => {
        this.exportError = 'Draw.io не вернул данные экспорта. Повторите действие.';
        logger.error(() => 'Draw.io export timed out');
      });
    },
    mounted() {
      logger.info(() => `Seaf2Drawiojs mounted, Draw.io server URI: ${this.serverURI}`);
      this.onRefresh();
      window.addEventListener('message', this.messageHandler);
    },
    unmounted() {
      window.removeEventListener('message', this.messageHandler);
      this.exportController?.cancel();
      this.routingGeneration += 1;
      this.cancelRouting();
      if (this.refresher) clearTimeout(this.refresher);
    },
    methods: {
      messageHandler(evt) {
        if (evt?.source !== this.frame?.contentWindow || typeof evt?.data !== 'string' || !evt.data) return;

        const data = parseDrawioMessage(evt.data);
        if (!data) {
          logger.warn(() => 'Ignoring malformed message from Draw.io');
          return;
        }

        logger.info(() => `Received message from draw.io, ${data.event}`);
        if (data.event === 'configure') {
          this.configure();
        }
        if (data.event === 'init') {
          this.editorReady = true;
        } else if (data.event === 'save') {
          this.saveXml(data.xml);
        }
        if (data.event === 'export' && this.exportController?.current) {
          const exportOperation = this.exportController.current;
          if (!this.exportController?.responseStarted(exportOperation, data)) return;
          Promise.resolve()
            .then(() => exportOperation.handler(data))
            .catch((error) => {
              if (this.exportController?.current?.token === exportOperation.token) {
                this.exportError = 'Не удалось экспортировать данные из Draw.io. Повторите действие.';
              }
              logger.error(() => 'Draw.io export failed', error);
            })
            .finally(() => this.clearExportOperation(exportOperation));
        }
      },
      clearExportOperation(operation = this.exportController?.current) {
        if (!this.exportController?.finish(operation)) return;
      },
      initiateExport(op) {
        if (this.aiExportBlocked) return;
        if (this.routingError) {
          this.exportError = this.routingError;
          return;
        }
        if (this.routingPending) {
          this.exportError = 'Дождитесь завершения маршрутизации связей.';
          return;
        }
        if (this.exportController?.current) {
          this.exportError = 'Дождитесь завершения текущей операции Draw.io.';
          return;
        }
        if (!this.editorReady || !this.frame?.contentWindow) {
          this.exportError = 'Редактор Draw.io ещё не готов. Повторите действие позже.';
          return;
        }
        this.exportError = null;
        const exportOperation = this.exportController?.start(op);
        if (!exportOperation) {
          this.exportError = 'Дождитесь завершения текущей операции Draw.io.';
          return;
        }
        try {
          const exportMessage = JSON.stringify( { action: 'export', format: 'html', requestId: exportOperation.requestId });
          this.frame.contentWindow.postMessage(exportMessage, '*');
        } catch (error) {
          this.clearExportOperation(exportOperation);
          this.exportError = 'Не удалось отправить запрос экспорта в Draw.io. Повторите действие.';
          logger.error(() => 'Unable to request Draw.io export', error);
        }
      },
      configure() {
        const config = {
          libraries: library,
          defaultLibraries: 'seaf-graphics',
          settingsName: 'seaf2drawio',
          expandLibraries: false
        };
        const configureMessage = JSON.stringify( { action: 'configure', config });
        this.frame.contentWindow.postMessage(configureMessage, '*');
        logger.info(() => 'Draw.io configuration sent');
      },
      loadContent() {
        if (this.editorReady && this.xml) {
          try {
            const content = JSON.stringify( { action: 'load', xml: this.xml });
            this.frame.contentWindow.postMessage(content, '*');
            logger.info(() => 'Draw.io content sent');
            return true;
          } catch (error) {
            this.routingError = 'Не удалось обновить редактор.';
            this.routingNotice = 'Не удалось обновить редактор. Подробности в журнале ArchTool.';
            logger.error(() => 'Unable to load Draw.io content', error);
            return false;
          }
        }
      },

      corridorRoutingEnabled() {
        return (this.layoutSettings ?? layoutSettingsFromProfile(this.profile, null))?.corridor_routing === true;
      },

      cancelRouting() {
        this.routingController?.abort();
        this.routingController = null;
      },

      async routeXml(sourceXml, generation) {
        if (generation !== this.routingGeneration) return;
        this.cancelRouting();
        this.xml = sourceXml;
        this.routingError = null;
        this.routingNotice = '';
        if (!this.corridorRoutingEnabled()) {
          this.routingPending = false;
          this.routingStatus = '';
          this.xml = sourceXml;
          this.loadContent();
          return;
        }
        const controller = new AbortController();
        this.routingController = controller;
        this.routingPending = true;
        const current = () => generation === this.routingGeneration
          && this.routingController === controller && !controller.signal.aborted;
        let resultXml = sourceXml;
        try {
          if (this.loadContent() === false) throw new Error('Unable to load Draw.io content');
          const document = parseDiagramDocument(sourceXml);
          const pages = splitDiagramPages(document);
          const layerColors = createLayerColorMap(document);
          let failures = 0;
          for (let pageIndex = 0; pageIndex < pages.length; pageIndex += 1) {
            if (!current()) return;
            this.routingStatus = `Маршрутизация: ${pageIndex + 1}/${pages.length}`;
            const pageId = document.querySelectorAll('mxfile > diagram')[pageIndex].getAttribute('id');
            const preservedEdges = manualRouteIds(this.diff?.[pageId]);
            const result = await routeCorridorPage(pages[pageIndex], { layerColors, preservedEdges, signal: controller.signal });
            if (!current()) return;
            resultXml = replaceDiagramPage(document, pageIndex, result.xml);
            this.xml = resultXml;
            if (this.loadContent() === false) throw new Error('Unable to load Draw.io content');
            const diagnostics = result.diagnostics ?? {};
            failures += (diagnostics.failedEdges ?? 0) + (diagnostics.skippedEdges ?? 0);
            for (const issue of diagnostics.failed ?? []) {
              logger.error(() => routingIssueMessage(issue, pageIndex, pages.length, 'Не удалось проложить связь'));
            }
            for (const issue of diagnostics.skipped ?? []) {
              logger.warn(() => routingIssueMessage(issue, pageIndex, pages.length, 'Связь пропущена'));
            }
            logger.info(() => `Маршрутизация страницы ${pageIndex + 1}/${pages.length}: связей ${diagnostics.totalLogicalEdges ?? 'неизвестно'}, проложено ${diagnostics.routedEdges ?? 0}, ошибок ${diagnostics.failedEdges ?? 0}, пропущено ${diagnostics.skippedEdges ?? 0}.`);
          }
          if (!current()) return;
          this.xml = resultXml;
          this.diagram?.captureRoutingBaseline?.(resultXml, this.diff);
          this.routingNotice = failures ? 'Часть связей показана без маршрутизации. Подробности в журнале ArchTool.' : '';
          this.routingStatus = failures ? 'Маршрутизация частичная' : 'Маршрутизация завершена';
        } catch (error) {
          if (!current()) return;
          logger.error(() => 'Corridor routing failed', error);
          this.xml = resultXml;
          this.routingError = 'Маршрутизация не завершена.';
          this.routingNotice = 'Показана доступная часть схемы. Экспорт временно недоступен. Подробности в журнале ArchTool.';
          this.routingStatus = 'Маршрутизация не завершена';
        } finally {
          if (current()) {
            this.routingController = null;
            this.routingPending = false;
          }
        }
      },

      composeDiagram(options = {}) {
        const rendered = renderSeafDiagram({
          dataset: toRaw(this.data),
          layoutSettings: toRaw(this.layoutSettings),
          templates: toRaw(this.templates),
          diff: toRaw(this.diff),
          logger,
          useAiKbFallback: this.aiApplied
        });
        this.data = markRaw(rendered.dataset);
        this.diagram = markRaw(rendered.diagram);
        this.seafDrawio = markRaw(rendered.seafDrawio);
        this.diagramPages = rendered.diagramPages;
        this.diagramIds = rendered.diagramIds;
        if (options.load !== false) this.startRouting(rendered.xml, options.generation ?? this.routingGeneration);
        return rendered.report;
      },

      startRouting(xml, generation) {
        this.routeXml(xml, generation).catch((error) => {
          if (generation === this.routingGeneration) this.failRefresh(error);
        });
      },

      handleAiPreview(xml) {
        this.aiPreviewXml = xml;
        this.startRouting(xml, ++this.routingGeneration);
      },

      handleAiRestore() {
        this.cancelRouting();
        this.aiPreviewXml = null;
        this.aiApplied = false;
        try {
          this.data = structuredClone(toRaw(this.aiBaselineData));
          this.composeDiagram({ generation: ++this.routingGeneration });
        } catch (error) {
          this.failRefresh(error);
        }
      },

      handleAiApply(dataset) {
        this.cancelRouting();
        try {
          this.data = markRaw(structuredClone(toRaw(dataset)));
          this.aiApplied = true;
          this.composeDiagram({ generation: ++this.routingGeneration });
          this.aiPreviewXml = null;
        } catch (error) {
          this.failRefresh(error);
        }
      },

      async composeArchData(objectList) {
        let archData = {};
        for (const page in objectList) {
          Object.entries(objectList[page]).forEach(([k, object]) => {
            const key = object.OID ?? k;
            archData[key] = object;
            delete object.id;
            delete object.label;
          });
        }
        const output = {};
        for (const key in archData) {
          const schema = archData[key].schema;
          if (schema) {
            output[schema] = output[schema] ?? {};
            output[schema][key] = archData[key];
            delete archData[key].schema;
          }
        }
        return output;
      },

      beginRefresh() {
        this.cancelRouting();
        this.exportController?.cancel();
        this.routingPending = true;
        this.routingError = null;
        this.routingNotice = '';
        this.routingStatus = 'Получение данных…';
      },

      failRefresh(error) {
        this.cancelRouting();
        this.routingPending = false;
        this.routingError = 'Не удалось обновить схему.';
        this.routingNotice = this.xml
          ? 'Не удалось обновить схему. Показан предыдущий результат. Подробности в журнале ArchTool.'
          : 'Не удалось получить схему. Подробности в журнале ArchTool.';
        this.routingStatus = 'Ошибка обновления схемы';
        logger.error(() => 'Unable to update diagram', error);
      },

      async doRefresh(generation = ++this.routingGeneration) {
        if (generation !== this.routingGeneration) return;
        this.beginRefresh();
        this.$refs.aiDraftDialog?.cancelGeneration?.();
        this.aiBusy = false;
        this.aiConfig = { ...this.aiConfig, enabled: false };
        this.diffError = null;
        try {
          const data = await this.pullData();
          if (generation !== this.routingGeneration) return;
          if (data) {
            this.layoutSettings = layoutSettingsFromProfile(this.profile, data);
            this.aiConfig = resolveAiDraftConfig(this.profile, data);
            this.aiPreviewXml = null;
            this.aiApplied = false;
            const sourceData = data.dataset ? data.dataset : data;
            this.aiBaselineData = markRaw(structuredClone(toRaw(sourceData)));
            this.data = markRaw(structuredClone(this.aiBaselineData));
            this.templates = data.templates ? data.templates : null;
            this.title = data.title ?? 'Seaf2DrawIO';
            this.diff = data.diff ?? null;
            this.loadedDiff = this.diff;
            this.diffPath = null;
            this.diffContentPath = null;
            try {
              this.diffPath = normalizeDiffPath(data.diff_path);
              this.diffContentPath = this.diffPath && env.isPlugin()
                ? resolvePathInsideRoot(this.diffPath, uriTool.getBaseURIOfPath(this.path), env.rootManifest)
                : this.diffPath;
              if (this.diffContentPath) {
                const diff = await getDiffContent(this.getContent, this.diffContentPath);
                if (generation !== this.routingGeneration) return;
                this.diff = diff;
                this.loadedDiff = diff;
              }
            } catch (error) {
              if (generation !== this.routingGeneration) return;
              this.diff = null;
              this.loadedDiff = null;
              this.diffError = 'Не удалось прочитать файл трансформаций. Сохранение заблокировано: обновите документ после устранения ошибки.';
              logger.error(() => 'Unable to load transformations', error);
            }
            this.savePath = data.save_path ?? null;
            this.withSaving = data.with_save ?? false;
            this.composeDiagram({ generation });
          } else {
            this.failRefresh(new Error('PullData() не вернул данных для построения'));
          }
        } catch (error) {
          if (generation !== this.routingGeneration) return;
          this.failRefresh(error);
        }
      },

      onRefresh() {
        if (this.refresher) clearTimeout(this.refresher);
        const generation = ++this.routingGeneration;
        this.beginRefresh();
        this.refresher = setTimeout(() => this.doRefresh(generation), 50);
      },

      exportData() {
        if (this.aiExportBlocked) return;
        const str = yaml.stringify(this.data);
        const encode = window.btoa(unescape(encodeURIComponent(str)));
        const yamlUrl = `data:application/yaml;base64,${encode}`;
        if (env.isPlugin()) {
          window.$PAPI.download(
            yamlUrl,
            'Save arch YAML',
            'Выберите файл для сохранения выгрузки',
            'yaml'
          );
        } else {
          const link = document.createElement('a');
          link.download = `data${Date.now()}.yaml`;
          link.href = yamlUrl;
          link.click();
        }
      },

      async saveArch(data) {
        if (!this.withSaving || this.aiExportBlocked || this.routingPending || this.routingError) {
          return;
        }
        const generation = this.routingGeneration;
        logger.debug(() => 'Saving architecture.');
        this.resultXml = data.xml;
        const {newObjects, changedObjects} = this.diagram.getObjectDiff(this.resultXml);
        const newObjectArch = await this.composeArchData(newObjects);
        if (Object.keys(newObjectArch).length > 0 && !this.savePath) {
          logger.error(() => 'Saving method invoked with new objects present, but no valid default save_path provided in document declaration.');
          return;
        }
        const changedObjectArch = await this.composeArchData(changedObjects);
        if (generation !== this.routingGeneration || this.routingPending || this.routingError) return;
        logger.debug(() => `saveArch new objects: ${JSON.stringify(newObjectArch)}`);
        logger.debug(() => `saveArch changed object: ${JSON.stringify(changedObjectArch)}`);
        await this.putEntities({ ...newObjectArch, ...changedObjectArch }, { defaultSource: this.savePath });
      },

      async saveTransform(data) {
        if (this.savingTransform || this.aiExportBlocked || this.routingPending || this.routingError) return;
        const generation = this.routingGeneration;
        this.savingTransform = true;
        try {
          const resultXml = data.xml;
          const currentDiff = this.diffPath
            ? await getDiffContent(this.getContent, this.diffContentPath)
            : this.loadedDiff;
          if (generation !== this.routingGeneration || this.routingPending || this.routingError) return;
          const diff = mergeDiffs(toRaw(currentDiff), this.diagram.getDiff(resultXml), this.diagram.indices);
          if (this.diffPath) {
            const str = stringifyDiffContent(diff, this.diffPath);
            await putDiffContent(this.putContent, this.diffContentPath, str, env.isPlugin());
            this.diff = diff;
            this.loadedDiff = diff;
            return;
          }
          const str = yaml.stringify(diff);
          const encode = window.btoa(unescape(encodeURIComponent(str)));
          const yamlUrl = `data:application/yaml;base64,${encode}`;
          if (env.isPlugin()) {
            window.$PAPI.download(
              yamlUrl,
              'Save diff YAML',
              'Выберите файл для сохранения выгрузки',
              'yaml'
            );
          } else {
            const link = document.createElement('a');
            link.download = `diff${Date.now()}.yaml`;
            link.href = yamlUrl;
            link.click();
          }
        } catch (error) {
          this.exportError = error?.message || 'Не удалось сохранить трансформации. Повторите действие.';
          logger.error(() => 'Unable to save transformations', error);
        } finally {
          this.savingTransform = false;
        }
      },

      saveXml(xml) {
        if (this.aiExportBlocked || this.routingPending || this.routingError) return;
        const encode = window.btoa(unescape(encodeURIComponent(xml)));
        const xmlUrl = `data:text/xml;base64,${encode}`;
        if (env.isPlugin()) {
          window.$PAPI.download(
            xmlUrl,
            'Save XML',
            'Выберите файл для сохранения выгрузки',
            'drawio'
          );
        } else {
          const link = document.createElement('a');
          link.download = `drawio_${Date.now()}.drawio`;
          link.href = xmlUrl;
          link.click();
        }
      }
    }
  };
</script>

<style>
.header-bar {
  display: flex;
  margin: 0 20px;
  justify-content: space-between;
  align-items: center;
}

.title {
  margin: 0 auto 0 0;
}

.header-bar .v-btn + .v-btn {
  margin-left: 8px;
}

.diagram-cont {
  width: 100%;
  height: calc(100dvh - 119px);
}

.routing-status {
  margin: 0 20px;
}

.ai-status {
  margin-top: 12px;
}
</style>
