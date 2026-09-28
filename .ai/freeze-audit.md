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
| Complete removal of `@compose` | Integrated from `9d9817241`; reject the directive and retain native declaration ordering | #448, #453 |
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

1. **Contract bookkeeping:** the initial audit corrected the census from 12 to
   the then-current ABI 13. The later authorized compose-removal integration
   advances ABI to 14, diagnostics report to 4 and lint batch to 2. Manifest v1
   and language v3 remain unchanged; generated protocol and census agree.
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
9. **Directive removal integration:** the user requested integration of the
   complete `@compose` removal committed in `9d9817241`. Compiler, lint, language,
   CLI and MCP no longer expand or fix this directive. Public native/Wasm tests
   now preserve duplicate fallbacks with explicit declarations in static, raw,
   token and enum utilities, and reject fixed and dynamic compose targets.
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
14. **Migration ABI wording:** the initial audit corrected obsolete ABI 8 prose
    to 13. Incoming removal documentation now records ABI 14 and the deleted
    directive APIs; historical behavior is not described as current support.

### Directive Review (#448)

| Contract | Source / behavior evidence | Public documentation |
| --- | --- | --- |
| Global definition positions; rule-local variants and removed compose rejection | compiler `directives.rs`, `bug-hunt-directive-positions.test.ts`, `bug-hunt-ordered-direct-output.test.ts` | directives: Definition scope and imports; Removed utility composition |
| Replacement, empty definitions, ambiguity and source locations | Rust `utility_definition_contract`, engine `utility_entry_resolution` | directives: Whole-definition replacement; Named token patterns |
| Import/reference scope, graph ordering, reference cycles | project `bug_hunt_manifest_graphs`, compiler `bug-hunt-reference-source-maps.test.ts` | directives: Reference context; Stylesheet boundaries and resource URLs |
| Duplicate declarations, removed compose rejection, native token streams | Rust `removed_compose`, `utility_definition_contract`; compiler `tests/issues/448.test.ts` | directives: Removed utility composition; Native CSS preservation |
| Removed typed raw matchers and managed layer directives | Rust `removed_pattern_forms_and_duplicate_enum_keys_fail`, `removed_managed_directives_are_diagnosed` | directives: Dynamic values; Native defaults/components |

## Validation Evidence Before Compose Removal

These results establish the pre-integration freeze branch. Combined-version
validation is tracked separately below; prior results are not carried forward
as proof of unchanged behavior.

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

## Freeze Integration Status

The user approved all outstanding reviewed differences on 2026-09-28. Commit
`0509284e3` records the last 192 exact case decisions and the generated ledgers.
Before compose integration, `check:migration` passed: 1,546 rc.87 cases, 1,033
Rust-refactor cases, seven post-rc.87 files; all 503 changed cases approved,
503 exact and 27 supersets. Earlier approval documents remain historical evidence.

