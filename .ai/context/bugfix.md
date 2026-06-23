# Bugfix Pack

Use this for confirmed bugs or regressions.

## Read

- `AGENTS.md`
- `.ai/context/index.md`
- Affected package `package.json`
- Affected package-local `AI.md`, if present
- Nearby source, tests, and fixtures

## Workflow

- Reproduce or explain the failing behavior before editing.
- Trace the owning package instead of patching around it in a higher integration.
- Add a focused regression test when code behavior changes.
- Keep the change narrow and avoid unrelated refactors.
- Preserve public behavior unless the bug is the existing behavior.

## Escalate When

- CSS output changes: read `.ai/context/css-output.md` and `.ai/data-flows.md`.
- Package ownership or dependency direction is involved: read `.ai/context/package-boundaries.md`.
- Runtime, scanner, language, or ESLint behavior is involved: read `.ai/context/accuracy-guardrails.md` and the affected package `AI.md`.

## Completion Notes

Report root cause, files changed, tests added or updated, commands run, and remaining risk.
