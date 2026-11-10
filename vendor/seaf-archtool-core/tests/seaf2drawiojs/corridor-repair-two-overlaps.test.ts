import { describe, expect, it } from '@jest/globals';
import { nudgeInterior } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { hitsObstacle, rectangle, type OccupiedTrack, type Point } from './routing-test-helpers';

const layer = 'layer.failed';
const occupiedLayer = 'layer.occupied';
const failedPath: Point[] = [
  { x: 3125, y: 8743 }, { x: 3125, y: 8833 }, { x: 2964, y: 8833 },
  { x: 2964, y: 11061 }, { x: 3229, y: 11061 }, { x: 3229, y: 11334 },
  { x: 3326, y: 11334 }, { x: 3326, y: 11361 }, { x: 3279, y: 11361 },
  { x: 3279, y: 11634 }, { x: 3326, y: 11634 }, { x: 3326, y: 11665 },
  { x: 3289, y: 11665 }, { x: 3289, y: 11929 }, { x: 3331, y: 11929 },
  { x: 3331, y: 11961 }, { x: 3279, y: 11961 }, { x: 3279, y: 12229 },
  { x: 3331, y: 12229 }, { x: 3331, y: 12861 }, { x: 2985, y: 12861 },
  { x: 2985, y: 12855 }
];
const occupiedPaths: Point[][] = [
  [
    { x: 3764.090909090909, y: 12109 }, { x: 3764.090909090909, y: 12089 },
    { x: 3301, y: 12089 }, { x: 3301, y: 11929 },
    { x: 3120.4545454545455, y: 11929 }, { x: 3120.4545454545455, y: 11655 }
  ],
  [
    { x: 3826.6666666666665, y: 12109 }, { x: 3826.6666666666665, y: 12057 },
    { x: 3331, y: 12057 }, { x: 3331, y: 8889 }, { x: 3144.5833333333335, y: 8889 }
  ]
];
const obstacles = [
  rectangle(3095, 11935, 200, 20),
  rectangle(3095, 12235, 200, 20),
  rectangle(3095, 12535, 200, 20),
  rectangle(3095, 12835, 200, 20)
];

function occupancy(paths: Point[][]): { horizontal: Map<string, OccupiedTrack[]>; vertical: Map<string, OccupiedTrack[]> } {
  const horizontal = new Map<string, OccupiedTrack[]>();
  const vertical = new Map<string, OccupiedTrack[]>();
  for (const [pathIndex, points] of paths.entries()) {
    for (let index = 1; index < points.length; index++) {
      const a = points[index - 1];
      const b = points[index];
      if (a.y === b.y) {
        const key = String(a.y);
        const tracks = horizontal.get(key) ?? [];
        tracks.push({ left: Math.min(a.x, b.x), right: Math.max(a.x, b.x), layer: occupiedLayer,
          edgeId: `occupied-${pathIndex}`, routeStart: points[0], routeEnd: points.at(-1) });
        horizontal.set(key, tracks);
      } else if (a.x === b.x) {
        const key = String(a.x);
        const tracks = vertical.get(key) ?? [];
        tracks.push({ top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y), layer: occupiedLayer,
          edgeId: `occupied-${pathIndex}`, routeStart: points[0], routeEnd: points.at(-1) });
        vertical.set(key, tracks);
      }
    }
  }
  return { horizontal, vertical };
}

function sharedLength(points: Point[], other: Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    for (let j = 1; j < other.length; j++) {
      const c = other[j - 1];
      const d = other[j];
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


describe('two-overlap corridor repair', () => {
  it('nudges both route overlaps away with a bounded orthogonal path around local obstacles', () => {
    const occupied = occupancy(occupiedPaths);
    expect(occupiedPaths.reduce((sum, path) => sum + sharedLength(failedPath, path), 0)).toBe(44);
    const repaired = nudgeInterior(failedPath, layer, occupied.horizontal, occupied.vertical, obstacles);

    expect(repaired[0]).toEqual(failedPath[0]);
    expect(repaired.at(-1)).toEqual(failedPath.at(-1));
    expect(occupiedPaths.reduce((sum, path) => sum + sharedLength(repaired, path), 0)).toBe(0);
    expect(repaired.slice(1).some((point, index) => obstacles.some((obstacle) =>
      hitsObstacle(repaired[index], point, obstacle)))).toBe(false);
    expect(repaired.length).toBeLessThanOrEqual(failedPath.length + 8);
  });
});
