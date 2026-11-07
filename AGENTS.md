# Master CSS AI Instructions

This is the canonical repository instruction file. Keep shared policy here, task routing in `.ai/context/`, detailed architecture in `.ai/`, and package-specific constraints in the owning `AI.md`.

## Context By Task

Start with the affected source and nearby tests. Before changing package code, read its `package.json` or crate `Cargo.toml` and local `AI.md`, if present. Use [.ai/context/index.md](.ai/context/index.md) when choosing a workflow or locating additional context; it is a router, not a mandatory reading stack.

- Use [.ai/context/package-routing.md](.ai/context/package-routing.md) when ownership or affected packages need locating.
- Use [.ai/context/rust-routing.md](.ai/context/rust-routing.md) for Rust semantics, bindings, codegen, or parity.
- Before modifying parser/compiler, CSS output, runtime, extraction, language, ESLint, public APIs, package boundaries, or performance-sensitive behavior, follow [.ai/context/accuracy-guardrails.md](.ai/context/accuracy-guardrails.md) to the relevant deep references.
- Pure wording or formatting edits need only the affected document and applicable local guidance. Do not load unrelated architecture or reread instructions already in context.

Source and tests establish current behavior; deeper `.ai/*.md` documents explain architecture and policy. Compact packs route to that evidence. Correct stale guidance when verified; do not infer semantic correctness from a short pack alone.

## Development MCP Servers

- Project configuration lives in `.codex/config.toml` for Codex and `.mcp.json` for Claude Code. Use only the servers relevant to the task.
- For Svelte integration, example, or fixture changes, use `svelte` to retrieve the relevant documentation and run `svelte-autofixer` on changed components or `.svelte.ts`/`.svelte.js` modules before the existing project checks.
- Use `astro-docs` for the Astro site and integration; use `next-devtools` for Next.js integrations and examples. Discover the intended development server and verify its project path before reading routes, logs, or errors. Prefer installed, version-matched framework documentation when current remote docs differ.
- `master-css` runs this checkout's built MCP executable with `site/` as its root. Use its workspace, manifest, inspection, and lint tools for site styling; use its preview/apply flow for file changes. This is a local checkout configuration: update the executable and root paths when moving it to another checkout. It does not replace the source and Rust ownership rules below.
- Use `cloudflare-docs` for Cloudflare hosting and deployment configuration.

## Project Contracts

Master CSS turns markup classes such as `fg-red-60:hover@sm` into layered CSS across engine, runtime, server, scanner, integrations, language tooling, and ESLint.

`packages/preset/src/base.css`, exposed through `@master/css/base.css`, declares the stable order:

```css
@layer theme, base, defaults, components, utilities;
```

Native defaults and components use `@layer` with class selectors. Top-level `@utility` definitions register on-demand classes; `@mixin` defines independent CSS reuse; `@apply --name(...)` expands a mixin in place. Use native CSS declarations and selectors in stylesheets and utilities directly in markup. Preserve ordered declarations and duplicates.

Generated rules use those layer blocks without dynamically adding the layer statement. Native keyframes stay in place and verbatim; `@prune native` keyframes are on-demand definitions the engine emits like tokens, wrapped in their declared conditions and named layers, and linked stylesheets never receive markers or companion files. `@theme` accepts only token declarations. Tokens use `:root,:host`; optional `static` retains tokens and `inline` substitutes their values once in Master-generated declarations. Native selectors and conditions remain outside `@theme` and do not register utility tokens. Native classes and keyframes share per-file preserve/prune policy. `@safelist keyframes` accepts exact quoted names; reference-only definitions do not create roots, and emitted globals deduplicate keyframes another output delivers. Track keyframes by definition ID, preserving same-name definitions and import occurrences. Analyze animation declarations and transitive tokens in Rust, retaining all managed definitions for dynamic names. Any CSS output difference is an intentional, explained behavior change covered by tests or fixtures.

