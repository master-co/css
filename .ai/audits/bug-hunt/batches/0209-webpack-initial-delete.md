# Batch 0209: Webpack initial deletion

Cause established: Watchpack 2.5.2 initial directory-scan race. A minimal dependency patch is validated in an owned disposable copy, but NOT installed or formally recorded in dependency configuration. Separate explicit user approval is pending. Goal stays active; counts remain 61 historical / 57 fixed / 4 unresolved and 65 checked / 10 blocked.

## Start checkpoint

In progress. All590sources/475artifacts match0208; prior goal turn made progress. Trace the delivered immediate-child deletion failure before unused ownership/concurrent-resource work. All23remainingrequirements, pendingexistingtestpatch and0038identitypause retained. No commits/shared builds.

## Trace and controlled reproduction

- The delivered product test still times out on the first child deletion. Hook traces show no filesystem undelayed/aggregated callback, no second watchRun and no second compilation. Registration already included the existing child. The loss occurs below the plugin's compilation/replay hooks.
- Read installed Webpack `NodeWatchFileSystem.js` and Watchpack `DirectoryWatcher.js`. The initial scan records names from readdir, then separately stats each name. If deletion occurs between those steps, setMissing has no old file entry to remove. Initial missing detection nevertheless excludes the name solely because it appeared in the stale readdir list.
- `repros/webpack-watch-initial-scan.mjs` reproduces this with PURE Webpack. In the owned process only, a graceful-fs lstat hook deletes the owned child exactly when Watchpack's first scan is about to stat it. The original watcher produces only the initial successful compilation and never reports missing CSS. No plugin is involved; dependency files are not modified. This establishes an upstream race, correcting the earlier tentative product/path-dependent classification.
- `repros/watchpack-initial-scan-removals.patch` only removes a name from initial missing detection if the completed scan still has that name in its actual file or directory map. One implementation file changes; no version upgrade or added dependency.

## Validation

| Check | Result |
|---|---|
| Delivered unpatched product hook trace | First-delete FAIL; no filesystem callback |
| Pure Webpack controlled readdir/lstat deletion | REPRODUCED missing error notification |
| Same pure control with isolated Watchpack patch | PASS; removed-file callback and missing-import compilation error |
| Patched pure initial scan without deletion | PASS; one successful compilation, no false missing notification |
| Actual delivered product with isolated Watchpack module substitution | 2 watch regression tests PASS |
| Patched normal / initially missing child / initially missing resource long sequences | 9 / 10 / 10 PASS |
| Webpack lint/type-check for diagnostic test changes | PASS |

The existing pure/no-op-loader controls from0208 did not force the particular initial-scan interleaving. They remain valid for their tested schedules but cannot rule out this race. The deterministic control explains why the real product could fail while shorter pure builds and isolated package builds passed.

The patched runs substitute only an owned Watchpack module export within that test process. Installed Watchpack2.5.2 remains untouched. All19 installed package files are hashed in `0209-watchpack-patch-state.json`; the disposable copy differs only at `lib/DirectoryWatcher.js`. This is patch validation, not delivery.

## Authorization and preservation

An asynchronous question asks whether to formally add the tested Watchpack patch, pnpm patchedDependencies configuration and corresponding lockfile entries, without other dependency changes. This is required because the user explicitly prohibited dependency/lockfile changes. No reply has arrived. Do not treat elapsed time, the LSP approval, or general goal continuation as approval for this dependency exception.

The older proposed Webpack `plugin-runtime.test.ts` contract patch also remains separately pending. Both patches are reviewable under `repros/`; root existing tests remain unchanged. No production source,475liveartifacts,installeddependency,package-managerconfiguration,lockfile,fixture,snapshot,CI/release,foreignSiteedit orhost was changed/restarted. No commit/push.

## Continuation

1. If explicit Watchpack approval arrives, record the patch reproducibly with pnpm and inspect the exact lockfile scope before validation; do not merely edit installed node_modules. Re-run the deterministic pure control, real first-delete tests and all29watch controls using the formally applied dependency. Cross-platform watcher matrices remain unfinished.
2. While approval is pending, continue independent work on modules leaving the active Webpack graph, unused CSS/resource publication and concurrent resource snapshots. Do not mark the first-delete requirement complete until formally delivered and verified.
3. Preserve all23inherited remaining requirements, BH-0004raw20qualified/39external, BH-0029/0051/0053, fullhosts/maps/platforms/benchmarks/Site/rootgates and0038identitypause.

```sh
node .ai/audits/bug-hunt/repros/webpack-watch-initial-scan.mjs
BH_WATCHPACK_PATCHED=OWNED_PATCHED_WATCHPACK_DIRECTORY node .ai/audits/bug-hunt/repros/webpack-watch-initial-scan.mjs
BH_WATCHPACK_PATCHED=OWNED_PATCHED_WATCHPACK_DIRECTORY node scripts/with-typescript-tooling-compat.mjs node node_modules/vitest/vitest.mjs run packages/webpack/tests/bug-hunt-static-watch-recovery.test.ts --fileParallelism=false
```

Checkpoint: `0209-final-checks.json`, `0209-source-hashes-final.json`, `0209-artifacts-final.json`. Patch location and19originaldependencyhashes: `0209-watchpack-patch-state.json`.
