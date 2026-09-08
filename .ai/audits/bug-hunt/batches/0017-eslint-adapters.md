# 0017 ESLint adapters and configuration

- 目的：AST class nodes→Rust lint policy→ESLint reports/fixes；推薦 flat config 與重複 autofix/manifest cache。
- 範圍：PKG-eslint-plugin、PKG-eslint-config；Rust policy 沿 0013。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal edits 保留。
- 已讀兩包 package/AI、resolve-class-node/context、testers、recommended-autofix、config tests；fix:true 僅 lintText 返回結果、不執行寫檔。
- 下一步：baseline 後核對 React/Vue/Svelte/Angular/MDX raw/cooked range、invalid parser 與快取釋放。

## 結果

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/eslint-plugin-css --filter @master/eslint-config-css exec vitest run`：plugin 20 files / 231 passed；config 1 file / 4 passed，exit 0。[log](../evidence/0017-tests.log)
- 已讀 resolve-class-node、define visitors、resolve-context/with-context-release、recommended-autofix、manifest-settings/cache tests；AST ranges → raw tokenize → Rust lint → ESLint fixes。
- React/Vue/Svelte/Angular/MDX、stylesheet diagnostics、跨規則 fix 收斂、config ownership、manifest 變更/來源 cache/釋放的既有 tests 通過。
- 新 `packages/eslint-plugin/tests/bug-hunt.test.ts`：plain class control 通過，Unicode escape assertion 失敗；同 vitest 指令指定該檔 exit 1。[log](../evidence/0017-escaped-regression.log)
- plugin lint exit 0：[log](../evidence/0017-plugin-lint.log)。config 未加測試/未改程式。

## BH-0015 — P2 已確認：JavaScript Unicode escape 誤報 unknown class

- 定位：`packages/eslint-plugin/src/utils/resolve-class-node.ts:89` 把 raw literal 交 tokenizeClassList，value 已有 AST cooked 值卻未用於 token 語意與 mapping。
- `clsx("\u0062lock")` 在 JavaScript 的值是 block；plain block control 無診斷，escaped 版本在 disallowUnknownClass:true 下卻報 Unknown Master CSS class。
- 實際錯誤範圍 columns 7–17，診斷保留原始 escape；false error 會阻止 lint gate。
- 建議：依語言 literal 規則解碼並保存 decoded→raw offset mapping，避免只 unescape quote；同時驗證 Unicode/hex/backslash escapes 和 autofix 保留原始語法。
- 與 BH-0014 同屬 raw/cooked mapping 風險，但獨立 ESLint adapter 路徑，故另列 ID。

## 結束

- 0017 完成；無 tracked fixture 變更，未呼叫 ESLint.outputFixes。
- 下一批 0018 private integration kernel 的 virtual module/manifest dependency/HMR 契約。
