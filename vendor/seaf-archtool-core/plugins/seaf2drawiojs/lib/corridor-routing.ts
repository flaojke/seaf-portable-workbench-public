/*
  Copyright (C) 2026 Sber

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

          http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

const ROUTE_COLORS = [
  '#0057B8', '#D14900', '#00835D', '#8B3FB0', '#C62828',
  '#007C91', '#815A32', '#5E6C00', '#C02B79', '#4E5D78',
  '#0A0AFF', '#00B800', '#FF0AFF', '#CA8E16', '#0AADFF',
  '#0A5CFF', '#EB47CF', '#5C00B8', '#008F30', '#DB8357',
  '#74A512', '#8F0030', '#FF0A0A', '#FF0A5C', '#AD0AFF',
  '#00B8B8', '#761966', '#DB576D', '#B447EB', '#8F4700',
  '#00B87A', '#FF0A85',
  '#0A0A76', '#163269', '#692416', '#A50D8C', '#2841BD',
  '#2B6916', '#691640', '#2873BD', '#471669', '#4B2BEE',
  '#D411D4', '#2B6CEE', '#0D1AA5', '#6742D7', '#93291F',
  '#D41162', '#D41193', '#7F0DA5'
];

export interface RoutingIssue {
  id: string;
  layer: string;
  source: string;
  target: string;
  reason: string;
}

export interface RoutingOptions {
  signal?: AbortSignal;
  layerColors?: Map<string, string>;
  preservedEdges?: ReadonlySet<string>;
  maxGridCells?: number;
  maxSearchStates?: number;
  yieldEvery?: number;
  yieldSliceMs?: number;
}

type Point = { x: number; y: number };
type Rectangle = Point & {
  width: number; height: number; right: number; bottom: number;
  originX: number; originY: number; originalWidth: number; originalHeight: number;
  radians: number; id?: string;
};
type CellRecord = {
  element: Element; cell: Element; id: string; order: number;
  wrapperId: string; cellId: string;
};
type CellIndex = { records: CellRecord[]; aliases: Map<string, CellRecord> };
type Track = {
  layer: string; edgeId: string; routeStart: Point; routeEnd: Point;
  left?: number; right?: number; top?: number; bottom?: number;
};
type Tracks = Map<string, Track[]>;
type HorizontalSegment = { y: string; left: number; right: number };
type VerticalSegment = { x: string; top: number; bottom: number };
type Port = { entryX: number; entryY: number; point: Point };
type OverlapDetail = {
  length: number; axis: 'horizontal' | 'vertical'; coordinate: string | number;
  left?: number; right?: number; top?: number; bottom?: number;
  otherEdge?: string; otherStart: Point; otherEnd: Point;
};
type SearchOptions = RoutingOptions & {
  layer?: string; occupiedHorizontal?: Tracks; occupiedVertical?: Tracks;
};
type HeapEntry = {
  priority: number; cost: number; i: number; j: number; direction: number;
};
type RouteMember = {
  edge: CellRecord; layer: string; source: CellRecord; target: CellRecord;
  sourceRect: Rectangle; targetRect: Rectangle; direction: string;
  edgeIndex: number; parentOrigin: Point;
};
type PlannedRoute = RouteMember & {
  points: Point[]; laneY: number; color: string; edgeId: string;
  exitX: number; exitY: number; entryX: number; entryY: number;
};

export interface RoutingDiagnostics {
  totalLogicalEdges: number; routedEdges: number; preservedEdges: number;
  skippedEdges: number; failedEdges: number; groups: number; semanticVertices: number;
  routes: Array<Omit<RoutingIssue, 'reason'> & { direction: string; laneY: number; points: number; color: string }>;
  skipped: RoutingIssue[];
  failed: RoutingIssue[];
}

const CONTAINER_SCHEMA_SUFFIXES = [
  '.dc', '.dcs', '.dc_az', '.dc_azs', '.dc_region', '.dc_regions',
  '.network_segment', '.network_segments'
];
const HORIZONTAL_DIRECTION = 0;
const VERTICAL_DIRECTION = 1;
const NONE_DIRECTION = 2;
const DIRECTION_STATES = 3;
const EPSILON = 1e-7;
const COORDINATE_DIGITS = 5;
const DOCUMENT_NODE_TYPE = 9;
const MAX_PORT_SHARED_OVERLAP = 8;
const MAX_SEARCH_STATES = 120000;
const MAX_GRID_CELLS = 160000;
const MAX_ROUTE_WAYPOINTS = 256;
// Long loops yield to the browser to keep the page responsive.
const YIELD_EVERY_STATES = 512;
const YIELD_EVERY_EDGES = 512;
const YIELD_SLICE_MS = 12;
// Loops over diagram elements check for cancellation once per this many items.
const ABORT_CHECK_EVERY = 256;
const ROUTE_LANE_PITCH = 8;
// Distance from the source face to the first routing lane.
const ROUTE_LANE_OFFSET = 20;
// Search grid lines run this far outside obstacle borders.
const OBSTACLE_CLEARANCE = 6;
const OBSTACLE_BIN_SIZE = 256;
const MAX_OBSTACLE_BINS = 20000;
const ROUTE_GRID_MARGIN = 64;
const MAX_OCCUPIED_COORDINATES_PER_AXIS = 52;
// Obstacles are collected within this margin around the endpoints; the margin doubles on each retry.
const ROUTE_SEARCH_MARGIN = 64;
const ROUTE_SEARCH_ATTEMPTS = 2;
const TURN_PENALTY = 12;
// Horizontal segments cost more the farther they run from the preferred lane.
const LANE_DEVIATION_STEP = 100;
const MAX_LANE_DEVIATION_STEPS = 3;
const LANE_DEVIATION_PENALTY = 0.25;
const MAX_NUDGE_PASSES = 8;
const NUDGE_STEP = 5;
const NUDGE_STEPS = 6;
const NUDGE_OFFSETS = Array.from({ length: NUDGE_STEPS }, (_, index) => (index + 1) * NUDGE_STEP)
  .flatMap((offset) => [-offset, offset]);
// Port positions as fractions of a shape side: the center and the alternatives around it.
const CENTER_FRACTION = 0.5;
const ALTERNATE_PORT_FRACTIONS = [0.25, 0.75];
// Layers beyond the palette get hues spaced by the golden angle and cycle through lightness levels.
const FALLBACK_HUE_STEP = 137.508;
const FALLBACK_SATURATION = 0.76;
const FALLBACK_LIGHTNESS_LEVELS = [0.35, 0.45, 0.55];

function throwIfAborted(signal?: AbortSignal) {
  if (!signal?.aborted) return;
  const error = new Error('Routing aborted');
  error.name = 'AbortError';
  throw error;
}

function canonicalLayerId(layer: string) {
  return String(layer ?? '').replace(/^common_(?=layer\.)/, '');
}

function hslToHex(hue: number, saturation: number, lightness: number): string {
  const chroma = (1 - Math.abs(2 * lightness - 1)) * saturation;
  const section = hue / 60;
  const second = chroma * (1 - Math.abs(section % 2 - 1));
  const [red, green, blue] = section < 1 ? [chroma, second, 0]
    : section < 2 ? [second, chroma, 0]
      : section < 3 ? [0, chroma, second]
        : section < 4 ? [0, second, chroma]
          : section < 5 ? [second, 0, chroma] : [chroma, 0, second];
  const offset = lightness - chroma / 2;
  return `#${[red, green, blue].map((value) => Math.round((value + offset) * 255).toString(16).padStart(2, '0')).join('')}`.toUpperCase();
}

function layerColorMap(layers: Iterable<string>): Map<string, string> {
  const result = new Map<string, string>();
  const used = new Set<string>();
  for (const [index, layer] of [...new Set([...layers].map(canonicalLayerId))].sort().entries()) {
    let color = ROUTE_COLORS[index];
    if (!color) {
      let attempt = 0;
      do {
        const hue = ((index - ROUTE_COLORS.length + attempt) * FALLBACK_HUE_STEP) % 360;
        const lightness = FALLBACK_LIGHTNESS_LEVELS[(index + attempt) % FALLBACK_LIGHTNESS_LEVELS.length];
        color = hslToHex(hue, FALLBACK_SATURATION, lightness);
        attempt++;
      } while (used.has(color));
    }
    used.add(color);
    result.set(layer, color);
  }
  return result;
}

function tagName(element: Element | null | undefined): string {
  return String(element?.localName ?? element?.tagName ?? '').toLowerCase();
}

function directChild(element: Element, name: string): Element | undefined {
  return Array.from(element?.children ?? []).find((child) => tagName(child) === name);
}

function directGeometry(cell: Element): Element | undefined {
  return directChild(cell, 'mxgeometry');
}

export function parseDiagramDocument(xml: string | Document): Document {
  if (typeof xml !== 'string' && xml?.nodeType === DOCUMENT_NODE_TYPE) return xml;
  if (typeof xml !== 'string' || !xml.trim()) throw new Error('Draw.io XML is empty');
  if (typeof DOMParser !== 'function') throw new Error('DOMParser is unavailable');
  const document = new DOMParser().parseFromString(xml, 'application/xml');
  if (!document || document.getElementsByTagName('parsererror').length) {
    throw new Error('Invalid Draw.io XML');
  }
  return document;
}

export function splitDiagramPages(xml: string | Document): string[] {
  const document = parseDiagramDocument(xml);
  const mxfile = document.querySelector('mxfile');
  if (!mxfile) throw new Error('Draw.io XML does not contain mxfile');
  return Array.from(mxfile.children).filter((child) => tagName(child) === 'diagram').map((diagram) => {
    const page = document.implementation.createDocument(mxfile.namespaceURI, 'mxfile');
    for (const attribute of mxfile.attributes) page.documentElement.setAttribute(attribute.name, attribute.value);
    page.documentElement.appendChild(page.importNode(diagram, true));
    return new XMLSerializer().serializeToString(page);
  });
}

export function replaceDiagramPage(xml: string | Document, pageIndex: number, pageXml: string): string {
  const document = parseDiagramDocument(xml);
  const page = parseDiagramDocument(pageXml).querySelector('mxfile > diagram');
  const diagram = document.querySelectorAll('mxfile > diagram')[pageIndex];
  if (!diagram || !page) throw new Error('Draw.io XML page is missing');
  diagram.replaceWith(document.importNode(page, true));
  return new XMLSerializer().serializeToString(document);
}

function graphRoot(document: Document | Element): Element {
  const root = document.querySelector?.('mxGraphModel > root')
    ?? Array.from(document.getElementsByTagName('root'))[0];
  if (!root) throw new Error('Draw.io XML does not contain graph root');
  return root;
}

function numberValue(value: string | number | null | undefined, fallback = 0): number {
  const result = Number.parseFloat(String(value));
  return Number.isFinite(result) ? result : fallback;
}

function geometryValue(geometry: Element, name: string): number | null {
  const raw = geometry.getAttribute(name);
  if (raw === null || raw === '') return 0;
  const result = Number(raw);
  return Number.isFinite(result) ? result : null;
}

function formatNumber(value: number): string {
  if (!Number.isFinite(value)) return '0';
  const rounded = Number(value.toFixed(COORDINATE_DIGITS));
  return String(Object.is(rounded, -0) ? 0 : rounded);
}

function elementId(element: Element, cell: Element): string {
  return element?.getAttribute('id') || cell?.getAttribute('id') || '';
}

function isLogicalSchema(value: string | null | undefined): boolean {
  const schema = String(value ?? '').trim().toLowerCase();
  return schema.endsWith('.logical_links')
    || schema.endsWith('.logical_link');
}

function isContainerSchema(value: string | null | undefined): boolean {
  const schema = String(value ?? '').trim().toLowerCase();
  return CONTAINER_SCHEMA_SUFFIXES.some((suffix) => schema.endsWith(suffix));
}

function isObjectWrapper(element: Element | null | undefined): boolean {
  return tagName(element) === 'object';
}

function buildIndex(root: Element, signal?: AbortSignal): CellIndex {
  const records: CellRecord[] = [];
  const aliases = new Map<string, CellRecord>();
  for (const [order, element] of Array.from(root.children ?? []).entries()) {
    if (order % ABORT_CHECK_EVERY === 0) throwIfAborted(signal);
    const cell = tagName(element) === 'mxcell' ? element : directChild(element, 'mxcell');
    if (!cell) continue;
    const id = elementId(element, cell);
    const record = {
      element,
      cell,
      id,
      order,
      wrapperId: element.getAttribute('id') || '',
      cellId: cell.getAttribute('id') || ''
    };
    records.push(record);
    for (const alias of [record.wrapperId, record.cellId].filter(Boolean)) {
      if (!aliases.has(alias)) aliases.set(alias, record);
    }
  }
  return { records, aliases };
}

function absoluteRect(record: CellRecord, index: CellIndex, cache: Map<CellRecord, Rectangle>, seen = new Set<CellRecord>()): Rectangle | null {
  if (!record || seen.has(record)) return null;
  if (cache.has(record)) return cache.get(record);
  seen.add(record);
  const cell = record.cell;
  if (cell.getAttribute('vertex') !== '1') {
    cache.set(record, null);
    return null;
  }
  const geometry = directGeometry(cell);
  if (!geometry) {
    cache.set(record, null);
    return null;
  }
  const values = ['x', 'y', 'width', 'height'].map((name) => geometryValue(geometry, name));
  if (values.some((value) => value === null)) {
    cache.set(record, null);
    return null;
  }
  let [x, y, width, height] = values;
  const parentId = cell.getAttribute('parent');
  if (parentId && !['0', '1'].includes(parentId)) {
    const parentRecord = index.aliases.get(parentId);
    if (parentRecord?.cell.getAttribute('vertex') === '1') {
      const parent = absoluteRect(parentRecord, index, cache, seen);
      if (!parent) {
        cache.set(record, null);
        return null;
      }
      x += parent.originX;
      y += parent.originY;
    }
  }
  const originX = x;
  const originY = y;
  const originalWidth = width;
  const originalHeight = height;
  const rotation = numberValue(cell.getAttribute('style')?.match(/(?:^|;)rotation=([-\d.]+)/)?.[1]);
  const radians = rotation * Math.PI / 180;
  const visualWidth = Number(formatNumber(Math.abs(width * Math.cos(radians)) + Math.abs(height * Math.sin(radians))));
  const visualHeight = Number(formatNumber(Math.abs(width * Math.sin(radians)) + Math.abs(height * Math.cos(radians))));
  x += (width - visualWidth) / 2;
  y += (height - visualHeight) / 2;
  width = visualWidth;
  height = visualHeight;
  const rect = { x, y, width, height, right: x + width, bottom: y + height,
    originX, originY, originalWidth, originalHeight, radians };
  cache.set(record, rect);
  return rect;
}

function semanticVertex(record: CellRecord): boolean {
  if (!isObjectWrapper(record?.element) || record.cell.getAttribute('vertex') !== '1') return false;
  const entity = record.element.getAttribute('schema') || record.element.getAttribute('common_schema');
  if (!entity || isContainerSchema(entity)) return false;
  if (record.element.getAttribute('common_network_segment') === 'true') return false;
  return true;
}

function endpointOfficeAncestors(source: CellRecord, target: CellRecord, index: CellIndex, obstacles: Rectangle[]): Rectangle[] {
  const excluded = new Set<string>();
  for (const endpoint of [source, target]) {
    let parentId = endpoint?.cell.getAttribute('parent') || '';
    const seen = new Set<string>();
    while (parentId && !seen.has(parentId)) {
      seen.add(parentId);
      const ancestor = index.aliases.get(parentId);
      if (!ancestor) break;
      const schema = ancestor.element.getAttribute('schema')
        || ancestor.element.getAttribute('common_schema')
        || '';
      if (schema.toLowerCase().endsWith('.dc_offices')) excluded.add(ancestor.id);
      parentId = ancestor.cell.getAttribute('parent') || '';
    }
  }
  return excluded.size ? obstacles.filter((obstacle) => !excluded.has(obstacle.id)) : obstacles;
}

function endpointVertex(record: CellRecord): boolean {
  return record?.cell.getAttribute('vertex') === '1';
}

function logicalEdge(record: CellRecord): boolean {
  if (!isObjectWrapper(record?.element) || record.cell.getAttribute('edge') !== '1') return false;
  return isLogicalSchema(record.element.getAttribute('schema'))
    || record.element.getAttribute('common_logical_link') === 'true'
    || record.cell.getAttribute('common_logical_link') === 'true';
}

/** Assign one color per logical layer across the complete Draw.io document. */
export function createLayerColorMap(fullXml: string | Document): Map<string, string> {
  const document = parseDiagramDocument(fullXml);
  const layers = new Set<string>();
  for (const diagram of Array.from(document.querySelectorAll('mxfile > diagram'))) {
    const index = buildIndex(graphRoot(diagram));
    for (const edge of index.records.filter(logicalEdge)) {
      const parent = edge.cell.getAttribute('parent') || '';
      if (parent) layers.add(index.aliases.get(parent)?.id || parent);
    }
  }
  return layerColorMap(layers);
}

