# Batch 0218: General Next stylesheet delivery contract

BATCH FINISHED for the bounded delivery-contract experiments; implementation remains unfinished. Previous goal turn: progress (static publisher delivered). All629 selected sources and493 artifacts matched0217 at start. Goal active; historical61/57fixed/4unresolved and65checked/10blocked unchanged.33 inherited remaining entries retained. Two Webpack approvals and0038 identity confirmation still pending.

## Current evidence

Two new general loader graph tests reproduce nested-resource and qualified-external-import failures against delivered0217 code. Existing compiler API compileRenderedStylesheet accepts explicit delivery callbacks and returns all child assets/source maps; general Next loader omits those settings/assets. This is the remaining BH-0004 path, not a new finding ID.

Initial relative-path publisher candidate violates the explicit sibling-only relativeResourceURLs contract:3FAIL/5PASS across new2tests and6existing output-map tests. The candidate was corrected to use absolute file URLs; all8tests pass, including nested original resource ownership, query/fragment, child map origin, missing resource rejection and preserved immutable old bytes. Actual Next Turbopack build then succeeds but Chromium cannot decode the resource: file URLs remain unsuitable for final browser delivery. No artifact promotion; this candidate is rejected for delivery.

The absolute-filesystem-path owned-copy experiment fails Turbopack resolution: server relative imports are not implemented. Both rejected prototypes are saved as exact patches. Root product edits were restored to verified0217 hashes before continuing; shared493 artifacts remain0217. The prior0217 backup copy must not be rebuilt; all0218 experiments use a new owned copy.

## Harness corrections

The generated new host repro initially had an escaped closing backtick; syntax check caught it before execution. Its first mode:null configuration resolves to progressive through current options.mode ?? progressive, so it did not isolate the loader-only route. Corrected probe uses mode:runtime with runtime:false. Both routes still exercise the general loader; corrected baseline records the current precise scope. Browser decode failures now include the actual background URL in evidence rather than only throwing a DOM error.

Next: complete real-host URL controls, choose a contract supported by both compiler and Next, preserve CSS Modules exports and per-file maps, then validate focused tests, full suite/lint/types, e2e and actual browsers before any promotion. If a prototype is rejected, retain its exact patch/evidence and restore only this batch's product edits. Never count recorded limitations as completion.

## Sibling-wrapper prototype

A third isolated candidate publishes every returned stylesheet (including the entry) and captured resource into one generated directory, preserving the compiler sibling-relative contract. Its loader returns a relative import of the published entry. All output assets carry inline source maps; the synthetic wrapper has an empty source map, avoiding false author locations. The candidate reuses the existing Next immutable file publisher by exporting its internal publishFile function; no new external package boundary or compiler semantic fallback.

The actual Next loader-only configuration is mode:runtime with runtime:false. Turbopack output is exported and served over an owned HTTP server; a second loopback server supplies the qualified external CSS. Chromium, Firefox and WebKit each verify direct SVG, nested SVG, composed32px padding and active qualified external color (12 checks). The generated graph uses a named layer/supports/screen import; this proves only the tested active condition, not a complete qualifier/cascade/viewport matrix.

Five final controls verify nested-resource dependencies/bytes/query/fragment, missing-resource failure and immutable prior bytes, qualified external import preservation, original entry selector map, and imported Sass partial ownership/maps for SCSS and indented Sass. All5PASS in the isolated wrapper candidate. Shared0217 implementation gives3PASS/2FAIL: original map controls pass while both retained graph cases fail. No failing test was disabled or weakened.

Full wrapper package suite gives116PASS/9FAIL across125 tests. It contains the initial two new tests; three additional map controls were added and run separately afterward, so do not report128 tests as the full suite. Three failures match0217 existing config assertions. Six additional failures expect CSS in the immediate callback: three existing stylesheet-loader assertions for native base/entry/keyframes, two Sass partial ownership assertions and one original entry callback-map assertion. The five new graph-aware controls prove bounded map/ownership behavior but do not by themselves authorize changes to the six existing assertions or prove complete final host map behavior. Existing tests remain unchanged.

The config test whose title still says mode is null actually passes mode:runtime/runtime:false in current source. Its failure concerns rule shape, not null-mode behavior. The first host harness, separately, really did pass null; its corrected baseline removes that ambiguity. Original logs are preserved.

## Evidence and preservation

| Evidence | Result |
|---|---|
| 0218-loader-baseline.log | 2 delivered retained-graph failures |
| 0218-loader-candidate-tests.log | 3FAIL/5PASS; unsupported relative nonsibling URL request |
| 0218-loader-file-url-tests.log | 8PASS; insufficient host evidence |
| 0218-general-host-baseline-corrected.log | Delivered loader fails actual Turbopack build |
| 0218-general-host-file-url.log | Candidate build succeeds, browser image decoding fails |
| 0218-general-host-absolute-path.log | Turbopack rejects absolute filesystem requests |
| 0218-general-host-wrapper.log | Actual isolated candidate12browserPASS |
| 0218-wrapper-full-suite.log | 116PASS/9FAIL; three prior config and six output/map assertion failures |
| 0218-wrapper-map-controls.log | Final5candidate controlsPASS |
| 0218-delivered-map-controls.log | Final shared implementation3PASS/2FAIL |
| 0218-next-lint-final.log / 0218-next-types-final.log | PASS |

Exact rejected file-URL and absolute-path patches, and the unpromoted sibling-wrapper patch, are retained under repros/next-general-*.patch. Candidate source/artifact inventory is0218-wrapper-candidate.json; owned copy packages/next is under .ai/audits/bug-hunt/tmp/master-next-copy-tpk5chtq. It has44 files and has never been promoted. Do not confuse it with the0217 old-artifact backup, which must never be rebuilt.

All629 inherited selected source records and493 artifacts match0217 after restoring only this batch's two product edits and removing its new product helper. Five audit additions bring the selected source inventory to634; there are no final product or existing-test changes. All33 inherited remaining entries are preserved verbatim and one precise entry appended (34 total). HEAD/index unchanged; no commit/push, dependency/lockfile/CI/release/fixture edits or foreign host restart. Host browsers/servers/projects are cleaned and all owned commands terminal. Two Webpack approvals and0038 identity confirmation remain pending.

Next0219: first verify original native/keyframe assertions against the complete published graph; inspect the six test contracts without changing expected semantics. Verify host-consumed source maps and CSSModules/local graphs, then required Sass/e2e/dev coverage. Prepare a precise existing-test migration patch only when justified and fully checked, obtaining specific authorization before applying it. Candidate product application and artifact promotion still require the remaining validation. Do not claim a repair from isolated passing controls while current delivered loader still fails.
