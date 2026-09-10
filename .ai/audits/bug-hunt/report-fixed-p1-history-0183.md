# Completed P1 report history

## BH-0006 · P1 · SSR CSS 未安全嵌入 HTML

[packages/server/src/render.ts:165](/Users/aron/master/css/packages/server/src/render.ts:165)。可控制的 encoded class 經解碼嵌入 style；應保持 CSS 資料邊界，實際可改變 HTML 結構並執行腳本。本機無害標記已驗證，不重跑。

修正方向：在 HTML raw-text 邊界安全序列化 CSS，或採外部 CSS 輸出，同時保持 CSS 語意。 [重現與證據](batches/0007-server-render.md)。

## BH-0013 · P1 · Unicode 前綴切片造成 Rust panic

[crates/mastercss-language/src/document.rs:218](/Users/aron/master/css/crates/mastercss-language/src/document.rs:218)。class 函式前有多位元組字元；應正常分析，512-byte 切點卻落在 UTF-8 字元內而 panic。未宣稱整個 LSP process 崩潰。

修正方向：將回溯切點校正到字元邊界。 [重現與證據](batches/0012-language-ir.md)。

## BH-0021 · P1 · Installer 破壞多行 import

[packages/create/src/transforms.ts:23](/Users/aron/master/css/packages/create/src/transforms.ts:23)。既有設定有多行 import；setup 應保持可解析，實際把新 import 插入舊 declaration 中間，導致建置無法啟動。

修正方向：依完整 import declaration 邊界插入並保留 directives/comments。 [重現與證據](batches/0031-create-setup.md)。

## BH-0022 · P1 · Figma 無法正確匯入自己的 export

[packages/figma/src/features/setCollectionVariables.ts:52](/Users/aron/master/css/packages/figma/src/features/setCollectionVariables.ts:52)。exporter 產出 definitions array；importer 應還原變數與 modes，實際寫出 0/key 等 metadata 名稱。實際函式由明示 mock Figma API 驗證，未操作真實檔案。

修正方向：先將支援的兩種資料形狀正規化，再寫入變數及 modes。 [重現與證據](batches/0033-figma-variables.md)。

## BH-0023 · P1 · Nuxt progressive 缺少 client manifest

[packages/nuxt/src/module.ts:255](/Users/aron/master/css/packages/nuxt/src/module.ts:255)。使用預設 progressive 模式；應取得 JSON 完成 hydration，實際 asset 未發布而回傳 HTML，client/runtime 無法啟動。真實建置及 Chromium 重現。

修正方向：所有需要 client manifest 的模式均發布對應 Nitro public asset。 [重現與證據](batches/0035-ssr-examples.md)。

