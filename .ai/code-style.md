# Code Style

## Existing Conventions

- TypeScript ESM modules.
- 4-space indentation.
- LF line endings.
- No final newline required by `.editorconfig`.
- Prefer existing local helpers over new dependencies.
- Keep public exports deliberate.
- Keep comments sparse and useful.

## Implementation Guidance

- Use structured parsing helpers instead of ad hoc string manipulation when available.
- For CSS syntax, import graphs, transforms, and syntax-aware rewrites, prefer established parser/transformer libraries or existing compiler APIs such as Lightning CSS, PostCSS, or `@master/css-compiler` before adding custom string scanners. If a small hand-written scanner is still used, keep it centralized, dependency-free where possible, and covered by tests so it can be replaced later.
- Preserve existing matcher, parser, transformer, declarer, and layer patterns.
- Keep package-local code local unless a shared abstraction is already established.
- Avoid cross-package refactors unless the task explicitly requires them.
- Avoid broad formatting edits.

## Refactor Strategy

For refactor, rewrite, cleanup, migration, or re-architecture tasks, prefer a clean and internally consistent design over preserving old compatibility paths. Do not add adapters, aliases, overloads, deprecated options, or fallback branches only to keep legacy behavior alive unless the user or issue explicitly requires compatibility.

Refactors may change public exports, config shapes, generated CSS, runtime behavior, extraction behavior, or tooling behavior when that is part of the requested design. Make those breaking changes explicit, remove obsolete code paths, and update tests to describe the new contract.

This does not loosen scope: keep changes tied to the refactor goal, avoid unrelated formatting, and preserve established package boundaries unless changing the boundary is the point of the task.

## Dependency Policy

Do not add dependencies unless:

- The existing repo toolchain cannot reasonably solve the problem.
- The dependency is package-appropriate.
- The effect on build, bundle, runtime, and package exports is understood.

## Generated Files

Do not edit `dist`, generated build output, generated framework output, or unrelated snapshots.
