# Native keyframe resources

Implementation audit for the native-keyframes plan, 2026-10-02.
Baseline: `4a9fb185dcf1e417fe38e43202135b889b9f49a3`.

## Contract and ownership

- `@theme` contains tokens only. Keyframes in a theme receive a ranged diagnostic.
- Native classes and keyframes share file-local preservation/pruning policy. Preserve wins; disabled native delivery suppresses definitions without discarding metadata.
- `@safelist keyframes` accepts exact, case-sensitive CSS string names and escapes. Unknown names warn after graph resolution. References carry definitions without safelist/preservation roots.
- Rust tracks animation names separately from definition IDs, including repeated imports and same-name definitions. Roots come from retained native declarations, generated classes, static tokens and preservation/safelists. Unused mixins and pruned rules do not retain resources.
- Native CSS keeps definition positions, conditions and anonymous layer identity. Empty addressable slots retain their surrounding containers. URL-only reference metadata introduces no animation or layer root.
- Runtime adapters publish compiler-owned stylesheet descriptors. The runtime manages those delivered sheets, including imported sheets and resource URLs. Custom/Shadow DOM hosts can explicitly bind writable sheets and owner IDs.
- SSR materializes the same slots, publishes imported CSS at same-origin URLs and lets hydration adopt the existing containers. HMR replaces manifest and external ownership atomically. Resource-bearing classes bypass the warm utility cache so the last DOM consumer releases their resources.
- Manifest 5, language 14, binding ABI 25, hydration 4 and snapshot/transition 4 require rebuilding consumers. The language batch contract is 6. There is no TypeScript semantic compatibility layer.
- Animation token/class names, shorthand defaults and general class ordering are unchanged.

