# Fixed P2 report history

## BH-0001 · P2 · CSS 字串與註解被當成動畫宣告

[crates/mastercss-engine/src/stylesheet_resources.rs:93](/Users/aron/master/css/crates/mastercss-engine/src/stylesheet_resources.rs:93)。raw CSS 字串或註解含動畫關鍵字；應只分析有效語法，實際遺漏或多產 keyframes，影響動畫與 emitted globals。

修正方向：使用 CSS lexer/結構化宣告分析，排除字串與註解。 [重現與證據](batches/0002-stylesheet-resources.md)。

## BH-0003 · P2 · static token 的依賴未保留

[crates/mastercss-engine/src/resources.rs:160](/Users/aron/master/css/crates/mastercss-engine/src/resources.rs:160)。static variable 引用其他 token；初始化或最後 class 刪除後，應仍有依賴 CSS，實際依賴消失而無法解析變數。

修正方向：static 資源也遞迴保留及計數依賴。 [重現與證據](batches/0003-static-resources.md)。

## BH-0005 · P2 · SSR 未解碼 numeric HTML references

[packages/server/src/decode-html.ts:7](/Users/aron/master/css/packages/server/src/decode-html.ts:7)。class 含十進位或十六進位 character reference；應與瀏覽器 class 一致，實際 class 不同或缺 CSS。

修正方向：完整解碼 HTML character references，核對分詞順序。 [重現與證據](batches/0007-server-render.md)。

## BH-0007 · P2 · 無 class 的 HTML 缺 static 初始資源

[packages/server/src/create-server-renderer.ts:56](/Users/aron/master/css/packages/server/src/create-server-renderer.ts:56)。Manifest 有 static theme/keyframes、HTML 無 class 屬性；應仍輸出初始資源，實際略過 snapshot 而缺樣式。

修正方向：讓空 class 集合也建立必要初始快照。 [重現與證據](batches/0007-server-render.md)。


## BH-0008 · P2 · 嚴格 CSP 下 external hydration 啟動失敗

[packages/runtime/src/hydration.ts:70](/Users/aron/master/css/packages/runtime/src/hydration.ts:70)。CSP 禁止動態程式求值；應可讀取 hydration 資料，實際 Function constructor 拋錯而中止 startup。既有證據不重跑。

修正方向：採可由 bundler 處理的載入或明確 JSON 讀取，維持 CSP 限制。 [重現與證據](batches/0008-runtime-hydration.md)。

## BH-0009 · P2 · iframe root 漏掉 class mutation

[packages/runtime/src/class-tracker.ts:67](/Users/aron/master/css/packages/runtime/src/class-tracker.ts:67)。Root 是其他 realm 的 iframe Document；class 更新應改 CSS，實際 instanceof Element 不成立而跳過。三瀏覽器重現。

修正方向：使用 root 所屬 realm 或適當 DOM 能力判斷節點。 [重現與證據](batches/0009-runtime-mutations.md)。

