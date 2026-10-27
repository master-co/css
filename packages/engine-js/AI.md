# AI Notes For `@master/css-engine-js`

## Responsibility

The browser engine of the JS runtime engine plan: it executes compiled runtime programs (Rust still compiles manifests into them) with the semantics of the Rust `EngineSession`, returning JS objects. Zero dependencies; nothing here may import another package.

`@master/css-binding`'s browser entry (`engine-binding-browser.ts`) creates every browser engine session from it, reporting binding `'js'`, so bundler applications through `@master/css` and the runtime's CDN bundle run this engine. The package is repository-private: the shared tsdown config bundles it into its published consumers, like `@master/css-internal`, and published artifacts must not import it.

State: J4, the complete engine. `decodeProgram` (`src/program.ts`) decodes the binary program field for field as `crates/mastercss-engine/src/program.rs` does, returns `{ ok: false, error }` for malformed or unsupported input instead of throwing, and derives what Rust's `finish_program` does: built-in native utilities from `src/native-properties.ts` (generated from the Rust registry by `scripts/generate-native-properties.mjs`), default names and orders, static-first match order, custom media branches, and lookup indexes (static, key, token and function utilities, token prefixes bucketed by first character). Variables carry no order field; `variableOrder` is declaration order.

`createEngineSession` executes everything the Rust session does for browsers: ensure, delete, execution state, snapshot, keyframe definitions, emitted globals and refresh:

- `src/css-syntax.ts`: the CSS tokenizer and statement walker of `mastercss-lexer`.
- `src/class-syntax.ts`: native content, value, state and functional-class boundaries.
- `src/value.ts`: math normalization, `var()` references, inline theme tokens, `!important`, decimal opacity.
- `src/utility.ts`: static, key and token matching; token variables resolve on demand (an alias, then `namespace-key` per `~namespace`; invalid keys have none).
- `src/selector.ts`: selector templates (descendant `_`, nesting `&`), their structure check and state priority.
- `src/condition.ts`: native queries, layers, `@starting-style`, inline custom media and the range features that order conditional rules.
- `src/state.ts`: the state branches of a class, one per custom media path.
- `src/mixin.ts`: the static mixin subset: utility recipes, mixin calls with `@contents`, parameters, `ident()` and the argument checks.
- `src/generate.ts`: class rules from each utility's emitted rules (several for recipes), the native declaration fallback, and the composition rules `@apply` starts from.
- `src/apply.ts`: `@apply(--mixin)` classes, expanded into one atomic rule, and the class diagnostics that make one expand to nothing.
- `src/order.ts`: rule order in a layer. Rules sort by their own condition features; the reported ones write `-0` as `0`, as the Rust JSON does.
- `src/animation.ts`: keyframe references of declarations.
- `src/session.ts`: rules per layer with reference counts; theme variables, the theme rule and keyframes counted over the host's emitted globals; keyframes rule mutations; rebuilds for emitted globals and refresh.

Ranges are UTF-16 offsets where Rust has UTF-8 ones, and `src/text.ts` keeps Rust's string semantics (code point order, Unicode White_Space trimming, ASCII-only case folding, lone surrogates as U+FFFD).

## Gates

- `pnpm --filter @master/css-engine-js verify:program` re-encodes each decoded program in the Rust layout and requires the Rust bytes back, compares names, counts and keyframes with the manifest and the Rust session, and requires truncated and bit-flipped programs to be accepted or rejected exactly as the Rust engine does.
- `pnpm --filter @master/css-engine-js differential` runs the Rust engine (full Wasm, Node entry of `@master/css-binding-wasm-engine`) and this engine on the same program and classes and writes `.reports/differential.{md,json}`. Classes come from `parity/v2-language-corpus.json`, Rust engine and compiler string literals, site and examples markup, every token key of every token utility, seeded grammar, value, noise, state and condition, recipe and `@apply` fuzz (`--fuzz`, `--seed`), and manifests with inline, static and host-emitted variables and composed custom media. `scripts/recipe-sources.mts` compiles a manifest of mixins, recipes and keyframes from CSS with the Rust compiler (`@master/css-binding-wasm-compiler` artifacts), adds keyframes in native containers, and drives sessions through emitted globals and refreshes, including invalid programs. Any difference is a bug in this engine; Rust output is the reference.
- Rebuild the Rust Wasm (`cargo xtask build-wasm`) after `crates/` changes, or the differential compares against stale engine and compiler artifacts.
- `pnpm --filter @master/css-engine-js check:size` checks the minified engine (≤ 30 KB br) and the CDN default page total, the global bundle that inlines it plus the default program (≤ 55 KB br). `--report` prints without failing.
- `pnpm --filter @master/css-engine-js bench:baseline [--rc87 <dist>] [--wasm <runtime package dir>]` compares the current runtime in a browser with the rc.87 JS runtime and a runtime built with the Wasm engine.
