# Refactor Pack

Use this for refactors, rewrites, cleanups, migrations, and re-architecture.

## Read

- `AGENTS.md`
- `.ai/context/index.md`
- Affected package `package.json`
- Affected package-local `AI.md`, if present
- Existing tests that lock current behavior

## Policy

Master CSS refactors prefer a clean, correct design over backward compatibility. Do not preserve old APIs, config shapes, aliases, adapters, fixtures, or compatibility branches solely for compatibility unless the user or issue explicitly requires it.

Breaking changes are allowed in requested refactor work, but they must be intentional and visible. List changed or removed public APIs, config shapes, class syntax, CSS output, runtime behavior, extraction behavior, language tooling behavior, and ESLint behavior.

## Workflow

- Confirm the refactor goal and affected ownership boundary.
- Remove obsolete compatibility paths when they obscure the new model.
- Keep unrelated formatting and package churn out of scope.
- Update tests and fixtures to prove the new intended behavior.

## Escalate When

- Behavior should remain unchanged but CSS output differs: read `.ai/context/css-output.md` and stop to explain why it is not a pure refactor.
- Package boundaries shift: read `.ai/context/package-boundaries.md`, `.ai/architecture.md`, and `.ai/package-map.md`.
- Parser/compiler/runtime/extraction/language/ESLint behavior changes: read `.ai/context/accuracy-guardrails.md`.
