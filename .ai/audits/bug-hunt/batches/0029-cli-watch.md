# 0029 CLI watch file creation

- Scope PKG-cli, tooling scanner, chokidar host. HEAD unchanged; README/coverage CLI and 0028 reviewed.
- Source generate.ts: startWatchers resolves current files and watches concrete paths; existing change/control and new sibling creation are the bounded behavior. Existing watch reset/CSS edit tests passed in 0028.
- Pending new test; no product changes. Cleanup must terminate only own process and remove own fixture.

## BH-0019 (P2, confirmed)

- `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/css-cli exec vitest run tests/bug-hunt-watch.test.ts`: 1 FAIL, exit 1 ([log](../evidence/0029-watch.log)).
- After ready, original index.html emits block; rewriting it to hidden emits hidden, proving watcher readiness. Creating new.html with flex is not scanned within 5 seconds; no new output event.
- Source `packages/cli/src/generate.ts:182-187`: only resolved existing file paths are watched. Its add handler cannot discover a new sibling outside watched concrete paths. Expected generate --watch observes new matching project sources. Impact new components/pages get no CSS until restart or manifest reload. Fix watch search roots/directories with glob filtering (chokidar v5 does not take globs), register additions and handle initially empty source sets.
- Test SIGTERM cleanup terminates only its child, then removes own temp; existing file control establishes no general host watcher failure. `pnpm --filter @master/css-cli lint`: PASS ([log](../evidence/0029-lint.log)).
- Default/native CLI coverage complete for listed commands; other OS watcher behavior untested. --binding selection observation remains a deferred inspection item, no confirmed impact claimed.
