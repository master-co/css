# 0132 Vite production graph publication

- Previous goal turn made progress:0131completed public native/Wasm bundle transport with174browser controls. Revalidated its119source/preservation hashes, then recorded five Vite source files and three affected existing tests before editing (127baseline files). HEAD remains160ca58a5; no new commit/push.
- Scope: actual Vite production CSS graph registration, original-position bundle composition, complete asset publication and content-sensitive naming. This is partial BH-0004 migration; other Vite host capabilities and Webpack remain unfinished.0038extra verification is still paused without explicit identity confirmation.

## Changes

1. `resolveStylesheetSync(..., { preserveImports: true })` classifies a prepared Node graph without flattening it; `compilationSource` remains the original unexpanded source. Vite build-time local-compose and style-entry classification select it, avoiding the previous qualified-external-import failure before registration.
2. Vite build registration/composition selects collection delivery. The transform emits the managed slot while native/local/external CSS remains in the managed graph. Development remains on its previous path. Native source snapshots intentionally retain author directives and imports.
3. `prepareBuildStylesheet` passes the complete Vite CSS asset plus compiled managed graph to Rust bundle preparation. The generated CSS files are content-named and emitted beside the original Vite asset. The entry imports the graph entry, so ordinary-before/managed/ordinary-after order is retained without hoisting imports or inline/data-URL delivery.
4. Naming includes the complete serialized bundle content before Vite resolves asset references. Each generated graph filename includes a20hex-character SHA256 prefix; resource filenames include their content digest. The original Vite CSS filename still honors assetFileNames callbacks, hash lengths/encodings and fixed names. Callbacks now see the naming-stage entry/import text for graph output. Vite may include naming metadata; names remain content-sensitive rather than final-disk-byte checksums.
5. Rust bundle rendering adds `preserveResourceBase: true` for a host that guarantees all fragments retain the source stylesheet's resource base. It preserves ordinary URLs verbatim and rejects simultaneous nonempty `resourceURLs`. The strict relocation default remains. Vite places fragments in the original CSS asset directory; managed resources already use sibling content-named URLs from collection delivery. The contract template was edited and protocol regenerated.
6. Initial full Vite testing caught a real regression: bare package CSS was left in browser output instead of being resolved. Delivery now explicitly supports `resolveNodePackageImports`, using Node package exports to load CSS and track its nested package ownership. These package rules are preserved while project-native rules are pruned. The option defaults off for existing callers. Unresolved imports remain external; Vite-specific aliases/custom resolvers are not yet integrated.
7. Registration accepts an in-memory entry source whose path does not exist. Reference-cycle identity uses realpath for existing entries and the resolved supplied path otherwise; referenced files still undergo normal resolution/read checks.
8. Updated three existing Vite test files for the intended graph contract: source snapshots retain author source; build-hook tests run renderStart and inspect emitted assets; package CSS validation checks resolved asset content rather than ordering a concatenation of unrelated files. The actual browser tests below prove cascade order. No existing fixtures/snapshots, dependencies, lockfiles or CI/release files were edited.

## Evidence

| Validation | Result |
|---|---|
| Original16actual Vite/Webpack builds, final source |13PASS/3FAIL; failures all Webpack |
| Original actual browser corpus, final source |78comparisons:66PASS/12FAIL; Vite48/48PASS, Webpack18PASS/12FAIL |
| Complete Vite suite |110PASS across19files |
| Complete compiler suite |213PASS across25files;4new focused cases |
| Rust compiler |75PASS |
| Compiler/Vite/binding lint and types |All PASS |
| Native/Wasm and host rebuilds |PASS |
| Three crate Clippy / workspace fmt / codegen / parity |PASS |
| Existing Vite naming/cache/lazy matrix |7modes,21builds,39browser comparisons PASS |
| New actual package/resource delivery matrix |3builds,18browser comparisons PASS |
| Existing progressive hydration controls |36PASS,2runtime mutations per page |
| Original Vite example |TypeScript and Vite production build PASS |
| Site guide preparation / lint |PASS; lint0errors/75warnings |

