# 0004 Class syntax and manifest boundary corpus

- 目的：從 lexer/schema 輸入邊界至 engine 的 selector/value/condition/layer CSS 契約。
- 範圍：CRATE-mastercss-lexer、CRATE-mastercss-schema、CRATE-mastercss-engine、PKG-schema、PKG-preset、PKG-css。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；產品無變更。
- 前批：0001 session、0002 native resources、0003 static dependencies；5 個新 regression failures 已確認，不混作原有 baseline 失敗。
- 下一步：讀 lexer/schema context、追蹤 tokenizer/position 與 schema validation；執行 scoped corpus 和 preset artifact 契約測試（不 generate）。

## 已讀與資料流

- lexer Cargo/AI、class_list/variables/tests：UTF-16 token ranges、active var references、identity transform、malformed directive recovery。
- schema Cargo/AI、manifest/tests 與 npm schema AI/manifest tests：v1 validation、拒絕 legacy shape、未知欄位保留、script-safe hydration JSON。
- engine state/render 與 syntax corpus：selectors/conditions/priority、layers、aliases、native capability boundary；0001 Rust/TS parity 為配對證據。
- preset default-manifest/rust-preset/design-tokens tests：source compile → manifest/native CSS artifact equality → token namespace/utility matching → CSS。

## 命令與結果

- `cargo test -p mastercss-lexer -p mastercss-schema`：lexer 12、schema 3 passed。[log](../evidence/0004-rust-baseline.log)
- 新增 `crates/mastercss-lexer/tests/bug_hunt_boundaries.rs`：36 個 Unicode/whitespace class-list 組合的 UTF-16 round trip；10 個 malformed/string/comment input 的 identity transform、directive range bounds；2 tests passed。[log](../evidence/0004-lexer-boundaries.log)
- `cargo clippy -p mastercss-lexer --test bug_hunt_boundaries -- -D warnings`：exit 0。[log](../evidence/0004-clippy.log)
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-preset --filter @master/css-schema exec vitest run`：preset 26、schema 3 passed。[log](../evidence/0004-preset-schema-tests.log)
- 不執行 preset generate；source artifacts 未改。原有測試沒有失敗。

## 結論與限制

- 本批未確認新 bug；UTF-16 slicing、identity transformation、manifest codec、preset corpus 與 artifact 一致性通過。
- 可共用 lexer collect_css_variable_references 處理 BH-0002 的 ASCII whitespace；其 comment-between-var-and-name 仍需修正時另驗，不宣稱現有 helper 已支援所有 CSS。
- 6 個單位的列明最低檢查完成：lexer/schema crates、engine crate、css/schema/preset packages；engine 已確認問題保留。尚未窮舉任意自訂 manifest 與所有語法組合。
- 下一批 0005：compiler/project import graph、merge/diagnostics lifecycle。
