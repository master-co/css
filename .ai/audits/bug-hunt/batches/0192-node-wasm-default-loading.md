# Batch 0192: Node default engine and compiler Wasm loading

- Completed bounded candidate verification; goal active. HEAD `c156b1433`; all 514 baseline source hashes and all 0191 artifacts remain unchanged. Only three new audit reproduction files and ledger/evidence changes; no product edits, rebuilds, commit or push.
- Public compiler `createCompiler({ binding: 'wasm' })` resolves the compiler Wasm package's `node` export to `dist/provider-node.js`. That provider reads default/file URL inputs as bytes before delegating to the browser provider. Root `tsconfig.json` instead maps this package directly to browser `src/provider.ts`; default TSX invocation honors that alias and attempts `fetch(file:)`.
- This excludes the longstanding standalone Node default/fileURL loader candidate as a harness module-resolution mismatch. It does not establish arbitrary browser/HTTP/custom-module input correctness. No new finding ID; 58 historical / 54 fixed / 4 unresolved remain.

| Control | Observed provider / result | Evidence |
|---|---|---|
| Bare Node, default input | Node provider; `.target{padding:2rem}`, no diagnostics | [default](../evidence/0192-node-default.log) |
| Bare Node, file URL object | Node provider; same CSS | [URL](../evidence/0192-node-file-url.log) |
| Bare Node, file URL string | Node provider; same CSS | [string](../evidence/0192-node-file-string.log) |
| Bare Node, cwd `/tmp` | Node provider; same CSS | [cwd](../evidence/0192-node-other-cwd.log) |
| Root TSX, explicit bytes | Browser source alias; same CSS | [bytes](../evidence/0192-tsx-bytes.log) |
| TSX, isolated package-conditions config | Node provider; default input works | [conditions](../evidence/0192-tsx-package-conditions.log) |
| Root TSX, default input | Browser source alias; expected `WASM_LOAD_FAILED` / `fetch failed` | [failure](../evidence/0192-tsx-before.log) |

- Reproduce: `node .ai/audits/bug-hunt/repros/node-wasm-default-loading.mjs`; set `BH_WASM_INPUT=file-url`, `file-string`, or `bytes` for controls. For TSX use `node scripts/with-typescript-tooling-compat.mjs pnpm exec tsx`; add `--tsconfig .ai/audits/bug-hunt/repros/node-package-conditions.tsconfig.json` before the reproduction path to preserve package exports. The TypeScript compatibility wrapper itself remaps legacy TypeScript compiler API imports, not package providers.
- The first new Node driver incorrectly asserted lowered compose output from `compileCSS`; initialization had already succeeded. Corrected this audit driver to the existing `compileManifest` API; [initial assertion failure](../evidence/0192-node-before.log) retained verbatim and not counted as a loader bug.
- Six positive controls plus the retained negative TSX control distinguish resolution from loader behavior. No package lint/test/build required for unchanged product files; audit syntax, context budgets, source/artifact hashes and empty index verified in [final checks](../evidence/0192-final-checks.json).
- Next: compiler/MCP `.mjs` discovery, then parallel Webpack shared-dist and legacy native compose candidates. All full graph/public/host migration, maps, 0190 custom include/cache exclude/config-error cleanup failures, four root gates, benchmarks, Vite native shutdown, WebKit cascade and Site revalidation remain unfinished. 0038 additional verification stays paused pending explicit identity confirmation; no confirmation received.

## Original engine candidate cross-check

- On tracing the original candidate to 0111 and `handoff-history-0130.md`, it names public `createEngine`, not `createCompiler`. The first compiler-only checkpoint was insufficient to exclude that original candidate. Expanded this batch before moving on; compiler controls remain supporting evidence, not a substitute for the named engine API.
- New [engine driver](../repros/node-engine-wasm-default-loading.mjs) directly calls built public `createEngine({ manifest, binding: 'wasm' })`, ensures `.paint{padding:2rem}`, disposes, then repeats initialization in the same process.
- Bare Node [root cwd](../evidence/0192-engine-default.log), [external cwd](../evidence/0192-engine-other-cwd.log), and [TSX package conditions](../evidence/0192-engine-tsx-conditions.log) all PASS, each with two engine sessions. Root [TSX alias control](../evidence/0192-engine-tsx-default.log) reproduces the original file-URL fetch failure. Engine package also exports a Node provider which reads default Wasm bytes.
- Final classification now covers the actual 0111 engine candidate as well as compiler: 9 positive process controls, 2 expected alias-resolution failures, 1 initial compiler-driver assertion error. No product change. Original candidate excluded only after these direct engine controls.
