/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, it } from '@jest/globals';

import { MAIN_SCHEMA_XML, SCHEMAS } from '../../plugins/seaf2drawiojs/lib/constants';

let Diagram;

function objectItem(id, schema, parent, geometry, attributes = {}, primaryVars = {}) {
  return {
    xmlTag: 'object',
    template: {
      $: { id, label: id, schema, ...attributes },
      mxCell: {
        $: { parent, vertex: '1', style: attributes.style ?? '' },
        mxGeometry: { $: { ...geometry, as: 'geometry' } }
      }
    },
    primaryVars: { id, schema, ...primaryVars },
    secondaryVars: {}
  };
}

function cellItem(id, parent, geometry) {
  return {
    xmlTag: 'mxCell',
    template: {
      $: { id, parent, vertex: '1', style: 'group' },
      mxGeometry: { $: { ...geometry, as: 'geometry' } }
    },
    primaryVars: {},
    secondaryVars: {}
  };
}

function geometry(document, id) {
  return document.querySelector(`[id="${id}"]`)?.querySelector('mxGeometry');
}

function absoluteBox(document, id) {
  const rootElements = Array.from(document.querySelectorAll('root > *'));
  const elementById = new Map(rootElements.map((element) => {
    const cell = element.tagName.toLowerCase() === 'mxcell' ? element : element.querySelector('mxCell');
    return [element.getAttribute('id') ?? cell?.getAttribute('id'), element];
  }));
  const element = elementById.get(id);
  const cell = element?.tagName.toLowerCase() === 'mxcell' ? element : element?.querySelector('mxCell');
  const bounds = cell?.querySelector('mxGeometry');
  let x = Number(bounds?.getAttribute('x') ?? 0);
  let y = Number(bounds?.getAttribute('y') ?? 0);
  let parentId = cell?.getAttribute('parent');
  while (parentId && !['0', '1'].includes(parentId)) {
    const parent = elementById.get(parentId);
    const parentCell = parent?.tagName.toLowerCase() === 'mxcell' ? parent : parent?.querySelector('mxCell');
    const parentGeometry = parentCell?.querySelector('mxGeometry');
    if (!parentGeometry) break;
    x += Number(parentGeometry.getAttribute('x') ?? 0);
    y += Number(parentGeometry.getAttribute('y') ?? 0);
    parentId = parentCell.getAttribute('parent');
  }
  const width = Number(bounds?.getAttribute('width') ?? 0);
  const height = Number(bounds?.getAttribute('height') ?? 0);
  return { left: x, top: y, right: x + width, bottom: y + height };
}

