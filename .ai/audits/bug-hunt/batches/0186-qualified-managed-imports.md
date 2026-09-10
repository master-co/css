# Batch 0186: Qualified managed imports

- Bounded verification complete; product repair remains unfinished. 492sources match0185final. Revalidate historical legacy60browser matrix, then inspect the direct qualified-child managed-definition failure. Use existing graph manifest/native-output separation, preserving authored source maps and resource ownership. BH-0004 remains unresolved;57historical/53fixed/4unresolved,10blocked,4gates/4candidates andall other requirements retained.0038still awaits explicit identity confirmation. No commit/push.

## Evidence and ownership

- Current native/Wasm legacy10cases agree. ActualChromium/Firefox/WebKit screen/print60comparisons:21PASS/39FAIL, split21wrongcascade/18typedrefusal. This freshly reestablishes the historical count after0185. Raw [log](../evidence/0186-legacy-import-browser.log) retains terminalassertion failure.
- Qualifiedmanaged matrix:6qualifiers ×compose on/off ×5paths=60observations;30PASS/30CSS_PRINT_ERROR. Directnative/directWasm/renderedNode each2unqualifiedPASS/10qualifiedFAIL;preparednative/preparedWasm each12PASS. Childmanifest retains paint andnativechild retains.card. All5nonemptyqualifiers fail withandwithoutcompose. Preparedcompilation success isnotfull delivery/browser/maps proof. [Driver](../repros/qualified-managed-matrix.mjs), [rawlog](../evidence/0186-qualified-managed-matrix.log).
- imports.rs resolve_css_import_graph_file wraps theentireauthoringchild;directives.rs onlyconsumesmanageddefinitions atstylesheet top level. Prepared compile_css_stylesheet_graph instead parses eachfile andmerges thegraph manifest while renderingnativeCSS initsownboundary. NativeConditionalLowerer handlesnativecompose/variant, notnestedmanageddefinitions. Therefore merely teachingnativeconditional traversal toconsume @utilities would changeauthoringsemantics andwouldnotrepairthelostimportboundary.

## Direct continuation

- Reuse graph manifest/native-output separation for existing directfile/rendered/project consumers. Graphoutput currently lacks outputMappings; extend Rust-owned mapping transport andexistingbundleinlining/delivery so original/Sass/reference maps andresource ownerssurvive. Do not rebuild aTypeScript CSS parser, silentlyhoist authoringblocks, orflatten unresolvedexternalimports intoinvalidnestedrules.
- Keep thecurrentqualifiedTSregression failinguntilreal fix;validate native/Wasm bothmetadata andbrowsercomputedCSS, alllegacy60externalconditions, namespaces,sourceanchors/references andresourcepaths beforeclaimingconsumer completion. Fullhost/watch/SSR/options/Site/benchmark/gates/candidatesremain.0038stillpaused withoutidentityconfirmation.
- All492baseline sources andall0185artifacts unchanged;newdriver only.57historical/53fixed/4unresolved,65checked/10blocked;goalactive,uncommitted/no push. [Finalchecks](../evidence/0186-final-checks.json).
