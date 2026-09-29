# Canonical token families implementation report

Validated on 2026-09-29 against the implementation accompanying this report.

The Rust registry now defines 138 built-in families with one prefix, one property, and one namespace per entry. Direct values retain full native property names; named tokens use the sole canonical prefix; combinations and parameterized styles remain mixins. Namespaces and theme token identities are unchanged. Custom mixins and registered native classes are not rejected merely for resembling retired spellings.

Intentional changes:

- Removed full-property token aliases, overloaded `font-*`, duplicate `text-stroke-color-*`, and color mappings for filter, backdrop-filter and text-shadow. `shadow-*` reads only the shadow namespace.
- Removed selector shortcuts and implicit vendor rewrites. Native legacy pseudo-element spellings remain native. Underscore decoding protects attributes, strings, comments, escapes, non-selector arguments and identifier boundaries.
- Math normalization uses lexer ranges for calc/min/max/clamp. It preserves literals, unary signs, exponents and native function spelling, and no longer inserts calc into clamp. Native stylesheets do not receive class conveniences.
- Unicode and escaped property names retain emitted spelling and decoded dependency identity. Resource removal is covered by tests.
- Removed the public alias registry/type and `preferPropertyAliases`; the retired setting is rejected. Completion, inspection, lint, reference and MCP use canonical families.
- Language version is 10 and binding ABI is 20. Manifest remains v4. MCP manifest-query payload is v4 with `families`; its outer envelope remains v3. Other unchanged batch shapes keep their existing versions.
- Existing RC migration uses compiler-private historical data. Proposals containing removed current syntax require manual review and block writes. No new migration profile was introduced.

The public migration guide is `site/app/[locale]/guide/migration/v2-rc/content.mdx`. It includes token and selector tables, removed APIs/settings, and coordinated recompilation requirements. Site markup, examples, reference output, llms sources, current corpora and CSS contract snapshots were updated. Most diff volume comes from canonical class replacements and the generated CSS contract snapshot.

Validation results:

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
