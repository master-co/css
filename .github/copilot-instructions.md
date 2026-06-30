# Copilot Instructions

Follow `AGENTS.md` as the canonical repository instruction file.

Before changing code, identify the affected package and read:

- `.ai/context/index.md`
- `.ai/context/package-routing.md` when paths, packages, or a diff are known
- The package `package.json`
- The package-local `AI.md`, if present
- The task-specific `.ai/context/*.md` pack
- Existing tests near the behavior being changed

Use `.ai/context/accuracy-guardrails.md` to decide when to read deeper `.ai/*.md` references. Do not rely on a short context pack alone for parser/compiler/runtime behavior, CSS output, extraction, language tooling, ESLint, public exports, package boundaries, build flow, release flow, lockfiles, or generated fixtures.

Any CSS output difference must be intentional, explainable, and covered by tests.

When creating commit messages, follow the commit message policy in `AGENTS.md`. Do not duplicate or reinterpret that policy here.
