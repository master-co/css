# Batch 0210: Webpack active graph removal

Confirmed another bounded failure under existing BH-0004. No product fix is claimed. Counts remain61historical/57fixed/4unresolved and65checked/10blocked. Goal stays active.

## Checkpoint and scope

Previous0209 goal turn made progress. All592inheritedsources,475deliveredartifacts and19installedWatchpackfiles matched the prior checkpoint before this investigation and still match at closure. HEAD remains3b5c98d61c6dc69ee3546d9d4f822e9e835f308e; index empty. Both pending approvals and0038identitypause retained.

The new `repros/webpack-active-graph.mjs` starts an owned actual Webpack production `compiler.watch`, records emitted bytes, file/missing dependencies, current module/chunk membership and plugin ownership. The app and styles live in sibling disposable directories. The managed stylesheet lies outside project manifest discovery; every result confirms no default manifest or scanner reset dependencies. Thus the stale file is not a legitimate discovered global manifest dependency. Pure controls strip Master directives and omit the plugin while preserving native CSS, imports, resource and edits. No dependency substitution, polling or forced invalidation is used.

## Results

| Mode | Product | Pure Webpack |
|---|---|---|
| cache:false | 3PASS/4FAIL | 7PASS |
| memory cache | 3PASS/4FAIL | 7PASS |

Seven sequential stages: initial import, detach import, reattach unchanged source, detach again, remove now-unused SVG, restore unused SVG, reattach source. Each observation separately checks compilation, CSS output, resource output, stylesheet/resource file dependencies, missing resource dependency and manifest discovery exclusion. Results live in `0210-{product,pure}-{no-cache,memory}.log`.

- Initial and both reattachments pass. Detaching correctly stops publishing owned CSS/SVG assets, but retains their watch dependencies. The collection sourceIds, fallback map and moduleContentByPath keep the detached source even though the actual completed Webpack module graph contains only entry.js.
- Removing the now-unused SVG causes ENOENT in the product's next build. Pure Webpack succeeds and has no stale resource dependencies. This is a product ownership bug, independent of0209 initial-scan event loss: callbacks arrive and contain the erroneous compilation error.
- Restoring the unused SVG restores successful compilation but leaves the stale dependencies. All four detached-state observations fail in both cache modes.
- With memory cache, unchanged reattachment has only entry.js in succeedModule traces; the stylesheet appears in finishModules without rebuilding. A repair based solely on newly succeeded modules would lose cached reattached styles. Current-compilation reconciliation must restore those sources too.

## Harness corrections

The first script invocation had one extra closing parenthesis and failed before executing any build (`0210-active-graph-product.log`). It is exclusively a repro syntax error. After correction the five-stage controls were product2PASS/3FAIL andpure5PASS. Later seven-stage exploratory logs used a stage namedcached-reattached without explicitly enablingcache; those traces actually rebuilt the stylesheet. Final script uses unchanged-reattached and explicit cache:false/memory modes, and proves the cached behavior through hook evidence. Do not call earlier stage names cache evidence.

## Source trace and next implementation

`UsageGraphPlugin` records only succeedModule sources and processes pending entries at finishModules. `MasterCSSWebpackPlugin.moduleContentByPath`, its stylesheet collection and fallback map are never reconciled when a module leaves the compilation. `createStylesheetCSSResults()` composes every registered source, and GeneratedCSSAssetsPlugin republishes all resulting dependencies before matching actual emitted slots. Reset replay likewise reads every retained source. Fixing only emission or subtracting final fileDependencies would leave replay/compilation failures intact.

Next batch must reconcile active module ownership using current compilation sources before composition/dependency publication, remove stale collection/fallback/replay state and account for scanner contributions through owning APIs. Restore cached active styles even when succeedModule does not fire; preserve shared active owners and independently discovered manifest dependencies. Cover these with focused regression tests before fresh isolated build and full scoped lint/types/tests/example validation. Full optimized chunk topology and concurrent resource-write snapshots remain unfinished.

## Preservation and handoff

Only this new audit repro, evidence and ledgers change. No production source, package test, fixture/snapshot, dependency, package-manager setting, lockfile, CI/release, liveartifact orforeignSiteedit is modified. Owned compilers/watchers close and disposable roots are removed; all launched tool processes are terminal. No commit/push orhostrestart.

The installed Watchpack race patch and existing Webpack test-contract patch remain pending explicit, separate user replies. Do not reask or infer approval from continued goal work.0038pausedintegrationverification remains paused. All24priorremainingrequirements are preserved verbatim in `0210-final-checks.json`, with this confirmed source cleanup requirement appended. Evidence changes the next action; this goal turn is progress, not blocked or complete.

Checkpoint: `evidence/0210-final-checks.json`, `0210-source-hashes-final.json`(593sources), `0210-artifacts-final.json`(475unchangedartifacts).
