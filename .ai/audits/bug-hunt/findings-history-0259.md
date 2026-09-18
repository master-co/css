# 問題索引歷史進度（0259 整理）

以下段落自 `findings.md` 逐字移出，內容未改。

53 historical confirmed findings: 49 fixed, 4 unresolved. BH-0047 pre-render manifest HMR is fixed; four original candidates, one unresolved Vite-host development shutdown native-handle limitation and blocked coverage remain unfinished. See linked batches for status history and evidence.



- 0067 independent Vite startup four fixture controls PASS; no new finding, original combined report still blocked byBH-0038.
- 0068 CSS output-size original16builds/artifact/sample controls PASS; no new finding.



- 0077 five originalstatic scenarios/four mode toggle controlsPASS; original runtime startblockedBH-0032 andfacadeBH-0033.0078 addsBH-0042 withbaselinearraydeletioncontrol; total42.

- 0079 originalmutation report failsBH-0032; exactpreseed helper createsneitherclass whilearraycontrol createsbothBH-0042.0080 twooriginalstaticchildren PASS; runtimechildblockedBH-0032, observerpause/retainedseed preparation failsBH-0033.42total unchanged.

- 0081 completeness audit mapsremainingrequirements; no newfinding,42confirmed. No blockedunitcountedascomplete.
- 0082 extendsBH-0031 to twoOSprocesses:10/10overlappingpairs bothaccepted; sequentialstale anddifferentfilecontrolsPASS.42confirmed unchanged.

- 0083actual VS Code16selected corpus controls and13color-presentation sets PASS; namespace/mode limitations and TS dependency diagnostics distinguished. No new finding;42confirmed unchanged.

- 0085SDKfilesystemfault/retry behavior observed with4controls. No promised atomicity contract violated; no newfinding,43confirmed. Processcrashes and otherremainingcoverage still unverified.

- 0086process termination/restart controls record1updated/1023unchanged beforefreshpreviewrecovery; no persisted-token or crash-atomicity contract promised. No newfinding,43confirmed.

- 0087completion review:43confirmed unchanged;13blocked andexternal/open-ended coverage remain uncompleted. [Prerequisites](batches/0087-completion-prerequisites.md).

- 0087thirdsame-impasse observation: overallgoalmarkedblocked;43confirmed unchanged, none treatedasfixed orcompletedbyclassification.

- Resumedgoalrun1:43confirmed unchanged; freshprerequisite audit1, no newfinding orclearedcoverage.

- Resumedrun1thirdsame-impasse check: goalblocked again;43confirmed unchanged andnone countedfixed.


- 0088: 44 historical confirmed findings; BH-0024/0025/0027/0028/0044 fixed and verified, 39 remain unresolved. Nuxt BH-0023/0036 implementation remains under verification. Earlier counts describe their historical batches.

- 0089: BH-0013/0014 fixed with Rust/native/Wasm/editor tests; BH-0023/0036 fixed with original HMR and four-mode production tests. 44 historical confirmed findings:9 fixed,35 unresolved. [Evidence](batches/0089-language-and-nuxt-validation.md).

- 0090: BH-0005/0006/0007 fixed; server tests/lint/types/build and72 real-browser raw-text/CSS controls PASS.44historical confirmed:12fixed,32unresolved. [Evidence](batches/0090-server-html-fixes.md).

- 0091: BH-0021 fixed with58installer tests/lint/build;44historical confirmed:13fixed,31unresolved. [Evidence](batches/0091-create-import-boundaries.md).





- 0096/0097：BH-0019/0026修復；CLI34、scanner83tests及built native/Wasm reset/新增source控制通過。44歷史確認：20已修復、24未解決。[watch](batches/0096-cli-source-watch.md)、[binding](batches/0097-cli-binding-selection.md)。

- 0098：BH-0020修復，MCP24/Rust5/native inspection4tests、lint/types/build/Clippy及actual built stdio大小與磁碟檔案一致。44歷史確認：21已修復、23未解決。[證據](batches/0098-mcp-utf8-bytes.md)。

