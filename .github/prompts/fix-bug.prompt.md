# Fix Bug

## Goal

Fix a confirmed bug with the smallest safe change and a regression test.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/bugfix.md`
- The affected package `package.json`
- The affected package `AI.md`, if present

## Inspect First

- Source files involved in the failing behavior
- Nearby tests and fixtures
- Any downstream package that consumes the changed behavior
- Deeper references required by `.ai/context/accuracy-guardrails.md` for high-risk behavior

## Editing Rules

- Keep the change focused.
- Do not modify unrelated files.
- Do not update snapshots or generated CSS unless the output change is intentional.
- Do not change public exports or package boundaries unless the bug requires it.
- Any CSS output difference must be explained.

## Validation

- Run the package-scoped test for the affected package.
- Run affected package lint if the package defines `lint`.
- Run type-check or build if public types or package output changed.
- Run broader validation when behavior crosses package boundaries.

## Completion Output

Report:

- Root cause
- Files changed
- Tests added or updated
- Commands run
- Any remaining risk
