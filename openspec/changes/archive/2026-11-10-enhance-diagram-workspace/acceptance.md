# Source acceptance: interactive diagram workspace

Observed on 10 November 2026. Source, the final portable 2.3.0 ZIP, live migration, configured ShopFlow/Hello reload and private functional GitHub publication have passed acceptance. The pinned CLI subsequently archived both accepted changes with --skip-specs --yes; all 19 master-file hashes remained unchanged. Subsequent release-documentation metadata is a separate remote update.

Pinned OpenSpec validation (`validate --all --strict --no-interactive`) passed **22/22 before archive** and **20/20 after both archives** (19 master specifications plus the separate active legacy change). This confirms specification structure separately from the runtime checks below; validation does not accept that legacy change's runtime behavior.

## Observed checks

| Gate | Observed result | Coverage |
| --- | --- | --- |
| Focused backend/source checks | 49 passed, 0 failed | Exact selectors and hashes, entity/link CRUD, composition, references, atomic drafts, stale/read-only boundaries and interaction direction. |
| Actual native lifecycle | 12 passed, 0 failed | Independent Git and directory copies; native validation, source save, portal reload, reopening, explicit child/flow deletion and layout-only changes. |
| Actual Mermaid parser | 4 passed, 0 failed | Forward, reverse, bidirectional and undirected output with the pinned parser. |
| Previous composer browser regression | 16 passed, 0 failed | Palette, three levels, geometry, keyboard/pointer movement, undo/redo, files, validation/save/reload, stale base and read-only preview. |
| Interactive workspace browser acceptance | 17 passed, 0 failed | Actual canvas and accessible edge-list interaction, existing same-section flow schema/edit/save/reopen, component/flow CRUD, exact endpoint changes, combined Git/local save, recovery, read-only and narrow embedded workflows. |
| Inspector/lifecycle helpers plus previous composer unit checks | 42 passed, 0 failed | 27 focused inspector tests and 15 previous composer tests; types/dictionaries, unknown properties, hashes, exact parallel selectors, camera bounds, schema reuse, saved-source/reload-failure handling and project isolation. |
| Final core/workbench regression | 221 passed, 0 failed, 11 skipped | 232 tests, with vendor telemetry collected separately. Skips remain explicit; they are not counted as passed runtime acceptance. |
| Separate vendor telemetry regression | 10 passed, 0 failed | Opt-in, disabled/unconfigured loading, private identifiers, queued/stale transport, failure containment and configured endpoints. |

The interactive browser harness additionally covers real property/title edits with custom visual aliases retained, selection and pan/zoom/fit, existing composition, explicit context changes, actual integration source/target changes, parallel-link metadata, all required CRUD workflows, and one combined Git commit. The same UI saves an immutable local revision for a directory project. Existing standalone flows use their declared endpoint/property schema and remain editable after source save and reopening, including when another entity from that section supplies the workspace schema.

Raw incomplete JSON survives navigation/reload and undo/redo. New input invalidates an earlier preview. A simulated storage quota failure retains input and exports a recoverable sketch; it does not claim persistence or write a model. Read-only entity forms and source writes remain disabled. A 1,000-pixel embedded portal was checked with a 612-pixel canvas, readable contextual controls and the bottom save controls within the frame viewport.

Browser receipts record zero JavaScript errors, zero external requests and no writes to production projects. Every mutation and commit belongs to an independent fixture. Owned browser, native worker, Workbench and offline test processes are closed by the harness. No screenshot, raw model, credential or machine-specific project path is included in this tracked evidence.

## Reproduction

Use the locked source dependencies and a separately verified portable test bundle. The optional browser harness accepts the installed Playwright module through `SEAF_PLAYWRIGHT` and the disposable runtime bundle through `SEAF_COMPOSER_TEST_BUNDLE`; neither setting should contain credentials.

