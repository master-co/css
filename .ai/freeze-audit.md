# Master CSS 2.0 Freeze Audit

Tracker: https://github.com/master-co/css/issues/445

Baseline: `70444b18c8102fa7a9d811ec51ef96902573792c`.
This is a dated evidence record, not a replacement for source, package guidance,
or publication authorization. Local results below are from 2026-09-26–28,
macOS arm64, Node 24.20.0, pnpm 12.3.4, Cargo 1.98.1.

## Decisions

- Native CSS property/value identity must not depend on value inference.
- Hyphenated named styles select vocabulary; raw keys accept direct values.
- Abbreviations shorten identity, not meaning. Explicit multi-property utilities
  remain possible through the existing authoring contract.
- Rule ordering is semantic; final deterministic tie-breakers remain internal.
- Static is the normal integration path; runtime is an explicit capability.
- Rust owns semantics. Hosts supply filesystem, platform and capability checks.
- Stabilize Manifest v1 / language v3 execution, not caches or a lossless CSS AST.

### Verifiable Principles (#446)

| Principle | Observable contract | Executable evidence |
| --- | --- | --- |
| Native CSS semantics | `font:16px` stays a `font` declaration; matching does not certify its value | compiler `tests/issues/447.test.ts`, css `inspection-contract.test.ts` |
| Explicit named styles | `fg-red` uses `--color-red`; a missing explicit token produces `UNKNOWN_TOKEN` | compiler `tests/issues/447.test.ts` |
| Abbreviations without inference | `p:8px` emits `padding:8px` with the authored unit | compiler `tests/issues/447.test.ts` |
| No value-based property inference | `flex:hover` stays raw `flex:hover`; `display:flex:hover` applies a selector state | compiler `tests/issues/447.test.ts`, Rust `utility_definition_contract` |
| Semantic ordering | `display:block flex` and `block flex` can have different winners; unsafe canonicalization is suppressed | runtime `freeze-cascade-matrix`, compiler `public-inspection-workflow` |
| Static first | Official adapter defaults generate CSS without browser execution assets | Vite/Webpack/Next and wrapper test suites; example builds remain a separate gate |
| One semantic source | Both compilers and both engines agree on 34 language cases and reject removed settings | compiler `tests/issues/447.test.ts`, Rust parity |

### Finding Classification

| Finding | Decision | Tracking |
| --- | --- | --- |
| Missing public inspection status and diagnostic types | Required for 2.0; expose existing Rust output through the owner | #447, #452 |
| Pattern composition documented as unsupported | Required for 2.0; correct prose against source and executable examples | #448, #453 |
| ABI census and schema export guidance drift | Required for 2.0 audit accuracy; no ABI change | #446 |
| Native/Wasm, directive, cascade and roundtrip coverage | Required for 2.0; extend existing tests where coverage is missing | #447–#452 |
| Joint JS/Wasm/manifest size gate | Deferred to 2.x measurement policy; measure the current assets without changing the gate | #451, #455 |
| Editable source IR and semantic comparison API | Deferred to 2.x design; keep separate from execution data | #455–#456 |
| Value-based property inference, typed raw matchers, removed managed layer directives, universal unknown-field compatibility | Intentionally rejected; preserve explicit language and version contracts | #447–#450 |

## Contract Inventory

