# 0126 Public file manifest asset delivery

- HEAD1c6595586. Previous goal turn made progress:0125Node project manifest graphs and production manifest-query delivery were implemented and verified. All98recorded0125source/preservation hashes matched before this batch.
- Scope: actual public `compileManifestFileSync` with explicit asset delivery URLs, references, native compose, resource relocation and real browser publication. BH-0004 remains partial. The existing no-delivery overload and other legacy consumers are not repaired by adding this route.
- Counts remain32fixed/12unresolved,65checked/10blocked,4root gates and4unclassified candidates.0038additional verification still awaits explicit identity confirmation.

## Requirement and existing capability discovery

- The public file result promises `css`, `nativeCSS`, `generatedCSS`, directive metadata and a manifest. MCP reads CSS byte summaries; server tests consume the manifest. Existing file tests exercise native CSS and compiled native compose. Therefore0125's manifest-only result cannot replace this API's CSS output.
- A single flattened string cannot retain all external import scope/order and local stylesheet resource bases. Inspected existing universal `compileStylesheets` and Node stylesheet collection delivery. Reused the existing Node filesystem/reference/resource preparation and Rust graph compiler; no new CSS semantics were implemented in TypeScript.
- Three initial tests through the actual public file API failed on qualified local imports containing external imports. The prospective delivery object was ignored by the old implementation; the same inputs with only existing supported options remain directly reproducible in the independent legacy control. [Original3FAIL](../evidence/0126-file-before.log), [current legacy control](../evidence/0126-legacy-file-control.log).

## Change and deliberate public contract

- A new `compileManifestFileSync` overload accepts `MasterCSSCompileManifestFileDeliveryOptions`, extending the existing file options with required `delivery`. The callbacks and resource contract reuse the existing stylesheet delivery types. Its `MasterCSSCompileManifestFileResult` extends the existing multi-stylesheet result and adds immutable `resources`.
- A small internal `compileDeliveredFile` entry prepares the original file graph, maps the actual entry to `delivery.entryURL`, and calls existing `compileGraph`. Imports, qualified native CSS, native compose positions, definition/reference lowering, and URL rewriting remain in the shared Rust graph compiler. Node performs filesystem/package/resource resolution.
- The result lists every required CSS asset including the entry, plus referenced resource files/hrefs. `css`, `nativeCSS`, and `generatedCSS` describe the entry only. The host must publish every returned asset before loading the entry; this compiler function does not write output or claim atomic publication/cleanup.
- Referenced stylesheets provide compose context without becoming published CSS assets. Resource dependencies used by referenced definitions are included and their source-owned relative URLs are rewritten with query/fragment suffixes retained.
- `preserveNativeCSS` retains the file API's defaultfalse: raw native CSS is omitted while compiled native compose and its import conditions remain. Explicittrue retains native rules. Distinct stylesheet URLs and available resource files are validated before any host publication.
- No-delivery calls continue to use the previous file implementation and remain subject to its external import limitations. This is an explicit API contract addition needed for actual CSS delivery, not a claim that every existing caller has migrated. Existing fixtures/snapshots and API goldens were not changed.

## Validation

| Check | Result |
|---|---|
| Focused public file controls |6PASS:3qualified imports,2native-preservation/reference-resource variants,1missing-resource/collision control |
| Compiler full suite |205PASS across23files |
| Compiler lint/type-check/build |PASS |
| Source public file API + actual published assets |66PASS:11cases×3browsers×screen/print |
| Built public file API + actual published assets |Same66PASS |
| Server/MCP/CLI downstream |67/34/71PASS |
| Existing no-delivery file API |3qualified external cases still fail; not closed |
| Root API census |FAIL, exact output hash unchanged from0125 |
| Package API golden |FAIL; adds the2deliberatepublictypes and updated compiler surface digest |
| Rust/native/compiler-Wasm/runtime artifacts |No Rust changes or rebuild;5compiler/runtime artifact hashes verified unchanged in final evidence |

- New tests validate caller entry URL, imported native CSS/compose, reference-only class exclusion, reference resource ownership, request suffix preservation, dependencies, immutable returned arrays/assets and absence of compiler output writes. Original3failures became2PASS/1FAIL due only to a new string assertion expecting `supports(display:grid)` while Rust emits `supports(display: grid)`. Whitespace-insensitive syntax assertion fixes this test error; actual browser comparisons separately prove conditions. [Intermediate](../evidence/0126-file-after.log), [focused](../evidence/0126-file-expanded.log), [compiler205](../evidence/0126-compiler-tests.log).
- [Browser driver](../repros/file-manifest-delivery-browser.mjs) reproduces the original10external-import cases through the public file API, supplies outputURLs, writes every returned CSS/resource file and serves their actual bytes to Chromium/Firefox/WebKit. It adds resource relocation with query/fragment suffixes and actual SVG requests. Source and built each have66comparisons/0failures; source-authored browser colors remain the control. It does not replace or weaken the original legacy corpus. [Source](../evidence/0126-file-browser-source.log), [built](../evidence/0126-file-browser-built.log).
- Latest full legacy60case corpus remains0125's21PASS/39FAIL; it was not rerun here because the no-delivery lowering path was unchanged. A direct supported-options public file control confirms all3qualifiedexternalrefusals remain. The new asset-delivery results do not establish legacy completion.
- [Server67](../evidence/0126-server-tests.log), [MCP34](../evidence/0126-mcp-tests.log), [CLI71](../evidence/0126-cli-tests.log). No downstream product source was changed.
- Compiler README and current directive `contract.mdx` explain host asset publication and remaining legacy limitations. The current checkout has no directive `content.mdx`; no obsolete page was recreated. Site prepare/lint and source/context preservation results are recorded in final checks.

## Costs, remaining work and direct handoff

1. Node file delivery reads the whole import/reference graph and resource files, performs URL callbacks, and returns multiple assets. Reference preparation can repeat work; no speed or memory improvement is claimed. No engine/runtime hot-path change or runtime benchmark; existing Rust graph implementation and5runtime/compiler artifacts remain unchanged.
2. Next migrate an actual existing CSS-producing consumer to this asset contract. Inspect `packages/compiler/src/stylesheet/index.ts` (`compileStylesheet`/`compileRenderedStylesheet`) and `public.ts`, plus Vite `style-entry-build.ts` and Webpack `stylesheet-loader.ts`. Reproduce a qualified external CSS import in the actual build path. Reuse the current prepared graph and asset publisher hooks; native stylesheet output must not be silently dropped or replaced with hoisting/errors.
3. Keep the no-delivery file overload, legacy internal file/project helpers, native CLI, `--no-export`, original39browser failures, inline resource bases, namespace/external URL-base forms, source policy ownership, unlocated diagnostics, watch dependency/source deletion and asset lifecycle work explicitly unfinished. A passing caller-supplied-delivery route is not the final migration.
4. Root package golden now additionally reports2intentionaltypes (`MasterCSSCompileManifestFileDeliveryOptions` and `MasterCSSCompileManifestFileResult`); API census is unchanged. Do not update existing golden/snapshots just to make it green. All4root gates remain open alongside12unresolved findings,10blocked coverage units and4unclassified candidates.
5.0038additionalverification remains paused for explicit identity confirmation. No commit/push. Preserve other conversations' Site changes, existing fixtures/snapshots, dependencies, lockfiles andCI/release.
