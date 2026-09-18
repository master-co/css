# Batch 0207: Webpack watch recovery

Bounded production static watch recovery delivered for BH-0004. The full objective is incomplete; goal remains active. Existing `plugin-runtime.test.ts` contract migration is still pending explicit user approval and has only been applied in an isolated validation copy.

## Start checkpoint

In progress. All578sources/473artifacts match0206;previousgoalturnmadeprogress. Exercise actualproductionstaticnativewatch withoutmanualinvalidation/polling. Preserveallremainingrequirements/0038pause;no commits/shared-outputbuilds.

## Findings and implementation

- Actual Webpack `compiler.watch` could report a fatal missing-resource error from `watchRun`, after which restoring the file did not restart compilation. Webpack's fatal watch-run path bypasses watcher re-registration. Reset/replay errors now reach the next compilation's `errors` list; module-processing and asset-publication errors also remain compilation failures.
- Dependencies are registered after current module processing. Existing paths use `fileDependencies`; attempted missing paths use `missingDependencies`. The production static loader uses the existing asynchronous stylesheet preparation API with an on-dependency callback, so an initially missing CSS import is watched before preparation throws.
- Stronger cleanup checks found old manifest dependencies after a managed entry became ordinary CSS. Tracing demonstrated virtual-module invalidation could rebuild the changed source before its filesystem event appeared in `watchRun.modifiedFiles`. The module-processing hook now refreshes manifest ownership when that compilation rebuilt a tracked source. Collection, fallback, scanner and manifest ownership are recorded separately in the repro.
- Two new actual-watch regressions cover child/resource deletion, compilation error reporting, native filesystem restoration, successful output and unused dependency cleanup. No manual invalidation or forced polling. README describes this bounded production static behavior.
- No CSS semantic implementation was moved into TypeScript; the existing compiler graph/preparation/rendering APIs remain the semantic owners. No change to directive grammar, fixtures, dependencies, shared build rules, CI or release.

## Validation

| Check | Result |
|---|---|
| Original corrected watch baseline on 0206 delivered output | 4 PASS / 5 FAIL; watcher stopped after missing resource |
| Final two regressions on 0206 output | 2 FAIL |
| First recovery candidate | 9 weak checks PASS; stronger dependency cleanup and initial missing-child checks exposed remaining failures |
| Final normal watch sequence | 9 PASS |
| Final initially missing CSS sequence | 10 PASS |
| Final initially missing resource sequence | 10 PASS |
| Immutable emitted snapshots in Chromium, Firefox and WebKit | 63 PASS, including actual image decoding and query/fragment URLs |
| Isolated complete serial suite with proposed existing-test contract patch | 80 PASS |
| Root package lint / type-check | PASS |
| Strict external TS6 with Node and ESNext ambient libraries | PASS |
| Unmodified example, isolated and using candidate package | Build PASS; two existing warnings |
| Delivered new regressions / actual normal watch | 2 PASS / 9 PASS |

The three-browser checks render the actual immutable asset snapshots captured at watch callbacks. They do not prove live browser HMR or SSR. Content changes, file deletion/restoration, child rename and switching the entry to unmanaged CSS are separate observations. Passing a compilation alone is insufficient: checks also require expected CSS/resource bytes, changed CSS content hashes where appropriate and correct active dependencies.

## Test and harness classification

- The first baseline repro tried reading emitted `SizeOnlySource` contents after emission. Corrected to read emitted files at each callback; the original failed script log is retained. This is not a product bug.
- Initial cleanup checks only inspected CSS output. Strengthened checks exposed the stale manifest dependency; the earlier 9 PASS result does not establish cleanup correctness.
- The new regression initially needed a stronger first-output predicate and an optional watcher type guard. These are audit-test corrections, not existing test changes.
- The first standalone consumer TS config omitted Node types and disposable libraries. Corrected to explicit Node + ESNext/DOM with strict checking and `skipLibCheck: false`; no product type change was needed.
- Two existing watch tests expect fatal hook rejection and put nonexistent files into `fileDependencies`. The proposed patch retains the original error identity, logging and next-run recovery assertions, moves them to `compilation.errors`, and checks `missingDependencies` after module processing. The initial unchanged-contract copied suite was 76 PASS / 2 FAIL. The final isolated copy, including two new regressions and the proposed patch, was 80 PASS. **The root existing test is unchanged; do not claim its full suite is green.**
- Reviewable pending patch: `repros/webpack-watch-compilation-contract.patch`. The earlier user approval for the LSP one-line diagnostic assertion was already applied in 0203; it does not authorize this separate Webpack test migration.

## Delivery and preservation

A fresh normalized private-source copy was built and tested serially before any probe read its output. Atomic full-directory `RENAME_SWAP` delivered all 49 Webpack artifacts: 9 changed, 40 unchanged, no additions/removals. The other 424 tracked package/native/Wasm/runtime artifacts remained unchanged. Exact before/after hashes and backup path are in `evidence/0207-promotion.json`.

**The directory in `0207-build-cleanup-state.json` now holds the OLD Webpack dist backup after the swap. Do not rebuild it blindly.** Earlier candidate copies remain separate. No foreign host was restarted, shared output rebuilt in place, commit created or push performed. All previously modified source and foreign Site changes are preserved.

## Continuation

Use `0207-final-checks.json`, `0207-source-hashes-final.json` and `0207-artifacts-final.json` for the checkpoint. All inherited remaining requirements are retained verbatim in final checks, with the new bounded watch result appended. The 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked counts do not change.

1. When explicit approval arrives for the proposed Webpack existing-test patch, apply only that patch and rerun the full suite in a fresh disposable copy. Do not infer approval from elapsed time or the LSP approval.
2. Next independent batch: production static multiple/lazy-entry ownership, unused emitted asset pruning and concurrent resource-write snapshots. Then local compose/CSS Modules, maps, Sass/custom resolvers, development/HMR and Next host delivery.
3. Preserve BH-0004 raw native/Wasm 20 qualified and 39 external failures, BH-0029, BH-0051, BH-0053, Vite cleanup/shutdown, four root gates, Wasm exact-result test migration, optional Sass provisioning, browser/platform/benchmark/Site requirements and all ten blocked units.
4. Batch 0038 additional Rspack/Rsbuild/integration-lab browser/SSR work remains paused until the user explicitly confirms identity verification passed.

```sh
node .ai/audits/bug-hunt/repros/webpack-static-watch.mjs
BH_INITIAL_MISSING=child node .ai/audits/bug-hunt/repros/webpack-static-watch.mjs
BH_INITIAL_MISSING=resource node .ai/audits/bug-hunt/repros/webpack-static-watch.mjs
node .ai/audits/bug-hunt/repros/webpack-watch-browser.mjs PATH_TO_COMPLETE_WATCH_LOG
node scripts/with-typescript-tooling-compat.mjs node node_modules/vitest/vitest.mjs run packages/webpack/tests/bug-hunt-static-watch-recovery.test.ts
python3 .ai/audits/bug-hunt/repros/build-webpack-copy.py NEW_STATE_FILE
```
