# Local acceptance, 2026-11-07

Computer: local Windows test computer. Workspace: .. No commit, push, deployment or model publication. Existing unrelated worktree changes retained.

## Observed checks
- node --check: stack-views.mjs, public/stack-views.js, public/app.js, public/sw.js passed.
- Full node suite: 117 tests, 109 passed, 8 skipped, 0 failed.
- Focused Stack suite: 8 passed, including real directory Workbench preview/stage/diff/stale protection with unchanged source bytes.
- Browser Stack gates: 12 checks passed in installed Microsoft Edge, zero page errors. Uses separate temporary profile and private fixture projects. Bundled Chromium was unavailable; no browser install was performed.
- Browser checks: project-switch stale response, edited preview rejection, double stage click, captured text/project, exact source object, PNG/ZIP with matching revision/hash/inventory/legend, detached panel, Cancel, full-app SVG navigation, Back/Forward, changed source before staging, real API draft without source writes.
- PNG visually inspected: two source nodes and expected labeled arrow, readable output. Full-app screenshot inspected.
- OpenSpec pinned 1.16.0 validation: 17 passed, 0 failed.

## Files and reproducible commands
- seaf-mcp/workbench/test/stack-views.test.mjs
- seaf-mcp/workbench/test/stack-browser-gates.mjs
- node --test --test-concurrency=1 test/*.test.mjs workbench/test/*.test.mjs (from seaf-mcp)
- node workbench/test/stack-browser-gates.mjs (installed Edge; SEAF_TEST_BROWSER_CHANNEL can select another installed channel)
- OPENSPEC_TELEMETRY=0 with openspec/tooling/node_modules/@fission-ai/openspec/bin/openspec.js validate --all --strict --no-interactive (from root)
- Local screenshot evidence: seaf-mcp/state/acceptance/stack-export.png, stack-views.png, stack-full-app.png.

## Honest scope boundaries
- Description parser is a bounded local grammar, not unrestricted language understanding or an LLM. Unknown descriptions fail without invented data.
- Placement supports verified SEAF TA service app_components, stand, network_connection and availabilityzone. No guessing for other metamodels or unlinked infrastructure.
- Rendering is bounded and uses independent simple layout; complex graphs can still cross edges. Parallel link identity uses endpoint occurrence order.
- Eight existing opt-in checks (Docker/AI/native-runtime integration) were skipped by their own gates; The general opt-in gates remain skipped; targeted real native validation/reload, repeated apply and stale apply were subsequently verified on a private temporary fixture (see below). Distribution rebuild and documentation publication were not performed. New Stack staging stops at draft; normal apply lifecycle remains the existing implementation.
- Native schema references inspected: repositories/seaf-core/entities/ta/services/base_entity.yaml and cluster.yaml; repositories/seaf-core/entities/app/components/components.yaml.
- No new external code, fonts or icon assets. Existing MIT/license notices remain untouched.

## Additional isolated real-runtime lifecycle acceptance
2026-11-07: node workbench/test/stack-lifecycle-gates.mjs passed all 6 checks with the existing dist/SEAF-Windows-x64-2.1.0 runtime. No general Docker/AI/native gate was enabled.
- A Stack DSL flow went through preview, draft, proposal and real native validation: 15 validators, passed.
- Apply saved one directory revision and real portal reload returned updated with zero problems.
- A JSONata read from that private portal confirmed the applied flow.
- Repeating apply returned the same revision; source fingerprint and revision count were unchanged.
- A separately validated Stack proposal became stale after an external edit to the private root.yaml; apply rejected it without overwriting that edit.
- Fingerprint of the original bundled example was unchanged.
All write paths and runtime control/state paths were inside a unique temporary fixture. Only runtime instances created by this test were stopped; the fixture was removed afterward. No live user project, existing portal, emulator or unrelated process was touched.
Receipt: seaf-mcp/state/acceptance/stack-lifecycle.json. Reproducible script: seaf-mcp/workbench/test/stack-lifecycle-gates.mjs; SEAF_STACK_TEST_BUNDLE optionally selects an existing bundle. This adds test coverage only, not functional changes.
