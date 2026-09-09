# 0118 CLI stylesheet delivery and shared Node preparation

- Starting HEAD927278b1c. Previous turn is progress: BH-0035 fix committed79eea0d8f, audit committed927278b1c, erroneous0117lint PASS corrected with actual passing rerun.61source hashes verified against0117plus its commit correction before edits.
- This batch advances BH-0004 through the actual CLI export consumer. Scope: reproduce exported CSS behavior and extract the existing Node filesystem/package graph preparation for its upcoming stylesheet-collection adoption. No claim that this refactor fixes delivery.
- Status: partial; BH-0004 remains unfinished.32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates remain open.0038additional verification remains paused pending explicit identity confirmation. No commit/push this batch.

## Actual consumer evidence

[Driver](../repros/cli-stylesheet-delivery.mjs) invokes the real CLI in owned temporary projects with `generate --output dist/output.css --verbose 0`, then serves the actual exported bytes to Chromium/Firefox/WebKit. Browser routes provide deterministic original CSS and resource responses; no live third-party service is claimed. It never transforms the exported CSS or substitutes graph API output.

| Case | Original browser control | Actual CLI export |
|---|---|---|
| Local CSS control | Red text | PASS all3browsers |
| Root-relative image control | Red text; /styles/image.svg200 | PASS all3browsers |
| External import only | Remote CSS requested, blue text | Exit0 but import removed; black text |
| External import after local | Remote CSS requested last, blue text | Exit0 but remote import removed; red text |
| Qualified local import with nested external | Valid browser CSS, red text | CLI exits1 with existing CSS_IMPORT_ERROR; no asset produced |
| Relative resource owner | /styles/image.svg200 | Exit0 but export requests /dist/image.svg404 |

- Source CLI and freshly built CLI each ran18comparisons:6PASS/12FAIL, with matching per-case CLI status and exact exported CSS. These are the same BH-0004 import-boundary/URL-ownership requirements, not new IDs.
- Initial four-case runs each12FAIL were preserved; two positive controls were then added, and both final six-case runs were executed. Every original browser expectation passed. The drivers intentionally exit1 on unresolved product behavior. No weakened assertions, invented passing output, or test-script failure is classified as a fix.
- [Source final](../evidence/0118-cli-browser-final.json), [source log](../evidence/0118-cli-browser-final.log), [built final](../evidence/0118-cli-built-browser-final.json), [built log](../evidence/0118-cli-built-browser-final.log).
- This proves more than the earlier file-compiler hoisting failure: stylesheet registration removes surviving external imports entirely. Relative resource rebasing also fails after output is moved to another directory. No-export/stdout, watch/reload and nonlocal platform matrices are still not covered by this batch.

## Implementation preparation

- Extracted existing package lookup, decoded CSS URL-to-file resolution and prepared files/edges traversal from `packages/compiler/src/node-compiler.ts` into internal `src/node-imports.ts`. The original compiler shrank to624lines; the new module is195lines.
- Existing file compilation now consumes this helper. The dependency-analysis callback is the same Rust-backed `analyzeCSSDependencies`; TypeScript still only supplies files and package resolution. No CSS parser, directive lowering or cascade algorithm was added in TypeScript.
- Existing import semantics, raw source overrides, original specifier keys, duplicate edges, package-expansion option and reference callbacks are retained. Existing `resolveMasterCSSPackageEntryFile` forwarding is retained for internal consumers. No new public API/export or generated contract changes.
- CLI/stylesheet delivery production code remains unchanged: `registerStylesheetSource` still flattens source then removes imports, and `compose` still returns a single CSS string. The helper extraction is a prerequisite, not completion of asset delivery.

## Validation

| Check | Result |
|---|---|
| Compiler full current host suite |167PASS |
| CLI full current host suite |34PASS |
| Compiler lint/types/build |PASS |
| CLI types/build |PASS; no CLI package source or test changed |
| Existing file-import discovery browser suite |42PASS, all3browsers/two media |
| Actual source/built CLI browser corpus |Each6PASS/12FAIL as above; all source controlsPASS |
| Root API census/package contracts |BothFAIL; outputSHA256identical to0117 |
| AI context/source budget |Final check recorded with this batch |

- [Compiler tests](../evidence/0118-compiler-tests.log), [CLI tests](../evidence/0118-cli-tests.log), [file browser](../evidence/0118-file-browser.log), [root hashes](../evidence/0118-root-checks.json).
- No new Rust change, native/Wasm rebuild or runtime/engine hot-path change in this batch. Existing built bindings are used. No performance benchmark or speed/payload claim; moving Node filesystem preparation does not change browser runtime behavior.
- All driver-owned projects and browser contexts disposed; all tool handles terminal. Prior compiler/binding/test/docs work and foreign Site files remain preserved except the intentional Node compiler extraction. No fixture/snapshot/dependency/lockfile/CI/release changes.

## Direct next steps

1. Use `prepareCSSImportGraph` from stylesheet registration/composition so it retains source files and import occurrences instead of flattening/removing them. Reuse Rust graph compilation for directive merging, native rule positions and import conditions; preserve extraction directives/native class registration.
2. Add real delivery planning in the host: stylesheet locations plus resource URL mapping based on each original source file. CLI must publish every returned stylesheet/resource and keep the final CSS entry usable at the selected output path. Current Rust resource mapping accepts only absolute/root-relative targets; relative sidecars need an explicit, validated delivery-base contract, not a relaxation that also breaks inline manifest CSS.
3. Connect references and original diagnostic locations; account for external URL bases and complete watch/reset dependencies. Validate multi-entry ordering, resource reload and no-export behavior.
4. Rerun this original source/built CLI corpus and earlier external-import60comparisons (39previousFAIL). Passing the new graph API or an error-only fallback cannot close BH-0004.

The overall goal remains active; other findings, four root gates, ten blocked coverage units and identity-gated0038requirements remain unfinished.