function pointKey(point: Point): string {
  return `${formatNumber(point.x)},${formatNumber(point.y)}`;
}

function segmentKey(a: Point, b: Point): string {
  const first = pointKey(a);
  const second = pointKey(b);
  return first < second ? `${first}|${second}` : `${second}|${first}`;
}

function pointInside(point: Point, rect: Rectangle): boolean {
  return point.x > rect.x + EPSILON && point.x < rect.right - EPSILON
    && point.y > rect.y + EPSILON && point.y < rect.bottom - EPSILON;
}

function connectionFractions(rect: Rectangle, point: Point): Point {
  const dx = point.x - rect.originX - rect.originalWidth / 2;
  const dy = point.y - rect.originY - rect.originalHeight / 2;
  return {
    x: (dx * Math.cos(rect.radians) + dy * Math.sin(rect.radians)) / rect.originalWidth + CENTER_FRACTION,
    y: (-dx * Math.sin(rect.radians) + dy * Math.cos(rect.radians)) / rect.originalHeight + CENTER_FRACTION
  };
}

function targetPort(rect: Rectangle, sign: number, obstacles: Rectangle[], reverse = false, entryX = CENTER_FRACTION): Port | null {
  const preferredEntryY = sign < 0 ? 1 : 0;
  const ports = reverse ? [1 - preferredEntryY, preferredEntryY] : [preferredEntryY, 1 - preferredEntryY];
  for (const entryY of ports) {
    const x = Number(formatNumber(rect.x + rect.width * entryX));
    const point = {
      x,
      y: entryY === 0 ? rect.y : rect.bottom
    };
    if (!obstacles.some((obstacle) => pointInside(point, obstacle))) {
      return { entryX: (x - rect.x) / rect.width, entryY, point };
    }
  }
  return null;
}