| Area / issue | Semantic owner and public entry | Evidence / consumers |
| --- | --- | --- |
| Language / #447 | engine `utility.rs`, `condition.rs`, `named.rs`; `@master/css` inspection | `utility_entry_resolution`, `condition_ranges`, compiler `named_token_contract`; all renderers and tooling |
| Directives / #448 | compiler `directives.rs`, `manifest/`, `lower/`; compiler compile APIs | `utility_definition_contract`, `native_components_compose`, `bug_hunt_native_conditionals`; project, stylesheet, integrations |
| Cascade / #449 | engine `compare_rule_priority`, generation; lint recommendation shape check | runtime `named-token-contract`, `native-components-compose`, `freeze-cascade-matrix`; lint, SSR, CSSOM |
| Manifest / #450 | schema `manifest.rs`; schema `./manifest`, compiler project APIs | schema codec tests; compiler `freeze_manifest_contract` and `public-inspection-workflow`; native/Wasm, hydration |
| Rendering / #451 | engine/render semantics; server/runtime hosts; official adapters | runtime `final-semantic-modes`, `hydration-edge-cases`; adapter static/default tests |
| Tooling / #452 | validator/lint/language Rust crates; tooling, compiler diagnostics | `parity/v2-tooling-workflows.json`, MCP `final-semantics`; ESLint, LSP, MCP |
| Extensibility / #455 | existing compiler/tooling/schema public exports | `public-inspection-workflow.test.ts`; no private integration SPI |
| Future compatibility / #456 | versioned schema and compiler authoring boundary | `site/architecture/styling-ir-roadmap.md`; separate authoring/editing proposal |

Public language evidence lives in the style-declarations, conditional-queries,
directives, cascade-layers and rendering-modes guides under `site/`.

## Verified Findings And Changes

1. **Contract bookkeeping:** binding ABI is 13 in both Rust schema and generated
   TypeScript protocol; the API census incorrectly recorded 12. Regenerating the
   census changes that single value. No ABI or package export changed.
2. **Guidance drift:** schema's AI notes listed private `./manifest-json` as a
   public subpath and omitted emitted-globals, diagnostics and integration.
   Corrected against `packages/schema/package.json`; codec helpers are exported
   by the root and `./manifest`.
3. **#444 current-language regression:** explicit dark mode plus breakpoint emits
   two valid native media wrappers. The new compiler regression checks both suffix
   orders, parses emitted CSS, roundtrips the manifest and compares reverse
   incremental registration with batch generation. This does not prove the old
   published RC is fixed; #444 remains open.
4. **Canonicalization boundary:** `display:block flex` computes `block`, while
   `block flex` computes `flex`. This is an existing cascade distinction, not an
   alias-equivalence promise. The public tooling test confirms it does not suggest
   the unsafe canonical rewrite. Do not erase this distinction by changing a test
   expectation or silently changing priority.
5. **Native cascade:** new browser cases cover equal-scope token/raw priority,
   importance, reversed important layer precedence, unlayered declarations,
   shorthand/longhand, groups and incremental re-insertion in four rendering modes.
6. **Public workflow:** project loading, token enumeration, serialization,
   inspection and validation work through public exports. Validation separates a
   known-invalid value (`padding:red`) from unknown dynamic values and unmatched
   classes. Explicit project entry paths in this example are absolute.
7. **Public inspection types:** `MasterCSSEngineInspection` omitted the existing
   Rust `cssSyntaxStatus` and optional `diagnostics` fields. The public interface
   now derives their types from the binding session's inspection return type.
   This is a type correction, with no new runtime logic, wire field or ABI change.
   Both bindings distinguish syntax recognition from value validation and return
   immutable diagnostics without registering inspected classes.
8. **Language matrix:** `packages/compiler/tests/issues/447.test.ts` checks all
   four compiler/engine binding combinations, 27 matched and seven diagnostic or
   unmatched cases, removed settings, and saved media-mode migration. Reversed
   insertion keeps rule order and resource content/ref counts; theme variable
   declarations follow first activation order, so distinct variable declaration
   order is not a byte-equality promise across different insertion sequences.
9. **Pattern composition documentation:** fixed class composition in enum, token
   and raw patterns already works, including forward references. The directive
   contract incorrectly excluded it. Corrected the prose and added native/Wasm
   public compiler tests preserving duplicate fallbacks and statement boundaries,
   while rejecting `--value()` inside a compose target. No lowering changed.
10. **Manifest boundary matrix:** `packages/compiler/tests/issues/450.test.ts`
    roundtrips compiled and publicly constructed definitions through both bindings.
    It preserves ordered duplicate declarations, transitive variables, keyframes
    and resource withdrawal. It also checks missing/unsupported versions, removed
    fields, strict nested mode fields and retained opaque envelope metadata. A
    codec successfully serializing an object does not establish engine acceptance.