- 0099：BH-0011已修復，tooling208tests加原始Svelte回歸、lint/types/build及三瀏覽器Svelte/Vite分支互動通過；BH-0010仍失敗。44歷史確認：22已修復、22未解決。[證據](batches/0099-svelte-branches.md)。

- 0100：BH-0010已修復；完整2231named references、numeric/attribute規則與23312三瀏覽器/native/Wasm對照通過；Rust14/tooling212/CLI34/Vite99及actual static browser通過。44歷史確認：23已修復、21未解決。[證據](batches/0100-html-character-references.md)。

- 0101：BH-0031已修復；MCP34tests/lint/types/build、跨程序與built stdio20rounds、260critical sections和SDK權限/中止恢復控制通過。44歷史確認：24已修復、20未解決；local same-account cooperative範圍與限制見[批次](batches/0101-mcp-preview-concurrency-fix.md)。

- 0102：BH-0015保留已確認／部分修復。JavaScript直接literal與框架JS expression控制通過，但Vue外層HTML entity＋JS escape的2個範圍/修正回歸失敗；現269PASS/2FAIL。24fixed/20unresolved不變。[下一步](batches/0102-eslint-javascript-escapes.md)。

- 0103：BH-0015修復，ESLint291/tooling215/binding17/config4/Rust18與21實際Vue三瀏覽器控制通過。44歷史確認：25已修復、19未解決；詳見[批次](batches/0103-vue-attribute-mapping.md)。

- 0104：BH-0016修復，Vite106tests/lint/types/build、36built三瀏覽器控制與原範例build通過；44歷史確認：26已修復、18未解決。[證據](batches/0104-vite-relative-hydration.md)。

- 0105：BH-0017已修復；Webpack63tests serial/lint/types/build與54三瀏覽器完整runtime控制、原範例build通過。44歷史確認：27已修復、17未解決；首次parallel suite單項shared-dist載入失敗仍留harness調查。[批次](batches/0105-webpack-relative-runtime.md)。

- 0106：BH-0030已修復；Webpack69tests serial/lint/types/build、36檔名矩陣與3原playground瀏覽器控制通過。44歷史確認：28已修復、16未解決；官方nested命令/依賴及parallel harness限制仍未完成。[批次](batches/0106-webpack-fixed-filename.md)。

- 0107：BH-0001新增22獨立語法回歸（19FAIL/3PASS），三瀏覽器66對照支持預期；原BH-0001/0002仍FAIL。未修產品，28fixed/16unresolved不變；下批需詞法結構與名稱解碼，不能將新增證據視為修復。[批次](batches/0107-animation-syntax-evidence.md)。

- 0108：BH-0001仍部分修正。22syntax與native/Wasm/public/runtime檢查通過，但9個value回歸5FAIL（其中4個由未完成實作引入），三瀏覽器支持預期；舊Wasm雜湊及行為對照已保存。28fixed/16unresolved保持，不將其他green tests視為本問題修復。[下一步](batches/0108-animation-syntax-partial.md)。

- 0109：BH-0001已修復，包含0108的5個失敗。原22syntax、29value/8variable groups、native/Wasm22、87+42browser、CSS72/compiler127/server67及runtime273通過。全Rust另有BH-0002/0003既有3FAIL；29fixed/15unresolved，10blocked不變。[證據與效能代價](batches/0109-animation-value-context.md)。

- 0110：BH-0002已修復；原始回歸及25-case語法矩陣通過，75raw browser/63compiled controls、12預期parse拒絕、native/Wasm與runtime273PASS。全Rust131PASS/2BH-0003FAIL；30fixed/14unresolved、10blocked不變。[0110](batches/0110-variable-syntax.md)。

- 0111：BH-0003已修復；145Rust全PASS、CSS72/compiler132/server67/runtime279、72static browser控制通過。31fixed/13unresolved，10blocked保持。另列standalone Node預設Wasm file-URL載入失敗為待分類候選；明確bytes控制不等於該API預設行為完成。[0111](batches/0111-static-retention.md)。