function targetSidePort(rect: Rectangle, side: 'left' | 'right', entryY: number, obstacles: Rectangle[]): Port | null {
  const entryX = side === 'left' ? 0 : 1;
  const y = Number(formatNumber(rect.y + rect.height * entryY));
  const point = { x: side === 'left' ? rect.x : rect.right, y };
  return obstacles.some((obstacle) => pointInside(point, obstacle))
    ? null : { entryX, entryY: (y - rect.y) / rect.height, point };
}

function segmentHitsRect(a: Point, b: Point, rect: Rectangle): boolean {
  if (Math.abs(a.x - b.x) <= EPSILON) {
    const low = Math.min(a.y, b.y);
    const high = Math.max(a.y, b.y);
    return a.x > rect.x + EPSILON && a.x < rect.right - EPSILON
      && Math.max(low, rect.y) < Math.min(high, rect.bottom) - EPSILON;
  }
  if (Math.abs(a.y - b.y) <= EPSILON) {
    const low = Math.min(a.x, b.x);
    const high = Math.max(a.x, b.x);
    return a.y > rect.y + EPSILON && a.y < rect.bottom - EPSILON
      && Math.max(low, rect.x) < Math.min(high, rect.right) - EPSILON;
  }
  return true;
}

function makeObstacleBlocker(obstacles: Rectangle[], options: RoutingOptions) {
  const bins = new Map<string, Rectangle[]>();
  let binCount = 0;
  for (const [index, obstacle] of obstacles.entries()) {
    if (index % ABORT_CHECK_EVERY === 0) throwIfAborted(options.signal);
    const left = Math.floor(obstacle.x / OBSTACLE_BIN_SIZE);
    const right = Math.floor((obstacle.right - EPSILON) / OBSTACLE_BIN_SIZE);
    const top = Math.floor(obstacle.y / OBSTACLE_BIN_SIZE);
    const bottom = Math.floor((obstacle.bottom - EPSILON) / OBSTACLE_BIN_SIZE);
    binCount += Math.max(1, right - left + 1) * Math.max(1, bottom - top + 1);
    if (binCount > MAX_OBSTACLE_BINS) break;
    for (let bx = left; bx <= right; bx++) {
      for (let by = top; by <= bottom; by++) {
        const key = `${bx},${by}`;
        const bucket = bins.get(key) ?? [];
        bucket.push(obstacle);
        bins.set(key, bucket);
      }
    }
  }
  const useBins = binCount <= MAX_OBSTACLE_BINS;
  const blockedCache = new Map<string, boolean>();
  const candidates = (a: Point, b: Point): Iterable<Rectangle> => {
    if (!useBins) return obstacles;
    const result = new Set<Rectangle>();
    if (a.x === b.x) {
      const bx = Math.floor(a.x / OBSTACLE_BIN_SIZE);
      const top = Math.floor(Math.min(a.y, b.y) / OBSTACLE_BIN_SIZE);
      const bottom = Math.floor((Math.max(a.y, b.y) - EPSILON) / OBSTACLE_BIN_SIZE);
      for (let by = top; by <= bottom; by++) {
        for (const obstacle of bins.get(`${bx},${by}`) ?? []) result.add(obstacle);
      }
    } else {
      const by = Math.floor(a.y / OBSTACLE_BIN_SIZE);
      const left = Math.floor(Math.min(a.x, b.x) / OBSTACLE_BIN_SIZE);
      const right = Math.floor((Math.max(a.x, b.x) - EPSILON) / OBSTACLE_BIN_SIZE);
      for (let bx = left; bx <= right; bx++) {
        for (const obstacle of bins.get(`${bx},${by}`) ?? []) result.add(obstacle);
      }
    }
    return result;
  };
  return (a: Point, b: Point): boolean => {
    const key = segmentKey(a, b);
    if (blockedCache.has(key)) return blockedCache.get(key);
    const blocked = [...candidates(a, b)].some((obstacle) => segmentHitsRect(a, b, obstacle));
    blockedCache.set(key, blocked);
    return blocked;
  };
}

function uniqueSorted(values: number[]): number[] {
  return [...new Set(values.filter(Number.isFinite))].sort((a, b) => a - b);
}

