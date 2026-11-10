/** @jest-environment jsdom */
import { beforeAll, describe, expect, it, jest } from '@jest/globals';
import { createLayerColorMap, parseDiagramDocument, replaceDiagramPage, routeCorridorPage, splitDiagramPages } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { manualRouteIds, mergeDiffs } from '../../plugins/seaf2drawiojs/lib/transformations';
import type { Diff } from '../../plugins/seaf2drawiojs/lib/transformations';
import minimal from './fixtures/success/minimal.json';

let renderSeafDiagram: typeof import('../../plugins/seaf2drawiojs/lib/renderer').renderSeafDiagram;
const dataset = {
  ...minimal,
  'seaf.company.ta.services.networks': {
    'net.office': { title: 'LAN', type: 'LAN', segment: 'segment.office', location: 'office.main' }
  },
  'seaf.company.ta.services.kbs': {
    'kb.source': { title: 'IAM', technology: 'Управление учетными записями', network_connection: 'net.office', location: 'office.main' },
    'kb.target': { title: 'IAM target', technology: 'Управление учетными записями', network_connection: 'net.office', location: 'office.main' }
  },
  'seaf.company.ta.services.logical_links': {
    'logical.demo': { title: 'Audit', source: 'kb.source', target: ['kb.target'], tags: ['Audit'], direction: '==>', topology: 'star' }
  }
};
const settings = { common_location_page: true, corridor_routing: true };

async function routeDocument(xml: string, diff?: Diff) {
  const document = parseDiagramDocument(xml);
  const layerColors = createLayerColorMap(document);
  let routed = 0;
  let preserved = 0;
  let failed = 0;
  let obstacles = 0;
  for (const [index, page] of splitDiagramPages(document).entries()) {
    const pageId = document.querySelectorAll('mxfile > diagram')[index].getAttribute('id');
    const result = await routeCorridorPage(page, { layerColors, preservedEdges: manualRouteIds(diff?.[pageId]) });
    replaceDiagramPage(document, index, result.xml);
    routed += result.diagnostics.routedEdges;
    preserved += result.diagnostics.preservedEdges;
    failed += result.diagnostics.failedEdges + result.diagnostics.skippedEdges;
    obstacles += result.diagnostics.semanticVertices;
  }
  return { xml: new XMLSerializer().serializeToString(document), routed, preserved, failed, obstacles };
}

function geometry(document: Document, id: string): string {
  return Array.from(document.querySelectorAll('object')).find((object) => object.id === id)
    .querySelector('mxGeometry').outerHTML;
}

function setStyleValue(cell: Element, name: string, value: string) {
  const style = cell.getAttribute('style') ?? '';
  const field = new RegExp(`(^|;)${name}=[^;]*`);
  cell.setAttribute('style', field.test(style)
    ? style.replace(field, `$1${name}=${value}`)
    : `${style}${style.endsWith(';') ? '' : ';'}${name}=${value};`);
}