- 0112：BH-0004新增直接證據，native/Wasm10cases一致，60browser21PASS/39FAIL；31fixed/13unresolved不變。完整保留stylesheet邊界與交付仍待實作，詳見[0112](batches/0112-external-import-order.md)。

- 0113：BH-0004僅Rust graph/renderer初步實作，42Rust/132compiler/108graph browserPASS；重建後public baseline仍21PASS/39FAIL。未接既有入口、相對URL base與directive/native資產編譯，31fixed/13unresolved保持。[0113](batches/0113-stylesheet-boundaries.md)。

- 0114：BH-0004仍部分修復；新公開compileStylesheets的native/Wasm/同步Node與126browser對照通過，50Rust/153compilerPASS。既有file/build/CLI路徑及相對URL未完成，root API檢查仍FAIL。31fixed/13unresolved保持；legacy string compiler native compose位置另留待入口分類。[0114](batches/0114-compiled-stylesheets.md)。

0115：Rust來源URL discovery與圖編譯resourceURLs映射完成有界驗證；56Rust/157compiler、binding17、3browser資源與126graph控制通過。既有入口60對照仍39FAIL，Node自動資源處理、references/decoded imports、診斷位置及file/project/build/CLI交付仍未完成，root gates保持FAIL。[0115](batches/0115-resource-url-ownership.md)。31fixed/13unresolved、65checked/10blocked不變；未commit/push。

0116：Node/Rust import discovery統一decoded CSS specifiers；既有file入口的escaped/encoded/query/bare local路徑與reference sourceText #截斷已修正。60Rust/167compiler/MCP34、42新browser與96local控制通過；原external60仍39FAIL。prepared reference/resource emission與file/project/build/CLI整體交付未完成，BH-0004保持未結案。31fixed/13unresolved、65checked/10blocked及root gates不變；[0116](batches/0116-node-import-discovery.md)。未commit/push。

0117：BH-0035已修復；actual VS Code缺少命令錯誤manual/settings從0/1降為0/0，registered/failing/removed controls與原設定/格式化功能通過，31tests及lint/types/full isolated buildPASS。32fixed/12unresolved；65checked/10blocked與4root gates保持。BH-0004接續0116，0038追加驗證仍暫停；未commit/push。[0117](batches/0117-vscode-settings-restart.md)。

提交整理：依使用者要求，BH-0035 的產品修復、實際 host 回歸測試與兩個啟動腳本已提交為 `79eea0d8f`。本次另保存 0115–0117 已完成的調查、證據及重現材料；BH-0004 的 compiler／binding／測試與文件實作及 Site 其他工作仍未提交。0115–0116 證據對應已記錄雜湊的工作區版本，其 graph 重現仍依賴未提交來源，不能宣稱乾淨 checkout 可獨立重現。提交前發現 0117 原 lint 紀錄實為 13 個 CommonJS 測試環境錯誤，先前 PASS 記載不正確；只新增測試檔的 Node globals 與 CommonJS import 註記後，完整 package lint 已通過，見 `evidence/0117-commit-lint.log`。測試執行內容與產品來源未變，沿用既有 31 tests、actual VS Code、types 與 isolated build 證據。12 個未解決問題、10 個受阻覆蓋單位及四項 root gates 保持未完成；0038 追加驗證仍待身分驗證明確確認。未推送。

0118：實際 source／built CLI 各18個三瀏覽器對照6PASS/12FAIL，確認外部import遭刪除、順序錯誤、巢狀條件拒絕與relative resource錯誤目錄；沿用BH-0004。已抽出Node filesystem/package graph準備流程供collection接續，167compiler/34CLI、42file browser及lint/types/build通過，兩項root API失敗hash不變。完整asset delivery仍未完成；32fixed/12unresolved、65checked/10blocked及4root gates保持。[0118](batches/0118-cli-stylesheet-delivery.md)。未commit/push，0038追加驗證仍暫停。

