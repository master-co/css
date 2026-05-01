# Investigate Performance

## Goal

Investigate a performance concern without speculative rewrites.

## Read Before Starting

- `AGENTS.md`
- `.ai/architecture.md`
- `.ai/data-flows.md`
- Package `AI.md` for the affected package

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

- Run affected tests.
- Run or add a focused benchmark only if the repo already has a matching pattern or the user asks for it.

## Completion Output

Report:

- Hot path analyzed
- Evidence
- Proposed or implemented change
- Correctness risks
- Commands run

