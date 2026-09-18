# Batch0223: Next Module host capabilities

Opening checkpoint (historical): Priorgoalturnprogress:0222independentModulechecksconfirmemptyexportsandcorrectlightweightmarkeronlyinownedcandidate. All643sources/493artifacts andcurrentcandidatehashesmatchatstart. No rootapplication/commit/identityconfirmation;four-testapprovalstillawaitingreply,additionalmarkercontractunrequested. All38remainingentries inherited.

InspectexistingcompilerURLrelocationandNextModuleprocessorsbeforechoosinghandoff. Compiler'srelativeResourceURLsintentionallyallowsiblingassets;ordinarybundle relocationalsorequiresindependentURLs. Do notloosenguardtopatchhostwithoutanexplicitcorrectper-assetcontract. NextprovidesnativeLightningCSSandvendoredPostCSSModulesprocessors;directnativecontrolpreserves@master/@composewhileproducingModuleexports. ICSS :export hostcompatibilitycontrol next; nativehostprocessingmustpreservevalues,compositions,purity,mapsandgraphboundaries.

## Evidence checkpoint

- Pure ICSS `:export`: Webpack 9 PASS; Turbopack 0 PASS / 9 FAIL. Distinguish native host capability from Master product behavior.
- Owned candidate uses Next vendored PostCSS Module processors, purity checks and naming; Webpack receives ICSS exports, Turbopack receives native global/dependency compositions. No TypeScript CSS semantic fallback. Root product unchanged.
- Basic entry Modules: Webpack and Turbopack each 9 browser PASS. Cross-file plus global compositions, SVG decoding and generated padding: each 15 PASS in Chromium/Firefox/WebKit.
- Actual exported Module selector maps: Webpack 2 PASS; Turbopack 0 PASS / 2 FAIL, pointing to the intermediate `.master` CSS instead of authored Module. Keep BH-0053 unfinished.
- Direct preparation controls: 7 PASS including impurity rejection, source file/line/column/content and configured Webpack naming/ICSS value preservation. These do not imply actual Turbo ICSS support or full imported Module graph correctness.
- Candidate build, package lint and scoped noEmit type check PASS. Full suite still running at this checkpoint.
- Prepared `repros/next-module-host-candidate.patch` captures six product source differences relative to root; not applied. Prior four-test patch and additional lightweight expected-value patch retain their separate permission states.

Next bounded investigation: actual Turbopack graph CSS loader map handoff; inline map annotation alone is ignored. Inspect current guarded Turbopack rules and use host loader callback maps for owned generated CSS, preserving immutable metadata/dependencies and authored inputs. Also unfinished: imported CSS graph Module scoping, complete Sass/options/local/global/Lightning host behavior and dev/HMR/SSR; no promotion or completed finding.

## Final handoff

Full suite completed 127 PASS / 1 environment FAIL (`next` executable not found in owned playground). Re-ran only the failing original playground with process-local PATH pointing to the already-installed Next: 1 PASS. No install/config/lockfile/test change. Original e2e: 3 PASS. These are separate runs, not an invented single 128-PASS log. Candidate lint/scoped types/build PASS.

All owned processes terminal; host temporary apps removed. Root 493 selected shared artifacts unchanged; 642 inherited selected sources unchanged, one audit repro extended, three new repro/patch files. No root product, existing tests, Site, dependency, fixture, commit or index changes. Candidate source/dist inventories captured after all builders finished. Counts remain 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked. Previous38remaining entries retained verbatim plus one bounded supersession.

Next0224: verify and repair actual Turbopack final graph source maps through host loader map arguments. The current index content guard skips generated graph CSS without directives, and native parsing ignores its inline map. Prefer a precisely owned graph map handoff with immutable metadata/dependency checks. Do not broaden semantic processing or claim scoped Module browser success repairs maps. Full imported Module graph scoping, Sass/options/Lightning/ICSS/deployment/dev/HMR/SSR, test approvals and eventual root/delivered verification remain. Four-test approval alone still insufficient for promotion. Additional lightweight expected-value patch remains prepared, unrequested; Watchpack/test approvals and0038 identity pause remain separate.
