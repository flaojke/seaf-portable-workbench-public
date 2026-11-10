/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';

import { createLayerColorMap, routeCorridorPage, splitDiagramPages } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
import { edgeWaypoints, isOrthogonal, parseXml, required, styleValue, type Point } from './routing-test-helpers';

interface DiagramLike { rewriteIds(node: Element, ids: Record<string, string>): void }
interface DiagramConstructor { new(options: object, state: object): DiagramLike }
interface Rect extends Point { width: number; height: number; id?: string }
interface SemanticRect extends Rect { id: string }
let Diagram: DiagramConstructor;


function directChild(node: Element | null, tagName: string, as: string | null = null): Element | null {
  return Array.from<Element>(node?.children ?? []).find((child) => (
    child.tagName === tagName && (as === null || child.getAttribute('as') === as)
  ));
}

function graphRoot(document: Document): Element {
  const root = document.querySelector('mxGraphModel > root');
  if (!root) throw new Error('Draw.io XML does not contain graph root');
  return root;
}

function innerCell(wrapper: Element | null): Element | null {
  return directChild(wrapper, 'mxCell') ?? (wrapper?.tagName === 'mxCell' ? wrapper : null);
}

function wrapperById(document: Document, id: string): Element | undefined {
  return Array.from<Element>(graphRoot(document).children).find((node) => node.getAttribute('id') === id);
}

function edgeWrappers(document: Document, layerId: string | null = null): Element[] {
  return Array.from<Element>(graphRoot(document).children).filter((wrapper) => {
    const cell = innerCell(wrapper);
    return cell?.getAttribute('edge') === '1'
      && (layerId === null || cell.getAttribute('parent') === layerId);
  });
}

function waypoints(wrapper: Element): Point[] {
  return edgeWaypoints(wrapper);
}

function routeMap(xml: string, layerId: string | null = null): Map<string | null, Point[]> {
  const document = parseXml(xml);
  return new Map(edgeWrappers(document, layerId).map((wrapper) => [
    wrapper.getAttribute('id'),
    waypoints(wrapper)
  ]));
}

function attributeSnapshot(document: Document, ids: string[]): Array<{ id: string; wrapper: Record<string, string>; cell: Record<string, string>; geometry: Record<string, string> }> {
  return ids.map((id) => {
    const wrapper = wrapperById(document, id);
    const cell = innerCell(wrapper);
    const geometry = directChild(cell, 'mxGeometry');
    return {
      id,
      wrapper: Object.fromEntries(Array.from<Attr>(wrapper?.attributes ?? []).map((attr) => [attr.name, attr.value])),
      cell: Object.fromEntries(Array.from<Attr>(cell?.attributes ?? []).map((attr) => [attr.name, attr.value])),
      geometry: Object.fromEntries(Array.from<Attr>(geometry?.attributes ?? []).map((attr) => [attr.name, attr.value]))
    };
  });
}


function diagnosticsCount(diagnostics: unknown, names: string[], seen = new Set<object>()): number {
  if (!diagnostics || typeof diagnostics !== 'object' || seen.has(diagnostics)) return 0;
  seen.add(diagnostics);
  for (const [name, value] of Object.entries(diagnostics)) {
    if (names.includes(name) && (Array.isArray(value) || Number.isFinite(value))) {
      return Array.isArray(value) ? value.length : value;
    }
    const nested = diagnosticsCount(value, names, seen);
    if (nested > 0) return nested;
  }
  return 0;
}

function diagnosticsSummary(diagnostics: unknown): { skipped: number; failures: number; skippedDetails: unknown[]; failureDetails: unknown[] } {
  const details = diagnostics && typeof diagnostics === 'object'
    ? diagnostics as { skipped?: unknown; failed?: unknown }
    : {};
  const skippedDetails: unknown[] = Array.isArray(details.skipped) ? details.skipped : [];
  const failureDetails: unknown[] = Array.isArray(details.failed) ? details.failed : [];
  return {
    skipped: diagnosticsCount(diagnostics, ['skipped', 'skippedEdges', 'skippedEdgeIds']),
    failures: diagnosticsCount(diagnostics, ['failures', 'failed', 'failedEdges', 'failureIds']),
    skippedDetails,
    failureDetails
  };
}

