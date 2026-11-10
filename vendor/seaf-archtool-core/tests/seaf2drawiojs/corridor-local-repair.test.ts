import { describe, expect, it } from '@jest/globals';
import { nudgeInterior } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { hitsObstacle, rectangle, type OccupiedTrack, type Point } from './routing-test-helpers';

const FAILED_LAYER = 'layer.failed';
const OCCUPIED_LAYER = 'layer.occupied';
const FAILED_PATH: Point[] = [
  { x: 37, y: 0 }, { x: 0, y: 0 }, { x: 0, y: 264 }, { x: 42, y: 264 },
  { x: 42, y: 296 }, { x: -10, y: 296 }, { x: -10, y: 564 }, { x: 42, y: 564 }
];
const OCCUPIED_PATHS: Point[][] = [
  [
    { x: 475.1, y: 444 }, { x: 475.1, y: 424 }, { x: 12, y: 424 },
    { x: 12, y: 264 }, { x: -168.5, y: 264 }, { x: -168.5, y: -10 }
  ],
  [
    { x: 537.7, y: 444 }, { x: 537.7, y: 392 }, { x: 42, y: 392 },
    { x: 42, y: -2776 }, { x: -144.4, y: -2776 }
  ]
];
const OBSTACLES = [
  rectangle(-194, 270, 200, 20),
  rectangle(-194, 570, 200, 20),
  rectangle(-194, 870, 200, 20),
  rectangle(-194, 1170, 200, 20)
];

function occupiedSegments(paths: Point[][]): { horizontal: Map<string, OccupiedTrack[]>; vertical: Map<string, OccupiedTrack[]> } {
  const horizontal = new Map<string, OccupiedTrack[]>();
  const vertical = new Map<string, OccupiedTrack[]>();
  for (const [pathIndex, points] of paths.entries()) {
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1];
      const b = points[index];
      if (a.y === b.y) {
        const key = String(a.y);
        const tracks = horizontal.get(key) ?? [];
        tracks.push({ left: Math.min(a.x, b.x), right: Math.max(a.x, b.x), layer: OCCUPIED_LAYER, edgeId: `occupied.${pathIndex}`, routeStart: points[0], routeEnd: points.at(-1) });
        horizontal.set(key, tracks);
      } else if (a.x === b.x) {
        const key = String(a.x);
        const tracks = vertical.get(key) ?? [];
        tracks.push({ top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y), layer: OCCUPIED_LAYER, edgeId: `occupied.${pathIndex}`, routeStart: points[0], routeEnd: points.at(-1) });
        vertical.set(key, tracks);
      }
    }
  }
  return { horizontal, vertical };
}

function sharedCollinearLength(left: Point[], right: Point[]): number {
  let total = 0;
  for (let i = 1; i < left.length; i++) {
    const a = left[i - 1];
    const b = left[i];
    for (let j = 1; j < right.length; j++) {
      const c = right[j - 1];
      const d = right[j];
      if (a.y === b.y && c.y === d.y && a.y === c.y) {
        total += Math.max(0, Math.min(Math.max(a.x, b.x), Math.max(c.x, d.x))
          - Math.max(Math.min(a.x, b.x), Math.min(c.x, d.x)));
      } else if (a.x === b.x && c.x === d.x && a.x === c.x) {
        total += Math.max(0, Math.min(Math.max(a.y, b.y), Math.max(c.y, d.y))
          - Math.max(Math.min(a.y, b.y), Math.min(c.y, d.y)));
      }
    }
  }
  return total;
}


describe('local corridor overlap repair', () => {
  it('removes an interior overlap against two occupied routes without crossing obstacles', () => {
    const occupied = occupiedSegments(OCCUPIED_PATHS);
    const repaired = nudgeInterior(FAILED_PATH, FAILED_LAYER, occupied.horizontal, occupied.vertical, OBSTACLES);

    expect(OCCUPIED_PATHS.reduce((sum, path) => sum + sharedCollinearLength(repaired, path), 0)).toBe(0);
    expect(repaired.slice(1).some((point, index) => OBSTACLES.some((obstacle) => hitsObstacle(repaired[index], point, obstacle)))).toBe(false);
  });
});
