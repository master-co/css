# 0037 ESLint example diagnostics and fix stability

- HEAD e66ba7236e183046dfc071f190caa44ade0b95e9 unchanged; 0036 handoff/coverage read. Scope EX-eslint, EX-eslint-legacy. Package manifests, configs, validation/order/collision/clsx source read; owning plugin/config covered0017.
- Expected intentional invalid classes produce diagnostics. Run actual installed ESLint config, then fix only in memory and re-lint fixed output. No --fix writes, no package/fixture changes. Pending results.

## Results

- `node scripts/with-typescript-tooling-compat.mjs node .ai/audits/bug-hunt/repros/eslint-examples.mjs`: exit1 before lint due modern example `index.css:61` using `$color-gray-100`. [Log](../evidence/0037-eslint-examples.log). BH-0028 P2 confirmed example configuration failure: expected source class diagnostics, actual project compiler rejects stylesheet at rule loading. Fix author CSS as `var(--color-gray-100)`; no semantic fallback. Error is consistent with compiler contract; not an engine bug. Modern example diagnostics/fixes blocked until config corrected.
- Same command with trailing `eslint-legacy`: exit0 ([log](../evidence/0037-eslint-legacy.log)). Existing validation.html accepted (empty value is not proof of invalidity); in-memory duplicate `block block` yields two warnings, fixes to single block, second fix unchanged. Fatal errors0, no filesystem writes. Initial harness assumed existing fixture must error; removed unsupported assumption after reading actual rules/results.
- No added package tests or product edits. Runtime policy/every grammar handled owning package0017; scope complete with modern example blocked.
