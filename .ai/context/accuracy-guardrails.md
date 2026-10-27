# Accuracy Guardrails

Use before changing high-risk behavior below, or reviewing a change to it. Load the matching references, affected package/crate `AI.md`, and owning source/tests; no full repository map is required. Pure wording or formatting edits do not trigger semantic investigation.

## Risk Routing

| Changed behavior | Required deep references |
|---|---|
| CSS bytes, layers, priority, values, selectors, conditions, variables, modes, animation, or utility matching | `.ai/data-flows.md`, `.ai/testing-policy.md`; use `rust-routing.md` to locate the semantic owner |
| Directive parsing, manifest lowering, or compiler/project behavior | `.ai/data-flows.md`, `.ai/testing-policy.md`, `packages/compiler/AI.md`, owning crate guidance |
| Runtime hydration, CSSOM insertion/deletion, DOM observation, class counts, or runtime bundle inputs | `.ai/data-flows.md`, `.ai/testing-policy.md`, `packages/runtime/AI.md` |
| Extraction adapters, false positives/negatives, fixed classes, or scanner state | `.ai/data-flows.md`, `.ai/testing-policy.md`, `packages/tooling/AI.md` |
| Language tokenization, UTF-16 positions, semantic tokens, completion, hover, colors, or LSP | `.ai/data-flows.md`, `.ai/testing-policy.md`, affected tooling/language package guidance |
| ESLint parser support, ordering, collisions, validation, or autofix ranges | `.ai/data-flows.md`, `.ai/testing-policy.md`, `packages/eslint-plugin/AI.md`, owning tooling/crate guidance |
| Public exports, config shapes, virtual IDs, generated imports, or dependency direction | `.ai/architecture.md`, `.ai/package-map.md`, `.ai/boundaries.md` |
| Benchmark-relevant engine/runtime hot paths | `.ai/commands.md`, `.ai/testing-policy.md`, affected package guidance |

For high-risk reviews, also use `.ai/review-checklist.md` and `.ai/boundaries.md`. Directive syntax, semantics, lowering, extraction, or directive refactors require the public directive guide update specified in `AGENTS.md`.

## Evidence

- Trace owning source behavior; snapshots alone do not establish CSS correctness.
- Explain intentional CSS/fixture changes and validate downstream effects.
- Resolve ownership at the correct layer; do not move behavior up the dependency graph to simplify implementation.
- Report benchmark commands, environment limitations, and correctness checks with performance claims.
