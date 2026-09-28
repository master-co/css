# Naming, theme delivery and sizing removal validation

Implementation baseline: `2079d665a` (2026-09-25). The worktree was clean at capture. The saved source archive, release native binding, preset, representative CSS/hydration/computed styles and original runtime assets are in `/tmp/master-resolution-sizing-baseline-20260925-221632`. The baseline preset reproduced from that archive has the same SHA-256, `0e070a1a24d0c347eb9129a98e9249a8cb1729258125ffa556c4d145561c7127`.

## Intentional changes

- Static and raw matcher aliases acquire individual entries before whole-definition replacement. An override does not remove an untouched alias; empty definitions remain registered. Token ambiguity follows definition identity, not current emitted values. Same-family definitions in separate layers retain both outputs.
- Bare `flex` and `grid` remain static display utilities. Their colon forms are native declarations; completion now exposes that entry. Use `display:flex:hover` for the display state.
- Tooling checks known CSS math types and property context without computing values or converting units. Compound intermediate dimensions can cancel. Known incompatible operands are errors even beside an independent unknown operand. Unresolved substitutions and capabilities stay unknown; emission policy is unchanged.
- `generatedGlobals: 'separate'` returns compiler-generated resources outside local stylesheet code. Next Webpack Modules deliver them as ordinary global CSS, preserving root/mode selectors and inheritance. Equal resolved global resources share a content-addressed entry. URL resources, dependency tracking, source-map availability and atomic publication follow the existing delivery graph. No new Turbopack Module-directive capability is claimed.
- The six preset size/min-size/max-size raw/token definitions and the dangling `min`/`max` paired-dimension aliases are removed. Logical axis aliases remain. Native fallback is preserved: WebKit currently gives native `size:99px` a dimensional effect, so “no Master expansion” must not be described as “no browser effect.” Custom same-name definitions and native page descriptors remain available.
- `rc-sizing` is the sixth migration profile. All profiles run the shared sizing stage; transformations compare declarations, selectors, conditions and resource identity. Dimension competition requires review. A custom same-name definition is never identified by spelling alone; migration-only historical `min`/`max` aliases never override explicitly registered project entries. ABI is 13; manifest/hydration envelope 1 and language version 3 are unchanged.
- Project loading now exposes immutable `nativeClassNames` to tooling sessions. The CLI, MCP and editor suppress retired-utility advice for explicitly registered ordinary CSS classes; this is tooling context, not a runtime manifest field. Reloading the project refreshes these registrations.
- Official Master examples and recommendations use explicit dimensions. Retired reference URLs and anchors remain as removal notices. Tailwind-only Laravel scaffolding and historical/custom-author examples are intentionally retained.

## Checks

Logs are under `/tmp/sizing-*.log`; key reproducible entry points are below.

| Surface | Result |
| --- | --- |
| Rust engine/compiler/language suites | All targets pass after correcting the historical size-helper mapping; the formerly failing RC migration target reran with 13 passing cases, plus 5 new sizing migration tests covering all six profiles |
| Rust fmt, scoped clippy, codegen check, `cargo xtask parity` | Pass |
| Native and all Wasm artifacts | Rebuilt; binding provider suites pass; three added native/Wasm comparison cases cover normalization, equal-value ambiguity and `rc-sizing` decisions |
| Preset | 39 tests pass; generated manifest has 164 definitions |
| Tooling/compiler/CLI | Full runs: 318 / 456 / 84 tests pass; subsequent math and compiler regression checks pass (30 math cases, 7 compiler cases) |
| Language service | 385 tests pass, including unambiguous native/static completion |
| Language server | 43 tests pass, including native class registration refresh |
| MCP | 50 tests pass, including actual output schemas, JSON/structuredContent equality, ABI metadata and new inspection decisions |
| Next | 197 unit tests; three real production builds (ordinary CSS with both bundlers, Modules with Webpack, including client navigation between two distinct Module routes); two ordinary HMR cases; one additional Module token HMR/inheritance case pass |
| Runtime browsers | 272 existing Chromium/WebKit cases plus 8 new static/SSR/runtime/progressive, hydration and DOM-update cases pass; Firefox is blocked before page creation (see below) |
| Site | Production build: 830 pages and 95 verified assets; 20 reference tests, document examples and 3 RC-guide tests pass; type-check passes; lint has 0 errors and 266 warnings |
| Browser docs review | Migration entry, RC guide, retired size page and sizing guide checked at 1440px/390px; no page errors or horizontal overflow; screenshots reviewed |
| Package checks | Changed package lint/type-check/build pass; examples lit/vite/webpack build. These three example packages define no lint script. Next playground build passes using the installed parent Next binary; its direct pnpm script cannot locate its own `next` executable |
| AI/source structure | `pnpm run check:ai-context` passes |