function edgeXml({ id, source, target, parent = 'layer.logical.a', label = id, style = '' }: { id: string; source?: string; target: string; parent?: string; label?: string; style?: string }): string {
  return `<object id="${id}" label="${label}" __id__="metadata.${id}" schema="seaf.company.ta.services.logical_links" data-owner="keep"><mxCell id="${id}.cell" edge="1" parent="${parent}" source="${source}" target="${target}" style="${style}"><mxGeometry relative="1" as="geometry" /></mxCell></object>`;
}

function vertexXml({ id, x, y, width = 40, height = 40, parent = 'group', label = id, extra = '' }: { id: string; x: number | string; y: number | string; width?: number; height?: number; parent?: string; label?: string; extra?: string }): string {
  return `<object id="${id}" label="${label}" __id__="entity.${id}" schema="seaf.company.ta.components.synthetic" data-owner="keep" ${extra}><mxCell id="${id}.cell" vertex="1" parent="${parent}"><mxGeometry x="${x}" y="${y}" width="${width}" height="${height}" as="geometry" /></mxCell></object>`;
}

function syntheticPage(): string {
  const targets = Array.from({ length: 15 }, (_, index) => vertexXml({
    id: `target.${index + 1}`,
    x: 540,
    y: 24 + index * 44,
    label: `Target ${index + 1}`
  })).join('');
  const links = Array.from({ length: 15 }, (_, index) => edgeXml({
    id: `edge.a.${index + 1}`,
    source: 'source',
    target: `target.${index + 1}`,
    style: 'edgeStyle=orthogonalEdgeStyle;startArrow=classic;endArrow=block;strokeColor=#66B2FF;'
  })).join('');

  return `<mxfile host="test"><diagram id="corridor" name="Corridor"><mxGraphModel><root>
    <mxCell id="0" />
    <mxCell id="1" parent="0" />
    <mxCell id="layer.logical.a" value="Layer A" parent="1" />
    <mxCell id="layer.logical.b" value="Layer B" parent="1" />
    <mxCell id="group" value="Nested group" vertex="1" parent="1"><mxGeometry x="20" y="20" width="760" height="800" as="geometry" /></mxCell>
    ${vertexXml({ id: 'source', x: 20, y: 250, parent: 'group', label: 'Source', extra: 'data-source="preserve"' })}
    ${targets}
    ${vertexXml({ id: 'obstacle', x: 300, y: 250, width: 100, height: 80, parent: 'group', label: 'Obstacle' })}
    ${vertexXml({ id: 'semantic.bar', x: 520, y: 746, width: 100, height: 10, parent: 'group', label: 'Target top port blocker' })}
    ${vertexXml({ id: 'target.b', x: 540, y: 750, parent: 'group', label: 'Layer B target' })}
    ${links}
    ${edgeXml({ id: 'edge.b.1', source: 'source', target: 'target.b', parent: 'layer.logical.b', style: 'edgeStyle=orthogonalEdgeStyle;startArrow=none;endArrow=block;' })}
    ${edgeXml({ id: 'edge.missing', target: 'target.1', style: 'edgeStyle=orthogonalEdgeStyle;startArrow=none;endArrow=block;' })}
    <object id="edge.malformed" label="Malformed" schema="seaf.company.ta.services.logical_links"><mxCell id="edge.malformed.cell" edge="1" parent="layer.logical.a" source="source" target="bad.target" style="startArrow=none;endArrow=block;"><mxGeometry relative="1" as="geometry"><Array as="points"><mxPoint x="not-a-number" y="20" /></Array></mxGeometry></mxCell></object>
    ${vertexXml({ id: 'bad.target', x: 'not-a-number', y: 400, parent: 'group', label: 'Bad target' })}
  </root></mxGraphModel></diagram></mxfile>`;
}

function withoutLayerB(xml: string): string {
  const document = parseXml(xml);
  for (const wrapper of edgeWrappers(document, 'layer.logical.b')) wrapper.remove();
  return new XMLSerializer().serializeToString(document);
}

