# 0127 Actual build publication boundaries and final CSS hashes

- HEAD1c6595586. Previous goal turn made progress:0126public file delivery overload and132browser comparisons were completed. All100recorded0126source/preservation hashes matched at this batch's start.
- This batch verifies actual Vite/Webpack production CSS consumers and tests the publication boundary before changing adapters. It adds reproduction/evidence only; no product fix is claimed.
- BH-0004 remains partial. New independent confirmed finding BH-0045 increases the historical total to45:32fixed/13unresolved. Coverage remains65checked/10blocked, with4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Actual build failures: BH-0004

- [Build driver](../repros/build-stylesheet-delivery.mjs) uses actual built public Vite and Webpack plugins in static production mode. Vite uses its normal CSS pipeline; Webpack uses its installed native CSS support (`experiments.css`) with the normal Master pre-loader and generated-CSS asset hook. This does not cover style-loader, extraction plugins, dev/HMR, Rspack or the paused integration lab.
- Eight inputs run on each host: plain native control, external-first, external-last, three nested qualified external imports, and ordinary CSS imported before/after a managed stylesheet. Browser controls load the original CSS as separate author stylesheets. Actual built HTML/assets are served byte-for-byte; screen and print are checked in Chromium, Firefox and WebKit.

| Input | Vite | Webpack |
|---|---|---|
| Plain native control |6PASS |6PASS |
| External before local CSS |6PASS |6PASS |
| External after local CSS |6FAIL: red instead of blue |6FAIL: red instead of blue |
| Nested external under named layer |BuildFAIL |BuildFAIL |
| Nested external under anonymous layer |BuildFAIL |BuildFAIL |
| Nested external under supports/print |BuildFAIL |BuildFAIL |
| Ordinary CSS before managed external-last entry |6FAIL |6FAIL |
| Ordinary CSS after managed entry |6PASS |6PASS |

- Total16builds:10succeed/6fail. Successful builds yield60browser comparisons:36PASS/24FAIL. [Authoritative clean-output run](../evidence/0127-build-browser-clean.log).
- The first driver reused the Vite output directory, so the asset inventory included earlier unreferenced CSS files. The HTML still referenced only the current build, and the first/final browser counts agree. The driver now clears only its owned per-host temporary output before each build. This was a reproduction inventory issue, not a stale-output product finding. [Initial run](../evidence/0127-build-browser-before.log).
- The qualified refusals occur before publication: `resolveStylesheetSync` calls `resolveMasterStyleSource`, which still calls the flat import resolver. Registering/composing the default collection also follows flat paths. The unconditional external-last case reaches publication but external imports are hoisted ahead of local rules, changing cascade. Both remain the known BH-0004 root requirement; no duplicate finding ID was created.

## Why a simple late import replacement is insufficient

- Vite `StyleEntryBuildPlugin.generateBundle` replaces a slot inside an already assembled CSS asset. Webpack `GeneratedCSSAssetsPlugin` similarly replaces a slot during processAssets. Existing tests explicitly cover ordinary rules before/after the slot and duplicate slots per asset.
- Simply inserting a delivered graph's `@import` after ordinary CSS makes the browser ignore that import. Hoisting it before ordinary CSS changes which declaration wins. Neither operation completes CSS delivery.
- [Slot proof](../repros/bundle-slot-publication.mjs) compares three explicit test-owned before/managed/after segment arrangements. Direct insertion has6PASS/12FAIL; hoisting has6PASS/12FAIL. Passing those known segments as separate nodes to the existing public Rust graph compiler yields18PASS/0FAIL across3browsers andscreen/print. [Evidence](../evidence/0127-slot-publication-proof.log).
- The passing graph prototype uses manually specified test boundaries. It is not a parser for arbitrary bundler output and is not an adapter fix. No regex/string parser or new TypeScript semantic fallback was added. Conditional/layer wrappers, duplicate placeholders, namespace context and final URL ownership still require explicit handling when discovering real bundle segments.

## BH-0045 — P2 confirmed: Vite final CSS changes without a new hash URL

- Independent minimal input has no imports: `@master entry;@preserve native;.example{color:red}`. Build twice, changing onlyredtoblue, with explicit Vite asset filename template `assets/[name]-[hash][extname]`.
- Both successful builds publish `assets/index-Dkrc8kIN.css` even though final CSS hashes differ:
  - redSHA256 `14cfb44fea6212455448b2089a04da9f8a999eeb8da63e610dd6eb9b7f0cca46`
  - blueSHA256 `3c8a68911ff5df492b2f84ef1dcad44d40ac187f193bef7de5637880933d96a8`
- Current `packages/vite/src/plugins/style-entry-build.ts:23` runs after the asset has a filename and mutates its source atline36 without updating the filename/references. The content used for the name still contains the slot rather than final managed CSS.
- [Actual build/browser reproduction](../repros/vite-final-css-hash.mjs) records both HTML/CSS outputs. Fresh blue bytes give blue in all3browsers. When the test-controlled cache retains the old response for the identical CSS URL, all3browsers show red. This proves same-URL reuse can deliver stale CSS; it does not claim to have tested a real CDN or observed network cache behavior outside the controlled response replay. [Evidence](../evidence/0127-vite-final-hash.log).
- This is distinct from BH-0004: it reproduces with no imports or stylesheet graph conditions. No fix has been applied. Webpack's probe intentionally uses fixed CSS filenames, so it does not establish a Webpack content-hash finding.

## Required next implementation, in dependency order

1. Start at the lowest compiler layer with a source-aware representation of real bundle segments and the managed slot. Inspect existing Rust parsed native rule/source-range machinery (`directives.rs`, `native_style.rs`, `stylesheet_graph.rs`) and reuse its parser. Preserve rule order, surrounding media/supports/layer scopes and namespace context; do not split arbitrary CSS text with a new host parser. The existing graph compiler can already deliver explicitly identified segments, as the proof demonstrates.
2. Make production style entry classification/registration preserve original import graphs rather than flattening before the delivery path is selected. The relevant host points are `resolveStylesheetSync`/`resolveMasterStyleSource`, Vite register-style-source/extracted-css, and Webpack transform-style-source/collection registration. Keep manifest definitions/native pruning/source policy requirements intact.
3. Publish composed graph assets in their original bundle position. Do not preserve the original external imports again in the host shell when the graph already owns them. Test ordinary-before/after, multiple entries/chunks, wrapped imports, duplicate slots and resources using actual build consumers.
4. Solve BH-0045 in the same publication design: final CSS content must affect its URL, and all HTML/JS/dynamic-CSS/preload references must point to that URL. Renaming only the CSS file or updating only HTML is insufficient for general Vite output; do not weaken `[hash]` into a per-build nonce or silently disable caching. Compare identical and changed builds, then repeat fresh/retained-response controls and chunked/nested base configurations.
5. Preserve original legacy39failures and explicit new build failures until the actual required consumers pass. File no-delivery, native CLI, `--no-export`, dev/HMR, resource/namespace/external URL bases, unlocated diagnostics, source/watch lifecycle,13unresolved findings,10blocked units and4root gates remain unfinished.0038additional verification remains paused. No commit/push or product/fixture/snapshot/dependency/lockfile/CI/release changes in this batch.
