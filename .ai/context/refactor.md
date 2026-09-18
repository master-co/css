# Refactor Pack

Use for requested refactors, rewrites, cleanups, migrations, or re-architecture. Apply the refactor compatibility policy in `AGENTS.md`: prefer the new intended design and retain compatibility only when required by the user or issue.

## Design Evidence

Inspect public APIs, private lower-package capabilities, consumers, and tests that lock current behavior. Reuse existing capabilities; extract a deliberate shared API at the lower owner when needed before implementing the feature above it. Remove obsolete compatibility paths within the requested scope.

## Relevant Context

- For ownership changes, use [package-boundaries.md](package-boundaries.md), `.ai/architecture.md`, and `.ai/package-map.md`.
- For semantic, API, or other high-risk changes, follow [accuracy-guardrails.md](accuracy-guardrails.md).
- If a behavior-preserving refactor changes CSS, investigate with [css-output.md](css-output.md). Restore the intended behavior or explain and test a justified change within scope; do not silently treat it as equivalent.

## Completion

Update tests for the intended contract and use [testing.md](testing.md) for validation. Report changed/removed APIs, config, class syntax, CSS output, runtime, extraction, language, or ESLint behavior, plus removed compatibility paths and validation results.
