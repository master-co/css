# Investigate Performance

## Goal

Investigate a performance concern without speculative rewrites.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/performance.md`
- `.ai/context/accuracy-guardrails.md`
- The affected package `package.json`
- The affected package `AI.md`

## Inspect First

- Hot path source code
- Existing benchmarks or tests
- Whether the behavior is runtime, extraction, language service, or core generation

## Rules

- Measure or reason from a concrete hot path.
- Avoid broad refactors.
- Do not trade correctness or CSS output stability for speed.
- Do not add dependencies without a clear performance reason.

## Validation

- Run affected tests before reporting benchmark results.
- Run affected package lint if code changed and the package defines `lint`.
- Run or add a focused benchmark only if the repo already has a matching pattern or the user asks for it.

## Completion Output

Report:

- Hot path analyzed
- Evidence
- Proposed or implemented change
- Correctness risks
- Commands run
