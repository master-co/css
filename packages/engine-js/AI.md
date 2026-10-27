# AI Notes For `@master/css-engine-js`

## Responsibility

The browser engine of the JS runtime engine plan: it executes compiled runtime programs (Rust still compiles manifests into them) with the semantics of the Rust `EngineSession`, returning JS objects. Zero dependencies; nothing here may import another package.

State: J2. `decodeProgram` (`src/program.ts`) decodes the binary program field for field as `crates/mastercss-engine/src/program.rs` does, returns `{ ok: false, error }` for malformed or unsupported input instead of throwing, and derives what Rust's `finish_program` does: built-in native utilities from `src/native-properties.ts` (generated from the Rust registry by `scripts/generate-native-properties.mjs`), default names and orders, static-first match order, custom media branches, and lookup indexes (static, key, token and function utilities, token prefixes bucketed by first character). Variables carry no order field; `variableOrder` is declaration order.

`createEngineSession` executes ensure, delete, execution state, snapshot and keyframe definitions for classes without selector states or conditions:

- `src/css-syntax.ts`: the CSS tokenizer and statement walker of `mastercss-lexer`.
- `src/class-syntax.ts`: native content, value, state and functional-class boundaries.
- `src/value.ts`: math normalization, `var()` references, inline theme tokens, `!important`, decimal opacity.
- `src/utility.ts`: static, key and token matching; token variables resolve on demand (an alias, then `namespace-key` per `~namespace`; invalid keys have none).
- `src/generate.ts`: class rules and the native declaration fallback.
- `src/order.ts`: rule order in a layer.
- `src/animation.ts`: keyframe references of declarations.
- `src/session.ts`: rules per layer with reference counts, theme variables and the theme rule.

Ranges are UTF-16 offsets where Rust has UTF-8 ones, and `src/text.ts` keeps Rust's string semantics (code point order, Unicode White_Space trimming, ASCII-only case folding, lone surrogates as U+FFFD).

What a later phase implements throws `PendingFeatureError` (`src/pending.ts`) before changing state: selector states and conditions (J3); recipe and function utilities, `@apply`, keyframe resources, emitted globals and refresh (J4).

## Gates

- `pnpm --filter @master/css-engine-js verify:program` re-encodes each decoded program in the Rust layout and requires the Rust bytes back, compares names, counts and keyframes with the manifest and the Rust session, and requires truncated and bit-flipped programs to be accepted or rejected exactly as the Rust engine does.
- `pnpm --filter @master/css-engine-js differential` runs the Rust engine (full Wasm, Node entry of `@master/css-binding-wasm-engine`) and this engine on the same program and classes and writes `.reports/differential.{md,json}`. Classes come from `parity/v2-language-corpus.json`, Rust engine and compiler string literals, site and examples markup, every token key of every token utility, seeded grammar, value and noise fuzz (`--fuzz`, `--seed`), and theme manifests with inline, static and host-emitted variables. Any difference is a bug in this engine; Rust output is the reference. Inputs the JS engine reports pending are skipped on both engines and counted by feature.
- Rebuild the Rust Wasm (`cargo xtask build-wasm`) after `crates/` changes, or the differential compares against stale artifacts.
- `pnpm --filter @master/css-engine-js check:size` checks the minified engine (≤ 30 KB br) and the CDN default page total (≤ 55 KB br). `--report` prints without failing.
- `pnpm --filter @master/css-engine-js bench:baseline --rc87 <dist>` compares the rc.87 JS runtime and the current runtime in a browser.