Rust is the semantic source. TypeScript supplies platform loading, filesystem/package resolution, editor adaptation, and diagnostic capability checks; it must not implement semantic fallbacks. The one deliberate exception is the browser engine, `@master/css-engine-js`: it executes compiled runtime programs in browsers and must match the Rust engine byte for byte. A Rust engine semantics change lands with the matching JavaScript change and a zero-difference `bun run --filter @master/css-engine-js differential` in the same change; see `.ai/architecture.md#browser-engine`.

Preserve dependency direction:

```txt
shared / external data
  -> schema / native and Wasm artifact loaders, which bundle the JavaScript engine / preset
  -> @master/css / @master/css-tooling
  -> @master/css-compiler
  -> server / runtime / language-service
  -> build plugins / CLI / ESLint / language-server
  -> framework integrations / VS Code / examples / site
```

`@master/css` owns Manifest v6 execution and must not depend on compiler, tooling, downstream hosts, or integrations. Tooling owns lexer/source/scanner/validator/lint/language sessions and must not depend on compiler, language service, build adapters, or editors. Compiler owns compiler/project/stylesheet/inspection orchestration. Resolve cycle pressure by placing dependency-light contracts in schema, semantics in the owning Rust crate, compiler orchestration in compiler, and editor-neutral operations in tooling. `@master/css-internal` is repository-private and bundled into official consumers; it is neither a public adapter SPI nor a generic utility package.

## Design And Change Boundaries

- For features, discover existing public APIs, private lower-package helpers, downstream consumers, and behavior tests before designing new abstractions. Reuse public capabilities; if needed behavior is private below the feature, intentionally extract a shared API at its owning layer first.
- Runtime source, runtime-imported engine exports/modules, schema value constants, and preset manifest loading are browser bundle surface. Classify additions as runtime core, build-time configuration, or tooling; keep tooling-only behavior at its owner or a suitable subpath and validate bundle impact when feasible. Do not add global event buses or tooling observer APIs to runtime; use DOM `MutationObserver` or explicit public runtime state for third-party class observation.
- Native declarations are `(property:value)` class heads with full native property names; the lexer finds the closing parenthesis with CSS component-value rules before any manifest lookup, and a bare `name:suffix` is always a registered name plus selector. The preset's 292 fixed utilities (`block`, `hidden`, `flex`, `text-center`, `mx-auto`, `b-solid`, `w-full`, `pill`, …) are ordinary static `@utility` definitions emitting one declaration each, and its 100 direct-value functions (`m(4)`, `b(1)`, `grow(1)`) take one static `<number>`; prefer them over equivalent native declarations in UI, examples and teaching. The complete fixed spelling wins over a same-named token key. Within a tier, generated rules sort recipes, then single-declaration utilities by property family and coverage, then native declarations. Utility names cannot contain `_`. Explicit `@utility prefix-(--namespace)` patterns own token families and bind token values symbolically. Several token patterns may share a prefix with distinct namespaces; only a unique token key selects a branch, otherwise report `AMBIGUOUS_TOKEN` without CSS. Same-prefix, same-namespace definitions replace completely. Static `@utility name` and functional `@utility name(...)` forms register independently. Rust enables negative/opacity capabilities only for one native declaration exactly `var(--parameter)`. Language and tooling sessions expose versioned `tokenFamilies()` metadata; no execution registry or `./builtins` projection exists. Use `@utility` for class recipes and `@mixin` for CSS reuse. A token pattern with one `<string>` parameter binds the key from its parameter namespace; companion tokens do not create classes. Do not add CSS mapping directives, manifest mapping settings, raw aliases, or TypeScript semantic fallbacks. See `packages/preset/AI.md` for source ownership.
- Requested refactors prefer clean design over legacy compatibility unless the user or issue requires it. Remove obsolete compatibility paths and explicitly report API, config, class syntax, CSS output, runtime, extraction, language, or ESLint changes. Narrow features and bug fixes preserve existing behavior unless correctness requires otherwise.
- Keep changes focused; avoid unrelated formatting and unexplained generated-file, snapshot, or fixture edits. Keep public exports deliberate. Add dependencies only when the current toolchain cannot reasonably solve the problem.
- Package names, build/release flows, CI, lockfiles, and package-manager configuration require an explicit request to change.
- Public docs belong in `site/`; do not create root `docs/` unless requested. Directive syntax, semantics, lowering, extraction, or directive refactors must update `site/content/guide/directives/contract.mdx` in the same change; `site/reference/build.ts` renders it into the `/reference/directives` pages.
- Source limits are 3,200 lines/256 KiB for production, 1,000 lines/96 KiB for tests/scripts/benchmarks, and 400 lines/48 KiB for AI context. Generated sources and bounded exceptions follow `.ai/context/source-budget.json`.

