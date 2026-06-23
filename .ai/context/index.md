# Context Pack Index

Use this index after reading `AGENTS.md`. Load the smallest pack that matches the task, then follow any "Escalate When" guidance in that pack. Context packs are compact routing aids; deeper `.ai/*.md` files remain the source of detailed architecture and testing policy.

## Default Read Order

1. `AGENTS.md`
2. This file
3. Affected package `package.json`
4. Affected package-local `AI.md`, if present
5. One task pack below
6. Existing source and nearby tests

Do not read every `.ai/` file by default. Do read `.ai/context/accuracy-guardrails.md` whenever the task touches CSS output, package boundaries, public APIs, runtime, extraction, language tooling, ESLint, compiler, parser, or performance-sensitive paths.

## Task Routing

| Task | Pack |
|---|---|
| Confirmed bug or regression fix | `.ai/context/bugfix.md` |
| Add or adjust tests | `.ai/context/testing.md` |
| Refactor, rewrite, cleanup, migration, re-architecture | `.ai/context/refactor.md` |
| Explain or change generated CSS output | `.ai/context/css-output.md` |
| Performance investigation or hot path work | `.ai/context/performance.md` |
| PR/code review | `.ai/context/review.md` |
| Public docs or examples | `.ai/context/docs.md` |
| Package ownership, dependency direction, exports, cycles | `.ai/context/package-boundaries.md` |

## Deep References

- Project overview: `.ai/overview.md`
- Package ownership and dependency direction: `.ai/architecture.md`, `.ai/package-map.md`
- Class, compiler, scanner, runtime, and language flows: `.ai/data-flows.md`
- Boundaries and risk areas: `.ai/boundaries.md`
- Validation matrix and benchmark policy: `.ai/testing-policy.md`
- Commands and CI equivalents: `.ai/commands.md`
- Style and path conventions: `.ai/code-style.md`
- PR review checklist: `.ai/review-checklist.md`

## Accuracy Rule

If a task pack and source code disagree, trust source code and tests first, then deeper `.ai/*.md`, then the compact task pack. Update the pack only when it is stale or incomplete.
