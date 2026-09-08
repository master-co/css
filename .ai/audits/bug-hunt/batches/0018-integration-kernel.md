# 0018 Integration kernel protocols

- 目的：browser/node package boundary、virtual manifest/style/emittedGlobals/bootstrap、dependency/HMR/error 契約。
- 範圍：PKG-internal；不同於 root internal 子模組。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal edits 保留。
- 已讀 package/AI、manifest-loader/manifest-virtual-module；下一步 module/browser-safe/node tests 與產生 module 的執行證據。

## 結果

- 已讀 runtime-bootstrap（start generation/HMR dispose）、manifest-facade、node paths/hash、workspace helpers（LSP/ESLint 前批下游已驗證）。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-internal exec vitest run`：新增測試前 3 files / 15 passed，exit 0。[log](../evidence/0018-tests.log)
- generated modules 實際 import、有效/無效 JSON/failed fetch、query/Unicode virtual path、placeholder 更新、Node/browser source boundary 通過；不是所有 browser host 的替代證據。
- 新 `packages/internal/tests/bug-hunt.test.ts`：manifest load 中途失敗後仍留 watch dependency，HotUpdate invalidate，修復再載入且 fs.allow 不重複；1 passed。[log](../evidence/0018-recovery.log)
- package lint exit 0：[log](../evidence/0018-lint.log)；AI context check exit 0，2296 files 合規。[log](../evidence/0018-context-check.log)
- facade 的 Function-based JSON loader 與 BH-0008 相關，但本批未擴張其已確認影響範圍；現有測試刻意保持非 SyntaxError 不 fallback。實際 CSP 跨整合場景未另外重現。
- 無新增確認問題，0018 完成；下一批 0019 Vite stylesheet/scanner 使用圖、build/HMR；HTML runtime/pre-render 留 0020。
