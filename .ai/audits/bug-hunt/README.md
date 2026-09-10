# Master CSS 潛在 bug 調查

## 目標、範圍與限制

- 目前持續目標「執行並修正所有問題」；沿用後續已授權的必要產品／範例修正，完整證據通過才結案。未再次授權不提交；以下起始調查限制保留為歷史。
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
- 問題：[findings](findings.md), 47 historical confirmed findings; 45 fixed, 2 unresolved; blocked coverage remains unfinished.
- 交付：[依嚴重度排序的報告](report.md)、[新增檔案與驗證限制](changes.md)。

## 批次索引

- [0000–0084 歷史批次索引](batch-index-history-0172.md)：原文與所有批次連結逐字保留。

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

- [0115](batches/0115-resource-url-ownership.md) Resource URL ownership：來源檔案URL在manifest合併前映射，56Rust/157compiler、3browser資源與126graph控制通過；既有入口仍39FAIL，BH-0004未完成。

- [0116](batches/0116-node-import-discovery.md) Node import discovery：既有file入口已修復大小寫／跳脫import、編碼檔名、query/fragment與bare local paths；60Rust/167compiler/MCP34、42新browser及96local控制通過；完整資產交付仍未完成。

- [0117](batches/0117-vscode-settings-restart.md) VS Code settings restart：BH-0035修復，缺少／已註冊／失敗／移除optional command的實際host控制、完整設定切換與31tests通過。

- [0118](batches/0118-cli-stylesheet-delivery.md) CLI stylesheet delivery：actual CLI失敗已直接驗證；Node準備流程抽出，完整交付未完成。

- [0119](batches/0119-cli-asset-delivery.md) CLI asset delivery：source/built各18browser及37CLI tests通過；BH-0004其他入口仍未完成。
- [0120](batches/0120-standalone-output-modes.md) Standalone output modes：16選項組合／96browser與185compiler通過，空import圖層順序修正；BH-0004整體仍未完成。

- [0121](batches/0121-original-source-diagnostics.md) Original diagnostics:194compiler/65Rust PASS; original file/range restored; BH-0004 remains partial.

- [0122](batches/0122-watch-dependency-recovery.md) Watch recovery:6process cases,43CLI/194compiler and24browser controls PASS; publication/cleanup remain unfinished.

- [0123](batches/0123-immutable-cli-publication.md) Immutable CLI publication:52CLI and42built/source publication/export browser controls PASS; cleanup remains unfinished.

- [0124](batches/0124-cli-asset-ownership.md) CLI asset ownership:71tests,90browser controls and240multiprocess sections PASS; legacy consumers remain unfinished.

- [0125](batches/0125-project-manifest-graphs.md) Project manifests:199compiler/9Rust and18production manifest-query browser controls PASS; legacy39failures remain.

- [0126](batches/0126-file-manifest-delivery.md) Public file asset delivery:205compiler and132source/built browser comparisons PASS; no-delivery/legacy consumers remain unfinished.

- [0127](batches/0127-build-publication-boundaries.md) Actual builds:6build/24browser failures; graph-segment proof18PASS; newBH-0045 final CSS hash/cache bug confirmed.

- [0128 Vite final CSS hashes](batches/0128-vite-final-css-hashes.md)：BH-0045 fixed;110tests,39output and36hydration controls PASS.

- [0129 Rust bundle composition](batches/0129-rust-bundle-composition.md)：71Rust/205host/48browserPASS; actual adapter migration remains unfinished.

- [0130 Bundle source context](batches/0130-bundle-source-context.md)：75Rust/205host/84browserPASS; transports and actual adapters pending.

- [0131 Public bundle transport](batches/0131-public-bundle-transport.md)：209host/75Rust/174browserPASS; actual adapters remain unfinished.

- [0132 Vite graph publication](batches/0132-vite-graph-publication.md)：actual Vite8builds/48browserPASS; Webpack3build/12browserFAIL, other Vite host capabilities pending.

- [0133 Vite host file resolution](batches/0133-vite-host-file-resolution.md)：218compiler／110Vite／36host browser PASS；virtual/preprocessor與其他交付仍待完成。

- [0134 Vite alias pruning](batches/0134-vite-alias-pruning.md)：裁剪回歸修復，219compiler／110Vite PASS；virtual／Sass仍1build／18browser FAIL。

- [0135 Vite virtual sources](batches/0135-vite-virtual-sources.md)：223compiler／110Vite、virtual30與watch54 PASS；Sass仍1build／6browser FAIL。

