# 0089 Language Unicode fixes and Nuxt completion

## Previous turn and scope

- Previous goal turn made product changes and verified five findings, so it was progress. On continuation, re-polled live Nuxt session91787 instead of restarting from unchanged logs.
- Fixed IDs retained; source base is commit5ec506c0b plus0088 corrections. Product fixes authorized by「執行並修正所有問題」. No dependency/lockfile/fixture changes or commits. Integration lab追加驗證 remains paused pending explicit user verification.

## BH-0013: fixed

- Reproduced the current Rust panic at byte93 insideé ([before](../evidence/0089-language-before.log)).
- `document.rs` advances the512-byte prefix start to the next UTF-8 boundary before slicing. Bound remains at most512bytes and preserves class context recognition.
- Extended original regression to16 CJK/emoji/accent/combining-mark/padding combinations, asserting one correct block position rather than merely no panic.

## BH-0014: fixed

- Added a Rust public-session regression, verified failure before correction ([before](../evidence/0089-semantic-before.log)).
- `positions.rs` maps decoded UTF-16 boundaries back through exactly the existing ordered escape replacements; `session.rs` remaps semantic ranges before encoding document tokens. Public IR and CSS generation unchanged; unescaped classes use the existing direct path.
- Four Rust scenarios cover escaped double/single quotes, emoji before/inside a class, and an unescaped control. Ranges remain inside the original class range.

## Language validation

- `cargo test -p mastercss-language`:12existing+2regressions PASS ([log](../evidence/0089-language-after.log)). `cargo clippy -p mastercss-language --all-targets --all-features -- -D warnings` PASS ([log](../evidence/0089-language-clippy.log)). Scoped rustfmt and whitespace checks PASS.
- `cargo xtask build-native` and `cargo xtask build-wasm tooling` PASS ([native](../evidence/0089-build-native.log), [Wasm](../evidence/0089-build-wasm-tooling.log)). Local ignored artifacts refreshed; no protocol/schema change or runtime Wasm rebuild.
- Compatibility-wrapped `pnpm --filter @master/css-tooling exec vitest run tests/language`:7files/22tests PASS, including explicit fresh native/Wasm regressions ([log](../evidence/0089-tooling-language.log)). Tooling lint PASS ([log](../evidence/0089-tooling-lint.log)).
- Compatibility-wrapped `pnpm --filter @master/css-language-service exec vitest run`:33files/373tests PASS ([log](../evidence/0089-language-service.log)). Language-service source unchanged.

## Nuxt BH-0023 / BH-0036: fixed at package scope

- Previous91787run advanced through the first class edit, then timed out at a remaining30-second theme readiness gate while six Nuxt virtual-module requests were pending. Preserved0088-settled-hmr log/state; no failed case counted passed.
- Unified class/theme/cold observations on the same bounded stable-readiness helper. Expected colors/display/runtime/native checks unchanged; no native CSS control or fixture substitution.
- Original runtime-mode HMR now passes all8stages: initial, three class edits, three theme edits, cold page; no page errors ([log](../evidence/0089-nuxt-hmr.log), [state](../evidence/0089-nuxt-hmr.json)). Reloads are recorded; no reload-free or latency contract claimed. Session49719terminal/copy cleaned.
- Original four production fixture modes plus progressive/theme regressions:6files/10tests PASS ([log](../evidence/0089-nuxt-production.log)). Only the isolated copy's setup timeout increased from120s to300s for startup; original assertions and fixture contents unchanged. Command prepares module then runs `vitest run --no-file-parallelism`. Session70575terminal/copy cleaned.
- 0088 module lint/build PASS remains applicable. Source publishes the progressive manifest asset and retains stylesheet compilation while Nuxt owns runtime/Nitro behavior. Nuxt example through rebuilt package distribution is the remaining downstream delivery follow-up; do not infer an external deployment.

## Next

- Continue original outstanding server findings and downstream Nuxt example delivery, then other unresolved findings, benchmarks and nested hosts. No global completion or ledger cleanup yet.
