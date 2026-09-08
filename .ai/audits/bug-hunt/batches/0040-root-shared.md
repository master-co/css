# 0040 Root/shared validation contracts

- HEAD9bc565e512744e7fe6e4f28ae42fafa71f8b18ad. README/current coverage0039 read. Scope SUP-root/SUP-shared and migration evidence. Root package scripts, shared vitest-ci/config/tsdown-package config, check script entrypoints and write guards read. Shared has no package.json or lint script.
- Only non-writing check modes; no aggregate root build/check because those can generate tracked artifacts or rerun intentionally failing security repros. Existing builds in0006/0023/0030 etc exercise shared package config consumers. Pending root checks and explicit timeout controls.

## Results

All commands ran at repository root; logs are `evidence/0040-<script-name>.log` with ':' replaced by '-'.

- PASS: `pnpm run test:ai-context` (3 normal/error/stale-exception tests), `check:ai-context`, `check:artifacts` (635 text artifacts), `check:boundaries`, `check:mdn-registry`, `check:release` (35 package ordering checks). Release checker only checks config, does not publish.
- Existing baseline/check failures (exit1), not newly introduced product bugs: `check:packages` public API golden lacks already-exported language session symbols; `check:api-census` differs in internal consumers after external site/internal update; `check:runtime-size` fresh runtime raw49993 > baseline48551+1024; `check:migration` cannot extract LanguageColorFormatIr from historical contract source. Current source contains the struct; failure occurs while computing historical baseline surfaces at rust-contracts.mjs364. No evidence/golden updated and no release behavior inferred.
- `CI=false GITHUB_ACTIONS=false node --import tsx .ai/audits/bug-hunt/repros/shared-contracts.mts` and CI=true variant: PASS ([normal](../evidence/0040-shared-false.log), [CI](../evidence/0040-shared-true.log)). Default/short/long/missing timeouts checked, input untouched. Shared build config exercised by actual package builds already recorded; declarations/private internal bundling checked by artifact checks. No package-local shared lint script.
- Normal and error behavior of governance checks observed. Runtime size drift is a measured baseline failure; no performance regression claim without comparable historical rebuild. Migration historical signature drift remains a tooling failure to investigate beyond this bounded check; root script behavior is recorded, not silently marked passing.
- Completed bounded scope; no new product findings or source changes. Next benchmarks report/harness validation.