- [0136 Vite Sass sources](batches/0136-vite-sass-sources.md)：225compiler／114Vite、原78與Sass84browser／watch54 PASS；managed-inline6FAIL。

- [0137 Inline CSS delivery](batches/0137-inline-css-delivery.md)：83Rust／227compiler／118Vite、198public／84inline／90Sass／36watch browser PASS；其餘BH-0004邊界未完成。

- [0138 Inline asset pruning](batches/0138-inline-asset-pruning.md)：Vite121／30browser／18watchPASS；原inline84矩陣全PASS。

- [0139 Inline server hosts](batches/0139-inline-server-hosts.md)：Vite125／SSR36／worker6／inline84browser與16Node loadsPASS；完整BH-0004仍未完成。

- [0140 Inline built URLs](batches/0140-inline-built-urls.md)：Vite131／180final browser PASS；URL映射、檔名與paired asset回歸已修，其他BH-0004需求未完成。

- [0143](batches/0143-module-dependency-watch.md) Module dependency watch：限定更新／巢狀錯誤恢復驗證完成；刪除／改名及dev/HMR待續。

- [0144](batches/0144-module-missing-dependencies.md) Module missing dependencies：直接刪除／改名控制通過；巢狀host終止仍未完成。

- [0145](batches/0145-module-development-hmr.md) Development Modules HMR：entry／local、直接／巢狀更新通過，其他request modes及missing recovery待續。

- [0146](batches/0146-development-style-requests.md) Development requests：共用manifest HMR修復驗證通過；Sass URL更新仍3FAIL，待續。

- [0147 Sass URL HMR](batches/0147-sass-url-hmr.md)：限定URL更新驗證完成；其他交付未完成。

- [0148 Module request modes](batches/0148-module-request-modes.md)：inline/raw已驗證；url主機拒絕，交付仍未完成。

- [0149 Sass partial recovery](batches/0149-sass-partial-recovery.md)：普通Sass限定恢復完成，多環境與其他交付待驗。

- [0150 Sass environments/restart](batches/0150-sass-environments-restart.md)：環境與新請求驗證完成，live reconnect待驗。

- [0151 Live/middleware restart](batches/0151-live-middleware-restart.md)：一般server重連驗證完成；middleware已重現，仍未修復。

- [0152 Middleware lifecycle](batches/0152-middleware-lifecycle.md)：正常清理模式修復驗證通過；其他交付仍未完成。

- [0153 Custom environment close](batches/0153-custom-environment-close.md)：初始環境獨立關閉修復通過；動態／共用instance仍待驗。

- [0154 Environment replacement](batches/0154-environment-replacement.md)：替換環境與hook邊界修復通過；共用instance待驗。

- [0155 Shared plugin roots](batches/0155-shared-plugin-roots.md)：多root隔離修復驗證通過；qualified pre-render交付待修。

- [0156 Emitted globals graphs](batches/0156-emitted-globals-graphs.md)：metadata／production修復通過，dev交付仍未完成。

- [0157 Development runtime base](batches/0157-runtime-development-base.md)：BH-0046修復與三瀏覽器驗證完成；BH-0004仍未完成。

- [0158 Development shutdown](batches/0158-development-shutdown-classification.md)：關閉候選有界分類；主機限制仍未解，CSS調查可正常收尾。

- [0159 Development stylesheet graphs](batches/0159-development-stylesheet-graphs.md)：有界查核完成，BH-0047已修復；BH-0004完整交付仍未完成。

- [0160 Development resource lifecycle](batches/0160-development-resource-lifecycle.md)：有界查核完成；BH-0004其餘交付仍未完成。

- [0161 Resource snapshot and recovery](batches/0161-development-resource-recovery.md)：有界查核完成；BH-0004完整交付仍未完成。

- [0162 Retained graph environments](batches/0162-development-graph-environments.md)：有界查核完成；BH-0004其餘交付仍未完成。
- [0163 Local compose graph delivery](batches/0163-local-compose-graph-delivery.md)：compiler交付已驗證；Vite child compose仍8FAIL，接完整assets發布。
- [0164 Vite local graph publication](batches/0164-vite-local-graph-publication.md)：原8FAIL修復；279tests／252browser通過，其餘輸入及lifecycle待續。
- [0165 Imported local directives](batches/0165-imported-local-directives.md)：plain-root漏判已修；242compiler／295Vite tests及360browser通過。

- [0166 Local URL delivery](batches/0166-local-url-delivery.md)：三個交付缺口已修；338tests／324browser通過。