## Completion And Validation

Complete the authorized change, run relevant checks, fix failures introduced by the change, and rerun affected checks without stopping for review after the first implementation. Do not expand into unrelated repairs or weaken correctness to pass tests. Report blockers and pre-existing failures separately.

Run scoped validation first. Run each changed workspace package's `lint` script if defined; report when it has none. Parser/compiler/renderer/runtime/scanner/language/ESLint behavior changes require focused tests. Use [.ai/context/testing.md](.ai/context/testing.md) for check selection and `.ai/testing-policy.md` for the behavioral validation matrix. Broaden or repeat checks only for new changes, failures, or unresolved risks. After AI/source structural work, run `bun run check:ai-context`.

Report the result, intentional behavior/API changes, validation, and remaining limitations. Reviews lead with findings by severity, with file/line evidence: bugs, regressions, CSS/API changes, missing tests, semantic risks, and unrelated churn. If none are found, say so and identify residual risk or missing validation.

## Commit Format

Commits and PR titles follow the generated Aronrepo policy below, enforced by `aronrepo check` in the commit hook, the PR title check, and `bun run commit-check`; the release resolves its version and notes with the same rules. Add a scope when it names the package, crate, workflow or area; omit an artificial one. Append `, resolved #123` (or `#123 #124`) when the commit closes issues. Edit `aronrepo.config.js` and run `bun x aronrepo agents --write` instead of editing the block.

<!-- aronrepo:commit-policy:start -->
<!-- Generated by `aronrepo agents --write`. Edit aronrepo.config.js and regenerate instead of editing this block. -->

## Commit and Release Policy

Release mode: **explicit**. Only the repository owner decides minor and major versions, with `Bump(Minor)` and `Bump(Major)` commits.

Commit headers and PR titles use `Type(Scope): Summary` or `Type: Summary`: a PascalCase type, an optional scope for the package or area, and a sentence-case summary without a trailing period.

| Type | Release | Use for |
| --- | --- | --- |
| `Bump(Major)` | major | Release a major version. Only the repository owner decides it. |
| `Bump(Minor)` | minor | Release a minor version. Only the repository owner decides it. |
| `Bump(Patch)` | patch | Release a patch version without another release commit. |
| `Add` | patch | A new capability: a new API, export, option, command, or package. |
| `Improve` | patch | A better existing capability without new API: behavior, output, messages, or defaults. |
| `Perf` | patch | Faster or lighter published code with the same behavior. |
| `Fix` | patch | A bug fix in published behavior. |
| `Deprecate` | patch | Mark a published capability as deprecated while it keeps working. |
| `Drop` | patch | Remove a published capability. |
| `Upgrade` | patch | Change a runtime dependency of a published package. |
| `Revert` | patch | Revert a commit. It releases what the reverted commit released. |
| `Docs(README)` | patch | Change a published package README. |
| `Docs` | none | Documentation that is not a published package README. |
| `Test` | none | Tests that cover existing behavior. |
| `Benchmark` | none | Benchmark harnesses, fixtures, and reports. |
| `Example` | none | Examples that do not ship in a package. |
| `Build` | none | Build tooling and development configuration. |
| `CI` | none | CI workflows and automation. |
| `Style` | none | Formatting and lint-only changes. |
| `Refactor` | none | Code changes that keep published behavior. |
| `Chore` | none | Maintenance: development dependencies, lockfiles, metadata, agent guidance, and unpublished workspaces. |

