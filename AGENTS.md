# Master CSS AI Instructions

This is the canonical instruction file for AI agents working in this repository. Read it before editing. For deeper context, read the relevant files in `.ai/` and the package-local `AI.md` before changing package code.

## Project Overview

Master CSS is a markup-driven CSS language and framework. Class strings such as `fg:red:hover@sm` are parsed into real CSS rules, sorted into cascade layers, and emitted through one of several workflows:

- Core generation in `packages/core`
- Browser runtime rendering and hydration in `packages/runtime`
- Server-side HTML rendering in `packages/server`
- Static source extraction in `packages/extractor`
- Build integrations such as `packages/vite` and `packages/webpack`
- Editor and lint tooling in `packages/language-service`, `packages/language-server`, `packages/language`, `packages/vscode`, and `packages/eslint-plugin`

The layer order is intentionally stable and declared by `packages/core/src/base.css`:

```txt
@layer base, theme, preset, main, general;
```

Generated rules are emitted into `base`, `theme`, `preset`, `main`, and `general` layer blocks without dynamically adding the layer statement. Keyframes are emitted outside layers. Any CSS output difference must be intentional, explainable, and covered by tests.

## Before Editing

1. Identify the affected package and read its `package.json`.
2. Read the package-local `AI.md` if one exists.
3. Read existing source and tests before designing a change.
4. Trace whether the change affects CSS output, public APIs, config resolution, runtime behavior, extraction, linting, or language tooling.
5. Prefer the smallest focused change that matches existing patterns.

Do not start by inventing a new abstraction. This repo already has established helpers for parsing, config resolution, rule matching, validation, and insertion.

## Architecture Rules

Preserve dependency direction:

```txt
shared / external data
  -> @master/css core / @master/css-compiler directive parsing
  -> validator / server / extractor / runtime / language-service
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples / site
```

Do not make core depend on integrations, runtime, server, extractor, language service, ESLint, or examples.

When package cycles or self-build cycles appear, prefer extracting dependency-free contracts, IR, and type-only schemas into `shared`, then adapt at the owning package boundary. Keep core-specific behavior in `@master/css` adapters and re-export shared contracts from the main package entry when they are part of the public boundary.

## High-Risk Areas

Modify these only with focused tests and a clear reason:

- `packages/core/src/core.ts`
- `packages/core/src/utility.ts`
- `packages/core/src/utilities.ts`
- `packages/core/src/utils/compare-rule-priority.ts`
- `packages/core/src/utils/parse-at.ts`
- `packages/core/src/utils/parse-selector.ts`
- `packages/core/src/utils/generate-selector.ts`
- `packages/core/src/utils/extend-config.ts`
- `packages/runtime/src/core.ts`
- `packages/runtime/src/layer.ts`
- `packages/extractor/src/functions/extract-latent-classes.ts`
- `packages/language-service/src/core.ts`
- package `exports`, build scripts, release config, CI workflows, and lockfiles

## Code Modification Constraints

- Keep changes narrow and package-local where possible.
- Do not reformat unrelated files.
- Do not modify generated files, snapshots, or fixtures unless the output change is intentional.
- Do not add dependencies unless the existing toolchain cannot reasonably solve the problem.
- Do not change package names, public exports, build flow, release flow, CI, or lockfiles unless explicitly requested.
- Do not reduce correctness just to make tests pass.
- Do not guess when modifying parser, compiler, renderer, selector, at-rule, variable, mode, priority, or cascade behavior.

## Commit Message Policy

All commits in this monorepo must follow Techor conventional commits:

```txt
Type(Target): Summary
```

- `Type` must be one of `Bump`, `Feat`, `New`, `Perf`, `Add`, `Update`, `Improve`, `Fix`, `Deprecate`, `Drop`, `Docs`, `Upgrade`, `Revert`, `Example`, `Test`, `Refactor`, `Chore`, or `Misc`.
- `Target` is required for this monorepo. Use the affected workspace, package, or role, such as `Core`, `Runtime`, `Extractor`, `CLI`, `Site`, `Repo`, or `AI`.
- `Type`, `Target`, and `Summary` use sentence case. Do not end the summary with a period.
- Examples: `Fix(Core): Parse escaped selectors`, `Docs(Site): Update box shadow reference`, `Test(CLI): Cover extract watch mode`.

## CSS Output Policy

Any CSS output change must be reviewed as a behavior change. Explain:

- Which classes/configs changed output
- Why the old output was wrong or incomplete
- Which tests or fixtures prove the new output
- Whether runtime hydration, static extraction, language service, ESLint, docs, or examples are affected

## Testing Policy

Use scoped validation first, then broaden based on risk.

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
pnpm --filter @master/css-extractor test
pnpm --filter @master/css.vite test
pnpm --filter @master/css-language-service test
pnpm --filter @master/css-language-server test
pnpm --filter @master/eslint-plugin-css test
pnpm --filter @master/css-validator test
pnpm --filter @master/css-cli test
```

Core parser, compiler, renderer, runtime, extractor, language-service, and ESLint changes require tests. Snapshot or fixture updates are acceptable only when the behavior change is intentional and explained.

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

## Review Defaults

When reviewing a PR, prioritize findings first:

- Bugs and regressions
- CSS output changes
- Public API changes
- Missing tests
- Priority/cascade/variable/config/runtime/extraction risks
- Unrelated files

If no issues are found, say so and mention any remaining test gaps or residual risk.