function routeGrid(a: Point, b: Point | Point[], preferredY: number, obstacles: Rectangle[], signal?: AbortSignal, options: SearchOptions = {}) {
  const targets = Array.isArray(b) ? b : [b];
  const xs = [a.x, ...targets.map((point) => point.x)];
  const ys = [a.y, ...targets.map((point) => point.y), preferredY];
  // A short port stub must have an escape coordinate even when occupied tracks fill the local grid.
  for (const point of [a, ...targets]) {
    xs.push(point.x - ROUTE_LANE_PITCH, point.x + ROUTE_LANE_PITCH);
    ys.push(point.y - ROUTE_LANE_PITCH, point.y + ROUTE_LANE_PITCH);
  }
  for (const [index, obstacle] of obstacles.entries()) {
    if (index % ABORT_CHECK_EVERY === 0) throwIfAborted(signal);
    xs.push(obstacle.x - OBSTACLE_CLEARANCE, obstacle.right + OBSTACLE_CLEARANCE);
    ys.push(obstacle.y - OBSTACLE_CLEARANCE, obstacle.bottom + OBSTACLE_CLEARANCE);
  }
  const margin = ROUTE_GRID_MARGIN;
  const left = Math.min(a.x, ...targets.map((point) => point.x)) - margin;
  const right = Math.max(a.x, ...targets.map((point) => point.x)) + margin;
  const top = Math.min(a.y, ...targets.map((point) => point.y), preferredY) - margin;
  const bottom = Math.max(a.y, ...targets.map((point) => point.y), preferredY) + margin;
  const xTracks = new Set<number>();
  const yTracks = new Set<number>();
  for (const [coordinate, tracks] of options.occupiedHorizontal ?? []) {
    const y = Number(coordinate);
    if (Math.abs(y - preferredY) > margin && (y < top || y > bottom)) continue;
    if (!tracks.some((track) => track.layer !== options.layer && track.right >= left && track.left <= right)) continue;
    yTracks.add(y - ROUTE_LANE_PITCH);
    yTracks.add(y + ROUTE_LANE_PITCH);
  }
  for (const [coordinate, tracks] of options.occupiedVertical ?? []) {
    const x = Number(coordinate);
    if (x < left || x > right) continue;
    if (!tracks.some((track) => track.layer !== options.layer && track.bottom >= top && track.top <= bottom)) continue;
    xTracks.add(x - ROUTE_LANE_PITCH);
    xTracks.add(x + ROUTE_LANE_PITCH);
  }
  const limitCoordinates = (values: Set<number>, center: number) => [...values]
    .filter((value) => Number.isFinite(value))
    .sort((first, second) => Math.abs(first - center) - Math.abs(second - center))
    .slice(0, MAX_OCCUPIED_COORDINATES_PER_AXIS);
  xs.push(...limitCoordinates(xTracks, (left + right) / 2));
  ys.push(...limitCoordinates(yTracks, preferredY));
  return { xs: uniqueSorted(xs), ys: uniqueSorted(ys) };
}

function nearbyObstacles(a: Point, b: Point | Point[], preferredY: number, obstacles: Rectangle[], margin: number): Rectangle[] {
  const targets = Array.isArray(b) ? b : [b];
  const left = Math.min(a.x, ...targets.map((point) => point.x)) - margin;
  const right = Math.max(a.x, ...targets.map((point) => point.x)) + margin;
  const top = Math.min(a.y, ...targets.map((point) => point.y), preferredY) - margin;
  const bottom = Math.max(a.y, ...targets.map((point) => point.y), preferredY) + margin;
  return obstacles.filter((rect) => rect.right >= left && rect.x <= right
    && rect.bottom >= top && rect.y <= bottom);
}

function simplify(points: Point[]): Point[] {
  const result = [];
  for (const point of points) {
    if (result.length && pointKey(result[result.length - 1]) === pointKey(point)) continue;
    const previous = result[result.length - 2];
    const current = result[result.length - 1];
    if (previous && current
      && ((previous.x === current.x && current.x === point.x)
        || (previous.y === current.y && current.y === point.y))) {
      result[result.length - 1] = point;
    } else {
      result.push(point);
    }
  }
  return result;
}

function horizontalSegments(points: Point[]): HorizontalSegment[] {
  const segments: HorizontalSegment[] = [];
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    if (a.y === b.y && a.x !== b.x) {
      segments.push({ y: formatNumber(a.y), left: Math.min(a.x, b.x), right: Math.max(a.x, b.x) });
    }
  }
  return segments;
}

function verticalSegments(points: Point[]): VerticalSegment[] {
  const segments: VerticalSegment[] = [];
  for (let index = 1; index < points.length; index++) {
    const a = points[index - 1];
    const b = points[index];
    if (a.x === b.x && a.y !== b.y) {
      segments.push({ x: formatNumber(a.x), top: Math.min(a.y, b.y), bottom: Math.max(a.y, b.y) });
    }
  }
  return segments;
}

function pathOverlapDetails(points: Point[], layer: string, occupiedHorizontal: Tracks, occupiedVertical: Tracks): OverlapDetail[] {
  const details: OverlapDetail[] = [];
  for (const segment of horizontalSegments(points)) {
    for (const other of occupiedHorizontal.get(segment.y) ?? []) {
      if (other.layer === layer) continue;
      const left = Math.max(segment.left, other.left);
      const right = Math.min(segment.right, other.right);
      if (right > left) details.push({ length: right - left, axis: 'horizontal', coordinate: segment.y, left, right, otherEdge: other.edgeId, otherStart: other.routeStart, otherEnd: other.routeEnd });
    }
  }
  for (const segment of verticalSegments(points)) {
    for (const other of occupiedVertical.get(segment.x) ?? []) {
      if (other.layer === layer) continue;
      const top = Math.max(segment.top, other.top);
      const bottom = Math.min(segment.bottom, other.bottom);
      if (bottom > top) details.push({ length: bottom - top, axis: 'vertical', coordinate: segment.x, top, bottom, otherEdge: other.edgeId, otherStart: other.routeStart, otherEnd: other.routeEnd });
    }
  }
  return details;
}

function pathOverlapTotal(points: Point[], layer: string, occupiedHorizontal: Tracks, occupiedVertical: Tracks): number {
  return pathOverlapDetails(points, layer, occupiedHorizontal, occupiedVertical)
    .reduce((total, detail) => total + detail.length, 0);
}

function isShortPortOverlap(detail: OverlapDetail, start: Point, end: Point): boolean {
  if (!detail.length) return true;
  if (detail.length > MAX_PORT_SHARED_OVERLAP) return false;
  const coordinate = Number(detail.coordinate);
  const nearEndpoint = (point: Point) => detail.axis === 'horizontal'
    ? point?.y === coordinate && Math.max(Math.abs(detail.left - point.x), Math.abs(detail.right - point.x)) <= MAX_PORT_SHARED_OVERLAP
    : point?.x === coordinate && Math.max(Math.abs(detail.top - point.y), Math.abs(detail.bottom - point.y)) <= MAX_PORT_SHARED_OVERLAP;
  return [start, end].some(nearEndpoint) && [detail.otherStart, detail.otherEnd].some(nearEndpoint);
}

function firstNonPortOverlap(points: Point[], layer: string, occupiedHorizontal: Tracks, occupiedVertical: Tracks, start: Point): OverlapDetail | undefined {
  const end = points[points.length - 1];
  return pathOverlapDetails(points, layer, occupiedHorizontal, occupiedVertical)
    .find((detail) => !isShortPortOverlap(detail, start, end));
}

