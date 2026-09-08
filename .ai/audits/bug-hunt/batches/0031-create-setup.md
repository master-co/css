# 0031 Create setup plan/application

- Scope PKG-create. HEAD unchanged; README/coverage create read. package/AI, core.ts/transforms.ts/modes.ts and setup/setup-framework tests.
- Flow framework detection→mode plan→safe file edits→optional package manager. Tests use temporary projects and fake package-manager executables for command/exit effects, not real user projects.
- Check normal/unsupported/existing-config/idempotence/plan-only and failure paths. No product edits.

## Results and BH-0021 (P1, confirmed)

- Baseline `node scripts/with-typescript-tooling-compat.mjs pnpm --filter @master/create-css exec vitest run`: 2 files / 50 PASS, exit 0 ([log](../evidence/0031-tests.log)). Existing configs/hooks/framework modes, dry-run/no-install, unsupported inputs, stale plans, repeat apply and fake package-manager command behavior.
- New public plan/apply test `tests/bug-hunt-multiline-import.test.ts`: one-line import control PASS, multiline FAIL ([log](../evidence/0031-multiline.log)). Valid `import {\n defineConfig\n} from 'vite'` becomes `import {\nimport masterCSS ...` and has five parse diagnostics after installer writes it.
- Source `packages/create/src/transforms.ts:23-31`, addImport scans only lines beginning import and inserts after the first line of a multiline declaration. Impact installer corrupts existing config, preventing dev/build startup. Fix insert at complete import-declaration boundaries using an existing parser or safe insertion before imports; preserve directives/comments and test multiline/aliases.
- Parser harness first imported TypeScript 7 version-only public surface, so both cases failed before syntax checks. Switched to already installed typescript6 compiler API; only product multiline case fails. No dependency addition.
- create lint PASS; no production edits, only minimal test/ledger. Real registry installation not claimed (fake package-manager test). Completed.
