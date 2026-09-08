# 0011 Scanner state and rescanning

- 目的：候選/validation/cache、累積/重設契約、來源變更、reset/dispose 非同步時序。
- 範圍：CRATE-mastercss-scanner、PKG-tooling scanner；source 問題沿用 0010。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；工作目錄沿用 0009 foreign site/internal changes；產品不改。
- 已讀 scanner Cargo、tooling AI、scanner/core.ts、Rust lib.rs、lifecycle/diff tests；下一步 baseline 與 API/cache parity tests。

## 結果

- 已讀 API/cache/rust-state-parity/adapters/manifest tests，以及 binding-session/native capability flow。
- `cargo test -p mastercss-scanner`：5 passed，exit 0。[log](../evidence/0011-rust-scanner.log)
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-tooling exec vitest run tests/scanner`：新增本批測試前 12 files / 72 passed，exit 0。[log](../evidence/0011-ts-scanner.log)
- 正常多檔、重複快取、blocklist、native CSS classification、source query/exclude、safelist/reset、pending init/dispose/latest reset 行為通過。
- 新增 `packages/tooling/tests/scanner/bug-hunt.test.ts`；以同命令指定該檔：1 pass / 1 fail。[log](../evidence/0011-scanner-regressions.log)
- `pnpm --filter @master/css-tooling lint`：exit 0。[log](../evidence/0011-tooling-lint.log)；0010 lint 亦 pass。

## BH-0012 — P2 已確認：scanModule 排除 .mjs

- 定位：`packages/tooling/src/scanner/core.ts:32` sourceLikeExtensions 包含 .js/.cjs/.mts，但缺少 .mjs；`scanModule` 先作 isModuleAllowed 判定。
- `scanModule('component.mjs', 'export const classes = "block"')` 預期產生 block CSS；實際 text 空字串。
- 預期依據：Rust source auto/Oxc 明確支援 .mjs，native ESM 是合法 JavaScript source 模組；同 scanner 的 JS 正常案例已通過。
- 影響使用 scanModule 的 build integrations，特別是只有 .mjs 來源的 class。
- 修正方向：補齊 source-like extension 與 Rust extraction 支援清單的契約，測帶 query .mjs 與非來源檔排除。

## 排除與限制

- CSS 累積直到 reset 為目前刻意的 scanner 契約；Rust cache test 明確在刪除字串後不宣稱 changed。本批新 control 驗證累積 → reset 清空 → 重掃，通過，不列 memory/刪除 bug。
- scanner 已刻意移除 file/watch lifecycle API；實際檔案刪除由 integration 重新掃描/reset 的責任，留其批次驗證。
- `collectCandidates` 會記錄 latent candidates，未證明後續 scan 同字串的承諾；保留 API 設計觀察，不列確認 bug。
- 0011 完成；後續 0012 language UTF-16/版本/語言 IR，再查 validator/lint。