11. **Integration documentation drift:** Next, Nuxt and Astro READMEs incorrectly
    described progressive defaults and runtime disabling. They now match the
    existing static defaults and reject contradictory runtime options. Next's
    README also now states the existing opt-in native pruning behavior.
12. **Progressive examples:** Astro and Svelte examples described progressive
    delivery while selecting the static default. Both now explicitly select
    progressive. Svelte also lacked a client bootstrap: its server hook emitted
    CSS, but no runtime loaded and an unseen `padding:37px` class had no effect.
    The client hook now imports the existing Vite `virtual:master-css-runtime`
    module, whose ambient declaration is added to `@master/css/client`. Package
    and site instructions explain this explicit SvelteKit setup. This changes
    those examples' delivery and documents an existing bootstrap capability;
    it does not change integration defaults or add a new runtime implementation.
13. **Public extension example:** `packages/compiler/examples/inspect-project.ts`
    makes the project → token → codec → inspection → validation workflow runnable
    using public exports. The example is part of compiler type-check coverage and
    was executed with Node 24 from a separate project directory. Valid, empty,
    known-invalid, unmatched and failed-project outcomes stay distinct. It adds
    no runtime import or public package export.
14. **Migration ABI wording:** the migration overview and rendering guide still
    named ABI 8, while the current Rust/TypeScript binding ABI is 13. Corrected
    both public pages and retained the historical behavior explanation without
    claiming that ABI 8 is the current upgrade target.

### Directive Review (#448)

| Contract | Source / behavior evidence | Public documentation |
| --- | --- | --- |
| Global definition positions; rule-local variants/composition | compiler `directives.rs`, `bug-hunt-directive-positions.test.ts`, `bug-hunt-ordered-direct-output.test.ts` | directives: Definition scope and imports; Supported contexts |
| Replacement, empty definitions, ambiguity and source locations | Rust `utility_definition_contract`, engine `utility_entry_resolution` | directives: Whole-definition replacement; Named token patterns |
| Import/reference scope, graph ordering, reference cycles | project `bug_hunt_manifest_graphs`, compiler `bug-hunt-reference-source-maps.test.ts` | directives: Reference context; Stylesheet boundaries and resource URLs |
| Duplicate declarations, fixed forward composition, cycles, native token streams | Rust `native_components_compose`, `utility_definition_contract`; compiler `tests/issues/448.test.ts` | directives: Rule-local composition; Native CSS preservation |
| Removed typed raw matchers and managed layer directives | Rust `removed_pattern_forms_and_duplicate_enum_keys_fail`, `removed_managed_directives_are_diagnosed` | directives: Dynamic values; Native defaults/components |

## Validation Evidence

