# Docs Pack

Use this for public docs, examples, and AI-facing documentation updates.

## Read

- `AGENTS.md`
- `.ai/context/index.md`
- Source and tests that prove the documented behavior
- Existing docs style in `site/` for user-facing changes

## Rules

- Verify behavior from source and tests before writing public docs.
- Keep public docs in `site/`; do not add a root `docs/` directory unless requested.
- Keep AI-facing architecture and governance docs under `.ai/`.
- Keep package-specific agent guidance in package-local `AI.md`.
- Do not change code unless explicitly requested.

## Escalate When

- Directive syntax, semantics, lowering behavior, extraction behavior, or directive refactors change: update `site/app/[locale]/guide/directives/content.mdx` in the same change.
- Docs describe generated CSS: read `.ai/context/css-output.md`.
- Docs describe package ownership or dependency direction: read `.ai/context/package-boundaries.md`.

## Validation

Run docs/site checks only when the docs change needs build validation. Run package tests if docs examples depend on generated output and fixtures changed.
