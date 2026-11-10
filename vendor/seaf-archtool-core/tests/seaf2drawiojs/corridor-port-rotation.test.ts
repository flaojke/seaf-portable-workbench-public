/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals';

import { routeCorridorPage } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { edgeWaypoints, isOrthogonal, parseXml as documentFor, required, type Point } from './routing-test-helpers';

const EPSILON = 1e-5;
interface Vertex { id: string; x: number; y: number; width: number; height: number; rotation?: number }
interface Edge { id: string; source: string; target: string }
interface Rect extends Point { width: number; height: number }
interface RotatedRectangle extends Point { width: number; height: number; rotation: number }

function vertex({ id, x, y, width, height, rotation = 0 }: Vertex): string {
  return `<object id="${id}" schema="seaf.company.ta.components.synthetic"><mxCell id="${id}.cell" vertex="1" parent="1" style="rotation=${rotation};"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" /></mxCell></object>`;
}

function page(vertices: string[], edges: Edge[]): string {
  return `<mxfile><diagram id="rotation"><mxGraphModel><root>
    <mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="layer.logical.a" parent="1"/>
    ${vertices.join('')}
    ${edges.map(({ id, source, target }) => `<object id="${id}" schema="seaf.company.ta.services.logical_links"><mxCell id="${id}.cell" edge="1" parent="layer.logical.a" source="${source}" target="${target}" style="edgeStyle=orthogonalEdgeStyle;"><mxGeometry relative="1" as="geometry" /></mxCell></object>`).join('')}
  </root></mxGraphModel></diagram></mxfile>`;
}


function wrapper(document: Document, id: string): Element {
  return required(Array.from<Element>(document.querySelectorAll('object')).find((node) => node.id === id));
}

function cell(node: Element): Element {
  return required(node.querySelector('mxCell'));
}

function styleNumber(edge: Element, name: string): number {
  const item = required(cell(edge).getAttribute('style')).split(';').find((entry) => entry.startsWith(`${name}=`));
  return Number(item?.slice(name.length + 1));
}

function geometry(node: Element): RotatedRectangle {
  const geom = required(cell(node).querySelector('mxGeometry'));
  const x = Number(geom.getAttribute('x'));
  const y = Number(geom.getAttribute('y'));
  const width = Number(geom.getAttribute('width'));
  const height = Number(geom.getAttribute('height'));
  return {
    x, y, width, height, rotation: Number(required(cell(node).getAttribute('style')).match(/rotation=([\d.-]+)/)?.[1] ?? 0)
  };
}

function physicalPort(node: Element, edge: Element, xName: string, yName: string): Point {
  const rect = geometry(node);
  const angle = rect.rotation * Math.PI / 180;
  const localX = (styleNumber(edge, xName) - 0.5) * rect.width;
  const localY = (styleNumber(edge, yName) - 0.5) * rect.height;
  return {
    x: rect.x + rect.width / 2 + localX * Math.cos(angle) - localY * Math.sin(angle),
    y: rect.y + rect.height / 2 + localX * Math.sin(angle) + localY * Math.cos(angle)
  };
}

function visualRect(node: Element): Rect {
  const rect = geometry(node);
  const angle = rect.rotation * Math.PI / 180;
  const width = Math.abs(rect.width * Math.cos(angle)) + Math.abs(rect.height * Math.sin(angle));
  const height = Math.abs(rect.width * Math.sin(angle)) + Math.abs(rect.height * Math.cos(angle));
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height
  };
}

function crossesRect(a: Point, b: Point, rect: Rect): boolean {
  if (Math.abs(a.x - b.x) <= EPSILON) {
    return a.x > rect.x + EPSILON && a.x < rect.x + rect.width - EPSILON
      && Math.max(Math.min(a.y, b.y), rect.y) < Math.min(Math.max(a.y, b.y), rect.y + rect.height) - EPSILON;
  }
  if (Math.abs(a.y - b.y) <= EPSILON) {
    return a.y > rect.y + EPSILON && a.y < rect.y + rect.height - EPSILON
      && Math.max(Math.min(a.x, b.x), rect.x) < Math.min(Math.max(a.x, b.x), rect.x + rect.width) - EPSILON;
  }
  return true;
}

