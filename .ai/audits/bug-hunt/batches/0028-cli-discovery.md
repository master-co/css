# 0028 Node/native CLI source discovery

- Scope PKG-cli, CRATE-mastercss-cli; CLI args→project discovery→scanner/engine→stdout/files/exit.
- HEAD unchanged; README/coverage CLI rows read; Rust routing, root/CLI Cargo manifests (no crate AI.md), Node package/AI, core.ts/generate.ts, native main.rs and command/watch tests.
- Baseline command tests create only temporary files. Native CLI intentionally only scan transport; lint/inspect/watch owned Node host. .mjs default discovery omission suspected in both constants; explicit path control planned.
- Outside this batch: watch uses concrete initial file list; new-file handling next batch. --binding option appears unused; requires separate verification before bug status.

## Validation and BH-0018 (P2, confirmed)

- Node existing command/watch tests: 4 files / 25 PASS, exit 0 ([log](../evidence/0028-node-tests.log)); native `cargo test -p mastercss-cli`: 2 PASS, exit 0 ([log](../evidence/0028-rust-tests.log)). Native build artifact was created from unchanged source in 0006.
- `node .ai/audits/bug-hunt/repros/BH-0018-cli-mjs.mjs`: exit 1 ([log](../evidence/0028-mjs.log)). Eight real CLI invocations; all exit 0 and honor --no-export. Both hosts discover .js normally; explicit entry.mjs generates `.block{display:block}`; default .mjs discovery silently outputs no block CSS.
- Sources: `packages/cli/src/generate.ts:12` DEFAULT_SOURCE_PATTERNS; `crates/mastercss-cli/src/main.rs:27` SOURCE_EXTENSIONS and resolve_source_files at 226. Missing .mjs contradicts same public CLI's explicit supported .mjs path. Impact: default scans of native ESM modules omit CSS. Fix shared discovery parity list incl .mjs and tests for default/glob/explicit paths. Separate from BH-0012 scanModule fast-path exclusion; this uses scan() and has independent discovery constants.
- Minimal repro creates and removes own temp dirs, no product changes. Node lint/inspect error exit, invalid manifest diagnostics, fix dry-run/write isolated temp, no-export tested in baseline. Watch new-file behavior next.
