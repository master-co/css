# 0032 Svelte addon transforms/installation

- Scope PKG-css-sv; sv host→AST transforms→Vite/layout/server hook setup. HEAD unchanged; README/coverage addon read.
- Read package/AI, src/index.ts/transforms.ts, transforms.test.ts, sv.testing.test.ts and global-setup. Existing tests use real sv add with local stub integration packages; do not count stubs as runtime integration evidence.
- Use isolated copy; replace fixed OS-temp TEST_DIR suffix only in disposable harness with unique process ID, avoiding other sessions. Installs happen only in sv temporary fixture workspace; repository lock/dependencies unchanged.
- Pending command and results.

- [Exact isolated command/log](../evidence/0032-tests.log): 2 files / 19 PASS, exit 0. Includes real sv add for Kit JS/TS variants, existing Vite plugins/server handle/sequence/styles, repeated add idempotence, unsupported non-Kit and six transform controls.
- sv test harness locally installs fixture dependencies and substitutes documented local integration stubs; proves installer/file edits, not Svelte runtime. Runtime host behavior belongs 0026/EX-svelte. No root lock/dependency/product changes; temporary test directory and isolated package removed.
- AST helpers preserve multi-line imports, unlike create BH-0021; hook ordering keeps Master first in sequence. No new finding. Completed.
