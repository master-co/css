# 0015 LSP workspace lifecycle

- 目的：workspace selection/init、文件更新/close、manifest reload/error diagnostics、LSP handlers/disposal。
- 範圍：PKG-language-server；tooling/service 沿前批證據。
- 起始 commit：e66ba7236e183046dfc071f190caa44ade0b95e9；site/internal foreign changes 保留。
- 已讀 package/AI、core.ts、tests/runtime/setup；確認 fixtures 是否隔離再跑 tests。
- 下一步：既有 tests baseline，核對 init/restart/dispose 與 pending async 時序。

## 結果

- fixture setup 只讀現有 fixture；需要 broken package 的測試用 tmpdir，finally rm；未改 tracked fixtures。
- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-language-server exec vitest run`：8 files / 39 passed，exit 0。[log](../evidence/0015-tests.log)
- 核對 core init/findClosestWorkspace、ensureWorkspaceLanguageService 的 pending map 與 close/dispose 後清理、onDidOpen/change/close、settings/save 的 restart request、diagnostics source mapping。
- 覆蓋 monorepo/custom workspace、URI/Windows path 模擬、workspace manifest/bundled fallback、失敗 manifest diagnostics、UTF-16 SFC range、LSP formatting/tokens 與 connection disposal。
- 未新增確認 bug；產品未改故無新增 package lint 要求。本批是 in-process 真實 LSP transport tests；打包後子程序由 VS Code 批次檢查。
- pending initWorkspaceFolder 完成後仍可能寫 workspaces 是閱讀觀察；尚無可見功能/資源影響證據，不列已確認問題。
- 0015 完成；下一批 0016 VS Code build/staging/stdio 與 host lifecycle 可測範圍。