[CI at `0a81364e5`](https://github.com/master-co/css/actions/runs/36344836324)
completed with Windows package validation 59/59 tasks and examples 36/36 tasks,
Linux e2e 34/34 tasks (432 runtime and 10 Next cases), Rust quality and all eight
native target jobs passing. Linux quality failed only the then-unapproved
192-case migration gate, skipping its later quality checks. The local approval
checkpoint resolves that earlier gate; it does not certify the combined branch.

Earlier Windows repairs retained by this merge include canonical path identity,
file-URL source mapping, watcher/recovery assertions, portable process handling,
CRLF autofix preservation and immutable Next output bypass. VSCode's completion
request allows 30 seconds for cold indexing while initialization/shutdown retain
five seconds; Windows now passes all 33 tests with unchanged assertions.

The successful pre-integration previews are
[Vercel](https://master-mbyqnrl4l-aoyue.vercel.app) and
[Cloudflare](https://b856d7d4.master-css-e8w.pages.dev). Root/TW compose reference
and legacy guide routes returned HTTP 200 with expected canonicals; Cloudflare
health returned `{"ok":true}`. These precede the new removal documentation and
must be checked again on the integrated deployment. No storage writes were tested.

### Compose Removal Integration

The user asked whether to merge the result of chat
`01a0e0b3-2b97-7bc1-9890-8a328f97f201` before finishing the freeze. Both dry-run
merge directions had the same 11 content-conflict paths. Incoming commit
`9d9817241bede3f4cf8b542e5e59380ffa0d9272` is merged into the freeze branch first
so the final contract and CI are verified together before PR #461 joins `rust`.
No primary-checkout changes or package publication are part of this integration.

Conflict resolutions retain new native/theme/variant fixtures and removal
error codes/ranges together with existing Windows normalization and recovery
assertions. The obsolete positive compose ordering case is removed as upstream
intended. The freeze-added issue #448 regression uses native declarations and
checks compose rejection in both bindings; the 2.x roadmap no longer promises
compose traces or composition-aware edits. Generic stylesheet composition APIs
and engine composition rules remain separate, supported concepts.

Combined-version native/Wasm and 32 package build tasks pass. Conflict-focused
checks pass: Vite 153, Next 6, compiler migration/ordering 19 and issue #448 four,
Rust removal four. Full Rust fmt, Clippy, workspace tests, codegen and parity pass.
The complete package test/lint/type-check run passed 110/111 tasks; its four
obsolete VSCode grammar expectations were corrected, and the scoped rerun passes
36/36 tasks including all 34 VSCode tests. The Wasm smoke fixture also needed nine
lint version fields (1 to 2) and two inspection fields (3 to 4) updated; all four
smoke tests pass. Public API golden/census now remove five retired Compose types.
Package contracts, boundaries, census and AI context checks pass. Site example,
Reference and LLM-export tests pass 17 + 20 + 32; site lint/type-check pass
with zero errors and 265 existing warnings. The final stale Compose ordering
paragraph in the cascade guide is corrected; focused lint and all 20 Reference
tests pass again. Site highlight tests pass 11/11 with React server conditions.
Focused runtime Chromium/WebKit tests pass 16/16; package artifacts (788), runtime
size, MDN registry and release-configuration checks also pass.

The integration review records 102 affected historical cases: 76 changed/renamed
executable cases and 26 explicit retirements. All 1,033 baseline cases remain in
the denominator; 494 are approved changes, 488 exact, 25 supersets and 26 approved
removals. The 21 Manifest test digests remain unchanged; four containing test-file
hashes change. See `parity/compose-removal-integration-review.md` for source trees,
old/new digests, removed API rationale and the authorized integration provenance.
Six migration-gate tests verify rename/removal identity, approval and absence.
No earlier approval digest is silently repurposed for new bytes. Rebuilt runtime
JS remains 48,219 raw bytes; engine Wasm is 1,044,424 and the preset JSON 90,403.
These separate artifacts total 1,183,046 raw bytes; this is an observation, not
a new combined transport budget. The existing runtime JS size gate passes.

Generated-ledger validation passes at merged source `e231a700e`: 1,546 rc.87
cases, 1,033 Rust-refactor cases and seven post-rc.87 files. Combined-branch CI
and refreshed previews are still required. Do not close #454 or #445 before those gates pass.

Integrated CI run `36373117361` exposed a clean-checkout TypeScript resolution
failure hidden by local build artifacts: the compiler project entry and private
project helper did not map to their source files. Explicit project/project-sync
and internal source paths fix the reproduced failure. All workspace type-check
references pass with compiler/internal `dist` temporarily absent; root build and
type-check pass 32/32 and 40/40 tasks. The corrected paths also exposed an inferred
private type in Next's declaration output. Its entry-graph return type now uses
the existing public compiler option type; all 788 published artifact checks pass.
This changes build-time type resolution only, without changing emitted CSS or
runtime execution. All 206 Next tests and Next/compiler/internal lint checks pass. The run's Linux
E2E and eight native platform jobs pass; Windows compatibility is still running.

Run `36374490996` passed the compiler checks and exposed the same missing-root-link
problem for ESLint Config's plugin import. Its source alias now points directly
to the workspace entry. A broader clean-source check reproduces that failure
with all 27 package `dist` directories absent; the other errors are Webpack tests
that intentionally import their built artifact. With only that required Webpack
artifact retained, all workspace references pass without the other 26 `dist`
directories. Root build passes 32/32 tasks, package artifacts 788/788, ESLint
Config tests 4/4 and plugin tests 284/284; both packages' lint checks pass.
Migration cases and approvals are unchanged. The run also passes Linux E2E,
Rust quality and all eight native targets; final Windows and Linux quality
validation must finish before integration.

The Windows package step in that run timed out waiting for a Webpack watch
callback after attaching two sheets. The previous run instead timed out during
CLI initial readiness. Both retain bounded assertions and pass locally. Four
concurrent Turbo tasks, each allowing a half-CPU Vitest pool, oversubscribe the
runner; Windows test-task concurrency is reduced to two without changing product
code, test deadlines or assertions. This is a resource-contention correction;
the next complete Windows result is required before claiming it resolves the
observed timeouts.

At `5ee8e180e`, Linux E2E passes 432 runtime cases, 10 Next cases and all 34
tasks. Linux quality advances past both source-alias failures, then under its
default 10-task concurrency multiple bounded CLI watch waits expire (97/110
tasks had passed). Linux package validation is likewise limited to two tasks,
matching the shared half-CPU worker policy. No test is removed, skipped, retried
automatically or given a longer deadline. The complete local package validation
with two task slots passes 111/111 tasks (32 build tasks cached); all package
test/lint/type-check tasks pass, including 678 Vite cases. Windows CLI passes
87/87 at `5ee8e180e`; the remaining Windows and corrected Linux gates are pending.

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

- #446–#452: prior acceptance evidence passed; compose-removal integration is
  being validated before final acceptance and issue closure.
- #453: directive, inspection, layer, Manifest, current ABI and integration
  guidance are corrected; public examples, migration exports and Reference
  checks passed locally.
- #454: prior source-freeze assessment passed; the combined branch remains
  under validation, with the environment and release-certification limits above.
- #455–#456: a type-checked, executed public workflow and a separate 2.x RFC
  define current capabilities, gaps and non-goals. Follow-up issues #457–#460
  now track the individual proposals. They do not ship an editable IR or commit
  to a new extension ABI.

Open issues distinguish local acceptance evidence from code integration and
release certification. The pull request and each issue should link this report
before closure.