0119：CLI file export已接Rust graph，實際輸出相依CSS與resources；source/built各18browser全通過（原各12FAIL），reference資源、分入口native pruning與watch更新共37CLI tests通過。61Rust/168compiler/binding17、126graph與3resource browsers及lint/types/build/Clippy/codegen/parity通過。舊入口仍39FAIL，BH-0004保持部分修復；file/project/build/no-export、診斷位置、output exclusions與stale asset cleanup續作。32fixed/12unresolved、65checked/10blocked、4root gates不變；0038追加驗證仍暫停。未commit/push。[0119](batches/0119-cli-asset-delivery.md)。

本次提交整理（父提交 `927278b1c`）：僅納入 0118–0119 已完成的調查紀錄、驗證證據及 CLI 重現腳本；BH-0004 產品、測試與公開文件實作仍未提交，其他對話的 Site 變更保持原樣。證據對應各批來源雜湊所標識的工作區版本，不能宣稱本提交的乾淨 checkout 可重現修復後結果。0119 的 55 個保留檔案雜湊全部一致；其後 0120 已修改 7 個相關來源／文件，0119 證據不代表這些新版本全部通過。0120 仍在進行：新增 layer probe 有 36 次失敗，須處理排除 native CSS 時空 import 仍宣告 layer、改變 cascade 的問題，再重跑輸出組合與 native/Wasm 驗證；0120 材料保留工作區。32 已修復／12 未解決、65 已檢查／10 受阻及 4 項 root gates 不變；0038 追加驗證仍等待明確身分確認。未推送。

0120：standalone collection 的 native／Master base／generated 與 preserveNativeCSS 共16組合已驗證；修正排除 native 後空 import 仍建立 layer 的問題，新增圖層探針由36FAIL降為0FAIL，三瀏覽器／screen-print共96PASS。63Rust／185compiler／37CLI／17binding及source、built CLI各18PASS；lint/types/build/Clippy/codegen/parity與Site prepare通過（lint 0errors/75既有warnings）。舊入口仍39FAIL，BH-0004未結案；下一批先重現資源URL改寫後的原始檔名／UTF-16診斷位置，再續既有入口與資產清理。32fixed/12unresolved、65checked/10blocked、4root gates與0038身分暫停保持。HEAD912a73b26；本批未提交／推送。[0120](batches/0120-standalone-output-modes.md)。

0121：BH-0004 graph 資源改寫後的 UTF-16 診斷位置、style definition 來源位置及 collection variant 檔名已修正；原7host／2Rust失敗回歸通過，擴充後194compiler／65Rust／37CLI／17binding通過，source/built診斷各4組、96output-mode與3resource browser通過。CLI首跑因與dist重建重疊而7FAIL，建置完成後37全通過；分類為排程錯誤。舊入口仍39FAIL，無range的錯誤及其他交付契約仍未完成。下一批重現資源／import移除與缺檔還原的watch恢復，續查stale sidecar清理。32fixed/12unresolved、65checked/10blocked、4root gates及0038身分暫停保持。HEAD912a73b26；未提交／推送。[0121](batches/0121-original-source-diagnostics.md)。

0122：CLI file-export watch 的缺少／刪除 import與resource恢復已修正，含新巢狀目錄與啟動缺檔共6情境；失敗期間頁面編輯在恢復後生效。43CLI／194compiler、source/built各12三瀏覽器控制及既有built export18通過；lint/types/build與Site prepare通過。移除import後不再請求資源或監看舊CSS，但stale sidecars仍在磁碟。下一批驗證發布中途寫入失敗與資產所有權／清理，不能以準備失敗恢復推論發布原子性。32fixed/12unresolved、65checked/10blocked、4root gates與0038身分暫停不變。HEAD912a73b26；未提交／推送。[0122](batches/0122-watch-dependency-recovery.md)。



