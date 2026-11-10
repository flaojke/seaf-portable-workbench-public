# Public source distribution

## Why
Prepare the source distribution with upstream attribution and documented behavior.

## What Changes
- Replace author labels and paths with LSV, preserving upstream attribution.
- Remove the telemetry SDK and keep a disabled interface.
- Document unavailable integration entry points.
- Replace the documentation cat illustration with an independently generated asset.
- Publish a verified new source history only after a private recoverable backup and independent review.

## Impact
- Affected specification: portable-windows-distribution.
- Existing telemetry configuration no longer enables collection.
- Old document IDs and plugin IDs are replaced by LSV IDs; user projects are not migrated automatically.
- Source checks do not replace binary release verification.
