# Master CSS 潛在 bug 調查

## 目標、範圍與限制

- 起始 commit：`e66ba7236e183046dfc071f190caa44ade0b95e9`；日期：2026-09-07。
- 原始主工作目錄與 internal 子模組乾淨；submodule commit `5bf7143d49ce6eaa1c345b3971bf99e1cd849c3c`。
- 覆蓋全部 workspace/crates/integrations/examples/site；詳見 [coverage](coverage.md)。
- 只新增/更新帳本、最小測試及重現；不改產品、既有 fixtures/snapshots、lockfiles、CI/release。原先不 commit；使用者後續明確授權提交已完成的調查、測試與證據，未完成狀態仍保留。
- 保留其他工作變更；每批核對相關 source hashes/HEAD，變動的舊結論標待重驗。
- 帳本是進度及結論唯一依據，當前原始碼與可重現證據決定行為。
- Markdown 約 320 行或 40 KiB 拆分；硬上限 400 行/48 KiB。
- 順序：Rust engine/CSS → compiler/contracts → server/runtime → extraction/scanner → language/ESLint → integrations → other/examples → site/support。
- 已檢查僅代表完成列明的檢查；受阻不計完成。

## 覆蓋與問題

- 75 單位：62 已檢查、0 進行中、0 未開始、13 受阻。
- 問題：[findings](findings.md), 43 confirmed (including benchmark tooling), 0 pending hypotheses; blocked coverage remains unfinished.
- 交付：[依嚴重度排序的報告](report.md)、[新增檔案與驗證限制](changes.md)。

## 批次索引

- [0001 Engine session](batches/0001-engine-session.md)：完成。
- [0002 Native CSS resources](batches/0002-stylesheet-resources.md)：完成，BH-0001/0002。
- [0003 Static resources](batches/0003-static-resources.md)：完成，BH-0003。
- [0004 Class boundaries](batches/0004-class-boundaries.md): completed.
- [0005 Project graph](batches/0005-project-graph.md): completed; BH-0004.
- [0006 Binding contracts](batches/0006-binding-contracts.md): completed, 7 targets blocked.
- [0007 Server render](batches/0007-server-render.md): completed; BH-0005/0006/0007.
- [0008 Runtime hydration](batches/0008-runtime-hydration.md): completed; BH-0008.
- [0009 Runtime mutations](batches/0009-runtime-mutations.md): completed; baseline 126 passed; BH-0009.
- [0000 完整盤點](batches/0000-inventory.md)：完成清單與環境基準。

- [0010 Source extraction](batches/0010-source-extraction.md): completed; BH-0010/0011.
- [0011 Scanner state](batches/0011-scanner-state.md): completed; BH-0012.
- [0012 Language IR](batches/0012-language-ir.md): completed; BH-0013/0014.
- [0013 Validator/lint](batches/0013-validator-lint.md): completed.
- [0014 Language service](batches/0014-language-service.md): completed.
- [0015 LSP lifecycle](batches/0015-language-server.md): completed.
- [0016 VS Code delivery](batches/0016-vscode-delivery.md): completed; real editor host PASS.
- [0017 ESLint](batches/0017-eslint-adapters.md): completed; BH-0015.
- [0018 Integration kernel](batches/0018-integration-kernel.md): completed.
- [0019 Vite stylesheets](batches/0019-vite-stylesheets.md): completed; 71 tests PASS.
- [0020 Vite runtime HTML](batches/0020-vite-runtime-html.md): completed; BH-0016.
- [0021 Webpack](batches/0021-webpack.md): completed; BH-0017.
- [0022 Next state](batches/0022-next-state.md): completed; 57 PASS.
- [0023 Next builds](batches/0023-next-builds.md): completed; 3 actual builds PASS.
- [0024 Next HMR](batches/0024-next-hmr.md): completed; Chromium PASS.
- [0025 Astro](batches/0025-astro.md): completed; 15 PASS.
- [0026 Svelte streaming](batches/0026-svelte-stream.md): completed; 14 PASS.
- [0027 Nuxt modes](batches/0027-nuxt-modes.md): completed; 8 host tests PASS.
- [0028 CLI discovery](batches/0028-cli-discovery.md): completed; BH-0018.
- [0029 CLI watch](batches/0029-cli-watch.md): completed; BH-0019.
- [0030 MCP contracts](batches/0030-mcp-contracts.md): completed; BH-0020.
- [0031 Create setup](batches/0031-create-setup.md): completed; BH-0021.
- [0032 Svelte addon](batches/0032-svelte-addon.md): completed; 19 PASS.
- [0033 Figma variables](batches/0033-figma-variables.md): completed; BH-0022.
- [0034 Browser examples](batches/0034-browser-examples.md): completed; 5 builds/browsers PASS.
- [0035 SSR examples](batches/0035-ssr-examples.md): completed; BH-0023.
- [0036 Angular/Laravel](batches/0036-angular-laravel.md): completed with Angular SSR blocked; BH-0024.

