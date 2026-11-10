/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals';
import { routeCorridorPage } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { edgeWaypoints, required, type Point } from './routing-test-helpers';

const LOGICAL_SCHEMA = 'seaf.company.ta.services.logical_links';
const EPSILON = 1e-7;
const MAX_PORT_STUB = 8;
interface Rect extends Point { width: number; height: number }
type Segment = [Point, Point];
interface SharedOverlap { length: number; axis: 'horizontal' | 'vertical'; coordinate: number; low: number; high: number }

const equal = (left: number, right: number): boolean => Math.abs(left - right) <= EPSILON;

function sourceXml(count: number, layerCount: number): string {
  const layers = Array.from({ length: layerCount }, (_, index) => `layer.${index + 1}`);
  return `<diagram id="page"><mxGraphModel><root>
    <mxCell id="0"/><mxCell id="1" parent="0"/>
    ${layers.map((id) => `<mxCell id="${id}" parent="1"/>`).join('')}
    <object id="source" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="20" y="20" width="40" height="40" as="geometry"/></mxCell></object>
    <object id="target" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="240" y="180" width="40" height="40" as="geometry"/></mxCell></object>
    ${Array.from({ length: count }, (_, index) => `<object id="e${index + 1}" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="${layers[index % layerCount]}" source="source" target="target"><mxGeometry relative="1" as="geometry"/></mxCell></object>`).join('')}
  </root></mxGraphModel></diagram>`;
}

function routePoints(edge: Element): Point[] {
  const cell = required(edge.querySelector('mxCell'));
  const styles = new Map<string, string>(String(cell.getAttribute('style') ?? '').split(';')
    .map((part): [string, string] => {
      const separator = part.indexOf('=');
      return [part.slice(0, separator), part.slice(separator + 1)];
    })
    .filter(([key]) => key.length > 0));
  const value = (key: string): number => Number(styles.get(key));
  const getRect = (id: string | null): Rect | null => {
    const object = Array.from<Element>(required(edge.ownerDocument).querySelectorAll('object')).find((item) => item.getAttribute('id') === id);
    const geometry = object?.querySelector('mxGeometry');
    if (!geometry) return null;
    const x = Number(geometry.getAttribute('x'));
    const y = Number(geometry.getAttribute('y'));
    const width = Number(geometry.getAttribute('width'));
    const height = Number(geometry.getAttribute('height'));
    return [x, y, width, height].every(Number.isFinite) ? { x, y, width, height } : null;
  };
  const source = getRect(cell.getAttribute('source'));
  const target = getRect(cell.getAttribute('target'));
  if (!source || !target) return [];
  const points = [
    { x: source.x + source.width * value('exitX'), y: source.y + source.height * value('exitY') },
    ...edgeWaypoints(edge),
    { x: target.x + target.width * value('entryX'), y: target.y + target.height * value('entryY') }
  ];
  return points;
}

function segments(points: Point[]): Segment[] {
  return points.slice(1).map((point, index) => [points[index], point]);
}

function overlap(left: Segment, right: Segment): SharedOverlap | null {
  const [a, b] = left;
  const [c, d] = right;
  if (equal(a.y, b.y) && equal(c.y, d.y) && equal(a.y, c.y)) {
    const low = Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x));
    const high = Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x));
    return high - low > EPSILON ? { length: high - low, axis: 'horizontal', coordinate: a.y, low, high } : null;
  }
  if (equal(a.x, b.x) && equal(c.x, d.x) && equal(a.x, c.x)) {
    const low = Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y));
    const high = Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y));
    return high - low > EPSILON ? { length: high - low, axis: 'vertical', coordinate: a.x, low, high } : null;
  }
  return null;
}

function shortPortStub(shared: SharedOverlap, points: Point[]): boolean {
  if (shared.length > MAX_PORT_STUB + EPSILON) return false;
  const endpoints = [points[0], points[points.length - 1]];
  return endpoints.some((point) => equal(shared.axis === 'horizontal' ? point.y : point.x, shared.coordinate)
    && Math.max(Math.abs(shared.low - (shared.axis === 'horizontal' ? point.x : point.y)),
      Math.abs(shared.high - (shared.axis === 'horizontal' ? point.x : point.y))) <= MAX_PORT_STUB + EPSILON);
}

function nonOrthogonalSegments(edges: Element[]): Array<{ id: string | null; index: number; previous: Point; current: Point }> {
  const invalid: Array<{ id: string | null; index: number; previous: Point; current: Point }> = [];
  for (const edge of edges) {
    const points = routePoints(edge);
    for (let index = 1; index < points.length; index++) {
      const previous = points[index - 1];
      const current = points[index];
      if (!equal(previous.x, current.x) && !equal(previous.y, current.y)) {
        invalid.push({ id: edge.getAttribute('id'), index: index - 1, previous, current });
      }
    }
  }
  return invalid;
}

function unacceptableCrossLayerOverlaps(edges: Element[]): Array<{ left: string | null; right: string | null } & SharedOverlap> {
  const paths = edges.map(routePoints);
  const unacceptable: Array<{ left: string | null; right: string | null } & SharedOverlap> = [];
  for (let left = 0; left < edges.length; left++) {
    const leftCell = edges[left].querySelector('mxCell');
    for (let right = left + 1; right < edges.length; right++) {
      const rightCell = edges[right].querySelector('mxCell');
      if (leftCell.getAttribute('parent') === rightCell.getAttribute('parent')) continue;
      for (const [a, b] of segments(paths[left]).flatMap((a) => segments(paths[right]).map((b) => [a, b]))) {
        const shared = overlap(a, b);
        if (shared && !(shortPortStub(shared, paths[left]) && shortPortStub(shared, paths[right]))) {
          unacceptable.push({ left: edges[left].getAttribute('id'), right: edges[right].getAttribute('id'), ...shared });
        }
      }
    }
  }
  return unacceptable;
}

async function routedOverlaps(count: number, layerCount: number): Promise<{ diagnostics: Awaited<ReturnType<typeof routeCorridorPage>>['diagnostics']; edges: Element[] }> {
  const { xml, diagnostics } = await routeCorridorPage(sourceXml(count, layerCount));
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  const edges = Array.from<Element>(document.querySelectorAll(`object[schema="${LOGICAL_SCHEMA}"]`));
  return { diagnostics, edges };
}

describe('cross-layer route separation', () => {
  it('separates identical endpoints across 10 layers', async() => {
    const { diagnostics, edges } = await routedOverlaps(10, 10);
    expect(diagnostics).toEqual(expect.objectContaining({ routedEdges: 10, skippedEdges: 0, failedEdges: 0 }));
    expect(nonOrthogonalSegments(edges)).toEqual([]);
    expect(unacceptableCrossLayerOverlaps(edges)).toEqual([]);
  });

  it('separates 120 same-endpoint links across 50 layers', async() => {
    const { diagnostics, edges } = await routedOverlaps(120, 50);
    expect(diagnostics).toEqual(expect.objectContaining({ routedEdges: 120, skippedEdges: 0, failedEdges: 0 }));
    expect(nonOrthogonalSegments(edges)).toEqual([]);
    expect(unacceptableCrossLayerOverlaps(edges)).toEqual([]);
  }, 30000);
});
