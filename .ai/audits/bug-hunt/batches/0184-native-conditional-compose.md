# Batch 0184: Native conditional compose

- Status: in progress. Previous turn completed the0183source-map evidence and preservation checks. All baseline sources match.
- Scope: BH-0057 ordinary native conditional traversal, arbitrary native children, authored order and original source locations; direct and graph output/native andWasm/browser validation. No new commit/push authorization.0038 identity confirmation remains pending.
- Start: ordinary outer media leaves @compose unlowered;0183 Rust1FAIL and3browserFAIL/3nestedcontrolsPASS. Extend controls before fixing.
- All prior unresolved findings,10blocked coverage,4root gates,4original candidates,fullhost/graph/benchmark/Site and other requirements remain; recorded obstacles are unfinished.

## Evidence and implementation

- Before: new Rust suite1PASS/4FAIL. Ordinary wrapper children retained rawcompose. Added a Rust stylesheet-level traversal that lowers affected styles and recurses containers, preserving font faces/keyframes/plain styles. Graph slots stay at the original position and strip only enclosing conditions already retained around the slot. Native styles can also contain layer blocks. No TypeScript semantic fallback or ABI/schema change.
- After: six wrapper forms (media/supports/container/namedlayer/anonymouslayer/starting-style), nested-style variants, native child order, single anonymous layer and original UTF-16 selector/compose anchors are covered. Rust full98PASS/2FAIL; previous0183source-map7tests allPASS. Two retained new regressions prove direct output still reverses sibling order and splits anonymous layers.
- Compiler full305PASS/1FAIL in42files; native/Wasm graph transport and all wrapper source-map controls pass. The direct public renderer order assertion fails. First fullserial run has the same305/1result; final parallel run12.74seconds. Native/compilerWasm rebuilt after the final nested-layer addition; JS compiler code/artifacts unchanged this batch.
- Actual Chromium/Firefox/WebKit final matrix96observations: authored24PASS,nativegraph24PASS,Wasmgraph24PASS,direct15PASS/9FAIL;0pageerrors. The failures are media/namedlayer/anonymouslayer direct output:32px instead of48px. Initial matrix observed the same result before the extra style-nested layer branch; final evidence uses rebuilt artifacts.
- Compiler lint/types andRustClippy(alltargets/allfeatures)/fmt/codegen/parityPASS. Site lint0errors/75warnings andreference13PASS. The referenced oldcontent.mdx no longer exists; site/reference/build.ts consumes the existingcontract.mdx, which now documents verified graph behavior and the direct-output limitation. Its preexisting other-task content is preserved around the insertion. No Site-wide completion claim.
- Test-material corrections: first graph-order assertion looked for minified padding:3rem in pretty native CSS; corrected to compare the two selector positions. Clippy rejected consecutive test replacecalls; combined the character pattern. Neither correction changes product behavior. All original logs retained.

## Current handoff

- BH-0057 is partial, not fixed. Node node-compiler.ts:toCompileCSSManifestResult and universal compiler.ts:compileManifest join nativeCSS before generatedCSS. That representation loses interleaving and anonymous-layer identity. Next reuse/extend the Rust graph slot assembler for direct output (and transport ordered output/maps), preserving raw native/managed metadata contracts and reference/import origins; avoid a TypeScript CSS parser or string-order heuristic. Verify direct Node/universal native/Wasm, repeated selectors, important values, anonymous/named layers, nested wrappers, arbitrary native siblings, source maps and actual browser cascade before closing.
- The9browser/2Rust/1TS failures belong to the unresolved direct-delivery boundary shared withBH-0004; do not create duplicate finding IDs or erase these tests. Fullhost/mapping/SSR matrices remain beyond this checkpoint.
- Fullremaining scope is copied into[final checks](../evidence/0184-final-checks.json);57historical/52fixed/5unresolved and65checked/10blocked remain.0038stillawaits explicitidentityconfirmation. No commit/push. Goalactive.
