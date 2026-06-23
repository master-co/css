# Master CSS AI Instructions

This is the canonical instruction file for AI agents working in this repository. Read it before editing. For deeper context, read the relevant files in `.ai/` and the package-local `AI.md` before changing package code.

## Project Overview

Master CSS is a markup-driven CSS language and framework. Class strings such as `fg:red:hover@sm` are parsed into real CSS rules, sorted into cascade layers, and emitted through one of several workflows:

- Manifest-driven rule generation in `packages/engine`, re-exported by the public `packages/core` facade
- Browser runtime rendering and hydration in `packages/runtime`
- Server-side HTML rendering in `packages/server`
- Static rendering source scanning in `packages/scanner`
- Build integrations such as `packages/vite` and `packages/webpack`
- Editor and lint tooling in `packages/language`, `packages/language-service`, `packages/language-server`, `packages/vscode`, and `packages/eslint-plugin`

The layer order is intentionally stable and declared by `packages/preset/src/base.css`, then exposed through `@master/css/base.css`:

```txt
@layer theme, base, defaults, components, utilities;
```

Generated rules are emitted into `theme`, `base`, `defaults`, `components`, and `utilities` layer blocks without dynamically adding the layer statement. Keyframes are emitted outside layers. Any CSS output difference must be intentional, explainable, and covered by tests.

## Before Editing

1. Identify the affected package and read its `package.json`.
2. Read the package-local `AI.md` if one exists.
3. Read existing source and tests before designing a change.
4. Trace whether the change affects CSS output, public APIs, manifest loading or compilation, runtime behavior, extraction, linting, or language tooling.
5. Prefer the smallest focused change that matches existing patterns.

Do not start by inventing a new abstraction. This repo already has established helpers for parsing, manifest loading, rule matching, validation, and insertion.

## Utility Definition Strategy

Before adding or changing a default preset utility, prove the simpler manifest mechanisms cannot already model it:

1. Full native or vendor property classes should use `nativeValueNamespaces`; add a `keyAliases` entry only when the public class key differs from the emitted CSS property.
2. Short property aliases should use `keyAliases` to point at native logical, physical, full, or vendor CSS properties.
3. Semantic subproperty aliases that cannot be represented as a direct property fallback should be authored in `@utilities`.
4. Keep definitions in `packages/preset/src/utilities.ts` only for multi-declaration behavior, special transforms, raw ambiguous matching, or behavior the CSS directive compiler cannot express.

When a change adds a utility, include the reason `keyAliases` plus `nativeValueNamespaces` was insufficient.

## Refactor Compatibility Policy

Master CSS refactors optimize for a clean, correct design over backward compatibility. When a task asks for a refactor, rewrite, cleanup, migration, or re-architecture, do not preserve legacy APIs, legacy config shapes, old behavior, aliases, adapters, fixtures, or compatibility shims solely for compatibility unless the user or issue explicitly says compatibility is required.

Breaking changes are acceptable in refactor work, but they must be intentional and visible:

- List changed or removed public APIs, config shapes, class syntax, CSS output, runtime behavior, extraction behavior, language tooling behavior, or ESLint behavior.
- Update tests and fixtures to prove the new intended behavior instead of preserving old compatibility paths.
- Remove compatibility layers that obscure the new model, unless compatibility is explicitly required.
- Keep the refactor scoped to the stated goal; do not use it as permission for unrelated churn.
- If compatibility is required, implement it deliberately and cover that compatibility contract with tests.

Routine bug fixes, documentation edits, and narrow feature additions should still preserve existing behavior unless the requested fix or correctness requires a behavior change.

## Architecture Rules

Preserve dependency direction:

```txt
shared / external data
  -> @master/css-lexer lexical scanning
  -> @master/css-source source candidate extraction
  -> @master/css-engine / @master/css-preset / @master/css-integration
  -> @master/css-compiler directive parsing / @master/css-project loading
  -> validator / server / scanner / runtime / language / language-service
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples / site
```

Do not make engine depend on compiler, integrations, runtime, server, scanner, language service, ESLint, or examples. `@master/css` is a facade over engine and preset exports; keep behavior in the owning lower package.

When package cycles or self-build cycles appear, prefer extracting dependency-free public contracts, IR, and type-only schemas into `@master/css-schema`, dependency-free lexical scanners into `@master/css-lexer`, or source class candidate extraction into `@master/css-source`, then adapt at the owning package boundary. Keep `shared` limited to repo-internal test/build support, keep engine-specific behavior in `@master/css-engine`, and re-export schema contracts from the `@master/css` facade only when they are part of the public boundary.

## High-Risk Areas

Modify these only with focused tests and a clear reason:

- `packages/engine/src/core.ts`
- `packages/engine/src/utility.ts`
- `packages/preset/src/utilities.ts`
- `packages/engine/src/utils/compare-rule-priority.ts`
- `packages/engine/src/utils/parse-at.ts`
- `packages/engine/src/utils/parse-selector.ts`
- `packages/engine/src/utils/generate-selector.ts`
- `packages/compiler/src/lower-css-directives.ts`
- `packages/compiler/src/master-css-manifest.ts`
- `packages/runtime/src/core.ts`
- `packages/runtime/src/layer.ts`
- `packages/source/src/extract-class-candidates.ts`
- `packages/language/src/utils/get-class-positions.ts`
- `packages/language/src/render-semantic-tokens.ts`
- `packages/language-service/src/core.ts`
- package `exports`, build scripts, release config, CI workflows, and lockfiles