- [0167 Imported module exports](batches/0167-imported-module-exports.md)：local CSS跨檔exports修復驗證完成；350項Vite測試／516browser PASS，Sass與其他邊界續驗。

- [0168 Sass Module import contexts](batches/0168-sass-module-import-contexts.md)：相同Sass輸出及子檔診斷修正通過386tests／600browser；缺失原始map等邊界仍保留。

- [0169 Benchmark Wasm delivery](batches/0169-benchmark-wasm-delivery.md): BH-0032 fixed;42 browser controls,5 tests and3 original reports complete; remaining readers next0170.

- [0170 Runtime snapshot readers](batches/0170-benchmark-runtime-snapshot.md): bounded readers/guards verified;9tests/36browser controls; BH-0033 private preparation/cleanup remains.
- [0171 Runtime preparation](batches/0171-benchmark-runtime-preparation.md): BH-0033 fixed;12tests,36browser controls and48 original diagnostic variants verified.
- [0172 Native CSSOM traversal](batches/0172-benchmark-cssom-traversal.md): BH-0034 fixed;15tests,60 browser controls and72 original report-page comparisons PASS.
- [0173 Runtime arrays](batches/0173-benchmark-array-instrumentation.md): BH-0042 fixed;19tests,72browser controls and48 original diagnostic variants verified.
- [0174 Style validity](batches/0174-benchmark-style-validity.md): BH-0043 fixed;120browser controls,48 diagnostic positive/144negative gates and original reports verified.
- [0175 Startup imports](batches/0175-benchmark-startup-import.md): BH-0038 fixed;8original variants/292samples and four actual CLI entry controls PASS;unsampled Vite metrics remain.
- [0176](batches/0176-benchmark-vite-observation.md) Vite observations: BH-0041 fixed; unique scanner files and environment hook timings,16 report variants/404samples,12real scanner controls.
- [0177](batches/0177-benchmark-specificity.md) Specificity:BH-0039 fixed;83tests,16report variants/84artifacts;WebKit namespace differences explicitly retained.
- [0178](batches/0178-docs-css-resources.md) Resource validation:BH-0040 fixed;98tests,21HTTP/24browser controls,8publicpages/45assets;strict complete snapshot andobserved metadata.
- [0179 Diagnostic phases](batches/0179-diagnostic-phases.md)：BH-0037報告契約修復，實際公開操作／產物與consumer核對完成；內部profiling及其他覆蓋仍有限制。
- [0180 Imported Sass maps](batches/0180-imported-sass-source-maps.md)：原始maps修正，441tests／600browser通過；BH-0004整體仍未完成。
- [0181 Virtual reference ownership](batches/0181-virtual-reference-ownership.md)：baseFile 解析修復，253compiler／457Vite／96browser 通過；partial／恢復與其他 BH-0004 邊界仍待驗證。
- [0182 Sass partial references](batches/0182-sass-partial-references.md)：原始map與additionalData鏈結修復；269compiler／479Vite／120browser通過，host缺檔恢復等仍待驗證。

## 目前交接點

- 使用者再次授權提交已完成部分：0179的8個Benchmark程式／測試檔已提交 `d572f6bed`，本次重跑101tests與types通過（套件無lint script）；另同步0179–0180已收尾帳本、原始證據與2個重現腳本。389來源雜湊符合0180最終版本。0180產品修正仍依賴未完成的BH-0004 graph實作，連同套件測試、公開文件、其他對話Site變更與0181起始雜湊保留工作區；證據對應記錄的工作區來源，不能宣稱乾淨checkout可獨立重現。47historical／45fixed／2unresolved、65checked／10blocked、4root gates／4原候選及0038身分暫停保持，目標active。0181目前只有讀取與基線記錄，下一步建立retained Sass reference／virtual source資源所有權的聚焦重現；歷史HEAD及未提交敘述保留當時狀態。未推送。[提交核對](evidence/0180-commit-validation.json)。

- 使用者再次授權提交已完成部分：44個已完成Benchmark程式／測試檔已提交`cee5d7aa0`；本次同步0173–0178帳本、證據及重現。44檔符合0178來源雜湊；隔離Benchmark目錄排除0179修改後，98tests、types與report-smoke通過（依賴仍連至工作區，並非完整乾淨checkout驗證；套件無lint script）。0179的5個既有檔修改與3個新helper／test、未收尾材料，以及BH-0004產品／套件測試與其他對話Site變更均保留工作區。47historical／44fixed／3unresolved、10blocked、4root gates／4原候選、native shutdown／WebKit namespace限制及0038身分暫停維持；目標active，未推送。下一步完成0179產物位元組／階段觀察與build-path consumer核對，再同步帳本；歷史HEAD及未提交描述保留當時狀態。[提交核對](evidence/0178-commit-validation.json)。