0123：Node CLI 發布改用版本化、不可覆寫的 sidecars，完整寫好資產後才原子切換入口；原2失敗回歸、擴充9發布控制及完整52CLI通過，source/built各12發布browser、既有built export18與watch12通過。重複輸出bytes一致，寫入失敗及舊入口讀者仍可讀取原資產；lint/types/build通過。舊資產保留，所有權／清理、其他graph入口及39個legacy失敗仍未完成。下一批先驗證跨執行與多輸出資產所有權，再設計保留期限及中斷恢復，不能立即刪掉舊讀者依賴。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；本輪未提交／推送。[0123](batches/0123-immutable-cli-publication.md)。

0124：Node CLI 已加入跨執行的資產所有權、發布 journal 恢復及有期限清理；保留目前／上一版，其餘版本至少保留24小時（本輪採用已說明的預設，未收到偏好回覆）。71CLI、4個SIGKILL恢復控制、source/built各120跨程序臨界區及合計90browser對照通過，使用者修改／原有檔案、另一輸出與仍被引用的借用資產保留；lint/types/build通過。未記入journal的早期暫存檔與非協作writer等限制仍明列。下一批回到compileCSSFile／compileCSSManifestFile／compileProjectManifest及下游資產契約；最新legacy39FAIL仍未修復，不能用CLI子集結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；未提交／推送。[0124](batches/0124-cli-asset-ownership.md)。



0125：Node project manifest 改以原始逐檔 import/reference graph 交由 Rust 編譯；qualified local import 內有 external CSS 時可取得定義，保留 reference 依賴與 imported source 路徑。Rust9/compiler199/binding17/CLI71/Vite106/Webpack69及實際 production manifest query 三瀏覽器18對照通過；lint/types/build/Clippy/fmt/codegen/parity通過。跨入口原1FAIL為測試預期blue而實際正規化#00f，已更正並加反向順序控制。舊public仍21PASS/39FAIL，兩root API失敗hash與5runtime/compiler artifact hash不變。下一批先重現compileManifestFileSync的qualified external路徑，核對其nativeCSS契約再續file/build/no-export交付；不能以manifest-only結果結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；本批實作未提交／推送。[0125](batches/0125-project-manifest-graphs.md)。

0126：公開compileManifestFileSync新增明確delivery overload，沿用Node/Rust graph回傳完整CSS與resource資產；呼叫端須全部發布，css/nativeCSS/generatedCSS僅代表入口。6focused與205compiler、server67/MCP34/CLI71及source/built各66三瀏覽器對照通過；compiler lint/types/build通過。未指定delivery的3qualified external案例仍拒絕，最新完整legacy仍0125的39FAIL，BH-0004未結案。API census失敗hash不變，package golden新增2個刻意公開型別差異，未改golden。下一批重現實際Vite/Webpack CSS build入口並接asset publisher；native CLI/no-export與其餘契約續作。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；未提交／推送。[0126](batches/0126-file-manifest-delivery.md)。

0127：實際Vite/Webpack static CSS build各8輸入，共16build有6FAIL；成功build的60三瀏覽器對照36PASS/24FAIL，沿用BH-0004。直接插入或hoist import各12FAIL；明確分段的既有Rust graph原型18PASS，但真實bundle的slot定位/條件與資產發布尚未實作。另確認獨立BH-0045：Vite red→blue最終CSS不同卻同hash URL，fresh3PASS/保留舊回應3FAIL。現在45歷史問題：32fixed/13unresolved；65checked/10blocked、4root gates、4候選及0038身分暫停保持。下一步先建立compiler來源/範圍感知的bundle分段，再接graph註冊與發布，同時讓最終CSS與所有HTML/JS/preload引用取得正確內容hash；不能只改名CSS。此批只新增重現/證據，產品來源未改。HEAD1c6595586，未提交/推送。[0127](batches/0127-build-publication-boundaries.md)。






