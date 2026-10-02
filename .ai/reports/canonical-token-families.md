# Canonical token families

The current preset defines 124 direct-value families and 8 recipes in `packages/preset/src/mixins.css`. Rust infers family metadata from loaded definitions. Language and tooling sessions expose it through `tokenFamilies()`; the site generates its catalog from the active preset manifest. See `site/app/[locale]/guide/directives/contract.mdx` for the current contract.

## Validation recorded on 2026-09-29

These results describe the implementation measured on that date; they are not validation of subsequent changes.

| Check | Result |
| --- | --- |
| Rust engine, lexer, lint, language and compiler suites | Passed after correcting obsolete expectations; affected failures rerun successfully |
| Final engine suite and canonical selector boundaries | Passed |
| Workspace Clippy with warnings denied; final engine/xtask rechecks; rustfmt | Passed |
| Native and all three Wasm artifact builds | Passed |
| `cargo xtask parity` and codegen check | Passed |
| Final native/Wasm engine corpus | 69 tests passed |
| Affected JS package suites and focused regressions | Passed, including canonical diagnostics, binding contracts, compiler, tooling, language, preset, ESLint, MCP and server |
| Next integration | 206 tests passed |
| CLI | 88 tests verified across the full run and focused rerun, including 13 migration tests; the new test proves removed-prefix proposals are not written |
| Package build / full type check | 32 / 40 tasks passed; subsequently affected type checks rerun successfully |
| Core package lint | All 17 modified core workspace packages passed |
| Site lint | Passed with 163 warnings and no errors |
| Example lint | Laravel and Next passed with warnings; React limitation below |
| Runtime / hydration in Chromium and WebKit | Final 90 tests passed across static, SSR, runtime and progressive paths |
| Site production build | Passed; 844 Next pages and 1,261 static HTML routes; 95 assets verified |
| Site docs / reference / llms / syntax / atomic authoring | 17 / 20 / 32 / 14 / 3 tests passed |
| Site CSS contract | Passed: 128 delivery contracts, 1,741 generated rules and 3,947 exact CSS segments |
| API census / package contracts / dependency boundaries | Passed: 876 API records and 36 package contracts |
| AI context budget and whitespace diff check | Passed |
| Engine benchmark | Five scenarios completed successfully with `pnpm --filter @master/css bench --run` |
| Runtime size gate | Passed |

Angular, Blank, Lit, Vite and Webpack example workspaces have no lint script. No package versions, dependencies, release configuration or CI workflows were changed.

Measured artifact sizes in bytes; gzip level 9, Brotli quality 11:

| Artifact | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| Runtime global.min.js | 47,819 | 13,165 | 11,895 |
| Engine Wasm | 1,294,922 | 358,306 | 265,373 |
| Compiler Wasm | 8,509,455 | 1,902,475 | 1,180,784 |
| Tooling Wasm | 5,459,595 | 1,446,163 | 947,582 |

Runtime is below the existing committed size baseline by 1,968 / 828 / 655 bytes respectively. No comparable before-change Wasm measurement or throughput baseline was captured, so these results do not establish a speed improvement. The benchmark reporter reports scenario completion without a throughput table.

Checks that did not pass or could not complete:

- Firefox exits before running tests with `Could not find profile folder`. Retrying with a dedicated temporary directory produced the same environment failure. Firefox behavior remains unverified.
- React example lint reports the existing `Unknown mixin --scale` in `examples/react/src/App.tsx:11`; the unrelated recipe was not changed.
- The additional `check:migration` historical ledger check rejects a changed target-test digest for `rc87-1a9fdd25ef07d349`. The required current test changes invalidate that old approval digest. `parity/rust-semantic-corpus.json` and `parity/rust-refactor-contract-evidence.json` remain unchanged, as requested; the ledger was not weakened or rewritten to claim historical parity.
- The optional runtime benchmark times out on its progressive hydration success fixture. That existing fixture still constructs hydration version 2. The required engine benchmark passed, and the current hydration contract passed the browser correctness suites; runtime benchmark measurements are unavailable.
