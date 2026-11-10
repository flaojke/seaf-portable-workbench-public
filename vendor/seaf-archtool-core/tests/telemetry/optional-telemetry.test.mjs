import test from 'node:test';
import assert from 'node:assert/strict';
import {createTelemetryBridge, optionalTelemetry, sendEvent} from '../../src/frontend/clickstream/optional-telemetry.mjs';

test('disabled placeholder never loads an SDK or generates identifiers', async () => {
  let calls = 0;
  const bridge = createTelemetryBridge({loadSdk: () => { calls++; throw Error('must not load'); }});
  for (const enabled of [false, true, 'true', undefined]) {
    assert.equal(await bridge.configure({enabled, reportUrl: 'https://example.invalid/events', apiKey: 'placeholder', getUserHash: () => {calls++;}}), false);
    assert.equal(await bridge.sendEvent({eventAction: 'test'}), false);
    assert.equal(bridge.isEnabled(), false);
  }
  bridge.disable();
  bridge.disable();
  assert.equal(calls, 0);
});

test('singleton placeholder and repeated configure/send remain inert', async () => {
  assert.equal(await optionalTelemetry.configure({enabled: true}), false);
  assert.equal(await sendEvent({}), false);
  optionalTelemetry.disable();
  assert.equal(await sendEvent({}), false);
  assert.equal(optionalTelemetry.isEnabled(), false);
});
