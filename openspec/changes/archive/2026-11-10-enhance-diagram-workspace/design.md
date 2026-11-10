# Design

## Existing contracts

Read masters: diagram-composer, object-editing and workbench-usability. Preserve diagram format v1, layout-only behavior, source ownership, revision/fingerprint CAS, validation, Git/directory revisions and reload reporting. Existing native validators define DocHub parents from dotted identifiers and reference targets through components.links[].id.

## Workspace and inspector

Make the canvas primary, with a compact object palette and a contextual inspector. Selecting or double-clicking a referenced node opens model properties and parent/direct children. Schema enums and dictionaries use existing editor-fields behavior; advanced JSON preserves unknown properties. Selectable edges expose endpoints and interaction metadata. Pan, zoom, fit, keyboard movement and clear selected-state feedback work together with property forms.

Visual definition and semantic operations are separate. A geometry drag does not reparent or edit architecture entities. Local draft state, undo/redo and invalid input recovery include the semantic queue. All non-layout edits invalidate an older preview and apply eligibility.

## Semantic operations and source adapters

Backend diagram_workspace returns the effective object catalog, known relations, schema choices, hierarchy support and the validated operation queue. diagram_preview and diagram_draft accept semanticOperations alongside the visual definition. Coordinate the exact DTO between backend and frontend before wiring it.

Entity create/patch/delete operations use explicit section and ID, preserving unedited values. DocHub direct children use the existing dotted-ID convention. A child deletion reports references and children; unresolved references prevent staging. Moving existing subtrees or guessing custom hierarchy fields is not supported.

Native acceptance identified the existing contexts.outof rule: a new component may also need explicit membership in a context. The inspector offers actual parent contexts and explicit membership choices. Selected memberships become ordinary context entity patches in the same queue and diff. Do not silently expand context lists or guess arbitrary selector expressions; unresolved placement remains an actionable validation failure.

DocHub component links use source component, original array index and beforeHash for an exact selector; retain untouched link metadata and avoid index drift across combined operations. Standalone integration/flow collections use declared endpoint references or an explicit supported adapter. Unknown collections remain editable as entities with transparent mapping limits, rather than inventing source/target fields.

## Atomic reviewed save

Derive one effective model, then validate and render the diagram against it. Merge related entity changes, diagram YAML, generated Markdown/Mermaid and imports into one draft, including overlapping edits to a shared file. Preview includes pending semantic edits and deletion impacts. Stage requires reviewed impacts and unchanged project/import fingerprints. Apply remains diff -> validate -> Git commit or directory revision -> reload; a failed reload never repeats a saved write.

## Acceptance and delivery

Use temporary Git and directory projects for CRUD, composition, adapter and browser tests, including custom schemas, duplicate links, unknown properties, stale/read-only writes and rollback on invalid operations. Publish concise evidence; raw logs and project captures stay ignored. New release version is 2.3.0; do not replace the working 2.2 instance until the new bundle passes acceptance. Original documentation screenshots already rejected by automatic publication review remain excluded from GitHub; no alternate transmission is allowed.