- 0182 已修正跨目錄 Sass partial 的 CSS reference 來源：prepared source／entry delivery 新增可選 sourceMap，沿 Rust UTF-16 reference 位置解析原始檔案，並保留 collection 變體的 map。原6個build失敗／2純Vite控制通過；追加additionalData曾8FAIL，確認Vite單來源map錯接，沿用預處理標記保留入口身分並於輸出前移除後通過。16新compiler／22新Vite控制、完整269compiler／479Vite／71CLI與lint／types／build／範例通過；Site prepare/lint為0errors／75既有warnings。兩種Sass、四模式、三瀏覽器120觀測通過，含partial切換reference、定義與SVG HMR且無reload。397來源、10既有檔修改／5新檔；147既有排除檔、foreign Site、5產物／3CLI檔不變。API census／package golden仍FAIL，未刷新契約。47historical／45fixed／2unresolved、65checked／10blocked保持；BH-0004整體／BH-0029、其餘graph／host／watch／base／SSR／Nuxt／Webpack、benchmark矩陣／history、4root gates／4原候選、native shutdown／WebKit namespace及0038身分暫停仍未完成。下一批0183驗證actual host reference缺檔刪除／還原與啟動失敗恢復，補普通／Modules Sass root的dev browser與map邊界；internal proxy ?direct HTTP500仍待分類。程序皆結束，HEAD4d7274050，本批未commit/push，目標active。[0182](batches/0182-sass-partial-references.md)／[核對](evidence/0182-final-checks.json)；前次交接見[逐字歷史](progress-history-0182.md)。 本次使用者授權提交0181–0182已收尾帳本、原始證據與2個重現腳本；397來源與歷史驗證紀錄雜湊核對一致。產品／套件測試與公開文件仍依賴未完成BH-0004，連同其他對話Site變更保留工作區，不能宣稱乾淨checkout可獨立重現。0183已開始：24個dev/build-watch控制為12PASS／12FAIL，啟動缺檔失敗仍需排除事件觀測問題並釐清產品責任；另有測試spy型別錯誤已修改但尚未重驗，均未納入完成範圍。0183材料保留未提交，下一步沿用原紀錄釐清失敗階段並驗證恢復；0038身分暫停不變，目標active，未推送。[本次提交核對](evidence/0182-commit-validation.json)。

- 使用者再次授權提交已完成部分：本次提交0171–0172已收尾的帳本、原始證據與6個重現腳本，記錄BH-0033／BH-0034已驗證修復；Benchmark程式與測試混有0173尚未收尾修改，連同BH-0004產品／套件測試及其他對話Site變更保留工作區。重現依賴記錄雜湊的工作區來源，不能宣稱乾淨checkout可獨立重現。0172的359來源中357仍一致，另2個Benchmark檔案已由0173修改；30份原始驗證紀錄、原151個排除檔案與5項建置產物雜湊一致。0173目前19tests／types、36直接控制與36實際cleanup控制、原mutation16／invalidation32／interaction54及smoke均通過，程序已結束；WebKit補充探測首次誤認短測量窗必有刪除，改用獨立延長觀察窗後確認386項刪除與實際CSSOM結果，屬探測時機假設錯誤，沒有改寫原量測時間。下一步整理0173最終來源／證據並同步五份帳本後，才能決定BH-0042結案；目前仍47historical／38fixed／9unresolved，10blocked／4root gates／4原候選、host shutdown限制與0038身分暫停保持，目標active。未推送；歷史HEAD及未提交描述保留當時狀態。[提交核對](evidence/0172-commit-validation.json)。

- 使用者再次授權提交已完成部分：本次納入0163–0165已收尾的查核、原始證據、重現材料與逐字歷史。產品及套件測試仍依賴未完成的BH-0004 graph改動，與其他對話Site變更一併保留工作目錄；未推送。228來源及7份最終browser log雜湊一致；47historical／35fixed／12unresolved與0038身分暫停維持，目標active。下一步接local ?url／Modules跨import exports；各批歷史HEAD與未提交描述保留當時狀態。[提交核對](evidence/0165-commit-validation.json)。

