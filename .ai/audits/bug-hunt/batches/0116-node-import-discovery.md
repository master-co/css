# 0116 Node import discovery — BH-0004 remains partial

- Starting HEAD2449e8664; previous turn0115made product/evidence progress.51source/preserved hashes verified. No commit/push.0038追加驗證 remains paused without explicit identity confirmation.
- Scope: unify decoded CSS import discovery between Node dependency preparation and Rust graph resolution, including CSS URL escapes and local filename percent/query/fragment handling. Verify actual existing compileManifestFileSync and reference-file entrypoints.
- Asset emission investigation: existing file compiler returns a CSS string with no output location/public URL contract; CLI consumes stylesheet collection composition separately. Do not fake file delivery by returning unused fields or file:// URLs. Full graph/asset delivery remains required after this prerequisite.
- Status: bounded Node file/discovery fixes verified;31fixed/13unresolved,65checked/10blocked and4root gates remain.

## Changes and evidence

- Node dependency analysis and both Rust import-graph paths now share the existing CSS-token/Lightning import parser. CSS import names are case-insensitive and CSS escapes decode before provider lookup. Native/Wasm analysis and prepared edges therefore use the same specifier. Analysis retains its tolerant policy for malformed imports without losing later valid imports; compilation reports their parse error. Nested rules and strings/comments do not become import edges.
- Node filesystem adaptation uses URL pathname semantics: decoded CSS URL strings are resolved against the source file with Node URL/fileURLToPath, excluding query/fragment suffixes and decoding percent-encoded filename characters/extensions. Root-relative and scheme URLs remain external. Existing bare relative CSS files are expanded; unresolved bare package imports stay available to the host resolver. No TypeScript CSS parser or new dependency was added.
- Real file entrypoints now read sourceText from the resolved filename without stripping a literal `#` or `?` as if it were a virtual request ID. This fixes reference-file reads as well as the actual project-entry sourceText path. Virtual source-request normalization is unchanged.
- Public `compileManifestFileSync` remains the tested existing entrypoint, including its normal reference-context resolver. The prepared multi-asset graph still requires reference integration and emission; no new unused output field or fabricated delivery URL was introduced. Site directive guide documents the supported URL path behavior.

| Validation | Result / evidence |
|---|---|
| Original failure |6new testsFAIL before product changes: uppercase/escaped imports, encoded query paths, native/Wasm discovery agreement and encoded reference filename. [before](../evidence/0116-node-before.log) |
| Additional bare path failure |2FAIL/7PASS with bare local/encoded filenames before their final fix. Missing bare package import control added afterward. [bare before](../evidence/0116-bare-before.log) |
| Rust compiler |60PASS, including4new discovery groups; [Rust](../evidence/0116-rust-final.log) |
| Compiler host |167PASS, including10new public file/native/Wasm/path controls; [accepted](../evidence/0116-host-tests-accepted.log) |
| Actual file/browser |7cases ×3browsers ×2media =42PASS through existing compileManifestFileSync against native CSS controls. Includes bare paths, escapes, encoded extension, query/fragments and context-only reference rules. [browser](../evidence/0116-file-browser-accepted.log), [driver](../repros/node-import-discovery-browser.mjs) |
| Existing local conditions |96Chromium/Firefox/WebKit controlsPASS; [local](../evidence/0116-local-browser.log) |
| Legacy external imports |10native/Wasm cases agree;60controls21PASS/39FAIL, preserving21cascade errors/18known typed refusals. Expected assertion/exit1; [legacy](../evidence/0116-legacy-browser.log) |
| Downstream |MCP34PASS; [MCP](../evidence/0116-mcp-tests-final.log) |
| Build/checks |Compiler lint/types/buildPASS; compiler/native/compiler-Wasm all-target/all-feature Clippy, scoped Rustfmt/codegen/parityPASS. Rust crates have no npm lint. Built Node file smoke also passes. |
| Site |prepare-appPASS; site lint0errors/75warnings in unchanged files, no autofix. Only the actual directive contract prose changed. |
| Root gates |API census/package contracts remainFAIL with the same output hashes as0115. No golden update. Other root failures stay indexed. [root](../evidence/0116-root-checks.json) |

- The intermediate host suite163PASS/1FAIL and initial browser driver's pre-launch ENOENT identified the real remaining literal-`#` sourceText truncation, not a test setup error. Source reads were fixed; no fixture or assertion was weakened. Initial6failure evidence predates the encoded-extension and bare-path additions; it does not claim those added cases were run in the first attempt.
- Compiler-Wasm current7,022,534raw/1,558,713gzip/970,636brotli bytes; delta−653raw/−275gzip/+533brotli from saved immediate0115binary. SHA d6e9e27646295d0d777c3e190806f9ec0cf7dd9f412178281fd29b5fd5022a20. Runtime Wasm/JS/manifest hashes unchanged. No runtime benchmark: compiler/parser and Node filesystem adaptation only. Shared parsing adds compiler work per import; no speed improvement is claimed. [payload](../evidence/0116-payload.json).

## Direct continuation

1. Prepared Node discovery now uses the graph's decoded specifiers. Extract its filesystem preparation into a focused Node module before adding delivery; node-compiler.ts is near its800line limit. Reuse package/reference resolution and cycle/dependency handling, rather than duplicating them.
2. Design and connect a concrete output-location/URL and asset-emission contract to existing file/project/stylesheet consumers. CLI uses stylesheet collection composition separately; returning graph fields from the file API alone would not deliver CLI/build assets. Preserve CSS resource ownership, external relative import bases, reload dependencies and source diagnostics.
3. Resolve references into the prepared graph's resolution manifest with their own URL owners. Existing file references now resolve encoded filenames, but that is not the same as migrating prepared reference definitions and resource maps.
4. Validate real output files/resource requests and original60external/96local/21graph cases through migrated consumers. Retain native/Wasm agreement. Address original diagnostic ranges after resource edits, namespace interactions, nested compose, legacy string compose order, relative public output URLs and other remaining URL forms.
5. Keep31fixed/13unresolved,65checked/10blocked,4root gates and4unclassified candidates. BH-0004 remains partial.0038追加驗證 still waits for explicit identity confirmation. No commit/push; goal remains active.

- Final handoff: 8current source/material hashes and46preserved hashes verified; other Site/0092/0113–0115 work preserved. HEAD2449e8664, index empty, all observed tool handles terminal; no commit/push.
