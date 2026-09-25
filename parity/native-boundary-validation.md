# Master CSS 2.0 native boundary validation

Implementation baseline: `f771c70f76459165de45d899a71bdba54d5deac0`.
The working tree was clean when saved. Earlier installation-guide, `@start`
removal and asset cleanup changes are part of that baseline and remain intact.
This record covers the user's approved native-boundary and deterministic-build
plan. It does not certify every historical RC or announce a release.

## Delivered contracts

- Native stylesheet, theme and custom-property token streams bypass class value
  decoding. `--alpha()` has no compiler macro meaning; official callers use
  native `color-mix()`. Managed `--value()` substitution remains scoped.
- Class queries accept the documented simple subset. Complex queries produce
  `MASTER_QUERY_REQUIRES_CSS`, with an authored CSS variant route. Native CSS,
  variants and modes retain full queries and their original whitespace.
- Selector transformation uses Rust tokens. Mode selector lists activate every
  branch's element and descendants. Literal/escaped ampersands remain literal.
- Condition priority separates wrappers from ranges, units, inclusive bounds
  and domains. Equivalent media queries respect token-before-direct-value order.
  Hydration requires the new range fields rather than guessing old priorities.
- Syntax, value, Master matching and browser support are separate statuses.
  `validation: 'report' | 'error'` replaces `cssValuePolicy`; strict failures do
  not commit staged stylesheet/scanner state. Diagnostics map to authored input.
- Rust owns source replacement, empty updates, removals, owner snapshots and
  shared class references. Node adapters stage successful ancestry and reject
  stale asynchronous completions. Candidate collection does not insert rules.
- Markdown/MDX AST extraction excludes prose, fences and inline code; embedded
  HTML/JSX/ESM and expressions are scanned. Live fragments carry parent sources.
  Scanner static-string extraction remains broader than editor class contexts.
  Parse failures preserve successful state and report `SOURCE_PARSE_ERROR`.
- Node source policy uses project/workspace `.gitignore`, explicit exclusions
  and actual output directories. `markdown` and `ignore` remain tooling-only.
- Next serializes RegExp source/flags, fingerprints configuration and manifest,
  and reconciles complete snapshots under a process lock. Changed inputs retry;
  assets precede the entry, unchanged bytes preserve mtimes, failures preserve
  the last complete development output and reject production publication.
- MCP v3 uses a required result union inside a fixed object, fully described
  success payloads, actual context metadata and identical JSON/structured data.
  Errors set `isError`; project failures do not become preset answers.
- Migration adds `rc-native` alongside `rc-legacy` and `rc-named`, stable query
  variant names, entry selection and batch write guards. Imported stylesheets
  are read-only context when checking native `@function --alpha` collisions.
- ABI 10, source 2, validator 3, language 4, diagnostics 3 and MCP 3 are rebuilt
  through existing codegen. Manifest/hydration envelopes remain v1/language v2.

## Executable evidence

Primary new/expanded cases live in:

- `crates/mastercss-engine/src/tests/native_boundaries.rs`,
  `tests/condition_ranges.rs` and `tests/condition_selector_literals.rs`.
- `crates/mastercss-scanner/src/tests.rs`, `tests/source_cache.rs`,
  `crates/mastercss-source/src/extraction.rs` and
  `crates/mastercss-language/tests/markdown_sources.rs`.
- `crates/mastercss-compiler/tests/rc_native_migration.rs`,
  `packages/cli/tests/migrate.test.ts` and compiler diagnostics/stylesheet tests.
- `packages/tooling/tests/scanner/bug-hunt-source-result.test.ts`,
  `source-policy.test.ts`, source range/entity tests and value-validation tests.
- `packages/next/tests/static-snapshot.test.ts` and `static-state.test.ts`:
  independent workers, missing outputs, rename/delete, failures, regex transport,
  custom output directories and edits during publication.
- `packages/mcp/tests/output-schema.test.ts`: actual `tools/list` schemas compiled
  by AJV, success/error negative cases and exact transport equivalence.
