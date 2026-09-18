# Batch 0208: Webpack entry ownership

Bounded multi-entry/lazy native stylesheet ownership repaired and delivered for BH-0004. Compiler published declaration closure repaired under existing BH-0061. Full objective remains incomplete; 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked remain unchanged.

## Start checkpoint

In progress. All585sources/473artifacts match0207; prior goal turn made progress. Actual multiple/lazy production static entry ownership, unused emission and concurrent resource snapshots remain to verify. Existing Webpack test patch approval and0038identity pause remain pending. No commits or shared-output builds.

## Evidence and repair

- Actual production static Webpack builds with two independent entries showed entry A rendered B's native CSS and fetched B's resource. A lazy B stylesheet also applied before the import was invoked. The corrected original matrix was 6 PASS / 6 FAIL; pure Webpack was 12 PASS. This extends existing BH-0004, not a new finding ID.
- The old single shared slot was replaced in every CSS asset with the entire registered collection. Webpack's chunk graph therefore could not retain per-source native CSS ownership.
- Existing compiler APIs were inspected first. The collection already held registered sources and source-specific extraction policies but exposed only whole-collection composition. Its public stylesheet composition options now intentionally add `sourceIds?: readonly string[]`: omitted means all; empty means no registered sources. Selection normalizes request suffixes and leaves the collection intact. Generated CSS still uses the supplied manifest/scanner classes. Rust continues to own CSS parsing, extraction policy and graph composition.
- The production static loader emits a stable per-source slot at the existing compiler-generated host position. The asset hook composes each selected source at that slot through the existing Rust prepare/render bundle API. Only replacements actually present in the host asset contribute resources. The shared virtual slot receives generated CSS without injecting every registered native graph.
- The existing Vite local-slot helper supplied the pattern for source-position composition; no new CSS parser or semantic fallback. Development behavior is unchanged and remains in the open matrix.
- Compiler and Webpack READMEs describe source selection and static entry/lazy ownership. This is an additive stylesheet orchestration option, not a directive grammar/lowering change. Existing fixtures/snapshots and public directive guide were not changed.

## Validation

| Check | Result |
|---|---|
| Corrected original multiple/lazy browser baseline | Plugin 6 PASS / 6 FAIL; pure host 12 PASS |
| Final multiple/lazy and combined A→B/B→A order | Candidate 18 PASS; pure host 18 PASS; delivered 18 PASS |
| New actual Webpack entry/resource ownership tests on old output | 2 FAIL |
| Compiler source selection, empty selection, default all, query normalization, unchanged registration, native/resource/generated CSS | 2 PASS, inline and delivery variants |
| Full compiler package with process-only installed Sass | 418 PASS in 55 files |
| Complete isolated serial Webpack suite including proposed existing watch-test patch | 82 PASS in 10 files |
| Existing imported CSS boundary matrix | 12 builds / 72 browser comparisons PASS |
| Normal / initially missing child / initially missing resource watch | 9 / 10 / 10 PASS |
| Three-browser render/image checks of corrected watch snapshots | 21 PASS |
| Delivered entry and watch regression files | 3 PASS / 1 missing-child watch timeout; phase diagnostics added, investigation ongoing |
| Compiler and Webpack lint / type-check | PASS |
| Isolated unmodified Webpack example | Build PASS; two existing warnings |
| External strict TS6, both packages and invalid sourceIds negative control | Candidate and delivered PASS after explicit return types |
| Type-only correction runtime comparison | All 31 compiler + 30 Webpack JS files identical before/after annotations |
| Root API census | Existing failure unchanged after removing package-manager wrapper lines |
| Package API golden | Still fails; not updated, including additive sourceIds surface in current output |

Browser probes use real Webpack output and Chromium/Firefox/WebKit, perform actual lazy imports, inspect computed owner/color and decode emitted SVGs. Combined-source cases test both CSS import orders. These controls do not establish all splitChunks/shared/lazy topology, dev HMR, SSR, local compose, Modules or maps.

The inherited compiler 416-test suite must run from `packages/compiler` with its package config. An initial root-directory invocation discovered 400 tests and passed, but is not counted as the complete suite; the correct package invocation found 418 after the two new tests. No native/Wasm rebuild was run in shared output. Installed optional Sass was supplied only through process `NODE_PATH`; portable provisioning remains open.

## Harness and type-build findings