- 使用者再次授權提交已完成部分：BH-0047的pre-render manifest HMR修復、2項新回歸、既有測試補齊及對應README已提交`5e707ec75`；本次7項聚焦測試、Vite lint/types全通過。0159–0162已完成查核、重現與原始證據另作一筆提交；各批歷史HEAD及未提交描述保留當時狀態。BH-0004其餘產品／套件測試與其他對話Site變更留工作目錄。下一批接local-compose完整graph交付；47historical／35fixed／12unresolved、10blocked／4gates／4原候選+1host shutdown限制及0038身分暫停維持，目標active；未推送。[提交核對](evidence/0162-commit-validation.json)。


- 使用者再次授權提交已完成部分：本次僅提交0169–0170已收尾的帳本、原始證據與5個重現腳本；這些重現依賴帳本記錄的工作區來源，不能宣稱乾淨checkout可獨立重現。Benchmark程式與測試已混入0171未收尾修改，與BH-0004產品／套件測試及其他對話Site變更保留工作區。0171目前12tests、types、36個三瀏覽器準備控制、原mutation16及invalidation32變體通過，相關程序均已結束；但兩個診斷HTTP server新增Wasm MIME後尚未重跑原套件，且缺逐變體準備／清理數值核對與interaction回歸，不能宣稱BH-0033完成。首次preseed斷言誤把2個class當成2個輸出規則，已修正為實際3個輸出項目，屬腳本錯誤。下一步完成0171最終版本驗證與批次收尾；47historical／36fixed／11unresolved、10blocked／4root gates／4原候選、host shutdown限制及0038身分暫停維持，目標active；未推送。歷史HEAD及未提交描述保留當時狀態。[提交核對](evidence/0170-commit-validation.json)；前次提交交接逐字見[歷史](commit-history-0170.md)。

- 0166交接原文已逐字歸檔至[歷史紀錄](progress-history-0167.md)，既有證據與未完成範圍保留。

- 0163交接原文已逐字歸檔至[歷史紀錄](progress-history-0164.md)，既有證據與未完成範圍保留。

- 0162交接原文已逐字歸檔至[歷史紀錄](progress-history-0163.md)，既有證據與未完成範圍保留。

- 0161 handoff preserved verbatim in [history](progress-history-0162.md); original evidence and unfinished scope remain available.

- 0160 handoff preserved verbatim in [history](progress-history-0161.md); original results and incomplete scope remain available.

- 0159 handoff preserved verbatim in [history](progress-history-0160.md); original batch evidence and unfinished scope remain authoritative.

- 使用者再次授權提交已完成部分：BH-0046 的 base URL 修復、12項新回歸及對應README已提交 `8c16c3f42`，本次21項聚焦測試／lint／types全通過。0157–0158已收尾的查核、原始證據與重現另行提交；歷史HEAD與未提交描述保留當時狀態。0159與BH-0004產品修改仍留工作目錄：首輪瀏覽器45／48通過，3項pre-render theme HMR失敗；新SSR完整子圖控制4項均因重複layer失敗。下一步驗證serve註冊採canonical resolution.id，並完成theme HMR修正的build／瀏覽器回歸；不得沿用0157全套PASS。其他對話Site變更保留，0038身分暫停與全部未完成項目維持，目標active；未推送。[提交核對](evidence/0158-commit-validation.json)。

- 0158共同交接已逐字歸檔至[歷史紀錄](progress-history-0159.md)；關閉限制與未完成範圍保留。

- 0157共同交接原文已移至[歷史紀錄](progress-history-0158.md)，BH-0046證據及關閉候選沿用。

- 0155–0156已完成查核於42ccdc182提交，共87檔；125排除變更核對byte-identical。歷史HEAD與未提交描述保留當時狀態；本批新工作未授權提交。[提交核對](evidence/0156-commit-validation.json)。

- 0155–0156共用交接已逐字歸檔至[歷史紀錄](progress-history-0157.md)，各批次證據與未完成範圍保留。

- 0152–0154共用交接已逐字移至[歷史紀錄](progress-history-0155.md)，批次證據與未完成項目保留。

- 使用者再次授權提交已完成部分：此次納入0151–0154已收尾的查核紀錄、原始證據、兩個已驗證重現腳本及0153逐字歷史歸檔；歷史HEAD／未提交描述保留為當時狀態。BH-0004產品／套件測試、0155進行中材料及其他對話Site變更留在工作目錄。0155已重現共用plugin instance跨root的CSS污染（獨立factory控制PASS）；初版依ResolvedConfig隔離插件組後16個聚焦測試PASS，相關程序已結束，但尚缺lint/types、完整回歸、build／瀏覽器多root與共用instance驗證，不能沿用0154結果宣稱目前產品完成。下一步先驗證hook路由、relative／empty SSR base與並行build，再完成0155批次與帳本，續資源／reference及其他host。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分驗證暫停不變，目標active；此次未推送。[提交範圍與保存證據](evidence/0154-commit-validation.json)。

