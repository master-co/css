# 0149 Sass partial deletion and recovery

- HEAD `45747c24a`；起始177項來源與0148全部相符，index空。上一goal turn完成0147修復與0148主機限制實測，屬有效進展。
- 限定普通Sass @use／巢狀@forward partial的變更、刪除、恢復與partial內相對資源URL；normal／inline／url、pure／managed、三瀏覽器分開驗證。沿用BH-0004，不縮減其他要求。

## 重現與根因

| 證據 | 結果／分類 |
|---|---|
| `0149-partial-url-first.log` | 首次managed URL測試12FAIL，包含小SVG合法內嵌造成URL／原始位元組oracle誤判；更新實際已green。刪除／恢復沒有正確更新事件的失敗另行保留。 |
| `0149-partial-matrix-before.log` | 改用超過inline門檻的SVG並以真實fetch核對URL／完整內容後，72觀測54PASS／18FAIL。pure normal/inline/url皆通過；managed三種請求的刪除及恢復皆失敗，停留舊CSS。 |
| installed Vite8.2.2 `dist/node/chunks/node.js`／`index.d.ts` | handleHotUpdate僅對update呼叫；公開hotUpdate接收create/update/delete，且以this.environment提供當前graph與hot channel。 |
| `0149-missing-edge-before.log` | 新回歸FAIL：失效後的Sass預處理因缺partial而失敗，dependency callback漏掉先前已知partial，恢復檔案無法再找到owner。 |
| `0149-focused-after.log` | 修後新增edge測試＋既有dependency／URL tests共6PASS；涵蓋缺檔失敗仍保留edge、重新建立成功、成功移除import後不再保留舊edge。 |
| `0149-partial-direct-after.log`、`0149-partial-nested-after.log` | 各72PASS，共144。每組normal/inline/url ×pure/managed ×initial/update/delete/recovery ×三browser；刪除須有實際Sass錯誤或HTTP500，恢復須blue、原bootID不变，URL消費者保持一個link。 |

## 最終修改

- `sass-source.ts`由legacy handleHotUpdate改用公開hotUpdate，對create/delete同樣處理prepared source失效；只操作目前environment的公開moduleGraph與hot channel。既有served URL對應邏輯保留。
- `build-sass-source.ts`失效時清除prepared promise並保留最後依賴；重新預處理失敗仍註冊已知依賴。成功時以實際發現的依賴替換，避免永遠保留已移除的import。getPreparedSassSource不回傳已失效的舊prepared結果。
- 新增`tests/utils/bug-hunt-sass-missing-dependency.test.ts`與`repros/vite-sass-partial-hmr.mjs`。資源由partial mixer發出，相對URL必須落在theme或theme/deep目錄，HTTP200且內容完整匹配；不自行實作Sass或CSS語意。
- Vite README與Site既有directives contract補普通Sass partial錯誤／恢復與URL歸屬；明確保留CSS Modules composition缺檔限制。本批未更新fixtures/snapshots、依賴、lockfile、CI或release。
- README的5段0136–0140歷史進度逐字移至progress-history-0149.md，段落SHA-256記在history-preservation；其他四個主帳本沒有符合該段落格式，不改動其舊進度。

## 回歸與保存

- Vite163tests／29files PASS；新增1項；lint／types／build及原Vite範例build與Site檢查詳見final-checks。
- partial direct72＋nested72、原request96、Modules entry18＋local18（均巢狀）、production Modules build watch錯誤恢復18，共294browser PASS。build watch另包含兩個預期compiler錯誤與6個完成build，不與0144巢狀缺檔主機終止混淆。
- 0149-source-hashes記錄當前來源，五項compiler／engine／runtime artifacts與0148逐位元組相同；未改runtime core，不宣稱效能或payload改善。
- 四個root gates與既有兩個API失敗證據保持未完成；本批沒有公開API／Rust契約變更，不刷新golden。

## 接續

1. 先驗證hotUpdate的client／SSR環境及server restart隔離，避免把本批client的成功外推到多環境。每個來源owner／hot channel都須有真實環境證據。
2. 再補resource/reference ownership（含資源內容變更、多root、外部來源）、其他preprocessor/PostCSS、完整published maps與Webpack交付。
3. 0144巢狀CSS Modules composition缺檔仍會終止host；0148 Modules ?url仍未交付。主機拒絕／限制不算完成；原Webpack3build／12browser與legacy39browser失敗亦保留。
4. 45historical findings為33fixed／12unresolved；75coverage為65checked／10blocked；另4root gates／4候選。0038仍等待明確身分驗證通過。本批不commit／push，完整目標active。
