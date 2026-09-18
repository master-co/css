# Batch 0212: Webpack optimized ownership

Bounded simultaneous removal and optimized ownership controls are verified. No new product change or finding ID. Counts remain61historical/57fixed/4unresolved,65checked/10blocked. Goal stays active.

## Start and scope

Previous0211turn made progress by delivering source reconciliation. All594sources/475artifacts matched that checkpoint at start. Only auditrepros and ledgers change here. `webpack-active-graph.mjs` now optionally deletes the resource, stylesheet orboth in the same synchronous edit turn as removing the JavaScript import, then restores unused files and reattaches the import. Every run uses actual native compiler.watch callbacks; no forced invalidation, sleeps, polling orWatchpack substitution.

## Simultaneous removal

| Scenario | Product steps | Pure steps |
|---|---|---|
| Stylesheet+resource, cache:false andmemory | 20PASS | 20PASS |
| Resourceonly, memorycache | 10PASS | 10PASS |
| Stylesheetonly, memorycache | 10PASS | 10PASS |
| Bothfiles withseparatevirtualmanifest, bothcachemodes | 20PASS | Notapplicable |

Total60product/40pure=100PASS. Each10-step sequence includes the original7detach/reattach controls followed by simultaneousdetach/delete,restoreunusedfiles,reattachrestoredfiles. Successful results verify noobsoleteCSS/resourcepublication, correctfile/missingdependencies, currentownedassets onreattachment andindependentmanifest retention. Only the listed event orderings and configurations are proved; arbitrary interleavings andotherhosts remain unfinished.

## Optimized graph control

New `repros/webpack-optimized-graph.mjs` creates a liveCSS entry and a separate JS owner explicitly markedsideEffects:false. That owner imports another CSS file andexports aconstant. The app always imports theowner; a directCSSimport independently toggles whether theotherwiseunused stylesheet is included. Bothcachemodes run against deliveredproduct andpureWebpack.

Fourruns each pass5output checkpoints: initiallyunused,activate directCSS,deactivate,restore missingunusedresource,reactivate. This gives20PASS. Theinactive stylesheet/resource is notpublished; activating itsdirectimport restoresboth. Actual module/chunk evidence records orphanedmodules atzerochunks whiletheyliveinthecompilationgraph.

An extraobservedcheckpoint deletes the resource while itsowner remainscompiled butoptimized out ofoutput. Bothproduct andpureWebpack report the missingresource andboth recoverafterrestoration:4matchinghostbehaviorobservations. Product error isENOENT whilepureWebpack reports itsunresolvedimport. These observations are notcounted as successfulcompilations. They establish why currentcompileddependencies mustnotbe blindlydeleted based onzerochunkmembership. This differs from0210,where theowner lefttheactualcompilationgraph andtheplugin alone retainedit.

## Harness correction

The initialoptimizedrepro assumed thatusinganexportedconstant wouldalsoactivate itsCSSsideeffects. Bothpureandproductinsteadinline theconstant andkeepthatowner/CSS atzerochunks. Bothinitialruns showed3PASS/2FAIL each, plus themissingresource observation. These are invalidexpectedactivation assumptions in therepro, notproductfailures. Finalcontrol adds anexplicitdirectCSSimport whenactivationisexpected; allfourconfigurations thenpass. Rawinitiallogs remainpreserved.

## Preservation

All475deliveredartifacts and19installedWatchpackfiles match0211/0209 respectively.593inheritedsources unchanged; onlytheexistingactivegraphrepro isextended, plusonenewoptimizedrepro. No production/packagefiles,fixtures/snapshots/existingtests,dependencies/lockfiles/CI/release orforeignSiteedits changed. Node syntaxchecks pass; package lint isnotapplicable to thisaudit-onlybatch. Allownedprocesses terminal; compilers/watchersclosed andtemporaryrootsremoved. HEAD3b5c98d61c6dc69ee3546d9d4f822e9e835f308e, emptyindex, nocommit/push/foreignhostrestart.

## Continuation

The next unverifiedresource snapshot boundary is concrete: `getBuildStylesheetDelivery().resourceURL` hashesreadFileSync(file), while `GeneratedCSSAssetsPlugin` laterreads thefileagain whenemitting it. A controlledwritebetweenthose reads can testwhether thehashedhref andpublishedbytes describe the same snapshot. This is notyet a confirmedbug; reproducebeforeediting.

Fulloptimized/shared/lazy/chunk/SSR/dev/Next matrices, arbitrarywatchinterleavings, BH-0004raw20qualified/39external, BH-0029/0051/0053,rootgates/platforms/Site/benchmarks and10blockedcoverage remainunfinished. Bothpendingpatchapprovals remain separate;0038stillwaitsforexplicitidentityconfirmation. All26priorremainingrequirements preservedverbatim in0212-final-checks.json, with thisboundedvalidation appended. Previouspartial/openstatements retain theirhistoricalmeaning.

Checkpoint: `0212-final-checks.json`, `0212-source-hashes-final.json`(595sources), `0212-artifacts-final.json`(475unchangedartifacts). Goalturnclassification: progress, notblocked orcomplete.
