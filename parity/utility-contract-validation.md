# Utility contract validation

Baseline: `70ed3f6c0e74f42ca1d5101c4ac4bce3e01253db`, initially clean worktree. This report records checks performed before the utility-contract implementation was committed; it does not describe a released product version. The old release binding, preset, runtime artifacts and initial outputs were saved before changes in `/tmp/master-utilities-contract-baseline`.

## Intentional contract changes

- Four authoring forms remain: static names, hyphen enums, ordered token namespaces using `~`, and raw `key:<*>`. Removed raw kinds, colon enums and `=namespace` fail explicitly.
- Complete same-identity definitions replace earlier definitions before dependency resolution. Empty definitions still match. Ordered declarations, vendor fallbacks, nested rules, fixed composition and resource release are preserved.
- Indexed names determine intent. Native properties/aliases retain native intent; fixed names precede enums and tokens; conflicting enums/raw roots fail registration; token ambiguity remains a use-site diagnostic. Future valid pseudo-class syntax is not filtered by a support whitelist.
- Placeholder templates respect CSS tokens, strings, comments and nonrecursive insertion. Ordinary CSS functions are not rewritten.
- Text stroke raw values target the vendor shorthand; explicit width/color aliases and named color tokens preserve the intended longhand choices.
- ABI is 12 and `languageVersion` is 3. Manifest/hydration envelopes remain 1. Older language data requires regeneration. The two removed schema exports are intentionally removed from the public API census and documentation heading inventory.
- The fifth migration profile is `rc-utilities`. Legacy parsing stays in compiler/tooling migration code. The migration checks effective declarations, conditions, selectors and resources; ambiguous or expanded acceptance requires review and prevents batch writes.
- Tooling validates known math grammar without computing substitutions or dimensions. A definite error wins over an independent unknown expression. The runtime bundle contains no CSS grammar validator.

## Behavioral verification

`utility-contract-checks.json` records the commands, outcomes and log digests.

The Rust workspace test suite passed. After the final definition identity, resource comparison and compiler-manifest reuse changes, the affected compiler/engine suites were rerun; the dedicated new suites cover 18 definition cases and 6 migration cases. Workspace clippy with all targets/features and warnings denied passed. Formatting, codegen and native/Wasm parity also passed on the final sources.

All package builds passed (32 tasks). Package lint/type checks passed (68 tasks), followed by scoped reruns for late CLI, schema, compiler, runtime, Next, MCP and VS Code edits. Package tests passed with isolated reruns for MCP and VS Code timeouts under the original high-concurrency run. Next's stale version expectation was corrected and its affected test file rerun. CLI migration tests include preview, manual-review batch refusal and idempotence; the complete CLI suite passed (83 tests). MCP's actual tools/list schema and shared workflow evaluation passed; the structured trace is in `utility-contract-mcp-evaluation.json`.

The full runtime suite was exercised in Chromium, WebKit and Firefox. Chromium passed 136 tests; Firefox passed 136 tests. Five WebKit cases initially failed while a concurrent package build removed dist files; the affected files were rerun against stable artifacts and all 26 cases passed. Those transient runs are not counted as successful runs. The new utility fixture exercises static, SSR, runtime and progressive output, hydration, CSS variables and subsequent DOM updates in all three browsers.

On this macOS host, ordinary Playwright Firefox launch encounters the upstream profile/TCC problem. `node packages/runtime/scripts/test-isolated-firefox.mjs` uses a temporary application identity and temporary browser profile while reusing the installed test binary/resources. It does not modify the installed browser, personal profile or permissions. The full Firefox run passed with this setup. Related upstream reports: https://github.com/microsoft/playwright/issues/42768 and https://bugzilla.mozilla.org/show_bug.cgi?id=2062988.

Actual Next integration e2e passed (three files/four tests, including its bundler/static-export paths). No Next publication, snapshot verification or locking policy was weakened.