```text
node --test seaf-mcp/workbench/test/diagram-inspector.test.mjs seaf-mcp/workbench/test/diagram-composer.test.mjs
node seaf-mcp/workbench/test/diagram-composer-browser-gates.mjs
node seaf-mcp/workbench/test/diagram-workspace-browser-gates.mjs
node seaf-mcp/workbench/test/diagram-editing-lifecycle-gates.mjs
```

Private detailed receipts are retained separately from the audited source export. Counts above are observed outcomes rather than inferred coverage from implementation code.

## Verified final portable 2.3.0

The actual final ZIP was extracted to an independent Unicode path and tested using its own application modules and bundled Node. Results: **native lifecycle 12/12, interactive browser 17/17, compiled portal 10/10, actual-module pure checks 61/61, launcher 8/8, ports 7/7 — all PASS**. The bundled MCP reported version **2.3.0**, Node **22.23.4** and SDK **1.32.1**, using an isolated read-only registry. Browser checks recorded no JavaScript errors or external requests.

Artifact: `SEAF-Windows-x64-2.3.0.zip`, **496039066 bytes**, SHA-256 `a8edb8a7ea163b4310d6bf16622b4faa3b7ad988b828b4c9b4a2ee03f01e3379`. Manifest `7dd32eb90e8ad5591f5e2e7363383868de750989b0c3f90110cf2b9880edce2f`: all **76290** immutable files verified again after the complete gate sequence. The archive contains no user data. The independent source Git excludes prior workspace history; the clean build was run offline from locked inputs. These 2.3.0 results supersede the pending export/build gates of the older 2.2.0 usability change.

Canonical instructions and examples were saved through MCP in the main ShopFlow and both example projects. Main ShopFlow and Hello reload are `updated`, with zero problems. The new Hello guide is visible and active ShopFlow was restored. Documentation/source saves remain distinct from application deployment.

## Observed live delivery and functional publication

The verified 2.3.0 bundle is running with all three local services healthy. Migration retained 9 connections (6 read-only), 15 local revisions and 5 snapshots with verified history integrity. The previous bundle/data were preserved; the existing launcher wrapper was switched only after health checks. Real in-app selection and the model inspector were observed without saving fixture changes to a production model. Recovery reapplied no proposal, changed no architecture file and created no model commit.

The functional source is published in private `flaojke/seaf-portable-workbench`, branch `main`: commit `d3fd346fde172f7a23a354bcd88e680aef2f9096`, tree `4da9ae2d56c8f012e52c0a9bc28ded46abefaac0`, 1901 files. Exact repository, privacy and SEAF-only scope are verified; old workspace history was excluded. See [concise closure evidence](evidence/delivery-publication-acceptance.json). Later documentation/archive metadata is a separate update, and a GitHub Releases binary upload is not asserted.

## Supported boundaries

- Diagram geometry and visual aliases do not rename, reparent or delete architecture entities. Model changes require explicit inclusion in the operation queue and the normal diff, validation and source-save lifecycle.
- Composition supports DocHub direct dotted-ID children and explicit static context membership. Subtree moves, automatic hierarchy inference and dynamic context-expression rewriting are not implemented.
- Guided integration creation uses declared, compatible endpoint adapters. Unknown mappings retain universal JSON editing; the UI does not invent component-link semantics for other metamodels.
- Fully coincident or occluded paths can be selected through the accessible diagram edge list. Real canvas edge double-clicks are verified independently of this fallback. Automatic obstacle routing is not claimed.
- Diagram limits remain 200 nodes, 500 edges and 30 zones; a semantic queue is bounded to 100 operations. Backend validation and unchanged-base checks remain authoritative.
- Browser recovery depends on available local storage at the same origin. It is separate from a server draft, a Git commit/local revision and portal reload. Offline sketches do not bypass model validation or publish files.
- Confirmed source saves consume applied operations even if reload fails. Newer local work is retained; reload retry is separate from applying the source change again. Push remains explicit.

## Acceptance boundaries

Delivery and publication above are supported by their own observed receipts, separately from source tests. Another physical computer and Windows 10 have not been claimed as tested environments. The earlier add-stack-diagram-views change is not accepted or archived by this work.
