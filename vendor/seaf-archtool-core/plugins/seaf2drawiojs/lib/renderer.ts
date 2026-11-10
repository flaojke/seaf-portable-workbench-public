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

import mustache from 'mustache';
import { v4 as uuidv4 } from 'uuid';

import dc from '../patterns/dc.json';
import main from '../patterns/main.json';
import office from '../patterns/office.json';
import Diagram from './diagram';
import { MAIN_SCHEMA_XML, SCHEMAS } from './constants';
import { Seaf2Drawio } from './seaf-drawio';
import {
  analyzeGeneratedXml,
  collectExpectedPatternObjects,
  createVerificationState,
  excludeCommonOnlyLogicalLinksFromVerification,
  logPendingMissingLinks,
  logVerificationReport
} from './verification';
import type { AiDiagnostic, AiVerificationReport, SeafDataset, SeafEntity } from './ai-types';

interface PatternData {
  schema: string;
  type?: string;
  parent_id?: string;
  ext_page?: string;
  [key: string]: unknown;
}

type PatternSet = Record<string, PatternData>;
type PatternSets = Record<string, PatternSet | undefined>;
type DiagramPages = Record<string, string[]>;
type DiagramIds = Record<string, string[]>;

type RendererSeafDrawio = Seaf2Drawio & {
  getObjectsBySchema: (schema?: string, options?: Record<string, unknown>) => Record<string, SeafEntity>;
  addOrUpdateObject: (...args: unknown[]) => void;
  addLinks: (...args: unknown[]) => void;
  resetLayoutState: () => void;
};

export interface RendererLogger {
  info?: (message: unknown, error?: unknown) => void;
  warn?: (message: unknown, error?: unknown) => void;
  error?: (message: unknown, error?: unknown) => void;
}

export interface RenderSeafDiagramInput {
  dataset: SeafDataset;
  layoutSettings?: Record<string, unknown> | null;
  templates?: PatternSets | null;
  diff?: unknown;
  logger?: RendererLogger;
  useAiKbFallback?: boolean;
}

export interface RenderSeafDiagramResult {
  dataset: SeafDataset;
  diagram: Diagram;
  seafDrawio: Seaf2Drawio;
  xml: string;
  diagramPages: DiagramPages;
  diagramIds: DiagramIds;
  report: AiVerificationReport;
  compositionDiagnostics: AiDiagnostic[];
}

const patterns: PatternSets = {
  main: main as PatternSet,
  office: office as PatternSet,
  dc: dc as PatternSet
};

function renderErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function normalizeLogger(logger?: RendererLogger): Required<RendererLogger> {
  return {
    info: logger?.info ?? (() => undefined),
    warn: logger?.warn ?? (() => undefined),
    error: logger?.error ?? (() => undefined)
  };
}