| Command / scope | Result |
| --- | --- |
| `cargo test -p mastercss-schema -p mastercss-engine -p mastercss-compiler -p mastercss-lint -p mastercss-validator` | 329 tests passed before the new regression file |
| `cargo test -p mastercss-compiler --test freeze_manifest_contract` | 2 passed |
| npm tests: schema, css, compiler, tooling, MCP, server | 982 passed before the new public workflow file |
| npm tests: Vite, Webpack, Next, Astro, Nuxt, Svelte, language-service, language-server, ESLint | 1,736 passed |
| compiler `public-inspection-workflow.test.ts` | 3 passed after adding the executable example |
| compiler `tests/issues/{447,448,450}.test.ts` and public workflow | 12 passed after rebuilding bindings |
| `@master/css` full suite, including public inspection regression | 78 passed |
| Rust lexer; focused engine; compiler language/migration suites | 23 + 13 + 46 passed |
| `cargo test -p mastercss-project`; preset npm suite | 17 + 39 passed |
| `cargo test -p mastercss-language -p mastercss-diagnostics -p mastercss-cli` | 33 passed |
| runtime existing five focused suites, all three browsers | Chromium/WebKit passed; initial Firefox launch failures were environmental and superseded by the full isolated Firefox run below |
| runtime `freeze-cascade-matrix.test.ts`, all three browsers | 12 passed within the full suites |
| full runtime suite, Chromium/WebKit, after builds completed | 288 passed; supersedes the initial 287/288 run with one startup timeout |
| full runtime suite, Firefox with isolated app-data launch | 144 passed; 432/432 across all three browsers |
| `cargo xtask codegen --check` and `cargo xtask parity` | Passed |
| `cargo clippy -p mastercss-compiler --tests -- -D warnings`, `cargo fmt --check` | Passed |
| `check:boundaries`, `check:packages`, `check:api-census` | Passed after the single census correction |
| `check:runtime-size` | Passed against the rebuilt global bundle |
| schema/compiler/runtime package lint | Passed |
| schema/compiler/runtime package type-check | Passed |
| css/compiler lint, type-check and css/compiler package build | Passed after the public inspection type correction and executable example |
| Astro/Next/Nuxt/Svelte package lint; Svelte example lint/check | Passed; Astro example defines no lint script |
| site lint | Passed with 266 warnings, zero errors; no autofix applied |
| site `test:docs-examples` | 17 passed |
| site `test:reference` | 20 passed after adding the missing Guide entrance for `#priority-matrix` |
| site type-check and focused changed-guide lint | Passed |
| `pnpm build:site` | Passed; rebuilt native/Wasm and packages, exported 830 pages, verified 95 public assets |
| `pnpm build:examples` | 36 build tasks passed, zero cache hits; Laravel task reports no declared outputs |
| Astro/Svelte progressive example builds and live browser smoke | Both rebuilt after fixes; 6 app/browser combinations passed across Chromium, WebKit and Firefox |
| public example CLI, valid and invalid project | Node 24 execution returned `ready`/exit 0 and `error`/exit 1 with no fallback |
| site `test:syntax-migration` | 3 passed after building the site; earlier missing-export blocker resolved |
| `pnpm run check:ai-context` | Passed for 3,084 files |
| `git diff --check` | Passed |
| `cargo xtask stage-native-target binding-darwin-arm64 --release` then native package smoke | Passed after updating its Manifest/method fixture |
| Next static-export focused e2e | 1 passed after untracking generated `.master` outputs |
| Next full package e2e, local macOS | 10/10 passed; repeated with `CI=true`, also 10/10 passed |
| Next HMR e2e after changing the fixture import to a relative path | Initial local run passed 4/4; later focused local runs reproduced Webpack server and style-update timeouts. Package lint and type-check passed |
| binding package local build, type-check, lint and tests | Passed on macOS; 33/33 tests passed. A temporary CRLF conversion of 34 binding source files also built, then was reverted without a source diff |
| `pnpm run check:migration` | Failed on stale reviewed target digest `rc87-bc7adf7569796dc8` from the pre-existing baseline; a diagnostic regeneration also exposed 503 unapproved changed/removed Rust-refactor cases requiring individual review |
| Windows compatibility CI on PR #461 | Checkout, pnpm installation and Rust Wasm build passed after fixing generated-file tracking and patch checkout line endings; package tests failed while building binding declarations |
| Linux e2e CI on PR #461 | Initial and two later full runs failed the same 2/10 Webpack dev-HMR cases on timeouts; isolated job reruns at both `a654e5376` and `e2b181da3` passed 10/10 Next cases and 34/34 Turbo tasks |

The second pass rebuilt native/Wasm and package artifacts with the normal
repository build; the first pass used existing artifacts. No semantic
production code changed. This was a local rebuild using the installed toolchain
and dependencies, not an isolated clean-room release or cross-platform native
binary certification.

## Browser Payload Observation

Measured with Node zlib (`gzipSync(bytes, { level: 9 })` and default
`brotliCompressSync(bytes)`). The second pass remeasured the artifacts rebuilt by
`pnpm build:site`; all sizes match the first-pass observation. These are separate
asset bytes, not a claim about every integration's transport:

| Artifact | Raw | Gzip | Brotli |
| --- | ---: | ---: | ---: |
| runtime `dist/global.min.js` | 48,219 | 13,332 | 12,027 |
| engine Wasm | 1,044,735 | 325,055 | 247,306 |
| preset source Manifest JSON | 90,403 | 12,832 | 10,188 |
| Sum of these three separate files | 1,183,357 | 351,219 | 269,521 |

The rebuilt static React, Vite and Webpack examples contained 16, 16 and 4 files
respectively, with no Wasm files or engine/execution-manifest markers in their
HTML/JS/JSON output. Adapter tests separately cover default mode and injection
policy. Progressive example browser checks confirmed one adopted style, unseen
dynamic class generation, and no page errors in all three browsers; Astro's
button color changes also passed. These checks do not claim every framework route
or deployment is covered.

The existing runtime-size gate checks only the global JS bundle. It does not
enforce the three-file total. This audit does not silently broaden that gate or
raise its budget. No production hot path changed, so CPU/memory/cold-start
benchmarks were not run.

## Freeze readiness: local source PASS; PR integration BLOCKED

All required/recommended findings identified in this audit have implementation
or documentation evidence and the local support matrix passed. The 2.x authoring
and extension capabilities remain separate roadmap proposals with follow-up
issues; no editable IR or public SPI is implied by this PASS. This is a source
freeze assessment, not npm publication approval or cross-platform release
certification. Native artifact validation here covers macOS arm64; other targets
and an isolated clean-room release build were not run.

