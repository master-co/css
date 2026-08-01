# AI Notes For `benchmarks`

## Responsibility

`benchmarks` contains advisory measurement suites and report helpers for Master CSS performance, payload, diagnostics, and comparison work. It measures CSS output size, CSS structure, build performance, build/extraction/compiler/startup diagnostics, Master delivery modes, progressive hydration diagnostics, browser CSS cost, Tailwind static comparison snapshots, and CI benchmark report packaging.

Benchmark results are evidence for investigation. They do not replace correctness tests, package validation, or intentional review of CSS output and runtime behavior.

## Owns

- Benchmark fixture and adapter metadata.
- Static fixture source used by Master CSS, Tailwind CSS, and browser-control variants.
- Shared benchmark runner, report, stats, environment, bytes, static build, delivery mode, progressive hydration, browser cost, and diagnostic helpers.
- Vitest benchmark entrypoints under each suite directory.
- `BenchmarkReport` data shape, metric IDs, suite IDs, fixture IDs, adapter IDs, sample summaries, report limits, and artifact metadata.
- Local report output under `benchmarks/.results/**`.
- CI helpers that normalize engine/runtime benchmark reports and compare GitHub Actions artifact history.
- Tailwind static comparison snapshot tooling.

## Does Not Own

- Product correctness for parser, compiler, engine, runtime, server, scanner, language tooling, ESLint, build integrations, framework integrations, examples, or site behavior.
- Generated CSS semantics, cascade order, hydration correctness, runtime lifecycle policy, or public package APIs.
- Release gates or pass/fail thresholds for benchmark history.
- Published user documentation.

## Key Files

- `package.json`
- `fixtures/manifest.ts`
- `fixtures/static.ts`
- `shared/types.ts`
- `shared/runner.ts`
- `shared/report.ts`
- `shared/static-build.ts`
- `shared/delivery-modes.ts`
- `shared/browser-cost.ts`
- `shared/browser-lifecycle-{metrics,page,measurement,samples,server}.ts`
- `shared/interaction-cost-{config,metrics,page,harness}.ts`
- `shared/delivery-mode-{metrics,samples,harness}.ts`
- `shared/runtime-mutation-diagnostic-{metrics,samples}.ts`
- `shared/runtime-style-invalidation-{config,metrics,variants,samples}.ts`
- `ci/write-benchmark-report.js`
- `ci/compare-benchmark-history.js`

## Risk Areas

- Reporting numbers without first validating package correctness.
- Treating noisy local benchmark values as deterministic pass/fail signals.
- Changing fixture intent while presenting before/after numbers as comparable.
- Changing metric, suite, fixture, adapter, or report JSON IDs without updating all consumers.
- Committing generated benchmark output, temporary workspaces, traces, screenshots, local `node_modules`, or downloaded history artifacts.
- Hiding measurement limits, machine details, package versions, browser versions, or sample counts.
- Letting diagnostics change runtime, server, compiler, CSS output, or hydration behavior.
- Comparing Master CSS and Tailwind CSS fixtures as identical source code rather than equivalent rendered UI intent.

## Safe Changes

- Adding a focused benchmark suite that records clear metrics, limits, environment details, package versions, and useful artifacts.
- Updating report text, metric descriptions, or artifact collection to make measurement limits clearer.
- Adding diagnostic-only data that does not change product behavior.
- Updating fixture metadata when a suite intentionally starts or stops covering a fixture.
- Updating snapshots only when the benchmark comparison baseline intentionally changes and the change is explained.

## Dangerous Changes

- Changing product code to improve benchmark numbers without package tests and intentional behavior review.
- Changing CSS output, cascade order, hydration behavior, runtime lifecycle, extraction behavior, or public APIs from benchmark code.
- Adding dependencies when existing Node, Vitest, Playwright, CSS Tree, or workspace helpers are sufficient.
- Serializing compiled indexes or caches into runtime/browser payloads to make benchmark setup faster without bundle-size review.
- Reusing `.results` output as checked-in fixture data.
- Publishing `report-smoke` values as real benchmark results.

## Validation

There is no package-local lint script in `benchmarks/package.json`.

For documentation-only benchmark changes, run:

```sh
git diff --check -- benchmarks/AI.md
```

For report-shape or shared report helper changes, run:

```sh
pnpm --filter ./benchmarks bench:report-smoke
```

For suite-specific code changes, run the smallest relevant suite:

```sh
pnpm --filter ./benchmarks bench:<suite>
```

Use the package script names from `benchmarks/package.json`, such as `bench:css-output-size`, `bench:css-structure`, `bench:build-performance`, `bench:master-delivery-modes`, `bench:progressive-hydration-diagnostics`, or `bench:browser-css-cost`.

If a snapshot is intentionally changed, run the relevant snapshot command and explain the new baseline.

## Benchmark Guidance

Run correctness validation for the affected product package before reporting benchmark numbers. Benchmarks should support a known hot path or diagnostic question, not substitute for tests.

When adding or changing a suite, keep the internal contracts consistent:

- Add or update `BenchmarkSuiteId`, fixture coverage, adapter metadata, metrics, package scripts, and report schema usage together.
- Include `environment`, package versions, metric units, summary samples, limits, and artifacts when artifacts help review the result.
- Keep generated output in `benchmarks/.results/**`; do not commit reports, workspaces, traces, screenshots, or history downloads.
- Make comparison limits explicit, especially for machine noise, Chromium trace event naming, cold versus warm cache, static versus runtime delivery, and Tailwind fixture equivalence.
- Prefer focused suites over broad benchmark runs. Use `BENCHMARK_ROUNDS`, suite-specific round environment variables, and `BENCHMARK_COMMAND_TIMEOUT_MS` only to tune measurement collection, not to hide failures.

In final reports, state the command run, environment limits, whether correctness validation ran first, what changed in CSS output or runtime behavior if anything, and why any benchmark or snapshot was skipped.
