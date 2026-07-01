# Cross-Platform Paths Pack

Use this when a task touches filesystem paths, file URLs, public URLs, virtual module ids, generated import specifiers, scanner or project roots, build integrations, CLI behavior, language server paths, VS Code packaging, or tests and fixtures that assert paths.

## Read

- `AGENTS.md`
- `.ai/context/index.md`
- `.ai/code-style.md`
- `.ai/context/testing.md`
- The affected package `package.json`
- The affected package-local `AI.md`, if present
- Existing source and tests near the path-sensitive behavior

## Workflow

- Classify every changed string domain before editing: filesystem path, file URL, public URL, virtual module id, or generated import specifier.
- Use `node:path` helpers for filesystem paths, with path segments passed separately.
- Convert file URLs only at boundaries with `fileURLToPath()` / `pathToFileURL()` or the local package helper.
- Use `path.relative(parent, child)` for filesystem containment checks; reject `..`, `../...`, and absolute relative results.
- Keep URL-like strings slash-based and do not pass public URLs, virtual ids, or import specifiers through `node:path`.
- For path-sensitive pure helpers, add focused tests with `path.win32` and `path.posix` where practical. Otherwise rely on package tests that already run in Windows CI and document that choice.

## Validation

- Run the affected package test command.
- Run affected package lint if it defines `lint`.
- Run `pnpm test:cross-platform-paths` when code or tests touch paths, file URLs, public URLs, virtual ids, generated import specifiers, scanner roots, project roots, build integrations, CLI, language server, or VS Code packaging.
- If a flagged path pattern is intentional, either rewrite it into an explicit helper domain or update `.ai/cross-platform-path-baseline.json` with a clear review reason.

## Escalate When

- Path-sensitive behavior crosses package boundaries: read `.ai/context/package-boundaries.md`.
- CSS output, runtime, extraction, language tooling, ESLint, compiler, parser, virtual module ids, or generated import specifiers change: read `.ai/context/accuracy-guardrails.md`.
- CI, release, lockfiles, or package manager behavior changes: read `.ai/context/accuracy-guardrails.md`.
