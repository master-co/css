# Batch 0215: Native watch event boundary

Progress from 0214: direct instance tracing captures the missing event below Webpack module rebuilding. The full goal remains active, with 61 historical / 57 fixed / 4 unresolved findings and 65 checked / 10 blocked coverage units.

## Scope

All 597 source and 475 artifact hashes matched 0214 at entry. Only the new audit test bug-hunt-active-graph.test.ts was extended. Optional tracing wraps the owned DirectoryWatcher instance's timestamp/close methods, listens to its native event source, and can independently watch the same owned app directory with Node fs.watch. No dependency files or prototypes are patched. Default watch remains native; BH_TRACE_POLL is an explicit diagnostic control only. BH_TRACE_REPEAT fixes the number of shared-owner trials before execution; failures are retained, not retried until green.

## Evidence

| Check | Result |
|---|---|
| Full serial suite with DirectoryWatcher trace | 88 PASS |
| Fixed six shared-owner trials, native watcher | 5 PASS / 1 FAIL |
| Fixed six with independent fs.watch observer | 5 PASS / 1 FAIL |
| First polling experiment | Six assertions pass, six uncaught trace errors; invalid as passing evidence |
| Corrected 100 ms polling control, six trials | 6 PASS, no uncaught errors |
| Final default mode, all tracing and polling controls disabled | 3 PASS; prior failures retained |
| Final lint / workspace type-check / AI context | PASS |

The full-suite run applies the separately pending old Webpack test-contract patch only inside owned master-webpack-copy-1l4mlnt3. Root plugin-runtime.test.ts remains unchanged. Full-suite success does not erase 0213/0214 failures or the two new failing native trials.

The first polling experiment exposed an instrumentation assumption: the polling watcher has a close method but no EventEmitter on method. Optional method access fixes the trace, then the exact fixed six-trial polling control completes without errors. The failed run remains in 0215-poll-six.log and must not count as product failure or clean success.

## Missing versus delayed events

In the full-suite shared-owner trace, the final entry event arrives about 233 ms after the edit. Webpack first emits the old stage, then receives the updated timestamp and rebuilds the new stage successfully. This is a delayed but recovered event, not the timeout.

In 0215-shared-six-traces/watch-master-webpack-active-test-H8C2KL.json, the entry edit to one occurs while DirectoryWatcher is attached and its initial scan has finished. It receives no entry native event or entry stat update before the original 12-second timeout. The directory closes only during final cleanup. Webpack aggregates the virtual manifest alone and reuses the old both source.

The independent observer trial reproduces the same failure in 0215-raw-six-traces/watch-master-webpack-active-test-LqbRdP.json. Its direct fs.watch receives initial app events, proving it was active, but receives no later entry event for the failing edit. The disk ends with one and mtime 1789065915325.391; Watchpack retains entry timestamp 1789065914204. The retained traces show both observers missing the event, not a plugin source reconciliation failure after a reported entry change.

Polling control detects changes through repeated file stats and reaches none in all six trials. This establishes a bounded native event-delivery limitation in this Node 24.20.0 / libuv 1.52.1 macOS process. It does not establish a cross-platform root cause, prove the plugin never contributes to timing, or repair the default native route. No production polling override is applied. The separately proven first-deletion race and its pending Watchpack patch remain distinct and unfinished.

## Preservation and next work

597 source records retained: the new audit test changed, 596 others unchanged. All 475 shared artifacts remain byte-identical; no promotion, commit, push, dependency/lockfile/CI/release or existing fixture/test modification. All owned watchers and commands close at completion. User LSP approval remains applied from 0203; the two separate Webpack approvals and 0038 identity-gated verification remain pending.

Continue with a minimal native fs.watch process control and explicit host polling documentation/strategy only if supported by further evidence; do not label the current default repaired. Independent remaining work includes Next's static graph publication, full Webpack multi/lazy/local-compose/Modules/Sass/maps delivery and Vite recovery cleanup. All 29 inherited remaining requirements are preserved verbatim in final-checks, with this bounded classification appended. A recorded host limitation is not completion.

Sources, artifacts, parsed trace observations and all failing raw logs are retained in evidence/0215-*. Final default-mode test status and AI context checks are recorded in 0215-final-checks.json.
