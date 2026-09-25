# Native components and ordered utility composition

Implementation and measurement baseline: `e57b4a8c33f7af85667dab10371425a886d2646a`
(2026-09-25). Implementation and verification use the isolated
`native-components-compose` worktree. The change is integrated onto `d4c885fe6`,
retaining the subsequent Next static-build caching and notification improvements.
Measurements below retain their original baseline; they do not measure that
separate performance change.

## Delivered contract

- Only `@utilities` registers Master utilities. Removed `@defaults` and
  `@components` produce ranged errors with native layer and migration guidance.
- Native `@layer defaults` / `@layer components` retain CSS selectors and source
  order, ship without class usage by default, and remain eligible for explicit
  native pruning. The five engine layers and markup layer suffixes remain.
- Declarations retain duplicates, fallback values, importance and source ranges.
  Manifest v1 uses additional ordered rules at repeated properties. Segmentation
  does not change utility priority or resource ownership.
- Each `@compose` statement sorts its own class list using Master priority.
  Separate statements and intervening declarations or nested rules stay ordered.
  Adjacent compatible output may share a declaration block without dropping any
  declarations. Composition uses the destination layer and diagnoses explicit
  layer changes. Unknown utilities and cycles fail the compilation.
- Pattern bodies still reject `@compose`. Parameter typing, unsuccessful matcher
  fallback, and duplicate-pattern policy have not been redesigned.
- Compiler inspection and MCP expose statement CSS, classes, call sites,
  definition sites and token/animation dependencies. Pattern provenance follows
  the engine's actual match. This metadata is absent from the runtime manifest.
- Binding ABI is **11**, incremented once from 10. Manifest v1, hydration v1 and
  language v2 are unchanged. The directive declaration IR is an intentional
  public shape change from a property map to an ordered declaration array.
- `rc-managed` joins the other three migration profiles at the native-layer
  migration stage. Preview, source verification, whole-batch review blocking and
  idempotence remain. Patterns, derived classes, removed-class composition,
  dynamic usage and overlapping same-layer definitions receive manual guidance.
  Locations include UTF-16 columns and cross-file conflict references.
- Site styles, native button variants, authoring examples, directive/layer/global
  style/migration documentation and agent guidance use the new contract.
  Exported package CSS also resolves through the existing Node package resolver
  when used as an `@reference` context.

## Validation

| Check | Result |
| --- | --- |
| Compiler, engine, schema, project, diagnostics and language Rust crates | Full scoped run: 324 tests passed; the subsequently added UTF-16 migration case also passed in the six-case migration suite |
| Rust clippy, format, binding codegen and parity corpus | Passed |
| Native/Wasm binding tests | 30 passed, including cross-file ordered composition, exact definition sources, resources, failures and migration parity |
| Compiler package | 449 passed |
| CLI package | 82 passed, including four migration profiles, preview/write safeguards and idempotence |
| Vite package | 669 passed |
| Engine, server, tooling/scanner, language service, MCP, ESLint and language server | Relevant package suites passed |
| Next and Webpack | Package suites exercised; affected output/error expectations updated and focused reruns passed |
| TypeScript builds | All 32 package build tasks passed; Native and all three Wasm surfaces rebuilt |
| Package lint/type checks | Changed packages passed; site lint reports 189 warnings and no errors |
| Package contracts/API census and dependency boundaries | 36 package contracts and 919 census records passed; boundaries passed |
| Site documentation and reference tests | 16 documentation tests and 20 reference tests passed |
| Site production build | 830 static pages built; 95 referenced assets verified |
| Site CSS contract | Updated and verified: 1,240 HTML routes, 122 CSS contracts, 1,828 generated rules and 3,716 exact CSS segments |
| AI context budgets and whitespace | Passed |
| Browser execution | Chromium and WebKit passed static, SSR, runtime and progressive cases with final artifacts (8 tests); related hydration/resource browser coverage passed earlier |

Integration onto `d4c885fe6` passed 452 compiler tests, 191 Next tests, all four
Next E2E cases (including Turbopack and Webpack HMR), and all 20 reference tests.
Compiler and Next builds, lint and type checks passed. The Next playground
production build also passed via `pnpm --filter @master/css-next exec next build
playground` (the isolated playground has no local `next` executable). Regenerated package
contracts retain both changes: 36 packages and 921 API census records. Binding
codegen, dependency boundaries and AI context checks passed again.

The first integrated HMR run exposed a fixture incorrectly migrated from
`@components` to `@utilities`, changing its intended layer. The fixture now uses
native `@layer components` with `.probe` and `.box`, retaining the existing
utility-override and no-reload assertions. Reference heading snapshots also
include the two public compiler exports added by the retained performance commit.

Browser assertions include `display:block;display:made-up-value` retaining block
display, repeated `padding-left` ending at `30px`, red-then-blue statements ending
blue, class-list permutation invariance within a statement, unused native rules,
same-layer source order, utilities overriding native component declarations, and
multi-node removal/reinsertion after runtime start or hydration.

The site comparison in [the recorded computed styles](native-components-compose-site-computed.json)
covers 32 Chromium page loads: baseline/current × light/dark × 390/1280 px × home,
global styles, compose reference and responsive button example. No page exceptions
or horizontal overflow occurred. Compared button, article and background metrics
were unchanged. Narrow buttons retained 32 px height / 12 px horizontal padding;
wide buttons retained 40 px height / 16 px horizontal padding. Screenshots of the
article, code, buttons, navigation and dark mobile layout were reviewed locally.

