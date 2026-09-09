# 0157 Development runtime 的 base URL

## 基線與範圍

- 上輪完成0155–0156查核提交42ccdc182（87檔），125排除變更byte-identical；屬有效進展。持續目標保持active；0038追加驗證仍等使用者明確身分確認。本批不commit/push。
- 本批前0156的196來源雜湊一致，另補兩個runtime injection/preload來源基線。先獨立分類0156的新dev runtime404候選，再接續BH-0004 development graph。

## BH-0046（P2，已修復）

- 不含任何CSS的HTML，在runtime／progressive兩模式下，base=/皆200；base=/base/皆404。新4actual-server tests為2PASS／2FAIL，0157-base-before.log保存實際HTML注入URL與Vite錯誤回應。
- InjectRuntimeServePlugin在post HTML hook注入根目錄/@id/__x00__virtual:master-css-runtime，未加入resolved base；RuntimePreloadPlugin的dev link亦相同。與BH-0004 qualified graph500是獨立問題，沿用新增ID BH-0046。
- 修復使用既有toAssetHref與實際HTML server的resolved base，script與preload一致；虛擬ID、build入口、runtime核心與CSS語義不變。新增六種base及根／巢狀HTML的actual-server回歸，12cases通過。

## 未完成與下一步

- 完整Vite209tests／38files（BH_QUALIFIED=1）、focused21、lint/types/build、原Vite範例PASS。新12cases涵蓋六種base（/、/base/、多層、空、./、完整URL經dev正規化）×runtime/progressive，逐一HTTP請求根／巢狀HTML的script/preload並取得200。
- 新built-package browser重現六base×兩mode×兩HTML路徑×三browser×初始／class更新／theme HMR＝216觀測全PASS。檢查bootstrap200、script/preload一致、實際色彩與padding、單一style#master-css及bootID不變。此程序自然退出0，未強制清理。
- BH-0046只改Vite的dev HTML URL，不改runtime核心、CSS語義或build注入；五個Wasm/runtime/manifest產物bytes不變。套件README同步base行為；無Site修改。
- BH-0004 development graph500、Nuxt子CSS實際交付、Webpack並行dist競態與原12unresolved／10blocked／4root gates／4原候選仍未完成。0156候選現升為BH-0046並完成修復；新增以下關閉候選仍待分類。

## 關閉程序的新增候選（未分配finding ID）

- qualified dev HTTP控制在pre-render/progressive皆得stylesheet500、runtime200；error文本仍指local-compose攤平。兩個HTTP結果並不代表整個控制正常退出。
- 首程序PID74534移除兩root、沒有listening sockets卻仍存活。sample顯示main loop等候；只對此owned Node啟用loopback inspector，資源報告顯示JS resources/handles/requests/workers皆空，但一個referenced active native async handle。原source/log、精簡report與終止理由保存，明確SIGTERM後exit143。
- 修正新腳本未consume runtime response的缺口，新增server.close完成與觀察結束checkpoint、五秒後未退出時的native handle報告。qualified與無qualified兩模式控制仍留下相同native handle；progressive單獨且普通CSS也重現。三個程序都記錄close完成／暫存清理／native handle後才SIGTERM，terminal均143；不將其視為通過或僅因觀察timeout重啟。
- 新候選尚未證明是PreRender renderer、scanner、依賴或harness根因。對照216browser矩陣會實際開HTML且正常退出；目前控制只HTTP請求CSS與runtime。下一步以獨立程序比較先fetch HTML、只CSS、只runtime、四mode與純Vite，追configResolved/buildStart/loadCSSManifest與close順序及native owner dispose，確認後才配ID／修復。
- 再接BH-0004 development graph：LocalComposePlugin／StyleEntryPlugin的分類仍build-only preserveImports；registerStylesheetSource與getExtractedCSSResult的delivery同樣build-only，dev須提供真實子CSS/resource URL與HTML/SSR/watch生命週期。不能只開flag而回傳build placeholders。

## 最終保存

- 0155–0156兩個共同交接段落／10出現逐字歸檔至progress-history-0157.md，proof保存原文、雜湊與來源映射；歷史batch/log不覆寫。
- 46historical confirmed／34fixed／12unresolved、65checked／10blocked、4root gates、4原候選+1新增關閉候選；0038身分驗證暫停不變。所有本批命令已terminal，HTTP shutdown控制的143與正常驗證0明確區分。
- source/artifact/inventory與最終檢查見0157-final-checks.json。未commit/push，其他工作及未完成產品變更保留。
