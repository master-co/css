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
- Preserve existing matcher, parser, transformer, declarer, and layer patterns.
- Keep package-local code local unless a shared abstraction is already established.
- Avoid cross-package refactors unless the task explicitly requires them.
- Avoid broad formatting edits.

## Dependency Policy

Do not add dependencies unless:

- The existing repo toolchain cannot reasonably solve the problem.
- The dependency is package-appropriate.
- The effect on build, bundle, runtime, and package exports is understood.

## Generated Files

Do not edit `dist`, generated build output, generated framework output, or unrelated snapshots.

