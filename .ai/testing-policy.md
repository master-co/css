# Testing Policy

## General Rule

Run the smallest meaningful package-scoped validation first. Broaden to root tests when a change crosses package boundaries, affects public APIs, or changes CSS output.

## Change-Type Matrix

| Change | Required Validation |
|---|---|
| Parser/value parsing | `pnpm --filter @master/css-engine test`; add focused parser/rule tests |
| Selector parsing/generation | Engine selector tests; generated CSS tests |
| At-rule parsing/generation | Engine at-rule tests; ordering tests if priority changes |
| Syntax rule definitions | Engine rule test for emitted declarations and text |
| Rule priority/cascade | Engine priority/layer tests and fixture review |
| Variables/tokens/modes | Compiler plan lowering and engine variable tests; server/runtime fixtures if output or hydration changes |
| Plan lowering/execution | Compiler plan lowering tests and engine parity tests |
| Server rendering | `pnpm --filter @master/css-server test` |
| Static extraction | `pnpm --filter @master/css-extractor test`; add extraction false positive/negative cases |
| Runtime/hydration | `pnpm --filter @master/css-runtime e2e` |
| Vite plugin | `pnpm --filter @master/css.vite test`; run affected example build if integration-level |
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
- Plan lowering behavior: `packages/compiler/tests` or `packages/preset/tests`
- Server output: `packages/server/tests/fixtures`
- Runtime hydration: `packages/runtime/e2e/progressive`
- Extractor source scanning: `packages/extractor/tests`
- Language features: `packages/language-service/tests`
- ESLint parser/autofix behavior: `packages/eslint-plugin/tests`

Issue regressions should use `tests/issues/<issue-number>.test.ts` inside the affected package. Keep fixture files under `tests/fixtures/**`; keep browser suites in package-local `e2e/**` unless the test is specifically an issue regression.