PR [#461](https://github.com/master-co/css/pull/461) exposed additional
integration gates that the local scoped suite did not exercise:

- The user explicitly approved three stale contract records and the separate
  eight-file/21-case Manifest adaptation after exact old/new reviews. Fresh
  approval metadata and scope digests are recorded in
  `parity/freeze-migration-approval.md`; all approved bytes/cases match the target.
  The independent post-rc.87 decision validation passes. `check:migration` now
  proceeds past those stale records and reports 496 unreviewed changed/unmatched
  cases. These are not 496 proven product defects; no blanket approval or
  generated ledger rewrite was made.
- Windows checkout and installation now pass after untracking eight ignored
  generated stylesheet paths and preserving LF in `patches/*.patch`. The shared
  tsdown external rule now excludes resolved Windows drive paths from bare
  imports, resolving the declaration-build failure. The native smoke payload
  uses the current language version; all eight native-target jobs pass.
- [CI at `7836f3b54`](https://github.com/master-co/css/actions/runs/36324861696)
  confirms Windows migration, watch and publication-recovery fixes. CLI improved
  from 53/84 to 79/84; remaining failures were four Unix-only process-signal
  expectations and one transient lock-register rename denial. The tests now
  verify Windows self-termination status while retaining all recovery assertions.
  Publication locks retry Windows sharing violations for at most one second
  (within the existing acquisition deadline), keeping the old register visible.
  Persistent errors still fail without entering publication. Five focused
  regressions cover retry, cleanup, exclusion and terminal errors. Local CLI
  tests pass 89/89, with lint, type-check and build passing. CI at `147dbcd4d`
  confirms all 89 CLI tests pass on Windows.
- That Windows run next exposed nine Webpack failures: CRLF imports survived
  the runtime test harness, native directory separators mismatched Webpack asset
  keys, and the runtime browser test rebuilt shared `dist` while other tests
  loaded it. The harness accepts CRLF, asset keys use forward slashes, and all
  tests consume the existing pre-test build. Assertions and deadlines remain
  unchanged. Local Webpack tests pass 93/93 with lint and type-check; explicit
  LF/CRLF parsing reproduces the old failure and verifies the correction.
  Windows CI at `4b8eb7f0b` confirms 93/93 passed; CLI remains 89/89.
- Linux e2e at `7836f3b54` passed 9/10 Next cases; the full Webpack HMR case
  exhausted its unchanged 180-second deadline. Earlier isolated reruns passed
  10/10. Relative fixture imports removed an invalid file-URL cache dependency,
  but did not resolve the intermittent failure. Failure diagnostics remain in
  place; temporary timeout and Next agent-rule experiments were reverted.
- CPU profiling then traced repeated Webpack HMR work to `stylesheet-loader`
  recompiling immutable `.master/next-style-*.css` outputs. These now pass through
  unchanged, like the generated entry. The regression test fails before the fix
  and passes afterward; authored entry errors still propagate. Next unit tests
  pass 199/199 and e2e passes 10/10 with unchanged deadlines/assertions. On this
  macOS host, three Webpack single/burst samples improved from 12–21 seconds to
  3.0–3.5 seconds; profiling overhead and host load limit the comparison. This
  affects build tooling, not runtime bundle size or authored CSS syntax. The
  earlier remote run does not contain this fix. CI at `147dbcd4d` then passed
  Next 10/10, runtime 432/432 and all 34 Linux e2e Turbo tasks. Linux e2e,
  Rust quality and all eight native targets also passed at `4b8eb7f0b`.
- Aron authorized shared build, CI and preview configuration repairs on
  2026-09-27. The hosted script now prepares the pinned Rust toolchain. Cloudflare
  advances past its former `cargo: not found` error, builds all 32 packages,
  compiles Next and reaches 731/830 generated pages. That preview stalled and
  was canceled after 33 minutes so the queued current commit could start.
  Cloudflare then successfully deployed `147dbcd4d` in 18 minutes: all site
  output, 95 referenced assets and the Worker compiled successfully. The
  composition directive reference renders in Chrome without console errors;
  `/api/play/health` returns HTTP 200 with `{"ok":true}`. Storage writes were
  not exercised. Preview: `0176cc14.master-css-e8w.pages.dev`.
  Vercel branch configuration replaces the obsolete `pnpm submodules` command
  and selects Node 24. Its subsequent build reached parallel Turbo artifact
  tasks, then collided reinstalling Rust. Turbo now preserves `CARGO_HOME` and
  `RUSTUP_HOME`, verified by dry-run, and the hosted script installs the toolchain
  before parallel work. The full hosted build passed locally with 830 pages and
  95/95 referenced assets. Site lint had zero errors and 266 existing warnings.
  Vercel then completed the website build but looked for `routes-manifest.json`
  inside `out`. Its Next builder expects the Next `distDir`, so the override now
  points to `.next`; the export manifest there identifies `out` as the static
  output. Local three-worker builds passed with both the existing 16 GiB heap
  setting and a temporary 2 GiB limit; neither reproduced the Cloudflare stall.
  Those diagnostic settings were reverted. Site lint was rerun with zero errors
  and the same 266 warnings. Vercel at `4b8eb7f0b` reached Ready and ran
  postbuild successfully, but only the locale-prefixed compose page returned
  HTTP 200; the root copy returned 404. Its Next packaging omits postbuild root
  copies. The branch now selects static hosting of the completed `out` directory
  with clean URLs. Local postbuild and all 95 asset checks pass; 2,468 root
  locale files and the homepage match the locale exports byte for byte. Vercel
  at `60830b88a` returns HTTP 200 for the root compose reference, its Traditional
  Chinese variant and directive guide; Chrome rendering and client navigation
  pass without new console errors. Cloudflare and Linux e2e also pass at that
  revision. Preview metadata also pointed canonical
  URLs at localhost. Public environment resolution now reads Vercel deployment
  and branch variables; 16 environment tests, focused lint and site type-check
  pass. Full site lint again has zero errors and the same 266 warnings.
- Windows at `4b8eb7f0b` exposed an ESLint CRLF autofix regression (295/296
  passed). The JavaScript adapter now restores template line endings and escapes
  cooked carriage returns. LF, CRLF and CR sorting regressions failed before
  the fix and pass afterward; escaped CR keeps its cooked value. Local ESLint
  tests passed 299/299, followed by 42/42 focused tests after the escaped-CR
  addition; lint, type-check and build passed.
- Compiler output maps now convert absolute paths with `pathToFileURL`, avoiding
  Windows drive URL schemes and fragment/percent corruption. The new filename
  regressions failed before the fix; all 24 focused map/preparation tests, lint,
  type-check and build passed. Next's loader assertion normalizes separators
  (15/15 focused tests); Astro and Svelte harnesses invoke Node entrypoints and
  consume prebuilt packages (16/16 and 17/17 tests). Each package lint passed.
  Another 18 related graph/source-ownership tests passed after the map fix.
  Windows at `60830b88a` passes Webpack 93/93 and CLI 89/89, while Compiler
  reports 34 failures: 15 expose Windows verbatim prefixes entering source-glob
  matching; 19 use nonportable fixture paths or URL callbacks. Rust now removes
  filesystem prefixes before glob matching (red/green regression, 18 Rust tests
  and Clippy pass). Compiler fixtures use canonical roots, native path helpers
  and file URLs without changing CSS, source positions or dependency coverage;
  56 focused tests, lint/type-check and 17 rebuilt-native project tests pass.
  The directive contract documents Windows path handling; generation and all
  20 Reference tests pass; site lint has no errors and 266 existing warnings.
  Windows Turbo now continues tasks whose dependencies succeeded so one failure
  does not discard unrelated failure details; task failures still fail the job.
- Eight cases have reviewed `verified-superset` evidence: lint/workspace checks,
  three hydration assertions, the portable stylesheet path and two Manifest
  input-only updates. Facade tests (2/2) and runtime type-check pass; expectations remain;
  their evidence remains separate from the newly approved contract records.
- Windows Next reports 21 failures: canonical fixture roots and native path
  assertions account for harness differences; equivalent `~`/`%7E` Sass URLs
  exposed incorrect additional-data offsets. File-URL identity now compares
  decoded paths while retaining query/fragment distinctions. Real Sass red/green
  regressions, 38 focused tests plus the final 8-case rerun, lint/type-check/build,
  10 e2e cases and the playground build pass. The playground script could not
  find its local `next` shim; invoking the installed parent Next entrypoint passes.
- MCP's Windows new-file race check exposed inconsistent identity before/after
  creation through a directory alias. Resolve missing files against the already
  validated canonical parent. The new alias regression fails before the fix;
  all 51 MCP tests and lint/type-check/build pass. Containment checks remain.
  The full Windows run at `60830b88a` is still collecting independent results.

The source audit PASS does not override these integration failures. Do not close
#454 or #445 until the review-bound ledger and applicable CI gates are resolved.

The unmodified Playwright Firefox launcher on this macOS host exits before tests
start with `Could not find profile folder`. Firefox 144/144 and both progressive
examples passed using a temporary local wrapper that supplied an isolated
application-data path to the same cached Playwright Firefox binary. The wrapper
changed only browser launch, not test assertions or timeouts; it is not a
repository configuration or a product fix. Ordinary Firefox launches on this
host still need an environment-level repair. The temporary runner file must be
removed from the committed change.

The first full Chromium/WebKit run had one iframe initialization timeout during
parallel example builds. The iframe suite passed three isolated repetitions
(9/9), then the full suite passed 288/288 after package builds completed. No test
timeout or assertion was weakened. Concurrent artifact changes are a possible
cause, not a proven diagnosis. The earlier missing site-export blocker is resolved.

No package was published and no version, release workflow, or lockfile was
changed. Shared build, validation CI and preview configuration repairs were authorized. Domain issues should close only after their acceptance evidence is
integrated and linked; this report alone does not merge the code.

## Issue State And Remaining Work

- #446–#452: local source, compiler, browser and integration acceptance evidence
  has passed; code integration and issue closure are pending.
- #453: directive, inspection, layer, Manifest, current ABI and integration
  guidance are corrected; public examples, migration exports and Reference
  checks passed locally.
- #454: local source-freeze assessment is PASS with the explicit environment and
  release-certification limits above; integration is pending.
- #455–#456: a type-checked, executed public workflow and a separate 2.x RFC
  define current capabilities, gaps and non-goals. Follow-up issues #457–#460
  now track the individual proposals. They do not ship an editable IR or commit
  to a new extension ABI.

Open issues distinguish local acceptance evidence from code integration and
release certification. The pull request and each issue should link this report
before closure.
