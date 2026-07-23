# Rust semantic parity

This directory freezes the user-visible engine and compiler behavior that Rust took
over from TypeScript.

- `rust-semantic-corpus.json` records exact CSS bytes and selected rule metadata from
  `ef1a7c851`, with `v2.0.0-rc.87` recorded as the public baseline.
- `rust-takeover-ledger.json` accounts for all 114 test declarations in the 11 engine
  test files removed by `7c59bed3f`. Every entry must point to an executable corpus
  case, a current focused test, or an approved parity exception.
- `../parity-exceptions.json` is the only exception registry. Do not add an exception
  or change frozen expected output without an old/new byte diff and user QA approval.

Run the gate with:

```sh
cargo xtask parity
```

The command executes every frozen engine/compiler case, verifies exact CSS and
selected Manifest v1 utility records, validates the ledger count and references, and
then validates approved exceptions. Native/Wasm wrapper parity remains useful, but it
does not replace this historical semantic oracle because both wrappers execute the
same Rust implementation.
