# Review Pack

Use this for PR or code review.

## Read

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/review-checklist.md`
- Affected package `AI.md` files, if present
- Diff, tests, fixtures, and public API changes

## Findings First

Prioritize:

- Bugs and regressions
- CSS output changes
- Public API and export changes
- Missing tests
- Priority, cascade, variable, manifest, runtime, extraction, language, and ESLint risks
- Unrelated files, lockfile, CI, release, generated output, or broad formatting churn

## Escalate When

- Dependency direction or ownership is unclear: read `.ai/context/package-boundaries.md`, `.ai/architecture.md`, and `.ai/boundaries.md`.
- Output changes are present: read `.ai/context/css-output.md`.
- Performance claims are present: read `.ai/context/performance.md`.

## Output

Lead with findings ordered by severity and include file/line references. Then list open questions or assumptions. Keep summaries secondary. If no issues are found, say so and mention remaining test gaps or residual risk.
