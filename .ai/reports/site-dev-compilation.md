# Site dev compilation measurements (2026-09-30)

## Method

Run `site dev` on the same Mac and request `/en/reference/rules/modes`, `/en/guide`, then `/en/play` with `curl`. Read `compile-path` and `handle-request` durations from `site/.next/dev/trace`; HTTP wall time is from curl. The baseline trace was captured before these edits with Next 16.3.4. The final cold run used Next 16.3.7 after `site clean:next`. Durations vary with machine load, so single cold samples do not establish a median.

| Route | Baseline cold compile | Final cold compile | Baseline HTTP | Final HTTP | Result |
| --- | ---: | ---: | ---: | ---: | --- |
| Reference rules/modes | 15.893 s | 16.923 s | 17.154 s | 18.370 s | 30% target missed |
| Guide overview | 2.907 s | 2.041 s | 3.604 s (RSC request) | 2.389 s | HTTP down 34%; compile down 29.8%, narrowly missing 30% |
| Play | No baseline request | 0.337 s | No baseline request | 0.580 s | No comparable baseline |

The Reference compile was 14.859 s in an earlier clean run of the final route/data split, then 16.923 s in the final clean run. The variation and the remaining 16–18 s wait show that the cold Reference target is not met. Turbopack's trace only gives a route-level `compile-path` span here, so it does not identify a narrower module cost.

On a normal second `site dev` launch **without** `clean:next`, the same requests took:

| Route | Cached compile trace | HTTP |
| --- | ---: | ---: |
| Reference rules/modes | 0.009 s | 1.426 s |
| Guide overview | 0.007 s | 0.333 s |
| Play | 0.007 s | 0.245 s |

This is the main repeat-start improvement: ordinary `site dev` now retains the Turbopack cache, while `dev:site:clean` still clears it. Two consecutive `prepare-app` runs kept the modification times of the Reference catalog, route index, selected document JSON, `.pages.json`, search JSON, translation registry and copied raw source unchanged. The Play compiler output also kept its modification time across identical rebuilds.

## Edits and output checks

With an open browser, three Guide MDX saves reached the updated DOM in 3.914, 3.823 and 3.834 s (median 3.834 s). Three shared Markdown renderer saves took 3.877, 3.810 and 3.823 s (median 3.823 s). The corresponding Next `client-hmr-latency` events were roughly 3.0–3.5 s. The old trace contains 3.58–3.92 s events for a different Guide route, plus more variable events during other edits. It contains no controlled saves of the same files, so a before/after 30% median claim is unsupported; the final edit waits remain about 3.8 s.

`build:site`, site `lint`, `type-check`, `test:reference`, `test:llms`, `test:docs-examples`, `test:play`, `test:mdx-imports`, and `check:ai-context` passed. Lint reported 156 existing class-order warnings and no errors. A headless browser rendered Reference rule/token/recipe pages, the cascade-layers Guide page, and the Play iframe; Play's iframe had its template text and CSS rules. Generated Reference route data matched the complete catalog in a focused test. The static build included the token specimen only on the token page and the recipe specimen only on the recipe page.

Remaining cost: first cold Reference compilation and roughly 3.8 s edit-to-DOM latency. The existing baseline has no Play sample or matching edit samples; repeat controlled measurements on the original revision would be needed to calculate those improvement percentages.

## Second pass: prepared Reference rendering and smaller shared graphs

This pass keeps Next 16.3.7 and the existing workspace versions. Reference's private route payload now stores its parsed Markdown tree plus highlighted HTML, PRE attributes and copy text. A content fingerprint reuses those payloads across unchanged prepares and invalidates them when Markdown, document kind, parser, formatter, grammars, language/tooling/preset inputs, package/TypeScript resolution configuration, lockfile or native/Wasm artifacts change. Public Reference Markdown, catalogs and search retain the original content model. Guide MDX still highlights live.