export function nudgeInterior(points: Point[], layer: string, occupiedHorizontal: Tracks, occupiedVertical: Tracks, obstacles: Rectangle[], signal?: AbortSignal): Point[] {
  let best = points;
  let overlap = pathOverlapTotal(best, layer, occupiedHorizontal, occupiedVertical);
  for (let pass = 0; pass < MAX_NUDGE_PASSES && overlap > 0; pass++) {
    throwIfAborted(signal);
    let changed = false;
    for (let index = 1; index < best.length - 2 && !changed; index++) {
      const before = best[index - 1];
      const a = best[index];
      const b = best[index + 1];
      const after = best[index + 2];
      const horizontal = a.y === b.y && before.x === a.x && after.x === b.x;
      const vertical = a.x === b.x && before.y === a.y && after.y === b.y;
      if (!horizontal && !vertical) continue;
      let bestCandidate: Point[] | undefined;
      let bestCandidateOverlap = overlap;
      const consider = (candidate: Point[]) => {
        const candidateOverlap = pathOverlapTotal(candidate, layer, occupiedHorizontal, occupiedVertical);
        if (candidateOverlap >= bestCandidateOverlap) return;
        if (obstacles.some((obstacle) => candidate.slice(1)
          .some((point, pointIndex) => segmentHitsRect(candidate[pointIndex], point, obstacle)))) return;
        bestCandidate = candidate;
        bestCandidateOverlap = candidateOverlap;
      };
      for (const offset of NUDGE_OFFSETS) {
        throwIfAborted(signal);
        const candidate = simplify(best.map((point, pointIndex) => pointIndex === index || pointIndex === index + 1
          ? { x: point.x + (vertical ? offset : 0), y: point.y + (horizontal ? offset : 0) }
          : point));
        consider(candidate);
      }
      for (const across of [-ROUTE_LANE_PITCH, ROUTE_LANE_PITCH]) {
        for (const along of [-ROUTE_LANE_PITCH, ROUTE_LANE_PITCH]) {
          throwIfAborted(signal);
          const candidate = simplify([
            ...best.slice(0, index),
            horizontal
              ? { x: a.x, y: a.y + across }
              : { x: a.x + across, y: a.y },
            horizontal
              ? { x: b.x + along, y: b.y + across }
              : { x: b.x + across, y: b.y + along },
            horizontal
              ? { x: b.x + along, y: after.y }
              : { x: after.x, y: b.y + along },
            after,
            ...best.slice(index + 3)
          ]);
          consider(candidate);
        }
      }
      if (bestCandidate) {
        best = bestCandidate;
        overlap = bestCandidateOverlap;
        changed = true;
      }
    }
    if (!changed) break;
  }
  return best;
}

function stateKey(i: number, j: number, direction: number, columns: number): number {
  return ((i * columns) + j) * DIRECTION_STATES + direction;
}

function decodeState(key: number, columns: number): { i: number; j: number; direction: number } {
  const direction = key % DIRECTION_STATES;
  const cell = Math.floor(key / DIRECTION_STATES);
  return { i: Math.floor(cell / columns), j: cell % columns, direction };
}

class MinHeap {
  constructor() {
    this.items = [];
  }

  static before(left: HeapEntry, right: HeapEntry) {
    return left.priority < right.priority
      || (left.priority === right.priority && (left.cost < right.cost
        || (left.cost === right.cost && (left.i < right.i
          || (left.i === right.i && (left.j < right.j
            || (left.j === right.j && left.direction < right.direction)))))));
  }

  items: HeapEntry[];

  push(item: HeapEntry) {
    this.items.push(item);
    let index = this.items.length - 1;
    while (index) {
      const parent = Math.floor((index - 1) / 2);
      if (!MinHeap.before(this.items[index], this.items[parent])) break;
      [this.items[index], this.items[parent]] = [this.items[parent], this.items[index]];
      index = parent;
    }
  }

  pop() {
    if (!this.items.length) return undefined;
    const result = this.items[0];
    const tail = this.items.pop();
    if (this.items.length && tail) {
      this.items[0] = tail;
      let index = 0;
      while (index < this.items.length) {
        const left = index * 2 + 1;
        const right = left + 1;
        let next = index;
        if (left < this.items.length && MinHeap.before(this.items[left], this.items[next])) next = left;
        if (right < this.items.length && MinHeap.before(this.items[right], this.items[next])) next = right;
        if (next === index) break;
        [this.items[index], this.items[next]] = [this.items[next], this.items[index]];
        index = next;
      }
    }
    return result;
  }

  get size() {
    return this.items.length;
  }
}