0131–0133批次與提交交接原文移至 [findings history0134](findings-history-0134.md)；當前狀態以本檔最新紀錄為準。

0134：修復alias／custom resolver把專案CSS誤當套件而漏裁剪的回歸；改核對實際檔案是否在原名稱的套件根目錄。新增actual10build／54browser，修後36PASS／18FAIL及1Sass buildFAIL；36個裁剪／套件／明確保留控制全通過，剩餘為virtual匯入／入口與Sass入口／匯入。compiler219／Vite110、lint/types/build、既有resolver36／resource18及Site prepare/lint通過（75warnings）。下一批接非檔案來源載入與預處理，保留條件、資源、診斷與watch；不以拒絕計完成。歷史0131–0133交接逐字歸檔。33fixed／12unresolved、10blocked、4root gates／4候選與0038身分暫停不變；HEADef7887f76，未提交／推送。[0134](batches/0134-vite-alias-pruning.md)。

0135：接通Vite virtual CSS來源載入，保留原始CSS、opaque ID/query與條件圖譜；graph-only loader子檔不再額外成為無條件入口。compiler223／Vite110、兩套件lint/types/build通過；13actual builds剩1SassFAIL，72browser為66PASS／6SassFAIL，其中virtual30與裁剪36全通過。既有resolver36／resource18／cache39、3種watch共54與純Vite控制18通過；早期watch非實體暫存路徑及錯用getWatchFiles屬harness問題，query截斷則已修復。Site prepare/lint通過（75warnings）；5artifacts不變，兩root API gates仍失敗。下一步接Sass入口／匯入預處理、virtual資源／reference與其他host路徑，再遷移Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEADef7887f76，本批未提交／推送。[0135](batches/0135-vite-virtual-sources.md)。

0136：Vite Sass入口／匯入改用主機預處理，保留CSS import條件、來源owner與partial依賴；修復additionalData重複、raw解析及CSS Modules匯出，baseFile無custom resolver亦可用。compiler225／Vite114、lint/types/build與原Vite範例通過；原host-inputs13build／78browser全PASS。擴充Sass15build全成功、90browser為84PASS／6managed-inlineFAIL；partial直接／條件／錯誤恢復共54PASS，另驗證一次預期Sass錯誤及原partial路徑。小SVG內嵌造成的network斷言及color格式斷言屬測試錯誤。Site prepare/lint通過（75warnings）；5artifacts與兩root API失敗hash不變。下一步修managed `?inline`完整字串／資產交付，再補preprocessor位置對映、Modules／其他host路徑與Webpack。33fixed／12unresolved、10blocked、4root gates／4候選及0038身分暫停不變；HEAD111046867，本批未提交／推送。[0136](batches/0136-vite-sass-sources.md)。

0137：managed CSS／Sass `?inline`改為獨立完整字串，Rust安全展開import並保留namespace／external邊界；修復URL誤改作者字串、IIFE／UMD路徑與graph-only假警告。83Rust／227compiler／118Vite及198public、84inline、90Sass、36watch瀏覽器對照PASS。early WebKit時序、pruning／lazy／其他格式、source maps與Webpack仍待驗證；compiler-Wasm+9642raw／2868gzip／1947brotli，runtime四產物不變。33fixed／12unresolved、10blocked、4root gates／4候選與0038暫停不變；HEAD087655705，未提交／推送。[0137](batches/0137-inline-css-delivery.md)。

0138：修復inline無條件發布，依Rust URL參照及實際輸出chunk裁剪子CSS／資源，保留共用anchor。Vite121／lint/types/build、10build／30browser、原inline84與watch18PASS；純Vite兩筆閒置資源保留列BASELINE。used字串仍有35byte anchor，其他格式／cycles／maps與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0138](batches/0138-inline-asset-pruning.md)。

0128–0130歷史進度逐字移至 [歷史進度（0139整理）](progress-history-0139.md)；目前狀態以本檔最新批次為準。

