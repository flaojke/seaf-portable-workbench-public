import { describe, expect, it } from '@jest/globals';
import { routingIssueMessage } from '../../plugins/seaf2drawiojs/lib/routing-diagnostics';

describe('routing issue messages', () => {
  it.each([
    'unsupported-or-missing-endpoint', 'self-link', 'missing-edge-geometry', 'invalid-endpoint-geometry',
    'invalid-preserved-geometry', 'route-search-limit', 'route-grid-too-large', 'route-waypoint-limit',
    'route-grid-endpoint-missing', 'route-not-found', 'route-obstacle-collision', 'source-ports-blocked',
    'target-ports-blocked', 'route-target-missing', 'missing-layer-or-endpoint'
  ])('explains %s with connection and page context', (reason) => {
    const message = routingIssueMessage({ id: 'edge', source: 'source', target: 'target', layer: 'layer', reason }, 2, 5, 'Ошибка');
    expect(message).toContain('source → target');
    expect(message).toContain('Страница 3/5');
    expect(message).not.toContain('вернул код');
  });

  it('does not crash on malformed overlap details or an unknown reason', () => {
    const issue = { id: 'edge', source: 'source', target: 'target', layer: 'layer', reason: 'route-layer-overlap-over-port-limit:invalid-json' };
    expect(() => routingIssueMessage(issue, 0, 1, 'Ошибка')).not.toThrow();
    expect(routingIssueMessage({ ...issue, reason: 'unknown-code' }, 0, 1, 'Ошибка')).toContain('unknown-code');
  });
});