The code controls and document presentation wrappers are separate from the live highlighter. General Reference, recipe and token pages use separate Next route entries at their existing URLs; only their owning entry imports its specimen. Page and layout brand icons are now explicit `createHeaderIcon()` elements. The common page factory/header no longer imports the brand registry. File badges use the existing public SVG URLs, removing 33 SVG modules from their common import graph. SVGR remains for SVG components elsewhere. No compiler semantics, Master CSS output, dependencies or package versions changed in this pass.

### Controlled measurements

Both variants used Next 16.3.7, the same 89-document content corpus and the same Mac. The baseline restored only the site performance implementation to its prior source; concurrent documentation changes were retained in both variants. Three runs per variant cleared an isolated Next `distDir` (`site/.generated/dev-benchmark`) before starting. The request order was:

1. `/en/reference/rules/modes`
2. `/en/reference/tokens/color`
3. `/en/reference/packages/css-tooling`
4. `/en/guide`
5. `/en/play`

Each route was then requested again in the same process. The first Reference request bears the shared framework/global dependency compilation. Guide and Play are first visits to those routes **after** Reference has warmed shared dependencies; these are not independent globally cold Guide/Play runs. `prepare-app` and the Play compiler were prepared separately and are outside the route timings. HTTP measurements include reading the full response. Trace `compile-path` durations are read from `dev/trace` (microseconds converted to seconds).

| Route | Baseline compile median | Optimized compile median | Reduction | Baseline first HTTP | Optimized first HTTP |
| --- | ---: | ---: | ---: | ---: | ---: |
| Reference rules/modes | 6.738 s | 5.405 s | 19.8%; 30% target missed | 9.361 s | 7.057 s |
| Guide overview | 1.017 s | 0.637 s | 37.4% | 1.379 s | 0.956 s |
| Play | 0.360 s | 0.328 s | 8.9%; 30% target missed | 0.619 s | 0.588 s |

Trace evidence for the missed routes, in run order:

| Route | Baseline `compile-path` samples | Optimized `compile-path` samples |
| --- | --- | --- |
| Reference rules/modes | 6.738129, 6.516692, 6.952315 s | 5.609167, 5.405019, 5.145081 s |
| Play | 0.360366, 0.341254, 0.363944 s | 0.329372, 0.328385, 0.323486 s |

The prior 15.9–16.9 s single samples and these ordinary dev medians differ in version, cache/configuration history and machine load. They must not be used to claim a reduction from 16.9 s to 5.4 s.

| Route | Baseline first HTTP | Optimized first HTTP | Baseline warm HTTP | Optimized warm HTTP |
| --- | ---: | ---: | ---: | ---: |
| Reference rules/modes | 9.361 s | 7.057 s | 0.177 s | 0.074 s |
| Reference tokens/color | 1.225 s | 2.745 s | 1.096 s | 0.835 s |
| Reference packages/css-tooling | 2.813 s | 0.938 s | 2.598 s | 0.992 s |
| Guide overview | 1.379 s | 0.956 s | 0.047 s | 0.047 s |
| Play | 0.619 s | 0.588 s | 0.028 s | 0.025 s |

**Token first visits regress in this sequence:** previously the first rules page had already compiled the token specimen. The separate token route now compiles that graph on demand (median 1.007 s), making its first HTTP request 1.520 s slower. Its warm response improves by 23.8%. This trades first token-page latency for a smaller ordinary Reference graph; it is not an across-the-board cold-route improvement.

The first ordinary Reference SSR entry's directly required chunk sources dropped from 830 modules / 7,270,146 bytes to 435 modules / 3,546,337 bytes (47.6% fewer sources, 51.2% fewer raw JS bytes). These counts exclude separately loaded client and dynamic graphs; they are not full-route bundle sizes. The full native profile below still contains 1,694 graph modules.

### Saves and stable preparation

