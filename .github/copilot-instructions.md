# Copilot Instructions

Follow `AGENTS.md` as the canonical repository instruction file.

Before changing code, identify the affected package and read:

- The package `package.json`
- The package-local `AI.md` if present
- Relevant files in `.ai/`
- Existing tests near the behavior being changed

Keep changes small and focused. Do not casually change parser/compiler/runtime behavior, CSS output, package exports, build flow, release flow, lockfiles, or generated fixtures.

Any CSS output difference must be intentional, explainable, and covered by tests.

When creating commit messages, use Techor conventional commits in the required monorepo form `Type(Target): Summary`.

- Allowed types: `Bump`, `Feat`, `New`, `Perf`, `Add`, `Update`, `Improve`, `Fix`, `Deprecate`, `Drop`, `Docs`, `Upgrade`, `Revert`, `Example`, `Test`, `Refactor`, `Chore`, `Misc`.
- Always include a `Target` such as `Core`, `Runtime`, `Extractor`, `CLI`, `Site`, `Repo`, or `AI`.
- Use sentence case and no trailing period.
- Examples: `Fix(Core): Parse escaped selectors`, `Docs(Site): Update box shadow reference`, `Test(CLI): Cover extract watch mode`.
