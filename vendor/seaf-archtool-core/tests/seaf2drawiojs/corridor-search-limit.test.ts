/** @jest-environment jsdom */
import { describe, expect, it } from '@jest/globals';
import { planMemberRoute, type RoutingDiagnostics } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { hitsObstacle, isOrthogonal, rectangle, type OccupiedTrack, type Point } from './routing-test-helpers';

type Member = Parameters<typeof planMemberRoute>[0];
type Context = Parameters<typeof planMemberRoute>[3];

// Mirrors MAX_PORT_SHARED_OVERLAP of the router: a longer overlap with another layer is not a port overlap.
const MAX_PORT_SHARED_OVERLAP = 8;
// Fractions of the target width where the router places bottom target ports.
const BOTTOM_PORT_FRACTIONS = [0.25, 0.5, 0.75];
// Enough states for the short search to a side target port, too few for the detour to the top target face.
const SIDE_PORT_SEARCH_STATES = 120;

const layer = 'common_layer.own';
const otherLayer = 'common_layer.other';
const targetRect = rectangle(0, 0, 40, 200);
const sourceRect = rectangle(targetRect.x, targetRect.bottom + 2 * targetRect.height, targetRect.width, targetRect.width);
const obstacles = [sourceRect, targetRect];
const targetCenterY = targetRect.y + targetRect.height / 2;

// Other-layer tracks close every bottom target port: verticals run from the source up under each port and end
// inside the target far from the port, a horizontal runs along the whole bottom face. The top target face stays
// reachable only by a detour around the target.
const verticalTrack = (x: number): OccupiedTrack => ({
  layer: otherLayer, edgeId: `other.${x}`,
  routeStart: { x, y: targetCenterY }, routeEnd: { x, y: sourceRect.y },
  top: targetCenterY, bottom: sourceRect.y
});
const bottomFaceTrack: OccupiedTrack = {
  layer: otherLayer, edgeId: 'other.bottom',
  routeStart: { x: targetRect.x - targetRect.width, y: targetRect.bottom },
  routeEnd: { x: targetRect.right + targetRect.width, y: targetRect.bottom },
  left: targetRect.x - targetRect.width, right: targetRect.right + targetRect.width
};

function longestInterlayerOverlap(points: Point[], horizontal: Map<string, OccupiedTrack[]>, vertical: Map<string, OccupiedTrack[]>): number {
  let longest = 0;
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    const tracks = a.y === b.y ? horizontal.get(String(a.y)) ?? [] : vertical.get(String(a.x)) ?? [];
    for (const track of tracks) {
      if (track.layer === layer) continue;
      const overlap = a.y === b.y
        ? Math.max(0, Math.min(Math.max(a.x, b.x), track.right ?? -Infinity) - Math.max(Math.min(a.x, b.x), track.left ?? Infinity))
        : Math.max(0, Math.min(Math.max(a.y, b.y), track.bottom ?? -Infinity) - Math.max(Math.min(a.y, b.y), track.top ?? Infinity));
      longest = Math.max(longest, overlap);
    }
  }
  return longest;
}

async function routeWithSearchLimit(maxSearchStates?: number) {
  const xmlDocument = document.implementation.createDocument(null, 'root');
  const createRecord = (id: string): Member['edge'] => {
    const element = xmlDocument.createElement('object');
    const cell = xmlDocument.createElement('mxCell');
    element.appendChild(cell);
    return { id, order: 0, element, cell, wrapperId: id, cellId: id };
  };
  const horizontal = new Map([[String(bottomFaceTrack.routeStart.y), [bottomFaceTrack]]]);
  const vertical = new Map(BOTTOM_PORT_FRACTIONS
    .map((fraction) => targetRect.x + targetRect.width * fraction)
    .map((x) => [String(x), [verticalTrack(x)]]));
  const diagnostics: RoutingDiagnostics = {
    totalLogicalEdges: 1, routedEdges: 0, preservedEdges: 0, skippedEdges: 0,
    failedEdges: 0, groups: 1, semanticVertices: obstacles.length,
    routes: [], skipped: [], failed: []
  };
  const context: Context = {
    obstacles,
    index: { records: [], aliases: new Map<string, Member['edge']>() },
    blocker: (a: Point, b: Point) => obstacles.some((obstacle) => hitsObstacle(a, b, obstacle)),
    layerLaneIndexes: new Map(),
    layerEntryXs: new Map(),
    colorForLayer: () => '#0057B8',
    occupiedHorizontal: horizontal,
    occupiedVertical: vertical,
    diagnostics,
    fail: (record, reason, failedLayer, failedSource, failedTarget) => {
      diagnostics.failedEdges++;
      diagnostics.failed.push({ id: record.id, layer: failedLayer, source: failedSource, target: failedTarget, reason });
    }
  };
  const member: Member = {
    edge: createRecord('edge'), layer, source: createRecord('source'), target: createRecord('target'),
    sourceRect, targetRect, direction: 'north', edgeIndex: 0, parentOrigin: { x: 0, y: 0 }
  };
  const route = await planMemberRoute(member, 0, 1, context, { maxSearchStates });
  return { route, diagnostics, horizontal, vertical };
}

describe('bounded occupancy search for a route with blocked bottom target ports', () => {
  it('reaches the top target face by a detour when the search is not exhausted', async() => {
    const { route, diagnostics } = await routeWithSearchLimit();

    expect(diagnostics.failed).toEqual([]);
    expect(route?.points.at(-1)?.y).toBe(targetRect.y);
  });

  it('uses a side target port after the bounded vertical-port search is exhausted', async() => {
    const { route, diagnostics, horizontal, vertical } = await routeWithSearchLimit(SIDE_PORT_SEARCH_STATES);

    expect(diagnostics.failed).toEqual([]);
    expect(route).toBeDefined();
    if (!route) throw new Error('Expected a route through a side target port');
    const points = route.points;
    expect(isOrthogonal(points)).toBe(true);
    expect(points.at(-1)?.x === targetRect.x || points.at(-1)?.x === targetRect.right).toBe(true);
    expect(points.slice(1).some((point, index) => obstacles.some((obstacle) => hitsObstacle(points[index], point, obstacle)))).toBe(false);
    expect(longestInterlayerOverlap(points, horizontal, vertical)).toBeLessThanOrEqual(MAX_PORT_SHARED_OVERLAP);
  });
});
