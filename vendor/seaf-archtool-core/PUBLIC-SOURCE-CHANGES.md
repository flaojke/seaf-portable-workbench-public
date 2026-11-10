# Public source modifications by LSV (2026-11-10)

This fork retains the upstream LICENSE, NOTICE and source author headers.

Changes for this snapshot:
- Removed the third-party telemetry archive and its dependency entries. Replaced the frontend telemetry implementation with an inert compatibility interface and local type declarations.
- Replaced the external import component with a disabled placeholder and removed default development OAuth/chat proxies.
- Renamed the local workbench plugin and documentation identifiers to LSV, updating references and affected tests.
- Replaced the cat image in the documentation example with an independently generated illustration.
- Updated provenance, tests and public documentation.

The bpmn-js dependency is not relicensed as Apache-2.0. Its own license requires the copyright and permission notice, and a fully visible bpmn.io watermark that must not be removed, altered or overlapped. The plugin retains the upstream viewer/modeler and does not suppress that watermark. Binary redistribution needs its own license inventory and runtime review.