Native order follows the [cascade layer contract](https://drafts.csswg.org/css-cascade-5/#layering) and [keyframe definition contract](https://drafts.csswg.org/css-animations-1/#keyframes). Browsers resolve competing definitions; the compiler retains their order and conditions.

## Delivery details verified during implementation

- Native owners canonicalize filesystem real paths; package preset owners use stable package-relative identities. This prevents `/var` and `/private/var` from producing incompatible host and manifest IDs.
- Resource URL ranges are produced in Rust. Host CSS processing rewrites inert URL carriers, and CSSOM insertion uses those transported values.
- Reference-only URLs also survive final asset naming, SSR and dynamic insertion. SSR resolves URL placeholders before generating standalone keyframes.
- Resource slots use `only all` with their identifying media feature. Next's CSS minifier incorrectly strips the leading `all` in `all,(feature)`; the retained modifier prevents this rewrite. Slots do not depend on viewport size.
- Vite and Webpack publish emitted-global metadata after graph collection. Vite development startup registers the discovered manifest entries before publishing initial metadata.
- Server rendering replays sorted class rules while preserving stylesheet sources, keeping hydration resource order deterministic even when the document includes native styles.

## Validation record

- Rust workspace: all 596 tests passed. `cargo fmt --check`, workspace Clippy with all targets/features, final focused Clippy, codegen check and native/Wasm parity passed.
- Compiler: 504 passed; server: 68 passed; tooling: 332 passed; ESLint: 298 passed; CSS native/Wasm: 91 passed; schema: 3 passed; Astro: 16 passed; Nuxt: 11 passed.
- Vite's five production/development tests passed, exercising dynamic insertion, image URLs, reference-only assets, HMR, progressive output before JavaScript and subsequent hydration.
- Webpack's two production browser tests passed with final CSS ownership and dynamic resource assets. Next's 15 adapter tests passed. Its production CSS Module animation test and static export/hydration test also passed after a clean build.
- Chromium/WebKit full runtime run: 374 passed; two unrelated selector-fixture failures described below. Focused native-slot tests cover same-name competition, conditions, anonymous layers, last-use removal, preservation, HMR, hydration and Shadow DOM.
- Type-check: all 40 workspace tasks passed, followed by focused checks after the final runtime/server edits. All 21 affected workspace packages' lint scripts passed; site lint completed with warnings and no errors.
- Final package build: 32/32 tasks passed; all 814 published text artifacts and the updated runtime size budget passed inspection.
- Public API census and package contracts passed (897 records, 36 packages); dependency boundaries and AI source budgets passed.

## Documentation and visual QA

Updated Theme, Motion, Syntax Tutorial, native pruning, directive contract, rendering/runtime, token Reference, migration, blog/examples and AI guidance. Reference/search/Markdown/llms and Play artifacts are regenerated from source.

The complete site build generated 470 static pages and verified 94 public assets. Postbuild adds the default-locale aliases. The regenerated and verified CSS contract covers 700 HTML routes, 105 distinct delivery contracts, 838 generated rules and 2,764 exact CSS segments. Its snapshot includes the new native resource positions and final postbuild output; the generated rule count is unchanged. Reference (27), syntax (14), docs examples (18), llms (33), Play (17) and CSS variable-reference checks (2) all passed. Site lint reported 156 warnings and no errors.

At 390px and 1280px, `/reference/tokens/animate` displayed all ten specimens without horizontal overflow. Each started paused; Play, Pause and Replay controlled the real timelines; each completed one iteration. With reduced motion, animation names were `none`. `/guide/motion` preserved both finite entrance specimens and displayed their content immediately under reduced motion. The mobile guide screenshot was visually inspected for clipping and readable controls.

QA evidence during this run: `/tmp/master-keyframe-qa/results.json` and screenshots in `/tmp/master-keyframe-qa/`.

## Performance methodology

The baseline was built from a temporary Git archive using the same local toolchain. The reusable comparison is:

```sh
node packages/runtime/scripts/benchmark-keyframe-resources.js BASELINE_CHECKOUT /tmp/keyframe-performance.json
pnpm --filter @master/css-runtime bench --output /tmp/runtime-benchmark.json
```

Measurements use macOS arm64, Node 24.20.0, gzip level 9 and Brotli quality 11. The Wasm session comparison uses seven batches of 50 creations after one warm-up batch. Wasm memory is reserved linear-memory capacity in 64 KiB pages, not live heap size. These timings are advisory on a shared development machine.

Sizes in bytes, measured from the rebuilt baseline and final artifacts:

| Artifact | Raw before → after | gzip before → after | Brotli before → after |
| --- | ---: | ---: | ---: |
| Preset manifest | 157,847 → 158,853 | 17,366 → 17,511 | 11,524 → 11,678 |
| Keyframe metadata subset | 2,034 → 3,040 | 431 → 571 | 395 → 510 |
| Runtime JavaScript | 47,819 → 57,009 | 13,164 → 15,763 | 11,888 → 14,166 |
| Runtime Wasm | 1,326,280 → 1,414,769 | 364,594 → 394,732 | 270,311 → 290,540 |

The runtime size baseline is deliberately updated for compiler-owned stylesheet delivery and resource placement; its growth allowance is unchanged. The prior checked-in size budget was a different historical build, so it is not used as the before measurement above.

- Median Wasm session creation: 11.663 → 11.680 ms (about +0.14%, within shared-machine noise). Single initialization observations were 1.493 → 1.365 ms; these do not establish a speed improvement.
- Reserved Wasm memory before sessions: 1,179,648 bytes on both builds. One session: 6,160,384 bytes on both. Fifty simultaneously live sessions: 235,077,632 → 235,339,776 bytes (+262,144 bytes, about 5,243 reserved bytes per session).
- Resource trace: no consumers → two consumers → one consumer → no consumers produced keyframe counts 0 → 2 → 1 → 0. A preserved definition retained its floor of 1 after its final class was removed. Animation-token retention also disappeared after its consumer was removed.
- Chromium runtime benchmark (five rounds after one warm-up; 1,000 scan/mutation classes, 250 hydration classes): empty startup 30.4 ms; late ownership rebuild 5.0 ms; initial scan 59.4 ms without preload / 55.7 ms with preload; mutation 2.8 ms; direct CSSOM updates 25.4 ms; progressive hydration 39.1 ms; fallback hydration 41.7 ms. These are final-build medians, not before/after claims.

Machine-readable evidence: `/tmp/master-keyframe-performance57.json` and `/tmp/master-keyframe-runtime-benchmark57.json`. The comparison script is retained at `packages/runtime/scripts/benchmark-keyframe-resources.js` for reproduction.

## Existing failures and environment limits

- Firefox cannot start: Playwright's installed browser reports `Could not find profile folder` before opening a page, including a retry with a separate `/tmp` profile location. Its runtime behavior remains unverified in this environment.
- The existing progressive selector fixture expects `::-webkit-slider-thumb`; both current and baseline Wasm emit `::slider-thumb`, which these browsers reject. This accounts for the two full-runtime failures.
- Existing Next dev-HMR fixture helpers write invalid `display: display:inline-flex` / `display: display:flex` declarations. The same helper is present in the baseline. These failures are not fixed by altering native CSS parsing.
- Several older integration/preset expectations assume `text-rendering:geometricprecision` or the absence of `-webkit-font-smoothing`; the current baseline preset source has the opposite contents. Preset generation follows source. The preset suite has 62 passing tests and one such failure.
- The language-service suite has 407 passing tests and one media fixture failure: it expects 149 mixins although the baseline source exposes 132. The seven focused keyframe language tests pass.
- Next/Turbopack caches can retain imports of previous generated CSS revisions. A clean `.next` build resolved the initial site failure; generated source assets themselves existed.

- The historical migration-ledger digest check reports a pre-existing mismatch. The frozen migration corpus was not rewritten.
- Next integration continues to support its existing build/prerender adapter boundary; this change does not add request-time App Router HTML transformation. Custom hosts importing owned native CSS must provide the documented same-origin stylesheet publishing callback for SSR.