- `packages/runtime/e2e/native-boundaries.test.ts`: native streams, literal `&`,
  mode lists and equivalent-query computed style across rendering modes.

`parity/v2-tooling-workflows.json` supplies the shared CLI/editor/MCP workflow
fixtures. Its latest trace records ABI, language, context, manifest fingerprint,
dependencies and diagnostics. Historical `rust-semantic-corpus.json` and existing
migration approvals were not rewritten. No model comparison was run, and no
claim of improved AI generation accuracy is made.

## Validation executed

- `pnpm run check:rust`: 462 passing Rust tests/doc tests, denied-warning clippy, fmt, codegen
  check and native/Wasm semantic parity passed after the final Rust changes.
- All 32 workspace package build tasks passed. The affected build/lint/type
  validation passed 49 tasks; subsequent scanner, CLI and Wasm-test edits were
  validated again with their package lint/type-check scripts.
- Package suites passed: compiler 448, tooling 259, language service 384, ESLint
  296, MCP 48, CLI 81, server 67, engine wrapper 76, binding 29, isolated tooling
  Wasm 4, Next 162 and Webpack 88. Later focused runs add source ancestry and
  imported native-function regressions; scanner/value checks 123 and migration
  checks 9 passed. Newly added Next independent-worker snapshot cases passed.
- Chromium/WebKit runtime matrix: 256 passed. Firefox fails before executing
  fixtures: its Playwright binary reports `Could not find profile folder`, even
  after reinstalling and trying a separate profile/cache directory.
- Site: `prepare-app` generated 282 pages; documentation examples 14, reference
  20 and v2 RC integration 3 passed. Type-check, lint (0 errors, 178 warnings),
  clean and warm production builds, static postprocessing and 95 public asset
  checks passed. CSS contract verifies 1,240 routes, 141 delivery contracts,
  1,863 rules and 3,708 segments. Generated rule CSS is unchanged when compared
  by `(className, key)`; new priority metadata and native whitespace account for
  the intentional snapshot update. See `site/tests/native-boundary-qa.md`.
- The migration entrance, guide and back links were checked in Chromium and
  WebKit at 1440px and 390px without horizontal overflow; screenshots inspected.
  The final link-click navigation run has no page errors in all four cases.
- Vite's final full run passed 668/669 cases; the remaining case failed during
  server startup with `No available ephemeral port found`. Rerunning that file
  passed all 26 cases. Earlier watch checks exposed queued-build timing and a
  test waiting for requests after server closure; the tests now wait for actual
  output and drain requests before closure. Their final full-run cases passed.
- API census, package contracts, package boundaries, artifact audit, MDN registry,
  runtime JS size and release configuration checks passed. AI context/source
  budget and whitespace checks passed after the final documentation changes.

## Paired measurements

Local macOS arm64, Apple M3 Max, Node 24.20.0. The baseline was archived and rebuilt
from the exact HEAD above. Both N-API libraries use release builds. Measurements
include binding serialization, not just Rust execution. Other build/test work
was idle during the paired native runs; ordinary desktop activity still exists.

Reproduction entry points:

```sh
node --expose-gc scripts/benchmark-native-boundaries.mjs BEFORE_ROOT AFTER_ROOT OUTPUT.json
node scripts/benchmark-native-hosts.mjs BEFORE_ROOT AFTER_ROOT OUTPUT.json
```

The native harness alternates revisions for 45 rounds, discarding 10 warmups.
The workload includes 242 classes and 1/8/32 mode branches. The final native
retest gives the following median times; a prior post-optimization run confirms
the direction of the regressions.

| Operation, ms | HEAD | New contract |
| --- | ---: | ---: |
| Engine creation | 16.358 | 16.357 |
| Generate 242 classes | 1.985 | 2.005 |
| Cached 242 classes | 0.0232 | 0.0230 |
| Delete/reinsert 242 | 2.080 | 2.118 |
| Generate with 8 mode branches | 4.688 | 5.110 |
| Generate with 32 mode branches | 23.906 | 25.328 |
| First scanner input | 4.290 | 5.785 |
| Cached scanner input | 0.00367 | 0.02212 |
| Replace scanner input | 0.01808 | 0.27258 |
| Clear scanner input | 0.00175 | 0.00517 |

