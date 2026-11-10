/**
 * Disabled telemetry placeholder for the public distribution.
 * This module contains no SDK, identifier generation, event queue or transport.
 * Environment variables and injected options cannot enable collection.
 */
export function createTelemetryBridge() {
  return {
    async configure() { return false; },
    disable() {},
    async sendEvent() { return false; },
    isEnabled: () => false,
  };
}
export const optionalTelemetry = createTelemetryBridge();
export const sendEvent = event => optionalTelemetry.sendEvent(event);
