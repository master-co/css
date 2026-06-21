# Testing Policy

## General Rule

Run the smallest meaningful package-scoped validation first. Broaden to root tests when a change crosses package boundaries, affects public APIs, or changes CSS output.

Package lint is mandatory for every changed workspace package that defines a package-local `lint` script. For multi-package changes, run lint once per affected package with `pnpm --filter <package> lint`; if an affected package has no package-local lint script, report that explicitly.

## Performance Benchmarks

Benchmarks are advisory guardrails, not exact CI pass/fail gates. Run correctness validation first, then run the relevant benchmark when a change touches an engine or runtime hot path unless the change is documentation-only or purely type-only.

Engine hot paths include `packages/engine/src/core.ts`, `packages/engine/src/utility.ts`, matcher/index behavior, value parsing, selector parsing/generation, at-rule parsing/generation, priority sorting, layer insertion, and manifest compilation/cache behavior.

Runtime hot paths include `packages/runtime/src/core.ts`, `packages/runtime/src/class-tracker.ts`, `packages/runtime/src/layer.ts`, `packages/runtime/src/utility-layer.ts`, DOM hydration, class mutation tracking, CSSOM insertion/deletion, and the global browser bundle.

For performance-sensitive engine or runtime work, the final response must report:

- Whether the relevant benchmark ran; if not, why not.
- Whether bundle size or runtime payload is likely affected, including raw/gzip/brotli checks when browser bundles, engine bundles, or runtime default manifest JSON changed.
- Memory, cold-start, and runtime CPU tradeoffs when meaningful.
- CSS output, cascade order, or hydration behavior changes.

Compare before/after when feasible using a temporary worktree or a documented baseline. Do not present benchmark numbers without stating the environment and limitations. If a benchmark is noisy or blocked, report the attempted command, blocker, and closest validated proxy.

Benchmark history must not be committed to the repository. The benchmark workflow stores package benchmark reports as GitHub Actions artifacts for `main`, `alpha`, `beta`, `rc`, and `canary`, compares against the latest matching artifacts, and ignores artifacts beyond the latest 50 per branch and package.

Do not chase benchmark wins by changing CSS output, cascade order, hydration checks, or public behavior unless the behavior change is intentional and tested. Do not serialize compiled indexes or caches into `MasterCSSManifest` unless the manifest explicitly justifies the browser payload impact.

## Change-Type Matrix

| Change | Required Validation |
|---|---|
| Parser/value parsing | `pnpm --filter @master/css-engine test`; add focused parser/rule tests |
| Selector parsing/generation | Engine selector tests; generated CSS tests |
| At-rule parsing/generation | Engine at-rule tests; ordering tests if priority changes |
| Syntax rule definitions | Engine rule test for emitted declarations and text |
| Rule priority/cascade | Engine priority/layer tests and fixture review |
| Variables/tokens/modes | Compiler manifest lowering and engine variable tests; server/runtime fixtures if output or hydration changes |
| Manifest lowering/execution | Compiler manifest lowering tests and engine parity tests |
| Server rendering | `pnpm --filter @master/css-server test` |
| Static extraction | `pnpm --filter @master/css-extractor test`; add extraction false positive/negative cases |
| Runtime/hydration | `pnpm --filter @master/css-runtime e2e` |
| Vite plugin | `pnpm --filter @master/css.vite test`; run affected example build if integration-level |
| Language primitives | `pnpm --filter @master/css-language test` |
| Language service | `pnpm --filter @master/css-language-service test` |
| Language server | `pnpm --filter @master/css-language-server test` |
| ESLint plugin | `pnpm --filter @master/eslint-plugin-css test` |
| Validator | `pnpm --filter @master/css-validator test` |
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

- Engine syntax output: `packages/engine/tests`
- Parser utility behavior: `packages/engine/tests`
- Manifest lowering behavior: `packages/compiler/tests` or `packages/preset/tests`
- Server output: `packages/server/tests/fixtures`
- Runtime hydration: `packages/runtime/e2e/progressive`
- Extractor source scanning: `packages/extractor/tests`
- Language primitives: `packages/language/tests`
- Language service features: `packages/language-service/tests`
- ESLint parser/autofix behavior: `packages/eslint-plugin/tests`

Issue regressions should use `tests/issues/<issue-number>.test.ts` inside the affected package. Keep fixture files under `tests/fixtures/**`; keep browser suites in package-local `e2e/**` unless the test is specifically an issue regression.
