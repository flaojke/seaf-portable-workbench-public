/**
 * @jest-environment jsdom
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';

import dcPatterns from '../../plugins/seaf2drawiojs/patterns/dc.json';
import mainPatterns from '../../plugins/seaf2drawiojs/patterns/main.json';
import officePatterns from '../../plugins/seaf2drawiojs/patterns/office.json';
import { MAIN_SCHEMA_XML, SCHEMAS } from '../../plugins/seaf2drawiojs/lib/constants';
import { layoutSettingsFromProfile } from '../../plugins/seaf2drawiojs/lib/layout-settings';
import {
  buildLogicalLinkSteps,
  buildNetworkGraph,
  computedRouteLayerForTag,
  logicalRouteSettings
} from '../../plugins/seaf2drawiojs/lib/logical-routing';
import { getSchemaData } from '../../plugins/seaf2drawiojs/lib/utils';
import {
  analyzeGeneratedXml,
  collectExpectedPatternObjects,
  createVerificationState,
  excludeCommonOnlyLogicalLinksFromVerification,
  logPendingMissingLinks,
  logVerificationReport
} from '../../plugins/seaf2drawiojs/lib/verification';

import crossPageLogicalLink from './fixtures/negative/cross-page-logical-link.json';
import missingLinkEndpoint from './fixtures/negative/missing-link-endpoint.json';
import missingParent from './fixtures/negative/missing-parent.json';
import unknownTopology from './fixtures/negative/unknown-topology.json';
import successMinimal from './fixtures/success/minimal.json';

const routeLayoutSettings = {
  logical_links: {
    computed_routes: {
      enabled: true,
      show_intermediate: true
    }
  }
};

const defaultRouteLayoutSettings = {
  logical_links: {
    computed_routes: {
      enabled: true,
      show_intermediate: true,
      route_mode: 'shortest'
    }
  }
};

const routedLogicalLinkData = {
  [SCHEMAS.NETWORK]: {
    'net.a': { title: 'LAN A' },
    'net.b': { title: 'LAN B' }
  },
  [SCHEMAS.COMPONENT_NETWORK]: {
    'aa.hidden.transit': {
      title: 'Hidden transit',
      network_connection: ['net.a', 'net.b']
    },
    'router.1': {
      title: 'Router',
      network_connection: ['net.a', 'net.b']
    }
  },
  [SCHEMAS.COMPUTE_SERVICE]: {
    'service.a': {
      title: 'Service A',
      network_connection: 'net.a'
    },
    'service.b': {
      title: 'Service B',
      network_connection: 'net.b'
    }
  },
  [SCHEMAS.LOGICAL_LINK]: {
    'link.route': {
      title: 'Routed link',
      source: 'service.a',
      target: ['service.b'],
      direction: '==>',
      route_mode: 'shortest'
    },
    'link.chain.route': {
      title: 'Routed chain link',
      source: 'service.a',
      target: ['router.1', 'service.b'],
      direction: '==>',
      topology: 'chain',
      route_mode: 'shortest'
    }
  }
};

function createLogger() {
  const calls = [];
  const logger = {};
  for (const level of ['debug', 'info', 'warn', 'error']) {
    logger[level] = (messageFactory, error) => {
      calls.push({
        level,
        value: typeof messageFactory === 'function' ? messageFactory() : messageFactory,
        error
      });
    };
  }
  return {
    logger,
    calls,
    text: () => JSON.stringify(calls)
  };
}

function drawioXml(pageName, objects) {
  return `<mxfile><diagram name="${pageName}"><mxGraphModel><root>${objects.join('')}</root></mxGraphModel></diagram></mxfile>`;
}

function objectXml(id, schema) {
  return `<object id="${id}" schema="${schema}" label="${id}"><mxCell vertex="1" parent="1" /></object>`;
}

describe('seaf2drawiojs verification logging', () => {
  afterEach(() => {
    delete global.DocHub;
    jest.resetModules();
  });

  it('reports missing pattern object with parent diagnostics', () => {
    const { logger, text } = createLogger();
    const state = createVerificationState();
    const objectData = getSchemaData(missingParent, SCHEMAS.COMPONENT_NETWORK);

    collectExpectedPatternObjects(
      state,
      'network_switch',
      { schema: SCHEMAS.COMPONENT_NETWORK, parent_id: 'segment', type: 'type:switch' },
      objectData
    );

    const report = analyzeGeneratedXml(
      drawioXml('Office', [objectXml('segment.office', SCHEMAS.NETWORK_SEGMENT)]),
      state
    );
    logVerificationReport(report, logger);

    expect(report.allMatch).toBe(false);
    expect(report.summary).toContainEqual({
      schema: SCHEMAS.COMPONENT_NETWORK,
      expected: 1,
      drawn_unique: 0,
      drawn_total: 0,
      status: 'MISMATCH'
    });
    expect(text()).toContain('device.missing.parent');
    expect(text()).toContain('parent \'segment\' not present on pages');
  });

  it('warns about a skipped link only when an endpoint is absent globally', () => {
    const { logger, text } = createLogger();
    const link = getSchemaData(missingLinkEndpoint, SCHEMAS.LOGICAL_LINK)['link.missing'];

    const result = logPendingMissingLinks([
      {
        type: 'logical',
        pageName: 'Office',
        linkOid: 'link.missing',
        sourceId: link.source,
        targetId: link.target,
        topology: link.topology,
        reason: 'endpoint_missing_on_page'
      }
    ], { Office: ['segment.office', 'device.source'] }, logger);

    expect(result.missing).toHaveLength(1);
    expect(result.deferred).toHaveLength(0);
    expect(text()).toContain('skipped 1 links because endpoints are missing on all pages');
    expect(text()).toContain('link.missing');
    expect(text()).toContain('device.absent');
  });

  it('logs cross-page logical links as common-page processing without false warn', () => {
    const { logger, calls, text } = createLogger();
    const state = createVerificationState();
    const logicalLinks = getSchemaData(crossPageLogicalLink, SCHEMAS.LOGICAL_LINK);
    const diagramIds = {
      Office: ['segment.office', 'device.office'],
      DC: ['segment.dc', 'device.dc']
    };

    collectExpectedPatternObjects(
      state,
      'logical_links_1',
      { schema: SCHEMAS.LOGICAL_LINK, targets: 'target' },
      logicalLinks
    );

    const commonOnly = excludeCommonOnlyLogicalLinksFromVerification(state, crossPageLogicalLink, diagramIds, logger);
    const pendingResult = logPendingMissingLinks([
      {
        type: 'logical',
        pageName: 'Office',
        linkOid: 'link.cross',
        sourceId: 'device.office',
        targetId: 'device.dc',
        topology: 'star',
        reason: 'endpoint_missing_on_page'
      }
    ], diagramIds, logger);

    expect(commonOnly).toEqual(['link.cross']);
    expect(state.expectedCounts[SCHEMAS.LOGICAL_LINK].has('link.cross')).toBe(false);
    expect(pendingResult.missing).toHaveLength(0);
    expect(pendingResult.deferred).toHaveLength(1);
    expect(calls.some((call) => call.level === 'warn')).toBe(false);
    expect(text()).toContain('common page only');
    expect(text()).toContain('deferred to the common page');
  });

  it('warns about unknown logical link topology and falls back to star', async() => {
    const { logger, calls } = createLogger();
    global.DocHub = {
      documents: {
        getLoggerWithTag: jest.fn(() => logger)
      }
    };
    const { Seaf2Drawio } = await import('../../plugins/seaf2drawiojs/lib/seaf-drawio');
    const drawio = new Seaf2Drawio({}, {});
    const linkData = { ...getSchemaData(unknownTopology, SCHEMAS.LOGICAL_LINK)['link.unknown'] };

    const steps = drawio.logicalLinkSteps('link.unknown', linkData, { targets: 'target' }, 'Office');

    expect(steps).toHaveLength(1);
    expect(linkData.topology).toBe('star');
    expect(calls).toContainEqual(expect.objectContaining({
      level: 'warn',
      value: expect.stringContaining('unknown topology "mesh", using star')
    }));
  });

  it('expands opted-in logical link into shortest route segments', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'] };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: routeLayoutSettings,
      graph: buildNetworkGraph(routedLogicalLinkData),
      allowedNodeIds: ['service.a', 'net.a', 'router.1', 'net.b', 'service.b']
    });

    expect(steps.map((step) => [step.sourceId, step.targetId])).toEqual([
      ['service.a', 'net.a'],
      ['net.a', 'router.1'],
      ['router.1', 'net.b'],
      ['net.b', 'service.b']
    ]);
    expect(steps.every((step) => step.computedRoute)).toBe(true);
    expect(steps[0].routePath).toBe('service.a -> net.a -> router.1 -> net.b -> service.b');
  });

  it('uses document-level default route mode when link route mode is absent', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'] };
    delete linkData.route_mode;
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: defaultRouteLayoutSettings,
      allowedNodeIds: ['service.a', 'net.a', 'router.1', 'net.b', 'service.b']
    });

    expect(logicalRouteSettings(defaultRouteLayoutSettings).routeMode).toBe('shortest');
    expect(steps.map((step) => [step.sourceId, step.targetId])).toEqual([
      ['service.a', 'net.a'],
      ['net.a', 'router.1'],
      ['router.1', 'net.b'],
      ['net.b', 'service.b']
    ]);
    expect(steps.every((step) => step.computedRoute)).toBe(true);
  });

  it('lets link route mode override document-level default route mode', () => {
    const linkData = {
      ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'],
      route_mode: 'direct'
    };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: defaultRouteLayoutSettings
    });

    expect(steps).toEqual([expect.objectContaining({
      sourceId: 'service.a',
      targetId: 'service.b',
      computedRoute: false
    })]);
  });

  it('merges document profile layout settings with source-returned overrides', () => {
    const profile = {
      layout_settings: {
        common_location_page: true,
        logical_links: {
          computed_routes: {
            enabled: true,
            route_mode: 'shortest',
            fallback: 'skip'
          }
        }
      }
    };
    const data = {
      layout_settings: {
        logical_links: {
          computed_routes: {
            fallback: 'direct'
          }
        }
      }
    };

    expect(layoutSettingsFromProfile(profile, data)).toEqual({
      common_location_page: true,
      logical_links: {
        computed_routes: {
          enabled: true,
          route_mode: 'shortest',
          fallback: 'direct'
        }
      }
    });
  });

  it('expands routes through visible nodes when intermediate rendering is enabled', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'] };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: routeLayoutSettings,
      allowedNodeIds: ['service.a', 'net.a', 'router.1', 'net.b', 'service.b']
    });

    expect(steps.map((step) => [step.sourceId, step.targetId])).toEqual([
      ['service.a', 'net.a'],
      ['net.a', 'router.1'],
      ['router.1', 'net.b'],
      ['net.b', 'service.b']
    ]);
    expect(steps.some((step) => step.sourceId === 'aa.hidden.transit' || step.targetId === 'aa.hidden.transit')).toBe(false);
  });

  it('keeps computed route collapsed when intermediate rendering is disabled', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'] };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: {
        logical_links: {
          computed_routes: {
            enabled: true,
            show_intermediate: false
          }
        }
      }
    });

    expect(steps).toHaveLength(1);
    expect(steps[0]).toEqual(expect.objectContaining({
      sourceId: 'service.a',
      targetId: 'service.b',
      computedRoute: true,
      routeExpanded: false,
      routeSegmentCount: 4
    }));
  });

  it('marks unresolved direct fallback as a computed route attempt', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'] };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: routeLayoutSettings,
      allowedNodeIds: ['service.a', 'service.b']
    });

    expect(steps).toEqual([expect.objectContaining({
      sourceId: 'service.a',
      targetId: 'service.b',
      computedRoute: true,
      routeExpanded: false,
      routeFailed: true,
      routeSourceId: 'service.a',
      routeTargetId: 'service.b',
      routeSegmentCount: 1
    })]);
  });

  it('treats chain topology as ordered waypoints in shortest route mode', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.chain.route'] };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.chain.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: routeLayoutSettings
    });

    expect(steps.map((step) => [step.sourceId, step.targetId])).toEqual([
      ['service.a', 'net.a'],
      ['net.a', 'router.1'],
      ['router.1', 'net.b'],
      ['net.b', 'service.b']
    ]);
    expect(steps.map((step) => step.routeTargetId)).toEqual([
      'router.1',
      'router.1',
      'service.b',
      'service.b'
    ]);
  });

  it('does not compute shortest route without document-level opt-in', () => {
    const linkData = { ...routedLogicalLinkData[SCHEMAS.LOGICAL_LINK]['link.route'] };
    const steps = buildLogicalLinkSteps({
      linkOid: 'link.route',
      linkData,
      targetsKey: 'target',
      pageName: 'Office',
      sourceData: routedLogicalLinkData,
      layoutSettings: {}
    });

    expect(logicalRouteSettings({}).enabled).toBe(false);
    expect(logicalRouteSettings({}).layerLabel).toBe('Расчетные связи');
    expect(logicalRouteSettings({}).layerId).toBe('layer.logical.computed.routes');
    expect(computedRouteLayerForTag(logicalRouteSettings({}), 'VPN')).toEqual({
      layerId: 'layer.logical.computed.vpn.routes',
      layerLabel: 'VPN рассчитанные связи',
      layerHidden: true
    });
    expect(computedRouteLayerForTag(logicalRouteSettings({
      logical_links: {
        computed_routes: {
          layer_hidden: false
        }
      }
    }), 'VPN')).toEqual({
      layerId: 'layer.logical.computed.vpn.routes',
      layerLabel: 'VPN рассчитанные связи',
      layerHidden: false
    });
    expect(steps).toEqual([expect.objectContaining({
      sourceId: 'service.a',
      targetId: 'service.b',
      computedRoute: false
    })]);
  });

  it('logs OK summary for a successful minimal dataset without missing warnings', () => {
    const { logger, calls, text } = createLogger();
    const state = createVerificationState();
    const objectData = getSchemaData(successMinimal, SCHEMAS.NETWORK_SEGMENT);

    collectExpectedPatternObjects(
      state,
      'segment_int_net',
      { schema: SCHEMAS.NETWORK_SEGMENT, parent_id: 'location', type: 'zone:INT-NET' },
      objectData
    );

    const report = analyzeGeneratedXml(
      drawioXml('Office', [objectXml('segment.office', SCHEMAS.NETWORK_SEGMENT)]),
      state
    );
    logVerificationReport(report, logger);

    expect(report.allMatch).toBe(true);
    expect(report.drawn).toEqual({
      [SCHEMAS.NETWORK_SEGMENT]: ['segment.office']
    });
    expect(report.summary).toContainEqual({
      schema: SCHEMAS.NETWORK_SEGMENT,
      expected: 1,
      drawn_unique: 1,
      drawn_total: 1,
      status: 'OK'
    });
    expect(calls.some((call) => call.level === 'warn')).toBe(false);
    expect(text()).toContain('GENERATION MATCHES YAML (by schema)');
  });
});

describe('seaf2drawiojs built-in DrawIO templates', () => {
  it('uses readable native silhouettes for office user devices', () => {
    const patterns = [officePatterns.user_arm, officePatterns.user_mobile, officePatterns.user_terminal];

    for (const pattern of patterns) {
      expect(pattern.xml).toContain('font-size:9px');
      expect(pattern.xml).not.toMatch(/data:image|image=img\/lib|shape=stencil/);
    }
    expect(officePatterns.user_arm.xml).toContain('shape=trapezoid');
    expect(officePatterns.user_mobile.xml).toContain('width="26" height="40"');
    expect(officePatterns.user_terminal.xml).toContain('width="46" height="28"');
    for (const patterns of [officePatterns, dcPatterns]) {
      expect(patterns.user_arm.xml).toContain(
        'verticalLabelPosition=bottom;verticalAlign=top;align=center;spacingTop=12;labelWidth=110;'
      );
      expect(patterns.user_arm.xml).not.toContain('padding-top:');
    }
  });

  it('wraps WAF labels within the external-service slot', () => {
    for (const patterns of [officePatterns, dcPatterns]) {
      expect(patterns.waf.xml).toContain('html=1;whiteSpace=wrap;labelWidth=110;');
    }
  });

  it('uses one deterministic user-device grid origin for every page and device type', () => {
    for (const patterns of [officePatterns, dcPatterns]) {
      const userDevices = Object.values(patterns)
        .filter((pattern) => pattern.schema === SCHEMAS.COMPONENT_USER_DEVICE
          && pattern.parent_id === 'network_connection');

      expect(userDevices.length).toBeGreaterThan(1);
      expect(new Set(userDevices.map((pattern) => `${pattern.user_device_x}:${pattern.user_device_y}`)))
        .toEqual(new Set(['320:30']));
    }
  });

  it('open every generated page without grid, page view, or shadow', () => {
    for (const xml of [MAIN_SCHEMA_XML, mainPatterns.office.ext_page, mainPatterns.dc.ext_page]) {
      expect(xml).toContain('grid="0"');
      expect(xml).toContain('page="0"');
      expect(xml).toContain('shadow="0"');
    }
  });

  it('do not contain hardcoded Sber organization layers', () => {
    const templates = [
      MAIN_SCHEMA_XML,
      mainPatterns.office.ext_page,
      mainPatterns.dc.ext_page
    ];

    for (const xml of templates) {
      expect(xml).not.toContain('value="Сбербанк"');
      expect(xml).not.toContain('value="Экосистема Сбер"');
      expect(xml).not.toContain('label="Сбербанк"');
      expect(xml).not.toContain('label="Экосистема Сбер"');
      expect(xml).not.toContain('id="98"');
      expect(xml).not.toContain('id="99"');
      expect(xml).not.toContain('id="981"');
      expect(xml).not.toContain('id="991"');
      expect(xml).not.toContain('parent="98"');
      expect(xml).not.toContain('parent="99"');
    }
  });

  it('do not contain the legacy External Net root layer', () => {
    const templates = [
      mainPatterns.office.ext_page,
      mainPatterns.dc.ext_page
    ];

    for (const xml of templates) {
      expect(xml).not.toContain('value="External Net"');
      expect(xml).not.toContain('id="002"');
    }
  });

  it('do not contain the legacy Links root layer', () => {
    const templates = [
      MAIN_SCHEMA_XML,
      mainPatterns.office.ext_page,
      mainPatterns.dc.ext_page,
      dcPatterns.logical_links_1.xml
    ];

    for (const xml of templates) {
      expect(xml).not.toContain('value="Links"');
      expect(xml).not.toContain('id="104"');
      expect(xml).not.toContain('parent="104"');
    }
  });

});