The scanner's repeated parsing was removed after the first measurement; its
new extraction cache still reapplies candidate policy and distinguishes host
supplied candidates. Cached results now return the full candidate projection,
which the previous Rust fast path omitted. First scanning includes AST ranges
and provenance. Replacement/clearing now withdraw rules and resources; the old
implementation left 1,001 valid classes after clearing 1,000 sources, versus zero
now. These workloads perform different required work, so their larger ratios
are not presented as like-for-like speed losses. RSS deltas were about 5.18 MB
before and 4.70 MB after in one run; they are allocator observations, not a memory
improvement claim.

Mode branch generation increased 6–9% on retest. The new path tokenizes selector
composition, carries explicit bound/domain structures and serializes additional
priority fields. This is source-based attribution, not a CPU-profile breakdown;
the extra cost is retained for correct literal selectors and condition ordering.

| Runtime payload, bytes | Raw before → after | Gzip before → after | Brotli before → after |
| --- | ---: | ---: | ---: |
| Global JS | 48,110 → 48,219 | 13,318 → 13,348 | 12,001 → 12,034 |
| Engine Wasm | 978,817 → 1,007,509 | 304,410 → 315,309 | 232,577 → 240,271 |
| Preset manifest | 92,623 → 92,623 | 13,278 → 13,278 | 10,399 → 10,399 |
| Hydration, 242 classes | 68,057 → 72,672 | 5,102 → 5,102 | 2,374 → 2,378 |
| Total | 1,187,607 → 1,221,023 | 336,108 → 347,037 | 257,351 → 265,082 |

Assets are compressed individually with Node's default gzip/Brotli settings.
The aggregate increases 3.25% gzip and 3.00% Brotli. The new Markdown and ignore
dependencies are absent from the runtime engine artifact dependency path.

The Chromium harness measures local HTTP delivery, runtime readiness, the next
styled frame, hydration and a DOM class mutation for 120 elements. It records
actual requests. These are local scheduled browser observations, not laboratory
FCP. The first completed paired run measured startup 52.5→52.7ms, hydration
51.4→52.1ms, class update 18.7→18.8ms and sampled styled frame 66.8→66.7ms.
The second completed run measured 54.9→55.6ms, 54.4→54.7ms, 19.0→18.9ms and
67.1→67.1ms respectively. These small differences do not establish a speed gain.

Next's 100-TSX-source fixture measured cold setup 115.7→238.3ms, unchanged module
0.71→163.81ms and edited module 84.74→163.73ms. The new publisher locks, reads a
complete source/dependency snapshot, registers stylesheets and checks the inputs
again before publication. The old incremental path could skip that work while
retaining stale contributions. This is a substantial remaining performance cost;
it must not be described as passing the 5% threshold.
The second run confirms the result: cold setup 127.3→251.2ms, unchanged module
0.89→176.41ms and edited module 94.35→173.96ms. A future optimization must reuse
validated work while retaining the lock, complete-input comparison, changed-input
retry and assets-before-entry guarantees; skipping those checks is not a fix.

## Logs and remaining release gates

The execution artifacts are saved outside the repository at
`/tmp/master-css-native-boundary-baseline/`: original status/patch/manifest/CSS,
HEAD archive, `rust-complete-final.log`, package/site logs, screenshots,
`ai-tool-workflows.json`, `performance-pair-{2,3}.json` and
`host-performance-pair-{2,3}.json`. Benchmark history is not added to source control.

Release is not certified by this change:

1. Firefox's environment launch failure leaves that browser matrix unvalidated.
2. `check:migration` fails on pre-existing Rust contract evidence
   `rc87-38e614a90e947c6e` (saved target digest `5edf…`, current `e83c…`). The exact
   archived HEAD reproduces the same failure. Historical review metadata remains
   intact; this work does not manufacture a replacement approval.
3. Next full-snapshot cost remains above the performance threshold; it needs
   optimization or an explicit release tradeoff using these paired measurements.
