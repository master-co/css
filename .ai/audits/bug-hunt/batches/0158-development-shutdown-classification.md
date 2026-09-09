# 0158 Development 關閉程序的主機分類

## 基線與本批範圍

- 前一目標輪修復BH-0046及完成209tests／216browser，屬有效進展。0157來源雜湊全部一致，HEAD42ccdc182，0038仍待使用者明確身分確認。本批沒有修改正式產品或套件測試、依賴與fixtures/snapshots。
- 本批檢查0157的關閉候選，不能把記錄阻礙視為完成。以獨立程序自然exit0、Node未完成top-level await的exit13、確認native handle後明確SIGTERM三類終態區分。

## 根因範圍的證據

- 新vite-shutdown-handles.mjs對實際scanner／renderer prototype及Vite公開hooks留trace；第一個progressive CSS/runtime控制可見scanner dispose一次、兩個renderer dispose與所有close hooks完成，最後仍有一個referenced active native async handle。單憑HTTP500不能歸咎scanner或renderer漏dispose。
- 五mode（純Vite／static／runtime／pre-render／progressive）×六request（無、HTML、CSS、runtime、CSS→runtime、HTML→CSS→runtime）30個獨立程序：19自然exit0、11確認殘留後終止。所有不碰runtime的控制正常；請求runtime的情境具時序差異。
- 純Vite只匯入runtime dependency的三控制自然退出；使用完整bootstrap與stub virtual manifest/globals後純Vite也殘留native handle，與Master CSS modes一致。為排除harness import Master CSS Node API的影響，另建vite-virtual-shutdown.mjs：只import Vite與Node內建模組，虛擬entry引用runtime dependency與兩個stub virtual/HMR imports；optimizer開／關均重現同一native殘留。
- 因此已排除「必須有Master CSS Vite插件或Node scanner/renderer才發生」；沒有證據將此分配成新的Master CSS產品finding ID。具體native library／Vite cancellation根因未定位，仍保留為Vite host交付／關閉限制，不是已修復。
- 小型臨時dependency及magic-string控制另見server.close的未完成top-level await，Node自然exit13；其程式未走到close完成checkpoint，不與native handle的SIGTERM控制合併。相應自建暫存root已核對內容後清理。

## 等待既有工作完成的控制

- 公開client environment的waitForRequestsIdle先完成待處理transform，然後server.close：pure-full／runtime／progressive × runtime或CSS→runtime六控制全自然exit0。
- 不以禁用optimizer當產品修復：同一runtime/full-bootstrap的optimizer-off六控制仍native殘留。
- 原vite-qualified-dev-status.mjs的目的為CSS交付查核，改在finally先等待requests idle，再關閉server；保留requestsIdle／closed checkpoint。直接close行為由以上獨立重現保留；沒有改Vite依賴、正式插件，或把等待控制當直接close已修復。
- 0157已確認的BH-0046仍修復，BH-0004 qualified CSS回傳500仍未修。新drained HTTP log保留兩模式的CSS500／runtime200與正常終態。

## 可重現與終態

- 首輪69個獨立cases分別保存在mode-request30、pure-runtime9、full-bootstrap6、minimal-virtual8、optimizer-off6、standalone-full2、magic-string2及drained-host6個JSON。最終standalone namespace-import版本另2控制確認同樣殘留，總計71cases：36自然0、3自然13、32留證後SIGTERM。各JSON包含pid、stdout、checkpoint、native report和真正exitCode；runner .py原文均保留在evidence/0158-runner-*.py。
- parent僅在子程序已記錄observationsFinished且報出referenced native handle後終止該owned child；沒有因觀察timeout重啟。第一個單獨trace亦先保留同樣證據再SIGTERM，session24712 terminal143。
- 重現：`BH_MODE=progressive BH_REQUEST=css-runtime BH_TRACE=1 node .ai/audits/bug-hunt/repros/vite-shutdown-handles.mjs`；加入`BH_DRAIN=1`比較正常收尾。純Vite最小控制：`BH_FULL=1 node .ai/audits/bug-hunt/repros/vite-virtual-shutdown.mjs`。未drain版本會保留已確認的host殘留，需按report明確終止owned程序。

## 保存與接續

- 0157共同交接逐字歸檔，原logs/batches/失敗source不覆寫。產品來源與五Wasm/runtime/manifest產物byte-identical；本批只增重現／證據、修改一個既有CSS重現的收尾及帳本。
- 46historical／34fixed／12unresolved、65checked／10blocked、4root gates、4原候選+1主機關閉待辦；0038暫停維持。未commit/push；來源保存與命令終態見0158-final-checks.json。
- 下一批回BH-0004 dev圖譜：LocalComposePlugin與StyleEntryPlugin仍用舊攤平分類，registerStylesheetSource／getExtractedCSSResult只有build delivery。須一起提供server可取得的child CSS/resources、原始conditions/external imports、SSR及watch失效，不能只開preserveImports或返回build placeholder。再續Nuxt子CSS實際頁面、Webpack並行dist及全部原有未完成要求。
- 主機關閉限制仍需對已固定Vite版本追native cancellation／transform pending ownership；本批僅分類並解除CSS調查的收尾障礙，並未完成此待辦。
