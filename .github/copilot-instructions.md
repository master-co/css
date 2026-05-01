# Copilot Instructions

Follow `AGENTS.md` as the canonical repository instruction file.

Before changing code, identify the affected package and read:

- The package `package.json`
- The package-local `AI.md` if present
- Relevant files in `.ai/`
- Existing tests near the behavior being changed

Keep changes small and focused. Do not casually change parser/compiler/runtime behavior, CSS output, package exports, build flow, release flow, lockfiles, or generated fixtures.

Any CSS output difference must be intentional, explainable, and covered by tests.

