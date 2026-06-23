# Review PR

## Goal

Review a PR for bugs, regressions, missing tests, unsafe package-boundary changes, and unclear CSS output differences.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/review.md`
- Package `AI.md` files for affected packages
- Deeper references required by `.ai/context/accuracy-guardrails.md` for high-risk changes

## Review Focus

- Scope and unrelated changes
- Public API and exports
- CSS output changes
- Parser, selector, at-rule, variable, mode, priority, cascade behavior
- Runtime and hydration behavior
- Static extraction behavior
- Language service and ESLint behavior
- Tests and fixtures
- Dependency additions
- CI/release/lockfile changes

## Output Format

Lead with findings ordered by severity. Include file and line references when available. Then include open questions, then a short summary. If no issues are found, say so and mention residual risk or missing validation.

## Not Allowed

- Do not approve unexplained CSS output changes.
- Do not ignore unrelated lockfile, CI, release, or generated-file churn.
