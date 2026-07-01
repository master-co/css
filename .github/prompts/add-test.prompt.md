# Add Test

## Goal

Add focused test coverage for an existing behavior or known regression.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/testing.md`
- The affected package `package.json`
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
- Follow `.ai/context/accuracy-guardrails.md` when tests cover CSS output, parser/compiler/runtime/extraction/language, or ESLint behavior.

## Validation

- Run the affected package test command.
- Run affected package lint if a workspace package changed and it defines `lint`.
- If the test documents CSS output, confirm the output is intentional.

## Completion Output

Report:

- Test location
- Behavior covered
- Commands run
