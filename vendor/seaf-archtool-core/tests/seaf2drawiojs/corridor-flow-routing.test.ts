/**
 * @jest-environment jsdom
 */

import { describe, expect, it } from '@jest/globals';

import { replaceDiagramPage, routeCorridorPage, splitDiagramPages } from '../../plugins/seaf2drawiojs/lib/corridor-routing';
function edgeXml(id: string, schema: string, parent: string): string {
  return `<object id="${id}" schema="${schema}"><mxCell edge="1" parent="${parent}" source="source" target="target" style="edgeStyle=orthogonalEdgeStyle;dashed=1;"><mxGeometry relative="1" as="geometry"/></mxCell></object>`;
}

describe('corridor routing geometry', () => {
  it('replaces the eleventh page without changing the other pages', () => {
    const xml = `<mxfile>${Array.from({ length: 11 }, (_, index) =>
      `<diagram id="${index + 1}"><mxGraphModel><root><mxCell id="0"/></root></mxGraphModel></diagram>`).join('')}</mxfile>`;
    const pages = splitDiagramPages(xml);
    const lastPage = pages[10].replace('id="11"', 'id="routed-11"');
    const document = new DOMParser().parseFromString(replaceDiagramPage(xml, 10, lastPage), 'application/xml');
    expect(document.querySelectorAll('mxfile > diagram')).toHaveLength(11);
    expect(document.querySelector('mxfile > diagram:first-child').getAttribute('id')).toBe('1');
    expect(document.querySelector('mxfile > diagram:last-child').getAttribute('id')).toBe('routed-11');
  });

  it('routes logical links without rewriting physical Connections', async() => {
    const input = `<mxfile><diagram><mxGraphModel><root>
      <mxCell id="0"/><mxCell id="1" parent="0"/>
      <mxCell id="logical" value="Logical" parent="0"/>
      <mxCell id="connections" value="Connections" parent="0"/>
      <object id="source" schema="seaf.company.ta.services.kbs"><mxCell vertex="1" parent="1"><mxGeometry x="0" y="0" width="40" height="40" as="geometry"/></mxCell></object>
      <object id="target" schema="seaf.company.ta.services.kbs"><mxCell vertex="1" parent="1"><mxGeometry x="240" y="160" width="40" height="40" as="geometry"/></mxCell></object>
      ${edgeXml('logical.edge', 'seaf.company.ta.services.logical_links', 'logical')}
      ${edgeXml('connection.edge', 'seaf.company.ta.services.compute_services', 'connections')}
    </root></mxGraphModel></diagram></mxfile>`;
    const result = await routeCorridorPage(input);
    const document = new DOMParser().parseFromString(result.xml, 'application/xml');
    const logical = document.querySelector('object[id="logical.edge"] > mxCell');
    const connection = document.querySelector('object[id="connection.edge"] > mxCell');

    expect(result.diagnostics.routedEdges).toBe(1);
    expect(logical.getAttribute('style')).toContain('edgeStyle=none');
    expect(connection.getAttribute('style')).toContain('edgeStyle=orthogonalEdgeStyle');
    expect(connection.querySelector('Array[as="points"]')).toBeNull();
  });
});