Legacy types are rejected: `Feat` (use `Add`), `New` (use `Add`), `Update` (use `Improve`), `Misc` (use `Chore`).

### Release decisions belong to the owner

- Never write `Bump(Major)` or `Bump(Minor)` unless the user explicitly asked for that release level in the current conversation.
- Never add a `BREAKING CHANGE:` footer or a `Type!:` header. If a change breaks published behavior, stop and ask the user how to release it.
- Every type except `Bump(Minor)` and `Bump(Major)` releases at most a patch. Pick the type that describes the change, not the release level you want.

### Choosing a type

- Use a release type only when the commit changes files that ship in a published package (release paths) and affects published behavior, public API, release behavior, or published README content. Otherwise use a non-release type.
- Pick the type that describes the change: a new capability is `Add`, a better existing capability is `Improve`, a bug fix is `Fix`, and a runtime dependency change is `Upgrade`.
- A commit that changes no release path must use a non-release type (`Chore`, `Refactor`, `Style`, `Test`, `Docs`, `Build`, `CI`, `Benchmark`, `Example`), even when it fixes or speeds up something.
- Split unrelated changes so each commit carries its own release level.

Non-release defaults:

- Agent instructions, prompts, and repository context: `Chore(Agent)`
- Sites, apps, and other unpublished workspaces: `Chore(<Scope>)`, `Refactor`, `Style`, or `Test`, even for fixes and performance work
- Tests that only cover existing behavior: `Test`
- Benchmark harnesses, fixtures, reports, and measurement-only changes: `Benchmark` (never `Perf`)
- Build tooling and dev-only configuration: `Build`; CI workflows: `CI`; formatting: `Style`
- Development dependencies, lockfiles, and routine metadata: `Chore(Deps)` or `Chore`
- Examples: `Example`; internal or site documentation: `Docs`
- Refactors that do not change published behavior: `Refactor`

### Release paths

Only changes to these files can release a version:

- `packages/astro/**`
- `packages/binding/**`
- `packages/binding-darwin-arm64/**`
- `packages/binding-darwin-x64/**`
- `packages/binding-linux-arm64-gnu/**`
- `packages/binding-linux-arm64-musl/**`
- `packages/binding-linux-x64-gnu/**`
- `packages/binding-linux-x64-musl/**`
- `packages/binding-wasm-compiler/**`
- `packages/binding-wasm-engine/**`
- `packages/binding-wasm-tooling/**`
- `packages/binding-win32-arm64-msvc/**`
- `packages/binding-win32-x64-msvc/**`
- `packages/cli/**`
- `packages/compiler/**`
- `packages/create/**`
- `packages/css/**`
- `packages/css-sv/**`
- `packages/eslint-config/**`
- `packages/eslint-plugin/**`
- `packages/language-server/**`
- `packages/language-service/**`
- `packages/mcp/**`
- `packages/next/**`
- `packages/nuxt/**`
- `packages/preset/**`
- `packages/runtime/**`
- `packages/schema/**`
- `packages/server/**`
- `packages/svelte/**`
- `packages/tooling/**`
- `packages/vite/**`
- `packages/vscode/**`
- `packages/webpack/**`

Excluding: `**/tests/**`, `**/test/**`, `**/__tests__/**`, `**/*.{test,spec}.*`, `**/*.test-d.*`, `**/__snapshots__/**`, `**/__fixtures__/**`, `**/__mocks__/**`, `**/fixtures/**`, `**/benchmarks/**`, `**/examples/**`, `**/CHANGELOG.md`, `.github/**`, `.husky/**`.

### Before handing off commits

- `bun x aronrepo check --from origin/main --to HEAD`
- `bun x aronrepo explain`

`aronrepo explain` prints the next release level and the reason for each commit. Tell the user when it is not what they expect.
<!-- aronrepo:commit-policy:end -->