function pathFor(document: Document, edgeId: string, sourceId: string, targetId: string): Point[] {
  const edge = wrapper(document, edgeId);
  const source = wrapper(document, sourceId);
  const target = wrapper(document, targetId);
  return [
    physicalPort(source, edge, 'exitX', 'exitY'),
    ...edgeWaypoints(edge),
    physicalPort(target, edge, 'entryX', 'entryY')
  ];
}

function expectPortOnVisualBoundary(point: Point, node: Element): void {
  const rect = visualRect(node);
  const onX = (Math.abs(point.x - rect.x) < EPSILON || Math.abs(point.x - (rect.x + rect.width)) < EPSILON)
    && point.y >= rect.y - EPSILON && point.y <= rect.y + rect.height + EPSILON;
  const onY = (Math.abs(point.y - rect.y) < EPSILON || Math.abs(point.y - (rect.y + rect.height)) < EPSILON)
    && point.x >= rect.x - EPSILON && point.x <= rect.x + rect.width + EPSILON;
  expect(onX || onY).toBe(true);
}

describe('corridor routing with rotated vertices', () => {
  it('routes around an obstacle using its rotated bounds', async() => {
    const input = page([
      vertex({ id: 'source', x: 20, y: 80, width: 40, height: 40 }),
      vertex({ id: 'target', x: 500, y: 80, width: 40, height: 40 }),
      vertex({ id: 'obstacle', x: 220, y: 50, width: 200, height: 20, rotation: 270 })
    ], [{ id: 'edge', source: 'source', target: 'target' }]);
    const result = await routeCorridorPage(input);
    const output = documentFor(result.xml);
    const obstacle = visualRect(wrapper(output, 'obstacle'));
    const route = pathFor(output, 'edge', 'source', 'target');

    expect(result.diagnostics.routedEdges).toBe(1);
    expect(isOrthogonal(route, EPSILON)).toBe(true);
    expect(route.slice(1).some((point, index) => crossesRect(route[index], point, obstacle))).toBe(false);
  });

  it('anchors the source on the rotated visual boundary', async() => {
    const input = page([
      vertex({ id: 'source', x: 20, y: 100, width: 200, height: 20, rotation: 270 }),
      vertex({ id: 'target', x: 500, y: 100, width: 40, height: 40 })
    ], [{ id: 'edge', source: 'source', target: 'target' }]);
    const result = await routeCorridorPage(input);
    const output = documentFor(result.xml);
    const route = pathFor(output, 'edge', 'source', 'target');

    expect(result.diagnostics.routedEdges).toBe(1);
    expectPortOnVisualBoundary(route[0], wrapper(output, 'source'));
    expect(isOrthogonal(route, EPSILON)).toBe(true);
  });

  it('anchors the target on the rotated visual boundary', async() => {
    const input = page([
      vertex({ id: 'source', x: 20, y: 100, width: 40, height: 40 }),
      vertex({ id: 'target', x: 500, y: 100, width: 200, height: 20, rotation: 270 })
    ], [{ id: 'edge', source: 'source', target: 'target' }]);
    const result = await routeCorridorPage(input);
    const output = documentFor(result.xml);
    const route = pathFor(output, 'edge', 'source', 'target');

    expect(result.diagnostics.routedEdges).toBe(1);
    expectPortOnVisualBoundary(route.at(-1), wrapper(output, 'target'));
    expect(isOrthogonal(route, EPSILON)).toBe(true);
  });

  it('uses an alternate source port when an obstacle covers the preferred one', async() => {
    const input = page([
      vertex({ id: 'source', x: 20, y: 20, width: 40, height: 40 }),
      vertex({ id: 'target', x: 240, y: 180, width: 40, height: 40 }),
      vertex({ id: 'blocker', x: 35, y: 55, width: 10, height: 10 })
    ], [{ id: 'edge', source: 'source', target: 'target' }]);
    const result = await routeCorridorPage(input);
    const output = documentFor(result.xml);
    const route = pathFor(output, 'edge', 'source', 'target');
    const blocker = visualRect(wrapper(output, 'blocker'));

    expect(result.diagnostics.routedEdges).toBe(1);
    expect(route[0].x).not.toBe(40);
    expect(isOrthogonal(route, EPSILON)).toBe(true);
    expect(route.slice(1).some((point, index) => crossesRect(route[index], point, blocker))).toBe(false);
  });
});
