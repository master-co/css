# Batch 0185: Ordered direct output

- Bounded verification complete; BH-0057 fixed. All483baseline sources match0184. BH-0057direct order/layer failures:Rust2,TS1,browser9. Reuse Rust slot structure for direct lowering and maps, preserving metadata. No commit/push;0038identitypause andallprior requirements remain.

## Verified implementation

- Rust parsing now retains an optional ordered native output plan. Raw native CSS and the plan share the same parsed/lowered tree; slots are removed before printing the metadata view and retained for final assembly. The first working implementation parsed twice; this was replaced with shared-tree construction before final validation. Native-only inputs do not create a plan. Slot lookup and offset/mapping traversal avoid repeated whole-source scans.
- Existing lowerCSSDirectives request transport carries nativeOutput;Rust assembles finalcss andoutputMappings. Node anduniversal compileManifest use that result;the browserstylesheet wrapper already consumes universal result.css. GeneratedCSS/nativeCSS retain their metadata meaning. Node stylesheet maps chain the reordered offsets through original/Sass/import origins. No TypeScript CSS parser/ordering fallback. Codegen template updated andprotocol regenerated normally.
- Rust full106PASS, including prior2direct-order/layer regressions, exact original offsets,important/repeatedselectors,nativeCSSsuppression,marker-string collision andinvalid/overlapping ranges. Compiler311PASS/1newBH-0004qualified-managed-importFAIL;binding17PASS/schema3PASS. Native/WasmJSONroundtrip andinvalidplanerrors agree. Compiler/binding/schema lint andtypes,Clippy(alltargets/allfeatures),fmt/codegencheck/parityPASS.
- Actualbrowsermatrix180PASS/0errors: authored/directNode/universalnative/universalWasm/preparednative/preparedWasm,media/supports/container/namedlayer/anonymouslayer plusimportantandrepeatedselectors. Starting-style is validated structurally andvia mappings/transport, not by a static padding expectation.
- ActualNextorderedCSSModuleSasspartial:Turbopackdev/HMR3browsersPASS;Webpackproduction(withproductionBrowserSourceMaps)3PASS;finalservedmaps point to the authoredpartial,stylevalues surviveHMR andpage markerremains. Nextfull116PASS/3oldconfigshapeassertionFAIL; failuretitlesmatch0183. Vitescoped107PASS andWebpackserial74PASS. Nexte2e3PASS.
- Siteactualreferencegenerator consumescontract.mdx (oldcontent.mdxpath absent). Updatedtheexistingcontract andcompilerREADME to describe finalcss, rawmetadata, andtheunresolvedseparateimport-deliverylimits. Site reference13PASS;lint0errors/75warnings. No fullSitecompletionclaim.

## Failures and limits retained

- New qualified import regression remains underBH-0004:childmanageddefinitions become nested when the direct path flattens an anonymouslayer import, producingCSS_PRINT_ERROR withanexpandedsourceidentity. Direct failure alsooccurs without anycompose/orderedplan;native/Wasm preparedgraphs compile bothcases. Repro6observations:4preparedPASS/2directFAIL. The corresponding test remains failing;it was not replacedbyaneasier case. Addedseparateparent-definedutilitycontrol whichpassesoriginalchild/rootmapping assertions.
- That additional control initiallyput@utilitiesbefore@import, violatingimportordering;correctedfixtureordersimportfirst. This is a testsetup error, separatefromthepreservedqualified-managed failure.
- FirstscopedNode9tests had8PASS/1native-WasmcomparisonFAIL becauseconsumer validation startedbeforethependingWasm buildhandlewasconfirmedterminal. That log reflects mixedartifacts, notaproductbug. Finalbuilds wereconfirmedterminalbeforeconsumers;fulltests and180browserobservations use matching finalartifacts. InitialClippyunusedimport wasremovedafterlinearoffsetrefactoring;rawlogsretained.
- Noengine/runtimebenchmark run:onlycompiler parsing/lowering/outputtransport changed. Theplan addscompiler-onlytemplate/definition/mapping data andextra printing/assembly work;fullcompilerprofiling andalloriginalbenchmarkrequirements remain. Engine/runtimepayload preservation is checked by finalartifact hashes. No performance improvementclaim.

## Next handoff

- ContinueBH-0004qualifiedmanagedimports usingthe existing Rust graph definition/native-output separation, preserving conditions/layers,resourceowners,referencecontexts and originaldiagnostics/maps. Do notmove manageddefinitions acrossanimportboundarywithoutverifyingtheintended manifest/cascade semantics.
- Rerunthehistorical0112/0114legacy60browser matrix afterthisorderingchange;theold39failures are historical, notaproven current count. Fullhost/watch/recovery/base/assets/renderBuiltUrl/SSR/Nuxt andallprevious requirements remain.
- BH-0057 fixed;57historical/53fixed/4unresolved;65checked/10blocked. Fullscope retained in finalchecks. Goalactive;0038identityconfirmation stillnotreceived;0185uncommitted/no push.

## Final first-party callers and evidence

- Final caller review found Rust project and native mcss still concatenating metadata. Both now consume the complete ordered css. New project/CLI regressions initially2FAIL; expanded suites14PASS. NativeCLI before3browserFAIL(32px), after3PASS(16px), preserving one anonymouslayer and important cascade. Existing native-CSS suppression policy and graph-manifest-only branch remain unchanged.
- After native rebuild terminal: compiler311PASS/1retainedBH-0004FAIL, ordered180browserPASS, CLI3PASS andactualNextTurbopackHMR/productionWebpackmaps6PASS. CompilerWasm source/dependencies were unchanged by this project/CLI-only extension, so the prior completed compilerWasm build remains valid. ExpandedClippy andfmtPASS;xtask3PASS.
- 492source snapshot:483baseline sources,467unchanged/16intentionalchanges plus9newlytracked snapshot paths (including nativeCLI main). OnlycompilerWasm/native binaries andthreecompilerJSfiles differ from0184artifacts;engine/runtime/preset/JSCLI bytes unchanged. No speedclaim.
- [Final checks](../evidence/0185-final-checks.json), [sources](../evidence/0185-source-hashes-final.json), [artifacts](../evidence/0185-artifacts-final.json). Previous goalturn madeprogress by completing authorizedcommit75b348d07 of0183/0184audit materials; thisbatch remainsuncommitted.
