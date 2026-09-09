# 0121 Original source diagnostics for stylesheet delivery

- Starting/current HEAD912a73b26. Previous goal turn made concrete progress:0120output selection and layer reachability corrected and verified. All74recorded0120source/preservation hashes matched before this batch.
- Bounded behavior: preserve original file IDs, UTF-16 ranges and definition source locations when graph compilation rewrites resource URLs and collection composition creates per-entry variants.
- BH-0004 remains partial. Counts stay32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification remains paused pending explicit identity confirmation.

## Reproduction and cause

- An imported child contains a relative image URL before invalid native compose or an invalid managed directive prelude. Rewriting the URL to a longer delivered path moved raw Rust ranges by36UTF-16units. For example, authored `unknown-utility` starts at49, but graph compilation reported85. The single-source compiler correctly reported49.
- The graph binding did not provide source text to its error normalizer, so the public diagnostic omitted the Rust range entirely. The error's original source was the imported child, not the entry; supplying only entry text would also be wrong.
- Collection registration can succeed with a base manifest defining `known`, then composition against a manifest without that definition fails. Its public diagnostic exposed the internal child ID ending in a NUL `sheet-0` variant suffix.
- Initial host regressions7FAIL and Rust regressions2FAIL preserved these failures. The final host corpus adds multiline image-set printing, testing changes to both line count and character offsets. [Host baseline](../evidence/0121-host-before.log), [Rust baseline](../evidence/0121-rust-before.log), [raw native/Wasm baseline](../evidence/0121-diagnostics-bytes-before.log).

## Fix

- Resource rewriting records sorted original/generated UTF-16 spans for changed URL/image-set values. Untouched offsets map exactly; a location inside a reprinted value maps to its original value boundary.
- Rust restores existing parse/directive error ranges immediately after per-file parsing. It also restores each style definition's source, selector source and compose directive source before shared-manifest/slot lowering, so later errors and returned definition locations use original CSS. Existing compiler helpers calculate original line/column locations.
- Generated UTF-16 length is accumulated across edits, avoiding rescanning the entire generated prefix for each resource. Source-position bookkeeping adds compiler work and memory; no speed improvement is claimed.
- The binding error normalizer accepts a source lookup internally. Graph compilation supplies the source belonging to the diagnostic filename and converts original UTF-16 offsets into public line/character positions. Other single-source callers retain their existing behavior. Unknown source files do not receive a fabricated range.
- Node collection composition maps diagnostic variant IDs back to original owner filenames while retaining the underlying error as its cause. Public diagnostic payloads no longer contain the variant suffix.
- Compiler README and directive contract describe original-source ranged diagnostics. Existing errors without a range remain unlocated; this batch does not claim to add all missing parser ranges or repair legacy flattened-source diagnostics.

## Final validation

| Check | Result |
|---|---|
| Rust compiler |65PASS, including error ranges and definition metadata after longer/shorter/multiple URL edits |
| Compiler host |194PASS;9new diagnostics cases across native/Wasm and public collection |
| Standalone source and built compiler |4diagnostic comparisons eachPASS using actual native and explicit compiler-Wasm bytes |
| Binding host |17PASS |
| CLI host, after build finished |37PASS |
| Actual built CLI export |18browser comparisonsPASS |
| Existing output-mode browser corpus |96PASS,16modes x2media x3browsers |
| Existing image/font resource browser |All3browsersPASS; real request/font controls |
| Compiler/binding lint/types/build, CLI build |PASS |
| Native/compiler-Wasm build; Rust Clippy3crates, fmt, codegen/parity |PASS |
| Site guide lint/prepare |PASS;0errors/75existingwarnings |
| Legacy external-import browser |Still21PASS/39FAIL |
| Root API census/package contracts |BothFAIL, both output hashes unchanged from0120 |

- [Final compiler](../evidence/0121-compiler-tests-final.log), [Rust](../evidence/0121-rust-accepted.log), [CLI](../evidence/0121-cli-tests-final.log), [source diagnostics](../evidence/0121-diagnostics-source-final.log), [built diagnostics](../evidence/0121-diagnostics-built.log), [output modes](../evidence/0121-output-modes-browser.log), [resource browser](../evidence/0121-resource-browser.log), [root gates](../evidence/0121-root-checks.json).
- CompilerWasm7,047,159raw/1,566,884gzip/973,217brotli bytes: +2,543/+1,408/+1,010 versus0120. Engine/runtime Wasm, runtime global JS and default manifest hashes remain unchanged. No engine/runtime hot-path change or benchmark; no CPU/memory improvement claimed. [Payload](../evidence/0121-payload.json).

## Verification mistakes and retained limitations

- The first standalone repro used default Node compiler-Wasm loading and stopped on the existing file-URL fetch failure after native evidence was recorded. Explicit artifact bytes allow the diagnostic comparison to run; this does not resolve or classify the default loader contract candidate. [Initial loader failure](../evidence/0121-diagnostics-before.log).
- The first CLI suite overlapped this agent's compiler package rebuild. Seven tests encountered missing files while the shared `dist` directory was being replaced;30passed. This was an orchestration error, not a product regression. The build handle completed before a fresh full CLI run;37passed. The failing log is retained, and future tests consuming built packages must follow builds sequentially. [Overlap failure](../evidence/0121-cli-tests.log).
- Returned error causes may retain internal debugging information; the tested user-facing diagnostic payload has original owner filenames and positions. Unranged parse errors, unknown-source failures, reference edge cases and legacy flattened-source mapping are not claimed complete.

## Direct handoff

1. Next bounded batch: reproduce CLI watch after removing an imported stylesheet/resource, and after a missing resource is restored. Verify actual emitted files, CSS references, scanner dependencies and recovery without restarting the CLI.
2. Inspect `packages/cli/src/generate.ts` asset publication/reset dependencies and `packages/compiler/src/stylesheet/delivery.ts` preparation failures. Retain every prior asset until the new entry is successfully published; do not delete unrelated output files or count recorded failures as recovery.
3. Still complete stale-sidecar ownership/cleanup, broader multiple-output/reload behavior, existing file/project/build and `--no-export` graph delivery, inline/runtime resource bases, namespace/external URL-base forms and reference/source policies. Legacy public60comparisons still have39failures.
4. Preserve the16-mode96browser corpus, original CLI exports and new diagnostics controls while extending delivery. All12unresolved findings,10blocked coverage units,4root gates,4unclassified candidates and0038identity-gated checks remain unfinished.

This diagnostic subtask is verified; BH-0004 and the overall goal are not complete. No commit/push. Product/fixtures/dependencies/CI changes outside the listed current source set remain preserved; source hashes, inventory and final context check accompany this batch.