- Initial pure lazy checks placed the entry CSS link in the body after its script. Webpack appended lazy links to the head, changing cascade order. Waiting longer did not fix this. Corrected to explicit head links/body scripts; pure controls then passed. The original and intermediate logs are retained; this was a test-page error.
- The new resource test first required quoted `url(...)` even though emitted CSS used a legal unquoted form. Corrected only this new audit test; first full copy was 80 PASS / 2 audit-test FAIL, final was 82 PASS.
- The compiler test initially supplied relative resource URLs without `relativeResourceURLs: true`; corrected its options, not product behavior.
- The inherited watch repro required a new CSS hash when a child was merely renamed. Final graph normalization may preserve all CSS/resource filenames and bytes after this non-semantic edit. The corrected assertion allows an unchanged hash only if the complete CSS/resource asset map is byte-identical; ownership must still move to the renamed path. All semantic content-change hash assertions remain.
- Fresh compiler declaration generation inferred four private declaration files with unresolved `~/packages/schema/src/...` imports. A bare strict consumer reproduced the failure. Explicit return types on `compilePreparedStylesheet`, `prepareRenderedSource`, `registerStylesheetSource`, and `composeDeliveredStylesheets` retain the existing public contracts and prevent workspace-only path inference. Runtime JS is unchanged. This extends BH-0061's repaired package scope; no shared build-rule or dependency change.
- The proposed existing `plugin-runtime.test.ts` patch remains pending user approval and is applied only in isolated copies. Root existing tests are unchanged; do not claim the root full Webpack suite is green.

## Delivery and preservation

`0208-promotion.json` records ordered full-directory atomic swaps: the backward-compatible compiler option first, then its Webpack consumer. Compiler: 62 artifacts, 6 changed. Webpack: 51 artifacts, 6 changed plus 2 new slot helper artifacts. Other 362 tracked artifacts are unchanged. Total inventory: 475. No foreign host restart, in-place shared build, commit or push.

**Both `dist` folders under the directory in `0208-annotated-build-state.json` now contain OLD output backups. Do not rebuild that directory blindly.** Earlier isolated copies remain separate. Use a fresh copy with `BH_COPY_COMPILER=1` for further cross-package builds. Existing tests/fixtures/snapshots, dependencies/lockfiles, CI/release, shared build config, prior product work and foreign Site edits remain preserved.

## Delivered watch failure still open

The delivered root entry tests pass, but the first child-delete watch test fails consistently: 3 PASS / 1 FAIL in the combined regression run, then two diagnostic runs reproduce the same timeout. It occurs in `delete`, immediately after the first successful compilation (`after=1`), with no subsequent callback. Instrumentation confirms `watchFileSystem.watch` was called in the initial phase while the child still existed and the child was in its file list. This disproves the initial conjecture that registration had not happened yet; the underlying cause is not yet established.

Three explicit controls passed with the same immediate child deletion: pure Webpack, pure Webpack with a temporary no-op CSS loader, and pure Webpack with a no-op CSS loader outside the temporary root. These controls and the passing longer edit/delete/restore sequence do not clear the product failure. Keep BH-0004 watch recovery unfinished. The later diagnostic additions to the new test are type/lint checked; the earlier isolated 82 PASS describes its pre-diagnostic version and does not prove the delivered first-delete path.

The new test records registration phase, child existence, compilation errors, file/missing dependencies and timeout phase. `BH_WATCH_PURE=1|loader|external-loader` selects the bounded host controls. These are audit-only branches; default remains the product regression. No existing tests or fixtures were modified.

## Continuation

Use `0208-final-checks.json`, `0208-source-hashes-final.json`, `0208-artifacts-final.json` and `0208-promotion.json` for the checkpoint. All 21 inherited remaining requirements are preserved with an explicit bounded-update item appended.

Next batch FIRST: reproduce the delivered first-delete failure with the diagnostic test and trace Watchpack/native watcher events against the passing pure controls; verify the fix against immediate deletion plus the longer 29-step matrix. Do not replace this failing assertion with a delay or count later recovery as success. Then unused emitted CSS/resource ownership and stale registered source cleanup when a module leaves the active chunk graph; then concurrent resource-write snapshots. Expand shared/multiple/lazy topology, local compose/CSS Modules, maps, Sass/custom resolvers, development/HMR, and Next host delivery. Do not extrapolate the four simple entry layouts to these full matrices.

BH-0004 raw 20 qualified/39 external failures, BH-0029, BH-0051, BH-0053, Vite cleanup/shutdown, four root gates, Wasm exact-result migration, Sass provisioning, benchmarks, browser/platform and Site work remain unfinished. The existing Webpack test patch needs its separate explicit approval. **0038 additional Rspack/Rsbuild/integration-lab browser/SSR work still awaits explicit user identity confirmation.**

```sh
node .ai/audits/bug-hunt/repros/webpack-entry-ownership.mjs
BH_PURE_WEBPACK=1 node .ai/audits/bug-hunt/repros/webpack-entry-ownership.mjs
BH_COPY_COMPILER=1 python3 .ai/audits/bug-hunt/repros/build-webpack-copy.py NEW_STATE_FILE
node .ai/audits/bug-hunt/repros/webpack-static-watch.mjs
node scripts/with-typescript-tooling-compat.mjs node node_modules/vitest/vitest.mjs run packages/webpack/tests/bug-hunt-entry-ownership.test.ts packages/webpack/tests/bug-hunt-static-watch-recovery.test.ts --fileParallelism=false
```
