# Explain Package

## Goal

Explain how a package works, including inputs, transformations, outputs, dependencies, public APIs, tests, and risk areas.

## Read Before Starting

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/context/package-boundaries.md`
- The package `package.json`
- The package `AI.md`, if present

## Inspect First

- Entry point files
- Main source files
- Tests and fixtures
- Workspace dependencies and dependents
- Deeper references from `.ai/context/package-boundaries.md` when ownership or dependency direction is unclear

## Output

Include:

- Package purpose
- Public exports
- Internal workflow
- Dependencies and dependents
- What affects CSS output
- What affects developer experience
- Risk areas
- Required validation after changes

## Not Allowed

- Do not invent package responsibilities.
- Do not summarize only file names.
