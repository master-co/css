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

- 75 單位：65 已檢查、0 進行中、0 未開始、10 受阻。
- 問題：[findings](findings.md), 44 historical confirmed findings; 31 fixed, 13 unresolved; blocked coverage remains unfinished.
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

- [0088 Example and Nuxt fixes](batches/0088-example-nuxt-fixes.md)：Angular/ESLint fixed; Nuxt tests and diagnostics in progress.

- [0089 Language and Nuxt](batches/0089-language-and-nuxt-validation.md)：4 additional fixes verified.

- [0090 Server HTML fixes](batches/0090-server-html-fixes.md)：3server fixes verified; downstream Nuxt follow-up.

- [0091 Installer imports](batches/0091-create-import-boundaries.md)：BH-0021 fixed,58tests PASS.

- [0092 Import conditions](batches/0092-import-conditions.md)：本機條件修復驗證完成，BH-0004仍有未完成邊界。

- [0093 Figma import](batches/0093-figma-import.md)：BH-0022修復，15tests及三瀏覽器built plugin/UI控制通過。

- [0094 Runtime CSP/frame](batches/0094-runtime-csp-frame.md)：BH-0008/0009修復，273browser tests與benchmark通過。

- [0095 ESM discovery](batches/0095-mjs-source-discovery.md)：BH-0012/0018修復，scanner/CLI/Vite驗證通過。

- [0096 CLI source watch](batches/0096-cli-source-watch.md)：BH-0019修復，新來源與排除/重載控制通過。
- [0097 CLI binding](batches/0097-cli-binding-selection.md)：BH-0026修復，native/Wasm選擇、reset與載入錯誤控制通過。

- [0098 MCP UTF-8 bytes](batches/0098-mcp-utf8-bytes.md)：BH-0020修復，preview/format/render/inspection大小與磁碟檔案一致。

- [0099 Svelte branches](batches/0099-svelte-branches.md)：BH-0011修復；BH-0010仍未完成。

- [0100 HTML references](batches/0100-html-character-references.md)：BH-0010修復，完整命名/數值參照及三瀏覽器對照通過。

- [0101 MCP concurrency](batches/0101-mcp-preview-concurrency-fix.md)：BH-0031修復；同token、跨程序、權限重試與中止恢復控制通過。

- [0102 ESLint escapes](batches/0102-eslint-javascript-escapes.md)：BH-0015部分修復；Vue外層HTML entity對映仍有2個失敗測試。

- [0103 Vue attribute mapping](batches/0103-vue-attribute-mapping.md)：BH-0015修復，291 ESLint測試與21三瀏覽器控制通過。

- [0104 Vite hydration URLs](batches/0104-vite-relative-hydration.md)：BH-0016修復；106tests與36三瀏覽器控制通過。

- [0105 Webpack runtime URLs](batches/0105-webpack-relative-runtime.md)：BH-0017修復；63tests與54三瀏覽器控制通過。

- [0106 Webpack fixed filenames](batches/0106-webpack-fixed-filename.md)：BH-0030修復；69tests、36檔名矩陣與3原playground瀏覽器控制通過。

- [0107 Animation syntax](batches/0107-animation-syntax-evidence.md)：22新增語法回歸19FAIL/3PASS，66瀏覽器語法對照PASS；BH-0001仍未修復。

- [0108 Animation syntax partial](batches/0108-animation-syntax-partial.md)：22syntax及native/Wasm/public/runtime驗證通過，但擴充9個value回歸仍5FAIL；BH-0001部分修正未完成。

- [0109 Animation value context](batches/0109-animation-value-context.md)：BH-0001修復，29value/87browser、42variable browser與runtime273通過。

- [0110](batches/0110-variable-syntax.md) Raw variable syntax：BH-0002修復，25cases/75browser、131RustPASS/2BH-0003FAIL、runtime273PASS。

- [0111](batches/0111-static-retention.md) Static retention：BH-0003修復，145Rust/132compiler/279runtime與72browser通過。

- [0112](batches/0112-external-import-order.md) External import order：native/Wasm10一致，60browser對照21PASS/39FAIL；BH-0004仍未修復。

- [0113](batches/0113-stylesheet-boundaries.md) Stylesheet boundaries：Rust graph/renderer初步實作，108browser與42Rust/132compilerPASS；既有public仍39FAIL，BH-0004未完成。

