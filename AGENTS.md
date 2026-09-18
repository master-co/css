# Master CSS AI Instructions

This is the canonical repository instruction file. Keep shared policy here, task routing in `.ai/context/`, detailed architecture in `.ai/`, and package-specific constraints in the owning `AI.md`.

## Context By Task

Start with the affected source and nearby tests. Before changing package code, read its `package.json` or crate `Cargo.toml` and local `AI.md`, if present. Use [.ai/context/index.md](.ai/context/index.md) when choosing a workflow or locating additional context; it is a router, not a mandatory reading stack.

- Use [.ai/context/package-routing.md](.ai/context/package-routing.md) when ownership or affected packages need locating.
- Use [.ai/context/rust-routing.md](.ai/context/rust-routing.md) for Rust semantics, bindings, codegen, or parity.
- Before modifying parser/compiler, CSS output, runtime, extraction, language, ESLint, public APIs, package boundaries, or performance-sensitive behavior, follow [.ai/context/accuracy-guardrails.md](.ai/context/accuracy-guardrails.md) to the relevant deep references.
- Pure wording or formatting edits need only the affected document and applicable local guidance. Do not load unrelated architecture or reread instructions already in context.

Source and tests establish current behavior; deeper `.ai/*.md` documents explain architecture and policy. Compact packs route to that evidence. Correct stale guidance when verified; do not infer semantic correctness from a short pack alone.

## Project Contracts

Master CSS turns markup classes such as `fg:red:hover@sm` into layered CSS across engine, runtime, server, scanner, integrations, language tooling, and ESLint.

`packages/preset/src/base.css`, exposed through `@master/css/base.css`, declares the stable order:

```css
@layer theme, base, defaults, components, utilities;
```

Generated rules use those layer blocks without dynamically adding the layer statement. Keyframes remain outside layers. Any CSS output difference is an intentional, explained behavior change covered by tests or fixtures.

Rust is the single semantic source. TypeScript supplies platform loading, filesystem/package resolution, editor adaptation, and host capability callbacks; it must not implement semantic fallbacks.

Preserve dependency direction:

```txt
shared / external data
  -> schema / native and Wasm artifact loaders / preset
  -> @master/css / @master/css-tooling
  -> @master/css-compiler
  -> server / runtime / language-service
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples / site
```

`@master/css` owns Manifest v1 execution and must not depend on compiler, tooling, downstream hosts, or integrations. Tooling owns lexer/source/scanner/validator/lint/language sessions and must not depend on compiler, language service, build adapters, or editors. Compiler owns compiler/project/stylesheet/inspection orchestration. Resolve cycle pressure by placing dependency-light contracts in schema, semantics in the owning Rust crate, compiler orchestration in compiler, and editor-neutral operations in tooling. `@master/css-internal` is repository-private and bundled into official consumers; it is neither a public adapter SPI nor a generic utility package.

## Design And Change Boundaries

- For features, discover existing public APIs, private lower-package helpers, downstream consumers, and behavior tests before designing new abstractions. Reuse public capabilities; if needed behavior is private below the feature, intentionally extract a shared API at its owning layer first.
- Runtime source, runtime-imported engine exports/modules, schema value constants, and preset manifest loading are browser bundle surface. Classify additions as runtime core, build-time configuration, or tooling; keep tooling-only behavior at its owner or a suitable subpath and validate bundle impact when feasible. Do not add global event buses or tooling observer APIs to runtime; use DOM `MutationObserver` or explicit public runtime state for third-party class observation.
- For default utilities, prefer `nativeValueNamespaces` for full native/vendor properties and `keyAliases` for differing public keys or short property aliases; use `@utilities` for semantic subproperties that cannot be direct fallbacks. Reserve special utility implementation for multi-declaration behavior, transforms, raw ambiguous matching, or compiler-inexpressible behavior. State why aliases plus native namespaces are insufficient. See `packages/preset/AI.md` for ownership and source locations.
- Requested refactors prefer clean design over legacy compatibility unless the user or issue requires it. Remove obsolete compatibility paths and explicitly report API, config, class syntax, CSS output, runtime, extraction, language, or ESLint changes. Narrow features and bug fixes preserve existing behavior unless correctness requires otherwise.
- Keep changes focused; avoid unrelated formatting and unexplained generated-file, snapshot, or fixture edits. Keep public exports deliberate. Add dependencies only when the current toolchain cannot reasonably solve the problem.
- Package names, build/release flows, CI, lockfiles, and package-manager configuration require an explicit request to change.
- Public docs belong in `site/`; do not create root `docs/` unless requested. Directive syntax, semantics, lowering, extraction, or directive refactors must update `site/app/[locale]/guide/directives/content.mdx` in the same change.
- Source limits are 800 lines/64 KiB for production, 1,000 lines/96 KiB for tests/scripts/benchmarks, and 400 lines/48 KiB for AI context. Generated sources and bounded exceptions follow `.ai/context/source-budget.json`.

## Completion And Validation

Complete the authorized change, run relevant checks, fix failures introduced by the change, and rerun affected checks without stopping for review after the first implementation. Do not expand into unrelated repairs or weaken correctness to pass tests. Report blockers and pre-existing failures separately.

Run scoped validation first. Run each changed workspace package's `lint` script if defined; report when it has none. Parser/compiler/renderer/runtime/scanner/language/ESLint behavior changes require focused tests. Use [.ai/context/testing.md](.ai/context/testing.md) for check selection and `.ai/testing-policy.md` for the behavioral validation matrix. Broaden or repeat checks only for new changes, failures, or unresolved risks. After AI/source structural work, run `pnpm run check:ai-context`.

Report the result, intentional behavior/API changes, validation, and remaining limitations. Reviews lead with findings by severity, with file/line evidence: bugs, regressions, CSS/API changes, missing tests, semantic risks, and unrelated churn. If none are found, say so and identify residual risk or missing validation.

## Commit Format

Use Aronrepo conventional commits: `Type(Target): Summary`, sentence-case summary, no trailing period; target is optional but recommended.

Allowed types: `Bump`, `Feat`, `New`, `Perf`, `Add`, `Update`, `Improve`, `Fix`, `Deprecate`, `Drop`, `Docs`, `Upgrade`, `Revert`, `Example`, `Test`, `Benchmark`, `Build`, `CI`, `Style`, `Refactor`, `Chore`, `Misc`.

Use release-impacting types only for published behavior/APIs, release behavior, or published README changes. Use `Chore(Agent)` for internal AI instructions, `Chore(Deps)` for development dependencies/lockfiles, `Build` for dev tooling, `CI` for workflows/status checks, `Style` for formatting/lint-only changes, and `Benchmark` for measurement-only changes.