The site CSS contract update is intentional: product/default rules now live in
native layer output, are no longer managed manifest definitions, and no longer
depend on class extraction. The snapshot preserves this reviewed behavior rather
than the previous managed registry. The directive examples also show ordinary
native token declarations where utility composition is unnecessary.

## Limitations and separate failures

- **Environment blocker:** Firefox could not launch its profile on this macOS
  host. Both the existing browser and a clean Playwright Firefox installation
  reported `sandbox_extension_issue_file_to_process` / `Operation not permitted`
  and a missing profile folder before assertions ran. Firefox validation is not
  counted as passed; rerun `pnpm --filter @master/css-runtime e2e
  e2e/native-components-compose.test.ts --project firefox` on a working Firefox host.
- **Pre-existing failure:** VS Code has 32 passing tests and one failing detailed
  grammar test expecting the removed `--alpha` helper scope. The same assertion
  fails in the original checkout. This change does not restore that removed helper
  or weaken its unrelated assertion.
- Site lint warnings concern composition/canonical-class suggestions; they
  are not counted as errors or silently auto-fixed.
- The complete repository `pnpm check` and every framework/browser E2E combination
  were not run. Validation above is scoped to changed behavior and consumers.
- No claim is made that composition preserves the cascade of markup utilities
  placed in a different layer. Native components intentionally use CSS source
  order and default emission instead of managed generation and sorting.

## Reproducing the measurements

Build **both** old and new native bindings with `cargo xtask build-native --release`.
Keep the old binding and bundle files before switching code; development bindings
are not comparable with release bindings. The workspace build also invokes the
default debug Native artifact task, so run the release Native build **after** the
workspace build. The recorded performance data uses release versus release. Run while builds/tests are idle:

```sh
node scripts/benchmark-native-components-compose.mjs \
  --baseline-binding /path/to/baseline/mastercss.node \
  --baseline-artifacts /path/to/baseline \
  --output parity/native-components-compose-benchmark.json
```

The baseline directory contains `mastercss.node`, `global.min.js`,
`default-manifest.json`, and `mastercss_binding_wasm_engine_bg.wasm`.
The script records representative manifests, CSS and computed counterexamples,
1,000-utility workloads, median parse/lower and engine generation time, and CSSOM
insertion/deletion. It uses three warmups and nine samples. CSSOM timings are
quantized microbenchmarks of ordered rule insertion/removal, not application
startup or DOM observer throughput. Saved bundle comparisons use identical gzip
level 9 and Node's default Brotli settings; workload manifest sizes use gzip 6.

## Recorded results

[Machine-readable measurements](native-components-compose-benchmark.json) include
the representative manifests and CSS. These are local microbenchmarks, not a
cross-machine performance guarantee. No fallback declarations were discarded to
recover the old size or speed.

| 1,000 utilities | Before | After |
| --- | ---: | ---: |
| Single declaration: compile median | 18.49 ms | 24.46 ms |
| Single declaration: engine generation median | 10.60 ms | 11.05 ms |
| Single declaration: manifest raw / gzip 6 | 187,607 / 11,954 B | 187,607 / 11,954 B |
| Single declaration: CSSOM nodes | 1,000 | 1,000 |
| Single declaration: CSSOM insert median | 0.3 ms | 0.3 ms |
| Repeated-property fallback: compile median | 19.58 ms | 37.95 ms |
| Repeated-property fallback: engine generation median | 10.33 ms | 14.10 ms |
| Repeated-property fallback: manifest raw / gzip 6 | 195,607 / 11,971 B | 232,607 / 12,030 B |
| Repeated-property fallback: CSSOM nodes | 1,000 | 2,000 |
| Repeated-property fallback: CSSOM insert median | 0.5 ms | 0.8 ms |

The counterexamples change from inline → block (`display` fallback), 10 px →
30 px (`padding-left`), and red → blue (separate compose statements).

| Runtime artifact | Raw bytes before → after | gzip 9 before → after | Brotli before → after |
| --- | ---: | ---: | ---: |
| `packages/preset/src/default-manifest.json` | 92,623 → 92,623 | 13,087 → 13,087 | 10,399 → 10,399 |
| `packages/runtime/dist/global.min.js` | 48,219 → 48,219 | 13,335 → 13,335 | 12,034 → 12,023 |
| `packages/binding-wasm-engine/artifacts/mastercss_binding_wasm_engine_bg.wasm` | 1,007,509 → 1,007,785 | 314,581 → 314,688 | 240,271 → 240,172 |

The preset manifest is byte-identical. The runtime JS raw/gzip size is unchanged;
its bytes reflect ABI 11. The engine Wasm adds 276 raw bytes and 107 gzip bytes.
The larger fallback workload represents declarations that previously went missing.

Native preservation also changes actual site delivery:

| Site artifact | Before | After |
| --- | ---: | ---: |
| Project manifest | 166,278 B | 134,029 B |
| Home CSS | 79,105 B | 99,207 B |
| Global styles guide CSS | 98,742 B | 110,535 B |
| Compose reference CSS | 97,423 B | 109,216 B |
| Responsive button example CSS | 77,173 B | 97,188 B |

These are exact raw delivered CSS counts from the old and updated site contract
snapshots, including linked stylesheets. Native product styles now ship by default;
the roughly 13–20 KB increase per sampled route is intentional. Pruning remains
explicit and was not enabled to hide this difference.