describe('seaf2drawiojs visual layout', () => {
  beforeAll(async() => {
    global.DocHub = {
      documents: {
        getLoggerWithTag: () => ({
          debug: () => undefined,
          info: () => undefined,
          warn: () => undefined,
          error: () => undefined
        })
      }
    };
    Diagram = (await import('../../plugins/seaf2drawiojs/lib/diagram')).default;
  });

  it('shows logical layers in natural name order above base layers in the Draw.io menu', () => {
    const diagram = new Diagram({ common_location_page: false }, {});
    diagram.addDiagram('layers-test', 'Office', `<diagram id="layers-test" name="Office">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="100" value="Connections" parent="0"/>
      </root></mxGraphModel>
    </diagram>`);
    for (const [id, label] of [
      ['soc', 'SOC/SIEM. Сбор данных'],
      ['vpn', 'VPN. Передача журналов'],
      ['av', 'АВЗ. Управление агентами'],
      ['pam', 'PAM. Подключение администраторов'],
      ['step-10', '1.10. Десятый шаг'],
      ['step-2', '1.2. Второй шаг'],
      ['step-1', '1.1. Первый шаг']
    ]) diagram.addLayer('Office', `layer.logical.${id}`, label);

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const root = document.querySelector('diagram[name="Office"] root');
    const layers = Array.from(root.children).filter((element) => element.getAttribute('parent') === '0');
    expect(layers.findIndex((element) => element.getAttribute('id') === '100')).toBeLessThan(
      layers.findIndex((element) => element.getAttribute('id') === 'layer.logical.vpn')
    );
    expect(layers.filter((element) => element.getAttribute('id').startsWith('layer.logical.'))
      .reverse().map((element) => element.getAttribute('value'))).toEqual([
      '1.1. Первый шаг',
      '1.2. Второй шаг',
      '1.10. Десятый шаг',
      'АВЗ. Управление агентами',
      'PAM. Подключение администраторов',
      'SOC/SIEM. Сбор данных',
      'VPN. Передача журналов'
    ]);

    const commonRoot = new DOMParser().parseFromString(`<root>
      <mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="common_layer.logical.vpn" value="VPN. Передача журналов" parent="0"/>
      <mxCell id="common_layer.logical.pam" value="PAM. Подключение администраторов" parent="0"/>
      <mxCell id="common_layer.logical.step-10" value="1.10. Десятый шаг" parent="0"/>
      <mxCell id="common_layer.logical.step-2" value="1.2. Второй шаг" parent="0"/>
    </root>`, 'application/xml').documentElement;
    diagram.normalizeRootChildOrder(commonRoot);
    expect(Array.from(commonRoot.children).filter((element) => element.getAttribute('id')?.startsWith('common_layer.logical.'))
      .reverse().map((element) => element.getAttribute('value'))).toEqual([
      '1.2. Второй шаг',
      '1.10. Десятый шаг',
      'PAM. Подключение администраторов',
      'VPN. Передача журналов'
    ]);
  });

  it('shrinks containers around rotated content and keeps neighbor gutters', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('layout-test', 'Office', `<diagram id="layout-test" name="Office">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="001" parent="1" vertex="1"><mxGeometry width="1600" height="1600" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);

    const addSegment = (id, zone, x, y) => {
      diagram.addObject('Office', objectItem(
        id,
        SCHEMAS.NETWORK_SEGMENT,
        '001',
        { x, y, width: 1000, height: 1000 },
        {},
        { sber: { zone, location: 'dc' } }
      ), id);
      diagram.addObject('Office', objectItem(
        `${id}-lane`,
        SCHEMAS.NETWORK,
        id,
        { x: -275, y: 280, width: 585, height: 25 },
        { style: 'rotation=270;' }
      ), `${id}-lane`);
    };

    addSegment('dmz', 'DMZ', 20, 20);
    addSegment('internal', 'INT-NET', 500, 20);
    addSegment('wan-edge', 'INT-WAN-EDGE', 20, 1200);
    for (const id of ['service-z', 'service-a']) {
      diagram.addObject('Office', objectItem(
        id,
        SCHEMAS.COMPUTE_SERVICE,
        '1',
        { width: 40, height: 40 },
        { service_type: 'Applications' },
        { segment: 'dmz', title: id }
      ), id);
    }

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const dc = geometry(document, '001');
    const dmz = geometry(document, 'dmz');
    const internal = geometry(document, 'internal');
    const wanEdge = geometry(document, 'wan-edge');
    const group = geometry(document, 'tech_group_dmz_Applications');
    const serviceA = geometry(document, 'service-a');
    const serviceZ = geometry(document, 'service-z');

    expect(Number(dmz.getAttribute('width'))).toBeLessThan(1000);
    expect(Number(dmz.getAttribute('height'))).toBe(625);
    expect(Number(internal.getAttribute('x'))).toBeGreaterThanOrEqual(
      Number(dmz.getAttribute('x')) + Number(dmz.getAttribute('width')) + 20
    );
    expect(Number(wanEdge.getAttribute('y'))).toBeGreaterThanOrEqual(
      Number(dmz.getAttribute('y')) + Number(dmz.getAttribute('height')) + 20
    );
    expect(Number(group.getAttribute('x'))).toBeGreaterThanOrEqual(90);
    expect(Number(serviceA.getAttribute('x'))).toBeLessThan(Number(serviceZ.getAttribute('x')));
    expect(Number(dc.getAttribute('width'))).toBeLessThan(1600);
    expect(Number(dc.getAttribute('height'))).toBeLessThan(1600);
    expect(Number(dc.getAttribute('width'))).toBeGreaterThanOrEqual(
      Number(internal.getAttribute('x')) + Number(internal.getAttribute('width')) + 20
    );
  });

  it('keeps explicit segment placement and resolves carrier-only services on Main Schema', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('main-schema-test', 'Main Schema', MAIN_SCHEMA_XML);
    diagram.addObject('Main Schema', objectItem(
      'internet-segment', SCHEMAS.NETWORK_SEGMENT, '003', { width: 160, height: 590 }, {},
      { sber: { zone: 'INTERNET', location: 'main' } }
    ), 'internet-segment');
    diagram.addObject('Main Schema', objectItem(
      'external-network', SCHEMAS.NETWORK, 'internet-segment', { x: 20, y: 80, width: 140, height: 20 }, {},
      { segment: 'internet-segment' }
    ), 'external-network');
    diagram.addObject('Main Schema', objectItem(
      'external-service', SCHEMAS.COMPUTE_SERVICE, '1', { width: 80, height: 50 },
      { service_type: 'External service' },
      { network_connection: ['external-network'], title: 'External service' }
    ), 'external-service');

    const document = new DOMParser().parseFromString(diagram.generateXml({
      'main-schema-test': [{
        id: 'internet-segment',
        diff: { geometry_attr_key: { x: { new: '0' }, y: { new: '0' } } }
      }]
    }), 'application/xml');
    const externalServices = document.querySelector('[id="EXTERNAL-SERVICES"]');
    const externalService = document.querySelector('[id="external-service"]');

    expect(externalServices?.getAttribute('parent')).toBe('1');
    expect(externalService?.querySelector('mxCell')?.getAttribute('parent'))
      .toBe('tech_group_unplaced_102:External service');
    expect(Number(geometry(document, 'internet-segment').getAttribute('x'))).toBe(0);
  });

  it('uses an available segment for mixed and partly unresolved connections', () => {
    const diagram = new Diagram({}, {});
    const objectIndex = {
      'network.internet': {
        item: { primaryVars: { schema: SCHEMAS.NETWORK, segment: 'segment.internet' } }
      },
      'segment.internet': {
        item: { primaryVars: { sber: { zone: 'INTERNET', location: 'main' } } },
        element: document.createElement('object')
      },
      'network.internal': {
        item: { primaryVars: { schema: SCHEMAS.NETWORK, segment: 'segment.internal' } }
      },
      'segment.internal': {
        item: { primaryVars: { sber: { zone: 'INT-NET', location: 'main' } } },
        element: document.createElement('object')
      }
    };

    expect(diagram.deriveSegmentFromConnections(
      { OID: 'unresolved', primaryVars: { network_connection: ['network.internet', 'missing'] } },
      { auto_segment: true },
      objectIndex
    )).toBe('segment.internet');
    expect(diagram.deriveSegmentFromConnections(
      { OID: 'mixed', primaryVars: { network_connection: ['network.internet', 'network.internal'] } },
      { auto_segment: true },
      objectIndex
    )).toBe('segment.internal');
    expect(diagram.deriveSegmentFromConnections(
      { OID: 'carrier-only', primaryVars: { network_connection: ['network.internet'] } },
      { auto_segment: true },
      objectIndex
    )).toBe('');
    expect(diagram.deriveSegmentFromConnections(
      { OID: 'explicit', primaryVars: { segment: 'segment.internal', network_connection: ['network.internet'] } },
      { auto_segment: true },
      objectIndex
    )).toBe('segment.internal');
  });

  it('keeps stacked service groups to the right of rotated network lanes', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('stack-test', 'Cloud', `<diagram id="stack-test" name="Cloud">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="001" parent="1" vertex="1"><mxGeometry width="800" height="800" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);
    diagram.addObject('Cloud', objectItem(
      'edge', SCHEMAS.NETWORK_SEGMENT, '001', { x: 20, y: 20, width: 400, height: 700 },
      { label: 'EXT WAN-EDGE', style: 'rotation=270;' },
      { sber: { zone: 'INET-EDGE', location: 'dc' } }
    ), 'edge');
    diagram.addObject('Cloud', objectItem(
      'edge-lane', SCHEMAS.NETWORK, 'edge', { x: -275, y: 280, width: 585, height: 25 },
      { style: 'rotation=270;', label: 'LAN' }
    ), 'edge-lane');
    diagram.addObject('Cloud', objectItem(
      'ddos', SCHEMAS.KB, '1', { width: 40, height: 40 }, { technology: 'DDoS' },
      { segment: 'edge', title: 'DDoS' }
    ), 'ddos');

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const segment = geometry(document, 'edge');
    const lane = geometry(document, 'edge-lane');
    const groupCell = document.querySelector('[id="tech_group_edge_DDoS"]');
    const group = groupCell.querySelector('mxGeometry');
    const laneVisualRight = Number(segment.getAttribute('x')) + Number(lane.getAttribute('x'))
      + (Number(lane.getAttribute('width')) + Number(lane.getAttribute('height'))) / 2;
    const segmentLabelRight = Number(segment.getAttribute('x'))
      + 'EXT WAN-EDGE'.length * diagram.constants.LABEL_CHAR_WIDTH;

    expect(document.querySelector('[id="edge"]').getAttribute('label')).toBe('EXT WAN-EDGE');
    expect(groupCell.getAttribute('value')).toContain('DDoS');
    expect(Number(group.getAttribute('x'))).toBeGreaterThanOrEqual(Math.max(laneVisualRight, segmentLabelRight) + 140);
  });

  it('fits visible carrier containers around provider groups', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('main-test', 'Main', `<diagram id="main-test" name="Main">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="003" parent="0"/><mxCell id="004" parent="0"/>
        <mxCell id="INTERNET" parent="003" vertex="1"><mxGeometry width="170" height="590" as="geometry"/></mxCell>
        <mxCell id="TRANSPORT-WAN" parent="004" vertex="1"><mxGeometry x="200" width="170" height="590" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);

    for (const [id, zone, layer, carrier] of [
      ['internet', 'INTERNET', '003', 'INTERNET'],
      ['wan', 'TRANSPORT-WAN', '004', 'TRANSPORT-WAN']
    ]) {
      diagram.addObject('Main', objectItem(
        id, SCHEMAS.NETWORK_SEGMENT, layer, { x: 10, y: 10, width: 140, height: 350 }, {},
        { sber: { zone, location: 'office' } }
      ), id);
      diagram.addObject('Main', objectItem(
        `${id}-provider`, SCHEMAS.COMPONENT_NETWORK, carrier, { x: 220, y: 45, width: 110, height: 65 }
      ), `${id}-provider`);
    }
    diagram.addObject('Main', objectItem(
      'region', SCHEMAS.DC_REGION, '1', { x: 800, width: 800, height: 800 }
    ), 'region');

    const document = new DOMParser().parseFromString(diagram.generateXml({
      'main-test': [{
        id: 'region',
        diff: { geometry_attr_key: { x: { new: '400' } } }
      }]
    }), 'application/xml');
    const internet = geometry(document, 'INTERNET');
    const transport = geometry(document, 'TRANSPORT-WAN');
    const region = geometry(document, 'region');
    for (const [segmentId, carrierId] of [['internet', 'INTERNET'], ['wan', 'TRANSPORT-WAN']]) {
      expect(Number(geometry(document, carrierId).getAttribute('width'))).toBeGreaterThanOrEqual(350);
      expect(Number(geometry(document, carrierId).getAttribute('height'))).toBe(590);
      expect(Number(geometry(document, segmentId).getAttribute('width'))).toBe(140);
    }
    expect(Number(transport.getAttribute('x'))).toBeGreaterThanOrEqual(
      Number(internet.getAttribute('x')) + Number(internet.getAttribute('width')) + 20
    );
    expect(Number(region.getAttribute('x'))).toBeGreaterThanOrEqual(
      Number(transport.getAttribute('x')) + Number(transport.getAttribute('width')) + 20
    );
  });

  it('generates the Common page without grid, page view, or shadow', () => {
    const diagram = new Diagram({ common_location_page: true }, {});
    diagram.addDiagram('office-page', 'Office', `<diagram id="office-page" name="Office">
      <mxGraphModel grid="0" page="0" shadow="0"><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
      </root></mxGraphModel>
    </diagram>`);
    diagram.commonLocationSourcePages = ['Office'];

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const commonModel = document.querySelector('diagram[id="common_location_page"] mxGraphModel');

    expect(commonModel).not.toBeNull();
    expect(commonModel.getAttribute('grid')).toBe('0');
    expect(commonModel.getAttribute('page')).toBe('0');
    expect(commonModel.getAttribute('shadow')).toBe('0');
  });

  it('fits and chains generated-page carrier roots without resizing data segments', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('page-test', 'Office', `<diagram id="page-test" name="Office">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="003" parent="0" vertex="1"><mxGeometry x="240" width="160" height="1060" as="geometry"/></mxCell>
        <mxCell id="004" parent="0" vertex="1"><mxGeometry x="420" width="160" height="1060" as="geometry"/></mxCell>
        <mxCell id="001" parent="0" vertex="1"><mxGeometry x="615" width="800" height="1060" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);

    for (const [id, zone, carrier] of [['internet-data', 'INTERNET', '003'], ['wan-data', 'TRANSPORT-WAN', '004']]) {
      diagram.addObject('Office', objectItem(
        id, SCHEMAS.NETWORK_SEGMENT, carrier, { width: 160, height: 1060 }, {},
        { sber: { zone, location: 'office' } }
      ), id);
      diagram.addObject('Office', objectItem(
        `${id}-provider`, SCHEMAS.COMPONENT_NETWORK, carrier, { x: 220, y: 45, width: 110, height: 65 }
      ), `${id}-provider`);
    }
    for (const [id, zone, x, y, width, height] of [
      ['inet-edge', 'INET-EDGE', 0, 210, 195, 290],
      ['ext-wan-edge', 'EXT-WAN-EDGE', 0, 507, 195, 290],
      ['dmz', 'DMZ', 195, 0, 440, 500],
      ['dmz-secondary', 'DMZ', 195, 0, 300, 240],
      ['int-wan-edge', 'INT-WAN-EDGE', 195, 520, 300, 280],
      ['int-net', 'INT-NET', 635, 0, 500, 800],
      ['int-net-secondary', 'INT-NET', 635, 0, 320, 260],
      ['int-security', 'INT-SECURITY-NET', 1155, 0, 300, 800],
      ['int-security-secondary', 'INT-SECURITY-NET', 1155, 0, 260, 220]
    ]) {
      diagram.addObject('Office', objectItem(
        id, SCHEMAS.NETWORK_SEGMENT, '001', { x, y, width, height }, {},
        { sber: { zone, location: 'office' } }
      ), id);
    }
    diagram.addObject('Office', objectItem(
      'dmz-service', SCHEMAS.COMPUTE_SERVICE, '1', { width: 400, height: 80 },
      { service_type: 'Applications' }, { segment: 'dmz', title: 'Wide DMZ service' }
    ), 'dmz-service');
    for (let index = 0; index < 6; index++) {
      diagram.addObject('Office', objectItem(
        `dmz-lane-${index}`, SCHEMAS.NETWORK, 'dmz',
        { x: 25 + index * 35, y: 60 + index * 55, width: 300, height: 20 },
        { style: 'rotation=270;' }
      ), `dmz-lane-${index}`);
    }
    for (let index = 0; index < 12; index++) {
      diagram.addObject('Office', objectItem(
        `dmz-device-${index}`, SCHEMAS.COMPONENT_NETWORK, 'dmz-lane-5',
        { x: 80 + index * 70, y: 120, width: 50, height: 50 }
      ), `dmz-device-${index}`);
    }
    for (let index = 0; index < 8; index++) {
      diagram.addObject('Office', objectItem(
        `dmz-service-${index}`, SCHEMAS.COMPUTE_SERVICE, '1', { width: 100, height: 60 },
        { service_type: index < 4 ? 'Applications' : 'Monitoring' },
        { segment: 'dmz', title: `DMZ service ${index}` }
      ), `dmz-service-${index}`);
    }

    const document = new DOMParser().parseFromString(diagram.generateXml({
      'page-test': [
        { id: 'dmz-device-11', diff: { geometry_attr_key: { x: { new: '1200' } } } },
        { id: 'dmz-service-7', diff: { geometry_attr_key: { x: { new: '900' } } } }
      ]
    }), 'application/xml');
    const internet = geometry(document, '003');
    const transport = geometry(document, '004');
    const location = geometry(document, '001');

    expect(Number(internet.getAttribute('width'))).toBeGreaterThanOrEqual(350);
    expect(Number(internet.getAttribute('height'))).toBe(1060);
    expect(Number(transport.getAttribute('x'))).toBeGreaterThanOrEqual(
      Number(internet.getAttribute('x')) + Number(internet.getAttribute('width')) + 20
    );
    expect(Number(location.getAttribute('x'))).toBeGreaterThanOrEqual(
      Number(transport.getAttribute('x')) + Number(transport.getAttribute('width')) + 20
    );
    expect(Number(geometry(document, 'internet-data').getAttribute('width'))).toBe(160);
    expect(Number(geometry(document, 'wan-data').getAttribute('height'))).toBe(1060);
    const inet = geometry(document, 'inet-edge');
    const ext = geometry(document, 'ext-wan-edge');
    const dmz = geometry(document, 'dmz');
    const dmzSecondary = geometry(document, 'dmz-secondary');
    const intWan = geometry(document, 'int-wan-edge');
    const intNet = geometry(document, 'int-net');
    const intNetSecondary = geometry(document, 'int-net-secondary');
    const intSecurity = geometry(document, 'int-security');
    const intSecuritySecondary = geometry(document, 'int-security-secondary');
    const right = (item) => Number(item.getAttribute('x')) + Number(item.getAttribute('width'));
    const bottom = (item) => Number(item.getAttribute('y')) + Number(item.getAttribute('height'));
    expect(Number(ext.getAttribute('x'))).toBe(Number(inet.getAttribute('x')));
    expect(Number(ext.getAttribute('y'))).toBeGreaterThanOrEqual(bottom(inet) + 20);
    expect(Number(dmz.getAttribute('x'))).toBeGreaterThanOrEqual(Math.max(right(inet), right(ext)) + 20);
    expect(Number(dmzSecondary.getAttribute('y'))).toBeGreaterThanOrEqual(bottom(dmz) + 20);
    expect(Number(intWan.getAttribute('x'))).toBe(Number(dmz.getAttribute('x')));
    expect(Number(intWan.getAttribute('y'))).toBeGreaterThanOrEqual(bottom(dmzSecondary) + 20);
    expect(Number(intNet.getAttribute('x'))).toBeGreaterThanOrEqual(
      Math.max(right(dmz), right(dmzSecondary), right(intWan)) + 20
    );
    expect(Number(intNetSecondary.getAttribute('y'))).toBeGreaterThanOrEqual(bottom(intNet) + 20);
    expect(Number(intSecurity.getAttribute('x'))).toBeGreaterThanOrEqual(right(intNet) + 20);
    expect(Number(intSecuritySecondary.getAttribute('y'))).toBeGreaterThanOrEqual(bottom(intSecurity) + 20);
    expect(Number(dmz.getAttribute('width'))).toBeGreaterThan(440);
    expect(Number(geometry(document, 'dmz').getAttribute('y'))).toBe(0);
    expect(Number(dmz.getAttribute('width'))).toBeGreaterThanOrEqual(
      Number(geometry(document, 'dmz-lane-5').getAttribute('x'))
        + Number(geometry(document, 'dmz-device-11').getAttribute('x'))
        + Number(geometry(document, 'dmz-device-11').getAttribute('width')) + 20
    );
    const serviceGroup = geometry(document, 'tech_group_dmz_Applications');
    expect(Number(serviceGroup.getAttribute('x')) + Number(geometry(document, 'dmz-service-7').getAttribute('x'))
      + Number(geometry(document, 'dmz-service-7').getAttribute('width')) + 20).toBeLessThanOrEqual(
      Number(location.getAttribute('x')) + Number(dmz.getAttribute('x')) + Number(dmz.getAttribute('width'))
    );
    const deviceRight = Math.max(...Array.from({ length: 12 }, (_, index) =>
      absoluteBox(document, `dmz-device-${index}`).right
    ));
    const promotedGroupIds = Array.from(document.querySelectorAll('mxCell[parent="102"]'))
      .map((cell) => cell.getAttribute('id'))
      .filter((id) => id?.startsWith('tech_group_dmz_'));
    expect(promotedGroupIds).toHaveLength(2);
    const promotedGroups = promotedGroupIds.map((id) => absoluteBox(document, id));
    for (const group of promotedGroups) {
      expect(group.left).toBeGreaterThanOrEqual(deviceRight + 140);
    }
    expect(promotedGroups[1].top).toBeGreaterThanOrEqual(promotedGroups[0].bottom + 20);
  });

  it('keeps services inferred only from carrier networks on service layers outside the carrier', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('carrier-service-test', 'Office', `<diagram id="carrier-service-test" name="Office">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="003" parent="0" vertex="1"><mxGeometry x="240" y="60" width="315" height="1060" as="geometry"/></mxCell>
        <mxCell id="004" parent="0" vertex="1"><mxGeometry x="575" y="60" width="160" height="1060" as="geometry"/></mxCell>
        <mxCell id="001" parent="0" vertex="1"><mxGeometry x="755" y="60" width="800" height="1060" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);
    diagram.addObject('Office', objectItem(
      'external-segment', SCHEMAS.NETWORK_SEGMENT, '003', { width: 160, height: 1060 }, {},
      { sber: { zone: 'INTERNET', location: 'office' } }
    ), 'external-segment');
    diagram.addObject('Office', objectItem(
      'external-network', SCHEMAS.NETWORK, 'external-segment', { x: 20, y: 80, width: 140, height: 20 }, {},
      { segment: 'external-segment' }
    ), 'external-network');
    diagram.addObject('Office', objectItem(
      'provider-network', SCHEMAS.NETWORK, '003', { x: 20, y: 140, width: 140, height: 20 }
    ), 'provider-network');
    diagram.addObject('Office', cellItem(
      'external-user_0', 'external-network', { x: 340, y: 110, width: 70, height: 60 }
    ), 'external-user_0');
    diagram.addObject('Office', objectItem(
      'external-user', SCHEMAS.COMPONENT_USER_DEVICE, 'external-user_0', { x: 10, y: 15, width: 50, height: 35 },
      { network_connection: 'external-network' },
      { network_connection: ['external-network'], title: 'External user' }
    ), 'external-user');
    diagram.addObject('Office', cellItem(
      'external-user-peer_0', 'external-network', { x: 420, y: 110, width: 70, height: 60 }
    ), 'external-user-peer_0');
    diagram.addObject('Office', objectItem(
      'external-user-peer', SCHEMAS.COMPONENT_USER_DEVICE, 'external-user-peer_0', { x: 10, y: 15, width: 50, height: 35 },
      { network_connection: 'external-network' },
      { network_connection: ['external-network'], title: 'External contractor' }
    ), 'external-user-peer');
    diagram.addObject('Office', cellItem(
      'unresolved-user_0', 'external-network', { x: 430, y: 110, width: 70, height: 60 }
    ), 'unresolved-user_0');
    diagram.addObject('Office', objectItem(
      'unresolved-user', SCHEMAS.COMPONENT_USER_DEVICE, 'unresolved-user_0', { x: 10, y: 15, width: 50, height: 35 },
      { network_connection: 'external-network,missing-network' },
      { network_connection: ['external-network', 'missing-network'], title: 'Partly unresolved user' }
    ), 'unresolved-user');
    diagram.addObject('Office', objectItem(
      'dmz', SCHEMAS.NETWORK_SEGMENT, '001', { x: 0, y: 0, width: 500, height: 700 }, {},
      { sber: { zone: 'DMZ', location: 'office' } }
    ), 'dmz');
    diagram.addObject('Office', objectItem(
      'internal-network', SCHEMAS.NETWORK, 'dmz', { x: 20, y: 80, width: 140, height: 20 }, {},
      { segment: 'dmz' }
    ), 'internal-network');
    diagram.addObject('Office', cellItem(
      'internal-user_0', 'internal-network', { x: 180, y: 110, width: 70, height: 60 }
    ), 'internal-user_0');
    diagram.addObject('Office', objectItem(
      'internal-user', SCHEMAS.COMPONENT_USER_DEVICE, 'internal-user_0', { x: 10, y: 15, width: 50, height: 35 },
      { network_connection: 'internal-network' },
      { network_connection: ['internal-network'], title: 'Internal user' }
    ), 'internal-user');
    diagram.addObject('Office', objectItem(
      'inferred-security', SCHEMAS.KB, 'external-segment', { x: 175, y: 100, width: 60, height: 50 },
      { technology: 'External security', network_connection: 'external-network' },
      { network_connection: ['external-network'], title: 'Inferred security' }
    ), 'inferred-security');
    diagram.addObject('Office', objectItem(
      'inferred-security-peer', SCHEMAS.KB, 'external-segment', { x: 245, y: 100, width: 60, height: 50 },
      { technology: 'External security', network_connection: 'external-network' },
      { network_connection: ['external-network'], title: 'External WAF SaaS' }
    ), 'inferred-security-peer');
    diagram.addObject('Office', objectItem(
      'inferred-service', SCHEMAS.COMPUTE_SERVICE, 'external-segment', { x: 175, y: 180, width: 80, height: 50 },
      { service_type: 'External service', network_connection: 'external-network' },
      { network_connection: ['external-network'], title: 'Inferred service' }
    ), 'inferred-service');
    diagram.addObject('Office', objectItem(
      'provider-security', SCHEMAS.KB, '003', { x: 175, y: 30, width: 60, height: 50 },
      { technology: 'Provider security', network_connection: 'provider-network' },
      { network_connection: ['provider-network'], title: 'Provider-linked security' }
    ), 'provider-security');
    diagram.addObject('Office', objectItem(
      'explicit-security', SCHEMAS.KB, 'external-segment', { x: 175, y: 260, width: 60, height: 50 },
      { technology: 'Explicit carrier security', network_connection: 'external-network' },
      { segment: 'external-segment', network_connection: ['external-network'], title: 'Explicit security' }
    ), 'explicit-security');

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const carrier = absoluteBox(document, '003');
    const transport = absoluteBox(document, '004');
    const externalServices = absoluteBox(document, 'EXTERNAL-SERVICES');
    const location = absoluteBox(document, '001');
    const inferredIds = ['inferred-security', 'provider-security', 'inferred-service'];
    const inferredBoxes = inferredIds.map((id) => absoluteBox(document, id));
    const groupIds = inferredIds.map((id) =>
      document.querySelector(`[id="${id}"]`)?.querySelector('mxCell')?.getAttribute('parent')
    );

    expect(groupIds).toEqual([
      'tech_group_unplaced_101:External security',
      'tech_group_unplaced_101:Provider security',
      'tech_group_unplaced_102:External service'
    ]);
    expect(groupIds.map((id) => document.querySelector(`mxCell[id="${id}"]`)?.getAttribute('parent')))
      .toEqual(['101', '101', '102']);
    expect(document.querySelector('mxCell[id="EXTERNAL-SERVICES"]')?.getAttribute('value'))
      .toContain('Внешние сервисы');
    expect(document.querySelector('mxCell[id="EXTERNAL-SERVICES"]')?.getAttribute('parent')).toBe('1');
    for (const layerId of ['101', '102']) {
      const layer = document.querySelector(`mxCell[id="${layerId}"]`);
      expect(layer?.getAttribute('parent')).toBe('0');
      expect(layer?.getAttribute('visible')).not.toBe('0');
    }
    const externalStyle = document.querySelector('mxCell[id="EXTERNAL-SERVICES"]')?.getAttribute('style') ?? '';
    for (const styleKey of [
      'rounded=1',
      'dashed=1',
      'dashPattern=6 4',
      'strokeColor=#94A3B8',
      'fillColor=none',
      'verticalAlign=top',
      'align=left',
      'fontStyle=1'
    ]) {
      expect(externalStyle).toContain(`${styleKey};`);
    }
    expect(externalServices.left).toBeGreaterThanOrEqual(0);
    expect(carrier.left).toBe(externalServices.right + 20);
    expect(transport.left).toBeGreaterThanOrEqual(carrier.right + 20);
    expect(location.left).toBeGreaterThanOrEqual(transport.right + 20);
    expect(externalServices.bottom - externalServices.top).toBeGreaterThanOrEqual(
      Math.max(carrier.bottom - carrier.top, transport.bottom - transport.top)
    );
    for (const box of inferredBoxes) {
      expect(box.left).toBeGreaterThanOrEqual(externalServices.left);
      expect(box.right).toBeLessThanOrEqual(externalServices.right);
      expect(box.bottom).toBeLessThanOrEqual(externalServices.bottom);
    }
    for (const groupId of groupIds) {
      const group = absoluteBox(document, groupId);
      expect(group.left).toBeGreaterThanOrEqual(externalServices.left + 20);
      expect(group.right).toBeLessThanOrEqual(externalServices.right - 20);
      expect(group.bottom).toBeLessThanOrEqual(externalServices.bottom - 20);
    }
    expect(inferredBoxes[1].top).toBeGreaterThanOrEqual(inferredBoxes[0].bottom + 20);
    expect(inferredBoxes[2].top).toBeGreaterThanOrEqual(inferredBoxes[1].bottom + 20);
    expect(absoluteBox(document, 'inferred-security-peer').left
      - absoluteBox(document, 'inferred-security').left).toBeGreaterThanOrEqual(
      Math.max(120, diagram.estimateLabelWidth('External WAF SaaS'))
    );
    const userGroupId = document.querySelector('[id="external-user_0"]')?.getAttribute('parent');
    expect(userGroupId).toBe('tech_group_unplaced_102:Внешние пользовательские устройства');
    expect(document.querySelector('[id="external-user-peer_0"]')?.getAttribute('parent')).toBe(userGroupId);
    expect(document.querySelector(`mxCell[id="${userGroupId}"]`)?.getAttribute('parent')).toBe('102');
    expect(absoluteBox(document, 'external-user-peer_0').left
      - absoluteBox(document, 'external-user_0').left).toBeGreaterThanOrEqual(
      Math.max(120, diagram.estimateLabelWidth('External contractor'))
    );
    const externalUser = absoluteBox(document, 'external-user');
    expect(externalUser.left).toBeGreaterThanOrEqual(externalServices.left);
    expect(externalUser.right).toBeLessThanOrEqual(externalServices.right);
    expect(externalUser.bottom).toBeLessThanOrEqual(externalServices.bottom);
    expect(document.querySelector('[id="unresolved-user_0"]')?.getAttribute('parent')).toBe('external-network');
    expect(document.querySelector('[id="internal-user_0"]')?.getAttribute('parent')).toBe('internal-network');
    expect(document.querySelector('[id="explicit-security"]')?.querySelector('mxCell')?.getAttribute('parent'))
      .toBe('tech_group_external-segment_Explicit carrier security');
    const explicitGroup = absoluteBox(document, 'tech_group_external-segment_Explicit carrier security');
    expect(explicitGroup.left).toBeGreaterThanOrEqual(carrier.left);
    expect(explicitGroup.right).toBeLessThanOrEqual(carrier.right);
    expect(document.querySelector('[id="inferred-security"]')?.getAttribute('network_connection')).toBe('external-network');
    expect(document.querySelector('[id="inferred-service"]')?.getAttribute('network_connection')).toBe('external-network');
  });

  it('keeps mixed and unresolved services in their available layout parent', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('fallback-test', 'Office', `<diagram id="fallback-test" name="Office">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="003" parent="0" vertex="1"><mxGeometry width="200" height="600" as="geometry"/></mxCell>
        <mxCell id="001" parent="0" vertex="1"><mxGeometry width="700" height="600" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);
    diagram.addObject('Office', objectItem(
      'ext-seg', SCHEMAS.NETWORK_SEGMENT, '003', { width: 160, height: 500 }, {},
      { sber: { zone: 'INTERNET', location: 'office' } }
    ), 'ext-seg');
    diagram.addObject('Office', objectItem(
      'external-network', SCHEMAS.NETWORK, 'ext-seg', { x: 20, y: 40, width: 120, height: 20 }, {},
      { segment: 'ext-seg' }
    ), 'external-network');
    diagram.addObject('Office', objectItem(
      'dmz', SCHEMAS.NETWORK_SEGMENT, '001', { width: 400, height: 500 }, {},
      { sber: { zone: 'DMZ', location: 'office' } }
    ), 'dmz');
    diagram.addObject('Office', objectItem(
      'internal-network', SCHEMAS.NETWORK, 'dmz', { x: 20, y: 40, width: 120, height: 20 }, {},
      { segment: 'dmz' }
    ), 'internal-network');
    diagram.addObject('Office', objectItem(
      'mixed-service', SCHEMAS.KB, 'internal-network', { width: 60, height: 40 },
      { technology: 'Mixed' },
      { network_connection: ['external-network', 'internal-network'], title: 'Mixed' }
    ), 'mixed-service');
    diagram.addObject('Office', objectItem(
      'unresolved-service', SCHEMAS.KB, 'internal-network', { width: 60, height: 40 },
      { technology: 'Unresolved' },
      { network_connection: ['internal-network', 'missing-network'], title: 'Unresolved' }
    ), 'unresolved-service');
    diagram.addObject('Office', objectItem(
      'carrier-parent-unresolved', SCHEMAS.KB, '003', { width: 60, height: 40 },
      { technology: 'Carrier unresolved' },
      { network_connection: ['missing-network'], title: 'Carrier unresolved' }
    ), 'carrier-parent-unresolved');
    diagram.addObject('Office', objectItem(
      'carrier-segment-unresolved', SCHEMAS.KB, '003', { x: 175, y: 100, width: 60, height: 40 },
      { technology: 'Carrier segment unresolved' },
      { network_connection: ['external-network', 'missing-network'], title: 'Carrier segment unresolved' }
    ), 'carrier-segment-unresolved');

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const mixedGroup = document.querySelector('[id="mixed-service"] mxCell')?.getAttribute('parent');
    const unresolvedGroup = document.querySelector('[id="unresolved-service"] mxCell')?.getAttribute('parent');
    const carrierParent = document.querySelector('[id="carrier-parent-unresolved"] mxCell')?.getAttribute('parent');
    const carrierSegmentParent = document.querySelector('[id="carrier-segment-unresolved"] mxCell')?.getAttribute('parent');

    expect(mixedGroup).toMatch(/^tech_group_dmz_Mixed$/);
    expect(unresolvedGroup).toMatch(/^tech_group_dmz_Unresolved$/);
    expect(carrierParent).toBe('003');
    expect(carrierSegmentParent).toBe('tech_group_ext-seg_Carrier segment unresolved');
    expect(document.querySelector('[id^="tech_group_unplaced_"] [id="carrier-parent-unresolved"]')).toBeNull();
  });

  it('places a KB with multiple carrier connections and an unresolved reference', () => {
    const createDiagram = (connections) => {
      const diagram = new Diagram({}, {});
      diagram.addDiagram('carrier-mixed-unresolved-test', 'Office', `<diagram id="carrier-mixed-unresolved-test" name="Office">
        <mxGraphModel><root>
          <mxCell id="0"/><mxCell id="1" parent="0"/>
          <mxCell id="003" parent="0" vertex="1"><mxGeometry x="240" y="60" width="315" height="1060" as="geometry"/></mxCell>
          <mxCell id="004" parent="0" vertex="1"><mxGeometry x="575" y="60" width="160" height="1060" as="geometry"/></mxCell>
          <mxCell id="001" parent="0" vertex="1"><mxGeometry x="755" y="60" width="800" height="1060" as="geometry"/></mxCell>
        </root></mxGraphModel>
      </diagram>`);
      diagram.addObject('Office', objectItem(
        'ext-seg', SCHEMAS.NETWORK_SEGMENT, '003', { width: 160, height: 500 }, {},
        { sber: { zone: 'INTERNET', location: 'office' } }
      ), 'ext-seg');
      diagram.addObject('Office', objectItem(
        'wan-seg', SCHEMAS.NETWORK_SEGMENT, '004', { width: 160, height: 500 }, {},
        { sber: { zone: 'TRANSPORT-WAN', location: 'office' } }
      ), 'wan-seg');
      diagram.addObject('Office', objectItem(
        'ext-net', SCHEMAS.NETWORK, 'ext-seg', { x: 20, y: 40, width: 120, height: 20 }, {},
        { segment: 'ext-seg' }
      ), 'ext-net');
      for (const id of ['wan-net', 'wan-net-2']) {
        diagram.addObject('Office', objectItem(
          id, SCHEMAS.NETWORK, 'wan-seg', { x: 20, y: 40, width: 120, height: 20 }, {},
          { segment: 'wan-seg' }
        ), id);
      }
      diagram.addObject('Office', objectItem(
        'mixed-unresolved-kb', SCHEMAS.KB, '003', { x: 175, y: 100, width: 60, height: 40 },
        { technology: 'Mixed unresolved' },
        { network_connection: connections, title: 'Mixed unresolved' }
      ), 'mixed-unresolved-kb');
      return diagram;
    };

    for (const [connections, expectedSegment] of [
      [['ext-net', 'wan-net', 'missing-net'], 'ext-seg'],
      [['ext-net', 'wan-net', 'wan-net-2', 'missing-net'], 'wan-seg']
    ]) {
      const document = new DOMParser().parseFromString(
        createDiagram(connections).generateXml(),
        'application/xml'
      );
      const kb = document.querySelector('[id="mixed-unresolved-kb"]');
      const groupId = kb?.querySelector('mxCell')?.getAttribute('parent');

      expect(groupId).toBe(`tech_group_${expectedSegment}_Mixed unresolved`);
      expect(document.querySelector(`[id="${groupId}"]`)).not.toBeNull();
    }
  });

  it('keeps nested user devices inside their segment and location after saved layout', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('device-test', 'Office', `<diagram id="device-test" name="Office">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="001" parent="0" vertex="1"><mxGeometry x="615" y="60" width="700" height="800" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);
    diagram.addObject('Office', objectItem(
      'office-int', SCHEMAS.NETWORK_SEGMENT, '001', { x: 635, width: 350, height: 500 }, {},
      { sber: { zone: 'INT-NET', location: 'office' } }
    ), 'office-int');
    diagram.addObject('Office', objectItem(
      'office-lan', SCHEMAS.NETWORK, 'office-int', { x: 25, y: 270, width: 140, height: 20 },
      { style: 'rotation=270;' }
    ), 'office-lan');
    diagram.addObject('Office', cellItem(
      'printer_0', 'office-lan', { x: 600, y: 150, width: 48, height: 52 }
    ), 'printer_0');
    diagram.addObject('Office', objectItem(
      'printer', SCHEMAS.COMPONENT_USER_DEVICE, 'printer_0', { x: 6, y: 16, width: 36, height: 20 }
    ), 'printer');

    const document = new DOMParser().parseFromString(diagram.generateXml({
      'device-test': [{
        id: 'printer_0',
        diff: { geometry_attr_key: { x: { new: '700' } } }
      }]
    }), 'application/xml');
    const location = geometry(document, '001');
    const segment = geometry(document, 'office-int');
    const lane = geometry(document, 'office-lan');
    const printer = geometry(document, 'printer_0');
    const printerRight = Number(lane.getAttribute('x')) + Number(printer.getAttribute('x'))
      + Number(printer.getAttribute('width'));

    expect(Number(printer.getAttribute('x'))).toBe(700);
    expect(Number(segment.getAttribute('width'))).toBeGreaterThanOrEqual(printerRight + 20);
    expect(Number(location.getAttribute('width'))).toBeGreaterThanOrEqual(
      Number(segment.getAttribute('x')) + Number(segment.getAttribute('width')) + 20
    );
  });

  it('grows AZ and Region containers bottom-up after saved layout', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('region-test', 'Main', `<diagram id="region-test" name="Main">
      <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/></root></mxGraphModel>
    </diagram>`);
    diagram.addObject('Main', objectItem(
      'region', SCHEMAS.DC_REGION, '1', { x: 390, y: 30, width: 760, height: 630 }
    ), 'region');
    diagram.addObject('Main', objectItem(
      'az-primary', SCHEMAS.DC_AZ, 'region', { x: 20, y: 30, width: 360, height: 300 }
    ), 'az-primary');
    diagram.addObject('Main', objectItem(
      'dc-primary', SCHEMAS.DC, 'az-primary', { x: 120, y: 250, width: 120, height: 100 }
    ), 'dc-primary');
    diagram.addObject('Main', objectItem(
      'az-dr', SCHEMAS.DC_AZ, 'region', { x: 390, y: 340, width: 360, height: 300 }
    ), 'az-dr');

    const document = new DOMParser().parseFromString(diagram.generateXml({
      'region-test': [
        { id: 'az-dr', diff: { geometry_attr_key: { y: { new: '800' } } } },
        {
          id: 'region',
          diff: { geometry_attr_key: { width: { new: '200' }, height: { new: '200' } } }
        }
      ]
    }), 'application/xml');
    const region = geometry(document, 'region');
    const primaryAz = geometry(document, 'az-primary');
    const drAz = geometry(document, 'az-dr');

    expect(Number(primaryAz.getAttribute('height'))).toBeGreaterThanOrEqual(250 + 100 + 40);
    expect(Number(drAz.getAttribute('y'))).toBe(800);
    expect(Number(region.getAttribute('width'))).toBeGreaterThanOrEqual(
      Number(drAz.getAttribute('x')) + Number(drAz.getAttribute('width')) + 20
    );
    expect(Number(region.getAttribute('height'))).toBeGreaterThanOrEqual(
      Number(drAz.getAttribute('y')) + Number(drAz.getAttribute('height')) + 40
    );
  });
});
