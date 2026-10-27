# AI Notes For `mastercss-lexer`

## Responsibility

Dependency-light tokenization for escapes, functions, variables, directives,
statements, at-rules, and class lists.

Read the domain file matching the syntax first; `lib.rs` is the public assembly point
and `tests.rs` locks cross-domain behavior. Keep parser ownership out of TypeScript.

`selector.rs` `selector_class_names()` returns only real class selectors, decoding
escapes and skipping attribute selectors and string contents.

`text.rs` (`concat_text!`, `decimal`) builds text without `core::fmt` for code that
engine sessions run per class; see the engine AI notes for when `format!` is allowed.

```sh
cargo test -p mastercss-lexer
cargo clippy -p mastercss-lexer --all-targets --all-features -- -D warnings
```
