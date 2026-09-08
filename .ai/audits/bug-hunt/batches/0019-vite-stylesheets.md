# 0019 Vite stylesheet build and usage graph

- 目的：source usage→scanner→stylesheet composition→virtual CSS build/HMR、依賴錯誤恢復與 closeBundle。
- 範圍：PKG-vite，參與 tooling/scanner、compiler、internal；HTML/runtime injection 留 0020。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；foreign site/internal edits 保留。
- 已讀 package/AI、scanner/usage-graph、style-entry-vite-build helper、dev-hmr setup；新建 tmp fixture 都在 finally 清理，既有 snapshots 只比較。
- 下一步：選定 stylesheet/manifest/scanner suites，記錄 actual Vite CSS output 與 HMR hook 證據。

## 結果

- 已讀 style-entry、style-entry-build（placeholder splice/warn）、style-entry-hmr（reset/change queues）、usage-graph、scanner、register-style-source 與 compiler 下游。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-vite exec vitest run tests/core.test.ts tests/modes/scanner.test.ts tests/plugins/style-entry.test.ts tests/plugins/style-entry-build.test.ts tests/plugins/style-entry-vite-build.test.ts tests/plugins/style-entry-hmr.test.ts tests/plugins/local-compose.test.ts tests/plugins/manifest-loader.test.ts tests/plugins/manifest-virtual-module.test.ts tests/plugins/emitted-globals-virtual-module.test.ts`：10 files / 71 passed，exit 0。[log](../evidence/0019-tests.log)
- 其中 actual Vite build 斷言 CSS 資產：import order/base layers/generated utility、native compose、清除 slot；不是只看 build exit。
- 其餘包含 loader 失敗依賴保留、增量 virtual module/scanner reset/close 與 emittedGlobals 契約。
- 無新增確認問題；BH-0012 的 .mjs scanModule 根因由 UsageGraphPlugin 直接消費，未宣稱這批既有測試排除它。
- 0019 完成；PKG-vite 尚進行中，0020 驗證 HTML/runtime/pre-render/progressive 與 actual browser HMR。
