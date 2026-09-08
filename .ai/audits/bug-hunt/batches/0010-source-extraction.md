# 0010 Source extraction boundaries

- 目的：HTML/JS/TS/JSX/Vue/Svelte source 的 class/string/escape 與 UTF-16 ranges；動態片段與 directives 分界。
- 範圍：CRATE-mastercss-source、PKG-tooling（source 子範圍）；scanner 更新留給 0011。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9。
- 工作目錄：沿用 0009 外部 site/internal 變更；本批只加帳本與必要重現。
- 下一步：讀 source/tooling manifest、AI、data-flows，追蹤 source API 至 TypeScript binding 消費者；跑原有相關 tests。

## 已讀與資料流

- `crates/mastercss-source/src/lib.rs`：auto extension → HTML/Oxc/Astro/raw；AST string → candidate cleanup；HTML attributes → candidates。
- `packages/tooling/src/source/session.ts`、native.ts、adapters/{vue,svelte,oxc,optional-peer,types}.ts：native session/版本/disposal、framework parser → Rust candidates。
- source crate 沒有 AI.md；已讀 tooling AI/package、source Cargo、rust-routing/data-flows、既有 source tests。
- Source extraction IR 只含 source/candidates，沒有 ranges；UTF-16 range 檢查屬後續 language 批次。

## 驗證

- `cargo test -p mastercss-source`：8 passed，exit 0。[log](../evidence/0010-rust-source.log)
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-tooling exec vitest run tests/source`：新增測試前 3 files / 14 passed，exit 0。[log](../evidence/0010-ts-source.log)
- 覆蓋正常 HTML/JS/TS/JSX/Astro/Vue/Svelte、imports/directives 排除、query extensions、缺 optional peer fallback、session disposal。
- 新增 `packages/tooling/tests/source/bug-hunt.test.ts`，同指令改 `tests/source/bug-hunt.test.ts`：2 failed，exit 1。[log](../evidence/0010-extraction-regressions.log)
- tooling lint 結果見 [log](../evidence/0010-tooling-lint.log)；結束前確認。

## BH-0010 — P2 已確認：HTML class character references 漏解碼

- 定位：`crates/mastercss-source/src/lib.rs:263` 將 tokenizer 的原始 attribute value 直接交給候選提取。
- `<div class="block&#32;hidden"></div>` 預期 candidates 為 block/hidden（瀏覽器 classList 規則，0007 已實測）；實際只有 `block&#32;hidden`，下游 scanner 無法生成正確 CSS。
- 與 BH-0005 症狀相同但獨立的 Rust source extraction 根因；修正 SSR 不會修正 static scanner，故另列 ID。
- 建議在 Rust HTML attribute 提取邊界按 HTML 規則解碼，勿對 JavaScript/raw string 無差別解碼；測 named/numeric references 與空白。

## BH-0011 — P2 已確認：Svelte else 分支漏收

- 定位：`packages/tooling/src/source/adapters/svelte.ts:75` 只遍歷 children；Svelte AST 的 else 是獨立欄位。
- `{#if enabled}<div class="block"></div>{:else}<div class="hidden"></div>{/if}`，預期 block/hidden；實際只有 block。條件切到 else 時 static CSS 遺失。
- 測試使用實際已安裝 Svelte parser，非 mock；前一分支正常提取，排除 parser 載入/整份解析失敗。
- 修正方向：依 Svelte AST 完整遍歷 conditional/await/each 的各分支；測試 alternate 分支及巢狀結構，不以全檔 raw fallback 取代成功解析。

## 已排除與下一步

- 動態拼接無完整 class 無法推導，是既有靜態提取限制，不列 bug。
- 任意字串提取誤收候選尚需下游 validator 判斷，不能僅憑 candidates 有多餘字串斷言 CSS bug。
- 範圍外 scanner monotonic accumulation/collectCandidates 待 0011 核對契約。
- 0010 完成；下一批 0011 scanner cache/reset/source 更新。未窮舉所有 framework syntax 與 malformed fallback。