An open Chromium page at `/en/guide/cascade-layers` waited until a newly saved marker appeared in the DOM. The same MDX source was edited three times per variant. The shared code shell moved from `Code.tsx` to `CodeView.tsx`; its same rendered outer DIV was edited three times per variant.

| Save | Baseline DOM samples | Optimized DOM samples | Median reduction |
| --- | --- | --- | ---: |
| Guide MDX | 2.343, 2.310, 2.322 s | 1.352, 1.283, 1.284 s | 2.322 → 1.284 s; 44.7% |
| Shared code shell | 2.299, 1.816, 2.307 s | 1.287, 1.285, 1.284 s | 2.299 → 1.285 s; 44.1% |

Next's `client-hmr-latency` events were 1.442–1.746 s in the baseline and 0.848–0.928 s after the change; these include restoration saves too. Their duration is distinct from end-to-end save-to-DOM waiting. Edit-time `compile-path` spans alone were only a few milliseconds and do not represent the full HMR wait.

Two consecutive optimized `prepare-app` runs took 20.021 and 20.036 s. The first updated the catalog's revision/state metadata; neither rewrote the selected rules/token/package payloads, route index, `.pages.json` or search JSON. The second preserved every checked file's bytes and modification time. This confirms payload stability, **not** reduced startup preparation time: preparation remains about 20 s and has no controlled before/after comparison in this pass.

A supplementary pair of rapid stop/restart runs retained the isolated cache directory but still compiled Reference in 6.308 / 6.232 s, with first HTTP 7.947 / 7.792 s. Their in-process second requests were 0.080 / 0.081 s. Those runs do not demonstrate reliable cross-process cache reuse, despite retaining disk artifacts. The earlier cached-start result remains a historical observation; normal dev still preserves `.next`, but stable cache reuse in this latest isolated configuration remains unresolved.

### Native trace of a 15-second first compilation

A separate clean run with `NEXT_TURBOPACK_TRACING=1` reproduced 15.442 s `compile-path` and 17.255 s HTTP for Reference. It is a diagnostic sample, excluded from the ordinary three-run medians. The tracing flag and ambient load differ, so its duration cannot establish the ordinary performance distribution.

The native trace was inspected with Next's installed `internal trace` / `query-trace` tools. Native query JSON duration units are 100 ns ticks (divide by 100,000,000 for seconds), unlike the route-level Next trace. Human-readable query output confirmed those units. The module graph span `3-4-73` reported 1,694 modules and 14.798 s corrected duration. Its major inclusive branches were:

| Branch | Corrected duration |
| --- | ---: |
| Root layout → globals.css | 3.682 s |
| Locale layout | 2.555 s |
| app/not-found | 2.324 s |
| Next app-page template | 2.178 s |
| app-next-turbopack client entry | 2.139 s |
| Reference layout | 1.290 s |

These branches overlap and share work; do not sum them or interpret them as exclusive CPU costs. Locale layout includes RootClient (1.325 s), language-service Shiki CSS (0.966 s) and main.css (0.161 s).

The globals.css path reaches `packages/next/dist/stylesheet-loader.js` at span `3-4-73-8174-8175-8180-8181-8182-8183-8184`: 3.629 s corrected duration, including 3.627 s of Node.js evaluation. Generated CSS file reads were only tens of microseconds in this trace. This identifies loader evaluation as a remaining bottleneck; it does not distinguish import/startup, resolution and semantic compilation inside that Node operation. The trace does not justify bypassing the stylesheet loader or changing progressive delivery.

The remaining Reference cold cost is dominated by global stylesheet processing and shared Next/layout graphs. A subsequent adapter investigation should profile that Node evaluation and its dependency invalidation separately, retaining CSS output and progressive stylesheet delivery. Broad external-package and SVG-loader cache experiments in this pass showed no useful latency improvement and were discarded.

### Verification and limits

