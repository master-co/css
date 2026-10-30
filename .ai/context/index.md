# Context Pack Index

Choose the matching route when you need task guidance or ownership context. Read only what applies; do not reopen `AGENTS.md`, this index, or other instructions already in context. Pure wording/formatting edits can stay with the affected document and its local guidance.

For package code, read the affected manifest and local `AI.md`. For high-risk behavior changes, use [accuracy-guardrails.md](accuracy-guardrails.md) and its relevant deep references before editing. Route by the behavior being changed, not merely by a package name appearing in the task.

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
| File path, package, or diff routing | `.ai/context/package-routing.md` |
| Rust crate, binding, codegen, or parity routing | `.ai/context/rust-routing.md` |

## Deep References

Repository contributors can run `bun scripts/contributor-context.mjs <paths...>`
or `--diff <file>` to locate owning packages/crates and canonical guidance. Use
`--graph` for manifest-derived dependencies. This local command does not duplicate
risk policy or register tools in the public Master CSS MCP server.

- Project overview: `.ai/overview.md`
- Package ownership and dependency direction: `.ai/architecture.md`, `.ai/package-map.md`
- Enforced source/context budgets: `.ai/context/source-budget.json`
- Class, compiler, scanner, runtime, and language flows: `.ai/data-flows.md`
- Boundaries and risk areas: `.ai/boundaries.md`
- Validation matrix and benchmark policy: `.ai/testing-policy.md`
- Commands and CI equivalents: `.ai/commands.md`
- Style and path conventions: `.ai/code-style.md`
- PR review checklist: `.ai/review-checklist.md`

## Accuracy Rule

If a task pack and source code disagree, trust source code and tests first, then deeper `.ai/*.md`, then the compact task pack. Update the pack only when it is stale or incomplete.
