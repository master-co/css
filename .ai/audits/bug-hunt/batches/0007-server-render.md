# 0007 Server HTML and hydration contract

- 目的：HTML/class rendering、subset snapshots 與 hydration metadata 對應；錯誤輸入及 session cleanup。
- 範圍：PKG-server、CRATE-mastercss-render；engine/binding 以 0001/0002/0006 配對。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9。
- 工作目錄：audit/tests 及外部 site/reference；不修改後者。tracked 產品未變更。
- 下一步：server package/AI 與 source/tests；確認是否有 fixture 寫入再跑 baseline。

## 待驗證

- 已讀 server manifest/AI、parse-html/render/html-render-session 與 fixture runner；runner 只讀 fixtures。
- BH-0005：parse-html 先以 raw whitespace 分割再 decode entities，可能漏掉 `&#32;` 分隔的 class。
- BH-0006：render.ts 將 CSS text 原樣放進 style，疑似未阻止 CSS 字串中的 HTML `</style>` 結束標籤。

## 基準與驗證

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-server exec vitest run`：原有 11 files / 57 tests passed。[baseline](../evidence/0007-server-baseline.log)
- 追蹤 parseHTML → decoded classes → cached render session/subset → CSS style/hydration injection → HTML serialization；既有測試包含 entities、既有 style、無 head/html、stream chunk/end/dispose、cache cap 與 hydration modes。
- `node --import tsx .ai/audits/bug-hunt/repros/BH-0005-0006.mjs`：Chromium 比較原始和渲染後 HTML，只在本機新 page 使用無害變數 marker。[browser log](../evidence/0007-browser-repro.log)
- 新增 `packages/server/tests/bug-hunt.test.ts`：3 regressions failed，exit 1。[log](../evidence/0007-regressions.log)
- `pnpm --filter @master/css-server lint` 通過（最後新增 BH-0007 後需重跑）。[log](../evidence/0007-server-lint.log)

## BH-0006 — P1 已確認：HTML-encoded class 可逃出 style 並執行腳本

- 定位：`packages/server/src/render.ts:165`、`:168`，以 raw CSS 建立 style Text 並不編碼序列化。
- 觸發：default manifest；class 為 `content:'&lt;/style&gt;&lt;script&gt;globalThis.__audit=1&lt;/script&gt;'`。
- 預期：原本安全的 HTML attribute 仍只提供 CSS content 字串，不新增可執行元素。
- 實際：生成的 declaration 包含未防護 `</style><script>…`。瀏覽器在 CSS 引號內仍結束 HTML raw-text style；original scriptRan=false，rendered scriptRan=true、scriptCount=1。
- 影響：若不可信輸入能進入已 HTML-encoded 的 class 並經 SSR renderer，會形成腳本注入；不要求不可信 manifest。沒有宣稱所有產品路徑或 CSP 環境皆可利用。
- 修正方向：在 HTML style 注入邊界使用保留 CSS 語意的 raw-text 安全序列化，涵蓋大小寫 closing tags、已存在 style 與 hydration 一致性。普通 HTML entity encoding 不適用 style raw text。

## BH-0005 — P2 已確認：HTML character references 與 class tokenization 不一致

- 定位：`packages/server/src/decode-html.ts:7` 只解少量 entities；`parse-html.ts:42` 在 decode 前以 JavaScript whitespace 分割。
- 觸發：`<div class="block&#32;hidden"></div>`。
- 預期：瀏覽器 classList 是 block/hidden，SSR 產生兩條 CSS；實際：server classNames 是 `block&#32;hidden`，cssText 為空。
- Chromium classList 對照證實；一般空白 control 正常。其他 numeric/named references 未逐一窮舉。
- 修正方向：使用已有 HTML parser 的完整 attribute entity decoding，再以 HTML ASCII whitespace tokenization 分割；保持原始 HTML 序列化契約。

## BH-0007 — P2 已確認：沒有 class 屬性時遺漏 static resources

- 定位：`packages/server/src/create-server-renderer.ts:56`，沒有 document classes 時不建立 snapshot。
- 觸發：manifest color-brand=red/static=true；HTML `<p style="color:var(--color-brand)">text</p>`。
- 預期：靜態 theme 初始 CSS 不依赖 class；實際：cssText 空字串。加入無效 `class="unknown"` 即輸出 theme，證明與 engine static dependency 問題 BH-0003 不同。
- [直接比較 log](../evidence/0007-static-no-class.log)；BH-0007 regression test 固定重現。
- 修正方向：無 class 的 HTML 仍取得包含初始資源的空 class snapshot，再由實際 cssText 決定注入。

## 結束

- 3 個新問題已確認；既有 baseline 無失敗。新增測試失敗刻意保留，不修改 fixture 或產品。
- server/render 的列明檢查完成；HTML 全語法／不同 sanitizer/CSP／stream 所有切割點未窮舉。
- 下一批 0008 runtime startup/hydration，再以 0009 DOM mutation/cleanup 分批。