- 0147–0151 共用交接原文已逐字歸檔至[歷史紀錄](progress-history-0153.md)，各批次證據與未完成事項保留。

- 使用者再次授權提交已完成部分：此次僅納入0147–0150已收尾的查核帳本、原始證據、已驗證重現材料與0149逐字歷史歸檔；歷史HEAD／未提交描述保留為當時狀態。BH-0004產品／套件測試、其他對話Site變更，以及0151材料留在工作目錄；共用`vite-sass-environments.mjs`已加入0151擴充，未納入此次提交，0150的原版本雜湊仍見原inventory。0151一般server live reconnect首輪48browser／16SSR與連續兩次restart72browser／24SSR通過；middleware矩陣pure控制通過，managed重啟後頁面缺失，新增actual-server測試重啟後HTTP404。根因尚未確認，不能歸咎scanner或宣稱修復完成；新增失敗頁面診斷尚未重跑。相關命令已結束；下一步核對middleware stack、共用server.close包裝與新舊server生命週期，再完成0151驗證及帳本。33fixed／12unresolved、10blocked、4root gates／4候選與0038身分驗證暫停不變，目標保持active；此次未推送。[提交範圍與保存證據](evidence/0150-commit-validation.json)。

- 使用者再次授權提交已完成部分：此次僅納入0143–0146查核紀錄、重現腳本、原始證據與逐字歷史歸檔；各批次的HEAD／未提交描述保留為當時狀態。BH-0004產品／套件測試、0147進行中材料與其他對話Site變更留在工作目錄。0147以公開middleware及module graph追蹤實際stylesheet URL，補送匹配link的CSS HMR；目前focused2tests與Sass URL三瀏覽器初始／更新6觀測通過，相關命令已結束，但尚未完成完整request96、base／alias／外部root邊界及最終回歸，不能宣稱整體修復完成。下一步先補這些驗證與0147批次收尾，再續其他host、Webpack及0144巢狀缺檔恢復。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分驗證暫停不變；目標維持active，此次未推送。[提交範圍與保存證據](evidence/0146-commit-validation.json)。





- 使用者再次授權提交已完成部分：本次納入0141–0142已完成的查核紀錄、重現材料與原始證據；歷史HEAD／未提交描述保留為當時狀態。共用watch腳本僅提交與0142 inventory SHA-256一致的已驗證版本，0143擴充保留工作目錄。BH-0004產品／套件測試與其他對話Site變更未納入。0143直接子檔watch已6build／18browser PASS，新增dependency3tests與Modules9tests通過；但巢狀錯誤恢復最新6build／18browser為16PASS／2FAIL，Chromium恢復時請求不存在的JS／CSS資產，尚須區分watch事件時序、發布行為與腳本因素，不能宣稱修復完成。相關命令已結束；下一步先查事件與資產發布時序，再補穩定的恢復驗證及0143整批收尾，續dev/HMR、其他host與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分驗證暫停不變，目標保持active；此次未推送。[提交範圍與保存證據](evidence/0142-commit-validation.json)。

- 使用者再次授權提交已完成部分：此次納入0137–0140已完成的查核紀錄、10個重現腳本、原始證據與0139逐字歷史歸檔；批次中的HEAD／未提交描述保留為當時狀態。BH-0004產品與套件測試、0141進行中材料及其他對話Site變更保留工作目錄。0141已重現三個Sass入口的診斷指向代理CSS，新增來源對映尚未完成；lint日誌通過，type-check有兩個TS2322錯誤（map可能是字串、sources可能含null），相關命令已結束。下一步先修正型別並新增原partial結構化位置測試，再build／重現／回歸驗證，完成0141帳本；不得將0140的PASS沿用至目前修改。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變，目標持續active；此次未推送。[提交範圍與保存證據](evidence/0140-commit-validation.json)。









- 使用者再次授權提交已完成部分：此次僅納入0136已完成的Sass查核紀錄、兩個重現腳本及原始證據；BH-0004產品／套件測試與0137材料保留工作目錄。0137最新日誌已寫出inline14build／84browser、Sass15build／90browser及JS-only watch3build／18browser全PASS，相關程序已不在程序表；Site prepare/lint日誌完成（0errors／75warnings）。這些是尚未完成批次收尾的局部結果，不能宣稱整體修復完成。下一步補最後Vite變更的scoped驗證、root gates／example／預算檢查、來源保存核對，完成0137批次與索引，再續source maps、其他host與Webpack；保留early WebKit載入時序待查。33fixed／12unresolved、10blocked、4root gates／4候選與0038身分暫停不變；未推送。[此次提交範圍與保存證據](evidence/0136-commit-validation.json)。



