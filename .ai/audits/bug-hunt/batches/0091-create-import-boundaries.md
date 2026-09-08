# 0091 Installer import boundaries

## BH-0021 fixed

- Current public plan/apply regression reproduced multiline corruption (1FAIL/1PASS) before edits ([log](../evidence/0091-create-before.log)).
- `addImport` no longer treats an import's opening line as a whole declaration. It only skips complete unambiguous leading imports; otherwise inserts before the incomplete declaration. Headers/prologues use a legal module-level import at EOF, preserving shebangs, directives and comments without adding a parser dependency. Existing common single-line import ordering remains covered by exact-output tests.
- A following `with`/`assert` clause or intervening comment is not mistaken for an independent statement. CRLF inserted lines preserve the existing line-ending convention.
- Expanded public temporary-project tests cover multiline/default/newline imports, multiline import attributes with comments, shebang, use-client prologue, license header, CRLF and repeat-plan/apply stability. All inputs parse before mutation; outputs parse after mutation. No real install command runs.

## Validation

- Compatibility-wrapped `pnpm --filter @master/create-css exec vitest run`:3files/58tests PASS ([log](../evidence/0091-create-tests.log)).
- Package lint and build PASS ([lint](../evidence/0091-create-lint.log), [build](../evidence/0091-create-build.log)). Test scratch directories cleaned; no fixture, dependency, lockfile, release or commit changes.
- Source and test whitespace checks PASS. No changes to Master CSS semantic or rendering behavior.

## Handoff

- 44historical confirmed findings:13fixed,31unresolved. Goalactive; cleanup deferred until all requested work completes. Continue remaining P1/core/runtime/integration/benchmark findings using current sources and original tests. Integration lab追加驗證 stillrequires explicit user identity confirmation.