- [0114](batches/0114-compiled-stylesheets.md) Compiled stylesheets：共用manifest、保留native compose位置，native/Wasm公開compileStylesheets的126browser、50Rust/153compiler通過；BH-0004尚未接既有file/build入口。

## 目前交接點

- 本次依使用者「把已完成的部分 commit」指示，以 bece2e120 為父提交，僅提交 0113–0114 已完成的調查紀錄、驗證證據與重現材料。0092/0113/0114 的 compiler、binding、公開 API、測試及文件實作尚未完成整體交付，全部留在工作區；Site 其他工作亦不納入。證據描述的是來源雜湊所標識的工作區版本，重現腳本依賴尚未提交的 graph 原始碼與測試 corpus，不能在本次提交的乾淨 checkout 單獨重跑。45 個來源／保留雜湊均與 0114 最終記錄一致。BH-0004、13 個未解決問題、10 個受阻單位及四項 root gates 保持未完成；0038 追加驗證繼續暫停。未推送。

- 0114當前交接：Rust graph編譯與native/Wasm/同步Node公開compileStylesheets已接通，共用完成後manifest解析跨檔managed compose，保留每檔native規則與compose位置。21cases/126browser、50Rust/153compiler、binding17/Wasm4與build/lint/types/Clippy/codegen/parity通過；root API檢查仍FAIL，新增公開型別亦有golden差異。BH-0004保持未完成：下一步來源URL ownership/base、prepared reference/import discovery、既有file/project/stylesheet/build/CLI實際交付。[0114](batches/0114-compiled-stylesheets.md)。本批未提交，HEADbece2e120。

- 本次依使用者「把已完成的部分 commit」指示，以7e225b3da為父提交，納入0110–0111的BH-0002/0003完成修復、回歸測試、重現及0110–0112帳本證據。0112只代表追加診斷完成，BH-0004仍未修復；0092與0113的compiler產品/測試以及Site其他工作不納入，未推送。提交前確認完成來源與0112記錄的最終hash一致。
- 0113工作區接續點：Rust ordered stylesheet graph與URL renderer已實作，8新Rust groups、完整42Rust/132compiler及108三瀏覽器graph資產對照通過；保留重複邊、條件/layer、UTF-16、external及cycle行為。既有public入口重跑仍21PASS/39FAIL，BH-0004未修復。接著完成directive/native編譯、URL base保留、native/Wasm transport與compiler/project/stylesheet/build/CLI實際消費；不能以Rust-only API結案。[0113](batches/0113-stylesheet-boundaries.md)。所有本批修改未提交。