const COLLISION_EPSILON = 1e-5;

function segmentCrossesRect(a: Point, b: Point, rect: Rect): boolean {
  if (Math.abs(a.x - b.x) <= COLLISION_EPSILON) {
    return a.x > rect.x + COLLISION_EPSILON && a.x < rect.x + rect.width - COLLISION_EPSILON
      && Math.max(Math.min(a.y, b.y), rect.y) < Math.min(Math.max(a.y, b.y), rect.y + rect.height) - COLLISION_EPSILON;
  }
  if (Math.abs(a.y - b.y) <= COLLISION_EPSILON) {
    return a.y > rect.y + COLLISION_EPSILON && a.y < rect.y + rect.height - COLLISION_EPSILON
      && Math.max(Math.min(a.x, b.x), rect.x) < Math.min(Math.max(a.x, b.x), rect.x + rect.width) - COLLISION_EPSILON;
  }
  return true;
}

function vertexRect(document: Document, id: string | null, seen = new Set<string>()): Rect | null {
  if (!id || seen.has(id)) return null;
  seen.add(id);
  const wrapper = wrapperById(document, id);
  const cell = innerCell(wrapper);
  const geometry = directChild(cell, 'mxGeometry');
  if (!geometry || cell.getAttribute('vertex') !== '1') return null;
  const x = Number(geometry.getAttribute('x'));
  const y = Number(geometry.getAttribute('y'));
  const width = Number(geometry.getAttribute('width'));
  const height = Number(geometry.getAttribute('height'));
  if (![x, y, width, height].every(Number.isFinite)) return null;
  const parent = cell.getAttribute('parent');
  const parentRect = parent && !['0', '1'].includes(parent) ? vertexRect(document, parent, seen) : null;
  return {
    x: x + (parentRect?.x ?? 0),
    y: y + (parentRect?.y ?? 0),
    width,
    height
  };
}

function routedPath(document: Document, wrapper: Element): Point[] {
  const cell = innerCell(wrapper);
  const source = vertexRect(document, cell.getAttribute('source'));
  const target = vertexRect(document, cell.getAttribute('target'));
  if (!source || !target) return [];
  const style = cell.getAttribute('style') ?? '';
  const exitX = Number(styleValue(style, 'exitX'));
  const exitY = Number(styleValue(style, 'exitY'));
  const entryX = Number(styleValue(style, 'entryX'));
  const entryY = Number(styleValue(style, 'entryY'));
  const start = {
    x: source.x + (Number.isFinite(exitX) ? exitX : 0.5) * source.width,
    y: source.y + (Number.isFinite(exitY) ? exitY : 0.5) * source.height
  };
  const end = {
    x: target.x + (Number.isFinite(entryX) ? entryX : 0.5) * target.width,
    y: target.y + (Number.isFinite(entryY) ? entryY : 0.5) * target.height
  };
  return [start, ...waypoints(wrapper), end];
}

function longHorizontalOverlap(first: Point[], second: Point[]): boolean {
  const horizontals = (path: Point[]) => path.slice(1).flatMap((point, index) => {
    const previous = path[index];
    return point.y === previous.y
      ? [{ y: point.y, left: Math.min(point.x, previous.x), right: Math.max(point.x, previous.x) }]
      : [];
  });
  return horizontals(first).some((left) => horizontals(second).some((right) =>
    left.y === right.y && Math.min(left.right, right.right) - Math.max(left.left, right.left) > 20));
}

function longVerticalOverlap(first: Point[], second: Point[]): boolean {
  const verticals = (path: Point[]) => path.slice(1).flatMap((point, index) => {
    const previous = path[index];
    return point.x === previous.x
      ? [{ x: point.x, top: Math.min(point.y, previous.y), bottom: Math.max(point.y, previous.y) }]
      : [];
  });
  return verticals(first).some((left) => verticals(second).some((right) =>
    left.x === right.x && Math.min(left.bottom, right.bottom) - Math.max(left.top, right.top) > 20));
}

