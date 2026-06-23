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
- For logical-axis utility aliases, keep short aliases aligned to physical axes: `x` maps to inline and `y` maps to block. Prefer `mx`, `my`, `px`, `py`, `ix`, `iy`, `size-x`, and `size-y` families over `i`/`b` axis abbreviations; full native properties such as `margin-inline:*` may still be used when documenting native CSS directly.
- Preserve existing matcher, parser, transformer, declarer, and layer patterns.
- Keep package-local code local unless a shared abstraction is already established.
- Avoid cross-package refactors unless the task explicitly requires them.
- Avoid broad formatting edits.

## Cross-Platform Node Paths

- Keep filesystem paths, file URLs, public URLs, virtual module ids, and generated import specifiers separate.
- Use `node:path` for filesystem paths. Build paths with separate segments such as `join(root, 'dir', 'file.css')`, not embedded path strings such as `join(root, 'dir/file.css')`.
- Convert file URLs at the boundary with `fileURLToPath()` / `pathToFileURL()` or the local URI helper already used by the package. Do not compare raw file URI strings for filesystem relationships.
- Use `path.relative(parent, child)` for filesystem containment and reject `..`, `../...`, and absolute relative results. Avoid raw `startsWith()` path checks.
- In tests, compare filesystem paths with `path.join()`, `path.relative()`, or segment arrays. Slash-only regexes are acceptable only for public URLs, virtual module ids, generated import specifiers, or explicitly normalized `toPosixPath()` output.
- Keep URL-like strings slash-based. HTML hrefs, hydration manifest sources, Vite ids, and import specifiers should not go through `node:path`.

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