## Site CSS audit

`prepare-app`, executable documentation examples, reference headings, migration guide tests, type checking, the production build and public-asset validation passed. The final export has 1,240 HTML routes and 95 valid referenced public assets. Desktop 1440×1000 and narrow 390×844 browser checks confirm the RC Frameworks entry, five profiles, both return links, no horizontal overflow and no page errors. Heading link computed font size, line height and letter spacing equal their parent after the correction below.

The first candidate snapshot exposed one changed rule: old `text:inherit` generated the ineffective unknown property `text:inherit`; the new fixed `text` utility generated font size plus invalid arithmetic involving `inherit`. The sole official use was the document heading anchor. Removing that unnecessary class preserves its original inherited styling and eliminates the invalid value. Full-site lint initially found only these two errors. After the correction, both the affected-file lint and a complete site lint rerun passed with zero errors and 188 advisory warnings; the final type check also passed. Those existing warnings were not silently autofixed.

The final candidate differs from the old CSS snapshot only by removal of `.text\:inherit{text:inherit}`. All shared rule text and CSS segments are byte-identical; no new segments or changed shared segments remain. Counts change from 1,828 to 1,827 rules and 3,716 to 3,715 segments; route and delivery-contract counts remain 1,240 and 122. `utility-contract-site-css-audit.json` records the exact removal. The language/manifest fingerprint changes downstream delivery-contract IDs and route references, explaining the larger generated snapshot diff. The snapshot update binds to this review, not just new hashes.

## Performance

The release engine comparison uses the same host, workload and preset semantics, alternating before/after order for 45 rounds with 10 warmups. Two independent runs are retained in `utility-contract-performance-run1.json` and `utility-contract-performance-run2.json`. The 245-class workload generates byte-identical CSS before and after.

| Measurement | Before median | After median | Change, second run |
| --- | ---: | ---: | ---: |
| Engine creation | 16.140 ms | 16.526 ms | +2.4% |
| Inspect 245 classes | 5.117 ms | 2.888 ms | −43.6% |
| Generate 245 classes | 2.667 ms | 1.920 ms | −28.0% |
| Cached insertion | 0.0244 ms | 0.0246 ms | +0.9% |
| Delete and reinsert | 2.756 ms | 1.985 ms | −28.0% |
| 80 classes, 32 mode branches | 27.531 ms | 27.351 ms | −0.7% |

Complete delivered runtime JS + engine Wasm + manifest + workload hydration totals are 1,226,066 → 1,258,957 raw bytes, 346,839 → 355,702 gzip bytes (+2.6%), and 265,608 → 272,021 Brotli bytes (+2.4%). Assets are compressed individually; totals are not a concatenated-bundle estimate. Wasm accounts for the increase; the manifest shrinks and hydration size is unchanged. This workload does not establish universal speedups or model-generation accuracy.

A preliminary measurement accidentally compared the saved release binding with a debug artifact copied by the parity command. It was excluded, the release artifact rebuilt explicitly, and both valid paired runs repeated. Keep builds idle and do not use that preliminary result.

Compiler-side definition preservation costs more than the old fragment-only representation. The 1,000-definition stress case was measured separately and repeated after reusing already compiled, unchanged effective manifests. The first paired pipeline run was 26.0 → 89.3 ms; after removing redundant compilation it was 24.8 → 70.4 ms. Vendor-fallback definitions were 36.6 → 88.6 ms. This remaining regression is explicitly recorded, not counted as a performance improvement.

Final isolated stage medians (milliseconds):

| Definitions | Old parse / lower | New parse / lower | Definition IR bytes, old → new |
| --- | ---: | ---: | ---: |
| 100 | 0.51 / 0.94 | 1.41 / 4.44 | 69,464 → 93,310 |
| 1,000 | 5.94 / 12.45 | 18.28 / 49.31 | 713,257 → 957,675 |
| 5,000 | 44.30 / 175.09 | 104.67 / 254.31 | 3,617,257 → 4,857,675 |

