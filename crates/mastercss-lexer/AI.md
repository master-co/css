# AI Notes For `mastercss-lexer`

## Responsibility

Dependency-light tokenization for escapes, functions, variables, directives,
statements, at-rules, and class lists.

Read the domain file matching the syntax first; `lib.rs` is the public assembly point
and `tests.rs` locks cross-domain behavior. Keep parser ownership out of TypeScript.

```sh
cargo test -p mastercss-lexer
cargo clippy -p mastercss-lexer --all-targets --all-features -- -D warnings
```
