# Batch 0237: Next generated globals through PostCSS

0236 made progress: graph/PostCSS prototype fixed five bounded cases and parse-stage map loss, but generated globals hit an explicit guard. Opening659sources/493sharedartifacts/49candidate sources/54candidate artifacts match0236. All52remaining historical entries and0038identity pause retained.

## 目前候選與實作

在owned候選套用0236 **corrected** prototype，再完成這批generated-global流程。現在保留0237的54source inputs／64dist files，沒有恢復0231；0236 baseline／兩版archive仍在，可精確回退。正式`packages/next`及其他產品沒有套用，未commit／promotion。

將Rust生成的global CSS與lowered authored CSS放入同一PostCSS AST，以節點metadata保留global歸屬，沿用Next原生PostCSS loader處理一次。plugin看到的是未包裝的正常selector，能同時觀察作者規則與generated globals。完成後才使用Next既有CSS Modules global syntax／逐規則pure-ignore annotation保護generated節點，再由原有Module plugins處理；輸出不殘留這些annotation。保留plugin移動與clone後的順序，不拆成兩次PostCSS。

最終publication階段使用空manifest重連已完成的CSS graph，避免再次附加未經PostCSS的原始theme/keyframes。manifest收集及lowering仍使用完整原manifest；沒有更改Rust語義或public compiler API。PostCSS新增Master資源／參照的閉包仍須另外驗證，不能把此階段選擇當完整支援證據。

## Global animation 修正

首輪actual keyframe build成功，但2browser FAIL：全域`fade` keyframe保住，作者animation卻被Module processor變成`card_fade__...`，瀏覽器沒有有效animation。

修正放在Next local-by-default與scope兩個階段之間：只使用Next已識別的`:local(...)` animation標記，保留確定屬於generated globals的名稱，不自行猜shorthand token。ICSS子檔沿用root完成PostCSS後的global animation名稱。正確版root與ICSS child各2browser PASS，animationName為fade且實際keyframe opacity為plugin改過的0.25；同名局部`.fade`仍得到獨立Module export。

這是候選整合時發現並修正的問題；首輪CSS、computed style、frames與失敗證據保留，不新增重複問題ID。

## Actual Next Webpack production matrix

| 行為 | 最新結果 |
|---|---|
| 0236曾失敗的theme global案例 | 2browser PASS，無guard |
| plugin同時需要.direct及:root才改變theme變數 | 2browser PASS；combined-root trace保留 |
| component lowering＋theme global共同處理 | 2browser PASS |
| plugin clone generated global rule | 2browser PASS；未重跑原始manifest覆蓋修改 |
| generated keyframe及PostCSS改動 | 修正後2browser PASS |
| ICSS child引用root generated keyframe | 2browser PASS |
| 0232原五個PostCSS失敗scenario | 10browser PASS |
| 既有local @compose控制 | 2browser PASS |

本批13個actual builds全部成功；歷史觀察共24browser PASS／2FAIL，2FAIL為已修正的首輪animation錯配，不能從原始紀錄刪除。正式工作區尚未交付。**0232的candidate-only五案10FAIL已被0237隔離版通過證據取代**；不要把舊remaining文字當成現在candidate仍有同樣10FAIL，也不能因此結案BH-0004的完整要求。

## 額外處理器／map／套件證據

- 使用真實Next Module processors的5個獨立控制、共10browser PASS：selector list含escaped comma、clone、移動global順序、同名局部class、同名局部class與global animation。globals不出現在Module exports，局部同名class仍scope。
- 11組actual map inputs共14selector anchors全部PASS，驗證原始file、line、column與完整sourcesContent，含ICSS／inline／generated compose／global相關entry。沒有宣稱每個declaration或generated global都已具精細原始錨點。
- 全套128tests、3e2e、18graph controls、build、types、lint PASS。沿用0236 owned pipeline test對兩個dispatcher的讀取及options object identity斷言，未改root既有測試。
- 初始keyframe失敗是原型行為錯配，非build/script故障。global clone probe在執行前改成先收集原decl再clone，避免test walker遍歷新增clone，沒有失敗產品結論。
- 未新增依賴、lockfile、CI/release或正式fixtures/snapshots，493shared artifacts不變。runtime瀏覽器包未更動，未做新效能主張。

## 保存、限制與下一步

完整15source-file候選patch：`repros/next-global-postcss-loader-candidate.patch`，對目前root只做`git apply --check`且PASS。這是可檢閱候選，不代表已套用或整體可交付。原有四個Next test patch／lightweight test／PostCSS pipeline test權限仍各自保留；不能把任一授權擴充為全部交付。

0238優先用actual host檢查PostCSS新增@import／ICSS／resource、globals新增參照及child scopes，補足raw discovery後新增依賴的處理；再查Sass native pipeline、watch invalidation/recovery與snapshot生命週期。特別保留以下未完成：任意plugin重建／合併不同ownership的AST節點、遺失metadata或包含自訂非序列化metadata；global資源URL／reference閉包；無map producer及全部精細maps；完整跨條件／SSR／Turbo/native API／Firefox／歷史raw gates等。現有少數ownership guard不代表所有plugin組合已安全或完整支援。

PostCSS快照新增於owned project `.master/postcss`，長期watch清理、cache復用與變更失效仍需證據，不能用本批fixture清理代替。完整目標active；53個remaining歷史條目保留，新增最新取代／未完成說明。0038仍未得到explicit identity確認，追加驗證繼續暫停。

[總核對](../evidence/0237-final-checks.json) · [actual矩陣／patch](../evidence/0237-summary.json) · [global controls](../evidence/0237-global-controls.json) · [maps](../evidence/0237-map-matrix.json) · [子檔動畫map](../evidence/0237-imported-keyframe-maps.json)