function semanticRectangles(document: Document): SemanticRect[] {
  return Array.from<Element>(graphRoot(document).children)
    .filter((wrapper) => wrapper.tagName === 'object' && innerCell(wrapper)?.getAttribute('vertex') === '1')
    .filter((wrapper) => {
      const entity = wrapper.getAttribute('schema') || wrapper.getAttribute('schema') || wrapper.getAttribute('common_schema');
      return entity && !entity.endsWith('.dcs') && !entity.endsWith('.network_segments')
        && wrapper.getAttribute('common_network_segment') !== 'true';
    })
    .map((wrapper) => {
      const rect = vertexRect(document, wrapper.getAttribute('id'));
      const id = wrapper.getAttribute('id');
      return rect && id ? { ...rect, id } : null;
    })
    .filter((rect): rect is SemanticRect => rect !== null && rect.width > 0 && rect.height > 0);
}

function pathCollisions(path: Point[], obstacles: Rect[]): string[] {
  return obstacles.flatMap((obstacle) => path.slice(1).some((point, index) => (
    segmentCrossesRect(path[index], point, obstacle)
  )) ? [obstacle.id] : []);
}

describe('routeCorridorPage', () => {
  beforeAll(async() => {
    const noop = (): undefined => undefined;
    (global as typeof global & { DocHub: object }).DocHub = {
      documents: {
        getLoggerWithTag: (): { debug: typeof noop; info: typeof noop; warn: typeof noop; error: typeof noop } => ({
          debug: noop, info: noop, warn: noop, error: noop
        })
      }
    };
    Diagram = jest.requireActual<{ default: DiagramConstructor }>('../../plugins/seaf2drawiojs/lib/diagram').default;
  });

  it('routes around a schema-only semantic vertex after common-page cloning', async() => {
    const input = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="layer.logical.a" parent="1"/>
      ${vertexXml({ id: 'source', x: 20, y: 100, parent: '1' })}
      ${vertexXml({ id: 'target', x: 400, y: 100, parent: '1' })}
      <object id="blocker" label="Schema-only obstacle" schema="seaf.company.ta.components.synthetic"><mxCell id="blocker.cell" vertex="1" parent="1"><mxGeometry x="140" y="70" width="120" height="120" as="geometry"/></mxCell></object>
      ${edgeXml({ id: 'edge.common', source: 'source', target: 'target' })}
    </root></mxGraphModel></diagram></mxfile>`;
    const document = parseXml(input);
    const root = graphRoot(document);
    const diagram = new Diagram({}, {});
    const blocker = wrapperById(document, 'blocker').cloneNode(true) as Element;
    diagram.rewriteIds(blocker, { blocker: 'common_0_blocker', 'blocker.cell': 'common_0_blocker.cell' });
    const connection = required(parseXml('<mxfile><diagram><mxGraphModel><root><object id="connection" schema="seaf.company.ta.services.network_links"><mxCell id="connection.cell" edge="1" /></object></root></mxGraphModel></diagram></mxfile>')
      .querySelector('object'));
    diagram.rewriteIds(connection, { connection: 'common_0_connection', 'connection.cell': 'common_0_connection.cell' });
    wrapperById(document, 'blocker').remove();
    root.appendChild(blocker);

    const result = await routeCorridorPage(new XMLSerializer().serializeToString(document));
    const output = parseXml(result.xml);
    const obstacle = vertexRect(output, 'common_0_blocker');
    const path = routedPath(output, wrapperById(output, 'edge.common'));

    expect(blocker.hasAttribute('schema')).toBe(false);
    expect(blocker.getAttribute('common_schema')).toBe('seaf.company.ta.components.synthetic');
    expect(connection.hasAttribute('common_schema')).toBe(false);
    expect(result.diagnostics.semanticVertices).toBe(3);
    expect(pathCollisions(path, [{ id: 'common_0_blocker', ...obstacle }])).toEqual([]);
  });

  it('routes out of nested datacenter containers while keeping offices as obstacles', async() => {
    const input = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="layer.logical.a" parent="1"/>
      <object id="region" schema="seaf.company.ta.services.dc_regions"><mxCell id="region.cell" vertex="1" parent="1"><mxGeometry x="0" y="0" width="260" height="200" as="geometry"/></mxCell></object>
      <object id="az" schema="seaf.company.ta.services.dc_azs"><mxCell id="az.cell" vertex="1" parent="region"><mxGeometry x="10" y="10" width="220" height="160" as="geometry"/></mxCell></object>
      <object id="dc" schema="seaf.company.ta.services.dcs"><mxCell id="dc.cell" vertex="1" parent="az"><mxGeometry x="10" y="10" width="90" height="100" as="geometry"/></mxCell></object>
      <object id="source" schema="seaf.company.ta.services.kbs"><mxCell id="source.cell" vertex="1" parent="dc"><mxGeometry x="10" y="30" width="40" height="40" as="geometry"/></mxCell></object>
      <object id="office" schema="seaf.company.ta.services.dc_offices"><mxCell id="office.cell" vertex="1" parent="az"><mxGeometry x="130" y="40" width="50" height="50" as="geometry"/></mxCell></object>
      ${vertexXml({ id: 'target', x: 400, y: 50, parent: '1' })}
      ${edgeXml({ id: 'edge.nested', source: 'source', target: 'target' })}
    </root></mxGraphModel></diagram></mxfile>`;

    const result = await routeCorridorPage(input);
    const output = parseXml(result.xml);
    const path = routedPath(output, wrapperById(output, 'edge.nested'));
    const office = vertexRect(output, 'office');

    expect(result.diagnostics.failedEdges).toBe(0);
    expect(result.diagnostics.semanticVertices).toBe(3);
    expect(pathCollisions(path, [{ id: 'office', ...office }])).toEqual([]);
  });

  it('routes out of a source nested in an office while keeping a sibling office blocked', async() => {
    const input = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/><mxCell id="layer.logical.a" parent="1"/>
      <object id="region" schema="seaf.company.ta.services.dc_regions"><mxCell id="region.cell" vertex="1" parent="1"><mxGeometry x="0" y="0" width="360" height="240" as="geometry"/></mxCell></object>
      <object id="source.office" schema="seaf.company.ta.services.dc_offices"><mxCell id="source.office.cell" vertex="1" parent="region"><mxGeometry x="20" y="40" width="120" height="130" as="geometry"/></mxCell></object>
      <object id="source" schema="seaf.company.ta.services.kbs"><mxCell id="source.cell" vertex="1" parent="source.office"><mxGeometry x="20" y="20" width="40" height="40" as="geometry"/></mxCell></object>
      <object id="sibling.office" schema="seaf.company.ta.services.dc_offices"><mxCell id="sibling.office.cell" vertex="1" parent="region"><mxGeometry x="190" y="35" width="120" height="150" as="geometry"/></mxCell></object>
      ${vertexXml({ id: 'target', x: 430, y: 60, parent: '1' })}
      ${edgeXml({ id: 'edge.office-nested', source: 'source', target: 'target' })}
    </root></mxGraphModel></diagram></mxfile>`;

    const result = await routeCorridorPage(input);
    const output = parseXml(result.xml);
    const path = routedPath(output, wrapperById(output, 'edge.office-nested'));
    const siblingOffice = vertexRect(output, 'sibling.office');

    expect(result.diagnostics.routedEdges).toBe(1);
    expect(result.diagnostics.failedEdges).toBe(0);
    expect(pathCollisions(path, [{ id: 'sibling.office', ...siblingOffice }])).toEqual([]);
  });

  it('routes a deterministic 15-edge source corridor per layer around obstacles', async() => {
    const input = syntheticPage();
    const first = await routeCorridorPage(input);
    const second = await routeCorridorPage(input);
    const repeated = await routeCorridorPage(first.xml);

    expect(first).toEqual(expect.objectContaining({ xml: expect.any(String), diagnostics: expect.anything() }));
    expect(second.xml).toBe(first.xml);
    expect(repeated.xml).toBe(first.xml);

    const output = parseXml(first.xml);
    const routed = edgeWrappers(output, 'layer.logical.a').filter((wrapper) => /^edge\.a\./.test(wrapper.getAttribute('id')));
    expect(routed).toHaveLength(15);
    expect(new Set(routed.map((wrapper) => JSON.stringify(waypoints(wrapper)))).size).toBeGreaterThan(1);
    expect(routed.every((wrapper) => waypoints(wrapper).length > 0)).toBe(true);
    expect(routed.every((wrapper) => isOrthogonal(waypoints(wrapper)))).toBe(true);

    const obstacle = { x: 320, y: 270, width: 100, height: 80 };
    expect(routed.every((wrapper) => {
      const points = waypoints(wrapper);
      return points.slice(1).every((point, index) => !segmentCrossesRect(points[index], point, obstacle));
    })).toBe(true);
    expect(routed.some((wrapper) => waypoints(wrapper).length >= 2)).toBe(true);
  });

  it('preserves connected edge identity, metadata, vertices, nested coordinates and arrows', async() => {
    const input = syntheticPage();
    const before = parseXml(input);
    const result = await routeCorridorPage(input);
    const after = parseXml(result.xml);
    const preservedIds = ['source', 'target.1', 'target.15', 'obstacle', 'group', 'target.b', 'bad.target'];

    expect(attributeSnapshot(after, preservedIds)).toEqual(attributeSnapshot(before, preservedIds));
    expect(edgeWrappers(after)).toHaveLength(edgeWrappers(before).length);
    expect(Array.from(graphRoot(after).querySelectorAll('mxCell[edge="1"]')).filter((cell) => cell.id.includes(':')).length).toBe(0);

    for (const id of ['edge.a.1', 'edge.b.1']) {
      const beforeCell = innerCell(wrapperById(before, id));
      const afterCell = innerCell(wrapperById(after, id));
      expect(afterCell.getAttribute('source')).toBe(beforeCell.getAttribute('source'));
      expect(afterCell.getAttribute('target')).toBe(beforeCell.getAttribute('target'));
      expect(afterCell.getAttribute('parent')).toBe(beforeCell.getAttribute('parent'));
      expect(styleValue(afterCell.getAttribute('style'), 'startArrow')).toBe(styleValue(beforeCell.getAttribute('style'), 'startArrow'));
      expect(styleValue(afterCell.getAttribute('style'), 'endArrow')).toBe(styleValue(beforeCell.getAttribute('style'), 'endArrow'));
      expect(wrapperById(after, id).getAttribute('__id__')).toBe(`metadata.${id}`);
    }
  });

  it('shares same-source corridor lanes across layers without merging their routes', async() => {
    const input = syntheticPage();
    const both = await routeCorridorPage(input);
    const onlyA = await routeCorridorPage(withoutLayerB(input));
    const bothPaths = routeMap(both.xml, 'layer.logical.a');
    const onlyAPaths = routeMap(onlyA.xml, 'layer.logical.a');

    expect([...bothPaths.keys()]).toEqual([...onlyAPaths.keys()]);
    expect([...bothPaths].some(([id, points]) => JSON.stringify(points) !== JSON.stringify(onlyAPaths.get(id)))).toBe(true);

    const document = parseXml(both.xml);
    const layerAColors = new Set(edgeWrappers(document, 'layer.logical.a')
      .filter((wrapper) => /^edge\.a\./.test(wrapper.getAttribute('id')))
      .map((wrapper) => styleValue(innerCell(wrapper).getAttribute('style'), 'strokeColor')));
    const layerBColor = styleValue(innerCell(wrapperById(document, 'edge.b.1')).getAttribute('style'), 'strokeColor');
    expect([...layerAColors]).toEqual(['#0057B8']);
    expect(layerBColor).toBe('#D14900');
  });

  it('assigns different colors to 50 logical layers on one page', () => {
    const document = parseXml(syntheticPage());
    const root = graphRoot(document);
    const layerTemplate = wrapperById(document, 'layer.logical.b');
    const edgeTemplate = wrapperById(document, 'edge.b.1');
    for (let index = 2; index < 50; index++) {
      const layer = layerTemplate.cloneNode(true) as Element;
      layer.setAttribute('id', `layer.logical.${index}`);
      root.appendChild(layer);
      const edge = edgeTemplate.cloneNode(true) as Element;
      edge.setAttribute('id', `edge.extra.${index}`);
      innerCell(edge).setAttribute('parent', layer.getAttribute('id'));
      root.appendChild(edge);
    }

    const colors = createLayerColorMap(new XMLSerializer().serializeToString(document));
    expect(colors.size).toBe(50);
    const paletteColors = [...colors.values()];
    expect(new Set(paletteColors).size).toBe(50);
    expect(paletteColors.every((color) => /^#[0-9A-F]{6}$/.test(color))).toBe(true);
    const rgb = (color: string): number[] => [1, 3, 5].map((offset) => Number.parseInt(color.slice(offset, offset + 2), 16));
    const palette = paletteColors.map(rgb);
    const distances = palette.flatMap((first, index) => palette.slice(index + 1)
      .map((second) => Math.hypot(...first.map((value, channel) => value - second[channel]))));
    expect(Math.min(...distances)).toBeGreaterThanOrEqual(40);
  });

  it('keeps a layer color across pages, including common_ layer ids', async() => {
    const document = parseXml(syntheticPage());
    const common = required(document.querySelector('diagram')).cloneNode(true) as Element;
    common.setAttribute('id', 'common');
    common.setAttribute('name', 'Common');
    for (const edge of Array.from<Element>(common.querySelectorAll('object'))) {
      const cell = innerCell(edge);
      if (cell?.getAttribute('edge') === '1' && cell.getAttribute('parent') !== 'layer.logical.b') edge.remove();
    }
    required(common.querySelector('mxCell[id="layer.logical.b"]')).setAttribute('id', 'common_layer.logical.b');
    required(common.querySelector('object[id="edge.b.1"] > mxCell')).setAttribute('parent', 'common_layer.logical.b');
    required(document.querySelector('mxfile')).appendChild(common);
    const fullXml = new XMLSerializer().serializeToString(document);
    const colors = createLayerColorMap(fullXml);
    const pages = splitDiagramPages(fullXml);
    const first = await routeCorridorPage(pages[0], { layerColors: colors });
    const second = await routeCorridorPage(pages[1], { layerColors: colors });
    const firstColor = styleValue(innerCell(wrapperById(parseXml(first.xml), 'edge.b.1')).getAttribute('style'), 'strokeColor');
    const secondColor = styleValue(innerCell(wrapperById(parseXml(second.xml), 'edge.b.1')).getAttribute('style'), 'strokeColor');

    expect(colors.has('common_layer.logical.b')).toBe(false);
    expect(colors.get('layer.logical.b')).toBe(firstColor);
    expect(secondColor).toBe(firstColor);
  });

  it('spreads identical endpoint links from different layers into distinct paths', async() => {
    const document = parseXml(syntheticPage());
    const root = graphRoot(document);
    const second = wrapperById(document, 'edge.a.1').cloneNode(true) as Element;
    second.setAttribute('id', 'edge.same.b');
    innerCell(second).setAttribute('parent', 'layer.logical.b');
    root.appendChild(second);
    const result = await routeCorridorPage(new XMLSerializer().serializeToString(document));
    const output = parseXml(result.xml);
    const firstPath = routedPath(output, wrapperById(output, 'edge.a.1'));
    const secondPath = routedPath(output, wrapperById(output, 'edge.same.b'));

    expect(result.diagnostics.failedEdges).toBe(0);
    expect(firstPath).not.toEqual(secondPath);
    expect(firstPath[0]).not.toEqual(secondPath[0]);
  });

  it('keeps long horizontal trunks from different sources and layers separate', async() => {
    const input = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="layer.logical.a" parent="1"/><mxCell id="layer.logical.b" parent="1"/><mxCell id="layer.logical.c" parent="1"/>
      ${['a', 'b', 'c'].map((name, index) => vertexXml({ id: `source.${name}`, x: 20 + index * 60, y: 20, parent: '1' })).join('')}
      ${['a', 'b', 'c'].map((name, index) => vertexXml({ id: `target.${name}`, x: 300 + index * 60, y: 200, parent: '1' })).join('')}
      ${['a', 'b', 'c'].map((name) => edgeXml({ id: `edge.${name}`, source: `source.${name}`, target: `target.${name}`, parent: `layer.logical.${name}` })).join('')}
    </root></mxGraphModel></diagram></mxfile>`;
    const result = await routeCorridorPage(input);
    const output = parseXml(result.xml);
    const paths = ['a', 'b', 'c'].map((name) => routedPath(output, wrapperById(output, `edge.${name}`)));

    expect(result.diagnostics).toEqual(expect.objectContaining({ routedEdges: 3, failedEdges: 0, skippedEdges: 0 }));
    for (let first = 0; first < paths.length; first++) {
      for (let second = first + 1; second < paths.length; second++) {
        expect(longHorizontalOverlap(paths[first], paths[second])).toBe(false);
      }
    }
  });

  it('keeps long vertical trunks from different layers separate', async() => {
    const input = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="layer.logical.a" parent="1"/><mxCell id="layer.logical.b" parent="1"/>
      ${vertexXml({ id: 'source', x: 20, y: 20 })}
      ${vertexXml({ id: 'target.a', x: 300, y: 400, width: 200, height: 20 })}
      ${vertexXml({ id: 'target.b', x: 300, y: 500, width: 200, height: 20 })}
      ${edgeXml({ id: 'edge.a', source: 'source', target: 'target.a', parent: 'layer.logical.a' })}
      ${edgeXml({ id: 'edge.b', source: 'source', target: 'target.b', parent: 'layer.logical.b' })}
    </root></mxGraphModel></diagram></mxfile>`;
    const result = await routeCorridorPage(input);
    const output = parseXml(result.xml);
    const first = routedPath(output, wrapperById(output, 'edge.a'));
    const second = routedPath(output, wrapperById(output, 'edge.b'));

    expect(result.diagnostics.failedEdges).toBe(0);
    expect(longVerticalOverlap(first, second)).toBe(false);
  });

  it('ignores distant obstacles when sizing the route grid', async() => {
    const document = parseXml(syntheticPage());
    const root = graphRoot(document);
    for (let index = 0; index < 198; index++) {
      root.appendChild(parseXml(`<mxfile><diagram><mxGraphModel><root>${vertexXml({
        id: `remote.${index}`, x: 10000 + index * 20, y: 10000 + index * 20, parent: '1'
      })}</root></mxGraphModel></diagram></mxfile>`).querySelector('object'));
    }
    const result = await routeCorridorPage(new XMLSerializer().serializeToString(document), { maxGridCells: 10000 });

    expect(result.diagnostics.failedEdges).toBe(0);
    expect(result.diagnostics.routedEdges).toBe(16);
  });

  it('rejects an aborted calculation without returning partially routed XML', async() => {
    const input = syntheticPage();
    const controller = new AbortController();
    const routing = routeCorridorPage(input, { signal: controller.signal, yieldEvery: 1, yieldSliceMs: 0 });
    controller.abort();

    await expect(routing).rejects.toMatchObject({ name: 'AbortError' });
    expect(input).not.toContain('edgeStyle=none');
  });

  it('skips missing endpoints and malformed geometry without changing those edges', async() => {
    const input = syntheticPage();
    const before = parseXml(input);
    const result = await routeCorridorPage(input);
    const after = parseXml(result.xml);

    for (const id of ['edge.missing', 'edge.malformed']) {
      expect(innerCell(wrapperById(after, id)).outerHTML).toBe(innerCell(wrapperById(before, id)).outerHTML);
    }
    const summary = diagnosticsSummary(result.diagnostics);
    expect(summary.skipped).toBe(2);
    expect(summary.failures).toBe(0);
  });

  it('uses the opposite target port when the preferred port is blocked', async() => {
    const before = parseXml(syntheticPage());
    const result = await routeCorridorPage(syntheticPage());
    const after = parseXml(result.xml);
    const edge = wrapperById(after, 'edge.b.1');
    const edgeCell = innerCell(edge);

    expect(attributeSnapshot(after, ['source', 'target.b'])).toEqual(attributeSnapshot(before, ['source', 'target.b']));
    expect(styleValue(edgeCell.getAttribute('style'), 'entryY')).toBe('1');
    expect(pathCollisions(routedPath(after, edge), semanticRectangles(after))).toEqual([]);
  });
});
