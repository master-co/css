# Master CSS 2.0 named-token validation

Implementation baseline: `3f700887b`. Recorded on 2026-09-24. The user explicitly
requested the breaking language plan before the final 2.0 release. This record
covers that contract; it does not claim compatibility with every historical RC.

## Contract evidence

- `crates/mastercss-compiler/tests/fixtures/v2-rc-syntax-map.json` retains the
  machine-readable RC/new spelling map and baseline declarations. Its saved RC
  manifest is adjacent; migration tests consume both files.
- `named_token_contract.rs` covers named/native boundaries, reserved names,
  ambiguity, longest prefixes, negative/opacity restrictions, groups and ordering.
- `rc_migration.rs` covers actual saved settings, custom targets, explicit vars,
  nested length conversion versus native resolution descriptors, diagnostics,
  stylesheet edits and idempotence. Overlapping unchanged declarations also
  require review; logical/physical and grid shorthand overlap is conservative.
- `rust-semantic-corpus.json` remains frozen. `v2-language-corpus.json` preserves
  all 57 engine, 14 compiler and 91 parser case identities. Parser inputs remain
  unchanged. Compare corresponding steps for old/new CSS and rule metadata.
- Named tokens emit variable references; raw native values never resolve tokens.
  Native shorthands retain resets. Group members emit independently ordered rules.
  Manifest/hydration envelopes remain v1; bindings require ABI 8 and regenerated
  artifacts. Historical matchers/settings fail explicitly.

## Validation executed

- Rust workspace: **416 tests passed**, plus doc tests; the final mixed-matcher regression also passes all 13 contract tests. Formatting and workspace
  clippy with all targets/features and denied warnings passed.
- Bindings codegen check and native/Wasm semantic parity passed. All three Wasm
  artifacts and the native release binding were rebuilt. The final matcher change
  passed all 20 cross-host test/build tasks without changing the corpus output.
- Package builds passed (32 tasks). The package test run and focused repairs/reruns
  cover compiler, engine wrappers, tooling, language service/server, ESLint,
  preset, CLI, MCP, VS Code, server, runtime and framework/build integrations.
  The final affected compiler/tooling/language/CLI run passed all 22 tasks.
- Workspace lint/type-check passed all 68 tasks. Artifact inspection passed for
  757 published text artifacts. Package/API boundaries, MDN registry, runtime
  JavaScript budget and AI context checks passed.
- Official examples build passed all 36 tasks (including dependencies).
- Chromium/WebKit runtime coverage: 236 tests, with the initially failing cases
  repaired and rerun. The ten named-token tests additionally verify static,
  SSR, runtime and progressive computed styles, hydration/update stability,
  shorthand resets, ordering, groups and native resolution descriptors.
- Site prepare-app, Markdown/search exports, production Next build (834 pages),
  static postprocessing, type checking and the scoped document/reference/Play
  suites ran. Docs examples: 13; reference: 20; LLMS exports: 32; Play: 17;
  syntax migration: 3; v2 RC integration: 3 — passed.
- The new guide's framework entry, ordering before v1, back link, heading and
  lack of horizontal overflow passed desktop (1280 px) and mobile (390 px)
  Chromium tests. Screenshots of both viewports were visually inspected. The
  grouped sidebar rule test was updated for separate group-member rules and
  both viewport cases passed with unchanged computed layout assertions. Final
  browser checks passed five cases (one mobile Play sentinel intentionally
  skipped); the regenerated CSS snapshot verifies all 1,246 static HTML routes.

## Performance and payload

Apple M3 Max, macOS arm64, Node 24.20.0. Both native bindings use release builds.
The workload has 464 mapped classes: 120 color tokens with base/hover/sm forms,
36 spacing classes, 64 literal widths and four common named/parameter utilities.
Every class was verified to produce a rule. Four warmups precede 15 alternating
paired samples. Times include N-API and JSON serialization. Cached measurements
are per batch of 464 classes, averaged across 100 batches per sample.

| Median, ms | RC baseline | New contract |
| --- | ---: | ---: |
| Create session | 12.384 | 15.879 |
| First insertion | 4.639 | 3.598 |
| Cached ensure | 0.0373 | 0.0375 |
| Delete and reinsert | 4.906 | 3.886 |

Session creation increases about 28%; first insertion and reinsertion improve
about 21–22% on this workload. Cached performance is effectively unchanged.
These are local microbenchmarks, not an end-to-end browser performance claim.

| Runtime asset | Raw before → after | Gzip before → after |
| --- | ---: | ---: |
| JavaScript | 50,629 → 50,629 | 14,214 → 14,214 |
| Engine Wasm | 968,053 → 1,023,362 | 295,165 → 313,656 |
| Default manifest | 90,882 → 89,014 | 13,041 → 12,901 |
| **Complete payload** | **1,109,564 → 1,163,005** | **322,420 → 340,771** |

Gzip uses level 6, matching the saved baseline. Default Brotli totals increase
from 247,590 to 261,021 bytes. The complete gzip payload increases 18,351 bytes
(5.7%). No assertion about improved AI generation accuracy is made.

## Outstanding checks and limitations

- `check:migration` fails on existing committed historical evidence: case
  `rc87-64695981843c3c3f` has a stale target digest. The checker reads committed
  refs, not these working-tree edits. The evidence file and checker are unchanged;
  historical approval records were not rewritten to hide this failure.
- Firefox 155 / Playwright 1543 fails before opening a page on this macOS host
  (`Operation not permitted`, then `Could not find profile folder`). An isolated
  fresh browser download reproduces it. Firefox behavior is therefore unverified.
- The site build's final public-asset audit reports unreferenced `icons/copy.svg`.
  The asset exists unchanged at HEAD and has no source reference there either.
  Next production compilation and static postprocessing themselves complete.
- Existing site dogfood assertions also fail outside the new migration guide:
  the guide index now has an unchanged `.doc-index` margin reset; the cascade
  guide's expected heading already moved to its reference page at HEAD; a white
  token is serialized as equivalent Lab versus OKLCH; sandboxed demo documents
  produce blocked-script console messages. These assertions were not relaxed.
  The full site dogfood gate is **not green**; the new guide and updated group
  sidebar checks pass separately.
- Rebuilding Next from a reused Turbopack cache can omit the side-effect manifest
  asset. A clean `.next` build includes it and passes the new browser checks.
  This pre-existing artifact-cache behavior was not redesigned in the syntax task.

The site CSS snapshot is regenerated from a clean production build. It includes
all current routes and the new language output; its old snapshot already predates
some HEAD site content. Regeneration does not waive the outstanding checks above.
