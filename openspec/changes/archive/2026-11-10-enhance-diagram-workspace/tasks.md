# Tasks and observed evidence

- [x] Read relevant master specifications and document the existing composer/editor contracts before implementation.
- [x] Define proposal, design, delta requirements and acceptance boundaries before functional edits.
- [x] Validate this change with the pinned strict OpenSpec CLI (21/21 PASS before implementation; final all-items strict validation 22/22 PASS).
- [x] Implement effective workspace data and exact semantic operation selectors (source backend tests and five independent targeted regressions passed).
- [x] Support real component properties and direct-child composition editing (native temporary Git and directory lifecycle passed, including explicit context membership).
- [x] Support create/update/delete of model integrations and information flows (native lifecycle and exact selector tests passed; frontend acceptance remains below).
- [x] Merge model and diagram changes into one reviewed, CAS-protected draft (49/49 focused source checks and 12/12 actual native lifecycle checks).
- [x] Deliver contextual canvas selection, pan/zoom/fit and inspector forms (observed real-browser canvas, endpoint and narrow embedded workflows; see acceptance.md).
- [x] Preserve pending semantic edits in undo/redo/recovery and invalidate stale previews (observed incomplete JSON reload, undo/redo, storage-failure export, source-save/reload-failure and project isolation checks).
- [x] Verify backend boundaries and actual Git/directory/native/browser save lifecycles on disposable projects (focused source, native lifecycle, previous composer browser and new interactive browser receipts; see acceptance.md).
- [x] Publish instructions, a ShopFlow example and limits under Доработки LSV through MCP (canonical page saved in three example projects; main ShopFlow and Hello reload updated with zero problems; Hello guide is visible).
- [x] Build and verify portable 2.3.0 (final ZIP, all 76290 immutable files, actual bundled native/browser/compiled/MCP/launcher/ports checks; see acceptance.md).
- [x] Update the local launcher while retaining connections and history (observed 2.3 live migration retains 9 connections, 15 local revisions and 5 snapshots; old bundle retained).
- [x] Confirm the user-facing portal is available and the new workspace works (three services healthy; actual in-app embedded composer and real model inspector observed on ShopFlow, without source mutations).
- [x] Sync accepted deltas and archive only after observed acceptance (masters were synchronized previously; pinned CLI archived this change as 2026-11-10-enhance-diagram-workspace with --skip-specs --yes, and all 19 master-file hashes remained unchanged).
- [x] Publish only audited SEAF source to private flaojke/seaf-portable-workbench and verify the functional remote tree/commit (main d3fd346fde172f7a23a354bcd88e680aef2f9096, tree 4da9ae2d56c8f012e52c0a9bc28ded46abefaac0, 1901 files; later metadata delta is separate).

All listed tasks have observed acceptance. The legacy add-stack-diagram-views change is outside this acceptance; later publication of closure metadata remains a separate remote update.
