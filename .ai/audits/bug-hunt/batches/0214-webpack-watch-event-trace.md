# Batch 0214: Webpack watch event tracing

Bounded investigation of the preexisting full-suite source-update timeouts under BH-0004. No product fix or completion claim. Counts remain 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked. The active goal and all inherited requirements remain open.

## Instrumentation and classification

Only the new audit test `packages/webpack/tests/bug-hunt-active-graph.test.ts` changed. Optional BH_TRACE_GRAPH hooks record compiler invalidation, filesystem aggregation, watch registration, virtual writes, current entry module source and emitted stage. With BH_TRACE_DIRECTORY, events remain in memory until compiler shutdown and are then written to an exclusive trace file. No forced invalidation, polling override, sleeps or dependency edits.

The initial helper was a separate non-test file excluded by the package TS project, producing TS6307. It was merged into the existing new audit test; the temporary helper was removed. Initial callback instrumentation also inspected results.at(-1) before pushing the current callback. Its stage field therefore described the preceding callback. Original test assertions were unaffected. Corrected instrumentation records after pushing the result and suppresses coarse callback console output when writing trace files. Earlier raw logs are retained but must not be used as current-callback evidence.

## Results

| Run | Result | Interpretation |
|---|---|---|
| Initial console tracing | 87 PASS / 1 FAIL | Existing first-child deletion timeout; source-owner tests passed |
| Memory trace before callback correction | 88 PASS | Timing-sensitive result; stale trace stage field, not repair evidence |
| Corrected memory trace | 86 PASS / 2 FAIL | Shared-owner entry update timeout and first-child deletion timeout |
| Workspace Webpack lint / type-check | PASS | Final audit test validated |
| Type-check inside partial owned build copy | FAIL, TS6053 | Copy omits referenced workspace projects; harness topology limitation, not product regression |

All complete suites use the pending existing Webpack test-contract patch only in the owned copy. Root plugin-runtime.test.ts and installed Watchpack remain unchanged. The corrected suite ran exclusively in master-webpack-copy-y3tvregh; its dist was not promoted.

## Captured entry-update failure

`evidence/0214-corrected-traces/0214-watch-master-webpack-active-test-EHeZ1g.json` records:

1. Initial entry builds successfully. Editing to both imports builds the current both source and emits both.
2. The next watch registration includes entry.js. The test writes stage one at relative 1564 ms.
3. At 1590 ms, filesystem aggregation reports only master-css-manifest.js. Its entry timestamp remains 1789065489780; final real disk mtime is 1789065490944.7368 and contains stage one.
4. At 1591 ms, watchRun.modifiedFiles contains only the virtual manifest. No entry build occurs; finishModules still contains source both, and the next callback emits both.
5. No subsequent matching callback arrives within the original timeout. The test correctly fails rather than accepting the old output.

This locates the missing entry update before module rebuilding. It does not yet establish whether the cause lies in native event delivery, Watchpack registration/scanning, or virtual-module interaction. Redundant virtual manifest writes are observed but causality is unproven. Do not attribute this write failure to the separately proven 0209 initial-deletion race or claim the pending deletion patch resolves it.

## Preservation and continuation

All 475 shared artifacts are byte-identical to 0213. Of 597 recorded sources, only the new audit test changed; 596 are unchanged. No production, fixture, snapshot, dependency, lockfile, CI/release, foreign Site or existing test changes. HEAD and empty index remain unchanged; no commit or push. All owned test commands and compilers are terminal.

The user's LSP one-line approval was already applied and validated in 0203 (42 tests, lint and types). It does not authorize either pending Webpack patch. The 0038 additional identity-gated verification remains paused.

Next: instrument only the owned DirectoryWatcher instances handling entry.js, capturing onWatchEvent/setFileTime and registration/close boundaries alongside the corrected trace; compare native events, recorded timestamps and virtual writes. Preserve any failures and use a bounded controlled reproduction before changing production code. Continue the other raw/host/maps/Next/Vite/root/platform/Site/benchmark requirements independently.

All 28 inherited remaining entries are preserved verbatim in 0214-final-checks.json, followed by the current bounded trace result. No blocked item has been treated as complete.
