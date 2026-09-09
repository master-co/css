# 0125 Project manifest graph loading

- Started at HEAD74e471917; user-requested commit1c6595586 saved completed0123–0124 audit materials during this batch. Previous goal turn made progress by committing that evidence and preserving unfinished implementation. Current HEAD1c6595586.
- Scope: Node public project manifest loading through qualified local imports containing external imports, prepared references, source ownership, and actual production manifest-query consumers. BH-0004 remains partial; native CSS asset delivery through other existing consumers is not completed here.
- Counts remain32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Original failure and implementation

- Three new public project cases failed before implementation: named layer, anonymous layer, and supports/media local imports whose child contains an external import. The previous Node host flattened CSS before Rust project lowering and rejected these valid authoring graphs, even though the public result only returns a manifest and metadata. [Original3FAIL](../evidence/0125-project-before.log).
- Existing capabilities were inspected in project manifest/sync, Node import preparation, Rust stylesheet graph compilation, and Vite/Webpack manifest loaders. Node now supplies original per-file sources and resolved import/reference edges. Rust project reuses the existing compiler graph to lower shared definitions; it does not need to publish native CSS for this API.
- Internal prepared project entries gain optional `manifestGraph`, generated from the Rust contract template. Legacy flat inputs remain because direct filesystem/native CLI consumers still consume project CSS. Node public result fields are unchanged. This is not a migration of the native CLI/file/build CSS output contract.
- Node filesystem/package resolution prepares referenced graphs recursively; Rust resolves their definitions for composition and records dependencies. Missing references and cycles remain errors. Reference-only native rules, classes and source policies are excluded from the consuming project's output/policy.
- Imported `./` and `../` source include/exclude patterns are normalized against their authoring file before project source planning; bare patterns retain project-root interpretation. Explicit project entries merge in caller order.
- Dependency precollection now reads graph files without flattening, so imported files remain watch dependencies when valid external imports are present. Successful manifest compilation additionally supplies reference dependencies to existing Vite/Webpack loaders. Missing-reference watch recovery is not claimed.
- Internal sibling URLs only satisfy the shared Rust graph renderer; project results emit no CSS assets and perform no external CSS fetch. There is no TypeScript CSS transform, data-URL replacement, hoisting, or error fallback presented as native CSS delivery.

## Validation and correction

| Check | Result |
|---|---|
| Rust project old/new tests |9PASS:5existing+4new |
| Compiler package |199PASS across22files |
| Binding package |17PASS |
| CLI package |71PASS |
| Vite package |106PASS |
| Webpack package |69PASS, serial files |
| Compiler and binding lint/types/build |PASS |
| Rust project/native binding Clippy; cargo fmt |PASS |
| Generated contracts and parity |PASS |
| Actual built Vite/Webpack production manifest queries |18PASS:2hosts×3conditions×3browsers |
| Legacy public native/compiler-Wasm browser corpus |21PASS/39FAIL of60; unchanged required failures |
| Root API census/package contracts |FAIL; exact output hashes unchanged from0124 |
| Compiler/runtime Wasm and runtime JS/manifest artifacts |5hashes unchanged from0124 |

- Rust initially reported8PASS/1FAIL. Diagnostic output proved the later entry correctly won: `.choice{color:#00f}`. The new test had expected literal `blue`; this was a test assertion error, not a product merge bug. The test now expects canonical CSS and verifies reversing entry order produces red. [Failure](../evidence/0125-project-rust-expanded.log), [actual CSS](../evidence/0125-merge-diagnostic.log), [final Rust](../evidence/0125-project-rust-final.log).
- Public async/sync project controls cover imported reference definitions, dependency lists, source-plan files, empty native output, explicit entry order, missing references and reference cycles. [Compiler199](../evidence/0125-compiler-tests-final.log).
- [Production browser driver](../repros/project-manifest-query-browser.mjs) runs both actual built integration plugins and real production builds. Chromium, Firefox and WebKit load emitted manifest JSON; the native public engine consumes the browser-delivered object, and each browser checks the generated button's red computed color. Reference-only `paint` is not emitted; no external native CSS is fetched. This verifies manifest-query delivery and generated definitions, not browser runtime hydration or native stylesheet delivery. [18comparisons](../evidence/0125-manifest-query-browser.log).
- The old required browser corpus was rerun against current native and compiler-Wasm bindings; all10transport results agree, but39of60behavior comparisons still fail. Preserve this evidence and repair the consumers; never rename this requirement into the passing manifest-only case. [Legacy corpus](../evidence/0125-legacy-browser.log).
- Compiler README and the current directive `contract.mdx` document the bounded manifest API. The previously referenced `content.mdx` does not exist in the current checkout; current Site instructions place formal directive contracts in `contract.mdx`, so no obsolete page was recreated. Site prepare/lint and final preservation results are recorded in the final checks.

## Costs and direct handoff

1. Node prepares original files and reference graphs; Rust graph compilation may repeat work for referenced entries. No performance improvement is claimed. This changes project/compiler orchestration, not engine/runtime hot paths; no runtime benchmark was required. Native artifact was rebuilt; compiler/runtime Wasm and runtime JS/default manifest hashes remain unchanged.
2. Next inspect existing `compileManifestFileSync` / `compileCSSManifestFileInternal` in `packages/compiler/src/node-compiler.ts`. They still call the flat `compileCSSFile` path and can reject the same qualified external authoring graph. Reproduce through the actual public file-manifest API, then reuse existing prepared graph/reference capabilities while preserving its manifest/nativeCSS/result contract. Do not silently discard native CSS from APIs that promise it.
3. Separately continue actual CSS delivery through file/build/`--no-export` consumers and native CLI, original39browser failures, resource/namespace/external URL bases, reference/source policies, unlocated diagnostics, and watch/source lifecycle gaps. New manifest-only success does not close these requirements.
4. Keep12unresolved findings,10blocked coverage units,4root gates,4unclassified candidates and0038identity-gated work open. No new commit or push after the explicit1c6595586audit commit. Preserve all other conversations' Site changes, fixtures/snapshots, dependencies, lockfiles andCI/release.
