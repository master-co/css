# Testing Pack

Use when selecting validation or adding coverage. Start with the smallest test that proves the changed behavior; match local fixture conventions. Build/type-check when public types or package output change, and widen to affected consumers when their contracts are involved.

## Required Checks

- Run each changed workspace package's `lint` script if defined; report packages without one.
- Parser/compiler/renderer/runtime/scanner/language/ESLint behavior changes require focused tests. Use `.ai/testing-policy.md` for the change-type matrix and fixture rules.
- Tests-only tasks do not authorize implementation changes. Cover existing behavior or a known regression; update snapshots only for an intentional, explained output change.
- AI guidance structure changes require `pnpm run check:ai-context`; checker policy changes additionally require `pnpm run test:ai-context`.
- Documentation-only AI changes do not require product tests/builds. For site content or runnable examples, use `docs.md` and applicable local guidance.

## Scoped Commands

Read the affected manifest for available scripts. Common commands are:

```sh
pnpm --filter <package> test
pnpm --filter <package> lint
pnpm --filter <package> type-check
```

Runtime browser correctness uses `pnpm --filter @master/css-runtime e2e`. Rust, ABI, and parity checks are in [rust-routing.md](rust-routing.md); hot-path measurements are in [performance.md](performance.md). Root/CI command details live in `.ai/commands.md`.

## Completion

Fix failures introduced by the change and rerun affected checks. Once checks pass, repeat or broaden only for new changes, failures, or unresolved risks. Report commands, results, and pre-existing failures or blockers separately; never weaken correctness to pass.
