# Batch 0189: Rendered stylesheet asset delivery

- Bounded implementation complete; full consumer migration remains unfinished.502sources matched0188 at start. Existing compileRenderedStylesheet ignores delivery options and rejects retained boundaries. Connect existing graph delivery and retain per-asset maps, resources and global rendering. All BH0004/0029/0051/0053 and full scope remain;0038 identity pause unchanged. No commit/push.

## Implementation and evidence

- Existing rendered Node implementation ignored delivery and threw CSS_IMPORT_ERROR for retained assets; first3regressionsFAIL. Connected compileDeliveredSource and returned original graph assets/maps/resources. The built public browser then exposed a second drop at the public wrapper; immutable public entry/stylesheets/resources now retained. Successful delivery leaves native rules in their CSS files and appends generated globals only to the entry.
- New tests cover external order/qualifiers, child resource relocation and original maps, class pruning, callbacks, internal references, real Sass dependencies/maps and partial diagnostics. Initial recursive references reused supplied root metadata; cleared it for reference files. Initial delivery result missed Sass loadedUrls and mapStylesheetError; both corrected from reproduced failures. Internal references are not a new public option; test typing corrected by retaining that specific host test on the internal API.
- Finalcompiler326PASS/46files; built public Node delivery126browserPASS across21cases, including original10external-import cases60PASS. The raw source-flattening reproduction still fails and is not replaced or called fixed. Vite77 scoped PASS before only final wrapper/error-map changes; Next17 scoped PASS on final source. Compiler build/lint/types PASS.
- Per-asset sourceMap chains owning Rust outputMappings with host maps; generated appended CSS is left unattributed. Fine native declaration positions and subsequent host transformations remain required byBH0053. No Rust/binding rebuild or engine/runtime benchmark this TypeScript delivery batch; full performance scope remains.

## Continuation

- Other raw/project/file and actual host publishers still require full migration and validation. Original low-level39 external-import failures and20qualified failures, all fouropenIDs,10blockedunits, fourrootgates/fourcandidates, Vite startup6failures/internalproxy/native shutdown/WebKit limitations, full SSR/host/watch/resource matrices, benchmarks andSite revalidation remain.0038identity confirmation not received.
- Goalactive;no commit/push. Previous audit-only commitd3d58eacd. [Checks](../evidence/0189-final-checks.json), [sources](../evidence/0189-source-hashes-final.json), [artifacts](../evidence/0189-artifacts-final.json).

- Final Site reference13PASS/lint0errors75warnings; source505files and native/Wasm/runtime artifacts preserved. Additional generated-globals/immutability test passes (7test file;6 included in full326 plus1new). Its first negative map assertion misunderstood Node SourceMap.findEntry returning a previous mapped line; corrected to require the queried generated line, no product edit. Authored source maps leave appended global classes unmapped. Raw failed test log retained.
