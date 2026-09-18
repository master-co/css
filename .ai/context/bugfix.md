# Bugfix Pack

Use for confirmed bugs or regressions. Reproduce or explain the failure from the owning source and nearby tests, then fix it at that layer with a focused regression test. Preserve unrelated public behavior.

## Relevant Context

- For high-risk behavior, follow [accuracy-guardrails.md](accuracy-guardrails.md).
- For CSS differences, use [css-output.md](css-output.md).
- For cross-package ownership, use [package-boundaries.md](package-boundaries.md).

## Completion

Run the affected checks selected through [testing.md](testing.md), fix failures caused by the change, and report the root cause, regression coverage, intentional behavior differences, validation, and remaining risk.