- Site `lint`, `type-check` (including a fresh non-incremental run), `test:reference` (25 tests), `test:llms` (33 tests), `test:docs-examples`, `test:play`, `test:mdx-imports`, and the prepared/live highlighter tests (16 tests) passed. Lint retains 156 existing class-order warnings and no errors.
- Full root `build:site` passed, including Next compilation, type validation, all static Reference routes, postbuild and 94 public assets with no missing/unreferenced files. The build used an isolated Next output directory. Temporary measurement configuration was removed afterward.
- All 89 private payloads match the catalog and parsed Markdown, with prepared fences; representative prepared code matches live highlighting. Cache tests cover unchanged reuse, Markdown changes and rendering-version changes. Public data has no private tree/highlight fields.
- Browser comparisons found identical normalized code DOM across 192 blocks on five Reference pages. Titles, article text, headings and emitted Master CSS were unchanged across those pages, Guide overview and Play. Code DOM normalization ignores React comments and attribute/style ordering, and handles the intentional SVG-to-IMG file badge markup change.
- All 33 file badges retained layout, shape and color. Eighteen were pixel-exact; the other 15 had small SVG precision/rasterization differences, with maximum mean channel delta 0.209/255. This is visual parity within that difference, not universal pixel identity.
- Browser checks confirmed Reference token/recipe specimens, an 80×80 installation brand icon, code copying through a stub clipboard API, and the real Play iframe's template body and generated CSS rules.
- `check:ai-context` and `git diff --check` passed. No unresolved validation failures were introduced. Other concurrent repository changes were retained.

Remaining limitations: Reference and Play compilation miss the 30% reduction target; token first visits in the measured order regress; preparation still takes about 20 s; the rapid restart sample does not prove persistent-cache reuse. Only three ordinary samples per variant were collected, with concurrent machine activity and no confidence interval. The preserved local evidence is under `/tmp/master-site-dev-{baseline-isolated,optimized-isolated,optimized-profile,optimized-restart}/`, with native trace `/tmp/master-site-trace-optimized.bin` and browser parity/smoke outputs under `/tmp/master-site-{render-parity,browser-smoke}.json`. Scratch instrumentation and discarded SVG cache code are absent from the source change.

## Follow-up: unintended source declarations

The commit review found 26 generated declarations in `eslint-plugin/src`, eight new compiler/internal siblings, 14 previously tracked compiler/internal duplicates, and 33 binding/Wasm siblings hidden by old ignore rules. These 81 files were build side effects, not authored source contracts. Ambient declarations and the preset's generated JSON declarations were retained.

Installed tsdown 0.23.0 / rolldown-plugin-dts 0.27.4 automatically select the TS7 native declaration generator. Its temporary-output invocation supplies `--rootDir` for the consuming package and `--noCheck`. In a minimal two-package fixture, TypeScript 7.0.2 emitted an imported dependency outside that root directly as `dependency/src/value.d.ts`, despite an explicit temporary `--outDir`. Building the plugin also reproduced compiler-source declaration rewrites; its own declarations come from a downstream consumer such as eslint-config. The plugin's broad entry glob additionally included any polluted `.d.ts` files as build inputs.

The shared build config now explicitly uses the existing TS6 compiler-API compatibility hook and the in-memory `tsc` declaration generator. Standalone package builds load that hook too. ESLint's entry glob excludes declarations, and the obsolete binding-source ignore rules were removed. No TypeScript dependency version changed. The new `scripts/tsdown-package.test.mjs` builds a real fixture through the shared config and checks cross-root source preservation, `dist` declarations and ambient-file preservation.

After cleanup, all 32 workspace build tasks were forcibly rerun successfully, followed by a successful full `build:site`. No duplicate source declarations reappeared. The regression test, affected package/tooling lint, compiler/internal/plugin type checks, fresh site type check, 25 Reference tests, published artifact validation (798 text artifacts), and AI context checks passed. The route timings above were collected before this build-generator correction and are not measurements of its effect.
