# Batch 0213: Webpack resource snapshots

The bounded resource snapshot defect under BH-0004 is repaired and delivered. Two existing watch timeouts remain unresolved. Counts remain 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked. The goal stays active.

## Starting evidence

The previous turn made progress through bounded ownership controls. All 595 sources and 475 artifacts matched 0212 before editing. The resource URL callback hashed readFileSync(file), while the asset publisher later read the same file again. The new actual-build repro wraps the owned compilation's emitAsset method and changes the owned SVG when the first managed CSS fragment is emitted, after composition but before resource publication.

The unmodified product writes an old content hash in the filename but publishes new blue SVG bytes. Deleting the file at the same boundary instead produces ENOENT. An unchanged control passes. All three runs also perform a following build; the original next-build behavior passes. This establishes a product snapshot defect without modifying installed dependencies or relying on timing delays.

## Repair

`getBuildStylesheetDelivery` can capture resource buffers in a map scoped to one asset-processing pass. The same delivery options are used across the shared composition and every per-source composition. The publisher emits the captured buffer rather than reopening its path. Repeated references and different entry folders share the captured bytes; subsequent builds allocate a new map and read fresh bytes. Existing loader/registration calls without that map retain their normal behavior.

Changes are limited to `packages/webpack/src/plugin.ts`, `src/plugins/generated-css-assets.ts`, `src/utils/build-stylesheet-delivery.ts`, the package README, a new package regression file and the new audit repro. No compiler, schema, runtime, dependency or release change is needed. Resource naming semantics are unchanged; the emitted bytes now satisfy the existing content-hash contract.

## Validation

| Check | Result |
|---|---|
| Original controlled write / delete | 1 FAIL each, followed by successful fresh build |
| Original unchanged control | 2 PASS |
| Isolated and delivered controlled write/delete/none | 6 PASS in each set |
| New regression file, final isolated and delivered | 3 PASS each |
| Candidate complete suite | 86 PASS / 2 watch timeouts |
| Exact prior-source complete suite | 83 PASS / the same 2 watch timeouts |
| Prior delivered and candidate focused ownership tests | 3 PASS each |
| Normal / initially missing child / initially missing resource watch | 9 / 10 / 10 PASS |
| Chromium / Firefox / WebKit snapshot rendering and SVG decoding | 21 PASS |
| Webpack lint / type-check / owned example build | PASS |

The new tests use two output entry folders and a shared resource. They verify captured bytes, filename digest, immutable asset metadata, query/fragment preservation, fresh resource and entry CSS names on the next build, and old-resource cleanup. After an interleaved deletion, a build attempted before restoring the file must still reject; this confirms the snapshot is not a permanent stale cache. The delivered tests include this final negative control.

The example retains two warnings: an existing dynamic runtime dependency expression and a 908 KiB Wasm asset. Browser validation renders immutable snapshots of actual watch outputs; it does not establish live browser HMR or SSR behavior.

## Existing watch failures remain open

The full candidate suite reports:

- Memory-cache source removal: no detached result, one old callback.
- Shared-resource/class-owner removal: no one result, one old callback.

To classify these failures, a fresh owned copy restored all three changed production source files exactly to their 0212 hashes and rebuilt them. Its full suite, excluding only the new snapshot test file, reproduces the same failures and messages. Prior delivered and candidate focused runs both pass, so those focused results must not replace the failing full-suite evidence. The source/control hashes and logs are retained in 0213-prior-source-control.json and 0213-prior-full-suite.log.

Both full suites apply the separately pending old Webpack test-contract patch only to their owned copies. Root plugin-runtime.test.ts remains untouched. Installed Watchpack is unchanged. Do not assume these update timeouts have the same cause as the separately proven 0209 initial-deletion race. Neither scope is complete.

## Delivery and preservation

The 51-file Webpack dist directory was atomically swapped only after snapshot validation and the prior-source failure classification. Five files changed: plugin.js, plugin.d.ts, generated-css-assets.js, and the build-stylesheet-delivery JS/declaration pair. The other 470 recorded artifacts remain unchanged. All 19 installed Watchpack files still match 0209. Every before/after artifact hash is in 0213-promotion.json.

The disposable master-webpack-copy-2ycydhh4/packages/webpack/dist now contains the OLD artifact backup. Its source is new; do not rebuild that directory or use its dist as the current candidate. The separate a3_h6ls7 copy is the prior-source control, not a delivery candidate.

All owned processes are terminal and their compilers/watchers/browsers closed. No fixtures, snapshots, existing tests, dependencies, lockfiles, CI/release settings, foreign Site edits or unrelated sources changed. HEAD remains 3b5c98d61c6dc69ee3546d9d4f822e9e835f308e and the index is empty. No commit, push or foreign host restart.

## Continuation

Prioritize the reproducible full-suite watch timeouts. Trace actual filesystem modified/removed callbacks and virtual-module writes against current module sources and emitted auditStage. Preserve failures rather than inserting delays or retrying until green. Continue the full shared/lazy/chunk/SSR/dev/Next/local-compose/Modules/Sass/maps matrices afterward.

All 27 inherited remaining requirements are preserved verbatim in 0213-final-checks.json, with this bounded repair and still-failing watch scope appended. BH-0004 raw 20 qualified / 39 external failures, BH-0029/0051/0053, root gates, platform/Site/benchmark requirements, 10 blocked coverage units and the 0038 identity pause remain unfinished. The Watchpack dependency patch and existing test-contract patch still require their separate pending approvals.

Checkpoint: 0213-final-checks.json, 0213-source-hashes-final.json (597 sources), 0213-artifacts-final.json (475 artifacts). This turn made progress; the goal is neither complete nor blocked.
