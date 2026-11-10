/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';

import dcPatterns from '../../plugins/seaf2drawiojs/patterns/dc.json';
import mainPatterns from '../../plugins/seaf2drawiojs/patterns/main.json';
import officePatterns from '../../plugins/seaf2drawiojs/patterns/office.json';
import { LAYOUT_ZONE_RULES, MAIN_SCHEMA_XML, SCHEMAS } from '../../plugins/seaf2drawiojs/lib/constants';
import { matchesPatternFilters, matchesType } from '../../plugins/seaf2drawiojs/lib/utils';

function aabb(pattern, position) {
  return { left: position.x, top: position.y, right: position.x + pattern.w, bottom: position.y + pattern.h };
}

function overlaps(left, right) {
  return left.left < right.right && left.right > right.left
    && left.top < right.bottom && left.bottom > right.top;
}

describe('seaf2drawio visual links', () => {
  let Seaf2Drawio;
  let Diagram;

  beforeAll(async() => {
    global.DocHub = { documents: { getLoggerWithTag: jest.fn(() => ({
      debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn()
    })) } };
    ({ Seaf2Drawio } = await import('../../plugins/seaf2drawiojs/lib/seaf-drawio'));
    Diagram = (await import('../../plugins/seaf2drawiojs/lib/diagram')).default;
  });

  it('uses a compact device grid and hides duplicate edge labels without dropping metadata', () => {
    const added = [];
    const data = {
      [SCHEMAS.NETWORK_SEGMENT]: {
        segment: { title: 'LAN', zone: 'INT-NET' },
        internet: { title: 'Internet', zone: 'INTERNET' }
      },
      [SCHEMAS.COMPONENT_NETWORK]: {
        source: { title: 'Firewall' },
        target: { title: 'LAN' }
      }
    };
    const drawio = new Seaf2Drawio(data, { addLinks: (_page, link) => added.push(link) });
    const devicePattern = {
      schema: SCHEMAS.COMPONENT_NETWORK,
      parent_id: 'segment',
      x: 10,
      y: 20,
      w: 50,
      h: 50
    };

    const positions = Array.from({ length: 5 }, () => drawio.layoutNetworkDevice(devicePattern, 'Office', 'segment'));
    const boxes = positions.map((position) => aabb(devicePattern, position));
    const firstColumn = positions.slice(0, 4);
    const rowGaps = firstColumn.slice(1).map((position, index) => position.y - firstColumn[index].y);
    expect(new Set(positions.map(({ x, y }) => `${x}:${y}`)).size).toBe(positions.length);
    expect(firstColumn.every(({ x }) => x === firstColumn[0].x)).toBe(true);
    expect(new Set(rowGaps).size).toBe(1);
    expect(rowGaps[0]).toBeGreaterThanOrEqual(120);
    expect(positions[4].x).toBeGreaterThan(firstColumn[0].x);
    expect(boxes.every((box, index) => boxes.slice(index + 1).every((other) => !overlaps(box, other)))).toBe(true);

    expect(drawio.layoutNetworkDevice({ ...devicePattern, network_device_x: 170 }, 'Office', 'dmz'))
      .toEqual({ x: 170, y: 20 });
    expect(drawio.layoutMainProviderWan(mainPatterns.isp, 'Main Schema', 'internet'))
      .toEqual({ parentId: 'INTERNET', x: 30, y: 45 });

    drawio.addRenderedLink('Office', {
      xml: '<object id="{id}" label="{label}"><mxCell style="{style}" edge="1" source="{source_id}" target="{target_id}"/></object>',
      style: 'edgeStyle=orthogonalEdgeStyle;'
    }, { title: 'LAN', technology: 'Ethernet' }, 'source', 'target', 'link-1');

    expect(added[0].primaryVars.label).toBe('');
    expect(added[0].primaryVars.style).toBe('edgeStyle=orthogonalEdgeStyle;');
    expect(added[0].template.$).toEqual(expect.objectContaining({ title: 'LAN', technology: 'Ethernet' }));
  });

  it('keeps multi-network user-device connections intact after custom placement', () => {
    const added = [];
    const drawio = new Seaf2Drawio({}, {
      hasObject: () => false,
      addObject: (_page, object) => added.push(object)
    });
    const value = {
      title: 'User device',
      network_connection: ['network-a', 'network-b']
    };

    drawio.addOrUpdateObject(
      structuredClone(officePatterns.user_terminal),
      'Office',
      value,
      'user-device',
      structuredClone(officePatterns.user_terminal),
      { Office: ['network-a', 'network-b'] }
    );

    expect(added[0].primaryVars.network_connection).toEqual(['network-a', 'network-b']);
    expect(added[0].primaryVars.parent_id).toBe('network-a');
  });

  it('keeps source segment metadata when a network is rendered in a carrier layer', () => {
    const added = [];
    const drawio = new Seaf2Drawio({
      [SCHEMAS.NETWORK_SEGMENT]: {
        internet: { zone: 'INTERNET' }
      }
    }, {
      hasObject: () => false,
      addObject: (_page, object) => added.push(object)
    });

    drawio.addOrUpdateObject(
      structuredClone(mainPatterns.isp),
      'Main Schema',
      { title: 'Provider', segment: 'internet', schema: SCHEMAS.NETWORK },
      'provider',
      structuredClone(mainPatterns.isp),
      { 'Main Schema': ['internet'] }
    );

    expect(added[0].primaryVars.segment).toBe('internet');
    expect(added[0].renderVars.segment).toBe('INTERNET');
    expect(added[0].primaryVars.parent_id).toBe('INTERNET');
  });

  it('preserves source metadata and fallback placement through Diagram.generateXml', () => {
    const diagram = new Diagram({}, {});
    diagram.addDiagram('integration-page', 'Main Schema', `<diagram id="integration-page" name="Main Schema">
      <mxGraphModel><root>
        <mxCell id="0"/><mxCell id="1" parent="0"/>
        <mxCell id="003" parent="0"/><mxCell id="004" parent="0"/>
        <mxCell id="INTERNET" parent="003" vertex="1"><mxGeometry x="0" y="0" width="220" height="500" as="geometry"/></mxCell>
        <mxCell id="TRANSPORT-WAN" parent="004" vertex="1"><mxGeometry x="240" y="0" width="220" height="500" as="geometry"/></mxCell>
        <mxCell id="001" parent="0" vertex="1"><mxGeometry x="500" y="0" width="600" height="500" as="geometry"/></mxCell>
      </root></mxGraphModel>
    </diagram>`);
    const seaf = new Seaf2Drawio({
      [SCHEMAS.NETWORK_SEGMENT]: {
        internet: { title: 'Internet', zone: 'INTERNET', location: '001' },
        dmz: { title: 'DMZ', zone: 'DMZ', location: '001' }
      }
    }, diagram);
    const diagramIds = { 'Main Schema': ['001'] };
    const segmentPattern = (parent, type) => ({
      schema: SCHEMAS.NETWORK_SEGMENT,
      parent_id: 'location',
      type,
      x: 20,
      y: 20,
      w: 180,
      h: 400,
      xml: `<object id="{{id}}" label="{title}">
        <mxCell parent="${parent}" vertex="1"><mxGeometry x="{{x_pos}}" y="{{y_pos}}" width="{{width}}" height="{{height}}" as="geometry"/></mxCell>
      </object>`
    });
    const networkPattern = {
      schema: SCHEMAS.NETWORK,
      parent_id: 'segment',
      x: 20,
      y: 40,
      w: 120,
      h: 20,
      xml: `<object id="{{id}}" label="{title}">
        <mxCell parent="{parent_id}" vertex="1"><mxGeometry x="{{x_pos}}" y="{{y_pos}}" width="{{width}}" height="{{height}}" as="geometry"/></mxCell>
      </object>`
    };
    const servicePattern = {
      schema: SCHEMAS.KB,
      parent_id: 'network_connection',
      x: 20,
      y: 100,
      w: 60,
      h: 40,
      xml: `<object id="{{id}}" label="{title}">
        <mxCell parent="{parent_id}" vertex="1"><mxGeometry x="{{x_pos}}" y="{{y_pos}}" width="{{width}}" height="{{height}}" as="geometry"/></mxCell>
      </object>`
    };
    const add = (pattern, value, key) => seaf.addOrUpdateObject(
      pattern,
      'Main Schema',
      value,
      key,
      structuredClone(pattern),
      diagramIds
    );

    add(segmentPattern('003', 'zone:INTERNET'), { title: 'Internet', zone: 'INTERNET', location: '001' }, 'internet');
    add(segmentPattern('001', 'zone:DMZ'), { title: 'DMZ', zone: 'DMZ', location: '001' }, 'dmz');
    add(networkPattern, { title: 'External network', segment: 'internet' }, 'external-network');
    add(networkPattern, { title: 'Internal network', segment: 'dmz' }, 'internal-network');
    add(structuredClone(mainPatterns.isp), { title: 'Provider', provider: 'Provider', segment: 'internet' }, 'provider');
    add(servicePattern, {
      title: 'Mixed',
      technology: 'Mixed',
      schema: SCHEMAS.KB,
      network_connection: ['external-network', 'internal-network']
    }, 'mixed-service');
    add(servicePattern, {
      title: 'Unresolved',
      technology: 'Unresolved',
      schema: SCHEMAS.KB,
      network_connection: ['internal-network', 'missing-network']
    }, 'unresolved-service');
    add(servicePattern, {
      title: 'Carrier unresolved',
      technology: 'Carrier unresolved',
      schema: SCHEMAS.KB,
      network_connection: ['external-network', 'missing-network']
    }, 'carrier-unresolved-service');

    const document = new DOMParser().parseFromString(diagram.generateXml(), 'application/xml');
    const providerItem = Object.values(diagram.data['Main Schema'])
      .find((item) => item.primaryVars?.segment === 'internet' && item.renderVars?.segment === 'INTERNET');
    const mixedParent = document.querySelector('[id="mixed-service"] mxCell')?.getAttribute('parent');
    const unresolvedParent = document.querySelector('[id="unresolved-service"] mxCell')?.getAttribute('parent');
    const carrierUnresolvedParent = document.querySelector('[id="carrier-unresolved-service"] mxCell')?.getAttribute('parent');

    expect(providerItem.primaryVars.segment).toBe('internet');
    expect(providerItem.renderVars.segment).toBe('INTERNET');
    expect(document.querySelector('[id="provider_0"]')?.getAttribute('parent')).toBe('INTERNET');
    expect(mixedParent).toBe('tech_group_dmz_Mixed');
    expect(unresolvedParent).toBe('tech_group_dmz_Unresolved');
    expect(carrierUnresolvedParent).toBe('tech_group_internet_Carrier unresolved');
    expect(document.querySelector('[id="EXTERNAL-SERVICES"]')).toBeNull();
  });

  it('grows device row stride for taller patterns', () => {
    const drawio = new Seaf2Drawio({}, {});
    const base = {
      schema: SCHEMAS.COMPONENT_NETWORK,
      parent_id: 'segment',
      w: 50,
      h: 40,
      x: 170,
      y: 20,
      network_device_rows: 2,
      network_device_row_gap: 70
    };
    drawio.layoutNetworkDevice(base, 'Office', 'segment');
    drawio.layoutNetworkDevice(base, 'Office', 'segment');
    const tall = drawio.layoutNetworkDevice({ ...base, h: 100 }, 'Office', 'segment');
    const next = drawio.layoutNetworkDevice(base, 'Office', 'segment');

    expect(next.y).toBeGreaterThanOrEqual(tall.y + 100 + 20);
  });

  it('keeps Main Schema carrier devices inside visible segment containers', () => {
    const data = {
      [SCHEMAS.NETWORK_SEGMENT]: {
        internet: { zone: 'INTERNET' },
        transport: { zone: 'TRANSPORT-WAN' }
      }
    };
    const drawio = new Seaf2Drawio(data, {});
    const document = new DOMParser().parseFromString(MAIN_SCHEMA_XML, 'text/xml');

    for (const [segmentId, containerId, layerId, label] of [
      ['internet', 'INTERNET', '003', 'Internet'],
      ['transport', 'TRANSPORT-WAN', '004', 'Транспортная сеть']
    ]) {
      const position = drawio.layoutMainProviderWan(mainPatterns.isp, 'Main Schema', segmentId);
      const container = document.querySelector(`mxCell[id="${containerId}"]`);
      const geometry = container.querySelector('mxGeometry');
      const device = aabb(mainPatterns.isp, position);

      expect(position.parentId).toBe(containerId);
      expect(container.getAttribute('parent')).toBe(layerId);
      expect(container.getAttribute('value')).toBe(label);
      expect(container.getAttribute('style')).toContain('verticalAlign=top');
      expect(device).toEqual(expect.objectContaining({ left: 30, top: 45 }));
      expect(device.right).toBeLessThanOrEqual(Number(geometry.getAttribute('width')));
      expect(device.bottom).toBeLessThanOrEqual(Number(geometry.getAttribute('height')));
      expect(mainPatterns.isp.xml).toContain('parent="{parent_id}"');
      expect(mainPatterns.isp.xml).toContain('parent="{Group_ID}"');
    }

    expect(MAIN_SCHEMA_XML).not.toMatch(/id="0101"|id="0103"|rotation=270|shape=mxgraph\.basic\.oval/);
  });

  it('places mixed Office user devices in one compact non-overlapping grid', () => {
    const drawio = new Seaf2Drawio({}, {});
    const patterns = [
      officePatterns.user_arm,
      officePatterns.user_arm,
      officePatterns.user_mobile,
      officePatterns.user_terminal,
      officePatterns.user_printer
    ];
    const positions = patterns.map((pattern) => drawio.layoutUserDevice(pattern, 'Office', 'office-lan'));
    const boxes = patterns.map((pattern, index) => aabb(pattern, positions[index]));

    expect(positions).toEqual([
      { x: 320, y: 30 },
      { x: 440, y: 30 },
      { x: 560, y: 30 },
      { x: 680, y: 30 },
      { x: 320, y: 125 }
    ]);
    expect(new Set(positions.map(({ x, y }) => `${x}:${y}`)).size).toBe(positions.length);
    expect(boxes.every((box, index) => boxes.slice(index + 1).every((other) => !overlaps(box, other)))).toBe(true);
    expect(Math.max(...boxes.map(({ right }) => right))).toBeLessThanOrEqual(740);
  });

  it('keeps growing mixed network lanes outside the shared device band', () => {
    const makeLayout = () => {
      const drawio = new Seaf2Drawio({
        [SCHEMAS.NETWORK_SEGMENT]: { dmz: { zone: 'DMZ' } }
      }, {});
      const lanePatterns = Array.from({ length: 12 }, (_, index) => {
        return index % 2 ? dcPatterns.lan : dcPatterns.wan_edge;
      });
      const devicePatterns = [
        dcPatterns.wireless_controller,
        dcPatterns.firewall,
        dcPatterns.crypto_gateway,
        dcPatterns.vpn_gateway,
        dcPatterns.network_service,
        dcPatterns.router,
        dcPatterns.firewall
      ];
      const lanes = lanePatterns.map((pattern) => {
        return aabb(pattern, drawio.layoutNetworkConnection(pattern, 'Cloud.ru', 'dmz'));
      });
      const devices = devicePatterns.map((pattern) => {
        return aabb(pattern, drawio.layoutNetworkDevice(pattern, 'Cloud.ru', 'dmz'));
      });
      return { lanes, devices };
    };

    const first = makeLayout();
    const second = makeLayout();
    expect(first).toEqual(second);
    expect(new Set(first.lanes.map(({ left, top }) => `${left}:${top}`)).size).toBe(first.lanes.length);
    expect(new Set(first.devices.map(({ left, top }) => `${left}:${top}`)).size).toBe(first.devices.length);
    expect(first.lanes.every((box, index) => first.lanes.slice(index + 1)
      .every((other) => !overlaps(box, other)))).toBe(true);
    expect(first.devices.every((box, index) => first.devices.slice(index + 1)
      .every((other) => !overlaps(box, other)))).toBe(true);
    expect(first.lanes.every((lane) => first.devices.every((device) => !overlaps(lane, device)))).toBe(true);
    expect(Math.max(...first.lanes.map(({ right }) => right)))
      .toBeLessThan(Math.min(...first.devices.map(({ left }) => left)));
  });

  it.each([
    ['Office', mainPatterns.office.ext_page, officePatterns, 1060],
    ['DC', mainPatterns.dc.ext_page, dcPatterns, 1400]
  ])('%s pages use visible carrier containers and contain provider devices', (_page, pageXml, patterns, height) => {
    const document = new DOMParser().parseFromString(pageXml, 'text/xml');

    for (const [containerId, label, segmentPattern] of [
      ['003', 'Internet', patterns.segment_internet],
      ['004', 'Транспортная сеть', patterns.segment_transport_wan]
    ]) {
      const container = document.querySelector(`mxCell[id="${containerId}"]`);
      const containerGeometry = container.querySelector('mxGeometry');
      const segment = aabb(segmentPattern, { x: segmentPattern.x, y: segmentPattern.y });
      const provider = aabb(patterns.isp, { x: patterns.isp.x, y: patterns.isp.y });
      const router = aabb(patterns.router, { x: patterns.router.x, y: patterns.router.y });

      expect(container.getAttribute('parent')).toBe('0');
      expect(container.getAttribute('value')).toBe(label);
      expect(container.getAttribute('style')).toEqual(expect.stringContaining('verticalAlign=top'));
      expect(container.getAttribute('style')).not.toContain('noLabel=1');
      expect(Number(containerGeometry.getAttribute('width'))).toBe(160);
      expect(Number(containerGeometry.getAttribute('height'))).toBe(height);
      expect(segmentPattern.xml).toContain(`parent="${containerId}"`);
      expect(segmentPattern.xml).toContain('style="group;noLabel=1;"');
      expect(segmentPattern.xml).not.toContain('rotation=270');
      expect(segment).toEqual({ left: 0, top: 0, right: 160, bottom: height });
      expect(patterns.isp.xml).toContain('parent="{segment}"');
      expect(provider.top).toBeGreaterThanOrEqual(45);
      expect(provider.right).toBeLessThanOrEqual(segment.right);
      expect(provider.bottom).toBeLessThanOrEqual(segment.bottom);
      expect(patterns.router.xml).toContain('parent="{segment}"');
      expect(router.right).toBeLessThanOrEqual(segment.right);
      expect(router.bottom).toBeLessThanOrEqual(segment.bottom);
    }
  });

  it.each([
    ['Office', mainPatterns.office.ext_page, officePatterns, officePatterns.office_label],
    ['DC', mainPatterns.dc.ext_page, dcPatterns, dcPatterns.dc_label]
  ])('%s template preserves the managed-zone topology', (_page, pageXml, patterns, titlePattern) => {
    const document = new DOMParser().parseFromString(pageXml, 'text/xml');
    const locationGeometry = document.querySelector('mxCell[id="001"] mxGeometry');
    const location = {
      x: Number(locationGeometry.getAttribute('x')),
      y: Number(locationGeometry.getAttribute('y'))
    };
    const title = aabb(titlePattern, {
      x: location.x + titlePattern.x,
      y: location.y + titlePattern.y
    });

    for (const carrierId of ['003', '004']) {
      const geometry = document.querySelector(`mxCell[id="${carrierId}"] mxGeometry`);
      const carrier = {
        left: Number(geometry.getAttribute('x')),
        top: Number(geometry.getAttribute('y')),
        right: Number(geometry.getAttribute('x')) + Number(geometry.getAttribute('width')),
        bottom: Number(geometry.getAttribute('y')) + Number(geometry.getAttribute('height'))
      };
      expect(overlaps(title, carrier)).toBe(false);
    }

    const inet = aabb(patterns.segment_inet_edge, patterns.segment_inet_edge);
    const extWan = aabb(patterns.segment_ext_wan_edge, patterns.segment_ext_wan_edge);
    const dmz = aabb(patterns.segment_dmz, patterns.segment_dmz);
    const intWan = aabb(patterns['segment_int_wan-edge'], patterns['segment_int_wan-edge']);
    const intNet = aabb(patterns.segment_int_net, patterns.segment_int_net);
    const intSecurity = aabb(patterns.segment_int_security_net, patterns.segment_int_security_net);
    const zones = [
      [patterns.segment_inet_edge, 'zone:INET-EDGE'],
      [patterns.segment_ext_wan_edge, 'zone:EXT-WAN-EDGE'],
      [patterns.segment_dmz, 'zone:DMZ'],
      [patterns['segment_int_wan-edge'], 'zone:INT-WAN-EDGE'],
      [patterns.segment_int_net, 'zone:INT-NET'],
      [patterns.segment_int_security_net, 'zone:INT-SECURITY-NET']
    ];
    for (const [pattern, type] of zones) {
      expect(pattern.xml).toContain('parent="001"');
      expect(pattern.type).toBe(type);
    }
    expect(inet.left).toBe(0);
    expect(inet.left).toBe(extWan.left);
    expect(inet.right).toBe(extWan.right);
    expect(inet.bottom).toBeLessThanOrEqual(extWan.top);
    expect(dmz.top).toBe(0);
    expect(dmz.left).toBeGreaterThanOrEqual(Math.max(inet.right, extWan.right));
    expect(overlaps(extWan, dmz)).toBe(false);
    expect(intWan.top).toBeGreaterThanOrEqual(dmz.bottom);
    expect(intNet.left).toBeGreaterThanOrEqual(Math.max(dmz.right, intWan.right));
    expect(intSecurity.left).toBeGreaterThanOrEqual(intNet.right);
  });

  it('uses the same exact zone IDs in static topology and layout rules', () => {
    expect(LAYOUT_ZONE_RULES['INET-EDGE'].neighbors_right_zones).toEqual(['DMZ']);
    expect(LAYOUT_ZONE_RULES.DMZ.stack_below_zones).toEqual(['INT-WAN-EDGE']);
    expect(LAYOUT_ZONE_RULES.DMZ.neighbors_right_zones).toEqual(['INT-NET']);
    expect(LAYOUT_ZONE_RULES['INT-NET'].neighbors_right_zones).toEqual(['INT-SECURITY-NET']);
  });

  it.each([
    ['DC', dcPatterns],
    ['Office', officePatterns]
  ])('%s keeps a real FPSU gateway AABB outside the neighboring firewall/service group', (page, patterns) => {
    const fpsu = { title: 'FPSU-1', type: 'Криптошлюз' };
    const matchingPatterns = Object.entries(patterns)
      .filter(([, pattern]) => pattern.schema === SCHEMAS.COMPONENT_NETWORK
        && matchesType(fpsu, pattern.type)
        && matchesPatternFilters('fpsu-1', fpsu, pattern))
      .map(([name]) => name);
    expect(matchingPatterns).toContain('crypto_gateway');
    expect(matchingPatterns).not.toContain('fpsu');

    const drawio = new Seaf2Drawio({
      [SCHEMAS.NETWORK_SEGMENT]: { dmz: { zone: 'DMZ' } }
    }, {});
    const neighboringBoxes = Array.from({ length: 5 }, () => {
      return aabb(patterns.firewall, drawio.layoutNetworkDevice(patterns.firewall, page, 'dmz'));
    });
    neighboringBoxes.push(
      aabb(patterns.network_service, drawio.layoutNetworkDevice(patterns.network_service, page, 'dmz'))
    );
    const fpsuBox = aabb(
      patterns.crypto_gateway,
      drawio.layoutNetworkDevice(patterns.crypto_gateway, page, 'dmz')
    );

    expect(neighboringBoxes.some((box) => overlaps(fpsuBox, box))).toBe(false);
  });

  it.each(['Main Schema', 'Cloud.ru', 'Office'])('%s keeps provider groups inside page-local carrier containers', (page) => {
    const added = [];
    const data = {
      [SCHEMAS.NETWORK_SEGMENT]: {
        internet: { zone: 'INTERNET' },
        transport: { zone: 'TRANSPORT-WAN' }
      }
    };
    const diagram = {
      hasObject: () => false,
      addObject: (_page, object) => added.push(object)
    };
    const drawio = new Seaf2Drawio(data, diagram);
    const providerPattern = {
      xml: '<mxCell id="{{id}}" parent="{segment}" vertex="1"><mxGeometry x="{{x_pos}}" y="{{y_pos}}" width="{{width}}" height="{{height}}"/></mxCell>',
      schema: SCHEMAS.NETWORK,
      parent_id: 'segment',
      type: 'type:WAN',
      require_fields: ['provider'],
      x: 510,
      y: -450,
      w: 110,
      h: 60,
      algo: 'Y+'
    };
    const diagramIds = { [page]: ['internet', 'transport'] };

    drawio.addOrUpdateObject(
      structuredClone(providerPattern),
      page,
      { title: 'ISP', type: 'WAN', provider: 'Carrier', segment: 'internet' },
      'isp',
      structuredClone(providerPattern),
      diagramIds
    );
    const internet = added[0];
    const internetParent = page === 'Main Schema' ? 'INTERNET' : '003';
    const transportParent = page === 'Main Schema' ? 'TRANSPORT-WAN' : '004';
    expect(internet.primaryVars).toEqual(expect.objectContaining({
      parent_id: internetParent,
      segment: 'internet'
    }));
    expect(internet.secondaryVars).toEqual(expect.objectContaining({ x_pos: 40, y_pos: 45 }));

    const transportPositions = Array.from({ length: 10 }, () => {
      return drawio.layoutMainProviderWan(providerPattern, page, 'transport');
    });
    expect(transportPositions.every(({ parentId, x, y }) => {
      return parentId === transportParent && x >= 0 && y >= 45 && y + providerPattern.h <= 590;
    })).toBe(true);
  });
});
