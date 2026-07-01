# Refactor

## Goal

Improve implementation structure according to the requested refactor goal.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/refactor.md`
- The affected package `package.json`
- The affected package `AI.md`, if present

## Inspect First

- Existing patterns in the package
- Current tests that lock behavior
- Public exports and downstream dependents
- `.ai/context/cross-platform.md` when refactoring paths, file URLs, public URLs, virtual ids, generated import specifiers, scanner roots, project roots, build integrations, CLI, language server, or VS Code packaging
- Deeper references required by `.ai/context/accuracy-guardrails.md` for high-risk behavior

## Editing Rules

- Keep the refactor scoped to the requested goal.
- Do not preserve legacy APIs, aliases, adapters, fixtures, or compatibility shims solely for compatibility unless the user or issue requires it.
- Make public API, CSS output, runtime, extraction, language, and ESLint behavior changes explicit.
- Avoid broad formatting.
- Avoid new abstractions unless they remove real duplication or match a local pattern.

## Validation

- Run package-scoped tests.
- Run affected package lint if the package defines `lint`.
- Run type-check/build if public types or package output changed.
- Run `pnpm test:cross-platform-paths` for path-sensitive refactors.
- If CSS output changes, explain why it is intentional and no longer a behavior-preserving refactor.

## Completion Output

Report:

- What was refactored
- Behavior or API changes
- Compatibility paths removed, if any
- Commands run
