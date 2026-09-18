# Review Pack

Use for PR or code review. Start with the diff, affected package guidance, and evidence in source/tests. Use `.ai/review-checklist.md` for the review contract; use [accuracy-guardrails.md](accuracy-guardrails.md) for high-risk behavior.

## Relevant Context

- Ownership or dependency questions: [package-boundaries.md](package-boundaries.md), `.ai/architecture.md`, `.ai/boundaries.md`.
- CSS differences: [css-output.md](css-output.md).
- Performance claims: [performance.md](performance.md).

## Findings

Follow the severity order in `AGENTS.md`. Include file/line evidence, impact, and missing validation. Flag unexplained CSS changes and unrelated lockfile, CI, release, generated-file, or formatting churn. Lead with findings, then open questions; if none are found, state that and identify residual risks or validation gaps.
