# Runtime Mutation Diagnostics Summary

Status: internal diagnostic, not a public benchmark result.

Captured from:

- `pnpm --filter ./benchmarks bench:runtime-mutation-diagnostics`
- `pnpm --filter ./benchmarks bench:runtime-style-invalidation-diagnostics`

Environment:

- macOS `darwin 25.5.0`, `arm64`, Apple M3 Max, 16 CPUs
- Node `v24.15.0`
- Chromium `149.0.7827.55`
- `@playwright/test` `1.61.0`

## Scope And Limits

- Dynamic and stress-dom fixtures only.
- Master runtime and Master progressive modes only for runtime internals.
- Local Chromium trace timings only; trace event names and scheduling can vary by Chromium version.
- Instrumentation is benchmark-only and does not change `@master/css-runtime` source behavior.
- Raw reports, traces, screenshots, and temporary workspaces stay under `benchmarks/.results/**` and are not committed.

## Confirmed Hotspot

The dominant cleanup-cycle hotspot is browser style invalidation caused by runtime stylesheet changes, especially first-time temporary rule generation and larger retained generated stylesheet volume. Runtime rule ensure/delete execution and MutationObserver callback delivery are measurable but are not the primary cost in this run.

Evidence:

- In the style-invalidation diagnostic, moving from cold temporary rule generation to preseeded temporary rules reduced stress-dom style recalculation from `7.62ms` to `2.11ms` for Master runtime and from `7.26ms` to `2.17ms` for Master progressive.
- Runtime ensure/delete medians over the same comparison were small: runtime `0.30ms -> 0.10ms`, progressive `1.00ms -> 0.10ms`.
- MutationObserver delivery for preseeded retained-0 variants was `1.5ms` to `2.6ms` across 6-8 callbacks, while observer-paused and observer-enabled preseeded variants had similar style recalculation medians.
- Retained volume increased style recalculation even with preseeded temporary rules: stress-dom retained-0 was about `2.11ms`, retained-128 was about `2.70ms`, and retained-512 was about `4.41-4.52ms`.

## Key Comparisons

### Dynamic vs Stress DOM

| Case | Dynamic style recalc | Stress DOM style recalc |
| --- | ---: | ---: |
| Master runtime cold baseline | `1.90ms` | `7.62ms` |
| Master runtime preseeded retained-0 | `1.27ms` | `2.11ms` |
| Master progressive cold baseline | `1.87ms` | `7.26ms` |
| Master progressive preseeded retained-0 | `1.24ms` | `2.17ms` |

Stress DOM amplifies browser style recalculation far more than runtime JS work. This points to invalidation fan-out over document shape rather than a pure runtime method cost.

### Runtime vs Progressive

Runtime and progressive have similar browser invalidation profiles once temporary rules are preseeded. Progressive has a higher cold runtime ensure median in this run (`1.00-1.20ms`) than runtime (`0.20-0.30ms`), but the larger user-visible variance is still style recalculation on stress-dom.

### Cleanup Window Before vs After Deferred Flush

The mutation diagnostic trace-window axis showed the configured after-flush window adds roughly `26.5ms` to `35.9ms` to interaction-ready medians. Style recalculation did not consistently increase after the deferred flush. Retained cleanup after flush stayed tiny, with `60B` retained raw CSS and sub-ms cleanup duration.

This indicates the trace-window delta is mostly the extra settle window, not evidence that deferred cleanup itself is the dominant hotspot.

### First-Time vs Preseeded Temporary Rules

Preseeding removes the runtime-generated rule delta for the temporary cleanup classes (`2 -> 0` generated rules). The isolated style-invalidation suite then reduces stress-dom style recalculation from about `7.3-7.6ms` to about `2.1-2.2ms`.

The optimization question should therefore focus on avoiding first-time rule insertion on cleanup-sensitive paths, or making those insertions less invalidating, without changing CSS output or hydration behavior.

### Observer Paused vs Runtime Baseline

Observer-paused variants improved over cold runtime baseline, but this comparison is not an isolated observer result because the observer-paused variants also preseed temporary rules:

