# Testing Policy

## General Rule

Run the smallest meaningful package-scoped validation first. Broaden to root tests when a change crosses package boundaries, affects public APIs, or changes CSS output.

Package lint is mandatory for every changed workspace package that defines a package-local `lint` script. For multi-package changes, run lint once per affected package with `pnpm --filter <package> lint`; if an affected package has no package-local lint script, report that explicitly.

## Performance Benchmarks

Benchmarks are advisory guardrails, not exact CI pass/fail gates. Run correctness validation first, then run the relevant benchmark when a change touches an engine or runtime hot path unless the change is documentation-only or purely type-only.

Engine hot paths live in `crates/mastercss-engine/src/lib.rs` and include matcher/index behavior, value parsing, selector/condition generation, priority sorting, layer insertion, resource tracking, and manifest compilation/cache behavior. The TypeScript engine wrapper is startup/FFI overhead, not a semantic hot path.

Runtime hot paths include `@master/css-binding-wasm-engine`, `packages/runtime/src/core.ts`, DOM hydration, class mutation tracking, transition mapping, CSSOM insertion/deletion, and the global browser bundle.

For performance-sensitive engine or runtime work, the final response must report:

- Whether the relevant benchmark ran; if not, why not.
- Whether bundle size or runtime payload is likely affected, including raw/gzip/brotli checks when browser bundles, engine bundles, or runtime default manifest JSON changed.
- Memory, cold-start, and runtime CPU tradeoffs when meaningful.
- CSS output, cascade order, or hydration behavior changes.

Compare before/after when feasible using a temporary worktree or a documented baseline. Do not present benchmark numbers without stating the environment and limitations. If a benchmark is noisy or blocked, report the attempted command, blocker, and closest validated proxy.

Benchmark history must not be committed to the repository. On `main`, `alpha`, `beta`, `rc`, and `canary`, the benchmark workflow runs only when benchmark inputs, Rust crates, schema, CSS execution, tooling, preset, runtime, or shared workspace build configuration change; it can always be started manually. It stores package benchmark reports as GitHub Actions artifacts, compares against the latest matching artifacts, and ignores artifacts beyond the latest 50 per branch and package.

Do not chase benchmark wins by changing CSS output, cascade order, hydration checks, or public behavior unless the behavior change is intentional and tested. Do not serialize compiled indexes or caches into `MasterCSSManifest` unless the manifest explicitly justifies the browser payload impact.

## Change-Type Matrix

| Change | Required Validation |
|---|---|
| Parser/value parsing | Rust engine tests plus `pnpm --filter @master/css test` |
| Selector parsing/generation | Engine selector tests; generated CSS tests |
| Condition parsing/generation | Engine condition tests; ordering tests if priority changes |
| Syntax rule definitions | Engine rule test for emitted declarations and text |
| Rule priority/cascade | Engine priority/layer tests and fixture review |
| Variables/tokens/modes | Compiler manifest lowering and engine variable tests; server/runtime fixtures if output or hydration changes |
| Manifest lowering/execution | Compiler manifest lowering tests and engine parity tests |
| Server rendering | `pnpm --filter @master/css-server test` |
| Static scanning | `pnpm --filter @master/css-tooling test`; add scanning false positive/negative cases |
| Runtime/hydration | `pnpm --filter @master/css-runtime e2e` |
| Vite plugin | `pnpm --filter @master/css-vite test`; run affected example build if integration-level |
| Language primitives | `pnpm --filter @master/css-tooling test` |
| Language service | `pnpm --filter @master/css-language-service test` |
| Language server | `pnpm --filter @master/css-language-server test` |
| ESLint plugin | `pnpm --filter @master/eslint-plugin-css test` |
| Validator | `pnpm --filter @master/css-tooling test` |
| CLI | `pnpm --filter @master/css-cli test` |
| Public exports/types | Package build and type-check; downstream package checks if needed |

## Snapshots And Fixtures

Only update snapshots or `generated.css` fixtures when:

1. The behavior change is intentional.
2. The new output is explained.
3. The affected package has a regression test or fixture.
4. Cross-package effects are considered.

## Regression Tests

Prefer tests that cover the smallest behavior:

- Engine syntax/parser output: Rust engine tests plus `packages/css/tests/engine`
- Manifest lowering behavior: `packages/compiler/tests` or `packages/preset/tests`
- Server output: `packages/server/tests/fixtures`
- Runtime hydration: `packages/runtime/e2e/progressive`
- Scanner source scanning: `packages/tooling/tests/scanner`
- Language primitives: `packages/tooling/tests/language`
- Language service features: `packages/language-service/tests`
- ESLint parser/autofix behavior: `packages/eslint-plugin/tests`

Issue regressions should use `tests/issues/<issue-number>.test.ts` inside the affected package. Keep fixture files under `tests/fixtures/**`; keep browser suites in package-local `e2e/**` unless the test is specifically an issue regression.
