# 0054 Site Firefox/WebKit interactions

- Previous goal turn classified progress:0053 completed bounded concurrency evidence and changed the next action. Current HEAD3d2f47768 unchanged; all1555 current0051 Site source hashes match; foreign site changes preserved. Prior site package/AI and app-context remain current, routing/testing/docs packs read again.
- Scope existing search/navigation/Play/theme/tutorial/legacy redirect controls in Firefox and WebKit, with the0051 Chromium result as control. No repeated security tests, live service calls or paused0038 actions.
- Existing local browser launch/version probe recorded in [availability](../evidence/0054-browser-availability.json). No installation.
- Repro changes only: select browser engine/evidence prefix, reuse one fresh isolated site build for both engines; run CSS contract on output. Existing lint/content/type/dogfood source checks unchanged and already covered0051, so matrix mode does not repeat those checks. Normal harness mode preserved. Screenshots and each engine results get separate0054 filenames.
- Command: `BH_EVIDENCE_PREFIX=0054 BH_BROWSER_MATRIX=firefox,webkit BH_SYNTAX_MIGRATION=1 python3 .ai/audits/bug-hunt/repros/isolated-package.py site node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/site-build.mjs`. Results pending.

## First result

- Fresh static build/CSS1145-route contract/migration3 tests PASS. [Build](../evidence/0054-site-build.log). WebKit26.6 [interactions](../evidence/0054-webkit-interactions.log) all PASS. Firefox155.0 [interactions](../evidence/0054-firefox-interactions.log): search3 widths/tutorial3 widths/8 redirects/theme pixel checks PASS; Play times out only waiting for Monaco textarea visibility. No page errors.
- Firefox Play failure is not yet product evidence: the script subsequently edits via Monaco models, but awaited the implementation textarea as visible. Monaco's editor container and model readiness are the actual preconditions; textarea may intentionally be hidden. Corrected only audit observation to require visible editor container, attached textarea and HTML model; now rerunning Firefox with a fresh isolated build under0054-firefox-recheck. Existing first log and WebKit evidence preserved.

## Completed bounded matrix

- Corrected Firefox [build](../evidence/0054-firefox-recheck-build.log) and [interactions](../evidence/0054-firefox-recheck-firefox-interactions.log) exit0. Firefox155.0 + WebKit26.6 each pass3 search widths, visible Monaco editor + red→blue recompile,3 tutorial widths with16→24→16px padding,8 en/tw legacy redirects and light/dark pixel equality. Together with0051 Chromium153.0, all three installed engines cover these listed scenarios. No claim of every site page/locale/browser configuration.
- First Firefox textarea visibility timeout classified audit observation error: requiring visible editor container and ready model still proves UI readiness while avoiding an inappropriate implementation-textarea requirement. No production code changed.
- Screenshot review: [Firefox390](../evidence/0054-firefox-recheck-firefox-tutorial-390.png) and [WebKit1280](../evidence/0054-webkit-tutorial-1280.png) show readable controls and unclipped content at sampled widths. All6 engine/width screenshots retained.
- Current Site source hashes still match0051; no new finding. Original0051 content/lint/type/dogfood evidence remains valid; no need to rerun unchanged checks. Original and corrected isolated trees cleaned. Next0055 benchmark metric validity; active goal remains unfinished with blockers.
