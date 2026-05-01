# Refactor

## Goal

Improve implementation structure without changing behavior unless explicitly requested.

## Read Before Starting

- `AGENTS.md`
- `.ai/architecture.md`
- `.ai/boundaries.md`
- `.ai/testing-policy.md`
- The affected package `AI.md`, if present

## Inspect First

- Existing patterns in the package
- Current tests that lock behavior
- Public exports and downstream dependents

## Editing Rules

- Keep public behavior and CSS output stable.
- Do not use refactoring as a reason to change parser semantics, priority, cascade, runtime behavior, or extraction behavior.
- Avoid broad formatting.
- Avoid new abstractions unless they remove real duplication or match a local pattern.

## Validation

- Run package-scoped tests.
- Run type-check/build if public types or package output changed.
- If CSS output changes, stop and explain why it is no longer a pure refactor.

## Completion Output

Report:

- What was refactored
- Why behavior should be unchanged
- Commands run
- Any output/API changes