A concurrent Next lint attempt saw a temporary HMR fixture and failed on its generated JSX. The fixture was cleaned normally; the subsequent complete Next lint passes. This is not recorded as a product regression or bypassed by weakening lint.

## Performance and payload

The native engine comparisons alternate before/after release artifacts over 45 rounds (10 warmup), using identical 245-class workloads without removed utilities. Two runs are recorded in `sizing-performance-{1,2}.json`. Engine creation, matching, generation, cache hits, delete/reinsert and mode branch medians remain within 5%. The CSS and hydration for that common workload are unchanged.

Combined runtime JS + engine Wasm + runtime manifest + representative hydration:

| Format | Baseline | Current | Change |
| --- | ---: | ---: | ---: |
| Raw | 1,256,307 | 1,258,146 | +0.15% |
| gzip | 355,276 | 356,522 | +0.35% |
| Brotli | 271,761 | 272,275 | +0.19% |

JavaScript is unchanged at 48,219 raw bytes. Wasm grows by 2,962 raw bytes; the preset manifest shrinks by 1,123. No tooling math validator is added to the runtime.

The original sequential compiler measurement was noisy and exceeded 5% on some samples. `benchmark-utility-compiler.mjs` now alternates both versions for each workload. Both repeated paired runs at 100/1,000/5,000 definitions show parse/lower median differences within 5% (`sizing-compiler-paired-{1,2}.json`). Neither measurement justifies a performance improvement claim.

The sizing migration workload deliberately measures the syntax change separately. Six independent examples remain six HTML classes when grouped, but generate 12 rules instead of 6. Markup grows from 69 to 169 bytes; generated CSS gzip from 210 to 245; hydration gzip from 431 to 605. Repeating this deterministic measurement produces identical output (`sizing-migration-payload.json`). The cause is two independently represented dimension declarations plus longer selectors and hydration records. This is a documented cost of explicit dimensions, not a claimed optimization; competing declarations still require migration review.

Next full-source verification remains enabled. Current 100/1,000/5,000-source measurements are in `sizing-next-static.json`. Unchanged sources do no stylesheet registration or composition; edits and ten-notification bursts both perform two publication compositions and four TSX reads per source. Current HMR runs are in `sizing-next-hmr.json`; their idle windows contain zero extra compositions. The isolated baseline rebuilt from the saved archive uses the saved ABI 12 release binding and byte-identical original preset (`sizing-next-static-before.json`). Relative median differences across all nine source-count/update combinations are within 3%; read/composition counts are unchanged. The real HMR comparison uses the same explicit Turbopack filesystem root on both versions because its hermetic resolver otherwise rejects the archived workspace’s existing dependency symlinks.

Two additional paired Module-loader runs exposed redundant recompilation: the initial implementation took 160–167 ms versus the former 73–78 ms. Reusing the already prepared generated globals for the revision-publication pass removes one of three transforms. The final repeated measurements are 122–126 ms versus 73–77 ms (`sizing-next-module-final-{1,2}.json`). The remaining roughly 49 ms is the extra compiler delivery context and complete global asset/dependency publication needed to retain root semantics and resource URLs. The earlier implementation incorrectly put root variables on each component. This is an explicit correctness cost for Modules that generate globals; Modules with no generated globals retain the ordinary local path. Reuse is scoped to one publication operation, not a stale cross-build cache.

The repeated actual HMR comparison is in `sizing-next-hmr-paired.json`. With identical fixture/root settings and other builds idle, Turbopack single-edit medians were 1,316/1,416 ms before and 1,315/1,317 ms after; burst medians were 1,400/1,284 ms before and 1,699/1,750 ms after. Webpack single edits were 1,083/1,183 → 1,133/1,233 ms; bursts 1,234/1,167 → 1,252/1,233 ms. These are three measured browser updates per run, not enough to infer a stable percent regression from a single median.

The >5% cases were repeated and attributed at the publication level: each edit still composes exactly twice, idle windows compose zero times, and the higher Turbopack burst time coincided with more read-only publication/snapshot checks. One measured burst has 43 lock acquisitions/1,618 ms total lock hold versus a baseline burst with 31 acquisitions/1,148 ms. Those counts were not raw Turbopack notifications, and their difference alone did not identify a cause. Full verification remained enabled. The follow-up below resolves this performance acceptance gap.

### Turbopack HMR follow-up (2026-09-26)

