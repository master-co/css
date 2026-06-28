# Build Path Diagnostics Summary

Status: internal diagnostic, not a public benchmark result.

Captured from:

- `pnpm --filter ./benchmarks bench:startup-diagnostics`
- `pnpm --filter ./benchmarks bench:build-diagnostics`
- `pnpm --filter ./benchmarks bench:compiler-diagnostics`
- `pnpm --filter ./benchmarks bench:extraction-diagnostics`

Environment:

- macOS `darwin 25.5.0`, `arm64`, Apple M3 Max, 16 CPUs
- Node `v24.15.0`
- Reports generated on `2026-06-27`

## Scope And Limits

- Static fixture set only: `minimal`, `docs`, `dashboard`, and `stress-css`.
- Local command and in-process diagnostic timings only; these are not public production guarantees.
- Startup probe metrics run in separate child processes, so import timings are directional and not additive flamegraphs.
- Build diagnostics split Master CSS work from surrounding CLI/Vite work, but do not replace the public build-performance suite.
- Diagnostic paths must preserve final CSS output hashes before numbers are useful.

## Confirmed Bottleneck

The current build path cost is dominated by cold process/module startup and integration startup overhead, not by CSS extraction, compiler lowering, or render time. Fixture scaling is visible on `stress-css`, but it is smaller than the cold startup envelope for normal fixtures.

Evidence:

- CLI full command startup sits around `195-218ms`, while CLI CSS extraction is `13.81-20.94ms`.
- The scanner import probe is the largest isolated CLI startup signal at `66.20-72.20ms`; commander import is only `4.32-4.72ms`.
- Vite startup with Master CSS shows `153.88-174.66ms` command overhead over the Vite baseline, while Master Vite scanner init is only `5.31-5.66ms`.
- Production `createExtractedCSS` is `14.42-20.60ms`, and diagnostic compiler total is `12.37-18.28ms`, so compiler/extraction is measurable but not the first startup bottleneck.

## Key Comparisons

### CLI startup vs extraction

| Fixture | CLI command | CLI probe | Scanner import | CSS extraction | Generated CSS |
| --- | ---: | ---: | ---: | ---: | ---: |
| minimal | `195.35ms` | `190.59ms` | `66.20ms` | `13.81ms` | `5056B` |
| docs | `197.56ms` | `195.38ms` | `72.20ms` | `15.60ms` | `5775B` |
| dashboard | `199.80ms` | `196.89ms` | `67.25ms` | `15.91ms` | `5977B` |
| stress-css | `218.46ms` | `208.51ms` | `66.67ms` | `20.94ms` | `11653B` |

The full CLI command stays mostly flat across the normal fixtures. `stress-css` increases extraction and command time, but the cold command envelope remains much larger than extraction alone.

### Vite baseline vs Master plugin diagnostics

| Fixture | Vite + Master startup | Vite baseline startup | Command overhead | Master Vite import | Scanner init |
| --- | ---: | ---: | ---: | ---: | ---: |
| minimal | `282.78ms` | `128.90ms` | `153.88ms` | `80.62ms` | `5.31ms` |
| docs | `291.04ms` | `132.60ms` | `158.45ms` | `78.12ms` | `5.41ms` |
| dashboard | `284.65ms` | `129.06ms` | `155.59ms` | `79.58ms` | `5.46ms` |
| stress-css | `301.84ms` | `127.83ms` | `174.66ms` | `79.59ms` | `5.66ms` |

The Master Vite scanner init hook is small in these runs. The larger startup signal is cold Vite integration import/command overhead, which should be investigated separately from CSS generation.

### Compiler and extraction decomposition

| Fixture | Production `createExtractedCSS` | Diagnostic extraction total | Diagnostic compiler total | Render compiled CSS | Generated CSS |
| --- | ---: | ---: | ---: | ---: | ---: |
| minimal | `14.42ms` | `12.59ms` | `12.37ms` | `5.92ms` | `2350B` |
| docs | `15.54ms` | `13.12ms` | `13.44ms` | `6.67ms` | `3069B` |
| dashboard | `15.87ms` | `13.94ms` | `13.06ms` | `5.88ms` | `3271B` |
| stress-css | `20.60ms` | `18.69ms` | `18.28ms` | `10.07ms` | `8947B` |

Compiler and extraction scale with CSS output size, but the absolute medians are still far below cold CLI and Vite startup command timings.

## Most Justified Next Target

1. Investigate cold CLI and Vite integration import paths before changing compiler or extraction behavior.
2. Keep compiler/extraction optimization secondary unless a larger real fixture shows CSS generation overtaking startup cost.
3. If optimization work proceeds, measure bundle/import impact and production build timing together; do not use diagnostic substep numbers alone as the success criterion.

## Must Not Change

- Generated CSS output, cascade order, and directive semantics.
- Source detection and extraction correctness.
- Hydration manifests or runtime delivery behavior.
- Public CLI, Vite plugin, compiler, scanner, or package exports.