describe('renderer and corridor routing integration', () => {
  beforeAll(async() => {
    global.DocHub = { documents: { getLoggerWithTag: () => ({ info: jest.fn(), debug: jest.fn(), warn: jest.fn(), error: jest.fn() }) } };
    ({ renderSeafDiagram } = await import('../../plugins/seaf2drawiojs/lib/renderer'));
  });

  it('routes real renderer XML on detail and common pages without adding automatic transformation records', async() => {
    const rendered = renderSeafDiagram({ dataset, layoutSettings: settings });
    expect(rendered.compositionDiagnostics).toEqual([]);
    expect(rendered.xml).not.toContain('__entity_id__');
    const result = await routeDocument(rendered.xml);
    expect(result.routed).toBeGreaterThanOrEqual(2);
    expect(result.failed).toBe(0);
    expect(result.obstacles).toBeGreaterThan(0);
    const physical = (xml: string) => Array.from(parseDiagramDocument(xml).querySelectorAll('object'))
      .filter((object) => object.querySelector('mxCell')?.getAttribute('edge') === '1'
        && object.getAttribute('schema') !== 'seaf.company.ta.services.logical_links'
        && object.getAttribute('common_logical_link') !== 'true')
      .map((object) => object.outerHTML);
    expect(physical(rendered.xml).length).toBeGreaterThan(0);
    expect(physical(result.xml)).toEqual(physical(rendered.xml));
    rendered.diagram.captureRoutingBaseline(result.xml, null);
    const diff = rendered.diagram.getDiff(result.xml);
    expect(Object.values(diff).flat()).toEqual([]);
    expect(diff).not.toHaveProperty('common_location_page');
  });

  it('does not index or export a Common page without logical links', async() => {
    const noLogicalLinks = { ...dataset };
    delete noLogicalLinks['seaf.company.ta.services.logical_links'];
    const rendered = renderSeafDiagram({ dataset: noLogicalLinks, layoutSettings: { ...settings, corridor_routing: false } });
    const diff = rendered.diagram.getDiff(rendered.xml);
    const ordinaryPages = Object.keys(rendered.diagram.indices);

    expect(rendered.diagram.indices).not.toHaveProperty('common_location_page');
    expect(diff).toEqual(Object.fromEntries(ordinaryPages.map((pageId) => [pageId, []])));
    expect(mergeDiffs({}, diff, rendered.diagram.indices)).toEqual(diff);
  });

  it('keeps manual waypoints and connection-anchor styles on detail and Common pages after saving and reopening', async() => {
    const rendered = renderSeafDiagram({ dataset, layoutSettings: settings });
    const routed = await routeDocument(rendered.xml);
    rendered.diagram.captureRoutingBaseline(routed.xml, null);
    const edited = parseDiagramDocument(routed.xml);
    const edges = [
      edited.querySelector('diagram:not([id="common_location_page"]) object[schema="seaf.company.ta.services.logical_links"]'),
      edited.querySelector('diagram[id="common_location_page"] object[common_logical_link="true"]')
    ];
    for (const edge of edges) {
      const point = edge.querySelector('Array[as="points"] > mxPoint');
      expect(point).not.toBeNull();
      for (const waypoint of edge.querySelectorAll('Array[as="points"] > mxPoint')) {
        waypoint.setAttribute('y', String(Number(waypoint.getAttribute('y')) + 24));
      }
      setStyleValue(edge.querySelector('mxCell'), 'exitX', '0.5');
      setStyleValue(edge.querySelector('mxCell'), 'exitY', '0.75');
      setStyleValue(edge.querySelector('mxCell'), 'strokeWidth', '7');
      setStyleValue(edge.querySelector('mxCell'), 'endArrow', 'classic');
      setStyleValue(edge.querySelector('mxCell'), 'rounded', '1');
    }
    const editedXml = new XMLSerializer().serializeToString(edited);
    const diff = rendered.diagram.getDiff(editedXml) as Diff;
    for (const edge of edges) {
      expect(manualRouteIds(diff[edge.closest('diagram').id]).has(edge.id)).toBe(true);
    }
    const reopened = renderSeafDiagram({ dataset, layoutSettings: settings, diff });
    const rerouted = await routeDocument(reopened.xml, diff);
    expect(rerouted.preserved).toBe(2);
    for (const edge of edges) {
      expect(geometry(parseDiagramDocument(rerouted.xml), edge.id)).toBe(geometry(edited, edge.id));
      expect(parseDiagramDocument(rerouted.xml).querySelector(`object[id="${edge.id}"] mxCell`).getAttribute('style'))
        .toBe(edge.querySelector('mxCell').getAttribute('style'));
    }
    reopened.diagram.captureRoutingBaseline(rerouted.xml, diff);
    const reopenedDiff = reopened.diagram.getDiff(rerouted.xml);
    for (const edge of edges) {
      expect(manualRouteIds(reopenedDiff[edge.closest('diagram').id]).has(edge.id)).toBe(true);
    }
  });

  it('roundtrips logical-link style and anchors without point edits', async() => {
    const rendered = renderSeafDiagram({ dataset, layoutSettings: settings });
    const routed = await routeDocument(rendered.xml);
    rendered.diagram.captureRoutingBaseline(routed.xml, null);
    const edited = parseDiagramDocument(routed.xml);
    const edges = [
      edited.querySelector('diagram:not([id="common_location_page"]) object[schema="seaf.company.ta.services.logical_links"]'),
      edited.querySelector('diagram[id="common_location_page"] object[common_logical_link="true"]')
    ];
    const originalGeometries = edges.map((edge) => geometry(edited, edge.id));
    for (const edge of edges) {
      const cell = edge.querySelector('mxCell');
      setStyleValue(cell, 'exitX', '0.4');
      setStyleValue(cell, 'exitY', '0.6');
      setStyleValue(cell, 'strokeWidth', '6');
      setStyleValue(cell, 'endArrow', 'classic');
      setStyleValue(cell, 'rounded', '1');
    }
    const diff = rendered.diagram.getDiff(new XMLSerializer().serializeToString(edited)) as Diff;
    for (const edge of edges) {
      expect(manualRouteIds(diff[edge.closest('diagram').id]).has(edge.id)).toBe(true);
    }

    const reopened = renderSeafDiagram({ dataset, layoutSettings: settings, diff });
    const rerouted = await routeDocument(reopened.xml, diff);
    expect(rerouted.preserved).toBe(2);
    const reopenedDocument = parseDiagramDocument(rerouted.xml);
    edges.forEach((edge, index) => {
      expect(geometry(reopenedDocument, edge.id)).toBe(originalGeometries[index]);
      expect(reopenedDocument.querySelector(`object[id="${edge.id}"] mxCell`).getAttribute('style'))
        .toBe(edge.querySelector('mxCell').getAttribute('style'));
    });
  });
});
