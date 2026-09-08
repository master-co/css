# 0000 完整範圍盤點

- 目的：先建立完整清單與基準，尚不聲稱產品行為已檢查。
- 起始 commit：`e66ba7236e183046dfc071f190caa44ade0b95e9`。
- 工作目錄：主倉库及 internal 子模組乾淨；只新增本帳本。
- 已讀：AGENTS、context/index/package-routing/rust-routing/review/testing/accuracy-guardrails、data-flows/testing-policy/boundaries/review-checklist；root manifests；各單位 manifest census；engine 與 css manifest/AI、site manifest/AI；shared test config、source budget checker。
- 命令：`git status --short`、`git rev-parse HEAD`、`git -C internal status --short`、manifest glob census。全部成功；`rg` 不存在，改用 Python/git ls-files。
- 環境：Darwin arm64；Node v24.20.0、pnpm 12.3.4、cargo/rustc 1.98.1。node_modules、target、Wasm dist 已存在，但尚未確認 freshness。
- 完整 manifests：[evidence](../evidence/0000-manifests.json)。
- 75 單位已逐項登記 coverage；尚無已確認／待驗證／排除的產品問題。
- 風險：root test 僅 packages；site 多個 test:* 和 examples 需獨立跑。Laravel lint 含 --fix；preset build 重寫 source artifacts，不能直接執行。

## 巢狀 hosts（逐項由 owning batch 驗證）

- `packages/language-server/tests/fixtures/monorepo/c/package.json`
- `packages/language-server/tests/fixtures/monorepo/d/package.json`
- `packages/language-service/playground/package.json`
- `packages/language-service/playground/packages/c/package.json`
- `packages/language-service/playground/packages/d/package.json`
- `packages/next/e2e/css-manifest-query/package.json`
- `packages/next/e2e/static-export/package.json`
- `packages/next/playground/package.json`
- `packages/nuxt/playground/package.json`
- `packages/nuxt/tests/fixtures/pre-render/package.json`
- `packages/nuxt/tests/fixtures/progressive/package.json`
- `packages/nuxt/tests/fixtures/runtime/package.json`
- `packages/nuxt/tests/fixtures/static/package.json`
- `packages/runtime/playground/package.json`
- `packages/vite/playground/package.json`
- `packages/webpack/playground/package.json`

## 下一步

執行 check:ai-context，再開始 0001 engine session。各後续批次按需讀 local AI，不重新載入全部歷史。
