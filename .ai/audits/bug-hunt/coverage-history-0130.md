# 覆蓋歷史進度（0130整理）

目前狀態見 [coverage.md](coverage.md)；以下原文保留當時交接與限制。


- 0081 completion review retains all75rows andremainingcells: [requirements/evidence map](batches/0081-completion-evidence-audit.md).13blocked unchanged; explicitlocalfollow-ups remain.

- 0083 existing editor corpus bounded controls: [batch](batches/0083-vscode-corpus.md). No blocked unit cleared.

- 0087fullremaining/prerequisite reconciliation: [current75rowmap and unblock steps](batches/0087-completion-prerequisites.md).13blocked retained; no full-completion claim.

- 0087thirdconsecutiveprerequisite recheck: overallgoalblocked, notcomplete; unitstatusesremain62boundedchecked/13blocked. See [unblock steps](batches/0087-completion-prerequisites.md).

- Resumedrun1: overallgoalactive again; freshimpasse count1,13unitblockers unchanged. Priorblockedstatus ishistorical.

- Resumedrun1thirdcheck: overallgoalblocked again;62boundedchecked/13blocked unitstatuses unchanged.

- 0108跨層驗證：lexer新增3testsPASS，CSS72/compiler127/server67及runtime273PASS；不代表BH-0001完成，新value4PASS/5FAIL保留。Native/engine Wasm已重建，compiler/tooling Wasm未重建；runtime sidecar gzip增4503bytes。65checked/10blocked不變；[當前未完成與下一步](batches/0108-animation-syntax-partial.md)。

- 0109：BH-0001完成，lexer16tests及render syntax/value/variable控制通過；CSS72/compiler127/server67/runtime273皆PASS。Native/engine與compiler Wasm已重建，tooling Wasm未重建；engine sidecar gzip增22484bytes，效能/記憶體代價見[0109](batches/0109-animation-value-context.md)。65checked/10blocked、其他未完成不變。

0110：BH-0002 raw var() syntax修復，engine/render與public hosts/native/Wasm/runtime驗證完成；[0110](batches/0110-variable-syntax.md)。65checked/10blocked保持，已記錄限制仍不計完成。

0111：BH-0003 static依賴保留修復；engine/compiler/native/Wasm/runtime檢查與效能成本完成，[0111](batches/0111-static-retention.md)。65checked/10blocked不變；Node預設Wasm loader另列待分類，不能由explicit-bytes parity推論其完成。

0112只完成BH-0004追加診斷，產品仍部分修正；60browser21PASS/39FAIL不是完成證據。[0112](batches/0112-external-import-order.md)；65checked/10blocked不變。

0113：compiler Rust graph與renderer的18cases/108browser、42Rust及132host testsPASS；public入口60對照仍39FAIL。Compiler/project/build/CLI整體交付及URL base仍未完成，65checked/10blocked不變。[0113](batches/0113-stylesheet-boundaries.md)。

0114：compiler graph已做directive/native編譯及native/Wasm transport，新增公開compileStylesheets的126browser、50Rust/153compiler、binding17/Wasm4PASS。既有file/project/stylesheet/build/CLI與相對資源URL仍未接通；API census/package golden仍FAIL，65checked/10blocked不變。[0114](batches/0114-compiled-stylesheets.md)。

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

本次依使用者要求整理提交（父提交 `912a73b26`）：僅納入 0120–0122 已完成的調查紀錄、驗證證據與三個重現腳本。BH-0004 的產品、測試及公開文件實作仍未完成整體交付，保留未提交；其他對話的 Site 變更保持原樣。81 個來源／保留檔案雜湊與 0122 最終記錄全部一致。證據對應這些工作區版本，重現腳本仍依賴未提交來源，不能宣稱本提交的乾淨 checkout 可獨立重現修復後結果。0123 已開始：發布寫入失敗破壞既有 CSS，以及覆寫使用者修改的 sidecar，兩項回歸均 FAIL；其測試與證據保留工作區，下一步完成不可覆寫資產與入口切換，再驗證所有權及清理。32 已修復／12 未解決、65 已檢查／10 受阻、4 項 root gates、4 個待分類候選及 0038 身分驗證暫停均保持；未推送。

0123：Node CLI 發布改用版本化、不可覆寫的 sidecars，完整寫好資產後才原子切換入口；原2失敗回歸、擴充9發布控制及完整52CLI通過，source/built各12發布browser、既有built export18與watch12通過。重複輸出bytes一致，寫入失敗及舊入口讀者仍可讀取原資產；lint/types/build通過。舊資產保留，所有權／清理、其他graph入口及39個legacy失敗仍未完成。下一批先驗證跨執行與多輸出資產所有權，再設計保留期限及中斷恢復，不能立即刪掉舊讀者依賴。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；本輪未提交／推送。[0123](batches/0123-immutable-cli-publication.md)。

