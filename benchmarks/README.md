# Master CSS benchmarks

Advisory measurement suites for Master CSS build, delivery, browser and runtime costs. The published charts and their limits are on the [Benchmarks page](https://rc.css.master.co/benchmarks); this file records how the data is produced and how to read it.

## Methodology

### Fixture matrix
Fixture-based suites compare equivalent UI output, not identical class strings.

| Fixture | Purpose | Stress area |
|---------|---------|-------------|
| `minimal` | Small useful page or landing section | Framework overhead, cold-start cost, and minimum payload |
| `docs` | Dense article, navigation, code blocks, tables | Documentation layout, typography, nested content, and CSS output shape |
| `dashboard` | Repeated cards, tables, filters, charts, states | Rule reuse, duplicated utilities, and large DOM |
| `dynamic` | Insert, remove, and toggle classes during interaction | Runtime mutation, extraction limits, and recalculation cost |
| `stress-css` | Controlled small, medium, and large CSS outputs | Browser style calculation as CSS volume grows |
| `stress-dom` | Large DOM with fixed CSS | DOM/style/layout scaling isolated from CSS output size |

Each fixture should publish source markup, Master CSS setup, Tailwind CSS setup when relevant, generated outputs, and exact commands.

### Metric families
| Area | Examples |
|------|----------|
| Payload | Raw, gzip, and brotli asset sizes; embedded-fragment diagnostics; recorded request count |
| CSS structure | Rule count, selector count, declaration count, cascade layers, at-rules, custom properties, and selector complexity |
| Build | Cold command, repeat command, startup probes, scanner time, extraction time, and compiler time |
| Browser load | Navigation-ready time, stylesheet parse/attach, style recalculation, layout, paint, long tasks, and cache mode |
| Runtime | Bootstrap, observe/hydrate, rule generation, CSSOM insertion/deletion, MutationObserver delivery, retained generated rules, and cleanup cycles |
| Interaction | Existing-class toggles, new-rule generation, DOM append/remove, theme switch, viewport/container resize, and INP-style local latency |
| Correctness | Output hash, screenshot smoke, computed-style assertions, missing-rule checks, generated file inventory, cleanup validity, and progressive adoption |

Browser timings should be measured with fixed viewport, device scale, browser version, warmup rounds, measured rounds, and separated cold/warm cache modes when cache state changes interpretation.

### Delivery modes
| Mode | Benchmark focus |
|------|-----------------|
| Runtime | Runtime bundle size, manifest delivery, initial DOM scan, CSSOM insertion/deletion, mutation handling, and repeated mutation cleanup |
| Static | Generated stylesheet size, source scanning, source include/exclude behavior, safelist/blocklist, warm rebuild, and mixed authored CSS |
| Progressive | Inline first-page CSS, hydration manifest size, runtime adoption success/fallback, and post-hydration dynamic classes |

Runtime and progressive rendering optimize what CSS is delivered up front. They do not make browser style calculation free: when an interaction creates many first-time utility rules, the browser still needs to account for those new stylesheet rules before it can paint the updated DOM.

### Tailwind CSS comparisons
The snapshots identify Tailwind CSS v4 tooling and its official entrypoints for static output, production build and static browser-control measurements. Preserve the matching lockfile and source revision when reproducing a comparison; declared dependency ranges alone are insufficient.

Runtime-equivalent claims should be avoided because Tailwind CSS does not perform the same client-side class observation work as Master CSS runtime rendering. In the runtime/CSSOM hypothesis, Tailwind CSS represents the zero-runtime static baseline, not a runtime competitor.

### Publication rules
Interpret each result together with its fixture, mode, date, browser, machine, cache state and sample count. The committed snapshots retain these details where the suite collected them. Missing information limits what can be reproduced or compared.

The public data does not include real-user Web Vitals or Lighthouse scores. Trace events and local interaction measurements answer narrower questions; they cannot establish how another application's users will experience the page.

## Data sources
The charts read committed snapshots under `benchmarks/**/snapshot.json` and `benchmarks/browser-lifecycle/long-session-evidence.json`. The table preserves the commands recorded for those snapshots. Reproducing them requires the corresponding source revision and dependency lockfile, not just a current package installation.

The current lifecycle fixtures fail their computed-style validation with the current preset, so the recorded commands do not currently produce a comparable report. Update and verify the fixture styling before collecting new timings. The published snapshots remain historical evidence; their shape checks do not establish that the current benchmark runner reproduces them.

| Result | Committed data | Recorded snapshot command |
|--------|----------------|------------------|
| Page CSS size | [`docs-page-css-size/snapshot.json`](./docs-page-css-size/snapshot.json) | `UPDATE_BENCHMARK_SNAPSHOT=true pnpm --filter ./benchmarks bench:docs-page-css-size` |
| Static CSS output, structure, and production build | [`tailwind-static-comparison/snapshot.json`](./tailwind-static-comparison/snapshot.json) | `pnpm --filter ./benchmarks bench:css-output-size`, `pnpm --filter ./benchmarks bench:build-performance`, `pnpm --filter ./benchmarks bench:css-structure`, then `pnpm --filter ./benchmarks snapshot:tailwind-static-comparison` |
| Build path diagnostics | [`build-path-diagnostics/snapshot.json`](./build-path-diagnostics/snapshot.json) | `BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:startup-diagnostics`, `BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:build-diagnostics`, `BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:compiler-diagnostics`, `BENCHMARK_ROUNDS=3 pnpm --filter ./benchmarks bench:extraction-diagnostics`, then `pnpm --filter ./benchmarks snapshot:build-path-diagnostics` |
| Browser CSS cost | [`browser-css-cost/snapshot.json`](./browser-css-cost/snapshot.json) | `pnpm --filter ./benchmarks bench:browser-css-cost`, then `pnpm --filter ./benchmarks snapshot:browser-css-cost` |
| Master CSS delivery modes | [`master-delivery-modes/snapshot.json`](./master-delivery-modes/snapshot.json) | `pnpm --filter ./benchmarks bench:master-delivery-modes`, then `pnpm --filter ./benchmarks snapshot:master-delivery-modes` |
| Interaction cost | [`interaction-cost/snapshot.json`](./interaction-cost/snapshot.json) | `INTERACTION_COST_ROUNDS=3 INTERACTION_COST_WARMUP_ROUNDS=1 pnpm --filter ./benchmarks bench:interaction-cost`, then `pnpm --filter ./benchmarks snapshot:interaction-cost` |
| Browser lifecycle | [`browser-lifecycle/snapshot.json`](./browser-lifecycle/snapshot.json) | `BROWSER_LIFECYCLE_ROUNDS=3 BROWSER_LIFECYCLE_WARMUP_ROUNDS=1 BROWSER_LIFECYCLE_REPORT_LABEL=baseline-review-$(date +%F) BENCHMARK_COMMAND_TIMEOUT_MS=900000 pnpm --filter ./benchmarks bench:browser-lifecycle`, then `pnpm --filter ./benchmarks snapshot:browser-lifecycle` |
| Five-minute lifecycle evidence | [`browser-lifecycle/long-session-evidence.json`](./browser-lifecycle/long-session-evidence.json) | Run `bench:browser-lifecycle` once per mode with `BROWSER_LIFECYCLE_SCENARIOS=long-session`, `BROWSER_LIFECYCLE_MODES=<mode>`, `BROWSER_LIFECYCLE_ROUNDS=1`, `BROWSER_LIFECYCLE_WARMUP_ROUNDS=1`, `BROWSER_LIFECYCLE_LONG_SESSION_MS=300000`, `BROWSER_LIFECYCLE_MEASURE_TIMEOUT_MS=420000`, `BROWSER_LIFECYCLE_REPORT_LABEL=long-session-5m-<mode>`, and `BENCHMARK_COMMAND_TIMEOUT_MS=900000`, then `pnpm --filter ./benchmarks evidence:browser-lifecycle` |

### Validate the recorded data

Run these checks from the repository root:

```bash
bun run --filter master-css-benchmarks check:browser-lifecycle
bun run --filter master-css-benchmarks check:browser-lifecycle browser-lifecycle/long-session-evidence.json --profile long-session-evidence
```

The first command checks the committed lifecycle snapshot; the second checks the five-minute evidence. Neither command launches a browser or creates new measurements.

For a new report, pass its path and the appropriate `baseline` or `long-session` profile to `check:browser-lifecycle`. The no-argument command still checks the committed snapshot. Collect same-machine repeat reports before running the suite’s stability comparison, and keep raw reports and traces under `benchmarks/.results/`. Review fixture correctness and measurement conditions before replacing a public snapshot.