export function applyAiKbFallback(basePatterns: PatternSet, logger: RendererLogger): void {
  const fallback = basePatterns.kb_services;
  if (!fallback) {
    logger.warn?.(() => 'AI KB fallback skipped: kb_services pattern is absent.');
    return;
  }

  const exclusions = Object.entries(basePatterns)
    .flatMap(([name, pattern]) => name.startsWith('kb_services_') && pattern.type?.startsWith('technology:')
      ? [pattern.type.slice('technology:'.length).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')]
      : []);
  fallback.field_regex = exclusions.length ? { technology: `^(${exclusions.join('|')})$` } : {};
}

export function renderSeafDiagram(input: RenderSeafDiagramInput): RenderSeafDiagramResult {
  const dataset = structuredClone(input.dataset);
  const logger = normalizeLogger(input.logger);
  const diagram = new Diagram(input.layoutSettings, dataset);
  const seafDrawio = new Seaf2Drawio(dataset, diagram) as unknown as RendererSeafDrawio;
  const diagramIds: DiagramIds = { 'Main Schema': [] };
  const diagramPages: DiagramPages = { main: ['Main Schema'], office: [], dc: [] };
  const verification = createVerificationState();
  const pendingMissingLinks = verification.pendingMissingLinks;
  const compositionDiagnostics: AiDiagnostic[] = [];

  const captureCompositionError = (code: string, message: string, error: unknown): void => {
    compositionDiagnostics.push({ code, message: `${message}: ${renderErrorMessage(error)}` });
  };

  logger.info(() => 'Composing draw io diagram.');
  seafDrawio.resetLayoutState();
  diagram.addDiagram(uuidv4(), 'Main Schema', MAIN_SCHEMA_XML);
  diagramIds['Main Schema'] = Object.keys(seafDrawio.getObjectsBySchema(SCHEMAS.DC_REGION));

  const addPages = (patternName: string, patternData: PatternData): void => {
    const pageData = seafDrawio.getObjectsBySchema(patternData.schema);
    for (const key in pageData) {
      const pageTitle = pageData[key].title as string;
      const renderedExtPage = mustache.render(
        patternData.ext_page ?? '',
        {
          id: key + '_page',
          name: pageTitle,
          width: 1360,
          height: 864
        },
        {},
        ['{', '}']
      );
      diagram.addDiagram(key + '_page', pageTitle, renderedExtPage);
      if (!diagramPages[patternName]) diagramPages[patternName] = [];
      diagramPages[patternName].push(pageTitle);
      if (!diagramIds[pageTitle]) diagramIds[pageTitle] = [];
      diagramIds[pageTitle].push(key);
    }
  };

  for (const [patternSetName, pages] of Object.entries(diagramPages)) {
    const basePatterns = structuredClone(patterns[patternSetName] ?? {});
    if (input.useAiKbFallback && (patternSetName === 'office' || patternSetName === 'dc')) {
      applyAiKbFallback(basePatterns, logger);
    }
    const customPatterns = input.templates?.[patternSetName];
    const patternObject = customPatterns ? { ...basePatterns, ...customPatterns } : basePatterns;

    for (const page of pages) {
      logger.info(() => 'Composing page: ' + page + ' for pattern: ' + patternSetName);
      for (const [patternName, initialPatternData] of Object.entries(patternObject)) {
        const patternData = structuredClone(initialPatternData);
        const objectData = seafDrawio.getObjectsBySchema(patternData.schema, {
          ...patternData,
          type: patternData.type,
          sort: patternData.parent_id
        });
        collectExpectedPatternObjects(verification, patternName, patternData, objectData);

        if (patternData.ext_page) {
          try {
            addPages(patternName, patternData);
          } catch (error) {
            logger.error(() => `Can't create pages for pattern ${patternName}`, error);
            captureCompositionError('page_composition_error', `Не удалось создать страницы для ${patternName}`, error);
          }
        }

        Object.assign(patternData, { count: 0, lastParent: '', parent: '' });
        const defaultPattern = structuredClone(patternData);
        for (const [key, value] of Object.entries(objectData ?? {})) {
          try {
            seafDrawio.addOrUpdateObject(patternData, page, value, key, defaultPattern, diagramIds);
          } catch (error) {
            logger.error(() => `Can't create object for pattern ${patternName}`, error);
            captureCompositionError('object_composition_error', `Не удалось построить ${patternName}/${key}`, error);
          }
        }

        if (patternName.startsWith('network_links')) {
          try {
            seafDrawio.addLinks(patternData, page, diagramIds, undefined, pendingMissingLinks);
            if (patternName === 'network_links') {
              seafDrawio.addLinks(patternData, page, diagramIds, { network_link: true }, pendingMissingLinks);
            }
          } catch (error) {
            logger.error(() => `Network links error. Can't create links for pattern ${patternName}`, error);
            captureCompositionError('network_link_composition_error', `Не удалось построить сетевые связи ${patternName}`, error);
          }
        }

        if (patternName.startsWith('logical_links')) {
          try {
            seafDrawio.addLinks(patternData, page, diagramIds, { logical_link: true }, pendingMissingLinks);
          } catch (error) {
            logger.error(() => `Logical links error. Can't create links for pattern ${patternName}`, error);
            captureCompositionError('logical_link_composition_error', `Не удалось построить логические связи ${patternName}`, error);
          }
        }
      }
    }
  }

  diagram.commonLocationSourcePages = [
    ...(diagramPages.office ?? []),
    ...(diagramPages.dc ?? [])
  ];
  const commonLocationSettings = diagram.commonLocationSettings();
  if (commonLocationSettings.enabled) {
    excludeCommonOnlyLogicalLinksFromVerification(verification, dataset, diagramIds, logger);
  }
  const pendingReport = logPendingMissingLinks(
    pendingMissingLinks,
    diagramIds,
    logger,
    { commonPageEnabled: commonLocationSettings.enabled }
  );
  for (const link of pendingReport.missing) {
    compositionDiagnostics.push({
      code: 'missing_link_endpoint',
      message: `Не построена связь ${link.linkOid || ''}: ${link.sourceId} -> ${link.targetId}`
    });
  }

  const xml = diagram.generateXml(input.diff);
  const report: AiVerificationReport = {
    ...(analyzeGeneratedXml(xml, verification) as unknown as AiVerificationReport),
    compositionDiagnostics
  };
  logVerificationReport(report, logger);

  return {
    dataset,
    diagram,
    seafDrawio,
    xml,
    diagramPages,
    diagramIds,
    report,
    compositionDiagnostics
  };
}