| Case | Cold baseline | Observer paused with preseed |
| --- | ---: | ---: |
| Dynamic runtime | `1.90ms` | `1.25ms` |
| Dynamic progressive | `1.87ms` | `1.22ms` |
| Stress DOM runtime | `7.62ms` | `2.23ms` |
| Stress DOM progressive | `7.26ms` | `2.06ms` |

The isolated observer comparison is observer-paused preseeded variants against observer-enabled preseeded retained-0 variants. Those had nearly identical style recalculation:

| Case | Observer paused | Observer enabled |
| --- | ---: | ---: |
| Dynamic runtime | `1.25ms` | `1.27ms` |
| Dynamic progressive | `1.22ms` | `1.24ms` |
| Stress DOM runtime | `2.23ms` | `2.11ms` |
| Stress DOM progressive | `2.06ms` | `2.17ms` |

MutationObserver callback delivery is not free, but pausing it did not materially change the browser style/layout cost in this run.

### Retained Stylesheet Volume

Retained generated rules increased style recalculation as seeded retained volume rose:

| Fixture / mode | Retained 0 | Retained 128 | Retained 512 |
| --- | ---: | ---: | ---: |
| Dynamic runtime | `1.27ms` | `1.37ms` | `1.89ms` |
| Dynamic progressive | `1.24ms` | `1.44ms` | `2.04ms` |
| Stress DOM runtime | `2.11ms` | `2.74ms` | `4.52ms` |
| Stress DOM progressive | `2.17ms` | `2.70ms` | `4.41ms` |

Runtime style rule count before trace rose from `42` to `554` in retained-512. In the initial diagnostic run, after-flush retained variants settled to `106` rules and `1596B` retained raw CSS for retained-128/512.

### Phase 9 Validation

After changing hard-limit cleanup to return retained inactive rules to the soft target, retained-512 no longer kept the larger style recalculation cost:

| Fixture / mode | Before | After |
| --- | ---: | ---: |
| Dynamic runtime retained-512 | `1.89ms` | `1.39ms` |
| Dynamic progressive retained-512 | `2.04ms` | `1.39ms` |
| Stress DOM runtime retained-512 | `4.52ms` | `2.65ms` |
| Stress DOM progressive retained-512 | `4.41ms` | `2.69ms` |

The post-change retained-512 variants settled to `168` runtime style rules after flush, which is the active baseline plus the retained soft target. This confirms retained stylesheet volume was a valid first optimization target; the remaining stress-dom gap is still browser style invalidation rather than runtime ensure/delete duration.

### Phase 12 Investigation Closure

Queued cold-rule stylesheet invalidation was investigated but not optimized. Same-machine exploratory runs did not show a meaningful stress-dom cold temporary-rule insertion improvement, so no runtime behavior change was kept.

Rejected approaches:

- CSSOM layer batching and native `@layer` block replacement did not reduce style recalculation: stress-dom runtime moved from `6.916ms` to `7.034ms`, and progressive moved from `6.977ms` to `7.044ms`.
- Moving queued cold-class flushes to a microtask did not materially change the browser-side cost: stress-dom runtime moved from `6.916ms` to `6.921ms`, and progressive moved from `6.977ms` to `6.919ms`.
- Flushing queued cold classes synchronously from observer delivery made the runtime stress-dom baseline worse: `6.916ms` to `7.004ms`.
- Pre-creating empty native runtime layer blocks did not materially improve the runtime stress-dom baseline: `6.916ms` to `6.955ms`.

These results indicate the remaining cold-insertion gap is not a narrow CSSOM churn issue that should be solved by private runtime batching. The rejected code paths were not committed.

## Current Recommendation

1. Keep the Phase 9 retained generated CSS volume bound as the accepted runtime optimization from this diagnostic cycle.
2. Do not revisit queued CSSOM batching, microtask/synchronous cold flushes, or empty native layer priming without new fixture evidence.
3. Treat any remaining cold first-time rule insertion cost as a browser invalidation/product strategy question rather than a narrow runtime internals change.

## Must Not Change

- Generated CSS output and cascade behavior.
- Runtime public API shape.
- Progressive hydration correctness and adoption behavior.
- Cleanup correctness: temporary DOM nodes must be removed and temporary classes must not remain counted after product settle.
