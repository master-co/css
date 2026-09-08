# 0001 Engine session transitions

- 目的：驗證 ensure/delete/refresh/dispose 的狀態、索引及 snapshot 一致性。
- 範圍：CRATE-mastercss-engine、PKG-css（Rust 語意及 TS host）。
- 起始 commit：`e66ba7236e183046dfc071f190caa44ade0b95e9`。工作目錄只含本調查帳本；相關產品檔案無變更。
- 已讀：crates/mastercss-engine Cargo.toml/AI、packages/css package.json/AI，session.rs、render.rs、state.rs、tests.rs、tests/lifecycle.rs、bound-engine.ts；schema engine IR。
- 資料流：ensure/delete → rule/resource count → ordered mutation IR → snapshot；refresh → rebuild → replay connected classes；BoundEngine 凍結回傳結果。
- 驗證進行中；下一步執行 baseline 與獨立 transition replay 測試。

## 已完成驗證

- `cargo test -p mastercss-engine`：exit 0，36 tests passed（新增測試前的基準）。[log](../evidence/0001-engine-baseline.log)
- 新增 `crates/mastercss-engine/tests/bug_hunt_lifecycle.rs`：獨立 mutation index/key replay mirror、256 次 deterministic ensure/delete/refresh，以及 invalid refresh transaction/disposal。執行中。
- 尚未確認 bug；refresh 保留當前有效 connected classes，未知 class 不留存為既有 contract，不能直接據此報 bug。

## 結果與交接

- 新增 2 tests 全過（256 operations）；[replay log](../evidence/0001-transition-replay.log)。mutation key/index、順序、snapshot、fresh engine 等價及最終資源清理通過。
- fresh native/runtime-Wasm builds 成功；未修改 tracked artifacts。[native](../evidence/0001-native-build.log)、[Wasm](../evidence/0001-wasm-build.log)。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css exec vitest run`：4 files / 72 tests passed；[log](../evidence/0001-css-tests.log)。
- `cargo clippy -p mastercss-engine --test bug_hunt_lifecycle -- -D warnings`：exit 0；[log](../evidence/0001-clippy.log)。新增 Rust tests，沒有 npm package 檔案修改。
- 已排除：所測序列未見重複 ensure、delete index、refresh transaction 或 disposal 問題；不涵蓋所有 manifest/resource 邊界。
- 範圍外待辦 BH-0001：stylesheet_resources 直接搜尋 @keyframes，疑似把註解/字串當成 host keyframe。交給 0002，尚未確認。
- 本批完成，engine/css 的其餘語意仍待後批檢查。
