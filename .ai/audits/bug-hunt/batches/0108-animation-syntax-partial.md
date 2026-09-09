# 0108 Animation syntax implementation — BH-0001 partial, not fixed

- Current HEAD e71cce539 contains completed0104–0106 repairs and0107 investigation. Previous turn made progress by committing those authorized completed parts. This continuation preserves compiler0092 and foreign Site work; no new commit/push. Integration lab0038追加驗證 remains paused pending explicit identity confirmation.
- Continued the existing0108 worktree implementation after reading current engine/lexer sources and binding/resource contracts. Rust owns the behavior; no dependency, binding ABI, fixture/snapshot, lockfile or CI/release change. New lexical APIs use byte ranges and decoded CSS names; existing UTF-16 APIs remain unchanged.
- New lexer css_syntax module tokenizes comments/strings/escaped names and balanced component blocks, then walks statements with parent indices iteratively. New engine stylesheet_animation module distinguishes style declarations, custom-property values, grouping preludes and descriptor/keyframe blocks. session.rs reuses one lexical traversal for native definitions and animation declarations. stylesheet_resources.rs follows manifest variables only from animation values.
- This removes the0107 string/comment/name-decoding failures but the value parser is incomplete. It must not be accepted or committed as a completed repair: further checks below prove four new false negatives in this uncommitted implementation and one persistent false positive. BH-0001 retains its fixed ID and remains unresolved; no new finding ID or reduced completion criterion.

## Completed verification of this partial revision

| Check | Result / evidence |
|---|---|
| Original and0107 syntax regressions | Both original BH-0001 groups and all22 new syntax tests PASS. Prior0107 19FAIL is historical, not the current result |
| Full engine/lexer/render Rust suites | 91PASS/3FAIL before the final nine-case addition. The three failures are existing BH-0003 creation/deletion dependencies and BH-0002 var whitespace; [full log](../evidence/0108-rust-full.log) |
| Additional initial lexer/value controls | Lexer12library+3new lexical tests PASS, including2000nested groups and Unicode byte ranges. Render3new value/selector groups PASS; [lexer](../evidence/0108-lexer-tests.log), [render](../evidence/0108-expanded-render.log) |
| Native and engine Wasm | Both rebuilt;22cases have identical generated CSS and emittedGlobals.21valid cases also pass public compileRenderedStylesheet; malformed keyframes-without-block intentionally stays a raw renderer control; [driver](../repros/animation-resource-bindings.mjs), [final](../evidence/0108-binding-public-final.log) |
| Public host suites | CSS72, compiler127 and server67tests PASS; [CSS](../evidence/0108-css-full.log), [compiler](../evidence/0108-compiler-full.log), [server](../evidence/0108-server-full.log). Compiler verification includes preserved0092 partial work, not evidence that BH-0004 is fully repaired |
| Runtime | Rebuilt against new engine Wasm;273Chromium/Firefox/WebKit tests PASS; [build](../evidence/0108-runtime-build.log), [e2e](../evidence/0108-runtime-e2e.log) |
| Checks | Rust fmt, all-target/all-feature Clippy for engine/lexer/render, codegen --check and parity PASS. CSS/compiler/server/runtime lint and types PASS; [fmt](../evidence/0108-fmt-final.log), [Clippy](../evidence/0108-clippy-complete.log), [codegen](../evidence/0108-codegen.log), [parity](../evidence/0108-parity.log), [lint](../evidence/0108-host-lint.log), [types](../evidence/0108-host-types.log). Rust crates have no npm lint script; Clippy is their scoped check |

- Initial binding driver incorrectly expected emittedGlobals to contain only preexisting native definitions. Existing RenderSession tests explicitly include generated animations too. Corrected only the new driver expectation; retained the [initial failure](../evidence/0108-binding-public.log). This is test material, not a product finding. Initial Clippy collapsible-if failure was also corrected, without suppressing the lint.
- Engine Wasm increases from867094 to875687raw bytes, gzip9 from263432 to267935bytes (+4503). Runtime sidecar matches rebuilt engine Wasm; global.min.js and default-manifest.json hashes/bytes are unchanged. [Before](../evidence/0108-payload-before.json), [after](../evidence/0108-payload-after.json). No generated artifact is staged or committed.
- Standard Chromium runtime benchmark before/after commands completed with matching browser/config and all9workloads. Raw history remains only /tmp/mastercss-0108-runtime-{before,after}.{json,log}, not repository/commit. These are advisory local measurements; concurrent diagnostic activity and normal browser noise preclude a performance improvement claim. The standard runtime suite does not establish large-stylesheet parsing cost; dedicated resource-parser performance validation remains part of accepting the final implementation.