A test-only loader trace identified the repeated work: Turbopack compiles each edited JS module in several worker contexts, and the old static source loader started a full publication check in each invocation. In the paired fixture, ten edited modules caused a median 36 source-loader invocations and 74 complete snapshots, even though the CSS output changed once. The broad local CSS rule also reprocessed generated `next-style-*.css` assets. Removing Turbopack's pass-through JS source rules, assigning complete source/directory watches to the CSS entry and directly imported `.master/next.css`, and excluding generated static assets from the local stylesheet rule removes both sources of redundant work. Webpack retains its early source publication path. The snapshot, digest, retry, lock and atomic publication checks are unchanged.

Five alternating pairs compared the clean task-start HEAD `1193b8ac2` with the optimized integration, using the same Next 16.3.4, Node 24.20.0, fixture and explicit Turbopack root `/`. Each run had one warmup and three measured browser updates. Across 15 samples per version, Turbopack single-edit median fell from 2,117 to 552 ms and ten-file burst median from 2,217 to 549 ms. Median traced loader calls fell from 47/55 to 4/4, lock acquisitions from 28/36 to 4/4, and complete snapshots from 58/74 to 10/10 for single/burst; every measured edit published `next.css` once. No full reload occurred. The test-only trace changes absolute timing, so these are paired fixture results, not general application latency claims. One separate Webpack pair against the same task-start HEAD showed comparable single/burst medians (2,882/2,884 ms before and 2,868/2,850 ms after). Browser coverage includes edits and addition/deletion of an unimported source with a direct generated CSS import. These measurements resolve the earlier Turbopack burst acceptance gap; they do not reinterpret the older `2079d665a` comparison as proof of more raw bundler notifications.

Reproduce the main comparisons with the saved release artifacts:

```sh
node --expose-gc scripts/benchmark-utility-contract.mjs BASELINE_DIR OUTPUT.json BASELINE_DIR/current-release.node
node scripts/benchmark-utility-compiler.mjs BASELINE_DIR/mastercss.node BASELINE_DIR/current-release.node OUTPUT.json
node scripts/benchmark-sizing-migration.mjs BASELINE_DIR OUTPUT.json
node scripts/benchmark-next-module-globals.mjs OLD_LOADER NEW_LOADER OUTPUT.json
MASTER_NEXT_BENCH_ROUNDS=10 node scripts/benchmark-next-static.mjs PATH_TO_NEXT_DIST/static.js OUTPUT.json
```

## Historical evidence review

The read-only audit compares the frozen Rust refactor contract (`bd164e4b5ae3a713940913d745183e9ab6b54263`) with implementation HEAD, preserving non-enumerable test contract digests. Before corrections, the 1,033 historical cases classify as 503 exact, 19 approved changes, 5 verified supersets, 244 changed without proof, 256 removed/unmapped, 4 stale records and 2 ambiguous mappings. Counts are evidence status, not a claim of 506 product defects. See `sizing-history-audit.json`; the original full inventory is retained at `/tmp/sizing-history-audit.json`.

Four stale records were individually read and tested before updating their target digest and explanation:

1. `rc87-886095b27074cf6c`: packaged Wasm loading, matched inspection, one mutation, exact CSS, disposal and explicit variable resource emission remain asserted; fixture language version is now 3.
2. `rc87-534a5dbe18105a92`: the renamed test explicitly preserves declarations rejected by the stubbed CSS.supports and checks RenderSession output, implementing the approved policy change.
3. `rc87-97379238aa6e9c52`: idempotent disposal, structured SESSION_DISPOSED and explicit variable/background emission remain asserted with language version 3.
4. `rc87-c6f234a37661be00`: the renamed Next test imports real ESM data, asserts language version 3, and rejects fetch, handmade /_next URLs and .next asset writes.

No other historical test was deleted, relabeled as approved, or accepted based only on a new digest. The original baseline and ledger are retained.

## Release blockers

1. Firefox 155 / Playwright revision 1543 fails before an empty page can be created on this macOS host. A fresh isolated download reproduces `sandbox_extension_issue_file_to_process ... Operation not permitted` and `Could not find profile folder`. Reinstall, temporary-directory and persistent-profile checks did not resolve it. No Firefox case is marked passed; a functioning host or traceable CI result is still required.
2. `pnpm run check:migration` still fails at the pre-existing `public-api-contract` surface evidence. After the four reviewed test records, 244 changed cases, 256 unmapped removals and 2 ambiguous mappings still need reviewed replacement/approval evidence. This task does not convert those gaps into blanket approvals.

No model comparison was performed and no improvement in AI generation correctness is claimed.
