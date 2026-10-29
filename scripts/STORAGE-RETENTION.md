# Local storage retention

`bun run storage:preview` reports candidates without deleting them.
`bun run storage:prune` applies the checked-in policy. `bun run test:storage` runs filesystem safety regressions.

Maintenance runs before these existing commands (arguments and the original command remain intact):
`test`, `e2e`, `build`, `build:site`.
It runs locally on demand, not through a background schedule. Housekeeping errors are reported without hiding the original test/build exit code.

| Generated output                     | Expiry  | Size target |
| ------------------------------------ | ------- | ----------- |
| `.turbo/cache`                       | 7 days  | 5 GiB       |
| `test-results`                       | 14 days | 2 GiB       |
| `site/test-results`                  | 14 days | 2 GiB       |
| `site/playwright-report`             | 14 days | 0.5 GiB     |
| `packages/runtime/test-results`      | 14 days | 2 GiB       |
| `packages/runtime/playwright-report` | 14 days | 0.5 GiB     |

Expiry removes old candidates even if they are among the newest three. Size-based eviction otherwise keeps the newest three groups (two for isolated D1 state). Outputs modified in the last 24 hours are protected; Turbo cache has a one-hour grace period. These are soft size targets: in-use, recent or pinned data wins over the target, and excess is reported.

Only explicitly listed, Git-ignored, untracked outputs qualify. Nested Git repositories, symlinks, environment files, Blender/model/design source files, and directories containing `.keep`, `.retain` or `.storage-keep` are preserved. Put a `.keep` file in a run directory or in its configured output root to retain review baselines. Directory age uses the newest descendant modification time, not only the parent timestamp.

The tool checks process working directories and open files twice before removal. Live output files are retained. Shared Turbo cache is also preserved while another process is using its checkout/worktrees. No worktree, source tree, dependency installation, application database (only named test-output roots can contain removable fixture databases), release, backup or original asset directory is removed. Tracked files are checked again before deletion. A per-checkout Git-directory lock serializes cleaners; a stale lock after a killed cleaner is kept for manual inspection.

Automatic deletion requires successful `ps` and `lsof` inspection on macOS/Linux. Windows or unavailable/incomplete inspection retains all data and reports the limitation; it never disables or changes the test command. `test:storage` covers this fail-closed behavior; native Windows execution is not claimed. No production credentials or remote services are used.

Policies are checkout-local. Haoban's three existing worktrees receive the same limits. Commit these maintenance files and package scripts with the intended project changes so future checkouts inherit them. Old branches with independent configurations require the same maintenance update.

The utility has no third-party dependency. Its matching copies were installed together on 2026-10-20; keep filesystem safety fixes and tests synchronized if modifying it in several projects.

Read-only directories (including migration backups) preserve their containing run. Deletion errors preserve the remainder, record the error, and allow other eligible runs to finish; the cleaner never changes permissions or force-retries deletion.
