# Master CSS AI Instructions

This is the canonical instruction file for AI agents working in this repository. Read it before editing. Then use `.ai/context/index.md` to choose the smallest relevant context pack. Context packs are routing aids, not the full source of truth: when a pack says to escalate, read the referenced `.ai/*.md` files and the affected package-local `AI.md`.

## Context Loading

Default read order:

1. `AGENTS.md`
2. `.ai/context/index.md`
3. `.ai/context/package-routing.md` when paths, packages, or a diff are known
4. The affected package `package.json`
5. The affected package-local `AI.md`, if present
6. The task-specific `.ai/context/*.md` pack
7. Existing source and tests near the behavior being changed

Do not read all `.ai/` files by default. Do not modify high-risk parser, compiler, runtime, extraction, language, ESLint, package-boundary, or CSS output behavior using only a short context pack; follow `.ai/context/accuracy-guardrails.md` and escalate to deeper references.

## Project Invariants

Master CSS is a markup-driven CSS language and framework. Class strings such as `fg:red:hover@sm` are parsed into CSS rules, sorted into cascade layers, and emitted by engine, runtime, server, scanner, build integrations, language tooling, and ESLint packages.

The stable layer order is declared by `packages/preset/src/base.css` and exposed through `@master/css/base.css`:

```txt
@layer theme, base, defaults, components, utilities;
```

Generated rules are emitted into `theme`, `base`, `defaults`, `components`, and `utilities` layer blocks without dynamically adding the layer statement. Keyframes are emitted outside layers. Any CSS output difference is a behavior change and must be intentional, explainable, and covered by tests or fixtures.

## Architecture Rules

Preserve dependency direction:

```txt
shared / external data
  -> @master/css-schema / @master/css-lexer
  -> @master/css-source
  -> @master/css-engine / @master/css-preset / @master/css-integration
  -> @master/css-compiler / @master/css-project
  -> validator / server / scanner / runtime / language / language-service / stylesheet
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples / site
```

Do not make engine depend on compiler, integrations, runtime, server, scanner, language service, ESLint, examples, or site. `@master/css` is a public facade over engine and preset exports; keep behavior in the owning lower package.

When cycle pressure appears, extract dependency-light contracts into `@master/css-schema`, dependency-free lexical scanners into `@master/css-lexer`, source class candidate extraction into `@master/css-source`, or adapter-neutral integration protocol into `@master/css-integration`.

## Before Editing

- Identify the affected package and read its `package.json`.
- Use `.ai/context/package-routing.md` when the task names paths, packages, or a diff.
- Read the affected package-local `AI.md`, if present.
- Read the relevant task pack from `.ai/context/`.
- Inspect existing source, tests, fixtures, and downstream consumers before designing a change.
- For feature work, perform an existing capability discovery pass before designing the implementation: identify the owning package responsibilities, current public APIs, nearby private/internal helpers that may need to be extracted, downstream consumers, and tests that lock the behavior. Prefer existing public APIs when they fit; when the needed behavior exists only as private/internal code in a lower package, first plan an intentional shared API/refactor at that lower layer, then return to the feature-specific implementation.
- Treat value-level code covered by `@master/css-runtime` as browser runtime bundle surface. Before adding helpers to runtime source, engine core/root value exports, runtime-imported engine modules, schema value constants, or preset manifest loading, decide whether the behavior is runtime core, build-time-only configuration, or tooling-only logic. Do not add global event buses or tooling observer APIs to runtime; third-party class observation should use DOM `MutationObserver` or explicit public runtime state. Move tooling-only behavior to a subpath, dependency-light utility, or true owning package, and validate runtime bundle impact when feasible.
- Prefer the smallest focused change that matches existing local patterns.
- Do not invent a new abstraction before proving existing helpers cannot solve the task.

## Utility Definition Strategy

Before adding or changing a default preset utility, prove simpler manifest mechanisms cannot model it:

1. Full native or vendor property classes should use `nativeValueNamespaces`; add `keyAliases` only when the public class key differs from the emitted CSS property.
2. Short property aliases should use `keyAliases` to point at native logical, physical, full, or vendor CSS properties.
3. Semantic subproperty aliases that cannot be direct property fallbacks should be authored in `@utilities`.
4. Keep `packages/preset/src/utilities.ts` for multi-declaration behavior, special transforms, raw ambiguous matching, or behavior the CSS directive compiler cannot express.

When a change adds a utility, state why `keyAliases` plus `nativeValueNamespaces` was insufficient.

## Refactor Compatibility

For requested refactors, rewrites, cleanups, migrations, or re-architecture, prefer a clean and correct design over legacy compatibility. Do not preserve old APIs, config shapes, aliases, adapters, fixtures, or shims solely for compatibility unless the user or issue explicitly requires it.

Breaking changes in refactor work must be intentional and visible: list public API, config, class syntax, CSS output, runtime, extraction, language tooling, or ESLint behavior changes; remove obsolete compatibility paths; and update tests for the new intended contract. Routine bug fixes and narrow feature additions should preserve existing behavior unless correctness requires a change.

## Modification Constraints

- Keep changes narrow and package-local where possible.
- Do not reformat unrelated files.
- Do not modify generated files, snapshots, or fixtures unless the output change is intentional.
- Do not add dependencies unless the existing toolchain cannot reasonably solve the problem.
- Do not change package names, build flow, release flow, CI, lockfiles, or package manager config unless explicitly requested.
- Keep public exports deliberate.
- Do not reduce correctness just to make tests pass.
- Do not guess when modifying parser, compiler, renderer, selector, at-rule, variable, mode, priority, cascade, runtime, extraction, language, or ESLint behavior.

## Testing Policy

Use scoped validation first, then broaden based on risk. When changing a workspace package, run that package's `lint` script if it exists. For multi-package changes, run lint for every affected package that defines it. If an affected package has no package-local lint script, state that in the final response.

Core parser, compiler, renderer, runtime, scanner, language tooling, and ESLint changes require focused tests. Snapshot or fixture updates are acceptable only when the behavior change is intentional and explained. Use `.ai/context/testing.md` and `.ai/testing-policy.md` for task-specific validation.

## Documentation System

Use `.ai/` for AI-facing architecture and governance docs. Use `.ai/context/` for task-routing context packs. Use package-local `AI.md` files for package-specific constraints. Keep public user docs in `site/` unless maintainers request a root `docs/` directory.

Directive syntax, semantics, lowering behavior, extraction behavior, or directive refactors must update `site/app/[locale]/guide/directives/content.mdx` in the same change.

## Commit Message Policy

Commits must follow Aronrepo conventional commits:

```txt
Type(Target): Summary
```

`Type` must be one of `Bump`, `Feat`, `New`, `Perf`, `Add`, `Update`, `Improve`, `Fix`, `Deprecate`, `Drop`, `Docs`, `Upgrade`, `Revert`, `Example`, `Test`, `Benchmark`, `Build`, `CI`, `Style`, `Refactor`, `Chore`, or `Misc`. `Target` is optional but recommended for monorepo package, workflow, role, or policy changes. Use PascalCase types except uppercase `CI`, sentence case, and no trailing period. Use release-impacting types only when published package behavior, public APIs, release behavior, or published README content changes; use `Chore(Agent)` for internal AI instructions, `Chore(Deps)` for development dependency or lockfile changes, `Build` for dev-only tooling, `CI` for workflow/status checks, `Style` for formatting/lint-only changes, and `Benchmark` for measurement-only changes.

## Review Defaults

When reviewing a PR, lead with findings ordered by severity: bugs, regressions, CSS output changes, public API changes, missing tests, priority/cascade/variable/manifest/runtime/extraction risks, and unrelated files. If no issues are found, say so and mention residual risk or missing validation.