- [0037 ESLint examples](batches/0037-eslint-examples.md): completed; BH-0028, modern example blocked.
- [0038 Integration lab](batches/0038-integration-lab.md): BH-0029 confirmed; further host checks parked.
- [0039 xtask/parity](batches/0039-xtask-parity.md): completed; checks PASS.
- [0040 Root/shared](batches/0040-root-shared.md): completed;4 baseline failures recorded.
- [0041 Benchmarks](batches/0041-benchmark-harness.md): completed.
- [0042 Nested hosts](batches/0042-nested-hosts.md): partial; BH-0030, explicit blockers.
- [0043 Site internal](batches/0043-internal-site-support.md): completed21 PASS.
- [0044 Site content](batches/0044-site-content.md): completed65 tests PASS.
- [0045 Play](batches/0045-site-play.md): completed17 PASS.
- [0046 Site delivery](batches/0046-site-build-browser.md): prior-revision evidence; current state revalidated0047.
- [0047 Revision revalidation](batches/0047-revision-revalidation.md): completed; current site CSS contract/build/interaction checks PASS.

- [0048 CLI binding](batches/0048-cli-binding-selection.md): completed; BH-0026 confirmed.
- [0049 Webpack example asset](batches/0049-webpack-example-asset.md): completed; BH-0027 confirmed.
- [0050 Angular bundle](batches/0050-angular-bundle.md): completed classification; BH-0025 confirmed, Angular SSR remains blocked.
- [0051 Site syntax revalidation](batches/0051-site-syntax-revalidation.md): completed current-source revalidation;69+3 tests and build/CSS/browser controls PASS.
- [0052 Remaining prerequisites](batches/0052-remaining-prerequisites.md): reviewed; blockers and unclaimed residuals remain unfinished.
- [0053 MCP preview concurrency](batches/0053-mcp-preview-concurrency.md): completed; BH-0031 confirmed.

- [0054 Site browser matrix](batches/0054-site-browser-matrix.md): completed Firefox/WebKit controls; no new Site finding.
- [0055 Browser lifecycle metrics](batches/0055-browser-lifecycle-metrics.md): completed classification; BH-0032/0033/0034, measurement remains blocked.

- [0056 Next browser HMR](batches/0056-next-browser-hmr.md): completed; Firefox/WebKit hydration/cascade/5 HMR edits PASS.

- [0057 Vite browser HMR](batches/0057-vite-browser-hmr.md): completed; Firefox/WebKit4 controls PASS.

- [0058 LSP cancellation/settings](batches/0058-lsp-cancellation-settings.md): completed;18version/cancellation cycles and3settings/reopen controls PASS.

- [0059 VS Code settings](batches/0059-vscode-settings.md): completed feature controls;BH-0035 confirmed.

- [0060 Nuxt dev HMR](batches/0060-nuxt-dev-hmr.md): classification complete;BH-0036, original theme HMR remains blocked.

- [0061 Example browser matrix](batches/0061-example-browser-matrix.md): completed;10Firefox/WebKit controls PASS.

- [0062 SSR browser matrix](batches/0062-ssr-browser-matrix.md): completed;6Firefox/WebKit controls PASS.

- [0063 Laravel browser matrix](batches/0063-laravel-browser-matrix.md): completed;2Firefox/WebKit controls PASS.

- [0064 Compiler diagnostics](batches/0064-compiler-diagnostics.md): completed classification; BH-0037, four CSS consistency controls PASS.

- [0065 Extraction diagnostics](batches/0065-extraction-diagnostics.md): completed classification; BH-0037 extends, four CSS consistency controls PASS.

- [0066 Startup diagnostics](batches/0066-startup-diagnostics.md): completed classification; BH-0038, original report remains blocked.

- [0067 Vite startup](batches/0067-vite-startup.md): completed; four Vite diagnostic controls PASS.

- [0068 CSS output size](batches/0068-css-output-size.md): completed;16builds and artifact/sample checks PASS.

- [0069 CSS structure](batches/0069-css-structure.md): completed classification;16variant report produced, BH-0039 metric remains incorrect.