The larger authoring IR retains complete bodies and source boundaries; lowering now resolves replacement, registration and the effective dependency graph. It also retains a validated engine for composition. The measurements localize the cost to parse/lower, and source inspection identifies these added operations; no CPU-profile percentage attribution is claimed. New lowering is approximately linear across these sizes. The runtime hot paths and full delivered payload remain within the accepted bounds, so the remaining build-time cost is accepted for the correctness contract, with follow-up optimization possible. See `utility-contract-authoring-performance.json` and `utility-contract-compiler-stages.json`. A third release engine repeat with binding digests is in `utility-contract-performance-final.json` and confirms the earlier result. This is a build-time cost, separate from runtime matching. The accepted Next complete-source verification tradeoff remains unchanged.

Reproduction: build native with `cargo xtask build-native --release`, then run `node --expose-gc scripts/benchmark-utility-contract.mjs BASELINE_DIRECTORY OUTPUT.json CURRENT_RELEASE_BINDING`. Do not run a parity/test command that copies a debug binding between these steps. Use `scripts/benchmark-native-components-compose.mjs --count 1000 --baseline-binding SAVED_RELEASE_BINDING --output OUTPUT.json` for the authoring comparison. For separated stages, run `node scripts/benchmark-utility-compiler.mjs OLD_RELEASE_BINDING NEW_RELEASE_BINDING OUTPUT.json`.

## Migration evidence audit

At validation time, historical evidence targeted the latest committed code-changing revision `704996ec05f588f510a12e69cbbec9727860db2e`. It cannot certify the utility-contract changes. Their semantic evidence is provided by the new fixtures, cross-binding checks and browser runs above; the historical ledger must also be regenerated against the implementation commit.

Thirteen stale test records were reviewed against actual source differences: binding inspection/native preservation; external JSON versus Next ESM delivery; explicit Astro/Nuxt rendering modes; resource ownership; native utility-layer cascade; and failed-import recovery. Their reasons state the approved behavior change rather than asserting byte equivalence. Public API, binding versions, raw compiler/engine surfaces, language diagnostics and integration defaults were likewise compared before refreshing their evidence.

Three previously unrepresentable renames now use explicit `targetId` evidence: universal facade URL handling, Wasm native-support-independent generation and Next standard ESM delivery. The mapping is approval- and digest-bound. Missing, ambiguous, reused or changed targets fail; a superset assertion cannot authorize a rename. Focused negative tests cover those safeguards.

A direct validation of the historical Rust-refactor ledger also identifies **501 pending evidence records**: 246 changed tests and 255 removed/unmatched test identities. These are evidence gaps across prior RC work, not 501 demonstrated product bugs. There are 504 exact preserved cases, 23 approved contract changes and 5 verified supersets; the 11 public surfaces have reviewed or exact evidence. The pending inventory is in `utility-contract-historical-audit-pending.json`. This task updates the specifically reviewed records and leaves the remainder visibly unresolved rather than mass-approving them.

The historical post-rc.87 overlay remains another release blocker: it still binds the old Next path-based facade and runtime fetch-fallback expectations to the current files. The current runtime uses direct JSON module imports; the old fetch-on-loader-construction cases have been replaced. That historical decision must explicitly distinguish the shared JSON facade from runtime hydration and Next ESM delivery before refreshing its evidence. Its approval was not silently rewritten or its checks disabled. `check:migration` therefore remains failing, with the first reported stale target at `packages/internal/src/manifest-facade.ts`.

## Release status

The implementation and migration-guide integration are delivered with executable evidence. Release readiness remains conditional on the historical migration evidence and hydration/Next overlay decisions above. The current implementation’s scoped checks, cross-binding parity, browser fixtures, package builds and site CSS verification passed. No publication was made by this task. No unmeasured AI accuracy improvement is claimed.