0124：Node CLI 已加入跨執行的資產所有權、發布 journal 恢復及有期限清理；保留目前／上一版，其餘版本至少保留24小時（本輪採用已說明的預設，未收到偏好回覆）。71CLI、4個SIGKILL恢復控制、source/built各120跨程序臨界區及合計90browser對照通過，使用者修改／原有檔案、另一輸出與仍被引用的借用資產保留；lint/types/build通過。未記入journal的早期暫存檔與非協作writer等限制仍明列。下一批回到compileCSSFile／compileCSSManifestFile／compileProjectManifest及下游資產契約；最新legacy39FAIL仍未修復，不能用CLI子集結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選及0038身分暫停不變。HEAD74e471917；未提交／推送。[0124](batches/0124-cli-asset-ownership.md)。

本次依使用者要求整理提交（父提交 `74e471917`）：僅納入 0123–0124 已完成的調查、證據與三個重現腳本。BH-0004 的產品、測試及公開文件實作與其他對話的 Site 變更保留未提交。0124 的 12 個本批來源雜湊全部一致；80 個保留來源中，77 個一致，3 個已由進行中的 0125 修改（rust-contract.ts、protocol.ts、stylesheet/index.ts）。歷史證據對應各批來源雜湊的工作區版本，腳本依賴未提交實作，不能宣稱本提交的乾淨 checkout 可重現修復後結果。0125 已開始 manifest-only project graph：compiler 197 tests、lint/types 通過；Rust project 8 PASS／1 FAIL，失敗為 structured_project_entries_merge_in_order 的 CSS 斷言，根因尚未分類。先檢查實際 CSS 與跨入口定義覆寫，再續 native 下游及 manifest loader 驗證；0125 實作、測試與證據均留工作區。32 已修復／12 未解決、65 已檢查／10 受阻、4 項 root gates、4 個待分類候選保持未完成；0038 追加驗證仍等待明確身分確認。未推送。

0125：Node project manifest 改以原始逐檔 import/reference graph 交由 Rust 編譯；qualified local import 內有 external CSS 時可取得定義，保留 reference 依賴與 imported source 路徑。Rust9/compiler199/binding17/CLI71/Vite106/Webpack69及實際 production manifest query 三瀏覽器18對照通過；lint/types/build/Clippy/fmt/codegen/parity通過。跨入口原1FAIL為測試預期blue而實際正規化#00f，已更正並加反向順序控制。舊public仍21PASS/39FAIL，兩root API失敗hash與5runtime/compiler artifact hash不變。下一批先重現compileManifestFileSync的qualified external路徑，核對其nativeCSS契約再續file/build/no-export交付；不能以manifest-only結果結案。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；本批實作未提交／推送。[0125](batches/0125-project-manifest-graphs.md)。

0126：公開compileManifestFileSync新增明確delivery overload，沿用Node/Rust graph回傳完整CSS與resource資產；呼叫端須全部發布，css/nativeCSS/generatedCSS僅代表入口。6focused與205compiler、server67/MCP34/CLI71及source/built各66三瀏覽器對照通過；compiler lint/types/build通過。未指定delivery的3qualified external案例仍拒絕，最新完整legacy仍0125的39FAIL，BH-0004未結案。API census失敗hash不變，package golden新增2個刻意公開型別差異，未改golden。下一批重現實際Vite/Webpack CSS build入口並接asset publisher；native CLI/no-export與其餘契約續作。32fixed/12unresolved、65checked/10blocked、4root gates、4候選與0038身分暫停不變。HEAD1c6595586；未提交／推送。[0126](batches/0126-file-manifest-delivery.md)。

0127：實際Vite/Webpack static CSS build各8輸入，共16build有6FAIL；成功build的60三瀏覽器對照36PASS/24FAIL，沿用BH-0004。直接插入或hoist import各12FAIL；明確分段的既有Rust graph原型18PASS，但真實bundle的slot定位/條件與資產發布尚未實作。另確認獨立BH-0045：Vite red→blue最終CSS不同卻同hash URL，fresh3PASS/保留舊回應3FAIL。現在45歷史問題：32fixed/13unresolved；65checked/10blocked、4root gates、4候選及0038身分暫停保持。下一步先建立compiler來源/範圍感知的bundle分段，再接graph註冊與發布，同時讓最終CSS與所有HTML/JS/preload引用取得正確內容hash；不能只改名CSS。此批只新增重現/證據，產品來源未改。HEAD1c6595586，未提交/推送。[0127](batches/0127-build-publication-boundaries.md)。

本次依使用者指示整理提交（父提交 `1c6595586`）：僅納入 0125–0127 已完成的調查、證據與五個重現腳本。BH-0004 的產品／測試／公開文件、0128 BH-0045 進行中實作及其他對話的 Site 變更均保留未提交。0127 記錄的 103 個來源／保留雜湊全部一致；歷史證據依賴未提交的工作區實作，不能宣稱本提交的乾淨 checkout 可獨立重現修復後結果。0128 已有 Vite 110 tests、lint/types/build、7 模式 21 builds／39 browser 對照通過，已知程序均結束；尚須完成 hook 順序影響的 runtime/progressive 控制、最終原始重現、文件與批次結案，BH-0045 保持未解決。32 已修復／13 未解決、65 已檢查／10 受阻、4 root gates、4 候選與0038身分暫停均保持；未推送。