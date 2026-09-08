# 0063 Laravel Firefox/WebKit pages

- Scope unchanged0036 Laravel PHP/Inertia home CSS and login visibility on two other installed engines. Read current package/Vite/routes and0036 synthetic-env/browser harness. Existing source hashes match.
- [Repro](../repros/laravel-smoke.mjs) now supports explicitBH_BROWSER_MATRIX. Matrix mode builds once, preserves original synthetic testing key/in-memory DB/array sessions and disposable.env, skips unchanged27PHP tests already evidenced0036, and serves both browsers from one local PHP process. Default Chromium+PHP test behavior remains. No real credentials/database or user.env are loaded.
- Command:`BH_BROWSER_MATRIX=firefox,webkit python3 .ai/audits/bug-hunt/repros/isolated-package.py examples/laravel node /Users/aron/master/css/scripts/with-typescript-tooling-compat.mjs node /Users/aron/master/css/.ai/audits/bug-hunt/repros/laravel-smoke.mjs`.
- [Source hashes](../evidence/0063-source-hashes.json); both browsers PASS. No login submission or backend-auth coverage inferred from login visibility.

## Results

- [Log](../evidence/0063-laravel.log), [structured results](../evidence/0063-results.json):original client+SSR buildsPASS, Firefox155.0/WebKit26.6 eachHTTP200 home, Hello World heading48px, login buttonvisible, zero page errors. Whole command exits0 and isolated tree is removed.
- Existing0036 PHP27tests/64assertions remain separate prior evidence, not rerun or relabeled as this browser matrix. No real database, email, login credentials, deployed SSR worker or remote service coverage is claimed.
- No new finding;13blocked units unchanged. No package source/fixture edits; package lint contains--fix and remains unexecuted for this audit-only addition.

## End-of-batch reconciliation

- 0061–0063 together add18realFirefox/WebKit example controls. `pnpm run check:ai-context` PASS ([log](../evidence/0063-ai-context.log)); [final checks](../evidence/0063-final-checks.json):5849source entries, only superseded0044/0047 Site snapshots differ;36findings/62checked/13blocked, no missing links/budget violations.
- [Inventory](../evidence/0063-file-inventory.json) synchronized; foreign tracked diff onlysite/next.config.js, internal clean. Own example/browser/Next/Vite/PHP processes ended and all copied trees cleaned. No commit or product/fixture/dependency change.