## Additional browser evidence prevents declaring completion

- Added9independent Rust tests in crates/mastercss-render/tests/bug_hunt_animation_value_slots.rs:4PASS/5FAIL ([log](../evidence/0108-value-slots.log)). The [browser driver](../repros/animation-value-browser.mjs) reads these exact macro cases, compares native/Wasm output, checks browser CSSOM/computed animationName, and verifies actual CSSAnimation objects after providing a long duration. No browser expected-value assertion fails; generated resources fail15of27controls across all three browsers ([final](../evidence/0108-animation-values-current.log)). Initial driver evidence is retained separately.
- A prior Wasm copy from /tmp/mastercss-0106-webpack-example/ce506cb841e14d90eb5b.wasm matches the0108-before SHA256 ad5ab3fbd5c61cc4edc515184e0955f2a086d6c730797616ffce27ff00b2f080. Running the same driver with BASELINE_WASM pointing there verifies actual previous behavior:18PASS/9FAIL ([old binary controls](../evidence/0108-animation-values-old-wasm.log)). It is an actual old-Wasm execution, not an inference from source or a rebuilt current binary.

| Value | Browser animation name | Current result | Old Wasm comparison |
|---|---|---|---|
| 1 infinite 1s | infinite | Missing keyframes | Previously emitted correctly; new partial-parser regression |
| .5 infinite 1s | infinite | Missing keyframes | Previously emitted correctly; new partial-parser regression |
| none backwards 1s | backwards | Missing keyframes | Previously emitted correctly; new partial-parser regression |
| var(--animation-easing) linear 1s, variable=linear | linear | Missing keyframes | Previously emitted correctly; new partial-parser regression |
| fade unexpected 1s | none; invalid declaration | Extra fade keyframes | Persistent old false positive |

- Current controls for bare timing keyword linear, repeated timing keyword, fallback expansion and quoted keyword name pass. Old Wasm additionally overemits the bare timing keyword and misses the quoted keyword name. Native/Wasm equality alone does not prove browser correctness: both new bindings share all five failures.

## Direct continuation

1. Keep BH-0001 partial. Fix the five proven value failures before treating the syntax implementation as acceptable. Introduce CSS numeric token structure in the existing lexer, then model shorthand slot precedence including numeric iteration and none-as-fill. Do not simply match known manifest names everywhere or special-case the five strings.
2. Resolve manifest variable values/modes in their surrounding animation token context: appending each variable value as a separate declaration loses occupied slots. Account for fallback/nesting/cycles, comma lists and CSS-wide keywords. Avoid unbounded Cartesian expansion or accepting multiple animation-name tokens in one shorthand item. Existing lexical traversal is not a full property grammar validator.
3. Extend the same Rust/browser corpus with negative numbers/exponents, animation-name versus shorthand, mixed lists and mode/nested variable cases. Re-run original22syntax cases and the nine new controls, then rebuild native/Wasm before binding/browser/downstream/runtime checks. Reassess payload and parser cost for the final implementation.
4. Continue BH-0002/0003 resources, BH-0004 external import conditions and all other unresolved findings and coverage requirements. Do not retry paused0038 validation. Existing four root-check failures, parallel Webpack harness failure, default.mjs inspection candidates, platform/benchmark/nested-host blockers are not completed.

- 44historical findings:28fixed/16unresolved;65checked/10blocked coverage unchanged. Goal remains active. Source hashes, file inventory and final checks are recorded with0108 evidence; other completed fixes and compiler/Site hashes preserved. All command/browser sessions are terminal at handoff; temporary browser pages are closed. Both new native and engine Wasm now match this partial implementation; compiler/tooling Wasm were not rebuilt in this batch.
