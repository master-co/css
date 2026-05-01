# Add Test

## Goal

Add focused test coverage for an existing behavior or known regression.

## Read Before Starting

- `AGENTS.md`
- `.ai/testing-policy.md`
- `.ai/data-flows.md`
- The affected package `AI.md`, if present

## Inspect First

- Existing tests in the affected package
- Fixture and snapshot conventions
- The source behavior being tested

## Editing Rules

- Prefer the smallest test that proves the behavior.
- Match existing test style.
- Do not change implementation unless explicitly requested.
- Do not update unrelated fixtures or snapshots.

## Validation

- Run the affected package test command.
- If the test documents CSS output, confirm the output is intentional.

## Completion Output

Report:

- Test location
- Behavior covered
- Commands run

