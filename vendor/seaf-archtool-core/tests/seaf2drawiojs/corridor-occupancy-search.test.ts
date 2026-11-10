/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals';
import { routeCorridorPage } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { edgeWaypoints, required, type Point } from './routing-test-helpers';

const LOGICAL_SCHEMA = 'seaf.company.ta.services.logical_links';

const input = `<diagram id="page"><mxGraphModel><root>
  <mxCell id="0"/><mxCell id="1" parent="0"/>
  <mxCell id="layer.a" parent="1"/><mxCell id="layer.b" parent="1"/>
  <object id="source.a" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="20" y="20" width="40" height="40" as="geometry"/></mxCell></object>
  <object id="source.b" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="120" y="20" width="40" height="40" as="geometry"/></mxCell></object>
  <object id="target.a" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="420" y="200" width="40" height="40" as="geometry"/></mxCell></object>
  <object id="target.b" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="520" y="200" width="40" height="40" as="geometry"/></mxCell></object>
  <object id="blocker" schema="seaf.company.ta.components.synthetic"><mxCell vertex="1" parent="1"><mxGeometry x="145" y="55" width="200" height="20" as="geometry"/></mxCell></object>
  <object id="edge.a" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="layer.a" source="source.a" target="target.a"><mxGeometry relative="1" as="geometry"/></mxCell></object>
  <object id="edge.b" schema="${LOGICAL_SCHEMA}"><mxCell edge="1" parent="layer.b" source="source.b" target="target.b"><mxGeometry relative="1" as="geometry"/></mxCell></object>
</root></mxGraphModel></diagram>`;

function routePoints(edge: Element): Point[] {
  const cell = required(edge.querySelector('mxCell'));
  const value = (key: string): number => Number(required(cell.getAttribute('style')).split(';')
    .find((part) => part.startsWith(`${key}=`))?.slice(key.length + 1));
  const a = edge.getAttribute('id') === 'edge.a' ? { x: 20, y: 20 } : { x: 120, y: 20 };
  const b = edge.getAttribute('id') === 'edge.a' ? { x: 420, y: 200 } : { x: 520, y: 200 };
  return [
    { x: a.x + 40 * value('exitX'), y: a.y + 40 * value('exitY') },
    ...edgeWaypoints(edge),
    { x: b.x + 40 * value('entryX'), y: b.y + 40 * value('entryY') }
  ];
}

function longSharedLength(left: Point[], right: Point[]): number {
  let length = 0;
  for (let i = 1; i < left.length; i++) {
    const [a, b] = [left[i - 1], left[i]];
    for (let j = 1; j < right.length; j++) {
      const [c, d] = [right[j - 1], right[j]];
      if (a.y === b.y && c.y === d.y && a.y === c.y) {
        length = Math.max(length, Math.max(0, Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x))
          - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x))));
      }
    }
  }
  return length;
}

function crossesBlocker(path: Point[]): boolean {
  return path.slice(1).some((point, index) => {
    const previous = path[index];
    return previous.y === point.y && point.y > 55 && point.y < 75
      && Math.max(Math.min(previous.x, point.x), 145) < Math.min(Math.max(previous.x, point.x), 345);
  });
}

describe('occupancy-aware orthogonal search', () => {
  it('uses a neighboring channel when independently routed layers converge on one trunk', async() => {
    const { xml, diagnostics } = await routeCorridorPage(input);
    const document = new DOMParser().parseFromString(xml, 'application/xml');
    const edges = Array.from<Element>(document.querySelectorAll(`object[schema="${LOGICAL_SCHEMA}"]`));
    const paths = edges.map(routePoints);

    expect(diagnostics).toEqual(expect.objectContaining({ routedEdges: 2, skippedEdges: 0, failedEdges: 0 }));
    expect(longSharedLength(paths[0], paths[1])).toBeLessThanOrEqual(8);
    expect(paths[1].some((point) => point.y === 88)).toBe(true);
    expect(paths.every((path) => !crossesBlocker(path))).toBe(true);
  });
});