- 使用者再次授權提交已完成部分：此次納入0133–0135已完成的查核紀錄、重現材料與原始證據，以及0134逐字歷史歸檔；批次中的HEAD／未提交描述保留為當時狀態。BH-0004產品與套件測試仍未完成整體交付，連同0136 Sass初步修改／證據保留於工作目錄。0136已新增Sass預處理與內部CSS入口、baseFile來源傳遞；compiler／Vite的首輪types與build日誌已寫出，但尚未完成Sass行為驗證，不能沿用0135的PASS宣稱目前修改全部通過。下一步先以`vite-host-inputs.mjs`的scss-entry／scss-import重現驗證，再補additionalData、條件CSS imports、aliases／partials、資源、診斷與watch。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停維持；其他對話Site變更原樣保存，未推送。[提交範圍與保存證據](evidence/0135-commit-validation.json)。



- 0134：修復alias／custom resolver把專案CSS誤當套件而漏裁剪的回歸；改核對實際檔案是否在原名稱的套件根目錄。新增actual10build／54browser，修後36PASS／18FAIL及1Sass buildFAIL；36個裁剪／套件／明確保留控制全通過，剩餘為virtual匯入／入口與Sass入口／匯入。compiler219／Vite110、lint/types/build、既有resolver36／resource18及Site prepare/lint通過（75warnings）。下一批接非檔案來源載入與預處理，保留條件、資源、診斷與watch；不以拒絕計完成。歷史0131–0133交接逐字歸檔。33fixed／12unresolved、10blocked、4root gates／4候選與0038身分暫停不變；HEADef7887f76，未提交／推送。[0134](batches/0134-vite-alias-pruning.md)。

- 0133：Vite build 改用實際主機解析 CSS 檔案，涵蓋字串／regex alias、自訂resolveId、import／browser套件條件與間接入口。compiler218／Vite110、兩套件lint/types/build、6build／36browser、資源18／快取39及原範例通過；Site prepare/lint通過（75warnings）。新測試缺分號及blue／#00f斷言均為測試錯誤。原actual corpus仍3Webpack build／12browser失敗；5artifacts不變，API census仍原失敗，package golden另含2個新型別。下一批驗證virtual CSS／preprocessor、reference／resource aliases、local-compose及來源pruning／多入口／watch，再遷移Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停維持；HEADef7887f76，本批未提交／推送。[0133](batches/0133-vite-host-file-resolution.md)。

- 使用者再次要求提交已完成部分：本次僅納入0131–0132已完成的查核紀錄、重現材料與原始證據；批次中的未提交／HEAD描述保留為當時狀態。BH-0004產品、套件測試及0133進行中材料留在工作目錄。0133最新完整compiler為217PASS／1FAIL（新host-resolution測試第30行未找到color:blue，原因待分類），Vite110PASS，兩套件lint/types通過；三個驗證程序均已結束。下一步先定位此失敗，再重建compiler／Vite並重跑host-resolution與actual build／resource／cache對照，完成0133證據及帳本；不得沿用0132的PASS宣稱目前修改全數通過。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變。其他對話Site變更原樣保留；此次未推送。[提交範圍與保存證據](evidence/0132-commit-validation.json)。

- 0132：Vite production 已改接未攤平分類、graph註冊與原位置bundle分檔發布，內容參與命名前的身份；片段留在原CSS目錄，managed／Node套件資源用內容檔名。首次suite抓到套件CSS漏解析回歸，已修復並保留套件native規則；五個舊單字串／snapshot斷言改查完整資產集。最終16actual builds為13PASS／3WebpackFAIL，78browser為66PASS／12WebpackFAIL，其中Vite48全PASS；Vite110／compiler213／Rust75、lint/types/build/Clippy/fmt/codegen/parity、39快取lazy／18資源／36hydration及原範例build通過。舊單CSS快取腳本與macOS realpath斷言錯誤另記。Site prepare/lint通過（75warnings）。compiler-Wasm增加773raw／365gzip／129brotli，runtime四產物與兩root失敗hash不變。下一批先補Vite aliases／virtual resolvers／preprocessors及多入口／watch，再遷移Webpack；BH-0004legacy39失敗及其餘12unresolved／10blocked／4root gates／4候選不結案，0038身分暫停維持。HEAD160ca58a5，未提交／推送。[0132](batches/0132-vite-graph-publication.md)。