- 0112續查BH-0004：三瀏覽器60對照21PASS/39FAIL（21實際cascade錯誤、18既有qualified nested external拒絕）；native/compiler-Wasm10cases一致。新增重現與邊界保留實作路徑，未改產品；不能以hoist或明確error視為完成。
- 0111已完成BH-0003：static根節點保留完整依賴圖，inline中介只傳遞依賴；145Rust全通過，CSS72/compiler132/server67/runtime279及72三瀏覽器控制通過。本次納入提交，詳見0111。
- 0110已完成BH-0002：重用CSS tokens修復raw var()空白、註解、跳脫與名称邊界。75三瀏覽器author/raw控制、63public compiled控制及12預期語法拒絕、native/Wasm一致、CSS72/compiler127/server67/runtime273通過；來源與效能證據見0110。本次納入提交。
- 0109已完成BH-0001：原22syntax、29value及8variable groups通過；native/Wasm22、87value/42variable三瀏覽器、CSS72/compiler127/server67/runtime273通過。新產物/原失敗/效能代價均見0109；本次依使用者指示提交完成版本。
- 目標「執行並修正所有問題」持續active；已授權必要產品/範例修正，全部完成後才清理帳本。
- 44個歷史確認問題：31已修復、13未解決。已修復ID：BH-0001/0002/0003/0005/0006/0007/0008/0009/0010/0011/0012/0013/0014/0015/0016/0017/0018/0019/0020/0021/0022/0023/0024/0025/0026/0027/0028/0030/0031/0036/0044。
- 0094：runtime CSP native JSON import與iframe Document/ShadowRoot mutation修復；273browser tests、lint/types/build通過。標準Chromium benchmark前後均完成；global gzip減112bytes，manifest/Wasm hashes不變。原始benchmark history保留/tmp/mastercss-0094-{before,after}.{json,log}，不納入repo/commit。
- 0095：scanner及Node/native CLI.mjs來源發現修復；scanner80、NodeCLI28、RustCLI3、Vite99tests与3browser實際static build通過。上批0092新test缺baseManifest的型別錯誤已修正，3tests及下游型別檢查通過，最新test hash見0095。
- BH-0004仍部分修復：本機qualified/nested imports已驗證，但含未展開external import的條件/圖層/cascade保留未完成，目前明確回報限制，不能標fixed。
- 下一步BH-0004：依0114完成來源URL ownership/base、prepared references與decoded imports，將新graph編譯接到既有file/project/stylesheet/build/CLI入口；再用原public60對照、擴充21cases及0092本機96控制驗證。單一source字串直接hoist已證實錯誤；不得只改成error就結案。13已確認未解決、四root檢查失敗、10blocked及未分類候選保持。
- Integration lab0038追加驗證仍等待使用者明確確認身分驗證已通過；目標更新不是身分確認，不重試該追加驗證。
- 上次依使用者要求提交已完成部分：以dba77281f為父提交，提交0093–0095的5項修復（BH-0008/0009/0012/0018/0022）及已整理的帳本/證據。0092的compiler產品修改與測試仍保留未提交；其帳本與證據只記錄工作目錄的部分進度，不代表本提交包含該修復。其他工作site/next.config.js、site/AGENTS.md、site/CLAUDE.md保持原樣。未改fixtures/snapshots、依賴、lockfile、CI/release。
- 目前HEAD b056fbf33已提交0096–0100的5項完成修復（上次使用者提交指示）：BH-0019/0026/0020/0011/0010，包含必要產品修改、回歸測試與帳本/證據。來源及測試雜湊均與各批最終驗證一致。0092 compiler部分修復及Site其他工作不納入。
- 待查候選（尚未建立問題ID）：compiler diagnostics與MCP resolveSourceFiles的預設glob仍缺.mjs，需實際inspect/scan確認；Webpack parallel suite共享dist失敗；0111獨立Node public createEngine(binding:wasm)預設file-URL fetch失敗，需核對預設載入契約。0114另留legacy string compiler的native @compose插入位置待直接入口分類；新graph位置修復不等於舊入口完成。指定bytes成功或已記錄限制均不能將這些候選結案。
- 0099已完成BH-0011：走訪Svelte else/await分支；tooling208tests加原始回歸、lint/types/build與三瀏覽器static分支互動通過。BH-0010當時仍FAIL，現已由0100修復；新scanner測試缺manifest已修正，不列產品問題。所有command/browser jobs已terminal，暫存專案已清理。
- 0100已完成BH-0010：Rust HTML attribute解碼與token讀取；23312cases三瀏覽器/native/Wasm一致、Rust14/tooling212/CLI34/inspection4/Vite99及實際static browser通過。本次提交包含產品/測試/帳本；所有jobs terminal。Tooling Wasm gzip增14360bytes，runtime engine Wasm hash未變；資料表無新依賴。
- 0101修復後仍保留20未解決與10blocked coverage，不清理帳本、不推送。未修改fixtures/snapshots、依賴、lockfile、CI/release；Site其他工作hash保持原樣。
- 0101已完成BH-0031：同步認領token、同OS帳號的local filesystem gate包住hash驗證與寫入；MCP34tests/lint/types/build、built stdio20rounds、260critical sections及實際權限/中止恢復控制通過。MCP產品/README/測試與帳本修改尚未提交，所有jobs terminal。多檔案寫入仍可能部分完成；外部editor/networkFS/cross-user不在此鎖保證內。
- 0102歷史狀態（已由0103完成）：JavaScript cooked分析/UTF-16來源對映與修正編碼已實作；完整plugin269PASS/2FAIL，兩個Vue HTML entity＋JS escape回歸仍失敗。暫停AST raw不等於source時的autofix以避免錯誤替換，不能視為修復完成。Lint/types/build與config4tests通過；產品/測試未提交，所有jobs terminal。下批沿用BH-0015與現有兩個失敗測試，詳見0102，不略過外層對映。
- 本次依使用者指示提交0101與0102–0103的兩項完成修復（BH-0031/0015），包含產品、測試、重現與帳本證據，以b056fbf33為父提交。0092 compiler部分修復及Site其他工作保留未提交；未推送。0103完整ESLint291/tooling215/binding17/config4/Rust18與21browser控制通過；詳見0103。
- 現在HEAD5dc6f2ad1已提交0101–0103；0104 BH-0016修復尚未提交。Vite106tests/lint/types/build、36built三瀏覽器JSON載入與mutation控制、原Vite範例build通過。所有jobs terminal；0092 compiler與Site其他工作保持原樣。
- 0105 BH-0017修復未提交：每頁asset href與runtime entry auto publicPath涵蓋JSON/Wasm/chunk；Webpack63tests（serial）/lint/types/build、54三瀏覽器控制與原範例build通過。首次parallel suite在既有dist重建期間1FAIL，疑似共享dist測試競態，未聲稱已修復；續跑本套件使用--no-file-parallelism並保留未完成harness調查。
- 0106 BH-0030修復未提交：固定/build-wide/callback檔名使用獨立content-hashed runtime，app及chunk-specific樣板保留。Webpack69tests serial/lint/types/build、36檔名矩陣與3原playground三瀏覽器控制通過。官方playground命令仍exit127缺webpack，舊fallback另有loader/alias問題；新API控制不是修好官方依賴環境。SUP-nested-hosts保持blocked。所有jobs terminal，0104/0105修復、compiler0092與Site其他工作保留。
- 0107僅新增證據/測試，未改產品：原resource tests1PASS/3FAIL，新animation syntax3PASS/19FAIL，engine36baseline及Clippy通過。不要用skip quotes的局部補丁或現有declaration scanner直接掃全檔冒充完成；詳細能力差距與native/Wasm/performance驗證下一步見0107。所有jobs terminal，既有工作hash不變。
- 本次依使用者指示，以5dc6f2ad1為父提交，提交0104–0106三項完成修復BH-0016/0017/0030及必要測試、重現、帳本證據；0107已完成的語法調查與明確失敗回歸亦納入，但不代表BH-0001修復。20項0104–0106來源雜湊均與最終驗證一致。0092 compiler及0108 engine/lexer部分實作與其新材料、Site其他工作保留未提交；未推送。0108 native已重建，engine Wasm仍為舊產物，續作需先重建Wasm再做一致性驗證；所有先前jobs已terminal。28fixed/16unresolved與10blocked不變，0038追加驗證仍暫停。
- 0108歷史交接（已由0109取代）：HEAD e71cce539已提交0104–0106完成修復與0107調查；0108當時未提交。Native及engine Wasm已重建且22語法控制一致；9個value控制4PASS/5FAIL、三瀏覽器12PASS/15FAIL，舊Wasm18PASS/9FAIL，具體差異見0108。Engine Wasm gzip增4503bytes，global/manifest不變；benchmark history僅留/tmp。所有jobs terminal，0092 compiler與Site其他工作雜湊保持，其他未完成/blocked項目不變。
- 0109驗證時HEAD為e71cce539；本次以其為父提交，提交0108–0109完成的BH-0001修復、測試、重現與帳本證據。Native、engine Wasm及compiler Wasm已重建；最終engine Wasm gzip比原始基準增22484bytes，global/manifest不變。專用resource與標準runtime benchmark history只留/tmp；效能是已記錄代價，非加速宣稱。其他compiler0092/Site工作保持原樣，0038追加驗證仍暫停。
- 提交時歷史（0110狀態已由上方完成證據取代）：提交內容逐檔符合0109最終來源雜湊。工作區另有0110 BH-0002部分修改：原始失敗已重現、focused Rust通過，但新browser driver在public compiler入口終止，尚未完成瀏覽器與下游驗證；0110產品/測試/重現/證據均不納入本提交。0092 compiler與Site其他工作亦保留未提交；未推送。續作先讀0110既有log並分類compiler錯誤，不將focused通過視為BH-0002完成。
- 0110歷史交接：HEAD7e225b3da已提交0108–0109；0110修復/測試/證據未提交。Wasm比0109減2353raw/687gzip/810brotli bytes，JS/manifest不變；resource及runtime benchmark均完成，history只在/tmp。所有jobs terminal；0092 compiler及Site其他工作雜湊保持原樣。
- 最新HEAD7e225b3da；0110–0111完成修復與測試/證據未提交。0111 Wasm比0110減982raw/878gzip/267brotli bytes，JS/manifest不變；static initialization與標準runtime benchmark完成，原始history只在/tmp。所有jobs terminal，0092 compiler與Site其他工作hash保持原樣。
- 0112只有重現/帳本更新，HEAD7e225b3da不變；0110–0111完成修復、0092部分修改與Site其他工作hash皆保持。所有jobs terminal，未提交。
- 舊批次為歷史，當前依最新批次、來源及證據；65checked/10blocked coverage未改成全完成，尚不清理帳本。
