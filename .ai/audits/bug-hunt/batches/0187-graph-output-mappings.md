# Batch 0187: Graph output mappings

- Bounded mapping/output repair complete; direct consumer migration remains unfinished.493sources match0186. Preserve Rust graph manifest/native-output separation and add original output mappings through imported URLs and compose slots. Then migrate direct rendered consumers without losing diagnostics, resources or namespace/import boundaries. BH0004/0053 remain open;53fixed/4unresolved,10blocked andall prior gates/candidates/host/Site/benchmark scope retained.0038identityconfirmation not received. No commit/push.

## Additional reproduced output failures

- BH-0058: raw marker replacement corrupts quotedcontent andomits actual composedstyle. RustbeforeFAIL;actual native/Wasmgraph6browserFAIL while9authored/directcontrolsPASS. Lexerbasedslotranges repairthis;firstafter15PASS. [Finding](../evidence/0187-marker-finding.json).
- BH-0057 reopened forgraph preserveNativeCSS:false: baremarkers losemedia/anonymouslayercontainers. NewRusttestFAIL;native/Wasmactualscreen6FAIL(16px instead of0),print/authored12PASS. Workingfix retainssuppressedparsertemplate;rebuiltvalidationpending. [Finding](../evidence/0187-suppression-finding.json).
- Originalsource-driver invocation underplainNodecompatloader failed onextensionlessTSimport;rerunwithinstalledtsx passed126graphbrowsercomparisons. Thisisaharness invocation error;rawlogretained.

## Final implementation and validation

- Added Rust output_edits to move output anchors through compiler-owned UTF16 edits without shifting authored ranges. Graph render carries import anchors and shifts following mappings when host URLs change. Resource relocation restores native anchors and slot definitions to original input. Slot definitions are refined in one batch; final replacements use actual lexer AtKeyword ranges. New compiledstylesheet outputMappings is generated through xtask template/protocol; host TypeScript performs no CSS semantic parsing.
- Graph preserveNativeCSS:false now asks the parser for its suppressed native template and retains actual enclosing media/layer containers. Import reachability/native selection logic remains; compose maps shift through retained import prefixes. This repairs the additional BH0057 failure.
- FinalRust111PASS;compiler316PASS/1retainedBH0004qualifiedimportFAIL;binding17PASS. Native/Wasm map equality checks cover long/Unicode importURLs,resource relocation andoriginalselector/compose ranges. Finalbrowsers:marker15PASS,suppression18PASS,21publicgraphcases126PASS. Earlierdefaultconditional180PASS isidentifiedseparately fromthefinalsuppressionbuild. Vite112PASS/6existingstartupreferenceFAIL;exactfailuretitlesmatch0183baseline.
- Binding/compilerlint/types,Clippy/fmt/codegen/parityPASS;Site reference13PASS,lint0errors/75warnings. Noengine/runtimebenchmark:compiler-only work/data added;fullprofiling remains. Onlynativebinary/compilerWasm artifacts change;engine/runtime/preset/all recordedJSbytes unchanged. [Checks](../evidence/0187-final-checks.json), [sources](../evidence/0187-source-hashes-final.json), [artifacts](../evidence/0187-artifacts-final.json).
-58historical/54fixed/4unresolved;65checked/10blocked. BH0058fixed;BH0057supplementaryboundaryfixed. BH0004/0029/0051/0053 andalloriginalgates/candidates/host/benchmark/Site requirements remain.0038identityconfirmationstillnotreceived. Goalactive;no commit/push.

## Direct continuation

- Extend existing Rust bundle/inlining output to carry the new graph mappings and preserve selected import/resource/namespace boundaries. Then route existingdirectfile/rendered/project consumers through graph manifest/native-output separation. The directqualifiedimportregression remainsfailing andmustnotbereplacedbyonlytestingtheworkinggraph API.
- Preserve original source/reference/hostmaps, resource ownership, native pruning and final asset publication. Rerun legacy60 external-import browsercases through migrated realconsumers and allqualified source-map regressions. Fourgates/fourcandidates/10blocked andfullscope remain listed in finalchecks.