0139：修復SSR inline輸出本機file URL及繞過emitAssets設定；改用public base，關閉發布時搭配client資產。Vite125、SSR24build／36browser、Node16loads、worker6及原inline84browser全PASS；Site prepare/lint通過（75warnings）。首輪library格式設定與SSR弱斷言屬harness錯誤。自訂URL映射／maps／其他host與Webpack未完成；33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0139](batches/0139-inline-server-hosts.md)。

0140：inline已接renderBuiltUrl的js／css主機映射、runtime URL與URI編碼；修復映射改變卻沿用CSS檔名、relative base的client／SSR資產不一致。Vite131／lint/types/build、最終URL36／paired12／inline84／pruning30／watch18browser全PASS；Site通過（75warnings）。來源序列化仍由Rust負責，automatic hooks／multi-environment／cycles仍待驗證；下一批Sass原始位置對映，再續其他host與Webpack。33fixed／12unresolved、10blocked／4gates／4候選及0038暫停不變。[0140](batches/0140-inline-built-urls.md)。



0145：development CSS／Sass Modules接入既有主機預處理與scoped匯出／usage流程，依root／composes子檔失效cache及Vite代理modules；修復managed entry缺少具名匯出與local Sass500。Vite160／lint/types/build／範例PASS；entry／local、直接／巢狀、三瀏覽器HMR72及production60對照PASS，逐步核對新HMR且無整頁reload。preset blue色彩oracle與首次baseFile/preserveImports接入錯誤分開留證。Site通過（75warnings），五產物不變。下一批dev inline／raw／url與普通Sass、其他host／Webpack；0144巢狀缺檔主機終止仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選與0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0145](batches/0145-module-development-hmr.md)。

0141–0144歷史進度逐字移至 [歷史進度（0146整理）](progress-history-0146.md)；目前狀態以本檔最新批次為準。

0146：修復共用manifest HMR hook丟棄普通CSS／inline／raw更新modules，保留原節點並合併virtual manifest；internal18、Vite160、Astro15與三套件lint/types/build、Vite／Astro範例均PASS。修後完整開發request矩陣93PASS／3FAIL；剩managed Sass ?url的link為/style.scss，但HMR送/style.scss.css?direct，更新路徑不匹配，已留WebSocket證據待修。另Modules HMR18PASS；URL原文oracle與pure冷啟動boot判定分開記錄。Site通過（75warnings），五產物不變；20段歷史逐字歸檔。下一批先修Sass direct URL HMR，再續其他request／host與Webpack；0144巢狀缺檔仍未完成。33fixed／12unresolved、10blocked／4root gates／4候選及0038身分暫停不變；HEADeb6b479a3，未提交／推送。[0146](batches/0146-development-style-requests.md)。

部分較早批次交接逐字保存於[0159歷史歸檔](progress-history-0159.md)，目前狀態以最新交接與原批次為準。

- 0176 closes the four missing startup metric gaps from0175: unscheduled duplicate project-import declaration removed; three environment hook observations restored. Original8startup variants/304samples PASS, no declared unsampled IDs. Historical details remain in0175 and0176 batches; no fabricated zero measurements.

- 使用者再次授權提交已完成部分：0179的8個Benchmark程式／測試檔已提交 `d572f6bed`，本次重跑101tests與types通過（套件無lint script）；另同步0179–0180已收尾帳本、原始證據與2個重現腳本。389來源雜湊符合0180最終版本。0180產品修正仍依賴未完成的BH-0004 graph實作，連同套件測試、公開文件、其他對話Site變更與0181起始雜湊保留工作區；證據對應記錄的工作區來源，不能宣稱乾淨checkout可獨立重現。47historical／45fixed／2unresolved、65checked／10blocked、4root gates／4原候選及0038身分暫停保持，目標active。0181目前只有讀取與基線記錄，下一步建立retained Sass reference／virtual source資源所有權的聚焦重現；歷史HEAD及未提交敘述保留當時狀態。未推送。[提交核對](evidence/0180-commit-validation.json)。
