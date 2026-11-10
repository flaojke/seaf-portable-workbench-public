/*
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
*/

export type SeafEntity = Record<string, unknown>;
export type SeafDataset = Record<string, unknown>;

export interface AiDiagnostic {
  code: string;
  message: string;
  [key: string]: unknown;
}

export interface AiPromptIntent {
  original: string;
  normalizedText: string;
  keepOnly: boolean;
  networkDevicesRequested: boolean;
  connectedNetworksRequested: boolean;
  externalConnectionsRequested: boolean;
  logicalLinksRequested: boolean;
  logicalLinkScope: 'none' | 'adjacent' | 'between';
  logicalLinkDirection: 'incoming' | 'outgoing' | 'any';
  requestedSchemas: string[];
  canonicalPrompt: string;
}

export interface AiScenario {
  type: string;
  temperature: number;
  system_prompt: string;
  history: boolean;
  model?: string;
  profanity_check?: boolean;
  top_p?: number;
  max_tokens?: number;
  n?: number;
  repetition_penalty?: number;
  [key: string]: unknown;
}

export type RawAiScenario = Record<string, unknown>;

export interface AiDraftConfig {
  enabled: boolean;
  maxAttempts: number;
  contextMode: string;
  responseMode: string;
  diagnostics: AiDiagnostic[];
  scenario: AiScenario;
  [key: string]: unknown;
}

export interface AiConfigSource {
  ai_assistant?: unknown;
  [key: string]: unknown;
}

export interface AiContextConfig {
  contextMode?: string;
  context_mode?: string;
  [key: string]: unknown;
}

export interface AiVerificationReport {
  valid?: boolean;
  diagnostics?: AiDiagnostic[] | Record<string, AiDiagnostic[]>;
  missing?: Record<string, string[]>;
  extra?: Record<string, string[]>;
  compositionDiagnostics?: AiDiagnostic[];
  drawn?: Record<string, string[]>;
  allMatch?: boolean;
  summary?: unknown[];
  [key: string]: unknown;
}

export interface AiAttempt {
  attempt: number;
  valid: boolean;
  diagnostics: AiDiagnostic[];
}

export type AiValidation = AiVerificationReport;
export type AiSend = (request: string, attempt: number) => Promise<unknown>;
export type AiValidate = (dataset: SeafDataset) => Promise<AiValidation> | AiValidation;

export interface GenerateValidatedDraftOptions {
  prompt: string;
  currentDataset: SeafDataset;
  maxAttempts?: number;
  contextMode?: string;
  responseMode?: string;
  send: AiSend;
  validate: AiValidate;
}

export interface GenerateValidatedDraftResult {
  valid: boolean;
  dataset: SeafDataset | null;
  validation: AiValidation | null;
  attempts: AiAttempt[];
  response: unknown;
}

export interface ContextEntity {
  schema: string;
  entity: SeafEntity;
}

export interface AiExportState {
  aiApplied?: boolean;
  aiBusy?: boolean;
  aiPreviewXml?: string | null;
}
