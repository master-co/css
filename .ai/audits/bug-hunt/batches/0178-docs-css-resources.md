# 0178 Docs CSS resource validation

- Previous goal turn made progress:BH-0039 specificity repaired with83tests and16original report variants;WebKit namespace differences isolated andretained.379sources match0177;HEADbdd9f25b8;index remains uncommitted/no new authorization.
- Scope BH-0040: reject or explicitly classify failed resources instead of reporting error documents as CSS. Verify status/MIME, redirected resource metadata, complete body reads andpartial failure behavior; retain all original public inputs and snapshots.
- Read current docs-page-css-size shared/suite/input and0071 evidence. Existing drivers overwrite0071 evidence, so use new stdout-only controls. Current code exempts404 from rejection anddrops status/content-type;other fetch failures alreadyreject. Preserve a strict complete-report contract rather than silently skipping failed assets.
- All4unresolved findings/10blocked/four root gates/four original candidates/native shutdown/WebKit namespace andpaused batch0038 identity verification remain unfinished pending evidence. No product/dependency/fixture/snapshot/CI/release changes.

## Reproduction and repair

- Fifteen focused current-source controls initially11FAIL/4PASS:404CSS/HTML is accepted,206partial bodies are counted,non-CSS ornon-HTML MIME is accepted,successful output omits observed metadata,body-read errors omit their URL,andpartialfailure behavior is untrustworthy. Existing403/500/network rejection controls remain useful baselines; no existing tests were edited.
- The collector now requires successful non-partial HTTP responses andexpected document/stylesheet MIME. HTML allows text/html orapplication/xhtml+xml; externalCSS requires text/css withcase-insensitive media-type matching andoptionalparameters. Missing/wrong MIME,404/403/500 and206 reject. This is an explicit strict diagnostic policy, not a claim that all browsers reject every missing-MIME orpartial response in every mode.
- Successful documents/assets retain HTTPstatus andContent-Type together with final redirected URL. Body reads remain under the request timeout andall fetch/header/body failures identify the requested URL andpreserve the underlying cause. Rejected response bodies are cancelled without obscuring the primary status/MIME failure.
- Page andexternal-resource groups wait for all started work to settle andthen aggregate errors. A failed required asset rejects the whole collection; no failedasset is silently skipped andno new partial snapshot is written. Existing snapshot input,sorting,size formulas anddefault transient output behavior remain. Report limits now state static inline/link scope,per-occurrence counting andindependently compressedasset sums; these are not browser transfer totals,applied-rule validation,dynamicCSS orCSS-import graph coverage.

## Verification

-98benchmark tests PASS (15new plus83existing),TypeScript noEmit PASS; no package-local lint script. Focused tests verify status/MIME,case+parameters,exactbodybytes,metadata,network/bodyerrorURL,andonefailedasset waiting for eight successful sibling fetches before rejecting the eight-page collection.
- Real HTTP controls:21PASS,5accepted/16rejected,all using the unmodified eight-page input mapped at the fetch boundary to an actual loopback server. Valid CSS,MIMEparameters,assetredirect,pageredirect andempty204 persist exactmetadata/raw/brotli sizes.404CSS/HTML,403,500,206,fourbad/missingMIMEs,failed/wrong-MIME documents,header/bodytimeouts,truncated bodies andmixed good/bad stylesheets reject without writing a new snapshot. Temporary timer/socket/server cleanup completes.
-24real browser controls PASS (eight response scenarios byChromium153.0.8010.12,Firefox155.0,WebKit26.6). Computed styles andactualCSSrulecounts distinguish appliedvalidCSS/redirects from404/500/HTMLerrorbodies andempty204. Stylesheet object existence is not used as a load-success signal. The unrelated WebKit namespace deviation from0177 remains unchanged andunclaimed here.
- Original live public suite PASS:all8unchanged document inputs,45inline/external assets. Allobserved documents are200HTML andexternal stylesheets200text/css; reported raw/brotli totals independently reconcile to assets andinline/external partitions. These point-in-time network results do not imply ranking,equivalentUI work orfutureavailability. Local deterministicHTTP controls establish body-byte correctness andfailure behavior; live totals are not compared to committed snapshots.
- Report-smoke PASS;two new repro scripts syntax-checked. No benchmark history,snapshots,generatedCSS,downloadedpages ortemporaryworkspaces retained;only audit stdout evidence. No intermediate repair failure was hidden orreclassified as aproductbug.

## Preservation and handoff

-382finalsourcehashes:379baseline,oneexistingbenchmarkcollector edit,one newtestfile andtwo newreprodrivers.151excluded product/test/foreign sources,fiveWasm/runtimeartifacts andthreeCLI builtfiles byte-identical. Originalfixtures/input/snapshots/dependencies/lockfile/CI/release unchanged.0177handoff preserved verbatim.
- BH-0040 fixed;47historical/44fixed/3unresolved:BH-0004/BH-0029/BH-0037.65checked/10blocked remain. Fulloriginalgraph/host/Sassmaps/virtual/reference/watch/recovery/base/assets/renderBuiltUrl/SSR/lifecycle/Nuxt/Webpack requirements,fourrootgates,fouroriginalcandidates,nativeimmediateclose shutdown andWebKitnamespace validation limitations remain unfinished. Recording an obstacle is not completion.
- Next0179:BH-0037 compiler/extraction diagnostic phases anddeclared-but-unsampled metrics; inspect actual public orchestration andmetric ownership before choosing instrumentation. Keep broaderbenchmarkhistory andalloriginalhost requirements in scope. Paused batch0038 additional validation still lacks explicit identity confirmation; do not resume it.
- Allcommands terminal;HEADbdd9f25b87305ab47437c30295d59ca6bb88f317,indexempty,no commit/push;goalactive. [Finalchecks](../evidence/0178-final-checks.json), [preservation](../evidence/0178-handoff-preservation.json), [summary](../evidence/0178-verification-summary.json).

## Evidence

- [Before11FAIL/4PASS](../evidence/0178-unit-before.log), [98tests](../evidence/0178-unit-fixed.log), [types](../evidence/0178-types.log).
- [21HTTP+24browsercontrols](../evidence/0178-http-controls.log), [original8publicpages/45assets](../evidence/0178-public-docs.log), [smoke](../evidence/0178-report-smoke.log).
