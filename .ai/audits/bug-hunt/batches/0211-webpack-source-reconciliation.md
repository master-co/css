# Batch 0211: Webpack source reconciliation

Bounded BH-0004 active source removal is repaired and delivered. Counts remain61historical/57fixed/4unresolved and65checked/10blocked; the complete graph/host goal remains active.

## Start and ownership

Previous0210turn made progress. All593sources/475artifacts matched0210before editing. AGENTS/context routing, Webpack package guidance and relevant scanner/compiler source contracts were followed. Scanner reset with emit:false is an existing owning API; no TypeScript class-removal semantics were invented.

`UsageGraphPlugin` now reconciles complete current module sources at finishModules, including cached modules which do not emit succeedModule. Rebuilt sources remain pending for rescan; unchanged retained sources are not needlessly rescanned. Removed sources leave moduleContentByPath, the stylesheet collection and dependency fallback map. When an owner disappears, the existing Rust-backed scanner session is reset without triggering redundant reset replay, then current sources are replayed with the configured manifest and safelist retained. Dependency publication occurs after reconciliation. This repairs stale graph dependencies and the ENOENT on deleting an already-unused image.

Internal module processing also suppresses intermediate generated virtual-module writes from scanner change events. The owning finishModules/reset-replay operation writes once after its awaited processing completes. External scanner updates retain their normal change behavior. Early candidates passed simple ownership sequences but intermittently missed later writes when a virtual manifest and shared class source were present; the final candidate passed focused/full/delivered controls. These results do not prove arbitrary native filesystem interleavings, which remain part of the full watch matrix.

## Files

- `packages/webpack/src/plugin.ts`: current source reconciliation, scanner reset/replay and intermediate-publication guard.
- `packages/webpack/src/plugins/usage-graph.ts`: include complete current sources and cached restorations.
- `packages/webpack/tests/bug-hunt-active-graph.test.ts`: three new actualwatch tests, including both cache modes, unused resource removal, reattachment, separate manifest owner, shared resource owner and actual emitted class removal.
- `packages/webpack/README.md`: document currentmodule/cache/sharedowner behavior.
- `repros/webpack-active-graph.mjs`: add actual virtualmanifest controls and match the emitted auditStage assignment in JavaScript assets.

## Validation

| Check | Result |
|---|---|
| Original0210failure on first isolated candidate | Both seven-step modes7PASS |
| Final isolated complete Webpack suite | 85PASS/11files |
| Final focused tests with emitted-selector assertions | 3PASS |
| Deliveredroot newtests | 3PASS |
| Delivered cache:false/memory × without/withvirtualmanifest | 28PASS |
| Normal / initially missing child / initially missing resource longwatch | 9/10/10PASS |
| Chromium/Firefox/WebKit immutablewatchsnapshots | 21PASS withrealSVGdecode |
| Owned Webpackexample build | PASS,2warnings |
| Webpacklint/types | PASS |

The complete isolatedsuite includes the separately pending existing `plugin-runtime.test.ts` contractpatch only in its disposablecopy. Root existingtest remains unchanged. The final focused run adds emittedselector assertions after that fullsuite and passes; deliveredroot validates the exact final newtest. No Watchpack module substitution orinstalleddependency patch was used in this batch. The existing root first-delete race remains unresolved until approved formal dependency delivery. Do not use copiedsuite success to close it.

Example warnings concern an existing dynamic runtime dependency expression and a908KiBWasmasset. No dependency orrelease setting was changed. Browser checks render immutable actualwatch outputs; they do not claim live browser HMR orSSR coverage.

## Failed attempts and corrections

- Initialnewtest had an improperly escaped generatedJavaScript string and a possiblyundefinedWatching type error; fixed in the newtest only. Those are harness failures, not product bugs.
- Initialglobalmanifest assertion had no virtualmanifest consumer, so discovery was never requested. The finaltest imports and uses the actual virtualmanifest, establishes its dependency, and verifies it survives source removal.
- A generic stage-string match could match the literalnone in manifest data. Finaloracle restricts matching to the emitted auditStage assignment in aJavaScriptasset. Earlier stalecallback observations from that oracle are not ownership evidence.
- Before the publicationguard, finaloracle runs still recorded a real missingone callback with an old module graph (0211-focused-stage.log). The first fullcandidate suite was84PASS/1timeout. This scope was revalidated after the guard; no arbitrarywatch-timing completion claim is made.
- An addedoutput assertion incorrectly expected fg:red to emit literalcolor:red. Actualpreset output uses color:var(--color-red). The finaltest verifies presence/removal of the emitted escaped class selector and independently checks scanner ownership. No preset/productoutput changed to satisfy the incorrect expectation.

## Delivery and preservation

51Webpackdistfiles atomically swapped using macOSRENAME_SWAP after isolatedvalidation. Onlyplugin.js,plugin.d.ts andplugins/usage-graph.js changed;48otherWebpackfiles and424otherartifacts unchanged. `0211-promotion.json` records every before/afterhash. All19installedWatchpackfiles stillmatch0209. No fixtures/snapshots/existingtests/dependencies/lockfiles/CI/release changes; foreignSite edits and other existing work retained. HEAD3b5c98d61c6dc69ee3546d9d4f822e9e835f308e, emptyindex; no commit/push orforeignhostrestart.

The disposable `master-webpack-copy-3mgrd0se/packages/webpack/dist` is now the OLDartifactbackup. Its source is new; do not rebuild that directory or treat itsdist as the candidate. Alltoolprocesses terminal; ownedcompilers/watchers/browsers closed and reprotemp roots removed.

## Continuation

All25inheritedremainingrequirements are preserved verbatim in0211-final-checks.json with a bounded superseding note. Next cover tree-shaken/optimized chunk ownership, simultaneousimport/resource removal, concurrentresource snapshots and fullshared/multilazy layouts, thenremaininglocalcompose/Modules/Sass/maps/dev/HMR/Next boundaries. BH-0004raw20qualified/39external, BH-0029/0051/0053,4rootgates,10blockedcoverage,platforms/Site/benchmarks and0038identitypause remain unfinished. Watchpackdependency patch andexistingWebpacktestpatch approvals remain separatelypending; generalgoalcontinuation is not authorization.

Checkpoint: `0211-final-checks.json`, `0211-source-hashes-final.json`(594sources), `0211-artifacts-final.json`(475artifacts). Goalturnclassification: progress, not complete orblocked.
