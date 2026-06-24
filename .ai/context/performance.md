# Performance Pack

Use this for performance investigation, benchmark work, or hot path changes.

## Read

- `AGENTS.md`
- `.ai/context/index.md`
- Affected package `package.json`
- Affected package-local `AI.md`
- Existing benchmarks or tests for the path

## Workflow

- Identify a concrete hot path before changing code.
- Validate correctness before benchmark reporting.
- Do not trade CSS output, cascade order, hydration correctness, or public behavior for speed unless the behavior change is intentional and tested.
- Treat `packages/engine/src/core.ts`, engine root value exports, and runtime-imported engine value modules as browser runtime bundle inputs. Move tooling-only logic to explicit subpaths or lower packages before adding it to runtime-covered code.
- Avoid new dependencies unless the existing toolchain cannot reasonably solve the performance problem.

## Escalate When

- Engine matching, rule creation, parsing, priority, layer insertion, manifest loading, or cache/index behavior changes: read `.ai/testing-policy.md`, `.ai/commands.md`, and `packages/engine/AI.md`.
- Runtime DOM scan, mutation tracking, hydration, CSSOM insertion/deletion, or global bundle behavior changes: read `.ai/testing-policy.md`, `.ai/commands.md`, and `packages/runtime/AI.md`.
- Engine core or root value export changes that are not runtime-required: check whether the code can live in a tooling subpath and report engine/runtime bundle size before/after when feasible.
- Browser bundle or manifest payload may change: measure raw, gzip, and brotli sizes when feasible.

## Completion Notes

Report the hot path, evidence, correctness validation, benchmark command if run, bundle or payload risk, and limits of the measurement.