function yieldToBrowser(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

async function searchOrthogonal(a: Point, b: Point | Point[], preferredY: number, obstacles: Rectangle[], blocker: (a: Point, b: Point) => boolean, options: SearchOptions): Promise<Point[]> {
  throwIfAborted(options.signal);
  const targets = Array.isArray(b) ? b : [b];
  const { xs, ys } = routeGrid(a, b, preferredY, obstacles, options.signal, options);
  const maxGridCells = Math.max(1, numberValue(options.maxGridCells, MAX_GRID_CELLS));
  if (xs.length * ys.length > maxGridCells) throw new Error('route-grid-too-large');
  const startI = xs.indexOf(a.x);
  const startJ = ys.indexOf(a.y);
  const goals = targets.map((point) => ({ i: xs.indexOf(point.x), j: ys.indexOf(point.y) }));
  if ([startI, startJ, ...goals.flatMap((goal) => [goal.i, goal.j])].some((value) => value < 0)) {
    throw new Error('route-grid-endpoint-missing');
  }
  const goalCells = new Set(goals.map((goal) => goal.i * ys.length + goal.j));
  const heuristic: (x: number, y: number) => number = targets.length === 1
    ? (x, y) => Math.abs(x - targets[0].x) + Math.abs(y - targets[0].y)
    : (x, y) => {
      let distance = Infinity;
      for (const point of targets) distance = Math.min(distance, Math.abs(x - point.x) + Math.abs(y - point.y));
      return distance;
    };

  const maxStates = Math.max(1, numberValue(options.maxSearchStates, MAX_SEARCH_STATES));
  const yieldEvery = Math.max(0, Math.floor(numberValue(options.yieldEvery, YIELD_EVERY_STATES)));
  const yieldSliceMs = Math.max(0, numberValue(options.yieldSliceMs, YIELD_SLICE_MS));
  let lastYieldAt = Date.now();
  let expanded = 0;
  const columns = ys.length;
  const start = stateKey(startI, startJ, NONE_DIRECTION, columns);
  const distances = new Map([[start, 0]]);
  const previous = new Map();
  const queue = new MinHeap();
  queue.push({
    priority: heuristic(a.x, a.y),
    cost: 0,
    i: startI,
    j: startJ,
    direction: NONE_DIRECTION
  });
  let endState;
  while (queue.size) {
    throwIfAborted(options.signal);
    const current = queue.pop();
    const currentKey = stateKey(current.i, current.j, current.direction, columns);
    if (current.cost !== distances.get(currentKey)) continue;
    if (goals.length === 1
      ? current.i === goals[0].i && current.j === goals[0].j
      : goalCells.has(current.i * columns + current.j)) {
      endState = currentKey;
      break;
    }
    if (++expanded > maxStates) throw new Error('route-search-limit');
    if (yieldEvery && expanded % yieldEvery === 0) {
      const now = Date.now();
      if (now - lastYieldAt >= yieldSliceMs) {
        await yieldToBrowser();
        throwIfAborted(options.signal);
        lastYieldAt = Date.now();
      }
    }

    const here = { x: xs[current.i], y: ys[current.j] };
    for (const [di, dj, direction] of [[-1, 0, HORIZONTAL_DIRECTION], [1, 0, HORIZONTAL_DIRECTION], [0, -1, VERTICAL_DIRECTION], [0, 1, VERTICAL_DIRECTION]]) {
      const nextI = current.i + di;
      const nextJ = current.j + dj;
      if (nextI < 0 || nextI >= xs.length || nextJ < 0 || nextJ >= ys.length) continue;
      const next = { x: xs[nextI], y: ys[nextJ] };
      if (blocker(here, next)) continue;
      const length = Math.abs(here.x - next.x) + Math.abs(here.y - next.y);
      let cost = current.cost + length;
      if (current.direction !== NONE_DIRECTION && current.direction !== direction) cost += TURN_PENALTY;
      if (direction === HORIZONTAL_DIRECTION) {
        cost += length * Math.min(Math.abs(here.y - preferredY) / LANE_DEVIATION_STEP, MAX_LANE_DEVIATION_STEPS)
          * LANE_DEVIATION_PENALTY;
      }
      const nextKey = stateKey(nextI, nextJ, direction, columns);
      if (cost >= (distances.get(nextKey) ?? Infinity)) continue;
      distances.set(nextKey, cost);
      previous.set(nextKey, currentKey);
      queue.push({
        priority: cost + heuristic(next.x, next.y),
        cost,
        i: nextI,
        j: nextJ,
        direction
      });
    }
  }
  if (endState === undefined) throw new Error('route-not-found');

  const path = [];
  let current = endState;
  while (previous.has(current)) {
    const state = decodeState(current, columns);
    path.push({ x: xs[state.i], y: ys[state.j] });
    current = previous.get(current);
  }
  const result = simplify([a, ...path.reverse()]);
  if (result.length > MAX_ROUTE_WAYPOINTS) throw new Error('route-waypoint-limit');
  return result;
}

async function routeOrthogonal(a: Point, b: Point | Point[], preferredY: number, obstacles: Rectangle[], blocker: (a: Point, b: Point) => boolean, options: SearchOptions): Promise<Point[]> {
  for (let attempt = 0; attempt < ROUTE_SEARCH_ATTEMPTS; attempt++) {
    throwIfAborted(options.signal);
    const local = nearbyObstacles(a, b, preferredY, obstacles, ROUTE_SEARCH_MARGIN * 2 ** attempt);
    try {
      return await searchOrthogonal(a, b, preferredY, local, blocker, options);
    } catch (error) {
      if (error?.message !== 'route-not-found' || attempt === ROUTE_SEARCH_ATTEMPTS - 1) throw error;
    }
  }
  throw new Error('route-not-found');
}

function occupiedOverlapBlocked(a: Point, b: Point, layer: string, start: Point, end: Point | Point[], occupiedHorizontal: Tracks, occupiedVertical: Tracks): boolean {
  const endpoints = [start, ...(Array.isArray(end) ? end : [end])];
  if (Math.abs(a.y - b.y) <= EPSILON) {
    const left = Math.min(a.x, b.x);
    const right = Math.max(a.x, b.x);
    for (const other of occupiedHorizontal.get(formatNumber(a.y)) ?? []) {
      if (other.layer === layer) continue;
      const overlapLeft = Math.max(left, other.left);
      const overlapRight = Math.min(right, other.right);
      if (overlapRight <= overlapLeft + EPSILON) continue;
      const detail: OverlapDetail = {
        length: overlapRight - overlapLeft, axis: 'horizontal', coordinate: a.y,
        left: overlapLeft, right: overlapRight, otherStart: other.routeStart, otherEnd: other.routeEnd
      };
      if (!endpoints.some((endpoint) => isShortPortOverlap(detail, start, endpoint))) return true;
    }
  } else if (Math.abs(a.x - b.x) <= EPSILON) {
    const top = Math.min(a.y, b.y);
    const bottom = Math.max(a.y, b.y);
    for (const other of occupiedVertical.get(formatNumber(a.x)) ?? []) {
      if (other.layer === layer) continue;
      const overlapTop = Math.max(top, other.top);
      const overlapBottom = Math.min(bottom, other.bottom);
      if (overlapBottom <= overlapTop + EPSILON) continue;
      const detail: OverlapDetail = {
        length: overlapBottom - overlapTop, axis: 'vertical', coordinate: a.x,
        top: overlapTop, bottom: overlapBottom, otherStart: other.routeStart, otherEnd: other.routeEnd
      };
      if (!endpoints.some((endpoint) => isShortPortOverlap(detail, start, endpoint))) return true;
    }
  }
  return false;
}


function styleWithValues(style: string | null | undefined, updates: Record<string, string | number>, removals: string[] = []): string {
  const tokens = String(style ?? '').split(';').filter(Boolean);
  const removalSet = new Set(removals);
  const replaced = new Set();
  const output = [];
  for (const token of tokens) {
    const separator = token.indexOf('=');
    const key = separator < 0 ? token : token.slice(0, separator);
    if (removalSet.has(key)) continue;
    if (Object.prototype.hasOwnProperty.call(updates, key)) {
      if (!replaced.has(key)) output.push(`${key}=${updates[key]}`);
      replaced.add(key);
    } else {
      output.push(token);
    }
  }
  for (const [key, value] of Object.entries(updates)) {
    if (!replaced.has(key)) output.push(`${key}=${value}`);
  }
  return `${output.join(';')};`;
}

function writeWaypoints(document: Document, cell: Element, points: Point[], parentOrigin: Point = { x: 0, y: 0 }): boolean {
  const geometry = directGeometry(cell);
  if (!geometry) return false;
  for (const child of Array.from(geometry.children ?? [])) {
    if (tagName(child) === 'array' && child.getAttribute('as') === 'points') geometry.removeChild(child);
  }
  const array = document.createElement('Array');
  array.setAttribute('as', 'points');
  for (const point of points.slice(1, -1)) {
    const mxPoint = document.createElement('mxPoint');
    mxPoint.setAttribute('x', formatNumber(point.x - parentOrigin.x));
    mxPoint.setAttribute('y', formatNumber(point.y - parentOrigin.y));
    array.appendChild(mxPoint);
  }
  geometry.appendChild(array);
  return true;
}

function diagnosticEdge(record: CellRecord, layer: string, source: string, target: string): Omit<RoutingIssue, 'reason'> {
  return {
    id: record.id || `edge-${record.order}`,
    layer,
    source: source ?? record.cell.getAttribute('source') ?? '',
    target: target ?? record.cell.getAttribute('target') ?? ''
  };
}

function reserveRoute(points: Point[], layer: string, edgeId: string, horizontal: Tracks, vertical: Tracks) {
  const endpoints = { layer, edgeId, routeStart: points[0], routeEnd: points[points.length - 1] };
  for (const segment of horizontalSegments(points)) {
    const tracks = horizontal.get(segment.y) ?? [];
    tracks.push({ ...segment, ...endpoints });
    horizontal.set(segment.y, tracks);
  }
  for (const segment of verticalSegments(points)) {
    const tracks = vertical.get(segment.x) ?? [];
    tracks.push({ ...segment, ...endpoints });
    vertical.set(segment.x, tracks);
  }
}

function preserveManualRoute(member: RouteMember, color: string, horizontal: Tracks, vertical: Tracks) {
  const style = member.edge.cell.getAttribute('style') ?? '';
  const value = (name: string) => numberValue(style.match(new RegExp(`(?:^|;)${name}=([^;]+)`))?.[1], CENTER_FRACTION);
  const port = (rect: Rectangle, x: number, y: number): Point => {
    const dx = (x - CENTER_FRACTION) * rect.originalWidth;
    const dy = (y - CENTER_FRACTION) * rect.originalHeight;
    return {
      x: rect.originX + rect.originalWidth / 2 + dx * Math.cos(rect.radians) - dy * Math.sin(rect.radians),
      y: rect.originY + rect.originalHeight / 2 + dx * Math.sin(rect.radians) + dy * Math.cos(rect.radians)
    };
  };
  const points = Array.from(member.edge.cell.querySelectorAll('Array[as="points"] > mxPoint')).map((point) => ({
    x: Number(point.getAttribute('x')) + member.parentOrigin.x,
    y: Number(point.getAttribute('y')) + member.parentOrigin.y
  }));
  if (points.some((point) => !Number.isFinite(point.x) || !Number.isFinite(point.y))) {
    throw new Error('invalid-preserved-geometry');
  }
  reserveRoute([
    port(member.sourceRect, value('exitX'), value('exitY')),
    ...points,
    port(member.targetRect, value('entryX'), value('entryY'))
  ], member.layer, member.edge.id, horizontal, vertical);
  member.edge.cell.setAttribute('style', styleWithValues(style, { strokeColor: color }));
}

type RoutingContext = {
  obstacles: Rectangle[]; index: CellIndex; blocker: (a: Point, b: Point) => boolean;
  layerLaneIndexes: Map<string, number>; layerEntryXs: Map<string, number>;
  colorForLayer: (layer: string) => string; occupiedHorizontal: Tracks; occupiedVertical: Tracks;
  diagnostics: RoutingDiagnostics;
  fail: (record: CellRecord, reason: string, layer: string, source: string, target: string) => void;
};

export async function planMemberRoute(member: RouteMember, rank: number, count: number, context: RoutingContext, options: RoutingOptions): Promise<PlannedRoute | undefined> {
  const { obstacles, index, blocker, layerLaneIndexes, layerEntryXs, colorForLayer, occupiedHorizontal, occupiedVertical, diagnostics, fail } = context;
  const sourceRect = member.sourceRect;
  const sign = member.direction === 'north' ? -1 : 1;
  const fraction = (rank + 1) / (count + 1);
  const startX = Number(formatNumber(sourceRect.x + sourceRect.width * fraction));
  const initialStart = {
    x: startX,
    y: sign < 0 ? sourceRect.y : sourceRect.bottom
  };
  const memberObstacles = endpointOfficeAncestors(member.source, member.target, index, obstacles);
  const memberBlocker = memberObstacles === obstacles ? blocker : makeObstacleBlocker(memberObstacles, options);
  const target = targetPort(member.targetRect, sign, memberObstacles, false, fraction);
  const laneIndex = layerLaneIndexes.get(canonicalLayerId(member.layer)) ?? rank;
  const laneY = sign < 0
    ? sourceRect.y - ROUTE_LANE_OFFSET - laneIndex * ROUTE_LANE_PITCH
    : sourceRect.bottom + ROUTE_LANE_OFFSET + laneIndex * ROUTE_LANE_PITCH;
  const edgeId = member.edge.id || `edge-${member.edge.order}`;
  const color = colorForLayer(member.layer);
  const halfPitch = sourceRect.width / (count + 1) / 2;
  const starts = [initialStart,
    { x: Number(formatNumber(startX - halfPitch)), y: initialStart.y },
    { x: Number(formatNumber(startX + halfPitch)), y: initialStart.y },
    { x: startX, y: sign < 0 ? sourceRect.bottom : sourceRect.y },
    ...[sourceRect.x, sourceRect.right].map((x) => ({ x, y: Number(formatNumber(sourceRect.y + sourceRect.height * fraction)) }))
  ].filter((point, index, points) => !memberObstacles.some((obstacle) => pointInside(point, obstacle))
    && points.findIndex((candidate) => pointKey(candidate) === pointKey(point)) === index);
  if (!starts.length) {
    fail(member.edge, 'source-ports-blocked', member.layer, member.source.id, member.target.id);
    return undefined;
  }
  // Up to six distinct free source ports are tried.
  for (const [startAttempt, start] of starts.entries()) {
    try {
      const routeOptions: SearchOptions = {
        ...options,
        occupiedHorizontal: undefined,
        occupiedVertical: undefined,
        layer: member.layer
      };
      const targetRect = member.targetRect;
      const entryX = layerEntryXs.get(canonicalLayerId(member.layer)) ?? CENTER_FRACTION;
      const candidatePorts = [
        target,
        targetPort(targetRect, sign, memberObstacles, true, fraction),
        targetPort(targetRect, sign, memberObstacles, false, entryX),
        ...ALTERNATE_PORT_FRACTIONS.map((portX) => targetPort(targetRect, sign, memberObstacles, false, portX)),
        targetSidePort(targetRect, 'left', entryX, memberObstacles),
        targetSidePort(targetRect, 'right', entryX, memberObstacles),
        ...ALTERNATE_PORT_FRACTIONS.flatMap((entryY) => [
          targetSidePort(targetRect, 'left', entryY, memberObstacles),
          targetSidePort(targetRect, 'right', entryY, memberObstacles)
        ])
      ].filter((port): port is Port => Boolean(port));
      if (!candidatePorts.length) throw new Error('target-ports-blocked');
      const seenPorts = new Set<string>();
      const uniquePorts = candidatePorts.filter((port) => {
        const key = pointKey(port.point);
        if (seenPorts.has(key)) return false;
        seenPorts.add(key);
        return true;
      });
      const makeRouteBlocker = (ports: Port[]) => (a: Point, b: Point) => memberBlocker(a, b)
      || occupiedOverlapBlocked(a, b, member.layer, start,
        ports.map((port) => port.point), occupiedHorizontal, occupiedVertical);
      let points: Point[];
      let selectedPort: Port | undefined;
      let needsOccupancySearch = !target;
      if (target) {
        try {
          points = await routeOrthogonal(start, target.point, laneY, memberObstacles,
            memberBlocker, routeOptions);
          selectedPort = target;
          needsOccupancySearch = Boolean(firstNonPortOverlap(points, member.layer,
            occupiedHorizontal, occupiedVertical, start));
          if (needsOccupancySearch) {
            points = nudgeInterior(points, member.layer, occupiedHorizontal,
              occupiedVertical, memberObstacles, options.signal);
            needsOccupancySearch = Boolean(firstNonPortOverlap(points, member.layer,
              occupiedHorizontal, occupiedVertical, start));
          }
        } catch (error) {
          if (error?.name === 'AbortError' || error?.message !== 'route-not-found') throw error;
          needsOccupancySearch = true;
        }
      }
      if (needsOccupancySearch) {
        const verticalPorts = uniquePorts.filter((port) => port.point.x > targetRect.x + EPSILON
        && port.point.x < targetRect.right - EPSILON);
        const sidePorts = uniquePorts.filter((port) => !verticalPorts.includes(port));
        const occupancyOptions: SearchOptions = {
          ...routeOptions,
          occupiedHorizontal,
          occupiedVertical
        };
        const searchPorts = async(ports: Port[]): Promise<{ routed: Point[]; port: Port | undefined }> => {
          const routed = await routeOrthogonal(start, ports.map((port) => port.point), laneY,
            memberObstacles, makeRouteBlocker(ports), occupancyOptions);
          return { routed, port: ports.find((port) => pointKey(port.point) === pointKey(routed.at(-1))) };
        };
        if (verticalPorts.length) {
          try {
            ({ routed: points, port: selectedPort } = await searchPorts(verticalPorts));
          } catch (error) {
            if (error?.name === 'AbortError'
              || !['route-not-found', 'route-search-limit'].includes(error?.message)
              || !sidePorts.length) throw error;
            ({ routed: points, port: selectedPort } = await searchPorts(sidePorts));
          }
        } else if (sidePorts.length) {
          ({ routed: points, port: selectedPort } = await searchPorts(sidePorts));
        } else {
          throw new Error('target-ports-blocked');
        }
      }
      if (!selectedPort) throw new Error('route-target-missing');
      const overlapDetail = firstNonPortOverlap(points, member.layer, occupiedHorizontal, occupiedVertical, start);
      if (overlapDetail) {
        throw new Error(`route-layer-overlap-over-port-limit:${JSON.stringify({
          ...overlapDetail,
          maxEndpointOverlap: MAX_PORT_SHARED_OVERLAP
        })}`);
      }
      const collisions = [];
      for (const [obstacleIndex, obstacle] of memberObstacles.entries()) {
        if (obstacleIndex % ABORT_CHECK_EVERY === 0) throwIfAborted(options.signal);
        if (points.slice(1).some((point, index) => segmentHitsRect(points[index], point, obstacle))) {
          collisions.push(obstacle.id);
        }
      }
      if (collisions.length) throw new Error('route-obstacle-collision');
      const exit = connectionFractions(sourceRect, start);
      const entry = connectionFractions(targetRect, selectedPort.point);
      const route: PlannedRoute = { ...member, points, laneY, color, edgeId, exitX: exit.x, exitY: exit.y, entryX: entry.x, entryY: entry.y };
      reserveRoute(points, member.layer, edgeId, occupiedHorizontal, occupiedVertical);
      diagnostics.routedEdges++;
      diagnostics.routes.push({
        ...diagnosticEdge(member.edge, member.layer, member.source.id, member.target.id),
        direction: member.direction,
        laneY,
        points: points.length,
        color
      });
      return route;
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      if (error?.message === 'route-not-found' && startAttempt < starts.length - 1) continue;
      fail(member.edge, error instanceof Error ? error.message : String(error), member.layer, member.source.id, member.target.id);
      return undefined;
    }
  }
}

/** Routes logical edges around objects, preferring horizontal corridors near their source. */
export async function routeCorridorPage(pageXml: string, options: RoutingOptions = {}): Promise<{ xml: string; diagnostics: RoutingDiagnostics }> {
  throwIfAborted(options.signal);
  await yieldToBrowser();
  throwIfAborted(options.signal);
  const document = parseDiagramDocument(pageXml);
  const root = graphRoot(document);
  const index = buildIndex(root, options.signal);
  const rectCache = new Map<CellRecord, Rectangle>();
  const semanticRecords = index.records.filter(semanticVertex);
  const rectangles = semanticRecords
    .map((record) => ({ record, rect: absoluteRect(record, index, rectCache) }))
    .filter(({ rect }) => rect && rect.width > 0 && rect.height > 0);
  const endpointRecords = index.records
    .filter(endpointVertex)
    .map((record) => ({ record, rect: absoluteRect(record, index, rectCache) }))
    .filter(({ rect }) => rect && rect.width > 0 && rect.height > 0);
  const nodesByRecord = new Map(endpointRecords.map(({ record }) => [record, record]));
  const obstacles = rectangles.map(({ record, rect }) => ({ ...rect, id: record.id }));
  const blocker = makeObstacleBlocker(obstacles, options);
  const edges = index.records.filter(logicalEdge);
  const diagnostics: RoutingDiagnostics = {
    totalLogicalEdges: edges.length,
    routedEdges: 0,
    preservedEdges: 0,
    skippedEdges: 0,
    failedEdges: 0,
    groups: 0,
    semanticVertices: obstacles.length,
    routes: [],
    skipped: [],
    failed: []
  };
  const layers = new Set<string>();
  for (const edge of edges) {
    const parent = edge.cell.getAttribute('parent') || '';
    if (!parent) continue;
    const layer = index.aliases.get(parent)?.id || parent;
    layers.add(layer);
  }
  const fallbackColors = layerColorMap(layers);
  const layerEntryXs = new Map([...fallbackColors.keys()].map((layer, index) => [layer, (index + 1) / (fallbackColors.size + 1)]));
  const layerLaneIndexes = new Map([...fallbackColors.keys()].map((layer, index) => [canonicalLayerId(layer), index]));
  const layerColors = options.layerColors ?? fallbackColors;
  const colorForLayer = (layer: string): string => layerColors.get(canonicalLayerId(layer)) ?? fallbackColors.get(canonicalLayerId(layer));

  const groups = new Map<string, RouteMember[]>();
  const planned: PlannedRoute[] = [];
  const occupiedHorizontal: Tracks = new Map();
  const occupiedVertical: Tracks = new Map();
  const skip = (record: CellRecord, reason: string, layer: string, source: string, target: string) => {
    diagnostics.skippedEdges++;
    diagnostics.skipped.push({ ...diagnosticEdge(record, layer, source, target), reason });
  };
  const fail = (record: CellRecord, reason: string, layer: string, source: string, target: string) => {
    diagnostics.failedEdges++;
    diagnostics.failed.push({ ...diagnosticEdge(record, layer, source, target), reason });
  };

  for (const [edgeIndex, edge] of edges.entries()) {
    if (edgeIndex % ABORT_CHECK_EVERY === 0) throwIfAborted(options.signal);
    const rawLayer = edge.cell.getAttribute('parent') || '';
    const layer = index.aliases.get(rawLayer)?.id || rawLayer;
    const sourceId = edge.cell.getAttribute('source') || '';
    const targetId = edge.cell.getAttribute('target') || '';
    if (!rawLayer || !sourceId || !targetId) {
      skip(edge, 'missing-layer-or-endpoint', layer, sourceId, targetId);
      continue;
    }
    const source = index.aliases.get(sourceId);
    const target = index.aliases.get(targetId);
    if (!source || !target || !nodesByRecord.has(source) || !nodesByRecord.has(target)) {
      skip(edge, 'unsupported-or-missing-endpoint', layer, sourceId, targetId);
      continue;
    }
    if (source === target) {
      skip(edge, 'self-link', layer, sourceId, targetId);
      continue;
    }
    if (!directGeometry(edge.cell)) {
      skip(edge, 'missing-edge-geometry', layer, sourceId, targetId);
      continue;
    }
    const sourceRect = rectCache.get(source) || absoluteRect(source, index, rectCache);
    const targetRect = rectCache.get(target) || absoluteRect(target, index, rectCache);
    if (!sourceRect || !targetRect) {
      skip(edge, 'invalid-endpoint-geometry', layer, sourceId, targetId);
      continue;
    }
    const targetCenterY = targetRect.y + targetRect.height / 2;
    const sourceCenterY = sourceRect.y + sourceRect.height / 2;
    const direction = targetCenterY < sourceCenterY ? 'north' : 'south';
    const groupKey = `${source.id}\u0000${direction}`;
    const parentRect = absoluteRect(index.aliases.get(rawLayer), index, rectCache);
    const members = groups.get(groupKey) ?? [];
    const member: RouteMember = {
      edge, layer, source, target, sourceRect, targetRect, direction, edgeIndex,
      parentOrigin: parentRect ? { x: parentRect.originX, y: parentRect.originY } : { x: 0, y: 0 }
    };
    if (options.preservedEdges?.has(edge.id)) {
      try {
        preserveManualRoute(member, colorForLayer(layer), occupiedHorizontal, occupiedVertical);
        diagnostics.preservedEdges++;
      } catch (error) {
        fail(edge, error.message, layer, sourceId, targetId);
      }
      continue;
    }
    members.push(member);
    groups.set(groupKey, members);
    if (edgeIndex && edgeIndex % YIELD_EVERY_EDGES === 0) {
      await yieldToBrowser();
      throwIfAborted(options.signal);
    }
  }

  diagnostics.groups = groups.size;
  const context: RoutingContext = { obstacles, index, blocker, layerLaneIndexes, layerEntryXs, colorForLayer, occupiedHorizontal, occupiedVertical, diagnostics, fail };
  let lastYieldAt = Date.now();
  for (const members of groups.values()) {
    throwIfAborted(options.signal);
    members.sort((left, right) => left.targetRect.x - right.targetRect.x
      || left.targetRect.y - right.targetRect.y
      || left.layer.localeCompare(right.layer)
      || String(left.edge.id || '').localeCompare(String(right.edge.id || '')));
    for (let rank = 0; rank < members.length; rank++) {
      const route = await planMemberRoute(members[rank], rank, members.length, context, options);
      if (route) planned.push(route);
      if (Date.now() - lastYieldAt >= YIELD_SLICE_MS) {
        await yieldToBrowser();
        throwIfAborted(options.signal);
        lastYieldAt = Date.now();
      }
    }
  }

  throwIfAborted(options.signal);
  for (const route of planned) {
    const style = styleWithValues(route.edge.cell.getAttribute('style') ?? '', {
      edgeStyle: 'none',
      curved: '0',
      rounded: '0',
      jettySize: '0',
      noEdgeStyle: '1',
      strokeColor: route.color,
      dashed: '0',
      strokeWidth: '1.8',
      exitX: String(route.exitX),
      exitY: String(route.exitY),
      entryX: String(route.entryX),
      entryY: String(route.entryY),
      exitPerimeter: '0',
      entryPerimeter: '0'
    }, ['dashPattern', 'fixDash']);
    route.edge.cell.setAttribute('style', style);
    writeWaypoints(document, route.edge.cell, route.points, route.parentOrigin);
  }

  return { xml: new XMLSerializer().serializeToString(document), diagnostics };
}
