/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';

import { createLayerColorMap, replaceDiagramPage, routeCorridorPage, splitDiagramPages } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { parseXml as parse, required, styleValue } from './routing-test-helpers';

jest.setTimeout(180_000);

const LOGICAL_SCHEMA = 'seaf.company.ta.services.logical_links';
const logicalCount = (page: number): number => page === 11 ? 619 : page <= 3 ? 23 : 22;

function logicalEdge(page: number, index: number, layer: string): string {
  return `<object id="logical.${page}.${index}" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="${layer}" source="source.${page}" target="target.${page}" style="edgeStyle=orthogonalEdgeStyle;dashed=1;startArrow=none;endArrow=block;"><mxGeometry relative="1" as="geometry"/></mxCell></object>`;
}

function pageXml(page: number, count = logicalCount(page)): string {
  const common = page === 11;
  const layers = common
    ? ['common_layer.logical.shared', ...Array.from({ length: 49 }, (_, index) => `common_layer.logical.${index + 2}`)]
    : ['layer.logical.shared'];
  const layerCells = layers.map((id) => `<mxCell id="${id}" value="${id}" parent="1"/>`).join('');
  const links = Array.from({ length: count }, (_, index) =>
    logicalEdge(page, index + 1, layers[index % layers.length])).join('');
  return `<diagram id="page.${page}" name="${common ? 'Общая страница' : `Страница ${page}`}"><mxGraphModel><root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    ${layerCells}
    <mxCell id="connections" value="Connections" parent="1"/>
    <object id="source.${page}" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="20" y="20" width="40" height="40" as="geometry"/></mxCell></object>
    <object id="target.${page}" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="240" y="180" width="40" height="40" as="geometry"/></mxCell></object>
    ${links}
    <object id="connection.${page}" schema="seaf.company.ta.services.compute_services"><mxCell edge="1" parent="connections" source="source.${page}" target="target.${page}" style="edgeStyle=orthogonalEdgeStyle;dashed=1;strokeColor=#777777;"><mxGeometry relative="1" as="geometry"/></mxCell></object>
  </root></mxGraphModel></diagram>`;
}



function logicalEdges(document: Document): Element[] {
  return Array.from<Element>(document.querySelectorAll(`object[schema="${LOGICAL_SCHEMA}"]`));
}

function visiblePath(edge: Element): string {
  const cell = required(edge.querySelector('mxCell'));
  const points = Array.from<Element>(edge.querySelectorAll('Array[as="points"] > mxPoint'))
    .map((point) => [point.getAttribute('x'), point.getAttribute('y')]);
  return JSON.stringify({
    exitX: styleValue(cell, 'exitX'),
    exitY: styleValue(cell, 'exitY'),
    entryX: styleValue(cell, 'entryX'),
    entryY: styleValue(cell, 'entryY'),
    points
  });
}

// Synthetic load test: mirrors reported R41 page counts, but does not model or validate real R41 geometry.
describe('11-page routing load', () => {
  const source = `<mxfile host="test">${Array.from({ length: 11 }, (_, index) => pageXml(index + 1)).join('')}</mxfile>`;
  let originalPages: string[];
  let results: Awaited<ReturnType<typeof routeCorridorPage>>[];
  let output: string;

  beforeAll(async() => {
    originalPages = splitDiagramPages(source);
    const layerColors = createLayerColorMap(source);
    results = [];
    for (const page of originalPages) results.push(await routeCorridorPage(page, { layerColors }));
    output = results.reduce((xml, result, index) => replaceDiagramPage(xml, index, result.xml), source);
  });

  it('routes every synthetic page without losses and leaves Connections untouched', () => {
    const outputPages = splitDiagramPages(output);
    let totalRouted = 0;
    expect(originalPages).toHaveLength(11);
    expect(outputPages).toHaveLength(11);
    const onlyCommonReplaced = splitDiagramPages(replaceDiagramPage(source, 10, results[10].xml));
    expect(onlyCommonReplaced.slice(0, 10)).toEqual(originalPages.slice(0, 10));

    for (let index = 0; index < 11; index++) {
      const expected = logicalCount(index + 1);
      const before = parse(originalPages[index]);
      const after = parse(outputPages[index]);
      const beforeConnection = before.querySelector(`object[id="connection.${index + 1}"]`);
      const afterConnection = after.querySelector(`object[id="connection.${index + 1}"]`);
      expect(after.querySelector('diagram').getAttribute('id')).toBe(`page.${index + 1}`);
      expect(afterConnection.outerHTML).toBe(beforeConnection.outerHTML);
      expect(results[index].diagnostics).toEqual(expect.objectContaining({
        totalLogicalEdges: expected,
        routedEdges: expected,
        skippedEdges: 0,
        failedEdges: 0
      }));
      totalRouted += results[index].diagnostics.routedEdges;
      expect(logicalEdges(after)).toHaveLength(expected);
      expect(logicalEdges(after).every((edge) => edge.querySelector('Array[as="points"] > mxPoint'))).toBe(true);
    }
    expect(totalRouted).toBe(842);
  });

  it('assigns one distinct color to each of 50 simultaneously visible layers', () => {
    const pages = splitDiagramPages(output);
    const commonEdges = logicalEdges(parse(pages[10]));
    const colors = new Map<string | null, Set<string | null>>();
    for (const edge of commonEdges) {
      const cell = edge.querySelector('mxCell');
      const layer = cell.getAttribute('parent');
      const color = styleValue(cell, 'strokeColor');
      expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(styleValue(cell, 'edgeStyle')).toBe('none');
      const layerColors = colors.get(layer) ?? new Set();
      layerColors.add(color);
      colors.set(layer, layerColors);
    }
    expect(colors.size).toBe(50);
    expect([...colors.values()].every((layerColors) => layerColors.size === 1)).toBe(true);
    expect(new Set([...colors.values()].map((layerColors) => [...layerColors][0])).size).toBe(50);
  });

  it('keeps a layer color stable across pages with different layer sets', () => {
    const pages = splitDiagramPages(output);
    const commonEdges = logicalEdges(parse(pages[10]));
    const shared = commonEdges.find((edge) => edge.querySelector('mxCell').getAttribute('parent') === 'common_layer.logical.shared');
    const firstPageShared = logicalEdges(parse(pages[0]))[0].querySelector('mxCell');
    expect(styleValue(firstPageShared, 'strokeColor')).toBe(styleValue(shared.querySelector('mxCell'), 'strokeColor'));
  });

  it('separates 51 representative paths across the 50 common-page layers', () => {
    const commonEdges = logicalEdges(parse(splitDiagramPages(output)[10]));
    expect(commonEdges).toHaveLength(619);
    const representatives = commonEdges.slice(0, 51);
    expect(new Set(representatives.map((edge) => edge.querySelector('mxCell').getAttribute('parent'))).size).toBe(50);
    expect(new Set(representatives.map(visiblePath)).size).toBe(51);
  });
});
