/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';

import { validateDrawnCoverage } from '../../plugins/seaf2drawiojs/lib/ai-draft';
import type { RendererLogger } from '../../plugins/seaf2drawiojs/lib/renderer';
import type { SeafDataset } from '../../plugins/seaf2drawiojs/lib/ai-types';
import mainPatterns from '../../plugins/seaf2drawiojs/patterns/main.json';
import successMinimal from './fixtures/success/minimal.json';

let renderSeafDiagram: typeof import('../../plugins/seaf2drawiojs/lib/renderer').renderSeafDiagram;
let applyAiKbFallback: typeof import('../../plugins/seaf2drawiojs/lib/renderer').applyAiKbFallback;

describe('seaf2drawiojs renderer', () => {
  beforeAll(async() => {
    const logger: RendererLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    (global as unknown as Record<string, unknown>).DocHub = {
      documents: {
        getLoggerWithTag: jest.fn(() => logger)
      }
    };
    ({ renderSeafDiagram, applyAiKbFallback } = await import('../../plugins/seaf2drawiojs/lib/renderer'));
  });

  it('derives AI KB exclusions from specialized patterns and skips a missing fallback', () => {
    const logger: RendererLogger = { warn: jest.fn() };
    const patterns = {
      kb_services: { schema: 'kbs' },
      kb_services_special: { schema: 'kbs', type: 'technology:A+B' }
    };

    applyAiKbFallback(patterns, logger);
    expect(patterns.kb_services.field_regex).toEqual({ technology: '^(A\\+B)$' });

    expect(() => applyAiKbFallback({}, logger)).not.toThrow();
    expect(logger.warn).toHaveBeenCalled();
  });

  it('renders from an isolated dataset without mutating the input', () => {
    const dataset: SeafDataset = structuredClone(successMinimal);
    const sourceSnapshot = structuredClone(dataset);

    const result = renderSeafDiagram({ dataset });

    expect(dataset).toEqual(sourceSnapshot);
    expect(result.dataset).not.toBe(dataset);
    expect(result.dataset['seaf.company.ta.services.dc_regions']).toMatchObject({
      'region.main': {
        OID: 'region.main',
        schema: 'seaf.company.ta.services.dc_regions'
      }
    });
    expect(result.xml).toContain('<mxfile');
    expect(result.diagramPages.main).toEqual(['Main Schema']);
    expect(result.diagramPages.office).toEqual(['Office']);
    expect(result.report.allMatch).toBe(true);
    expect(result.compositionDiagnostics).toEqual([]);
  });

  it('returns composition diagnostics without changing the source dataset', () => {
    const dataset: SeafDataset = structuredClone(successMinimal);
    const sourceSnapshot = structuredClone(dataset);

    const result = renderSeafDiagram({
      dataset,
      templates: {
        main: {
          region: {
            ...mainPatterns.region,
            ext_page: 123 as unknown as string
          }
        }
      }
    });

    expect(result.compositionDiagnostics).toEqual(expect.arrayContaining([
      expect.objectContaining({ code: 'page_composition_error' })
    ]));
    expect(result.report.allMatch).toBe(true);
    expect(dataset).toEqual(sourceSnapshot);
  });

  it('exposes isolated XML and verification report for AI validation', () => {
    const dataset: SeafDataset = structuredClone(successMinimal);
    const result = renderSeafDiagram({ dataset });
    const coverage = validateDrawnCoverage(dataset, result.report);

    expect(result.xml).toBeTruthy();
    expect(result.report.allMatch).toBe(true);
    expect(result.compositionDiagnostics).toEqual([]);
    expect(coverage.valid).toBe(true);
    expect(result.report.allMatch === true
      && result.compositionDiagnostics.length === 0
      && coverage.valid).toBe(true);
  });

  it('does not accept an AI validation report with an empty summary', () => {
    const dataset: SeafDataset = structuredClone(successMinimal);
    const result = renderSeafDiagram({ dataset });
    const coverage = validateDrawnCoverage(dataset, result.report);
    const emptySummaryReport = { ...result.report, summary: [] };
    const valid = emptySummaryReport.allMatch === true
      && (emptySummaryReport.summary?.length ?? 0) > 0
      && result.compositionDiagnostics.length === 0
      && coverage.valid;

    expect(valid).toBe(false);
  });
});