- 0131：native／compiler-Wasm 與 public compiler 已接通兩階段 bundle API，重連已編譯 import 並保留原始資源參照、namespace 與 JSON 傳輸；209compiler／17binding／4provider／75Rust、三套件build/lint/types及Clippy/fmt/codegen/parity通過。新168native/Wasm瀏覽器對照及6瀏覽器內直接Wasm呼叫通過；首次腳本誤用specifier已改為url。compiler-Wasm增加111174raw／26084gzip／15537brotli bytes，runtime四產物不變。API census仍原失敗；package golden另含4個刻意新增型別／方法surface差異，未更新golden。下一批遷移實際Vite graph註冊／命名／全資產發布，再接Webpack；BH-0004原39browser及actual build6/browser24失敗仍未結案。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停維持。HEAD160ca58a5，本批未提交／推送。[0131](batches/0131-public-bundle-transport.md)。

- 使用者要求提交已完成部分：BH-0045 的 Vite 修復、4項新回歸測試與 README 已提交為 `bb0989bb6`；本次重跑 Vite110tests、lint／types 全部通過。0128–0130 已完成的查核紀錄與歷史原文歸檔另行提交；這些批次中的「未提交」描述保留為當時狀態。BH-0004 的 Rust／compiler／bindings／CLI 程式尚未完成整體交付，保留未提交；其他對話的 Site 變更原樣保留。持續目標仍 active，33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變。[提交範圍與保存證據](evidence/0130-commit-validation.json)。


- 0130：Rust bundle 已支援一般片段的 namespace 前綴／預設／覆寫上下文，以及 resource/import URL 搬移；沿用既有parser，保留原始UTF-16參照且不改managed graph。75Rust／205compiler、新36與既有48三瀏覽器對照及lint/types/Clippy/fmt/codegen通過。新錯誤測試改查既有structured filename，非產品格式變更。下一批接native/Wasm與compiler host，再遷移實際Vite/Webpack註冊和資產發布；其他scope／invalid-rule處理及原始失敗仍未完成。33fixed/12unresolved、10blocked、4root gates／4候選與0038身分暫停保持。HEAD2740faa60，未提交／推送。[0130](batches/0130-bundle-source-context.md)。

- 0129：Rust 已新增來源範圍感知 bundle graph composition，重用 CSS tokens/import renderer，保留前後規則、重複 slot 與共用匿名 layer；71Rust／205compiler、48三瀏覽器對照及lint/types/Clippy/fmt/codegen通過。新supports斷言多一層括號已依實際parser輸出更正。尚未接native/Wasm或Vite/Webpack；namespace、其他scope與ordinary resource URL來源處理仍待完成，拒絕不計修復。下一批先補來源上下文，再接bindings與真實asset publisher；BH-0004及12unresolved／10blocked／4root gates／4候選保持，0038仍暫停。HEAD2740faa60；未提交／推送。[0129](batches/0129-rust-bundle-composition.md)。

- 0128：BH-0045 已修復；在 Vite 命名階段納入完成的 managed CSS，沿用 Vite 產生所有引用，亦涵蓋不分割 CSS。Vite110tests／lint/types/build、原始快取重現6、7模式21builds／39三瀏覽器（含獨立lazy CSS）、36hydration及原範例build通過；重複輸出穩定。固定檔名仍由呼叫端處理快取。45歷史問題現33fixed/12unresolved；65checked/10blocked、4root gates、4候選與0038身分暫停保持。兩root API失敗hash及5artifacts不變；BH-0004舊39browser與0127 build6/browser24失敗未結案。下一批接續Rust來源範圍感知bundle分段、真實graph註冊與Vite/Webpack全資產交付。HEAD2740faa60；本批未提交／推送。[0128](batches/0128-vite-final-css-hashes.md)。



歷史進度原文移至 [歷史交接（0130整理）](handoff-history-0130.md)；目前狀態以原檔的最新交接為準。

0141–0144歷史進度逐字移至 [歷史進度（0146整理）](progress-history-0146.md)；目前狀態以本檔最新批次為準。

0136–0140歷史進度逐字移至 [歷史進度（0149整理）](progress-history-0149.md)；目前狀態以最新交接為準。

部分較早批次交接逐字保存於[0159歷史歸檔](progress-history-0159.md)，目前狀態以最新交接與原批次為準。
