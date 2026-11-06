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
| `static` | Generated stylesheet size, source scanning, source include/exclude behavior, safelist/blocklist, warm rebuild, and mixed authored CSS |
| `runtime` | Runtime bundle size, manifest delivery, initial DOM scan, CSSOM insertion/deletion, mutation handling, and repeated mutation cleanup |
| `prerender` | Renders CSS from each page's HTML without the browser runtime. The delivery benchmark has no separate measurements for this mode. |
| `progressive` | Inline first-page CSS, hydration manifest size, runtime adoption success/fallback, and post-hydration dynamic classes |

Runtime and progressive rendering optimize what CSS is delivered up front. They do not make browser style calculation free: when an interaction creates many first-time utility rules, the browser still needs to account for those new stylesheet rules before it can paint the updated DOM.

### Tailwind CSS comparisons
The snapshots identify Tailwind CSS v4 tooling and its official entrypoints for static output, production build and static browser-control measurements. Preserve the matching lockfile and source revision when reproducing a comparison; declared dependency ranges alone are insufficient.

Runtime-equivalent claims should be avoided because Tailwind CSS does not perform the same client-side class observation work as Master CSS runtime rendering. In the runtime/CSSOM hypothesis, Tailwind CSS represents the zero-runtime static baseline, not a runtime competitor.

### Publication rules
Interpret each result together with its fixture, mode, date, browser, machine, cache state and sample count. The committed snapshots retain these details where the suite collected them. Missing information limits what can be reproduced or compared.

The public data does not include real-user Web Vitals or Lighthouse scores. Trace events and local interaction measurements answer narrower questions; they cannot establish how another application's users will experience the page.

## Data sources
The charts read committed snapshots under `benchmarks/**/snapshot.json` and `benchmarks/browser-lifecycle/long-session-evidence.json`. The table preserves the commands recorded for those snapshots; run them from `benchmarks/`. Reproducing them requires the corresponding source revision and dependency lockfile, not just a current package installation.

The November 4, 2026 snapshots were recorded on an Apple M5 Max with Chromium 156.0.8078.4 and packages built from `add10eec6`, except the browser lifecycle snapshot and evidence, which come from `3fc239c6c`; the commits between them change the compiler and the static build hosts, not the runtime, the preset or the engine. The Master CSS documentation pages were measured from a production build of `add10eec6`. The suite runner is Bun; production commands run with the runner's JavaScript runtime, so compare build timings only within one runtime.

