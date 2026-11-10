/**
 * @jest-environment jsdom
 */

import { afterEach, describe, expect, it, jest } from '@jest/globals';

describe('seaf2drawiojs diagram diff', () => {
  afterEach(() => {
    delete global.DocHub;
    jest.resetModules();
  });

  it('exports changes for elements without mxGeometry', async() => {
    const logger = {
      debug: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn()
    };
    global.DocHub = {
      documents: {
        getLoggerWithTag: jest.fn(() => logger)
      }
    };
    const { default: Diagram } = await import('../../plugins/seaf2drawiojs/lib/diagram');
    const element = new DOMParser()
      .parseFromString('<mxCell id="layer" />', 'application/xml')
      .documentElement;
    const saved = element.cloneNode(true);
    saved.setAttribute('visible', '0');

    expect(new Diagram({}, {}).getElementDiff(element, saved)).toEqual({
      visible: { new: '0', old: null }
    });
  });

  it('does not add logical-link cell style diffs to vertex or physical edge wrappers', async() => {
    global.DocHub = {
      documents: { getLoggerWithTag: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }) }
    };
    const { default: Diagram } = await import('../../plugins/seaf2drawiojs/lib/diagram');
    const diagram = new Diagram({}, {});
    for (const cellAttrs of ['vertex="1"', 'edge="1"']) {
      const element = new DOMParser().parseFromString(
        `<object id="physical"><mxCell ${cellAttrs} style="old" /></object>`, 'application/xml'
      ).documentElement;
      const saved = element.cloneNode(true);
      saved.querySelector('mxCell').setAttribute('style', 'new');

      expect(diagram.getElementDiff(element, saved)).toBeNull();
    }
  });

  it('does not export an empty Common page for a document without logical links', async() => {
    global.DocHub = {
      documents: { getLoggerWithTag: () => ({ debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() }) }
    };
    const { default: Diagram } = await import('../../plugins/seaf2drawiojs/lib/diagram');
    const diagram = new Diagram({}, {});
    diagram.indices.main = {};
    const xml = '<mxfile><diagram id="main"><root /></diagram><diagram id="common_location_page"><root /></diagram></mxfile>';

    expect(diagram.getDiff(xml)).toEqual({ main: [] });
  });
});