- [0070 Build diagnostics](batches/0070-build-diagnostics.md): completed8variant output checks; source-count semantics follow0072.

- [0071 Docs CSS size](batches/0071-docs-css-size.md): completed classification; BH-0040,8public pages fetched.

- [0072 Vite scan counts](batches/0072-vite-scan-counts.md): completed classification; BH-0041.

- [0073 Build cold/repeat](batches/0073-build-performance.md): completed32commands/16artifact checks PASS.

- [0074 Browser CSS cost](batches/0074-browser-css-cost.md): completed14variants/448samples/trace sums PASS.

- [0075 Master delivery modes](batches/0075-master-delivery-modes.md): classification complete; original report blockedBH-0032.

- [0076 Progressive diagnostics](batches/0076-progressive-diagnostics.md): classifiedBH-0032/0033/0034; original report remains blocked.

- [0077 Interaction cost](batches/0077-interaction-cost.md): classified;5static/four-mode controlsPASS, original reportblocked.

- [0078 Interaction array contract](batches/0078-interaction-array-contract.md): completed;BH-0042.

- [0079 Runtime mutation diagnostics](batches/0079-runtime-mutation-diagnostics.md): classifiedBH-0032/0042; original reportblocked.

- [0080 Style invalidation diagnostics](batches/0080-style-invalidation-diagnostics.md): classifiedBH-0032/0033;2staticchildrenPASS.

- [0081 Completion evidence audit](batches/0081-completion-evidence-audit.md): mapped75rows/16benchmarkentries; authorized local work remains.

- [0082 MCP multi-process](batches/0082-mcp-multiprocess.md): classifiedBH-0031;10overlaprounds/two controls.

- [0083 VS Code corpus](batches/0083-vscode-corpus.md): completed16selected hover/completion/language controls and13color-presentation sets.

- [0084 Stress DOM static](batches/0084-style-invalidation-static.md): two original children/72samples and trace controls;BH-0043 confirmed.

- [0085 MCP filesystem faults](batches/0085-mcp-filesystem-faults.md): four actual SDK permission/stale/retry controls; partial-write limitations classified.

- [0086 MCP process interruption](batches/0086-mcp-process-interruption.md): own-process termination/restart and1024file recovery controls.

- [0087 Completion prerequisites](batches/0087-completion-prerequisites.md): all75remainingrows preserved; first verified post-follow-up impasse observation.

## 目前交接點

- Latest0087 reconciles fullrequirements; resumedrun1, thirdfresh verified impasse observation. Goalblocked, notcomplete. Site current revision revalidated0051; full objective remains unfinished.
- Confirmed:43 (BH-0001..0043); latestBH-0043 cleanup benchmark falsely reports computed-style success.
- Pending hypotheses: none. Unfinished coverage includes13 blocked units and explicitly unclaimed residuals in0052.
- Next action: goalblocked again afterresumedrun1threefreshconsecutiveverifiedsame-impasse observations. Resumeaffectedoriginalcommands onlywhen theirrequiredhost/artifact/source/resource/authorization conditions change.13blockedunits/43findings andallremainingrequirements remainunfinished;0038needs explicituserverification. [State/history](evidence/0087-blocked-audit.json), [latestcheck](evidence/0087-resumed-1-check-3.json), [exactunblock steps](batches/0087-completion-prerequisites.md). Futureuserresumption starts afreshblocked-audit count; nevermarkgoalcompletefromrecordingblockers.
- Completion criteria for a follow-up: one bounded reproduction with a valid control, current source location, observed outcome, and synchronized batch/coverage/finding indexes. Preserve excluded assumptions and prior-revision evidence.
- HEAD3d2f47768c30e1678228fa04efcfc4b152e70120; internal169b5ee6f8b4ca9817fa82eb572e105a24f78d80. Semantic sources unchanged; site255 changed paths revalidated0051. Latest audit6044 hash entries, only superseded0044/0047 site snapshots differ; [0087 validation](evidence/0087-final-checks.json) and AI context check PASS.
- Additional 0038 Rspack/Rsbuild host checks parked after user-reported access banner; wait for user verification before resuming them. Classifier trigger unknown.
- Constraints: no production/fixture/lockfile changes; user subsequently authorized a commit of completed audit work, including its remaining-work records. Preserve external site/internal edits; seven nonlocal native targets blocked. If platform cyber access banner recurs, record the exact blocked action and continue other work; only resume that action after user reports verification passed. Existing security evidence needs no repeat.
