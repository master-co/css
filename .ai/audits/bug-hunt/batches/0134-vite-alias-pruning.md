# 0134 Vite alias pruning and remaining host inputs

- Previous goal turn made progress:0133 completed file resolver integration,218compiler/110Vite and36host browser controls. Rechecked all133 source/preservation hashes against current files before this batch. HEAD remains `ef7887f76`; no commit/push.0038 additional verification remains paused without explicit identity confirmation.
- Scope: prove native CSS ownership when an alias/custom resolver points to project files, fix the discovered regression, and establish actual virtual/Sass input failures for direct continuation. These failures remain part of unfinished BH-0004, not completed coverage.

## Reproduction and fix

- The0133 async graph walker inferred package ownership from a non-relative import name. `@theme/paint.css`, regex aliases and `custom-paint` therefore marked local project files as package CSS. Collection composition exempts package files from project native pruning, so unused `.unused{color:red}` leaked into output.
- The new actual Vite [driver](../repros/vite-host-inputs.mjs) initially renders only `.example`, then changes its class to `unused` after navigation. Project-native CSS must be pruned, so the late color must remain black; package CSS and explicit `@preserve native` controls must become red. This proves observable behavior rather than matching generated text alone.
- The Node host now resolves the original name's package root and checks that the actual resolved file belongs to it, canonicalizing filesystem paths for symlinks. A bare alias/custom name alone no longer grants package ownership. Import/browser export conditions can still select another file within the genuine package. Existing Node fallback and inherited nested-package ownership remain.
- A new focused host test covers local aliases, package alternate export files and overriding an installed package name to a project file. No new public types, Rust semantics, dependencies or generated protocol changes. Compiler/Vite README and formal Site contract explain the verified ownership rule.

## Evidence

| Check | Result |
|---|---|
| Initial10actual Vite builds |9builds succeeded/1Sass build failed |
| Initial54browser comparisons |18PASS/36FAIL;18alias-pruning failures and18virtual/Sass failures |
| After fix, same10builds |9succeeded/1Sass failure remains |
| After fix, same54browser comparisons |36PASS/18FAIL; all6pruning/preservation cases PASS |
| Prior0133 resolver corpus |6builds/36browser PASS |
| Existing package/resource corpus |3builds/18browser PASS |
| Focused compiler host tests |6PASS |
| Complete compiler suite |219PASS across26files |
| Complete Vite suite |110PASS across19files |
| Compiler lint/types/build and Vite lint |PASS |
| Site prepare/lint |PASS;0errors/75warnings |

- [Before](../evidence/0134-host-inputs-before.log), [after](../evidence/0134-host-inputs-after.log):6pruning/preservation cases ×3browsers ×screen/print =36PASS after the fix. The other4cases remain unresolved. Logs exit1 intentionally because remaining actual failures are retained, not waived. No expected-failure conversion or fixture/snapshot rewriting.
- [Resolver36](../evidence/0134-host-resolution-control.log) retains string/regex aliases, custom filesystem resolution, independent import/browser package conditions and transitive native-compose entry behavior. [Resources18](../evidence/0134-resource-control.log) retains nested package native rules and package/ordinary/managed resource URLs. No source rebuild overlapped these consumers.
- [Focused6](../evidence/0134-host-tests.log), [compiler219](../evidence/0134-compiler-tests.log), [Vite110](../evidence/0134-vite-tests.log), [compiler lint](../evidence/0134-compiler-lint.log), [types](../evidence/0134-compiler-types.log), [build](../evidence/0134-compiler-build.log), [Vite lint](../evidence/0134-vite-lint.log), [Site preparation](../evidence/0134-site-prepare-final.log), [Site lint](../evidence/0134-site-lint.log).

## Remaining input failures and next implementation

1. **Virtual CSS imported by a managed file:** `@import "virtual:paint.css"` remains uncompiled; the custom plugin's `load` hook is never called. All6browser controls stay black instead of blue. `getBuildImportResolver` returns only absolute `.css` files, and the compiler walker reads only filesystem contents. Extend the existing async host capability to supply resolved module source and its resource/dependency ownership; retain external imports as external.
2. **Virtual CSS imported directly from JS:** the custom `load` hook does run, but both Master stylesheet transforms skip null-prefixed IDs. Its `@compose` produces no blue rule;6browser controls fail. Managed virtual IDs need classification/registration and complete graph publication without pretending they are real files or losing original diagnostics.
3. **Sass entry:** a real `.scss` entry with a variable and `@master entry` fails with `CSS_PARSE_ERROR: Invalid empty selector`. Graph registration bypasses the prior async stylesheet preprocessor and sends Sass text to Rust's CSS parser. The fixture reuses already-installed Sass1.104.0 via a temporary symlink; no repository dependency modification, no missing-Sass blocker. Add actual preprocessing before dependency analysis/compilation and preserve Vite options and dependency watching.
4. **Sass imported by managed CSS:** `./styles/paint.scss` remains a browser import into the output asset directory and returns404;6browser controls fail. Imported inputs need host resolution/loading/preprocessing too. Vite8.2.2 exports `preprocessCSS`; inspecting its installed implementation shows it invokes the whole CSS compilation pipeline, not only Sass, so blindly applying it could flatten imports before Rust graph compilation. Inspect that interaction and retain graph conditions/resources before selecting the host integration.
5. Then verify `@reference` and resource aliases, local-compose project manifest/emitted globals, scoped source policy, multiple managed entries/repeated slots/anonymous layers and build watch/HMR. Migrate Webpack until the existing3build/12browser failures pass; legacy single-string corpus remains21PASS/39FAIL. Rejection or unsupported-host documentation does not complete BH-0004.

## Gates and preservation

- Five compiled artifact hashes and raw/gzip/brotli sizes match0133; no Rust/ABI/runtime changes. No runtime benchmark or Rust/codegen/parity rebuild was repeated. Package-root checks add build-time filesystem resolution; no performance improvement is claimed.
- Root API/golden gates were not rerun because public exports/types are unchanged; their last0133failures remain open. Runtime-size-baseline and migration-history gates remain unfinished. Earlier Vite cache39 and Vite/Webpack16build/78browser evidence remain scoped to0133 and were not rerun here.
- Four historical ledger suffixes were moved verbatim into `*-history-0134.md` to keep current files bounded. [Exact text hashes](../evidence/0134-ledger-history.json) verify preservation;75coverage rows and45finding IDs stay in the primary files. No ledger was recreated and no existing progress was discarded.
- Final hashes, inventory, AI budgets and terminal job states are recorded separately. Preserve foreign Site configuration/agent files, existing fixtures/snapshots, dependencies, lockfiles and CI/release.
- Counts remain45historical findings:33fixed/12unresolved;75coverage units:65checked/10blocked;4root gates/4unclassified candidates.0038 verification still awaits explicit identity confirmation. The goal remains active.