| Result | Committed data | Recorded snapshot command |
|--------|----------------|------------------|
| Page CSS size | [`docs-page-css-size/snapshot.json`](./docs-page-css-size/snapshot.json) | Serve the site's production build (`site/out`) at a local origin, then `UPDATE_BENCHMARK_SNAPSHOT=true DOCS_PAGE_CSS_SIZE_ORIGIN_OVERRIDES='{"https://rc.css.master.co":"http://127.0.0.1:4517"}' bun run bench:docs-page-css-size`. Omit the override to measure the deployed site. |
| Revision comparison | [`revision-comparison/snapshot.json`](./revision-comparison/snapshot.json) | See [Compare revisions](#compare-revisions) |
| Static CSS output, structure, and production build | [`tailwind-static-comparison/snapshot.json`](./tailwind-static-comparison/snapshot.json) | `bun run bench:css-output-size`, `BENCHMARK_ROUNDS=5 bun run bench:build-performance`, `bun run bench:css-structure`, then `bun run snapshot:tailwind-static-comparison` |
| Build path diagnostics | [`build-path-diagnostics/snapshot.json`](./build-path-diagnostics/snapshot.json) | `BENCHMARK_ROUNDS=3 bun run bench:startup-diagnostics`, `BENCHMARK_ROUNDS=3 bun run bench:build-diagnostics`, `BENCHMARK_ROUNDS=3 bun run bench:compiler-diagnostics`, `BENCHMARK_ROUNDS=3 bun run bench:extraction-diagnostics`, then `bun run snapshot:build-path-diagnostics` |
| Browser CSS cost | [`browser-css-cost/snapshot.json`](./browser-css-cost/snapshot.json) | `bun run bench:browser-css-cost`, then `bun run snapshot:browser-css-cost` |
| Master CSS delivery modes | [`master-delivery-modes/snapshot.json`](./master-delivery-modes/snapshot.json) | `bun run bench:master-delivery-modes`, then `bun run snapshot:master-delivery-modes` |
| Interaction cost | [`interaction-cost/snapshot.json`](./interaction-cost/snapshot.json) | `BENCHMARK_COMMAND_TIMEOUT_MS=900000 INTERACTION_COST_ROUNDS=3 INTERACTION_COST_WARMUP_ROUNDS=1 bun run bench:interaction-cost`, then `bun run snapshot:interaction-cost` |
| Browser lifecycle | [`browser-lifecycle/snapshot.json`](./browser-lifecycle/snapshot.json) | `BROWSER_LIFECYCLE_ROUNDS=3 BROWSER_LIFECYCLE_WARMUP_ROUNDS=1 BROWSER_LIFECYCLE_REPORT_LABEL=baseline-review-$(date +%F) BENCHMARK_COMMAND_TIMEOUT_MS=1800000 bun run bench:browser-lifecycle`, then `bun run snapshot:browser-lifecycle` |
| Five-minute lifecycle evidence | [`browser-lifecycle/long-session-evidence.json`](./browser-lifecycle/long-session-evidence.json) | Run `bench:browser-lifecycle` once per mode with `BROWSER_LIFECYCLE_SCENARIOS=long-session`, `BROWSER_LIFECYCLE_MODES=<mode>`, `BROWSER_LIFECYCLE_ROUNDS=1`, `BROWSER_LIFECYCLE_WARMUP_ROUNDS=1`, `BROWSER_LIFECYCLE_LONG_SESSION_MS=300000`, `BROWSER_LIFECYCLE_MEASURE_TIMEOUT_MS=420000`, `BROWSER_LIFECYCLE_REPORT_LABEL=long-session-5m-<mode>`, and `BENCHMARK_COMMAND_TIMEOUT_MS=1800000`, then `bun run evidence:browser-lifecycle` |

The Master CSS fixtures express the rendered values of the July 2026 fixtures in the current class syntax. Before publishing a new snapshot, compile each static fixture with `master-css generate --strict` and confirm that every class in its markup has a generated selector; a class the engine rejects produces no CSS and makes the output look smaller than it is.

### Compare revisions

The revision comparison runs two revisions' own benchmark runners on one machine. It is the only valid way to compare timings across revisions: snapshots recorded on different machines, browsers or JavaScript runtimes are not comparable.

1. Check out the baseline revision in a separate worktree, install it with its own lockfile and package manager, and build its packages.
2. In both checkouts, run `css-output-size`, `master-delivery-modes` and `interaction-cost` (3 rounds, 1 warmup). Use one Chromium build for both browser runs; an older Playwright can use it through `PLAYWRIGHT_BROWSERS_PATH` with a directory that names it as its expected build.
3. Run `build-performance` with `BENCHMARK_ROUNDS=5` under the same Node.js version (`npx vitest bench build-performance --run`), alternating between the checkouts (baseline, current, current, baseline, baseline, current), and keep each run's report as `build-performance/report-<n>.json`. The script pools a suite's reports before taking medians, so load from other processes falls on both sides alike.
4. Collect each side's reports into a `.results`-shaped directory, then run `REVISION_COMPARISON_CURRENT=<revision> REVISION_COMPARISON_CURRENT_LABEL=<date> bun revision-comparison/update-snapshot.mjs <baseline .results> <current .results>`. The script rejects reports from different machines or Chromium builds.

### Validate the recorded data

Run these checks from the repository root:

```bash
bun run --filter master-css-benchmarks check:browser-lifecycle
bun run --filter master-css-benchmarks check:browser-lifecycle browser-lifecycle/long-session-evidence.json --profile long-session-evidence
```

The first command checks the committed lifecycle snapshot; the second checks the five-minute evidence. Neither command launches a browser or creates new measurements.

For a new report, pass its path and the appropriate `baseline` or `long-session` profile to `check:browser-lifecycle`. The no-argument command still checks the committed snapshot. Collect same-machine repeat reports before running the suite’s stability comparison, and keep raw reports and traces under `benchmarks/.results/`. Review fixture correctness and measurement conditions before replacing a public snapshot.
