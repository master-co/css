# Update Docs

## Goal

Update documentation to match actual source behavior.

## Read Before Starting

- `AGENTS.md`
- `.ai/overview.md`
- `.ai/data-flows.md`
- The source/package docs related to the behavior

## Inspect First

- Source implementation
- Tests or fixtures proving behavior
- Existing documentation style in `site/`

## Editing Rules

- Verify behavior from source/tests before writing docs.
- Keep docs aligned with public API and current examples.
- Do not create a root `docs/` directory unless requested.
- Do not change code unless explicitly requested.

## Validation

- Run docs/site checks only if the docs change needs build validation.
- Run package tests if docs examples depend on generated output and fixtures changed.

## Completion Output

Report:

- Docs changed
- Source behavior verified
- Commands run or why not run

