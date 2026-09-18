# Batch 0225: Next CSS Module import graphs

Opening checkpoint (historical): Previous goal turn made progress: candidate Turbopack graph loader restored authored file/line/column/content, and pure identity-loader control classified unresolved duplicate URI namespace. All649selectedsources/493sharedartifacts and47candidate sources/50candidate artifacts match at start. Rootunchanged; all40remainingentries inherited, pendingapprovals and0038pause retained.

Bounded verification: CSS Module imports of another `.module.css`, scoped class isolation and retained child CSS/resource rendering; compare actual pure Next and managed entry loaders in both bundlers. Do not assume native @import export inheritance or scope semantics; inspect pure host evidence before changing implementation. No ordinary parser/scoper fallback in TypeScript.

Initial harness resolved PostCSS from the integration package, where it is not directly installed (`MODULE_NOT_FOUND`); this is a test setup error, not a product finding. Corrected resolution to Next's own package location, matching the product's native processor capability discovery. Preserve first logs; rerun after their handles terminate.

Corrected pureNext unqualified `.module.css` imports: Webpack18PASS/Turbopack18PASS. Currentcandidate: each12PASS/6FAIL. Eachbrowser shows `.imported` globally applied (13pxmargin/blueSVG), while purehosts scope the retained child class. The childresource itself is present/decodable, so this is scopedModuleprocessing loss, not absentasset delivery. ExistingBH-0004; no newfindingID.

Capability discovery: Next css-loader uses getResolve with style conditions and css/style/main fields; compiler already accepts a source-bearing resolveImport callback. Native ICSS utilities offer extractICSS/replaceSymbols/replaceValueSymbols/createICSSRules. Preserve CSS import boundaries and delegate scoping/value/composition syntax; do not merely rename selectors after compilation or drop ICSS imports. Before selecting a graph preparation strategy, check plain `.css` imported by a Module in both native hosts, since inherited Module mode may differ from filename-based classification. Root/candidate products unchanged thisbatch.

Pure Module import of ordinary `.css`: Webpack18PASS, Turbopack12PASS/6strict-scope-oracleFAIL. Inspection shows native host semantics differ: Webpack inherits Module scope for the plain child, whereas Turbo leaves it global. Therefore those6pureTurbo results are an overly strict cross-host oracle, not a new product bug. Updated the owned harness to assert the observed per-host contract (global inTurbo, scoped inWebpack), preserving original logs andwithoutchanginganyexistingtest/fixture. Verifying managed plain-child behavior against that contract before choosing context-aware graph preparation.

## Final evidence and next action

Corrected native-policy matrix (three browsers,6checks/case):

| Host | Imported child | Pure Next | Candidate | Expected native scope |
|---|---|---|---|---|
| Webpack | `.module.css` |18PASS|12PASS/6FAIL|Module|
| Turbopack | `.module.css` |18PASS|12PASS/6FAIL|Module|
| Webpack | `.css` |18PASS|12PASS/6FAIL|Module inherited from importer|
| Turbopack | `.css` |18PASS|18PASS|Global|

All retained child resource checks pass; failing paths publish literal `.imported` and affect the unrelated ordinary class. Native ordinary CSS policy differs between hosts; the first pureTurbo6strict-oracleFAIL must not be classified as Master regression. Initial2PostCSSresolutionerrors are harness errors. Matrix links authoritative rawoutput/observations. This is additional evidence for BH-0004, not a new issueID or repaired finding.

No root or candidate product edits/builds this batch. Root649selectedsources differ only in the owned host repro;493sharedartifacts andcandidate47sources/50distfiles match0224. Prior128tests/3e2e/lint/types/build remain tied to those identical0224sources; no new package test run is claimed or needed for an audit-only harness expansion. All host handles terminal; temporary apps removed.

Next0226: derive the remaining host context rules using global-parent import controls, and exercise ICSS imported values/compositions before implementation. Use Next's existing getResolve/style resolution and vendored Module/ICSS processors with compiler's source-bearing resolveImport callback; model prepared nodes by both file and processing context, keeping original baseFile/sourceMap and dependencies. Webpack inherits Module mode; Turbo's plain-child policy is global. A simple `.module.css` filename filter or post-compilation selector rename would preserve wrong behavior. A prepared graph session should resolve ICSS symbols before opaque graph publication, preserve dependency CSS/order and root exports, and capture sources across both publication passes; do not drop ICSS imports or invent TS CSS semantics. Check native API capabilities first instead of assuming private helper exports. Then rerun actual import matrix, Modulecomposition/maps/global/Sass controls andrequired package checks beforepromotion.

All40previous remaining entries preserved verbatim plusone bounded update. Candidate must remain unpromoted even if the existingfour-test approval arrives; extra lightweight expected-value contract, Webpacktest/Watchpackdependency approvals and0038identity pause are independent andunchanged. Goalactive.
