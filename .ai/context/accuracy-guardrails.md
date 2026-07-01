# Accuracy Guardrails

Use this pack when a task is high-risk or when a compact task pack is not enough. The goal is to save tokens by routing context, not to hide important constraints.

## Escalate Immediately

Read deeper references before editing when touching:

- CSS output, layer order, priority, selector parsing/generation, at-rule parsing/generation, values, variables, modes, animations, manifest lowering, or utility matching.
- Runtime hydration, CSSOM insertion/deletion, DOM observation, class counting, or global runtime bundles.
- Static extraction, source adapters, false positives, false negatives, fixed classes, or generated CSS scanner state.
- Language tokenization, class positions, semantic tokens, completion, hover, color features, or LSP behavior.
- ESLint parser support, class order, collision detection, validation, or autofix ranges.
- Public exports, config shapes, virtual module ids, generated import specifiers, package boundaries, or dependency direction.
- Benchmark-relevant engine/runtime hot paths.

## Required Deep References

- CSS and class generation: `.ai/data-flows.md`, `.ai/testing-policy.md`, affected package `AI.md`.
- Compiler or directive behavior: `.ai/data-flows.md`, `.ai/testing-policy.md`, `packages/compiler/AI.md`, and the directive guide when user-facing semantics change.
- Package ownership or cycles: `.ai/architecture.md`, `.ai/package-map.md`, `.ai/boundaries.md`.
- Performance: `.ai/commands.md`, `.ai/testing-policy.md`, affected package `AI.md`.
- Review: `.ai/review-checklist.md`, `.ai/boundaries.md`, affected package `AI.md`.
- Cross-platform paths: `.ai/context/cross-platform.md`, `.ai/code-style.md`, and affected package tests.

## Work Rules

- Do not infer CSS output correctness from snapshots alone; trace the owning source behavior.
- Do not preserve legacy compatibility during explicit refactor work unless required by the user or issue.
- Do not move behavior up the dependency graph to make an implementation easier.
- Do not update generated fixtures or snapshots unless the output change is intentional and explained.
- Do not report benchmark gains without the command, environment limits, and correctness validation.
