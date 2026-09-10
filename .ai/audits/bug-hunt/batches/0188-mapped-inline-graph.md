# Batch 0188: Mapped inline graph

- Bounded implementation and validation complete; full consumer migration remains unfinished.498sources matched0187 at start. Reuse Rust boundary-aware inlining with original output mappings, then migrate rendered Node input away from authoring-text flattening. Preserve qualified managed definitions, anonymous layers, references, resource ownership and retained external/namespace boundaries. All remaining requirements and0038identitypause retained. No commit/push.

## Verified bounded implementation

- Rust inlining now carries original outputMappings through promoted children, ordered edits and qualifier wrappers. Relative resource and unresolved import URLs retain their delivery base; incompatible children stay separate assets. Existing graph ABI accepts optional inlineImports via flattened invocation wrapper; protocol generated through xtask.
- Node rendered and manifest-file/reference paths parse original files independently, merge managed definitions and use the mapped graph inliner. Existing qualified managed import regression passes. Single-output rendering reports CSS_IMPORT_ERROR for boundaries that require multiple assets; full retained delivery migration remains unfinished.
- Rust114PASS; compiler319PASS after final builds; additional public file/reference test covers five qualifiers and passes. Binding17, Vite55, Next17 scoped PASS. Actual browsers: 126 public inline graph comparisons across21cases and72 built Node rendered comparisons across12cases PASS; screen/print, named/anonymous layers, suppression and source order retained.
- Original qualified matrix now40PASS/20FAIL: renderedNode12PASS, preparednative/Wasm24PASS, low-levelnative/Wasm each2PASS/10FAIL. Do not mark BH0004 completed. Native/Wasm byte loading is explicit after default standaloneNode fileURL fetch failed; failed log retained and original loader candidate remains.
- Initial full compiler run overlapped its JS build; final full run happened after all builds completed. New test initially omitted optional utilities guard (type error); corrected without weakening assertions. Raw logs preserved.

## Continuation and limits

- Existing raw/project/direct consumers, retained asset delivery, relative resource relocation, fine/asset source maps and original legacy60 external-import comparisons remain required. Full hosts/watch/recovery/SSR/Nuxt/Webpack matrices, six Vite startup failures, internal ?direct proxy, four root gates/four candidates, native shutdown/WebKit limitations, full benchmarks and Site revalidation remain.0038 identity confirmation not received.
- Counts58historical/54fixed/4unresolved;65checked/10blocked. Goalactive;no new commit/push. [Checks](../evidence/0188-final-checks.json), [source hashes](../evidence/0188-source-hashes-final.json), [artifacts](../evidence/0188-artifacts-final.json). Previous audit-only commit is d3d58eacd.

- Final compiler/binding lint and types, Rust Clippy/fmt/codegen/parity PASS; Site reference13PASS and lint0errors/75warnings. Source502 files retain all prior work except13 listed edits and4 additions. Removing only the added Site paragraph matches0187 hash. Compiler native/Wasm and compiler JS artifacts changed; runtime/engine/preset artifacts retained. Full performance scope remains.
