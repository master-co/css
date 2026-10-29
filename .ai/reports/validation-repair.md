# Repository Validation Repair

Follow-up to the Bun migration committed as `7e45084f2`, requested on 2026-10-29.

## Repairs

- Annotate installer dependencies with the existing public dependency type; remove
  a diagnostic assertion referring to an obsolete code, while asserting no diagnostics.
- Assert the current hydration v5 `classNames` contract in Svelte tests.
- Resolve Vite import fixtures from real workspace paths. Disable unrelated dependency
  optimizer discovery in lifecycle fixtures and explicitly deliver obsolete-file events,
  preserving all recovery, closure and no-stale-update assertions.
- Bound root test/check concurrency to the same two-task budget used by CI. Serialize
  real Vite watcher files on macOS as on Windows; polling-recovery lifecycle fixtures
  close native delivery, while filesystem HMR/build fixtures use content polling to
  avoid startup event batches. All positive and negative assertions remain active.
- Read grouped production manifest values in the Next query fixture.
- Wait for the browser to expose an owned stylesheet before disabling its original
  link. Gecko delays `style.sheet` until imported stylesheets load. Keep the original
  link active while loading; CSS bytes, resource ownership and disposal stay unchanged.
- Test preload reuse with real cacheable, cross-origin HTTP responses. Browser routing
  disables HTTP caching; assertions still require exactly one program and stylesheet request.
- Use the existing isolated Firefox application descriptor automatically on macOS;
  ordinary Playwright arguments and the Chromium/WebKit projects remain available.
- Update native package consumer smoke to Manifest v6/language v16 and full native
  `background` declarations. Packing, npm installation, addon loading, CLI ABI checks,
  emitted-global ownership and use-after-disposal assertions remain active.
- Validate the intentional ESLint demonstration errors exactly, including unexpected
  or missing diagnostics. Ordinary Laravel lint no longer rewrites source files.
- Align Laravel's React types with its hoisted component dependencies and deduplicate
  compatible workspace React types. Declare Ziggy's JavaScript dependency directly,
  removing PHP-vendor aliases from TypeScript and Vite so frontend/SSR checks use
  the same installed module without a Composer bootstrap.
- Keep Angular's Jasmine runner on 6.3, compatible with the existing Zone testing
  patch; Jasmine 7 makes the patched methods read-only. All three browser assertions
  remain unchanged. Integration lab fixtures resolve each declared dependency from
  its workspace owner and use the current Rsbuild `rsbuildConfig` API.
- Update optional React/Vue/Lit and Webpack/Rspack/Rsbuild fixture routes, host
  scaffolds, static defaults and JavaScript-engine asset expectations to current guides.

## CSS Snapshot Review

The previous snapshot came from `b8aa39586`, before the subsequent homepage
refinements and current authored native styles. This repair does not change CSS
generation, preset values, class matching or cascade policy to match an old snapshot.

Compared against the old approved snapshot:

- 448 routes and 148 delivery contracts remain; the project manifest is byte-identical.
- Unique delivered CSS segments increase from 2,843 to 3,275: 829 added, 397 removed.
- The homepage's delivered CSS changes from 189,881 to 325,435 bytes; its class list
  changes from 580 to 738. Added/changed content includes current homepage workflow,
  agent and editor figures, native rules and compiler-owned keyframe slots.
- Independent Node and Bun production builds produced identical complete contract
  objects: project manifest, every route, exact CSS segments and hydration resources.
- A fresh full Bun site build produces 448 pages and validates all 92 referenced assets.
- Browser QA covers the homepage, React installation guide and color Reference at
  390 and 1440 pixels in light/dark mode: 12 combinations, zero page exceptions or
  horizontal overflow. Desktop/light and mobile/dark homepage screenshots were inspected.

The user's explicit request to repair the CSS snapshot, the reviewed CSS diff and
this browser QA authorize refreshing the baseline. The snapshot's approval reference
points to this section; its schema and historical semantic/public baseline fields stay intact.
Screenshots and exact build-comparison evidence are retained for this session under
`/tmp/master-css-toolchain/`, outside the repository.

## Validation

- `bun run check`: all 114 selected tasks pass, including package tests/lint/types,
  Rust formatting/Clippy/tests, codegen/parity, package/API/release contracts and sizes.
- Runtime browser suite: 600/600 pass across Chromium, Firefox and WebKit.
- Next E2E: 11/11 pass. Native tarball consumer smoke passes on darwin-arm64.
- Site build, type checking, lint and browser QA pass. Existing style-order warnings
  remain warnings; no lint rule or semantic diagnostic is disabled.
- All six defined example lint tasks pass. Intentional bad examples remain covered.
- All 37 example build tasks pass. Laravel's types and client/SSR build pass;
  React/Next example types and site types also pass after React type deduplication.
  Svelte check reports zero errors/warnings. Angular's three Karma tests pass in
  headless Chromium, and all seven integration lab tests pass. Angular, integration
  lab and benchmarks have no defined lint script.
- All 13 site test scripts pass, including the refreshed exact CSS snapshot;
  all five framework and six bundler installation fixture builds pass.
- Benchmark unit tests: 99 pass. AI context tests: 3 pass. Storage safety
  regressions: 18 pass; the Bun command uses an explicit path for its nonstandard filename.
- Runtime benchmark completes with three measured rounds and one warmup on local
  Chromium. This is an advisory functional/performance smoke, not a before/after claim.
  All three existing runtime size budgets pass. No browser engine payload or program
  format changes are introduced; the added load callback is confined to owned sheets.

The root `bun run check` and `bun run e2e` commands pass after the snapshot update.
The site script matrix includes every defined `test:*` script, with no ignored or
permitted failures. Frozen Bun installation preserves the lockfile and workspace
package manifests. These results were verified locally on macOS arm64; existing
lint warnings and upstream deprecation notices remain non-failing diagnostics.
