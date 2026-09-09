# 0119 CLI stylesheet asset delivery — BH-0004 partial repair

- Starting HEAD927278b1c; previous0118turn is progress: actual CLI failures classified and shared Node preparation extracted.63current/preserved hashes verified before edits. No commit/push.
- Scope: connect standalone CLI file export to Rust stylesheet graph compilation, publish actual CSS/resources, preserve source ownership and entry pruning scopes, and verify original failed behaviors. BH-0004 remains partial; other file/project/build/no-export requirements are unchanged.
- Overall32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates remain unfinished.0038additional verification remains paused; no identity confirmation received.

## Implementation and observable changes

- CLI `generate --output dist/output.css` now uses collection `delivery` registration/composition. Node preparation supplies all local CSS files and import edges to Rust, preserving external imports and qualified/nested boundaries. The output entry imports the generated sibling stylesheets; CLI writes every stylesheet and copies resource files before writing the entry.
- CSS/resource names use hashes of project-relative identities or resource contents. Deploy the whole output asset set with the entry. This intentionally changes the output layout from one flattened CSS file to an entry plus dependencies; it adds filesystem reads/copies and potentially browser requests.
- Rust's explicit `relativeResourceURLs` mode requires sibling stylesheet URLs and permits mapped sibling resources. Cross-file composed definitions therefore keep their original resource ownership while all generated standalone CSS shares one delivery directory. Default absolute/root-relative mapping behavior is retained. This mode is not an inline-CSS manifest contract.
- New per-file `classesByStylesheet` controls native pruning. Collection composition gives each entry's imported files distinct variant identities, so a shared file under a preserved entry and a pruned entry can produce different assets. Callback `stylesheetURL(file, variant)` must return distinct URLs for those variants. Definition merging and CSS semantics stay in Rust.
- File `@reference` contexts now use the graph compiler in the delivery path. Reference native CSS is not published; referenced resources used by composed definitions retain the reference file's base, copied bytes, query and fragment. Circular references are checked through filesystem identities.
- Resource dependencies join scanner reset dependencies. Watch updates republish changed resources and refresh stylesheet references; generated output paths are excluded from source-watch feedback and known outputs are excluded from scan lists.
- Existing file/project/build/no-export paths are not switched in this batch. Collection delivery currently requires native/Master-base CSS inclusion; the exclusion variants still need implementation before full closure. Original diagnostic/source mapping, external URL-base edge cases and stale asset cleanup remain unfinished.

## Actual CLI and browser evidence

The unchanged0118driver runs real source and freshly built CLI processes in disposable projects, then serves exported disk bytes to Chromium/Firefox/WebKit. All hosts and projects were disposed.

| Case | 0118 source/built | 0119 source/built |
|---|---|---|
| Local native CSS control | PASS | PASS |
| Root-relative resource control | PASS | PASS |
| External-only import | Import removed; black instead of blue | External requested; blue |
| External import after local | Import removed; red instead of blue | Original order retained; blue |
| Qualified local import with nested external | CLI exit1 | CLI exit0; original red result |
| Local relative resource owner | /dist/image.svg404 | Copied sibling resource200 |

- Each final CLI corpus:18PASS/0FAIL;36browser comparisons across source/built. The same six-case driver previously had6PASS/12FAIL per CLI mode. [Source](../evidence/0119-cli-final.json), [built](../evidence/0119-cli-built-final.json), [original0118](../evidence/0118-cli-browser-final.json).
- Added three real CLI process regressions: reference resource with encoded filename/query/fragment and Unicode output filename; shared import with independent preserve/prune scopes; resource edit during watch, changed content hash/bytes/CSS reference, and no output-triggered reset loop.
- Watch regression proves resource replacement for the active run; old sidecar removal across runs, removed-resource cleanup, missing-resource recovery and exhaustive simultaneous edits are still unclaimed.
- Intermediate first version passed the original18browser comparisons and existing34CLI tests. It was then extended for reference resources and separate pruning scopes; final37CLI tests and source/built browser corpora reran after those changes.
- Initial CLI type-check failed because new delivery types had not yet been forwarded from `stylesheet/index-public.ts`. This implementation omission was fixed; final type-check/build pass. One log-tail inspection ran before Site prepare had started and saw a missing log; the original live Site handle was retained and later completed0. Neither was classified as a product finding.

## Validation

| Check | Result |
|---|---|
| Rust compiler |61PASS |
| Compiler host suite |168PASS, including native/Wasm sibling-resource and per-file-pruning parity |
| CLI host suite |37PASS |
| Binding host suite |17PASS |
| Actual CLI source/built |18PASS each; all original browser controlsPASS |
| Existing compiled graph browser |126PASS |
| Existing image/font resource browser |3browsersPASS, actual requests/font controls |
| Legacy external-import browser |60comparisons still21PASS/39FAIL; BH-0004 remains incomplete |
| Compiler/CLI/binding lint and types |PASS |
| Compiler/CLI builds |PASS, fresh output used by built CLI browser |
| Native/compiler-Wasm build; Clippy3crates; fmt/codegen/parity |PASS |
| Site docs prepare/lint |PASS;0errors/75existingwarnings |
| Root gates |API censusFAIL unchanged hash; package API goldenFAIL adds delivery types/contract surface |
| AI context/source budget |Final result recorded with batch |

- [CLI tests](../evidence/0119-cli-tests-accepted.log), [compiler tests](../evidence/0119-compiler-tests-final.log), [Rust tests](../evidence/0119-rust-final.log), [legacy failures](../evidence/0119-legacy-browser.log), [root gates](../evidence/0119-root-checks.json).
- CompilerWasm7,036,031raw/1,560,369gzip/970,618brotli bytes; compared with0116: +13,497/+1,656/-18. Compression uses the same default gzip6/Brotli11 settings; an initial gzip9 trial was corrected before comparison. [Payload](../evidence/0119-payload.json).
- Engine/runtime Wasm, runtime global JS and runtime default manifest hashes remain unchanged. No engine/runtime hot-path change or performance benchmark; no speed/memory improvement claimed. Per-entry variants can increase compiler work and output requests.

## Remaining requirements and direct handoff

1. Continue BH-0004 across existing file/project/build adapters and `--no-export`; the original public failure corpus still has39FAIL. Passing standalone export does not close these consumers.
2. Complete output-mode contracts (native/Master-base exclusion, inline/runtime manifest resource bases), original diagnostic ranges and owner IDs, reference/source-policy edge cases, namespace/external relative URL-base forms.
3. Add cleanup/recovery for stale or missing sidecars/resources and broader reload/multiple-output tests. Current watch update succeeds and avoids a feedback loop, but old sidecars remain on disk.
4. Keep the current CLI/source/built/native/Wasm regressions as controls while extending the shared compiler path. Do not replace functional completion with an explicit error fallback or update existing goldens to hide unresolved API gates.
5. Preserve all other findings/coverage blockers and the0038identity gate. The overall goal stays active.

Only compiler/CLI implementation, minimal tests, codegen-derived protocol, relevant docs and audit materials changed in this batch. Existing fixtures/snapshots, dependencies/lockfiles, CI/release and other conversations' Site files remain preserved. No commit/push.
