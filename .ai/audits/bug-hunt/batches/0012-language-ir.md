# 0012 Language IR and UTF-16

- 目的：Rust language document/position/semantic/edit IR，Unicode/CRLF、invalid ranges、session disposal/cache。
- 範圍：CRATE-mastercss-language、PKG-tooling language；editor host 留 0014。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal changes 保留。
- 已讀 language Cargo/AI、positions.rs、session.rs、tooling language session/工廠與相關 tests。
- 下一步：Rust/TS baseline，對 raw/unescaped string 的 semantic range 與 formatting 冪等性作最小驗證。

## 驗證

- `cargo test -p mastercss-language`：新增測試前 12 passed，exit 0。[log](../evidence/0012-rust-language.log)
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-tooling exec vitest run tests/language`：新增測試前 5 files / 18 passed，exit 0。[log](../evidence/0012-ts-language.log)
- 正常 markup/script/CSS contexts、語意/color/completion、native/Wasm 不可變結果/重複 dispose、directive format 範圍與註解排除通過。
- 新 `crates/mastercss-language/tests/bug_hunt_unicode.rs`；`cargo test -p mastercss-language --test bug_hunt_unicode`：1 fail，exit 101。[log](../evidence/0012-unicode-regression.log)
- 新 `packages/tooling/tests/language/bug-hunt.test.ts`；同 vitest 命令指定該檔：1 fail / 1 pass，exit 1。[log](../evidence/0012-language-regressions.log)
- 額外 control：emoji/中文 + CRLF 格式化保留上下文、第二次無 edits、surrogate 中間的 hostRange 回報錯誤，通過。
- targeted clippy 與 tooling lint exit 0：[clippy](../evidence/0012-clippy.log)、[lint](../evidence/0012-tooling-lint.log)。

## BH-0013 — P1 已確認：512-byte 前綴切在 Unicode 中間而 panic

- 定位：`crates/mastercss-language/src/document.rs:218–219`，`index.saturating_sub(512)` 未校正 UTF-8 char boundary 就切 str。
- 觸發：長行中 string 前含多位元組字元，使前綴起點落在字元中間；測試是 300 個 é 後接 `clsx("block")`。
- 預期：正常 document IR（或結構化輸入錯誤）；實際 Rust panic：byte 93 不在 char boundary，位於 bytes 92..94 的 é 中。
- 影響語言分析在有效 Unicode 文字上失敗；native/Wasm 下游的整個 host 是否終止尚未實測，不誇大為已證明 LSP process crash。
- 建議：以 char boundary 安全截取有界前綴；測 emoji/CJK/組合字元和邊界前後的長行。

## BH-0014 — P2 已確認：跳脫引號後 semantic ranges 偏移

- 定位：`crates/mastercss-language/src/session.rs:267` 使用解碼後 position.token 產生 raw document offsets；positions.rs 保留 raw/range 但未提供 decoded-to-raw mapping。
- 輸入 `clsx("content:\"x\":hover")`，預期 hover token 對應原始字串的 hover；實際位置往前偏移兩個 escape bytes。
- 最小測試比對公開 analyzeDocument 回傳 semantic ranges 與 JS UTF-16 indexOf；完整 actual ranges 留在 log。
- 影響 editor 高亮/semantic token 指向錯誤字元；class 本身 range 正確，不影響 CSS output。
- 建議：保存 unescape offset map 並映射 token subranges，或以 raw source 對齊語意片段；避免以 decoded 長度直接偏移 raw source。

## 結束

- 0012 完成；document version/cache 的 editor host 狀態由後續 language-service/server 批次處理。
- site/internal 其他工作改動持續增加（包含 guide/directives）；產品 Rust/TS hash 未改。前批行為仍有獨立實測證據，guide 行號需最終重新定位。
- 下一批 0013 validator/lint 的批次分類、重複 fix 與 policy；本批發現沿固定 ID 追蹤。