- [Final actual builds](../evidence/0132-actual-builds-final.log) reuse the unmodified0127[driver](../repros/build-stylesheet-delivery.mjs): Vite now passes external-last, ordinary-before-managed and qualified local imports containing external CSS, plus existing controls. Webpack still fails three qualified builds and12external-last/ordinary-before browser comparisons. The first run before the package-resolution follow-up had the same aggregate result; final run is authoritative.
- [First Vite suite](../evidence/0132-vite-tests-first.log) had104PASS/6FAIL: one actual package-import regression plus five old single-string/source-snapshot expectations. After the package resolver and test updates, [full Vite110](../evidence/0132-vite-tests-second.log) passes.
- [Compiler213](../evidence/0132-compiler-tests-final.log) includes graph classification without flattening, optional package export/nested ownership, and native/Wasm resource-base preservation/conflicting mapping rejection. First focused run had3PASS/1FAIL because the test expected `/var/...` while Node resolves symlinks to `/private/var/...` on this Mac; the assertion now uses realpath. [Initial test error](../evidence/0132-build-graph-tests.log) is not a product bug.
- The old single-file cache reproduction stopped at its `CSS assets.length === 1` assertion (five files now): [log](../evidence/0132-hash-cache.log). It was not altered or counted as a product failure. The unchanged [multi-asset matrix](../repros/vite-css-hash-matrix.mjs) tests repeated identical output, changed managed CSS, retained old responses, independent lazy CSS, fixed names, hash encodings/directories and custom callbacks: [39PASS](../evidence/0132-hash-matrix.log).
- [New resource driver](../repros/vite-graph-resources.mjs), [18PASS](../evidence/0132-resource-browser.log): real Vite plugin, Node package exports and nested CSS, package/managed/ordinary SVG requests with query strings/fragments, deployed relative and absolute bases, unsplit CSS and hash directories. Chromium/Firefox/WebKit verify computed styles and zero missing/page-error requests.
- [Hydration36](../evidence/0132-hydration.log), [example](../evidence/0132-example-build.log), [Rust75](../evidence/0132-rust-tests.log), [Clippy](../evidence/0132-clippy.log), [fmt](../evidence/0132-fmt.log), [codegen](../evidence/0132-codegen-check.log), [parity](../evidence/0132-parity.log). All three changed host packages define lint scripts and passed them. Site prose changes ran [prepare-app](../evidence/0132-site-prepare.log) and [lint](../evidence/0132-site-lint.log); no Site layout or runtime code changed.

## Artifact and gate limits

- [Artifact evidence](../evidence/0132-artifact-hashes.json): compiler-Wasm7159106raw /1593333gzip /988883brotli bytes, +773/+365/+129 versus0131. SHA256 `7533f93b761d4aeabad5699a91b56e29203f330de7a6d14f5dbded217626ab85`. Four engine/runtime artifact hashes and sizes remain unchanged.
- This adds build-time graph parsing, graph cloning, hashing and file publication; browsers may fetch additional CSS imports and resource files. No throughput/latency improvement is claimed, and engine/runtime hot paths were not changed, so no runtime benchmark was run. Broader page-loading cost and asset count optimization remain to assess after correctness.
- API census and package golden both remain FAIL with exact0131hashes: `dc10f0ea4b46e12c21c6bdc6703bf56891d67411a80ad845344dba3bde6c45a4` and `bee0a86a531520dc6273f8744a5f0905cc08e0dc8fb33b2a64b188886f87e7c0`. No golden refresh. Runtime size baseline and migration historical extraction root gates remain open and were not rerun.

## Direct continuation

1. BH-0004 stays unresolved. This batch proves the listed Vite production CSS paths, not the full Vite integration. Next verify and integrate Vite aliases, custom/virtual CSS resolvers and Sass/preprocessor inputs through actual host capabilities; the new Node-only graph resolver does not replace them. Recheck local-compose emitted globals when its project entries contain qualified external imports. Do not document the reduced host coverage as the final supported contract.
2. Verify multiple managed entries, repeated slots/dedup and anonymous layers across separate/lazy chunks, scoped source/pruning policy, build watch/HMR and CSS-source diagnostics. The current bundle API preserves each parsed slot while the old unconfigured hook helper deduplicates literal slots; the actual adapter's intended repeated-entry semantics still need evidence.
3. Then migrate Webpack's pre-transform resolution, graph collection and complete publication with correct URLs. Reuse0127actual tests until its3build/12browser failures pass; retain BH-0045's cache matrix while changing publication.
4. The original legacy single-string corpus was not rerun and remains21PASS/39FAIL. No-delivery/native CLI/no-export consumers, unsupported wrapper scopes/invalid-rule handling and unlocated diagnostics remain unfinished. All other unresolved findings,4root gates,4unclassified candidates and10blocked coverage units remain open.
5. Counts remain45historical findings:33fixed/12unresolved;75coverage units:65checked/10blocked.0038additional verification still awaits explicit identity confirmation. Preserve foreign Site configuration/agent-file edits. Final hashes, inventory and terminal job states are recorded separately. No new commit/push.