## Code Modification Constraints

- Keep changes narrow and package-local where possible.
- Do not reformat unrelated files.
- Do not modify generated files, snapshots, or fixtures unless the output change is intentional.
- Do not add dependencies unless the existing toolchain cannot reasonably solve the problem.
- Do not change package names, build flow, release flow, CI, or lockfiles unless explicitly requested.
- Keep public exports deliberate; routine work should not change them, and refactor work may change them only when they are part of the requested clean design.
- Document and test any breaking surface from public export or behavior changes.
- Do not reduce correctness just to make tests pass.
- Do not guess when modifying parser, compiler, renderer, selector, at-rule, variable, mode, priority, or cascade behavior.

## Cross-Platform Path Policy

- Treat filesystem paths, file URLs, public URLs, virtual module ids, and generated import specifiers as different string domains.
- Build and compare Node filesystem paths with `node:path` helpers such as `join`, `resolve`, `relative`, `isAbsolute`, `dirname`, and `basename`. Do not build filesystem paths with embedded `/` segments such as `join(root, 'a/b')`; pass each path segment separately.
- Convert file URLs at the boundary with `fileURLToPath()` / `pathToFileURL()` or `URI.parse(uri).fsPath` where that API is already used. Do not compare raw file URI strings to decide workspace membership.
- For filesystem containment, use `path.relative(parent, child)` and reject `..`, `../...`, and absolute results. Do not use raw `startsWith()` path checks, even with `path.sep`, unless the value is not a filesystem path.
- Tests must not assert filesystem paths with slash-only regexes or string literals. Prefer `path.join()`, `path.relative()`, segment arrays, or a deliberately named `toPosixPath()` only when the assertion is explicitly about a public URL, virtual module id, or generated import format.
- Keep public URLs, HTML attributes, Vite/webpack virtual ids, and generated import specifiers slash-based. Do not pass those URL-like strings through `node:path`.

## Commit Message Policy

All commits in this monorepo must follow Techor conventional commits:

```txt
Type(Target): Summary
```

- `Type` must be one of `Bump`, `Feat`, `New`, `Perf`, `Add`, `Update`, `Improve`, `Fix`, `Deprecate`, `Drop`, `Docs`, `Upgrade`, `Revert`, `Example`, `Test`, `Refactor`, `Chore`, or `Misc`.
- `Target` is required for this monorepo. Use the affected workspace, package, or role, such as `Core`, `Runtime`, `Scanner`, `CLI`, `Site`, `Repo`, or `AI`.
- `Type`, `Target`, and `Summary` use sentence case. Do not end the summary with a period.
- Examples: `Fix(Core): Parse escaped selectors`, `Docs(Site): Update box shadow reference`, `Test(CLI): Cover watch output`.

## CSS Output Policy

Any CSS output change must be reviewed as a behavior change. Explain:

- Which classes/manifests changed output
- Why the old output was wrong or incomplete
- Which tests or fixtures prove the new output
- Whether runtime hydration, static rendering, language service, ESLint, docs, or examples are affected

## Testing Policy

Use scoped validation first, then broaden based on risk.

When a change touches files inside a workspace package, run that package's `lint` script if it exists in the package-local `package.json`. For changes spanning multiple packages, run lint for every affected package that defines `lint`. If an affected package has no package-local lint script, state that explicitly in the final response.

Common commands:

```sh
pnpm build
pnpm test
pnpm e2e
pnpm lint
pnpm type-check
pnpm check
pnpm build:examples
```

Package-scoped examples:

```sh
pnpm --filter @master/css test
pnpm --filter @master/css-runtime e2e
pnpm --filter @master/css-server test
pnpm --filter @master/css-scanner test
pnpm --filter @master/css.vite test
pnpm --filter @master/css-language test
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-server test
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/css-validator test
pnpm --filter @master/css-cli test
```

Core parser, compiler, renderer, runtime, scanner, language tooling, and ESLint changes require tests. Snapshot or fixture updates are acceptable only when the behavior change is intentional and explained.

## Documentation System

Use `.ai/` for AI-facing architecture and governance docs:

- `.ai/overview.md`
- `.ai/architecture.md`
- `.ai/package-map.md`
- `.ai/data-flows.md`
- `.ai/commands.md`
- `.ai/boundaries.md`
- `.ai/testing-policy.md`
- `.ai/code-style.md`
- `.ai/review-checklist.md`

Use package-local `AI.md` files for package-specific constraints. Keep public user docs in the existing `site/` documentation system unless maintainers request a root `docs/` directory.

Directive syntax, semantics, lowering behavior, extraction behavior, or directive refactors must update `site/app/[locale]/reference/directives/content.mdx` in the same change. Treat `/reference/directives` as the canonical user-facing directive reference; do not leave directive behavior documented only in tests, implementation notes, package `AI.md`, or changelog text.

## Review Defaults

When reviewing a PR, prioritize findings first:

- Bugs and regressions
- CSS output changes
- Public API changes
- Missing tests
- Priority/cascade/variable/manifest/runtime/extraction risks
- Unrelated files

If no issues are found, say so and mention any remaining test gaps or residual risk.
