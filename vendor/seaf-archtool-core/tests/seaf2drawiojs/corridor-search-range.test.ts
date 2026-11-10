/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals';
import { routeCorridorPage } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { isOrthogonal, type Point } from './routing-test-helpers';

interface Rect extends Point { width: number; height: number }

const LOGICAL_SCHEMA = 'seaf.company.ta.services.logical_links';
const edgeCount = 10;
const targets = Array.from({ length: edgeCount }, (_, index) => `<object id="target.${index}" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="500.4" y="${160.5 + index * 80}" width="53" height="37" as="geometry"/></mxCell></object>`).join('');
const edges = Array.from({ length: edgeCount }, (_, index) => `<object id="edge.${index}" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="layer" source="source" target="target.${index}"><mxGeometry relative="1" as="geometry"/></mxCell></object>`).join('');
const page = `<diagram id="page"><mxGraphModel><root>
  <mxCell id="0"/><mxCell id="1" parent="0"/>
  <mxCell id="layer" parent="1" vertex="1"><mxGeometry x="13.7" y="9.4" width="700" height="1100" as="geometry"/></mxCell>
  <object id="source" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="17.3" y="1.7" width="37" height="41" as="geometry"/></mxCell></object>
  ${targets}
  <object id="blocker" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="120" y="80" width="180" height="40" as="geometry"/></mxCell></object>
  ${edges}
</root></mxGraphModel></diagram>`;

function value(style: string, name: string): number {
  return Number(style.split(';').find((part) => part.startsWith(`${name}=`)).slice(name.length + 1));
}

function endpoint(rect: Rect, style: string, prefix: 'exit' | 'entry'): Point {
  return {
    x: rect.x + rect.width * value(style, `${prefix}X`),
    y: rect.y + rect.height * value(style, `${prefix}Y`)
  };
}

describe('corridor route serialization', () => {
  it('routes around a wall whose only detour is beyond 128 units', async() => {
    const highBarrierPage = `<diagram id="page"><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="layer" parent="1"/>
      <object id="source" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="0" y="0" width="40" height="40" as="geometry"/></mxCell></object>
      <object id="target" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="500" y="1000" width="40" height="40" as="geometry"/></mxCell></object>
      <object id="blocker" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="-1000" y="80" width="2000" height="800" as="geometry"/></mxCell></object>
      <object id="edge" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="layer" source="source" target="target"><mxGeometry relative="1" as="geometry"/></mxCell></object>
    </root></mxGraphModel></diagram>`;
    const { xml, diagnostics } = await routeCorridorPage(highBarrierPage);
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const waypoints = Array.from(document.querySelectorAll('object#edge Array[as="points"] > mxPoint'), (point) => Number(point.getAttribute('x')));

    expect(diagnostics).toEqual(expect.objectContaining({ routedEdges: 1, failedEdges: 0 }));
    expect(waypoints.some((x) => Math.abs(x) > 648)).toBe(true);
  });

  it('keeps serialized route attempts orthogonal from port to port', async() => {
    const { xml, diagnostics } = await routeCorridorPage(page);
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const source = { x: 17.3, y: 1.7, width: 37, height: 41 };

    expect(diagnostics).toEqual(expect.objectContaining({ routedEdges: edgeCount, failedEdges: 0 }));
    for (const edge of document.querySelectorAll(`object[schema="${LOGICAL_SCHEMA}"]`)) {
      const cell = edge.querySelector('mxCell');
      const targetId = cell.getAttribute('target');
      const target = { x: 500.4, y: 160.5 + Number(targetId.split('.')[1]) * 80, width: 53, height: 37 };
      const style = cell.getAttribute('style');
      const waypoints = Array.from(edge.querySelectorAll('Array[as="points"] > mxPoint'), (point) => ({
        x: Number(point.getAttribute('x')) + 13.7,
        y: Number(point.getAttribute('y')) + 9.4
      }));
      const points = [endpoint(source, style, 'exit'), ...waypoints, endpoint(target, style, 'entry')];

    expect(isOrthogonal(points, 1e-7)).toBe(true);
    }
  });

  it('falls back to a fractional side port when both vertical ports are blocked', async() => {
    const targetX = 500.4;
    const targetY = 900.5;
    const targetWidth = 53;
    const targetHeight = 37;
    const portBlockers = [0.25, 0.5, 0.75].map((fraction, index) => `<object id="port-blocker.${index}" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="${targetX + targetWidth * fraction - 0.5}" y="${targetY - 1}" width="1" height="${targetHeight + 2}" as="geometry"/></mxCell></object>`).join('');
    const fractionalPage = `<diagram id="page"><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="layer" parent="1" vertex="1"><mxGeometry x="13.7" y="9.4" width="700" height="1100" as="geometry"/></mxCell>
      <object id="source" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="17.3" y="1.7" width="37" height="41" as="geometry"/></mxCell></object>
      <object id="target" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="${targetX}" y="${targetY}" width="${targetWidth}" height="${targetHeight}" as="geometry"/></mxCell></object>
      ${portBlockers}
      <object id="edge" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="layer" source="source" target="target"><mxGeometry relative="1" as="geometry"/></mxCell></object>
    </root></mxGraphModel></diagram>`;
    const { xml, diagnostics } = await routeCorridorPage(fractionalPage);
    expect(diagnostics).toEqual(expect.objectContaining({ routedEdges: 1, failedEdges: 0 }));
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const edge = document.querySelector('object#edge');
    const cell = edge.querySelector('mxCell');
    const style = cell.getAttribute('style');
    const entryX = value(style, 'entryX');
    const entryY = value(style, 'entryY');
    const port = {
      x: targetX + targetWidth * entryX,
      y: targetY + targetHeight * entryY
    };
    const waypoints = Array.from(edge.querySelectorAll('Array[as="points"] > mxPoint'), (point) => ({
      x: Number(point.getAttribute('x')) + 13.7,
      y: Number(point.getAttribute('y')) + 9.4
    }));

    expect(entryX === 0 || entryX === 1).toBe(true);
    expect([0.25, 0.5, 0.75].some((fraction) => Math.abs(entryY - fraction) <= 1e-7)).toBe(true);
    const source = { x: 17.3, y: 1.7, width: 37, height: 41 };
    const sourcePort = endpoint(source, style, 'exit');
    expect(isOrthogonal([sourcePort, ...waypoints, port], 1e-7)).toBe(true);
  });
});
