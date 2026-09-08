# 0002 Native stylesheet resource discovery

- 目的：原生 CSS references 的正常、註解/字串/空白邊界，是否只保留實際依賴。
- 範圍：CRATE-mastercss-engine、CRATE-mastercss-render、PKG-compiler。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9。
- 工作目錄：只有帳本與 0001 新測試；正式產品無變更。
- 已讀：engine/renderer Cargo.toml、compiler package.json/AI.md；engine stylesheet_resources/session/resources、renderer lib、compiler stylesheet/render-core。
- 資料流：compiler nativeCSS → render.ensure_stylesheet_resources → keyframes/variables/animation declarations → engine 保留或抑制資源。
- BH-0001 待驗證：keyframes 搜尋未跳過 comments/strings。
- 下一步：Rust baseline 與最小重現，再驗證 public compiler host。

## 驗證結果

- `cargo test -p mastercss-render`：baseline 8 passed，exit 0。[log](../evidence/0002-render-baseline.log)
- 新增 `crates/mastercss-render/tests/bug_hunt_stylesheet_resources.rs`；`cargo test -p mastercss-render --test bug_hunt_stylesheet_resources`：1 control passed、3 regression tests failed，exit 101。[log](../evidence/0002-resource-repros.log)
- `cargo clippy -p mastercss-render --test bug_hunt_stylesheet_resources -- -D warnings`：exit 0。[log](../evidence/0002-clippy.log)
- `node --import tsx .ai/audits/bug-hunt/repros/BH-0001-0002.mjs`：逐項輸出直接 renderer 與 public compileRenderedStylesheet 結果，exit 0。[log](../evidence/0002-public-host.log)

## BH-0001 — P2 已確認：動畫提取把字串與註解當作 CSS

- 定位：`crates/mastercss-engine/src/stylesheet_resources.rs:93` 與 `:154`；`session.rs:226` 將誤辨識名稱計入 emitted globals。
- 觸發：manifest 定義 fade，native CSS 為 `.x{content:"@keyframes fade";animation:fade 1s}`。
- 預期：輸出 manifest 的 `@keyframes fade{to{opacity:1}}`；content 字串不能定義動畫。
- 實際：generatedCSS 空字串；emittedGlobals 卻宣稱 fade 已存在。public `compileRenderedStylesheet` 同樣重現，會讓動畫失效。
- 另一方向：`content:"animation:fade 1s;"` 在沒有 animation 宣告時仍輸出 fade，增加無用 CSS。
- 註解版本也在直接 renderer 重現；compiler 會先移除一般註解，因此不得宣稱該註解版本在所有 public 路徑成立。
- 修正方向：Rust 使用既有 lexer/parser 的語法位置，跳過 comments/strings 並確認實際 at-rule/declaration；不要在 TS 補語意 fallback。

## BH-0002 — P3 已確認：raw stylesheet var() 空白漏掉依賴

- 定位：`crates/mastercss-engine/src/stylesheet_resources.rs:54`，只接受 ASCII space。
- 觸發：RenderSession.ensure_stylesheet_resources 接收 `.x{color:var(\t--color-brand)}`，manifest color-brand=red；換行、CRLF、form-feed、註解間隔也重現。
- 預期：與普通 space 一樣輸出 `--color-brand:red`；實際：缺少 theme resource。
- 影響限於 raw stylesheet renderer/binding contract；public compiler 正規化 CSS 後會消除此條件，已用 public 對照排除其直接影響。
- 修正方向：共用符合 CSS tokenization 的變數 reference 掃描，處理 CSS whitespace/comments。

## 批次結束

- 2 個已確認問題；既有 baseline 無失敗，新增失敗 tests 刻意保留作為未修正 bug 證據。
- 尚未檢查其他 native CSS 語法與資源交互；不因本批完成而標整個 engine/compiler/render 完成。
- 範圍外待辦 BH-0003：static variable 初始化只保留本身，疑似遺漏動態 dependency；交給 0003。
