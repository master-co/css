# PR Review Checklist

Use this for human and AI review.

- Scope is focused and understandable.
- Affected packages are identified.
- Dependency direction is preserved.
- Public API changes are explicit.
- Package exports are unchanged unless intentional.
- Refactor changes do not keep legacy compatibility paths unless compatibility was explicitly required.
- CSS output changes are intentional and explained.
- Parser, syntax, selector, at-rule, variable, mode, priority, and cascade changes have tests.
- Runtime or hydration changes have browser/e2e coverage.
- Static extraction changes cover false positives and false negatives.
- Language-service changes cover completion, hover, color, or class-position behavior.
- ESLint changes cover parser/framework and autofix behavior.
- Regression tests were added for bugs.
- Snapshots or fixtures were updated only for intentional output changes.
- No unrelated files changed.
- No broad formatting changes.
- No unnecessary dependencies were added.
- CI, release, lockfile, package manager, and generated files were not changed casually.
- Docs/examples were updated if user-facing behavior changed.
- Directive syntax, semantics, lowering, extraction, or refactor changes updated `site/app/[locale]/reference/directives/content.mdx`.
- Performance risk was considered for hot paths.
