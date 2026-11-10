export interface Point {
  x: number;
  y: number;
}

export interface Rectangle extends Point {
  width: number;
  height: number;
  right: number;
  bottom: number;
  originX: number;
  originY: number;
  originalWidth: number;
  originalHeight: number;
  radians: number;
}

export interface OccupiedTrack {
  layer: string;
  edgeId: string;
  routeStart: Point;
  routeEnd: Point;
  left?: number;
  right?: number;
  top?: number;
  bottom?: number;
}

export function required<T>(value: T | null | undefined): T {
  if (value == null) throw new Error('Expected matching Draw.io XML element');
  return value;
}

export function rectangle(x: number, y: number, width: number, height: number): Rectangle {
  return { x, y, width, height, right: x + width, bottom: y + height,
    originX: x, originY: y, originalWidth: width, originalHeight: height, radians: 0 };
}

export function parseXml(xml: string): Document {
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (document.querySelector('parsererror')) throw new Error('Invalid Draw.io XML');
  return document;
}

export function edgeWaypoints(edge: Element): Point[] {
  return Array.from<Element, Point>(edge.querySelectorAll('Array[as="points"] > mxPoint'), (point) => ({
    x: Number(point.getAttribute('x')),
    y: Number(point.getAttribute('y'))
  }));
}

export function isOrthogonal(points: Point[], epsilon = 0): boolean {
  return points.slice(1).every((point, index) => Math.abs(point.x - points[index].x) <= epsilon
    || Math.abs(point.y - points[index].y) <= epsilon);
}

export function styleValue(value: string | Element | null, key: string): string | null {
  const style = typeof value === 'string' ? value : value?.getAttribute('style') ?? '';
  return style.split(';').find((item) => item.startsWith(`${key}=`))?.slice(key.length + 1) ?? null;
}

export function hitsObstacle(a: { x: number; y: number }, b: { x: number; y: number }, obstacle: { x: number; y: number; right: number; bottom: number }): boolean {
  if (a.x === b.x) return a.x > obstacle.x && a.x < obstacle.right
    && Math.max(Math.min(a.y, b.y), obstacle.y) < Math.min(Math.max(a.y, b.y), obstacle.bottom);
  if (a.y === b.y) return a.y > obstacle.y && a.y < obstacle.bottom
    && Math.max(Math.min(a.x, b.x), obstacle.x) < Math.min(Math.max(a.x, b.x), obstacle.right);
  return true;
}
