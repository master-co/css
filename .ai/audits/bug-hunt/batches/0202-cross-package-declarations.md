# Batch 0202: Cross-package declaration candidates

## Scope and current status

Previous goal turn made progress:0201 binding repair delivered, ledger and full progress report complete.554sources/458artifacts match0201. Fresh default-output builds confirm the three remaining declaration candidates. User explicitly authorized both reviewed patches; config and7LSP return type annotations applied anddeclaration artifacts delivered. All previous requirements and0038 identity pause remain incomplete.

## BH-0061 — fixed after scope expansion

Reuse BH-0061 for the shared declaration closure defect; do not create duplicate IDs. Binding remains fixed and its0201 evidence stays valid. The same relative-dependency externalization leaves language-server `core`/`settings` and MCP `server` declaration modules absent. Tooling emits directory references as `./lint.js` and `./options.js` although the files live under directory `index` paths. Every fresh build succeeds, while the isolated strict consumer fails. This is a product packaging defect, not merely stale artifacts.

The candidate extends the binding-only DTS rule to these three packages, allowing declaration bundling to resolve local files and directory paths. Runtime entrypoints and all other package rules stay unchanged. LSP declaration generation additionally reveals inferred imports of the undeclared transitive `vscode-languageserver-protocol` package. Seven explicit return types imported from the already-declared `vscode-languageserver/node` surface prevent that leak without adding dependencies.

## Reproduction and reviewed evidence

- [Portable driver](../repros/package-declaration-builds.py): `python3 .ai/audits/bug-hunt/repros/package-declaration-builds.py /tmp/new-output-directory [isolated-config-file]`. Reuses installed dependencies, copies source/manifests, builds default `dist` in owned temporary workspaces, checks copied public packages with strict TS6 and no workspace aliases. No root builds or install.
- [Baseline](../evidence/0202-baseline-results.json): all3 builds exit0; all3 consumers exit2. Errors exactly identify the original local missing declaration imports.
- [Initial config candidate](../evidence/0202-candidate-results.json): tooling/MCP types pass; LSP reveals7 protocol imports and one dependency on the still-old root tooling declaration. This is not a script false positive: both are real closure requirements exposed by the repaired LSP declarations.
- [Reviewed candidate](../evidence/0202-reviewed-checks.json): explicit LSP return types plus copied candidate tooling, including the language-service dependency path, give17 exported type surfaces PASS; expected-error type controls ensure key APIs are not `any`. No dependency installed or manifest edited.
- [Lint/runtime](../evidence/0202-reviewed-lint-runtime.json): config and LSP source lint PASS;16 library imports PASS. The side-effecting LSP server entry is type-checked but not started. JavaScript equality:tooling56, language-server7, MCP21, total84; no runtime additions or changes.
- LSP source type-check PASS (`0202-reviewed-lsp-source-types-corrected.log`). Initial TS2688 was the disposable tsconfig missing explicit node typeRoots; original failing log retained. Source return annotations are checked against actual method implementations.
- Reviewed patches: [DTS rule](../repros/cross-package-declaration-bundle.patch), [LSP return types](../repros/language-server-declaration-types.patch). Full candidate artifact hashes in `0202-reviewed-artifacts.json` and temporary paths in reviewed evidence.

## Preservation and handoff

554 prior source hashes unchanged; inventory557 with3 new repro/patch materials.458 live artifact hashes unchanged. No foreign hosts stopped/restarted, dependencies/lockfiles/fixtures/snapshots/CI/release edited, commit or push. These preservation observations describe the pre-approval checkpoint; subsequentauthorizeddelivery is recorded below.

User approval requested because AGENTS.md prohibits build-flow changes without explicit request and0201 authorization covered only binding. The user subsequently answered「授權這兩份修正」; bothpatches were applied, validated anddelivered as describedbelow. Independent raw/graph/host/watch/root-gate work remains available.

Finalcounts:61historical/57fixed/4unresolved (BH-0004,0029,0051,0053);65checked/10blocked. BH-0061 expanded scope is now repaired; binding was not regressed. Full retained requirements and directly resumable next steps are in [final checks](../evidence/0202-final-checks.json). Goal active;0038 additional verification still awaits explicit identity confirmation.

## Authorized application and final delivery

- Root config and7LSP return annotations match reviewed patches. Three fresh approved builds PASS. LSP pre-delivery consumer correctly still detects the old live tooling directory import; after all3declaration deliveries all17strict external entrypoints andpositive/expected-error controls PASS.
- Package lints all3PASS, config ESLint PASS, LSP package type-check PASS. Tooling223testsPASS; MCP43PASS. LSP38PASS/1FAIL. Untouchedpre0202core withcopiedoriginalsuite also38PASS/1sameFAIL: invalid-manifest expected `manifest-loading-error`, received `compose-quoted-syntax`. Thisexistingfailure requires contract investigation; tests/fixtures were not edited.
- Fresh isolated JS relocates private internal-module paths relative to different source roots, even in the unchangedbaseline. To honor type-only delivery, completedistcopiesretainall84liveJSbytes andreplaceonlydeclarations fromfreshbuilds. Thosecompletecopies passed17strictentrypoints and16libraryimports beforeatomicpromotion. Nootherpackage/native/Wasm artifact changed.
- [Promotion and backups](../evidence/0202-promotion.json); [delivered types](../evidence/0202-delivered-types.json); [fullcurrentlocaldeclarationclosure](../evidence/0202-delivered-closure.json) reports0affectedpackages. This scan does not prove arbitrary consumer/compiler versions or fullreleaseinstallation.
- Finalsource/artifact inventories andremainingrequirements are in0202-final-checks.json. No commit/push. Nextinvestigate theexistingLSPdiagnostic mismatch withoutchangingexistingexpectations, whilecontinuingallremaininggraph/host/watch/gate/benchmark/Site work. Goalactive;0038identitypause unchanged.
