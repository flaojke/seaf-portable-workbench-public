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
-->

<template>
  <v-dialog
    v-bind:model-value="modelValue"
    max-width="920"
    persistent
    v-on:update:model-value="updateDialog">
    <v-card>
      <v-card-title>
        Перестроение схемы с ИИ
        <v-chip color="warning" size="small" class="ml-3">Бета</v-chip>
      </v-card-title>
      <v-card-text>
        <v-alert class="dh-alert dh-alert--warning ai-disclosure" icon="mdi-alert-outline">
          <strong>Бета-версия.</strong>
          Текст запроса и отобранный контекст архитектурных данных передаются в настроенный в ArchTool GigaChat через общий chatService.
          Не вводите секреты, персональные и иные данные, не разрешённые к обработке выбранным сервисом.
        </v-alert>
        <v-textarea
          v-model="aiPrompt"
          label="Опишите, что должно быть на схеме"
          rows="5"
          v-bind:disabled="aiBusy" />
        <v-alert v-if="config.diagnostics?.length" class="dh-alert dh-alert--error ai-status" icon="mdi-alert-circle-outline">
          <div v-for="diagnostic in config.diagnostics" v-bind:key="diagnostic.field">{{ diagnostic.message }}</div>
        </v-alert>
        <v-alert v-if="aiError" class="dh-alert dh-alert--error ai-status" icon="mdi-alert-circle-outline">{{ aiError }}</v-alert>
        <v-alert v-else-if="aiDraftValid" class="dh-alert dh-alert--success ai-status" icon="mdi-check-circle-outline">
          Результат прошёл структурную проверку и проверку построенного Draw.io. Показан предпросмотр; файлы и исходный датасет не изменены.
        </v-alert>
        <div v-if="aiAttempts.length" class="ai-diagnostics">
          <div v-for="attempt in aiAttempts" v-bind:key="attempt.attempt">
            <strong>Попытка {{ attempt.attempt }}: {{ attempt.valid ? 'успешно' : 'ошибка' }}</strong>
            <ul v-if="attempt.diagnostics.length">
              <li v-for="(diagnostic, index) in attempt.diagnostics" v-bind:key="`${attempt.attempt}-${index}`">
                {{ diagnostic.message }}
              </li>
            </ul>
          </div>
        </div>
        <v-textarea
          v-if="aiDraft && !aiDraftValid"
          v-bind:model-value="aiDraftText"
          label="Последний невалидный результат (только чтение)"
          rows="10"
          readonly
          class="ai-invalid-draft" />
      </v-card-text>
      <v-card-actions>
        <v-btn v-bind:disabled="aiBusy" v-on:click="closeAiDialog">Закрыть</v-btn>
        <v-btn v-if="aiPreviewXml" v-bind:disabled="aiBusy" v-on:click="restoreSourcePreview">Вернуть исходную схему</v-btn>
        <v-spacer />
        <v-btn color="primary" v-bind:loading="aiBusy" v-bind:disabled="!aiPrompt.trim() || aiBusy" v-on:click="generateAiDraft">
          Сгенерировать
        </v-btn>
        <v-btn color="success" v-bind:disabled="!aiDraftValid || aiBusy" v-on:click="applyAiDraft">Использовать в этой сессии</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
  import { defineComponent, type PropType } from 'vue';
  import yaml from 'yaml';

  import { chatService } from '@front/helpers/gigachat/ChatServiceConfigurer';
  import type { RuntimeAgentConfig } from '@front/helpers/gigachat/agent';
  import {
    collectAgentStream,
    createAgentConfig as createSharedAgentConfig
  } from '@front/helpers/gigachat/agent';
  import type { ChatService } from '@global/gigachat/ChatService';
  import {
    assertGenerationCurrent,
    generateValidatedDraft,
    prepareAiContextDataset,
    validateDrawnCoverage
  } from '../lib/ai-draft';
  import { renderSeafDiagram } from '../lib/renderer';
  import type { AiAttempt } from '../lib/ai-types';
  import type { AiConfigSource } from '../lib/ai-types';
  import type { AiDraftConfig } from '../lib/ai-types';
  import type { AiValidation } from '../lib/ai-types';
  import type { GenerateValidatedDraftResult } from '../lib/ai-types';
  import type { SeafDataset } from '../lib/ai-types';
  import type { RendererLogger, RenderSeafDiagramInput } from '../lib/renderer';

  type AiRenderer = typeof renderSeafDiagram;
  type AiSession = {
    id: string;
    service: ChatService;
    endPromise?: Promise<void>;
  };
  type ValidationWithXml = AiValidation & { xml?: string };

  export default defineComponent({
    name: 'AiDraftDialog',
    props: {
      modelValue: {
        type: Boolean,
        required: true
      },
      profile: {
        type: Object as PropType<AiConfigSource>,
        required: true
      },
      config: {
        type: Object as PropType<AiDraftConfig>,
        required: true
      },
      baselineData: {
        type: Object as PropType<SeafDataset>,
        required: true
      },
      layoutSettings: {
        type: Object as PropType<Record<string, unknown>>,
        default: null
      },
      templates: {
        type: Object as PropType<RenderSeafDiagramInput['templates']>,
        default: null
      },
      diff: {
        type: Object as PropType<Record<string, unknown>>,
        default: null
      },
      logger: {
        type: Object as PropType<RendererLogger>,
        default: () => ({})
      },
      serviceFactory: {
        type: Function as PropType<() => Promise<ChatService | undefined>>,
        default: chatService
      },
      renderer: {
        type: Function as PropType<AiRenderer>,
        default: renderSeafDiagram
      }
    },
    emits: {
      'update:modelValue': (value: boolean) => typeof value === 'boolean',
      'busy-change': (value: boolean) => typeof value === 'boolean',
      preview: (xml: string) => typeof xml === 'string',
      restore: () => true,
      apply: (dataset: SeafDataset) => Boolean(dataset) && typeof dataset === 'object'
    },
    data(): {
      aiPrompt: string;
      aiBusy: boolean;
      aiError: string;
      aiAttempts: AiAttempt[];
      aiDraft: SeafDataset | null;
      aiDraftValid: boolean;
      aiPreviewXml: string | null;
      generationId: number;
      activeSession: AiSession | null;
    } {
      return {
        aiPrompt: '',
        aiBusy: false,
        aiError: '',
        aiAttempts: [],
        aiDraft: null,
        aiDraftValid: false,
        aiPreviewXml: null,
        generationId: 0,
        activeSession: null
      };
    },
    computed: {
      aiDraftText(): string {
        return this.aiDraft ? yaml.stringify(this.aiDraft) : '';
      }
    },
    beforeUnmount() {
      this.cancelGeneration();
    },
    methods: {
      updateDialog(value: boolean): void {
        this.$emit('update:modelValue', value);
      },

      emitBusy(value: boolean): void {
        this.$emit('busy-change', value);
      },

      createAiAgentConfig(): RuntimeAgentConfig {
        return createSharedAgentConfig(this.config.scenario, {
          profileBase: this.profile.$base
        });
      },

      validateAiDraft(dataset: SeafDataset): ValidationWithXml {
        try {
          const rendered = this.renderer({
            dataset,
            layoutSettings: this.layoutSettings,
            templates: this.templates,
            diff: this.diff,
            logger: this.logger,
            useAiKbFallback: true
          });
          const coverage = validateDrawnCoverage(dataset, rendered.report);
          const compositionDiagnostics = rendered.compositionDiagnostics;
          return {
            ...rendered.report,
            valid: rendered.report.allMatch === true
              && (rendered.report.summary?.length ?? 0) > 0
              && compositionDiagnostics.length === 0
              && coverage.valid,
            compositionDiagnostics: [
              ...compositionDiagnostics,
              ...coverage.diagnostics
            ],
            xml: rendered.xml
          };
        } catch (error) {
          return {
            valid: false,
            diagnostics: [{
              code: 'render_error',
              message: `Ошибка построения Draw.io: ${error instanceof Error ? error.message : String(error)}`
            }]
          };
        }
      },

      async generateAiDraft(): Promise<void> {
        if (this.aiBusy || !this.aiPrompt.trim()) return;
        if (this.config.diagnostics?.length) {
          this.aiError = this.config.diagnostics.map(({ message }) => message).join('\n');
          return;
        }
        if (this.aiPreviewXml) this.restoreSourcePreview();

        const generationId = ++this.generationId;
        this.aiBusy = true;
        this.emitBusy(true);
        this.aiError = '';
        this.aiAttempts = [];
        this.aiDraft = null;
        this.aiDraftValid = false;
        let session: AiSession | null = null;

        try {
          const service = await this.serviceFactory();
          assertGenerationCurrent(generationId, this.generationId);
          if (!service) throw new Error('LLM-сервис недоступен в текущем режиме');

          const scenario = this.config.scenario;
          const agents = await service.getAgentsList();
          assertGenerationCurrent(generationId, this.generationId);
          if (!agents.some((agent) => agent.type === scenario.type)) {
            throw new Error(`LLM-агент типа ${scenario.type} недоступен`);
          }

          const sessionId = await service.startChat(
            scenario.system_prompt,
            scenario.type,
            this.createAiAgentConfig()
          );
          session = { id: sessionId, service };
          assertGenerationCurrent(generationId, this.generationId);
          this.activeSession = session;

          const result: GenerateValidatedDraftResult = await generateValidatedDraft({
            prompt: this.aiPrompt,
            currentDataset: prepareAiContextDataset(this.baselineData, this.config, this.aiPrompt),
            maxAttempts: this.config.maxAttempts,
            contextMode: this.config.contextMode,
            responseMode: this.config.responseMode,
            send: (request) => collectAgentStream(service, sessionId, request, {
              assertCurrent: () => assertGenerationCurrent(generationId, this.generationId)
            }),
            validate: (dataset) => this.validateAiDraft(dataset)
          });
          if (generationId !== this.generationId) return;

          this.aiAttempts = result.attempts;
          if (!result.valid) {
            this.aiDraft = result.dataset ? structuredClone(result.dataset) : null;
            this.aiError = `Не удалось получить валидный черновик за ${result.attempts.length} попытки`;
            return;
          }

          this.aiDraft = structuredClone(result.dataset);
          this.aiDraftValid = true;
          const validation = result.validation as ValidationWithXml | null;
          this.aiPreviewXml = validation?.xml ?? null;
          if (this.aiPreviewXml) this.$emit('preview', this.aiPreviewXml);
        } catch (error) {
          if (generationId === this.generationId) {
            this.aiError = error instanceof Error ? error.message : String(error);
          }
        } finally {
          await this.endSession(session);
          if (generationId === this.generationId) {
            this.aiBusy = false;
            this.emitBusy(false);
          }
        }
      },

      async endSession(session: AiSession | null): Promise<void> {
        if (!session) return;
        if (this.activeSession === session) this.activeSession = null;
        if (session.endPromise) {
          await session.endPromise;
          return;
        }
        session.endPromise = Promise.resolve()
          .then(() => session.service.endChat(session.id))
          .catch((error: unknown) => {
            this.logger.warn?.(() => `Не удалось завершить AI-сессию ${session.id}: ${error instanceof Error ? error.message : String(error)}`);
          });
        await session.endPromise;
      },

      cancelGeneration(): void {
        this.generationId += 1;
        const session = this.activeSession;
        void this.endSession(session);
        this.activeSession = null;
        this.aiError = '';
        this.aiAttempts = [];
        this.aiDraft = null;
        this.aiDraftValid = false;
        this.aiPreviewXml = null;
        if (this.aiBusy) {
          this.aiBusy = false;
          this.emitBusy(false);
        }
      },

      restoreSourcePreview(): void {
        if (this.aiBusy) return;
        this.aiPreviewXml = null;
        this.$emit('restore');
      },

      applyAiDraft(): void {
        if (!this.aiDraftValid || !this.aiDraft || this.aiBusy) return;
        const applied = structuredClone(this.aiDraft);
        this.aiPreviewXml = null;
        this.aiDraft = null;
        this.aiDraftValid = false;
        this.$emit('apply', applied);
        this.$emit('update:modelValue', false);
      },

      closeAiDialog(): void {
        if (this.aiPreviewXml) this.restoreSourcePreview();
        this.$emit('update:modelValue', false);
      }
    }
  });
</script>

<style scoped>
.ai-diagnostics {
  margin-top: 12px;
  max-height: 260px;
  overflow: auto;
}

.ai-invalid-draft {
  margin-top: 12px;
}
</style>
