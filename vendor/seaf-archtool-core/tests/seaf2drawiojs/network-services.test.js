/**
 * @jest-environment jsdom
 */

import { beforeAll, describe, expect, it, jest } from '@jest/globals';

import dcPatterns from '../../plugins/seaf2drawiojs/patterns/dc.json';
import officePatterns from '../../plugins/seaf2drawiojs/patterns/office.json';
import { SCHEMAS } from '../../plugins/seaf2drawiojs/lib/constants';

const SERVICE_ID = 'service.cluster';

function serviceData(secondSegment = 'segment.b') {
  return {
    [SCHEMAS.DC]: {
      'dc.a': { title: 'Data center A' },
      'dc.b': { title: 'Data center B' }
    },
    [SCHEMAS.NETWORK]: {
      'net.service': { segment: ['segment.a', 'segment.b'] },
      'net.remote': { segment: 'segment.b' },
      'net.member': { segment: 'segment.member' }
    },
    [SCHEMAS.NETWORK_SERVICE]: {
      [SERVICE_ID]: {
        title: 'Network cluster',
        network_connection: ['net.service'],
        high_availability: { mode: 'Active-Passive' }
      }
    },
    [SCHEMAS.COMPONENT_NETWORK]: {
      'node.a': {
        title: 'Node A',
        model: 'Model A',
        location: 'dc.a',
        segment: 'segment.a',
        network_connection: ['net.remote', 'net.member'],
        is_part_of: SERVICE_ID
      },
      'node.b': {
        title: 'Node B',
        model: 'Model B',
        location: 'dc.b',
        segment: secondSegment,
        is_part_of: [SERVICE_ID]
      },
      'node.invalid': {
        title: 'Invalid member reference',
        network_connection: ['net.member'],
        is_part_of: 'service.missing'
      }
    }
  };
}

describe('R41 network services', () => {
  let Seaf2Drawio;

  beforeAll(async() => {
    global.DocHub = {
      documents: {
        getLoggerWithTag: jest.fn(() => ({
          debug: jest.fn(),
          info: jest.fn(),
          warn: jest.fn(),
          error: jest.fn()
        }))
      }
    };
    ({ Seaf2Drawio } = await import('../../plugins/seaf2drawiojs/lib/seaf-drawio'));
  });

  it('replaces only valid members with a cloned service view', () => {
    const data = serviceData();
    const drawio = new Seaf2Drawio(data, {});

    expect(Object.keys(drawio.getObjectsBySchema(SCHEMAS.COMPONENT_NETWORK))).toEqual(['node.invalid']);

    const view = drawio.getObjectsBySchema(SCHEMAS.NETWORK_SERVICE)[SERVICE_ID];
    expect(view).not.toBe(data[SCHEMAS.NETWORK_SERVICE][SERVICE_ID]);
    expect(view).toEqual(expect.objectContaining({
      members_count: 2,
      members_local_count: 2,
      network_connection: ['net.service'],
      ha_mode: 'Active-Passive'
    }));
    expect(view.members).toContain('Node A — Model A — Data center A');
    expect(view.members).toContain('Node B — Model B — Data center B');
    expect(view).not.toHaveProperty('tooltip');
    expect(data[SCHEMAS.NETWORK_SERVICE][SERVICE_ID]).not.toHaveProperty('tooltip');
    expect(view.network_connection).not.toContain('net.member');
    expect(view.render_segment).toEqual(expect.arrayContaining(['segment.a', 'segment.b']));
    expect(view.render_segment).not.toContain('segment.member');
  });

  it('adds local/total fraction only to a stretched service projection', () => {
    const stretched = new Seaf2Drawio(serviceData(), {});

    expect(stretched.networkServiceView(
      SERVICE_ID,
      stretched.data[SCHEMAS.NETWORK_SERVICE][SERVICE_ID],
      ['dc.a', 'segment.a']
    )).toEqual(expect.objectContaining({
      title: 'Network cluster · 1/2',
      members_local_count: 1,
      members_count: 2
    }));
    const pageB = stretched.networkServiceView(
      SERVICE_ID,
      stretched.data[SCHEMAS.NETWORK_SERVICE][SERVICE_ID],
      ['dc.b', 'segment.b', 'net.remote']
    );
    expect(pageB).toEqual(expect.objectContaining({
      title: 'Network cluster · 1/2',
      members_local_count: 1
    }));
    expect(pageB.members).not.toContain('Node A — Model A — Data center A [локально]');
    expect(pageB.members).toContain('Node B — Model B — Data center B [локально]');

    const local = new Seaf2Drawio(serviceData('segment.a'), {});
    expect(local.networkServiceView(
      SERVICE_ID,
      local.data[SCHEMAS.NETWORK_SERVICE][SERVICE_ID],
      ['segment.a']
    )).toEqual(expect.objectContaining({
      title: 'Network cluster',
      members_local_count: 2,
      members_count: 2
    }));
  });

  it('redirects logical-link endpoints from hidden members to their rendered service', () => {
    const added = [];
    const data = serviceData();
    data[SCHEMAS.LOGICAL_LINK] = {
      'link.member': { source: 'node.a', target: ['node.invalid'] }
    };
    const drawio = new Seaf2Drawio(data, {
      addLinks: (_page, link) => added.push(link)
    });
    drawio.addLinks({
      xml: '<object id="{id}"><mxCell edge="1" source="{source_id}" target="{target_id}"/></object>',
      schema: SCHEMAS.LOGICAL_LINK,
      targets: 'target'
    }, 'Office', { Office: [SERVICE_ID, 'node.invalid'] }, { logical_link: true }, []);

    expect(added[0].primaryVars).toEqual(expect.objectContaining({
      source: SERVICE_ID,
      target: 'node.invalid'
    }));
  });

  it.each([
    ['dc', dcPatterns],
    ['office', officePatterns]
  ])('%s pattern has one service node and an explicit network link', (name, patterns) => {
    expect(patterns.network_service).toEqual(expect.objectContaining({
      schema: SCHEMAS.NETWORK_SERVICE,
      parent_id: 'render_segment'
    }));
    expect(patterns.network_service.xml).toContain('mxgraph.aws4.cluster');
    expect(patterns.network_service.xml).toContain('parent="{parent_id}"');
    expect(patterns.network_service.xml).not.toContain('parent="{render_segment}"');
    expect(patterns.network_links_10).toEqual(expect.objectContaining({
      schema: SCHEMAS.NETWORK_SERVICE,
      targets: 'network_connection'
    }));
  });
});
